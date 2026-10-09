import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

// 2026-10-09 Simon: "메인 조금만 단순하게 직관적으로 이해되게 정돈해보자 지금은 조금 정신없어"
// Home = 대표 글 → 계속 파는 질문(한 블록) → 전체 기록(검색 + 줄기 필터 한 줄) → 목록.
test('home keeps a single editorial block between the lead post and the archive', () => {
  const home = read('components/views/HomeView.tsx');
  assert.doesNotMatch(home, /LeadThread|leadAside=/, 'no extra block glued under the lead post');
  const allBranch = home.slice(home.indexOf(') : ('));
  assert.match(allBranch, /<ThreadList /);
  assert.doesNotMatch(allBranch, /<DiscoveryGrid /, 'discovery grid is category-only');
});

test('thread rows carry no status column, sparkline, or arrow decorations', () => {
  const editorial = read('components/HomeEditorial.tsx');
  assert.doesNotMatch(editorial, /ccx-state|ccx-spark|Spark\(|ccx-dots|ccx-tags/);
  const css = read('app/globals.css');
  assert.doesNotMatch(css, /\.ccx-(state|spark|dots|leadthread|rowchip|tags|small)\b/);
});

test('archive offers one filter row (threads) and no per-row thread chips', () => {
  const list = read('components/ArchiveList.tsx');
  assert.doesNotMatch(list, /depthFilter|SortKey|ccx-rowchip/);
  assert.equal((list.match(/className="ccx-frow"/g) ?? []).length, 1);
});

// 2026-10-09 Simon: "계속파는 질문은 질문마다 여러개를 보여야지. 3개 + 더보기로 늘려서 볼 수 있게 할까?"
test('each thread shows its 3 newest posts and a native "more" disclosure for the rest', () => {
  const editorial = read('components/HomeEditorial.tsx');
  const block = editorial.slice(editorial.indexOf('export function ThreadList'), editorial.indexOf('export function', editorial.indexOf('export function ThreadList') + 10));
  assert.match(editorial, /const THREAD_PREVIEW = 3;/, 'three posts up front');
  assert.match(block, /slice\(0, THREAD_PREVIEW\)/);
  assert.match(block, /<details className="ccx-more"/, 'rest opens with <details>, no client JS');
  assert.match(block, /<summary/);
  assert.match(block, /C\.more\(/, 'more label shows the remaining count');
  assert.doesNotMatch(block, /className="ccx-last"/, 'no single latest-title line anymore');
  const css = read('app/globals.css');
  assert.match(css, /\.ccx-tposts\{/);
  assert.match(css, /\.ccx-more\b/);
});

// 2026-10-09 Simon: "다른 글 7편이 어떻게 이어지는지 설명이 불친절해 / 그리고 모든 글 리스트에는 썸네일 넣자"
test('hub picks explain why and name the pieces that build on them', () => {
  const editorial = read('components/HomeEditorial.tsx');
  assert.doesNotMatch(editorial, /다른 글 \$\{n\}편이 이어짐/, 'bare count line is gone');
  assert.match(editorial, /hubsWhy:/);
  assert.match(editorial, /inboundLatest:/, 'shows the latest piece by name');
  assert.match(editorial, /from\.map\(/, 'lists every piece that builds on the hub');
  assert.match(read('lib/threads.ts'), /export function inboundPosts/);
});

test('every post list on home shows a thumbnail with a sketch fallback', () => {
  const editorial = read('components/HomeEditorial.tsx');
  assert.match(editorial, /function Thumb\(/);
  assert.match(editorial, /EDITORIAL_CARD_FALLBACK_IMAGE/);
  assert.match(editorial, /<Thumb post=\{post\} className="ccx-tpost__img"/, 'thread rows');
  assert.match(editorial, /<Thumb post=\{post\} className="ccx-hub__img"/, 'hub cards');
  assert.match(read('components/ArchiveList.tsx'), /ARCHIVE_FALLBACK_IMAGE/, 'archive rows already fall back');
});

test('hub numbering rules never leak into the nested follow-up list', () => {
  const css = read('app/globals.css');
  assert.doesNotMatch(css, /\.ccx-hubs a(?:\{|::before|:hover)/, 'scope numbered rows to .ccx-hubs > li > a');
});

// 2026-10-10 Simon: "계속 파는 질문이 제목 밑에 달려있는 것처럼 위계를 표현할 수 있어? ... 꼬리를 물고 좀 더 gui적으로"
test('thread posts hang off a tail under the question title', () => {
  const css = read('app/globals.css');
  const tsx = read('components/HomeEditorial.tsx');
  assert.match(css, /\.ccx-thread\{--rx:[^}]*--ind:[^}]*--rail:/, 'tail geometry lives in shared tokens');
  assert.match(css, /\.ccx-thread \.ccx-tposts > li::after\{[^}]*border-bottom-left-radius/, 'each post has a rounded elbow');
  assert.match(css, /\.ccx-thread > \.ccx-more summary::before\{/, 'the more/less control is the last node on the tail');
  assert.match(tsx, /ccx-tposts--cont/, 'lists that continue into the more node keep the rail going');
});
