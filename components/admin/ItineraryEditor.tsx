'use client';

import { useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, MapPin, Plus, Route, Trash2 } from 'lucide-react';
import { emptyStop, MAX_ITINERARY_STOPS, MAX_ITINERARY_NOTE, moveStop, removeStopAt, type ItineraryStop } from '@/lib/package-inclusions-shared';

const fieldClass = 'w-full min-w-0 rounded-lg border border-[#e1e3df] bg-white px-3 py-2 text-[13px] leading-5 text-[#2d4037] placeholder:text-[#a3aca4] focus:border-[#8db9a0] focus:outline-none focus:ring-2 focus:ring-[#dcefe2]';

const labelClass = 'mb-1 block text-[11px] font-bold uppercase tracking-[.08em] text-[#8a938c]';

/**
 * A textarea that grows to fit whatever is typed into it.
 *
 * The description used to be a single-line `<input>`, so anything longer than
 * the box was silently clipped and an admin could not read back what they had
 * written. Growing vertically keeps the whole description visible and editable
 * without a scrollbar, while still collapsing back to one line when empty.
 */
function GrowingTextarea({ value, onChange, ...rest }: { value: string; onChange: (value: string) => void } & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.style.height = 'auto';
    node.style.height = `${node.scrollHeight}px`;
  }, [value]);
  return <textarea {...rest} ref={ref} rows={1} value={value} onChange={(event) => onChange(event.target.value)} className={`${fieldClass} resize-none overflow-hidden`} />;
}

/**
 * Itinerary / stops editor for packages.
 *
 * Mirrors the rides editor (add a stop, location + description, remove) but is
 * laid out as a vertical timeline so the sequence reads at a glance, and each
 * row collapses into one card on narrow screens instead of squeezing three
 * inputs side by side.
 *
 * Rows are never auto-removed while typing — dropping a stop the moment its
 * location is cleared makes editing painful. Blank rows are simply ignored when
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
          <h3 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[.08em] text-[#065f46]">
            <Route size={15} aria-hidden="true" className="shrink-0 text-[#047857]" />
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
            <li key={index} className="rounded-xl border border-[#e5e5e4] bg-[#fafaf8] p-3 transition focus-within:border-[#8db9a0] focus-within:bg-white focus-within:shadow-[0_2px_10px_rgba(6,95,70,.08)]">
              <div className="flex items-start gap-2.5">
                <span aria-hidden="true" className="mt-[22px] grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#065f46] text-[11px] font-bold text-white">
                  {index + 1}
                </span>

                <div className="grid min-w-0 flex-1 gap-2.5">
                  <div>
                    <label className={labelClass} htmlFor={`stop-${index}-label`}>Location</label>
                    <input
                      id={`stop-${index}-label`}
                      value={stop.label}
                      onChange={(event) => update(index, { label: event.target.value })}
                      placeholder={`Stop ${index + 1} — e.g. Nainital lake shore`}
                      aria-label={`Stop ${index + 1} location`}
                      maxLength={120}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <label className={labelClass} htmlFor={`stop-${index}-note`}>Description</label>
                      <span aria-hidden="true" className="shrink-0 text-[10px] font-medium text-[#b0b7b0]">
                        {stop.note.length}/{MAX_ITINERARY_NOTE}
                      </span>
                    </div>
                    <GrowingTextarea
                      id={`stop-${index}-note`}
                      value={stop.note}
                      onChange={(note) => update(index, { note })}
                      placeholder="What happens at this stop — e.g. early morning pickup from Delhi in a private cab, then a sunset walk by the lake."
                      aria-label={`Stop ${index + 1} description`}
                      maxLength={MAX_ITINERARY_NOTE}
                    />
                  </div>
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
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#d5dbd5] bg-white px-3 py-2 text-[13px] font-semibold text-[#047857] transition hover:border-[#8db9a0] hover:bg-[#eef7f1] disabled:pointer-events-none disabled:opacity-45"
      >
        <Plus size={15} aria-hidden="true" /> Add stop
      </button>
      {atLimit && <p className="mt-2 text-[11px] text-[#a13d2c]">Maximum {MAX_ITINERARY_STOPS} stops.</p>}
    </section>
  );
}