'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Heart, MapPin } from 'lucide-react';

type WishlistCard = { slug: string; title: string; location: string; category: string; price: number; image: string };

const inr = (n: number) => `Rs. ${Number(n).toLocaleString('en-IN')}`;

function Skeletons() {
  return (
    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((key) => (
        <div key={key} className="animate-pulse overflow-hidden rounded-3xl bg-white ring-1 ring-[#e4e3da]">
          <div className="h-44 bg-[#eef0e9]" />
          <div className="space-y-3 p-5">
            <div className="h-4 w-3/4 rounded bg-[#eef0e9]" />
            <div className="h-3 w-1/2 rounded bg-[#eef0e9]" />
            <div className="h-4 w-1/3 rounded bg-[#eef0e9]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function WishlistWorkspace() {
  const [cards, setCards] = useState<WishlistCard[] | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/wishlist?full=1', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) {
          window.location.href = '/login?callbackUrl=/account/wishlist';
          return;
        }
        const data = await response.json();
        setCards(Array.isArray(data.cards) ? data.cards : []);
      })
      .catch(() => setCards([]));
  }, []);

  const remove = async (slug: string) => {
    setRemoving(slug);
    try {
      const response = await fetch(`/api/wishlist?slug=${encodeURIComponent(slug)}`, { method: 'DELETE' });
      if (response.ok) setCards((current) => (current ? current.filter((card) => card.slug !== slug) : current));
    } finally {
      setRemoving(null);
    }
  };

  const loading = cards === null;
  const saved = cards ?? [];

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:py-16">
      <div className="flex flex-col gap-3 border-b border-[#dfe3d8] pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#b66b45]">Saved with love</p>
          <h1 className="mt-3 text-4xl text-[#173f35] md:text-6xl">Your wishlist</h1>
          <p className="sans mt-3 text-sm text-[#6c7770]">{loading ? 'Loading your saved stays…' : saved.length ? `${saved.length} ${saved.length === 1 ? 'stay' : 'stays'} waiting for your next trip into the hills.` : 'Tap the heart on any stay to keep it here.'}</p>
        </div>
        <Link href="/stays" className="sans inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#173f35] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#24584a]">
          Discover stays
          <ArrowRight size={15} />
        </Link>
      </div>

      {loading && <Skeletons />}

      {!loading && saved.length === 0 && (
        <div className="mt-12 flex flex-col items-center rounded-3xl bg-white p-12 text-center ring-1 ring-[#e4e3da]">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-[#fbeeef] text-[#e11d48]"><Heart size={34} /></span>
          <h2 className="mt-6 text-2xl font-semibold text-[#173f35]">Nothing saved yet</h2>
          <p className="sans mt-2 max-w-sm text-sm leading-6 text-[#6c7770]">Tap the heart on any stay you love and it will wait for you here — ready when you are.</p>
          <Link href="/stays" className="sans mt-6 inline-flex items-center gap-2 rounded-full bg-[#173f35] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#24584a]">
            Browse stays
            <ArrowRight size={15} />
          </Link>
        </div>
      )}

      {!loading && saved.length > 0 && (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((card) => (
            <article key={card.slug} className={`group relative overflow-hidden rounded-3xl bg-white ring-1 ring-[#e4e3da] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(23,63,53,.12)] ${removing === card.slug ? 'scale-95 opacity-0' : ''}`}>
              <div className="relative h-44 overflow-hidden bg-[#eef3f0]">
                <Link href={`/stays/${card.slug}`} aria-label={card.title}>
                  <Image src={card.image} alt={card.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" unoptimized className="object-cover transition duration-500 group-hover:scale-[1.05]" />
                </Link>
                <button type="button" aria-label={`Remove ${card.title} from wishlist`} onClick={() => remove(card.slug)} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 shadow-[0_2px_10px_rgba(23,63,53,.18)] transition hover:bg-white">
                  <Heart size={16} fill="#e11d48" className="text-rose-600" />
                </button>
              </div>
              <div className="p-5">
                <Link href={`/stays/${card.slug}`} className="line-clamp-1 text-lg font-bold text-[#173f35] transition hover:text-[#24584a]">
                  {card.title}
                </Link>
                <p className="sans mt-1.5 flex items-center gap-1.5 text-xs text-[#6c7770]">
                  <MapPin size={13} className="shrink-0 text-[#b66b45]" />
                  <span className="truncate">{card.location}</span>
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-[#eef1ec] pt-3">
                  <p className="sans">
                    <span className="text-[10px] uppercase tracking-[.16em] text-[#8a948c]">From </span>
                    <span className="font-bold text-[#173f35]">{inr(card.price)}</span>
                    <span className="text-xs text-[#8a948c]"> / night</span>
                  </p>
                  <Link href={`/stays/${card.slug}`} className="sans inline-flex items-center gap-1 text-xs font-bold text-[#b66b45] transition-all group-hover:gap-2">
                    View stay
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}