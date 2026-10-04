import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('every page family gets a generated 1200x630 share card from one template', () => {
  const card = read('lib/og-card.tsx');
  assert.match(card, /OG_SIZE = \{ width: 1200, height: 630 \}/);
  assert.match(card, /Pretendard/);
  for (const f of ['app/opengraph-image.tsx', 'app/posts/[slug]/opengraph-image.tsx', 'app/voices/[slug]/opengraph-image.tsx']) {
    const src = read(f);
    assert.match(src, /ogCard\(/, f);
    assert.match(src, /export const size = OG_SIZE/, f);
  }
  assert.match(read('app/posts/[slug]/opengraph-image.tsx'), /generateStaticParams/);
  assert.match(read('app/voices/[slug]/opengraph-image.tsx'), /generateStaticParams/);
});

test('pages do not override the generated card with raw thumbnails', () => {
  for (const f of ['app/layout.tsx', 'components/views/PostView.tsx', 'app/voices/[slug]/page.tsx']) {
    assert.doesNotMatch(read(f), /images: \[/, f);
  }
});

test('card keeps the soft-night palette: slate ink, carrot accent, rounded mascot shapes', () => {
  const card = read('lib/og-card.tsx');
  assert.match(card, /INK = '#282a36'/);
  assert.match(card, /CARROT = '#f39a52'/);
  const radii = [...card.matchAll(/borderRadius: (\d+)/g)].map((m) => Number(m[1]));
  assert.ok(radii.length >= 3 && radii.every((r) => [24, 28, 999].includes(r)), `radii ${radii}`);
  assert.match(card, /PANEL = '#343746'/);
  assert.match(card, /<img src=\{MARK_DATA_URL\} width=\{290\} height=\{290\} \/>/, 'no-photo card shows the mascot logo on a rounded panel');
});

test('non-JPEG/PNG pictures are converted and a bad picture never breaks the build', () => {
  const card = read('lib/og-card.tsx');
  assert.match(card, /CONVERT = new Set\(\['\.webp', '\.gif', '\.avif'\]\)/);
  assert.match(card, /import\('sharp'\)/);
  assert.match(card, /catch \{\s*return undefined;/);
  assert.match(read('package.json'), /"sharp":/);
});

test('share cards are English-only: every text input is an English source', () => {
  const card = read('lib/og-card.tsx');
  const post = read('app/posts/[slug]/opengraph-image.tsx');
  const voice = read('app/voices/[slug]/opengraph-image.tsx');
  const home = read('app/opengraph-image.tsx');
  const HANGUL = /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/;
  // route files never pass Korean fields (title/summary/name) into the image
  assert.doesNotMatch(post, /post\.(title|summary)/);
  assert.doesNotMatch(voice, /voice\.(title|summary|name)\b(?!En)/);
  for (const src of [post, voice, home]) assert.doesNotMatch(src.replace(/\/\/.*$/gm, ''), HANGUL, 'no Hangul literals in card routes');
  // the template itself drops any Hangul that slips through
  assert.match(card, /function englishOnly/);
  assert.match(card, /CATEGORY_EN[^;]*EXPLORE[^;]*BUILD[^;]*DOODLE[^;]*FICTION[^;]*VOICES/);
  const interviews = read('data/interviews.ts');
  const slugs = interviews.match(/slug: '[^']+'/g).length;
  const names = [...interviews.matchAll(/nameEn: '([^']+)'/g)].map((m) => m[1]);
  assert.equal(names.length, slugs, 'every voice has an English name');
  for (const n of names) assert.doesNotMatch(n, HANGUL);
});

test('share cards use the original header icon, kept in sync with CarrotCaveMark', () => {
  const card = read('lib/og-card.tsx');
  const mark = read('components/CarrotCaveMark.tsx');
  assert.match(card, /MARK_DATA_URL/);
  assert.doesNotMatch(card, /carrot-cave-symbol\.png/);
  for (const d of [...mark.matchAll(/ d="([^"]+)"/g)].map((m) => m[1])) assert.ok(card.includes(d), `icon path in sync: ${d.slice(0, 24)}`);
});

test('share card type is large: title >= 76px, label/date >= 32px, wordmark 40px', () => {
  const card = read('lib/og-card.tsx');
  const sizes = [...read('lib/og-rules.ts').match(/function titleSize[\s\S]*?\n}/)[0].matchAll(/\b(\d{2,3})\b/g)].map((m) => Number(m[1])).filter((n) => n > 40);
  assert.ok(Math.min(...sizes) >= 76, `smallest title ${Math.min(...sizes)}`);
  assert.match(card, /fontSize: 34, fontWeight: 700, letterSpacing: 2 \}\}>\{label\}/);
  assert.match(card, /fontSize: 32, fontWeight: 600, letterSpacing: 1 \}\}>\{meta\}/);
  assert.match(card, /fontSize: 40, fontWeight: 700, letterSpacing: -0\.5 \}\}>carrotcave</);
});

test('og-card file stays syntactically closed (single ternary per picture slot)', () => {
  const card = read('lib/og-card.tsx');
  assert.doesNotMatch(card, /\)\s*:\s*\(\s*[\s\S]*?\)\s*:\s*null\}/, 'no dangling second ternary branch');
  assert.doesNotMatch(card, /clipPath/, 'the OG renderer ignores clip-path');
});

test('wordmark is lowercase carrotcave.com with no icon in front of it', () => {
  const card = read('lib/og-card.tsx');
  const foot = card.match(/<div style=\{\{ display: 'flex', alignItems: 'center' \}\}>[\s\S]*?\.com<\/div>/)[0];
  assert.doesNotMatch(foot, /<img/, 'no icon before the wordmark');
  assert.match(foot, />carrotcave<\/div>[\s\S]*>\.com<\/div>/);
  assert.doesNotMatch(card, />CarrotCave</, 'no capitalised wordmark');
});

test('text column never reaches the right-hand picture or icon', () => {
  const card = read('lib/og-card.tsx');
  const [, withPic, noPic] = card.match(/width: image \? (\d+) : (\d+)/).map(Number);
  // picture starts at 1200-60-400=740, big icon at 1200-40-360=800; text starts at x=80
  assert.ok(80 + withPic - 80 <= 740 - 20, `picture column ${withPic}`);
  assert.ok(noPic <= 800 - 20, `icon column ${noPic}`);
});
