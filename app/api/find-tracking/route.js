// app/api/find-tracking/route.js
//
// PUBLIC route — customer-facing "Get My Tracking Update" button.
// Requires first name + last name + email to match an order on file
// (tighter check than Find My Link, since tracking is more sensitive).
//
// Always returns a generic message so this can't be used to check
// who is or isn't a customer.

import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { Resend } from 'resend'

const sql = neon(process.env.DATABASE_URL)
const resend = new Resend(process.env.RESEND_API_KEY)

const TRACKING_URLS = {
  USPS: (n) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}`,
  UPS: (n) => `https://www.ups.com/track?tracknum=${n}`,
  FEDEX: (n) => `https://www.fedex.com/fedextrack/?trknbr=${n}`,
}

const GENERIC_MESSAGE = "If we found a matching order, we've sent your tracking info (or a note that it hasn't shipped yet) — check your inbox in a few minutes."

export async function POST(request) {
  try {
    const body = await request.json()
    const firstName = (body.firstName || '').trim().toLowerCase()
    const lastName = (body.lastName || '').trim().toLowerCase()
    const email = (body.email || '').trim().toLowerCase()

    if (!firstName || !lastName || !email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'First name, last name, and a valid email are all required.' },
        { status: 400 }
      )
    }

    const fullName = `${firstName} ${lastName}`

    const rows = await sql`
      SELECT * FROM signups
      WHERE LOWER(email) = ${email} AND LOWER(name) = ${fullName}
      LIMIT 1
    `

    if (rows.length) {
      const signup = rows[0]

      if (signup.tracking_number) {
        const carrier = signup.tracking_carrier || 'USPS'
        const trackingUrlFn = TRACKING_URLS[carrier]
        const trackingLink = trackingUrlFn ? trackingUrlFn(signup.tracking_number) : null

        await resend.emails.send({
          from: 'OI Body Chemistry <orders@oibodychemistry.com>',
          to: signup.email,
          subject: 'Your OI Body Chemistry Tracking Info',
          html: `
            <p>Hi ${signup.name},</p>
            <p><strong>Carrier:</strong> ${carrier}</p>
            <p><strong>Tracking Number:</strong> ${signup.tracking_number}</p>
            ${trackingLink ? `<p><a href="${trackingLink}">Track your package here</a></p>` : ''}
            <p>— OI Body Chemistry Team</p>
          `,
        })
      } else {
        await resend.emails.send({
          from: 'OI Body Chemistry <orders@oibodychemistry.com>',
          to: signup.email,
          subject: 'Your OI Body Chemistry Order Status',
          html: `
            <p>Hi ${signup.name},</p>
            <p>Your order hasn't shipped yet — as soon as it does, we'll send tracking info to this email automatically.</p>
            <p>— OI Body Chemistry Team</p>
          `,
        })
      }
    }

    return NextResponse.json({ success: true, message: GENERIC_MESSAGE })
  } catch (err) {
    console.error('Find-tracking error:', err)
    return NextResponse.json({ success: true, message: GENERIC_MESSAGE })
  }
}