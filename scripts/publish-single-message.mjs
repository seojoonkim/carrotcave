#!/usr/bin/env node
/**
 * Publish one reviewed Telegram message without scanning the channel or auditing
 * historical posts. Usage: npm run publish:telegram -- <numeric-message-id>
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_ROOT = join(dirname(SCRIPT_PATH), '..');
const CHANNEL = 'carrotcave';
const MIN_MEDIA_SIZE = 5 * 1024;
const ALLOWED_CATEGORIES = new Set(['탐험', '빌딩', '낙서', '소설']);
const ALLOWED_DEPTHS = new Set(['entry', 'mid', 'deep']);

export function parseMessageId(value) {
  if (!/^[1-9]\d*$/.test(value ?? '')) {
    throw new Error('A positive numeric message ID is required');
  }
  const id = Number(value);
  if (!Number.isSafeInteger(id)) throw new Error('A positive numeric message ID is required');
  return id;
}

export function hashContent(text) {
  const sample = text.slice(0, 200) + text.slice(-200);
  let hash = text.length;
  for (let index = 0; index < sample.length; index += 1) {
    hash = (hash * 31 + sample.charCodeAt(index)) >>> 0;
  }
  return `${text.length}:${hash}`;
}

function decodeHtml(value) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stripReactionSignature(content) {
  return content.replace(/(?:^|\n)\s*(?:\p{Extended_Pictographic}[\uFE0F\u200D\p{Extended_Pictographic}]*\s*\d+\s*)+\s*$/u, '').trimEnd();
}

function parseSingleMessage(html, requestedId) {
  const blocks = html.split('tgme_widget_message_wrap');
  const messages = [];

  for (const block of blocks) {
    const post = block.match(/data-post="([^"]+)"/);
    if (!post) continue;
    const [channel, rawId] = post[1].split('/');
    const id = Number(rawId);
    if (channel !== CHANNEL || !Number.isSafeInteger(id)) continue;

    const textMatch = block.match(/class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    const fullText = textMatch ? decodeHtml(textMatch[1]) : '';
    const lines = fullText.split('\n');
    const title = lines.shift()?.trim() || `Post ${id}`;
    const content = stripReactionSignature(lines.join('\n').trim() || fullText);
    const dateMatch = block.match(/datetime="([^"]+)"/);
    const reactionBlock = block.match(/tgme_widget_message_reactions[^>]*>([\s\S]*?)<\/div>/);
    const reactions = reactionBlock
      ? [...reactionBlock[1].matchAll(/<\/i>\s*(\d+)/g)].reduce((sum, match) => sum + Number(match[1]), 0)
      : 0;

    const mediaUrls = [];
    for (const match of block.matchAll(/background-image:url\(['"]?([^'")]+)['"]?\)/g)) {
      let url = match[1];
      if (url.startsWith('//')) url = `https:${url}`;
      if (!url.includes('/img/emoji/') && !url.includes('/img/tg/') && !mediaUrls.includes(url)) mediaUrls.push(url);
    }
    const videoUrls = [];
    for (const match of block.matchAll(/data-src="([^"]*\.mp4[^\"]*)"/gi)) {
      let url = match[1];
      if (url.startsWith('//')) url = `https:${url}`;
      if (!videoUrls.includes(url)) videoUrls.push(url);
    }

    messages.push({ id, title, content, fullText, date: dateMatch?.[1].split('T')[0] ?? null, reactions, mediaUrls, videoUrls });
  }

  if (messages.length !== 1 || messages[0].id !== requestedId) {
    throw new Error(`Direct Telegram response must contain exactly message #${requestedId}`);
  }
  if (!messages[0].fullText) throw new Error(`Telegram message #${requestedId} has no publishable text`);
  return messages[0];
}

function assertAbstract(summary, content, title, category) {
  const value = String(summary ?? '').trim();
  const firstSentence = String(content ?? '').trim().split(/(?<=[.!?。！？])\s+|\n+/)[0]?.trim() ?? '';
  const normalize = (text) => String(text).replace(/[.!?。！？]+$/, '').trim();
  const errors = [];
  const [minimum, maximum] = category === '낙서' ? [20, 40] : [45, 99];
  if (value.length < minimum || value.length > maximum) errors.push(`length=${value.length}`);
  if (/\n|\.\.\.|…|https?:\/\/|\|/i.test(value)) errors.push('forbidden fragment');
  if (!/[.!?。！？]$/.test(value)) errors.push('missing terminal punctuation');
  if (normalize(value) === normalize(title)) errors.push('duplicates title');
  if (normalize(value) === normalize(firstSentence)) errors.push('copies opening sentence');
  if (category === '낙서' && /보여준다|드러낸다|강조한다|되새긴다|돌아본다|읽어낸다|감상한다|의미를 덧붙인다|산물임/.test(value)) errors.push('critical doodle voice');
  if (errors.length) throw new Error(`Unpublishable post abstract: ${errors.join(', ')}`);
}

function reviewedMetadata(overrides, message) {
  const metadata = overrides[String(message.id)];
  if (!metadata) throw new Error(`Reviewed metadata override required for msg #${message.id}`);
  const actualHash = hashContent(message.fullText);
  if (metadata.contentHash !== actualHash) {
    throw new Error(`Stale metadata override for msg #${message.id}: expected ${metadata.contentHash}, got ${actualHash}`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata.slug ?? '')) throw new Error(`Invalid override slug: ${metadata.slug}`);
  if (typeof metadata.title !== 'string' || !metadata.title.trim()) throw new Error('Invalid override title');
  if (metadata.title.normalize('NFKC').trim() !== message.title.normalize('NFKC').trim()) {
    throw new Error(`Override title must match Telegram first line for msg #${message.id}`);
  }
  if (!ALLOWED_CATEGORIES.has(metadata.category)) throw new Error(`Invalid override category: ${metadata.category}`);
  if (!ALLOWED_DEPTHS.has(metadata.depth)) throw new Error(`Invalid override depth: ${metadata.depth}`);
  if (!Array.isArray(metadata.tags) || !metadata.tags.every((tag) => typeof tag === 'string' && tag.trim())) {
    throw new Error('Invalid override tags');
  }
  assertAbstract(metadata.summary, message.content, metadata.title, metadata.category);
  return metadata;
}

function escapeTemplate(value) {
  return value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

function postObject(message, metadata, imageUrls, videoUrls) {
  const mediaLine = imageUrls.length ? `\n    mediaUrls: [${imageUrls.map((url) => `'${url}'`).join(', ')}],` : '';
  const videoLine = videoUrls.length ? `\n    videoUrls: [${videoUrls.map((url) => `'${url}'`).join(', ')}],` : '';
  return `  {
    id: '${metadata.slug}',
    slug: '${metadata.slug}',
    telegramMsgId: ${message.id},
    title: ${JSON.stringify(metadata.title)},
    category: ${JSON.stringify(metadata.category)},
    depth: ${JSON.stringify(metadata.depth)},
    summary: ${JSON.stringify(metadata.summary)},
    content: \`${escapeTemplate(message.content)}\`,
    date: '${message.date ?? new Date().toISOString().split('T')[0]}',
    reactions: ${message.reactions},
    tags: [${metadata.tags.map((tag) => JSON.stringify(tag)).join(', ')}],
    relatedSlugs: [],${mediaLine}${videoLine}
  }`;
}

function insertOnePost(source, object) {
  const marker = 'export const posts: Post[] = [';
  const at = source.indexOf(marker);
  if (at < 0) throw new Error('Could not find posts array in posts.ts');
  return `${source.slice(0, at + marker.length)}\n${object},\n${source.slice(at + marker.length)}`;
}

function extensionFor(url, video) {
  const extension = extname(new URL(url).pathname).toLowerCase();
  if (/^\.(?:jpe?g|png|webp|gif|mp4|webm)$/.test(extension)) return extension;
  return video ? '.mp4' : '.jpg';
}

async function fetchBytes(url, fetchImpl) {
  const response = await fetchImpl(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://t.me/' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for media ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function prepareMedia(message, mediaDir, fetchImpl) {
  const pending = [];
  const images = [];
  const videos = [];
  const items = [
    ...message.mediaUrls.map((url, index) => ({ url, suffix: String(index), video: false, target: images })),
    ...message.videoUrls.map((url, index) => ({ url, suffix: `v${index}`, video: true, target: videos })),
  ];

  for (const item of items) {
    const extension = extensionFor(item.url, item.video);
    const filename = `msg-${message.id}-${item.suffix}${extension}`;
    const destination = join(mediaDir, filename);
    const bytes = await fetchBytes(item.url, fetchImpl);
    if (bytes.length < MIN_MEDIA_SIZE) throw new Error(`Downloaded media is too small: ${filename}`);
    if (existsSync(destination)) {
      const existing = readFileSync(destination);
      if (!existing.equals(bytes)) throw new Error(`Media overwrite blocked: ${filename}`);
    } else {
      pending.push({ destination, bytes });
    }
    item.target.push(`/media/${filename}`);
  }
  return { images, videos, pending };
}

function writeAtomically(path, contents) {
  const temporary = `${path}.single-${process.pid}`;
  writeFileSync(temporary, contents);
  renameSync(temporary, path);
}

export function regenerateOntology({ root = DEFAULT_ROOT, run = spawnSync } = {}) {
  const scripts = [
    'scripts/draft-ontology.mjs',
    'scripts/build-ontology-index.mjs',
    'scripts/audit-ontology.mjs',
  ];
  for (const script of scripts) {
    const result = run(process.execPath, [script], { cwd: root, stdio: 'inherit' });
    if (result?.error) throw result.error;
    if (result?.status !== 0) throw new Error(`Ontology step failed: ${script}`);
  }
}

export async function publishSingleMessage({
  id,
  root = DEFAULT_ROOT,
  fetchImpl = fetch,
  now = () => new Date().toISOString(),
  regenerate = regenerateOntology,
}) {
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('A positive numeric message ID is required');
  const dataDir = join(root, 'data');
  const postsPath = join(dataDir, 'posts.ts');
  const statePath = join(dataDir, 'sync-state.json');
  const overridesPath = join(dataDir, 'sync-metadata-overrides.json');
  const mediaDir = join(root, 'public', 'media');

  const postsSource = readFileSync(postsPath, 'utf8');
  const state = JSON.parse(readFileSync(statePath, 'utf8'));
  const overrides = JSON.parse(readFileSync(overridesPath, 'utf8'));
  if (state.processedMsgIds?.includes(id) || new RegExp(`telegramMsgId:\\s*${id}(?:\\D|$)`).test(postsSource)) {
    throw new Error(`Telegram message #${id} is already processed`);
  }

  const directUrl = `https://t.me/${CHANNEL}/${id}?embed=1&mode=tme`;
  const response = await fetchImpl(directUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${directUrl}`);
  const message = parseSingleMessage(await response.text(), id);
  const metadata = reviewedMetadata(overrides, message);
  if (postsSource.includes(`id: '${metadata.slug}'`) || Object.hasOwn(state.slugToMsgId ?? {}, metadata.slug)) {
    throw new Error(`Reviewed slug already exists: ${metadata.slug}`);
  }

  const prepared = await prepareMedia(message, mediaDir, fetchImpl);
  const nextPosts = insertOnePost(postsSource, postObject(message, metadata, prepared.images, prepared.videos));
  const nextState = structuredClone(state);
  nextState.processedMsgIds = [...new Set([...(state.processedMsgIds ?? []), id])].sort((a, b) => a - b);
  nextState.slugToMsgId = { ...(state.slugToMsgId ?? {}), [metadata.slug]: id };
  nextState.contentHashes = { ...(state.contentHashes ?? {}), [id]: hashContent(message.fullText) };
  nextState.lastMsgId = Math.max(Number(state.lastMsgId) || 0, id);
  nextState.lastSyncedAt = now();

  mkdirSync(mediaDir, { recursive: true });
  const created = [];
  try {
    for (const file of prepared.pending) {
      const temporary = `${file.destination}.single-${process.pid}`;
      writeFileSync(temporary, file.bytes);
      renameSync(temporary, file.destination);
      created.push(file.destination);
    }
    writeAtomically(postsPath, nextPosts);
    try {
      writeAtomically(statePath, `${JSON.stringify(nextState, null, 2)}\n`);
    } catch (error) {
      writeAtomically(postsPath, postsSource);
      throw error;
    }
  } catch (error) {
    for (const path of created) if (existsSync(path)) unlinkSync(path);
    throw error;
  }

  await regenerate({ root });

  return { id, slug: metadata.slug, media: prepared.images, videos: prepared.videos };
}

async function main() {
  const id = parseMessageId(process.argv[2]);
  const result = await publishSingleMessage({ id });
  console.log(`Published Telegram #${result.id} as ${result.slug}`);
}

if (process.argv[1] && resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(`Publish failed: ${error.message}`);
    process.exitCode = 1;
  });
}
