const whatsappNumber = '919876543210';
export const defaultWhatsAppMessage = 'Namaste! I am planning a trip to Kumaon and would like help with stays, rides, rentals, or packages. Please share the best options, availability, and pricing. Thank you!';

export function WhatsAppMark({ size = 18 }: { size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="15" fill="currentColor" /><path d="M10.8 24.1 12 19.7a7.8 7.8 0 1 1 3.8 3.3l-5 1.1Z" fill="white" /><path d="M13.5 11.7c.2-.4.4-.4.7-.4h.6c.2 0 .4.1.5.4l.8 1.9c.1.3.1.5-.1.7l-.6.7c-.1.2-.2.3 0 .6.3.6 1.2 1.7 2.2 2.3.8.5 1.3.7 1.6.5l.8-.9c.2-.2.4-.2.7-.1l1.9.9c.3.1.4.3.3.6-.1.8-.7 1.5-1.4 1.7-.7.2-1.6.1-2.5-.3-1.1-.5-2.4-1.3-3.6-2.5-1.1-1.1-2-2.5-2.4-3.5-.4-1-.3-1.9.1-2.6l.4-.1Z" fill="currentColor" /></svg>;
}

export function WhatsAppButton({ message, children = 'WhatsApp us', className = '', ariaLabel = 'Chat with KainchiDarshan on WhatsApp' }: { message: string; children?: React.ReactNode; className?: string; ariaLabel?: string }) {
  const href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  return <a href={href} target="_blank" rel="noreferrer" aria-label={ariaLabel} title={ariaLabel} className={`inline-flex items-center justify-center gap-2 rounded-full border border-[#b7d8c6] bg-[#e8f5ed] px-4 py-3 sans text-sm font-bold text-[#17633e] transition hover:bg-[#d9efdf] ${className}`}><WhatsAppMark size={18} />{children}</a>;
}
