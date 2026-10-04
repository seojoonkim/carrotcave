import { BlobNotFoundError, del, head, list, put } from '@vercel/blob';
import type { Store } from './core';

const PREFIX = 'newsletter/';
/** Missing blobs must read as "empty", never as a crash. Class names are minified in production builds,
 *  so match the class, the code and the message ("does not exist") — not just the word "not found". */
export const isBlobMissing = (e: unknown) =>
  e instanceof BlobNotFoundError ||
  /not.?found|does not exist|no such blob/i.test(`${(e as Error)?.name ?? ''} ${(e as Error)?.message ?? ''} ${(e as { code?: string })?.code ?? ''}`);
const notFound = isBlobMissing;

/** Vercel Blob storage. Subscriber records are AES-GCM sealed before they are written. */
export function blobStore(token = process.env.BLOB_READ_WRITE_TOKEN): Store {
  return {
    async getJSON<T>(key: string) {
      try {
        const meta = await head(PREFIX + key, { token });
        const res = await fetch(`${meta.url}?v=${Date.now()}`, { cache: 'no-store' });
        return res.ok ? ((await res.json()) as T) : null;
      } catch (e) {
        if (notFound(e)) return null;
        throw e;
      }
    },
    async putJSON(key, value) {
      await put(PREFIX + key, JSON.stringify(value), { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 60, token });
    },
    async list(prefix) {
      const out: string[] = [];
      let cursor: string | undefined;
      do {
        const page = await list({ prefix: PREFIX + prefix, cursor, limit: 1000, token });
        out.push(...page.blobs.map((b) => b.pathname.slice(PREFIX.length)));
        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);
      return out;
    },
    async del(key) {
      await del(PREFIX + key, { token }).catch((e) => { if (!notFound(e)) throw e; });
    },
  };
}
