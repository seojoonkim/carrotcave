import type { Metadata } from 'next';
import HomeView from '@/components/views/HomeView';
import { dict, languageAlternates } from '@/lib/i18n';
import { siteName } from '@/lib/social-metadata';

export const metadata: Metadata = {
  title: `${siteName} · ${dict.en.siteTitle}`,
  description: dict.en.siteDescription,
  alternates: { canonical: '/en', languages: languageAlternates('/'), types: { 'application/rss+xml': [{ url: '/en/rss.xml', title: 'Carrot Cave (English)' }] } },
  openGraph: { title: siteName, description: dict.en.siteDescription, url: '/en', siteName, locale: 'en_US', alternateLocale: ['ko_KR'], type: 'website' },
  twitter: { card: 'summary_large_image', title: siteName, description: dict.en.siteDescription },
};

export default async function EnglishHome({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const { section } = await searchParams;
  return <HomeView section={section} locale="en" />;
}
