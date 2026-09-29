import { getPostBySlug, posts } from '@/data/posts';
import { archiveImageUrl, siteName } from '@/lib/social-metadata';
import { localImage, ogCard, OG_SIZE } from '@/lib/og-card';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = siteName;

export function generateStaticParams() {
  return posts.map(({ slug }) => ({ slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return ogCard({ kicker: '동굴', title: siteName });
  return ogCard({ kicker: post.category, title: post.title, summary: post.summary, image: await localImage(archiveImageUrl(post)) });
}
