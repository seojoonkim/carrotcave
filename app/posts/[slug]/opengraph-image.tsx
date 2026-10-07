import { getPostBySlug, posts } from '@/data/posts';
import { archiveImageUrl, siteName } from '@/lib/social-metadata';
import { CATEGORY_EN, dateEn, localImage, ogCard, OG_SIZE, TAGLINE_EN } from '@/lib/og-card';
import postTitlesEn from '@/data/post-titles-en.json';

const TITLES_EN = postTitlesEn as Record<string, string>;

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = `${siteName} · ${TAGLINE_EN}`;

export function generateStaticParams() {
  return posts.map(({ slug }) => ({ slug }));
}

// English-only card: category, date and the post's English title (data/post-titles-en.json). The Korean title/summary travel
// as og:title / og:description text next to the image, so they are not repeated in it.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return ogCard({ label: 'CARROTCAVE', title: TAGLINE_EN });
  return ogCard({ label: CATEGORY_EN[post.category] ?? 'CARROTCAVE', meta: dateEn(post.date), title: TITLES_EN[post.slug] ?? TAGLINE_EN, image: await localImage(archiveImageUrl(post)) });
}

// Card layout version (changes the og:image ?hash so Facebook/Kakao refetch): crop-safe centered v2, 2026-10-08
