import { getPostBySlug, posts } from '@/data/posts';
import { archiveImageUrl, siteName } from '@/lib/social-metadata';
import { CATEGORY_EN, dateEn, localImage, ogCard, OG_SIZE, TAGLINE_EN } from '@/lib/og-card';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = `${siteName} · ${TAGLINE_EN}`;

export function generateStaticParams() {
  return posts.map(({ slug }) => ({ slug }));
}

// English-only card: category, date and the site line. The Korean title/summary travel
// as og:title / og:description text next to the image, so they are not repeated in it.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return ogCard({ label: 'CARROTCAVE', title: TAGLINE_EN });
  return ogCard({ label: CATEGORY_EN[post.category] ?? 'CARROTCAVE', meta: dateEn(post.date), title: TAGLINE_EN, image: await localImage(archiveImageUrl(post)) });
}
