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
