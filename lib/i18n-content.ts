// Server-only: English post/voice text bundles. Never import from a 'use client' file.
import type { Post } from '@/data/posts';
import enPostsBundle from '@/data/en/posts.json';
import enVoicesBundle from '@/data/en/voices.json';
import type { Locale } from './i18n';

type EnText = { title: string; summary: string; content: string };
const EN_POSTS = enPostsBundle as Record<string, EnText>;
type EnVoice = { name: string; title: string; summary: string };
const EN_VOICES = enVoicesBundle as Record<string, EnVoice>;

export function hasEnglish(slug: string) {
  return Boolean(EN_POSTS[slug]);
}
/** Post with title/summary/content in the requested language (falls back to Korean when no translation exists). */
export function localizedPost(post: Post, locale: Locale): Post {
  if (locale === 'ko') return post;
  const en = EN_POSTS[post.slug];
  return en ? { ...post, title: en.title, summary: en.summary, content: en.content } : post;
}
export function localizedVoice<T extends { slug: string; name: string; title: string; summary: string; nameEn?: string }>(voice: T, locale: Locale): T {
  if (locale === 'ko') return voice;
  const en = EN_VOICES[voice.slug];
  return { ...voice, name: en?.name ?? voice.nameEn ?? voice.name, title: en?.title ?? voice.title, summary: en?.summary ?? voice.summary };
}

