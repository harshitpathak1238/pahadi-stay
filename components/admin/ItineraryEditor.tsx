'use client';

import { ChevronDown, ChevronUp, MapPin, Plus, Route, Trash2 } from 'lucide-react';
import { emptyStop, MAX_ITINERARY_STOPS, moveStop, removeStopAt, type ItineraryStop } from '@/lib/package-inclusions-shared';

/**
 * Itinerary / stops editor for packages.
 *
 * Mirrors the rides editor (add a stop, label + optional note, remove) but is
 * laid out as a vertical timeline so the sequence reads at a glance, and each
 * row collapses into one card on narrow screens instead of squeezing three
 * inputs side by side.
 *
 * Rows are never auto-removed while typing — dropping a stop the moment its
 * label is cleared makes editing painful. Blank rows are simply ignored when
 * the form is submitted.
 */
export function ItineraryEditor({ stops, onChange }: { stops: ItineraryStop[]; onChange: (stops: ItineraryStop[]) => void }) {
  const atLimit = stops.length >= MAX_ITINERARY_STOPS;
  const filled = stops.filter((stop) => stop.label.trim()).length;

  const update = (index: number, patch: Partial<ItineraryStop>) =>
    onChange(stops.map((stop, position) => (position === index ? { ...stop, ...patch } : stop)));

  return (
    <section className="rounded-2xl border border-[#d9d9dc] bg-white p-4 sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[.08em] text-[#173f35]">
            <Route size={15} aria-hidden="true" className="shrink-0 text-[#24584a]" />
            Day-by-day itinerary
          </h3>
          <p className="mt-1 text-[12px] leading-5 text-[#6c7770]">
            Add each stop in order. Guests see these as a timeline on the package page.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[#eef1ee] px-2.5 py-1 text-[11px] font-bold text-[#526057]">
          {filled} {filled === 1 ? 'stop' : 'stops'}
        </span>
      </header>

      {stops.length ? (
        <ol className="mt-4 grid gap-2.5">
          {stops.map((stop, index) => (
            <li key={index} className="rounded-xl border border-[#e5e5e4] bg-[#fafaf8] p-3 transition focus-within:border-[#8db9a0] focus-within:bg-white focus-within:shadow-[0_2px_10px_rgba(23,63,53,.08)]">
              <div className="flex items-start gap-2.5">
                <span aria-hidden="true" className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#173f35] text-[11px] font-bold text-white">
                  {index + 1}
                </span>

                <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                  <input
                    value={stop.label}
                    onChange={(event) => update(index, { label: event.target.value })}
                    placeholder={`Stop ${index + 1} — e.g. Nainital lake shore`}
                    aria-label={`Stop ${index + 1} label`}
                    maxLength={120}
                    className="w-full min-w-0 rounded-lg border border-[#e1e3df] bg-white px-3 py-2 text-[13px] text-[#2d4037] placeholder:text-[#a3aca4] focus:border-[#8db9a0] focus:outline-none focus:ring-2 focus:ring-[#dcefe2]"
                  />
                  <input
                    value={stop.note}
                    onChange={(event) => update(index, { note: event.target.value })}
                    placeholder="Optional note — e.g. sunset walk"
                    aria-label={`Stop ${index + 1} note`}
                    maxLength={300}
                    className="w-full min-w-0 rounded-lg border border-[#e1e3df] bg-white px-3 py-2 text-[13px] text-[#2d4037] placeholder:text-[#a3aca4] focus:border-[#8db9a0] focus:outline-none focus:ring-2 focus:ring-[#dcefe2]"
                  />
                </div>

                <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => onChange(moveStop(stops, index, index - 1))}
                      disabled={index === 0}
                      aria-label={`Move stop ${index + 1} up`}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-[#e1e3df] bg-white text-[#526057] transition hover:border-[#cbd5cf] hover:bg-[#f4f4f4] disabled:pointer-events-none disabled:opacity-35"
                    >
                      <ChevronUp size={15} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange(moveStop(stops, index, index + 1))}
                      disabled={index === stops.length - 1}
                      aria-label={`Move stop ${index + 1} down`}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-[#e1e3df] bg-white text-[#526057] transition hover:border-[#cbd5cf] hover:bg-[#f4f4f4] disabled:pointer-events-none disabled:opacity-35"
                    >
                      <ChevronDown size={15} aria-hidden="true" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onChange(removeStopAt(stops, index))}
                    aria-label={`Remove stop ${index + 1}`}
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[#f0c9c0] bg-white px-2.5 text-[12px] font-semibold text-[#a13d2c] transition hover:bg-[#fdecec] sm:w-8 sm:px-0"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    <span className="sm:sr-only">Remove</span>
                  </button>
                </div>
              </div>

              {!stop.label.trim() && !stop.note.trim() && (
                <p className="mt-2 flex items-center gap-1.5 pl-[34px] text-[11px] text-[#9aa39b]">
                  <MapPin size={11} aria-hidden="true" /> Empty stops are ignored when you save.
                </p>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-[#e0e2de] bg-[#fafaf8] px-3 py-6 text-center text-[12px] text-[#8a8f88]">
          No stops yet. Add the places this package visits, in order.
        </p>
      )}

      <button
        type="button"
        onClick={() => onChange([...stops, emptyStop()])}
        disabled={atLimit}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#d5dbd5] bg-white px-3 py-2 text-[13px] font-semibold text-[#24584a] transition hover:border-[#8db9a0] hover:bg-[#eef7f1] disabled:pointer-events-none disabled:opacity-45"
      >
        <Plus size={15} aria-hidden="true" /> Add stop
      </button>
      {atLimit && <p className="mt-2 text-[11px] text-[#a13d2c]">Maximum {MAX_ITINERARY_STOPS} stops.</p>}
    </section>
  );
}