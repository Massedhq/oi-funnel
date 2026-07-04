// app/api/admin/verify/route.js
//
// Checks the entered password against ADMIN_SECRET.
// Used by the /admin/ship page's login screen.

import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { secret } = await request.json()

    if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}