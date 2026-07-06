// app/api/admin/reviews/route.js
//
// GET  -> list all reviews (newest first)
// DELETE -> delete a review by id

import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rows = await sql`
      SELECT id, name, email, order_number, rating, review_text, created_at
      FROM reviews
      ORDER BY created_at DESC
    `

    return NextResponse.json({ success: true, reviews: rows })
  } catch (err) {
    console.error('Admin reviews GET error:', err)
    return NextResponse.json({ error: `Internal server error: ${err.message || err}` }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json()
    const { secret, id } = body

    if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!id) {
      return NextResponse.json({ error: 'Review id is required.' }, { status: 400 })
    }

    await sql`DELETE FROM reviews WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin reviews DELETE error:', err)
    return NextResponse.json({ error: `Internal server error: ${err.message || err}` }, { status: 500 })
  }
}