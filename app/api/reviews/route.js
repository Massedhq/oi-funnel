import { sql } from '@/lib/db'
import { neon } from '@neondatabase/serverless'

const otherSql = neon('postgresql://neondb_owner:npg_BR0oZgezpCn8@ep-young-meadow-ayhj35qf-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require')

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET() {
  try {
    const [mainRows, otherRows] = await Promise.all([
      sql`
        SELECT name, review_text, review_rating, review_submitted_at
        FROM signups
        WHERE review_submitted = true AND review_rating >= 4
        ORDER BY review_submitted_at DESC
        LIMIT 50
      `,
      otherSql`
        SELECT name, review_text, review_rating, review_submitted_at
        FROM signups
        WHERE review_submitted = true AND review_rating >= 4
        ORDER BY review_submitted_at DESC
        LIMIT 50
      `.catch(() => [])
    ])

    const merged = [...mainRows, ...otherRows]
    const seen = new Set()
    const deduped = merged.filter(r => {
      const key = `${r.name}-${r.review_text}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    deduped.sort((a, b) => new Date(b.review_submitted_at) - new Date(a.review_submitted_at))

    return Response.json({
      count: deduped.length,
      reviews: deduped.slice(0, 50),
    })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}