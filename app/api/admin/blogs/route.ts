import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { blogSchema } from '@/lib/validations/blog';

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  return NextResponse.json(await db.blogPost.findMany({ orderBy: { updatedAt: 'desc' } }));
}

export async function POST(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const parsed = blogSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Please complete all blog fields correctly.', details: parsed.error.flatten() }, { status: 400 });
  if (parsed.data.status === 'PUBLISHED' && (!parsed.data.featuredImage || !parsed.data.imageAltText)) return NextResponse.json({ error: 'Published blogs need a featured image and image alt text.' }, { status: 400 });
  try {
    const blog = await db.blogPost.create({ data: { ...parsed.data, publishedAt: parsed.data.status === 'PUBLISHED' ? new Date() : null } });
    revalidatePath('/blog'); revalidatePath(`/blog/${blog.slug}`);
    return NextResponse.json(blog, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && 'code' in error && error.code === 'P2002' ? 'That slug is already in use.' : 'Could not create blog.' }, { status: 400 });
  }
}
