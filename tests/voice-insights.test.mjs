import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const slugs = ['liang-wenfeng', 'liao-heng', 'sam-altman-startup-school-2026', 'yang-zhilin'];

function insightList(html) {
  const headingIndex = html.indexOf('CARROT CAVE INSIGHTS');
  assert.notEqual(headingIndex, -1);
  const afterHeading = html.slice(headingIndex);
  const listMatch = afterHeading.match(/<(ol|ul) class="overview-insights">([\s\S]*?)<\/\1>/);
  assert.ok(listMatch, 'overview insights must use the shared list class');
  return { tag: listMatch[1], body: listMatch[2] };
}

test('every voice overview has exactly five numbered insights', async () => {
  for (const slug of slugs) {
    const html = await readFile(new URL(`public/voices/${slug}/index.html`, root), 'utf8');
    const list = insightList(html);
    assert.equal(list.tag, 'ol', `${slug} must use an ordered list`);
    assert.equal((list.body.match(/<li>/g) || []).length, 5, `${slug} must expose exactly five insights`);
  }
});

test('shared insight numbering is visible and aligned without custom text bullets', async () => {
  const css = await readFile(new URL('public/voices/reader-system.css', root), 'utf8');
  assert.match(css, /\.overview-insights \{[^}]*list-style: decimal/);
  assert.match(css, /\.overview-insights li::marker \{[^}]*font-variant-numeric: tabular-nums/);
});
