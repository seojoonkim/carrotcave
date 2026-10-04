import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const i18n = read('lib/i18n.ts');

test('every Korean page has an /en twin', () => {
  for (const [ko, en] of [
    ['app/page.tsx', 'app/en/page.tsx'],
    ['app/posts/[slug]/page.tsx', 'app/en/posts/[slug]/page.tsx'],
    ['app/posts/[slug]/opengraph-image.tsx', 'app/en/posts/[slug]/opengraph-image.tsx'],
    ['app/voices/page.tsx', 'app/en/voices/page.tsx'],
    ['app/voices/[slug]/page.tsx', 'app/en/voices/[slug]/page.tsx'],
    ['app/newsletter/page.tsx', 'app/en/newsletter/page.tsx'],
    ['app/not-found.tsx', 'app/en/not-found.tsx'],
    ['app/rss.xml/route.ts', 'app/en/rss.xml/route.ts'],
  ]) {
    assert.ok(existsSync(new URL(`../${ko}`, import.meta.url)), ko);
    assert.ok(existsSync(new URL(`../${en}`, import.meta.url)), `${en} missing (twin of ${ko})`);
  }
  assert.match(read('app/en/layout.tsx'), /description: dict\.en\.siteDescription/, 'English pages default to English metadata');
});

test('ko and en UI dictionaries have the same keys', () => {
  const block = (name) => {
    const start = i18n.indexOf(`  ${name}: {`, i18n.indexOf('export const dict'));
    const end = i18n.indexOf('\n  },', start);
    return [...i18n.slice(start, end).matchAll(/^ {4}(\w+):/gm)].map((m) => m[1]).sort();
  };
  const ko = block('ko'), en = block('en');
  assert.ok(ko.length > 60, `dictionary looks too small (${ko.length})`);
  assert.deepEqual(en, ko);
});

test('English copy has no Hangul except the language switch label', () => {
  const start = i18n.indexOf('  en: {', i18n.indexOf('export const dict'));
  const en = i18n.slice(start, i18n.indexOf('\n  },', start)).replace(/otherLangLabel: '한국어',/, '')
    .replace(/(?:탐험|빌딩|낙서|소설): /g, ''); // object keys = data values, never rendered
  assert.doesNotMatch(en, /[\uac00-\ud7a3]/);
});

test('all posts and voices have an English version that keeps every link', async () => {
  const { posts } = await import('../data/posts.ts');
  const { interviews } = await import('../data/interviews.ts');
  const en = JSON.parse(read('data/en/posts.json'));
  const voices = JSON.parse(read('data/en/voices.json'));
  const urls = (s) => (s.match(/https?:\/\/[^\s)\]>"']+/g) ?? []);
  for (const p of posts) {
    const t = en[p.slug];
    assert.ok(t, `no English translation for ${p.slug}`);
    assert.ok(t.title && t.summary && t.content, `empty English field in ${p.slug}`);
    const missing = urls(p.content).filter((u) => !t.content.includes(u));
    assert.deepEqual(missing, [], `${p.slug} lost links in translation`);
    assert.ok(((t.title + t.summary + t.content).match(/[\uac00-\ud7a3]/g) ?? []).length <= 40, `${p.slug} still has Korean text`);
  }
  for (const v of interviews) assert.ok(voices[v.slug]?.title, `no English voice entry for ${v.slug}`);
});

test('language toggle sits in every header and maps section names', () => {
  assert.match(read('components/SiteHeader.tsx'), /<LangToggle locale=\{locale\} \/>/);
  const toggle = read('components/LangToggle.tsx');
  assert.match(toggle, /swapLocalePath/);
  assert.match(toggle, /AXIS_SLUG/);
  assert.match(i18n, /return path === '\/' \? '\/en'/);
});
