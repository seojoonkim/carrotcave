import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const layout = read('app/layout.tsx');
const css = read('app/globals.css');
const readerCss = read('public/voices/reader-system.css');
const home = read('app/page.tsx');
const voices = read('app/voices/page.tsx');
const packageJson = JSON.parse(read('package.json'));
const voiceSlugs = [
  'liao-heng',
  'liang-wenfeng',
  'yang-zhilin',
  'sam-altman-startup-school-2026',
];

test('Next app self-hosts option five through next/font variables', () => {
  assert.match(layout, /import \{[^}]*Noto_Sans_KR[^}]*Noto_Serif_KR[^}]*\} from 'next\/font\/google'/s);
  assert.doesNotMatch(layout, /IBM_Plex_Sans_KR/);
  assert.match(layout, /Noto_Sans_KR\(\{[\s\S]*?variable: '--font-sans'/);
  assert.match(layout, /Noto_Serif_KR\(\{[\s\S]*?variable: '--font-serif'/);
});

test('all archive menu headings use one body sans layout while content titles retain serif', () => {
  assert.match(css, /\.wall-heading :is\(h1,h2\)\{[^}]*font:[^;}]*var\(--serif\)/);
  assert.match(home, /<h1 id="wall-heading" className="wall-heading__menu-title">/);
  assert.match(voices, /<h1 id="wall-heading" className="wall-heading__menu-title">/);
  assert.match(css, /#wall-heading\.wall-heading__menu-title\{font-family:var\(--sans\);margin-bottom:4px\}/);
  assert.match(css, /\.wall-heading #wall-heading\{font-size:calc\(clamp\(23px,3vw,38px\) - 2\.6667px\)\}/);
  assert.doesNotMatch(css, /\.voices-wall \.wall-heading h1\{/);
  assert.match(css, /\.editorial-wall \.wall-card h2\{font:600 22\.6667px\/1\.3 var\(--serif\)/);
  assert.match(css, /\.editorial-wall \.wall-card \.wall-card__abstract\{font:400 12px\/1\.86 var\(--sans\)/);
  assert.match(css, /\.post-reader-page\{[^}]*--post-reader-serif:var\(--serif\)/);
  assert.match(css, /\.post-reader-header h1\{[^}]*var\(--post-reader-serif\)/);
  assert.match(css, /\.post-content :is\(h2,h3\)\{[^}]*font-family:var\(--post-reader-serif\)/);
  assert.match(css, /\.cave-constellation-heading\{[^}]*var\(--serif\)!important/);
  assert.match(css, /\.cave-constellation__thumbnail h3\{[^}]*var\(--serif\)!important/);
});

test('all static voice readers load local Noto KR and share serif heading rules', () => {
  assert.equal(packageJson.scripts.prebuild, 'node scripts/prepare-voice-fonts.mjs');
  assert.equal(packageJson.scripts.predev, 'node scripts/prepare-voice-fonts.mjs');
  assert.ok(packageJson.dependencies['@fontsource-variable/noto-sans-kr']);
  assert.ok(packageJson.dependencies['@fontsource-variable/noto-serif-kr']);
  assert.match(readerCss, /--font-sans: "Noto Sans KR"/);
  assert.match(readerCss, /--font-serif: "Noto Serif KR"/);
  assert.match(readerCss, /@font-face \{\s*font-family: "JetBrains Mono";[\s\S]*?src: url\("\/fonts\/jetbrains-mono-500\.ttf"\)/);
  assert.match(readerCss, /\.hero #page-title\s*\{[^}]*font-family: var\(--font-serif\);[^}]*\}/);
  assert.match(readerCss, /\.section-heading h2, \.chapter-heading h2\s*\{[^}]*font-family: var\(--font-serif\);[^}]*\}/);
  assert.match(readerCss, /\.highlight-marker h3, \.topic-heading h3, \.transcript-subheading\s*\{[^}]*font-family: var\(--font-serif\);[^}]*\}/);
  for (const slug of voiceSlugs) {
    const html = read(`public/voices/${slug}/index.html`);
    const readerStyles = read(`public/voices/${slug}/styles.css`);
    assert.doesNotMatch(readerStyles, /https?:\/\/[^)'\"]*(?:font|pretendard)|fonts\.(?:googleapis|gstatic)\.com|cdn\.jsdelivr\.net|IBM Plex Mono|Pretendard Variable/i);
    assert.match(html, /<link rel="stylesheet" href="\/fonts\/noto-kr\/index\.css">/);
    assert.ok(
      html.indexOf('/fonts/noto-kr/index.css') < html.indexOf('../reader-system.css'),
      `${slug} must load Noto faces before the shared reader rules`,
    );
  }
});

test('font preparation script is local-only and copies both variable families', () => {
  const script = read('scripts/prepare-voice-fonts.mjs');
  assert.match(script, /@fontsource-variable\/noto-sans-kr/);
  assert.match(script, /@fontsource-variable\/noto-serif-kr/);
  assert.doesNotMatch(script, /https?:\/\//);
});
