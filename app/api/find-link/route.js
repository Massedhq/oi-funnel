// app/api/find-link/route.js
//
// PUBLIC route — customer-facing "Find My Link" button.
// No admin secret required. Takes just an email.
//
// Security note: this always returns the same generic success message,
// whether or not the email is found, so someone can't use it to check
// which emails are registered customers.

import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { Resend } from 'resend'

const sql = neon(process.env.DATABASE_URL)
const resend = new Resend(process.env.RESEND_API_KEY)

const GENERIC_MESSAGE = "If that email is on file, we've sent your link — check your inbox (and spam folder) in a few minutes."

export async function POST(request) {
  try {
    const body = await request.json()
    const email = (body.email || '').trim().toLowerCase()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    const rows = await sql`
      SELECT * FROM signups WHERE LOWER(email) = ${email} LIMIT 1
    `

    if (rows.length) {
      const signup = rows[0]
      const activeToken = signup.private_token || signup.token
      const link = `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/${activeToken}`

      await resend.emails.send({
        from: 'OI Body Chemistry <orders@oibodychemistry.com>',
        to: signup.email,
        subject: 'Your OI Body Chemistry Link',
        html: `
          <p>Hi ${signup.name},</p>
          <p>Here is your personal order link:</p>
          <p><a href="${link}">${link}</a></p>
          <p>This link is personal to you — please do not share it.</p>
          <p>— OI Body Chemistry Team</p>
        `,
      })
    }

    // Always return the same message, found or not.
    return NextResponse.json({ success: true, message: GENERIC_MESSAGE })
  } catch (err) {
    console.error('Find-link error:', err)
    // Still return the generic message so we don't leak error details either.
    return NextResponse.json({ success: true, message: GENERIC_MESSAGE })
  }
}