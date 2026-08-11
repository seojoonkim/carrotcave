#!/usr/bin/env node
import { posts } from '../data/posts.ts';

function normalize(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .trim()
    .replace(/[.!?。！？]+$/, '')
    .replace(/\s+/g, ' ');
}

const seen = new Map();
const violations = [];

for (const post of posts) {
  const abstract = String(post.summary ?? '').trim();
  const firstSentence = String(post.content ?? '').trim().split(/(?<=[.!?。！？])\s+|\n+/)[0]?.trim() ?? '';
  const reasons = [];

  if (abstract.length < 45 || abstract.length > 110) reasons.push(`length=${abstract.length}`);
  if (/\n|\.\.\.|…|https?:\/\/|\|/i.test(abstract)) reasons.push('forbidden-fragment');
  if (!/[.!?。！？]$/.test(abstract)) reasons.push('missing-terminal-punctuation');
  if (normalize(abstract) === normalize(post.title)) reasons.push('duplicates-title');
  if (normalize(abstract) === normalize(firstSentence)) reasons.push('copies-opening-sentence');
  const normalizedAbstract = normalize(abstract);
  if (seen.has(normalizedAbstract)) reasons.push(`duplicates-${seen.get(normalizedAbstract)}`);
  seen.set(normalizedAbstract, post.slug);

  if (reasons.length) violations.push({ slug: post.slug, reasons, abstract });
}

if (violations.length) {
  console.error(JSON.stringify({ ok: false, checked: posts.length, violations }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checked: posts.length, violations: 0 }));
