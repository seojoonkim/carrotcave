import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const compact = source => source.replace(/\s+/g, '');

const voicePaths = [
  'public/voices/liao-heng/index.html',
  'public/voices/liang-wenfeng/index.html',
  'public/voices/yang-zhilin/index.html',
  'public/voices/sam-altman-startup-school-2026/index.html',
];

test('Voice header and hero typography inherit the ordinary post reading contracts', async () => {
  const [globals, shared] = await Promise.all([
    read('app/globals.css'),
    read('public/voices/reader-system.css'),
  ]);
  const ordinary = compact(globals);
  const voice = compact(shared);

  for (const contract of [
    '--reader-header-title-size:16px',
    '--reader-header-title-size-mobile:15px',
    '--reader-title-size:clamp(32px,calc(5.5vw-2px),44px)',
  ]) {
    assert.ok(ordinary.includes(contract), `ordinary post source contract missing: ${contract}`);
    assert.ok(voice.includes(contract), `Voice reader must match ordinary post: ${contract}`);
  }

  assert.ok(voice.includes('.header-titles{display:flex;min-width:0;flex-direction:column;justify-content:center;gap:3px;}'));
  assert.ok(voice.includes('.header-site-title{display:block;overflow:hidden;color:var(--reader-accent);font:5009px/1var(--font-mono);letter-spacing:.1em;text-overflow:ellipsis;white-space:nowrap;}'));
  assert.ok(voice.includes('.header-status#readingStatus{display:inline-flex;min-width:0;overflow:hidden;align-items:baseline;color:var(--bright-white);font:400var(--reader-header-title-size)/1.2var(--font-sans);letter-spacing:-.02em;text-overflow:ellipsis;white-space:nowrap;}'));

  assert.ok(ordinary.includes('.post-reader-headerh1{max-width:650px;margin:0022px;color:#fff;font:500var(--reader-title-size)/1.22var(--post-reader-sans);letter-spacing:-.035em'));
  assert.ok(voice.includes('.hero#page-title{max-width:650px;margin:0022px;color:var(--bright-white);font:500var(--reader-title-size)/1.22var(--font-sans);font-family:var(--font-sans);letter-spacing:-.035em'));

  assert.ok(ordinary.includes('.post-content{overflow-wrap:anywhere;color:#e7e7e8;font:400var(--reader-body-size)/var(--reader-body-leading)var(--post-reader-sans);letter-spacing:0}'));
  assert.ok(voice.includes('.hero-deck{font:400var(--reader-body-size)/var(--reader-body-leading)var(--font-sans);letter-spacing:0;}'));
});

test('all Voice readers preserve the menu, current-reading status, and progress hooks', async () => {
  for (const path of voicePaths) {
    const html = await read(path);
    assert.match(html, /<header class="site-header">/);
    assert.match(html, /class="header-site-title"/);
    assert.match(html, /id="readingStatus"/);
    assert.match(html, /<button class="menu-button" id="menuButton"[^>]+aria-controls="tocDrawer"/);
    assert.match(html, /<aside class="toc-drawer" id="tocDrawer"/);
    assert.match(html, /class="progress" id="readingProgress" role="progressbar"/);
    assert.match(html, /id="progressBar"/);
    assert.match(html, /<script src="\.\.\/reader-runtime\.js"><\/script>/);
    assert.match(html, /<script src="\.\.\/reading-progress\.js" defer><\/script>/);
  }
});
