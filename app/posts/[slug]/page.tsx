import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { siteName } from '@/lib/social-metadata';
import { posts, getPostBySlug } from '@/data/posts';
import PostView from '@/components/views/PostView';
import { languageAlternates } from '@/lib/i18n';

export async function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  const title = post.title;
  const canonical = `/posts/${post.slug}`;
  return {
    title,
    description: post.summary,
    alternates: { canonical, languages: languageAlternates(canonical) },
    openGraph: {
      title,
      description: post.summary,
      url: canonical,
      siteName,
      locale: 'ko_KR',
      alternateLocale: ['en_US'],
      type: 'article',
      publishedTime: post.date,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: post.summary,
    },
  };
}

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  return <PostView post={post} locale="ko" />;
}
