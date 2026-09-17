import { describe, expect, it } from 'vitest';
import { pickupRoutes, resolveStayPickup } from '../../lib/pickup-pricing';
import { buildStayEnquiryMessage } from '../../lib/stay-enquiry';
import type { PublicRide } from '../../lib/rides';

const ride: PublicRide = {
  id: 'station', slug: 'station-transfer', title: 'Station transfer', type: 'TRANSFER',
  description: '', fromLocation: 'Kathgodam Railway Station', toLocation: 'Bhimtal Hotel Drop',
  distanceKm: null, durationDays: null, images: [], image: '', stops: [], minFare: 2500,
  fares: [
    { vehicleTypeId: 'sedan', vehicleName: 'Swift Dzire', vehicleCapacity: 4, vehicleImage: null, price: 2500 },
    { vehicleTypeId: 'suv', vehicleName: 'Innova', vehicleCapacity: 6, vehicleImage: null, price: 4000 },
  ],
};

 describe('stay pickup from published transfer fares', () => {
  it('excludes sightseeing, missing endpoints and unpriced routes', () => {
    expect(pickupRoutes([
      ride, { ...ride, type: 'SIGHTSEEING' }, { ...ride, fromLocation: null },
      { ...ride, toLocation: ' ' }, { ...ride, fares: [] },
    ])).toEqual([expect.objectContaining({ id: 'station' })]);
  });

  it('excludes zero, negative and non-finite fares', () => {
    const routes = pickupRoutes([{ ...ride, fares: [
      ...ride.fares, ...[0, -1, NaN, Infinity].map((price) => ({ ...ride.fares[0], price })),
    ] }]);
    expect(routes[0].fares).toHaveLength(2);
  });

  it('uses the exact selected route and car price, not another starting point', () => {
    const routes = pickupRoutes([ride, { ...ride, id: 'airport', fromLocation: 'Pantnagar Airport',
      fares: [{ ...ride.fares[0], price: 5000 }] }]);
    expect(resolveStayPickup(routes, 'station', 'sedan')?.price).toBe(2500);
    expect(resolveStayPickup(routes, 'station', 'suv')?.price).toBe(4000);
    expect(resolveStayPickup(routes, 'airport', 'sedan')?.price).toBe(5000);
    expect(resolveStayPickup(routes, 'airport', 'suv')).toBeNull();
    expect(resolveStayPickup(routes, 'missing', 'sedan')).toBeNull();
  });

  it('includes pickup endpoints, car and separate transfer fare in WhatsApp', () => {
    const pickup = resolveStayPickup(pickupRoutes([ride]), 'station', 'sedan');
    const message = buildStayEnquiryMessage({ propertyTitle: 'Lake stay', location: 'Bhimtal',
      url: 'https://example.com/stays/lake', bedrooms: [{ title: 'Room', price: 3000, bedrooms: 1, beds: 1 }], pickup });
    expect(message).toContain('Kathgodam Railway Station');
    expect(message).toContain('Bhimtal Hotel Drop');
    expect(message).toContain('Swift Dzire');
    expect(message).toContain('₹2,500 per transfer');
    expect(message).toContain('₹3,000 / night');
    expect(message).toContain('confirm this route serves the property');
  });

  it('omits pickup when not selected', () => {
    expect(buildStayEnquiryMessage({ propertyTitle: 'Lake stay', location: 'Bhimtal',
      url: 'https://example.com', bedrooms: [], pickup: null })).not.toContain('Arrival pickup');
  });
});
