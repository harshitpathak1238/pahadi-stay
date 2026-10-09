'use client';

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
  // Inline brand glyph instead of `react-icons/fa`: importing the whole icon
  // font chunk for one mark added ~100kB to every page that renders a
  // WhatsApp button (PageSpeed "legacy JavaScript / unused JavaScript").
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M12.04 2a9.87 9.87 0 0 0-8.5 14.74L2 22l5.4-1.5A9.87 9.87 0 1 0 12.04 2Zm0 1.8a8.07 8.07 0 1 1-4.12 15.03l-.31-.18-3.11.86.87-3.03-.2-.31a8.07 8.07 0 0 1 6.87-12.37Zm-3.5 3.97c-.19 0-.49.07-.75.35-.26.28-1 .97-1 2.37s1.02 2.75 1.17 2.94c.14.19 2.02 3.18 5 4.3 2.48.93 2.98.74 3.52.7.54-.05 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.26-.2-.55-.35-.29-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.29-.14-1.23-.45-2.34-1.44-.87-.77-1.45-1.73-1.62-2.02-.17-.3-.02-.46.13-.6.13-.13.29-.35.44-.52.14-.17.19-.3.29-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.58Z" />
    </svg>
  );
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
