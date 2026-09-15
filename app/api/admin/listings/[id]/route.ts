import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { isFullBlogDocument, sanitizeBlogHtml } from '@/lib/sanitize-html';
import { slugifyTitle } from '@/lib/slug';

const updateStatus = z.preprocess((value) => typeof value === 'string' ? value.trim().toUpperCase() : value, z.enum(['DRAFT', 'LIVE', 'PAUSED', 'PENDING_REVIEW']).optional());
const optionalStringList = z.array(z.string().trim().max(500)).optional().transform((items) => items ? items.map((item) => item.trim()).filter(Boolean) : items);
const houseRuleSchema = z.object({ title: z.string().trim().max(120), text: z.string().trim().max(500) });
const optionalHouseRules = z.array(houseRuleSchema).max(30).optional().transform((rules) => rules ? rules.map((rule) => ({ title: rule.title.trim(), text: rule.text.trim() })).filter((rule) => rule.title && rule.text) : rules);
const accommodationSchema = z.object({ title: z.string().trim().max(160), description: z.string().trim().max(2000).optional().default(''), image: z.string().trim().max(1000).optional().default(''), images: z.array(z.string().trim().max(1000)).max(20).optional().default([]), price: z.coerce.number().nonnegative().max(10000000).optional().default(0), bedrooms: z.coerce.number().int().nonnegative().max(50).optional().default(0), beds: z.coerce.number().int().nonnegative().max(100).optional().default(0) });
const optionalAccommodations = z.array(accommodationSchema).max(50).optional().transform((items) => items ? items.map((item) => ({ ...item, description: item.description.trim(), image: item.image.trim(), images: item.images.map((url) => url.trim()).filter(Boolean) })).filter((item) => item.title) : items);
const mealPlans = ['Breakfast included', 'Half board', 'Full board', 'Self-catering / no meals'] as const;
const optionalMealPlan = z.union([z.enum(mealPlans), z.literal(''), z.null()]).optional().transform((value) => value || null);
const landmarkSchema = z.object({ label: z.string().trim().max(120), distanceKm: z.coerce.number().nonnegative().optional(), order: z.coerce.number().int().nonnegative().optional() });
const serviceSchema = z.object({ label: z.string().trim().max(120), note: z.string().trim().max(160).optional().default(''), order: z.coerce.number().int().nonnegative().optional() });
const experienceSchema = z.object({ title: z.string().trim().max(120), note: z.string().trim().max(160).optional().default(''), order: z.coerce.number().int().nonnegative().optional() });
const updateSchema = z.object({ slug: z.string().trim().max(160).optional(), category: z.preprocess((value) => typeof value === 'string' ? value.trim().toUpperCase() : value, z.enum(['STAY', 'RIDE', 'RENTAL', 'ACTIVITY']).optional()), title: z.string().trim().max(120).optional(), description: z.string().optional(), location: z.string().trim().max(160).optional(), basePrice: z.coerce.number().nonnegative().optional(), sellPrice: z.coerce.number().nonnegative().optional(), images: optionalStringList, amenities: optionalStringList, details: z.record(z.string(), z.unknown()).optional(), mealPlan: optionalMealPlan, breakfastIncluded: z.boolean().optional(), cuisineNotes: z.string().trim().max(4000).optional().nullable().transform((value) => value || null), landmarks: z.array(landmarkSchema).max(30).optional(), services: z.array(serviceSchema).max(30).optional(), experiences: z.array(experienceSchema).max(30).optional(), houseRules: optionalHouseRules, accommodations: optionalAccommodations, partnerId: z.string().trim().optional(), status: updateStatus });

const ordered = <T extends { order?: number }>(items: T[]) => items.map((item, index) => ({ ...item, order: item.order ?? index }));

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Check the listing fields and try again.', details: parsed.error.flatten() }, { status: 400 });
  const existing = await db.listing.findUnique({ where: { id: params.id }, select: { category: true, slug: true, title: true, description: true, basePrice: true, sellPrice: true, images: true, location: true } });
  if (!existing) return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
  const { category, partnerId, details, houseRules, accommodations, landmarks, services, experiences, ...fields } = parsed.data;
  if (fields.slug !== undefined) fields.slug = slugifyTitle(fields.slug || existing.title) || existing.slug;
  const data = { ...fields, ...(fields.description !== undefined ? { description: isFullBlogDocument(fields.description) ? fields.description : sanitizeBlogHtml(fields.description) } : {}), ...(details ? { details: details as Prisma.InputJsonObject } : {}), ...(houseRules !== undefined ? { houseRules: houseRules as Prisma.InputJsonValue } : {}), ...(accommodations !== undefined ? { accommodations: accommodations as Prisma.InputJsonValue } : {}), ...(category ? { category } : {}), ...(partnerId ? { partner: { connect: { id: partnerId } } } : {}) };
  const listing = await db.$transaction(async (tx) => {
    const updated = await tx.listing.update({ where: { id: params.id }, data });
    if (landmarks !== undefined) {
      await tx.listingLandmark.deleteMany({ where: { listingId: params.id } });
      if (landmarks.length) await tx.listingLandmark.createMany({ data: ordered(landmarks).map((item) => ({ listingId: params.id, label: item.label, distanceKm: item.distanceKm ?? 0, order: item.order })) });
    }
    if (services !== undefined) {
      await tx.listingService.deleteMany({ where: { listingId: params.id } });
      if (services.length) await tx.listingService.createMany({ data: ordered(services).map((item) => ({ listingId: params.id, label: item.label, note: item.note || null, order: item.order })) });
    }
    if (experiences !== undefined) {
      await tx.listingExperience.deleteMany({ where: { listingId: params.id } });
      if (experiences.length) await tx.listingExperience.createMany({ data: ordered(experiences).map((item) => ({ listingId: params.id, title: item.title, note: item.note || null, order: item.order })) });
    }
    return updated;
  });
  try {
    if (existing.slug !== listing.slug) revalidatePath(`/stays/${existing.slug}`);
    revalidatePath(`/stays/${listing.slug}`);
    revalidatePath('/stays');
  } catch {
    /* revalidation is best-effort outside a request lifecycle */
  }
  return NextResponse.json(listing);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const bookings = await db.booking.count({ where: { listingId: params.id, status: { not: 'CANCELLED' } } });
  if (bookings) return NextResponse.json({ error: 'Listings with active bookings cannot be deleted. Pause them instead.' }, { status: 409 });
  await db.listing.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
