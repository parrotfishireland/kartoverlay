// src/app/api/jobs/route.ts
// Fires Modal job asynchronously — returns jobId immediately, no waiting.
// Modal calls back to /api/jobs/callback when done.

import { NextRequest, NextResponse } from 'next/server';

const MODAL_ENDPOINT = process.env.MODAL_ENDPOINT ?? '';
const UPSTASH_URL    = process.env.UPSTASH_REDIS_REST_URL ?? '';
const UPSTASH_TOKEN  = process.env.UPSTASH_REDIS_REST_TOKEN ?? '';

async function redisSet(key: string, value: string) {
  await fetch(`${UPSTASH_URL}/set/${key}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(value),
  });
}

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

  // Generate a job ID
  const jobId = crypto.randomUUID();

  // Store initial status in Redis
  await redisSet(`job:${jobId}`, JSON.stringify({ status: 'processing', progress: 0 }));

  // Get the callback URL (where Modal will POST the finished video)
  const host = req.headers.get('host') ?? '';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const callbackUrl = `${protocol}://${host}/api/jobs/callback?jobId=${jobId}`;

  // Fire Modal — don't await it
  fetch(MODAL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ laps: body.laps, callbackUrl }),
  }).catch((err) => console.error('Modal fire error:', err));

  return NextResponse.json({ jobId });
}
