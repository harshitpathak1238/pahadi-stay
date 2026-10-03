import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { hasValidTripDates, LEGACY_STAY_RENTAL_AMOUNT, sanitiseTripCart, sanitiseTripItem } from '../../lib/trip-logic';
import { isAllowedAdminEmail, isAllowedAdminRole } from '../../lib/admin';

describe('admin access helpers', () => {
  beforeEach(() => { vi.stubEnv('ADMIN_EMAILS', 'harshitpathak1238@gmail.com,Nilanshnegi1717@gmail.com'); });

  it('accepts configured admin roles and emails', () => {
    expect(isAllowedAdminRole('OWNER')).toBe(true);
    expect(isAllowedAdminRole('CUSTOMER')).toBe(false);
    expect(isAllowedAdminEmail('harshitpathak1238@gmail.com')).toBe(true);
    expect(isAllowedAdminEmail('guest@example.com')).toBe(false);
  });
});

describe('trip date validation', () => {
  it('rejects empty, invalid, or reversed date ranges', () => {
    expect(hasValidTripDates('', '2026-09-02')).toBe(false);
    expect(hasValidTripDates('2026-09-05', '2026-09-04')).toBe(false);
    expect(hasValidTripDates('2026-09-01', '2026-09-02')).toBe(true);
  });
});

/**
 * The stay page used to offer a "Scooty rental request" checkbox that added a
 * flat ₹500 RENTAL add-on to a STAY. Rentals are their own catalogue with their
 * own stock, daily rate and vehicle type, so they belong on /rentals only - and
 * a guest who already ticked the box had the charge refunded on cart load.
 */
describe('legacy stay rental add-on', () => {
  it('strips the rental add-on from a stay and refunds the charge', () => {
    const repaired = sanitiseTripItem({
      category: 'STAY', price: 3500, addons: ['RENTAL'],
      addonBreakdown: [{ id: 'RENTAL', label: 'Scooty rental request', amount: LEGACY_STAY_RENTAL_AMOUNT }],
    });
    expect(repaired.addons).toEqual([]);
    expect(repaired.addonBreakdown).toEqual([]);
    expect(repaired.price).toBe(3000);
  });

  it('keeps a genuine pickup add-on while removing the rental one', () => {
    const repaired = sanitiseTripItem({
      category: 'STAY', price: 4350, addons: ['PICKUP', 'RENTAL'],
      addonBreakdown: [
        { id: 'PICKUP', label: 'Pickup', amount: 350 },
        { id: 'RENTAL', label: 'Scooty rental request', amount: 500 },
      ],
    });
    expect(repaired.addons).toEqual(['PICKUP']);
    expect(repaired.addonBreakdown).toEqual([{ id: 'PICKUP', label: 'Pickup', amount: 350 }]);
    expect(repaired.price).toBe(3850);
  });

  it('never touches a real rental item', () => {
    const rental = { category: 'RENTAL', price: 500, rentalType: 'SCOOTY', addons: [] as string[] };
    expect(sanitiseTripItem(rental)).toEqual(rental);
  });

  it('leaves a clean stay untouched', () => {
    const stay = { category: 'STAY', price: 3000, addons: ['PICKUP'] };
    expect(sanitiseTripItem(stay)).toEqual(stay);
  });

  it('refunds even when the stored line had no amount', () => {
    const repaired = sanitiseTripItem({ category: 'STAY', price: 3000, addons: ['RENTAL'] });
    expect(repaired.price).toBe(2500);
  });

  it('repairs a whole persisted cart', () => {
    const repaired = sanitiseTripCart([
      { category: 'STAY', price: 3500, addons: ['RENTAL'] },
      { category: 'RENTAL', price: 800, addons: [] },
    ]);
    expect(repaired[0].price).toBe(3000);
    expect(repaired[1].price).toBe(800);
  });

  it('never drives a price below zero', () => {
    expect(sanitiseTripItem({ category: 'STAY', price: 100, addons: ['RENTAL'] }).price).toBe(0);
  });

  it('no longer renders the rental checkbox on the stay panel', () => {
    // Guards the regression: the panel offered a "Scooty rental request"
    // checkbox that charged a flat ₹500 on top of the stay.
    const source = readFileSync(
      new URL('../../components/trip/StayTripPanel.tsx', import.meta.url),
      'utf8',
    );
    const jsx = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(jsx).not.toContain('Scooty rental request');
    expect(jsx).not.toContain("rental && 'RENTAL'");
    // Rentals must still be reachable from the stay page.
    expect(jsx).toContain('/rentals');
  });

  it('no longer accepts a RENTAL add-on server side', () => {
    const source = readFileSync(
      new URL('../../app/api/trips/route.ts', import.meta.url),
      'utf8',
    );
    expect(source).not.toContain("RENTAL: 500");
    expect(source).toContain("z.enum(['PICKUP', 'ACTIVITY'])");
  });
});
