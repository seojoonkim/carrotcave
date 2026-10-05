// Reading aids (2026-10-06): key-sentence highlights, 3-line takeaways, dialogue turns, reading depth.
// Every highlight/anchor must be quoted verbatim from the post so <mark> and #take-N always land.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { posts } from '../data/posts.ts';

const root = new URL('..', import.meta.url);
const read = (p) => fs.readFileSync(new URL(p, root), 'utf8');
const aids = JSON.parse(read('data/reading-aids.json'));
const en = JSON.parse(read('data/en/posts.json'));
const bySlug = new Map(posts.map((p) => [p.slug, p]));

test('reading aids quote the post verbatim (highlights + takeaway anchors, ko + en)', () => {
  const bad = [];
  for (const [slug, entry] of Object.entries(aids)) {
    const post = bySlug.get(slug);
    if (!post) { bad.push(`${slug}: no such post`); continue; }
    for (const [lang, content] of [['ko', post.content], ['en', en[slug]?.content ?? '']]) {
      const lines = content.split('\n');
      const a = entry[lang];
      if (!a) { bad.push(`${slug}/${lang}: missing`); continue; }
      for (const h of a.highlights) if (!lines.some((l) => l.includes(h))) bad.push(`${slug}/${lang} highlight not verbatim: ${h.slice(0, 40)}`);
      for (const t of a.takeaways) {
        if (!lines.some((l) => l.includes(t.anchor))) bad.push(`${slug}/${lang} anchor not verbatim: ${t.anchor.slice(0, 40)}`);
        // one line on a phone: Korean packs more per character than English
        if (!t.text || t.text.length > (lang === 'ko' ? 40 : 80)) bad.push(`${slug}/${lang} takeaway text empty or too long`);
      }
      if (a.takeaways.length && a.takeaways.length !== 3) bad.push(`${slug}/${lang}: takeaways must be exactly 3`);
      if (a.highlights.length > 4) bad.push(`${slug}/${lang}: too many highlights`);
    }
  }
  assert.deepEqual(bad, []);
});

test('post view wires highlights, takeaways, dialogue turns, depth and the next-hole card', () => {
  const view = read('components/views/PostView.tsx');
  for (const needle of ['post-key', 'post-takeaways', 'post-turn', '<ReadingDepth', 'post-next--hole', "id={id}"]) {
    assert.ok(view.includes(needle), `PostView missing ${needle}`);
  }
  const css = read('public/reading-end.css');
  for (const needle of ['.post-key', '.post-takeaways', '.post-turn', '.cc-depth', '.post-next--hole', 'prefers-reduced-motion']) {
    assert.ok(css.includes(needle), `reading-end.css missing ${needle}`);
  }
});

test('dialogue detection needs two speakers with two or more turns each', async () => {
  const src = read('components/views/PostView.tsx');
  const re = new RegExp(src.match(/const TURN_RE = \/(.+)\/;/)[1]);
  const speakers = (content) => {
    const count = new Map();
    for (const line of content.split('\n')) { const m = line.trim().match(re); if (m) count.set(m[1], (count.get(m[1]) ?? 0) + 1); }
    const s = [...count].filter(([, n]) => n >= 2).map(([k]) => k);
    return s.length >= 2 ? s : [];
  };
  assert.deepEqual(speakers('김서준: 질문\n\n이성수: 답\n\n김서준: 또\n\n이성수: 또 답'), ['김서준', '이성수']);
  assert.deepEqual(speakers('Simon Kim: hi\n\nSung-su Lee: yo\n\nSimon Kim: again\n\nSung-su Lee: again'), ['Simon Kim', 'Sung-su Lee']);
  assert.deepEqual(speakers('참고: 이건 메모\n\n본문 문단'), []);
  assert.deepEqual(speakers(bySlug.get('kpop-next-chapter-ip-and-fandom').content).length, 3);
});

test('reading depth: one floor per 3 finished posts, stored only on the device', async () => {
  const src = read('components/ReadingDepth.tsx');
  assert.ok(src.includes('localStorage'), 'depth must stay on the device');
  assert.ok(!/fetch\(|sendBeacon/.test(src), 'depth must not be sent anywhere');
  const FLOOR_EVERY = Number(src.match(/FLOOR_EVERY = (\d+)/)[1]);
  const depthOf = (n) => { const floor = Math.max(1, Math.ceil(n / FLOOR_EVERY)); const inFloor = n - (floor - 1) * FLOOR_EVERY; return { floor, left: FLOOR_EVERY - inFloor || FLOOR_EVERY }; };
  assert.deepEqual([1, 2, 3, 4, 6, 7].map((n) => depthOf(n).floor), [1, 1, 1, 2, 2, 3]);
  assert.deepEqual([1, 2, 3, 4].map((n) => depthOf(n).left), [2, 1, 3, 2]);
});

test('i18n has every reading-aid string in both languages', () => {
  const i18n = read('lib/i18n.ts');
  for (const k of ['takeawaysTitle', 'takeawaysJump', 'nextHole', 'nextHoleSub', 'depthFloor', 'depthNote', 'depthNext']) {
    assert.equal(i18n.split(`${k}:`).length - 1, 2, `${k} must exist in ko and en`);
  }
});

test('aid generator runs Claude on the OAuth login, never a stale API key from a login shell', () => {
  // 2026-10-06: background jobs run `zsh -lic`, which exports an old ANTHROPIC_API_KEY. Claude Code
  // prefers it over the OAuth login and every request failed with 401, retried silently for minutes.
  const py = read('scripts/content/build-reading-aids.py');
  for (const k of ['ANTHROPIC_API_KEY', 'ANTHROPIC_BASE_URL']) assert.ok(py.includes(`'${k}'`), `generator must strip ${k}`);
  assert.ok(/API Error: 401/.test(py) && /SystemExit/.test(py), 'a 401 must abort the run instead of retrying every post');
  assert.ok(/print\(f'retry /.test(py), 'retries must be logged with their reason');
});

test('key-sentence highlight is an underline only, no leading bullet dot (2026-10-06)', () => {
  const css = read('public/reading-end.css');
  assert.ok(!/mark\.post-key::before/.test(css), 'mark.post-key must not draw a ::before bullet');
});

test('every dialogue speaker photo file exists and has a recorded source (2026-10-06)', () => {
  const src = read('components/views/PostView.tsx');
  const credits = JSON.parse(read('data/people-photos.json'));
  const files = new Set([...src.matchAll(/'\/people\/([a-z-]+\.webp)'/g)].map((m) => m[1]));
  assert.ok(files.size >= 4);
  for (const f of files) {
    assert.ok(fs.existsSync(new URL('public/people/' + f, root)), `missing public/people/${f}`);
    assert.ok(credits[f]?.source, `no source recorded for ${f}`);
  }
});
