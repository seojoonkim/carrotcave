import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

// Simon 2026-10-05: every footer element (not just the rabbit and carrot) uses the new mascot style:
// flat, outline-free, cream / mint / coral / slate-blue. No brown wood, beige parchment or dark-brown outlines.
const LEGACY = ['#8a6440', '#6b4a32', '#5a3e26', '#3a332c', '#221e1b', '#2f2a25', '#4a423a', '#6b6257', '#0f0e0d', '#7a5236', '#6b4630', '#8a5a3a', '#a8704a', '#9c6a10', '#a63a33', '#3e3266', '#cdbfa9', '#d9c79d', '#5f7a4c', '#4e3624', '#e9d6b8', '#dcc6a4', '#e3d2a8', '#f1e2bb', '#f3e6c4', '#efe3cf', '#e9dccb', '#b5afa6', '#c9a46a', '#d9b77a', '#e9dcc0', '#fff3e6'];

for (const f of ['public/footer-rabbit-carrot-v3.svg', 'public/footer-rabbit-carrot-static.svg', 'components/footer-scene-svg.ts']) {
  test(`${f}: no legacy footer palette left`, () => {
    const s = read(f).toLowerCase();
    assert.deepEqual(LEGACY.filter((c) => s.includes(c)), []);
  });
}

test('moon rabbit, burrow and signpost are redrawn in the mascot style', () => {
  for (const f of ['public/footer-rabbit-carrot-v3.svg', 'public/footer-rabbit-carrot-static.svg']) {
    const s = read(f);
    assert.match(s, /class="moon-rabbit"/, `${f}: moon rabbit is the chibi rabbit`);
    assert.match(s, /fill="#3d4158"/, `${f}: soft slate burrow`);
    assert.match(s, /<rect x="-2.6" y="-66" width="5.2" height="66" rx="2.6" fill="#6272a5"\/>/, `${f}: rounded slate-blue sign post`);
    assert.doesNotMatch(s, /stroke-linejoin="round"\/>\s*<g transform="translate\(20 -54\)"/, `${f}: sign boards have no outline`);
  }
});

test('mascot speaks in empty, done and lost states', () => {
  assert.ok(existsSync(new URL('../app/not-found.tsx', import.meta.url)));
  assert.match(read('app/not-found.tsx'), /<CaveBuddy mood="lost">/);
  assert.match(read('components/ArchiveList.tsx'), /archive-empty"><CaveBuddy mood="lost">/);
  assert.match(read('components/NewsletterForm.tsx'), /<CaveBuddy mood="happy">/);
  assert.match(read('components/CaveBuddy.tsx'), /<CarrotCaveMark className="cc-buddy__mark" \/>/);
});
