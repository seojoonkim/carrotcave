import type { Metadata } from 'next';
import NewsletterView from '@/components/views/NewsletterView';
import { languageAlternates } from '@/lib/i18n';

export const metadata: Metadata = { title: 'Subscribe by email · Carrot Cave', description: 'Get new CarrotCave posts by email.', alternates: { canonical: '/en/newsletter', languages: languageAlternates('/newsletter') }, robots: { index: false, follow: true } };

export default async function EnglishNewsletterPage({ searchParams }: { searchParams: Promise<{ status?: string; unsub?: string }> }) {
  const { status, unsub } = await searchParams;
  return <NewsletterView status={status} unsub={unsub} locale="en" />;
}
