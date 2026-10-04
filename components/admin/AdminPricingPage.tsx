'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { ArrowLeft, Check, Loader2, Save, TrendingDown, TrendingUp } from 'lucide-react';
import {
  PRICING_CATEGORIES,
  PRICING_CATEGORY_LABELS,
  hasSeasonalOverride,
  readSeasonPrices,
  selectDirtyRows,
  showsPeakPrice,
  withPercentChange,
  type PricingCategory,
  type PricingMode,
} from '@/lib/pricing-shared';
import { RateInput, RateWarning, ResetRatesButton, money } from './PricingRateInputs';

type Coverage = { category: string; listings: number; fares: number };

type ListingRow = {
  id: string;
  title: string;
  slug: string;
  category: string;
  location: string;
  status: string;
  sellPrice: unknown;
  seasonPrice: unknown;
  offSeasonPrice: unknown;
};

type RideFareRow = {
  rideRouteId: string;
  vehicleTypeId: string;
  routeTitle: string;
  vehicleName: string;
  price: unknown;
  seasonPrice: unknown;
  offSeasonPrice: unknown;
};

type RideApiRoute = {
  id: string;
  title: string;
  fares?: { vehicleTypeId: string; vehicleType?: { name: string }; price: unknown; seasonPrice: unknown; offSeasonPrice: unknown }[];
};

/** Used before the mode has loaded, and as a safe default in the live column. */
const NO_MODE: PricingMode = { peakModeEnabled: false, activeCategories: [], label: '', note: '' };

const fareKey = (row: RideFareRow) => `${row.rideRouteId}:${row.vehicleTypeId}`;

/**
 * Mark keys as edited, keeping the previous set reference when nothing new was
 * added so an untouched grid does not re-render on every keystroke.
 */
function addDirtyKeys(setter: Dispatch<SetStateAction<ReadonlySet<string>>>, keys: readonly string[]) {
  if (!keys.length) return;
  setter((current) => {
    if (keys.every((key) => current.has(key))) return current;
    const next = new Set(current);
    for (const key of keys) next.add(key);
    return next;
  });
}

  /**
   * Normalise a row into the `{ price, seasonPrice, offSeasonPrice }` shape the
   * shared helpers expect. Listings store their base rate in `sellPrice` while
   * ride fares use `price`, so this is the one place that difference is bridged.
   */
  const asPriced = (row: ListingRow | RideFareRow) => ({
    price: 'sellPrice' in row ? row.sellPrice : row.price,
    seasonPrice: row.seasonPrice,
    offSeasonPrice: row.offSeasonPrice,
  });

  const pairOf = (row: ListingRow | RideFareRow) => readSeasonPrices(asPriced(row));

export function AdminPricingPage() {
  const [mode, setMode] = useState<PricingMode | null>(null);
  const [coverage, setCoverage] = useState<Coverage[]>([]);
  const [rows, setRows] = useState<ListingRow[]>([]);
  const [fares, setFares] = useState<RideFareRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [category, setCategory] = useState<PricingCategory>('STAY');
  const [percent, setPercent] = useState('10');
  // Keys the admin has edited since the last successful load. Only these rows
  // are sent on save, so one changed price is one write instead of one per row.
  const [dirtyListings, setDirtyListings] = useState<ReadonlySet<string>>(() => new Set());
  const [dirtyFares, setDirtyFares] = useState<ReadonlySet<string>>(() => new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [modeResponse, listingResponse, rideResponse] = await Promise.all([
        fetch('/api/admin/pricing', { cache: 'no-store' }),
        fetch('/api/admin/listings', { cache: 'no-store' }),
        fetch('/api/admin/rides', { cache: 'no-store' }),
      ]);
      if (!modeResponse.ok || !listingResponse.ok || !rideResponse.ok) {
        throw new Error('Pricing data could not be loaded. Check admin access and the database connection.');
      }
      const modeBody = await modeResponse.json();
      setMode(modeBody.mode);
      setCoverage(modeBody.coverage ?? []);

      const listingBody = await listingResponse.json();
      setRows(Array.isArray(listingBody) ? listingBody : []);

      // Rides price through a per-vehicle fare matrix, so it is flattened into
      // rows the same grid can edit.
      const routes: RideApiRoute[] = await rideResponse.json();
      setFares((Array.isArray(routes) ? routes : []).flatMap((route) =>
        (route.fares ?? []).map((fare) => ({
          rideRouteId: route.id,
          vehicleTypeId: fare.vehicleTypeId,
          routeTitle: route.title,
          vehicleName: fare.vehicleType?.name ?? 'Vehicle',
          price: fare.price,
          seasonPrice: fare.seasonPrice,
          offSeasonPrice: fare.offSeasonPrice,
        })),
      ));
      // Everything on screen now matches the database, so there is nothing to save.
      setDirtyListings(new Set());
      setDirtyFares(new Set());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Pricing data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /** Persist the switch. Shared by the master toggle and the category boxes. */
  const persist = async (next: PricingMode, fallback: PricingMode) => {
    setBusy(true);
    setError('');
    const previous = mode;
    // Optimistic: these are the most latency-sensitive controls on the page.
    setMode(next);
    try {
      const response = await fetch('/api/admin/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          peakModeEnabled: next.peakModeEnabled,
          activeCategories: next.activeCategories,
          label: next.label,
          note: next.note,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'The pricing switch could not be saved.');
      setMode(body.mode);
    } catch (reason) {
      setMode(fallback ?? previous);
      setError(reason instanceof Error ? reason.message : 'The pricing switch could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  const togglePeak = async (next: boolean) => {
    if (!mode) return;
    await persist({ ...mode, peakModeEnabled: next }, mode);
    setMessage(next
      ? `Peak prices are live for ${mode.activeCategories.length} categor${mode.activeCategories.length === 1 ? 'y' : 'ies'}.`
      : 'Off-season prices are live for every category.');
  };

  const toggleCategory = async (value: string) => {
    if (!mode) return;
    const selected = new Set(mode.activeCategories);
    if (selected.has(value as PricingCategory)) selected.delete(value as PricingCategory);
    else selected.add(value as PricingCategory);
    const activeCategories = PRICING_CATEGORIES.filter((item) => selected.has(item));
    await persist({ ...mode, activeCategories }, mode);
  };

  const setListingRate = (id: string, field: 'seasonPrice' | 'offSeasonPrice', raw: string) => {
    addDirtyKeys(setDirtyListings, [id]);
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: raw === '' ? null : Number(raw) } : row)));
  };

  const setFareRate = (key: string, field: 'seasonPrice' | 'offSeasonPrice', raw: string) => {
    addDirtyKeys(setDirtyFares, [key]);
    setFares((current) => current.map((row) => (fareKey(row) === key ? { ...row, [field]: raw === '' ? null : Number(raw) } : row)));
  };

  const resetListing = (row: ListingRow) => {
    addDirtyKeys(setDirtyListings, [row.id]);
    const price = Number(row.sellPrice) || 0;
    setRows((current) => current.map((item) => (item.id === row.id ? { ...item, seasonPrice: price, offSeasonPrice: price } : item)));
  };

  const resetFare = (row: RideFareRow) => {
    addDirtyKeys(setDirtyFares, [fareKey(row)]);
    const price = Number(row.price) || 0;
    setFares((current) => current.map((item) => (fareKey(item) === fareKey(row) ? { ...item, seasonPrice: price, offSeasonPrice: price } : item)));
  };

  const isRides = category === 'RIDE';
  const visibleListings = useMemo(() => rows.filter((row) => row.category === category), [rows, category]);
  const visibleFares = useMemo(() => fares, [fares]);
  const visible = isRides ? visibleFares : visibleListings;

  /**
   * Apply a % move to every row in the current view, in memory only.
   *
   * Deliberately not written straight to the database: a mis-typed percentage
   * across the whole catalogue should be reviewable before it goes live.
   */
  const applyPercent = (direction: 1 | -1) => {
    const value = Number(percent);
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter a percentage above 0 before using the bulk change.');
      return;
    }
    setError('');
    const delta = value * direction;
    if (isRides) {
      addDirtyKeys(setDirtyFares, fares.map(fareKey));
      setFares((current) => current.map((row) => ({ ...row, ...withPercentChange(pairOf(row), delta) })));
    } else {
      addDirtyKeys(setDirtyListings, rows.filter((row) => row.category === category).map((row) => row.id));
      setRows((current) => current.map((row) => (row.category === category ? { ...row, ...withPercentChange(pairOf(row), delta) } : row)));
    }
    setMessage(`Bulk change applied in the editor. Review the rows, then save.`);
  };

  const savePrices = async () => {
    // Only the rows the admin actually touched. Re-sending the whole grid meant
    // a database write per row, which is what timed the save out.
    const changedListings = selectDirtyRows(rows, (row) => row.id, dirtyListings);
    const changedFares = selectDirtyRows(fares, fareKey, dirtyFares);
    if (!changedListings.length && !changedFares.length) {
      setError('');
      setMessage('No price changes to save yet.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/pricing/prices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listings: changedListings.map((row) => ({ id: row.id, seasonPrice: row.seasonPrice ?? null, offSeasonPrice: row.offSeasonPrice ?? null })),
          fares: changedFares.map((row) => ({
            rideRouteId: row.rideRouteId,
            vehicleTypeId: row.vehicleTypeId,
            seasonPrice: row.seasonPrice ?? null,
            offSeasonPrice: row.offSeasonPrice ?? null,
          })),
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Seasonal prices could not be saved.');
      setMessage(`Saved. Updated ${body.updatedListings ?? 0} listings and ${body.updatedFares ?? 0} ride fares.`);
      load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Seasonal prices could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const counts = useMemo(() => Object.fromEntries(coverage.map((item) => [item.category, item])), [coverage]);
  const configuredCount = visible.filter((row) => hasSeasonalOverride(pairOf(row))).length;

  if (loading) {
    return <div className="admin-shell flex min-h-screen items-center justify-center bg-[#f6f6f7] text-[#616161]"><Loader2 className="animate-spin" size={22} /></div>;
  }

  return (
    <div className="admin-shell min-h-screen bg-[#f6f6f7] p-4 text-[#303030] md:p-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-4 flex items-center gap-2 text-[12px] text-[#616161]">
          <Link href="/admin" className="inline-flex items-center gap-2 rounded-[4px] border border-[#d9d9dc] bg-white px-3 py-2 font-semibold hover:bg-[#f7f7f7]"><ArrowLeft size={14} /> Back</Link>
          <span className="text-[#b4b4b7]">/</span>
          <span className="font-semibold text-[#303030]">Seasonal pricing</span>
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-[.08em] text-[#777]">Revenue controls</p>
        <h1 className="mt-2 text-[26px] font-semibold">Seasonal pricing</h1>
        <p className="mt-1 max-w-2xl text-[13px] text-[#777]">
          Set a peak (maximum) and off-season (minimum) price for every hotel, ride and rental, then move the whole
          catalogue between them in one click.
        </p>

        {error && <p role="alert" className="mt-4 rounded-[4px] border border-[#e0b4b4] bg-[#fdf0f0] px-3 py-2 text-[12px] font-semibold text-[#8a3a3a]">{error}</p>}
        {message && <p role="status" className="mt-4 inline-flex items-center gap-2 rounded-[4px] border border-[#b9d5c5] bg-[#f1f8f3] px-3 py-2 text-[12px] font-semibold text-[#24584a]"><Check size={14} /> {message}</p>}

        <section className="mt-6 rounded-[4px] border border-[#e1e1e3] bg-white p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold">Show peak prices sitewide</h2>
              <p className="mt-1 text-[12px] text-[#777]">
                On: guests see the peak (maximum) price for the categories you tick. Off: everyone sees the off-season (minimum) price.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(mode?.peakModeEnabled)}
              disabled={busy || !mode}
              onClick={() => togglePeak(!mode?.peakModeEnabled)}
              className={`relative h-8 w-16 shrink-0 rounded-full transition disabled:opacity-60 ${mode?.peakModeEnabled ? 'bg-[#b66b45]' : 'bg-[#d4d4d7]'}`}
            >
              <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${mode?.peakModeEnabled ? 'left-9' : 'left-1'}`} />
              <span className="sr-only">Toggle peak pricing</span>
            </button>
          </div>

          <fieldset className="mt-5 border-t border-[#eeeef0] pt-4">
            <legend className="text-[12px] font-semibold">Applies to</legend>
            <p className="mt-1 text-[11px] text-[#8a8a8a]">Unticked categories keep their off-season price even while the switch is on.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {PRICING_CATEGORIES.map((value) => {
                const checked = mode?.activeCategories.includes(value) ?? false;
                const count = counts[value];
                const active = checked && mode?.peakModeEnabled;
                return (
                  <label key={value} className={`flex cursor-pointer items-start gap-2 rounded-[4px] border px-3 py-2 ${checked ? 'border-[#b9d5c5] bg-[#f6fbf8]' : 'border-[#e1e1e3] bg-white'}`}>
                    <input type="checkbox" checked={checked} disabled={busy} onChange={() => toggleCategory(value)} className="mt-0.5 accent-[#24584a]" />
                    <span className="min-w-0">
                      <span className="block text-[12px] font-semibold">{PRICING_CATEGORY_LABELS[value]}</span>
                      <span className="block text-[11px] text-[#8a8a8a]">{count ? `${count.listings} listings${count.fares ? ` · ${count.fares} fares` : ''}` : 'No items yet'}</span>
                      <span className={`mt-1 block text-[10px] font-bold uppercase tracking-wide ${active ? 'text-[#a15c2e]' : 'text-[#a0a0a4]'}`}>{active ? 'Showing peak' : 'Showing off-season'}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </section>

        <section className="mt-6 rounded-[4px] border border-[#e1e1e3] bg-white p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-[15px] font-semibold">Peak &amp; off-season rates</h2>
              <p className="mt-1 text-[12px] text-[#777]">
                Leave a box blank to use that item&apos;s normal selling price.{' '}
                {configuredCount} of {visible.length} {isRides ? 'fares' : 'listings'} in this view have a custom rate.
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-[11px] font-semibold">
                Bulk %
                <input value={percent} onChange={(event) => setPercent(event.target.value)} type="number" min="1" step="1" className="mt-1 h-9 w-20 rounded-[4px] border border-[#c9c9cc] px-2 text-[12px] font-normal" />
              </label>
              <button type="button" onClick={() => applyPercent(1)} disabled={saving} className="inline-flex h-9 items-center gap-1.5 rounded-[4px] border border-[#d9d9dc] px-3 text-[12px] font-semibold hover:bg-[#f7f7f7]"><TrendingUp size={14} /> Raise</button>
              <button type="button" onClick={() => applyPercent(-1)} disabled={saving} className="inline-flex h-9 items-center gap-1.5 rounded-[4px] border border-[#d9d9dc] px-3 text-[12px] font-semibold hover:bg-[#f7f7f7]"><TrendingDown size={14} /> Lower</button>
              <button type="button" onClick={savePrices} disabled={saving} className="inline-flex h-9 items-center gap-1.5 rounded-[4px] bg-[#303030] px-4 text-[12px] font-semibold text-white disabled:opacity-60">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save prices
              </button>
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto border-b border-[#eeeef0] pb-2">
            {PRICING_CATEGORIES.map((value) => (
              <button key={value} type="button" onClick={() => setCategory(value)} className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold ${category === value ? 'bg-[#303030] text-white' : 'bg-[#f3f3f4] text-[#616161] hover:bg-[#eaeaec]'}`}>
                {PRICING_CATEGORY_LABELS[value]}
              </button>
            ))}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead className="border-b border-[#e4e4e6] text-[11px] uppercase tracking-wide text-[#8a8a8a]">
                <tr>
                  <th className="pb-2">{isRides ? 'Route & vehicle' : 'Listing'}</th>
                  <th className="pb-2">Base</th>
                  <th className="pb-2">Off-season (min)</th>
                  <th className="pb-2">Peak (max)</th>
                  <th className="pb-2">Live price</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
{isRides
                  ? visibleFares.map((row) => {
                      const pair = pairOf(row);
                      const key = fareKey(row);
                      return (
                        <tr key={key} className="border-b border-[#f0f0f1] align-top">
                          <td className="py-3 pr-3">
                            <span className="block text-[13px] font-semibold">{row.routeTitle}</span>
                            <span className="block text-[11px] text-[#8a8a8a]">{row.vehicleName}</span>
                            <RateWarning record={pair} />
                          </td>
                          <td className="py-3 pr-3 text-[13px] font-semibold">{money(pair.price)}</td>
                          <td className="w-40 py-3 pr-3"><RateInput id={`${key}-low`} tone="low" value={row.offSeasonPrice == null ? '' : String(row.offSeasonPrice)} onChange={(value) => setFareRate(key, 'offSeasonPrice', value)} /></td>
                          <td className="w-40 py-3 pr-3"><RateInput id={`${key}-peak`} tone="peak" value={row.seasonPrice == null ? '' : String(row.seasonPrice)} onChange={(value) => setFareRate(key, 'seasonPrice', value)} /></td>
                          <td className="py-3 pr-3 text-[13px] font-bold">{money(showsPeakPrice(mode ?? NO_MODE, 'RIDE') ? (pair.seasonPrice || pair.price) : (pair.offSeasonPrice || pair.price))}</td>
                          <td className="py-3"><ResetRatesButton onClick={() => resetFare(row)} /></td>
                        </tr>
                      );
                    })
                  : visibleListings.map((row) => {
                      const pair = pairOf(row);
                      return (
                        <tr key={row.id} className="border-b border-[#f0f0f1] align-top">
                          <td className="py-3 pr-3">
                            <span className="block text-[13px] font-semibold">{row.title}</span>
                            <span className="block text-[11px] text-[#8a8a8a]">{row.location || 'No location'} · {row.status}</span>
                            <RateWarning record={pair} />
                          </td>
                          <td className="py-3 pr-3 text-[13px] font-semibold">{money(pair.price)}</td>
                          <td className="w-40 py-3 pr-3"><RateInput id={`${row.id}-low`} tone="low" value={row.offSeasonPrice == null ? '' : String(row.offSeasonPrice)} onChange={(value) => setListingRate(row.id, 'offSeasonPrice', value)} /></td>
                          <td className="w-40 py-3 pr-3"><RateInput id={`${row.id}-peak`} tone="peak" value={row.seasonPrice == null ? '' : String(row.seasonPrice)} onChange={(value) => setListingRate(row.id, 'seasonPrice', value)} /></td>
                          <td className="py-3 pr-3 text-[13px] font-bold">{money(showsPeakPrice(mode ?? NO_MODE, row.category) ? (pair.seasonPrice || pair.price) : (pair.offSeasonPrice || pair.price))}</td>
                          <td className="py-3"><ResetRatesButton onClick={() => resetListing(row)} /></td>
                        </tr>
                      );
                    })}
                {!visible.length && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[12px] text-[#8a8a8a]">
                      {isRides ? 'No ride fares yet. Add a fare on the Rides page first.' : 'Nothing in this category yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}