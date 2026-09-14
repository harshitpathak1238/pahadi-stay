'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, MapPin, Star } from 'lucide-react';
import type { Listing } from '@/lib/mock-data';
import { cardDescriptionSnippet } from '@/lib/sanitize-html';

interface ResultCardProps {
  stay: Listing;
  isWishlisted: boolean;
  onToggleWishlist: (slug: string) => void;
  view: 'list' | 'grid';
}

function ratingLabel(rating: number) {
  return rating >= 4.8 ? 'Excellent' : rating >= 4 ? 'Very good' : 'Good';
}

function SaveButton({ stay, isWishlisted, onToggleWishlist }: Pick<ResultCardProps, 'stay' | 'isWishlisted' | 'onToggleWishlist'>) {
  const [pop, setPop] = useState(false);
  const previous = useRef(isWishlisted);
  useEffect(() => {
    if (isWishlisted && !previous.current) {
      setPop(true);
      const timer = window.setTimeout(() => setPop(false), 650);
      return () => window.clearTimeout(timer);
    }
    previous.current = isWishlisted;
  }, [isWishlisted]);
  return (
    <button
      aria-label={isWishlisted ? `Remove ${stay.title} from wishlist` : `Save ${stay.title} to wishlist`}
      aria-pressed={isWishlisted}
      onClick={() => onToggleWishlist(stay.slug)}
      className={`absolute right-2 top-2 rounded-full bg-white/95 p-2 shadow-[0_2px_8px_rgba(23,63,53,.18)] transition hover:bg-white ${pop ? 'heart-pop' : ''}`}
    >
      <Heart
        size={17}
        fill={isWishlisted ? '#e11d48' : 'none'}
        className={isWishlisted ? 'text-rose-600' : 'text-[#536274]'}
      />
    </button>
  );
}

// Single, consolidated rating presentation shared by both views.
function RatingRow({ stay }: { stay: Listing }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-0.5 text-[#f59e0b]">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={13} fill="currentColor" className={i <= Math.round(stay.rating) ? '' : 'opacity-25'} />
        ))}
      </div>
      <span className="text-xs font-bold text-[#173f35]">
        {stay.rating.toFixed(1)} <span className="font-semibold">{ratingLabel(stay.rating)}</span>
      </span>
    </div>
  );
}

export function discountPercent(basePrice?: number | null, sellPrice?: number | null) {
  if (basePrice == null || sellPrice == null) return 0;
  const base = Number(basePrice);
  const sell = Number(sellPrice);
  if (!Number.isFinite(base) || !Number.isFinite(sell) || base <= 0 || sell < 0 || sell >= base) return 0;
  return Math.round(((base - sell) / base) * 100);
}

export function StayPrice({ price, basePrice, size = 'md' }: { price: number; basePrice?: number | null; size?: 'md' | 'lg' }) {
  const off = discountPercent(basePrice, price);
  const priceClass = size === 'lg' ? 'text-2xl' : 'font-bold text-[#173f35]';
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={priceClass}>₹{Number(price).toLocaleString('en-IN')}</span>
      {off > 0 && (
        <>
          <s className="text-xs font-semibold text-[#8a948c] sm:text-sm">₹{Number(basePrice).toLocaleString('en-IN')}</s>
          <span className="rounded-full bg-[#e7f2ec] px-2 py-0.5 text-[11px] font-bold text-[#1d7a4f]">{off}% off</span>
        </>
      )}
    </span>
  );
}

// Clean plain-text snippet — never raw HTML/CSS, no citation artifacts.
function Snippet({ description }: { description: string }) {
  const snippet = cardDescriptionSnippet(description);
  if (!snippet) return null;
  return <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#536274]">{snippet}</p>;
}

export function ResultCard({ stay, isWishlisted, onToggleWishlist, view }: ResultCardProps) {
  if (view === 'grid') {
    return (
      <article className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_10px_28px_rgba(23,63,53,.10)] ring-1 ring-[#e4e8e2] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(23,63,53,.14)]">
        <div className="relative h-44 w-full sm:h-48">
          <Image src={stay.image} alt={stay.title} fill sizes="(max-width: 768px) 92vw, 33vw" className="object-cover" />
          <SaveButton stay={stay} isWishlisted={isWishlisted} onToggleWishlist={onToggleWishlist} />
        </div>

        <div className="flex flex-1 flex-col p-4">
          <Link href={`/stays/${stay.slug}`} className="line-clamp-2 text-lg font-bold text-[#173f35] hover:text-[#24584a]">
            {stay.title}
          </Link>

          <RatingRow stay={stay} />

          <p className="mt-1.5 flex min-w-0 items-center gap-1 truncate text-sm text-[#536274]">
            <MapPin size={13} className="shrink-0 text-[#24584a]" />
            <span className="truncate">{stay.location}</span>
          </p>

          <Snippet description={stay.description} />

          <div className="mt-3 flex items-end justify-between gap-2 border-t border-[#eef1ec] pt-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#536274]">From</p>
              <StayPrice price={stay.price} basePrice={stay.basePrice} />
              <p className="text-xs font-semibold text-[#536274]"> / night</p>
            </div>
            <Link href={`/stays/${stay.slug}`} className="rounded-full bg-[#173f35] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#24584a]">
              Show prices
            </Link>
          </div>
        </div>
      </article>
    );
  }

  // List view - horizontal card
  return (
    <article className="grid min-w-0 overflow-hidden rounded-2xl bg-white shadow-[0_10px_28px_rgba(23,63,53,.10)] ring-1 ring-[#e4e8e2] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(23,63,53,.14)] md:grid-cols-[220px_minmax(0,1fr)_200px]">
      <div className="relative h-36 w-full sm:h-40 md:h-full md:min-h-[200px]">
        <Image src={stay.image} alt={stay.title} fill sizes="(max-width: 768px) 92vw, 220px" className="object-cover" />
        <SaveButton stay={stay} isWishlisted={isWishlisted} onToggleWishlist={onToggleWishlist} />
      </div>

      <div className="flex min-w-0 flex-col p-4 sm:p-5">
        <Link href={`/stays/${stay.slug}`} className="line-clamp-2 text-lg font-bold text-[#173f35] hover:text-[#24584a]">
          {stay.title}
        </Link>

        <RatingRow stay={stay} />

        <p className="mt-1.5 flex min-w-0 items-center gap-1 truncate text-sm text-[#536274]">
          <MapPin size={13} className="shrink-0 text-[#24584a]" />
          <span className="truncate">{stay.location}</span>
        </p>

        <Snippet description={stay.description} />
      </div>

      <div className="flex flex-row items-end justify-between gap-3 border-t border-[#eef1ec] p-4 sm:items-center md:flex-col md:items-stretch md:justify-between md:border-l md:border-t-0">
        <div className="md:text-right">
          <p className="text-[11px] uppercase tracking-wide text-[#536274]">From</p>
          <StayPrice price={stay.price} basePrice={stay.basePrice} />
          <p className="text-xs font-semibold text-[#536274]"> / night</p>
        </div>
        <Link href={`/stays/${stay.slug}`} className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-[#173f35] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#24584a] md:mt-3">
          Show prices
        </Link>
      </div>
    </article>
  );
}
