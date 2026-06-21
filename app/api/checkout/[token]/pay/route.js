import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req, { params }) {
  try {
    const { token } = params
    const { sourceId } = await req.json()

    // Look up signup by token
    const rows = await sql`SELECT * FROM signups WHERE token = ${token}`
    if (rows.length === 0) {
      return Response.json({ error: 'Invalid checkout link.' }, { status: 404 })
    }

    const signup = rows[0]

    if (signup.paid) {
      return Response.json({ error: 'This order has already been placed.' }, { status: 409 })
    }

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
        idempotency_key: `${token}-${Date.now()}`,
        amount_money: { amount: 4500, currency: 'USD' },
        buyer_email_address: signup.email,
        billing_address: {
          address_line_1: signup.bill_address || signup.ship_address,
          locality: signup.bill_city || signup.ship_city,
          administrative_district_level_1: signup.bill_state || signup.ship_state,
          postal_code: signup.bill_zip || signup.ship_zip,
          country: 'US',
        },
        shipping_address: {
          address_line_1: signup.ship_address,
          address_line_2: signup.ship_address2 || '',
          locality: signup.ship_city,
          administrative_district_level_1: signup.ship_state,
          postal_code: signup.ship_zip,
          country: 'US',
        },
        note: `OI Body Chemistry - ${signup.booster} - ${signup.name}`,
        location_id: 'LQA2D2J5740ZV',
      }),
    })

    const squareData = await squareRes.json()

    if (!squareRes.ok || squareData.errors) {
      const msg = squareData.errors?.[0]?.detail || 'Payment failed.'
      return Response.json({ error: msg }, { status: 400 })
    }

    // Mark as paid in DB
    await sql`UPDATE signups SET paid = true, checked_out = true WHERE token = ${token}`

    return Response.json({ success: true })

  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}