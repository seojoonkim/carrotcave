// 2026-10-27 three-model design review, approved items 1, 2, 4.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const voices = readFileSync(new URL('../components/views/VoicesView.tsx', import.meta.url), 'utf8');

const tail = css.slice(css.indexOf('/* Review 2026-10-27 batch 1'));

test('item 1: tablet (721-900px) lead card keeps image and text side by side', () => {
  assert.ok(tail.length > 0, 'batch-1 block missing');
  const m = tail.match(/@media\s*\(min-width:\s*721px\)\s*and\s*\(max-width:\s*900px\)\s*\{([\s\S]*?)\n\}/);
  assert.ok(m, 'tablet media block missing');
  assert.match(m[1], /\.archive-lead\{[^}]*grid-template-columns:\s*260px\s+minmax\(0,\s*1fr\)/);
});

test('item 2: phone (<=520px) row thumbnail is 72px and text keeps >=20px gap', () => {
  const m = tail.match(/@media\s*\(max-width:\s*520px\)\s*\{([\s\S]*?)\n\}/);
  assert.ok(m, 'phone media block missing');
  assert.match(m[1], /\.archive-row__link\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+72px/);
  const gap = m[1].match(/\.archive-row__link\{[^}]*gap:\s*(\d+)px/);
  assert.ok(gap && Number(gap[1]) >= 20, 'thumbnail gap must stay >= 20px (layout gate)');
});

test('item 4: voices list is sorted newest first by source date', () => {
  assert.match(voices, /\.sort\(\(a,\s*b\)\s*=>\s*b\.sourcePublishedAt\.localeCompare\(a\.sourcePublishedAt\)\)/);
});
