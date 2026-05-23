// src/app/api/jobs/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';

const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL ?? '';
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? '';

async function redisSet(key: string, value: unknown, exSeconds = 3600) {
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
  const jobId = req.nextUrl.searchParams.get('jobId');
  if (!jobId) {
    return NextResponse.json({ error: 'jobId required' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const status = body.status ?? 'error';
    const url    = body.url ?? '';

    await redisSet(`job_${jobId}`, { status, url }, 3600);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Callback error:', err);
    await redisSet(`job_${jobId}`, { status: 'error' }, 3600);
    return NextResponse.json({ error: 'Callback failed' }, { status: 500 });
  }
}
