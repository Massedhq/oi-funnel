import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const result = await sql`SELECT remaining FROM spots WHERE id = 1`
    const spots_remaining = result[0]?.remaining ?? 40
    return new Response(JSON.stringify({ spots_remaining }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (err) {
    return new Response(JSON.stringify({ spots_remaining: 40 }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    })
  }
}