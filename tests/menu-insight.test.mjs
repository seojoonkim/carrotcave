// 2026-10-10 Simon: "좀 더 메인메뉴와 그 외 메뉴별 컨텐츠 리스트 구성을 더욱 잘 와닿고 통찰력있게 다듬어보자"
// Diagnosis (live 2026-10-10): thread names alone don't say what is being asked; the same post
// headed three threads in a row; keyword matching pulled off-topic posts into "money";
// category pages gave the archive no heading and explained hub picks with a generic line.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createJiti } from 'jiti';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jiti = createJiti(import.meta.url, { alias: { '@': root } });
const T = await jiti.import(path.join(root, 'lib/threads.ts'));
const { posts } = await jiti.import(path.join(root, 'data/posts.ts'));
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('every thread states its question in both languages', () => {
  for (const thread of T.THREADS) {
    assert.ok(thread.question?.ko?.endsWith('?'), `${thread.key} ko question`);
    assert.ok(thread.question?.en?.endsWith('?'), `${thread.key} en question`);
  }
  const editorial = read('components/HomeEditorial.tsx');
  assert.match(editorial, /className="ccx-q"/, 'question line renders under the thread name');
});

test('no post heads two threads on the home list when another post can take its place', () => {
  const summaries = T.summarizeThreads(posts, T.latestDate(posts));
  const previews = T.threadPreviews(summaries, 3);
  const heads = previews.flatMap((p) => p.head.map((post) => post.slug));
  assert.equal(new Set(heads).size, heads.length, `repeated heads: ${heads}`);
  for (const p of previews) assert.equal(p.head.length + p.rest.length, p.summary.posts.length, 'nothing lost, only moved behind "more"');
});

test('off-topic keyword matches are pinned out of the money thread', () => {
  const by = (slug) => T.threadsOf(posts.find((post) => post.slug === slug));
  assert.deepEqual(by('robot-goku-5000'), [], 'humanoid show is not about money pipes');
  assert.deepEqual(by('agentlinter-v040'), [], 'release note is not a thread essay');
  assert.ok(by('ip-tvw').includes('moat'), 'IP worldview piece is about the moat');
  assert.ok(!by('eastpoint-roundtable-has-no-head-seat').includes('money'));
});

test('category pages explain why the start pieces and label the full list', () => {
  const editorial = read('components/HomeEditorial.tsx');
  assert.doesNotMatch(editorial, /뒤에 나온 글들이 가장 많이 다시 꺼내 쓴 글이에요/, 'generic hub line replaced');
  assert.match(editorial, /hubsWhy: \(cat: string/, 'hub explanation names the category');
  const home = read('components/views/HomeView.tsx');
  const axisBranch = home.slice(home.indexOf('postAxis ? ('), home.indexOf(') : ('));
  assert.match(axisBranch, /archiveIn\(/, 'category archive gets its own heading');
});
