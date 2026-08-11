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
const seen = new Map();
const violations = [];
const entries = [
  ...posts.map((post) => ({
    kind: 'post',
    slug: post.slug,
    title: post.title,
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

  if (abstract.length < 45 || abstract.length > 110) reasons.push(`length=${abstract.length}`);
  if (/\n|\.\.\.|…|https?:\/\/|\|/i.test(abstract)) reasons.push('forbidden-fragment');
  if (!/[.!?。！？]$/.test(abstract)) reasons.push('missing-terminal-punctuation');
  if (normalize(abstract) === normalize(entry.title)) reasons.push('duplicates-title');
  if (entry.opening && normalize(abstract) === normalize(entry.opening)) reasons.push('copies-opening-sentence');
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

const uaePost = posts.find((post) => post.slug === 'uae-emergency-news-telegram-channel');
if (uaePost?.category !== '빌딩') {
  violations.push({ kind: 'post', slug: 'uae-emergency-news-telegram-channel', reasons: ['built-channel-must-be-building'] });
}

if (violations.length) {
  console.error(JSON.stringify({ ok: false, checked: entries.length, posts: posts.length, voices: interviews.length, violations }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checked: entries.length, posts: posts.length, voices: interviews.length, categories: Object.fromEntries([...allowedCategories].map((category) => [category, posts.filter((post) => post.category === category).length])), violations: 0 }));
