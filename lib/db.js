import { neon } from '@neondatabase/serverless'

export const sql = neon(process.env.DATABASE_URL)

export async function setupDB() {
  await sql`CREATE TABLE IF NOT EXISTS signups (id SERIAL PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, created_at TIMESTAMPTZ DEFAULT NOW())`
  await sql`CREATE TABLE IF NOT EXISTS spots (id INT PRIMARY KEY DEFAULT 1, remaining INT NOT NULL DEFAULT 40, CHECK (id = 1))`
  await sql`INSERT INTO spots (id, remaining) VALUES (1, 300) ON CONFLICT (id) DO NOTHING`

  // Shipping/tracking columns for the admin ship-order route
  await sql`ALTER TABLE signups ADD COLUMN IF NOT EXISTS tracking_number TEXT`
  await sql`ALTER TABLE signups ADD COLUMN IF NOT EXISTS tracking_carrier TEXT`
  await sql`ALTER TABLE signups ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ`
}