'use client';

import { useEffect, useRef, useState } from 'react';

type Props = { srcDoc: string; title: string; minHeight?: number; className?: string };

/**
 * Renders a sandboxed srcDoc iframe that grows with its content.
 * Works because srcDoc documents inherit the parent origin and the iframe
 * keeps `allow-same-origin`, so the parent can read the inner document size.
 * A pulsing skeleton matching `minHeight` is shown until the inner document
 * reports readyState === 'complete', so the slot never looks empty/broken.
 */
export function AutoHeightIframe({ srcDoc, title, minHeight = 400, className = '' }: Props) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const [height, setHeight] = useState(minHeight);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    setHeight(minHeight);
    setLoaded(false);
    const measure = () => {
      try {
        const doc = frame.contentDocument;
        if (!doc) return;
        if (doc.readyState === 'complete') setLoaded(true);
        const next = Math.max(doc.documentElement?.scrollHeight || 0, doc.body?.scrollHeight || 0);
        if (next > 0) setHeight((current) => (next > current ? next : Math.max(minHeight, current)));
      } catch {
        /* document not ready yet — the load handler measures again */
      }
    };
    const attach = () => {
      measure();
      const doc = frame.contentDocument;
      if (!doc) return;
      if (doc.readyState === 'complete') {
        setLoaded(true);
      } else {
        doc.addEventListener('readystatechange', () => { if (doc.readyState === 'complete') { setLoaded(true); measure(); } }, { once: true });
      }
      if (typeof ResizeObserver === 'undefined') return;
      observerRef.current?.disconnect();
      const observer = new ResizeObserver(measure);
      observer.observe(doc.documentElement);
      if (doc.body) observer.observe(doc.body);
      observerRef.current = observer;
      const watchImages = () => doc.querySelectorAll('img').forEach((image) => {
        if (!image.complete) image.addEventListener('load', measure, { once: true });
      });
      watchImages();
      // Late-inserted nodes (scripts, editors) also need measurement + image watching.
      new MutationObserver(() => { measure(); watchImages(); }).observe(doc.body || doc.documentElement, { childList: true, subtree: true });
    };
    frame.addEventListener('load', attach);
    attach();
    return () => {
      frame.removeEventListener('load', attach);
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [srcDoc, minHeight]);

  return (
    <div className={`relative ${className}`} style={{ minHeight: loaded ? undefined : minHeight }}>
      {!loaded && <div aria-hidden="true" className="absolute inset-0 animate-pulse rounded-xl bg-[#e8eae4]" style={{ minHeight }} />}
      <iframe
        ref={frameRef}
        title={title}
        srcDoc={srcDoc}
        sandbox="allow-same-origin"
        className={`block w-full border-0 transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ height }}
      />
    </div>
  );
}

