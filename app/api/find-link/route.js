import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { Resend } from 'resend'

const sql = neon(process.env.DATABASE_URL)
const otherSql = neon('postgresql://neondb_owner:npg_BR0oZgezpCn8@ep-young-meadow-ayhj35qf-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require')
const resend = new Resend(process.env.RESEND_API_KEY)

const GENERIC_MESSAGE = "If that email is on file, we've sent your link — check your inbox (and spam folder) in a few minutes."

export async function POST(request) {
  try {
    const body = await request.json()
    const email = (body.email || '').trim().toLowerCase()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    let rows = await sql`
      SELECT * FROM signups WHERE LOWER(email) = ${email} LIMIT 1
    `

    let fromOrderDb = false
    if (!rows.length) {
      try {
        rows = await otherSql`
          SELECT * FROM signups WHERE LOWER(email) = ${email} LIMIT 1
        `
        fromOrderDb = true
      } catch (e) {
        console.error('Secondary database lookup failed:', e)
      }
    }

    if (rows.length) {
      const signup = rows[0]
      const activeToken = signup.private_token || signup.token
      const baseUrl = fromOrderDb
        ? 'https://order.oibodychemistry.com'
        : process.env.NEXT_PUBLIC_SITE_URL
      const link = `${baseUrl}/checkout/${activeToken}`

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

    return NextResponse.json({ success: true, message: GENERIC_MESSAGE })
  } catch (err) {
    console.error('Find-link error:', err)
    return NextResponse.json({ success: true, message: GENERIC_MESSAGE })
  }
}