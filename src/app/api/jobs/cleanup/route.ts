// src/app/api/jobs/cleanup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';

const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL ?? '';
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? '';

export async function DELETE(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get('jobId');
  if (!jobId) {
    return NextResponse.json({ error: 'jobId required' }, { status: 400 });
  }

  const redisRes = await fetch(`${UPSTASH_URL}/get/${encodeURIComponent(`job_${jobId}`)}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
  });
  const redisData = await redisRes.json();
  if (!redisData.result) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  let job: { status: string; url?: string };
  try {
    const first = JSON.parse(redisData.result);
    job = typeof first === 'string' ? JSON.parse(first) : first;
  } catch {
    return NextResponse.json({ error: 'Failed to parse job data' }, { status: 500 });
  }

  const blobUrl = job.url;
  if (!blobUrl) {
    return NextResponse.json({ error: 'No blob URL found' }, { status: 404 });
  }

  await del(blobUrl);
  return NextResponse.json({ ok: true });
}
