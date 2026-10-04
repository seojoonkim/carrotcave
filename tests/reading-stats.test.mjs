import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import * as st from '../lib/stats/core.ts';
import { memoryStore } from '../lib/newsletter/core.ts';

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';
const now = new Date('2026-10-05T03:00:00Z'); // 12:00 KST
const ev = (o = {}) => ({ p: '/posts/hello', v: 'abc12345xyz', d: 95, t: 120, r: 'https://x.com/simon', ...o });

test('beacon accepts real reads and rejects bots, junk paths and bad ids', () => {
  const e = st.normalizeEvent(ev(), UA, 'KR', now);
  assert.equal(e.p, '/posts/hello'); assert.equal(e.dev, 'mobile'); assert.equal(e.c, 'KR'); assert.equal(e.r, 'x.com');
  assert.equal(st.normalizeEvent(ev(), 'Googlebot/2.1', 'US', now), null);
  assert.equal(st.normalizeEvent(ev({ p: '/admin' }), UA, 'KR', now), null);
  assert.equal(st.normalizeEvent(ev({ p: '/api/stats' }), UA, 'KR', now), null);
  assert.equal(st.normalizeEvent(ev({ v: 'x' }), UA, 'KR', now), null);
  assert.equal(st.normalizeEvent(ev({ r: 'https://carrotcave.com/' }), UA, 'KR', now).r, '', 'own site is not a referrer');
  assert.equal(st.normalizeEvent(ev({ d: 900, t: -5 }), UA, 'KR', now).d, 100);
});

test('beacon never stores identity: no ip, email or user agent in the event', () => {
  const e = st.normalizeEvent(ev(), UA, 'KR', now);
  assert.deepEqual(Object.keys(e).sort(), ['at', 'c', 'd', 'dev', 'p', 'r', 'src', 't', 'v']);
  assert.ok(!JSON.stringify(e).includes('iPhone'));
});

test('stats count unique visitors, depth, read-to-end and time per post', async () => {
  const store = memoryStore();
  const add = (o, at) => st.recordEvent(store, st.normalizeEvent(ev(o), UA, 'KR', at), Math.random().toString(36).slice(2));
  await add({}, now); await add({ d: 40, t: 20 }, now); await add({ v: 'other999zz', d: 100, t: 200, r: '' }, now);
  await add({ p: '/voices/liao-heng', v: 'other999zz', d: 30, t: 60 }, now);
  const { series } = await st.loadRange(store, now, 7);
  const s = st.summarize(series);
  assert.equal(s.views, 4); assert.equal(s.visitors, 2);
  const post = s.rows.find((r) => r.path === '/posts/hello');
  assert.equal(post.views, 3); assert.equal(post.visitors, 2); assert.equal(post.depth, 78); assert.equal(post.completion, 67); assert.equal(post.time, 113);
  assert.equal(s.daily.length, 7); assert.equal(s.daily.at(-1).visitors, 2);
  assert.equal(s.hours[12], 4, 'hours are in KST');
});

test('daily compaction keeps totals and removes raw events', async () => {
  const store = memoryStore();
  const y = new Date('2026-10-04T03:00:00Z');
  for (let i = 0; i < 5; i++) await st.recordEvent(store, st.normalizeEvent(ev({ v: `visitor00${i}` }), UA, 'KR', y), `r${i}`);
  assert.equal(await st.compactDays(store, now), 1);
  assert.equal((await store.list('stats/raw/')).length, 0);
  const { series } = await st.loadRange(store, now, 7);
  const s = st.summarize(series);
  assert.equal(s.views, 5); assert.equal(s.visitors, 5);
});

test('every page (site layout and each voice reader) loads the beacon; admin shows stats tab', () => {
  assert.match(readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8'), /<script src="\/stats-beacon\.js" defer \/>/);
  const dir = new URL('../public/voices/', import.meta.url);
  for (const d of readdirSync(dir)) {
    const f = new URL(`${d}/index.html`, dir);
    if (existsSync(f)) assert.match(readFileSync(f, 'utf8'), /stats-beacon\.js/, d);
  }
  const beacon = readFileSync(new URL('../public/stats-beacon.js', import.meta.url), 'utf8');
  assert.match(beacon, /doNotTrack/); assert.match(beacon, /sendBeacon/); assert.doesNotMatch(beacon, /document\.cookie/);
  const admin = readFileSync(new URL('../app/admin/page.tsx', import.meta.url), 'utf8');
  assert.match(admin, /읽기 통계/); assert.match(admin, /끝까지 읽음/);
  assert.match(readFileSync(new URL('../app/api/cron/newsletter/route.ts', import.meta.url), 'utf8'), /compactDays/);
});

test('home intro is a quiet bridge line, smaller than the lead post title', () => {
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
  const bridge = Number([...css.matchAll(/\.wall-heading--bridge #wall-heading\{[^}]*font:\d00 (\d+)px/g)].at(-1)?.[1]);
  const lead = 32; // .archive-lead h2 uses --t-32
  assert.ok(bridge && bridge <= 16 && bridge < lead / 2, `bridge ${bridge}px must stay a caption`);
});

test('intro and search breathe: kicker, intro line, filled search with real spacing', () => {
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
  const tail = css.slice(css.indexOf('Intro + search 2026.10'));
  assert.match(tail, /\.wall-heading\.wall-heading--bridge\{[^}]*margin:0 auto (\d+)px/);
  assert.ok(Number(tail.match(/\.wall-heading\.wall-heading--bridge\{[^}]*margin:0 auto (\d+)px/)[1]) >= 16, 'gap between intro and search');
  assert.match(tail, /\.wall-shell \.archive-search\{[^}]*height:48px;margin:0 0 (\d+)px;[^}]*background:#121720/);
  assert.ok(Number(tail.match(/\.wall-shell \.archive-search\{[^}]*margin:0 0 (\d+)px/)[1]) >= 24, 'gap between search and first post');
  const home = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
  assert.match(home, /wall-heading__kicker/);
});
