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
  assert.equal(post.reactions, 3);
  assert.deepEqual(post.mediaUrls, ['/media/msg-193-0.jpg']);
  assert.match(post.content, /에이전트의 여행가방/);
  assert.match(post.content, /승인 규칙과 검증법, 복구 절차를 모델 밖에 두면 모델은 작업장이 되고 가방은 경력이 된다\./);
  assert.match(post.content, /이 가방의 열쇠를 누가 쥐는가\.$/);
  assert.doesNotMatch(post.content, /여기까지는 지금 가능한 기술이다|❤|👍/);
  const media = await readFile(new URL('public/media/msg-193-0.jpg', root));
  assert.ok(media.length > 5 * 1024);
});
