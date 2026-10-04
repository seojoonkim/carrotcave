// Fails the build when .next serves stale CSS (Turbopack cache reused old globals.css).
// Usage: node scripts/check-build-css-fresh.mjs [expectedGraphite]
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const src = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const expected = (process.argv[2] || (src.match(/--graphite:\s*(#[0-9a-fA-F]{6})/) || [])[1] || '').toLowerCase();
if (!expected) { console.error('check-build-css-fresh: --graphite not found in app/globals.css'); process.exit(1); }
const files = [];
const walk = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? walk(p) : p.endsWith('.css') && files.push(p); } };
try { walk(new URL('../.next/static', import.meta.url).pathname); } catch { console.error('check-build-css-fresh: .next/static missing'); process.exit(1); }
const hit = files.filter((f) => readFileSync(f, 'utf8').toLowerCase().includes(`--graphite:${expected}`));
if (!hit.length) { console.error(`check-build-css-fresh: built CSS does not contain --graphite:${expected} (stale build cache). Run: rm -rf .next && npm run build`); process.exit(1); }
console.log(`check-build-css-fresh: ok (${expected} in ${hit.length} file)`);
