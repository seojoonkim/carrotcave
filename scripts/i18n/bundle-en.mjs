#!/usr/bin/env node
// Bundle per-post translations (data/en/posts/<slug>.json) into data/en/posts.json for the site,
// and report coverage. Stale translations (Korean source changed since translation) are still bundled
// but listed so translate-posts.mjs can refresh them.
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dir = join(root, 'data/en/posts');
const { posts } = await import('../../data/posts.ts');
const { sourceHash } = await import('./translate-posts.mjs');

const out = {};
const missing = [];
const stale = [];
for (const p of posts) {
  const f = join(dir, `${p.slug}.json`);
  if (!existsSync(f)) { missing.push(p.slug); continue; }
  const d = JSON.parse(readFileSync(f, 'utf8'));
  if (d.sourceHash !== sourceHash(p)) stale.push(p.slug);
  out[p.slug] = { title: d.title, summary: d.summary, content: d.content };
}
writeFileSync(join(root, 'data/en/posts.json'), JSON.stringify(out, null, 0) + '\n');
console.log(`bundled ${Object.keys(out).length}/${posts.length} posts → data/en/posts.json`);
if (missing.length) console.log(`missing (${missing.length}): ${missing.join(', ')}`);
if (stale.length) console.log(`stale (${stale.length}): ${stale.join(', ')}`);
if (process.argv.includes('--strict') && (missing.length || stale.length)) process.exit(1);
