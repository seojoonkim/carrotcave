// 2026-10-13 Simon: "왜 이름태그 밑에 이름이 또 나와? 중복출력 다 없애"
// The speaker tag is rendered by the reader; transcript text must never repeat the speaker name as a prefix.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';

const dir = new URL('../public/voices/', import.meta.url);
const slugs = readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('no voice transcript repeats the speaker name inside the text', () => {
  const bad = [];
  for (const slug of slugs) for (const file of ['transcript-ko.json', 'transcript-en-reader.json']) {
    const p = new URL(`${slug}/${file}`, dir);
    if (!existsSync(p)) continue;
    const data = JSON.parse(readFileSync(p, 'utf8'));
    const rows = data.segments || data.items || [];
    const names = new Set(rows.map((r) => (r.speaker || '').trim()).filter(Boolean));
    const re = new RegExp(`^\\s*\\[?\\s*(?:${[...names].map(esc).join('|')}|[A-Z][a-z]+ [A-Z][a-z]+)\\s*\\]?\\s*[:：]`);
    rows.forEach((r, i) => { if (re.test(r.text || '')) bad.push(`${slug}/${file}#${r.id ?? i}: ${r.text.slice(0, 40)}`); });
  }
  assert.deepEqual(bad, []);
});
