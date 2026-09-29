import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const files = ['app/globals.css', 'public/shared-header-chrome.css', 'public/voices/reader-system.css', 'app/layout.tsx',
  ...readdirSync(new URL('../public/voices/', import.meta.url), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => `public/voices/${d.name}/styles.css`)];

test('dark surfaces are neutral charcoal: no red cast in any dark background colour', () => {
  const warm = [];
  for (const f of files) {
    const css = read(f);
    for (const h of css.match(/#[0-9a-f]{6}\b/gi) || []) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
      if (Math.max(r, g, b) <= 0x48 && r - b >= 2) warm.push(`${f}: ${h}`);
    }
    for (const [, r, , b] of css.matchAll(/rgba\((\d+),\s*(\d+),\s*(\d+),/g)) {
      if (Math.max(+r, +b) <= 72 && r - b >= 2) warm.push(`${f}: rgba(${r},…,${b})`);
    }
  }
  assert.deepEqual(warm, []);
});

test('page background carries no orange glow', () => {
  assert.doesNotMatch(read('app/globals.css'), /body\{background:radial-gradient\([^)]*rgba\(243,154,82/);
  assert.doesNotMatch(read('public/voices/reader-system.css'), /body \{ background: radial-gradient\([^)]*rgba\(243, 154, 82/);
});
