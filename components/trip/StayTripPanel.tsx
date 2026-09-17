'use client';

import { useState } from 'react';
import { Ban, ChevronDown, Sparkles } from 'lucide-react';
import type { PickupRoute, StayPickup } from '@/lib/pickup-pricing';
import { StayPickupSelector } from './StayPickupSelector';
import { hasValidTripDates } from '@/lib/trip-logic';
import { AddToTrip, useTripCart } from './TripCart';

export function StayTripPanel({ slug, title, price, fullyBooked = false, pickupRoutes = [], pickupUnavailable = false, pickup, onPickupChange }: { slug: string; title: string; price: number; fullyBooked?: boolean; pickupRoutes?: PickupRoute[]; pickupUnavailable?: boolean; pickup: StayPickup | null; onPickupChange: (value: StayPickup | null) => void }) {
  const [open, setOpen] = useState(true);
  const [rental, setRental] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { items } = useTripCart();

  const pickupAmount = pickup?.price ?? 0;
  const pickupLocation = pickup?.fromLocation ?? '';
  const rentalAmount = rental ? 500 : 0;
  const total = price + pickupAmount + rentalAmount;
  const hasValidDates = hasValidTripDates(startDate, endDate);
  const alreadyAdded = items.some((item) => item.slug === slug && item.category === 'STAY');
  const addons = [pickup && 'PICKUP', rental && 'RENTAL'].filter(Boolean) as string[];

  return <section className="mt-8 rounded-2xl border border-[#dfe3d8] bg-[#f7f4ec] p-5"><button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-left"><span><span className="flex items-center gap-2 sans text-xs font-bold uppercase tracking-[.15em] text-[#b66b45]"><Sparkles size={15} /> Build your trip</span><strong className="mt-2 block text-2xl text-[#173f35]">{fullyBooked ? 'Currently fully booked' : 'Add to your trip'}</strong></span><ChevronDown className={`transition ${open ? 'rotate-180' : ''}`} /></button>{open && <div className="mt-5 border-t border-[#dfe3d8] pt-5"><fieldset disabled={fullyBooked} className={fullyBooked ? 'opacity-60' : ''}><div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2 sans text-sm font-bold text-[#173f35]">Check-in<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="rounded-xl border border-[#d6d9d1] bg-white p-3 font-normal" /></label><label className="grid gap-2 sans text-sm font-bold text-[#173f35]">Check-out<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="rounded-xl border border-[#d6d9d1] bg-white p-3 font-normal" /></label></div><div className="mt-4 grid gap-3 sans text-sm"><StayPickupSelector routes={pickupRoutes} value={pickup} onChange={onPickupChange} unavailable={pickupUnavailable} /><label className="flex items-center justify-between rounded-xl bg-white p-3"><span><input type="checkbox" checked={rental} onChange={(event) => setRental(event.target.checked)} className="mr-3 accent-[#24584a]" />Scooty rental request</span><span>+₹{rentalAmount.toLocaleString('en-IN')}</span></label></div><div className="mt-4 flex flex-col gap-3 border-t border-[#dfe3d8] pt-4 md:flex-row md:items-center md:justify-between"><div className="sans text-sm"><p className="font-bold text-[#173f35]">Trip total: ₹{total.toLocaleString('en-IN')}</p><p className="mt-1 text-[#6c7770]">{alreadyAdded ? 'This stay is already in your trip.' : !hasValidDates ? 'Select your dates to continue.' : 'Everything ready for checkout.'}</p></div><AddToTrip item={{ slug, title, category: 'STAY', price: total, startDate, endDate, pickup: pickup ? { location: pickupLocation, detail: `${pickup.fromLocation} → ${pickup.toLocation} · ${pickup.vehicleName} · ${pickup.routeTitle}`, price: pickupAmount } : undefined, addons, quantity: 1, addonBreakdown: [...(pickup ? [{ id: 'PICKUP', label: `Pickup · ${pickupLocation} → ${pickup.toLocation} · ${pickup.vehicleName}`, amount: pickupAmount }] : []), ...(rental ? [{ id: 'RENTAL', label: 'Scooty rental request', amount: rentalAmount }] : [])] }} disabled={!hasValidDates || alreadyAdded} label={alreadyAdded ? 'Added to your trip' : 'Add to your trip'} /></div></fieldset></div>}</section>;
}
