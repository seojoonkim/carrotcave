import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const globalCss = read('app/globals.css');
const voiceCss = read('public/voices/reader-system.css');

const productionTextFiles = [
  'app/globals.css',
  'components/CarrotCaveMark.tsx',
  'public/footer-rabbit-carrot.svg',
  'public/footer-rabbit-carrot-static.svg',
  'public/voices/reader-system.css',
  'public/voices/yang-zhilin/index.html',
  'public/voices/liang-wenfeng/index.html',
  'public/voices/sam-altman-startup-school-2026/index.html',
  'public/voices/liao-heng/index.html',
];

test('shared decorative accent uses carrot orange while leaves retain their own green', () => {
  assert.match(globalCss, /--carrot-orange:#f28c28;--carrot-orange-ink:#9c4a06;--carrot-leaf:#79a85b/);
  assert.doesNotMatch(globalCss, /--green:/);
  assert.match(globalCss, /wall-card--generated \.wall-card__date-part:last-child\{color:var\(--carrot-orange\)!important\}/);
  assert.match(globalCss, /wall-card\[data-axis="빌딩"\] \.wall-card__axis\{color:var\(--carrot-orange\)\}/);
});

test('active axis marker has a filled emoji-like orange body and three-leaf silhouette', () => {
  assert.match(globalCss, /\.axis-rail__carrot\{[^}]*width:6px;height:11px[^}]*var\(--carrot-orange\)[^}]*rotate\(24deg\)/);
  assert.match(globalCss, /\.axis-rail__carrot::before\{[^}]*background:var\(--carrot-leaf\)[^}]*clip-path:polygon\(42% 100%,0 26%,28% 15%,48% 66%,52% 0,76% 8%,61% 65%,90% 25%,100% 48%\)/);
  assert.match(globalCss, /\.axis-rail a\.active b\{color:var\(--carrot-orange-ink\)\}/);
});

test('ordinary and voice reading progress carrots share the orange and leaf palette', () => {
  for (const css of [globalCss, voiceCss]) {
    assert.match(css, /--carrot-orange:\s*#f28c28/);
    assert.match(css, /--carrot-leaf:\s*#79a85b/);
    assert.match(css, /progress[^}]*carrot[\s\S]*?var\(--carrot-leaf\)/);
    assert.match(css, /progress[^}]*carrot::after[\s\S]*?var\(--carrot-orange\)/);
  }
});

test('all shipped carrot assets use the unified palette and no legacy palette', () => {
  const legacy = /#(?:ed7d31|71b77a|f6b45f|e88b45|87b985|9ebc75|f09a3e|d86f27)\b/i;
  for (const relativePath of productionTextFiles) {
    const source = read(relativePath);
    assert.doesNotMatch(source, legacy, `${relativePath} still contains a legacy carrot color`);
  }
  for (const relativePath of productionTextFiles.filter((file) => /(?:CarrotCaveMark|footer-rabbit-carrot|voices\/.+\/index)/.test(file))) {
    const source = read(relativePath).toLowerCase();
    assert.match(source, /#f28c28/, `${relativePath} is missing carrot orange`);
    assert.match(source, /#79a85b/, `${relativePath} is missing leaf green`);
  }
});
