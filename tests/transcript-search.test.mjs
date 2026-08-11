import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

await import('../public/voices/liao-heng/transcript-search.js');

const { normalize, buildIndex, findMatches } = globalThis.TranscriptSearch;
const transcript = JSON.parse(readFileSync(new URL('../public/voices/liao-heng/transcript-ko.json', import.meta.url), 'utf8'));

test('transcript search normalizes case and composed Korean text', () => {
  assert.equal(normalize('HBM'), normalize('hbm'));
  assert.equal(normalize('한글'.normalize('NFD')), normalize('한글'));
});

test('transcript search uses ordered literal non-overlapping matches', () => {
  const index = buildIndex([
    { id: 8, text: 'aaaa' },
    { id: 9, text: 'literal [value].' },
  ]);
  assert.deepEqual(findMatches(index, 'aa'), [
    { paragraphId: 8, ranges: [{ start: 0, end: 2 }, { start: 2, end: 4 }] },
  ]);
  assert.deepEqual(findMatches(index, '['), [
    { paragraphId: 9, ranges: [{ start: 8, end: 9 }] },
  ]);
  assert.deepEqual(findMatches(index, 'a.a'), []);
  assert.deepEqual(findMatches(index, '   '), []);
});

test('transcript search indexes the complete Liao Heng paragraph corpus', () => {
  const index = buildIndex(transcript.paragraphs);
  assert.equal(index.length, 634);
  assert.equal(new Set(index.map((entry) => entry.id)).size, 634);
  assert.deepEqual([index[0].id, index.at(-1).id], [0, 633]);
  assert.ok(index.every((entry) => entry.text.length > 0));
  const results = findMatches(index, '18층 보탑');
  assert.ok(results.length > 0);
  assert.ok(results.every((result) => index.some((entry) => entry.id === result.paragraphId)));
});
