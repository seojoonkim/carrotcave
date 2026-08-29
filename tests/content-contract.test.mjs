import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const syncSource = readFileSync(new URL('../scripts/auto-sync.mjs', import.meta.url), 'utf8');
const postsSource = readFileSync(new URL('../data/posts.ts', import.meta.url), 'utf8');
const homeSource = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const socialMetadataSource = readFileSync(new URL('../lib/social-metadata.ts', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const interviewSource = readFileSync(new URL('../data/interviews.ts', import.meta.url), 'utf8');
const ontologyIndex = JSON.parse(readFileSync(new URL('../data/ontology/index.json', import.meta.url), 'utf8'));
const headerSource = readFileSync(new URL('../components/SiteHeader.tsx', import.meta.url), 'utf8');
const axisRailSource = readFileSync(new URL('../components/AxisRail.tsx', import.meta.url), 'utf8');
const editorialCardSource = readFileSync(new URL('../components/EditorialCard.tsx', import.meta.url), 'utf8');
const footerSource = readFileSync(new URL('../components/SiteFooter.tsx', import.meta.url), 'utf8');
const depthBadgeSource = readFileSync(new URL('../components/DepthBadge.tsx', import.meta.url), 'utf8');
const postSource = readFileSync(new URL('../app/posts/[slug]/page.tsx', import.meta.url), 'utf8');
const layoutSource = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8');
const voiceListSource = readFileSync(new URL('../app/voices/page.tsx', import.meta.url), 'utf8');
const voiceReaderSource = readFileSync(new URL('../app/voices/[slug]/page.tsx', import.meta.url), 'utf8');
const readingProgressSource = readFileSync(new URL('../components/ReadingProgress.tsx', import.meta.url), 'utf8');
const voiceProgressSource = readFileSync(new URL('../public/voices/reading-progress.js', import.meta.url), 'utf8');
const voiceRuntimeSource = readFileSync(new URL('../public/voices/reader-runtime.js', import.meta.url), 'utf8');
const liaoReaderSource = readFileSync(new URL('../public/voices/liao-heng/index.html', import.meta.url), 'utf8');
const liaoReaderStyles = readFileSync(new URL('../public/voices/liao-heng/styles.css', import.meta.url), 'utf8');
const liaoReaderScript = readFileSync(new URL('../public/voices/liao-heng/script.js', import.meta.url), 'utf8');
const liangReaderSource = readFileSync(new URL('../public/voices/liang-wenfeng/index.html', import.meta.url), 'utf8');
const liangReaderStyles = readFileSync(new URL('../public/voices/liang-wenfeng/styles.css', import.meta.url), 'utf8');
const liangReaderScript = readFileSync(new URL('../public/voices/liang-wenfeng/script.js', import.meta.url), 'utf8');
const liangLongReader = JSON.parse(readFileSync(new URL('../public/voices/liang-wenfeng/long-reader-ko.json', import.meta.url), 'utf8'));
const liangKeySentences = JSON.parse(readFileSync(new URL('../public/voices/liang-wenfeng/key-sentences.json', import.meta.url), 'utf8'));
const yangReaderSource = readFileSync(new URL('../public/voices/yang-zhilin/index.html', import.meta.url), 'utf8');
const yangReaderStyles = readFileSync(new URL('../public/voices/yang-zhilin/styles.css', import.meta.url), 'utf8');
const yangReaderScript = readFileSync(new URL('../public/voices/yang-zhilin/script.js', import.meta.url), 'utf8');
const yangTranscript = JSON.parse(readFileSync(new URL('../public/voices/yang-zhilin/transcript-ko.json', import.meta.url), 'utf8'));
const samReaderSource = readFileSync(new URL('../public/voices/sam-altman-startup-school-2026/index.html', import.meta.url), 'utf8');
const samReaderStyles = readFileSync(new URL('../public/voices/sam-altman-startup-school-2026/styles.css', import.meta.url), 'utf8');
const tiboReaderSource = readFileSync(new URL('../public/voices/tibo-ai-wave/index.html', import.meta.url), 'utf8');
const tiboReaderScript = readFileSync(new URL('../public/voices/tibo-ai-wave/script.js', import.meta.url), 'utf8');
const tiboTranscript = JSON.parse(readFileSync(new URL('../public/voices/tibo-ai-wave/transcript-ko.json', import.meta.url), 'utf8'));
const voiceReaderSystemStyles = readFileSync(new URL('../public/voices/reader-system.css', import.meta.url), 'utf8');
const sharedHeaderChromeStyles = readFileSync(new URL('../public/shared-header-chrome.css', import.meta.url), 'utf8');
const rootLayoutSource = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8');
const caveConstellationSource = readFileSync(new URL('../components/CaveConstellation.tsx', import.meta.url), 'utf8');
const voiceReaderFixtures = readdirSync(new URL('../public/voices/', import.meta.url), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(new URL(`../public/voices/${entry.name}/index.html`, import.meta.url)))
  .map((entry) => {
    const html = readFileSync(new URL(`../public/voices/${entry.name}/index.html`, import.meta.url), 'utf8');
    const scriptUrl = new URL(`../public/voices/${entry.name}/script.js`, import.meta.url);
    return {
      slug: entry.name,
      html,
      styles: readFileSync(new URL(`../public/voices/${entry.name}/styles.css`, import.meta.url), 'utf8'),
      runtime: html.includes('src="script.js"') && existsSync(scriptUrl)
        ? readFileSync(scriptUrl, 'utf8')
        : html,
    };
  });

test('archive and voice menu headers consume one shared chrome contract', () => {
  assert.match(rootLayoutSource, /<link rel="stylesheet" href="\/shared-header-chrome\.css" \/>/);
  assert.match(voiceReaderSystemStyles, /^@import url\("\.\.\/shared-header-chrome\.css"\);/);
  assert.match(sharedHeaderChromeStyles, /--cc-header-surface: #22252b;/);
  assert.match(sharedHeaderChromeStyles, /--cc-header-divider: rgba\(255, 255, 255, 0\.12\);/);
  assert.match(sharedHeaderChromeStyles, /--cc-header-shadow: 0 4px 14px rgba\(0, 0, 0, 0\.22\);/);
  assert.match(sharedHeaderChromeStyles, /\.cc-header,\s*\.site-header\s*\{[^}]*background: var\(--cc-header-surface\) !important;[^}]*border-bottom: 1px solid var\(--cc-header-divider\) !important;[^}]*box-shadow: var\(--cc-header-shadow\) !important;/s);
  assert.doesNotMatch(voiceReaderSystemStyles, /\.site-header\s*\{[^}]*border(?:-bottom)?:\s*0(?:\s*!important)?;/);
  assert.doesNotMatch(voiceReaderSystemStyles, /\.site-header\s*\{[^}]*box-shadow:\s*none/);
});

test('mobile archive chrome draws its single divider below the menu rail', () => {
  assert.match(stylesSource, /@media\(max-width:900px\)\{\s*\.cc-header:not\(\.cc-header--reading\)\{[^}]*border-bottom:0!important[^}]*\}/);
  assert.match(stylesSource, /@media\(max-width:900px\)\{[\s\S]*?\.cc-header-axis-mobile\{[^}]*border-bottom:0[^}]*\}/);
  assert.match(stylesSource, /\.cc-header-axis-mobile::after\{[^}]*position:absolute;[^}]*z-index:2;[^}]*right:0;[^}]*bottom:0;[^}]*left:0;[^}]*height:1px;[^}]*background:var\(--cc-header-divider\);[^}]*pointer-events:none;/s);
  assert.doesNotMatch(stylesSource, /\.cc-header-axis-mobile \.axis-rail\{[^}]*border-top:/);
});

test('all reading surfaces keep progress semantics while the shared header divider stays independent', () => {
  assert.match(headerSource, /readingTitle && <ReadingProgress \/>/);
  assert.match(readingProgressSource, /aria-label="전체 글 읽기 진행률"/);
  assert.match(readingProgressSource, /document\.documentElement\.scrollHeight - window\.innerHeight/);
  assert.match(readingProgressSource, /style\.transform = `scaleX\(\$\{percent \/ 100\}\)`/);
  assert.match(stylesSource, /\.cc-reading-progress\{display:none!important\}/);
  assert.match(syncSource, /telegramCalendarDate\(dateMatch\?\.\[1\]\)/);
  assert.doesNotMatch(syncSource, /dateMatch\s*\?\s*dateMatch\[1\]\.split\('T'\)\[0\]/);
  assert.doesNotMatch(stylesSource, /\.cc-reading-progress\{[^}]*bottom:-1px;[^}]*height:1px;/);

  assert.ok(voiceReaderFixtures.length > 0, 'at least one voice reader directory must be discovered');
  for (const { slug, html: source } of voiceReaderFixtures) {
    assert.equal((source.match(/id="readingProgress"/g) ?? []).length, 1);
    assert.equal((source.match(/id="progressBar"/g) ?? []).length, 1);
    assert.match(source, /<header class="site-header">[\s\S]*?id="readingProgress"[\s\S]*?<\/header>/);
    assert.match(source, /\.\.\/reading-progress\.js/);
    assert.match(source, /\.\.\/reader-system\.css/);
    assert.match(source, /\.\.\/reader-runtime\.js/, `${slug} must load the shared reader runtime`);
    assert.doesNotMatch(source, /chapterTrack|chapter-track|chapterProgressFill/);
  }
  for (const { slug, styles: source } of voiceReaderFixtures) {
    assert.match(source, /\.progress \{[^}]*bottom:-1px;[^}]*height:1px;[^}]*background:rgba\(255,255,255,\.09\)/);
    assert.match(source, /\.progress span \{[^}]*background:var\(--ansi-cyan\);/);
    assert.doesNotMatch(source, /\.progress span \{[^}]*box-shadow/, `${slug} progress line must stay flat`);
    assert.doesNotMatch(source, /chapter-track|chapter-progress-fill/);
  }
  assert.match(voiceProgressSource, /progress\.setAttribute\('aria-valuenow'/);
  assert.match(voiceProgressSource, /className = 'progress-carrot'/);
  assert.match(voiceProgressSource, /style\.setProperty\('--reading-progress-percent'/);
  assert.match(voiceProgressSource, /dataset\.active = percent > 0 \? 'true' : 'false'/);
  assert.match(voiceReaderSystemStyles, /\.progress > \.progress-carrot\s*\{[^}]*left: clamp\(9px, var\(--reading-progress-percent\), calc\(100% - 9px\)\);[^}]*opacity: 0;/);
  assert.match(voiceReaderSystemStyles, /\.progress\[data-active="true"\] \.progress-carrot \{ opacity: 1; \}/);
  assert.doesNotMatch(voiceProgressSource, /chapterTrack|chapter-track|transcript-chapter/);
});

test('all voice readers use unpadded chapter labels and a period title separator', () => {
  for (const { slug, html } of voiceReaderFixtures) {
    assert.doesNotMatch(html, /class="chapter-index">CHAPTER 0[1-9]</, `${slug} chapter labels must not be zero-padded`);
    assert.match(html, /class="chapter-index">CHAPTER 1</, `${slug} must expose an unpadded first chapter`);
    assert.match(html, /class="reading-status-separator" aria-hidden="true">\. <\/span>/, `${slug} must use a period after the live chapter label`);
  }
  assert.match(voiceRuntimeSource, /const normalized = chapter \? String\(Number\(chapter\)\) : '';/);
  assert.match(voiceRuntimeSource, /if \(normalized\) set\(`Ch\$\{normalized\}`, title\);/);
  assert.match(voiceRuntimeSource, /else set\('', 'OVERVIEW'\);/);
  assert.doesNotMatch(voiceRuntimeSource, /padStart\(2, '0'\)/);
});

test('every voice reader uses one compact header toggle for its reading index', () => {
  for (const { slug, html, runtime } of voiceReaderFixtures) {
    assert.match(html, /id="menuButton" type="button" aria-label="목차 열기" aria-expanded="false" aria-controls="tocDrawer"/, `${slug} must expose one persistent disclosure control`);
    assert.match(html, /id="tocDrawer" role="region" aria-hidden="true" aria-labelledby="tocTitle"/, `${slug} TOC must be a controlled navigation region`);
    assert.doesNotMatch(html, /id="closeDrawer"|aria-modal="true"|role="dialog"/, `${slug} must not render a second close control or modal contract`);
    assert.match(runtime, /(?:drawer\.)?classList\.contains\(['"]open['"]\)\s*\?\s*closeDrawer\(\)\s*:\s*openDrawer\(\)/, `${slug} menu button must toggle the TOC both ways`);
    assert.match(runtime, /setAttribute\(['"]aria-label['"],\s*['"]목차 닫기['"]\)/, `${slug} must announce the close state`);
    assert.match(runtime, /setAttribute\(['"]aria-label['"],\s*['"]목차 열기['"]\)/, `${slug} must restore the open label`);
  }
  for (const required of [
    '.menu-button[aria-expanded="true"] i { transform: rotate(45deg); }',
    '.menu-button[aria-expanded="true"] i::before { transform: rotate(90deg); }',
    '.header-titles { display: flex; min-width: 0; flex-direction: column; justify-content: center; gap: 3px; }',
    'border-bottom: 0;',
    '.toc-drawer h2 { font: 400 14px/1.25 var(--font-sans); }',
    'min-height: 42px;',
    'font: 600 12px/1.35 var(--font-sans);',
  ]) assert.ok(voiceReaderSystemStyles.includes(required), `compact shared TOC CSS missing: ${required}`);
});

test('ordinary reading progress carries a contained carrot at its live endpoint', () => {
  assert.match(readingProgressSource, /className="cc-reading-progress__carrot" aria-hidden="true"/);
  assert.match(readingProgressSource, /style\.setProperty\('--cc-reading-percent'/);
  assert.match(stylesSource, /\.cc-reading-progress__carrot\{[^}]*left:clamp\(9px,var\(--cc-reading-percent\),calc\(100% - 9px\)\)[^}]*opacity:0/);
  assert.match(stylesSource, /\.cc-reading-progress\[data-active="true"\] \.cc-reading-progress__carrot\{opacity:1\}/);
});

test('iOS webviews extend the graphite header through the top safe area', () => {
  assert.match(layoutSource, /viewportFit: 'cover'/);
  assert.match(stylesSource, /--cc-safe-top:env\(safe-area-inset-top,0px\)/);
  assert.match(stylesSource, /--cc-header-height:calc\(72px \+ var\(--cc-safe-top\)\)/);
  assert.match(stylesSource, /\.cc-header\{[^}]*height:var\(--cc-header-height\);[^}]*padding:var\(--cc-safe-top\)/);
  assert.match(stylesSource, /\.cc-header__axis--desktop\{min-width:0\}/);
  assert.match(stylesSource, /\.cc-header-axis-mobile\{display:none\}/);
  assert.match(stylesSource, /@media\(max-width:900px\)\{[^\n]*\.cc-header:not\(\.cc-header--reading\)\{height:calc\(64px \+ var\(--cc-safe-top\)\)/);
  assert.match(stylesSource, /@media\(max-width:900px\)\{[^\n]*\.cc-header-axis-mobile\{display:block;position:sticky;top:calc\(64px \+ var\(--cc-safe-top\)\);z-index:39;width:100vw;margin-left:calc\(50% - 50vw\)/);
  assert.match(stylesSource, /@media\(max-width:900px\)\{[^\n]*\.cc-header:not\(\.cc-header--reading\) \.cc-header__axis--desktop\{display:none\}/);
  assert.match(stylesSource, /@media\(max-width:900px\)\{[^\n]*\.cc-header-axis-mobile \.axis-rail\{width:100%;height:58px;margin:0;[^}]*background:var\(--graphite\);[^}]*border-bottom:1px solid var\(--line\)/);
  assert.match(stylesSource, /@media\(max-width:900px\)\{[^\n]*\.cc-header-axis-mobile \.axis-rail__inner\{width:100%;grid-template-columns:repeat\(6,minmax\(0,1fr\)\)\}/);
  assert.match(stylesSource, /@media\(max-width:900px\)\{[^\n]*\.cc-header-axis-mobile \.axis-rail a\{width:100%;min-width:0;/);
  assert.match(stylesSource, /@media\(max-width:520px\)\{[^\n]*\.cc-header-axis-mobile\{top:calc\(64px \+ var\(--cc-safe-top\)\)\}/);
  assert.match(stylesSource, /@media\(max-width:520px\)\{[^\n]*\.cc-header-axis-mobile \.axis-rail\{height:54px/);
  assert.doesNotMatch(stylesSource, /--cc-header-height:calc\((58\.032|47\.616)px/);
  assert.doesNotMatch(stylesSource, /\.axis-rail a\{min-height:(41\.5152|38\.8368|36\.1584)px/);
  assert.match(stylesSource, /html\{[^}]*background:var\(--graphite\)/);
});

test('post reader accent metadata stays bright and titles use the available line width', () => {
  assert.match(depthBadgeSource, /entry:\s*\{\s*color: '#FFD166'/);
  assert.match(depthBadgeSource, /mid:\s*\{\s*color: '#FFB15C'/);
  assert.match(depthBadgeSource, /deep:\s*\{\s*color: '#FF8A65'/);
  assert.match(depthBadgeSource, /fontWeight: 650/);
  assert.match(stylesSource, /\.post-reader-header h1\{[^}]*text-wrap:wrap;overflow-wrap:anywhere/);
  assert.doesNotMatch(stylesSource, /\.post-reader-header h1\{[^}]*text-wrap:balance/);
});

test('ordinary post endings omit tag chips and separate content, actions, and recommendations', () => {
  assert.doesNotMatch(postSource, /post\.tags\.map|#\{tag\}/);
  assert.match(postSource, /<nav className="post-reader-actions post-reader-actions--after-content"/);
  assert.match(postSource, /className="cave-constellation-shell cave-constellation-shell--after-actions"/);
  assert.match(stylesSource, /\.post-reader-actions--after-content\{margin-top:100px\}/);
  assert.match(stylesSource, /\.cave-constellation-shell--after-actions\{margin-top:124px\}/);
  assert.match(stylesSource, /@media\(max-width:760px\)\{[^\n]*\.cave-constellation-shell\.cave-constellation-shell--after-actions\{margin-top:124px\}/);
  assert.match(stylesSource, /@media\(max-width:480px\)\{[^\n]*\.post-reader-actions--after-content\{margin-top:88px\}/);
  assert.match(stylesSource, /@media\(max-width:480px\)\{[^\n]*\.cave-constellation-shell\.cave-constellation-shell--after-actions\{margin-top:124px\}/);
});

test('Telegram sync uses the canonical carrotcave channel', () => {
  assert.match(syncSource, /const CHANNEL = 'carrotcave';/);
  assert.doesNotMatch(syncSource, /const CHANNEL = 'simon_rabbit_hole';/);
});

test('Telegram sync can write locally without committing or pushing', () => {
  assert.match(syncSource, /const NO_GIT = process\.argv\.includes\('--no-git'\);/);
  assert.match(syncSource, /if \(DRY_RUN \|\| NO_GIT\)/);
});

test('post slugs, Telegram message IDs, and full article bodies are unique', async () => {
  const { posts } = await import('../data/posts.ts');
  const messageIds = posts.map((post) => post.telegramMsgId).filter(Boolean);

  assert.equal(new Set(posts.map((post) => post.slug)).size, posts.length);
  assert.equal(new Set(messageIds).size, messageIds.length);
  assert.equal(new Set(posts.map((post) => post.content.trim())).size, posts.length);
});

test('every post carries a category-appropriate abstract shared by thumbnails and recommendations', async () => {
  const { posts } = await import('../data/posts.ts');

  assert.ok(posts.length > 0);
  assert.match(homeSource, /summary=\{post\.summary\}/);
  assert.match(editorialCardSource, /className="wall-card__abstract"/);
  assert.match(syncSource, /assertPublishableAbstract\(summary, msg\.content \|\| msg\.fullText, title, category\)/);
  assert.match(syncSource, /category === '낙서'.*critical doodle voice/);
  assert.doesNotMatch(syncSource, /summary:\s*msg\.content\.substring/);

  const criticalDoodlePhrases = /보여준다|드러낸다|강조한다|되새긴다|돌아본다|읽어낸다|감상한다|의미를 덧붙인다|산물임/;
  for (const post of posts) {
    const [minimum, maximum] = post.category === '낙서' ? [20, 40] : [45, 99];
    assert.ok(post.summary.length >= minimum && post.summary.length <= maximum, `${post.slug}: abstract length`);
    assert.match(post.summary, /[.!?。！？]$/, `${post.slug}: terminal punctuation`);
    assert.doesNotMatch(post.summary, /\n|\.\.\.|…|https?:\/\/|\|/i, `${post.slug}: forbidden fragment`);
    if (post.category === '낙서') assert.doesNotMatch(post.summary, criticalDoodlePhrases, `${post.slug}: critical doodle voice`);
  }
});

test('post corrections and newest-first ordering stay explicit', async () => {
  const { posts } = await import('../data/posts.ts');
  const melgeek = posts.find((post) => post.slug === 'melgeek-evangelion-centauri-keyboard-review');
  const promptGuard = posts.find((post) => post.slug === 'prompt-guard-dev');

  assert.equal(melgeek?.category, '낙서');
  assert.deepEqual(promptGuard?.mediaUrls, undefined);
  assert.equal(posts.filter((post) => post.title === 'Hashed Vibe Labs Fellows 소개').length, 1);
  const vibeLabs = posts.filter((post) => post.title === 'vibelabs.hashed.com을 만든 이야기');
  assert.deepEqual(vibeLabs.map((post) => [post.slug, post.telegramMsgId]), [['vibe-labs-landing-page-creation', 8]]);
  assert.doesNotMatch(postsSource, /slug:\s*'vibelabs-landing'/);
  const directlyBuiltSlugs = ['post-187', 'post-161', 'post-150', 'korean-tech-ecosystem-api-access-issues', 'sano-godaddy-war', 'click-theology'];
  for (const slug of directlyBuiltSlugs) assert.equal(posts.find((post) => post.slug === slug)?.category, '빌딩');
  assert.equal(posts.find((post) => post.slug === 'post-111')?.category, '탐험');
  assert.equal(posts.find((post) => post.slug === 'post-104')?.category, '낙서');
  assert.match(homeSource, /\.sort\(\(a, b\) => b\.date\.localeCompare\(a\.date\)/);
});

test('home and voice list share one editorial-axis navigation component', () => {
  for (const axis of ['탐험', '빌딩', '낙서', '소설', '목소리']) assert.match(axisRailSource, new RegExp(axis));
  assert.match(axisRailSource, /<nav className="axis-rail" aria-label="편집 축">/);
  assert.match(homeSource, /<SiteHeader><AxisRail active=\{active\} \/><\/SiteHeader>/);
  assert.match(homeSource, /<div className="cc-header-axis-mobile"><AxisRail active=\{active\} \/><\/div>/);
  assert.match(voiceListSource, /<AxisRail active="목소리" \/>/);
  assert.match(voiceListSource, /<div className="cc-header-axis-mobile"><AxisRail active="목소리" \/><\/div>/);
  assert.doesNotMatch(homeSource, /<nav className="axis-rail"/);
  assert.doesNotMatch(voiceListSource, /<nav className="axis-rail"/);
  assert.doesNotMatch(headerSource, /className="cc-nav"/);
  assert.doesNotMatch(axisRailSource, /<small>/);
  assert.match(headerSource, /children\?: ReactNode/);
  assert.match(headerSource, /cc-header__axis--desktop/);
  assert.doesNotMatch(headerSource, /TELEGRAM ↗/);
  assert.doesNotMatch(headerSource, /https:\/\/t\.me\/carrotcave/);
});

test('home archive heading uses the same title contract as category archives', () => {
  assert.match(homeSource, /<h1 id="wall-heading" className="wall-heading__menu-title">[\s\S]*active \? axisNotes\[active\] : '모든 기록은 서로 다른 입구입니다\.'/);
  assert.doesNotMatch(stylesSource, /wall-heading__home-title|font-size:70%/);
  assert.match(stylesSource, /@media\(max-width:520px\)\{[^\n]*\.wall-heading #wall-heading\{font-size:21px\}/);
});

test('all three voice archives preserve their complete reader contracts', () => {
  assert.match(interviewSource, /chapters: 7/);
  assert.match(interviewSource, /segments: 8142/);
  assert.match(interviewSource, /\/voices\/liao-heng\/index\.html/);
  assert.match(interviewSource, /slug: 'liang-wenfeng'[\s\S]*sourcePublishedAt: '2026-07-27'[\s\S]*chapters: 5,[\s\S]*segments: 447,[\s\S]*\/voices\/liang-wenfeng\/index\.html/);
  assert.match(interviewSource, /slug: 'yang-zhilin'[\s\S]*chapters: 6,[\s\S]*segments: 2531,[\s\S]*\/voices\/yang-zhilin\/index\.html/);
  for (const source of [liangReaderSource, yangReaderSource]) {
    assert.match(source, /class="hero-portrait"/);
    assert.match(source, /class="transcript-disclaimer"/);
    assert.match(source, /property="og:image"/);
    assert.match(source, /prefers-reduced-motion|script\.js/);
  }
  const yangBoundaries = [...yangReaderSource.matchAll(/data-start="(\d+)" data-end="(\d+)"/g)]
    .map(([, start, end]) => [Number(start), Number(end)]);
  assert.deepEqual(yangBoundaries, [
    [0, 1011], [1011, 1987], [1987, 2987],
    [2987, 3918], [3918, 4982], [4982, 6059],
  ]);
  assert.ok(yangBoundaries.every((range, index) => index === 0 || yangBoundaries[index - 1][1] === range[0]));
});

test('Tibo voice archive ships a Korean sentence-level transcript with source-specific content', () => {
  const transcriptUrl = new URL('../public/voices/tibo-ai-wave/transcript-ko.json', import.meta.url);
  assert.ok(existsSync(transcriptUrl), 'Korean transcript must exist before release');
  const koreanTranscript = JSON.parse(readFileSync(transcriptUrl, 'utf8'));

  assert.equal(koreanTranscript.language, 'ko');
  assert.ok(Array.isArray(koreanTranscript.items));
  assert.ok(koreanTranscript.items.length >= 100 && koreanTranscript.items.length <= 250);
  assert.ok(koreanTranscript.items.every((item, index) => item.id === index));
  assert.ok(koreanTranscript.items.every((item) => Number.isFinite(item.start) && Number.isFinite(item.end) && item.start < item.end));
  assert.ok(koreanTranscript.items.every((item) => typeof item.text === 'string' && /[가-힣]/.test(item.text)));
  assert.ok(koreanTranscript.items.every((item, index) => index === 0 || item.start >= koreanTranscript.items[index - 1].start));
  const allowedSpeakers = new Set(['Tibo', 'Matthew Berman']);
  assert.ok(koreanTranscript.items.every((item) => allowedSpeakers.has(item.speaker)));
  assert.deepEqual(new Set(koreanTranscript.items.map((item) => item.speaker)), allowedSpeakers);
  assert.ok(koreanTranscript.items.some((item, index) => index > 0 && item.speaker !== koreanTranscript.items[index - 1].speaker));

  assert.match(tiboReaderScript, /fetch\('transcript-ko\.json'\)/);
  assert.doesNotMatch(tiboReaderScript, /fetch\('transcript-en\.json'\)/);
  assert.match(tiboReaderSource, /전체 한국어 번역 전사/);
  assert.match(tiboReaderSource, /Matthew Berman/);
  assert.match(tiboReaderSource, /Google · DeepMind에서 배운 출시의 교훈/);
  assert.match(tiboReaderSource, /초고속 AI가 여는 다음 사용 방식/);
  assert.doesNotMatch(tiboReaderSource, /Y Combinator|첫 YC|폴 그레이엄|Loopt|Startup School/);
});

test('Tibo transcript chapter ranges cover every caption segment without gaps', () => {
  const boundaries = [...tiboReaderSource.matchAll(/class="content-section chapter transcript-chapter"[^>]*data-start="([\d.]+)" data-end="([\d.]+)"/g)]
    .map(([, start, end]) => [Number(start), Number(end)]);

  assert.equal(boundaries.length, 7);
  assert.ok(boundaries.every(([start, end]) => Number.isFinite(start) && Number.isFinite(end) && start < end));
  assert.ok(boundaries.every((range, index) => index === 0 || boundaries[index - 1][1] === range[0]));
  for (const item of tiboTranscript.items) {
    const containingRanges = boundaries.filter(([start, end]) => Number(item.start) >= start && Number(item.start) < end);
    assert.equal(containingRanges.length, 1, `item ${item.id} at ${item.start}s must belong to exactly one chapter`);
  }
  assert.ok(boundaries.every(([start, end]) => tiboTranscript.items.some((item) => item.start >= start && item.start < end)));
});

test('all voice readers show timestamps only at chapter and editorial subchapter boundaries', () => {
  for (const script of [liaoReaderScript, liangReaderScript, yangReaderScript]) {
    assert.doesNotMatch(script, /paragraph-permalink|paragraph-timestamp/);
  }
  for (const styles of [liaoReaderStyles, liangReaderStyles, yangReaderStyles]) {
    assert.doesNotMatch(styles, /\.paragraph-permalink|\.paragraph-timestamp/);
    assert.match(styles, /\.chapter-time/);
  }
  assert.equal((liaoReaderSource.match(/class="chapter-time"/g) || []).length, 7);
  assert.equal((liangReaderSource.match(/class="chapter-time"/g) || []).length, 5);
  assert.equal((yangReaderSource.match(/class="chapter-time"/g) || []).length, 6);
  assert.match(liaoReaderScript, /time\.className = 'highlight-time'/);
  assert.equal((liangReaderSource.match(/id="time-\d{2}-\d{2}-\d{2}"/g) || []).length, 19);
  assert.match(liaoReaderScript, /span\.id = `segment-\$\{segment\.id\}`/);
  assert.match(liangReaderScript, /anchor\.id = `segment-\$\{segment\.id\}`/);
  assert.match(yangReaderScript, /anchor\.id = `segment-\$\{segment\.id\}`/);
});

test('Liao Heng reader keeps stable timestamp anchors without transcript search or per-paragraph action clutter', () => {
  assert.doesNotMatch(liaoReaderSource, /transcript-search\.js/);
  assert.doesNotMatch(liaoReaderSource, /id="transcriptSearch"|전체 전사 검색|readerActionStatus/);
  assert.doesNotMatch(liaoReaderScript, /TranscriptSearch|transcriptSearch|search(?:Status|Input|Form|Api|Index|Results|Timer)|paragraph-source|paragraph-copy-link|data-copy-paragraph|copyText/);
  assert.doesNotMatch(liaoReaderStyles, /\.transcript-search|\.search-input-row|\.search-navigation|\.search-hit|\.paragraph-source|\.paragraph-copy-link/);
  assert.match(liaoReaderScript, /paragraph\.id = `p-\$\{paragraphData\.id\}`/);
  assert.match(liaoReaderScript, /span\.id = `segment-\$\{segment\.id\}`/);
  assert.match(liaoReaderScript, /return \(header \? header\.getBoundingClientRect\(\)\.height : 64\) \+ 8;/);
  assert.match(liaoReaderStyles, /scroll-margin-top:calc\(var\(--header\) \+ 8px\)/);
  assert.match(liaoReaderStyles, /\.transcript-paragraph:target,\.transcript-paragraph\.hash-target \{ outline:1px solid var\(--amber\); outline-offset:3px; \}/);
  assert.match(liaoReaderStyles, /\.transcript-highlights a \{ min-height: 44px/);
  assert.match(liaoReaderStyles, /\.highlight-time \{ display: inline-flex; min-height: 44px/);
  assert.match(liaoReaderStyles, /\.hero-actions \{ display:grid; grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(liaoReaderStyles, /@media \(max-width:599px\)[\s\S]*?\.hero-actions \{ grid-template-columns:minmax\(0,1fr\); \}/);
});

test('Liang Wenfeng reader preserves all 19 leaked-meeting sections as a source-critical long record', () => {
  assert.match(liangReaderSource, /2026년 5월 20일/);
  assert.match(liangReaderSource, /비공개 투자자 회의/);
  assert.match(liangReaderSource, /2026년 5월 20일 열린 것으로 알려진 비공개 투자자 회의/);
  assert.match(liangReaderSource, /DeepSeek가 공식 인터뷰로 공개하거나 내용을 확인한 자료가 아니/);
  assert.match(liangReaderSource, /참석자와 질문자 표시 없이 인터넷에 퍼진 중국어 문서/);
  assert.match(liangReaderSource, /자동 음성인식과 AI 정리 과정을 거쳐 글로 만든 것으로 보인다/);
  assert.match(liangReaderSource, /누가 한 말인지 확정할 수 없/);
  assert.match(liangReaderSource, /말을 잘못 알아들은 부분/);
  assert.match(liangReaderSource, /실제 발언을 처음부터 끝까지 그대로 옮긴 기록으로 보기는 어렵다/);
  assert.doesNotMatch(liangReaderSource, /직접 인용.*없음/);
  assert.doesNotMatch(liangReaderSource, /축자 기록|귀속|오청/);
  assert.match(liangReaderSource, /<h2>CARROT CAVE INSIGHTS<\/h2>/);
  const liangInsights = liangReaderSource.match(/<section(?=[^>]*\bid="insights")(?=[^>]*\bclass="[^"]*\bcarrot-cave-insights\b[^"]*")[^>]*>[\s\S]*?<\/section>/)?.[0] || '';
  assert.equal((liangInsights.match(/<li>/g) || []).length, 5);
  assert.match(liangReaderSource, /기능 분류는 편집 과정의 추정이며 누가 한 말인지 확인한 정보가 아니다/);
  assert.doesNotMatch(liangReaderSource, /유출 ASR 정리본상 발언|“|”/);
  assert.equal(liangLongReader.length, 19);
  const dialogueParagraphs = liangLongReader.flatMap((section) => section.paragraphs);
  assert.equal(dialogueParagraphs.length, 447);
  const allowedTags = new Set(['질문', '답변', '미상', '진행', '불명']);
  assert.ok(dialogueParagraphs.every((paragraph) => paragraph && typeof paragraph === 'object' && !Array.isArray(paragraph)));
  assert.ok(dialogueParagraphs.every((paragraph) => Object.keys(paragraph).sort().join(',') === 'evidence,tag,text'));
  assert.ok(dialogueParagraphs.every((paragraph) => allowedTags.has(paragraph.tag)));
  assert.ok(dialogueParagraphs.every((paragraph) => typeof paragraph.text === 'string' && paragraph.text.trim().length > 0));
  assert.ok(dialogueParagraphs.every((paragraph) => paragraph.tag === '미상' ? paragraph.evidence === '' : typeof paragraph.evidence === 'string' && paragraph.evidence.trim().length >= 8));
  const timestamps = liangLongReader.map((section) => section.timestamp);
  assert.equal(new Set(timestamps).size, 19);
  const seconds = timestamps.map((stamp) => stamp.split(':').reduce((sum, part) => sum * 60 + Number(part), 0));
  assert.ok(seconds.every((value, index) => index === 0 || value > seconds[index - 1]));
  assert.deepEqual([timestamps[0], timestamps.at(-1)], ['00:00:01', '03:41:02']);
  assert.equal((liangReaderSource.match(/class="topic long-record"/g) || []).length, 19);
  assert.equal((liangReaderSource.match(/id="time-\d{2}-\d{2}-\d{2}"/g) || []).length, 19);
  const koreanBody = dialogueParagraphs.map((paragraph) => paragraph.text).join('');
  assert.ok(koreanBody.length >= 30_000);
  assert.ok(liangLongReader.every((section) => section.paragraphs.map((paragraph) => paragraph.text).join('').length >= 1_000));
  assert.doesNotMatch(koreanBody, /“|”|‘|’|—|\.\.\./);
  assert.doesNotMatch(liangReaderSource, /—/);
  const escapeHtml = (value) => value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
  for (const section of liangLongReader) {
    assert.match(liangReaderSource, new RegExp(`id="time-${section.timestamp.replaceAll(':', '-')}"`));
    assert.ok(liangReaderSource.includes(`<h3>${escapeHtml(section.title_ko)}</h3>`));
    assert.equal((liangReaderSource.match(/class="utterance"/g) || []).length, 447);
    assert.doesNotMatch(liangReaderSource, /class="utterance-tag"|\[(?:질문|답변|미상|진행|불명)\]/);
  }
  assert.doesNotMatch(liangReaderSource, /class="source-caveats"|출처 주의|원자료 묶음:/);
  assert.match(liangReaderSource, /href="long-reader-ko\.json"/);
  assert.match(liangReaderSource, /https:\/\/github\.com\/KnightQuals\/deepseek-investor-meeting/);
  assert.match(liangReaderSource, /https:\/\/www\.zaobao\.com\.sg\/news\/china\/story20260727-9427115/);
  assert.match(liangReaderSource, /https:\/\/www\.chinatalk\.media\/p\/deepseek-ceo-interview-with-chinas/);
  assert.equal((liangReaderSource.match(/class="content-section chapter transcript-chapter"/g) || []).length, 5);
  const expectedChapterTitles = [
    '비전에서 지속학습까지',
    'AGI를 향한 집중과 연산',
    '상업화와 연구 조직의 선택',
    '지속학습 생태계와 확장의 조건',
    '탐색 연구에서 범용 에이전트까지',
  ];
  const expectedChapterTimes = [
    '00:00:01 ~ 00:51:02',
    '00:51:02 ~ 01:39:46',
    '01:39:46 ~ 02:34:59',
    '02:34:59 ~ 03:17:47',
    '03:17:47 ~ 03:41:02',
  ];
  expectedChapterTitles.forEach((title, index) => {
    const chapterNumber = index + 1;
    const chapterPattern = new RegExp(
      `id="chapter-${chapterNumber}"[\\s\\S]*?<h2>${title}</h2>[\\s\\S]*?<p class="chapter-time">${expectedChapterTimes[index]}</p>`,
    );
    assert.match(liangReaderSource, chapterPattern);
    assert.match(
      liangReaderSource,
      new RegExp(`class="toc-chapter-link" href="#chapter-${chapterNumber}"[\\s\\S]*?<span class="toc-chapter-title">${title}</span>[\\s\\S]*?<span class="toc-chapter-time">${expectedChapterTimes[index]}</span>`),
    );
  });
  assert.equal((liangReaderSource.match(/class="chapter-time"/g) || []).length, 5);
  assert.equal((liangReaderSource.match(/class="toc-chapter-title"/g) || []).length, 5);
  assert.equal((liangReaderSource.match(/class="toc-chapter-time"/g) || []).length, 5);
  const chapterRanges = [...liangReaderSource.matchAll(/data-start="(\d{2}:\d{2}:\d{2})" data-last-start="(\d{2}:\d{2}:\d{2})"/g)]
    .map(([, start, lastStart]) => [start, lastStart]);
  assert.deepEqual(chapterRanges, [
    ['00:00:01', '00:38:36'],
    ['00:51:02', '01:26:41'],
    ['01:39:46', '02:21:31'],
    ['02:34:59', '03:05:48'],
    ['03:17:47', '03:41:02'],
  ]);
  assert.ok(chapterRanges.every(([start, lastStart]) => seconds[timestamps.indexOf(lastStart)] >= seconds[timestamps.indexOf(start)]));
  assert.deepEqual(chapterRanges.map(([start]) => start), [timestamps[0], timestamps[4], timestamps[8], timestamps[12], timestamps[16]]);
  assert.doesNotMatch(liangReaderSource, /전체 한국어 번역 전사|전체 보존본|122 SEGMENTS|한국어 번역 전사/);
  assert.match(liangReaderSource, /https:\/\/github\.com\/QFOI\/Transcript-of-Liang-Wenfengs-DeepSeek-Founder-4-Hour-Investor-Meeting/);
  assert.match(liangReaderSource, /https:\/\/github\.com\/iamsophie\/deepseek-liang-wenfeng-investor-meeting/);
  assert.doesNotMatch(liangReaderSource, /<script src="script\.js"/);
  assert.doesNotMatch(interviewSource, /slug: 'liang-wenfeng'[\s\S]{0,500}?segments: 122/);
  assert.match(interviewSource, /slug: 'liang-wenfeng'[\s\S]{0,700}?duration: '19개 구간'/);
  assert.match(interviewSource, /slug: 'liang-wenfeng'[\s\S]{0,900}?segments: 447/);

  assert.equal(liangKeySentences.length, 21);
  const highlightedParagraphs = new Set();
  for (const item of liangKeySentences) {
    assert.deepEqual(Object.keys(item).sort(), ['exact_quote', 'paragraph_index', 'section_index']);
    assert.ok(Number.isInteger(item.section_index) && item.section_index >= 0 && item.section_index < liangLongReader.length);
    const section = liangLongReader[item.section_index];
    assert.ok(Number.isInteger(item.paragraph_index) && item.paragraph_index >= 0 && item.paragraph_index < section.paragraphs.length);
    const paragraph = section.paragraphs[item.paragraph_index];
    assert.equal(paragraph.text.split(item.exact_quote).length - 1, 1);
    const key = `${item.section_index}:${item.paragraph_index}`;
    assert.ok(!highlightedParagraphs.has(key));
    highlightedParagraphs.add(key);
    assert.ok(liangReaderSource.includes(`<mark class="key-sentence">${escapeHtml(item.exact_quote)}</mark>`));
  }
  assert.equal((liangReaderSource.match(/<mark class="key-sentence">/g) || []).length, liangKeySentences.length);

  const renderedParagraphs = [...liangReaderSource.matchAll(/<p class="utterance" data-tag="([^"]+)"(?: data-evidence="([^"]*)")?><span class="utterance-text">([\s\S]*?)<\/span><\/p>/g)]
    .map(([, tag, evidence = '', content]) => ({
      tag,
      evidence,
      text: content.replaceAll(/<mark class="key-sentence">([\s\S]*?)<\/mark>/g, '$1'),
    }));
  assert.deepEqual(renderedParagraphs, dialogueParagraphs.map((paragraph) => ({
    tag: paragraph.tag,
    evidence: escapeHtml(paragraph.evidence),
    text: escapeHtml(paragraph.text),
  })));
});

test('Yang Zhilin transcript uses sentence-aware paragraphs instead of fixed segment batches', () => {
  assert.match(yangReaderSource, /transcript-format\.js/);
  assert.match(yangReaderScript, /formatter\.groupSegments\(segments\)/);
  assert.doesNotMatch(yangReaderScript, /offset \+= 6|slice\(offset, offset \+ 6\)/);
  assert.match(yangReaderScript, /typeof formatter\.groupSegments === 'function'/);
  assert.match(yangReaderScript, /if \(part\.silence\) paragraph\.classList\.add\('transcript-silence'\)/);
});

test('Yang Zhilin transcript starts at the real introduction after removing the preview and duplicated greeting', () => {
  const removedIds = new Set(Array.from({ length: 20 }, (_, id) => id));
  assert.ok(yangTranscript.segments.every((segment) => !removedIds.has(segment.id)));
  assert.ok(yangTranscript.segments.every((segment) => segment.start >= 57));
  assert.equal(yangTranscript.segments[0].id, 20);
  assert.equal(yangTranscript.segments[0].start, 57);
  assert.equal(yangTranscript.segments[0].text, '저는 샤오쥔입니다');
  const text = yangTranscript.segments.map((segment) => segment.text).join('\n');
  assert.doesNotMatch(text, /보고 싶지 않은 건가요\?/);
  assert.doesNotMatch(text, /장샤오쥔\(张小珺\)의 《전통》을 들어주셔서 감사합니다/);
  assert.doesNotMatch(text, /장샤오쥔\(张小珺\)의 비즈니스 인터뷰를 들어주셔서 감사합니다/);
  assert.match(text, /이 프로그램은 ‘언어 및 세계 스튜디오’가 제작한 심층 인터뷰 프로그램입니다/);
  assert.match(text, /오늘의 게스트는 Moonshot AI\(문샷 AI\)의 창립자 겸 CEO 양즈린\(杨植麟\)입니다/);
  assert.ok(yangTranscript.segments.some((segment) => segment.start > 70 && segment.text === '안녕하세요, 여러분'));
  assert.equal(yangTranscript.segments.length, 2511);
  assert.equal(new Set(yangTranscript.segments.map((segment) => segment.id)).size, 2511);
});

test('Liang Wenfeng header exposes the same structured live chapter contract as the other voice readers', () => {
  assert.match(liangReaderSource, /id="currentChapterNumber">00<\/span>/);
  assert.match(liangReaderSource, /class="header-mobile-title">량원펑 회의 기록: Overview<\/span>/);
  assert.match(liangReaderSource, /id="readingStatus" class="is-overview" aria-label="OVERVIEW"><span class="reading-status-number"><\/span><span class="reading-status-separator" aria-hidden="true">\. <\/span><span class="reading-status-title">OVERVIEW<\/span><\/span>/);
  assert.match(liangReaderSource, /<script src="\.\.\/reader-runtime\.js"><\/script>/);
  assert.match(liangReaderSource, /readerStatus=CarrotReader\.createStatusController\(\{readerTitle:'량원펑 회의 기록'\}\)/);
  assert.match(liangReaderSource, /readerStatus\.setChapter\(n,chapterTitle\)/);
  assert.match(liangReaderSource, /readerStatus\.set\(topic\.querySelector\('\.topic-number'\)\?\.textContent\|\|'',topic\.querySelector\('h3'\)\?\.textContent\|\|'',true\)/);
  assert.match(liangReaderStyles, /\.header-status #readingStatus \{[^}]*text-overflow:ellipsis/);
  assert.match(liangReaderStyles, /@media \(max-width:999px\) \{[\s\S]*?#currentChapterNumber, \.header-site-title \{ display:none; \}[\s\S]*?\.header-mobile-title \{ display:block;/);
  assert.doesNotMatch(liangReaderStyles, /#readingStatus\s*\{[^}]*display\s*:\s*none/);
});

test('voice readers share the ordinary site footer information structure', () => {
  for (const source of [liaoReaderSource, liangReaderSource, yangReaderSource, samReaderSource]) {
    assert.equal((source.match(/<footer class="voice-shared-footer">/g) ?? []).length, 1);
    assert.equal((source.match(/class="voice-footer-rabbit-carrot"/g) ?? []).length, 1);
    assert.equal((source.match(/voice-footer-cave-scene/g) ?? []).length, 0);
    assert.equal((source.match(/class="voice-shared-footer__copy"/g) ?? []).length, 1);
    assert.equal((source.match(/class="voice-shared-footer__social-icon"/g) ?? []).length, 2);
    const insightsOpenTag = source.match(/<section(?=[^>]*\bid="insights")[^>]*>/)?.[0] || '';
    assert.match(insightsOpenTag, /\bclass="[^"]*\bcarrot-cave-insights\b[^"]*\bappendix\b[^"]*"/);
    assert.match(source, /<strong>CARROT CAVE<\/strong> by Simon Kim/);
    assert.match(source, /href="mailto:simon@hashed\.com"/);
    assert.match(source, /href="https:\/\/x\.com\/simonkim_nft"/);
    assert.match(source, /href="https:\/\/t\.me\/carrotcave"/);
    assert.doesNotMatch(source, /cave-journey-final\.svg|voice-shared-footer__contact|voice-shared-footer__socials|READER EDITION|MINIMALLY EDITED TRANSCRIPT|A project by Simon Kim at Hashed|처음으로 ↑/);
  }
  assert.match(voiceReaderSystemStyles, /\.voice-shared-footer__inner \{ width: 100%; max-width: 1100px;/);
  assert.match(voiceReaderSystemStyles, /\.voice-shared-footer__copy \.voice-shared-footer__links \{[\s\S]*?display: flex;[\s\S]*?flex-wrap: nowrap;[\s\S]*?white-space: nowrap;/);
});

test('CARROT CAVE INSIGHTS structurally shares the interview method and source bullet rhythm', () => {
  for (const source of [liaoReaderSource, liangReaderSource, yangReaderSource, samReaderSource]) {
    const insightsOpenTag = source.match(/<section(?=[^>]*\bid="insights")[^>]*>/)?.[0] || '';
    assert.match(insightsOpenTag, /\bclass="[^"]*\bcarrot-cave-insights\b[^"]*\bappendix\b[^"]*"/);
  }
  assert.doesNotMatch(voiceReaderSystemStyles, /#insights\s*>\s*ul/);
});

test('archive and recommendation cards share description typography and restrained image treatment', () => {
  assert.match(stylesSource, /\.wall-card__abstract\{[^}]*font:500 13px\/1\.5 var\(--sans\);letter-spacing:-\.015em/);
  assert.match(stylesSource, /\.cave-constellation__thumbnail p\{[^}]*font:500 13px\/1\.5 var\(--sans\)!important;letter-spacing:-\.015em!important/);
  assert.match(stylesSource, /\.cave-constellation__thumbnail::after\{[^}]*linear-gradient\(to top,rgba\(10,12,14,\.72\) 0,rgba\(10,12,14,\.38\) 42%,transparent 78%\)/);
  assert.doesNotMatch(stylesSource, /\.cave-constellation__thumbnail::after\{[^}]*rgba\(10,12,14,\.97\)/);
  assert.match(caveConstellationSource, /className="cave-constellation__carrot" aria-hidden="true"/);
  assert.match(stylesSource, /:root\{[^}]*--carrot-orange:#f28c28;--carrot-orange-ink:#9c4a06;--carrot-leaf:#79a85b;/);
  assert.match(stylesSource, /\.cave-constellation__carrot\{[^}]*width:12px;height:20px[^}]*var\(--carrot-leaf\)[^}]*rotate\(22deg\)/);
  assert.match(stylesSource, /\.cave-constellation__carrot::after\{[^}]*top:5px;left:2px;width:9px;height:15px[^}]*clip-path:polygon\(12% 0,100% 8%,62% 100%,39% 86%,0 8%\)[^}]*var\(--carrot-orange\)/);
  assert.doesNotMatch(caveConstellationSource, /<span aria-hidden="true">→<\/span>/);
});

test('ordinary posts use the same graphite reading surface and typography as voice readers', () => {
  assert.match(postSource, /className="post-reader-page min-h-screen"/);
  assert.match(postSource, /<article className="post-reader-article">/);
  assert.match(postSource, /className="post-reader-header"/);
  assert.match(postSource, /className="post-content"/);
  assert.match(postSource, /readingBackHref=\{`\/\?section=\$\{encodeURIComponent\(post\.category\)\}`\}/);
  assert.match(postSource, /readingBackLabel=\{`\$\{post\.category\} 목록으로 돌아가기`\}/);
  assert.match(headerSource, /className="cc-reading-back-chevron" aria-hidden="true">‹<\/span>/);
  assert.match(stylesSource, /\.cc-header--reading \.cc-brand\{width:44px;min-height:44px;gap:0\}/);
  assert.doesNotMatch(stylesSource, /\.cc-header--reading \.cc-brand\{width:34px\}/);
  assert.match(stylesSource, /\.cc-reading-back-chevron\{[^}]*font:400 28px\/1 var\(--sans\)/);
  assert.doesNotMatch(postSource, /linear-gradient\(180deg, #060A14/);
  assert.doesNotMatch(postSource, /fontFamily: "'Noto Serif KR'/);
  assert.match(stylesSource, /--post-reader-sans:var\(--sans\)/);
  assert.match(stylesSource, /\.post-reader-page\{[^}]*background:var\(--graphite\)/);
  assert.match(stylesSource, /\.post-reader-page\{[^}]*--reader-measure:680px[^}]*--reader-body-size:17px[^}]*--reader-body-leading:1\.9/);
  assert.match(stylesSource, /\.post-content p\{margin:0 0 24px;color:#e7e7e8/);
  assert.doesNotMatch(postSource, /return <br key=\{i\} \/>/);
  assert.match(stylesSource, /\.post-reader-article\{[^}]*max-width:var\(--reader-measure\)/);
  assert.match(stylesSource, /\.post-content\{[^}]*font:400 var\(--reader-body-size\)\/var\(--reader-body-leading\) var\(--post-reader-sans\)/);
  assert.match(stylesSource, /\.post-content p\{[^}]*color:#e7e7e8/);
  assert.match(stylesSource, /\.post-content :is\(h2,h3\)\{[^}]*color:#fff/);
  assert.match(stylesSource, /\.post-content a\{[^}]*color:var\(--reader-accent\)[^}]*text-decoration:underline/);
});

test('ordinary post bodies suppress a duplicated title line or title-prefixed opening sentence', async () => {
  const { posts } = await import('../data/posts.ts');
  assert.match(postSource, /function stripLeadingDuplicateTitle\(content: string, title: string\)/);
  assert.match(postSource, /stripLeadingDuplicateTitle\(stripTrailingReactionSignature\(post\.content\), post\.title\)/);
  assert.match(syncSource, /content: stripLeadingDuplicateTitle\(stripTrailingReactionSignature\(content \|\| fullText\), title\)/);
  assert.match(syncSource, /stripLeadingDuplicateTitle\(\s*stripTrailingReactionSignature\(msg\.content/);
  assert.match(syncSource, /updateContent\(src, slug, msg\.fullText, msg\.title\)/);

  const normalize = (value) => value.normalize('NFKC').trim().replace(/^#{1,6}\s+/, '').replace(/\s+/g, ' ').replace(/[.!?。！？]+$/, '').trim().toLocaleLowerCase('ko-KR');
  const remainingTitlePrefixes = posts.filter((post) => {
    const firstLine = post.content.split('\n').find((line) => line.trim())?.trim() || '';
    if (!firstLine) return false;
    const normalizedTitle = normalize(post.title);
    const normalizedLine = normalize(firstLine);
    return normalizedLine === normalizedTitle || normalizedLine.startsWith(`${normalizedTitle} `);
  });
  assert.deepEqual(remainingTitlePrefixes.map((post) => post.slug), []);
});

test('post details share three clean actions without Telegram reaction labels or counts', () => {
  assert.doesNotMatch(postSource, /\{post\.reactions\}|>텔레그램 반응<\/span>/);
  assert.match(postSource, /<nav className="post-reader-actions post-reader-actions--after-content" aria-label="글 이동">/);
  assert.match(postSource, /className="post-reader-action"/);
  assert.match(postSource, /<PostShareButton title=\{post\.title\} path=\{`\/posts\/\$\{post\.slug\}`\} \/>/);
  assert.match(postSource, /className="post-reader-action post-reader-action--telegram"/);
  assert.match(postSource, /텔레그램 채널에서 보기/);
  assert.equal((postSource.match(/axisDestinationLabel\(post\)/g) || []).length, 1);
  assert.match(stylesSource, /\.post-reader-actions\{[^}]*display:grid[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(stylesSource, /\.post-reader-action\{[^}]*min-height:62px[^}]*border:0[^}]*background:#167f78/);
  assert.match(stylesSource, /\.post-reader-action\{[^}]*background:#167f78;color:#fff/);
  assert.match(stylesSource, /\.post-reader-action--share\{background:#285b59;color:#e5f4f2\}/);
  assert.match(stylesSource, /\.post-reader-action--telegram\{background:#3a3d45;color:#c8cbd0\}/);
  assert.match(stylesSource, /\.post-reader-actions\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\);gap:7px\}/);
  assert.match(postSource, /stripTrailingReactionSignature\(post\.content\)/);
  assert.match(syncSource, /function stripTrailingReactionSignature\(content\)/);
  assert.match(syncSource, /content: stripLeadingDuplicateTitle\(stripTrailingReactionSignature\(content \|\| fullText\), title\)/);
  assert.match(syncSource, /stripTrailingReactionSignature\(msg\.content/);
  assert.match(syncSource, /stripTrailingReactionSignature\(newText\), title\)/);
});

test('post media stays inside the article viewport on mobile', () => {
  assert.match(postSource, /className="post-media-grid"/);
  assert.match(stylesSource, /\.post-media-grid\{[^}]*width:100%[^}]*min-width:0[^}]*grid-template-columns:/);
  assert.match(stylesSource, /\.post-media-grid img\{[^}]*max-width:100%[^}]*min-width:0/);
  assert.doesNotMatch(postSource, /marginLeft: '-2rem'|marginRight: '-2rem'/);
});

test('editorial categories follow the reader reward rather than development keywords', () => {
  for (const title of [
    '기억은 언제 행동이 되는가: MemKraft v3까지 업데이트 노트',
    'MemKraft v1.0 개발 후기 — 에이전트 장기 기억 벤치마크 1위',
    'MemKraft v0.6 – v0.8 개발 후기',
    'MemKraft v0.2 – v0.5 개발 후기',
    'MemKraft 개발 후기 - 알아서 똑똑해지는 에이전트 메모리 시스템',
  ]) {
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(postsSource, new RegExp(`title: '${escaped}',[\\s\\S]{0,160}?category: '빌딩'`));
  }
  assert.match(postsSource, /slug: 'uae-emergency-news-telegram-channel',[\s\S]{0,160}?category: '빌딩'/);
  for (const slug of ['post-165', 'post-164']) {
    assert.match(postsSource, new RegExp(`slug: '${slug}',[\\s\\S]{0,240}?category: '빌딩'`));
    assert.equal(ontologyIndex.nodes[slug].category, '빌딩');
  }
  assert.equal(ontologyIndex.nodes['uae-emergency-news-telegram-channel'].category, '빌딩');
  assert.match(syncSource, /만들었다·구축했다·출시했다·배포했다·운영했다[\s\S]*빌딩을 우선/);
  assert.match(syncSource, /해커톤·위켄드톤·빌더 이벤트를 직접 기획·주최·운영했거나 공동 제작·제작 지원으로 참여한 기록도 빌딩을 우선/);
  assert.match(postsSource, /slug: 'post-191',[\s\S]{0,240}?category: '탐험'/);
  assert.equal(ontologyIndex.nodes['post-191'].category, '탐험');
  assert.match(syncSource, /개발 경험과 제작 사례가 등장하더라도[\s\S]*일반화된 명제·해석·전망을 논증하는 것이 주된 독자 보상이면 탐험/);
  assert.match(syncSource, /구현 과정·시행착오·출시·운영 결과 자체가 주된 독자 보상이면 빌딩/);
  assert.match(syncSource, /const ALLOWED_CATEGORIES = new Set\(\['탐험', '빌딩', '낙서', '소설'\]\)/);
  assert.match(syncSource, /replace\(\/\^\[\^\\p\{L\}\]\+\/u, ''\)[\s\S]*ALLOWED_CATEGORIES\.has\(normalizedCategory\)[\s\S]*throw new Error\(`Invalid category:/);
  assert.match(postSource, /href=\{`\/\?section=\$\{encodeURIComponent\(axisOf\(post\)\)/);
  assert.match(postSource, /\{axisDestinationLabel\(post\)\}/);
  assert.doesNotMatch(postSource, /탐험로 돌아가기/);
});

test('category names are stored without decorative icons across production data and generators', () => {
  const forbiddenLabels = [
    ['🐇', '탐험'],
    ['🛠️', '빌딩'],
    ['✍️', '낙서'],
    ['📖', '소설'],
  ].map((parts) => parts.join(' '));
  for (const source of [postsSource, syncSource, axisRailSource, JSON.stringify(ontologyIndex)]) {
    for (const label of forbiddenLabels) assert.ok(!source.includes(label));
  }
  assert.match(axisRailSource, /return post\.category;/);
  assert.doesNotMatch(axisRailSource, /post\.category\.replace/);
});

test('voice thumbnails use content abstracts instead of transcript-format descriptions', () => {
  assert.match(interviewSource, /summary: string;/);
  assert.equal((interviewSource.match(/\n\s+summary: '/g) ?? []).length, 5);
  assert.match(voiceListSource, /summary=\{item\.summary\}/);
  assert.doesNotMatch(voiceListSource, /summary=\{item\.description\}/);
  assert.doesNotMatch(stylesSource, /\.wall-card--voice \.wall-card__abstract\{[^}]*-webkit-line-clamp/);
});

test('post thumbnails replace sequence numbers with a prominent publication-date stamp', () => {
  assert.doesNotMatch(homeSource, /const number = String\(index \+ 1\)\.padStart/);
  assert.doesNotMatch(homeSource, /<span>\{number\}<\/span>/);
  assert.match(homeSource, /date=\{post\.date\}/);
  assert.match(editorialCardSource, /<time className="wall-card__date" dateTime=\{date\}>/);
  assert.doesNotMatch(editorialCardSource, /<time[^>]*aria-label=/);
  assert.match(editorialCardSource, /<span className="sr-only">발행일 \{date\.replaceAll\('-', '\.'\)\}<\/span>/);
  assert.match(editorialCardSource, /<span className="wall-card__date-visual" aria-hidden="true">/);
  assert.match(editorialCardSource, /date\.split\('-'\)\.map/);
  assert.match(editorialCardSource, /className="wall-card__date-part"/);
  assert.match(stylesSource, /\.sr-only\{[^}]*position:absolute[^}]*clip:/);
  assert.doesNotMatch(voiceListSource, /String\(index \+ 1\)\.padStart/);
  assert.match(stylesSource, /\.wall-card__date\{[^}]*display:flex[^}]*font:/);
  assert.match(stylesSource, /\.wall-card__date-part\{[^}]*border-right:/);
  assert.doesNotMatch(stylesSource, /\.wall-card__meta time\{margin-left:auto\}/);
  assert.doesNotMatch(stylesSource, /\.wall-card__meta time\{display:none\}/);
  assert.match(stylesSource, /\.wall-card--actual-quote \.wall-card__date\{color:#555\}/);
  assert.match(stylesSource, /(?:^|})\.wall-card__axis\{[^}]*margin-left:auto/);
});

test('the archive wall preserves complete titles and gives image-free cards an atmospheric dense treatment', () => {
  assert.match(postsSource, /게임과 AI 에이전트 그리고 온체인 경제 - 다음 10년의 신뢰 아키텍처/);
  assert.doesNotMatch(postsSource, /다음 10년의 신뢰 아키['"]/);
  assert.match(homeSource, /wall-card--generated/);
  assert.match(stylesSource, /\.editorial-wall\{[^}]*gap:1px/);
  assert.match(stylesSource, /\.wall-card--generated\{[^}]*--card-glow:/);
  assert.match(stylesSource, /\.wall-card--generated:after\{[^}]*repeating-linear-gradient/);
  assert.match(stylesSource, /\.wall-card--with-image \.wall-card__body\{[^}]*linear-gradient[^}]*linear-gradient/);
  assert.match(stylesSource, /\.wall-card h2\{[^}]*overflow:visible/);
  assert.match(stylesSource, /\.wall-card--generated:hover:after\{[^}]*transform:/);
  assert.match(stylesSource, /@media\(prefers-reduced-motion:reduce\)[\s\S]*animation:none!important/);
});

test('the archive wall has no reserved holes and every card keeps consistent metadata and typography', () => {
  assert.doesNotMatch(stylesSource, /grid-column:6\/span 7/);
  assert.doesNotMatch(stylesSource, /grid-column:auto/);
  assert.match(stylesSource, /\.wall-card:nth-child\(4n\+1\)\{grid-column:span 7;grid-row:span 6\}/);
  assert.match(stylesSource, /\.wall-card:nth-child\(4n\+2\)\{grid-column:span 5;grid-row:span 6\}/);
  assert.match(stylesSource, /\.wall-card:nth-child\(4n\+3\)\{grid-column:span 4;grid-row:span 5\}/);
  assert.match(stylesSource, /\.wall-card:nth-child\(4n\)\{grid-column:span 8;grid-row:span 5\}/);
  assert.match(stylesSource, /\.wall-card:last-child:nth-child\(4n\+1\),\.wall-card:last-child:nth-child\(4n\+3\)\{grid-column:1\/-1\}/);
  assert.doesNotMatch(stylesSource, /nth-last-child\(2\).*?grid-column:span/);
  assert.doesNotMatch(stylesSource, /\.wall-card:nth-child\(12n\+4\) h2/);
  assert.doesNotMatch(stylesSource, /\.wall-card:nth-child\(12n\+(?:5|10)\):not\(\.wall-card--with-image\)/);
  assert.doesNotMatch(stylesSource, /\.editorial-wall:not\(\.editorial-wall--voices\) \.wall-card\{[^}]*animation:/);
  assert.doesNotMatch(stylesSource, /@keyframes cave-card-reveal/);
  assert.match(homeSource, /date=\{post\.date\}/);
  assert.match(homeSource, /summary=\{post\.summary\}/);
  assert.doesNotMatch(homeSource, /showSummary|wall-card--actual-/);
  assert.match(stylesSource, /\.wall-card h2\{[^}]*var\(--sans\)/);
  assert.match(stylesSource, /\.wall-card__abstract\{[^}]*font:500 13px\/1\.5 var\(--sans\)/);
  assert.doesNotMatch(stylesSource, /\.wall-card\[data-axis="소설"\] h2/);
  assert.match(stylesSource, /\.wall-card--uniform h2,\.wall-card--voice h2\{font-size:20px;line-height:1\.18\}/);
  assert.doesNotMatch(stylesSource, /\.wall-card--uniform (?:p|\.wall-card__abstract)\{[^}]*-webkit-line-clamp/);
  assert.doesNotMatch(stylesSource, /\.wall-card--voice \.wall-card__abstract\{[^}]*-webkit-line-clamp/);
});

test('the header symbol is slightly larger without changing header height', () => {
  assert.match(stylesSource, /\.cc-brand-symbol\{[^}]*width:38\.52px[^}]*height:38\.52px[^}]*flex:0 0 38\.52px/);
  assert.match(stylesSource, /@media\(max-width:900px\)[\s\S]*\.cc-brand-symbol\{[^}]*width:36\.38px;[^}]*height:36\.38px;[^}]*flex-basis:36\.38px/);
});

test('voice cards render a verified portrait thumbnail for every interview archive', () => {
  assert.match(interviewSource, /thumbnailUrl\?: string/);
  assert.match(interviewSource, /thumbnailUrl: '\/voices\/liao-heng\/assets\/liao-heng-portrait\.webp'/);
  assert.match(interviewSource, /thumbnailUrl: '\/voices\/liang-wenfeng\/assets\/liang-wenfeng-portrait\.webp'/);
  assert.match(interviewSource, /thumbnailUrl: '\/voices\/yang-zhilin\/assets\/yang-zhilin-portrait\.jpg'/);
  assert.match(interviewSource, /slug: 'liang-wenfeng'/);
  assert.match(interviewSource, /slug: 'yang-zhilin'/);
  assert.match(voiceListSource, /imageUrl=\{item\.thumbnailUrl\}/);
  assert.match(editorialCardSource, /className="wall-card__image"/);
  assert.match(editorialCardSource, /imageUrl \? ' wall-card--with-image' : ''/);
  assert.doesNotMatch(stylesSource, /\.wall-card--voice \.wall-card__image\{[^}]*object-position:/);
});

test('post and voice thumbnails share one complete editorial card contract', () => {
  assert.match(homeSource, /import EditorialCard from '@\/components\/EditorialCard'/);
  assert.match(voiceListSource, /import EditorialCard from '@\/components\/EditorialCard'/);
  assert.match(homeSource, /<EditorialCard/);
  assert.match(voiceListSource, /<EditorialCard/);
  assert.match(homeSource, /summary=\{post\.summary\}/);
  assert.match(homeSource, /className=\{`wall-card--uniform\$\{hasImage \? '' : ' wall-card--generated'\}`\}/);
  assert.doesNotMatch(homeSource, /showSummary|wallPatterns|wall-card--actual-/);
  assert.match(stylesSource, /\.wall-card--uniform h2,\.wall-card--voice h2\{font-size:20px;line-height:1\.18\}/);
  assert.doesNotMatch(stylesSource, /\.wall-card--uniform (?:p|\.wall-card__abstract)\{[^}]*-webkit-line-clamp/);
  assert.doesNotMatch(stylesSource, /\.wall-card--voice \.wall-card__abstract\{[^}]*-webkit-line-clamp/);
  assert.match(editorialCardSource, /<time className="wall-card__date" dateTime=\{date\}>/);
  assert.match(editorialCardSource, /<span className="wall-card__axis">\{axis\}<\/span>/);
  assert.match(editorialCardSource, /<h2>\{title\}<\/h2>/);
  assert.match(editorialCardSource, /<p className="wall-card__abstract">\{summary\}<\/p>/);
  assert.doesNotMatch(editorialCardSource, /eyebrow|doorLabel|wall-card__eyebrow|wall-card__door/);
  assert.doesNotMatch(voiceListSource, /eyebrow=|doorLabel=/);
  assert.doesNotMatch(voiceListSource, /<h2>|<p>\{item\.description\}|wall-card__meta/);
  for (const date of ['2026-07-25', '2026-07-27', '2025-08-27']) {
    assert.match(interviewSource, new RegExp(`sourcePublishedAt: '${date}'`));
  }
  assert.match(interviewSource, /Publication date of sourceUrl, not the date the interview occurred/);
  assert.doesNotMatch(stylesSource, /wall-card__eyebrow|wall-card__door/);
  assert.match(stylesSource, /\.wall-card__axis\{flex:0 0 auto;font-size:11px\}/);
  assert.match(stylesSource, /\.wall-card--voice h2\{font-size:20px/);
  assert.doesNotMatch(stylesSource, /\.wall-card--voice \.wall-card__abstract\{[^}]*-webkit-line-clamp/);
});

test('home and voice list omit the intro strip and move directly into archive navigation', () => {
  assert.doesNotMatch(homeSource, /className="cc-intro"/);
  assert.doesNotMatch(voiceListSource, /className="cc-intro"/);
  assert.doesNotMatch(homeSource, /PERSONAL ARCHIVE|SIMON KIM · SEOUL \/ EVERYWHERE/);
  assert.doesNotMatch(voiceListSource, /PERSONAL ARCHIVE|SIMON KIM · SEOUL \/ EVERYWHERE/);
  assert.doesNotMatch(voiceListSource, /공개된 대화를 선별해 번역하고/);
  assert.doesNotMatch(stylesSource, /\.cc-intro(?:__identity|__note)?/);
  assert.match(homeSource, /<SiteHeader><AxisRail active=\{active\} \/><\/SiteHeader>/);
  assert.match(voiceListSource, /<SiteHeader><AxisRail active="목소리" \/><\/SiteHeader>/);
  assert.match(voiceListSource, /<AxisRail active="목소리" \/>/);
  assert.match(axisRailSource, /active === '목소리'/);
  assert.match(voiceListSource, /className="wall-shell voices-wall"/);
  assert.match(voiceListSource, /className="editorial-wall editorial-wall--voices"/);
  assert.match(voiceListSource, /className="wall-card--voice"/);
  assert.doesNotMatch(voiceListSource, /voicePatterns|wall-card--actual-\$\{pattern\}/);
  assert.doesNotMatch(stylesSource, /\.wall-card--voice \.wall-card__body\{justify-content:flex-start\}/);
  assert.doesNotMatch(stylesSource, /\.editorial-wall\.editorial-wall--voices\{grid-auto-rows:auto\}/);
  assert.doesNotMatch(stylesSource, /\.editorial-wall--voices \.wall-card\.wall-card--voice\{grid-column:1\/-1/);
  assert.doesNotMatch(voiceListSource, /voices-route|voices-hero|voices-list|voice-card/);
  assert.doesNotMatch(stylesSource, /VOICE \/ 05|\.voices-route|\.voices-hero|\.voices-list|\.voice-card|voice-wall-card/);
  assert.match(voiceListSource, /<h1 id="wall-heading" className="wall-heading__menu-title">좋은 대화를 다시 읽을 수 있도록 남겨둡니다.<\/h1>/);
  assert.match(stylesSource, /\.wall-heading :is\(h1,h2\)/);
  assert.match(stylesSource, /#wall-heading\.wall-heading__menu-title\{font-family:var\(--sans\);margin-bottom:4px\}/);
  assert.doesNotMatch(stylesSource, /\.voices-wall \.wall-heading h1\{/);
  assert.doesNotMatch(stylesSource, /\.voices-wall \.wall-card--voice h2\{/);
  assert.match(stylesSource, /\.editorial-wall \.wall-card h2\{font:400 29px\/1\.22 var\(--sans\);letter-spacing:-\.014em\}/);
  assert.match(stylesSource, /\.editorial-wall \.wall-card \.wall-card__abstract\{font:400 12px\/1\.86 var\(--sans\);letter-spacing:0\}/);
  assert.match(stylesSource, /\.editorial-wall \.wall-card__copy\{display:grid;grid-template-columns:minmax\(0,8fr\) minmax\(0,5fr\);align-items:end;column-gap:0\}/);
  assert.match(voiceListSource, /좋은 대화를 다시 읽을 수 있도록 남겨둡니다/);
  assert.doesNotMatch(voiceListSource, /직접 묻고/);
});

test('home keeps the exact CarrotCave.com wordmark while reading headers use logo divider and title information', () => {
  assert.match(headerSource, /readingTitle\?: string/);
  assert.match(headerSource, /cc-reading-divider/);
  assert.match(headerSource, /cc-reading-title/);
  assert.match(headerSource, /readingTitle \? 'cc-header cc-header--reading' : 'cc-header'/);
  assert.match(headerSource, /\{!readingTitle && [\s\S]*>CarrotCave<span className="cc-brand-domain">\.com<\/span>/);
  assert.match(postSource, /<SiteHeader[\s\S]*?readingTitle=\{post\.title\}[\s\S]*?readingMeta=/);
  assert.doesNotMatch(postSource, /<SiteHeader\s*\/>/);
  assert.match(liaoReaderSource, /class="reader-divider"/);
  assert.doesNotMatch(liaoReaderSource, /<span>CARROT CAVE<\/span>/);
});

test('brand logo asset and rendered marks are square', () => {
  assert.match(headerSource, /<CarrotCaveMark className="cc-brand-symbol" \/>/);
  assert.match(liaoReaderSource, /<svg class="brand-mark"[^>]*width="192" height="192"/);
  assert.match(stylesSource, /\.cc-brand-symbol\{[^}]*width:38\.52px;[^}]*height:38\.52px/);
  assert.match(liaoReaderStyles, /\.brand-mark\s*\{[^}]*width:\s*32px;[^}]*height:\s*32px/);
});

test('all voice readers expose one uncluttered return control to the voice list', () => {
  assert.doesNotMatch(voiceReaderSource, /<header className="voice-reader-header">/);
  assert.doesNotMatch(voiceReaderSource, /voice-reader-source|>원본/);
  for (const source of [liaoReaderSource, liangReaderSource, yangReaderSource]) {
    assert.match(source, /class="brand" href="\/voices" target="_top" aria-label="목소리 목록으로 돌아가기"/);
    assert.match(source, /class="reader-back-chevron" aria-hidden="true">‹<\/span>/);
    assert.match(source, /<header class="site-header">[\s\S]*class="reader-divider"[\s\S]*class="header-status"[\s\S]*<\/header>/);
  }
  assert.match(liaoReaderStyles, /\.site-header\s*\{[^}]*grid-template-columns:/);
});

test('CARROT CAVE surfaces use the generated carrot-cave symbol instead of dot marks', () => {
  assert.match(headerSource, /import CarrotCaveMark/);
  assert.match(headerSource, /<CarrotCaveMark className="cc-brand-symbol" \/>/);
  assert.match(liaoReaderSource, /<svg class="brand-mark"[^>]*viewBox="0 0 96 96"/);
  assert.match(liaoReaderSource, /class="brand-mark__cave"/);
  assert.doesNotMatch(headerSource, /<i aria-hidden="true"\s*\/>/);
  assert.doesNotMatch(liaoReaderStyles, /\.brand-mark[^}]*border-radius:\s*50%/);
});

test('every post prefers its first image and falls back to a checked-in video still', () => {
  assert.match(socialMetadataSource, /post\.mediaUrls\?\.\[0\] \?\? \(post\.videoUrls\?\.\[0\] \? `\/media\/posters\/\$\{post\.slug\}\.jpg` : undefined\)/);
  assert.match(homeSource, /const imageUrl = archiveImageUrl\(post\)/);
  assert.match(homeSource, /imageUrl=\{imageUrl\}/);
  assert.match(editorialCardSource, /imageUrl \? ' wall-card--with-image' : ''/);
  assert.match(editorialCardSource, /\{imageUrl && \(\s*<Image/);
  assert.doesNotMatch(homeSource, /hasImage && \['portal', 'portrait', 'landscape'\]\.includes\(pattern\)/);
});

test('archive pages avoid redundant intro and counts already exposed by the axis menu', () => {
  assert.doesNotMatch(homeSource, /WRITINGS|VOICE ARCHIVE/);
  assert.doesNotMatch(voiceListSource, /WRITINGS|VOICE ARCHIVE/);
  assert.doesNotMatch(homeSource, /className="cc-intro"/);
  assert.doesNotMatch(voiceListSource, /className="cc-intro"/);
});

test('all voice readers use one flat mobile chapter menu without quoted summary rows', () => {
  for (const source of [liaoReaderSource, liangReaderSource, yangReaderSource]) {
    const drawer = source.match(/<aside class="toc-drawer"[\s\S]*?<\/aside>/)?.[0] || '';
    assert.ok(drawer, 'reader must include the mobile table of contents');
    assert.doesNotMatch(drawer, /<details|<summary|<ul|<li/);
    assert.match(drawer, /class="insights-link"[^>]*href="#insights"[^>]*><span>00<\/span> CARROT CAVE INSIGHTS/);
    assert.doesNotMatch(source, /summary-block|id="summary"|href="#summary"|class="summary-link"/);
    assert.match(drawer, /class="toc-chapter-link"[^>]*data-nav-chapter="1"[^>]*><span>01<\/span><span(?:\s+class="[^"]+")?>/);
    for (const [, target] of drawer.matchAll(/href="#([^"]+)"/g)) {
      assert.match(source, new RegExp(`id="${target}"`), `drawer target #${target} must exist`);
    }
  }
});

test('voice thumbnails use the same editorial card system as other archive entries', () => {
  assert.match(voiceListSource, /<EditorialCard/);
  assert.match(voiceListSource, /className="wall-card--voice"/);
  assert.doesNotMatch(voiceListSource, /voicePatterns|wall-card--actual-\$\{pattern\}/);
  assert.doesNotMatch(voiceListSource, /wall-card__facts|<dl|<dt|<dd/);
  assert.doesNotMatch(stylesSource, /editorial-wall\.editorial-wall--voices\{grid-auto-rows:auto\}/);
  assert.doesNotMatch(stylesSource, /wall-card\.wall-card--voice\{grid-column:1\/-1/);
  assert.doesNotMatch(stylesSource, /wall-card--voice \.wall-card__body\{justify-content:flex-start\}/);
});

test('posts and voices share one standard card format at every breakpoint', () => {
  assert.match(stylesSource, /\.editorial-wall \.wall-card\{grid-column:span 6;grid-row:span 4;min-height:0\}/);
  assert.match(stylesSource, /@media\(max-width:520px\)\{\.wall-heading #wall-heading\{font-size:21px\}\.editorial-wall \.wall-card\{width:100%;min-height:217\.62px\}/);
  assert.match(stylesSource, /\.editorial-wall \.wall-card:nth-child\(n\)\{min-height:217\.62px\}/);
});

test('wide desktop archive rows render two uninterrupted cards', () => {
  assert.match(stylesSource, /\.editorial-wall \.wall-card\{grid-column:span 6;grid-row:span 4;min-height:0\}/);
  assert.doesNotMatch(stylesSource, /cave-depth-divider|cave-journey-scene/);
});

test('desktop chrome and archive surfaces share one 1100px content container', () => {
  assert.match(stylesSource, /--site-container:1100px/);
  for (const selector of ['cc-header__inner', 'wall-heading', 'editorial-wall', 'cc-footer__inner']) {
    assert.match(stylesSource, new RegExp(`\\.${selector}\\{[^}]*max-width:var\\(--site-container\\)`));
  }
  assert.doesNotMatch(stylesSource, /\.axis-rail__inner\{[^}]*max-width:var\(--site-container\)/);
  assert.match(headerSource, /className="cc-header__inner"/);
  assert.match(axisRailSource, /className="axis-rail__inner"/);
  assert.match(footerSource, /className="cc-footer__inner"/);
});

test('home keeps all six axes visible on mobile', () => {
  assert.doesNotMatch(homeSource, /토끼를 따라왔는데|생각이 길을 잃었습니다/);
  assert.match(stylesSource, /\.axis-rail__inner\{[^}]*grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
  assert.match(stylesSource, /@media\(max-width:900px\).*?\.axis-rail__inner\{[^}]*grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/s);
  assert.doesNotMatch(stylesSource, /@media\(max-width:900px\).*?\.axis-rail\{[^}]*overflow-x:auto/s);
});

test('home uses one ordered editorial system for the complete post and voice archive', () => {
  assert.match(homeSource, /<h1 id="wall-heading" className="wall-heading__menu-title">/);
  assert.match(voiceListSource, /<h1 id="wall-heading" className="wall-heading__menu-title">/);
  assert.match(stylesSource, /#wall-heading\.wall-heading__menu-title\{font-family:var\(--sans\);margin-bottom:4px\}/);
  assert.doesNotMatch(stylesSource, /\.voices-wall \.wall-heading h1\{/);
  assert.doesNotMatch(homeSource, /<h2 id="wall-heading">/);
  assert.match(homeSource, /<AxisRail active=\{active\} \/>/);
  assert.match(axisRailSource, /className="axis-rail"/);
  assert.match(homeSource, /className="editorial-wall"/);
  assert.match(homeSource, /visibleEntries\.map\(\(entry, index\)/);
  assert.match(homeSource, /summary=\{post\.summary\}/);
  assert.match(homeSource, /summary=\{interview\.summary\}/);
  assert.doesNotMatch(homeSource, /wallPatterns|showSummary|wall-card--actual-/);

  assert.doesNotMatch(homeSource, /visiblePosts\.slice\(0, 8\)/);
  assert.doesNotMatch(homeSource, /className="archive-list"/);
  assert.doesNotMatch(homeSource, /className="featured-note"/);
  assert.doesNotMatch(homeSource, /className="axis-grid"/);
});

test('post details publish exactly one CaveConstellation and no legacy relation surfaces', () => {
  assert.match(postSource, /import CaveConstellation from ['"]@\/components\/CaveConstellation['"]/);
  assert.equal((postSource.match(/<CaveConstellation\b/g) || []).length, 1, 'post page must render exactly one CaveConstellation');

  for (const legacySurface of [
    'TimelineView',
    'KnowledgeGraphWrapper',
    'getScoreColor',
    'getRelatedPosts',
    'relationsData',
    'aiRelations',
    'r.score',
    'AI가 분석한 연관도',
    '연관도',
  ]) {
    assert.ok(!postSource.includes(legacySurface), `post page must not retain legacy relation surface: ${legacySurface}`);
  }
});

test('legacy relation component source files are removed', () => {
  for (const component of [
    'TimelineView.tsx',
    'RelatedPopover.tsx',
    'KnowledgeGraphWrapper.tsx',
    'KnowledgeGraph.tsx',
  ]) {
    assert.equal(
      existsSync(new URL(`../components/${component}`, import.meta.url)),
      false,
      `legacy component must be absent: components/${component}`,
    );
  }
});
