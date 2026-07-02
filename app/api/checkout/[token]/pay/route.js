// app/api/checkout/[token]/pay/route.js
// Square field length fixes:
//   - idempotency_key  → max 45 chars (we use 40 to be safe)
//   - note             → max 45 chars (Square Order/Payment note limit)
//   - referenceId      → max 40 chars

import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { Resend } from 'resend'

const sql = neon(process.env.DATABASE_URL)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request, { params }) {
  const { token } = params

  try {
    const body = await request.json()
    const { sourceId, supplies, amount, dose, note,
            ship_address, ship_address2, ship_city, ship_state, ship_zip,
            bill_address, bill_city, bill_state, bill_zip } = body

    // --- Fetch signup record ---
    const rows = await sql`SELECT * FROM signups WHERE token = ${token} LIMIT 1`
    if (!rows.length) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    const signup = rows[0]

    // --- Guard: max 3 orders ---
    if (signup.order_count >= 3) {
      return NextResponse.json({ error: 'Maximum orders reached' }, { status: 410 })
    }

    // --- Guard: 1 order per month ---
    if (signup.last_order_date) {
      const last = new Date(signup.last_order_date)
      const now  = new Date()
      const diffDays = (now - last) / (1000 * 60 * 60 * 24)
      if (diffDays < 28) {
        return NextResponse.json({ error: 'Only one order per month is allowed.' }, { status: 429 })
      }
    }

    // --- Guard: review required ---
    if (signup.review_required && !signup.review_submitted) {
      return NextResponse.json({ error: 'Please submit your review before ordering again.' }, { status: 403 })
    }

    // --- Build Square note (hard cap at 45 chars) ---
    const rawNote = note || `OI Body Chemistry - ${signup.booster} - ${signup.name}`
    const safeNote = rawNote.substring(0, 45)

    // --- Build idempotency key (hard cap at 40 chars) ---
    const idempotencyKey = token.substring(0, 32) + `-${signup.order_count + 1}`

    // --- Charge via Square ---
    const squareEnv = process.env.SQUARE_ENV === 'production'
      ? 'https://connect.squareup.com'
      : 'https://connect.squareupsandbox.com'

    const squareRes = await fetch(`${squareEnv}/v2/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
        'Square-Version': '2024-01-18',
      },
      body: JSON.stringify({
        idempotency_key: idempotencyKey,
        source_id: sourceId,
        amount_money: {
          amount,
          currency: 'USD',
        },
        location_id: process.env.SQUARE_LOCATION_ID,
        note: safeNote,
        reference_id: `oi-${token.substring(0, 20)}`,
      }),
    })

    const squareData = await squareRes.json()

    if (!squareRes.ok || squareData.errors) {
      const errMsg = squareData.errors?.[0]?.detail || 'Payment failed.'
      console.error('Square payment error:', JSON.stringify(squareData.errors))
      return NextResponse.json({ error: errMsg }, { status: 400 })
    }

    // --- Update DB ---
    const newOrderCount = signup.order_count + 1
    const isFirstOrder  = signup.order_count === 0

    // On first order: generate private_token, set review_required for next order
    if (isFirstOrder) {
      const { randomUUID } = await import('crypto')
      const privateToken = randomUUID().replace(/-/g, '').substring(0, 32)

      await sql`
        UPDATE signups SET
          order_count     = ${newOrderCount},
          last_order_date = NOW(),
          paid            = true,
          checked_out     = true,
          private_token   = ${privateToken},
          review_required = true,
          review_submitted = false
          ${ship_address ? sql`, ship_address = ${ship_address}` : sql``}
          ${ship_city    ? sql`, ship_city    = ${ship_city}`    : sql``}
          ${ship_state   ? sql`, ship_state   = ${ship_state}`   : sql``}
          ${ship_zip     ? sql`, ship_zip     = ${ship_zip}`     : sql``}
        WHERE token = ${token}
      `

      // Send private link email
      const privateLink = `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/${privateToken}`
      await resend.emails.send({
        from:    'OI Body Chemistry <orders@oibodychemistry.com>',
        to:      signup.email,
        subject: 'Your OI Body Chemistry Private Order Link',
        html: `
          <p>Hi ${signup.name},</p>
          <p>Your first order is confirmed! 🎉</p>
          <p>When you are ready for your next order, use your private link below:</p>
          <p><a href="${privateLink}">${privateLink}</a></p>
          <p>This link is personal to you — please do not share it.</p>
          <p>— OI Body Chemistry Team</p>
        `,
      })

      // Owner notification
      await resend.emails.send({
        from:    'OI Body Chemistry <orders@oibodychemistry.com>',
        to:      'orishainfinity@gmail.com',
        subject: `New Order #1 — ${signup.name}`,
        html: `
          <p><strong>New Order Placed</strong></p>
          <p>Name: ${signup.name}</p>
          <p>Email: ${signup.email}</p>
          <p>Phone: ${signup.phone}</p>
          <p>Booster: ${signup.booster}</p>
          <p>Supplies: ${supplies}</p>
          <p>Amount: $${(amount / 100).toFixed(2)}</p>
          <p>Ship to: ${ship_address}, ${ship_city}, ${ship_state} ${ship_zip}</p>
          <p>Order: 1 of 3</p>
        `,
      })

      return NextResponse.json({ success: true })
    }

    // Returning order (order 2 or 3)
    await sql`
      UPDATE signups SET
        order_count      = ${newOrderCount},
        last_order_date  = NOW(),
        review_required  = ${newOrderCount < 3},
        review_submitted = false
        ${ship_address ? sql`, ship_address = ${ship_address}` : sql``}
        ${ship_city    ? sql`, ship_city    = ${ship_city}`    : sql``}
        ${ship_state   ? sql`, ship_state   = ${ship_state}`   : sql``}
        ${ship_zip     ? sql`, ship_zip     = ${ship_zip}`     : sql``}
      WHERE token = ${token}
    `

    // Order confirmation email
    await resend.emails.send({
      from:    'OI Body Chemistry <orders@oibodychemistry.com>',
      to:      signup.email,
      subject: `Order ${newOrderCount} Confirmed — OI Body Chemistry`,
      html: `
        <p>Hi ${signup.name},</p>
        <p>Your Order ${newOrderCount} of 3 is confirmed! 🎉</p>
        <p>Booster: ${signup.booster}${dose ? ` — ${dose}` : ''}</p>
        <p>Amount: $${(amount / 100).toFixed(2)}</p>
        <p>Your order will ship soon. We'll be in touch!</p>
        <p>— OI Body Chemistry Team</p>
      `,
    })

    // Owner notification
    await resend.emails.send({
      from:    'OI Body Chemistry <orders@oibodychemistry.com>',
      to:      'orishainfinity@gmail.com',
      subject: `Order #${newOrderCount} — ${signup.name}`,
      html: `
        <p><strong>Returning Order</strong></p>
        <p>Name: ${signup.name}</p>
        <p>Email: ${signup.email}</p>
        <p>Booster: ${signup.booster}${dose ? ` — ${dose}` : ''}</p>
        <p>Supplies: ${supplies}</p>
        <p>Amount: $${(amount / 100).toFixed(2)}</p>
        <p>Ship to: ${ship_address || signup.ship_address}, ${ship_city || signup.ship_city}, ${ship_state || signup.ship_state} ${ship_zip || signup.ship_zip}</p>
        <p>Order: ${newOrderCount} of 3</p>
      `,
    })

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Pay route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}