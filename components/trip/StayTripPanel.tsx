'use client';

import { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { AddToTrip, useTripCart } from './TripCart';

export function StayTripPanel({ slug, title, price }: { slug: string; title: string; price: number }) {
  const [open, setOpen] = useState(true); const [pickup, setPickup] = useState(false); const [rental, setRental] = useState(false); const { items } = useTripCart();
  const addons = [pickup && 'PICKUP', rental && 'RENTAL'].filter(Boolean) as string[];
  return <section id="trip-builder" className="mt-8 rounded-2xl border border-[#dfe3d8] bg-[#f7f4ec] p-5"><button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-left"><span><span className="flex items-center gap-2 sans text-xs font-bold uppercase tracking-[.15em] text-[#b66b45]"><Sparkles size={15} /> Build your trip</span><strong className="mt-2 block text-2xl text-[#173f35]">Add to your trip</strong></span><ChevronDown className={`transition ${open ? 'rotate-180' : ''}`} /></button>{open && <div className="mt-5 border-t border-[#dfe3d8] pt-5"><div className="grid gap-3 sans text-sm"><label className="flex items-center justify-between rounded-xl bg-white p-3"><span><input type="checkbox" checked={pickup} onChange={(event) => setPickup(event.target.checked)} className="mr-3 accent-[#24584a]" />Airport / station pickup</span><span>+₹800</span></label><label className="flex items-center justify-between rounded-xl bg-white p-3"><span><input type="checkbox" checked={rental} onChange={(event) => setRental(event.target.checked)} className="mr-3 accent-[#24584a]" />Scooty rental request</span><span>+₹500</span></label></div><div className="mt-4 flex items-center justify-between gap-3"><span className="sans text-xs text-[#6c7770]">{items.some((item) => item.slug === slug) ? 'This stay is already in your trip.' : 'Choose add-ons, then add everything together.'}</span><AddToTrip item={{ slug, title, category: 'STAY', price: price + (pickup ? 800 : 0) + (rental ? 500 : 0), startDate: new Date().toISOString().slice(0, 10), addons }} /></div></div>}</section>;
}
