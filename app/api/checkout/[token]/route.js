import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req, { params }) {
  try {
    const { token } = params
    // Look up by private_token (generated after payment) OR session token
    const rows = await sql`
      SELECT name, email, booster, ship_address, ship_address2, ship_city, ship_state, ship_zip,
             bill_address, bill_city, bill_state, bill_zip, paid, order_count, review_required, review_submitted
      FROM signups WHERE private_token = ${token} OR (token = ${token} AND paid = true)
    `
    if (rows.length === 0) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }
    return Response.json(rows[0])
  } catch (err) {
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}