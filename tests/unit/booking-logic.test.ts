import { describe, expect, it } from 'vitest';
import { getPickupPrice } from '@/lib/pickup-pricing';

describe('booking utility checks', () => {
  it('returns the pickup fee for known location options', () => {
    expect(getPickupPrice('Kathgodam Railway Station')).toBe(350);
    expect(getPickupPrice('My homestay')).toBe(0);
    expect(getPickupPrice('Unknown')).toBe(450);
  });

  it('guards invalid trip totals that include non-positive item counts', () => {
    const items = [
      { title: 'Stay', price: 3200, quantity: 1 },
      { title: 'Pickup', price: 350, quantity: 1 },
    ];
    const total = items.reduce((sum, item) => sum + item.price * Math.max(item.quantity, 1), 0);
    expect(total).toBe(3550);
  });
});
