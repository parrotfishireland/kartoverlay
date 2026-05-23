// src/app/api/jobs/callback/route.ts
// Modal POSTs JSON here when rendering is complete: { status, url }
// We store the result in Upstash so the browser polling can pick it up.

import { NextRequest, NextResponse } from 'next/server';

const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL ?? '';
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? '';

async function redisSet(key: string, value: string, exSeconds = 3600) {
  await fetch(`${UPSTASH_URL}/set/${key}/ex/${exSeconds}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(value),
  });
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

    await redisSet(
      `job:${jobId}`,
      JSON.stringify({ status, url }),
      3600
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Callback error:', err);
    await redisSet(`job:${jobId}`, JSON.stringify({ status: 'error' }), 3600);
    return NextResponse.json({ error: 'Callback failed' }, { status: 500 });
  }
}
