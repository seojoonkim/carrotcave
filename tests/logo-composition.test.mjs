import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const voiceSlugs = fs.readdirSync(path.join(root, 'public/voices')).filter((d) => fs.existsSync(path.join(root, 'public/voices', d, 'index.html')));

// Logo v4: chibi rabbit + smiling carrot drawn in final coordinates (no CSS scale/offset tricks).
function checkMark(label, mark) {
  const floor = Number(mark.match(/<path d="M3 ([\d.]+)h90"/)?.[1]);
  assert.ok(floor, `${label}: burrow floor missing`);
  const feet = [...mark.matchAll(/<ellipse cx="(?:35|49)" cy="([\d.]+)" rx="5\.6" ry="([\d.]+)"/g)];
  assert.equal(feet.length, 2, `${label}: two feet`);
  for (const [, cy, ry] of feet) assert.ok(Math.abs(Number(cy) + Number(ry) - floor) <= 1, `${label}: feet stand on the floor`);
  assert.equal((mark.match(/__eye"/g) ?? []).length, 2, `${label}: two eyes`);
  assert.match(mark, /#00d9a8/, `${label}: mint inner ears (soft-night mascot)`);
  assert.match(mark, /#f7f3ea/, `${label}: cream fur`);
  assert.match(mark, /__eye"[^>]*fill="#1c2a3a"/, `${label}: navy dot eyes`);
  assert.match(mark, /#ff9fb2/, `${label}: blush`);
  assert.match(mark, /__carrot"/, `${label}: carrot`);
  assert.match(mark, /#ff7a45/, `${label}: coral carrot`);
  assert.equal((mark.match(/fill="#00c08b"/g) ?? []).length, 3, `${label}: three rounded mint leaf blobs`);
  assert.match(mark, /#00c08b/, `${label}: leaf green`);
}

test('React logo is the chibi rabbit + smiling carrot standing on the burrow floor', () => {
  const mark = read('components/CarrotCaveMark.tsx');
  checkMark('React logo', mark);
  assert.match(mark, /<g className="carrot-cave-mark__rabbit-position"><g className="carrot-cave-mark__rabbit">/);
  const css = read('app/globals.css');
  assert.match(css, /\.carrot-cave-mark__cave\{transform:none!important\}/);
  assert.match(css, /\.carrot-cave-mark__rabbit-position\{transform:none!important\}/);
  assert.match(css, /\.cc-brand:is\(:hover,:focus-visible\) \.carrot-cave-mark__rabbit\{animation:cc-rabbit-hop/);
});

test('every voice reader ships the same logo geometry as the site', () => {
  const css = read('public/voices/reader-system.css');
  assert.match(css, /\.reader-nav \.brand-mark__cave \{ transform: none; \}/);
  assert.match(css, /\.reader-nav \.brand-mark__rabbit-position \{ transform: none; \}/);
  const site = read('components/CarrotCaveMark.tsx');
  const sig = (s) => [...s.matchAll(/<(?:ellipse|circle|path)[^>]*?(?:cx|d)="([^"]+)"/g)].map((m) => m[1]).join('|');
  for (const slug of voiceSlugs) {
    const html = read(`public/voices/${slug}/index.html`);
    const svg = html.match(/<svg class="brand-mark".*?<\/svg>/s)?.[0] ?? '';
    checkMark(slug, svg);
    assert.equal(sig(svg), sig(site), `${slug}: logo drifted from the site logo`);
  }
});
