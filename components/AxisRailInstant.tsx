'use client';
import { useEffect } from 'react';

const PENDING = 'cc-axis-pending';
// Hard ceiling: the dim can never outlive a slow or failed navigation.
const PENDING_MAX_MS = 4000;

// Moves the active marker the moment a menu item is pressed, before the server answers.
// The page only dims once a press becomes a real navigation to a different URL; a press that
// is cancelled (drag-off, touch scroll of the rail) or lands on the current page restores state.
export default function AxisRailInstant() {
  useEffect(() => {
    document.documentElement.classList.remove(PENDING);
  });
  useEffect(() => {
    const w = window as Window & { __ccAxisInstant?: boolean };
    if (w.__ccAxisInstant) return;
    w.__ccAxisInstant = true;
    const root = document.documentElement;
    const links = () => [...document.querySelectorAll<HTMLAnchorElement>('nav.axis-rail a')];
    const labelOf = (a: Element) => a.querySelector('b')?.textContent?.trim();
    let snapshot: { a: HTMLAnchorElement; active: boolean; current: string | null }[] | null = null;
    let settleTimer = 0;
    let pendingTimer = 0;

    const mark = (label: string | undefined) => links().forEach((a) => {
      const on = labelOf(a) === label;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    const restore = () => {
      snapshot?.forEach(({ a, active, current }) => {
        a.classList.toggle('active', active);
        if (current) a.setAttribute('aria-current', current); else a.removeAttribute('aria-current');
      });
      snapshot = null;
    };
    const clearPending = () => {
      window.clearTimeout(pendingTimer);
      root.classList.remove(PENDING);
    };
    const isSameUrl = (a: HTMLAnchorElement) => {
      const to = new URL(a.href, location.href);
      return to.pathname.replace(/\/$/, '') === location.pathname.replace(/\/$/, '') && to.search === location.search;
    };
    const plain = (e: MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

    const onDown = (event: PointerEvent) => {
      if (!plain(event)) return;
      const link = (event.target as Element | null)?.closest?.('nav.axis-rail a');
      if (!link) return;
      window.clearTimeout(settleTimer);
      snapshot = links().map((a) => ({ a, active: a.classList.contains('active'), current: a.getAttribute('aria-current') }));
      mark(labelOf(link));
    };
    // A press that never becomes a click (drag-off, scroll) puts the marker back.
    const onUp = () => {
      if (!snapshot) return;
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(restore, 120);
    };
    const onCancel = () => { window.clearTimeout(settleTimer); restore(); };
    const onClick = (event: MouseEvent) => {
      window.clearTimeout(settleTimer);
      const link = (event.target as Element | null)?.closest?.('nav.axis-rail a') as HTMLAnchorElement | null;
      if (!link || !plain(event) || event.defaultPrevented) { restore(); return; }
      snapshot = null;
      if (isSameUrl(link)) return;
      mark(labelOf(link));
      root.classList.add(PENDING);
      window.clearTimeout(pendingTimer);
      pendingTimer = window.setTimeout(clearPending, PENDING_MAX_MS);
    };
    const onLeave = () => { restore(); clearPending(); };

    document.addEventListener('pointerdown', onDown, { capture: true, passive: true });
    document.addEventListener('pointerup', onUp, { capture: true, passive: true });
    document.addEventListener('pointercancel', onCancel, { capture: true, passive: true });
    document.addEventListener('click', onClick, { capture: true });
    window.addEventListener('popstate', onLeave);
    window.addEventListener('pageshow', onLeave);
    return () => {
      document.removeEventListener('pointerdown', onDown, { capture: true });
      document.removeEventListener('pointerup', onUp, { capture: true });
      document.removeEventListener('pointercancel', onCancel, { capture: true });
      document.removeEventListener('click', onClick, { capture: true });
      window.removeEventListener('popstate', onLeave);
      window.removeEventListener('pageshow', onLeave);
      window.clearTimeout(settleTimer);
      clearPending();
      w.__ccAxisInstant = false;
    };
  }, []);
  return null;
}
