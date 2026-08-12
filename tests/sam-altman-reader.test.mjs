import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const officialUrl = 'https://www.youtube.com/watch?v=ZIaOBAjvc38';
const readerRoot = 'public/voices/sam-altman-startup-school-2026/';

test('Sam Altman reader is sourced only from the official Y Combinator video', async () => {
  const [html, script, transcript, interviews] = await Promise.all([
    read(`${readerRoot}index.html`),
    read(`${readerRoot}script.js`),
    read(`${readerRoot}transcript-ko.json`),
    read('data/interviews.ts'),
  ]);
  const combined = `${html}\n${script}\n${transcript}\n${interviews}`;
  assert.match(combined, /ZIaOBAjvc38/);
  assert.doesNotMatch(combined, /cSDltBV8mO4|BZCF|비즈까페/);
  assert.match(html, new RegExp(`data-source-url="${officialUrl.replace(/[?]/g, '\\?')}"`));
  assert.match(html, /OFFICIAL SOURCE · Y COMBINATOR/);
  assert.match(html, /Y Combinator 공식 인터뷰 영상/);
});

test('Sam Altman transcript preserves 99 ordered speaker turns across seven chapters', async () => {
  const [raw, html] = await Promise.all([
    read(`${readerRoot}transcript-ko.json`),
    read(`${readerRoot}index.html`),
  ]);
  const data = JSON.parse(raw);
  assert.equal(data.source, officialUrl);
  assert.equal(data.segments.length, 99);
  const speakers = new Set(['Sam Altman', 'Garry Tan', 'Audience']);
  data.segments.forEach((segment, index) => {
    assert.equal(segment.id, index);
    assert.ok(speakers.has(segment.speaker));
    assert.ok(segment.text.trim().length > 0);
    assert.ok(Number.isFinite(segment.start) && Number.isFinite(segment.end));
    assert.ok(segment.end >= segment.start);
    if (index) assert.ok(segment.start >= data.segments[index - 1].start);
  });
  assert.equal(data.segments[0].start, 7);
  assert.equal(data.segments.at(-1).start, 2336);
  assert.equal(data.segments.at(-1).end, 2340);

  const chapters = [...html.matchAll(/class="content-section chapter transcript-chapter"[^>]*data-chapter="(\d+)"[^>]*data-start="(\d+)"[^>]*data-end="(\d+)"/g)]
    .map(match => ({ number: Number(match[1]), start: Number(match[2]), end: Number(match[3]) }));
  assert.equal(chapters.length, 7);
  assert.deepEqual(chapters.map(chapter => chapter.number), [1, 2, 3, 4, 5, 6, 7]);
  for (const chapter of chapters) {
    assert.ok(chapter.end > chapter.start);
    assert.ok(data.segments.some(segment => segment.start >= chapter.start && segment.start < chapter.end));
  }
  for (const segment of data.segments) {
    assert.equal(chapters.filter(chapter => segment.start >= chapter.start && segment.start < chapter.end).length, 1);
  }
});

test('Sam Altman archive metadata, loader count, navigation, and assets stay aligned', async () => {
  const [html, script, interviews] = await Promise.all([
    read(`${readerRoot}index.html`),
    read(`${readerRoot}script.js`),
    read('data/interviews.ts'),
  ]);
  assert.match(interviews, /slug: 'sam-altman-startup-school-2026'[\s\S]*?sourceUrl: 'https:\/\/www\.youtube\.com\/watch\?v=ZIaOBAjvc38'[\s\S]*?duration: '38:59'[\s\S]*?chapters: 7,[\s\S]*?segments: 99,/);
  assert.match(html, /07 CHAPTERS/);
  assert.match(html, /99 PARAGRAPHS/);
  assert.match(script, /data\.segments\.length !== 99/);
  assert.match(html, /class="brand" href="\/voices" target="_top" aria-label="목소리 목록으로 돌아가기"/);
  assert.doesNotMatch(html, /target="_blank"(?![^>]*rel="noopener noreferrer")/);
  assert.match(html, /https:\/\/carrotcave\.com\/voices\/sam-altman-startup-school-2026\//);
  for (const path of [
    `${readerRoot}assets/sam-altman-startup-school.jpg`,
    `${readerRoot}assets/og-sam-altman-startup-school.jpg`,
  ]) {
    const info = await stat(new URL(path, root));
    assert.ok(info.size > 10_000, `${path} must be a real image asset`);
  }
});

test('Sam Altman renderer keeps speaker boundaries while exposing official timestamps only at chapter boundaries', async () => {
  const [script, html] = await Promise.all([
    read(`${readerRoot}script.js`),
    read(`${readerRoot}index.html`),
  ]);
  assert.match(script, /const speakerNames = \{ 'Sam Altman': '샘 올트먼', 'Garry Tan': '개리 탄', Audience: '청중' \}/);
  assert.match(script, /p\.className='transcript-paragraph transcript-dialogue'/);
  assert.doesNotMatch(script, /groupSegments|transcript-time|sourceAt/);
  assert.equal((html.match(/class="chapter-time" href="https:\/\/www\.youtube\.com\/watch\?v=ZIaOBAjvc38&t=\d+s"/g) ?? []).length, 7);
  assert.doesNotMatch(html, /class="transcript-time"/);
});
