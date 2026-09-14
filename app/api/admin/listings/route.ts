import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { getAdminPartner, requireAdmin } from '@/lib/admin';
import { isFullBlogDocument, sanitizeBlogHtml } from '@/lib/sanitize-html';

const listingStatus = z.preprocess((value) => typeof value === 'string' ? value.trim().toUpperCase() : value, z.enum(['DRAFT', 'LIVE', 'PAUSED', 'PENDING_REVIEW']).default('DRAFT'));
const optionalStringList = z.array(z.string().trim().max(500)).default([]).transform((items) => items.map((item) => item.trim()).filter(Boolean));
const houseRuleSchema = z.object({ title: z.string().trim().max(120), text: z.string().trim().max(500) });
const optionalHouseRules = z.array(houseRuleSchema).max(30).optional().transform((rules) => rules ? rules.map((rule) => ({ title: rule.title.trim(), text: rule.text.trim() })).filter((rule) => rule.title && rule.text) : rules);
const accommodationSchema = z.object({ title: z.string().trim().max(160), description: z.string().trim().max(2000).optional().default(''), image: z.string().trim().max(1000).optional().default(''), bedrooms: z.coerce.number().int().nonnegative().max(50).optional().default(0), beds: z.coerce.number().int().nonnegative().max(100).optional().default(0) });
const optionalAccommodations = z.array(accommodationSchema).max(50).optional().transform((items) => items ? items.map((item) => ({ ...item, description: item.description.trim(), image: item.image.trim() })).filter((item) => item.title) : items);
const mealPlans = ['Breakfast included', 'Half board', 'Full board', 'Self-catering / no meals'] as const;
const optionalMealPlan = z.union([z.enum(mealPlans), z.literal(''), z.null()]).optional().transform((value) => value || null);
const landmarkSchema = z.object({ label: z.string().trim().max(120), distanceKm: z.coerce.number().nonnegative().optional(), order: z.coerce.number().int().nonnegative().optional() });
const serviceSchema = z.object({ label: z.string().trim().max(120), note: z.string().trim().max(160).optional().default(''), order: z.coerce.number().int().nonnegative().optional() });
const experienceSchema = z.object({ title: z.string().trim().max(120), note: z.string().trim().max(160).optional().default(''), order: z.coerce.number().int().nonnegative().optional() });
const listingSchema = z.object({ slug: z.string().trim().max(160).default(''), category: z.enum(['STAY', 'RIDE', 'RENTAL', 'ACTIVITY']).default('STAY'), title: z.string().trim().max(120).default('Untitled listing'), description: z.string().trim().default(''), location: z.string().trim().max(160).default(''), basePrice: z.coerce.number().nonnegative().default(0), sellPrice: z.coerce.number().nonnegative().default(0), images: optionalStringList, amenities: optionalStringList, details: z.record(z.string(), z.unknown()).default({}), mealPlan: optionalMealPlan, breakfastIncluded: z.boolean().default(false), cuisineNotes: z.string().trim().max(4000).optional().nullable().transform((value) => value || null), landmarks: z.array(landmarkSchema).max(30).default([]), services: z.array(serviceSchema).max(30).default([]), experiences: z.array(experienceSchema).max(30).default([]), houseRules: optionalHouseRules, accommodations: optionalAccommodations.default([]), status: listingStatus });

const ordered = <T extends { order?: number }>(items: T[]) => items.map((item, index) => ({ ...item, order: item.order ?? index }));

export async function GET(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const params = new URL(request.url).searchParams;
  const category = params.get('category');
  const search = params.get('search')?.trim();
  const status = params.get('status');
  const sort = params.get('sort') || 'newest';
  const listings = await db.listing.findMany({ where: { ...(category ? { category: category as 'STAY' | 'RIDE' | 'RENTAL' | 'ACTIVITY' } : {}), ...(status ? { status: status as 'DRAFT' | 'LIVE' | 'PAUSED' | 'PENDING_REVIEW' } : {}), ...(search ? { OR: [{ title: { contains: search } }, { location: { contains: search } }, { partner: { businessName: { contains: search } } }] } : {}) }, include: { partner: { select: { businessName: true } }, landmarks: { orderBy: { order: 'asc' } }, services: { orderBy: { order: 'asc' } }, experiences: { orderBy: { order: 'asc' } }, _count: { select: { bookings: true } } }, orderBy: sort === 'price' ? { sellPrice: 'desc' } : sort === 'alphabetical' ? { title: 'asc' } : { createdAt: 'desc' } });
  return NextResponse.json(listings);
}

export async function POST(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const parsed = listingSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Check the listing fields and try again.', details: parsed.error.flatten() }, { status: 400 });
  try {
    const partner = await getAdminPartner();
    const title = parsed.data.title || 'Untitled listing';
    const slug = parsed.data.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `listing-${Date.now()}`;
    const { details, houseRules, accommodations, landmarks, services, experiences, ...fields } = parsed.data;
    fields.description = isFullBlogDocument(fields.description) ? fields.description : sanitizeBlogHtml(fields.description);
    const listing = await db.listing.create({ data: { ...fields, details: details as Prisma.InputJsonObject, ...(houseRules ? { houseRules: houseRules as Prisma.InputJsonValue } : {}), ...(accommodations?.length ? { accommodations: accommodations as Prisma.InputJsonValue } : {}), landmarks: { create:ordered(landmarks).map((item) => ({ label: item.label, distanceKm: item.distanceKm ?? 0, order: item.order })) }, services: { create: ordered(services).map((item) => ({ label: item.label, note: item.note || null, order: item.order })) }, experiences: { create: ordered(experiences).map((item) => ({ title: item.title, note: item.note || null, order: item.order })) }, slug, title, partnerId: partner.id, basePrice: parsed.data.basePrice, sellPrice: parsed.data.sellPrice, category: (parsed.data.category || 'STAY') as 'STAY' | 'RIDE' | 'RENTAL' | 'ACTIVITY' } });
    return NextResponse.json(listing, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not create listing.' }, { status: 500 }); }
}
