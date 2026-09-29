import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
test('index pages use a narrower editorial measure and an 8px spacing grid', () => {
  assert.match(css, /--index-measure:920px;--space-1:8px;--space-2:16px;--space-3:24px;--space-4:32px;--space-5:48px/);
  assert.match(css, /\.wall-shell \.wall-heading,\.wall-shell \.archive\{[^}]*max-width:var\(--index-measure\)/);
});
test('list rows are text-first with the thumbnail on the trailing edge at every width', () => {
  assert.match(css, /\.archive-row__link\{grid-template-columns:minmax\(0,1fr\) 184px/);
  assert.match(css, /\.archive-row \.archive-thumb\{order:2;aspect-ratio:16\/10\}/);
});
test('mobile index gutter matches the 20px reader gutter', () => {
  assert.match(css, /@media\(max-width:900px\)\{\n  \.wall-shell\{padding-inline:20px!important\}/);
});
