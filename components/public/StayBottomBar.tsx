'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';

export function StayBottomBar({ price, slug }: { price: number; slug: string }) {
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
      <div className="mx-auto max-w-[1180px] flex items-center justify-between gap-3 rounded-t-2xl bg-[#24584a] px-5 py-4 shadow-[0_-10px_24px_rgba(0,0,0,.22)]">
        <div className="flex flex-col items-start gap-0.5">
          <span className="sans text-[11px] font-bold uppercase tracking-[.14em] text-[#d9e8df]">From</span>
          <span className="text-2xl font-bold text-white">
            ₹{price.toLocaleString('en-IN')} <span className="text-sm font-normal text-[#cfe6df]">/ night</span>
          </span>
          <span className="mt-0.5 sans text-[11px] text-[#cfe6df]">Includes taxes &amp; fees estimate</span>
        </div>
        <button
          type="button"
          onClick={openTripBuilder}
          className="pointer-events-auto flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#f7f4ec] px-5 text-sm font-bold text-[#173f35] shadow-[0_6px_14px_rgba(23,63,53,.22)] active:scale-[.97] sm:inline-flex sm:visible"
        >
          <Sparkles size={15} className="shrink-0" />
          Add to your trip
        </button>
      </div>
    </div>
  );
}
