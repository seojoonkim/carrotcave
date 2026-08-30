import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('mobile archive cards expose a restrained gap instead of touching', async () => {
  const css = await read('app/globals.css');
  assert.match(css, /\/\* Mobile card separation and touch polish\. \*\/[\s\S]*?@media\(max-width:520px\)\{[\s\S]*?\.editorial-wall\{gap:12px\}/);
});

test('touch cards provide lightweight press feedback without affecting fine-pointer hover', async () => {
  const css = await read('app/globals.css');
  assert.match(css, /@media\(hover:none\) and \(pointer:coarse\)\{\.editorial-wall \.wall-card\{touch-action:manipulation;transition:transform \.12s ease,opacity \.12s ease\}\.editorial-wall \.wall-card:active\{transform:scale\(\.992\);opacity:\.92\}\}/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{\.editorial-wall \.wall-card:active\{transform:none!important\}\}/);
});

test('archive eagerly loads only the first two above-the-fold images', async () => {
  const page = await read('app/page.tsx');
  assert.doesNotMatch(page, /priority=\{index < 4\}/);
  assert.match(page, /priority=\{index < 2\}/g);
});
