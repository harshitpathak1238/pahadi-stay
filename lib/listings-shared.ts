// Pure types, constants and parsers shared by server code and client components.
// This module deliberately imports nothing from Prisma, the database or the
// cache layer, so admin client components can use it without pulling
// server-only packages into the browser bundle.

export type PublicResult<T> = { data: T; degraded: boolean };

export type ListingFaqItem = { question: string; answer: string };

export type HouseRule = { title: string; text: string };

export const DefaultHouseRules: HouseRule[] = [
  { title: 'Check-in & check-out', text: 'Check-in from 14:00. Check-out by 11:00.' },
  { title: 'Pets', text: 'No pets allowed.' },
  { title: 'Parties & events', text: 'No parties or events.' },
  { title: 'Smoking', text: 'No smoking indoors.' },
  { title: 'Quiet hours', text: 'Quiet hours between 22:00 and 07:00.' },
  { title: 'Extra guests', text: 'Guests may not bring extra people without prior approval.' },
];

export function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function faqs(value: unknown): ListingFaqItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({ question: String(item.question ?? ''), answer: String(item.answer ?? '') }))
    .filter((item) => item.question.trim() && item.answer.trim());
}

export function parseHouseRules(value: unknown): HouseRule[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({ title: String(item.title ?? ''), text: String(item.text ?? '') }))
    .filter((item) => item.title.trim() && item.text.trim());
}

export function discountPercent(price: unknown, basePrice: unknown): number | null {
  const sell = Number(price);
  const base = Number(basePrice);
  if (!Number.isFinite(sell) || !Number.isFinite(base)) return null;
  if (sell <= 0 || base <= 0 || base <= sell) return null;
  const percent = Math.round((1 - sell / base) * 100);
  return percent > 0 && percent < 100 ? percent : null;
}