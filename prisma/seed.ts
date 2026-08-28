import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const adminEmail = process.env.ADMIN_EMAILS?.split(',')[0]?.trim().toLowerCase();
const catalog = [
  { slug: 'oak-house-bhimtal', category: 'STAY' as const, title: 'Oak House by the Lake', location: 'Bhimtal, Uttarakhand', sellPrice: 4200, basePrice: 3360, description: 'A sun-filled cedar home with lake views, a warm kitchen, and the quiet rhythm of the forest.', images: ['https://images.unsplash.com/photo-1601918774946-25832a4be0d6?auto=format&fit=crop&w=1000&q=85'], amenities: ['Lake view', 'Breakfast included', 'Bonfire', 'Wi-Fi'] },
  { slug: 'the-kumaon-cabin', category: 'STAY' as const, title: 'The Kumaon Cabin', location: 'Kainchi Road, Uttarakhand', sellPrice: 6800, basePrice: 5440, description: 'Minimal mountain architecture, expansive windows, and a private deck above the pines.', images: ['https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1000&q=85'], amenities: ['Valley view', 'Private deck', 'Pet friendly', 'Parking'] },
  { slug: 'bloomingdale-homestay', category: 'STAY' as const, title: 'Bloomingdale Homestay', location: 'Bhowali, Uttarakhand', sellPrice: 2800, basePrice: 2240, description: 'A gentle family-run homestay with garden breakfasts and local recommendations.', images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1000&q=85'], amenities: ['Garden', 'Home-cooked meals', 'Hot water', 'Power backup'] },
  { slug: 'pahadi-scooty', category: 'RENTAL' as const, title: 'Pahadi Scooty', location: 'Bhimtal & Bhowali', sellPrice: 500, basePrice: 400, description: 'Easy, light, and ready for lake roads and local errands.', images: ['https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=85'], amenities: ['Automatic scooter', 'Helmet included', 'Fuel efficient', 'Easy pickup'] },
  { slug: 'pahadi-bike', category: 'RENTAL' as const, title: 'Pahadi Bike', location: 'Bhimtal & Kainchi Dham', sellPrice: 800, basePrice: 640, description: 'A confident ride for winding roads, temple visits, and wider horizons.', images: ['https://images.unsplash.com/photo-1558980664-10ea6f5e9b8f?auto=format&fit=crop&w=1200&q=85'], amenities: ['Mountain motorcycle', 'Helmet included', 'Roadside support', 'Secure parking'] },
];

async function main() {
  if (!adminEmail) throw new Error('ADMIN_EMAILS must contain an admin email.');
  const user = await db.user.findUnique({ where: { email: adminEmail } });
  if (!user) throw new Error(`Admin user ${adminEmail} was not found. Sign in once before seeding.`);
  const partner = await db.partner.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id, businessName: 'KainchiDarshan', category: 'STAY', verificationStatus: 'VERIFIED' } });
  for (const item of catalog) await db.listing.upsert({ where: { slug: item.slug }, update: { ...item, partnerId: partner.id, status: 'LIVE' }, create: { ...item, partnerId: partner.id, status: 'LIVE' } });
  console.log(`Seeded ${catalog.length} catalog listings for ${adminEmail}.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
