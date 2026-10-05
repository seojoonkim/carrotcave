import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const json = (p) => JSON.parse(read(p));
const HANGUL = /[\uac00-\ud7a3]/;
const words = (t) => t.replace(/>>/g, ' ').split(/\s+/).filter(Boolean);

// Voices recorded in English: their English page reads the ORIGINAL English transcript.
const ENGLISH_VOICES = {
  'mark-zuckerberg-muse': () => json('public/voices/mark-zuckerberg-muse/source-en.json').segments.map((s) => s.text).join(' '),
  'tibo-ai-wave': () => json('public/voices/tibo-ai-wave/transcript-en.json').segments.map((s) => s.text).join(' '),
  'sam-altman-startup-school-2026': () => json('data/voice-sources/sam-altman-startup-school-2026.en.json').segments.map((s) => s.text).join(' '),
};

test('English-language voices ship an English reader built from the original captions, word for word', () => {
  for (const [slug, captions] of Object.entries(ENGLISH_VOICES)) {
    const reader = json(`public/voices/${slug}/transcript-en-reader.json`);
    assert.equal(reader.language, 'en', slug);
    assert.match(reader.method, /Original .*English captions/, `${slug}: must say it is the original English`);
    assert.ok(reader.items.length > 50, slug);
    reader.items.forEach((item, i) => {
      assert.equal(item.id, i, `${slug} id ${i}`);
      assert.ok(item.speaker && item.text.trim(), `${slug} paragraph ${i}`);
      assert.doesNotMatch(item.text, HANGUL, `${slug} paragraph ${i} has Korean`);
    });
    // No word added, dropped, or changed relative to the source captions.
    assert.deepEqual(words(reader.items.map((i) => i.text).join(' ')), words(captions()), `${slug}: English text must equal the caption words`);
  }
});

test('English voice reader pages are fully English and load the English transcript', () => {
  for (const slug of Object.keys(ENGLISH_VOICES)) {
    const html = read(`public/voices/${slug}/index.en.html`);
    assert.match(html, /<html lang="en"/, slug);
    const visible = html
      .replace(/<(script|style|svg)\b[\s\S]*?<\/\1>/g, '')
      .replace(/<!--[\s\S]*?-->/g, '');
    const textNodes = [...visible.matchAll(/>([^<>]*)</g)].map((m) => m[1]).filter((t) => HANGUL.test(t));
    const attrs = [...visible.matchAll(/\s(?:aria-label|alt|title|content|placeholder)="([^"]*)"/g)].map((m) => m[1]).filter((t) => HANGUL.test(t));
    assert.deepEqual([...textNodes, ...attrs], [], `${slug}: Korean left on the English reader`);
    assert.match(html, /href="\/en\/voices"/, `${slug}: back link stays on the English site`);
    const script = read(`public/voices/${slug}/script.js`);
    assert.match(script, /'transcript-en-reader\.json'/, `${slug}: English page must fetch the English transcript`);
    assert.match(script, /CarrotReader\.renderEnglishTranscript/, slug);
  }
});

test('/en/voices/<slug> frames the English reader when one exists, otherwise the Korean reader on the English site', () => {
  const page = read('app/en/voices/[slug]/page.tsx');
  assert.ok(page.includes("'index.en.html'"));
  assert.match(page, /\?lang=en/);
  assert.match(page, /\{!english && <p className="voice-reader-lang-note">/, 'Korean-only notice only when no English reader');
});

test('every voice reader shows the KO / EN switch at the right end of the date line, like posts', () => {
  const runtime = read('public/voices/reader-runtime.js');
  assert.match(runtime, /document\.querySelector\('\.hero > \.hero-date'\)/);
  assert.match(runtime, /\/voices\/\$\{voiceSlug\}`\], \['en', 'EN', ' English', `\/en\/voices\/\$\{voiceSlug\}`/);
  assert.match(runtime, /a\.target = '_top'/, 'switch must navigate the whole page, not the iframe');
  const css = read('public/voices/reader-system.css');
  assert.match(css, /\.hero > \.hero-date \.cc-lang\{margin-left:auto/);
  // Long (English) date lines wrap inside the text column; the switch never drops to its own line.
  assert.match(css, /\.hero > \.hero-date\{flex-wrap:nowrap;/);
  assert.match(runtime, /text\.className = 'hero-date__text';/);
  const interviews = read('data/interviews.ts');
  for (const slug of [...interviews.matchAll(/slug: '([^']+)'/g)].map((m) => m[1])) {
    const html = read(`public/voices/${slug}/index.html`);
    assert.match(html, /class="hero-date"/, `${slug}: needs a date line for the switch`);
    assert.match(html, /\.\.\/reader-runtime\.js/, `${slug}: must load the shared runtime`);
  }
});

test('voice reading end switches to English on English pages', () => {
  const end = read('public/voices/reading-end.js');
  assert.match(end, /var EN = document\.documentElement\.lang === 'en' \|\| new URLSearchParams\(location\.search\)\.get\('lang'\) === 'en';/);
  assert.match(end, /base: '\/en\/voices\/'/);
  assert.match(end, /"en":\{"name":"Tibo"/);
});

test('English voice transcripts are rebuilt by a script, not edited by hand', () => {
  assert.ok(existsSync(new URL('../scripts/i18n/build-voice-en-transcripts.py', import.meta.url)));
  assert.ok(existsSync(new URL('../scripts/i18n/build-voice-en-readers.py', import.meta.url)));
});

// Voices recorded in another language (Chinese / Japanese / Korean): the English page reads an English
// translation of the reviewed edition — never the Korean text.
const TRANSLATED_VOICES = {
  'liao-heng': (d) => [...d.paragraphs.map((p) => p.text), ...d.chapters.map((c) => c.title), ...d.highlights.map((h) => h.title)],
  'yang-zhilin': (d) => d.segments.map((s) => s.text),
  'masayoshi-son-asi-economy': (d) => [...d.items.map((i) => i.text), ...d.chapters.map((c) => c.title)],
};

test('every published voice has a fully English reader page', () => {
  const interviews = read('data/interviews.ts');
  for (const slug of [...interviews.matchAll(/slug: '([^']+)'/g)].map((m) => m[1])) {
    assert.ok(existsSync(new URL(`../public/voices/${slug}/index.en.html`, import.meta.url)), `${slug}: English reader page missing`);
    const html = read(`public/voices/${slug}/index.en.html`);
    assert.match(html, /<html lang="en"/, slug);
    const visible = html.replace(/<(script|style|svg)\b[\s\S]*?<\/\1>/g, '').replace(/<!--[\s\S]*?-->/g, '');
    const left = [...visible.matchAll(/>([^<>]*)</g)].map((m) => m[1]).filter((t) => HANGUL.test(t));
    assert.deepEqual(left, [], `${slug}: Korean left on the English reader`);
  }
});

test('translated voices ship an English transcript with the same shape as the Korean one', () => {
  for (const [slug, texts] of Object.entries(TRANSLATED_VOICES)) {
    const ko = json(`public/voices/${slug}/transcript-ko.json`);
    const en = json(`public/voices/${slug}/transcript-en.json`);
    assert.equal(en.language, 'en', slug);
    const kt = texts(ko), et = texts(en);
    assert.equal(et.length, kt.length, `${slug}: same number of paragraphs`);
    et.forEach((t, i) => {
      if (kt[i].trim()) assert.ok(t.trim(), `${slug} item ${i} empty`);
      assert.doesNotMatch(t, HANGUL, `${slug} item ${i} has Korean`);
    });
    assert.match(read(`public/voices/${slug}/script.js`), /'transcript-en\.json'/, `${slug}: English page must fetch transcript-en.json`);
  }
});

test('English key sentences quote the English text exactly', () => {
  for (const slug of [...Object.keys(TRANSLATED_VOICES), ...Object.keys(ENGLISH_VOICES)]) {
    const keys = json(`public/voices/${slug}/key-sentences.en.json`);
    assert.ok(keys.length >= 10, `${slug}: at least 10 English key sentences (house rule)`);
    for (const k of keys) assert.doesNotMatch(k.exact_quote, HANGUL, slug);
    if (ENGLISH_VOICES[slug]) {
      const items = json(`public/voices/${slug}/transcript-en-reader.json`).items;
      for (const k of keys) assert.equal(items[k.id].text.split(k.exact_quote).length - 1, 1, `${slug}: quote must occur once in English paragraph ${k.id}`);
    }
  }
});


test('voice scripts never emit a Korean-only label on the English page', () => {
  for (const slug of Object.keys(TRANSLATED_VOICES)) {
    const dir = `public/voices/${slug}`;
    for (const file of ['script.js', 'transcript-format.js']) {
      const path = new URL(`../${dir}/${file}`, import.meta.url);
      if (!existsSync(path)) continue;
      const code = read(`${dir}/${file}`).replace(/\/\/.*$/gm, '');
      for (const m of code.matchAll(/(['`])((?:(?!\1).)*[가-힣](?:(?!\1).)*)\1/g)) {
        const before = code.slice(Math.max(0, m.index - 220), m.index);
        assert.match(before, /lang === 'en'|\bEN\b/, `${slug}/${file}: Korean literal ${m[0].slice(0, 40)} has no English branch`);
      }
    }
  }
});
