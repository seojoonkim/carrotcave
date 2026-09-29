'use client';

import { useEffect } from 'react';

// A faint torch that follows the pointer through the cave (desktop, fine pointer only).
// Writes two CSS variables; all drawing lives in globals.css (.cc-torch).
export default function CaveTorch() {
  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || still.matches) return;
    const root = document.documentElement;
    let frame = 0;
    let x = 0;
    let y = 0;
    const paint = () => {
      frame = 0;
      root.style.setProperty('--torch-x', `${x}px`);
      root.style.setProperty('--torch-y', `${y}px`);
    };
    const move = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      root.dataset.torch = 'on';
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const leave = () => { delete root.dataset.torch; };
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
      if (frame) cancelAnimationFrame(frame);
      delete root.dataset.torch;
    };
  }, []);
  return <div className="cc-torch" aria-hidden="true" />;
}
