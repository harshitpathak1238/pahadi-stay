'use client';

import { FaWhatsapp } from 'react-icons/fa';
import { whatsappLink } from '@/lib/contact';

/**
 * Fallback enquiry text.
 *
 * Used whenever a caller does not pass a specific `message`, so the chat always
 * opens with something useful rather than a blank composer. Contextual callers
 * (a rental, a stay, a ride) should still pass their own message so the team
 * knows what the guest is asking about before they reply.
 */
export const defaultWhatsAppMessage =
  'Namaste! I am planning a trip to Kumaon and would like help with stays, rides, rentals, or packages. Please share the best options, availability, and pricing. Thank you!';

export function WhatsAppMark({ size = 18 }: { size?: number }) {
  return <FaWhatsapp aria-hidden="true" size={size} />;
}

/**
 * WhatsApp call-to-action.
 *
 * This is an inline button, not a floating bubble. It used to carry
 * drag-to-reposition behaviour plus a scroll/idle auto-hide that applied
 * `opacity: 0` and `pointer-events: none` whenever it decided it was covering
 * other content — which made it disappear at random on the rentals page. A
 * plain, always-visible link is simpler and more reliable: nothing here hides,
 * repositions, or disables itself.
 */
export function WhatsAppButton({
  message = defaultWhatsAppMessage,
  children = 'WhatsApp us',
  className = '',
  ariaLabel = 'Chat with KainchiDarshan on WhatsApp',
}: {
  message?: string;
  children?: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const href = whatsappLink(message);

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={ariaLabel}
      className={`whatsapp-cta inline-flex shrink-0 select-none items-center justify-center gap-2 rounded-full bg-[#25d366] px-4 py-2.5 sans text-sm font-bold text-white shadow-[0_8px_20px_rgba(37,211,102,.32)] transition duration-200 hover:bg-[#1eb855] hover:shadow-[0_10px_26px_rgba(37,211,102,.42)] active:scale-[.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#128c7e] ${className}`}
    >
      <WhatsAppMark size={18} />
      {children}
    </a>
  );
}
