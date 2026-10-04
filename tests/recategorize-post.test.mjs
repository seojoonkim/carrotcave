import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { recategorizeSource, recategorizePost } from '../scripts/recategorize-post.mjs';

const src = `export const posts = [\n  {\n    slug: 'a',\n    category: "빌딩",\n  },\n  {\n    slug: 'b',\n    category: "빌딩",\n  },\n];\n`;

test('recategorize changes only the target post', () => {
  const r = recategorizeSource(src, 'a', '탐험');
  assert.equal(r.from, '빌딩');
  assert.match(r.source, /slug: 'a',\n    category: "탐험"/);
  assert.match(r.source, /slug: 'b',\n    category: "빌딩"/);
});

test('recategorize rejects unknown slug or category', () => {
  assert.throws(() => recategorizeSource(src, 'zzz', '탐험'), /not found/);
  assert.throws(() => recategorizeSource(src, 'a', '여행'), /Unknown category/);
});

test('recategorize syncs overrides and always regenerates the full ontology pipeline', () => {
  const root = mkdtempSync(join(tmpdir(), 'recat-'));
  mkdirSync(join(root, 'data'));
  writeFileSync(join(root, 'data', 'posts.ts'), src);
  writeFileSync(join(root, 'data', 'sync-metadata-overrides.json'), JSON.stringify({ 9: { slug: 'a', category: '빌딩' } }));
  let calls = 0;
  recategorizePost({ slug: 'a', category: '탐험', root, regenerate: () => { calls += 1; } });
  assert.equal(calls, 1);
  assert.equal(JSON.parse(readFileSync(join(root, 'data', 'sync-metadata-overrides.json'), 'utf8'))['9'].category, '탐험');
});
