import { describe, expect, it } from 'vitest';
import { isPrerenderableSlug, slugifyTitle } from '@/lib/slug';

describe('isPrerenderableSlug', () => {
  it('accepts the normal kebab-case slugs the editor produces', () => {
    expect(isPrerenderableSlug('kathgodam-to-kainchi-dham-taxi-fare')).toBe(true);
    expect(isPrerenderableSlug('bhimtal-homestay')).toBe(true);
    expect(isPrerenderableSlug('stay_2024')).toBe(true);
  });

  it('rejects slugs with characters that are illegal in a filename', () => {
    // These come from rows edited directly in the database and previously
    // failed the whole prerender step with ENOENT.
    expect(isPrerenderableSlug('**kathgodam-to-kainchi-dham-taxi-fare**')).toBe(false);
    expect(isPrerenderableSlug('what?')).toBe(false);
    expect(isPrerenderableSlug('a/b')).toBe(false);
    expect(isPrerenderableSlug('a\\b')).toBe(false);
    expect(isPrerenderableSlug('a b')).toBe(false);
    expect(isPrerenderableSlug('')).toBe(false);
  });

  it('rejects Windows reserved device names', () => {
    expect(isPrerenderableSlug('con')).toBe(false);
    expect(isPrerenderableSlug('NUL')).toBe(false);
  });
});

describe('slugifyTitle', () => {
  it('produces a prerenderable slug from a messy title', () => {
    const slug = slugifyTitle('**Kathgodam to Kainchi Dham** Taxi Fare!');
    expect(slug).toBe('kathgodam-to-kainchi-dham-taxi-fare');
    expect(isPrerenderableSlug(slug)).toBe(true);
  });
});
