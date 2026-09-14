// Shared media-URL classification for carousels (rides gallery, stay galleries).
// Plain URLs are stored in JSON arrays; video content is detected by extension or
// by YouTube/Vimeo link shape so no extra DB columns are needed.
export type MediaKind = 'image' | 'video' | 'youtube' | 'vimeo';

export function mediaKind(url: string): MediaKind {
  const clean = url.split('?')[0].toLowerCase();
  if (/\.(mp4|webm|ogv|mov|m4v)$/.test(clean)) return 'video';
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
  if (/vimeo\.com/i.test(url)) return 'vimeo';
  return 'image';
}

export function isVideoUrl(url: string): boolean {
  return mediaKind(url) !== 'image';
}

export function embedUrl(url: string): string | null {
  const kind = mediaKind(url);
  if (kind === 'youtube') {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  }
  if (kind === 'vimeo') {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    return match ? `https://player.vimeo.com/video/${match[1]}` : null;
  }
  return null;
}
