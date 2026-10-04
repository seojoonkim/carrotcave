import { getPostBySlug, posts } from '@/data/posts';
import { archiveImageUrl, siteName } from '@/lib/social-metadata';
import { CATEGORY_EN, dateEn, localImage, ogCard, OG_SIZE, TAGLINE_EN } from '@/lib/og-card';
import postTitlesEn from '@/data/post-titles-en.json';
import { localizedPost } from '@/lib/i18n-content';

const TITLES_EN = postTitlesEn as Record<string, string>;

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = `${siteName} · ${TAGLINE_EN}`;

export function generateStaticParams() {
  return posts.map(({ slug }) => ({ slug }));
}

// Same English-only card as /posts/<slug>; the title follows the English page.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return ogCard({ label: 'CARROTCAVE', title: TAGLINE_EN });
  const title = TITLES_EN[post.slug] ?? localizedPost(post, 'en').title;
  return ogCard({ label: CATEGORY_EN[post.category] ?? 'CARROTCAVE', meta: dateEn(post.date), title: /[\uac00-\ud7a3]/.test(title) ? TAGLINE_EN : title, image: await localImage(archiveImageUrl(post)) });
}
