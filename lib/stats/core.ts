// Reading stats: privacy-first page-view beacons rolled up per day.
// No IPs, names or emails are stored. A visitor is a random id kept in the reader's own browser.
import type { Store } from '../newsletter/core';

export type StatEvent = { at: string; p: string; v: string; d: number; t: number; r: string; c: string; dev: 'mobile' | 'desktop' | 'tablet'; src: string };
export type PathAgg = { views: number; visitors: string[]; depth: number; done: number; time: number };
export type DayRollup = { date: string; views: number; visitors: string[]; paths: Record<string, PathAgg>; refs: Record<string, number>; countries: Record<string, number>; devices: Record<string, number>; hours: number[]; sources: Record<string, number> };

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pingdom|monitor|curl|wget|python|node-fetch/i;
export const isBot = (ua: string) => !ua || BOT.test(ua);
export const deviceOf = (ua: string): StatEvent['dev'] => (/ipad|tablet/i.test(ua) ? 'tablet' : /mobi|iphone|android/i.test(ua) ? 'mobile' : 'desktop');
export const kstDay = (d: Date) => new Date(d.getTime() + 9 * 3_600_000).toISOString().slice(0, 10);
const kstHour = (d: Date) => new Date(d.getTime() + 9 * 3_600_000).getUTCHours();
const clamp = (n: unknown, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(Number(n) || 0)));

/** Validates a raw beacon. Returns null for anything that is not a real reader on a real page. */
export function normalizeEvent(raw: unknown, ua: string, country: string, now: Date, siteHost = 'carrotcave.com'): StatEvent | null {
  if (isBot(ua) || !raw || typeof raw !== 'object') return null;
  const b = raw as Record<string, unknown>;
  const p = String(b.p ?? '');
  if (!/^\/(?:$|posts\/[\w%.-]+$|voices(?:\/[\w%.-]+\/?)?$|newsletter$)/.test(p)) return null;
  const v = String(b.v ?? '');
  if (!/^[a-z0-9]{8,32}$/i.test(v)) return null;
  let r = '';
  try { const h = new URL(String(b.r ?? '')).hostname.replace(/^www\./, ''); r = h && !h.endsWith(siteHost) ? h.slice(0, 60) : ''; } catch { r = ''; }
  const src = /^[a-z0-9_-]{1,24}$/i.test(String(b.src ?? '')) ? String(b.src) : '';
  return { at: now.toISOString(), p: p.replace(/\/$/, '') || '/', v: v.slice(0, 16), d: clamp(b.d, 0, 100), t: clamp(b.t, 0, 3600), r, c: /^[A-Z]{2}$/.test(country) ? country : '', dev: deviceOf(ua), src };
}

export const eventKey = (e: StatEvent, rand: string) => `stats/raw/${kstDay(new Date(e.at))}/${e.at.replace(/[:.]/g, '')}-${rand}.json`;
export async function recordEvent(store: Store, e: StatEvent, rand = Math.random().toString(36).slice(2, 10)) {
  await store.putJSON(eventKey(e, rand), e);
}

const bump = (o: Record<string, number>, k: string, n = 1) => { if (k) o[k] = (o[k] ?? 0) + n; };
export const emptyDay = (date: string): DayRollup => ({ date, views: 0, visitors: [], paths: {}, refs: {}, countries: {}, devices: {}, hours: Array(24).fill(0), sources: {} });

/** Folds page-view events into one day. A view counts as "read to the end" at 90% depth. */
export function rollup(date: string, events: StatEvent[]): DayRollup {
  const day = emptyDay(date);
  const vis = new Set<string>();
  const pv: Record<string, Set<string>> = {};
  for (const e of events) {
    day.views++; vis.add(e.v);
    const a = (day.paths[e.p] ??= { views: 0, visitors: [], depth: 0, done: 0, time: 0 });
    a.views++; a.depth += e.d; a.time += e.t; if (e.d >= 90) a.done++;
    (pv[e.p] ??= new Set()).add(e.v);
    bump(day.refs, e.r || '(직접 방문)'); bump(day.countries, e.c || '??'); bump(day.devices, e.dev); bump(day.sources, e.src);
    day.hours[kstHour(new Date(e.at))]++;
  }
  day.visitors = [...vis];
  for (const [p, s] of Object.entries(pv)) day.paths[p].visitors = [...s];
  return day;
}

/** Compacts finished days: raw events -> one rollup file, then removes the raw files. */
export async function compactDays(store: Store, now: Date) {
  const today = kstDay(now);
  const raw = await store.list('stats/raw/');
  const byDay = new Map<string, string[]>();
  for (const k of raw) { const d = k.split('/')[2]; if (d && d < today) byDay.set(d, [...(byDay.get(d) ?? []), k]); }
  for (const [date, keys] of byDay) {
    const events = (await Promise.all(keys.map((k) => store.getJSON<StatEvent>(k)))).filter((e): e is StatEvent => !!e);
    const prev = await store.getJSON<DayRollup>(`stats/daily/${date}.json`);
    const merged = mergeDays([prev ?? emptyDay(date), rollup(date, events)], date);
    await store.putJSON(`stats/daily/${date}.json`, merged);
    await Promise.all(keys.map((k) => store.del(k)));
  }
  return byDay.size;
}

export function mergeDays(days: DayRollup[], date = 'range'): DayRollup {
  const out = emptyDay(date);
  const vis = new Set<string>();
  const pv: Record<string, Set<string>> = {};
  for (const d of days) {
    out.views += d.views; d.visitors.forEach((v) => vis.add(v));
    for (const [p, a] of Object.entries(d.paths)) {
      const o = (out.paths[p] ??= { views: 0, visitors: [], depth: 0, done: 0, time: 0 });
      o.views += a.views; o.depth += a.depth; o.done += a.done; o.time += a.time;
      a.visitors.forEach((v) => (pv[p] ??= new Set()).add(v));
    }
    for (const k of ['refs', 'countries', 'devices', 'sources'] as const) for (const [x, n] of Object.entries(d[k])) bump(out[k], x, n);
    d.hours.forEach((n, i) => (out.hours[i] += n));
  }
  out.visitors = [...vis];
  for (const [p, s] of Object.entries(pv)) out.paths[p].visitors = [...s];
  return out;
}

/** Loads the last `days` days (KST) including today's not-yet-compacted events. */
export async function loadRange(store: Store, now: Date, days: number) {
  const dates = Array.from({ length: days }, (_, i) => kstDay(new Date(now.getTime() - (days - 1 - i) * 86_400_000)));
  const today = dates.at(-1)!;
  const past = await Promise.all(dates.slice(0, -1).map((d) => store.getJSON<DayRollup>(`stats/daily/${d}.json`)));
  const todayKeys = (await store.list(`stats/raw/${today}/`)).slice(-3000);
  const todayEvents = (await Promise.all(todayKeys.map((k) => store.getJSON<StatEvent>(k)))).filter((e): e is StatEvent => !!e);
  const todayStored = await store.getJSON<DayRollup>(`stats/daily/${today}.json`);
  const series = [...past.map((d, i) => d ?? emptyDay(dates[i])), mergeDays([todayStored ?? emptyDay(today), rollup(today, todayEvents)], today)];
  return { dates, series };
}

export type PathRow = { path: string; views: number; visitors: number; depth: number; completion: number; time: number };
export function summarize(series: DayRollup[]) {
  const all = mergeDays(series);
  const rows: PathRow[] = Object.entries(all.paths).map(([path, a]) => ({
    path, views: a.views, visitors: a.visitors.length,
    depth: a.views ? Math.round(a.depth / a.views) : 0,
    completion: a.views ? Math.round((a.done / a.views) * 100) : 0,
    time: a.views ? Math.round(a.time / a.views) : 0,
  })).sort((x, y) => y.views - x.views || y.visitors - x.visitors);
  const reads = rows.filter((r) => r.path !== '/' && r.path !== '/voices');
  const totViews = reads.reduce((s, r) => s + r.views, 0);
  const avg = (f: (r: PathRow) => number) => (totViews ? Math.round(reads.reduce((s, r) => s + f(r) * r.views, 0) / totViews) : 0);
  const top = (o: Record<string, number>, n = 8) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n);
  return {
    views: all.views, visitors: all.visitors.length,
    depth: avg((r) => r.depth), completion: avg((r) => r.completion), time: avg((r) => r.time),
    daily: series.map((d) => ({ date: d.date, views: d.views, visitors: d.visitors.length })),
    rows, refs: top(all.refs), countries: top(all.countries), devices: top(all.devices, 3), sources: top(all.sources, 5), hours: all.hours,
  };
}
