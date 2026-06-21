import { sql } from '@/lib/db'
import crypto from 'crypto'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const dynamic = 'force-dynamic'

export async function POST(req, { params }) {
  try {
    const { token } = params
    const { sourceId, supplies, amount } = await req.json()
    const chargeAmount = amount || 5390

    // Look up signup by token
    const rows = await sql`SELECT * FROM signups WHERE token = ${token}`
    if (rows.length === 0) {
      return Response.json({ error: 'Invalid checkout link.' }, { status: 404 })
    }

    const signup = rows[0]

    // Check max 3 orders
    if (signup.order_count >= 3) {
      return Response.json({ error: 'You have reached the maximum of 3 orders on this link.' }, { status: 403 })
    }

    // Check review required before order 2 and 3
    if (signup.order_count >= 1 && !signup.review_submitted) {
      return Response.json({ error: 'REVIEW_REQUIRED', message: 'Please submit your review before placing your next order.' }, { status: 403 })
    }

    // Check 1 order per month
    if (signup.last_order_date) {
      const lastOrder = new Date(signup.last_order_date)
      const now = new Date()
      const sameMonth = lastOrder.getMonth() === now.getMonth() && lastOrder.getFullYear() === now.getFullYear()
      if (sameMonth) {
        return Response.json({ error: 'You have already placed an order this month.' }, { status: 403 })
      }
    }

    // Truncate fields to Square's 45 char limit
    const suppliesLabel = supplies === 'single' ? '+Single' : supplies === 'monthly' ? '+Monthly' : ''
    const note = `OI-${signup.booster}${suppliesLabel}-${signup.name}`.slice(0, 45)
    const addr1 = (signup.bill_address || signup.ship_address || '').slice(0, 45)
    const locality = (signup.bill_city || signup.ship_city || '').slice(0, 45)
    const state = (signup.bill_state || signup.ship_state || '').slice(0, 2)
    const postal = (signup.bill_zip || signup.ship_zip || '').slice(0, 10)
    const shipAddr1 = (signup.ship_address || '').slice(0, 45)
    const shipAddr2 = (signup.ship_address2 || '').slice(0, 45)
    const shipCity = (signup.ship_city || '').slice(0, 45)
    const shipState = (signup.ship_state || '').slice(0, 2)
    const shipZip = (signup.ship_zip || '').slice(0, 10)

    // Charge via Square
    const squareRes = await fetch('https://connect.squareup.com/v2/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-01-18',
      },
      body: JSON.stringify({
        source_id: sourceId,
        idempotency_key: crypto.randomUUID(),
        amount_money: { amount: chargeAmount, currency: 'USD' },
        buyer_email_address: signup.email,
        billing_address: {
          address_line_1: addr1,
          locality,
          administrative_district_level_1: state,
          postal_code: postal,
          country: 'US',
        },
        shipping_address: {
          address_line_1: shipAddr1,
          address_line_2: shipAddr2,
          locality: shipCity,
          administrative_district_level_1: shipState,
          postal_code: shipZip,
          country: 'US',
        },
        note,
        location_id: 'LQA2D2J5740ZV',
      }),
    })

    const squareData = await squareRes.json()
    console.log('Square response:', JSON.stringify(squareData, null, 2))

    if (!squareRes.ok || squareData.errors) {
      const msg = squareData.errors?.[0]?.detail || 'Payment failed.'
      const code = squareData.errors?.[0]?.code || 'UNKNOWN'
      return Response.json({ error: `${code}: ${msg}` }, { status: 400 })
    }

    // Update order count, set paid, set last order date, require review for next order
    const newOrderCount = (signup.order_count || 0) + 1
    await sql`
      UPDATE signups SET
        paid = true,
        checked_out = true,
        order_count = ${newOrderCount},
        last_order_date = NOW(),
        review_required = ${newOrderCount < 3},
        review_submitted = false
      WHERE token = ${token}
    `

    // Send customer confirmation email with private link
    const checkoutLink = `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/${token}`
    await resend.emails.send({
      from: 'OI Body Chemistry <noreply@orishainfinity.com>',
      to: signup.email,
      subject: 'Order Confirmed ✳️ — Your Private Link Inside',
      html: `
        <div style="font-family:'Georgia',serif;max-width:560px;margin:0 auto;background:#050505;color:#F3ECE5;padding:48px 32px;border-radius:12px;">
          <p style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#C8A88A;margin-bottom:8px;">OI Body Chemistry</p>
          <h1 style="font-size:32px;font-weight:700;margin-bottom:8px;color:#F3ECE5;">Order Confirmed! ✳️</h1>
          <p style="font-size:15px;color:#E8DDD2;line-height:1.7;margin-bottom:24px;">
            Congratulations ${signup.name}! Your order has been placed and will ship soon.
          </p>
          <div style="background:#161412;border:1px solid rgba(200,168,138,0.3);border-radius:10px;padding:24px;margin-bottom:24px;">
            <p style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#C8A88A;margin-bottom:6px;">Order Summary</p>
            <p style="font-size:18px;font-weight:600;color:#D8C3B3;margin-bottom:4px;">${signup.booster}™</p>
            <p style="font-size:13px;color:#E8DDD2;opacity:0.7;">Amount Paid: $${(chargeAmount/100).toFixed(2)}</p>
            <p style="font-size:13px;color:#E8DDD2;opacity:0.7;">Order ${newOrderCount} of 3</p>
          </div>
          <div style="background:#161412;border:1px solid rgba(200,168,138,0.3);border-radius:10px;padding:24px;margin-bottom:24px;">
            <p style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#C8A88A;margin-bottom:6px;">Shipping To</p>
            <p style="font-size:14px;color:#E8DDD2;line-height:1.8;">${signup.ship_address}${signup.ship_address2 ? ', ' + signup.ship_address2 : ''}<br/>${signup.ship_city}, ${signup.ship_state} ${signup.ship_zip}</p>
          </div>
          <p style="font-size:14px;color:#E8DDD2;line-height:1.7;margin-bottom:20px;">
            Your private link is below. Use it to place your next order when you are ready. Keep it safe — it is exclusive to you.
          </p>
          <a href="${checkoutLink}" style="display:block;background:#C8A88A;color:#050505;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;text-align:center;padding:18px;border-radius:8px;text-decoration:none;margin-bottom:24px;">
            My Private OI Link →
          </a>
          <p style="font-size:11px;color:#E8DDD2;opacity:0.5;line-height:1.6;">
            Questions? Reply to this email or visit orishainfinity.com
          </p>
          <div style="border-top:1px solid rgba(200,168,138,0.2);margin-top:32px;padding-top:20px;">
            <p style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#C8A88A;opacity:0.6;">
              © 2026 OI Body Chemistry · Orisha Infinity · Frisco, TX
            </p>
          </div>
        </div>
      `
    })

    // Send owner notification email
    await resend.emails.send({
      from: 'OI Body Chemistry <noreply@orishainfinity.com>',
      to: 'orishainfinity@gmail.com',
      subject: `New Order — ${signup.name} — ${signup.booster}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#050505;color:#F3ECE5;border-radius:12px;">
          <h2 style="color:#C8A88A;margin-bottom:20px;">New Order Received ✳️</h2>
          <table style="width:100%;font-size:14px;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#B99678;">Name</td><td style="padding:8px 0;">${signup.name}</td></tr>
            <tr><td style="padding:8px 0;color:#B99678;">Email</td><td style="padding:8px 0;">${signup.email}</td></tr>
            <tr><td style="padding:8px 0;color:#B99678;">Phone</td><td style="padding:8px 0;">${signup.phone}</td></tr>
            <tr><td style="padding:8px 0;color:#B99678;">Booster</td><td style="padding:8px 0;">${signup.booster}</td></tr>
            <tr><td style="padding:8px 0;color:#B99678;">Supplies</td><td style="padding:8px 0;">${supplies || 'None'}</td></tr>
            <tr><td style="padding:8px 0;color:#B99678;">Order #</td><td style="padding:8px 0;">${newOrderCount} of 3</td></tr>
            <tr><td style="padding:8px 0;color:#B99678;">Amount</td><td style="padding:8px 0;color:#D8C3B3;font-weight:bold;">$${(chargeAmount/100).toFixed(2)}</td></tr>
            <tr><td style="padding:8px 0;color:#B99678;">Ship To</td><td style="padding:8px 0;">${signup.ship_address}${signup.ship_address2 ? ', ' + signup.ship_address2 : ''}, ${signup.ship_city}, ${signup.ship_state} ${signup.ship_zip}</td></tr>
          </table>
        </div>
      `
    })

    return Response.json({ success: true, orderCount: newOrderCount })

  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}