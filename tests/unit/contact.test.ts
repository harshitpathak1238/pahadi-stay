import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { SITE_EMAIL, SITE_PHONE_DISPLAY, SITE_PHONE_TEL, WHATSAPP_NUMBER, whatsappLink } from '@/lib/contact';
import { defaultWhatsAppMessage } from '@/components/ui/WhatsAppButton';

// Both tel: and WhatsApp targets carry the country code; the visible number is
// the same number without it.
const FULL_DIGITS = '919410379670';
const LOCAL_DIGITS = '9410379670';

describe('site contact details', () => {
  it('uses the support mailbox, not the old personal Gmail', () => {
    expect(SITE_EMAIL).toBe('support@kainchidarshan.com');
    expect(SITE_EMAIL).not.toMatch(/@gmail\.com$/);
  });

  it('shows the phone number grouped for readability', () => {
    expect(SITE_PHONE_DISPLAY).toBe('+91 94103 79670');
    // The mis-grouped variant that shipped inside blog bodies.
    expect(SITE_PHONE_DISPLAY).not.toContain('94103-379070');
    expect(SITE_PHONE_DISPLAY.replace(/\D/g, '')).toBe(FULL_DIGITS);
  });

  it('keeps tel: and WhatsApp targets on the same digits as the display text', () => {
    expect(SITE_PHONE_TEL.replace(/\D/g, '')).toBe(FULL_DIGITS);
    expect(WHATSAPP_NUMBER).toBe(FULL_DIGITS);
    expect(SITE_PHONE_TEL.endsWith(LOCAL_DIGITS)).toBe(true);
    // Guards the stray-digit regression: tel links used to carry ...379070.
    expect(SITE_PHONE_TEL).not.toContain('9194103379070');
    expect(WHATSAPP_NUMBER).not.toContain('9194103379070');
  });

  it('builds a WhatsApp deep link with an encoded message', () => {
    const link = whatsappLink('Hello, I want to book');
    expect(link.startsWith(`https://wa.me/${FULL_DIGITS}?text=`)).toBe(true);
    expect(link).toContain('Hello%2C%20I%20want%20to%20book');
  });
});

describe('WhatsApp button', () => {
  // The button used to be a draggable floating bubble that hid itself on
  // scroll and on an idle "does it overlap something" check, which made it
  // vanish at random on the rentals page. It is now a plain inline link, so
  // these assert the guarantees that fix depended on.
  it('always opens with a non-empty default message when none is passed', () => {
    expect(defaultWhatsAppMessage.trim().length).toBeGreaterThan(0);
    expect(defaultWhatsAppMessage).toContain('Kumaon');
  });

  it('encodes the default message into a valid wa.me link', () => {
    const link = whatsappLink(defaultWhatsAppMessage);
    expect(link.startsWith(`https://wa.me/${FULL_DIGITS}?text=`)).toBe(true);
    expect(decodeURIComponent(link.split('?text=')[1])).toBe(defaultWhatsAppMessage);
  });

  it('never renders hidden or unclickable markup', () => {
    // Guards the regression: the old button toggled `opacity: 0` and
    // `pointer-events: none` on itself. Only the JSX is checked - the doc
    // comment quotes the old behaviour, so matching the prose would fail.
    const source = readFileSync(
      new URL('../../components/ui/WhatsAppButton.tsx', import.meta.url),
      'utf8',
    );
    const jsx = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(jsx).not.toContain('pointer-events-none');
    expect(jsx).not.toContain('setHidden');
    expect(jsx).not.toContain('opacity');
  });
});