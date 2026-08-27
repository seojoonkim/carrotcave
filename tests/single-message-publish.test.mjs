import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { hashContent, publishSingleMessage, regenerateOntology } from '../scripts/publish-single-message.mjs';
import { selectNewMessages } from '../scripts/auto-sync.mjs';

const telegramHtml = `
<div class="tgme_widget_message_wrap">
  <div class="tgme_widget_message" data-post="carrotcave/198">
    <div class="tgme_widget_message_text js-message_text" dir="auto">검토된 새 글<br>이 글은 단일 게시 경로가 과거 게시물과 반응을 건드리지 않는지 검증하기 위한 충분히 긴 본문이다. 빠른 발행은 지정된 메시지만 가져와야 하며 전체 채널을 훑어서는 안 된다.</div>
    <a class="tgme_widget_message_photo_wrap" style="background-image:url('https://cdn.example/new.png')"></a>
    <time datetime="2026-08-16T01:02:03+00:00"></time>
    <span class="tgme_widget_message_views">321</span>
    <div class="tgme_widget_message_reactions"><span><i>❤️</i>7</span></div>
  </div>
</div>`;

const fullText = '검토된 새 글\n이 글은 단일 게시 경로가 과거 게시물과 반응을 건드리지 않는지 검증하기 위한 충분히 긴 본문이다. 빠른 발행은 지정된 메시지만 가져와야 하며 전체 채널을 훑어서는 안 된다.';

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'rabbit-single-'));
  await mkdir(join(root, 'data'), { recursive: true });
  await mkdir(join(root, 'public', 'media'), { recursive: true });
  const historical = `export interface Post { relatedSlugs: string[]; telegramMsgId?: number; }\nexport const posts: Post[] = [\n  { id: 'old', slug: 'old', telegramMsgId: 12, title: "old", category: "탐험", depth: "entry", summary: "old", content: \`historical\`, date: '2020-01-01', reactions: 99, tags: [], relatedSlugs: [] },\n];\n`;
  const state = {
    lastSyncedAt: '2026-08-15T00:00:00.000Z',
    lastMsgId: 12,
    processedMsgIds: [12],
    skippedMsgIds: [11],
    slugToMsgId: { old: 12 },
    contentHashes: { 12: 'unchanged' },
  };
  const override = {
    198: {
      slug: 'reviewed-new-post',
      title: '검토된 새 글',
      category: '탐험',
      depth: 'entry',
      contentHash: hashContent(fullText),
      summary: '지정한 텔레그램 메시지만 즉시 발행하면서 기존 글과 반응 데이터를 보존하는 단일 게시 경로를 검증한다.',
      tags: ['동기화', '발행'],
    },
  };
  await writeFile(join(root, 'data', 'posts.ts'), historical);
  await writeFile(join(root, 'data', 'sync-state.json'), JSON.stringify(state, null, 2));
  await writeFile(join(root, 'data', 'sync-metadata-overrides.json'), JSON.stringify(override, null, 2));
  return { root, historical, state };
}

test('publishes exactly one reviewed message through one direct embed request without historical mutation', async () => {
  const { root, historical, state } = await fixture();
  const requested = [];
  const mediaBytes = Buffer.alloc(6 * 1024, 42);
  const fetchImpl = async (url) => {
    requested.push(String(url));
    if (String(url) === 'https://t.me/carrotcave/198?embed=1&mode=tme') {
      return { ok: true, status: 200, text: async () => telegramHtml };
    }
    if (String(url) === 'https://cdn.example/new.png') {
      return { ok: true, status: 200, arrayBuffer: async () => mediaBytes };
    }
    throw new Error(`unexpected request: ${url}`);
  };

  let ontologyRuns = 0;
  const result = await publishSingleMessage({
    id: 198,
    root,
    fetchImpl,
    now: () => '2026-08-16T02:00:00.000Z',
    regenerate: async () => { ontologyRuns += 1; },
  });

  assert.deepEqual(requested, [
    'https://t.me/carrotcave/198?embed=1&mode=tme',
    'https://cdn.example/new.png',
  ]);
  assert.deepEqual(result, { id: 198, slug: 'reviewed-new-post', media: ['/media/msg-198-0.png'], videos: [] });
  assert.equal(ontologyRuns, 1);

  const posts = await readFile(join(root, 'data', 'posts.ts'), 'utf8');
  assert.equal(posts.split("telegramMsgId: 198").length - 1, 1);
  assert.ok(posts.endsWith(historical.slice(historical.indexOf("  { id: 'old'"))));
  assert.match(posts, /reactions: 7/);
  assert.match(posts, /mediaUrls: \['\/media\/msg-198-0\.png'\]/);

  const nextState = JSON.parse(await readFile(join(root, 'data', 'sync-state.json'), 'utf8'));
  assert.deepEqual(nextState.processedMsgIds, [12, 198]);
  assert.deepEqual(nextState.skippedMsgIds, state.skippedMsgIds);
  assert.deepEqual(nextState.contentHashes, { ...state.contentHashes, 198: hashContent(fullText) });
  assert.deepEqual(nextState.slugToMsgId, { old: 12, 'reviewed-new-post': 198 });
  assert.equal(nextState.lastMsgId, 198);
  assert.equal(nextState.lastSyncedAt, '2026-08-16T02:00:00.000Z');
  assert.deepEqual(await readFile(join(root, 'public', 'media', 'msg-198-0.png')), mediaBytes);
});

test('publishes Telegram timestamps on the Seoul calendar date', async () => {
  const { root } = await fixture();
  await publishSingleMessage({
    id: 198,
    root,
    fetchImpl: async (url) => {
      if (String(url) === 'https://t.me/carrotcave/198?embed=1&mode=tme') {
        return {
          ok: true,
          status: 200,
          text: async () => telegramHtml.replace('2026-08-16T01:02:03+00:00', '2026-08-27T17:23:56+00:00'),
        };
      }
      if (String(url) === 'https://cdn.example/new.png') {
        return { ok: true, status: 200, arrayBuffer: async () => Buffer.alloc(6 * 1024, 42) };
      }
      throw new Error(`unexpected request: ${url}`);
    },
    regenerate: async () => {},
  });

  const posts = await readFile(join(root, 'data', 'posts.ts'), 'utf8');
  assert.match(posts, /date: '2026-08-28'/);
});

test('fails closed when reviewed metadata changes the Telegram title', async () => {
  const { root, historical } = await fixture();
  const overridePath = join(root, 'data', 'sync-metadata-overrides.json');
  const overrides = JSON.parse(await readFile(overridePath, 'utf8'));
  overrides['198'].title = '검토된 글';
  await writeFile(overridePath, JSON.stringify(overrides));

  await assert.rejects(
    publishSingleMessage({
      id: 198,
      root,
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        text: async () => telegramHtml.replace(/\s*<a class="tgme_widget_message_photo_wrap"[^>]*><\/a>/, ''),
      }),
    }),
    /title must match Telegram first line/i,
  );
  assert.equal(await readFile(join(root, 'data', 'posts.ts'), 'utf8'), historical);
});

test('fails closed before writing when reviewed metadata is missing or stale', async () => {
  for (const mode of ['missing', 'stale']) {
    const { root, historical } = await fixture();
    const overridePath = join(root, 'data', 'sync-metadata-overrides.json');
    const overrides = JSON.parse(await readFile(overridePath, 'utf8'));
    if (mode === 'missing') delete overrides['198'];
    else overrides['198'].contentHash = 'stale';
    await writeFile(overridePath, JSON.stringify(overrides));

    await assert.rejects(
      publishSingleMessage({
        id: 198,
        root,
        fetchImpl: async () => ({ ok: true, status: 200, text: async () => telegramHtml }),
      }),
      mode === 'missing' ? /Reviewed metadata override required/ : /Stale metadata override/,
    );
    assert.equal(await readFile(join(root, 'data', 'posts.ts'), 'utf8'), historical);
  }
});

test('rejects duplicate IDs and responses that do not contain exactly the requested message', async () => {
  const { root } = await fixture();
  const statePath = join(root, 'data', 'sync-state.json');
  const state = JSON.parse(await readFile(statePath, 'utf8'));
  state.processedMsgIds.push(198);
  await writeFile(statePath, JSON.stringify(state));
  await assert.rejects(
    publishSingleMessage({ id: 198, root, fetchImpl: async () => { throw new Error('must not fetch duplicate'); } }),
    /already processed/,
  );

  state.processedMsgIds.pop();
  await writeFile(statePath, JSON.stringify(state));
  await assert.rejects(
    publishSingleMessage({ id: 198, root, fetchImpl: async () => ({ ok: true, status: 200, text: async () => telegramHtml.replace('carrotcave/198', 'carrotcave/199') }) }),
    /exactly message #198/,
  );
});

test('package scripts separate immediate publishing from full daily reconciliation', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.scripts['publish:telegram'], 'node scripts/publish-single-message.mjs');
  assert.equal(pkg.scripts['audit:telegram:daily'], 'node scripts/auto-sync.mjs --no-git');
});

test('daily reconciliation recovers processed IDs that never received a website mapping', () => {
  const messages = [{ id: 12 }, { id: 20 }, { id: 25 }, { id: 31 }, { id: 197 }];
  const state = {
    processedMsgIds: [12, 20, 25, 31, 197],
    skippedMsgIds: [],
    slugToMsgId: { 'post-197': 197 },
  };
  const selection = selectNewMessages(messages, state, { auditOnly: false, forceAll: false });
  assert.deepEqual(selection.newMessages.map(({ id }) => id), [12, 20, 25, 31]);
  assert.deepEqual(selection.auditMessages, messages);
});

test('daily audit excludes every newly discovered ID from publishing and media download while retaining historical audit input', () => {
  const messages = [
    { id: 12, reactions: 4 },
    { id: 198, mediaUrls: ['https://cdn.example/new.png'] },
    { id: 199, videoUrls: ['https://cdn.example/new.mp4'] },
  ];
  const state = { processedMsgIds: [12], skippedMsgIds: [] };
  const selection = selectNewMessages(messages, state, { auditOnly: true, forceAll: false });
  assert.deepEqual(selection.newMessages, []);
  assert.deepEqual(selection.auditMessages, messages);
  assert.deepEqual(state, { processedMsgIds: [12], skippedMsgIds: [] });
});

test('ontology regeneration runs deterministic draft, index, and audit only', () => {
  const calls = [];
  regenerateOntology({
    root: '/repo',
    run: (command, args, options) => {
      calls.push({ command, args, cwd: options.cwd });
      return { status: 0 };
    },
  });
  assert.deepEqual(calls, [
    { command: process.execPath, args: ['scripts/draft-ontology.mjs'], cwd: '/repo' },
    { command: process.execPath, args: ['scripts/build-ontology-index.mjs'], cwd: '/repo' },
    { command: process.execPath, args: ['scripts/audit-ontology.mjs'], cwd: '/repo' },
  ]);
  assert.ok(calls.every(({ args }) => !args.includes('scripts/auto-sync.mjs')));
});

test('single-message CLI requires one positive numeric Telegram message ID', async () => {
  const { parseMessageId } = await import('../scripts/publish-single-message.mjs');
  assert.equal(parseMessageId('198'), 198);
  for (const value of [undefined, '0', '-1', '1.5', 'abc', '198x']) {
    assert.throws(() => parseMessageId(value), /positive numeric message ID/);
  }
});
