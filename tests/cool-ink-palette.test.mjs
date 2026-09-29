import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

// Reference: when-stars-ring-again — ink-navy surfaces (#0b0e14) and cool blue-gray body ink (#d6dde6).
// Rule: every neutral (low-chroma) color used for surfaces, text and lines must not lean red (R ≤ B).
// Carrot accents are saturated (chroma > 60) and stay exempt.
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const voiceDirs = readdirSync(new URL('../public/voices/', import.meta.url), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
const files = [
  'app/globals.css', 'app/layout.tsx', 'public/shared-header-chrome.css', 'public/voices/reader-system.css',
  ...readdirSync(new URL('../components/', import.meta.url)).filter((f) => f.endsWith('.tsx')).map((f) => `components/${f}`),
  ...voiceDirs.flatMap((d) => [`public/voices/${d}/styles.css`, `public/voices/${d}/index.html`]),
];

const colorsIn = (src) => {
  const out = [];
  for (const m of src.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b(?![0-9a-f])/gi)) {
    const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
    out.push({ text: m[0], rgb: [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) });
  }
  for (const m of src.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g)) out.push({ text: m[0], rgb: [m[1], m[2], m[3]].map(Number) });
  return out;
};

test('no neutral surface, ink or line color leans red anywhere on the site', () => {
  const offenders = [];
  for (const f of files) {
    let src; try { src = read(f); } catch { continue; }
    for (const { text, rgb: [r, g, b] } of colorsIn(src)) {
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      if (chroma <= 60 && r > b + 2 && r + g + b < 760) offenders.push(`${f}: ${text}`);
    }
  }
  assert.deepEqual([...new Set(offenders)], []);
});

test('base tokens follow the ink-navy reference', () => {
  const css = read('app/globals.css');
  assert.match(css, /#0b0e14/i, 'page background');
  assert.match(css, /#d6dde6/i, 'body ink');
  const voice = read('public/voices/reader-system.css');
  assert.match(voice, /#0b0e14|11,\s*14,\s*20/i);
});
