import type { Post } from '@/data/posts';

export const siteName = 'CarrotCave.com';
export const siteDescription = '토끼를 따라 더 깊이. 기술, 사람, 시장과 미래에 관한 기록.';
export const siteOgImage = '/carrotcave-og-20260814.png';

export function archiveImageUrl(post: Post) {
  return post.mediaUrls?.[0] ?? (post.videoUrls?.[0] ? `/media/posters/${post.slug}.jpg` : undefined);
}
