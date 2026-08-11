#!/usr/bin/env node
import { posts } from '../data/posts.ts';

function normalize(value) {
  return value
    .normalize('NFKC')
    .trim()
    .replace(/^#{1,6}\s+/, '')
    .replace(/\s+/g, ' ')
    .replace(/[.!?。！？]+$/, '')
    .trim()
    .toLocaleLowerCase('ko-KR');
}

function classify(title, firstLine) {
  const normalizedTitle = normalize(title);
  const normalizedLine = normalize(firstLine);
  if (!normalizedTitle || !normalizedLine) return 'clean';
  if (normalizedLine === normalizedTitle) return 'duplicate-line';
  if (normalizedLine.startsWith(`${normalizedTitle} `)) return 'duplicate-prefix';
  return 'clean';
}

const violations = posts.flatMap((post) => {
  const firstLine = post.content.split('\n').find((line) => line.trim())?.trim() || '';
  const kind = classify(post.title, firstLine);
  return kind === 'clean' ? [] : [{ slug: post.slug, kind, title: post.title, firstLine }];
});

if (violations.length > 0) {
  console.error(JSON.stringify({ ok: false, checked: posts.length, violations }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checked: posts.length, violations: 0 }));
