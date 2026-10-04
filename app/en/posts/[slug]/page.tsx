import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { siteName } from '@/lib/social-metadata';
import { posts, getPostBySlug } from '@/data/posts';
import PostView from '@/components/views/PostView';
import { languageAlternates } from '@/lib/i18n';
import { localizedPost } from '@/lib/i18n-content';

export async function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const source = getPostBySlug(slug);
  if (!source) return {};
  const post = localizedPost(source, 'en');
  const canonical = `/en/posts/${post.slug}`;
  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical, languages: languageAlternates(`/posts/${post.slug}`) },
    openGraph: {
      title: post.title,
      description: post.summary,
      url: canonical,
      siteName,
      locale: 'en_US',
      alternateLocale: ['ko_KR'],
      type: 'article',
      publishedTime: post.date,
    },
    twitter: { card: 'summary_large_image', title: post.title, description: post.summary },
  };
}

export default async function EnglishPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();
  return <PostView post={post} locale="en" />;
}
