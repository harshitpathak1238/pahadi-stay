import { db } from '@/lib/db';
import { cached } from '@/lib/cache';
import { mapRideRecord, type PublicRide } from '@/lib/rides-shared';
import type { PublicResult } from '@/lib/listings';
import type { Prisma } from '@prisma/client';

// Pure helpers and the PublicRide types live in '@/lib/rides-shared' so client
// components can use them without pulling in Prisma or the Redis cache layer.
export * from '@/lib/rides-shared';

const stopsInclude = { orderBy: { order: 'asc' as const } };
const faresInclude = { include: { vehicleType: true }, orderBy: { vehicleType: { order: 'asc' as const } } };
const rideInclude = { stops: stopsInclude, fares: faresInclude };

type RideRecord = Prisma.RideRouteGetPayload<{ include: { stops: true; fares: { include: { vehicleType: true } } } }>;

export async function getPublicRides(): Promise<PublicResult<PublicRide[]>> {
  return cached('rides:all', 60, async () => {
    try {
      const records = await db.rideRoute.findMany({
        where: { status: 'LIVE' },
        include: rideInclude,
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      });
      return { data: records.map(mapRideRecord), degraded: false };
    } catch (error) {
      console.error('Public rides unavailable:', error);
      return { data: [], degraded: true };
    }
  });
}

export async function getPublicRide(slug: string): Promise<PublicResult<PublicRide | null>> {
  return cached(`rides:${slug}`, 300, async () => {
    try {
      const record = await db.rideRoute.findFirst({ where: { slug, status: 'LIVE' }, include: rideInclude });
      return { data: record ? mapRideRecord(record) : null, degraded: false };
    } catch (error) {
      console.error('Public ride detail unavailable:', error);
      return { data: null, degraded: true };
    }
  });
}
