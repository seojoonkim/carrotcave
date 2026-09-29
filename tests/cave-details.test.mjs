import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const css = read('app/globals.css');
const end = read('public/reading-end.css');

test('corners stay sharp: no pixel radius above 4px', () => {
  for (const src of [css, end]) {
    const big = [...src.matchAll(/border-radius\s*:\s*(\d+)px/g)].map((m) => Number(m[1])).filter((n) => n > 4);
    assert.deepEqual(big, []);
  }
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

test('lists and picks share crop marks and a carrot notch on hover', () => {
  assert.match(css, /\.archive-thumb::after\{[^}]*opacity:0/);
  assert.match(css, /\.archive-row__link:hover::after\{height:28px\}/);
  assert.match(end, /a\.cave-constellation__thumbnail:hover \.cave-constellation__thumbnail-copy::before\{height:28px\}/);
});
