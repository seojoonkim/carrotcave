import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
test('menu label, count and intro sit on ONE line (wraps only when it truly cannot fit)', () => {
  const tail = css.slice(css.lastIndexOf('/* One-line bridge 2026.10 */'));
  assert.match(tail, /\.wall-heading\.wall-heading--bridge\{display:flex;flex-wrap:wrap;align-items:baseline/);
  assert.doesNotMatch(tail, /\.wall-heading\.wall-heading--bridge\{[^}]*display:grid/);
  assert.match(tail, /\.wall-heading--bridge \.wall-heading__kicker::after\{content:""/, 'divider between count and intro');
});
