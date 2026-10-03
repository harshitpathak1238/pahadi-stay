'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpenText, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Travel-journal rail.
 *
 * Full-height portrait cards laid out in a horizontal snap-scroller. Keeps the
 * same interaction as the stays rail (drag, swipe, arrow buttons) but swaps the
 * fixed grid for a track that scrolls — so a card is always seen whole rather
 * than cropped mid-column on narrow screens.
 *
 * Arrows are hidden until the track actually overflows, which avoids showing a
 * dead control when there are only one or two posts.
 */

export type JournalCard = {
  slug: string;
  title: string;
  excerpt?: string | null;
  category?: string | null;
  featuredImage?: string | null;
  imageAltText?: string | null;
  publishedAt?: string | Date | null;
};

function formatDate(value?: string | Date | null) {
  return new Date(value ?? Date.now()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function JournalRail({ posts }: { posts: JournalCard[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);

  // Only offer arrows when the track overflows; recompute on resize so the
  // controls appear/disappear as the viewport crosses the breakpoint.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const update = () => setCanScroll(rail.scrollWidth > rail.clientWidth + 4);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [posts.length]);

  const scrollByCard = useCallback((direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector<HTMLElement>('[data-journal-card]');
    rail.scrollBy({ left: direction * ((card?.offsetWidth ?? 320) + 24), behavior: 'smooth' });
  }, []);

  if (!posts.length) return null;

  return (
    <div className="relative mt-9">
      <div
        ref={railRef}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-4 pb-2 md:-mx-2 md:px-2"
      >
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            data-journal-card
            className="group flex w-[80vw] max-w-[380px] shrink-0 snap-start flex-col overflow-hidden rounded-[1.75rem] border border-[#e3e7df] bg-white shadow-[0_20px_50px_rgba(23,63,53,.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(23,63,53,.10)] sm:w-[340px]"
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              {post.featuredImage ? (
                <Image
                  src={post.featuredImage}
                  alt={post.imageAltText || post.title}
                  fill
                  sizes="(max-width: 640px) 80vw, 340px"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-[#edf0ea] text-[#173f35]">
                  <BookOpenText size={36} strokeWidth={1.5} />
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col p-5">
              <div className="sans flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#b66b45]">
                <span>{post.category}</span>
                <span>•</span>
                <span>{formatDate(post.publishedAt)}</span>
              </div>
              <h3 className="mt-3 text-xl leading-tight text-[#173f35]">{post.title}</h3>
              {post.excerpt && (
                <p className="sans mt-3 line-clamp-3 text-sm leading-6 text-[#607067]">{post.excerpt}</p>
              )}
              <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-bold text-[#24584a]">
                Read story <ArrowRight size={15} />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {canScroll && (
        <>
          <button
            type="button"
            aria-label="Scroll stories left"
            onClick={() => scrollByCard(-1)}
            className="absolute -left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-[#173f35] shadow ring-1 ring-[#e4e3da] hover:bg-[#f7f4ec] md:grid"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Scroll stories right"
            onClick={() => scrollByCard(1)}
            className="absolute -right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-[#173f35] shadow ring-1 ring-[#e4e3da] hover:bg-[#f7f4ec] md:grid"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}
      <p className="sans mt-3 text-center text-xs text-[#8a948c] md:hidden">Swipe to explore more stories →</p>
    </div>
  );
}
