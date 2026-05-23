// src/app/api/jobs/route.ts
// Fires Modal job asynchronously — returns jobId immediately.
// Modal uploads video to Vercel Blob and POSTs the URL to /api/jobs/callback.

import { NextRequest, NextResponse } from 'next/server';

const MODAL_ENDPOINT  = process.env.MODAL_ENDPOINT ?? '';
const UPSTASH_URL     = process.env.UPSTASH_REDIS_REST_URL ?? '';
const UPSTASH_TOKEN   = process.env.UPSTASH_REDIS_REST_TOKEN ?? '';

async function redisSet(key: string, value: string) {
  await fetch(`${UPSTASH_URL}/setex/${key}/7200`, {
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

  const jobId = crypto.randomUUID();

  // Store initial status
  await redisSet(`job_${jobId}`, JSON.stringify({ status: 'processing' }));

  // Build callback URL
  const host = req.headers.get('host') ?? '';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const callbackUrl = `${protocol}://${host}/api/jobs/callback?jobId=${jobId}`;

  // Fire Modal — don't await
  fetch(MODAL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ laps: body.laps, callbackUrl, jobId }),
  }).catch((err) => console.error('Modal fire error:', err));

  return NextResponse.json({ jobId });
}
