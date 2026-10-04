import type { Metadata } from 'next';
import NewsletterView from '@/components/views/NewsletterView';
import { languageAlternates } from '@/lib/i18n';

export const metadata: Metadata = { title: '새 글 메일 구독 · Carrot Cave', alternates: { canonical: '/newsletter', languages: languageAlternates('/newsletter') }, robots: { index: false, follow: true } };

export default async function NewsletterPage({ searchParams }: { searchParams: Promise<{ status?: string; unsub?: string }> }) {
  const { status, unsub } = await searchParams;
  return <NewsletterView status={status} unsub={unsub} locale="ko" />;
}
