import { sql } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const result = await sql`SELECT remaining FROM spots WHERE id = 1`
    const remaining = result[0]?.remaining ?? 300
    return Response.json({ remaining, total: 300 })
  } catch (err) {
    return Response.json({ remaining: 300, total: 300 })
  }
}