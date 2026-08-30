const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

(async () => {
  const email = 'harshitpathak1238@gmail.com';
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true, passwordHash: true }
  });
  console.log('USER_CHECK', JSON.stringify(user, null, 2));

  const partner = await db.partner.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, businessName: 'Verification Partner', category: 'STAY', verificationStatus: 'VERIFIED' }
  });

  const beforePackageCount = await db.package.count();
  const beforeListingCount = await db.listing.count();

  const pkg = await db.package.create({
    data: {
      title: 'Verification Package Test',
      description: 'Temporary package created for admin verification.',
      listingIds: [],
      price: 1999
    }
  });

  const listing = await db.listing.create({
    data: {
      slug: 'verification-listing-temp',
      partnerId: partner.id,
      category: 'STAY',
      title: 'Verification Listing Temp',
      description: 'Temporary listing created for admin verification.',
      location: 'Bhimtal',
      basePrice: 1800,
      sellPrice: 2200,
      bikeQuantity: 0,
      scootyQuantity: 0,
      images: ['https://example.com/test.jpg'],
      amenities: ['WiFi'],
      status: 'DRAFT'
    }
  });

  console.log('PACKAGE_CREATED', pkg.id, 'LISTING_CREATED', listing.id);
  console.log('COUNTS_BEFORE', { beforePackageCount, beforeListingCount });

  await db.package.delete({ where: { id: pkg.id } });
  await db.listing.delete({ where: { id: listing.id } });
  console.log('VERIFICATION_CLEANUP_OK');

  await db.$disconnect();
})().catch((error) => {
  console.error('VERIFY_ERROR', error);
  process.exit(1);
});
