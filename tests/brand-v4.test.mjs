// Brand v4 (2026-10-05, Simon: "이 테마로 전체 리디자인 — OG·로고·모션·애니메이션 다, 성인도 재밌고 귀엽게 모던하게").
// Every brand surface is generated from ONE glyph kit (scripts/brand/glyphs.py): one pen (stroke 7, round caps/joins),
// navy geometric faces, no arms/legs/blush. These checks keep the site, readers, footer, icons and OG in that system.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const brand = read('lib/brand-svg.ts');
const footer = read('public/brand/footer-cave.svg');
const css = read('app/globals.css');

test('generated brand files are in sync with the glyph kit (run python3 scripts/brand/build_brand.py)', () => {
  const before = ['lib/brand-svg.ts', 'public/brand/footer-cave.svg', 'public/brand/mark.svg', 'public/favicon.svg',
    'public/footer-rabbit-carrot-v3.svg', 'public/footer-rabbit-carrot-static.svg', 'public/voices/liao-heng/index.html'].map(read);
  execFileSync('python3', ['scripts/brand/build_brand.py'], { cwd: new URL('..', import.meta.url) });
  const after = ['lib/brand-svg.ts', 'public/brand/footer-cave.svg', 'public/brand/mark.svg', 'public/favicon.svg',
    'public/footer-rabbit-carrot-v3.svg', 'public/footer-rabbit-carrot-static.svg', 'public/voices/liao-heng/index.html'].map(read);
  assert.deepEqual(after.map((s) => s.length), before.map((s) => s.length));
});

test('one pen: every face glyph uses stroke 7 with round caps and joins', () => {
  for (const src of [brand, footer]) {
    const glyphs = [...src.matchAll(/class=\\?"glyph\\?"[^>]*>/g)].map((m) => m[0]);
    assert.ok(glyphs.length > 20);
    for (const g of glyphs) {
      assert.match(g, /stroke-width=\\?"7\\?"/, g);
      assert.match(g, /stroke-linecap=\\?"round\\?"/, g);
      assert.match(g, /stroke-linejoin=\\?"round\\?"/, g);
    }
  }
});

test('adult-modern style: no blush, no limbs, navy faces', () => {
  for (const src of [brand, footer]) {
    assert.doesNotMatch(src, /blush|cheek|arm|paw|whisker/i);
    assert.match(src, /#16324A/i);
  }
});

test('footer keeps every hook the site uses: moods, daypart, NEW flag, carrot tap, reduced motion', () => {
  for (const m of ['explore', 'build', 'doodle', 'fiction', 'voices']) assert.match(footer, new RegExp(`class="prop prop--${m}"`));
  for (const c of ['sun', 'sky-night', 'mouth-sky', 'news-flag', 'tap-pop', 'carrot-hit']) assert.match(footer, new RegExp(`class="${c}"`));
  assert.match(footer, /class="carrot-hit"[^>]*role="button"[^>]*tabindex="0"/);
  assert.match(footer, /@media \(prefers-reduced-motion: reduce\)\{[^}]*animation:none!important/);
  assert.match(css, /\.footer-scene\[data-daypart=dusk\] \.mouth-sky\{fill:#C8774F\}/);
});

test('readers and every surface share the same mark; icons and OG are fresh rasters', () => {
  const reader = read('public/voices/liao-heng/index.html');
  assert.match(reader, /<svg class="brand-mark"[^>]*viewBox="0 0 96 96"/);
  assert.match(reader, /class="mark-rabbit"/);
  assert.match(read('components/CarrotCaveMark.tsx'), /MARK_INNER/);
  assert.match(read('components/CaveBuddy.tsx'), /BUDDY_INNER/);
  for (const f of ['public/favicon.ico', 'public/favicon-192.png', 'public/apple-touch-icon.png', 'app/apple-icon.png', 'public/carrotcave-og-20260814.png']) {
    assert.ok(statSync(new URL(`../${f}`, import.meta.url)).size > 500, f);
  }
});

test('dark cave palette tokens are defined once', () => {
  assert.match(css, /--cave-0:#1e1f28;--cave-1:#272a37;--cave-2:#3a3e52/);
  assert.match(css, /--carrot-kit:#ff7a3d/);
});
