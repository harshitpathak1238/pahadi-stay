export const PICKUP_LOCATION_OPTIONS = [
  'Kathgodam Railway Station',
  'Kathgodam Bus Stand',
  'Pantnagar Airport',
  'Haldwani',
  'My homestay',
  'Other — describe it',
] as const;

export const PICKUP_PRICING: Record<string, number> = {
  'Kathgodam Railway Station': 350,
  'Kathgodam Bus Stand': 300,
  'Pantnagar Airport': 550,
  Haldwani: 250,
  'My homestay': 0,
  'Other — describe it': 450,
};

export function getPickupPrice(location: string) {
  return PICKUP_PRICING[location] ?? 450;
}
