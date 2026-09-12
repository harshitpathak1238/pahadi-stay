import { NextResponse } from 'next/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

const faqSchema = z.object({
  question: z.string().trim().min(1, 'Question is required.').max(500, 'Question must be 500 characters or fewer.'),
  answer: z.string().trim().min(1, 'Answer is required.').max(2000, 'Answer must be 2000 characters or fewer.'),
  order: z.coerce.number().int().min(0).optional(),
});

function revalidateStay(slug?: string | null) {
  try {
    if (slug) revalidatePath(`/stays/${slug}`);
    revalidatePath('/stays');
  } catch {
    /* revalidation is best-effort outside a request lifecycle */
  }
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const listing = await db.listing.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!listing) return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
  const faqs = await db.listingFaq.findMany({ where: { listingId: params.id }, orderBy: { order: 'asc' } });
  return NextResponse.json(faqs);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const listing = await db.listing.findUnique({ where: { id: params.id }, select: { id: true, slug: true } });
  if (!listing) return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
  const parsed = faqSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Check the FAQ fields and try again.', details: parsed.error.flatten() }, { status: 400 });
  const count = await db.listingFaq.count({ where: { listingId: params.id } });
  const faq = await db.listingFaq.create({
    data: { listingId: params.id, question: parsed.data.question, answer: parsed.data.answer, order: parsed.data.order ?? count },
  });
  revalidateStay(listing.slug);
  return NextResponse.json(faq, { status: 201 });
}
