// Fails when a share-card picture contains Korean text that is not yet excluded.
// macOS only (Vision OCR); elsewhere it reports "skipped" and exits 0.
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { posts } from '../data/posts.ts';
import { interviews } from '../data/interviews.ts';
import { archiveImageUrl } from '../lib/social-metadata.ts';

if (process.platform !== 'darwin') { console.log('og-image-text: skipped (needs macOS Vision)'); process.exit(0); }
const root = new URL('..', import.meta.url).pathname;
const paths = [...new Set([...posts.map(archiveImageUrl), ...interviews.map((v) => v.thumbnailUrl)])]
  .filter((p) => p && !/^https?:/.test(p) && existsSync(root + 'public' + p));
const r = spawnSync('swift', ['scripts/og-image-hangul.swift', root + 'public', ...paths], { cwd: root, encoding: 'utf8' });
if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
const found = JSON.parse(r.stdout);
const listed = new Set(JSON.parse(readFileSync(root + 'data/og-image-hangul.json', 'utf8')));
const missing = found.filter((p) => !listed.has(p));
console.log(JSON.stringify({ checked: paths.length, withKorean: found.length, notExcluded: missing }));
if (missing.length && process.argv.includes('--fix')) {
  const next = [...new Set([...listed, ...missing])].sort();
  writeFileSync(root + 'data/og-image-hangul.json', `${JSON.stringify(next, null, 2)}\n`);
  console.log(JSON.stringify({ excluded: missing }));
} else if (missing.length) { console.error('Add these to data/og-image-hangul.json'); process.exit(1); }
