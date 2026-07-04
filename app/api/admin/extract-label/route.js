// app/api/admin/extract-label/route.js
//
// Takes a photo of a USPS shipping label, sends it to the Anthropic API
// to read the tracking number + recipient name/address off it, then
// tries to match that to a customer record in `signups`.
//
// Requires ANTHROPIC_API_KEY to be set in your Vercel env vars.
// Get one at https://console.anthropic.com

import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export async function POST(request) {
  try {
    const { secret, imageBase64, mediaType } = await request.json()

    if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided.' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not set in your environment variables.' },
        { status: 500 }
      )
    }

    // Ask Claude to read the label and return structured JSON only.
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType || 'image/jpeg',
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: `This is a photo of a USPS shipping label. Read the label and return ONLY a JSON object (no markdown, no preamble) with this exact shape:
{
  "trackingNumber": "the USPS tracking number, digits only, no spaces",
  "recipientName": "the 'TO' recipient's full name as printed",
  "city": "recipient city",
  "state": "recipient state abbreviation",
  "zip": "recipient zip code"
}
If any field can't be read clearly, use an empty string for it. Return ONLY the JSON object.`,
              },
            ],
          },
        ],
      }),
    })

    const aiData = await aiRes.json()

    if (!aiRes.ok) {
      console.error('Anthropic API error:', aiData)
      const detail = aiData?.error?.message || aiData?.error?.type || 'Unknown error contacting Anthropic API.'
      return NextResponse.json({ error: `Failed to read the label image: ${detail}` }, { status: 500 })
    }

    const textBlock = aiData.content?.find((c) => c.type === 'text')?.text || ''
    const cleaned = textBlock.replace(/```json|```/g, '').trim()

    let extracted
    try {
      extracted = JSON.parse(cleaned)
    } catch (e) {
      console.error('Failed to parse AI response:', textBlock)
      return NextResponse.json({ error: 'Could not read the label clearly. Try a clearer photo.' }, { status: 422 })
    }

    const { trackingNumber, recipientName, city, state, zip } = extracted

    // Try to match by name first, then fall back to zip if no exact name match.
    let candidates = []
    if (recipientName) {
      candidates = await sql`
        SELECT * FROM signups WHERE LOWER(name) = LOWER(${recipientName}) LIMIT 5
      `
    }
    if (!candidates.length && zip) {
      candidates = await sql`
        SELECT * FROM signups WHERE ship_zip = ${zip} LIMIT 5
      `
    }

    return NextResponse.json({
      success: true,
      extracted: { trackingNumber, recipientName, city, state, zip },
      candidates: candidates.map((c) => ({
        email: c.email,
        name: c.name,
        ship_address: c.ship_address,
        ship_address2: c.ship_address2,
        ship_city: c.ship_city,
        ship_state: c.ship_state,
        ship_zip: c.ship_zip,
        order_count: c.order_count,
      })),
    })
  } catch (err) {
    console.error('Extract-label error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}