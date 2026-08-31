import { access, mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

const types: Record<string, { extension: string; kind: 'IMAGE' | 'VIDEO'; limit: number }> = {
  'image/jpeg': { extension: 'jpg', kind: 'IMAGE', limit: 10 * 1024 * 1024 },
  'image/png': { extension: 'png', kind: 'IMAGE', limit: 10 * 1024 * 1024 },
  'image/webp': { extension: 'webp', kind: 'IMAGE', limit: 10 * 1024 * 1024 },
  'video/mp4': { extension: 'mp4', kind: 'VIDEO', limit: 100 * 1024 * 1024 },
  'video/quicktime': { extension: 'mov', kind: 'VIDEO', limit: 100 * 1024 * 1024 },
};

async function storage() {
  const directory = process.env.HOSTINGER_IMAGE_UPLOAD_DIR;
  const publicUrl = (process.env.HOSTINGER_IMAGE_UPLOAD_URL || '').replace(/\/$/, '');
  if (!directory || !publicUrl || process.env.VERCEL) throw new Error('Hostinger media storage requires this API to run on Hostinger.');
  await access(directory);
  return { directory, publicUrl };
}

async function usages(urls: string[]) {
  const [listings, blogs] = await Promise.all([
    db.listing.findMany({ select: { id: true, title: true, images: true } }),
    db.blogPost.findMany({ select: { id: true, title: true, featuredImage: true, body: true } }),
  ]);
  return urls.map((url) => ({ url, references: [
    ...listings.filter((item) => JSON.stringify(item.images).includes(url)).map((item) => ({ type: 'Listing', id: item.id, title: item.title })),
    ...blogs.filter((item) => item.featuredImage === url || item.body.includes(url)).map((item) => ({ type: 'Blog', id: item.id, title: item.title })),
  ] }));
}

export async function GET(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const params = new URL(request.url).searchParams;
  const search = params.get('search')?.trim().toLowerCase() || '';
  const type = params.get('type') || 'all';
  const sort = params.get('sort') || 'newest';
  const page = Math.max(1, Number(params.get('page') || 1));
  const pageSize = 40;
  const orderBy = sort === 'oldest' ? { createdAt: 'asc' as const } : sort === 'name' ? { filename: 'asc' as const } : sort === 'size' ? { size: 'desc' as const } : { createdAt: 'desc' as const };
  const assets = await db.mediaAsset.findMany({ where: { ...(search ? { filename: { contains: search } } : {}), ...(type === 'images' ? { mimeType: { startsWith: 'image/' } } : {}), ...(type === 'videos' ? { mimeType: { startsWith: 'video/' } } : {}) }, orderBy });
  const pageItems = assets.slice((page - 1) * pageSize, page * pageSize);
  const usage = await usages(pageItems.map((item) => item.url));
  return NextResponse.json({ assets: pageItems.map((item) => ({ ...item, kind: item.mimeType.startsWith('video/') ? 'VIDEO' : 'IMAGE', usage: usage.find((entry) => entry.url === item.url)?.references || [] })), total: assets.length, page, pageSize, pages: Math.ceil(assets.length / pageSize) });
}

export async function POST(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'Choose an image or video file.' }, { status: 400 });
    const config = types[file.type];
    if (!config) return NextResponse.json({ error: 'Supported files: JPG, PNG, WebP, MP4, and MOV.' }, { status: 400 });
    if (file.size > config.limit) return NextResponse.json({ error: `${config.kind === 'IMAGE' ? 'Images' : 'Videos'} must be smaller than ${config.kind === 'IMAGE' ? '10 MB' : '100 MB'}.` }, { status: 413 });
    const target = await storage();
    const filename = `${randomUUID()}.${config.extension}`;
    await mkdir(target.directory, { recursive: true });
    await writeFile(path.join(target.directory, filename), Buffer.from(await file.arrayBuffer()));
    const url = `${target.publicUrl}/${filename}`;
    const asset = await db.mediaAsset.create({ data: { filename: file.name, url, mimeType: file.type, size: file.size, thumbnailUrl: config.kind === 'IMAGE' ? url : null } });
    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Media upload failed.' }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  try {
    const formData = await request.formData();
    const id = String(formData.get('id') || '');
    const asset = await db.mediaAsset.findUnique({ where: { id } });
    if (!asset) return NextResponse.json({ error: 'Media file not found.' }, { status: 404 });
    const replacement = formData.get('file');
    if (replacement instanceof File) {
      if (replacement.type !== asset.mimeType || replacement.size > (asset.mimeType.startsWith('video/') ? 100 : 10) * 1024 * 1024) return NextResponse.json({ error: 'Replacement file type or size is invalid.' }, { status: 400 });
      const target = await storage();
      await writeFile(path.join(target.directory, path.basename(new URL(asset.url).pathname)), Buffer.from(await replacement.arrayBuffer()));
    }
    const filename = typeof formData.get('filename') === 'string' ? String(formData.get('filename')).trim() : asset.filename;
    const altText = typeof formData.get('altText') === 'string' ? String(formData.get('altText')).trim() : asset.altText;
    const updated = await db.mediaAsset.update({ where: { id }, data: { filename: filename || asset.filename, altText } });
    return NextResponse.json({ asset: updated });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Media update failed.' }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  try {
    const { ids, force } = await request.json() as { ids?: string[]; force?: boolean };
    const assets = await db.mediaAsset.findMany({ where: { id: { in: ids || [] } } });
    const references = await usages(assets.map((asset) => asset.url));
    const used = references.filter((entry) => entry.references.length);
    if (used.length && !force) return NextResponse.json({ error: 'Some files are still in use.', usage: used }, { status: 409 });
    const target = await storage();
    await Promise.all(assets.map((asset) => unlink(path.join(target.directory, path.basename(new URL(asset.url).pathname))).catch(() => undefined)));
    await db.mediaAsset.deleteMany({ where: { id: { in: assets.map((asset) => asset.id) } } });
    return NextResponse.json({ deleted: assets.map((asset) => asset.id) });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Media deletion failed.' }, { status: 400 }); }
}
