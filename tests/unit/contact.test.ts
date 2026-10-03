import { describe, expect, it } from 'vitest';
import { SITE_EMAIL, SITE_PHONE_DISPLAY, SITE_PHONE_TEL, WHATSAPP_NUMBER, whatsappLink } from '@/lib/contact';

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