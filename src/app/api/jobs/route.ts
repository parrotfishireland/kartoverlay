// src/app/api/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server';

const MODAL_ENDPOINT  = process.env.MODAL_ENDPOINT ?? '';
const UPSTASH_URL     = process.env.UPSTASH_REDIS_REST_URL ?? '';
const UPSTASH_TOKEN   = process.env.UPSTASH_REDIS_REST_TOKEN ?? '';

async function redisSet(key: string, value: unknown, exSeconds = 7200) {
  const res = await fetch(`${UPSTASH_URL}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([JSON.stringify(value), 'EX', exSeconds]),
  });
  if (!res.ok) {
    console.error(`Redis write failed [${key}]:`, res.status, await res.text());
  }
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

  await redisSet(`job_${jobId}`, { status: 'processing' });

  const host = req.headers.get('host') ?? '';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const callbackUrl = `${protocol}://${host}/api/jobs/callback?jobId=${jobId}`;

  fetch(MODAL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ laps: body.laps, callbackUrl, jobId }),
  }).catch((err) => console.error('Modal fire error:', err));

  return NextResponse.json({ jobId });
}
