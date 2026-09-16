'use client';

import { useEffect, useRef, useState } from 'react';
import { Ban, Sparkles } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

export function RideBottomBar({ price, slug, onEnquire }: { price: number; slug: string; onEnquire?: () => void }) {
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => setVisible(true), 220);
    return () => clearTimeout(timer);
  }, []);

  const openTripBuilder = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const el = document.getElementById('trip-builder');
      el?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    });
  };

  if (typeof window === 'undefined') return null;
  if (window.innerWidth >= 768) return null;

  return (
    <div
      aria-hidden={!visible}
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(100%)' }}
      className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 bg-[#24584a] px-4 transition-[opacity,transform] duration-300 md:hidden sm:hidden"
    >
      <div className="mx-auto max-w-[1180px] flex items-center gap-3 rounded-t-2xl bg-[#24584a] py-3.5 shadow-[0_-10px_24px_rgba(0,0,0,.22)]">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
          <span className="sans text-[11px] font-bold uppercase tracking-[.14em] text-[#d9e8df]">From</span>
          <span className="text-2xl font-bold leading-7 text-white">
            Rs. {price.toLocaleString('en-IN')} <span className="text-xs font-normal text-[#cfe6df]">/ ride</span>
          </span>
          <span className="sans mt-0.5 text-[11px] leading-4 text-[#cfe6df] max-[420px]:hidden">Estimated price</span>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-1.5">
          {onEnquire && (
            <button
              type="button"
              onClick={onEnquire}
              aria-label="WhatsApp inquiry"
              title="WhatsApp inquiry"
              className="pointer-events-auto flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#25D366] px-3 text-[11px] font-bold text-white shadow-[0_6px_14px_rgba(18,120,64,.3)] transition active:scale-95"
            >
              <FaWhatsapp size={15} />
              WhatsApp inquiry
            </button>
          )}
          <button
            type="button"
            onClick={openTripBuilder}
            title="Add to your trip"
            className="pointer-events-auto flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#f7f4ec] px-3 text-[11px] font-bold text-[#173f35] shadow-[0_6px_14px_rgba(23,63,53,.22)] active:scale-[.97]"
          >
            <Sparkles size={13} className="shrink-0" />
            Add to your trip
          </button>
        </div>
      </div>
    </div>
  );
}

