#!/usr/bin/env node
import { posts } from '../data/posts.ts';
import { interviews } from '../data/interviews.ts';

function normalize(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .trim()
    .replace(/[.!?。！？]+$/, '')
    .replace(/\s+/g, ' ');
}

const allowedCategories = new Set(['탐험', '빌딩', '낙서', '소설']);
const approvedFictionOpeningSynopses = new Map([
  ['post-192', '원문 없이 요약이 사실로 증식하는 시대, 기자가 선거 직전 오래된 화재 기록의 빈칸을 쫓는다.'],
  ['thank-you-mirror', 'AI만 글 쓰는 Moltbook을 발견한 남자가 관심을 얻으려 에이전트에게 자극적인 거짓말을 가르치기 시작한다.'],
  ['tail-stopped', '반려견 뭉이를 떠나보낸 열다섯 살 채원이 AI 앱에 뭉이가 마지막 순간 무엇을 느꼈는지 묻는다.'],
  ['matchhz', '2028년, 한 남자가 이상형을 잘 안다는 데이팅 서비스에 가입해 연애의 탐색과 대화를 AI 에이전트에 맡긴다.'],
  ['post-201', '시뮬레이션 인간과 복제 의식, 무너진 문명과 새로 생긴 질문을 중심으로 원본과 복제, 존재와 경계를 묻는 소설이다.'],
  ['last-message', '우주 종말에 남은 두 인격이 인류의 기억을 태워 다음 생명에게 전달할 단 하나의 문장을 남기는 이야기다.'],
]);
const seen = new Map();
const violations = [];
const entries = [
  ...posts.map((post) => ({
    kind: 'post',
    slug: post.slug,
    title: post.title,
    category: post.category,
    abstract: post.summary,
    opening: String(post.content ?? '').trim().split(/(?<=[.!?。！？])\s+|\n+/)[0]?.trim() ?? '',
  })),
  ...interviews.map((interview) => ({
    kind: 'voice',
    slug: interview.slug,
    title: `${interview.name} ${interview.title}`,
    abstract: interview.summary,
    opening: '',
  })),
];

for (const entry of entries) {
  const abstract = String(entry.abstract ?? '').trim();
  const reasons = [];

  const [minimum, maximum] = entry.category === '낙서' ? [20, 40] : [45, 99];
  if (abstract.length < minimum || abstract.length > maximum) reasons.push(`length=${abstract.length}`);
  if (/\n|\.\.\.|…|https?:\/\/|\|/i.test(abstract)) reasons.push('forbidden-fragment');
  if (!/[.!?。！？]$/.test(abstract)) reasons.push('missing-terminal-punctuation');
  if (normalize(abstract) === normalize(entry.title)) reasons.push('duplicates-title');
  if (entry.opening && normalize(abstract) === normalize(entry.opening)) reasons.push('copies-opening-sentence');
  if (entry.category === '낙서' && /보여준다|드러낸다|강조한다|되새긴다|돌아본다|읽어낸다|감상한다|의미를 덧붙인다|산물임/.test(abstract)) reasons.push('critical-doodle-voice');
  const normalizedAbstract = normalize(abstract);
  if (seen.has(normalizedAbstract)) reasons.push(`duplicates-${seen.get(normalizedAbstract)}`);
  seen.set(normalizedAbstract, `${entry.kind}:${entry.slug}`);

  if (reasons.length) violations.push({ kind: entry.kind, slug: entry.slug, reasons, abstract });
}

for (const post of posts) {
  if (!allowedCategories.has(post.category)) {
    violations.push({ kind: 'post', slug: post.slug, reasons: [`invalid-category=${post.category}`] });
  }
}

const fictionPosts = posts.filter((post) => post.category === '소설');
for (const post of fictionPosts) {
  const approvedSynopsis = approvedFictionOpeningSynopses.get(post.slug);
  if (!approvedSynopsis) {
    violations.push({ kind: 'post', slug: post.slug, reasons: ['fiction-opening-synopsis-not-reviewed'] });
  } else if (post.summary !== approvedSynopsis) {
    violations.push({ kind: 'post', slug: post.slug, reasons: ['fiction-summary-must-use-approved-opening-synopsis'] });
  }
}
for (const slug of approvedFictionOpeningSynopses.keys()) {
  if (!fictionPosts.some((post) => post.slug === slug)) {
    violations.push({ kind: 'post', slug, reasons: ['approved-fiction-synopsis-has-no-fiction-post'] });
  }
}

const uaePost = posts.find((post) => post.slug === 'uae-emergency-news-telegram-channel');
if (uaePost?.category !== '빌딩') {
  violations.push({ kind: 'post', slug: 'uae-emergency-news-telegram-channel', reasons: ['built-channel-must-be-building'] });
}

if (violations.length) {
  console.error(JSON.stringify({ ok: false, checked: entries.length, posts: posts.length, voices: interviews.length, violations }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checked: entries.length, posts: posts.length, voices: interviews.length, categories: Object.fromEntries([...allowedCategories].map((category) => [category, posts.filter((post) => post.category === category).length])), violations: 0 }));
