import { setupDB } from '@/lib/db'
export async function GET() {
  try {
    await setupDB()
    return Response.json({ success: true, message: 'Database tables created!' })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}code app/api/checkout/[token]/pay/route.js