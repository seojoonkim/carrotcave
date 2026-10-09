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
