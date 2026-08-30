import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { blogSchema } from '@/lib/validations/blog';

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
  const parsed = blogSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Please complete all blog fields correctly.', details: parsed.error.flatten() }, { status: 400 });
  if (parsed.data.status === 'SCHEDULED' && (!parsed.data.scheduledAt || parsed.data.scheduledAt <= new Date())) return NextResponse.json({ error: 'Scheduled posts need a future publish time.' }, { status: 400 });
  if (parsed.data.status === 'PUBLISHED' && (!parsed.data.featuredImage || !parsed.data.imageAltText)) return NextResponse.json({ error: 'Published blogs need a featured image and image alt text.' }, { status: 400 });
  try {
    const blog = await db.blogPost.create({ data: { ...parsed.data, publishedAt: parsed.data.status === 'PUBLISHED' ? new Date() : null, scheduledAt: parsed.data.status === 'SCHEDULED' ? parsed.data.scheduledAt : null } });
    revalidatePath('/blog'); revalidatePath(`/blog/${blog.slug}`);
    return NextResponse.json(blog, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && 'code' in error && error.code === 'P2002' ? 'That slug is already in use.' : 'Could not create blog.' }, { status: 400 });
  }
}
