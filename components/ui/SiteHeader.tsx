'use client';

import { useEffect, useState } from 'react';

export function SiteHeader({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [overHero, setOverHero] = useState(false);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Flip to glass very early so the bar never looks like a white card at the top.
        setScrolled(window.scrollY > 8);
        // Header sits on top of the dark hero only while the hero is behind it.
        const hero = document.querySelector('.hero-wash');
        if (hero) {
          const rect = hero.getBoundingClientRect();
          setOverHero(rect.top <= 72 && rect.bottom > 72);
        } else {
          setOverHero(false);
        }
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const hero = overHero && !scrolled;
  const className = `site-header${scrolled ? ' is-scrolled' : ''}${hero ? ' is-hero' : ''}`;

  return (
    <header className={className} data-scrolled={scrolled} data-hero={hero}>
      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6">
        <div className="site-header-bar mx-auto flex min-h-[56px] items-center justify-between gap-2 px-1 py-2 sm:px-2 md:min-h-[68px] md:gap-5 md:px-3">
          {children}
        </div>
      </div>
    </header>
  );
}
