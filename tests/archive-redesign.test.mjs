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
  assert.match(rail, /<b>전체<i className="axis-rail__carrot" aria-hidden="true" \/><\/b><span>\{posts\.length \+ interviews\.length\}<\/span>/);
});

test('archive cards use one standard format for posts and voices at every breakpoint', async () => {
  const [css, card] = await Promise.all([read('app/globals.css'), read('components/EditorialCard.tsx')]);
  assert.match(css, /\.editorial-wall\{grid-auto-flow:row;grid-auto-rows:73\.8px;gap:16\.2px;background:transparent\}/);
  assert.match(card, /data-rhythm=\{rhythm\}/);
  assert.match(css, /\/\* One archive card contract for posts and voices\. \*\/[\s\S]*?\.editorial-wall \.wall-card\{grid-column:span 6;grid-row:span 4;min-height:0\}/);
  assert.match(css, /@media\(max-width:900px\)\{\.editorial-wall \.wall-card\{grid-column:span 3;grid-row:span 5\}\.editorial-wall \.wall-card h2\{font-size:26px\}\}/);
  assert.match(css, /\.wall-heading :is\(h1,h2\)\{[^}]*color:#d7d7d3;[^}]*font:500 clamp\(16\.1px,2\.1vw,26\.6px\) var\(--sans\)/);
  assert.match(css, /\.wall-heading #wall-heading\{font-size:clamp\(19px,2\.1vw,28px\)\}/);
  assert.match(css, /\.wall-heading :is\(h1,h2\)\{margin:0;color:#d7d7d3;font:500 clamp\(16\.1px,2\.1vw,26\.6px\) var\(--sans\);letter-spacing:-\.035em\}/);
  assert.match(css, /@media\(max-width:520px\)\{\.wall-heading #wall-heading\{font-size:17px\}\.editorial-wall \.wall-card\{width:100%;min-height:217\.62px\}\.editorial-wall \.wall-card:nth-child\(n\)\{min-height:217\.62px\}\.editorial-wall \.wall-card h2\{font-size:24px\}\}/);
  assert.match(css, /\.editorial-wall \.wall-card h2\{font:400 29px\/1\.22 var\(--sans\);letter-spacing:-\.014em\}/);
  assert.match(css, /\.editorial-wall \.wall-card__copy\{display:grid;grid-template-columns:minmax\(0,8fr\) minmax\(0,5fr\);align-items:end;column-gap:0\}/);
  assert.match(css, /\.editorial-wall \.wall-card \.wall-card__abstract\{font:400 12px\/1\.86 var\(--sans\);letter-spacing:0\}/);
  assert.match(css, /\.wall-card__meta\{[^}]*font:500 10px var\(--mono\)/);
  assert.match(css, /\.wall-card__date\{[^}]*font:600 calc\(clamp\(9px,1vw,12px\) \+ 2px\)\/1 var\(--mono\)/);
});

test('header keeps the exact wordmark while the grounded rabbit stays fixed and the carrot animates', async () => {
  const [css, readerCss, header, layout, socialMetadata] = await Promise.all([
    read('app/globals.css'),
    read('public/voices/reader-system.css'),
    read('components/SiteHeader.tsx'),
    read('app/layout.tsx'),
    read('lib/social-metadata.ts'),
  ]);
  assert.match(header, />CarrotCave<span className="cc-brand-domain">\.com<\/span>/);
  assert.match(header, /aria-label=\{readingTitle \? readingBackLabel : 'CarrotCave\.com 홈'\}/);
  assert.match(socialMetadata, /siteName = 'CarrotCave\.com'/);
  assert.match(layout, /title: `\$\{siteName\} · 토끼를 따라왔는데, 생각이 길을 잃었습니다\.`/);
  assert.match(css, /\.cc-brand-name\{[^}]*font-size:15px/);
  assert.match(css, /\.cc-brand-domain\{font-size:10px;color:var\(--muted\)/);
  assert.match(header, /<CarrotCaveMark className="cc-brand-symbol" \/>/);
  assert.match(css, /\.cc-brand-symbol\{animation:none;transform:none\}/);
  assert.match(css, /\.carrot-cave-mark__cave\{transform-box:view-box;transform-origin:48px 48px;transform:scale\(1\.13\)\}/);
  assert.match(css, /\.carrot-cave-mark__rabbit-position\{transform:translateY\(17px\)\}/);
  assert.match(css, /\.carrot-cave-mark__rabbit\{[^}]*animation:none/);
  assert.match(css, /\.carrot-cave-mark__carrot\{[^}]*animation:cc-carrot-wiggle/);
  assert.match(css, /\.cc-header--reading \.cc-brand\{width:44px;min-height:44px/);
  assert.match(readerCss, /\.reader-nav \.brand-mark__cave \{[^}]*transform: scale\(1\.13\);/);
  assert.match(readerCss, /\.reader-nav \.brand-mark__rabbit-position \{ transform: translateY\(17px\); \}/);
  assert.match(readerCss, /\.reader-nav \.brand-mark__rabbit \{ animation: none; \}/);
  assert.doesNotMatch(readerCss, /\.reader-nav \.brand-mark \{[^}]*transform:/);
  assert.match(readerCss, /\.reader-nav, \.reader-nav \.brand \{ width: 44px; height: 44px; \}/);
});

test('video-only posts use checked-in still frames as archive thumbnails', async () => {
  const [home, posts, socialMetadata] = await Promise.all([read('app/page.tsx'), read('data/posts.ts'), read('lib/social-metadata.ts')]);
  const videoOnlySlugs = ['majlis', 'ip-tvw', 'messenger-b2a', 'robot-goku-5000'];
  assert.match(socialMetadata, /function archiveImageUrl\(post: Post\)/);
  assert.match(socialMetadata, /post\.videoUrls\?\.\[0\] \? `\/media\/posters\/\$\{post\.slug\}\.jpg`/);
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

test('shared footer publishes the requested two-line identity and icon links', async () => {
  const [footer, home, voices, css, caveScene, postReader] = await Promise.all([
    read('components/SiteFooter.tsx'),
    read('app/page.tsx'),
    read('app/voices/page.tsx'),
    read('app/globals.css'),
    read('components/FooterCaveScene.tsx'),
    read('app/posts/[slug]/page.tsx'),
  ]);
  assert.match(footer, /<strong>CARROT CAVE<\/strong> by Simon Kim/);
  assert.match(footer, /href="mailto:simon@hashed\.com">simon@hashed\.com<\/a>/);
  assert.match(footer, /href="https:\/\/x\.com\/simonkim_nft"[\s\S]*?<XMark \/>[\s\S]*?<span>X @simonkim_nft<\/span>/);
  assert.match(css, /\.footer-rabbit-carrot\{[^}]*max-height:190px[^}]*border:0;background:transparent/);
  assert.match(caveScene, /src="\/footer-rabbit-carrot\.svg"/);
  assert.doesNotMatch(caveScene, /<rect\b|<path\b|<polygon\b/);
  assert.match(footer, /href="https:\/\/t\.me\/carrotcave" target="_blank" rel="noreferrer"/);
  assert.match(footer, /<TelegramMark \/>[\s\S]*?<span>TELEGRAM<\/span>/);
  assert.match(footer, /<FooterCaveScene \/>/);
  assert.match(css, /\.carrot-cave-mark__cave\{transform-box:view-box;transform-origin:48px 48px;transform:scale\(1\.13\)\}/);
  assert.match(css, /\.carrot-cave-mark__rabbit-position\{transform:translateY\(17px\)\}/);
  assert.doesNotMatch(css, /carrot-cave-mark__(?:rabbit|carrot)[^{]*\{[^}]*scale\(/);
  assert.match(home, /<SiteFooter \/>/);
  assert.match(voices, /<SiteFooter \/>/);

  assert.match(css, /\.cc-footer__copy \.cc-footer__links\{display:flex;width:max-content;max-width:100%;align-items:center;flex-wrap:nowrap;gap:24px;white-space:nowrap\}/);
  assert.match(css, /\.cc-footer__links a\{[^}]*min-height:24px[^}]*font:500 11px\/1\.4 var\(--mono\)/);
  assert.match(postReader, /import SiteFooter from '@\/components\/SiteFooter'/);
  assert.match(postReader, /<\/article>\s*<SiteFooter \/>/);
});

test('archive scrolling uses one simple compositor-safe surface at every width', async () => {
  const css = await read('app/globals.css');
  assert.match(css, /:root\{[^}]*--cc-header-background:#282b32/);
  assert.match(css, /\.cc-header\{[^}]*background:var\(--cc-header-background\)/);
  assert.match(css, /\.cc-header\{[^}]*border-bottom:1px solid var\(--line\)/);
  assert.match(css, /\.axis-rail\{[^}]*background:transparent/);
  assert.match(css, /\.wall-card\{[^}]*transition:background \.2s,border-color \.2s\}/);
  assert.match(css, /\.wall-card:hover\{[^}]*background:#30343c\}/);
  assert.match(css, /\.wall-card__image\{[^}]*opacity:\.56;z-index:0\}/);
  assert.match(css, /\.wall-card\{box-shadow:none\}\.wall-card--generated:after\{display:none\}/);
  assert.doesNotMatch(css, /\.cc-header\{[^}]*backdrop-filter/);
  assert.doesNotMatch(css, /\.axis-rail\{[^}]*backdrop-filter/);
  assert.match(css, /@media\(hover:hover\) and \(pointer:fine\)\{[^\n]*\.editorial-wall \.wall-card:hover\{[^}]*transform:translateY\(-4px\)/);
  assert.doesNotMatch(css, /\.wall-card__image\{[^}]*filter:/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{[^\n]*\.editorial-wall \.wall-card[^\n]*transform:none!important/);
});

test('archive stays uninterrupted while the footer keeps only the rabbit and carrot scene', async () => {
  const [home, footer, rail, card, css] = await Promise.all([
    read('app/page.tsx'),
    read('components/SiteFooter.tsx'),
    read('components/AxisRail.tsx'),
    read('components/EditorialCard.tsx'),
    read('app/globals.css'),
  ]);
  assert.doesNotMatch(home, /journeyStep|cave-depth-divider|CaveJourneyScene|DEPTH 0/);
  assert.match(home, /visibleEntries\.map\(\(entry, index\) => entry\.kind === 'post'/);
  assert.match(footer, /<FooterCaveScene \/>/);
  assert.match(rail, /className="axis-rail__carrot" aria-hidden="true"/);
  assert.doesNotMatch(card, /CaveJourneyScene|cave-depth-divider|axis-rail__carrot/);
  assert.doesNotMatch(css, /cave-depth-divider|cave-journey-scene/);
});

test('axis hover temporarily moves the active carrot and restores it on exit', async () => {
  const css = await read('app/globals.css');
  assert.match(css, /@media\(hover:hover\) and \(pointer:fine\)\{\.axis-rail__inner:has\(a:not\(\.active\):is\(:hover,:focus-visible\)\) a\.active/);
  assert.match(css, /\.axis-rail__inner:has\(a:not\(\.active\):is\(:hover,:focus-visible\)\) a\.active \.axis-rail__carrot\{display:none\}/);
  assert.match(css, /\.axis-rail a:not\(\.active\):is\(:hover,:focus-visible\) \.axis-rail__carrot\{display:inline-block;[^}]*animation:axis-carrot-wiggle/);
  assert.match(css, /@keyframes axis-carrot-wiggle/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{[^\n]*\.axis-rail__carrot\{animation:none!important\}/);
});

test('editorial surface uses local Noto KR, a subtle static gradient, and complete social metadata', async () => {
  const [layout, css, socialMetadata] = await Promise.all([read('app/layout.tsx'), read('app/globals.css'), read('lib/social-metadata.ts')]);
  const og = await readFile(new URL('public/carrotcave-og-20260814.png', root));
  assert.match(layout, /Noto_Sans_KR/);
  assert.doesNotMatch(layout, /Noto_Serif_KR|--font-serif/);
  assert.doesNotMatch(layout, /IBM_Plex_Sans_KR|Playfair_Display|Cormorant_Garamond|\bInter\b/);
  assert.doesNotMatch(css, /cdn\.jsdelivr\.net|Pretendard Variable/);
  assert.match(css, /:root\{--graphite:#24262c/);
  assert.match(css, /body\{[^}]*background:linear-gradient\(180deg,#282b32 0,#24262c 640px\) no-repeat var\(--graphite\)/);
  assert.match(socialMetadata, /siteDescription = '토끼를 따라 더 깊이\. 기술, 사람, 시장과 미래에 관한 기록\.'/);
  assert.match(socialMetadata, /siteOgImage = '\/carrotcave-og-20260814\.png'/);
  assert.match(layout, /images: \[\{ url: siteOgImage, width: 1200, height: 630, type: 'image\/png'/);
  assert.match(layout, /card: 'summary_large_image'/);
  assert.equal(og.readUInt32BE(16), 1200);
  assert.equal(og.readUInt32BE(20), 630);
});

test('Sam Altman dialogue remains flat without repeated left rules', async () => {
  const css = await read('public/voices/sam-altman-startup-school-2026/styles.css');
  assert.match(css, /\.transcript-dialogue \{ padding-left: 0; border-left: 0; \}/);
  assert.doesNotMatch(css, /\.transcript-dialogue\s*\{[^}]*border-left:\s*[1-9]/);
});
