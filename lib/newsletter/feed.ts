import { posts } from '@/data/posts';
import { interviews } from '@/data/interviews';
import type { FeedItem } from './core';

const SITE = 'https://carrotcave.com';

/** Everything readers can subscribe to, newest first. Keys are stable across edits. */
export function feedItems(): FeedItem[] {
  const fromPosts: FeedItem[] = posts.map((p) => ({
    key: `post:${p.slug}`, kind: 'post', title: p.title, summary: p.summary, url: `${SITE}/posts/${p.slug}`, date: p.date, category: p.category,
  }));
  const fromVoices: FeedItem[] = interviews.filter((v) => v.status === 'published').map((v) => ({
    key: `voice:${v.slug}`, kind: 'voice', title: `${v.name} · ${v.title}`, summary: v.summary, url: `${SITE}/voices/${v.slug}`, date: v.sourcePublishedAt, category: '목소리',
  }));
  return [...fromPosts, ...fromVoices].sort((a, b) => b.date.localeCompare(a.date));
}
