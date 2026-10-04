/**
 * One-off data fill: apply seasonal (peak / off-season) rates to the hotel
 * catalogue.
 *
 * The admin Seasonal Pricing screen writes these rates through
 * `/api/admin/pricing/prices`. Deploying code sets no numbers of its own, so
 * this applies them directly and is safe to re-run against any environment:
 *
 *   node scripts/apply-seasonal-prices.mjs             # apply
 *   node scripts/apply-seasonal-prices.mjs --dry-run   # report only, write nothing
 *
 * Rows are addressed by slug and only written when a stored rate differs, so a
 * second run is a no-op.
 *
 * Note: an off-season rate equal to the base price renders exactly like leaving
 * it blank — `resolveDisplayPrice` falls back to `sellPrice` either way. Those
 * rows are still written, so the admin grid shows the value that was asked for.
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const RATES = [
  { slug: 'happy-himalyan-home-by-kainchidarshan', seasonPrice: 60000, offSeasonPrice: 40000 },
  { slug: 'whispering-oaks', seasonPrice: null, offSeasonPrice: 49999 },
  { slug: 'a2-villa', seasonPrice: null, offSeasonPrice: 12000 },
  { slug: 'rnr-stay-by-kainchidarshan', seasonPrice: null, offSeasonPrice: 4000 },
  { slug: 'noval-nook-kainchidarshan', seasonPrice: null, offSeasonPrice: 25000 },
  { slug: 'kainchidarshan-by-lake-darshan', seasonPrice: null, offSeasonPrice: 1999 },
  { slug: 'kainchidarshan-by-sanobar', seasonPrice: null, offSeasonPrice: 2199 },
];

const DRY_RUN = process.argv.includes('--dry-run');

/**
 * MySQL `DECIMAL` arrives as a string through Prisma, so a stored rate and the
 * number we want have to be compared numerically rather than by identity.
 */
function sameAmount(stored, next) {
  if (stored === null || stored === undefined) return next === null;
  if (next === null) return false;
  return Number(stored) === Number(next);
}

const show = (value) => (value === null || value === undefined ? 'blank' : value);

async function main() {
  const slugs = RATES.map((rate) => rate.slug);
  const listings = await db.listing.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true, title: true, sellPrice: true, seasonPrice: true, offSeasonPrice: true },
  });
  const bySlug = new Map(listings.map((listing) => [listing.slug, listing]));

  const missing = slugs.filter((slug) => !bySlug.has(slug));
  if (missing.length) throw new Error(`No listing matches: ${missing.join(', ')}`);

  let changed = 0;
  let skipped = 0;

  for (const rate of RATES) {
    const listing = bySlug.get(rate.slug);
    const base = Number(listing.sellPrice);
    const alreadyCorrect = sameAmount(listing.seasonPrice, rate.seasonPrice) && sameAmount(listing.offSeasonPrice, rate.offSeasonPrice);

    if (alreadyCorrect) {
      skipped += 1;
      console.log(`unchanged   ${listing.title}`);
      console.log(`            base ${base} | off-season ${show(listing.offSeasonPrice)} | peak ${show(listing.seasonPrice)}`);
      continue;
    }

    changed += 1;
    console.log(`${DRY_RUN ? 'would update' : 'updating'}   ${listing.title}`);
    console.log(`            base ${base} | off-season ${show(listing.offSeasonPrice)} -> ${show(rate.offSeasonPrice)} | peak ${show(listing.seasonPrice)} -> ${show(rate.seasonPrice)}`);

    if (rate.offSeasonPrice !== null && Number(rate.offSeasonPrice) === base) {
      console.log('            note: off-season equals the base price, so this renders the same as leaving it blank');
    }
    if (rate.seasonPrice !== null && Number(rate.seasonPrice) < base) {
      console.log('            warning: peak rate is below the base price the rest of the admin still edits');
    }

    if (!DRY_RUN) {
      await db.listing.update({
        where: { slug: rate.slug },
        data: { seasonPrice: rate.seasonPrice, offSeasonPrice: rate.offSeasonPrice },
      });
    }
  }

  console.log(`\n${DRY_RUN ? '[dry run] ' : ''}${changed} listing(s) ${DRY_RUN ? 'to write' : 'updated'}, ${skipped} already correct.`);
  if (!DRY_RUN) {
    console.log('Run `npm run build` / redeploy so the cached catalogue is purged.');
  }
}

main()
  .catch((error) => {
    console.error('Failed to apply seasonal prices:', error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());