const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
async function main() {
  const listing = await db.listing.findFirst({ where: { status: 'LIVE', category: 'STAY' }, select: { slug: true, title: true } });
  console.log('LIVE_SLUG', JSON.stringify(listing));
}
main().finally(() => db.$disconnect());
