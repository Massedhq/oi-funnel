import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const { email } = await req.json()

    if (!email || !email.trim()) {
      return Response.json({ error: 'Please enter your email address.' }, { status: 400 })
    }

    const rows = await sql`
      SELECT token, private_token, name, email
      FROM signups
      WHERE LOWER(email) = LOWER(${email.trim()})
      ORDER BY id DESC
      LIMIT 1
    `

    if (rows.length === 0) {
      return Response.json({ error: "We couldn't find an order under that email. Please check and try again." }, { status: 404 })
    }

    const row = rows[0]
    const token = row.private_token || row.token

    return Response.json({ token, name: row.name })
  } catch (err) {
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}