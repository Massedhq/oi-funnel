import { sql } from '@/lib/db'
export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const { name, email, phone, product } = await req.json()

    if (!name || !email || !product) {
      return Response.json({ error: 'Name, email, and product are required.' }, { status: 400 })
    }

    await sql`
      INSERT INTO waitlist (name, email, phone, product)
      VALUES (${name}, ${email}, ${phone || ''}, ${product})
    `

    return Response.json({ success: true })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}