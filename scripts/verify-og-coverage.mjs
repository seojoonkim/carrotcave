// Every public HTML page must declare og:image AND twitter:image, and each image URL must return a 1200x630 PNG/JPEG.
// 2026-10-05: /en (English home) shipped with no og:image because app/en/layout.tsx + app/en/page.tsx overrode
// `openGraph` without `images`; the per-page OG gate only sampled 15 URLs and never looked at /en.
// Usage: node scripts/verify-og-coverage.mjs [baseUrl]   (exit 1 on any page missing or broken)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
const base = (process.argv[2] || process.env.APP_URL || 'https://carrotcave.com').replace(/\/$/, '');

async function text(u) { const r = await fetch(u, { redirect: 'follow' }); return { status: r.status, body: await r.text() }; }
function meta(h, key) {
  const re = new RegExp(`<meta[^>]+(?:property|name)="${key}"[^>]*content="([^"]+)"|<meta[^>]+content="([^"]+)"[^>]*(?:property|name)="${key}"`, 'i');
  const m = h.match(re); return m ? (m[1] || m[2]).replace(/&amp;/g, '&') : null;
}
function pngSize(buf) {
  if (buf[0] === 0x89 && buf[1] === 0x50) return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length) { if (buf[i] !== 0xff) { i++; continue; } const m = buf[i + 1]; const len = buf.readUInt16BE(i + 2);
      if (m >= 0xc0 && m <= 0xc3) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)]; i += 2 + len; }
  }
  return null;
}

// Page list comes from the repo (posts + voice readers), not a sitemap (the site has none).
const postSlugs = [...readFileSync('data/posts.ts', 'utf8').matchAll(/slug: ?'([^']+)'/g)].map((m) => m[1]);
const voiceSlugs = readdirSync('public/voices', { withFileTypes: true }).filter((d) => d.isDirectory() && existsSync(`public/voices/${d.name}/index.html`)).map((d) => d.name);
const urls = [
  ...postSlugs.flatMap((s) => [`${base}/posts/${s}`, `${base}/en/posts/${s}`]),
  ...voiceSlugs.flatMap((s) => [`${base}/voices/${s}`, `${base}/en/voices/${s}`]),
  base + '/', base + '/newsletter', base + '/en/newsletter',
];
const extra = ['/en', '/voices', '/en/voices', '/this-page-does-not-exist', '/en/this-page-does-not-exist'].map((p) => base + p);
const pages = [...new Set([...urls, ...extra])];
const failures = []; const images = new Map();
const queue = [...pages];
async function worker() {
  while (queue.length) {
    const u = queue.shift();
    try {
      const { body } = await text(u);
      const og = meta(body, 'og:image'); const tw = meta(body, 'twitter:image');
      if (!og) failures.push(`${u.replace(base, '')}: no og:image`);
      if (!tw) failures.push(`${u.replace(base, '')}: no twitter:image`);
      for (const i of [og, tw]) if (i) images.set(i, u);
    } catch (e) { failures.push(`${u}: fetch ${e.message}`); }
  }
}
await Promise.all(Array.from({ length: 12 }, worker));
const iq = [...images.keys()];
async function iworker() {
  while (iq.length) {
    const i = iq.shift();
    try {
      // Pre-deploy runs: og URLs are absolute to production (metadataBase), so read images from the server under test.
      const r = await fetch(i.replace(/^https:\/\/carrotcave\.com/, base)); const buf = Buffer.from(await r.arrayBuffer());
      const sz = r.ok ? pngSize(buf) : null;
      if (!r.ok || !sz || sz[0] !== 1200 || sz[1] !== 630) failures.push(`${images.get(i).replace(base, '')}: image ${r.status} ${sz ? sz.join('x') : 'unreadable'} ${i.replace(base, '')}`);
    } catch (e) { failures.push(`${i}: image fetch ${e.message}`); }
  }
}
await Promise.all(Array.from({ length: 8 }, iworker));
console.log(JSON.stringify({ base, pages: pages.length, images: images.size, failures: failures.slice(0, 40), failureCount: failures.length }));
if (failures.length) process.exitCode = 1;
