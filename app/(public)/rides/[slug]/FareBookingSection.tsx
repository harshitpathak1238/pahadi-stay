'use client';

import { useState, useMemo } from 'react';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { PublicRide } from '@/lib/rides';
import Image from 'next/image';
import Link from 'next/link';
import { Users, Car, Check, Minus, Plus } from 'lucide-react';

const inr = (n: number) => `Rs. ${Number(n).toLocaleString('en-IN')}`;

export function FareBookingSection({ ride }: { ride: PublicRide }) {
  const fares = ride.fares;
  const [passengers, setPassengers] = useState<number>(2);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filter vehicles that can accommodate the selected number of passengers
  const availableFares = useMemo(() => fares.filter((f) => f.vehicleCapacity >= passengers), [fares, passengers]);

  // Get the selected fare (first available if current selection is filtered out)
  const activeId = selectedId && availableFares.some((f) => f.vehicleTypeId === selectedId) ? selectedId : availableFares[0]?.vehicleTypeId ?? null;
  const activeFare = availableFares.find((f) => f.vehicleTypeId === activeId) ?? availableFares[0] ?? null;

  const waMessage = activeFare
    ? `Namaste! I would like to book the ride "${ride.title}" for ${passengers} passenger${passengers > 1 ? 's' : ''} in a ${activeFare.vehicleName} (${inr(activeFare.price)}) - /rides/${ride.slug}. Please share availability.`
    : `Namaste! I would like to book the ride "${ride.title}" for ${passengers} passenger${passengers > 1 ? 's' : ''} - /rides/${ride.slug}. Please share availability.`;

  if (fares.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-6 ring-1 ring-[#e4e3da] sm:p-8">
        <p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#b66b45]">Pricing</p>
        <p className="sans mt-3 text-sm leading-6 text-[#6c7770]">Pricing for this ride is coming soon. WhatsApp us and we will arrange it for you.</p>
        <div className="mt-5"><WhatsAppButton message={waMessage}>Ask on WhatsApp</WhatsAppButton></div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-[#e4e3da]">
      <div className="border-b border-[#eef1ec] bg-[#faf6ec] px-6 py-5">
        <p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#b66b45]">Book this ride</p>
        {ride.minFare !== null && (
          <p className="sans mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[#173f35] sm:text-3xl">{inr(ride.minFare)}</span>
            <span className="text-xs text-[#8a948c]">starting price</span>
          </p>
        )}
      </div>

      <div className="p-6 sm:p-7">
        {/* Passengers stepper */}
        <div className="flex items-center justify-between gap-3">
          <span className="sans flex items-center gap-2 text-sm font-semibold text-[#173f35]"><Users size={16} className="text-[#b66b45]" /> Passengers</span>
          <div className="flex items-center gap-1 rounded-full bg-[#f3f2ea] p-1">
            <button type="button" aria-label="Remove a passenger" disabled={passengers <= 1} onClick={() => setPassengers((c) => Math.max(1, c - 1))} className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#173f35] shadow-sm transition hover:bg-[#eef3f0] disabled:opacity-40"><Minus size={14} /></button>
            <span className="sans w-16 text-center text-sm font-bold text-[#173f35]">{passengers} {passengers === 1 ? 'guest' : 'guests'}</span>
            <button type="button" aria-label="Add a passenger" disabled={passengers >= 12} onClick={() => setPassengers((c) => Math.min(12, c + 1))} className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#173f35] shadow-sm transition hover:bg-[#eef3f0] disabled:opacity-40"><Plus size={14} /></button>
          </div>
        </div>
        {/* Vehicle selection */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="sans flex items-center gap-2 text-sm font-semibold text-[#173f35]"><Car size={16} className="text-[#b66b45]" /> Choose your car</p>
            <span className="sans text-[11px] text-[#8a948c]">{availableFares.length} of {fares.length} available</span>
          </div>
          {availableFares.length === 0 ? (
            <p className="sans mt-3 rounded-xl bg-[#fdf3ec] px-4 py-3 text-sm text-[#a15c2e]">No vehicle seats {passengers} passengers. Try a smaller group.</p>
          ) : (
            <div className="mt-3 space-y-2.5">
              {availableFares.map((fare) => {
                const isSelected = fare.vehicleTypeId === activeId;
                return (
                  <button
                    key={fare.vehicleTypeId}
                    type="button"
                    onClick={() => setSelectedId(fare.vehicleTypeId)}
                    className={`relative flex w-full items-center rounded-2xl p-3 text-left transition-all ${isSelected ? 'bg-[#eef3f0] ring-2 ring-[#173f35]' : 'bg-white ring-1 ring-[#e4e3da] hover:ring-[#b9c4ba]'}`}
                  >
                    <div className="relative mr-3.5 h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-[#eef3f0]">
                      {fare.vehicleImage ? (
                        <Image src={fare.vehicleImage} alt={fare.vehicleName} fill sizes="96px" unoptimized className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#9fb0a4]"><Car size={26} /></div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[#173f35]">{fare.vehicleName}</p>
                      <p className="sans mt-0.5 text-xs text-[#8a948c]">Up to {fare.vehicleCapacity} seats</p>
                      <p className="sans mt-1 text-base font-bold text-[#173f35]">{inr(fare.price)}</p>
                    </div>
                    {isSelected && <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-[#173f35]"><Check size={12} className="text-white" /></span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary + CTA */}
        {activeFare && (
          <div className="mt-6 rounded-2xl bg-[#173f35] p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="sans text-[10px] font-bold uppercase tracking-[.16em] text-[#9fb9ac]">Total - {passengers} {passengers === 1 ? 'guest' : 'guests'}</p>
                <p className="sans mt-1 truncate text-sm font-semibold text-white">{activeFare.vehicleName}</p>
              </div>
              <p className="sans shrink-0 text-2xl font-bold text-white">{inr(activeFare.price)}</p>
            </div>
            <div className="mt-4"><WhatsAppButton message={waMessage} className="w-full justify-center !border-transparent !bg-[#b66b45] !text-white hover:!bg-[#9f5938]">Book on WhatsApp</WhatsAppButton></div>
            <Link href="/rides" className="sans mt-3 block text-center text-xs font-semibold text-[#9fb9ac] transition hover:text-white">Browse more rides</Link>
          </div>
        )}
      </div>
    </div>
  );
}
