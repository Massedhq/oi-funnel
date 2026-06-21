import { sql } from '@/lib/db'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const {
      name, phone, email, booster,
      ship_address, ship_address2, ship_city, ship_state, ship_zip,
      bill_address, bill_city, bill_state, bill_zip
    } = await req.json()

    if (!name || !phone || !email || !booster || !ship_address || !ship_city || !ship_state || !ship_zip) {
      return Response.json({ error: 'All required fields must be filled in.' }, { status: 400 })
    }

    const existing = await sql`SELECT id FROM signups WHERE phone = ${phone} OR email = ${email}`
    if (existing.length > 0) {
      return Response.json({ error: 'This phone or email is already registered.' }, { status: 409 })
    }

    const spots = await sql`SELECT remaining FROM spots WHERE id = 1`
    if (spots[0].remaining <= 0) {
      return Response.json({ error: 'No spots remaining.' }, { status: 410 })
    }

    const token = crypto.randomBytes(24).toString('hex')

    await sql`
      INSERT INTO signups (name, phone, email, booster, ship_address, ship_address2, ship_city, ship_state, ship_zip, bill_address, bill_city, bill_state, bill_zip, token)
      VALUES (${name}, ${phone}, ${email}, ${booster}, ${ship_address}, ${ship_address2 || ''}, ${ship_city}, ${ship_state}, ${ship_zip}, ${bill_address || ship_address}, ${bill_city || ship_city}, ${bill_state || ship_state}, ${bill_zip || ship_zip}, ${token})
    `

    await sql`UPDATE spots SET remaining = remaining - 1 WHERE id = 1`
    const updated = await sql`SELECT remaining FROM spots WHERE id = 1`

    return Response.json({ success: true, remaining: updated[0].remaining, token })

  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}