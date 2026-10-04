import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { interviews, getInterview } from '@/data/interviews';
import { siteName } from '@/lib/social-metadata';
import { dict, languageAlternates } from '@/lib/i18n';
import { localizedVoice } from '@/lib/i18n-content';

export function generateStaticParams() { return interviews.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const source = getInterview(slug);
  if (!source) return {};
  const voice = localizedVoice(source, 'en');
  const title = `${voice.name} · ${voice.title}`;
  const canonical = `/en/voices/${voice.slug}`;
  return {
    title,
    description: voice.summary,
    alternates: { canonical, languages: languageAlternates(`/voices/${voice.slug}`) },
    openGraph: { title, description: voice.summary, url: canonical, siteName, locale: 'en_US', alternateLocale: ['ko_KR'], type: 'article', publishedTime: voice.sourcePublishedAt },
    twitter: { card: 'summary_large_image', title, description: voice.summary },
  };
}

// The voice readers are Korean study editions; the English page frames the same reader and says so.
export default async function EnglishVoiceReader({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const source = getInterview(slug);
  if (!source) notFound();
  const voice = localizedVoice(source, 'en');
  return <main className="voice-reader-shell" lang="en">
    <p className="voice-reader-lang-note"><span>{dict.en.voiceNotice}</span><a href={`/voices/${voice.slug}`} hrefLang="ko">한국어</a></p>
    <iframe className="voice-reader-frame" src={voice.embedPath} title={`${voice.name} ${voice.title}`} />
  </main>;
}
