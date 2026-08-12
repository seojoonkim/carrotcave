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
  const css = await read('app/globals.css');
  assert.match(css, /\.editorial-wall\{grid-auto-flow:row;grid-auto-rows:82px;gap:18px;background:transparent\}/);
  assert.match(css, /\.wall-card:nth-child\(4n\+1\)\{grid-column:span 7;grid-row:span 6\}/);
  assert.match(css, /\.wall-card:nth-child\(4n\+2\)\{grid-column:span 5;grid-row:span 6\}/);
  assert.match(css, /\.wall-card:nth-child\(4n\+3\)\{grid-column:span 4;grid-row:span 5\}/);
  assert.match(css, /\.wall-card:nth-child\(4n\)\{grid-column:span 8;grid-row:span 5\}/);
  assert.match(css, /@media\(max-width:900px\)\{\.editorial-wall\{grid-template-columns:repeat\(6,minmax\(0,1fr\)\);grid-auto-rows:74px;gap:14px\}/);
  assert.match(css, /@media\(max-width:520px\)\{\.editorial-wall\{display:flex;flex-direction:column;gap:14px\}/);
  assert.match(css, /\.wall-card:nth-child\(n\)\{width:100%;min-height:260px\}/);
  assert.match(css, /\.wall-card:nth-child\(3n\+2\)\{min-height:290px\}/);
  assert.match(css, /\.wall-card:nth-child\(3n\)\{min-height:240px\}/);
  assert.match(css, /\.wall-card--voice:nth-child\(n\)\{min-height:290px\}/);
  assert.match(css, /\.wall-card__meta\{[^}]*font:500 10px var\(--mono\)/);
  assert.match(css, /\.wall-card__date\{[^}]*font:600 calc\(clamp\(9px,1vw,12px\) \+ 2px\)\/1 var\(--mono\)/);
  assert.match(css, /\.wall-card h2\{[^}]*font:550 clamp\(20px,2\.2vw,36px\)\/1\.13 var\(--sans\)/);
  assert.match(css, /\.wall-card__abstract\{[^}]*font:400 15px\/1\.65 var\(--serif\)/);
  assert.match(css, /@media\(max-width:520px\)[^\n]*\.wall-card__date\{font-size:11px\}[^\n]*\.wall-card h2,\.wall-card--actual-index h2\{font-size:20px[^\n]*\.wall-card__abstract\{font-size:14px\}/);
  const finalArchiveBlock = css.slice(css.indexOf('/* Asymmetric archive:'));
  assert.doesNotMatch(finalArchiveBlock, /grid-auto-flow:row dense/);
  assert.doesNotMatch(css, /nth-last-child\(2\).*?grid-column:span/);
  assert.doesNotMatch(css, /last-child:nth-child\(3n/);
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
  assert.match(footer, /href="https:\/\/t\.me\/carrotcave" target="_blank" rel="noreferrer"/);
  assert.match(home, /<SiteFooter \/>/);
  assert.match(voices, /<SiteFooter \/>/);
});

test('archive scrolling uses one simple compositor-safe surface at every width', async () => {
  const css = await read('app/globals.css');
  assert.match(css, /\.cc-header\{[^}]*background:var\(--graphite\)\}/);
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

test('Sam Altman dialogue remains flat without repeated left rules', async () => {
  const css = await read('public/voices/sam-altman-startup-school-2026/styles.css');
  assert.match(css, /\.transcript-dialogue \{ padding-left: 0; border-left: 0; \}/);
  assert.doesNotMatch(css, /\.transcript-dialogue\s*\{[^}]*border-left:\s*[1-9]/);
});
