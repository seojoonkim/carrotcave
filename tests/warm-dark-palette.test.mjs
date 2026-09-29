import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const lum = (h) => { const v = [0, 2, 4].map((i) => parseInt(h.slice(1 + i, 3 + i), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

test('warm dark palette tokens meet contrast and avoid pure white / pure black', () => {
  const css = read('app/globals.css');
  const tok = (name) => css.match(new RegExp(`--${name}:(#[0-9a-f]{6})`, 'i'))[1];
  const bg = tok('bg-1');
  assert.ok(ratio(tok('ink-1'), bg) >= 12, 'body text >= 12:1');
  assert.ok(ratio(tok('ink-2'), bg) >= 7, 'secondary >= 7:1');
  assert.ok(ratio(tok('ink-3'), bg) >= 4.5, 'dim >= 4.5:1');
  assert.ok(ratio(tok('carrot'), bg) >= 4.5, 'carrot accent >= 4.5:1');
  assert.ok(ratio(tok('ink-1'), bg) <= 15, 'not glaring pure-white contrast');
  assert.notEqual(bg.toLowerCase(), '#000000');
  assert.match(css, /color-scheme:dark/);
});

test('one accent family: old cyan/teal accents are gone from site and every voice reader', () => {
  const files = ['app/globals.css', 'public/voices/reader-system.css', 'public/shared-header-chrome.css',
    ...readdirSync(new URL('../public/voices/', import.meta.url), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => `public/voices/${d.name}/styles.css`)];
  for (const f of files) {
    const css = read(f);
    for (const old of ['#61adab', '#5fe0f2', '#82e8f2', '#76b9d4', '#24262c', '#e7e7e8']) {
      assert.ok(!css.toLowerCase().includes(old), `${f} still uses ${old}`);
    }
  }
});

test('carrot touches: selection, focus, scrollbar and reading progress use the carrot family', () => {
  const css = read('app/globals.css');
  assert.match(css, /::selection\{background:rgba\(243,154,82,\.3\)/);
  assert.match(css, /scrollbar-color:rgba\(243,154,82,\.38\)/);
  assert.match(css, /background:linear-gradient\(90deg,#e27a2e,#f39a52 60%,#f6c07a\)!important/);
  assert.match(read('public/voices/reader-system.css'), /#transcript \.speaker-person \{ color: #f5b27a; \}/);
});

test('no cool blue/teal hex colors remain in any voice stylesheet', () => {
  for (const d of readdirSync(new URL('../public/voices/', import.meta.url), { withFileTypes: true }).filter((e) => e.isDirectory())) {
    const css = read(`public/voices/${d.name}/styles.css`);
    for (const h of css.match(/#[0-9a-f]{6}\b/gi) || []) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
      assert.ok(!(b > r + 40 && g > r + 20), `${d.name} uses cool accent ${h}`);
    }
  }
});
