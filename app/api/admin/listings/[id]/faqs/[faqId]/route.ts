import { NextResponse } from 'next/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

const faqUpdateSchema = z
  .object({
    question: z.string().trim().min(1, 'Question is required.').max(500, 'Question must be 500 characters or fewer.').optional(),
    answer: z.string().trim().min(1, 'Answer is required.').max(2000, 'Answer must be 2000 characters or fewer.').optional(),
    order: z.coerce.number().int().min(0).optional(),
  })
  .refine((value) => value.question !== undefined || value.answer !== undefined || value.order !== undefined, {
    message: 'Provide at least one field to update.',
  });

function revalidateStay(slug?: string | null) {
  try {
    if (slug) revalidatePath(`/stays/${slug}`);
    revalidatePath('/stays');
  } catch {
    /* revalidation is best-effort outside a request lifecycle */
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string; faqId: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const parsed = faqUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Check the FAQ fields and try again.', details: parsed.error.flatten() }, { status: 400 });
  const existing = await db.listingFaq.findUnique({ where: { id: params.faqId }, include: { listing: { select: { id: true, slug: true } } } });
  if (!existing || existing.listingId !== params.id) return NextResponse.json({ error: 'FAQ not found.' }, { status: 404 });
  const faq = await db.listingFaq.update({ where: { id: params.faqId }, data: parsed.data });
  revalidateStay(existing.listing.slug);
  return NextResponse.json(faq);
}

export async function DELETE(_request: Request, { params }: { params: { id: string; faqId: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const existing = await db.listingFaq.findUnique({ where: { id: params.faqId }, include: { listing: { select: { id: true, slug: true } } } });
  if (!existing || existing.listingId !== params.id) return NextResponse.json({ error: 'FAQ not found.' }, { status: 404 });
  await db.listingFaq.delete({ where: { id: params.faqId } });
  revalidateStay(existing.listing.slug);
  return NextResponse.json({ deleted: true });
}
