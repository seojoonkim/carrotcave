'use client';

import { useEffect, useRef, useState } from 'react';
import { t, type Locale } from '@/lib/i18n';

// Reading depth: every post a reader finishes (the end section comes into view) adds one hole.
// Every FLOOR_EVERY holes the reader goes one floor deeper. Stored only in this browser
// (localStorage) — no account, nothing sent anywhere.
export const DEPTH_KEY = 'cc-read-holes';
export const FLOOR_EVERY = 3;

function readSet(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(DEPTH_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function depthOf(n: number) {
  const floor = Math.max(1, Math.ceil(n / FLOOR_EVERY));
  const inFloor = n - (floor - 1) * FLOOR_EVERY; // 1..FLOOR_EVERY
  return { floor, left: FLOOR_EVERY - inFloor || FLOOR_EVERY, pct: (inFloor / FLOOR_EVERY) * 100 };
}

export default function ReadingDepth({ slug, locale }: { slug: string; locale: Locale }) {
  const L = t(locale);
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState<number | null>(null);
  const [fresh, setFresh] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const done = readSet();
    if (done.includes(slug)) { setCount(done.length); return; }
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      const now = readSet();
      if (!now.includes(slug)) now.push(slug);
      try { localStorage.setItem(DEPTH_KEY, JSON.stringify(now.slice(-500))); } catch { /* private mode */ }
      setCount(now.length);
      setFresh(true);
      io.disconnect();
    }, { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [slug]);

  const ready = count !== null;
  const d = depthOf(count ?? 0);
  return (
    <div ref={ref} className="cc-depth" data-ready={ready ? 'true' : 'false'} data-fresh={fresh ? 'true' : 'false'} aria-live="polite">
      <span className="cc-depth__floor">{ready ? L.depthFloor(d.floor) : '\u00a0'}</span>
      <span className="cc-depth__body">
        <span className="cc-depth__note">{ready ? L.depthNote(count) : '\u00a0'}</span>
        <span className="cc-depth__meter" aria-hidden="true"><span style={{ width: `${ready ? d.pct : 0}%` }} /></span>
        <span className="cc-depth__next">{ready ? L.depthNext(d.left) : '\u00a0'}</span>
      </span>
    </div>
  );
}
