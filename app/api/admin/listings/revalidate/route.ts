import { NextResponse } from 'next/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';

const revalidateSchema = z.object({ slug: z.string().trim().min(1).max(160) });

export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const parsed = revalidateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'A listing slug is required.' }, { status: 400 });
  try {
    revalidatePath(`/stays/${parsed.data.slug}`);
    revalidatePath('/stays');
  } catch {
    /* revalidation is best-effort outside a request lifecycle */
  }
  return NextResponse.json({ revalidated: true });
}
