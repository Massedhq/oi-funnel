import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET() {
  try {
    const rows = await sql`
      SELECT name, review_text, rating AS review_rating, created_at AS review_submitted_at
      FROM reviews
      WHERE rating >= 4
      ORDER BY created_at DESC
      LIMIT 50
    `
    return Response.json({
      count: rows.length,
      reviews: rows,
    })
  } catch (err) {
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}