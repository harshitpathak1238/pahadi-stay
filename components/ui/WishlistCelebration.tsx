'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { useWishlistCelebration } from '@/hooks/use-wishlist';

/**
 * Full-screen confirmation shown the moment a stay is saved to the wishlist.
 *
 * Saving used to be a 650ms heart wobble and nothing else, which is easy to
 * miss on a long results grid. This is the celebration that replaced it: a
 * dimmed stage, a burst of confetti, the brand mark, and one obvious way out.
 *
 * Confetti is plain DOM plus CSS keyframes rather than a canvas or a physics
 * library — it needs no dependency, never runs a rAF loop, and stops the
 * moment the overlay unmounts. Pieces are generated from a seeded PRNG so the
 * first client render is deterministic and never differs from the server's.
 */

const CONFETTI_COLOURS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#f97316', '#ec4899', '#a855f7', '#06b6d4'];
const CONFETTI_COUNT = 64;

/** Small deterministic PRNG (mulberry32) so the burst is stable per seed. */
function makeRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildConfetti(seed: number) {
  const random = makeRng(seed);
  return Array.from({ length: CONFETTI_COUNT }, (_, index) => {
    const size = 6 + Math.round(random() * 8);
    const duration = 2.6 + random() * 1.8;
    // Half the pieces start already mid-fall (negative delay) so the overlay is
    // never a bare black screen on open; the rest stagger in as a burst.
    const alreadyFalling = random() > 0.5;
    return {
      key: index,
      left: random() * 100,
      width: size,
      height: Math.round(size * (0.4 + random() * 0.5)),
      colour: CONFETTI_COLOURS[Math.floor(random() * CONFETTI_COLOURS.length)],
      delay: alreadyFalling ? -(random() * duration) : random() * 1.2,
      duration,
      drift: -60 + random() * 120,
      spin: 360 + Math.round(random() * 720),
    };
  });
}

export function WishlistCelebration({ title, onClose }: { title: string; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const pieces = useMemo(() => buildConfetti(7), []);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  const handleKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    // Stop the page behind the overlay from scrolling with it.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [handleKey]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wishlist-celebration-title"
      aria-describedby="wishlist-celebration-body"
      className="wishlist-celebration fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-[#0b0b0c]"
      onClick={onClose}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {pieces.map((piece) => (
          <span
            key={piece.key}
            className="wishlist-confetti"
            style={{
              left: `${piece.left}%`,
              width: `${piece.width}px`,
              height: `${piece.height}px`,
              backgroundColor: piece.colour,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              // Custom properties keep the per-piece variation out of the
              // keyframes, so one shared @keyframes rule covers every piece.
              ['--confetti-drift' as string]: `${piece.drift}px`,
              ['--confetti-spin' as string]: `${piece.spin}deg`,
            }}
          />
        ))}
      </div>

      <div
        className="wishlist-celebration-card relative z-10 mx-5 flex max-w-xl flex-col items-center px-2 text-center"
        onClick={(event) => event.stopPropagation()}
      >
        <Image
          src="/images/Logo.png"
          alt=""
          width={260}
          height={100}
          priority
          className="h-14 w-auto max-w-[13rem] object-contain brightness-0 invert md:h-16"
        />

        <h2 id="wishlist-celebration-title" className="mt-7 text-2xl font-bold tracking-tight text-white md:text-[28px]">
          You&apos;re on the wishlist
        </h2>
        <p id="wishlist-celebration-body" className="mt-3 max-w-md text-[15px] leading-7 text-white/70">
          <span className="font-semibold text-white/90">{title}</span> is saved to your wishlist. Find it any time from
          your account menu.
        </p>

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="mt-8 inline-flex min-w-[15rem] items-center justify-center rounded-full bg-[#1d4ed8] px-8 py-3.5 text-[15px] font-semibold text-white transition hover:bg-[#1e40af] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0c]"
        >
          Keep exploring
        </button>
      </div>

      {/* Kept outside the animated card on purpose: its entry keyframes apply a
          transform, and a transformed ancestor becomes the containing block for
          `position: fixed`, which would pin this button beside the logo instead
          of to the viewport corner. */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="absolute right-4 top-4 z-20 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 md:right-6 md:top-6"
      >
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Mounts the overlay a single time for the page.
 *
 * Wishlist hearts live in every result card and on the detail page, so the
 * trigger lives in the shared hook; rendering the overlay from each button
 * would stack one dialog per card. This renders nothing until a save fires.
 */
export function WishlistCelebrationHost() {
  const { celebration, dismiss } = useWishlistCelebration();
  if (!celebration) return null;
  return <WishlistCelebration title={celebration.title} onClose={dismiss} />;
}