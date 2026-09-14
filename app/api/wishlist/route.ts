import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const slugSchema = z.object({ slug: z.string().trim().min(1).max(160) });

const currentUser = async () => {
  const session = await auth();
  if (!session?.user?.email) return null;
  return db.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
};

// GET /api/wishlist          -> { slugs: string[] } (fast heart hydration)
// GET /api/wishlist?full=1   -> saved stay cards for the account wishlist page
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  const items = await db.wishlistItem.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, select: { slug: true, createdAt: true } });
  const slugs = items.map((item) => item.slug);
  if (!new URL(request.url).searchParams.has('full')) return NextResponse.json({ slugs });
  const listings = slugs.length
    ? await db.listing.findMany({ where: { slug: { in: slugs }, status: 'LIVE' }, select: { slug: true, title: true, location: true, sellPrice: true, basePrice: true, images: true, category: true } })
    : [];
  const bySlug = new Map(listings.map((listing) => [listing.slug, listing]));
  const cards = slugs
    .map((slug) => bySlug.get(slug))
    .filter((listing): listing is NonNullable<typeof listing> => Boolean(listing))
    .map((listing) => ({
      slug: listing.slug,
      title: listing.title,
      location: listing.location,
      category: listing.category,
      price: Number(listing.sellPrice || listing.basePrice),
      basePrice: Number(listing.basePrice) > Number(listing.sellPrice) ? Number(listing.basePrice) : null,
      image: Array.isArray(listing.images) && typeof listing.images[0] === 'string' ? listing.images[0] : '/images/Logo.png',
    }));
  return NextResponse.json({ cards });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Sign in to save stays to your wishlist.' }, { status: 401 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  const parsed = slugSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid stay reference.' }, { status: 400 });
  const exists = await db.listing.findFirst({ where: { slug: parsed.data.slug, status: 'LIVE' }, select: { slug: true } });
  if (!exists) return NextResponse.json({ error: 'This stay is not available.' }, { status: 404 });
  await db.wishlistItem.upsert({ where: { userId_slug: { userId: user.id, slug: parsed.data.slug } }, create: { userId: user.id, slug: parsed.data.slug }, update: {} });
  return NextResponse.json({ saved: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  const slug = new URL(request.url).searchParams.get('slug')?.trim();
  if (!slug) return NextResponse.json({ error: 'Invalid stay reference.' }, { status: 400 });
  await db.wishlistItem.deleteMany({ where: { userId: user.id, slug } });
  return NextResponse.json({ saved: false });
}
