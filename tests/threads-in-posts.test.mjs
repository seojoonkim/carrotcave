import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createJiti } from 'jiti';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const jiti = createJiti(import.meta.url, { alias: { '@': root } });
const T = await jiti.import(path.join(root, 'lib/threads.ts'));

// 2026-10-13 Simon: "메인메뉴에서는 강조 썸네일 및 리스트만 보이게 하고,
// 계속파는 질문은 해당 리스트가 있는 글에서만 자연스럽게 보이게 해볼까?"
test('every main menu shows only the lead card and the list', () => {
  const home = read('components/views/HomeView.tsx');
  assert.doesNotMatch(home, /<ThreadList\b/, 'no question threads on the home page');
  assert.doesNotMatch(home, /<DiscoveryGrid\b/, 'no hub block on category menus');
  assert.doesNotMatch(home, /filters=\{/, 'no thread filter chips above the list');
});

test('posts that belong to a question show that question at the reading end', () => {
  const view = read('components/views/PostView.tsx');
  assert.match(view, /<PostThreads\b/);
  const end = view.slice(view.indexOf('className="cc-reading-end"'));
  assert.ok(end.indexOf('<PostThreads') > end.indexOf('<ReadingDepth'), 'after the reading depth');
  assert.ok(end.indexOf('<PostThreads') < end.indexOf('constellation ?'), 'before the next-read picks');
  const editorial = read('components/HomeEditorial.tsx');
  assert.match(editorial, /export function PostThreads/);
  assert.match(editorial, /aria-current=\{current \? 'page'/, 'the current post is marked in its thread');
  assert.match(editorial, /if \(!keys\.length\) return null/, 'posts outside any thread render nothing');
});

const post = (slug, date, title) => ({ slug, date, title, tags: [], category: '탐험', depth: 'mid', relatedSlugs: [] });

test('the thread preview is a window around the current post', () => {
  const list = Array.from({ length: 7 }, (_, i) => post(`m${i}`, `2026-0${i + 1}-01`, `해자 ${i}`)).reverse(); // newest first
  const around = T.threadAround(list, 'm3', 3);
  assert.deepEqual(around.head.map((p) => p.slug), ['m4', 'm3', 'm2']);
  assert.equal(around.rest.length, 4);
  assert.deepEqual(T.threadAround(list, 'm6', 3).head.map((p) => p.slug), ['m6', 'm5', 'm4'], 'newest post: window clamps at the top');
  assert.deepEqual(T.threadAround(list, 'm0', 3).head.map((p) => p.slug), ['m2', 'm1', 'm0'], 'oldest post: clamps at the bottom');
});

test('real posts: 28-ish thread posts get a block, the rest do not', async () => {
  const { posts } = await jiti.import(path.join(root, 'data/posts.ts'));
  const inThread = posts.filter((p) => T.threadsOf(p).length);
  assert.ok(inThread.length > 0 && inThread.length < posts.length);
});
