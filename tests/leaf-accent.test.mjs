import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const lum = (h) => { const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

test('leaf green is a real second accent with readable contrast', () => {
  const css = read('app/globals.css');
  const leaf = css.match(/--leaf-pop:(#[0-9a-f]{6})/i)[1];
  assert.ok(ratio(leaf, '#0b0e14') >= 7, 'leaf accent >= 7:1 on the cave background');
  assert.match(css, /\.post-link-card__label\{color:var\(--leaf-pop\)\}/);
  assert.match(css, /\.cc-newsletter__eyebrow\{color:var\(--leaf-pop\)\}/);
});

test('leaf stays a supporting accent: selection and primary actions remain carrot orange', () => {
  const css = read('app/globals.css');
  assert.doesNotMatch(css, /a\.active b\{[^}]*leaf-pop/);
  assert.doesNotMatch(css, /post-link-card__cta\{[^}]*leaf-pop/);
  assert.match(read('public/reading-end.css'), /\.cave-constellation-kicker\{[^}]*color:#a6d36b/);
});
