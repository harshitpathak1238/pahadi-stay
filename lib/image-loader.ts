export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // Local assets: serve as-is.
  if (src.startsWith('/')) return src;
  try {
    const url = new URL(src);
    // Clamp to sane render widths: requesting the stored w=1000/1200/2000 for
    // a 130px card thumb is what produced the 2.7MB "improve image delivery"
    // saving in PageSpeed. Mobile cards never need more than ~640px.
    const capped = Math.min(width, 1200);
    const q = Math.min(quality || 70, 75);
    // Unsplash params (the bulk of catalogue imagery): rewrite, not append.
    if (url.hostname.includes('unsplash.com')) {
      url.searchParams.set('auto', 'format');
      url.searchParams.set('fit', 'crop');
      url.searchParams.set('w', String(capped));
      url.searchParams.set('q', String(q));
      return url.toString();
    }
    if (!url.searchParams.has('w')) url.searchParams.set('w', String(capped));
    if (!url.searchParams.has('q')) url.searchParams.set('q', String(q));
    return url.toString();
  } catch {
    return src;
  }
}

