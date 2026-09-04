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

function normalizeLegacyUrls(value: unknown, apiUrl: string): unknown {
  if (typeof value === 'string') return value.replace(`${new URL(apiUrl).origin}/uploads/images/media-api.php?file=`, `${new URL(apiUrl).origin}/media-api.php?file=`);
  if (Array.isArray(value)) return value.map((item) => normalizeLegacyUrls(item, apiUrl));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeLegacyUrls(item, apiUrl)]));
  return value;
}

async function responseFromMedia(response: Response) {
  const text = await response.text();
  const contentType = response.headers.get('Content-Type') || 'application/json';
  if (!contentType.includes('application/json')) return new NextResponse(text, { status: response.status, headers: { 'Content-Type': contentType } });
  try {
    const normalized = normalizeLegacyUrls(JSON.parse(text), mediaApiUrl() || 'http://localhost/media-api.php');
    return NextResponse.json(normalized, { status: response.status });
  } catch {
    return new NextResponse(text, { status: response.status, headers: { 'Content-Type': contentType } });
  }
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
