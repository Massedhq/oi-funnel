// app/api/setup/route.js
// Visit /api/setup once after deploy to run all migrations

import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export async function GET() {
  try {
    // Existing signups table (unchanged)
    await sql`
      CREATE TABLE IF NOT EXISTS signups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        phone VARCHAR(20),
        email VARCHAR(255) UNIQUE,
        booster VARCHAR(100),
        token VARCHAR(255) UNIQUE,
        private_token VARCHAR(255) UNIQUE,
        ship_address VARCHAR(255),
        ship_address2 VARCHAR(100),
        ship_city VARCHAR(100),
        ship_state VARCHAR(10),
        ship_zip VARCHAR(10),
        bill_address VARCHAR(255),
        bill_address2 VARCHAR(100),
        bill_city VARCHAR(100),
        bill_state VARCHAR(10),
        bill_zip VARCHAR(10),
        order_count INTEGER DEFAULT 0,
        last_order_date TIMESTAMP,
        paid BOOLEAN DEFAULT false,
        checked_out BOOLEAN DEFAULT false,
        review_required BOOLEAN DEFAULT false,
        review_submitted BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Reviews table (unchanged)
    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        signup_id INTEGER REFERENCES signups(id),
        token VARCHAR(255),
        rating INTEGER,
        review_text TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Inventory table — NEW
    await sql`
      CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        booster VARCHAR(100) NOT NULL UNIQUE,
        units_available INTEGER NOT NULL DEFAULT 150,
        units_sold INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Seed inventory if not already seeded
    await sql`
      INSERT INTO inventory (booster, units_available, units_sold)
      VALUES 
        ('MetaTride Ultra', 150, 0),
        ('TriPhase MetaBurn', 150, 0)
      ON CONFLICT (booster) DO NOTHING
    `

    return NextResponse.json({ success: true, message: 'All migrations complete. Inventory seeded at 150 each.' })
  } catch (err) {
    console.error('Setup error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}