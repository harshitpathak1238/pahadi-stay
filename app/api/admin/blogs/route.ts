import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { blogSchema } from '@/lib/validations/blog';
import { sanitizeBlogHtml } from '@/lib/sanitize-html';

function imageUrls(body: string, featuredImage?: string | null) { return [...new Set([featuredImage, ...[...body.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map((match) => match[1])].filter((url): url is string => Boolean(url)))]; }
function isFullDocument(body: string) { return /<!doctype\s+html|<html[\s>]/i.test(body); }

export async function GET(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const params = new URL(request.url).searchParams;
  const status = params.get('status');
  const search = params.get('search')?.trim();
  const sort = params.get('sort') === 'oldest' ? 'asc' : 'desc';
  const [blogs, authors] = await Promise.all([
    db.blogPost.findMany({ where: { ...(status ? { status: status as 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED' } : {}), ...(search ? { OR: [{ title: { contains: search } }, { slug: { contains: search } }, { authorName: { contains: search } }] } : {}) }, include: { author: { select: { id: true, name: true, email: true } } }, orderBy: { updatedAt: sort } }),
    db.user.findMany({ where: { role: { in: ['ADMIN', 'OWNER', 'STAFF'] } }, select: { id: true, name: true, email: true }, orderBy: { name: 'asc' } }),
  ]);
  return NextResponse.json({ blogs, authors });
}

export async function POST(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'The blog request was not valid JSON.' }, { status: 400 }); }
  const parsed = blogSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Please complete all blog fields correctly.', details: parsed.error.flatten() }, { status: 422 });
  if (parsed.data.status === 'SCHEDULED' && parsed.data.scheduledAt && parsed.data.scheduledAt <= new Date()) return NextResponse.json({ error: 'Scheduled posts need a future publish time.' }, { status: 422 });
  try {
    const body = isFullDocument(parsed.data.body) ? parsed.data.body : sanitizeBlogHtml(parsed.data.body);
    const blog = await db.blogPost.create({ data: { ...parsed.data, body, imageUrls: imageUrls(body, parsed.data.featuredImage), publishedAt: parsed.data.status === 'PUBLISHED' ? new Date() : null, scheduledAt: parsed.data.status === 'SCHEDULED' ? parsed.data.scheduledAt : null } });
    revalidatePath('/blog'); revalidatePath(`/blog/${blog.slug}`);
    return NextResponse.json(blog, { status: 201 });
  } catch (error) {
    console.error('Blog create failed:', error);
    const isDuplicate = error instanceof Error && 'code' in error && error.code === 'P2002';
    return NextResponse.json({ error: isDuplicate ? 'That slug is already in use.' : 'Could not create blog.', ...(process.env.NODE_ENV !== 'production' && error instanceof Error ? { details: error.message } : {}) }, { status: isDuplicate ? 409 : 500 });
  }
}
