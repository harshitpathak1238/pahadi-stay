'use client';

import { useState } from 'react';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { PublicRide } from '@/lib/rides';
import Image from 'next/image';
import Link from 'next/link';

const inr = (n: number) => `Rs. ${Number(n).toLocaleString('en-IN')}`;

export function FareBookingSection({ ride }: { ride: PublicRide }) {
  const fares = ride.fares;
  const [selectedId, setSelectedId] = useState<string | null>(fares.length === 1 ? fares[0].vehicleTypeId : null);

  // Default selection: first vehicle by order (fares are already ordered by vehicleType.order from the API)
  const activeId = selectedId ?? fares[0]?.vehicleTypeId ?? null;
  const activeFare = fares.find((f) => f.vehicleTypeId === activeId) ?? fares[0] ?? null;

  const waMessage = activeFare
    ? `Namaste! I would like to book the ride "${ride.title}" in a ${activeFare.vehicleName} (${inr(activeFare.price)}) — /rides/${ride.slug}. Please share availability.`
    : `Namaste! I would like to book the ride "${ride.title}" — /rides/${ride.slug}. Please share availability.`;

  if (fares.length === 0) {
    return (
      <div className="mt-10">
        <h2 className="text-2xl text-[#173f35]">Pricing</h2>
        <p className="sans mt-3 text-[#526057]">Pricing for this ride is coming soon — please get in touch on WhatsApp for a quote.</p>
      </div>
    );
  }

  if (fares.length === 1) {
    const fare = fares[0];
    return (
      <div className="mt-10">
        <h2 className="text-2xl text-[#173f35]">Pricing</h2>
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-[#e4e3da]">
          {fare.vehicleImage ? (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#eef3f0]">
              <Image src={fare.vehicleImage} alt={fare.vehicleName} fill sizes="64px" className="object-cover" />
            </div>
          ) : null}
          <div className="flex-1">
            <p className="font-bold text-[#173f35]">{fare.vehicleName}</p>
            <p className="sans text-sm text-[#526057]">Up to {fare.vehicleCapacity} passengers</p>
          </div>
          <p className="text-2xl font-bold text-[#24584a]">{inr(fare.price)}</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <WhatsAppButton message={waMessage}>Book this ride on WhatsApp</WhatsAppButton>
          <Link href="/rides" className="sans inline-flex items-center rounded-full border px-5 py-3 text-sm font-bold">Browse more rides</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <h2 className="text-2xl text-[#173f35]">Choose your vehicle</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {fares.map((fare) => {
          const isSelected = fare.vehicleTypeId === activeId;
          return (
            <button
              key={fare.vehicleTypeId}
              type="button"
              onClick={() => setSelectedId(fare.vehicleTypeId)}
              className={`flex flex-col rounded-2xl p-4 text-left transition ring-1 ${
                isSelected
                  ? 'bg-[#eef3f0] ring-[#24584a] shadow-sm'
                  : 'bg-white ring-[#e4e3da] hover:ring-[#24584a]/40'
              }`}
            >
              {fare.vehicleImage ? (
                <div className="relative h-20 w-full overflow-hidden rounded-lg bg-[#eef3f0]">
                  <Image src={fare.vehicleImage} alt={fare.vehicleName} fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover" />
                </div>
              ) : (
                <div className="flex h-20 w-full items-center justify-center rounded-lg bg-[#eef3f0] text-sm text-[#526057]">
                  {fare.vehicleName}
                </div>
              )}
              <p className="mt-3 font-bold text-[#173f35]">{fare.vehicleName}</p>
              <p className="sans text-sm text-[#526057]">Up to {fare.vehicleCapacity} passengers</p>
              <p className="mt-auto pt-3 text-lg font-bold text-[#24584a]">{inr(fare.price)}</p>
            </button>
          );
        })}
      </div>
      <div className="mt-5 rounded-2xl bg-[#eef3f0] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="sans text-sm text-[#526057]">
              {activeFare ? `${activeFare.vehicleName} — up to ${activeFare.vehicleCapacity} passengers` : 'Select a vehicle'}
            </p>
            <p className="text-2xl font-bold text-[#173f35]">{activeFare ? inr(activeFare.price) : '—'}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <WhatsAppButton message={waMessage}>Book this ride on WhatsApp</WhatsAppButton>
            <Link href="/rides" className="sans inline-flex items-center rounded-full border px-5 py-3 text-sm font-bold">Browse more rides</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

