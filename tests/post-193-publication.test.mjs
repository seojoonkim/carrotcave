import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { posts } from '../data/posts.ts';

const root = new URL('../', import.meta.url);

test('Telegram post 193 publishes the final travel-bag essay with its image', async () => {
  const post = posts.find((item) => item.telegramMsgId === 193);
  assert.ok(post);
  assert.equal(post.slug, 'post-193');
  assert.equal(post.title, '에이전트 노마드 시대의 짐가방');
  assert.equal(post.category, '탐험');
  assert.ok(Number.isInteger(post.reactions) && post.reactions >= 0);
  assert.deepEqual(post.mediaUrls, ['/media/msg-193-0.jpg']);
  assert.match(post.content, /에이전트의 여행가방/);
  assert.match(post.content, /승인 규칙과 검증법, 복구 절차를 모델 밖에 두면 모델은 작업장이 되고 가방은 경력이 된다\./);
  assert.match(post.content, /이 가방의 열쇠를 누가 쥐는가\.$/);
  assert.doesNotMatch(post.content, /여기까지는 지금 가능한 기술이다|❤|👍/);
  const media = await readFile(new URL('public/media/msg-193-0.jpg', root));
  assert.ok(media.length > 5 * 1024);
});

test('Telegram post 195 publishes the reviewed recursive self-improvement essay with its image', async () => {
  const post = posts.find((item) => item.telegramMsgId === 195);
  assert.ok(post);
  assert.equal(post.slug, 'post-195');
  assert.equal(post.title, '재귀적 자기 개선, 무엇을 지킬 것인가');
  assert.equal(post.category, '탐험');
  assert.equal(post.depth, 'deep');
  assert.equal(post.summary, '자기 개선 AI가 반복된 승인과 침묵을 자동 동의로 학습할 때 가역성·대가·이의제기를 지킬 기준이 필요한 이유를 묻는다.');
  assert.deepEqual(post.mediaUrls, ['/media/msg-195-0.jpg']);
  assert.match(post.content, /개선됐다는 판정은 누가 내리는가\./);
  assert.match(post.content, /시스템은 침묵을 승인으로 배웠다\./);
  assert.match(post.content, /\[어떤 질문은 계속 남겨둘까요\?\]$/);
  assert.doesNotMatch(post.content, /❤|👍/);
  const media = await readFile(new URL('public/media/msg-195-0.jpg', root));
  assert.ok(media.length > 5 * 1024);
});

test('Telegram post 197 publishes the reviewed orbital-computing essay with its approved high-orbit cover', async () => {
  const post = posts.find((item) => item.telegramMsgId === 197);
  assert.ok(post);
  assert.equal(post.slug, 'post-197');
  assert.equal(post.title, '컴퓨팅이 우주로 올라가면 달라질 것들');
  assert.equal(post.category, '탐험');
  assert.equal(post.depth, 'deep');
  assert.equal(post.summary, 'AI 연산의 궤도 이동이 주는 전력 이점과 방열·정비 난제, 연산 우선권에서 생길 새 권력을 함께 다룬다.');
  assert.deepEqual(post.mediaUrls, ['/media/msg-197-0.png']);
  assert.match(post.content, /일론 머스크는 앞으로 몇 년 안에 AI 연산 비용이 우주에서 더 싸질 수 있다고 말한다\./);
  assert.match(post.content, /문제는 열이다\./);
  assert.match(post.content, /주권을 묻는 방식은 달라진다/);
  assert.doesNotMatch(post.content, /❤|👍/);
  const media = await readFile(new URL('public/media/msg-197-0.png', root));
  assert.ok(media.length > 100 * 1024);
});

test('sync metadata overrides are complete before publication', async () => {
  const sync = await readFile(new URL('scripts/auto-sync.mjs', root), 'utf8');
  assert.match(sync, /const ALLOWED_DEPTHS = new Set\(\['entry', 'mid', 'deep'\]\)/);
  assert.match(sync, /Invalid override slug/);
  assert.match(sync, /Invalid override tags/);
  assert.match(sync, /Stale metadata override/);
  const overrides = JSON.parse(await readFile(new URL('data/sync-metadata-overrides.json', root), 'utf8'));
  assert.equal(overrides['195'].contentHash, '3940:2690492428');
  assert.equal(overrides['197'].contentHash, '3521:786617189');
});

test('Telegram post 191 preserves its upstream line-end space edits without source whitespace errors', () => {
  const post = posts.find((item) => item.telegramMsgId === 191);
  assert.ok(post);
  assert.match(post.content, /셋업은 찾지 못했다\. \n/);
  assert.match(post.content, /다음 버전으로 넘어가는 단계다\. \n/);
});
