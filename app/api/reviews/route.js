import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET() {
  try {
    const rows = await sql`
      SELECT name, review_text, review_rating, review_submitted_at
      FROM signups
      WHERE review_submitted = true AND review_rating >= 4
      ORDER BY review_submitted_at DESC
      LIMIT 50
    `
    return Response.json({
      count: rows.length,
      reviews: rows,
    })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}