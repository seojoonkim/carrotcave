import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

const voicePaths = [
  'public/voices/liao-heng/index.html',
  'public/voices/liang-wenfeng/index.html',
  'public/voices/yang-zhilin/index.html',
  'public/voices/sam-altman-startup-school-2026/index.html',
];

const sharedVoiceLink = '<link rel="stylesheet" href="../reader-system.css">';

const contracts = [
  '--reader-accent: #61adab',
  '--reader-measure: 680px',
  '--reader-mobile-gutter: 20px',
  '--reader-body-size: 17px',
  '--reader-body-leading: 1.86',
  '--reader-section-size: 42px',
  '--reader-section-size-mobile: 34px',
  '--reader-subsection-size: 27px',
  '--reader-subsection-size-mobile: 24px',
  '--reader-time-size: 12px',
  '--reader-header-title-size: 17px',
  '--reader-header-title-size-mobile: 16px',
  '--reader-title-size: clamp(34px, 5.5vw, 46px)',
];

test('ordinary posts and voice readers share one explicit reading scale', async () => {
  const [globals, shared] = await Promise.all([
    read('app/globals.css'),
    read('public/voices/reader-system.css'),
  ]);

  const normalizeDeclarationSpacing = css => css.replace(/\s+/g, '');
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
    '.header-status #readingStatus {',
    'font: 600 var(--reader-header-title-size)/1.2 var(--font-sans);',
    '.transcript-paragraph, .long-record-body .utterance',
    'font-size: var(--reader-body-size)',
    '.section-heading h2, .chapter-heading h2',
    '.highlight-marker h3, .topic-heading h3, .transcript-subheading',
    '.chapter-time { font-size: var(--reader-time-size); }',
    '.reader-nav, .reader-nav .brand { width: 44px; height: 44px; }',
    '.reader-nav .brand-mark { width: 34px; height: 34px; flex: 0 0 34px; }',
    '.reader-back-chevron { display: grid; width: 10px; height: 34px;',
    'font: 400 28px/1 var(--font-sans);',
  ]) assert.ok(shared.includes(required), `shared voice CSS missing: ${required}`);
  assert.doesNotMatch(shared, /\.header-site-title\s*\{[^}]*reader-header-title-size/, 'voice meta eyebrow must not consume the title scale');
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
    '--reader-body-leading:1.86',
    '--reader-title-size:clamp(34px,5.5vw,46px)',
    '.post-reader-article{width:calc(100% - (var(--reader-mobile-gutter) * 2));max-width:var(--reader-measure)',
    '.post-content{overflow-wrap:anywhere;color:#e7e7e8;font:400 var(--reader-body-size)/var(--reader-body-leading)',
    '.post-content h2{margin:54px 0 22px;font-size:var(--reader-section-size)',
    '.post-content h3{margin:40px 0 18px;font-size:var(--reader-subsection-size)',
    '.post-reader-header h1{max-width:650px;margin:0 0 22px;color:#fff;font:750 var(--reader-title-size)/1.22',
    '@media(max-width:599px){.cc-reading-title{font-size:var(--reader-header-title-size-mobile,16px)}.post-content h2{font-size:var(--reader-section-size-mobile)}.post-content h3{font-size:var(--reader-subsection-size-mobile)}',
  ]) assert.ok(css.includes(required), `ordinary post CSS missing: ${required}`);
});

test('voice covers use the ordinary-post title hierarchy without archive credits', async () => {
  for (const path of voicePaths) {
    const html = await read(path);
    assert.match(html, /<p class="kicker">목소리<\/p>/, `${path} must use the ordinary category eyebrow`);
    assert.doesNotMatch(html, /class="hero-byline"/, `${path} must remove the cover credit line`);
    assert.doesNotMatch(html, /ARCHIVE 01|SEMICONDUCTOR \/ AI SYSTEMS|VOICE ARCHIVE|Curated &amp; built by Simon Kim · Hashed/);
    assert.match(html, /<h1 id="page-title">[\s\S]*?<\/h1>/, `${path} must preserve its labelled title`);
    assert.match(html, /class="hero-portrait"/, `${path} must preserve its portrait`);
  }

  const shared = await read('public/voices/reader-system.css');
  for (const required of [
    '.hero .kicker {',
    'margin: 0 0 12px;',
    'font: 500 11px/1.4',
    'letter-spacing: .14em;',
    '.hero #page-title {',
    'max-width: 650px;',
    'margin: 0 0 22px;',
    'font-size: var(--reader-title-size);',
    'line-height: 1.22;',
    'font-weight: 750;',
    'letter-spacing: -.045em;',
    '.hero #page-title em, .hero #page-title span {',
    'font: inherit;',
    '@media (min-width: 1000px)',
    '.hero #page-title { max-width: 520px; }',
    '@media (min-width: 901px)',
    ':root { --header: 78px; }',

  ]) assert.ok(shared.includes(required), `shared voice cover CSS missing: ${required}`);
});

test('voice covers match ordinary-post top spacing and solid background', async () => {
  const shared = await read('public/voices/reader-system.css');
  for (const required of [
    '.hero {',
    'padding-top: 56px;',
    'background-image: none;',
    '@media (max-width: 480px)',
    '.hero { padding-top: 44px; }',
  ]) assert.ok(shared.includes(required), `shared voice surface CSS missing: ${required}`);

  for (const path of voicePaths) {
    const html = await read(path);
    assert.match(html, /class="hero"[\s\S]*?class="kicker">목소리<\/p>/, `${path} must preserve the cover and its first eyebrow`);
    assert.match(html, /class="hero-portrait"/, `${path} must preserve its portrait while the grid is removed`);
  }
});

test('all rendered images are borderless and voice portraits have no internal labels', async () => {
  const [globals, shared, localMono] = await Promise.all([
    read('app/globals.css'),
    read('public/voices/reader-system.css'),
    read('public/fonts/jetbrains-mono-500.ttf'),
  ]);
  assert.ok(localMono.length > 100_000, 'self-hosted mono font asset must exist');
  assert.doesNotMatch(shared, /https?:\/\//, 'voice CSS must not add third-party font requests');
  assert.ok(shared.includes('src: url("/fonts/jetbrains-mono-500.ttf") format("truetype");'), 'voice meta must use the self-hosted mono font');
  assert.match(globals, /img\{border:0;outline:0;box-shadow:none\}/, 'app images must be explicitly borderless');
  assert.match(globals, /\.wall-card--with-image\{[^}]*border:0/, 'image cards must not retain a wrapper border');
  assert.match(globals, /\.wall-card--with-image:hover\{[^}]*border-color:transparent/, 'image cards must stay borderless on hover');
  assert.ok(shared.includes('img { border: 0; outline: 0; box-shadow: none; }'), 'embedded voice images must be explicitly borderless');
  assert.ok(shared.includes('.hero-portrait::before { content: none; }'), 'voice portrait decoration border must be disabled');

  for (const path of voicePaths) {
    const html = await read(path);
    assert.doesNotMatch(html, /class="hero-nameplate"/, `${path} must remove its internal portrait nameplate`);
    assert.doesNotMatch(html, /<figcaption\b/, `${path} must remove its portrait description`);
    assert.match(html, /<figure class="hero-portrait">(?:(?!<figure\b)[\s\S])*?<img\b[^>]*\balt="[^"]+"[^>]*(?:(?!<figure\b)[\s\S])*?<\/figure>/, `${path} must preserve its portrait image and alt text inside the portrait figure`);
  }
});

test('voice headers expose the same two-row meta and title hierarchy as ordinary posts', async () => {
  const shared = await read('public/voices/reader-system.css');
  for (const required of [
    '.header-status > i, #currentChapterNumber, .header-mobile-title { display: none; }',
    '.header-titles { display: flex; min-width: 0; flex-direction: column; justify-content: center; gap: 3px; }',
    '.header-site-title {',
    'font: 500 9px/1 var(--font-mono);',
    'letter-spacing: .1em;',
    '.header-status #readingStatus {',
    'font: 600 var(--reader-header-title-size)/1.2 var(--font-sans);',
    '@media (max-width: 599px)',
    '.header-status #readingStatus { font-size: var(--reader-header-title-size-mobile); }',
  ]) assert.ok(shared.includes(required), `shared voice header CSS missing: ${required}`);

  for (const required of [
    '#readingStatus.is-subchapter {',
    'flex-direction: column;',
    'align-items: flex-start;',
    '#readingStatus.is-subchapter .reading-status-separator { display: none; }',
    '.reading-status-title {',
    'text-align: left;',
  ]) assert.ok(shared.includes(required), `shared voice subchapter header CSS missing: ${required}`);

  const expectedMeta = new Map([
    ['public/voices/liao-heng/index.html', '목소리 · 랴오헝 인터뷰 · 반도체 연구자의 필드 노트'],
    ['public/voices/liang-wenfeng/index.html', '목소리 · 량원펑 비공개 투자자 회의 · AGI를 향한 절제'],
    ['public/voices/yang-zhilin/index.html', '목소리 · 양즈린 인터뷰 · 무한의 시작에 서서'],
    ['public/voices/sam-altman-startup-school-2026/index.html', '목소리 · 샘 올트먼 인터뷰 · 지금보다 창업하기 좋은 때는 없다'],
  ]);
  for (const [path, meta] of expectedMeta) {
    const html = await read(path);
    assert.match(html, new RegExp(`<span class="header-site-title">${meta}<\\/span>`), `${path} must expose the full interview title`);
    assert.match(html, /<span id="readingStatus" aria-label="00 OVERVIEW"><span class="reading-status-number">00<\/span><span class="reading-status-separator" aria-hidden="true"> · <\/span><span class="reading-status-title">OVERVIEW<\/span><\/span>/, `${path} must expose an accessible structured overview number and title`);
  }

  const liaoScript = await read('public/voices/liao-heng/script.js');
  for (const required of [
    "CarrotReader.createStatusController({ readerTitle: '랴오헝 인터뷰' })",
    'readerStatus.setChapter(number, chapterTitle);',
    "readerStatus.set(currentMarker.querySelector('.highlight-index')?.textContent || '', currentMarker.querySelector('h3')?.textContent || '', true);",
  ]) assert.ok(liaoScript.includes(required), `Liao header script missing: ${required}`);

  const liangHtml = await read('public/voices/liang-wenfeng/index.html');
  for (const required of [
    "CarrotReader.createStatusController({readerTitle:'량원펑 회의 기록'})",
    'readerStatus.setChapter(n,chapterTitle)',
    "readerStatus.set(topic.querySelector('.topic-number')?.textContent||'',topic.querySelector('h3')?.textContent||'',true)",
  ]) assert.ok(liangHtml.includes(required), `Liang inline header script missing: ${required}`);

  const yangScript = await read('public/voices/yang-zhilin/script.js');
  for (const required of [
    "CarrotReader.createStatusController({ readerTitle: '양즈린 인터뷰' })",
    'readerStatus.setChapter(number, chapterTitle);',
  ]) assert.ok(yangScript.includes(required), `Yang header script missing: ${required}`);

  const samScript = await read('public/voices/sam-altman-startup-school-2026/script.js');
  for (const required of [
    "CarrotReader.createStatusController({ readerTitle: '샘 올트먼 인터뷰' })",
    'readerStatus.setChapter(number,title);',
  ]) assert.ok(samScript.includes(required), `Sam header script missing: ${required}`);
});

test('voice readers share one status runtime instead of duplicating header mutation', async () => {
  const runtime = await read('public/voices/reader-runtime.js');
  for (const required of [
    'window.CarrotReader = Object.freeze({ createStatusController });',
    "status.setAttribute('aria-label', `${number} ${title}`.trim());",
    'return Object.freeze({ set, setChapter });',
  ]) assert.ok(runtime.includes(required), `shared reader runtime missing: ${required}`);

  for (const path of voicePaths) {
    const html = await read(path);
    assert.match(html, /<script src="\.\.\/reader-runtime\.js"><\/script>/, `${path} must load the shared reader runtime before inline or deferred consumers`);
  }

  const [liaoScript, liangHtml, yangScript, samScript] = await Promise.all([
    read('public/voices/liao-heng/script.js'),
    read('public/voices/liang-wenfeng/index.html'),
    read('public/voices/yang-zhilin/script.js'),
    read('public/voices/sam-altman-startup-school-2026/script.js'),
  ]);
  for (const [path, source] of [
    ['public/voices/liao-heng/script.js', liaoScript],
    ['public/voices/liang-wenfeng/index.html', liangHtml],
    ['public/voices/yang-zhilin/script.js', yangScript],
    ['public/voices/sam-altman-startup-school-2026/script.js', samScript],
  ]) {
    assert.match(source, /CarrotReader\.createStatusController\(/, `${path} must consume the shared status controller`);
    assert.doesNotMatch(source, /\.setAttribute\(['"]aria-label['"]/, `${path} must not duplicate accessible status mutation`);
  }
});

test('shared status runtime executes overview, chapter, subchapter, aria, and graceful fallback behavior', async () => {
  const source = await read('public/voices/reader-runtime.js');
  const classNames = new Set();
  const status = {
    attrs: {},
    classList: { toggle: (name, enabled) => enabled ? classNames.add(name) : classNames.delete(name) },
    setAttribute(name, value) { this.attrs[name] = value; },
  };
  const numberNode = { textContent: '00' };
  const titleNode = { textContent: 'OVERVIEW' };
  status.querySelector = selector => selector === '.reading-status-number' ? numberNode : titleNode;
  const chapterNumber = { textContent: '00' };
  const mobileTitle = { textContent: 'Reader' };
  const nodes = {
    readingStatus: status,
    currentChapterNumber: chapterNumber,
  };
  const context = {
    window: {},
    document: {
      getElementById: id => nodes[id] ?? null,
      querySelector: selector => selector === '.header-mobile-title' ? mobileTitle : null,
    },
  };
  vm.runInNewContext(source, context);
  const controller = context.window.CarrotReader.createStatusController({ readerTitle: '테스트 리더' });

  controller.setChapter(null, '');
  assert.deepEqual([chapterNumber.textContent, mobileTitle.textContent, numberNode.textContent, titleNode.textContent, status.attrs['aria-label']], ['00', '테스트 리더: Overview', '00', 'OVERVIEW', '00 OVERVIEW']);
  controller.setChapter(2, '두 번째 장');
  assert.deepEqual([chapterNumber.textContent, mobileTitle.textContent, numberNode.textContent, titleNode.textContent, status.attrs['aria-label']], ['CH 02', '테스트 리더: Chapter 02', 'CHAPTER 02', '두 번째 장', 'CHAPTER 02 두 번째 장']);
  controller.set('2-3', '세부 항목', true);
  assert.deepEqual([numberNode.textContent, titleNode.textContent, status.attrs['aria-label'], classNames.has('is-subchapter')], ['2-3', '세부 항목', '2-3 세부 항목', true]);

  nodes.readingStatus = null;
  const fallback = context.window.CarrotReader.createStatusController({ readerTitle: '누락 리더' });
  assert.doesNotThrow(() => { fallback.set('x', 'y'); fallback.setChapter(1, 'z'); });
});

test('Liang transcript removes only the unsupported leading conjunction', async () => {
  const [source, rendered] = await Promise.all([
    read('public/voices/liang-wenfeng/long-reader-ko.json'),
    read('public/voices/liang-wenfeng/index.html'),
  ]);
  for (const [name, text] of [['source', source], ['rendered', rendered]]) {
    assert.doesNotMatch(text, /그리고 우리 회사의 다른 동료들도/, `${name} must remove the opening conjunction`);
    assert.match(text, /우리 회사의 다른 동료들도, 우리가 처음 이 회사를 시작했을 때/, `${name} must preserve the rest of the first sentence`);
    assert.equal((text.match(/그리고/g) || []).length, 30, `${name} must preserve every other occurrence of 그리고`);
  }
});
