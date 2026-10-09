import { Footprints, Sunrise } from 'lucide-react';
import type { ItineraryStop } from '@/lib/package-inclusions-shared';

/**
 * Public day-by-day timeline for a package page.
 *
 * Order is the whole point of an itinerary, so stops render as an ordered
 * list with a connected rail. On mobile the rail tightens and the note drops
 * below the label so nothing is clipped on narrow screens.
 */
export function PackageItinerary({ stops }: { stops: ItineraryStop[] }) {
  if (!stops.length) return null;

  return (
    <section aria-labelledby="package-itinerary" className="mt-12">
      <div className="border-b border-[#e4e3da] pb-5">
        <p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#b66b45]">Day by day</p>
        <h2 id="package-itinerary" className="mt-2.5 text-3xl leading-tight md:text-4xl">Your itinerary</h2>
        <p className="sans mt-2.5 max-w-xl text-[15px] leading-6 text-[#526057]">
          {stops.length} {stops.length === 1 ? 'stop' : 'stops'} on this trip, in the order you&apos;ll visit them.
        </p>
      </div>

      <ol className="relative mt-7 space-y-4 border-l-2 border-[#e4e3da] pl-5 sm:space-y-5 sm:pl-8">
        {stops.map((stop, index) => (
          <li key={`${stop.label}-${index}`} className="relative">
            {/* Offsets keep the numbered badge centred on the rail at every breakpoint. */}
            <span
              aria-hidden="true"
              className="absolute -left-[31px] grid h-7 w-7 place-items-center rounded-full bg-[#065f46] text-[11px] font-bold text-white ring-4 ring-[#fff] sm:-left-[45px] sm:h-8 sm:w-8 sm:text-[12px]"
            >
              {index + 1}
            </span>
            <div className="rounded-2xl border border-[#e4e3da] bg-white p-4 shadow-[0_6px_18px_rgba(6,95,70,.05)] transition hover:shadow-[0_12px_28px_rgba(6,95,70,.1)] sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="sans inline-flex items-center gap-1.5 rounded-full bg-[#eef1ee] px-2.5 py-1 text-[11px] font-bold text-[#526057]">
                  {index === 0 ? <Sunrise size={12} aria-hidden="true" /> : <Footprints size={12} aria-hidden="true" />}
                  {index === 0 ? 'Start' : `Stop ${index + 1}`}
                </span>
              </div>
              <h3 className="mt-2.5 text-[17px] font-semibold leading-snug text-[#065f46] sm:text-lg">{stop.label}</h3>
              {stop.note && <p className="sans mt-1.5 text-[14px] leading-6 text-[#6c7770] sm:text-[15px]">{stop.note}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}