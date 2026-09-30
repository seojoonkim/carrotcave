// Live share-card check: fetch og:image from production pages and fail on Korean text (macOS Vision OCR).
// Samples: newest posts, every post whose card shows a picture, and every voice. Skips (exit 0) off macOS.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { posts } from '../data/posts.ts';
import { interviews } from '../data/interviews.ts';

const BASE = process.env.APP_URL || 'https://carrotcave.com';
if (process.platform !== 'darwin') { console.log('og-live-text: skipped (needs macOS Vision)'); process.exit(0); }
const root = new URL('..', import.meta.url).pathname;
const pages = [
  '/',
  ...posts.slice(0, 6).map((p) => `/posts/${p.slug}`),
  ...interviews.filter((v) => v.status === 'published').map((v) => `/voices/${v.slug}`),
];
const dir = mkdtempSync(path.join(tmpdir(), 'og-live-'));
const files = [];
const failures = [];
for (const page of pages) {
  const html = await (await fetch(BASE + page)).text();
  const m = html.match(/<meta property="og:image" content="([^"]+)"/);
  if (!m) { failures.push(`${page}: no og:image`); continue; }
  const res = await fetch(m[1].replace(/&amp;/g, '&'));
  if (res.status !== 200 || !/image\/png/.test(res.headers.get('content-type') || '')) { failures.push(`${page}: og:image ${res.status}`); continue; }
  const name = `/${page.replace(/\W+/g, '-') || 'home'}.png`;
  writeFileSync(dir + name, Buffer.from(await res.arrayBuffer()));
  files.push([page, name]);
}
const r = spawnSync('swift', ['scripts/og-image-hangul.swift', dir, ...files.map((f) => f[1])], { cwd: root, encoding: 'utf8' });
if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
const korean = JSON.parse(r.stdout);
for (const [page, name] of files) if (korean.includes(name)) failures.push(`${page}: Korean text in live share image`);
console.log(JSON.stringify({ base: BASE, checked: files.length, failures }));
if (failures.length) process.exit(1);
