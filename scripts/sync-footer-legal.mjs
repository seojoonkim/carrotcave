// Sync the shared copyright line (data/site-legal.json) into every static voice reader footer.
// Idempotent: replaces an existing .voice-shared-footer__legal line or inserts one after the links row.
// Usage: node scripts/sync-footer-legal.mjs [--check]   (--check exits 1 if any file is out of date)
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const legal = JSON.parse(readFileSync(join(root, 'data/site-legal.json'), 'utf8'));

export function latestPostYear() {
  const src = readFileSync(join(root, 'data/posts.ts'), 'utf8');
  const years = [...src.matchAll(/date:\s*'(\d{4})-/g)].map((m) => Number(m[1]));
  return Math.max(legal.since, ...years);
}

export function copyrightLine(latest = latestPostYear()) {
  const range = latest > legal.since ? `${legal.since}–${latest}` : String(legal.since);
  return `© ${range} ${legal.holder}. ${legal.rights}`;
}

export function voiceFooterFiles() {
  const dir = join(root, 'public/voices');
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((d) => ['index.html', 'index.en.html'].map((f) => join(dir, d.name, f)))
    .filter((f) => existsSync(f));
}

export function applyLegal(html, line = copyrightLine()) {
  const tag = `<p class="voice-shared-footer__legal"><small>${line}</small></p>`;
  if (/<p class="voice-shared-footer__legal">[\s\S]*?<\/p>/.test(html)) {
    return html.replace(/<p class="voice-shared-footer__legal">[\s\S]*?<\/p>/, tag);
  }
  const m = html.match(/(<p class="voice-shared-footer__links">[\s\S]*?<\/p>)/);
  if (!m) throw new Error('voice footer links row not found');
  return html.replace(m[1], m[1] + tag);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  const line = copyrightLine();
  const stale = [];
  for (const f of voiceFooterFiles()) {
    const html = readFileSync(f, 'utf8');
    const next = applyLegal(html, line);
    if (next !== html) {
      stale.push(f.slice(root.length + 1));
      if (!check) writeFileSync(f, next);
    }
  }
  console.log(JSON.stringify({ line, files: voiceFooterFiles().length, [check ? 'stale' : 'updated']: stale }));
  if (check && stale.length) process.exit(1);
}
