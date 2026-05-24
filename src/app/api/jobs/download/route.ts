// src/app/api/jobs/download/route.ts
// Serves the finished AVI video from Redis storage.

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

  const base64 = await redisGet(`video:${jobId}`);
  if (!base64) {
    return NextResponse.json({ error: 'Video not found or expired' }, { status: 404 });
  }

  const buffer = Buffer.from(base64, 'base64');

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'video/x-msvideo',
      'Content-Disposition': 'attachment; filename="kart_overlay.mp4"',
      'Content-Length': String(buffer.byteLength),
    },
  });
}
