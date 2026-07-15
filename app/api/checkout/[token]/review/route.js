import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req, { params }) {
  try {
    const { token } = params
    const { rating, review_text } = await req.json()

    if (!rating || rating < 1 || rating > 5) {
      return Response.json({ error: 'Invalid rating.' }, { status: 400 })
    }
    if (!review_text || review_text.trim().split(/\s+/).length < 11) {
      return Response.json({ error: 'Review must be at least 11 words.' }, { status: 400 })
    }

    const rows = await sql`
      SELECT id FROM signups
      WHERE private_token = ${token} OR token = ${token}
    `
    if (rows.length === 0) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const id = rows[0].id

    await sql`
      UPDATE signups
      SET review_submitted = true,
          review_rating = ${rating},
          review_text = ${review_text},
          review_submitted_at = NOW()
      WHERE id = ${id}
    `

    return Response.json({ success: true })
  } catch (err) {
    console.error('Review submit error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}