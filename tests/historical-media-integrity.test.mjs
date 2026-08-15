import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { posts } from '../data/posts.ts';

const root = new URL('../', import.meta.url);
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');

test('historical MemKraft post keeps its original v3.0 cover', async () => {
  const post = posts.find((item) => item.slug === 'post-189');
  assert.ok(post);
  assert.equal(post.telegramMsgId, 189);
  assert.deepEqual(post.mediaUrls, ['/media/msg-189-0.jpg']);

  const historicalCover = await readFile(new URL('public/media/msg-189-0.jpg', root));
  assert.equal(
    sha256(historicalCover),
    '5269aa8b741c5e1125b9608a959a38580dbffdc97e5cb547524469958133f7f9',
    'post-189 must retain the v3.0 cover published with the historical article',
  );
});

test('current v3.5 cover is a separate asset and does not rewrite post-189', async () => {
  const post = posts.find((item) => item.slug === 'post-189');
  assert.ok(post);
  assert.ok(!post.mediaUrls?.includes('/media/memkraft-v3.5-cover.jpg'));

  const currentCover = await readFile(new URL('public/media/memkraft-v3.5-cover.jpg', root));
  assert.ok(currentCover.length > 5 * 1024);
});

test('Telegram sync fails closed instead of overwriting published media bytes', async () => {
  const sync = await readFile(new URL('scripts/auto-sync.mjs', root), 'utf8');
  assert.match(sync, /const tempPath = `\$\{destPath\}\.download-/);
  assert.match(sync, /if \(!existing\.equals\(downloaded\)\)/);
  assert.match(sync, /Historical media overwrite blocked/);
  assert.match(sync, /if \(err\.code === 'HISTORICAL_MEDIA_CONFLICT'\) throw err/);
});
