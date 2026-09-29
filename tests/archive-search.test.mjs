import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('archive search filters locally without a server query and keeps section filters in the URL', async () => {
  const [home, list] = await Promise.all([read('app/page.tsx'), read('components/ArchiveList.tsx')]);
  assert.match(home, /searchParams: Promise<\{ section\?: string \}>/);
  assert.doesNotMatch(home, /\bq\?: string/);
  assert.match(list, /<label className="sr-only" htmlFor=\{`archive-search-\$\{storageKey\}`\}/);
  assert.match(list, /normalize\('NFKC'\)\.toLocaleLowerCase\('ko-KR'\)/);
  assert.match(list, /aria-live="polite"/);
  assert.match(list, /event\.key !== '\/'/);
  assert.match(list, /event\.key === 'Escape'/);
  await assert.rejects(read('lib/search/archive-search.ts'), /ENOENT/);
});

test('search presentation has one quiet underline field with a 16px input to avoid iOS zoom', async () => {
  const css = await read('app/globals.css');
  assert.match(css, /\.archive-search\{[^}]*height:44px/);
  assert.match(css, /\.archive-search__input\{[^}]*font:400 16px\/1 var\(--sans\)/);
});

test('main and ordinary post reading headers share one background declaration', async () => {
  const css = await read('app/globals.css');
  assert.match(css, /\.cc-header\{[^}]*background:var\(--cc-header-background\)/);
  assert.doesNotMatch(css, /\.cc-header--reading\{[^}]*background:/);
});
