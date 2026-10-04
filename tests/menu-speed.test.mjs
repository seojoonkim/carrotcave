// Menu response speed (2026.10): taps must feel instant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('category menu prefetches every destination fully', () => {
  const rail = read('components/AxisRail.tsx');
  assert.equal((rail.match(/<Link\s+prefetch\b/g) || []).length, 3);
  assert.match(rail, /<AxisRailInstant \/>/);
});

test('active marker moves on pointerdown, before the server answers', () => {
  const src = read('components/AxisRailInstant.tsx');
  assert.match(src, /'pointerdown'/);
  assert.match(src, /classList\.toggle\('active'/);
  assert.match(src, /classList\.remove\('cc-axis-pending'\)/);
});

test('prefetched pages stay warm between taps', () => {
  assert.match(read('next.config.ts'), /staleTimes: \{ dynamic: \d+, static: \d+ \}/);
});

test('menus have no tap delay', () => {
  assert.match(read('app/globals.css'), /\.axis-rail a,[^{]*\{touch-action:manipulation/);
  assert.match(read('public/voices/reader-system.css'), /\.menu-button, \.back-to-top, \.toc-drawer a \{ touch-action: manipulation/);
});

test('voice reading index opens fast: no backdrop blur, motion at most 160ms', () => {
  const css = read('public/voices/reader-system.css');
  const pass = css.slice(css.indexOf('Fast menu 2026.10'));
  assert.match(pass, /backdrop-filter: none !important/);
  for (const m of pass.matchAll(/transform \.(\d+)s/g)) assert.ok(Number('0.' + m[1]) <= 0.16, m[0]);
});

test('opening the voice index causes no page relayout (no body scroll lock, fixed scrollbar gutter)', () => {
  const css = read('public/voices/reader-system.css');
  assert.match(css, /html \{ scrollbar-gutter: stable; \}/);
  assert.match(css, /body\.drawer-open \{ overflow: visible !important; \}/);
  assert.match(css, /\.toc-drawer \{ overscroll-behavior: contain;/);
});
