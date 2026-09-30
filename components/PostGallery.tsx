'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Multi-image post gallery: one large image with a thumbnail strip below.
 * The stage is a native scroll-snap track, so touch swipe, trackpad and
 * keyboard all work without a gesture library; thumbnails jump to a slide.
 */
export default function PostGallery({ urls }: { urls: string[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Track which slide is centred while the user swipes/scrolls.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const width = track.clientWidth || 1;
        const next = Math.max(0, Math.min(urls.length - 1, Math.round(track.scrollLeft / width)));
        setActive(next);
      });
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener('scroll', onScroll);
    };
  }, [urls.length]);

  // Keep the active thumbnail visible inside the strip (strip scroll only, never the page).
  useEffect(() => {
    const strip = thumbsRef.current;
    const thumb = strip?.children[active] as HTMLElement | undefined;
    if (!strip || !thumb) return;
    const left = thumb.offsetLeft - (strip.clientWidth - thumb.clientWidth) / 2;
    strip.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [active]);

  const goTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(urls.length - 1, index));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollTo({ left: clamped * track.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
    setActive(clamped);
  }, [urls.length]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); goTo(active + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(active - 1); }
  };

  return (
    <figure className="post-gallery" aria-roledescription="carousel" aria-label={`사진 ${urls.length}장`}>
      <div className="post-gallery-stage">
        <div
          ref={trackRef}
          className="post-gallery-track"
          tabIndex={0}
          onKeyDown={onKeyDown}
          aria-live="polite"
        >
          {urls.map((url, i) => (
            <div
              key={url}
              className="post-gallery-slide"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${urls.length}`}
            >
              <img src={url} alt="" loading={i === 0 ? 'eager' : 'lazy'} decoding="async" draggable={false} />
            </div>
          ))}
        </div>
        <button type="button" className="post-gallery-nav is-prev" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="이전 사진">‹</button>
        <button type="button" className="post-gallery-nav is-next" onClick={() => goTo(active + 1)} disabled={active === urls.length - 1} aria-label="다음 사진">›</button>
        <span className="post-gallery-count" aria-hidden="true">{active + 1} / {urls.length}</span>
      </div>
      <div ref={thumbsRef} className="post-gallery-thumbs" role="tablist" aria-label="사진 선택">
        {urls.map((url, i) => (
          <button
            key={url}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={`사진 ${i + 1}`}
            className="post-gallery-thumb"
            onClick={() => goTo(i)}
          >
            <img src={url} alt="" loading="lazy" decoding="async" draggable={false} />
          </button>
        ))}
      </div>
    </figure>
  );
}
