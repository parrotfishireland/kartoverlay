import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 300;

const MODAL_ENDPOINT = process.env.MODAL_ENDPOINT ?? '';

export async function POST(req: NextRequest) {
  if (!MODAL_ENDPOINT) {
    return NextResponse.json({ error: 'MODAL_ENDPOINT not configured' }, { status: 500 });
  }

  let body: { laps: { lap: number; lapTime: number }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.laps || body.laps.length === 0) {
    return NextResponse.json({ error: 'No laps provided' }, { status: 400 });
  }

  try {
    const modalRes = await fetch(MODAL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ laps: body.laps }),
    });

    if (!modalRes.ok) {
      const err = await modalRes.text();
      return NextResponse.json({ error: 'Video generation failed', detail: err }, { status: 502 });
    }

    const videoBuffer = await modalRes.arrayBuffer();

    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'video/x-msvideo',
        'Content-Disposition': 'attachment; filename="kart_overlay.avi"',
        'Content-Length': String(videoBuffer.byteLength),
      },
    });
  } catch (err) {
    console.error('Jobs route error:', err);
    return NextResponse.json({ error: 'Could not reach video generation service.' }, { status: 503 });
  }
}
