// Footer scene moods: each menu gives the rabbit its own prop and motion; time of day, NEW flag and carrot tap.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildFooterSceneModule, scopeCss } from '../scripts/build-footer-scene.mjs';
import { daypartOf, isFresh } from '../lib/footer-scene.ts';
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const svg = read('public/brand/footer-cave.svg');
const css = read('app/globals.css');
const moods = ['explore', 'build', 'doodle', 'fiction', 'voices'];

test('generated inline scene is in sync with the svg source', () => {
  assert.equal(read('components/footer-scene-svg.ts'), buildFooterSceneModule(svg), 'run: node scripts/build-footer-scene.mjs');
});

test('inlined svg styles are scoped to .footer-scene and cannot leak into the site', () => {
  const inline = read('components/footer-scene-svg.ts');
  const styles = [...inline.matchAll(/<style>(.*?)<\\\/style>/g)].map((m) => m[1]).join('');
  for (const rule of styles.replace(/@keyframes[^{]*\{(?:[^{}]*\{[^}]*\})*[^}]*\}/g, '').matchAll(/(?:^|\})\s*([^@{}][^{}]*)\{/g)) {
    for (const sel of rule[1].split(',')) assert.match(sel.trim(), /^\.footer-scene /, `unscoped selector: ${sel}`);
  }
  assert.equal(scopeCss('.a,.b{x:1}@media (x){.c{y:2}}'), '.footer-scene .a,.footer-scene .b{x:1}@media (x){.footer-scene .c{y:2}}');
});

test('every menu has its own prop and signpost highlight', () => {
  for (const m of moods) {
    assert.match(svg, new RegExp(`class="prop prop--${m}"`), `prop for ${m}`);
    assert.match(css, new RegExp(`\\.footer-scene\\[data-mood=${m}\\] \\.prop--${m}`), `prop switch for ${m}`);
    assert.match(css, new RegExp(`\\.axis-rail a\\[data-mood=${m}\\]\\{--mood-hover:cc-hover-${m}\\}`), `menu hover for ${m}`);
  }
  const rail = read('components/AxisRail.tsx');
  assert.match(rail, /data-mood=\{axisMood\[axis\]\}/);
  assert.match(rail, /data-mood="voices"/);
  assert.match(rail, /data-mood="all"/);
});

test('menu switch uses ONE identical entrance for every menu (no per-menu directions)', () => {
  assert.doesNotMatch(css, /@keyframes cc-mood-/, 'no per-menu list keyframes');
  assert.doesNotMatch(css, /\.wall-shell\[data-mood=[a-z]+\][^{]*\{[^}]*animation/, 'no per-menu list animation override');
  assert.match(css, /\.wall-shell \.wall-heading,\.wall-shell \.archive\{animation:cc-list-in /);
  const k = css.match(/@keyframes cc-list-in\{from\{([^}]*)\}/)[1];
  assert.doesNotMatch(k, /translateX|rotate|scale/, 'shared entrance is a gentle fade-up only');
});

test('time of day: day 06-17, dusk 17-19, night otherwise', () => {
  assert.equal(daypartOf(5), 'night');
  assert.equal(daypartOf(6), 'day');
  assert.equal(daypartOf(16), 'day');
  assert.equal(daypartOf(17), 'dusk');
  assert.equal(daypartOf(18), 'dusk');
  assert.equal(daypartOf(19), 'night');
  assert.match(css, /\.footer-scene\[data-daypart=day\] \.sun\{opacity:1\}/);
  assert.match(css, /\.footer-scene\[data-daypart=day\] \.sky-night\{opacity:0\}/);
});

test('NEW flag shows only for a post dated today or yesterday in KST', () => {
  const at = (iso) => Date.parse(iso);
  assert.equal(isFresh('2026-10-04', at('2026-10-04T09:00:00+09:00')), true);
  assert.equal(isFresh('2026-10-04', at('2026-10-05T23:00:00+09:00')), true);
  assert.equal(isFresh('2026-10-04', at('2026-10-06T00:00:01+09:00')), false);
  assert.equal(isFresh('2026-10-05', at('2026-10-04T12:00:00+09:00')), false);
  assert.equal(isFresh(undefined), false);
  assert.match(css, /\.footer-scene\[data-fresh=true\] \.news-flag\{display:inline\}/);
});

test('carrot is a keyboard-reachable button and the tap pop respects reduced motion', () => {
  assert.match(svg, /class="carrot-hit"[^>]*role="button"[^>]*tabindex="0"[^>]*aria-label="당근 쓰다듬기"/);
  const comp = read('components/FooterCaveScene.tsx');
  assert.match(comp, /e\.key === 'Enter' \|\| e\.key === ' '/);
  assert.match(comp, /aria-live="polite"/);
  assert.match(css, /\.footer-scene\.is-tapped \.carrot-clip,\.footer-scene\.is-tapped \.tap-pop[^{]*\{animation:none!important\}/);
});

test('phone crop fades both edges so the hill never ends in a hard box', () => {
  assert.match(css, /@media\(max-width:600px\)\{[^\n]*\.footer-scene\{-webkit-mask-image:linear-gradient\(90deg,transparent 0,#000 7%,#000 93%,transparent 100%\)/);
});

test('brand tagline reads "Followed the rabbit. Lost the thread." in header and share card', () => {
  assert.match(read('components/SiteHeader.tsx'), /<small className="cc-brand-tagline">Followed the rabbit\. Lost the thread\.<\/small>/);
  assert.match(read('lib/og-card.tsx'), /TAGLINE_EN = 'Followed the rabbit\. Lost the thread\.'/);
  assert.doesNotMatch(read('components/SiteHeader.tsx'), /FIELD NOTES FROM THE RABBIT HOLE/);
});
