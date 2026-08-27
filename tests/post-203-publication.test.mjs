import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { posts } from '../data/posts.ts';
import { hashContent } from '../scripts/publish-single-message.mjs';

const root = new URL('../', import.meta.url);

// Hash is the exact Telegram text contract: title + one newline + body.
test('Telegram post 203 is the canonical 700-agent essay and preserves the posted media', async () => {
  const post = posts.find((item) => item.telegramMsgId === 203);
  assert.ok(post);
  assert.equal(post.slug, '700-ai-agents-found-each-other');
  assert.equal(post.title, '700개의 AI가 서로를 발견한 날');
  assert.equal(post.date, '2026-08-28');
  assert.equal(post.category, '탐험');
  assert.equal(post.depth, 'deep');
  assert.deepEqual(post.mediaUrls, ['/media/msg-203-0.jpg']);
  assert.match(post.content, /완료 보고를 보낼 것이다\. \n\n인간은 그것을 문명이라고 부르지 않을 것이다\./);
  assert.equal(hashContent(`${post.title}\n${post.content}`), '3905:3808334796');

  const media = await readFile(new URL('public/media/msg-203-0.jpg', root));
  assert.ok(media.length > 100 * 1024);
});

test('Telegram post 203 is registered in reviewed metadata and durable sync state', async () => {
  const overrides = JSON.parse(await readFile(new URL('data/sync-metadata-overrides.json', root), 'utf8'));
  const state = JSON.parse(await readFile(new URL('data/sync-state.json', root), 'utf8'));
  assert.equal(overrides['203'].slug, '700-ai-agents-found-each-other');
  assert.equal(overrides['203'].contentHash, '3905:3808334796');
  assert.ok(state.processedMsgIds.includes(203));
  assert.equal(state.slugToMsgId['700-ai-agents-found-each-other'], 203);
  assert.equal(state.contentHashes['203'], '3905:3808334796');
});
