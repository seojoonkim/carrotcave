import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('the complete archive combines ordinary posts and voices without changing category filters', async () => {
  const [home, rail] = await Promise.all([read('app/page.tsx'), read('components/AxisRail.tsx')]);
  assert.match(home, /import \{ interviews, InterviewArchive \} from '@\/data\/interviews';/);
  assert.match(home, /active\s*\? visiblePosts\.map/);
  assert.match(home, /\.\.\.interviews\.map\(\(interview\) => \(\{ kind: 'voice' as const, date: interview\.sourcePublishedAt, interview \}\)\)/);
  assert.match(home, /entry\.kind === 'post'[\s\S]*?<VoiceWallCard/);
  assert.match(home, /<span>\{visibleEntries\.length\} ENTRIES<\/span>/);
  assert.match(rail, /<b>전체<\/b><span>\{posts\.length \+ interviews\.length\}<\/span>/);
});

test('archive cards follow one ordered asymmetric rhythm at desktop, tablet, and mobile', async () => {
  const [css, card] = await Promise.all([read('app/globals.css'), read('components/EditorialCard.tsx')]);
  assert.match(css, /\.editorial-wall\{grid-auto-flow:row;grid-auto-rows:82px;gap:18px;background:transparent\}/);
  assert.match(card, /data-rhythm=\{rhythm\}/);
  assert.match(css, /\.wall-card\[data-rhythm='0'\]\{grid-column:span 7;grid-row:span 6\}/);
  assert.match(css, /\.wall-card\[data-rhythm='1'\]\{grid-column:span 5;grid-row:span 6\}/);
  assert.match(css, /\.wall-card\[data-rhythm='2'\]\{grid-column:span 4;grid-row:span 5\}/);
  assert.match(css, /\.wall-card\[data-rhythm='3'\]\{grid-column:span 8;grid-row:span 5\}/);
  assert.match(css, /@media\(max-width:900px\)\{\.editorial-wall\{grid-template-columns:repeat\(6,minmax\(0,1fr\)\);grid-auto-rows:74px;gap:14px\}/);
  assert.match(css, /@media\(max-width:520px\)\{\.editorial-wall\{display:flex;flex-direction:column;gap:14px\}/);
  assert.match(css, /\.wall-card\[data-rhythm\]\{width:100%;min-height:260px\}/);
  assert.match(css, /\.wall-card\[data-rhythm='1'\]\{min-height:290px\}/);
  assert.match(css, /\.wall-card\[data-rhythm='2'\]\{min-height:240px\}/);
  assert.match(css, /\.wall-card--voice\[data-rhythm\]\{min-height:290px\}/);
  assert.match(css, /\.wall-card__meta\{[^}]*font:500 10px var\(--mono\)/);
  assert.match(css, /\.wall-card__date\{[^}]*font:600 calc\(clamp\(9px,1vw,12px\) \+ 2px\)\/1 var\(--mono\)/);
  assert.match(css, /\.wall-card h2\{font-weight:600;line-height:1\.26;letter-spacing:-\.015em\}/);
  assert.match(css, /\.wall-card__abstract\{[^}]*font:400 15px\/1\.65 var\(--serif\)/);
  assert.match(css, /@media\(max-width:520px\)[^\n]*\.wall-card__date\{font-size:11px\}[^\n]*\.wall-card h2,\.wall-card--actual-index h2\{font-size:20px[^\n]*\.wall-card__abstract\{font-size:14px\}/);
  const finalArchiveBlock = css.slice(css.indexOf('/* Asymmetric archive:'));
  assert.doesNotMatch(finalArchiveBlock, /grid-auto-flow:row dense/);
});

test('header uses the exact CarrotCave.com wordmark and a restrained motion loop', async () => {
  const [css, readerCss, header, layout] = await Promise.all([
    read('app/globals.css'),
    read('public/voices/reader-system.css'),
    read('components/SiteHeader.tsx'),
    read('app/layout.tsx'),
  ]);
  assert.match(header, />CarrotCave<span className="cc-brand-domain">\.com<\/span>/);
  assert.match(header, /aria-label=\{readingTitle \? readingBackLabel : 'CarrotCave\.com 홈'\}/);
  assert.match(layout, /title: 'CarrotCave\.com · 토끼를 따라왔는데, 생각이 길을 잃었습니다\.'/);
  assert.match(css, /\.cc-brand-name\{[^}]*font-size:15px/);
  assert.match(css, /\.cc-brand-domain\{font-size:10px;color:var\(--muted\)/);
  assert.match(css, /\.cc-brand-symbol\{[^}]*transform:scale\(1\.07\)/);
  assert.match(css, /animation:cc-logo-hop 8s/);
  assert.match(css, /@keyframes cc-logo-hop/);
  assert.match(css, /\.cc-header--reading \.cc-brand\{width:44px;min-height:44px/);
  assert.match(readerCss, /\.reader-nav \.brand-mark \{[^}]*transform: scale\(1\.07\);/);
  assert.match(readerCss, /\.reader-nav, \.reader-nav \.brand \{ width: 44px; height: 44px; \}/);
});

test('video-only posts use checked-in still frames as archive thumbnails', async () => {
  const [home, posts] = await Promise.all([read('app/page.tsx'), read('data/posts.ts')]);
  const videoOnlySlugs = ['majlis', 'ip-tvw', 'messenger-b2a', 'robot-goku-5000'];
  assert.match(home, /function archiveImageUrl\(post: Post\)/);
  assert.match(home, /post\.videoUrls\?\.\[0\] \? `\/media\/posters\/\$\{post\.slug\}\.jpg`/);
  assert.match(home, /const imageUrl = archiveImageUrl\(post\)/);
  assert.match(home, /imageUrl=\{imageUrl\}/);
  for (const slug of videoOnlySlugs) {
    assert.match(posts, new RegExp(`slug: '${slug}'[\\s\\S]*?videoUrls:`));
    await read(`public/media/posters/${slug}.jpg`);
  }
});

test('archive thumbnail type and contrast remain legible without restoring image filters', async () => {
  const css = await read('app/globals.css');
  assert.match(css, /\.wall-card--uniform h2,\.wall-card--voice h2\{font-size:20px/);
  assert.match(css, /\.wall-card__axis\{[^}]*font-size:11px/);
  assert.match(css, /\.wall-card--with-image \.wall-card__body\{background:linear-gradient\(180deg,rgba\(8,10,14,\.49\)/);
  assert.doesNotMatch(css, /\.wall-card__image\{[^}]*filter:/);
});

test('shared footer publishes Simon contact and Telegram links on both archive pages', async () => {
  const [footer, home, voices] = await Promise.all([
    read('components/SiteFooter.tsx'),
    read('app/page.tsx'),
    read('app/voices/page.tsx'),
  ]);
  assert.match(footer, /Simon Kim/);
  assert.match(footer, /href="mailto:simon@hashed\.com">simon@hashed\.com<\/a>/);
  assert.match(footer, /href="https:\/\/x\.com\/simonkim_nft" target="_blank" rel="noreferrer">X ↗<\/a>/);
  assert.match(footer, /href="https:\/\/t\.me\/carrotcave" target="_blank" rel="noreferrer"/);
  assert.match(home, /<SiteFooter \/>/);
  assert.match(voices, /<SiteFooter \/>/);
});

test('archive scrolling uses one simple compositor-safe surface at every width', async () => {
  const css = await read('app/globals.css');
  assert.match(css, /\.cc-header\{[^}]*background:#282b32\}/);
  assert.match(css, /\.axis-rail\{[^}]*background:var\(--graphite\);border-bottom/);
  assert.match(css, /\.wall-card\{[^}]*transition:background \.2s,border-color \.2s\}/);
  assert.match(css, /\.wall-card:hover\{[^}]*background:#30343c\}/);
  assert.match(css, /\.wall-card__image\{[^}]*opacity:\.56;z-index:0\}/);
  assert.match(css, /\.wall-card\{box-shadow:none\}\.wall-card--generated:after\{display:none\}/);
  assert.doesNotMatch(css, /\.cc-header\{[^}]*backdrop-filter/);
  assert.doesNotMatch(css, /\.axis-rail\{[^}]*backdrop-filter/);
  assert.doesNotMatch(css, /\.wall-card:hover\{[^}]*transform/);
  assert.doesNotMatch(css, /\.wall-card__image\{[^}]*filter:/);
  assert.doesNotMatch(css, /\.wall-card__image\{[^}]*transition:/);
});

test('rabbit journey illustrations live only in structural seams and end at the footer', async () => {
  const [home, scene, footer, rail, card, css] = await Promise.all([
    read('app/page.tsx'),
    read('components/CaveJourneyScene.tsx'),
    read('components/SiteFooter.tsx'),
    read('components/AxisRail.tsx'),
    read('components/EditorialCard.tsx'),
    read('app/globals.css'),
  ]);
  assert.match(home, /const journeyStep = active \? Math\.max\(8, Math\.ceil\(visibleEntries\.length \/ 3\)\) : 19/);
  assert.match(home, /className="cave-depth-divider" data-depth=\{depth\}/);
  assert.match(home, /depth <= 5/);
  assert.match(footer, /<CaveJourneyScene depth=\{6\} \/>/);
  assert.match(rail, /className="axis-rail__carrot" aria-hidden="true"/);
  assert.doesNotMatch(card, /CaveJourneyScene|cave-depth-divider|axis-rail__carrot/);
  assert.match(scene, /aria-hidden="true"/);
  assert.match(scene, /focusable="false"/);
  assert.match(css, /\.cave-depth-divider\{grid-column:1\/-1;grid-row:span 2/);
  assert.match(css, /@media\(max-width:520px\)[^\n]*\.cave-depth-divider\{display:grid;grid-template-columns:auto 1fr;min-height:84px/);
  assert.doesNotMatch(css, /\.cave-journey-scene[^}]*animation:/);
});

test('editorial surface uses local IBM Plex, a subtle static gradient, and complete social metadata', async () => {
  const [layout, css] = await Promise.all([read('app/layout.tsx'), read('app/globals.css')]);
  const og = await readFile(new URL('public/opengraph-image.png', root));
  assert.match(layout, /IBM_Plex_Sans_KR/);
  assert.match(layout, /weight: \['400', '500', '600'\]/);
  assert.doesNotMatch(layout, /Playfair_Display|Cormorant_Garamond|Noto_Sans_KR|\bInter\b/);
  assert.doesNotMatch(css, /cdn\.jsdelivr\.net|Pretendard Variable/);
  assert.match(css, /:root\{--graphite:#24262c/);
  assert.match(css, /body\{[^}]*background:linear-gradient\(180deg,#282b32 0,#24262c 640px\) no-repeat var\(--graphite\)/);
  assert.match(layout, /description: '토끼를 따라 더 깊이\. 기술, 사람, 시장과 미래에 관한 기록\.'/);
  assert.match(layout, /images: \[\{ url: '\/opengraph-image\.png', width: 1200, height: 630/);
  assert.match(layout, /card: 'summary_large_image'/);
  assert.equal(og.readUInt32BE(16), 1200);
  assert.equal(og.readUInt32BE(20), 630);
});

test('Sam Altman dialogue remains flat without repeated left rules', async () => {
  const css = await read('public/voices/sam-altman-startup-school-2026/styles.css');
  assert.match(css, /\.transcript-dialogue \{ padding-left: 0; border-left: 0; \}/);
  assert.doesNotMatch(css, /\.transcript-dialogue\s*\{[^}]*border-left:\s*[1-9]/);
});
