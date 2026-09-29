#!/usr/bin/env node
// Collects preview metadata for URLs that stand on their own line in post bodies.
// - YouTube: oEmbed title/channel + locally stored thumbnail (public/media/link-previews/yt-<id>.jpg)
// - Other links: og:title / og:site_name / og:description; Medium falls back to the publication RSS feeds
// Existing entries are kept; pass --refresh to refetch everything.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { posts } from '../data/posts.ts';
import { findPreviewBlocks, standaloneLinkOf, unwrapTelegramLinkPreview, youTubeIdOf } from '../lib/link-preview.ts';

const OUT = new URL('../data/link-previews.json', import.meta.url);
const THUMB_DIR = new URL('../public/media/link-previews/', import.meta.url);
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36', 'Accept-Language': 'ko,en;q=0.8' };
const refresh = process.argv.includes('--refresh');
const previews = existsSync(OUT) && !refresh ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
mkdirSync(THUMB_DIR, { recursive: true });

const decode = (s) => s?.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const metaOf = (html, key) => decode(
  html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)`, 'i'))?.[1]
  ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`, 'i'))?.[1],
);
const bad = (t) => !t || /attention required|just a moment|cloudflare|access denied|404|not found/i.test(t);

async function saveImage(src, pageUrl) {
  if (!src) return undefined;
  try {
    const abs = new URL(src.replace(/&amp;/g, '&'), pageUrl).href;
    const r = await fetch(abs, { headers: UA, signal: AbortSignal.timeout(15000) });
    const type = r.headers.get('content-type') || '';
    if (!r.ok || !/^image\/(png|jpe?g|webp|gif)/.test(type)) return undefined;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 2000) return undefined;
    const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : type.includes('gif') ? 'gif' : 'jpg';
    const name = `og-${createHash('sha1').update(pageUrl).digest('hex').slice(0, 12)}.${ext}`;
    writeFileSync(new URL(name, THUMB_DIR), buf);
    return `/media/link-previews/${name}`;
  } catch { return undefined; }
}

let mediumFeed;
async function mediumTitles() {
  if (mediumFeed) return mediumFeed;
  mediumFeed = new Map();
  for (const feed of ['https://medium.com/feed/hashed-kr', 'https://medium.com/feed/@seojoonkim']) {
    try {
      const xml = await (await fetch(feed, { headers: UA })).text();
      for (const item of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
        const title = item[1].match(/<title><!\[CDATA\[([\s\S]*?)\]\]>/)?.[1];
        const link = item[1].match(/<link>([^<]+)<\/link>/)?.[1];
        const key = link?.match(/-([0-9a-f]{10,12})(?:\?|$)/)?.[1];
        const image = item[1].match(/<img[^>]+src="([^"]+)"/)?.[1];
        if (key && title && !mediumFeed.has(key)) mediumFeed.set(key, { title: decode(title), image });
      }
    } catch { /* feed optional */ }
  }
  return mediumFeed;
}

async function youtube(url, id) {
  const o = await (await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`, { headers: UA })).json();
  const file = new URL(`yt-${id}.jpg`, THUMB_DIR);
  if (!existsSync(file)) {
    for (const size of ['maxresdefault', 'sddefault', 'hqdefault']) {
      const r = await fetch(`https://i.ytimg.com/vi/${id}/${size}.jpg`, { headers: UA });
      if (r.ok) { writeFileSync(file, Buffer.from(await r.arrayBuffer())); break; }
    }
  }
  return { kind: 'youtube', id, title: decode(o.title), siteName: 'YouTube', author: decode(o.author_name), thumbnail: `/media/link-previews/yt-${id}.jpg` };
}

async function page(url) {
  const entry = { kind: 'link' };
  try {
    const r = await fetch(url, { headers: UA, redirect: 'follow', signal: AbortSignal.timeout(15000) });
    if (r.ok) {
      const html = (await r.text()).slice(0, 600000);
      const title = metaOf(html, 'og:title') ?? metaOf(html, 'twitter:title') ?? decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
      if (!bad(title)) entry.title = title;
      entry.siteName = metaOf(html, 'og:site_name');
      const description = metaOf(html, 'og:description') ?? metaOf(html, 'description');
      if (description && !bad(description)) entry.description = description;
      entry.image = await saveImage(metaOf(html, 'og:image') ?? metaOf(html, 'twitter:image') ?? metaOf(html, 'og:image:url'), url);
    } else entry.status = r.status;
  } catch (e) { entry.status = String(e.name || 'error'); }
  if ((!entry.title || !entry.image) && /medium\.com/.test(url)) {
    const key = url.match(/-([0-9a-f]{10,12})(?:\?|$)/)?.[1];
    const hit = key && (await mediumTitles()).get(key);
    if (hit) {
      entry.title ??= hit.title; entry.siteName = 'Medium'; delete entry.status;
      entry.image ??= await saveImage(hit.image, url);
    }
  }
  if (!entry.image) delete entry.image;
  return entry;
}

const urls = new Set();
const telegramFallback = new Map();
for (const post of posts) {
  const lines = unwrapTelegramLinkPreview(post.content).split('\n');
  const blocks = findPreviewBlocks(lines);
  lines.forEach((line, i) => {
    const hit = standaloneLinkOf(line);
    if (!hit || hit.isTweet) return;
    urls.add(hit.url);
    const next = blocks.find((b) => b.start > i && lines.slice(i + 1, b.start).every((l) => !l.trim()));
    if (next?.title) telegramFallback.set(hit.url, next);
  });
}
let added = 0;
for (const [url, fb] of telegramFallback) if (previews[url] && !previews[url].title) Object.assign(previews[url], { title: fb.title, siteName: previews[url].siteName ?? fb.site, description: previews[url].description ?? fb.description, source: 'telegram-preview' });
for (const url of [...urls].sort()) {
  if (previews[url]) continue;
  const id = youTubeIdOf(url);
  previews[url] = id ? await youtube(url, id) : await page(url);
  const fb = telegramFallback.get(url);
  if (!previews[url].title && fb) Object.assign(previews[url], { title: fb.title, siteName: previews[url].siteName ?? fb.site, description: previews[url].description ?? fb.description, source: 'telegram-preview' });
  added++;
  console.log(previews[url].kind, url, '→', previews[url].title ?? `(no title${previews[url].status ? `, ${previews[url].status}` : ''})`);
}
// Manual fallbacks for sites that block every fetch path (fills only missing fields)
const overrides = JSON.parse(readFileSync(new URL('../data/link-preview-overrides.json', import.meta.url), 'utf8'));
for (const [url, o] of Object.entries(overrides)) if (previews[url]) for (const [k, v] of Object.entries(o)) previews[url][k] ??= v;
writeFileSync(OUT, `${JSON.stringify(Object.fromEntries(Object.entries(previews).sort()), null, 2)}\n`);
console.log(`standalone links ${urls.size}, added ${added}, total ${Object.keys(previews).length}`);
