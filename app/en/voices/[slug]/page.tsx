import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { interviews, getInterview } from '@/data/interviews';
import { siteName } from '@/lib/social-metadata';
import { dict, languageAlternates } from '@/lib/i18n';
import { localizedVoice } from '@/lib/i18n-content';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Voices recorded in English have an English reader (original English transcript).
const englishReader = (embedPath: string) => {
  const en = embedPath.replace(/index\.html$/, 'index.en.html');
  return existsSync(join(process.cwd(), 'public', en)) ? en : null;
};

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

// English-language voices frame their English reader (original transcript). The others are Korean
// study editions; the English page frames the Korean reader (?lang=en keeps its chrome on /en) and says so.
export default async function EnglishVoiceReader({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const source = getInterview(slug);
  if (!source) notFound();
  const voice = localizedVoice(source, 'en');
  const english = englishReader(voice.embedPath);
  return <main className="voice-reader-shell" lang="en">
    {!english && <p className="voice-reader-lang-note"><span>{dict.en.voiceNotice}</span><a href={`/voices/${voice.slug}`} hrefLang="ko">한국어</a></p>}
    <iframe className="voice-reader-frame" src={english ?? `${voice.embedPath}?lang=en`} title={`${voice.name} ${voice.title}`} />
  </main>;
}
