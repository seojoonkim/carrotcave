'use client';
import { useEffect, useRef, useState } from 'react';
import { FOOTER_SCENE_SVG } from './footer-scene-svg';

import { daypartOf, isFresh, type Daypart, type SceneMood } from '@/lib/footer-scene';
import { t, type Locale } from '@/lib/i18n';
export type { SceneMood } from '@/lib/footer-scene';

export default function FooterCaveScene({ mood = 'all', latest, locale = 'ko' }: { mood?: SceneMood; latest?: string; locale?: Locale }) {
  const L = t(locale);
  const lines = L.carrotLines;
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
      const line = lines[taps.current++ % lines.length];
      const text = root.querySelector('.tap-text');
      if (text) text.textContent = line;
      root.classList.remove('is-tapped');
      void root.offsetWidth; // restart the pop animation on every tap
      root.classList.add('is-tapped');
      setSaid(line);
    };
    const hop = () => {
      root.classList.remove('is-rabbit');
      void root.offsetWidth; // restart the spin hop on every tap
      root.classList.add('is-rabbit');
    };
    const onClick = (e: Event) => {
      const el = e.target as Element;
      if (el.closest('.carrot-hit')) pet();
      else if (el.closest('.rabbit-hit')) hop();
    };
    const onKey = (e: KeyboardEvent) => {
      if (!(e.key === 'Enter' || e.key === ' ')) return;
      const el = e.target as Element;
      if (el.closest('.carrot-hit')) { e.preventDefault(); pet(); }
      else if (el.closest('.rabbit-hit')) { e.preventDefault(); hop(); }
    };
    const onEnd = (e: AnimationEvent) => {
      if (e.animationName === 'cc-tap-pop') root.classList.remove('is-tapped');
      if (e.animationName === 'cc-rabbit-spinhop') root.classList.remove('is-rabbit');
    };
    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKey);
    root.addEventListener('animationend', onEnd);
    return () => { root.removeEventListener('click', onClick); root.removeEventListener('keydown', onKey); root.removeEventListener('animationend', onEnd); };
  }, [lines]);

  const svg = locale === 'ko' ? FOOTER_SCENE_SVG : FOOTER_SCENE_SVG.replaceAll('당근 쓰다듬기', L.carrotHit).replaceAll('토끼 쓰다듬기', L.rabbitHit);

  return (
    <div ref={ref} className="footer-scene" data-mood={mood} data-daypart={daypart} data-fresh={fresh ? 'true' : 'false'}>
      <p className="sr-only">{L.sceneSr}</p>
      <div className="footer-scene__art" dangerouslySetInnerHTML={{ __html: svg }} />
      <span className="sr-only" aria-live="polite">{said}</span>
    </div>
  );
}
