// src/app/api/jobs/status/route.ts
// Browser polls this every 3 seconds to check if the video is ready.

import { NextRequest, NextResponse } from 'next/server';

const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL ?? '';
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? '';

async function redisGet(key: string): Promise<string | null> {
  const res = await fetch(`${UPSTASH_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
  });
  const data = await res.json();
  return data.result ?? null;
}

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get('jobId');
  if (!jobId) {
    return NextResponse.json({ error: 'jobId required' }, { status: 400 });
  }

  const raw = await redisGet(`job:${jobId}`);
  if (!raw) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const job = JSON.parse(raw);
  return NextResponse.json(job);
  // Returns: { status: 'processing' | 'done' | 'error', url?: string }
}
