/** Flat amount the old stay page charged for its inline "Scooty rental request" add-on. */
export const LEGACY_STAY_RENTAL_AMOUNT = 500;

type SanitisableItem = {
  category: string;
  price?: number;
  addons?: string[];
  addonBreakdown?: { id: string; amount?: number }[];
};

/**
 * Repairs a trip item saved by an older build.
 *
 * The stay page used to offer a "Scooty rental request" checkbox that bolted a
 * flat rental charge onto a STAY. Rentals are a separate catalogue with their own
 * stock, daily rate and vehicle type, so they are added from /rentals only.
 * Carts are persisted in localStorage, so anyone who already ticked that box
 * still carries the phantom charge - this strips it and refunds the amount.
 */
export function sanitiseTripItem<T extends SanitisableItem>(item: T): T {
  // A real rental listing is its own item and keeps its add-ons untouched.
  if (item.category === 'RENTAL') return item;
  const addons = item.addons ?? [];
  const breakdown = item.addonBreakdown ?? [];
  const hasLegacyAddon = addons.includes('RENTAL');
  const legacyLines = breakdown.filter((line) => line.id === 'RENTAL');
  if (!hasLegacyAddon && legacyLines.length === 0) return item;

  const refund = legacyLines.reduce(
    (sum, line) => sum + (Number.isFinite(line.amount) ? Number(line.amount) : LEGACY_STAY_RENTAL_AMOUNT),
    0,
  ) || LEGACY_STAY_RENTAL_AMOUNT;

  return {
    ...item,
    addons: addons.filter((addon) => addon !== 'RENTAL'),
    addonBreakdown: breakdown.filter((line) => line.id !== 'RENTAL'),
    price: Math.max(0, Number(item.price ?? 0) - refund),
  };
}

export function sanitiseTripCart<T extends SanitisableItem>(items: T[]): T[] {
  return items.map(sanitiseTripItem);
}

export function hasValidTripDates(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) return false;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  return end > start;
}
