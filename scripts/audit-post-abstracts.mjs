#!/usr/bin/env node
import { readFileSync } from 'node:fs';
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
// Written by scripts/publish-single-message.mjs when a fiction post is published (reviewed override summary).
const approvedFictionOpeningSynopses = new Map(Object.entries(JSON.parse(readFileSync(new URL('../data/fiction-opening-synopses.json', import.meta.url), 'utf8'))));
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
  if (entry.category === '소설' && /(?:소설|이야기|작품)(?:이|가|은|는|을|를)?다?[.!?。！？]?$/.test(abstract)) reasons.push('fiction-meta-description');
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
