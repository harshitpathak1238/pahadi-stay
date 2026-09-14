'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { embedUrl, mediaKind } from '@/lib/media';

type Item = { url: string; kind: ReturnType<typeof mediaKind> };

export function RideGallery({ media, title }: { media: string[]; title: string }) {
  const items: Item[] = media.filter(Boolean).map((url) => ({ url, kind: mediaKind(url) }));
  const [index, setIndex] = useState(0);
  if (items.length === 0) {
    return <div className="h-64 rounded-3xl bg-[#eef3f0] md:h-[420px]" aria-hidden="true" />;
  }
  const current = items[Math.min(index, items.length - 1)];
  const step = (direction: -1 | 1) => setIndex((current) => (current + direction + items.length) % items.length);
  const embed = current.kind === 'youtube' || current.kind === 'vimeo' ? embedUrl(current.url) : null;
  return (
    <div>
      <div className="group relative overflow-hidden rounded-3xl bg-[#122a24] ring-1 ring-[#e4e3da]">
        <div className="relative h-64 sm:h-80 md:h-[440px]">
          {current.kind === 'image' && (
            <Image key={current.url} src={current.url} alt={`${title} — media ${index + 1}`} fill sizes="(max-width: 768px) 100vw, 1152px" unoptimized className="object-cover" priority={index === 0} />
          )}
          {current.kind === 'video' && (
            <video key={current.url} src={current.url} controls preload="metadata" playsInline className="h-full w-full object-contain" aria-label={`${title} — video ${index + 1}`} />
          )}
          {embed && (
            <iframe key={current.url} src={embed} title={`${title} — video ${index + 1}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="absolute inset-0 h-full w-full" />
          )}
        </div>

        {items.length > 1 && (
          <>
            <button type="button" aria-label="Previous media" onClick={() => step(-1)} className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#173f35] shadow-md backdrop-blur-sm transition hover:bg-white">
              <ChevronLeft size={18} />
            </button>
            <button type="button" aria-label="Next media" onClick={() => step(1)} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#173f35] shadow-md backdrop-blur-sm transition hover:bg-white">
              <ChevronRight size={18} />
            </button>
            <span className="sans absolute bottom-4 right-4 rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">{index + 1} / {items.length}</span>
          </>
        )}
        {(current.kind === 'video' || current.kind === 'youtube' || current.kind === 'vimeo') && (
          <span className="sans absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-xs font-bold uppercase tracking-[.12em] text-white backdrop-blur-sm"><Play size={11} /> Video</span>
        )}
      </div>

      {items.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item, i) => (
            <button
              key={`${item.url}-${i}`}
              type="button"
              aria-label={`Show media ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl transition sm:h-[72px] sm:w-28 ${i === index ? 'ring-2 ring-[#173f35] ring-offset-2 ring-offset-[#faf6ec]' : 'opacity-70 hover:opacity-100'}`}
            >
              {item.kind === 'image' ? (
                <Image src={item.url} alt="" fill sizes="112px" unoptimized className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-[#1c3833] text-white"><Play size={18} /></span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
