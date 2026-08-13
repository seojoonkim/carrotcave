'use client';

import { useEffect, useRef } from 'react';

export default function ReadingProgress() {
  const fillRef = useRef<HTMLSpanElement>(null);
  const trackRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const percent = max > 0 ? Math.min(100, Math.max(0, window.scrollY / max * 100)) : 0;
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${percent / 100})`;
      trackRef.current?.style.setProperty('--cc-reading-percent', `${percent}%`);
      if (trackRef.current) trackRef.current.dataset.active = percent > 0 ? 'true' : 'false';
      trackRef.current?.setAttribute('aria-valuenow', String(Math.round(percent)));
    };
    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <span
      ref={trackRef}
      className="cc-reading-progress"
      role="progressbar"
      aria-label="전체 글 읽기 진행률"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
    >
      <span ref={fillRef} className="cc-reading-progress__fill" aria-hidden="true" />
      <span className="cc-reading-progress__carrot" aria-hidden="true" />
    </span>
  );
}
