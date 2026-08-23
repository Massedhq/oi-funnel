// app/api/spots/route.js
import { neon } from '@neondatabase/serverless'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const sql = neon(process.env.DATABASE_URL)

export async function GET() {
  try {
    const rows = await sql`
      SELECT booster, units_available, units_sold
      FROM inventory
      ORDER BY booster ASC
    `

    const inventory = {}
    let totalRemaining = 0

    rows.forEach(row => {
      inventory[row.booster] = {
        available: row.units_available,
        sold: row.units_sold,
      }
      totalRemaining += row.units_available
    })

    return new Response(JSON.stringify({
      remaining: totalRemaining,
      total: 300,
      inventory,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ remaining: 300, total: 300, inventory: {} }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    })
  }
}