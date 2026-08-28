'use client';

import { useEffect, useRef, useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';

const whatsappNumber = '919876543210';
export const defaultWhatsAppMessage = 'Namaste! I am planning a trip to Kumaon and would like help with stays, rides, rentals, or packages. Please share the best options, availability, and pricing. Thank you!';

export function WhatsAppMark({ size = 18 }: { size?: number }) {
  return <FaWhatsapp aria-hidden="true" size={size} />;
}

export function WhatsAppButton({ message, children = 'WhatsApp us', className = '', ariaLabel = 'Chat with KainchiDarshan on WhatsApp' }: { message: string; children?: React.ReactNode; className?: string; ariaLabel?: string }) {
  const href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const drag = useRef<{ pointerId: number; offsetX: number; offsetY: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const buttonRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => { const move = (event: PointerEvent) => { if (!drag.current || drag.current.pointerId !== event.pointerId || !buttonRef.current) return; const bounds = buttonRef.current.getBoundingClientRect(); setPosition({ left: Math.max(0, Math.min(window.innerWidth - bounds.width, event.clientX - drag.current.offsetX)), top: Math.max(0, Math.min(window.innerHeight - bounds.height, event.clientY - drag.current.offsetY)) }); drag.current.moved = true; }; const end = (event: PointerEvent) => { if (drag.current?.pointerId === event.pointerId) { suppressClick.current = drag.current.moved; drag.current = null; } }; window.addEventListener('pointermove', move); window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end); return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end); }; }, []);
  const startDrag = (event: React.PointerEvent<HTMLAnchorElement>) => { const button = buttonRef.current; if (!button) return; const bounds = button.getBoundingClientRect(); drag.current = { pointerId: event.pointerId, offsetX: event.clientX - bounds.left, offsetY: event.clientY - bounds.top, moved: false }; button.setPointerCapture?.(event.pointerId); };
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => { if (suppressClick.current) { event.preventDefault(); suppressClick.current = false; } };

  return <a ref={buttonRef} href={href} target="_blank" rel="noreferrer" onPointerDown={startDrag} onClick={handleClick} aria-label={ariaLabel} title={ariaLabel} style={position ? { left: position.left, top: position.top, right: 'auto', bottom: 'auto' } : undefined} className={`whatsapp-drag inline-flex items-center justify-center gap-2 rounded-full border border-[#b7d8c6] bg-[#e8f5ed] px-4 py-3 sans text-sm font-bold text-[#17633e] transition hover:bg-[#d9efdf] ${className}`}><WhatsAppMark size={18} />{children}</a>;
}
