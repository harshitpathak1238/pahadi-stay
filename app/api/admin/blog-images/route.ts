import { access, mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

const allowedTypes: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' };

async function getStorage() {
  const configuredDirectory = process.env.HOSTINGER_IMAGE_UPLOAD_DIR;
  const configuredUrl = (process.env.HOSTINGER_IMAGE_UPLOAD_URL || '').replace(/\/$/, '');
  if (configuredDirectory && configuredUrl && !process.env.VERCEL) {
    try { await access(configuredDirectory); return { directory: configuredDirectory, publicUrl: configuredUrl }; } catch { return { directory: path.join(process.cwd(), 'public', 'uploads', 'images'), publicUrl: '/uploads/images' }; }
  }
  return { directory: path.join(process.cwd(), 'public', 'uploads', 'images'), publicUrl: '/uploads/images' };
}

export async function POST(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'Choose an image or video file.' }, { status: 400 });
    const extension = allowedTypes[file.type];
    if (!extension) return NextResponse.json({ error: 'Supported files: JPG, PNG, WebP, GIF, MP4, WebM, and MOV.' }, { status: 400 });
    if (file.size > 25 * 1024 * 1024) return NextResponse.json({ error: 'Images and videos must be smaller than 25 MB.' }, { status: 400 });
    if (process.env.VERCEL) return NextResponse.json({ error: 'Hostinger storage is available only when this API runs on Hostinger. Deploy the Next.js app there to enable uploads.' }, { status: 503 });
    const storage = await getStorage();
    const directory = storage.directory;
    await mkdir(directory, { recursive: true });
    const filename = `${randomUUID()}.${extension}`;
    await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ url: `${storage.publicUrl}/${filename}` }, { status: 201 });
  } catch (error) {
    console.error('Blog image upload failed:', error);
    return NextResponse.json({ error: 'Image storage is unavailable. Configure writable production storage for blog uploads.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  try {
    const body = await request.json();
    const imageUrl = typeof body.url === 'string' ? body.url : '';
    const storage = await getStorage();
    const publicUrl = storage.publicUrl;
    if (!imageUrl || !imageUrl.startsWith(`${publicUrl}/`)) return NextResponse.json({ error: 'That image is not managed by this upload service.' }, { status: 400 });
    if (process.env.VERCEL) return NextResponse.json({ error: 'Hostinger files can be removed only when this API runs on Hostinger.' }, { status: 409 });
    const filename = path.basename(new URL(imageUrl, 'http://localhost').pathname);
    await unlink(path.join(storage.directory, filename));
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Blog image delete failed:', error);
    return NextResponse.json({ error: 'Could not remove the uploaded image.' }, { status: 500 });
  }
}
