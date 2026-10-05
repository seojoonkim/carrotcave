// Eye comfort (2026.10): readable but never glaring on the #252732 ink background.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const lum = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)).reduce((a, c, i) => a + c * [0.2126, 0.7152, 0.0722][i], 0);
const ratio = (a, b = '#252732') => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

test('body ink sits in the comfortable 12-14:1 band', () => {
  const r = ratio('#eceef5');
  assert.ok(r >= 12 && r <= 14, String(r));
});

test('titles and key sentences stay under 16:1', () => {
  assert.ok(ratio('#f6f7fb') < 16);
});

test('no pure white text colour on the site or voice readers', () => {
  for (const f of ['app/globals.css', 'public/voices/reader-system.css', 'public/reading-end.css']) {
    const src = read(f);
    // White stays allowed only for text drawn on top of photos (image cards, video play, gallery arrows).
    const onPhoto = /with-image|youtube__play|gallery-nav|hero-portrait/;
    const hits = [...src.matchAll(/([^{}]*)\{[^{}]*?(?<![-\w])color\s*:\s*(#fff(?:fff)?|white|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))\s*[;}!]/gi)]
      .filter((m) => !onPhoto.test(m[1])).map((m) => m[1].trim().slice(-60));
    assert.deepEqual(hits, [], f);
  }
});

test('voice key sentences use the softened ink, not white', () => {
  const css = read('public/voices/reader-system.css');
  assert.match(css, /transcript-highlight \{\s*color: #f6f7fb;\s*font-weight: 600;/);
});

test('old glaring inks are gone from site styles', () => {
  const css = read('app/globals.css');
  assert.doesNotMatch(css, /#d9dce8|#d9dce8/i);
});
