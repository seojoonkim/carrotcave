import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const logo = read('components/CarrotCaveMark.tsx');
const colors = (s) => new Set((s.match(/#[0-9a-f]{6}\b/gi) || []).map((c) => c.toLowerCase()));

function group(svg, cls) {
  const i = svg.indexOf(`<g class="${cls}"`);
  assert.ok(i >= 0, `${cls} group present`);
  let depth = 0;
  for (const m of svg.slice(i).matchAll(/<g\b|<\/g>/g)) {
    depth += m[0] === '<g' ? 1 : -1;
    if (!depth) return svg.slice(i, i + m.index + m[0].length);
  }
}
const stripProps = (g) => g.replace(/<g class="(?:rabbit-satchel|rabbit-props|prop prop--[a-z]+)"[\s\S]*?(?=<g class="(?:rabbit-head|rabbit-ear|rabbit-eyes|prop prop--)|$)/g, '');

for (const file of ['public/footer-rabbit-carrot-v3.svg', 'public/footer-rabbit-carrot-static.svg']) {
  const svg = read(file);
  test(`${file}: rabbit fur, ears and face use the logo palette`, () => {
    const head = colors(stripProps(group(svg, 'rabbit-head')));
    for (const c of ['#f7f3ea', '#00d9a8', '#1c2a3a']) {
      assert.ok(logo.includes(c), `logo has ${c}`);
      assert.ok(head.has(c), `footer rabbit head uses logo ${c}`);
    }
    for (const warm of ['#fbf6ee', '#fffaf2', '#f7f1e8', '#efe6d8', '#f2b6b0']) assert.ok(!head.has(warm), `old warm cream ${warm} gone from rabbit head`);
    assert.match(svg, /<radialGradient id="rb-coat"[^>]*>\s*<stop offset="0" stop-color="#ffffff"\/><stop offset=".7" stop-color="#f7f3ea"\/><stop offset="1" stop-color="#ebe3d3"\/>/);
  });
  test(`${file}: carrot body, leaves and face use the logo palette`, () => {
    const carrot = colors(group(svg, 'carrot'));
    for (const c of ['#00c08b', '#ff7a45', '#1c2a3a', '#ff9fb2']) assert.ok(carrot.has(c), `footer carrot uses logo ${c}`);
    for (const old of ['#2fd1a3', '#3a1d0c', '#5a2a10', '#ff6f5e', '#c9601f']) assert.ok(!carrot.has(old), `old carrot color ${old} gone`);
    assert.match(svg, /<linearGradient id="footer-carrot-skin"[^>]*>\s*<stop offset="0" stop-color="#f39a52"\/><stop offset="1" stop-color="#f39a52"\/>/);
  });
}

test('the inlined footer module is regenerated from the recolored svg', () => {
  const mod = read('components/footer-scene-svg.ts');
  assert.ok(mod.includes('#f7f3ea') && mod.includes('#ff7a45') && !mod.includes('#fbf6ee'), 'run node scripts/build-footer-scene.mjs');
});
