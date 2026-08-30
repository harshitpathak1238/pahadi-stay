import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

function authorized(request: Request) { return Boolean(process.env.CRON_SECRET && request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`); }

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const now = new Date();
  const result = await db.blogPost.updateMany({ where: { status: 'SCHEDULED', scheduledAt: { lte: now } }, data: { status: 'PUBLISHED', publishedAt: now } });
  if (result.count) revalidatePath('/blog');
  return NextResponse.json({ published: result.count });
}