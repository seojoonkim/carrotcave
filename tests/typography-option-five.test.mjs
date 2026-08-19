import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const serifToken = /(?<!sans-)\bserif\b|Noto[_ -]Serif|font-serif|reader-serif|post-reader-serif|noto-serif/i;
const voiceSlugs = [
  'liao-heng',
  'liang-wenfeng',
  'yang-zhilin',
  'sam-altman-startup-school-2026',
];

function collectProductTextFiles(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git', '.font-preview', 'tests'].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) collectProductTextFiles(absolute, files);
    else if (/\.(?:css|tsx?|html|mjs|js|json|svg)$/.test(entry.name)) files.push(absolute);
  }
  return files;
}

test('Next app loads only the Noto Sans KR family for Korean UI', () => {
  const layout = read('app/layout.tsx');
  assert.match(layout, /import \{[^}]*Noto_Sans_KR[^}]*\} from 'next\/font\/google'/s);
  assert.match(layout, /Noto_Sans_KR\(\{[\s\S]*?variable: '--font-sans'/);
  assert.doesNotMatch(layout, serifToken);
});

test('archive, post reader, recommendations, and swipe cards all use sans', () => {
  const css = read('app/globals.css');
  const cardSwipe = read('components/CardSwipe.tsx');
  assert.match(css, /\.wall-heading :is\(h1,h2\)\{[^}]*var\(--sans\)/);
  assert.match(css, /\.editorial-wall \.wall-card h2\{font:400 29px\/1\.22 var\(--sans\)/);
  assert.match(css, /\.post-reader-header h1\{[^}]*var\(--post-reader-sans\)/);
  assert.match(css, /\.post-content :is\(h2,h3\)\{[^}]*font-family:var\(--post-reader-sans\)/);
  assert.match(css, /\.cave-constellation-heading\{[^}]*var\(--sans\)!important/);
  assert.match(css, /\.cave-constellation__thumbnail h3\{[^}]*var\(--sans\)!important/);
  assert.doesNotMatch(css, serifToken);
  assert.doesNotMatch(cardSwipe, serifToken);
});

test('all static voice readers load local Noto Sans and share sans heading rules', () => {
  const packageJson = JSON.parse(read('package.json'));
  const readerCss = read('public/voices/reader-system.css');
  const fontPrep = read('scripts/prepare-voice-fonts.mjs');
  assert.ok(packageJson.dependencies['@fontsource-variable/noto-sans-kr']);
  assert.equal(packageJson.dependencies['@fontsource-variable/noto-serif-kr'], undefined);
  assert.match(readerCss, /--font-sans: "Noto Sans KR"/);
  assert.match(readerCss, /\.hero #page-title\s*\{[^}]*font-family: var\(--font-sans\);[^}]*\}/);
  assert.match(readerCss, /\.section-heading h2, \.chapter-heading h2\s*\{[^}]*font-family: var\(--font-sans\);[^}]*\}/);
  assert.match(readerCss, /\.highlight-marker h3, \.topic-heading h3, \.transcript-subheading\s*\{[^}]*font-family: var\(--font-sans\);[^}]*\}/);
  assert.doesNotMatch(readerCss, serifToken);
  assert.doesNotMatch(fontPrep, serifToken);
  for (const slug of voiceSlugs) {
    const html = read(`public/voices/${slug}/index.html`);
    assert.match(html, /<link rel="stylesheet" href="\/fonts\/noto-kr\/index\.css">/);
  }
});

test('production source and generated public font bundle contain no serif family', () => {
  const violations = [];
  for (const file of collectProductTextFiles(root)) {
    const relative = path.relative(root, file);
    if (serifToken.test(fs.readFileSync(file, 'utf8'))) violations.push(relative);
  }
  assert.deepEqual(violations, []);
  assert.equal(fs.existsSync(path.join(root, 'public/fonts/noto-kr/noto-serif-kr')), false);
});
