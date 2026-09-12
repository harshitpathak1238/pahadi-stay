'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';

const whatsappNumber = '919876543210';
export const defaultWhatsAppMessage = 'Namaste! I am planning a trip to Kumaon and would like help with stays, rides, rentals, or packages. Please share the best options, availability, and pricing. Thank you!';

export function WhatsAppMark({ size = 18 }: { size?: number }) {
  return <FaWhatsapp aria-hidden="true" size={size} />;
}

export function WhatsAppButton({ message, children = 'WhatsApp us', className = '', ariaLabel = 'Chat with KainchiDarshan on WhatsApp' }: { message: string; children?: React.ReactNode; className?: string; ariaLabel?: string }) {
  const href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const [hidden, setHidden] = useState(false);
  const drag = useRef<{ pointerId: number; offsetX: number; offsetY: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const buttonRef = useRef<HTMLAnchorElement>(null);

  // Hide while the user scrolls down (common floating-button pattern) and
  // bring it back when they scroll up or stop — content is never held
  // underneath the bubble at rest on small viewports.
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  const overlapsInteractive = () => {
    const fab = buttonRef.current;
    if (!fab) return false;
    const fr = fab.getBoundingClientRect();
    for (const el of document.querySelectorAll('a, button, input, select, textarea, h1, h2, h3')) {
      if (el === fab) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (getComputedStyle(el).display === 'none' || getComputedStyle(el).visibility === 'hidden') continue;
      if (fr.right > r.left + 4 && fr.left < r.right - 4 && fr.bottom > r.top + 4 && fr.top < r.bottom - 4) return true;
    }
    return false;
  };
  const armIdle = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (overlapsInteractive()) setHidden(true);
    }, 4000);
  };
  useLayoutEffect(() => {
    let previousY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - previousY;
      if (delta > 4) setHidden(true);
      else if (delta < -4) setHidden(false);
      previousY = y;
      armIdle();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    armIdle();
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(idleTimer);
    };
  }, []);

  const show = () => { setHidden(false); armIdle(); };
  useEffect(() => { const move = (event: PointerEvent) => { if (!drag.current || drag.current.pointerId !== event.pointerId || !buttonRef.current) return; const bounds = buttonRef.current.getBoundingClientRect(); setPosition({ left: Math.max(0, Math.min(window.innerWidth - bounds.width, event.clientX - drag.current.offsetX)), top: Math.max(0, Math.min(window.innerHeight - bounds.height, event.clientY - drag.current.offsetY)) }); drag.current.moved = true; }; const end = (event: PointerEvent) => { if (drag.current?.pointerId === event.pointerId) { suppressClick.current = drag.current.moved; drag.current = null; } }; window.addEventListener('pointermove', move); window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end); return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end); }; }, []);
  const startDrag = (event: React.PointerEvent<HTMLAnchorElement>) => { show(); const button = buttonRef.current; if (!button) return; const bounds = button.getBoundingClientRect(); drag.current = { pointerId: event.pointerId, offsetX: event.clientX - bounds.left, offsetY: event.clientY - bounds.top, moved: false }; button.setPointerCapture?.(event.pointerId); };
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => { if (suppressClick.current) { event.preventDefault(); suppressClick.current = false; } };

  return <a ref={buttonRef} href={href} target="_blank" rel="noreferrer" onPointerDown={startDrag} onClick={handleClick} aria-label={ariaLabel} tabIndex={hidden ? -1 : undefined} style={{ ...(position ? { left: position.left, top: position.top, right: 'auto', bottom: 'auto' } : {}), opacity: hidden ? 0 : 1 }} className={`whatsapp-drag inline-flex items-center justify-center gap-2 rounded-full border border-[#b7d8c6] bg-[#e8f5ed] px-4 py-3 sans text-sm font-bold text-[#17633e] transition duration-300 hover:bg-[#d9efdf] ${hidden ? 'pointer-events-none' : ''} ${className}`}><WhatsAppMark size={18} />{children}</a>;
}
