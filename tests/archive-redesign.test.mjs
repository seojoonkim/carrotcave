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
  assert.match(css, /@media\(max-width:520px\)\{\.editorial-wall\{display:flex;flex-direction:column;gap:18px\}/);
  const finalArchiveBlock = css.slice(css.indexOf('/* Asymmetric archive:'));
  assert.doesNotMatch(finalArchiveBlock, /grid-auto-flow:row dense/);
  assert.doesNotMatch(css, /nth-last-child\(2\).*?grid-column:span/);
  assert.doesNotMatch(css, /last-child:nth-child\(3n/);
});

test('header sizing changes are visual-only and preserve fixed interaction boxes', async () => {
  const [css, readerCss] = await Promise.all([read('app/globals.css'), read('public/voices/reader-system.css')]);
  assert.match(css, /\.cc-brand\{[^}]*font:700 14px\/1\.1 var\(--mono\)/);
  assert.match(css, /\.cc-brand-symbol\{[^}]*transform:scale\(1\.07\)/);
  assert.match(css, /\.cc-header--reading \.cc-brand\{width:44px;min-height:44px/);
  assert.match(readerCss, /\.reader-nav \.brand-mark \{[^}]*transform: scale\(1\.07\);/);
  assert.match(readerCss, /\.reader-nav, \.reader-nav \.brand \{ width: 44px; height: 44px; \}/);
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

test('Sam Altman dialogue remains flat without repeated left rules', async () => {
  const css = await read('public/voices/sam-altman-startup-school-2026/styles.css');
  assert.match(css, /\.transcript-dialogue \{ padding-left: 0; border-left: 0; \}/);
  assert.doesNotMatch(css, /\.transcript-dialogue\s*\{[^}]*border-left:\s*[1-9]/);
});
