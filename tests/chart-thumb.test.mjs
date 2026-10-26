import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

test('charts and document screenshots are shown whole in archive thumbnails', () => {
  const css = read('app/globals.css');
  assert.match(css, /\.archive-thumb--chart img\{object-fit:contain;/);
  assert.match(css, /\.archive-thumb img\{[^}]*object-fit:cover/, 'photos keep cover');
  const list = read('components/ArchiveList.tsx');
  assert.match(list, /chart-media\.json/);
  assert.match(list, /archive-thumb--chart/);
});

test('every listed chart image exists and is used as a post lead image', () => {
  const { media } = JSON.parse(read('data/chart-media.json'));
  const posts = read('data/posts.ts');
  assert.ok(Object.keys(media).length > 0);
  for (const url of Object.keys(media)) {
    assert.ok(existsSync(new URL('../public' + url, import.meta.url)), url);
    assert.ok(posts.includes(`'${url}'`), `${url} is referenced by a post`);
  }
});
