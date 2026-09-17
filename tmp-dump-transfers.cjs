require('@next/env').loadEnvConfig(process.cwd());
(async () => {
  const { PrismaClient } = require('@prisma/client');
  const db = new PrismaClient();
  try {
    const rides = await db.rideRoute.findMany({
      where: { status: 'LIVE', type: 'TRANSFER' },
      include: { fares: { include: { vehicleType: true } }, stops: { orderBy: { order: 'asc' } } },
      orderBy: { order: 'asc' },
    });
    console.log(JSON.stringify(rides.map((r) => ({
      slug: r.slug, title: r.title, from: r.fromLocation, to: r.toLocation,
      fares: r.fares.map((f) => ({ v: f.vehicleType ? f.vehicleType.name : null, price: Number(f.price) })),
    })), null, 1));
    const vehicles = await db.vehicleType.findMany({ orderBy: { order: 'asc' } });
    console.log('VEHICLES:' + JSON.stringify(vehicles.map((v) => ({ id: v.id, name: v.name, cap: v.capacity }))));
  } catch (e) { console.error('ERR', e.message); }
  finally { await db.$disconnect(); }
})();
