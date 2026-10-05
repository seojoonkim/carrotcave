// Shared footer contact + copyright (Simon 2026-10-05: "푸터에 simon@hashed.com 및 저작권 표시 공통으로 넣어").
// Single source: data/site-legal.json. Voice reader HTML is synced from the same file by scripts/sync-footer-legal.mjs.
import legal from '@/data/site-legal.json';
import { posts } from '@/data/posts';

export const SITE_EMAIL = legal.email;

/** Year range runs from `since` to the latest post year, so it is deterministic per build. */
export function copyrightLine(latestYear = Math.max(legal.since, ...posts.map((p) => Number(p.date.slice(0, 4))))): string {
  const range = latestYear > legal.since ? `${legal.since}–${latestYear}` : String(legal.since);
  return `© ${range} ${legal.holder}. ${legal.rights}`;
}
