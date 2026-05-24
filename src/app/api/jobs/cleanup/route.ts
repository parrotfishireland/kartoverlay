// src/app/api/jobs/cleanup/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BLOB_TOKEN    = process.env.BLOB_READ_WRITE_TOKEN ?? '';
const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL ?? '';
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? '';

export async function DELETE(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get('jobId');
  if (!jobId) {
    return NextResponse.json({ error: 'jobId required' }, { status: 400 });
  }

  // Get the blob URL from Redis
  const redisRes = await fetch(`${UPSTASH_URL}/get/${encodeURIComponent(`job_${jobId}`)}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
  });
  const redisData = await redisRes.json();
  if (!redisData.result) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const job = JSON.parse(redisData.result);
  const blobUrl = job.url;

  if (!blobUrl) {
    return NextResponse.json({ error: 'No blob URL found' }, { status: 404 });
  }

  // Extract pathname from the blob URL
  // e.g. https://abc.public.blob.vercel-storage.com/kart_overlay_xxx.avi
  const pathname = new URL(blobUrl).pathname.slice(1); // remove leading /

  const deleteRes = await fetch(
    `https://blob.vercel-storage.com/${pathname}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${BLOB_TOKEN}` },
    }
  );

  if (!deleteRes.ok) {
    const text = await deleteRes.text();
    console.error('Blob delete failed:', deleteRes.status, text);
    return NextResponse.json({ error: 'Blob delete failed', detail: text }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
