'use client';
import { useEffect } from 'react';

// Moves the active marker the moment a menu item is pressed, before the server answers.
export default function AxisRailInstant() {
  useEffect(() => {
    document.documentElement.classList.remove('cc-axis-pending');
  });
  useEffect(() => {
    const w = window as Window & { __ccAxisInstant?: boolean };
    if (w.__ccAxisInstant) return;
    w.__ccAxisInstant = true;
    const onDown = (event: PointerEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.('nav.axis-rail a');
      if (!link) return;
      const label = link.querySelector('b')?.textContent?.trim();
      document.querySelectorAll('nav.axis-rail a').forEach((a) => {
        const on = a.querySelector('b')?.textContent?.trim() === label;
        a.classList.toggle('active', on);
        if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      });
      document.documentElement.classList.add('cc-axis-pending');
    };
    document.addEventListener('pointerdown', onDown, { capture: true, passive: true });
    return () => { document.removeEventListener('pointerdown', onDown, { capture: true }); w.__ccAxisInstant = false; };
  }, []);
  return null;
}
