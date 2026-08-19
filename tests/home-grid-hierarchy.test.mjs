import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('desktop archive uses two columns with stronger card titles than before', async () => {
  const [css, card] = await Promise.all([
    read('app/globals.css'),
    read('components/EditorialCard.tsx'),
  ]);

  assert.match(css, /\.editorial-wall \.wall-card\{grid-column:span 6;grid-row:span 4;/);
  assert.match(css, /\.wall-heading #wall-heading\{font-size:clamp\(19px,2\.1vw,28px\)\}/);
  assert.match(css, /\.editorial-wall \.wall-card h2\{font:400 29px\/1\.22 var\(--sans\)/);
  assert.match(card, /\(max-width: 900px\) 66vw, 50vw/);
});

test('mobile archive remains a single-column reading flow', async () => {
  const css = await read('app/globals.css');
  assert.match(css, /@media\(max-width:520px\)\{\.editorial-wall\{display:flex;flex-direction:column;/);
});

