import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

const voicePaths = [
  'public/voices/liao-heng/index.html',
  'public/voices/liang-wenfeng/index.html',
  'public/voices/yang-zhilin/index.html',
];

const sharedVoiceLink = '<link rel="stylesheet" href="../reader-system.css">';

const contracts = [
  '--reader-accent: #61adab',
  '--reader-measure: 680px',
  '--reader-mobile-gutter: 20px',
  '--reader-body-size: 17px',
  '--reader-body-leading: 1.92',
  '--reader-section-size: 42px',
  '--reader-section-size-mobile: 34px',
  '--reader-subsection-size: 27px',
  '--reader-subsection-size-mobile: 24px',
  '--reader-time-size: 12px',
  '--reader-header-title-size: 17px',
  '--reader-header-title-size-mobile: 16px',
];

test('ordinary posts and voice readers share one explicit reading scale', async () => {
  const [globals, shared] = await Promise.all([
    read('app/globals.css'),
    read('public/voices/reader-system.css'),
  ]);

  const normalizeDeclarationSpacing = css => css.replace(/:\s+/g, ':');
  const normalizedGlobals = normalizeDeclarationSpacing(globals);
  const normalizedShared = normalizeDeclarationSpacing(shared);
  for (const contract of contracts) {
    const normalizedContract = normalizeDeclarationSpacing(contract);
    assert.ok(normalizedGlobals.includes(normalizedContract), `globals.css missing ${contract}`);
    assert.ok(normalizedShared.includes(normalizedContract), `voice reader system missing ${contract}`);
  }
});

test('every voice reader consumes the shared reader system without local scale drift', async () => {
  for (const path of voicePaths) {
    const html = await read(path);
    const localLink = '<link rel="stylesheet" href="styles.css">';
    assert.ok(html.indexOf(localLink) >= 0, `${path} must load its local stylesheet`);
    assert.ok(html.indexOf(sharedVoiceLink) > html.indexOf(localLink), `${path} must load the shared reader system after its local stylesheet`);
  }
});

test('shared reader system applies the common scale to matching semantic levels', async () => {
  const shared = await read('public/voices/reader-system.css');
  for (const required of [
    '@media (max-width: 599px)',
    '.reader-shell { padding-inline: var(--reader-mobile-gutter); }',
    '.content-column { max-width: var(--reader-measure); }',
    '.header-site-title, .header-mobile-title { font-size: var(--reader-header-title-size); }',
    '.transcript-paragraph, .long-record-body .utterance',
    'font-size: var(--reader-body-size)',
    '.section-heading h2, .chapter-heading h2',
    '.highlight-marker h3, .topic-heading h3, .transcript-subheading',
    '.chapter-time { font-size: var(--reader-time-size); }',
    '.brand { width: 44px; height: 44px; }',
    '.brand-mark { width: 30px; height: 30px; flex-basis: 30px; }',
    '.header-site-title, .header-mobile-title { font-size: var(--reader-header-title-size-mobile); }',
  ]) assert.ok(shared.includes(required), `shared voice CSS missing: ${required}`);
  assert.doesNotMatch(shared, /#readingStatus\s*\{[^}]*reader-header-title-size/, 'status eyebrow must not consume the title scale');
  assert.doesNotMatch(
    shared.replace(/@media[^{}]*\{(?:[^{}]|\{[^{}]*\})*\}/g, ''),
    /\.reader-shell\s*\{[^}]*padding-inline/,
    'shared gutter must not override the desktop rail reservation',
  );
});

test('ordinary post selectors consume the same reading tokens', async () => {
  const css = await read('app/globals.css');
  for (const required of [
    '.post-reader-page{--reader-accent:#61adab',
    '.post-reader-article{width:calc(100% - (var(--reader-mobile-gutter) * 2));max-width:var(--reader-measure)',
    '.post-content{overflow-wrap:anywhere;color:#e7e7e8;font:400 var(--reader-body-size)/var(--reader-body-leading)',
    '.post-content h2{margin:54px 0 22px;font-size:var(--reader-section-size)',
    '.post-content h3{margin:40px 0 18px;font-size:var(--reader-subsection-size)',
    '@media(max-width:599px){.cc-reading-title{font-size:var(--reader-header-title-size-mobile,16px)}.post-content h2{font-size:var(--reader-section-size-mobile)}.post-content h3{font-size:var(--reader-subsection-size-mobile)}',
  ]) assert.ok(css.includes(required), `ordinary post CSS missing: ${required}`);
});
