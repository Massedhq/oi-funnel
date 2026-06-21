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

    // Send owner notification email
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
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
            <tr><td style="padding:8px 0;color:#B99678;">Amount</td><td style="padding:8px 0;color:#D8C3B3;font-weight:bold;">$45.00</td></tr>
            <tr><td style="padding:8px 0;color:#B99678;">Ship To</td><td style="padding:8px 0;">${signup.ship_address}${signup.ship_address2 ? ', ' + signup.ship_address2 : ''}, ${signup.ship_city}, ${signup.ship_state} ${signup.ship_zip}</td></tr>
          </table>
        </div>
      `
    })

    return Response.json({ success: true })

  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}