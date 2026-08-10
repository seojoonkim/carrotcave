import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const syncSource = readFileSync(new URL('../scripts/auto-sync.mjs', import.meta.url), 'utf8');
const postsSource = readFileSync(new URL('../data/posts.ts', import.meta.url), 'utf8');
const homeSource = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const interviewSource = readFileSync(new URL('../data/interviews.ts', import.meta.url), 'utf8');
const headerSource = readFileSync(new URL('../components/SiteHeader.tsx', import.meta.url), 'utf8');
const axisRailSource = readFileSync(new URL('../components/AxisRail.tsx', import.meta.url), 'utf8');
const postSource = readFileSync(new URL('../app/posts/[slug]/page.tsx', import.meta.url), 'utf8');
const voiceListSource = readFileSync(new URL('../app/voices/page.tsx', import.meta.url), 'utf8');
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

test('home and voice list share one editorial-axis navigation component', () => {
  for (const axis of ['탐험', '빌딩', '낙서', '소설', '목소리']) assert.match(axisRailSource, new RegExp(axis));
  assert.match(axisRailSource, /<nav className="axis-rail" aria-label="편집 축">/);
  assert.match(homeSource, /<AxisRail active=\{active\} \/>/);
  assert.match(voiceListSource, /<AxisRail active="목소리" \/>/);
  assert.doesNotMatch(homeSource, /<nav className="axis-rail"/);
  assert.doesNotMatch(voiceListSource, /<nav className="axis-rail"/);
  assert.doesNotMatch(headerSource, /className="cc-nav"/);
  assert.doesNotMatch(axisRailSource, /<small>/);
  assert.match(homeSource, /<SiteHeader \/>\s*<AxisRail active=\{active\} \/>/);
  assert.match(voiceListSource, /<SiteHeader \/>\s*<AxisRail active="목소리" \/>/);
});

test('Liao Heng archive preserves the complete reader contract', () => {
  assert.match(interviewSource, /chapters: 7/);
  assert.match(interviewSource, /segments: 8142/);
  assert.match(interviewSource, /\/voices\/liao-heng\/index\.html/);
});

test('post thumbnails replace sequence numbers with a prominent publication-date stamp', () => {
  assert.doesNotMatch(homeSource, /const number = String\(index \+ 1\)\.padStart/);
  assert.doesNotMatch(homeSource, /<span>\{number\}<\/span>/);
  assert.match(homeSource, /<time className="wall-card__date" dateTime=\{post\.date\}>/);
  assert.doesNotMatch(homeSource, /<time[^>]*aria-label=/);
  assert.match(homeSource, /<span className="sr-only">발행일 \{post\.date\.replaceAll\('-', '\.'\)\}<\/span>/);
  assert.match(homeSource, /<span className="wall-card__date-visual" aria-hidden="true">/);
  assert.match(homeSource, /post\.date\.split\('-'\)\.map/);
  assert.match(homeSource, /className="wall-card__date-part"/);
  assert.match(stylesSource, /\.sr-only\{[^}]*position:absolute[^}]*clip:/);
  assert.doesNotMatch(voiceListSource, /String\(index \+ 1\)\.padStart/);
  assert.match(stylesSource, /\.wall-card__date\{[^}]*display:flex[^}]*font:/);
  assert.match(stylesSource, /\.wall-card__date-part\{[^}]*border-right:/);
  assert.doesNotMatch(stylesSource, /\.wall-card__meta time\{margin-left:auto\}/);
  assert.doesNotMatch(stylesSource, /\.wall-card__meta time\{display:none\}/);
  assert.match(stylesSource, /\.wall-card--actual-quote \.wall-card__date\{color:#555\}/);
  assert.doesNotMatch(stylesSource, /(?:^|})\.wall-card__axis\{[^}]*margin-left:auto/);
  assert.match(stylesSource, /\.editorial-wall:not\(\.editorial-wall--voices\) \.wall-card__axis\{margin-left:auto\}/);
});

test('every image-backed wall card keeps a two-to-three-line text preview', () => {
  assert.match(homeSource, /const showSummary = hasImage \|\| \['portal', 'quote', 'deep', 'landscape'\]\.includes\(pattern\)/);
  assert.match(homeSource, /\{showSummary && <p>\{post\.summary\}<\/p>\}/);
  assert.match(stylesSource, /\.wall-card p\{[^}]*-webkit-line-clamp:3/);
  assert.match(stylesSource, /@media\(max-width:520px\)[\s\S]*\.wall-card p\{[^}]*-webkit-line-clamp:2/);
  assert.match(stylesSource, /\.wall-card:nth-child\(12n\+5\):not\(\.wall-card--with-image\) p/);
  assert.match(stylesSource, /\.wall-card:nth-child\(12n\+10\):not\(\.wall-card--with-image\) p/);
});

test('voice cards render an interview thumbnail when the archive provides one', () => {
  assert.match(interviewSource, /thumbnailUrl\?: string/);
  assert.match(interviewSource, /thumbnailUrl: '\/voices\/liao-heng\/assets\/liao-heng-portrait\.webp'/);
  assert.match(voiceListSource, /import Image from 'next\/image'/);
  assert.match(voiceListSource, /\{item\.thumbnailUrl && \(\s*<Image/);
  assert.match(voiceListSource, /src=\{item\.thumbnailUrl\}/);
  assert.match(voiceListSource, /className="wall-card__image wall-card__image--voice"/);
  assert.match(voiceListSource, /item\.thumbnailUrl \? ' wall-card--with-image' : ''/);
  assert.match(stylesSource, /\.wall-card__image--voice\{[^}]*object-position:/);
});

test('home and voice list omit the intro strip and move directly into archive navigation', () => {
  assert.doesNotMatch(homeSource, /className="cc-intro"/);
  assert.doesNotMatch(voiceListSource, /className="cc-intro"/);
  assert.doesNotMatch(homeSource, /PERSONAL ARCHIVE|SIMON KIM · SEOUL \/ EVERYWHERE/);
  assert.doesNotMatch(voiceListSource, /PERSONAL ARCHIVE|SIMON KIM · SEOUL \/ EVERYWHERE/);
  assert.doesNotMatch(voiceListSource, /공개된 대화를 선별해 번역하고/);
  assert.doesNotMatch(stylesSource, /\.cc-intro(?:__identity|__note)?/);
  assert.match(homeSource, /<SiteHeader \/>\s*<AxisRail active=\{active\} \/>/);
  assert.match(voiceListSource, /<SiteHeader \/>\s*<AxisRail active="목소리" \/>/);
  assert.match(voiceListSource, /<AxisRail active="목소리" \/>/);
  assert.match(axisRailSource, /active === '목소리'/);
  assert.match(voiceListSource, /className="wall-shell"/);
  assert.match(voiceListSource, /className="editorial-wall editorial-wall--voices"/);
  assert.match(voiceListSource, /className=\{`wall-card wall-card--voice\$\{/);
  assert.match(stylesSource, /\.wall-card--voice \.wall-card__body\{justify-content:flex-start\}/);
  assert.match(stylesSource, /\.wall-card--voice \.wall-card__meta\{margin-bottom:0\}/);
  assert.match(stylesSource, /\.editorial-wall\.editorial-wall--voices\{grid-auto-rows:auto\}/);
  assert.match(stylesSource, /\.editorial-wall--voices \.wall-card\.wall-card--voice\{grid-column:1\/-1;grid-row:auto\}/);
  assert.doesNotMatch(voiceListSource, /voices-route|voices-hero|voices-list|voice-card/);
  assert.doesNotMatch(stylesSource, /VOICE \/ 05|\.voices-route|\.voices-hero|\.voices-list|\.voice-card|voice-wall-card/);
  assert.match(voiceListSource, /<h1 id="wall-heading">좋은 대화를 다시 읽을 수 있도록 남겨둡니다.<\/h1>/);
  assert.match(stylesSource, /\.wall-heading :is\(h1,h2\)/);
  assert.match(voiceListSource, /좋은 대화를 다시 읽을 수 있도록 남겨둡니다/);
  assert.doesNotMatch(voiceListSource, /직접 묻고/);
});

test('home keeps the CARROT CAVE wordmark while reading headers use logo divider and title information', () => {
  assert.match(headerSource, /readingTitle\?: string/);
  assert.match(headerSource, /cc-reading-divider/);
  assert.match(headerSource, /cc-reading-title/);
  assert.match(headerSource, /readingTitle \? 'cc-header cc-header--reading' : 'cc-header'/);
  assert.match(headerSource, /\{!readingTitle && [\s\S]*CARROT CAVE/);
  assert.match(postSource, /<SiteHeader readingTitle=\{post\.title\} readingMeta=/);
  assert.doesNotMatch(postSource, /<SiteHeader\s*\/>/);
  assert.match(liaoReaderSource, /class="reader-divider"/);
  assert.doesNotMatch(liaoReaderSource, /<span>CARROT CAVE<\/span>/);
});

test('brand logo asset and rendered marks are square', () => {
  assert.match(headerSource, /width=\{192\} height=\{192\}/);
  assert.match(liaoReaderSource, /width="192" height="192"/);
  assert.match(stylesSource, /\.cc-brand-symbol\{[^}]*width:32px;[^}]*height:32px/);
  assert.match(liaoReaderStyles, /\.brand-mark\s*\{[^}]*width:\s*32px;[^}]*height:\s*32px/);
});

test('voice reader uses one uncluttered header without source or return links', () => {
  assert.doesNotMatch(voiceReaderSource, /<header className="voice-reader-header">/);
  assert.doesNotMatch(voiceReaderSource, /voice-reader-source|>원본/);
  assert.match(liaoReaderSource, /class="brand" href="\/"/);
  assert.doesNotMatch(liaoReaderSource, /reader-back|>돌아가기</);
  assert.match(liaoReaderSource, /<header class="site-header">[\s\S]*class="reader-divider"[\s\S]*class="header-status"[\s\S]*<\/header>/);
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

test('archive pages avoid redundant intro and counts already exposed by the axis menu', () => {
  assert.doesNotMatch(homeSource, /WRITINGS|VOICE ARCHIVE/);
  assert.doesNotMatch(voiceListSource, /WRITINGS|VOICE ARCHIVE/);
  assert.doesNotMatch(homeSource, /className="cc-intro"/);
  assert.doesNotMatch(voiceListSource, /className="cc-intro"/);
});

test('home keeps all six axes visible on mobile', () => {
  assert.doesNotMatch(homeSource, /토끼를 따라왔는데|생각이 길을 잃었습니다/);
  assert.match(stylesSource, /@media\(max-width:900px\).*?\.axis-rail\{[^}]*grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/s);
  assert.doesNotMatch(stylesSource, /@media\(max-width:900px\).*?\.axis-rail\{[^}]*overflow-x:auto/s);
});

test('home uses one repeating editorial system for the complete post archive', () => {
  assert.match(homeSource, /<h1 id="wall-heading">/);
  assert.doesNotMatch(homeSource, /<h2 id="wall-heading">/);
  assert.match(homeSource, /<AxisRail active=\{active\} \/>/);
  assert.match(axisRailSource, /className="axis-rail"/);
  assert.match(homeSource, /className="editorial-wall"/);
  assert.match(homeSource, /visiblePosts\.map\(\(post, index\)/);
  assert.match(homeSource, /wallPatterns\[index % wallPatterns\.length\]/);

  assert.doesNotMatch(homeSource, /visiblePosts\.slice\(0, 8\)/);
  assert.doesNotMatch(homeSource, /className="archive-list"/);
  assert.doesNotMatch(homeSource, /className="featured-note"/);
  assert.doesNotMatch(homeSource, /className="axis-grid"/);
});
