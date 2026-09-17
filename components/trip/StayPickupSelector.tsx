'use client';

import { useId } from 'react';
import Image from 'next/image';
import { Car, Check, MapPin } from 'lucide-react';
import { resolveStayPickup, type PickupRoute, type StayPickup } from '@/lib/pickup-pricing';

export function StayPickupSelector({ routes, value, onChange, unavailable = false }: {
  routes: PickupRoute[];
  value: StayPickup | null;
  onChange: (value: StayPickup | null) => void;
  unavailable?: boolean;
}) {
  const radioGroup = useId();
  const route = routes.find((item) => item.id === value?.routeId);
  const locations = [...new Set(routes.map((item) => item.fromLocation).filter((item): item is string => Boolean(item)))];
  const chooseRoute = (next: PickupRoute | undefined) => onChange(next ? resolveStayPickup(routes, next.id, next.fares[0]?.vehicleTypeId ?? '') : null);

  return (
    <section className="rounded-2xl border border-[#d6e3da] bg-white p-4 text-[#173f35]">
      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span><span className="flex items-center gap-2 text-sm font-bold"><Car size={18} /> Add arrival pickup</span><span className="mt-1 block text-xs text-[#6c7770]">Published point-to-point transfer fares</span></span>
        <input type="checkbox" aria-label="Add arrival pickup" checked={Boolean(value)} disabled={!routes.length || unavailable} onChange={(event) => event.target.checked ? chooseRoute(routes[0]) : onChange(null)} className="h-5 w-5 accent-[#24584a]" />
      </label>
      {(unavailable || !routes.length) && <p role="status" className="mt-3 text-xs text-[#6c7770]">{unavailable ? 'Pickup fares are temporarily unavailable. Please enquire with our team.' : 'No priced transfer routes are available yet. Please enquire for a pickup quote.'}</p>}
      {value && route && (
        <div className="mt-4 space-y-4 border-t border-[#e2e6df] pt-4">
          <label className="grid gap-2 text-xs font-bold">Pickup location
            <select value={route.fromLocation ?? ''} onChange={(event) => chooseRoute(routes.find((item) => item.fromLocation === event.target.value))} className="w-full min-w-0 rounded-xl border border-[#d6d9d1] bg-[#f7f4ec] p-3 text-sm font-normal">
              {locations.map((location) => <option key={location} value={location}>{location}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-xs font-bold">Drop-off / transfer route
            <select value={route.id} onChange={(event) => chooseRoute(routes.find((item) => item.id === event.target.value))} className="w-full min-w-0 rounded-xl border border-[#d6d9d1] bg-[#f7f4ec] p-3 text-sm font-normal">
              {routes.filter((item) => item.fromLocation === route.fromLocation).map((item) => <option key={item.id} value={item.id}>{item.toLocation} · {item.title}</option>)}
            </select>
          </label>
          <fieldset className="space-y-2"><legend className="mb-2 text-xs font-bold">Choose your car</legend>
            {route.fares.map((fare) => (
              <label key={fare.vehicleTypeId} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${value.vehicleTypeId === fare.vehicleTypeId ? 'border-[#24584a] bg-[#eef5ef] ring-1 ring-[#24584a]' : 'border-[#e2e6df] hover:bg-[#f7f4ec]'}`}>
                <input type="radio" name={`pickup-car-${radioGroup}`} checked={value.vehicleTypeId === fare.vehicleTypeId} onChange={() => onChange(resolveStayPickup(routes, route.id, fare.vehicleTypeId))} className="h-4 w-4 shrink-0 accent-[#24584a]" />
                <span className="relative grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#e5ece6]">{fare.vehicleImage ? <Image src={fare.vehicleImage} alt={fare.vehicleName} fill sizes="64px" unoptimized className="object-cover" /> : <Car size={22} />}</span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{fare.vehicleName}</span><span className="block text-xs text-[#6c7770]">Up to {fare.vehicleCapacity} seats</span><span className="block text-sm font-bold">₹{fare.price.toLocaleString('en-IN')} / transfer</span></span>
                {value.vehicleTypeId === fare.vehicleTypeId && <Check size={16} className="shrink-0" />}
              </label>
            ))}
          </fieldset>
          <div aria-live="polite" className="rounded-xl bg-[#173f35] p-3 text-white"><p className="flex items-start gap-2 text-xs"><MapPin size={14} className="shrink-0" />{value.fromLocation} → {value.toLocation}</p><p className="mt-2 text-sm font-bold">Pickup fare: ₹{value.price.toLocaleString('en-IN')}</p></div>
          <p className="text-xs leading-5 text-[#6c7770]">One-way fare, separate from your nightly stay price. Choose a drop-off serving your stay; our team will confirm property coverage and availability on WhatsApp.</p>
        </div>
      )}
    </section>
  );
}
