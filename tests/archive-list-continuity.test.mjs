import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('archive cards render as one uninterrupted list without depth dividers', async () => {
  const page = await read('app/page.tsx');
  assert.doesNotMatch(page, /CaveJourneyScene|journeyStep|cave-depth-divider|DEPTH 0/);
  assert.match(page, /visibleEntries\.map\(\(entry, index\) => entry\.kind === 'post'/);
  assert.match(page, /rhythm=\{index % 4\}/);
});

test('card hover is expressive only for fine hover pointers and motion-safe', async () => {
  const css = await read('app/globals.css');
  assert.match(css, /@media\(hover:hover\) and \(pointer:fine\)/);
  assert.match(css, /\.wall-card:hover\{[^}]*transform:translateY\(-4px\)[^}]*box-shadow:/);
  assert.match(css, /\.wall-card:hover \.wall-card__image\{transform:scale\(1\.045\)/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{[^\n]*\.editorial-wall \.wall-card[^\n]*transform:none!important/);
});
