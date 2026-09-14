export const SITE_EMAIL = 'kainchidarshan@gmail.com';
export const SITE_PHONE_DISPLAY = '+91 94103 79670';
export const SITE_PHONE_TEL = '+919410379670';
export const WHATSAPP_NUMBER = '919410379670';

export function whatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
