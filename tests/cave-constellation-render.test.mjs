import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { transformSync } from 'next/dist/build/swc/index.js';

const source = readFileSync(new URL('../components/CaveConstellation.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');

function loadComponent() {
  const { code } = transformSync(source, {
    filename: 'CaveConstellation.tsx',
    isModule: true,
    jsc: {
      parser: { syntax: 'typescript', tsx: true },
      transform: { react: { runtime: 'classic' } },
      target: 'es2020',
    },
    module: { type: 'commonjs' },
  });
  const module = { exports: {} };
  const Link = ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children);
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    React,
    require(id) {
      if (id === 'next/link') return { __esModule: true, default: Link };
      return {};
    },
  });
  return module.exports.default;
}

const CaveConstellation = loadComponent();
const center = { slug: 'now', title: '현재 글', category: '🐇 탐험', hop: 0 };
const nodes = [
  center,
  { slug: 'first', title: '첫 번째 글', category: '🛠️ 빌딩', hop: 1 },
  { slug: 'second', title: '두 번째 글', category: '✍️ 낙서', hop: 1 },
  { slug: 'third', title: '세 번째 글', category: '📖 소설', hop: 1 },
  { slug: 'fourth', title: '보이면 안 되는 글', category: '🐇 탐험', hop: 1 },
  { slug: 'deep', title: '2홉 글', category: '🛠️ 빌딩', hop: 2 },
];
const edge = (to, type, strength, label) => ({
  from: 'now', to, type, strength, label,
  sourceEvidence: `현재 글 근거 ${to}`,
  targetEvidence: `추천 글 근거 ${to}`,
  status: 'approved', signals: [], sourceClaimId: 'c1', source: 'test',
});
const relationships = [
  edge('first', 'DEEPENS', .96, '첫 번째 연결 이유'),
  edge('second', 'REFRAMES', .82, '두 번째 연결 이유'),
  edge('third', 'APPLIES', .64, '세 번째 연결 이유'),
  edge('fourth', 'RESONATES', .41, '네 번째 연결 이유'),
  { ...edge('deep', 'DEEPENS', .99, '2홉 연결 이유'), from: 'first' },
];
const render = () => renderToStaticMarkup(React.createElement(CaveConstellation, {
  subgraph: { center, nodes, edges: relationships },
}));

test('renders exactly three direct recommendations in descending strength order', () => {
  const html = render();
  assert.equal((html.match(/class="cave-constellation__recommendation"/g) ?? []).length, 3);
  assert.ok(html.indexOf('첫 번째 글') < html.indexOf('두 번째 글'));
  assert.ok(html.indexOf('두 번째 글') < html.indexOf('세 번째 글'));
  assert.doesNotMatch(html, /보이면 안 되는 글|2홉 글/);
  assert.match(source, /\.slice\(0, 3\)/);
});

test('shows title, relationship meaning, reason, both quotes and navigation without interaction', () => {
  const html = render();
  for (const value of [
    '첫 번째 글', '더 깊어짐', '첫 번째 연결 이유',
    '현재 글 근거 first', '추천 글 근거 first', '이어서 읽기',
  ]) assert.match(html, new RegExp(value));
  assert.match(html, /href="\/posts\/first"/);
  assert.match(html, /<span>추천<\/span> 01/);
  assert.match(html, /role="group" aria-label="추천 근거"/);
});

test('merges graph and list into one static recommendation view', () => {
  const html = render();
  assert.doesNotMatch(html, /<svg|관계 목록으로 보기|관계도로 보기|광물을 선택|aria-expanded/);
  assert.doesNotMatch(source, /useState|useRouter|matchMedia|CaveConstellationGraph|CaveConstellationList|CaveConstellationEvidence/);
  assert.match(html, /<ol class="cave-constellation__recommendations"/);
});

test('keeps all Korean relationship meanings available', () => {
  for (const label of ['더 깊어짐', '균열을 냄', '현실이 됨', '다른 세계로 옮김', '멀리 공명함']) {
    assert.match(source, new RegExp(label));
  }
});

test('responsive CSS preserves readable evidence and accessible links', () => {
  assert.match(css, /\.cave-constellation-shell\{[^}]*width:min\(1040px,calc\(100vw - 40px\)\)/s);
  assert.match(css, /\.cave-constellation__recommendation article\{[^}]*grid-template-columns:86px minmax\(0,1fr\) auto/s);
  assert.match(css, /\.cave-constellation__navigate\{[^}]*min-height:44px/s);
  assert.match(css, /@media\(max-width:760px\)[^{]*\{[\s\S]*\.cave-constellation__evidence-pair\{grid-template-columns:1fr/s);
  assert.match(css, /overflow-wrap:anywhere/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /\.cave-constellation :focus-visible/);
});
