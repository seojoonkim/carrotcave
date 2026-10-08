import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createJiti } from 'jiti';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jiti = createJiti(import.meta.url, { alias: { '@': root } });
const T = await jiti.import(path.join(root, 'lib/threads.ts'));
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const post = (slug, date, title, tags = [], extra = {}) => ({ slug, date, title, tags, category: '탐험', depth: 'mid', ...extra });

test('home is continuous: no issue numbers or monthly editor copy anywhere in the home view', () => {
  const sources = read('components/views/HomeView.tsx') + read('components/HomeEditorial.tsx') + read('lib/threads.ts');
  assert.doesNotMatch(sources, /월호|이번 호|편집자의 말|Issue No|monthly issue/i);
});

test('a new post joins its thread automatically and re-orders threads by latest activity', () => {
  const base = [
    post('moat-1', '2026-06-01', '소프트웨어 해자는 어디로'),
    post('money-1', '2026-07-01', '달러의 두 얼굴'),
  ];
  const before = T.summarizeThreads(base, '2026-07-02');
  assert.equal(before[0].key, T.threadsOf(base[1])[0]);
  const added = [post('moat-2', '2026-07-10', '바이브 코딩이 지운 해자'), ...base];
  const after = T.summarizeThreads(added, '2026-07-10');
  assert.equal(after[0].key, T.threadsOf(added[0])[0], 'thread with the newest piece rises to the top');
  assert.equal(after[0].posts.length, 2);
  const lead = T.leadThreadOf(added[0], added);
  assert.equal(lead.position, 2);
  assert.equal(lead.total, 2);
  assert.equal(lead.gapDays, 39);
  assert.equal(lead.previous.slug, 'moat-1');
  assert.deepEqual(lead.dots, [false, true]);
});

test('thread state is computed from dates, not set by hand', () => {
  assert.equal(T.threadState('2026-10-09', '2026-10-09'), 'on');
  assert.equal(T.threadState('2026-09-01', '2026-10-09'), 'mid');
  assert.equal(T.threadState('2026-08-01', '2026-10-09'), 'rest');
  assert.equal(T.threadState('2026-06-01', '2026-10-09'), 'off');
});

test('explicit overrides beat keyword rules', () => {
  T.THREAD_OVERRIDES['odd-one'] = ['life'];
  try {
    assert.deepEqual(T.threadsOf(post('odd-one', '2026-10-01', '달러 이야기')), ['life']);
  } finally {
    delete T.THREAD_OVERRIDES['odd-one'];
  }
});

test('every thread has Korean and English names', () => {
  for (const thread of T.THREADS) {
    assert.ok(thread.name.ko && thread.name.en, thread.key);
    assert.doesNotMatch(thread.name.en, /[가-힣]/);
  }
});
