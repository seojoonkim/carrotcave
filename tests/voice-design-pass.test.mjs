// Voice reader design pass (2026.10): refined layout with a few small carrot charms.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const css = await readFile(new URL('../public/voices/reader-system.css', import.meta.url), 'utf8');
const pass = css.slice(css.indexOf('DESIGN PASS 2026.10'));

test('design pass lives in the shared reader stylesheet', () => {
  assert.ok(css.includes('DESIGN PASS 2026.10'));
});

test('hero order is the same on every voice: kicker, photo, title, date, deck', () => {
  const order = ['kicker', 'hero-portrait', '#page-title', 'hero-date', 'hero-deck'].map((sel, i) => {
    const re = new RegExp(`\\.hero > \\.?${sel.replace('#', '#')} \\{ order: ${i + 1}; \\}`);
    return re.test(pass);
  });
  assert.deepEqual(order, [true, true, true, true, true]);
});

test('date line stays on the reading column (auto side margins, not 0)', () => {
  assert.match(pass, /\.hero > \.hero-date \{[^}]*margin: 0 auto 22px/);
});

test('cute points stay few and use the one carrot mark', () => {
  const carrots = pass.match(/carrot-mark\.svg/g) || [];
  assert.ok(carrots.length >= 2 && carrots.length <= 3, `carrot marks in pass: ${carrots.length}`);
});

test('motion respects prefers-reduced-motion', () => {
  assert.match(pass, /@keyframes cc-wiggle/);
  assert.match(pass, /prefers-reduced-motion: reduce\)[^]*animation: none/);
});

test('no left hover bar comes back on lists or speakers', () => {
  assert.doesNotMatch(pass, /:hover[^{]*\{[^}]*border-left/);
});
