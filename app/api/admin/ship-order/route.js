// app/api/admin/ship-order/route.js
//
// Marks a customer's most recent order as shipped and emails them the tracking number.
// The shipping address is already on file from checkout — you do NOT re-enter it.
// You only provide: the customer's email, a carrier, and a tracking number.
//
// Usage (from anywhere — Postman, curl, a browser fetch, etc.):
//
// POST /api/admin/ship-order
// Headers: { "Content-Type": "application/json" }
// Body:
// {
//   "secret": "<ADMIN_SECRET from your Vercel env vars>",
//   "email": "customer@email.com",
//   "carrier": "USPS",
//   "trackingNumber": "9400111899223197428019"
// }

import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { Resend } from 'resend'

const TRACKING_URLS = {
  USPS: (n) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}`,
  UPS: (n) => `https://www.ups.com/track?tracknum=${n}`,
  FEDEX: (n) => `https://www.fedex.com/fedextrack/?trknbr=${n}`,
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { secret, email, carrier, trackingNumber } = body

    if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!email || !carrier || !trackingNumber) {
      return NextResponse.json(
        { error: 'email, carrier, and trackingNumber are all required.' },
        { status: 400 }
      )
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL is not set in your environment variables.' }, { status: 500 })
    }
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY is not set in your environment variables.' }, { status: 500 })
    }

    const sql = neon(process.env.DATABASE_URL)
    const resend = new Resend(process.env.RESEND_API_KEY)

    const normalizedCarrier = carrier.toUpperCase().trim()

    const rows = await sql`
      SELECT * FROM signups WHERE email = ${email} LIMIT 1
    `
    if (!rows.length) {
      return NextResponse.json({ error: 'No customer found with that email.' }, { status: 404 })
    }
    const signup = rows[0]

    await sql`
      UPDATE signups SET
        tracking_number = ${trackingNumber},
        tracking_carrier = ${normalizedCarrier},
        shipped_at = NOW()
      WHERE email = ${email}
    `

    const trackingUrlFn = TRACKING_URLS[normalizedCarrier]
    const trackingLink = trackingUrlFn ? trackingUrlFn(trackingNumber) : null

    let emailResult
    try {
      emailResult = await resend.emails.send({
        from: 'OI Body Chemistry <orders@oibodychemistry.com>',
        to: signup.email,
        subject: `Your Order ${signup.order_count || ''} Has Shipped! 📦`,
        html: `
          <p>Hi ${signup.name},</p>
          <p>Great news — your order is on its way!</p>
          <p><strong>Carrier:</strong> ${normalizedCarrier}</p>
          <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
          ${trackingLink ? `<p><a href="${trackingLink}">Track your package here</a></p>` : ''}
          <p><strong>Shipping to:</strong><br/>
          ${signup.ship_address}${signup.ship_address2 ? `, ${signup.ship_address2}` : ''}<br/>
          ${signup.ship_city}, ${signup.ship_state} ${signup.ship_zip}</p>
          <p>— OI Body Chemistry Team</p>
        `,
      })
    } catch (emailErr) {
      console.error('Resend send error:', emailErr)
      return NextResponse.json({ error: `Database updated, but the email failed to send: ${emailErr.message || emailErr}` }, { status: 500 })
    }

    if (emailResult?.error) {
      console.error('Resend API returned error:', emailResult.error)
      return NextResponse.json({ error: `Database updated, but the email failed to send: ${emailResult.error.message || JSON.stringify(emailResult.error)}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Tracking email sent to ${signup.email}`,
      shippedTo: {
        address: signup.ship_address,
        address2: signup.ship_address2,
        city: signup.ship_city,
        state: signup.ship_state,
        zip: signup.ship_zip,
      },
    })
  } catch (err) {
    console.error('Ship-order error:', err)
    return NextResponse.json({ error: `Internal server error: ${err.message || err}` }, { status: 500 })
  }
}