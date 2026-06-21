import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req, { params }) {
  try {
    const { token } = params
    const rows = await sql`SELECT name, email, booster, ship_address, ship_address2, ship_city, ship_state, ship_zip, bill_address, bill_city, bill_state, bill_zip, paid FROM signups WHERE token = ${token}`
    if (rows.length === 0) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }
    return Response.json(rows[0])
  } catch (err) {
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}