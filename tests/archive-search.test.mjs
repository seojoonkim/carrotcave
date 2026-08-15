import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('archive search UI, query behavior, and implementation are absent', async () => {
  const home = await read('app/page.tsx');
  assert.match(home, /searchParams: Promise<\{ section\?: string \}>/);
  assert.doesNotMatch(home, /\bq\?: string|displayQuery|normalizeQuery|searchArchive|ArchiveSearch/);
  assert.doesNotMatch(home, /archive-search-status|검색 결과|검색 결과가 없습니다/);
  assert.doesNotMatch(home, /journeyStep|cave-depth-divider|Number\.POSITIVE_INFINITY/);
  await assert.rejects(read('components/ArchiveSearch.tsx'), /ENOENT/);
  await assert.rejects(read('lib/search/archive-search.ts'), /ENOENT/);
  await assert.rejects(read('lib/search/navigation.ts'), /ENOENT/);
  await assert.rejects(read('lib/search/normalize.ts'), /ENOENT/);
});

test('removed search presentation leaves no dead archive-search CSS', async () => {
  const css = await read('app/globals.css');
  assert.doesNotMatch(css, /\.archive-search/);
});

test('main and ordinary post reading headers share one background declaration', async () => {
  const css = await read('app/globals.css');
  assert.match(css, /\.cc-header\{[^}]*background:var\(--cc-header-background\)/);
  assert.doesNotMatch(css, /\.cc-header--reading\{[^}]*background:/);
});
