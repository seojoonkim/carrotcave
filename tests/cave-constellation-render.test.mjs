import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { transformSync } from 'next/dist/build/swc/index.js';

const source = readFileSync(new URL('../components/CaveConstellation.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const pageSource = readFileSync(new URL('../app/posts/[slug]/page.tsx', import.meta.url), 'utf8');

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
  const Image = ({ src, alt, fill, priority, ...props }) => React.createElement('img', { src, alt, ...props });
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    React,
    require(id) {
      if (id === 'next/link') return { __esModule: true, default: Link };
      if (id === 'next/image') return { __esModule: true, default: Image };
      return {};
    },
  });
  return module.exports.default;
}

const CaveConstellation = loadComponent();
const center = { slug: 'now', title: '현재 글', category: '탐험', summary: '현재 글의 검수된 요약입니다.', hop: 0 };
const nodes = [
  center,
  { slug: 'first', title: '첫 번째 글', category: '빌딩', summary: '첫 번째 글의 핵심 내용입니다.', imageUrl: '/media/first.jpg', hop: 1 },
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

test('shows category, title, and summary together inside each thumbnail', () => {
  const html = render();
  for (const value of [
    '첫 번째 글', '같은 주제를 더 깊게',
    '첫 번째 글의 핵심 내용입니다.',
    '이 글 읽기',
  ]) assert.match(html, new RegExp(value));
  assert.match(html, /href="\/posts\/first"/);
  assert.match(html, /<span>1순위<\/span>/);
  assert.equal((html.match(/첫 번째 글의 핵심 내용입니다\./g) ?? []).length, 1);
  assert.match(html, /class="cave-constellation__thumbnail-copy"><span class="cave-constellation__thumbnail-category">빌딩<\/span><h3>첫 번째 글<\/h3><p>첫 번째 글의 핵심 내용입니다\.<\/p><\/div>/);
  assert.equal((html.match(/<h3>첫 번째 글<\/h3>/g) ?? []).length, 1);
  assert.equal((html.match(/<li class="cave-constellation__recommendation"/g) ?? []).length, 3);
  assert.match(html, /class="cave-constellation__thumbnail" data-has-image="true"/);
  assert.match(html, /src="\/media\/first\.jpg" alt=""/);
  assert.match(html, /class="cave-constellation__thumbnail" data-has-image="false"/);
  assert.doesNotMatch(html, /이 글의 내용|이어지는 지점|현재 글 근거|추천 글 근거|<b>|connection-points/);
});

test('falls back to the title when a target summary is unavailable', () => {
  const targetWithoutSummary = { ...nodes[1], summary: undefined };
  const html = renderToStaticMarkup(React.createElement(CaveConstellation, {
    subgraph: { center, nodes: [center, targetWithoutSummary], edges: [edge('first', 'DEEPENS', .96, '연결 이유')] },
  }));
  assert.match(html, /<h3>첫 번째 글<\/h3><p>첫 번째 글<\/p>/);
  assert.doesNotMatch(html, /현재 글 근거|추천 글 근거/);
});

test('merges graph and list into one static recommendation view', () => {
  const html = render();
  assert.doesNotMatch(html, /<svg|관계 목록으로 보기|관계도로 보기|광물을 선택|aria-expanded/);
  assert.doesNotMatch(source, /useState|useRouter|matchMedia|CaveConstellationGraph|CaveConstellationList|CaveConstellationEvidence/);
  assert.match(html, /<ol class="cave-constellation__recommendations"/);
});

test('keeps every relationship label without rendering relationship evidence', () => {
  for (const label of ['같은 주제를 더 깊게', '다른 관점에서', '생각을 실제로', '새로운 시선으로', '핵심 생각이 비슷한']) {
    assert.match(source, new RegExp(label));
  }
  assert.doesNotMatch(source, /이어지는 지점|sourceEvidence|targetEvidence|cleanEvidence|connectionPoints|connectionSentence|bridge:/);
});

test('responsive CSS preserves a readable thumbnail overlay and accessible links', () => {
  assert.match(css, /\.cave-constellation-shell\{[^}]*width:min\(1040px,calc\(100vw - 40px\)\)/s);
  assert.match(css, /\.cave-constellation__recommendation article\{[^}]*grid-template-columns:86px minmax\(0,1fr\) auto/s);
  assert.match(css, /\.cave-constellation__recommendation-header\{grid-row:1;/);
  assert.match(css, /\.cave-constellation__navigate\{grid-column:3;grid-row:1;[^}]*min-height:48px/s);
  assert.doesNotMatch(css, /grid-row:1\/3/);
  assert.match(css, /\.cave-constellation__thumbnail\{[^}]*position:relative[^}]*min-height:260px/s);
  assert.match(css, /\.cave-constellation__thumbnail::after\{[^}]*rgba\(10,12,14,\.97\) 0 155px/s);
  assert.match(pageSource, /media\\\/\[\^\?\#\]\+\\\.\(\?:avif\|gif\|jpe\?g\|png\|webp\)/);
  assert.match(css, /\.cave-constellation__thumbnail-copy\{[^}]*position:absolute/s);
  assert.match(css, /\.cave-constellation__thumbnail h3\{[^}]*-webkit-line-clamp:2/s);
  assert.match(css, /\.cave-constellation__thumbnail p\{[^}]*-webkit-line-clamp:3/s);
  assert.match(css, /\.cave-constellation__thumbnail\{min-height:0;aspect-ratio:4\/3\}/);
  assert.match(css, /overflow-wrap:anywhere/);
  assert.doesNotMatch(css, /cave-constellation__why|cave-constellation__connection-points/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /\.cave-constellation :focus-visible/);
});
