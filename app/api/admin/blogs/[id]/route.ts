import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { blogUpdateSchema } from '@/lib/validations/blog';

function imageUrls(body: string, featuredImage?: string | null) { return [...new Set([featuredImage, ...[...body.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map((match) => match[1])].filter((url): url is string => Boolean(url)))]; }

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const parsed = blogUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Please complete all blog fields correctly.' }, { status: 400 });
  if (parsed.data.status === 'SCHEDULED' && (!parsed.data.scheduledAt || parsed.data.scheduledAt <= new Date())) return NextResponse.json({ error: 'Scheduled posts need a future publish time.' }, { status: 400 });
  if (parsed.data.status === 'PUBLISHED' && (!parsed.data.featuredImage || parsed.data.imageAltText === '')) return NextResponse.json({ error: 'Published blogs need a featured image and image alt text.' }, { status: 400 });
  try {
    const existing = await db.blogPost.findUnique({ where: { id: params.id }, select: { slug: true, publishedAt: true, body: true, featuredImage: true } });
    if (!existing) return NextResponse.json({ error: 'Blog not found.' }, { status: 404 });
    const data = { ...parsed.data, imageUrls: imageUrls(parsed.data.body ?? existing.body, parsed.data.featuredImage === undefined ? existing.featuredImage : parsed.data.featuredImage), publishedAt: parsed.data.status === 'PUBLISHED' ? existing.publishedAt ?? new Date() : null, scheduledAt: parsed.data.status === 'SCHEDULED' ? parsed.data.scheduledAt : null };
    const blog = await db.blogPost.update({ where: { id: params.id }, data });
    revalidatePath('/blog'); revalidatePath(`/blog/${existing.slug}`); if (blog.slug !== existing.slug) revalidatePath(`/blog/${blog.slug}`);
    return NextResponse.json(blog);
  } catch (error) { return NextResponse.json({ error: error instanceof Error && 'code' in error && error.code === 'P2002' ? 'That slug is already in use.' : 'Could not update blog.' }, { status: 400 }); }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const blog = await db.blogPost.findUnique({ where: { id: params.id }, select: { slug: true } });
  if (!blog) return NextResponse.json({ error: 'Blog not found.' }, { status: 404 });
  await db.blogPost.delete({ where: { id: params.id } });
  revalidatePath('/blog'); revalidatePath(`/blog/${blog.slug}`);
  return NextResponse.json({ deleted: true });
}
