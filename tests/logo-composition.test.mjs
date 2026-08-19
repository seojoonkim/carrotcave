import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');
const voiceSlugs = ['liao-heng', 'liang-wenfeng', 'yang-zhilin', 'sam-altman-startup-school-2026'];

function numericMatch(source, pattern, label) {
  const match = source.match(pattern);
  assert.ok(match, `${label}: geometry token missing`);
  return Number(match[1]);
}

function assertGroundedGeometry({ label, mark, css, caveClass, rabbitPositionClass }) {
  const caveScale = numericMatch(css, new RegExp(`\\.${caveClass}[^}]*transform:\\s*scale\\(([^)]+)\\)`), `${label} cave scale`);
  const rabbitOffset = numericMatch(css, new RegExp(`\\.${rabbitPositionClass}[^}]*translateY\\(([-.\\d]+)px\\)`), `${label} rabbit offset`);
  const floorY = numericMatch(mark, /<path d="M9 ([\d.]+)h78"/, `${label} cave floor`);
  const feet = [...mark.matchAll(/<ellipse cx="(?:34|50)" cy="([\d.]+)" rx="6" ry="([\d.]+)"/g)];
  assert.equal(feet.length, 2, `${label}: both feet geometry must exist`);
  const footBottomY = Math.max(...feet.map(([, cy, ry]) => Number(cy) + Number(ry)));
  const transformedFloorY = 48 + ((floorY - 48) * caveScale);
  assert.ok(Math.abs(transformedFloorY - (footBottomY + rabbitOffset)) <= 1, `${label}: rabbit feet must meet the enlarged cave floor`);
}

test('React logo enlarges the cave, grounds the rabbit, and keeps both eyes legible', () => {
  const mark = read('components/CarrotCaveMark.tsx');
  const css = read('app/globals.css');
  assertGroundedGeometry({
    label: 'React logo',
    mark,
    css,
    caveClass: 'carrot-cave-mark__cave',
    rabbitPositionClass: 'carrot-cave-mark__rabbit-position',
  });
  assert.match(css, /\.carrot-cave-mark__cave\{[^}]*transform:scale\(1\.13\)/);
  assert.match(css, /\.carrot-cave-mark__rabbit-position\{transform:translateY\(17px\)\}/);
  assert.match(mark, /<g className="carrot-cave-mark__rabbit-position">\s*<g className="carrot-cave-mark__rabbit">/);
  assert.equal((mark.match(/<circle cx="(?:39|47)" cy="42" r="1\.8" fill="#252832" \/>/g) ?? []).length, 2);
  assert.match(css, /\.carrot-cave-mark__rabbit\{[^}]*animation:none\}/);
  assert.match(css, /@keyframes cc-rabbit-hop\{/);
  assert.match(css, /\.cc-brand:is\(:hover,:focus-visible\) \.carrot-cave-mark__rabbit\{animation:cc-rabbit-hop/);
  assert.match(css, /\.cc-brand:is\(:hover,:focus-visible\) \.carrot-cave-mark__carrot\{animation:cc-carrot-tap/);
  assert.doesNotMatch(css, /\.cc-brand:is\(:hover,:focus-visible\) \.carrot-cave-mark__cave\{/);
});

test('all static reader logos share the grounded cave and legible two-eye geometry', () => {
  const css = read('public/voices/reader-system.css');
  const representativeMark = read(`public/voices/${voiceSlugs[0]}/index.html`);
  assertGroundedGeometry({
    label: 'Static reader logo',
    mark: representativeMark,
    css,
    caveClass: 'brand-mark__cave',
    rabbitPositionClass: 'brand-mark__rabbit-position',
  });
  assert.match(css, /\.reader-nav \.brand-mark__cave \{[^}]*transform: scale\(1\.13\)/);
  assert.match(css, /\.reader-nav \.brand-mark__rabbit-position \{ transform: translateY\(17px\); \}/);
  for (const slug of voiceSlugs) {
    const html = read(`public/voices/${slug}/index.html`);
    assert.match(html, /class="brand-mark__rabbit-position"><g class="brand-mark__rabbit">/);
    assert.equal((html.match(/<circle cx="(?:39|47)" cy="42" r="1\.8" fill="#252832"\/>/g) ?? []).length, 2, slug);
  }
});
