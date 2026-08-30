'use client';

import Image from "next/image";
import { useState } from "react";
import { ArrowUpRight, Check, MapPin, ShieldCheck } from "lucide-react";
import type { Rental } from "@/lib/mock-data";
import { WhatsAppButton } from "./WhatsAppButton";
import { AddToTrip } from "@/components/trip/TripCart";

export function RentalCard({ rental }: { rental: Rental }) {
  const isScooty = rental.scootyQuantity !== undefined && rental.scootyQuantity > 0;
  const [quantity, setQuantity] = useState(1);
  const available = isScooty ? rental.scootyQuantity || 0 : rental.bikeQuantity || 0;
  const currentQuantity = Math.min(Math.max(quantity, 1), Math.max(available, 1));
  const whatsappMessage = `Hello KainchiDarshan, I want to know more about the ${rental.title} rental (${rental.type}) at ₹${rental.price} per day. Please share availability and pickup details.`;
  return (
    <article className="rental-card overflow-hidden rounded-[1.25rem] border border-[#dfe3d8] bg-white shadow-[0_14px_40px_rgba(23,63,53,.08)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-[#dfe4da]">
        <Image
          src={rental.image}
          alt={rental.title}
          fill
          sizes="(max-width: 768px) 92vw, 50vw"
          className="rental-image object-cover"
        />
        <div className="absolute left-4 top-4 rounded-full bg-[#f7f4ec]/95 px-3 py-1.5 sans text-xs font-bold text-[#173f35]">
          Available to reserve
        </div>
        <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-[#173f35]/90 px-3 py-1.5 sans text-xs text-white">
          <ShieldCheck size={14} /> Inspected vehicle
        </div>
      </div>
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="sans text-xs font-bold uppercase tracking-[.14em] text-[#b66b45]">
              {rental.type}
            </p>
            <h2 className="mt-2 text-2xl text-[#173f35] sm:text-3xl">{rental.title}</h2>
          </div>
          <p className="shrink-0 text-right">
              <strong className="block text-xl text-[#173f35] sm:text-2xl">
              ₹{rental.price}
            </strong>
            <span className="sans text-xs text-[#6c7770]">per day</span>
          </p>
        </div>
        <p className="sans mt-4 text-sm leading-6 text-[#607067]">
          {rental.description}
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          {rental.features.map((feature) => (
            <span
              className="sans flex items-center gap-2 text-xs font-semibold text-[#24584a]"
              key={feature}
            >
              <Check size={15} className="shrink-0 text-[#b66b45]" />
              {feature}
            </span>
          ))}
        </div>
        <div className="mt-6 grid gap-3 border-t border-[#e4e3da] pt-4 sm:flex sm:items-center sm:justify-between">
          <p className="sans flex items-center gap-1.5 text-sm text-[#607067]">
            <MapPin size={16} className="text-[#b66b45]" />
            {rental.pickup}
          </p>
          <div className="grid gap-2 sm:flex sm:items-end">
            <WhatsAppButton message={whatsappMessage} className="px-4 py-2.5" />
            <label className="grid gap-1 sans text-xs font-bold text-[#173f35]">{isScooty ? 'Scooty quantity' : 'Bike quantity'}<select value={currentQuantity} onChange={(event) => setQuantity(Number(event.target.value))} className="rounded-xl border border-[#d6d9d1] bg-white p-2.5 text-sm" disabled={!available}>{Array.from({ length: Math.max(available, 1) }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <AddToTrip item={{ slug: rental.slug, title: rental.title, category: 'RENTAL', price: rental.price * currentQuantity, startDate: new Date().toISOString().slice(0, 10), rentalType: isScooty ? 'SCOOTY' : 'BIKE', quantity: currentQuantity, addonBreakdown: [{ id: 'RENTAL', label: `${isScooty ? 'Scooty' : 'Bike'} rental`, amount: rental.price * currentQuantity }] }} />
          </div>
        </div>
      </div>
    </article>
  );
}
