// src/app/api/jobs/callback/route.ts
// Modal POSTs the finished AVI here when rendering is complete.
// We store the video as base64 in Redis so the browser can download it.

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
    // Read the AVI bytes Modal sent
    const arrayBuffer = await req.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Store video in Redis with 1 hour TTL
    await redisSet(`video:${jobId}`, base64, 3600);

    // Mark job as done with download URL
    await redisSet(
      `job:${jobId}`,
      JSON.stringify({ status: 'done', url: `/api/jobs/download?jobId=${jobId}` }),
      3600
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Callback error:', err);
    await redisSet(`job:${jobId}`, JSON.stringify({ status: 'error' }), 3600);
    return NextResponse.json({ error: 'Callback failed' }, { status: 500 });
  }
}
