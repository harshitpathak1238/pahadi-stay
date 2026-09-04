import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

const mediaApiUrl = () => process.env.HOSTINGER_MEDIA_API_URL?.replace(/\/$/, '');
const mediaSecret = () => process.env.HOSTINGER_MEDIA_API_SECRET;

async function proxy(request: Request, init: RequestInit = {}) {
  const url = mediaApiUrl();
  const secret = mediaSecret();
  if (!url || !secret) throw new Error('Hostinger media API is not configured. Set HOSTINGER_MEDIA_API_URL and HOSTINGER_MEDIA_API_SECRET.');
  const target = new URL(url);
  if (request.method === 'GET') target.search = new URL(request.url).search;
  return fetch(target, { ...init, signal: AbortSignal.timeout(30000), headers: { ...(init.headers || {}), 'X-Media-Secret': secret, 'X-Forwarded-Host': new URL(request.url).host } });
}

async function responseFromMedia(response: Response) {
  const text = await response.text();
  return new NextResponse(text, { status: response.status, headers: { 'Content-Type': response.headers.get('Content-Type') || 'application/json' } });
}

export async function GET(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  try {
    const response = await proxy(request, { method: 'GET', body: undefined });
    return responseFromMedia(response);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Media service unavailable.' }, { status: 503 }); }
}

export async function POST(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  try {
    const response = await proxy(request, { method: 'POST', body: await request.arrayBuffer(), headers: { 'Content-Type': request.headers.get('Content-Type') || '' } });
    return responseFromMedia(response);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Media upload failed.' }, { status: 503 }); }
}

export async function PATCH(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  try {
    const response = await proxy(request, { method: 'PATCH', body: await request.arrayBuffer(), headers: { 'Content-Type': request.headers.get('Content-Type') || '' } });
    return responseFromMedia(response);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Media update failed.' }, { status: 503 }); }
}

export async function DELETE(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  try {
    const response = await proxy(request, { method: 'DELETE', body: await request.arrayBuffer(), headers: { 'Content-Type': 'application/json' } });
    return responseFromMedia(response);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Media deletion failed.' }, { status: 503 }); }
}
