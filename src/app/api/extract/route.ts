// kartoverlay/src/app/api/extract/route.ts
// Receives base64 image(s) from the browser, sends to Anthropic Vision, returns lap JSON.

import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const EXTRACTION_PROMPT = `These are screenshots from a karting timing app showing lap times.
Extract every lap row you can see. Return ONLY a JSON array, no markdown,
no explanation. Each element: {"lap": <number>, "lapTime": <seconds as
number with 3 decimal places>}. Sort by lap number ascending. If multiple
screenshots cover different lap ranges, combine them into one sorted array
with no duplicates.
Example: [{"lap":1,"lapTime":44.002},{"lap":2,"lapTime":37.560}]`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  let body: { images: string[] }; // images = base64 data URLs
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.images || body.images.length === 0) {
    return NextResponse.json({ error: 'No images provided' }, { status: 400 });
  }

  // Build content blocks: one image per screenshot, then the prompt
  const imageBlocks = body.images.map((dataUrl: string) => {
    // dataUrl = "data:image/jpeg;base64,<b64>"
    const [meta, data] = dataUrl.split(',');
    const mediaType = meta.replace('data:', '').replace(';base64', '') as
      | 'image/jpeg'
      | 'image/png'
      | 'image/gif'
      | 'image/webp';
    return {
      type: 'image',
      source: { type: 'base64', media_type: mediaType, data },
    };
  });

  const content = [
    ...imageBlocks,
    { type: 'text', text: EXTRACTION_PROMPT },
  ];

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error:', err);
      return NextResponse.json({ error: 'AI extraction failed', detail: err }, { status: 502 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';

    // Parse the JSON array from the model response
    let laps;
    try {
      // Strip any accidental markdown fences
      const clean = text.replace(/```json|```/g, '').trim();
      laps = JSON.parse(clean);
    } catch {
      console.error('Failed to parse model response:', text);
      return NextResponse.json(
        { error: 'Could not parse lap data from screenshots', raw: text },
        { status: 422 }
      );
    }

    if (!Array.isArray(laps) || laps.length === 0) {
      return NextResponse.json(
        { error: 'No laps found in screenshots', raw: text },
        { status: 422 }
      );
    }

    return NextResponse.json({ laps });
  } catch (err) {
    console.error('Extract route error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
