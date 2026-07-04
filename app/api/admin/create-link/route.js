// app/api/admin/create-link/route.js
//
// For customers who placed an order OUTSIDE the funnel (manual payment,
// Venmo/CashApp/in-person/etc.) and have NO record in the system yet.
// Creates their signup record with order_count = 1 (their manual order
// already counts as order #1) and generates their private checkout link
// for order #2 onward. Optionally emails it to them immediately.

import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { Resend } from 'resend'
import crypto from 'crypto'

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      secret, name, email, phone, booster,
      shipAddress, shipAddress2, shipCity, shipState, shipZip,
      sendEmail,
    } = body

    if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!name || !email || !shipAddress || !shipCity || !shipState || !shipZip) {
      return NextResponse.json(
        { error: 'Name, email, and full shipping address are required.' },
        { status: 400 }
      )
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL is not set.' }, { status: 500 })
    }

    const sql = neon(process.env.DATABASE_URL)
    const normalizedEmail = email.trim().toLowerCase()

    const existing = await sql`
      SELECT email FROM signups WHERE LOWER(email) = ${normalizedEmail} LIMIT 1
    `
    if (existing.length) {
      return NextResponse.json(
        { error: 'A customer with this email already exists. Use "Resend Order Link" instead.' },
        { status: 409 }
      )
    }

    const token = crypto.randomUUID().replace(/-/g, '')

    await sql`
      INSERT INTO signups (
        name, phone, email, booster, current_dosage,
        ship_address, ship_address2, ship_city, ship_state, ship_zip,
        bill_address, bill_city, bill_state, bill_zip,
        token, private_token, order_count, last_order_date,
        paid, checked_out, review_required, review_submitted
      ) VALUES (
        ${name}, ${phone || ''}, ${normalizedEmail}, ${booster || ''}, 2.5,
        ${shipAddress}, ${shipAddress2 || ''}, ${shipCity}, ${shipState}, ${shipZip},
        ${shipAddress}, ${shipCity}, ${shipState}, ${shipZip},
        ${token}, ${token}, 1, NOW(),
        true, true, true, false
      )
    `

    const link = `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/${token}`

    if (sendEmail) {
      if (!process.env.RESEND_API_KEY) {
        return NextResponse.json({
          success: true,
          link,
          warning: 'Customer created, but RESEND_API_KEY is not set so the email was not sent. Share the link manually.',
        })
      }
      const resend = new Resend(process.env.RESEND_API_KEY)
      try {
        await resend.emails.send({
          from: 'OI Body Chemistry <orders@oibodychemistry.com>',
          to: normalizedEmail,
          subject: 'Your OI Body Chemistry Link',
          html: `
            <p>Hi ${name},</p>
            <p>Here is your personal order link for your next order:</p>
            <p><a href="${link}">${link}</a></p>
            <p>This link is personal to you — please do not share it.</p>
            <p>— OI Body Chemistry Team</p>
          `,
        })
      } catch (emailErr) {
        console.error('Create-link email error:', emailErr)
        return NextResponse.json({
          success: true,
          link,
          warning: `Customer created, but the email failed to send: ${emailErr.message || emailErr}. Share the link manually.`,
        })
      }
    }

    return NextResponse.json({
      success: true,
      link,
      message: sendEmail ? `Customer created and link emailed to ${normalizedEmail}.` : 'Customer created. Copy the link below to share manually.',
    })
  } catch (err) {
    console.error('Create-link error:', err)
    return NextResponse.json({ error: `Internal server error: ${err.message || err}` }, { status: 500 })
  }
}