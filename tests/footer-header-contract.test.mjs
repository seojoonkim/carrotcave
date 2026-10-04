import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('all shared footers use the rabbit and carrot asset without cave markup', async () => {
  const [asset, staticAsset, component, globalCss, voiceCss, ...voices] = await Promise.all([
    read('public/footer-rabbit-carrot-v3.svg'),
    read('public/footer-rabbit-carrot-static.svg'),
    read('components/FooterCaveScene.tsx'),
    read('app/globals.css'),
    read('public/voices/reader-system.css'),
    ...['liao-heng', 'liang-wenfeng', 'sam-altman-startup-school-2026', 'yang-zhilin']
      .map((slug) => read(`public/voices/${slug}/index.html`)),
  ]);
  // One 16s story: sleepy carrot -> hops -> sniff -> carrot ducks into soil -> "?" -> pops out, winks -> nuzzle + hearts.
  for (const name of ['scene-loop', 'rabbit-journey', 'rabbit-squash', 'shadow-hop', 'rabbit-blink', 'nose-sniff', 'whisker-quiver',
    'tail-wiggle', 'front-paw', 'question-pop', 'carrot-play', 'carrot-sleep', 'carrot-awake', 'carrot-wink', 'zz-a', 'sparkle-pop', 'heart-a', 'dust-puff']) {
    assert.match(asset, new RegExp(`@keyframes ${name}\\{`), `missing ${name}`);
  }
  assert.match(asset, /animation:scene-loop 16s ease-in-out infinite/);
  assert.match(asset, /95%,99%\{opacity:0\}/);
  assert.match(asset, /49%,62%\{transform:translate\(690px,0\)\}/);
  assert.match(asset, /clip-path="url\(#ground-clip\)"[\s\S]*?<g class="carrot">/, 'carrot hides behind the soil line');
  assert.ok(asset.includes('61%,72%{transform:translateY(86px)}'), 'leaf tips stay peeking while hidden');
  assert.match(asset, /class="carrot-wink"/);
  assert.match(asset, /class="rabbit-eyes-happy"/);
  assert.match(asset, /id="footer-carrot-skin"[\s\S]*?#f39a52/); // flat logo orange; stripes carry the highlight
  assert.match(asset, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(asset, /cave|동굴/i);
  assert.doesNotMatch(staticAsset, /animation:|@keyframes/);
  assert.match(staticAsset, /<g class="rabbit-position" transform="translate\(690\)">/);
  assert.doesNotMatch(staticAsset, /cave|동굴/i);
  assert.match(component, /import \{ FOOTER_SCENE_SVG \} from \x27\.\/footer-scene-svg\x27/);
  assert.doesNotMatch(globalCss, /footer-rabbit-carrot\{content:url\('\/footer-rabbit-carrot-static\.svg'\)\}/);
  assert.match(globalCss, /\.cc-footer\{[^}]*border-top:0;[^}]*linear-gradient\(180deg,var\(--graphite\) 0%,#090c11 55%,#07090d 100%\)/);
  assert.match(voiceCss, /\.voice-shared-footer \{[\s\S]*?border-top: 0;[\s\S]*?linear-gradient\(180deg, #0b0e14 0%, #090c11 55%, #07090d 100%\)/);
  assert.doesNotMatch(voiceCss, /\.voice-shared-footer \{[\s\S]*?border-top: 1px/);
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

test('phones get a closer crop of the footer story so faces stay readable', async () => {
  const [globalCss, voiceCss] = await Promise.all([read('app/globals.css'), read('public/voices/reader-system.css')]);
  assert.match(globalCss, /@media\(max-width:600px\)\{\.footer-rabbit-carrot\{height:120px!important;max-height:none;object-fit:cover;object-position:88% 100%\}\}/);
  assert.match(voiceCss, /\.voice-footer-rabbit-carrot \{ height: 120px !important; max-height: none; object-fit: cover; object-position: 88% 100%; \}/);
});
