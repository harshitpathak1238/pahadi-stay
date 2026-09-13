'use client';

import { useState, useMemo } from 'react';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { PublicRide } from '@/lib/rides';
import Image from 'next/image';
import Link from 'next/link';
import { Users, Car, ChevronDown, Check } from 'lucide-react';

const inr = (n: number) => `Rs. ${Number(n).toLocaleString('en-IN')}`;

export function FareBookingSection({ ride }: { ride: PublicRide }) {
  const fares = ride.fares;
  const [passengers, setPassengers] = useState<number>(2);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPassengerDropdown, setShowPassengerDropdown] = useState(false);

  // Filter vehicles that can accommodate the selected number of passengers
  const availableFares = useMemo(() => {
    return fares.filter((f) => f.vehicleCapacity >= passengers);
  }, [fares, passengers]);

  // Get the selected fare (first available if current selection is filtered out)
  const activeId = selectedId && availableFares.some((f) => f.vehicleTypeId === selectedId)
    ? selectedId
    : availableFares[0]?.vehicleTypeId ?? null;
  const activeFare = availableFares.find((f) => f.vehicleTypeId === activeId) ?? availableFares[0] ?? null;

  // Passenger options (1-12)
  const passengerOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  const waMessage = activeFare
    ? `Namaste! I would like to book the ride "${ride.title}" for ${passengers} passenger${passengers > 1 ? 's' : ''} in a ${activeFare.vehicleName} (${inr(activeFare.price)}) — /rides/${ride.slug}. Please share availability.`
    : `Namaste! I would like to book the ride "${ride.title}" for ${passengers} passenger${passengers > 1 ? 's' : ''} — /rides/${ride.slug}. Please share availability.`;

  const handlePassengerSelect = (count: number) => {
    setPassengers(count);
    setShowPassengerDropdown(false);
    if (activeFare && activeFare.vehicleCapacity < count) {
      setSelectedId(null);
    }
  };

  if (fares.length === 0) {
    return (
      <div className="mt-12">
        <div className="rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-stone-800">Pricing</h2>
          <p className="mt-2 text-sm text-stone-500">Pricing for this ride is coming soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-stone-800">Choose your ride</h2>
        <span className="text-xs text-stone-400">{availableFares.length} of {fares.length} available</span>
      </div>

      <div className="mt-5">
        <label className="block text-xs font-medium text-stone-500 mb-2">Number of passengers</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPassengerDropdown(!showPassengerDropdown)}
            className="flex w-full items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3 text-left transition hover:border-stone-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                <Users size={16} className="text-emerald-600" />
              </div>
              <span className="text-stone-800 font-medium">
                {passengers} passenger{passengers > 1 ? 's' : ''}
              </span>
            </div>
            <ChevronDown size={18} className={`text-stone-400 transition-transform ${showPassengerDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showPassengerDropdown && (
            <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-stone-200 bg-white p-2 shadow-lg">
              <div className="grid grid-cols-4 gap-1">
                {passengerOptions.map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handlePassengerSelect(count)}
                    className={`flex items-center justify-center rounded-lg py-2.5 text-sm font-medium transition ${
                      passengers === count
                        ? 'bg-emerald-600 text-white'
                        : 'text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {availableFares.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm text-amber-700">
            No vehicles available for {passengers} passengers. Please reduce the number of passengers or contact us for larger groups.
          </p>
        </div>
      ) : (
        <>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {availableFares.map((fare) => {
              const isSelected = fare.vehicleTypeId === activeId;
              return (
                <button
                  key={fare.vehicleTypeId}
                  type="button"
                  onClick={() => setSelectedId(fare.vehicleTypeId)}
                  className={`group relative flex items-center rounded-2xl border p-4 text-left transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                      <Check size={12} className="text-white" />
                    </div>
                  )}

                  {/* Image on the left */}
                  <div className="relative mr-4 h-24 w-32 flex-shrink-0 overflow-hidden rounded-xl bg-stone-100">
                    {fare.vehicleImage ? (
                      <Image
                        src={fare.vehicleImage}
                        alt={fare.vehicleName}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Car size={32} className="text-stone-300" />
                      </div>
                    )}
                  </div>

                  {/* Details and price on the right */}
                  <div className="flex-1">
                    <p className="font-semibold text-stone-800">{fare.vehicleName}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Users size={12} className="text-stone-400" />
                      <span className="text-xs text-stone-500">Up to {fare.vehicleCapacity} seats</span>
                    </div>
                    <p className="mt-1 text-lg font-bold text-emerald-600">{inr(fare.price)}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {activeFare && (
            <div className="mt-5 rounded-2xl bg-stone-900 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-400">Selected vehicle</p>
                  <p className="mt-0.5 font-semibold text-white">{activeFare.vehicleName}</p>
                  <p className="text-xs text-stone-500">{passengers} passenger{passengers > 1 ? 's' : ''} · Up to {activeFare.vehicleCapacity} seats</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-stone-400">Total price</p>
                  <p className="text-2xl font-bold text-emerald-400">{inr(activeFare.price)}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <WhatsAppButton message={waMessage}>Book on WhatsApp</WhatsAppButton>
                <Link href="/rides" className="inline-flex items-center rounded-full border border-stone-600 px-5 py-2.5 text-sm font-medium text-stone-300 transition hover:bg-stone-800">Browse more rides</Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

