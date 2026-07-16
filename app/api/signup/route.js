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

    const spotsRow = await sql`SELECT metatride_remaining, triphase_remaining FROM spots WHERE id = 1`
    const metatrideRemaining = spotsRow[0]?.metatride_remaining ?? 0
    const triphaseRemaining = spotsRow[0]?.triphase_remaining ?? 0

    const isMetaTride = booster === 'MetaTride Ultra'
    const productRemaining = isMetaTride ? metatrideRemaining : triphaseRemaining

    if (productRemaining <= 0) {
      return Response.json({
        error: `${booster} is currently sold out. Please join the waiting list.`,
        soldOut: true,
        product: booster,
      }, { status: 410 })
    }

    const token = crypto.randomBytes(24).toString('hex')
    await sql`
      INSERT INTO signups (name, phone, email, booster, ship_address, ship_address2, ship_city, ship_state, ship_zip, bill_address, bill_city, bill_state, bill_zip, token)
      VALUES (${name}, ${phone}, ${email}, ${booster}, ${ship_address}, ${ship_address2 || ''}, ${ship_city}, ${ship_state}, ${ship_zip}, ${bill_address || ship_address}, ${bill_city || ship_city}, ${bill_state || ship_state}, ${bill_zip || ship_zip}, ${token})
    `

    if (isMetaTride) {
      await sql`UPDATE spots SET metatride_remaining = metatride_remaining - 1 WHERE id = 1`
    } else {
      await sql`UPDATE spots SET triphase_remaining = triphase_remaining - 1 WHERE id = 1`
    }

    const updated = await sql`SELECT metatride_remaining, triphase_remaining FROM spots WHERE id = 1`

    // NO EMAIL SENT HERE — email sent only after payment is confirmed in pay/route.js
    return Response.json({
      success: true,
      metatride_remaining: updated[0].metatride_remaining,
      triphase_remaining: updated[0].triphase_remaining,
      token,
    })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}