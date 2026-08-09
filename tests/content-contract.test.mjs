import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const syncSource = readFileSync(new URL('../scripts/auto-sync.mjs', import.meta.url), 'utf8');
const postsSource = readFileSync(new URL('../data/posts.ts', import.meta.url), 'utf8');
const homeSource = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const interviewSource = readFileSync(new URL('../data/interviews.ts', import.meta.url), 'utf8');

test('Telegram sync uses the canonical carrotcave channel', () => {
  assert.match(syncSource, /const CHANNEL = 'carrotcave';/);
  assert.doesNotMatch(syncSource, /const CHANNEL = 'simon_rabbit_hole';/);
});

test('Telegram sync can write locally without committing or pushing', () => {
  assert.match(syncSource, /const NO_GIT = process\.argv\.includes\('--no-git'\);/);
  assert.match(syncSource, /if \(DRY_RUN \|\| NO_GIT\)/);
});

test('post slugs and Telegram message IDs are unique', () => {
  const slugs = [...postsSource.matchAll(/^\s+id:\s*'([^']+)'/gm)].map((match) => match[1]);
  const messageIds = [...postsSource.matchAll(/telegramMsgId:\s*(\d+)/g)].map((match) => Number(match[1]));

  assert.equal(new Set(slugs).size, slugs.length);
  assert.equal(new Set(messageIds).size, messageIds.length);
});

test('all five editorial axes are first-class navigation entries', () => {
  for (const axis of ['탐험', '빌딩', '낙서', '소설', '목소리']) assert.match(homeSource, new RegExp(axis));
});

test('Liao Heng archive preserves the complete reader contract', () => {
  assert.match(interviewSource, /chapters: 7/);
  assert.match(interviewSource, /segments: 8142/);
  assert.match(interviewSource, /\/voices\/liao-heng\/index\.html/);
});
