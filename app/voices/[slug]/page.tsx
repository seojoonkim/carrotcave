import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { interviews, getInterview } from '@/data/interviews';
import { siteName } from '@/lib/social-metadata';

export function generateStaticParams() { return interviews.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const interview = getInterview(slug);
  if (!interview) return {};
  const title = `${interview.name} · ${interview.title}`;
  const canonical = `/voices/${interview.slug}`;
  return {
    title,
    description: interview.summary,
    alternates: { canonical },
    openGraph: {
      title,
      description: interview.summary,
      url: canonical,
      siteName,
      locale: 'ko_KR',
      type: 'article',
      publishedTime: interview.sourcePublishedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: interview.summary,
    },
  };
}

export default async function VoiceReader({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const interview = getInterview(slug);
  if (!interview) notFound();
  return <main className="voice-reader-shell">
    <iframe className="voice-reader-frame" src={interview.embedPath} title={`${interview.name} ${interview.title}`} />
  </main>;
}
