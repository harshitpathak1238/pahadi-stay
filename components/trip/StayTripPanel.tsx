'use client';

import { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { getPickupPrice } from '@/lib/pickup-pricing';
import { AddToTrip, useTripCart } from './TripCart';

export function StayTripPanel({ slug, title, price }: { slug: string; title: string; price: number }) {
  const [open, setOpen] = useState(true);
  const [pickup, setPickup] = useState(false);
  const [pickupLocation, setPickupLocation] = useState('Kathgodam Railway Station');
  const [rental, setRental] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { items } = useTripCart();

  const pickupAmount = pickup ? getPickupPrice(pickupLocation) : 0;
  const rentalAmount = rental ? 500 : 0;
  const total = price + pickupAmount + rentalAmount;
  const hasValidDates = Boolean(startDate && endDate && new Date(endDate) > new Date(startDate));
  const alreadyAdded = items.some((item) => item.slug === slug && item.category === 'STAY');
  const addons = [pickup && 'PICKUP', rental && 'RENTAL'].filter(Boolean) as string[];

  return <section id="trip-builder" className="mt-8 rounded-2xl border border-[#dfe3d8] bg-[#f7f4ec] p-5"><button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-left"><span><span className="flex items-center gap-2 sans text-xs font-bold uppercase tracking-[.15em] text-[#b66b45]"><Sparkles size={15} /> Build your trip</span><strong className="mt-2 block text-2xl text-[#173f35]">Add to your trip</strong></span><ChevronDown className={`transition ${open ? 'rotate-180' : ''}`} /></button>{open && <div className="mt-5 border-t border-[#dfe3d8] pt-5"><div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2 sans text-sm font-bold text-[#173f35]">Check-in<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="rounded-xl border border-[#d6d9d1] bg-white p-3 font-normal" /></label><label className="grid gap-2 sans text-sm font-bold text-[#173f35]">Check-out<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="rounded-xl border border-[#d6d9d1] bg-white p-3 font-normal" /></label></div><div className="mt-4 grid gap-3 sans text-sm"><label className="flex items-center justify-between rounded-xl bg-white p-3"><span><input type="checkbox" checked={pickup} onChange={(event) => setPickup(event.target.checked)} className="mr-3 accent-[#24584a]" />Pickup</span><span>+₹{pickupAmount.toLocaleString('en-IN')}</span></label><label className="grid gap-2 rounded-xl bg-white p-3"><span className="flex items-center justify-between"><span>Pickup location</span><span className="sans text-xs font-bold text-[#6c7770]">{pickupLocation}</span></span><select value={pickupLocation} onChange={(event) => setPickupLocation(event.target.value)} className="mt-2 rounded-lg border border-[#d6d9d1] bg-[#f7f4ec] p-2.5 text-sm font-normal">{['Kathgodam Railway Station', 'Kathgodam Bus Stand', 'Pantnagar Airport', 'Haldwani', 'My homestay', 'Other — describe it'].map((location) => <option key={location} value={location}>{location}</option>)}</select></label><label className="flex items-center justify-between rounded-xl bg-white p-3"><span><input type="checkbox" checked={rental} onChange={(event) => setRental(event.target.checked)} className="mr-3 accent-[#24584a]" />Scooty rental request</span><span>+₹{rentalAmount.toLocaleString('en-IN')}</span></label></div><div className="mt-4 flex flex-col gap-3 border-t border-[#dfe3d8] pt-4 md:flex-row md:items-center md:justify-between"><div className="sans text-sm"><p className="font-bold text-[#173f35]">Trip total: ₹{total.toLocaleString('en-IN')}</p><p className="mt-1 text-[#6c7770]">{alreadyAdded ? 'This stay is already in your trip.' : !hasValidDates ? 'Select your dates to continue.' : 'Everything ready for checkout.'}</p></div><AddToTrip item={{ slug, title, category: 'STAY', price: total, startDate, endDate, pickup: pickup ? { location: pickupLocation, detail: 'Pickup arranged for arrival', requestedTime: new Date().toISOString(), price: pickupAmount } : undefined, addons, quantity: 1, addonBreakdown: [...(pickup ? [{ id: 'PICKUP', label: `Pickup · ${pickupLocation}`, amount: pickupAmount }] : []), ...(rental ? [{ id: 'RENTAL', label: 'Scooty rental request', amount: rentalAmount }] : [])] }} disabled={!hasValidDates || alreadyAdded} label={alreadyAdded ? 'Added to your trip' : 'Add to your trip'} /></div></div>}</section>;
}
