#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { readFileSync, existsSync, realpathSync } from 'node:fs';

export function checkReleaseBaseline({ cwd = process.cwd(), remote = 'origin', branch = 'main', fetch = true } = {}) {
  const git = args => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const root = git(['rev-parse', '--show-toplevel']);
  if (realpathSync(root) !== realpathSync(cwd)) throw new Error(`Run from repository root: ${root}`);
  if (fetch) git(['fetch', '--no-tags', remote, branch]);
  const tip = git(['rev-parse', `${remote}/${branch}`]);
  try { git(['merge-base', '--is-ancestor', tip, 'HEAD']); }
  catch { throw new Error(`STALE_RELEASE: HEAD does not include ${remote}/${branch} (${tip}). Integrate the latest revision before deployment; do not force an older production snapshot.`); }
  return { root, head: git(['rev-parse','HEAD']), remoteTip: tip };
}

export async function checkEditorialBaseline(cwd=process.cwd()) {
  const rulesPath = path.join(cwd,'data/release-preservation.json');
  if (!existsSync(rulesPath)) throw new Error('Missing release-preservation.json');
  const rules = JSON.parse(readFileSync(rulesPath,'utf8'));
  const { posts } = await import(pathToFileURL(path.join(cwd,'data/posts.ts')).href);
  const byKey = new Map(posts.map(p => [p.telegramMsgId == null ? p.slug : String(p.telegramMsgId),p]));
  const errors=[];
  for(const [key,expected] of Object.entries(rules.categories)) {
    const actual=byKey.get(key);
    if(!actual) errors.push(`missing archived post ${key}`);
    else if(actual.category!==expected) errors.push(`${key}: category ${actual.category} differs from approved ${expected}`);
  }
  for(const asset of rules.requiredAssets) if(!existsSync(path.join(cwd,'public',asset))) errors.push(`missing preserved asset ${asset}`);
  const card=readFileSync(path.join(cwd,'components/EditorialCard.tsx'),'utf8');
  if(!card.includes(rules.fallbackImage)) errors.push('editorial fallback image not connected');
  if(errors.length) throw new Error(`EDITORIAL_REGRESSION: ${errors.join('; ')}`);
  return {posts:posts.length,preservedCategories:Object.keys(rules.categories).length,requiredAssets:rules.requiredAssets.length};
}
if(process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const local=process.argv.includes('--local-ref');
    const contentOnly=process.argv.includes('--content-only');
    const git=contentOnly?null:checkReleaseBaseline({fetch:!local});
    const editorial=await checkEditorialBaseline();
    console.log(JSON.stringify({status:'PASS',git,editorial}));
  } catch(e){console.error(e.message);process.exitCode=1;}
}
