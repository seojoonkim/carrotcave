import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const anim = read('public/footer-rabbit-carrot-v3.svg');
const still = read('public/footer-rabbit-carrot-static.svg');

test('footer story carries the site themes: burrow lantern, signpost (explore / doodle / voices), moon rabbit, paper-plane letter, satchel', () => {
  for (const svg of [anim, still]) {
    for (const cls of ['sky', 'moon', 'paper-plane', 'land', 'sign-board', 'lantern-glow', 'rabbit-satchel', 'firefly', 'sky-star']) {
      assert.match(svg, new RegExp(`class="${cls}"`), `missing ${cls}`);
    }
  }
});

test('every new looping layer stops under reduced motion', () => {
  const block = anim.split('@media (prefers-reduced-motion: reduce){').at(-1);
  for (const name of [...anim.matchAll(/\.([\w-]+)\{[^{}]*animation:([\w-]+) [\d.]+s/g)].map((m) => m[1])) {
    assert.ok(anim.split('@media (prefers-reduced-motion: reduce)').slice(1).some((b) => b.includes(`.${name}`)), `${name} must stop under reduced motion`);
  }
  assert.match(block, /animation:none!important/);
});

test('static footer has no motion and the svg paths parse (no "-0.6-.4" style number joins)', () => {
  assert.doesNotMatch(still, /@keyframes|animation:/);
  for (const svg of [anim, still]) {
    const stars = [...svg.matchAll(/class="sky-star"[^>]*d="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(stars.length, 12);
    for (const d of stars) assert.match(d, /^M0 -[\d.]+(Q-?[\d.]+ -?[\d.]+ -?[\d.]+ -?[\d.]+){4}Z$/, `star path must be space-separated: ${d}`);
  }
});

test('the hill ground fades out at both ends instead of ending in a hard box edge', () => {
  for (const svg of [anim, still]) {
    assert.match(svg, /<path d="M0 190V158[^"]*" fill="url\(#land-fade\)"\/>/);
    assert.match(svg, /id="land-fade"[\s\S]*?offset="0"[^>]*stop-opacity="0"[\s\S]*?offset="1"[^>]*stop-opacity="0"/);
  }
});
