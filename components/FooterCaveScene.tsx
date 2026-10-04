'use client';
import { useEffect, useRef, useState } from 'react';
import { FOOTER_SCENE_SVG } from './footer-scene-svg';

import { CARROT_LINES, daypartOf, isFresh, type Daypart, type SceneMood } from '@/lib/footer-scene';
export type { SceneMood } from '@/lib/footer-scene';

export default function FooterCaveScene({ mood = 'all', latest }: { mood?: SceneMood; latest?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const taps = useRef(0);
  const [daypart, setDaypart] = useState<Daypart>('night');
  const [fresh, setFresh] = useState(false);
  const [said, setSaid] = useState('');

  useEffect(() => {
    const tick = () => { setDaypart(daypartOf(new Date().getHours())); setFresh(isFresh(latest)); };
    tick();
    const id = window.setInterval(tick, 10 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [latest]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const pet = () => {
      const line = CARROT_LINES[taps.current++ % CARROT_LINES.length];
      const text = root.querySelector('.tap-text');
      if (text) text.textContent = line;
      root.classList.remove('is-tapped');
      void root.offsetWidth; // restart the pop animation on every tap
      root.classList.add('is-tapped');
      setSaid(line);
    };
    const onClick = (e: Event) => { if ((e.target as Element).closest('.carrot-hit')) pet(); };
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && (e.target as Element).closest('.carrot-hit')) { e.preventDefault(); pet(); }
    };
    const onEnd = (e: AnimationEvent) => { if (e.animationName === 'cc-tap-pop') root.classList.remove('is-tapped'); };
    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKey);
    root.addEventListener('animationend', onEnd);
    return () => { root.removeEventListener('click', onClick); root.removeEventListener('keydown', onKey); root.removeEventListener('animationend', onEnd); };
  }, []);

  return (
    <div ref={ref} className="footer-scene" data-mood={mood} data-daypart={daypart} data-fresh={fresh ? 'true' : 'false'}>
      <p className="sr-only">졸던 당근에게 깡충깡충 다가간 토끼와, 숨었다가 튀어나와 윙크하는 당근. 당근을 누르면 말을 걸어요.</p>
      <div className="footer-scene__art" dangerouslySetInnerHTML={{ __html: FOOTER_SCENE_SVG }} />
      <span className="sr-only" aria-live="polite">{said}</span>
    </div>
  );
}
