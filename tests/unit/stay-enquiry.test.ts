import { describe, expect, it } from 'vitest';
import { buildStayEnquiryMessage, enquiryBedroomsFromStay, enquiryTotalPerNight, stayEnquiryWhatsappLink } from '../../lib/stay-enquiry';

const stay = {
  title: 'Oak House by the Lake',
  location: 'Bhimtal, Uttarakhand',
  slug: 'oak-house-bhimtal',
  price: 4200,
  image: 'cover.jpg',
  images: ['cover.jpg', 'garden.jpg'],
  accommodations: [
    { title: 'Deluxe King bedroom', description: 'Newly constructed', image: 'king-1.jpg', images: ['king-1.jpg', 'king-2.jpg'], price: 3000, bedrooms: 1, beds: 1 },
    { title: 'Garden twin bedroom', description: 'Quiet garden side', image: 'twin-1.jpg', images: [], price: 0, bedrooms: 1, beds: 2 },
  ],
};

describe('stay WhatsApp enquiry helpers', () => {
  it('maps accommodations into selectable bedrooms with merged photos', () => {
    const bedrooms = enquiryBedroomsFromStay(stay);
    expect(bedrooms.map((room) => room.title)).toEqual(['Deluxe King bedroom', 'Garden twin bedroom']);
    expect(bedrooms[0].photos).toEqual(['king-1.jpg', 'king-2.jpg']);
    expect(bedrooms[0].price).toBe(3000);
    expect(bedrooms[1].price).toBeNull(); // unset price → shown as "price on request"
  });

  it('falls back to one Entire property card when no rooms are configured', () => {
    const [fallback] = enquiryBedroomsFromStay({ ...stay, accommodations: [] });
    expect(fallback.title).toBe('Entire property');
    expect(fallback.photos).toEqual(['cover.jpg', 'garden.jpg']);
    expect(fallback.price).toBe(4200);
    expect(fallback.isEntireProperty).toBe(true);
  });

  it('builds a prefilled message with property, bedrooms and totals', () => {
    const bedrooms = enquiryBedroomsFromStay(stay);
    const message = buildStayEnquiryMessage({
      propertyTitle: stay.title,
      location: stay.location,
      url: 'https://kainchidarshan.com/stays/oak-house-bhimtal',
      bedrooms,
    });
    expect(message).toContain('Namaste KainchiDarshan!');
    expect(message).toContain('🏡 *Property:* Oak House by the Lake');
    expect(message).toContain('📍 *Location:* Bhimtal, Uttarakhand');
    expect(message).toContain('🔗 *Link:* https://kainchidarshan.com/stays/oak-house-bhimtal');
    expect(message).toContain('🛏️ *Bedroom(s) selected:* 2');
    expect(message).toContain('1. Deluxe King bedroom — ₹3,000 / night (1 Bedroom · 1 Bed)');
    expect(message).toContain('2. Garden twin bedroom — Price on request (1 Bedroom · 2 Beds)');
    expect(message).toContain('💰 *Estimated total:* ₹3,000 / night for 2 bedrooms');
  });

  it('marks unpriced selections as price on request', () => {
    const message = buildStayEnquiryMessage({
      propertyTitle: stay.title,
      location: stay.location,
      url: 'https://kainchidarshan.com/stays/oak-house-bhimtal',
      bedrooms: [{ title: 'Garden twin bedroom', price: null, bedrooms: 1, beds: 2 }],
    });
    expect(message).toContain('💰 *Estimated total:* Price on request');
  });

  it('sums per-night totals across selected bedrooms', () => {
    expect(enquiryTotalPerNight([{ price: 3000 }, { price: 2500 }, { price: null }])).toBe(5500);
  });

  it('builds a wa.me link with the encoded message', () => {
    const link = stayEnquiryWhatsappLink('Namaste 🙏');
    expect(link.startsWith('https://wa.me/')).toBe(true);
    expect(link).toContain(encodeURIComponent('Namaste 🙏'));
  });
});
