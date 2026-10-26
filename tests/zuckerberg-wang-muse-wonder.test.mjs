// 2026-10-13 Simon: "이거 목소리에 맞는 포맷으로 올려" — Cheeky Pint: Muse Wonder (Zuckerberg & Wang, host John Collison).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (p) => readFile(new URL(p, root), 'utf8');
const exists = (p) => access(new URL(p, root)).then(() => true, () => false);
const slug = 'zuckerberg-wang-muse-wonder';
const dir = `public/voices/${slug}/`;
const video = 'https://www.youtube.com/watch?v=XfdIhd1g6EI';

test('Muse Wonder voice is listed as published with the official Cheeky Pint source', async () => {
  const meta = await read('data/interviews.ts');
  const block = meta.slice(meta.indexOf(`slug: '${slug}'`), meta.indexOf(`slug: '${slug}'`) + 1600);
  assert.ok(block.length > 100, 'entry missing');
  assert.match(block, /sourcePublishedAt: '2026-10-12'/);
  assert.match(block, new RegExp(`sourceUrl: '${video.replace(/[?]/g, '\\?')}'`));
  assert.match(block, /duration: '2:14:31'/);
  assert.match(block, /chapters: 12/);
  assert.match(block, /status: 'published'/);
  const en = JSON.parse(await read('data/en/voices.json'));
  assert.ok(en[slug]?.title && en[slug]?.summary, 'English list entry');
});

test('Korean transcript keeps every Substack speaker turn, in order, with three speakers', async () => {
  const data = JSON.parse(await read(`${dir}transcript-ko.json`));
  const names = new Set(['존 콜리슨', '마크 저커버그', '알렉산더 왕']);
  assert.equal(data.source, video);
  assert.equal(data.segments.length, 667); // full transcript: every official speaker turn (Simon confirmed rights, 2026-10-13)
  data.segments.forEach((s, i) => {
    assert.equal(s.id, i);
    assert.ok(names.has(s.speaker), `speaker ${i}`);
    assert.ok(s.text.trim() && /[\uac00-\ud7a3]/.test(s.text), `korean text ${i}`);
    if (i) assert.ok(s.start >= data.segments[i - 1].start, `order ${i}`);
  });
});

test('full transcript: English reader is every official turn verbatim, Korean mirrors it 1:1', async () => {
  const en = JSON.parse(await read(`${dir}transcript-en-reader.json`));
  const ko = JSON.parse(await read(`${dir}transcript-ko.json`));
  assert.equal(en.items.length, 667);
  assert.equal(ko.segments.length, 667);
  assert.doesNotMatch(en.method + ko.method, /excerpt/i);
  const counts = {};
  en.items.forEach((it, i) => { assert.ok(it.text.trim(), `en ${i}`); counts[it.speaker] = (counts[it.speaker] || 0) + 1;
    assert.equal(ko.segments[i].start, it.start, `start ${i}`); });
  assert.deepEqual(counts, { 'John Collison': 245, 'Mark Zuckerberg': 229, 'Alexandr Wang': 193 });
  const total = en.items.reduce((n, it) => n + it.text.length, 0);
  assert.ok(total > 100000, `full English text expected, got ${total}`);
  const enKeys = JSON.parse(await read(`${dir}key-sentences.en.json`));
  for (const k of enKeys) assert.ok(en.items[k.id].text.includes(k.exact_quote), `en key ${k.id}`);
  const html = await read(`${dir}index.html`);
  assert.match(html, /cheekypint\.substack\.com\/p\/muse-wonder-zuckerberg-and-wangs/);
  assert.doesNotMatch(html, /발췌 안내|key quotes only/);
  assert.match(html, /667개 발언/);
});

test('reader page: 12 official chapters, date line, hero photo, three-speaker roles, 10+ key sentences', async () => {
  const html = await read(`${dir}index.html`);
  const chapters = [...html.matchAll(/class="content-section chapter transcript-chapter"[^>]*data-chapter="(\d+)"/g)];
  assert.equal(chapters.length, 12);
  assert.match(html, /<p class="hero-date">공개 <time datetime="2026-10-12">2026년 10월 12일<\/time>/);
  assert.match(html, /<figure class="hero-portrait">/);
  assert.match(html, /OFFICIAL SOURCE · CHEEKY PINT/);
  const js = await read(`${dir}script.js`);
  for (const n of ['마크 저커버그', '알렉산더 왕', '존 콜리슨']) assert.ok(js.includes(n), n);
  assert.match(js, /dataset\.role\s*=/);
  const keys = JSON.parse(await read(`${dir}key-sentences.json`));
  assert.ok(keys.length >= 10);
  const ko = JSON.parse(await read(`${dir}transcript-ko.json`));
  for (const k of keys) assert.ok(ko.segments[k.id].text.includes(k.exact_quote), `key ${k.id} must be an exact quote`);
  assert.ok(await exists(`${dir}index.en.html`));
});
