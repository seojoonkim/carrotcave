import { del, head, list, put } from '@vercel/blob';
import type { Store } from './core';

const PREFIX = 'newsletter/';
const notFound = (e: unknown) => /not.?found/i.test(String((e as Error)?.name) + String((e as Error)?.message));

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
