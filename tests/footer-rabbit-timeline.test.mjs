import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const asset = new URL('../public/footer-rabbit-carrot-v2.svg', import.meta.url);
const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');
function frames(svg, name) {
  const body = svg.split(`@keyframes ${name}{`)[1]?.split('\n    }')[0];
  assert.ok(body, `missing ${name}`);
  return [...body.matchAll(/([\d.% ,]+)\{([^}]+)\}/g)].flatMap(([, times, value]) => times.split(',').map(t => ({ t: parseFloat(t), value }))).sort((a,b) => a.t-b.t);
}
test('versioned animated asset is wired without static replacement; header stays quiet', () => {
  assert.ok(existsSync(asset), 'versioned animation must exist');
  assert.match(read('../components/FooterCaveScene.tsx'), /src="\/footer-rabbit-carrot-v2.svg"/);
  const css = read('../app/globals.css');
  assert.doesNotMatch(css, /content:url\('\/footer-rabbit-carrot-static.svg'\)/);
  assert.match(css, /\.cc-brand \.cc-brand-symbol,.*animation:none!important/);
});
test('every backwards journey segment is entirely inside the fully hidden interval', () => {
  assert.ok(existsSync(asset), 'versioned animation must exist');
  const svg = readFileSync(asset, 'utf8');
  const scene = frames(svg, 'scene-loop');
  const hidden = scene.filter(f => /opacity:0(?:;|$)/.test(f.value));
  const start = hidden[0].t, end = hidden.at(-1).t;
  const journey = frames(svg, 'rabbit-journey').map(f => ({ ...f, x: Number(f.value.match(/translate\(([\d.-]+)/)[1]) }));
  let resets = 0;
  for (let i=1; i<journey.length; i++) if (journey[i].x < journey[i-1].x) {
    resets++;
    assert.ok(journey[i-1].t >= start && journey[i].t <= end, `visible reset ${journey[i-1].t}–${journey[i].t}`);
  }
  assert.equal(resets, 1);
  assert.equal(journey[0].x, journey.at(-1).x, 'loop boundary must be continuous');
});
test('reduced motion composes rabbit beside carrot with open eyes and no animation', () => {
  assert.ok(existsSync(asset), 'versioned animation must exist');
  const svg = readFileSync(asset, 'utf8');
  const reduced = svg.split('@media (prefers-reduced-motion: reduce)')[1];
  assert.match(reduced, /animation:none!important/);
  assert.match(reduced, /\.rabbit-position\{transform:translate\(760px,0\)/);
  assert.match(reduced, /\.rabbit-eyelid\{transform:scaleY\(0\)/);
  assert.match(reduced, /\.scene\{opacity:1/);
  const animated = [...svg.matchAll(/\.([\w-]+)\{[^{}]*animation:[\w-]+ 16s/g)].map(m => m[1]);
  for (const name of animated) assert.ok(reduced.includes(`.${name}`), `${name} must stop`);
});
