(() => {
  'use strict';
  // Anonymous reading beacon: one report per page view (how far and how long it was read). No cookies.
  if (navigator.doNotTrack === '1' || window.__ccStats) return;
  window.__ccStats = true;
  const key = 'cc_vid';
  let vid = '';
  try { vid = localStorage.getItem(key) || ''; if (!vid) { vid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36); localStorage.setItem(key, vid); } } catch { vid = 'anon' + Math.random().toString(36).slice(2, 10); }
  let view = null;
  const depthNow = () => { const max = document.documentElement.scrollHeight - innerHeight; return max > 40 ? Math.min(100, Math.round((scrollY + 1) / max * 100)) : 100; };
  const start = () => {
    const src = new URLSearchParams(location.search).get('utm_source') || '';
    view = { p: location.pathname, r: document.referrer, src, d: depthNow(), active: 0, since: document.visibilityState === 'visible' ? Date.now() : 0, sent: false };
  };
  const tick = () => { if (view && view.since) { view.active += Date.now() - view.since; view.since = document.visibilityState === 'visible' ? Date.now() : 0; } };
  const send = () => {
    if (!view || view.sent) return; tick(); view.sent = true;
    const body = JSON.stringify({ p: view.p, v: vid, d: view.d, t: Math.round(view.active / 1000), r: view.r, src: view.src });
    if (!(navigator.sendBeacon && navigator.sendBeacon('/api/stats', body))) fetch('/api/stats', { method: 'POST', body, keepalive: true }).catch(() => {});
  };
  addEventListener('scroll', () => { if (view) view.d = Math.max(view.d, depthNow()); }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { tick(); send(); } else if (view && !view.sent) view.since = Date.now(); else { start(); } });
  addEventListener('pagehide', send);
  // Client-side navigations (Next.js): report the previous page, start a new view.
  const swap = () => setTimeout(() => { if (view && location.pathname !== view.p) { send(); start(); } }, 0);
  for (const m of ['pushState', 'replaceState']) { const o = history[m]; history[m] = function (...a) { const r = o.apply(this, a); swap(); return r; }; }
  addEventListener('popstate', swap);
  start();
})();
