'use client';

import Link from 'next/link';
import { Heart, Star } from 'lucide-react';
import type { Listing } from '@/lib/mock-data';

interface ResultCardProps {
  stay: Listing;
  isWishlisted: boolean;
  onToggleWishlist: (slug: string) => void;
  view: 'list' | 'grid';
}

export function ResultCard({ stay, isWishlisted, onToggleWishlist, view }: ResultCardProps) {
  // Placeholder distance calculation (in real app, would use geolocation)
  const distance = Math.floor(Math.random() * 15) + 1; // 1-15 km random placeholder

  if (view === 'grid') {
    return (
      <article className="overflow-hidden rounded-lg border border-[#d9e0e8] bg-white shadow-sm transition hover:shadow-md">
        {/* Image with wishlist */}
        <div className="relative">
          <img src={stay.image} alt={stay.title} className="h-44 w-full object-cover sm:h-48" />
          <button
            aria-label={`Save ${stay.title}`}
            onClick={() => onToggleWishlist(stay.slug)}
            className="absolute right-2 top-2 rounded-full bg-white p-2 shadow hover:bg-[#f5f7fa]"
          >
            <Heart
              size={17}
              fill={isWishlisted ? '#e11d48' : 'none'}
              className={isWishlisted ? 'text-rose-600' : 'text-[#536274]'}
            />
          </button>
        </div>

        {/* Info */}
        <div className="p-4">
          <Link href={`/stays/${stay.slug}`} className="line-clamp-2 font-semibold text-[#1f2937] hover:text-[#1a3a2a]">
            {stay.title}
          </Link>

          {/* Rating and review count */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center gap-1 text-[#f59e0b]">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={14} fill="currentColor" />
              ))}
            </div>
            <span className="text-xs font-semibold text-[#1f2937]">{stay.rating.toFixed(1)}</span>
            <span className="text-xs text-[#536274]">(128 reviews)</span>
          </div>

          {/* Location */}
          <p className="mt-2 text-xs text-[#536274]">{stay.location}</p>

          {/* Description */}
          <p className="mt-2 line-clamp-2 text-xs text-[#536274]">{stay.description.replace(/<[^>]+>/g, '')}</p>

          {/* Price */}
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-xs text-[#536274]">From</p>
              <p className="font-bold text-[#1f2937]">₹{stay.price.toLocaleString('en-IN')}</p>
            </div>
            <button className="rounded bg-[#1a3a2a] px-3 py-2 text-xs font-bold text-white hover:bg-[#0f2818]">
              See prices
            </button>
          </div>
        </div>
      </article>
    );
  }

  // List view - horizontal card
  return (
    <article className="grid min-w-0 overflow-hidden rounded-lg border border-[#d9e0e8] bg-white shadow-sm transition hover:shadow-md md:gap-4 md:grid-cols-[200px_minmax(0,1fr)_150px]">
      {/* Image with wishlist */}
      <div className="relative">
        <img src={stay.image} alt={stay.title} className="h-36 w-full object-cover sm:h-40 md:h-48" />
        <button
          aria-label={`Save ${stay.title}`}
          onClick={() => onToggleWishlist(stay.slug)}
          className="absolute right-2 top-2 rounded-full bg-white p-2 shadow hover:bg-[#f5f7fa]"
        >
          <Heart
            size={17}
            fill={isWishlisted ? '#e11d48' : 'none'}
            className={isWishlisted ? 'text-rose-600' : 'text-[#536274]'}
          />
        </button>
      </div>

      {/* Info - center column */}
      <div className="flex flex-col justify-between p-3 sm:p-4">
        <div>
          <Link
            href={`/stays/${stay.slug}`}
            className="line-clamp-2 font-semibold text-[#1f2937] hover:text-[#1a3a2a]"
          >
            {stay.title}
          </Link>

          {/* Rating */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center gap-1 text-[#f59e0b]">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={13} fill="currentColor" />
              ))}
            </div>
            <span className="text-xs font-semibold text-[#1f2937]">{stay.rating.toFixed(1)}</span>
          </div>

          {/* Location and distance */}
          <p className="mt-1 text-xs text-[#536274]">
            {stay.location} · <span className="font-semibold">{distance} km away</span>
          </p>

          {/* Description */}
          <p className="mt-2 line-clamp-2 text-xs text-[#536274]">{stay.description.replace(/<[^>]+>/g, '')}</p>
        </div>
      </div>

      {/* Right column - pricing and CTA */}
      <div className="flex flex-row items-center justify-between gap-3 border-t border-[#e5e7eb] p-3 md:flex-col md:items-end md:justify-between md:border-l md:border-t-0 md:p-4">
        {/* Rating badge */}
        <div className="rounded bg-[#1a3a2a] p-2 text-center text-white">
          <div className="text-sm font-bold">{stay.rating.toFixed(1)}</div>
          <div className="text-xs">Excellent</div>
        </div>

        {/* Price and button */}
        <div className="text-right">
          <p className="text-xs text-[#536274]">From</p>
          <p className="font-bold text-[#1f2937]">₹{stay.price.toLocaleString('en-IN')}</p>
          <p className="text-xs text-[#536274]">/ night</p>
          <button className="mt-2 rounded bg-[#1a3a2a] px-4 py-2 text-xs font-bold text-white hover:bg-[#0f2818]">
            Show prices
          </button>
        </div>
      </div>
    </article>
  );
}
