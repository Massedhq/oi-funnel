import { sql } from '@/lib/db'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const result = await sql`SELECT metatride_remaining, triphase_remaining FROM spots WHERE id = 1`
    const metatride_remaining = result[0]?.metatride_remaining ?? 150
    const triphase_remaining = result[0]?.triphase_remaining ?? 150
    return Response.json({
      metatride_remaining,
      triphase_remaining,
      total: metatride_remaining + triphase_remaining,
    })
  } catch (err) {
    return Response.json({ metatride_remaining: 150, triphase_remaining: 150, total: 300 })
  }
}