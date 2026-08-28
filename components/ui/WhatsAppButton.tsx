import { FaWhatsapp } from 'react-icons/fa';

const whatsappNumber = '919876543210';
export const defaultWhatsAppMessage = 'Namaste! I am planning a trip to Kumaon and would like help with stays, rides, rentals, or packages. Please share the best options, availability, and pricing. Thank you!';

export function WhatsAppMark({ size = 18 }: { size?: number }) {
  return <FaWhatsapp aria-hidden="true" size={size} />;
}

export function WhatsAppButton({ message, children = 'WhatsApp us', className = '', ariaLabel = 'Chat with KainchiDarshan on WhatsApp' }: { message: string; children?: React.ReactNode; className?: string; ariaLabel?: string }) {
  const href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  return <a href={href} target="_blank" rel="noreferrer" aria-label={ariaLabel} title={ariaLabel} className={`inline-flex items-center justify-center gap-2 rounded-full border border-[#b7d8c6] bg-[#e8f5ed] px-4 py-3 sans text-sm font-bold text-[#17633e] transition hover:bg-[#d9efdf] ${className}`}><WhatsAppMark size={18} />{children}</a>;
}
