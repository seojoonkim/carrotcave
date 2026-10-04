import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
function group(svg, cls) {
  const i = svg.indexOf(`<g class="${cls}"`);
  assert.ok(i >= 0, `${cls} present`);
  let d = 0;
  for (const m of svg.slice(i).matchAll(/<g\b|<\/g>/g)) { d += m[0] === '<g' ? 1 : -1; if (!d) return svg.slice(i, i + m.index + m[0].length); }
}
const noProps = (g) => g.replace(/<g class="(?:rabbit-satchel|rabbit-props|prop prop--[a-z]+)"[\s\S]*?<\/g>(?=\s*(?:<g class="|<ellipse|<circle|\{|<\/g>))/g, '');

for (const file of ['public/footer-rabbit-carrot-v3.svg', 'public/footer-rabbit-carrot-static.svg']) {
  const svg = read(file);
  test(`${file}: rabbit is drawn in the logo's chibi style`, () => {
    const head = group(svg, 'rabbit-head');
    const face = head.match(/<circle cx="210" cy="116" r="([\d.]+)" fill="#f6f8fb"\/>/);
    assert.ok(face, 'big round flat head scaled from the logo (r 14.5 x 1.6)');
    assert.equal(Number(face[1]), 23.2);
    const fur = noProps(group(svg, 'rabbit-body')).replace(/<g class="rabbit-satchel">[\s\S]*?<g class="rabbit-front-paw">/, '<g class="rabbit-front-paw">');
    assert.doesNotMatch(fur.replace(/<g class="prop[\s\S]*$/, ''), /stroke="#d5dde7"/, 'no grey outlines on the fur, like the logo');
    assert.doesNotMatch(svg, /M146 150c0-18 16-30 36-30/, 'old crouching side-view body is gone');
    for (const ear of ['rabbit-ear-back', 'rabbit-ear-front']) assert.match(group(svg, ear), /fill="#f4a9b6"/);
  });
  test(`${file}: carrot is the logo's stroked-leaf, flat-bodied carrot`, () => {
    const carrot = group(svg, 'carrot');
    assert.match(group(svg, 'carrot-leaves'), /fill="none" stroke="#79a85b" stroke-width="7.5" stroke-linecap="round"/, 'leaves are three rounded strokes like the logo');
    assert.match(carrot, /<path d="M-21 -3h42c3.6 21 -6.6 48 -21 72 -14.4 -24 -24.6 -51 -21 -72Z"/, 'logo carrot silhouette scaled x3');
    assert.doesNotMatch(carrot, /M-21 3C-21-6 21-6 21 3/, 'old rounded carrot body is gone');
  });
}
test('animated scene keeps every hook the footer motion and tap depend on', () => {
  const svg = read('public/footer-rabbit-carrot-v3.svg');
  for (const cls of ['rabbit-position', 'rabbit-shadow', 'rabbit-body', 'rabbit-tail', 'rabbit-satchel', 'rabbit-front-paw', 'rabbit-props', 'rabbit-head', 'rabbit-ear-back', 'rabbit-ear-front', 'rabbit-eyes-open', 'rabbit-eye-blink', 'rabbit-eyes-happy', 'rabbit-nose', 'rabbit-whiskers', 'rabbit-question-inner', 'carrot-clip', 'carrot-anchor', 'carrot', 'carrot-leaves', 'carrot-sleep-eyes', 'carrot-eyes-open', 'carrot-pupils', 'carrot-eye-right', 'carrot-wink', 'carrot-blush']) {
    assert.match(svg, new RegExp(`class="${cls}[" ]`), `${cls} hook kept`);
  }
  for (const mood of ['explore', 'build', 'doodle', 'voices', 'fiction']) assert.match(svg, new RegExp(`class="prop prop--${mood}"`));
});
