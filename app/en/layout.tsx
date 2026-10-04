import type { Metadata } from 'next';
import { dict, languageAlternates } from '@/lib/i18n';
import { siteName } from '@/lib/social-metadata';

// English defaults for everything under /en (pages that set their own metadata override these).
export const metadata: Metadata = {
  title: { default: `${siteName} · ${dict.en.siteTitle}`, template: '%s' },
  description: dict.en.siteDescription,
  openGraph: { siteName, locale: 'en_US', alternateLocale: ['ko_KR'], description: dict.en.siteDescription },
  twitter: { card: 'summary_large_image', description: dict.en.siteDescription },
};

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return children;
}
