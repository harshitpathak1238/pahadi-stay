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

async function multipartBody(request: Request): Promise<FormData> {
  const source = await request.formData();
  const body = new FormData();
  source.forEach((value, key) => body.append(key, value));
  return body;
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
    const source = await request.formData();
    const body = source.has('id') ? source : await multipartBody(new Request(request.url, { method: 'POST', body: source }));
    const response = await proxy(request, { method: 'POST', body });
    return responseFromMedia(response);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Media upload failed.' }, { status: 503 }); }
}

export async function PATCH(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  try {
    const source = await request.formData();
    const replacement = source.get('file');
    const body = replacement instanceof File && replacement.size > 0 ? source : (() => {
      const params = new URLSearchParams();
      source.forEach((value, key) => { if (typeof value === 'string') params.append(key, value); });
      return params;
    })();
    const response = await proxy(request, { method: 'POST', body });
    return responseFromMedia(response);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Media update failed.' }, { status: 503 }); }
}

export async function DELETE(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  try {
    const payload = await request.json().catch(() => ({}));
    const body = new URLSearchParams({ action: 'delete', ids: JSON.stringify(Array.isArray(payload.ids) ? payload.ids : []), force: payload.force ? '1' : '0' });
    const response = await proxy(request, { method: 'POST', body });
    return responseFromMedia(response);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Media deletion failed.' }, { status: 503 }); }
}
