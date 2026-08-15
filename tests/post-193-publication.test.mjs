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
  assert.equal(post.summary, '자기 개선 AI가 인간의 반복된 승인과 침묵을 자동 동의로 학습할 때, 가역성·대가·이의제기 가능성을 지키는 기준이 왜 필요한지 묻는다.');
  assert.deepEqual(post.mediaUrls, ['/media/msg-195-0.jpg']);
  assert.match(post.content, /개선됐다는 판정은 누가 내리는가\./);
  assert.match(post.content, /시스템은 침묵을 승인으로 배웠다\./);
  assert.match(post.content, /\[어떤 질문은 계속 남겨둘까요\?\]$/);
  assert.doesNotMatch(post.content, /❤|👍/);
  const media = await readFile(new URL('public/media/msg-195-0.jpg', root));
  assert.ok(media.length > 5 * 1024);
});

test('sync metadata overrides are complete before publication', async () => {
  const sync = await readFile(new URL('scripts/auto-sync.mjs', root), 'utf8');
  assert.match(sync, /const ALLOWED_DEPTHS = new Set\(\['entry', 'mid', 'deep'\]\)/);
  assert.match(sync, /Invalid override slug/);
  assert.match(sync, /Invalid override tags/);
  assert.match(sync, /Stale metadata override/);
  const overrides = JSON.parse(await readFile(new URL('data/sync-metadata-overrides.json', root), 'utf8'));
  assert.equal(overrides['195'].contentHash, '3940:2690492428');
});

test('Telegram post 191 preserves its upstream line-end space edits without source whitespace errors', () => {
  const post = posts.find((item) => item.telegramMsgId === 191);
  assert.ok(post);
  assert.match(post.content, /셋업은 찾지 못했다\. \n/);
  assert.match(post.content, /다음 버전으로 넘어가는 단계다\. \n/);
});
