// Slugs must be URL-safe: lowercase kebab-case, no spaces or special chars.
export function slugifyTitle(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Whether a stored slug is safe to prerender to disk.
 *
 * Slugs normally come from `slugifyTitle`, but rows imported or edited directly
 * in the database can contain characters that are invalid in a filename — `*`
 * and `?` being the common ones on Windows. Next.js writes one `.rsc`/`.html`
 * file per prerendered path, so such a slug makes the whole build fail with
 * ENOENT instead of just skipping that page.
 *
 * Anything rejected here is simply left out of `generateStaticParams`. The route
 * still works: Next.js renders it on first request and caches it like any other
 * ISR page.
 */
export function isPrerenderableSlug(slug: string): boolean {
  // Reserved on Windows regardless of extension, plus control characters.
  return /^[A-Za-z0-9._-]+$/.test(slug) && !['CON', 'PRN', 'AUX', 'NUL'].includes(slug.toUpperCase());
}

