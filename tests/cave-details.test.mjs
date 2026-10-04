import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const css = read('app/globals.css');
const end = read('public/reading-end.css');

test('corners follow the soft-night mascot scale (2026-10-05): only 12/16px or pills above 4px', () => {
  for (const src of [css, end]) {
    const big = [...src.matchAll(/border-radius\s*:\s*(\d+)px/g)].map((m) => Number(m[1])).filter((n) => n > 4 && ![12, 16, 999].includes(n));
    assert.deepEqual(big, []);
  }
  assert.match(css, /--r-thumb:12px;--r-card:16px;--r-pill:999px/);
  assert.match(css, /\.post-link-card,[^{]*\{border-radius:var\(--r-card\)\}/);
  assert.match(css, /\.wall-shell \.archive-search,[^{]*\{border-radius:var\(--r-pill\)\}/);
});

test('torch follows the pointer only on fine pointers and respects reduced motion', () => {
  const torch = read('components/CaveTorch.tsx');
  assert.match(torch, /\(hover: hover\) and \(pointer: fine\)/);
  assert.match(torch, /prefers-reduced-motion: reduce/);
  assert.match(torch, /requestAnimationFrame/);
  assert.match(read('app/layout.tsx'), /<CaveTorch \/>/);
  assert.match(css, /\.cc-torch\{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:0/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\),\(hover:none\)\{\.cc-torch\{display:none\}\}/);
});

test('cave details stay minimal: faint torch only, no orange hover bar on rows', () => {
  assert.doesNotMatch(css + end, /Crop marks|10px 1\.5px/);
  assert.match(css, /rgba\(243,154,82,\.032\)/);
  // Simon 2026-10: the orange left bar on row hover is too much. Keep it gone in lists and picks.
  assert.doesNotMatch(css + end, /[Cc]arrot notch/);
  assert.doesNotMatch(css, /\.archive-(lead|row__link)(:hover|:focus-visible)?::after\{[^}]*(height:28px|#f39a52)/);
  assert.doesNotMatch(end, /cave-constellation__thumbnail-copy::before/);
  assert.doesNotMatch(css + end, /width:2px;height:0;background:(#f39a52|var\(--t\))/);
});
