// Shared link parsing for post bodies (used by the renderer, the preview collector, and tests).

export type LinkPreview = {
  kind: 'youtube' | 'link';
  id?: string;
  title?: string;
  siteName?: string;
  author?: string;
  description?: string;
  thumbnail?: string;
  image?: string;
  source?: string;
  status?: number | string;
};

export type StandaloneLink = { url: string; label?: string; isTweet: boolean };

const URL_RE = /https?:\/\/[^\s<>()\]]+/;
const TRAILING_PUNCT = /[.,;:!?。、）)]+$/;

export function cleanUrl(url: string) {
  return url.replace(TRAILING_PUNCT, '');
}

export function youTubeIdOf(url: string) {
  return url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/)?.[1];
}

export function isTweetUrl(url: string) {
  return /^https?:\/\/(?:twitter\.com|x\.com)\/[^/]+\/status\/\d+/.test(url);
}

/**
 * A line counts as a standalone link when it is only a URL, optionally led by a list bullet,
 * a short label ("공고:", "🔗 GitHub:", "Website:"), or wrapped as a markdown link on its own.
 */
export function standaloneLinkOf(line: string): StandaloneLink | null {
  const t = line.trim();
  const md = t.match(/^[-*•]?\s*\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
  if (md) {
    const url = cleanUrl(md[2]);
    const label = md[1].trim() === md[2].trim() ? undefined : md[1].trim();
    return { url, label, isTweet: isTweetUrl(url) };
  }
  const m = t.match(new RegExp(`^(?:[-*•]\\s*)?(?:([^\\s:：][^:：]{0,24}?)\\s*[:：]\\s*)?(${URL_RE.source})$`, 'u'));
  if (!m) return null;
  const url = cleanUrl(m[2]);
  return { url, label: m[1]?.trim() || undefined, isTweet: isTweetUrl(url) };
}

export function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** Short, readable text for a bare URL shown inline: host + trimmed path. */
export function prettyUrl(url: string, max = 38) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    const path = decodeURIComponent(u.pathname).replace(/\/$/, '');
    const text = `${host}${path}`;
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
  } catch {
    return url.length > max ? `${url.slice(0, max - 1)}…` : url;
  }
}

export const INLINE_URL_RE = new RegExp(`(${URL_RE.source})`, 'g');

/** `[url](url)[\n  preview…\n](url)` pasted from Telegram → `url\n  preview…` */
export function unwrapTelegramLinkPreview(content: string) {
  return content.replace(/\[(https?:\/\/[^\]\s]+)\]\(\1\)\[[ \t]*\n([\s\S]*?)\n\]\(\1\)/g, '$1\n$2');
}

export type PreviewBlock = { start: number; end: number; site?: string; title?: string; description?: string };

const isIndentedText = (line: string) => /^ {2}(?![-*•]\s)\S/.test(line);
const isListish = (line: string) => /^\s*(?:[-*•]|\d+[.)])\s/.test(line) || /^ {2}/.test(line);

/**
 * Finds Telegram link-preview leftovers: runs of 2-space-indented lines (site, title, description)
 * that are not the continuation of a list item. Returns inclusive line ranges.
 */
export function findPreviewBlocks(lines: string[]): PreviewBlock[] {
  const blocks: PreviewBlock[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (!isIndentedText(lines[i])) continue;
    let prev = i - 1;
    while (prev >= 0 && !lines[prev].trim()) prev--;
    if (prev >= 0 && isListish(lines[prev])) continue;
    const texts: string[] = [];
    let j = i;
    let end = i;
    while (j < lines.length && (isIndentedText(lines[j]) || (!lines[j].trim() && j + 1 < lines.length && isIndentedText(lines[j + 1])))) {
      if (lines[j].trim()) { texts.push(lines[j].trim()); end = j; }
      j++;
    }
    if (texts.length >= 2) {
      const [site, title, ...rest] = texts;
      blocks.push({ start: i, end, site, title, description: rest.join(' ').replace(/&#33;/g, '!') || undefined });
    }
    i = end;
  }
  return blocks;
}

export const normalizeTitle = (t = '') => t.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
