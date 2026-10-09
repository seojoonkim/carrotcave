// 2026-10-10 Simon: "날짜를 저렇게 하지 말고(영미권 표기로 좀 이상하니, 글로벌한 표기법으로 바꾸자)"
// Every reader-facing date is ISO 8601 (2026-10-08) in both locales: no "10.8", "2026.10.08", "Oct 8, 2026".
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('formatDate is ISO 8601 for every locale', () => {
  const src = read('lib/i18n.ts');
  const body = src.slice(src.indexOf('export function formatDate'), src.indexOf('}', src.indexOf('export function formatDate')) + 1);
  assert.doesNotMatch(body, /replaceAll\('-', '\.'\)/, 'ko dotted date');
  assert.doesNotMatch(body, /MONTHS\[/, 'en month-name date');
});

test('no reader-facing component builds its own non-ISO date', () => {
  for (const f of ['components/HomeEditorial.tsx', 'components/EditorialCard.tsx', 'components/TweetEmbed.tsx', 'components/ArchiveList.tsx', 'components/views/PostView.tsx']) {
    const s = read(f);
    assert.doesNotMatch(s, /replaceAll\('-', '\.'\)/, `${f}: dotted date`);
    assert.doesNotMatch(s, /slice\(5, 7\)\)\}\.\$\{/, `${f}: month.day date`);
    assert.doesNotMatch(s, /toLocaleDateString\('en-US'/, `${f}: en-US date`);
  }
});

test('on phones the ISO date sits under the title instead of squeezing it', () => {
  const css = read('app/globals.css');
  assert.match(css, /\.ccx-tpost > \.ccx-tpost__d\{grid-row:2;grid-column:2/);
});
