import { access, mkdir, readdir, readFile, stat, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

const types: Record<string, { extension: string; kind: 'IMAGE' | 'VIDEO'; limit: number }> = {
  'image/jpeg': { extension: 'jpg', kind: 'IMAGE', limit: 10 * 1024 * 1024 },
  'image/png': { extension: 'png', kind: 'IMAGE', limit: 10 * 1024 * 1024 },
  'image/webp': { extension: 'webp', kind: 'IMAGE', limit: 10 * 1024 * 1024 },
  'video/mp4': { extension: 'mp4', kind: 'VIDEO', limit: 100 * 1024 * 1024 },
  'video/quicktime': { extension: 'mov', kind: 'VIDEO', limit: 100 * 1024 * 1024 },
};

async function storage() {
  const configuredDirectory = process.env.HOSTINGER_IMAGE_UPLOAD_DIR;
  const configuredUrl = (process.env.HOSTINGER_IMAGE_UPLOAD_URL || '').replace(/\/$/, '');

  if (configuredDirectory && configuredUrl && !process.env.VERCEL) {
    try {
      await access(configuredDirectory);
      return { directory: configuredDirectory, publicUrl: configuredUrl };
    } catch (error) {
      if (process.env.NODE_ENV === 'production') throw new Error(`Configured Hostinger media directory is not accessible: ${configuredDirectory}`);
    }
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Production media storage is not configured. Set HOSTINGER_IMAGE_UPLOAD_DIR and HOSTINGER_IMAGE_UPLOAD_URL on the deployed app.');
  }

  const fallbackDirectory = path.join(process.cwd(), 'public', 'uploads', 'images');
  const fallbackPublicUrl = '/uploads/images';
  await mkdir(fallbackDirectory, { recursive: true });
  return { directory: fallbackDirectory, publicUrl: fallbackPublicUrl };
}

type AssetMeta = { filename: string; altText: string | null };

const metaPath = (directory: string, filename: string) => path.join(directory, `.${filename}.json`);

async function readMeta(directory: string, filename: string): Promise<AssetMeta> {
  try {
    return JSON.parse(await readFile(metaPath(directory, filename), 'utf8')) as AssetMeta;
  } catch {
    return { filename, altText: null };
  }
}

async function writeMeta(directory: string, filename: string, meta: AssetMeta) {
  await writeFile(metaPath(directory, filename), JSON.stringify(meta), 'utf8');
}

async function assetsFromStorage() {
  const target = await storage();
  const entries = await readdir(target.directory, { withFileTypes: true });
  const assets = await Promise.all(entries.filter((entry) => entry.isFile() && !entry.name.startsWith('.')).map(async (entry) => {
    const file = await stat(path.join(target.directory, entry.name));
    const extension = path.extname(entry.name).toLowerCase();
    const mimeType = Object.entries(types).find(([, config]) => `.${config.extension}` === extension)?.[0];
    if (!mimeType) return null;
    const meta = await readMeta(target.directory, entry.name);
    const url = `${target.publicUrl}/${encodeURIComponent(entry.name)}`;
    return { id: entry.name, filename: meta.filename, url, mimeType, size: file.size, width: null, height: null, altText: meta.altText, thumbnailUrl: mimeType.startsWith('image/') ? url : null, createdAt: file.birthtime.toISOString(), usage: [] };
  }));
  return { target, assets: assets.filter((asset): asset is NonNullable<typeof asset> => Boolean(asset)) };
}

export async function GET(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const params = new URL(request.url).searchParams;
  const search = params.get('search')?.trim().toLowerCase() || '';
  const type = params.get('type') || 'all';
  const sort = params.get('sort') || 'newest';
  const page = Math.max(1, Number(params.get('page') || 1));
  const pageSize = 40;
  const { assets } = await assetsFromStorage();
  const filtered = assets.filter((asset) => (!search || asset.filename.toLowerCase().includes(search) || asset.url.toLowerCase().includes(search)) && (type === 'all' || type === 'images' && asset.mimeType.startsWith('image/') || type === 'videos' && asset.mimeType.startsWith('video/')));
  filtered.sort((left, right) => sort === 'oldest' ? left.createdAt.localeCompare(right.createdAt) : sort === 'name' ? left.filename.localeCompare(right.filename) : sort === 'size' ? right.size - left.size : right.createdAt.localeCompare(left.createdAt));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  return NextResponse.json({ assets: pageItems.map((item) => ({ ...item, kind: item.mimeType.startsWith('video/') ? 'VIDEO' : 'IMAGE' })), total: filtered.length, page, pageSize, pages: Math.ceil(filtered.length / pageSize) });
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
    await writeMeta(target.directory, filename, { filename: file.name, altText: null });
    const asset = { id: filename, filename: file.name, url: `${target.publicUrl}/${encodeURIComponent(filename)}`, mimeType: file.type, size: file.size, width: null, height: null, altText: null, thumbnailUrl: config.kind === 'IMAGE' ? url : null, createdAt: new Date().toISOString(), usage: [] };
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
    const { target } = await assetsFromStorage();
    const filename = path.basename(id);
    const filePath = path.join(target.directory, filename);
    const file = await stat(filePath).catch(() => null);
    if (!file) return NextResponse.json({ error: 'Media file not found.' }, { status: 404 });
    const extension = path.extname(filename).toLowerCase();
    const mimeType = Object.entries(types).find(([, config]) => `.${config.extension}` === extension)?.[0] || '';
    const assetMeta = await readMeta(target.directory, filename);
    const replacement = formData.get('file');
    if (replacement instanceof File) {
      if (replacement.type !== mimeType || replacement.size > (mimeType.startsWith('video/') ? 100 : 10) * 1024 * 1024) return NextResponse.json({ error: 'Replacement file type or size is invalid.' }, { status: 400 });
      await writeFile(filePath, Buffer.from(await replacement.arrayBuffer()));
    }
    const displayName = typeof formData.get('filename') === 'string' ? String(formData.get('filename')).trim() : assetMeta.filename;
    const altText = typeof formData.get('altText') === 'string' ? String(formData.get('altText')).trim() : assetMeta.altText;
    await writeMeta(target.directory, filename, { filename: displayName || assetMeta.filename, altText });
    return NextResponse.json({ asset: { id: filename, filename: displayName || assetMeta.filename, url: `${target.publicUrl}/${encodeURIComponent(filename)}`, mimeType, size: (await stat(filePath)).size, altText } });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Media update failed.' }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  try {
    const { ids, force } = await request.json() as { ids?: string[]; force?: boolean };
    void force;
    const { target } = await assetsFromStorage();
    const filenames = (ids || []).map((id) => path.basename(id));
    await Promise.all(filenames.flatMap((filename) => [unlink(path.join(target.directory, filename)).catch(() => undefined), unlink(metaPath(target.directory, filename)).catch(() => undefined)]));
    return NextResponse.json({ deleted: filenames });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Media deletion failed.' }, { status: 400 }); }
}
