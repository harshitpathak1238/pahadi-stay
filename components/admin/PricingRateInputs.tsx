'use client';

import { AlertTriangle, Copy } from 'lucide-react';
import { readSeasonPrices, seasonPriceWarning, type SeasonPricePair, type SeasonablePrice } from '@/lib/pricing-shared';
import type { ListingForm } from './ContentManager';
import type { Dispatch, SetStateAction } from 'react';

const money = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`;

/** One editable rate, reused by every row of the grid. */
export function RateInput({ id, value, onChange, tone, hint = 'Blank = base price' }: { id: string; value: string; onChange: (value: string) => void; tone: 'peak' | 'low'; hint?: string }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className={`mb-1 block text-[11px] font-semibold ${tone === 'peak' ? 'text-[#a15c2e]' : 'text-[#24584a]'}`}>
        {tone === 'peak' ? 'Peak (max)' : 'Off-season (min)'}
      </label>
      <input
        id={id}
        type="number"
        min="0"
        step="1"
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Uses base price"
        aria-describedby={`${id}-hint`}
        className={`h-9 w-full rounded-[4px] border bg-white px-2 text-[12px] font-semibold ${tone === 'peak' ? 'border-[#e0c3a8]' : 'border-[#bcd8c6]'}`}
      />
      <p id={`${id}-hint`} className="mt-1 text-[10px] text-[#8a8a8a]">{hint}</p>
    </div>
  );
}

/**
 * Amber warning for the two rate combinations that behave surprisingly.
 * Accepts a raw row (`sellPrice` or `price` as the base) or a pre-built pair.
 */
export function RateWarning({ record }: { record: SeasonablePrice | SeasonPricePair }) {
  const pair = 'price' in record && ('seasonPrice' in record || 'offSeasonPrice' in record)
    ? readSeasonPrices(record)
    : (record as SeasonPricePair);
  const warning = seasonPriceWarning(pair);
  if (!warning) return null;
  return (
    <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-[#a15c2e]">
      <AlertTriangle size={11} /> {warning}
    </span>
  );
}

/** "Reset" — set both seasonal rates back to the item's base price. */
export function ResetRatesButton({ onClick, label = 'Reset' }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" title="Copy the base price into both rates" onClick={onClick} className="inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-[#d9d9dc] px-2 text-[11px] font-semibold hover:bg-[#f7f7f7]">
      <Copy size={12} /> {label}
    </button>
  );
}

export { money };

/**
 * The seasonal rate pair inside the per-listing editor.
 *
 * These are the same two rates the bulk Seasonal Pricing page edits, surfaced
 * inline so an admin working on one stay does not have to leave the form. Left
 * blank, a rate falls back to the listing's selling price — the help text spells
 * that out because an empty box here is a deliberate choice, not a missing value.
 */
export function SeasonPriceFields({ form, setForm, className = '' }: { form: ListingForm; setForm: Dispatch<SetStateAction<ListingForm>>; className?: string }) {
  const pair = readSeasonPrices({
    price: Number(form.sellPrice) || 0,
    seasonPrice: form.seasonPrice === '' ? null : Number(form.seasonPrice),
    offSeasonPrice: form.offSeasonPrice === '' ? null : Number(form.offSeasonPrice),
  });
  return (
    <fieldset className={`rounded-xl border border-[#e4e3da] bg-[#faf8f2] p-4 ${className}`}>
      <legend className="px-1 text-[12px] font-semibold text-[#173f35]">Seasonal pricing</legend>
      <p className="mt-0.5 mb-3 text-[11px] text-[#6c7770]">
        Leave a box empty to use the selling price above. Manage the global peak-season switch under Seasonal Pricing.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <RateInput id="seasonPrice" tone="peak" value={form.seasonPrice} onChange={(value) => setForm((current) => ({ ...current, seasonPrice: value }))} />
        <RateInput id="offSeasonPrice" tone="low" value={form.offSeasonPrice} onChange={(value) => setForm((current) => ({ ...current, offSeasonPrice: value }))} />
      </div>
      <RateWarning record={pair} />
    </fieldset>
  );
}