import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  applyContentEditAudit,
  assertValidPostsTypeScript,
  reconcileContentEdit,
  updateContent,
  updateReactions,
  verifySync,
  writeValidatedPosts,
} from '../scripts/auto-sync.mjs';

const fixture = [
  'export type Post = { id: string; slug: string; telegramMsgId: number; content: string; reactions: number };',
  'export const posts: Post[] = [',
  '  {',
  "    id: '17',",
  "    slug: 'before',",
  '    telegramMsgId: 4,',
  '    content: `before content`,',
  '    reactions: 1,',
  '  },',
  '  {',
  "    id: '18',",
  "    slug: 'target',",
  '    telegramMsgId: 5,',
  '    content: `old opening with an escaped delimiter \\`, that must stay inside',
  'old ending`,',
  '    reactions: 2,',
  '  },',
  '  {',
  "    id: '19',",
  "    slug: 'after',",
  '    telegramMsgId: 6,',
  '    content: `after content`,',
  '    reactions: 3,',
  '  },',
  '];',
  '',
].join('\n');

test('updateContent scans past escaped backtick+comma and changes only the target content', () => {
  const updated = updateContent(fixture, 'target', 'Target title\nreplacement body', 'Target title');

  assert.equal(updated, fixture.replace(
    'old opening with an escaped delimiter \\`, that must stay inside\nold ending',
    'replacement body',
  ));
  assertValidPostsTypeScript(updated);
});

test('updateContent removes a stored display title even when Telegram starts with a URL', () => {
  const source = [
    'export const posts = [',
    '  {',
    "    id: 'different-id',",
    "    slug: 'target',",
    '    title: "Stored article title",',
    '    content: `old body`,',
    '    reactions: 1,',
    '  },',
    '];',
  ].join('\n');
  const updated = updateContent(
    source,
    'target',
    'https://example.com\n\nStored article title\n\nCanonical body',
    'https://example.com',
  );

  assert.match(updated, /content: `Canonical body`/);
  assert.doesNotMatch(updated, /content: `Stored article title/);
});

test('updateContent fails closed when the target boundary is missing', () => {
  assert.throws(
    () => updateContent(fixture, 'missing', 'replacement', 'Missing'),
    /exactly one post boundary.*missing/i,
  );
});

test('updateContent fails closed when the target boundary is duplicated', () => {
  const duplicate = fixture.replace("slug: 'after'", "slug: 'target'");
  assert.throws(
    () => updateContent(duplicate, 'target', 'replacement', 'Target'),
    /exactly one post boundary.*target/i,
  );
});

test('content edit reconciliation accepts canonical no-op and permits hash advancement without a write', () => {
  const canonical = updateContent(fixture, 'target', 'Target title\ncanonical body', 'Target title');

  const result = reconcileContentEdit(
    canonical,
    'target',
    'Target title\ncanonical body',
    'Target title',
  );

  assert.deepEqual(result, {
    src: canonical,
    contentChanged: false,
    reconciled: true,
  });
});

test('content edit reconciliation propagates updater boundary failures', () => {
  assert.throws(
    () => reconcileContentEdit(fixture, 'missing', 'replacement', 'Missing'),
    /exactly one post boundary.*missing/i,
  );
});

test('content edit reconciliation fails closed when updater output does not match canonical Telegram content', () => {
  assert.throws(
    () => reconcileContentEdit(
      fixture,
      'target',
      'Target title\nreplacement body',
      'Target title',
      { updater: (source) => source },
    ),
    /content reconciliation mismatch.*target/i,
  );
});

test('content edit reconciliation rejects collateral updater mutations outside the target', () => {
  assert.throws(
    () => reconcileContentEdit(
      fixture,
      'target',
      'Target title\nreplacement body',
      'Target title',
      {
        updater: (source, slug, newText, title) => updateContent(source, slug, newText, title)
          .replace('before content', 'collateral mutation'),
      },
    ),
    /content reconciliation mismatch.*target/i,
  );
});

test('audit advances hash after a canonical no-op reconciliation', () => {
  const canonical = updateContent(fixture, 'target', 'Target title\ncanonical body', 'Target title');
  const state = { contentHashes: { 192: 'old-hash' } };
  const errors = [];

  const result = applyContentEditAudit(
    canonical,
    'target',
    { id: 192, fullText: 'Target title\ncanonical body', title: 'Target title' },
    'new-hash',
    state,
    errors,
  );

  assert.equal(result.contentChanged, false);
  assert.equal(result.reconciled, true);
  assert.equal(state.contentHashes[192], 'new-hash');
  assert.deepEqual(errors, []);
});

test('audit propagates updater failures and mismatches to errors without advancing hash', () => {
  for (const [slug, updater, expectedError] of [
    ['missing', undefined, /exactly one post boundary.*missing/i],
    ['target', (source) => source, /content reconciliation mismatch.*target/i],
  ]) {
    const state = { contentHashes: { 192: 'old-hash' } };
    const errors = [];

    const result = applyContentEditAudit(
      fixture,
      slug,
      { id: 192, fullText: 'Target title\nreplacement body', title: 'Target title' },
      'new-hash',
      state,
      errors,
      { updater },
    );

    assert.equal(result.reconciled, false);
    assert.equal(result.src, fixture);
    assert.equal(state.contentHashes[192], 'old-hash');
    assert.match(errors[0], /msg #192/i);
    assert.match(errors[0], expectedError);
  }
});

test('validated posts writer rejects invalid audited content before overwriting posts.ts', () => {
  const directory = mkdtempSync(join(tmpdir(), 'rabbitcrypt-sync-'));
  const postsPath = join(directory, 'posts.ts');
  const original = 'export const posts = [];\n';
  writeFileSync(postsPath, original);

  assert.throws(
    () => writeValidatedPosts('export const posts = [{ content: `unterminated }];', postsPath),
    /Invalid posts\.ts TypeScript syntax/,
  );
  assert.equal(readFileSync(postsPath, 'utf8'), original);
});

test('validated posts writer preserves original and exact backup when temporary write fails', () => {
  const directory = mkdtempSync(join(tmpdir(), 'rabbitcrypt-sync-'));
  const postsPath = join(directory, 'posts.ts');
  const original = 'export const posts = [];\n// original bytes\n';
  const replacement = 'export const posts = [{ id: "replacement" }];\n';
  let temporaryPath;
  writeFileSync(postsPath, original);

  assert.throws(
    () => writeValidatedPosts(replacement, postsPath, {
      writeFileSync(path, contents, encoding) {
        temporaryPath = path;
        writeFileSync(path, String(contents).slice(0, 12), encoding);
        throw new Error('injected temporary write failure');
      },
    }),
    /injected temporary write failure/,
  );

  assert.equal(readFileSync(postsPath, 'utf8'), original);
  assert.equal(readFileSync(postsPath + '.bak', 'utf8'), original);
  assert.equal(existsSync(temporaryPath), false);
});

test('validated posts writer preserves original and exact backup when atomic rename fails', () => {
  const directory = mkdtempSync(join(tmpdir(), 'rabbitcrypt-sync-'));
  const postsPath = join(directory, 'posts.ts');
  const original = 'export const posts = [];\n// original bytes\n';
  const replacement = 'export const posts = [{ id: "replacement" }];\n';
  let temporaryPath;
  writeFileSync(postsPath, original);

  assert.throws(
    () => writeValidatedPosts(replacement, postsPath, {
      renameSync(from) {
        temporaryPath = from;
        throw new Error('injected atomic rename failure');
      },
    }),
    /injected atomic rename failure/,
  );

  assert.equal(readFileSync(postsPath, 'utf8'), original);
  assert.equal(readFileSync(postsPath + '.bak', 'utf8'), original);
  assert.equal(existsSync(temporaryPath), false);
});

test('existing-content audit writes use the validated writer contract', () => {
  const source = readFileSync(new URL('../scripts/auto-sync.mjs', import.meta.url), 'utf8');
  assert.match(source, /contentUpdated > 0/);
  assert.match(source, /writeValidatedPosts\(src, POSTS_PATH\)/);
  assert.doesNotMatch(source, /copyFileSync\(POSTS_PATH, POSTS_PATH \+ '\\.bak'\);\s*writeFileSync\(POSTS_PATH, src/u);
});

test('daily Telegram reconciliation publishes missing posts while retaining the no-git release gate', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const command = pkg.scripts['audit:telegram:daily'];

  assert.match(command, /scripts\/auto-sync\.mjs/);
  assert.match(command, /--no-git(?:\s|$)/);
  assert.doesNotMatch(command, /--audit-only(?:\s|$)/);
});

test('daily metadata keeps the full Telegram first line and rejects title-changing overrides', () => {
  const source = readFileSync(new URL('../scripts/auto-sync.mjs', import.meta.url), 'utf8');
  assert.match(source, /원문 첫 줄을 글자 수 제한 없이 그대로/);
  assert.match(source, /Override title must match Telegram first line/);
  assert.match(source, /title:\s*msg\.title,/);
  assert.doesNotMatch(source, /title:\s*msg\.title\.substring/);
  assert.doesNotMatch(source, /원문 첫줄 그대로, 최대 40자/);
});

test('reaction reconciliation locates a post by slug when id differs', () => {
  const updated = updateReactions(fixture, 5, 42, { target: 5 });

  assert.equal(updated, fixture.replace('    reactions: 2,', '    reactions: 42,'));
});

test('new-post verification locates generated content by slug when id differs', () => {
  const longContent = '검증 가능한 새 글 본문입니다. '.repeat(8);
  const generated = fixture.replace(
    'old opening with an escaped delimiter \\`, that must stay inside\nold ending',
    longContent,
  );

  assert.deepEqual(verifySync(generated, ['target']), []);
});
