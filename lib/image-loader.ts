export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // Local assets: serve as-is.
  if (src.startsWith('/')) return src;
  // Remote URLs without their own sizing params: append width/quality.
  try {
    const url = new URL(src);
    if (!url.searchParams.has('w')) url.searchParams.set('w', String(width));
    if (!url.searchParams.has('q')) url.searchParams.set('q', String(quality || 75));
    return url.toString();
  } catch {
    return src;
  }
}

