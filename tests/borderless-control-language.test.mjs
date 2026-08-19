import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

const voicePages = [
  'public/voices/liao-heng/index.html',
  'public/voices/liang-wenfeng/index.html',
  'public/voices/yang-zhilin/index.html',
  'public/voices/sam-altman-startup-school-2026/index.html',
];

test('all live app and voice controls share a borderless surface contract', async () => {
  const [appCss, voiceCss] = await Promise.all([
    read('app/globals.css'),
    read('public/voices/reader-system.css'),
  ]);

  assert.match(appCss, /\.post-reader-action\{[^}]*border:0/);
  assert.match(appCss, /\.cave-constellation__navigate\{[^}]*min-height:48px[^}]*border:0/s);
  assert.doesNotMatch(appCss, /\.cave-constellation__navigate:hover\{[^}]*border-color/);
  assert.match(appCss, /\.cave-constellation :focus-visible\{[^}]*outline:/);

  assert.match(voiceCss, /\.menu-button,\s*\.source-button,\s*\.hero-action,\s*\.back-to-top\s*\{\s*border: 0;/);
  assert.match(voiceCss, /\.back-to-top\s*\{/s); assert.doesNotMatch(voiceCss, /\.back-to-top\s*\{[^}]*box-shadow\s*:\s*(?!none\b)/s);
  assert.match(voiceCss, /\.hero-action-primary\s*\{[^}]*background:/s);
});

test('every voice page loads the shared borderless override after its local stylesheet', async () => {
  for (const path of voicePages) {
    const html = await read(path);
    assert.ok(html.indexOf('href="../reader-system.css"') > html.indexOf('href="styles.css"'), `${path} must load shared controls last`);
  }
});

test('structural dividers remain outside the button-removal scope', async () => {
  const appCss = await read('app/globals.css');
  assert.match(appCss, /\.axis-rail a\{[^}]*border-left:1px solid var\(--line\)/);
  assert.match(appCss, /\.wall-card\{[^}]*border:1px solid var\(--line\)/);
  assert.match(appCss, /\.post-reader-header\{[^}]*border-bottom:0/);
});
