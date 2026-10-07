import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// 2026-10-08 (Simon): "지하로 내려가는 게 다음으로 읽기 좋은 글 3개를 소개하는 것과 연결되는 게 더 자연스럽지 않아?"
// The reading end must go 지하 N층 → rabbit "더 깊이 갈래?" → three picks, without a separate
// next-post card sitting between them. The next-post card is only a fallback when there are no picks.
const view = readFileSync(new URL('../components/views/PostView.tsx', import.meta.url), 'utf8');
const end = view.slice(view.indexOf('<section className="cc-reading-end"'), view.indexOf('</section>', view.indexOf('<section className="cc-reading-end"')));

test('reading end descends from depth straight into the three picks', () => {
  const depth = end.indexOf('<ReadingDepth');
  const picks = end.indexOf('cave-constellation-shell--descent');
  const ask = end.indexOf('post-hole__ask--picks');
  const nav = end.indexOf('<nav className="post-reader-actions');
  assert.ok(depth >= 0 && picks > depth && ask > picks, 'depth → picks shell → rabbit question');
  assert.ok(nav > picks, 'share/back actions come after the picks, not between depth and picks');
  assert.ok(!end.slice(depth, picks).includes('post-next'), 'no next-post card between depth and picks');
  assert.ok(!end.includes('picksKicker'), 'the rabbit question replaces the old DOWN THE RABBIT HOLE kicker');
});

test('next-post card renders only when there are no picks', () => {
  assert.match(end, /\{constellation \? \([\s\S]*?\) : \(\s*nextPost && \(\s*<Link className="post-next post-next--hole"/);
  assert.equal((end.match(/className="post-next post-next--hole"/g) || []).length, 1);
});
