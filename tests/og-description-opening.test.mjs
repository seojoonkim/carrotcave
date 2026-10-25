// House rule: an OG/meta description must open with the content, not with a word
// or name that is already in the title. Link previews show the title on the line
// right above the description, so a repeated opening wastes the first glance.
// Rule lives in lib/og-description-rule.mjs; this test audits every page.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { repeatedTitleOpening } from '../lib/og-description-rule.mjs';
import { posts } from '../data/posts.ts';
import { interviews } from '../data/interviews.ts';
import { assertPublishableAbstract } from '../scripts/auto-sync.mjs';

const root = new URL('../', import.meta.url).pathname;
const read = (p) => readFileSync(root + p, 'utf8');

const audit = () => {
  const hits = [];
  const check = (where, title, desc) => {
    const hit = repeatedTitleOpening(title, desc);
    if (hit) hits.push(`${where}: "${hit}" — ${desc.slice(0, 60)}`);
  };
  for (const p of posts) check(`post ${p.slug}`, p.title, p.summary);
  for (const [slug, p] of Object.entries(JSON.parse(read('data/en/posts.json')))) check(`post-en ${slug}`, p.title, p.summary);
  for (const v of interviews) check(`voice ${v.slug}`, `${v.name} · ${v.title}`, v.summary);
  for (const [slug, v] of Object.entries(JSON.parse(read('data/en/voices.json')))) check(`voice-en ${slug}`, `${v.name} · ${v.title}`, v.summary);
  for (const dir of readdirSync(root + 'public/voices')) {
    for (const file of ['index.html', 'index.en.html']) {
      const path = `public/voices/${dir}/${file}`;
      if (!existsSync(root + path)) continue;
      const html = read(path);
      const title = html.match(/<meta property="og:title" content="([^"]*)"/)?.[1] ?? html.match(/<title>([^<]*)/)?.[1] ?? '';
      for (const m of html.matchAll(/<meta (?:property="og:description"|name="description"|name="twitter:description") content="([^"]*)"/g)) check(path, title, m[1]);
    }
  }
  return hits;
};

test('no carrotcave OG description opens by repeating a title word', () => {
  assert.deepEqual(audit(), []);
});

test('rule catches the forum preview that prompted it, and allows fresh openings', () => {
  const title = '김종윤·최혁재·김서준 · AI는 콘텐츠의 주인을 바꾼다';
  assert.equal(repeatedTitleOpening(title, '김종윤, 최혁재, 김서준은 AI가 콘텐츠의 주도권을 유저에게 넘긴다.'), '김종윤');
  assert.equal(repeatedTitleOpening(title, 'AI가 콘텐츠의 주도권을 유저에게 넘긴다.'), null);
  assert.equal(repeatedTitleOpening('MemKraft v0.2 – v0.5 개발 후기', 'MemKraft가 목표별 검색에서 출발했다.'), 'MemKraft가');
  assert.equal(repeatedTitleOpening('Chinese Models Are Eating the World', 'Chinese AI is narrowing the gap.'), 'Chinese');
  assert.equal(repeatedTitleOpening('How to Live in the Age of Optimists', 'In an age when AI lowers costs.'), null);
});

test('auto-sync refuses a new post whose summary opens with a title word', () => {
  assert.throws(
    () => assertPublishableAbstract('MemKraft가 검색과 보관에서 출발해 검증된 기억만 행동으로 잇는 시스템으로 발전한 과정을 정리했다.', '본문', 'MemKraft v3 업데이트 노트', '빌딩'),
    /repeats title word/,
  );
});
