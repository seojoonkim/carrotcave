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
const center = { slug: 'now', title: '현재 글', category: '탐험', summary: '현재 글의 검수된 요약입니다.', hop: 0 };
const nodes = [
  center,
  { slug: 'first', title: '첫 번째 글', category: '빌딩', summary: '첫 번째 글의 핵심 내용입니다.', hop: 1 },
  { slug: 'second', title: '두 번째 글', category: '낙서', summary: '두 번째 글의 핵심 내용입니다.', hop: 1 },
  { slug: 'third', title: '세 번째 글', category: '소설', summary: '세 번째 글의 핵심 내용입니다.', hop: 1 },
  { slug: 'fourth', title: '보이면 안 되는 글', category: '탐험', hop: 1 },
  { slug: 'deep', title: '2홉 글', category: '빌딩', hop: 2 },
];
const edge = (to, type, strength, label) => ({
  from: 'now', to, type, strength, label,
  sourceEvidence: `현재 글 근거 ${to}`,
  targetEvidence: `추천 글 근거 ${to}`,
  status: 'approved', signals: [], signalDetails: { titleOverlap: ['기억', '에이전트'] }, sourceClaimId: 'c1', source: 'test',
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

test('shows each article summary and its two distinct connection points', () => {
  const html = render();
  for (const value of [
    '첫 번째 글', '같은 주제를 더 깊게',
    '이 글의 내용', '첫 번째 글의 핵심 내용입니다.',
    '이어지는 지점', '지금 글', '현재 글 근거 first', '추천 글', '추천 글 근거 first',
    '이 글 읽기',
  ]) assert.match(html, new RegExp(value));
  assert.match(html, /href="\/posts\/first"/);
  assert.match(html, /<span>1순위<\/span>/);
  assert.equal((html.match(/<li>/g) ?? []).length, 6);
  assert.doesNotMatch(html, /에서 던진 질문을|더 깊이 파고듭니다|titleOverlap|두 글은 ‘기억’, ‘에이전트’라는 주제를|추천 글이 이 주제를|추천하는 이유|추천 이유|<details|추천 근거 보기|blockquote/);
});

test('replaces unsafe evidence with each article summary', () => {
  const malformed = {
    ...edge('first', 'DEEPENS', .96, '첫 번째 연결 이유'),
    sourceEvidence: 'Website: https&#58;//example.com 오염된 원문 근거',
    targetEvidence: '**링크** https://example.org 오염된 추천 근거',
    signalDetails: { titleOverlap: ['것이다', '되는', '순간', '않을'] },
  };
  const html = renderToStaticMarkup(React.createElement(CaveConstellation, {
    subgraph: { center, nodes, edges: [malformed] },
  }));
  assert.match(html, /현재 글의 검수된 요약입니다/);
  assert.match(html, /<b>추천 글<\/b>첫 번째 글/);
  assert.doesNotMatch(html, /example\.com|example\.org|오염된|‘것이다’|‘되는’|‘순간’|‘않을’|라는 주제를 함께 다룹니다/);
  assert.match(html, /cave-constellation__connection-points/);
  assert.doesNotMatch(source, /titleOverlap/);
});

test('falls back safely for empty, missing, and overlong evidence', () => {
  for (const sourceEvidence of ['', '가'.repeat(241), undefined]) {
    const html = renderToStaticMarkup(React.createElement(CaveConstellation, {
      subgraph: { center, nodes, edges: [{ ...edge('first', 'DEEPENS', .9, '연결 이유'), sourceEvidence }] },
    }));
    assert.match(html, /<b>지금 글<\/b>현재 글의 검수된 요약입니다/);
    assert.doesNotMatch(html, /가{241}/);
  }
});

test('merges graph and list into one static recommendation view', () => {
  const html = render();
  assert.doesNotMatch(html, /<svg|관계 목록으로 보기|관계도로 보기|광물을 선택|aria-expanded/);
  assert.doesNotMatch(source, /useState|useRouter|matchMedia|CaveConstellationGraph|CaveConstellationList|CaveConstellationEvidence/);
  assert.match(html, /<ol class="cave-constellation__recommendations"/);
});

test('keeps distinct evidence points for every relationship type', () => {
  for (const type of ['DEEPENS', 'CHALLENGES', 'APPLIES', 'REFRAMES', 'RESONATES']) {
    const html = renderToStaticMarkup(React.createElement(CaveConstellation, {
      subgraph: { center, nodes, edges: [edge('first', type, .9, '연결 이유')] },
    }));
    assert.match(html, /현재 글 근거 first/);
    assert.match(html, /추천 글 근거 first/);
  }
  for (const label of ['같은 주제를 더 깊게', '다른 관점에서', '생각을 실제로', '새로운 시선으로', '핵심 생각이 비슷한']) {
    assert.match(source, new RegExp(label));
  }
});

test('responsive CSS preserves readable evidence and accessible links', () => {
  assert.match(css, /\.cave-constellation-shell\{[^}]*width:min\(1040px,calc\(100vw - 40px\)\)/s);
  assert.match(css, /\.cave-constellation__recommendation article\{[^}]*grid-template-columns:86px minmax\(0,1fr\) auto/s);
  assert.match(css, /\.cave-constellation__navigate\{[^}]*min-height:48px/s);
  assert.match(css, /\.cave-constellation__why ul\{[^}]*display:grid/s);
  assert.match(css, /\.cave-constellation__why li\{[^}]*grid-template-columns:92px minmax\(0,1fr\)/s);
  assert.match(css, /overflow-wrap:anywhere/);
  assert.match(css, /\.cave-constellation__connection-points>span\{grid-template-columns:1fr;gap:2px\}/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /\.cave-constellation :focus-visible/);
});
