export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // For Hostinger media API, return the URL as-is without optimization parameters
  // because the PHP endpoint doesn't support them
  if (src.includes('springgreen-salmon-184354.hostingersite.com')) {
    return src;
  }
  
  // For other images, use the default optimization
  return `${src}?w=${width}&q=${quality || 75}`;
}
