import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const system = read('public/voices/reader-system.css');

// Simon 2026-10: the main voice of each reader is carrot orange; interviewers and audience get their own colors.
const readers = {
  'mark-zuckerberg-muse': { main: '마크 저커버그', others: ['알렉스 히스'] },
  'tibo-ai-wave': { main: 'Tibo', others: ['Matthew Berman'] },
  'sam-altman-startup-school-2026': { main: 'Sam Altman', others: ['Garry Tan', 'Audience'] },
  'masayoshi-son-asi-economy': { main: '손정의', others: [] },
};

test('shared speaker palette: main is carrot orange, host and audience are distinct', () => {
  const rule = (role) => (system.match(new RegExp(`\\.transcript-speaker\\[data-role="${role}"\\][^{]*\\{([^}]*)\\}`)) || [])[1] || '';
  assert.match(rule('main'), /color:\s*var\(--carrot-orange\)/);
  assert.match(rule('host'), /color:\s*#8fb3d9/);
  assert.match(rule('audience'), /color:\s*#9aa5b4/);
  assert.doesNotMatch(system, /#transcript \.speaker-person \{ color: #f5b27a; \}/);
});

test('every multi-speaker reader tags each speaker with a role', () => {
  for (const [slug, { main, others }] of Object.entries(readers)) {
    const js = read(`public/voices/${slug}/script.js`);
    assert.match(js, /dataset\.role\s*=/, `${slug} must set data-role on speaker tags`);
    assert.ok(js.includes(`'${main}'`), `${slug} must name its main speaker`);
    for (const o of others) assert.ok(js.includes(o), `${slug} must know ${o}`);
  }
});

test('no per-reader override paints the main speaker grey or the host orange', () => {
  const css = read('public/voices/mark-zuckerberg-muse/styles.css');
  assert.doesNotMatch(css, /speaker-person\[data-person="mark"\][^}]*#c3ccd8/);
  assert.doesNotMatch(css, /speaker-person\[data-person="alex"\][^}]*#f0be70/);
});
