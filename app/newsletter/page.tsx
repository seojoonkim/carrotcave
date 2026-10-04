import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import NewsletterForm from '@/components/NewsletterForm';

export const metadata: Metadata = { title: '새 글 메일 구독 · Carrot Cave', robots: { index: false, follow: true } };

const messages: Record<string, string> = {
  confirmed: '구독이 확정됐어요. 새 글이 올라온 다음 날 아침 8시에 만나요.',
  unsubscribed: '구독을 해지했어요. 그동안 읽어 주셔서 고마워요.',
  invalid: '링크가 만료됐거나 올바르지 않아요. 아래에서 다시 신청해 주세요.',
};

export default async function NewsletterPage({ searchParams }: { searchParams: Promise<{ status?: string; unsub?: string }> }) {
  const { status, unsub } = await searchParams;
  return (
    <main>
      <SiteHeader />
      <section className="cc-newsletter-page">
        <h1>새 글 메일 구독</h1>
        {unsub ? (
          <form method="post" action="/api/newsletter/unsubscribe" className="cc-newsletter-page__unsub">
            <p>당근동굴 새 글 메일 구독을 해지할까요?</p>
            <input type="hidden" name="t" value={unsub} />
            <button type="submit">구독 해지</button>
          </form>
        ) : (
          <>
            {status && messages[status] && <p className="cc-newsletter-page__status" role="status">{messages[status]}</p>}
            <NewsletterForm />
          </>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
