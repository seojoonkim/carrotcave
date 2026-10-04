#!/usr/bin/env node
/** Move one published post to another category and regenerate the ontology exactly like publish does.
 *  Usage: node scripts/recategorize-post.mjs <slug> <탐험|빌딩|낙서|소설> */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { regenerateOntology } from './publish-single-message.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CATEGORIES = new Set(['탐험', '빌딩', '낙서', '소설']);

export function recategorizeSource(postsSource, slug, category) {
  if (!CATEGORIES.has(category)) throw new Error(`Unknown category: ${category}`);
  const at = postsSource.indexOf(`slug: '${slug}'`);
  if (at < 0) throw new Error(`Post not found: ${slug}`);
  const end = postsSource.indexOf('\n  },', at);
  const block = postsSource.slice(at, end < 0 ? undefined : end);
  const m = block.match(/category: "([^"]+)"/);
  if (!m) throw new Error(`No category field for ${slug}`);
  if (m[1] === category) return { source: postsSource, from: m[1], changed: false };
  const pos = at + m.index;
  return { source: postsSource.slice(0, pos) + `category: "${category}"` + postsSource.slice(pos + m[0].length), from: m[1], changed: true };
}

export function recategorizePost({ slug, category, root = ROOT, regenerate = regenerateOntology }) {
  const postsPath = join(root, 'data', 'posts.ts');
  const { source, from, changed } = recategorizeSource(readFileSync(postsPath, 'utf8'), slug, category);
  if (!changed) return { from, changed };
  writeFileSync(postsPath, source);
  const overridesPath = join(root, 'data', 'sync-metadata-overrides.json');
  const overrides = JSON.parse(readFileSync(overridesPath, 'utf8'));
  for (const meta of Object.values(overrides)) if (meta?.slug === slug) meta.category = category;
  writeFileSync(overridesPath, JSON.stringify(overrides, null, 2) + '\n');
  regenerate({ root }); // draft → build → audit, same order as publish
  return { from, changed };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [slug, category] = process.argv.slice(2);
  if (!slug || !category) { console.error('usage: recategorize-post.mjs <slug> <category>'); process.exit(2); }
  const r = recategorizePost({ slug, category });
  console.log(r.changed ? `Moved ${slug}: ${r.from} → ${category} (ontology regenerated)` : `${slug} already in ${category}`);
}
