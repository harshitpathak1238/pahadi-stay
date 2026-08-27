import { MessageCircle } from 'lucide-react';

const whatsappNumber = '919876543210';

export function WhatsAppButton({ message, children = 'WhatsApp us', className = '' }: { message: string; children?: React.ReactNode; className?: string }) {
  const href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  return <a href={href} target="_blank" rel="noreferrer" className={`inline-flex items-center justify-center gap-2 rounded-full border border-[#b7d8c6] bg-[#e8f5ed] px-4 py-3 sans text-sm font-bold text-[#17633e] transition hover:bg-[#d9efdf] ${className}`}><MessageCircle size={17} />{children}</a>;
}
