import { sql } from '@/lib/db'
import { Resend } from 'resend'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req) {
  try {
    const {
      name, phone, email, booster,
      ship_address, ship_address2, ship_city, ship_state, ship_zip,
      bill_address, bill_city, bill_state, bill_zip
    } = await req.json()

    // Validate required fields
    if (!name || !phone || !email || !booster || !ship_address || !ship_city || !ship_state || !ship_zip) {
      return Response.json({ error: 'All required fields must be filled in.' }, { status: 400 })
    }

    // Check for duplicate
    const existing = await sql`SELECT id FROM signups WHERE phone = ${phone} OR email = ${email}`
    if (existing.length > 0) {
      return Response.json({ error: 'This phone or email is already registered.' }, { status: 409 })
    }

    // Check spots
    const spots = await sql`SELECT remaining FROM spots WHERE id = 1`
    if (spots[0].remaining <= 0) {
      return Response.json({ error: 'No spots remaining.' }, { status: 410 })
    }

    // Generate unique token
    const token = crypto.randomBytes(24).toString('hex')

    // Save to DB
    await sql`
      INSERT INTO signups (name, phone, email, booster, ship_address, ship_address2, ship_city, ship_state, ship_zip, bill_address, bill_city, bill_state, bill_zip, token)
      VALUES (${name}, ${phone}, ${email}, ${booster}, ${ship_address}, ${ship_address2 || ''}, ${ship_city}, ${ship_state}, ${ship_zip}, ${bill_address || ship_address}, ${bill_city || ship_city}, ${bill_state || ship_state}, ${bill_zip || ship_zip}, ${token})
    `

    // Decrement spots
    await sql`UPDATE spots SET remaining = remaining - 1 WHERE id = 1`
    const updated = await sql`SELECT remaining FROM spots WHERE id = 1`

    // Build private checkout link
    const checkoutLink = `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/${token}`

    // Send email via Resend
    await resend.emails.send({
      from: 'OI Body Chemistry <noreply@orishainfinity.com>',
      to: email,
      subject: 'You are In! ✳️ Your Private Checkout Link',
      html: `
        <div style="font-family:'Georgia',serif;max-width:560px;margin:0 auto;background:#050505;color:#F3ECE5;padding:48px 32px;border-radius:12px;">
          <p style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#C8A88A;margin-bottom:8px;">OI Body Chemistry</p>
          <h1 style="font-size:32px;font-weight:700;margin-bottom:8px;color:#F3ECE5;">You are In! ✳️</h1>
          <p style="font-size:15px;color:#E8DDD2;line-height:1.7;margin-bottom:24px;">
            Congratulations ${name} on making the first step to your new identity journey on becoming.
          </p>
          <div style="background:#161412;border:1px solid rgba(200,168,138,0.3);border-radius:10px;padding:24px;margin-bottom:24px;">
            <p style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#C8A88A;margin-bottom:6px;">Your Selection</p>
            <p style="font-size:18px;font-weight:600;color:#D8C3B3;margin-bottom:4px;">${booster}™</p>
            <p style="font-size:13px;color:#E8DDD2;opacity:0.7;">$45 / month · Cancel Anytime</p>
          </div>
          <p style="font-size:14px;color:#E8DDD2;line-height:1.7;margin-bottom:20px;">
            Your private checkout link is below. This link is exclusive to you — please do not share it.
            It will expire in <strong>24 hours</strong>.
          </p>
          <a href="${checkoutLink}" style="display:block;background:#C8A88A;color:#050505;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;text-align:center;padding:18px;border-radius:8px;text-decoration:none;margin-bottom:24px;">
            Access My Private Checkout →
          </a>
          <p style="font-size:11px;color:#E8DDD2;opacity:0.5;line-height:1.6;">
            If you did not sign up for OI Body Chemistry, please ignore this email.<br/>
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

    return Response.json({ success: true, remaining: updated[0].remaining, token })

  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}