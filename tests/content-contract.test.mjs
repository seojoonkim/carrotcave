import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const syncSource = readFileSync(new URL('../scripts/auto-sync.mjs', import.meta.url), 'utf8');
const postsSource = readFileSync(new URL('../data/posts.ts', import.meta.url), 'utf8');
const homeSource = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const interviewSource = readFileSync(new URL('../data/interviews.ts', import.meta.url), 'utf8');
const headerSource = readFileSync(new URL('../components/SiteHeader.tsx', import.meta.url), 'utf8');
const postSource = readFileSync(new URL('../app/posts/[slug]/page.tsx', import.meta.url), 'utf8');
const voiceReaderSource = readFileSync(new URL('../app/voices/[slug]/page.tsx', import.meta.url), 'utf8');
const liaoReaderSource = readFileSync(new URL('../public/voices/liao-heng/index.html', import.meta.url), 'utf8');
const liaoReaderStyles = readFileSync(new URL('../public/voices/liao-heng/styles.css', import.meta.url), 'utf8');

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

test('home exposes one editorial-axis navigation layer', () => {
  for (const axis of ['탐험', '빌딩', '낙서', '소설', '목소리']) assert.match(homeSource, new RegExp(axis));
  assert.match(homeSource, /<nav className="axis-rail" aria-label="편집 축">/);
  assert.doesNotMatch(headerSource, /className="cc-nav"/);
});

test('Liao Heng archive preserves the complete reader contract', () => {
  assert.match(interviewSource, /chapters: 7/);
  assert.match(interviewSource, /segments: 8142/);
  assert.match(interviewSource, /\/voices\/liao-heng\/index\.html/);
});

test('every first-party page surface keeps the CARROT CAVE title visible', () => {
  assert.match(headerSource, />CARROT CAVE</);
  assert.match(postSource, /<SiteHeader\s*\/>/);
  assert.match(liaoReaderSource, /class="brand" href="\/"[^>]*>[\s\S]*CARROT CAVE/);
});

test('voice reader uses one uncluttered header without source or return links', () => {
  assert.doesNotMatch(voiceReaderSource, /<header className="voice-reader-header">/);
  assert.doesNotMatch(voiceReaderSource, /voice-reader-source|>원본/);
  assert.match(liaoReaderSource, /class="brand" href="\/"/);
  assert.doesNotMatch(liaoReaderSource, /reader-back|>돌아가기</);
  assert.match(liaoReaderSource, /<header class="site-header">[\s\S]*CARROT CAVE[\s\S]*<\/header>/);
  assert.match(liaoReaderStyles, /\.site-header\s*\{[^}]*grid-template-columns:/);
});

test('CARROT CAVE surfaces use the generated carrot-cave symbol instead of dot marks', () => {
  assert.match(headerSource, /src="\/carrot-cave-symbol\.png"/);
  assert.match(liaoReaderSource, /<img class="brand-mark"[^>]*src="\/carrot-cave-symbol\.png"/);
  assert.doesNotMatch(headerSource, /<i aria-hidden="true"\s*\/>/);
  assert.doesNotMatch(liaoReaderStyles, /\.brand-mark[^}]*border-radius:\s*50%/);
});

test('every post with media renders its first image as the card background', () => {
  assert.match(homeSource, /\{hasImage && \(\s*<Image/);
  assert.match(homeSource, /wall-card--with-image/);
  assert.doesNotMatch(homeSource, /hasImage && \['portal', 'portrait', 'landscape'\]\.includes\(pattern\)/);
});

test('home keeps the archive intro compact and all six axes visible on mobile', () => {
  assert.doesNotMatch(homeSource, /토끼를 따라왔는데|생각이 길을 잃었습니다/);
  assert.match(homeSource, /className="cc-intro__identity"/);

  assert.match(stylesSource, /@media\(max-width:900px\).*?\.axis-rail\{[^}]*grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/s);
  assert.doesNotMatch(stylesSource, /@media\(max-width:900px\).*?\.axis-rail\{[^}]*overflow-x:auto/s);
});

test('home uses one repeating editorial system for the complete post archive', () => {
  assert.match(homeSource, /className="cc-intro"/);
  assert.match(homeSource, /className="axis-rail"/);
  assert.match(homeSource, /className="editorial-wall"/);
  assert.match(homeSource, /visiblePosts\.map\(\(post, index\)/);
  assert.match(homeSource, /wallPatterns\[index % wallPatterns\.length\]/);

  assert.doesNotMatch(homeSource, /visiblePosts\.slice\(0, 8\)/);
  assert.doesNotMatch(homeSource, /className="archive-list"/);
  assert.doesNotMatch(homeSource, /className="featured-note"/);
  assert.doesNotMatch(homeSource, /className="axis-grid"/);
});
