'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Car, Check, ChevronLeft, ChevronRight, Users, X } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import {
  buildRideEnquiryMessage,
  enquiryTotal,
  enquiryVehiclesFromRide,
  rideEnquiryRouteLine,
  rideEnquiryWhatsappLink,
  vehicleCapacityLabel,
  type EnquiryVehicle,
} from '@/lib/ride-enquiry';

type RideLike = {
  title: string;
  slug: string;
  fromLocation: string | null;
  toLocation: string | null;
  image?: string;
  images?: string[];
  minFare?: number | null;
  fares?: { vehicleTypeId: string; vehicleName: string; vehicleCapacity: number; vehicleImage: string | null; price: number }[] | null;
};

/** The green WhatsApp trigger used on the ride page (sidebar + mobile bar). */
export function RideEnquireButton({ onClick, className = '', label = 'Enquire on WhatsApp' }: { onClick: () => void; className?: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#25D366] px-4 py-3 sans text-sm font-bold text-white shadow-[0_10px_22px_rgba(18,120,64,.28)] transition hover:bg-[#1fbf5b] active:scale-[.98] ${className}`}
    >
      <FaWhatsapp aria-hidden="true" size={19} />
      {label}
    </button>
  );
}

/**
 * Vehicle-picker popup opened from "Enquire on WhatsApp" — the ride-side twin
 * of the stay bedroom picker. The visitor taps the vehicle(s) they want
 * (bright green border + check chip), can swipe through each vehicle's photos, and
 * finally sends a prefilled inquiry message to the KainchiDarshan WhatsApp.
 */
export function RideWhatsAppEnquiryModal({ ride, open, onClose }: { ride: RideLike; open: boolean; onClose: () => void }) {
  const vehicles = useMemo(() => enquiryVehiclesFromRide(ride), [ride]);
  const routeLine = rideEnquiryRouteLine(ride);
  const [selected, setSelected] = useState<number[]>([]);

  // Fresh selection every time the popup opens.
  useEffect(() => {
    if (open) {
      setSelected([]);
    }
  }, [open]);

  // The popup holds the page still while open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Escape closes the popup.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const toggle = (index: number) => setSelected((current) => (current.includes(index) ? current.filter((item) => item !== index) : [...current, index]));

  const selectedVehicles = selected.map((index) => vehicles[index]);
  const total = enquiryTotal(selectedVehicles);

  const sendEnquiry = () => {
    if (!selected.length) return;
    const chosen = [...selected].sort((a, b) => a - b).map((index) => vehicles[index]);
    const url = typeof window !== 'undefined' ? window.location.href : `/rides/${ride.slug}`;
    const message = buildRideEnquiryMessage({ rideTitle: ride.title, route: routeLine, url, vehicles: chosen });
    window.open(rideEnquiryWhatsappLink(message), '_blank', 'noopener,noreferrer');
    onClose();
  };

  if (!open) return null;


  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label="Enquire about vehicles on WhatsApp"
        onClick={onClose}
      >
        <div
          className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-[#e2e6df] bg-[#f7f4ec] px-4 py-4 sm:px-5">
            <div className="min-w-0">
              <p className="sans inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-[#1d7a4f]">
                <FaWhatsapp aria-hidden="true" size={13} /> Enquire on WhatsApp
              </p>
              <h3 className="mt-1 text-lg font-bold leading-snug text-[#173f35] sm:text-xl">Choose your vehicle</h3>
              <p className="sans mt-0.5 truncate text-xs text-[#6c7770] sm:text-[13px]">{ride.title} · {routeLine}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close enquiry"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#173f35] ring-1 ring-[#e2e6df] transition hover:bg-[#eef3ed]"
            >
              <X size={18} />
            </button>
          </div>

          {/* Vehicle cards — small 2-up grid */}
          <div className="min-h-0 flex-1 overflow-y-auto px-3.5 py-4 sm:px-5">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {vehicles.map((vehicle, index) => (
                <VehicleCard
                  key={`${vehicle.name}-${index}`}
                  vehicle={vehicle}
                  selected={selected.includes(index)}
                  onToggle={() => toggle(index)}
                />
              ))}
            </div>
            <p className="sans mt-3 text-center text-[11px] leading-4 text-[#8a968e]">
              Tap a vehicle to select it — the bright green ring fills when it&apos;s picked. You can choose more than one.
            </p>
          </div>


          {/* Selection summary + send */}
          <div className="border-t border-[#e2e6df] bg-white px-4 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-3.5 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="sans text-sm font-bold text-[#173f35]">
                  {selected.length ? `${selected.length} vehicle${selected.length > 1 ? 's' : ''} selected` : 'No vehicle selected yet'}
                </p>
                <p className="sans mt-0.5 text-xs text-[#6c7770]">
                  {selected.length
                    ? total > 0
                      ? <>Estimated <span className="font-bold text-[#173f35]">₹{total.toLocaleString('en-IN')}</span> for the ride</>
                      : 'Price on request'
                    : 'Tap one or more vehicles above'}
                </p>
              </div>
              {selected.length > 0 && (
                <button type="button" onClick={() => setSelected([])} className="sans shrink-0 text-xs font-bold text-[#b66b45] transition hover:underline">
                  Clear
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={sendEnquiry}
              disabled={!selected.length}
              className="sans mt-3 flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#25D366] px-4 py-3.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(18,120,64,.28)] transition hover:bg-[#1fbf5b] active:scale-[.98] disabled:cursor-not-allowed disabled:bg-[#c9d3cc] disabled:text-[#6d7a72] disabled:shadow-none"
            >
              <FaWhatsapp aria-hidden="true" size={19} />
              Send WhatsApp inquiry
            </button>
          </div>
        </div>
      </div>

   </>
  );
}

/** One selectable vehicle: small photo-first card with a bright green check chip when picked. */
function VehicleCard({ vehicle, selected, onToggle }: { vehicle: EnquiryVehicle; selected: boolean; onToggle: () => void }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const localTouchStartX = useRef<number | null>(null);
  const photos = vehicle.photos;
  const go = (delta: number) => setPhotoIndex((current) => (current + delta + photos.length) % photos.length);

  return (
    <div
      role="checkbox"
      aria-checked={selected}
      aria-label={`Select ${vehicle.name}`}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onToggle();
        }
      }}
      className={`relative aspect-[4/3] flex cursor-pointer flex-col rounded-xl border-2 bg-white p-2 text-left transition duration-150 sm:border-2 sm:rounded-xl sm:p-2.5 ${selected ? 'border-[#25D366] shadow-[0_4px_14px_rgba(37,211,102,.35)]' : 'border-[#e2e6df] shadow-sm sm:border-[#cbd2c4]'}`}
    >
      {/* Photo area */}
      <div
        className="relative aspect-[4/3] w-full touch-pan-y overflow-hidden bg-[#eef3f0] sm:aspect-[4/3] sm:w-full"
        onTouchStart={(event) => { localTouchStartX.current = event.touches[0].clientX; }}
        onTouchEnd={(event) => {
          if (localTouchStartX.current === null || photos.length < 2) return;
          const deltaX = event.changedTouches[0].clientX - localTouchStartX.current;
          localTouchStartX.current = null;
          if (Math.abs(deltaX) > 40) go(deltaX < 0 ? 1 : -1);
        }}
      >
        {photos.length > 0 ? (
          <div className="absolute inset-0">
            <Image src={photos[photoIndex]} alt={vehicle.name} fill sizes="(max-width: 640px) 46vw, 300px" unoptimized className="object-cover" />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-[#24584a]">
            <Car size={26} strokeWidth={1.6} />
          </div>
        )}

        {/* Selection chip (bright green + check when picked) */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute left-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full border-2 shadow-[0_2px_6px_rgba(7,26,21,.22)] transition duration-150 ${selected ? 'border-[#25D366] bg-[#25D366]' : 'border-[#c9d3cc] bg-white/95'}`}
        >
          <Check size={12} strokeWidth={3.5} className={`text-white transition duration-150 ${selected ? 'scale-100' : 'scale-0'}`} />
        </span>

        {vehicle.price != null ? (
          <span className="pointer-events-none absolute right-1.5 top-1.5 rounded-full bg-[#173f35] px-2 py-0.5 text-[10px] font-bold text-white shadow-[0_4px_10px_rgba(7,26,21,.35)] sm:text-[11px]">
            ₹{vehicle.price.toLocaleString('en-IN')} <span className="font-medium text-white/80">/ ride</span>
          </span>
        ) : (
          <span className="pointer-events-none absolute right-1.5 top-1.5 rounded-full bg-[#173f35] px-2 py-0.5 text-[10px] font-bold text-white shadow-[0_4px_10px_rgba(7,26,21,.35)] sm:text-[11px]">
            Price on request
          </span>
        )}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={(event) => { event.stopPropagation(); go(-1); }}
              className="absolute left-1 top-1/2 z-10 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-[#23332e] shadow-sm transition hover:bg-white sm:left-1.5"
            >
              <ChevronLeft size={13} />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={(event) => { event.stopPropagation(); go(1); }}
              className="absolute right-1 top-1/2 z-10 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-[#23332e] shadow-sm transition hover:bg-white sm:right-1.5"
            >
              <ChevronRight size={13} />
            </button>
            <div className="pointer-events-none absolute bottom-1.5 left-1/2 z-10 flex -translate-x-1/2 gap-1 sm:left-1/2 sm:gap-1.5">
              {photos.map((_, dotIndex) => (
                <span key={dotIndex} className={`h-1 w-1 rounded-full transition ${dotIndex === photoIndex ? 'bg-white' : 'bg-white/50'}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Title + details */}
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-2 sm:p-2.5">
        <p className="text-[13px] font-bold leading-tight text-[#173f35] sm:text-sm">{vehicle.name}</p>
        {(vehicle.capacity > 0 || vehicle.price != null) && (
          <p className={`mt-auto inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition sm:text-[11px] ${selected ? 'bg-[#dcf7e6] text-[#0d7a43]' : 'bg-[#eef3ef] text-[#24584a]'}`}>
            <Car size={11} /> {vehicleCapacityLabel(vehicle.capacity)}
          </p>
        )}
      </div>
    </div>
  );
}


