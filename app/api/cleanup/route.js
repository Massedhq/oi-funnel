// app/api/cleanup/route.js
// Deletes unpaid signups older than 2 hours
// Called by Vercel cron or manually via GET /api/cleanup

export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    const { sql } = await import('@/lib/db')

    const deleted = await sql`
      DELETE FROM signups
      WHERE paid = false
        AND created_at < NOW() - INTERVAL '2 hours'
      RETURNING id, name, email, booster
    `

    // If inventory was decremented at signup, add it back for each deleted record
    // (only needed if your signup route still decrements — currently it does via spots table)
    // Since you use the inventory table now, restore those units
    for (const row of deleted) {
      await sql`
        UPDATE inventory
        SET units_available = units_available + 1,
            units_sold = GREATEST(units_sold - 1, 0),
            updated_at = NOW()
        WHERE booster = ${row.booster}
      `
    }

    console.log(`Cleanup: deleted ${deleted.length} unpaid signups`)

    return Response.json({
      success: true,
      deleted: deleted.length,
      records: deleted.map(r => ({ id: r.id, name: r.name, email: r.email, booster: r.booster })),
    })

  } catch (err) {
    console.error('Cleanup error:', err)
    return Response.json({ error: 'Cleanup failed.' }, { status: 500 })
  }
}