import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { transformSync } from 'next/dist/build/swc/index.js';

const require = createRequire(import.meta.url);
const files = [
  'CaveConstellation.tsx',
  'CaveConstellationGraph.tsx',
  'CaveConstellationEvidence.tsx',
  'CaveConstellationList.tsx',
];
const sources = Object.fromEntries(files.map((file) => [file, readFileSync(new URL(`../components/${file}`, import.meta.url), 'utf8')]));
const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const cache = new Map();

function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const { code } = transformSync(sources[file], {
    filename: file,
    isModule: true,
    jsc: {
      parser: { syntax: 'typescript', tsx: true },
      transform: { react: { runtime: 'classic' } },
      target: 'es2020',
    },
    module: { type: 'commonjs' },
  });
  const module = { exports: {} };
  cache.set(file, module);
  const localRequire = (id) => {
    if (id === 'next/navigation') return { useRouter: () => ({ push() {} }) };
    if (id.startsWith('./CaveConstellation')) return load(`${id.slice(2)}.tsx`);
    return require(id);
  };
  vm.runInNewContext(code, { module, exports: module.exports, require: localRequire, React }, { filename: file });
  return module.exports;
}

const CaveConstellation = load('CaveConstellation.tsx').default;
const nodes = [
  { slug: 'now', title: '현재 글', category: '🐇 탐험', hop: 0 },
  { slug: 'ore', title: '광물 표본', category: '🛠️ 빌딩', hop: 1 },
  { slug: 'echo', title: '메아리 글', category: '✍️ 낙서', hop: 1 },
  { slug: 'deep', title: '깊은 글', category: '🛠️ 빌딩', hop: 2 },
];
const relationships = [
  { from: 'now', to: 'ore', type: 'DEEPENS', sourceEvidence: '현재 글의 근거', targetEvidence: '광물 글의 근거' },
  { from: 'now', to: 'echo', type: 'CHALLENGES', sourceEvidence: '주장 A', targetEvidence: '반론 B' },
  { from: 'ore', to: 'deep', type: 'APPLIES', sourceEvidence: '단서', targetEvidence: '확장' },
  { from: 'echo', to: 'deep', type: 'REFRAMES', sourceEvidence: '울림', targetEvidence: '반향' },
  { from: 'now', to: 'deep', type: 'RESONATES', sourceEvidence: '원문', targetEvidence: '맥락' },
];
const render = () => renderToStaticMarkup(React.createElement(CaveConstellation, { subgraph: { center: nodes[0], nodes, edges: relationships } }));

test('source contract uses deterministic SVG rather than d3/force simulation', () => {
  const all = Object.values(sources).join('\n');
  assert.doesNotMatch(all, /from ['"]d3|import\(['"]d3|forceSimulation/);
  assert.match(sources['CaveConstellationGraph.tsx'], /positionNode/);
  assert.match(sources['CaveConstellationGraph.tsx'], /AXIS_ANGLES/);
  assert.match(sources['CaveConstellationGraph.tsx'], /hop === 2/);
});

test('geometry uses the four real axes, per-axis slots, and separate hop radii', () => {
  const graph = sources['CaveConstellationGraph.tsx'];
  for (const category of ['🐇 탐험', '🛠️ 빌딩', '✍️ 낙서', '📖 소설']) assert.match(graph, new RegExp(category));
  assert.match(graph, /HOP_RADII/);
  assert.match(graph, /axisSlot/);
  assert.match(graph, /axisCount/);
  assert.doesNotMatch(graph, /fanOffset\s*=\s*index/);
  const html = render();
  assert.match(html, /data-axis-slot="0"/);
  assert.match(html, /data-axis-count="1"/);
  assert.match(html, /data-hop-radius="198"/);
});

test('renders visible cave graph with center, broken rings, minerals, and five luminous vein patterns', () => {
  const html = render();
  assert.match(html, /<svg[^>]*class="cave-constellation__svg cave-constellation__motion"/);
  assert.match(html, /role="img"/);
  assert.match(html, /현재 글을 중심으로 한 온톨로지 관계도/);
  assert.match(html, /data-node-id="now"[^>]*data-x="400"[^>]*data-y="240"/);
  assert.match(html, /cave-constellation__limestone-ring/);
  assert.match(html, /cave-constellation__mineral/);
  for (const type of ['DEEPENS', 'CHALLENGES', 'APPLIES', 'REFRAMES', 'RESONATES']) {
    assert.match(html, new RegExp(`cave-constellation__vein--${type}`));
    assert.match(html, new RegExp(`data-relationship-type="${type}"`));
  }
  for (const dash of ['none', '12 5', '3 5', '16 4 3 4', '2 3']) assert.match(html, new RegExp(`stroke-dasharray="${dash}"`));
});

test('renders focusable node controls and a shared-data accessible linear-list toggle', () => {
  const html = render();
  assert.match(html, /<button[^>]*class="cave-constellation__node-control/);
  assert.match(html, /aria-label="광물 표본 선택"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /aria-controls="cave-constellation-linear-list"/);
  assert.match(html, /관계 목록으로 보기/);
  assert.match(html, /id="cave-constellation-linear-list"[^>]*hidden=""/);
  assert.match(html, /현재 글/);
  assert.match(html, /광물 표본/);
});

test('source contract selects first, exposes evidence, and navigates only through explicit action', () => {
  const shell = sources['CaveConstellation.tsx'];
  const graph = sources['CaveConstellationGraph.tsx'];
  assert.match(shell, /setSelectedNodeId/);
  assert.match(shell, /event\.key === 'Escape'/);
  assert.match(graph, /event\.key === 'Enter' \|\| event\.key === ' '/);
  assert.match(shell, /router\.push\(hrefForSlug\(selectedNode\.slug\)\)/);
  assert.doesNotMatch(graph, /router\.push|window\.location/);
  const evidence = sources['CaveConstellationEvidence.tsx'];
  assert.match(evidence, /sourceEvidence/);
  assert.match(evidence, /targetEvidence/);
  assert.match(evidence, /relationship\.label/);
  assert.match(evidence, /관계 유형/);
  assert.match(evidence, /글로 이동/);
});

test('selection contracts identify one edge, its endpoints, and fade only under active selection', () => {
  const shell = sources['CaveConstellation.tsx'];
  const graph = sources['CaveConstellationGraph.tsx'];
  assert.match(shell, /selectedNode\.hop === 2/);
  assert.match(shell, /otherNode\?\.hop === 1/);
  assert.match(graph, /selectedRelationship/);
  assert.match(graph, /is-connected/);
  assert.match(graph, /is-unrelated/);
  assert.match(graph, /is-selected-edge/);
  assert.match(graph, /data-selected-edge/);
  assert.match(graph, /data-connected/);
});

test('CARROT CAVE CSS provides wide bleed, mobile-safe graph, touch targets, fissures and motion', () => {
  assert.match(css, /\.cave-constellation-shell\s*\{[^}]*width:min\(1180px,calc\(100vw - 40px\)\)/s);
  assert.match(css, /\.cave-constellation__graph-view\s*\{[^}]*overflow:hidden/s);
  assert.match(css, /\.cave-constellation__svg\s*\{[^}]*min-height:580px/s);
  assert.match(css, /\.cave-constellation__node-control\s*\{[^}]*min-width:44px[^}]*min-height:44px/s);
  assert.match(css, /\.cave-constellation__evidence::before/);
  assert.match(css, /@keyframes cave-entrance/);
  assert.match(css, /prefers-reduced-motion:reduce[^}]*cave-constellation/s);
  assert.match(css, /\.cave-constellation[^}]*:focus-visible/s);
});

test('Korean labels and reduced-motion CSS hooks are explicit', () => {
  const html = render();
  for (const label of ['심화', '도전', '적용', '재구성', '공명']) assert.match(html, new RegExp(label));
  assert.match(html, /cave-constellation--reduced-motion-ready/);
  assert.match(html, /cave-constellation__motion/);
  assert.match(html, /cave-constellation__vein/);
});
