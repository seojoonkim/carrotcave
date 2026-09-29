import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const idEpisodes = {
  'masayoshi-son-asi-economy': 'items',
  'sam-altman-startup-school-2026': 'segments',
  'tibo-ai-wave': 'items',
  'yang-zhilin': 'segments',
};
test('shared runtime marks id-based key sentences for every episode', () => {
  const runtime = read('public/voices/reader-runtime.js');
  assert.match(runtime, /const markKeySentences = \(items\) =>/);
  assert.match(runtime, /fetch\('key-sentences\.json'\)/);
  assert.match(runtime, /mark\.className = 'key-sentence'/);
});
test('every id-based episode ships 12-16 exact, single-segment key sentences', () => {
  for (const [slug, key] of Object.entries(idEpisodes)) {
    const path = `public/voices/${slug}/key-sentences.json`;
    assert.ok(existsSync(new URL('../' + path, import.meta.url)), `${slug} key sentences missing`);
    const items = JSON.parse(read(path));
    assert.ok(items.length >= 12 && items.length <= 16, `${slug}: ${items.length}`);
    const byId = new Map(JSON.parse(read(`public/voices/${slug}/transcript-ko.json`))[key].map((x) => [x.id, x.text]));
    for (const { id, exact_quote: q } of items) {
      const text = byId.get(id);
      assert.ok(text, `${slug}: unknown id ${id}`);
      assert.equal(text.split(q).length - 1, 1, `${slug}#${id}: quote must occur exactly once`);
    }
  }
});
test('voice readers share one key-sentence style and a 12px label floor', () => {
  const css = read('public/voices/reader-system.css');
  for (const selector of ['#transcript mark.key-sentence,', '.utterance mark.key-sentence,', '#transcript .paragraph-text .transcript-highlight {']) {
    assert.ok(css.includes(selector), `missing shared key-sentence selector ${selector}`);
  }
  assert.match(css, /\.header-site-title,[\s\S]*?\.rail-chapter-time,[\s\S]*?\{ font-size: 12px !important; \}/);
});
