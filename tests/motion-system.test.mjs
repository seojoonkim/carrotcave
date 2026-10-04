// Motion system (2026.10): smooth, quick transitions that never slow the site or ignore reduced motion.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const site = read('app/globals.css');
const voice = read('public/voices/reader-system.css');
const pass = (css) => css.slice(css.indexOf('Motion system 2026.10'));

test('page changes cross-fade on both the site and voice readers', () => {
  for (const css of [site, voice]) assert.match(pass(css), /@view-transition ?\{ ?navigation: ?auto ?;? ?\}/);
  assert.match(pass(site), /\.cc-header\{view-transition-name:cc-header\}/);
});

test('every motion is short: no animation or transition over 360ms', () => {
  for (const css of [site, voice]) {
    for (const m of pass(css).matchAll(/(?:animation|transition)[^;{}]*?(\d*\.\d+|\d+)(m?s)\b/g)) {
      const ms = m[2] === 'ms' ? Number(m[1]) : Number(m[1]) * 1000;
      if (/delay/.test(m[0])) continue;
      assert.ok(ms <= 360, m[0]);
    }
  }
});

test('motion only animates opacity and transform (no layout properties)', () => {
  for (const css of [site, voice]) {
    for (const k of pass(css).matchAll(/@keyframes [\w-]+\s*\{([^@]*?\})\s*\}?/g)) {
      assert.doesNotMatch(k[1], /\b(top|left|height|width|margin|padding)\s*:/, k[0]);
    }
  }
});

test('reduced motion turns every transition off', () => {
  for (const css of [site, voice]) {
    const reduce = pass(css).slice(pass(css).indexOf('prefers-reduced-motion'));
    assert.match(reduce, /navigation: ?none/);
    assert.match(reduce, /animation: ?none/);
  }
});

test('list content never blanks out while a category changes', () => {
  const p = pass(site);
  assert.doesNotMatch(p, /\.wall-shell \.archive\{animation-delay/);
  const k = p.match(/@keyframes cc-list-in\{from\{opacity:([\d.]+)/);
  assert.ok(k && Number(k[1]) >= 0.3, 'list must start at least 30% visible');
});
