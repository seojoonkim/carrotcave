import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('all shared footers use the rabbit and carrot asset without cave markup', async () => {
  const [asset, staticAsset, component, globalCss, voiceCss, ...voices] = await Promise.all([
    read('public/footer-rabbit-carrot.svg'),
    read('public/footer-rabbit-carrot-static.svg'),
    read('components/FooterCaveScene.tsx'),
    read('app/globals.css'),
    read('public/voices/reader-system.css'),
    ...['liao-heng', 'liang-wenfeng', 'sam-altman-startup-school-2026', 'yang-zhilin']
      .map((slug) => read(`public/voices/${slug}/index.html`)),
  ]);
  assert.match(asset, /@keyframes rabbit-hop/);
  assert.match(asset, /@keyframes scene-loop/);
  assert.match(asset, /class="carrot-position" transform="translate\(780 94\) rotate\(-8\)"[\s\S]*?<g class="carrot">/);
  assert.doesNotMatch(asset, /class="carrot" transform=/);
  assert.match(asset, /animation: scene-loop 12s ease-in-out infinite/);
  assert.match(asset, /48%\s*\{\s*transform:\s*translate\(264px,0\);\s*\}/);
  assert.match(asset, /95%,98% \{ opacity: 0; \}/);
  assert.match(asset, /@keyframes rabbit-blink/);
  assert.match(asset, /@keyframes nose-sniff/);
  assert.match(asset, /@keyframes tail-wiggle/);
  assert.match(asset, /62%\s*\{\s*transform:\s*translateY\(-9px\) rotate\(4deg\);\s*\}/);
  assert.doesNotMatch(asset, /translate\([^,]+,-34px\)/);
  assert.match(asset, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(asset, /cave|동굴/i);
  assert.doesNotMatch(staticAsset, /animation:/);
  assert.doesNotMatch(staticAsset, /cave|동굴/i);
  assert.match(component, /src="\/footer-rabbit-carrot\.svg"/);
  assert.match(globalCss, /footer-rabbit-carrot\{content:url\('\/footer-rabbit-carrot-static\.svg'\)\}/);
  assert.match(globalCss, /\.cc-footer\{[^}]*border-top:0;[^}]*linear-gradient\(180deg,var\(--graphite\) 0%,#202228 55%,#181a1f 100%\)/);
  assert.match(voiceCss, /\.voice-shared-footer \{[\s\S]*?border-top: 0;[\s\S]*?linear-gradient\(180deg, #24262c 0%, #202228 55%, #181a1f 100%\)/);
  assert.doesNotMatch(voiceCss, /\.voice-shared-footer \{[\s\S]*?border-top: 1px/);
  assert.match(voiceCss, /\.voice-footer-rabbit-carrot/);
  assert.match(voiceCss, /voice-footer-rabbit-carrot \{ content: url\('\/footer-rabbit-carrot-static\.svg'\); \}/);
  assert.doesNotMatch(voiceCss, /voice-footer-cave-scene/);
  for (const voice of voices) {
    assert.match(voice, /class="voice-footer-rabbit-carrot"/);
    assert.doesNotMatch(voice, /voice-footer-cave-scene/);
  }
});

test('voice chapter status keeps one visible space after the period', async () => {
  const runtime = await read('public/voices/reader-runtime.js');
  assert.match(runtime, /separatorNode\.textContent = number \? '\.\\u00a0' : ''/);
  assert.match(runtime, /set\(`Ch\$\{normalized\}`, title\)/);
});

test('general post header title uses regular weight', async () => {
  const css = await read('app/globals.css');
  assert.match(css, /\.cc-reading-title\{[^}]*font:400 var\(--reader-header-title-size,17px\)/);
});
