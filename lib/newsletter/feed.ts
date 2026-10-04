import { posts } from '@/data/posts';
import { interviews } from '@/data/interviews';
import type { FeedItem } from './core';
import { AXIS_EN, type Locale } from '@/lib/i18n';
import { localizedPost, localizedVoice } from '@/lib/i18n-content';

const SITE = 'https://carrotcave.com';

/** Everything readers can subscribe to, newest first. Keys are stable across edits. */
export function feedItems(locale: Locale = 'ko'): FeedItem[] {
  const prefix = locale === 'en' ? `${SITE}/en` : SITE;
  const fromPosts: FeedItem[] = posts.map((source) => {
    const p = localizedPost(source, locale);
    return { key: `post:${p.slug}`, kind: 'post', title: p.title, summary: p.summary, url: `${prefix}/posts/${p.slug}`, date: p.date, category: locale === 'en' ? AXIS_EN[p.category] : p.category };
  });
  const fromVoices: FeedItem[] = interviews.filter((v) => v.status === 'published').map((source) => {
    const v = localizedVoice(source, locale);
    return { key: `voice:${v.slug}`, kind: 'voice', title: `${v.name} · ${v.title}`, summary: v.summary, url: `${prefix}/voices/${v.slug}`, date: v.sourcePublishedAt, category: locale === 'en' ? 'Voices' : '목소리' };
  });
  return [...fromPosts, ...fromVoices].sort((a, b) => b.date.localeCompare(a.date));
}
