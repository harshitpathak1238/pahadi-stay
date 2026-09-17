'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BedDouble, Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { PickupRoute, StayPickup } from '@/lib/pickup-pricing';
import { StayPickupSelector } from '@/components/trip/StayPickupSelector';
import { FaWhatsapp } from 'react-icons/fa';
import {
  buildStayEnquiryMessage,
  enquiryBedroomsFromStay,
  enquiryTotalPerNight,
  stayEnquiryWhatsappLink,
  type EnquiryBedroom,
} from '@/lib/stay-enquiry';

type StayLike = {
  title: string;
  location: string;
  slug: string;
  price: number;
  image?: string;
  images?: string[];
  accommodations?: { title: string; description: string; image: string; images?: string[]; price?: number | null; bedrooms: number; beds: number }[] | null;
};

/** The green WhatsApp trigger used on the stay page (sidebar + mobile bar). */
export function StayEnquireButton({ onClick, className = '', label = 'Enquire on WhatsApp' }: { onClick: () => void; className?: string; label?: string }) {
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
 * Bedroom-picker popup opened from "Enquire on WhatsApp".
 * The visitor taps the bedrooms they want (bright green border + check chip),
 * can swipe/cycle each bedroom's photo carousel, open any photo full-size, and
 * finally send a prefilled inquiry message to the KainchiDarshan WhatsApp.
 */
export function StayWhatsAppEnquiryModal({ stay, open, onClose, pickupRoutes = [], pickupUnavailable = false, pickup = null, onPickupChange }: { stay: StayLike; open: boolean; onClose: () => void; pickupRoutes?: PickupRoute[]; pickupUnavailable?: boolean; pickup?: StayPickup | null; onPickupChange?: (value: StayPickup | null) => void }) {
  const bedrooms = useMemo(() => enquiryBedroomsFromStay(stay), [stay]);
  const [selected, setSelected] = useState<number[]>([]);
  const [lightbox, setLightbox] = useState<{ accIndex: number; photoIndex: number } | null>(null);
  const touchStartX = useRef<number | null>(null);

  // Fresh selection every time the popup opens.
  useEffect(() => {
    if (open) {
      setSelected([]);
      setLightbox(null);
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

  const lightboxPhotos = lightbox ? bedrooms[lightbox.accIndex]?.photos ?? [] : [];
  const moveLightbox = (delta: number) =>
    setLightbox((current) => (current && lightboxPhotos.length ? { ...current, photoIndex: (current.photoIndex + delta + lightboxPhotos.length) % lightboxPhotos.length } : current));

  // Escape closes the lightbox first, then the popup; arrows move photos.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (lightbox) setLightbox(null);
        else onClose();
      }
      if (lightbox && event.key === 'ArrowLeft') moveLightbox(-1);
      if (lightbox && event.key === 'ArrowRight') moveLightbox(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lightbox, lightboxPhotos.length, onClose]);

  const toggle = (index: number) => setSelected((current) => (current.includes(index) ? current.filter((item) => item !== index) : [...current, index]));

  const selectedRooms = selected.map((index) => bedrooms[index]);
  const totalPerNight = enquiryTotalPerNight(selectedRooms);

  const sendEnquiry = () => {
    if (!selected.length) return;
    const chosen = [...selected].sort((a, b) => a - b).map((index) => bedrooms[index]);
    const url = typeof window !== 'undefined' ? window.location.href : `/stays/${stay.slug}`;
    const message = buildStayEnquiryMessage({ propertyTitle: stay.title, location: stay.location, url, bedrooms: chosen, pickup });
    window.open(stayEnquiryWhatsappLink(message), '_blank', 'noopener,noreferrer');
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label="Enquire about bedrooms on WhatsApp"
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
              <h3 className="mt-1 text-lg font-bold leading-snug text-[#173f35] sm:text-xl">Choose your bedroom</h3>
              <p className="sans mt-0.5 truncate text-xs text-[#6c7770] sm:text-[13px]">{stay.title} · {stay.location}</p>
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

          {/* Bedroom cards — small 2-up grid */}
          <div className="min-h-0 flex-1 overflow-y-auto px-3.5 py-4 sm:px-5">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {bedrooms.map((bedroom, index) => (
                <BedroomCard
                  key={`${bedroom.title}-${index}`}
                  bedroom={bedroom}
                  selected={selected.includes(index)}
                  onToggle={() => toggle(index)}
                  onOpenPhoto={(photoIndex) => setLightbox({ accIndex: index, photoIndex })}
                />
              ))}
            </div>
            <p className="sans mt-3 text-center text-[11px] leading-4 text-[#8a968e]">
              Tap a bedroom to select it — the bright green ring fills when it&apos;s picked. You can choose more than one.
            </p>
            {onPickupChange && <div className="mt-4"><StayPickupSelector routes={pickupRoutes} value={pickup} onChange={onPickupChange} unavailable={pickupUnavailable} /></div>}
          </div>

          {/* Selection summary + send */}
          <div className="border-t border-[#e2e6df] bg-white px-4 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-3.5 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="sans text-sm font-bold text-[#173f35]">
                  {selected.length ? `${selected.length} bedroom${selected.length > 1 ? 's' : ''} selected` : 'No bedroom selected yet'}
                </p>
                <p className="sans mt-0.5 text-xs text-[#6c7770]">
                  {selected.length
                    ? totalPerNight > 0
                      ? <>Estimated <span className="font-bold text-[#173f35]">₹{totalPerNight.toLocaleString('en-IN')}</span> / night</>
                      : 'Price on request'
                    : 'Tap one or more bedrooms above'}
                </p>
              </div>
              {selected.length > 0 && (
                <button type="button" onClick={() => setSelected([])} className="sans shrink-0 text-xs font-bold text-[#b66b45] transition hover:underline">
                  Clear
                </button>
              )}
            </div>
            {pickup && <p className="sans mt-2 text-xs font-semibold text-[#24584a]">+ ₹{pickup.price.toLocaleString('en-IN')} one-way pickup · {pickup.vehicleName}</p>}
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

      {/* Full-size photo lightbox (sits above the popup, scrolls sideways) */}
      {lightbox && lightboxPhotos.length > 0 && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${bedrooms[lightbox.accIndex]?.title ?? 'Bedroom'} photos`}
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            aria-label="Close photos"
            onClick={(event) => { event.stopPropagation(); setLightbox(null); }}
            className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 text-black transition hover:bg-[#f0f0f0]"
          >
            <X size={20} />
          </button>
          <div
            className="relative h-[78vh] w-full max-w-4xl"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) => { touchStartX.current = event.touches[0].clientX; }}
            onTouchEnd={(event) => {
              if (touchStartX.current === null || lightboxPhotos.length < 2) return;
              const deltaX = event.changedTouches[0].clientX - touchStartX.current;
              touchStartX.current = null;
              if (Math.abs(deltaX) > 40) moveLightbox(deltaX < 0 ? 1 : -1);
            }}
          >
            <Image
              src={lightboxPhotos[lightbox.photoIndex]}
              alt={`${bedrooms[lightbox.accIndex]?.title ?? 'Bedroom'} photo ${lightbox.photoIndex + 1}`}
              fill
              sizes="100vw"
              unoptimized
              className="object-contain"
            />
          </div>
          {lightboxPhotos.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={(event) => { event.stopPropagation(); moveLightbox(-1); }}
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-3 text-black shadow transition hover:bg-[#f0f0f0] sm:left-5"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={(event) => { event.stopPropagation(); moveLightbox(1); }}
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-3 text-black shadow transition hover:bg-[#f0f0f0] sm:right-5"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-black">
            {bedrooms[lightbox.accIndex]?.title} · {lightbox.photoIndex + 1} / {lightboxPhotos.length}
          </span>
        </div>
      )}
    </>
  );
}

/** One selectable bedroom: small photo-first card with a bright green check chip when picked. */
function BedroomCard({ bedroom, selected, onToggle, onOpenPhoto }: { bedroom: EnquiryBedroom; selected: boolean; onToggle: () => void; onOpenPhoto: (photoIndex: number) => void }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const localTouchStartX = useRef<number | null>(null);
  const photos = bedroom.photos;
  const go = (delta: number) => setPhotoIndex((current) => (current + delta + photos.length) % photos.length);
  const meta = [bedroom.bedrooms > 0 ? `${bedroom.bedrooms} Bedroom${bedroom.bedrooms > 1 ? 's' : ''}` : '', bedroom.beds > 0 ? `${bedroom.beds} Bed${bedroom.beds > 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ');

  return (
    <div
      role="checkbox"
      aria-checked={selected}
      aria-label={`Select ${bedroom.title}`}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onToggle();
        }
      }}
      className={`relative flex cursor-pointer select-none flex-col overflow-hidden rounded-2xl border-2 bg-white transition outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/60 ${
        selected ? 'border-[#25D366] shadow-[0_10px_24px_rgba(37,211,102,.30)]' : 'border-[#e2e6df] hover:border-[#9fd6b4]'
      }`}
    >
      {/* Photo carousel */}
      <div
        className="relative aspect-[4/3] w-full touch-pan-y overflow-hidden bg-[#eef3f0]"
        onTouchStart={(event) => { localTouchStartX.current = event.touches[0].clientX; }}
        onTouchEnd={(event) => {
          if (localTouchStartX.current === null || photos.length < 2) return;
          const deltaX = event.changedTouches[0].clientX - localTouchStartX.current;
          localTouchStartX.current = null;
          if (Math.abs(deltaX) > 40) go(deltaX < 0 ? 1 : -1);
        }}
      >
        {photos.length > 0 ? (
          <button
            type="button"
            aria-label={`View ${bedroom.title} photos`}
            onClick={(event) => { event.stopPropagation(); onOpenPhoto(photoIndex); }}
            className="absolute inset-0 block cursor-zoom-in"
          >
            <Image src={photos[photoIndex]} alt={bedroom.title} fill sizes="(max-width: 640px) 46vw, 300px" unoptimized className="object-cover" />
          </button>
        ) : (
          <div className="flex h-full items-center justify-center text-[#24584a]">
            <BedDouble size={26} strokeWidth={1.6} />
          </div>
        )}

        {/* Selection chip (bright green + check when picked) */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute left-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full border-2 shadow-[0_2px_6px_rgba(7,26,21,.22)] transition duration-150 ${
            selected ? 'border-[#25D366] bg-[#25D366]' : 'border-[#c9d3cc] bg-white/95'
          }`}
        >
          <Check size={12} strokeWidth={3.5} className={`text-white transition duration-150 ${selected ? 'scale-100' : 'scale-0'}`} />
        </span>

        {bedroom.price != null ? (
          <span className="pointer-events-none absolute right-1.5 top-1.5 rounded-full bg-[#173f35] px-2 py-0.5 text-[10px] font-bold text-white shadow-[0_4px_10px_rgba(7,26,21,.35)] sm:text-[11px]">
            ₹{bedroom.price.toLocaleString('en-IN')} <span className="font-medium text-white/80">/ night</span>
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
              className="absolute left-1 top-1/2 z-10 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-[#23332e] shadow-sm transition hover:bg-white"
            >
              <ChevronLeft size={13} />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={(event) => { event.stopPropagation(); go(1); }}
              className="absolute right-1 top-1/2 z-10 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-[#23332e] shadow-sm transition hover:bg-white"
            >
              <ChevronRight size={13} />
            </button>
            <div className="pointer-events-none absolute bottom-1.5 left-1/2 z-10 flex -translate-x-1/2 gap-1">
              {photos.map((_, dotIndex) => (
                <span key={dotIndex} className={`h-1 w-1 rounded-full transition ${dotIndex === photoIndex ? 'bg-white' : 'bg-white/50'}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Title + details */}
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-2.5">
        <p className="text-[13px] font-bold leading-tight text-[#173f35] sm:text-sm">{bedroom.title}</p>
        {bedroom.description.trim() && <p className="text-[11px] leading-[1.15rem] text-[#6c7770] sm:text-xs sm:leading-[1.25rem]">{bedroom.description.trim()}</p>}
        {meta && (
          <p className={`mt-auto inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition sm:text-[11px] ${selected ? 'bg-[#dcf7e6] text-[#0d7a43]' : 'bg-[#eef3ef] text-[#24584a]'}`}>
            <BedDouble size={11} /> {meta}
          </p>
        )}
      </div>
    </div>
  );
}





