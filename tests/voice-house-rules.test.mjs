// Voice reader house rules. Every published voice must follow them; new voices fail here until they do.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (p) => readFile(new URL(p, root), 'utf8');
const exists = (p) => access(new URL(p, root)).then(() => true, () => false);

const interviews = await read('data/interviews.ts');
const published = [...interviews.matchAll(/slug: '([^']+)'[\s\S]*?status: '(published|draft)'/g)]
  .filter((m) => m[2] === 'published')
  .map((m) => m[1]);
const sharedCss = await read('public/voices/reader-system.css');

test('there are published voices to check', () => {
  assert.ok(published.length >= 8, `found ${published.length}`);
});

for (const slug of published) {
  const dir = `public/voices/${slug}/`;

  test(`${slug}: key sentences are highlighted (rule 1)`, async () => {
    const html = await read(`${dir}index.html`);
    const staticMarks = (html.match(/<mark class="key-sentence">/g) || []).length;
    let rendered = 0;
    // Shared runtime (reader-runtime.js) marks every exact_quote in key-sentences.json.
    if (/reader-runtime\.js/.test(html) && await exists(`${dir}key-sentences.json`)) {
      const items = JSON.parse(await read(`${dir}key-sentences.json`));
      if (items.length && items.every((i) => Number.isInteger(i?.id) && i.exact_quote)) rendered = items.length; // mirrors reader-runtime.js guard
    }
    if (await exists(`${dir}script.js`)) {
      const js = await read(`${dir}script.js`);
      if (/className = 'key-sentence'/.test(js)) {
        if (await exists(`${dir}key-sentences.json`)) rendered = JSON.parse(await read(`${dir}key-sentences.json`)).length;
        if (await exists(`${dir}transcript-ko.json`)) {
          const t = await read(`${dir}transcript-ko.json`);
          rendered = Math.max(rendered, (t.match(/"highlights"\s*:\s*\[\s*"/g) || []).length);
        }
      }
    }
    assert.ok(staticMarks + rendered >= 10, `${slug} has ${staticMarks} static + ${rendered} rendered key sentences; need at least 10`);
  });

  test(`${slug}: interview date at the start of the reader (rule 2)`, async () => {
    const html = await read(`${dir}index.html`);
    const m = html.match(/<\/h1>\s*<p class="hero-date">([^<]+)<time datetime="(\d{4}-\d{2}-\d{2})">(\d{4})년 (\d{1,2})월 (\d{1,2})일<\/time>/);
    assert.ok(m, `${slug} needs <p class="hero-date">LABEL <time datetime="YYYY-MM-DD">…</time> right after the h1`);
    assert.match(m[1].trim(), /^(대담|인터뷰|공개|강연|강연 영상 공개|회의|녹화)$/, `${slug} date label must say what the date is`);
    const [y, mo, d] = m[2].split('-').map(Number);
    assert.deepEqual([Number(m[3]), Number(m[4]), Number(m[5])], [y, mo, d], `${slug} visible date must match datetime`);
  });

  test(`${slug}: hero photo is shown without fade (rule 3)`, async () => {
    const html = await read(`${dir}index.html`);
    assert.match(html, /<figure class="hero-portrait">/, `${slug} needs a hero portrait`);
  });
}

test('shared reader CSS removes the photo fade and unifies the highlight style', () => {
  assert.match(sharedCss, /\.hero-portrait img \{[^}]*mask-image: none !important;[^}]*filter: none !important;/);
  assert.match(sharedCss, /\.key-sentence \{ color: var\(--ansi-yellow/);
  assert.match(sharedCss, /\.hero-date \{/);
});
