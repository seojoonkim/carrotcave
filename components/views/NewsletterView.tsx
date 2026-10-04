import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import NewsletterForm from '@/components/NewsletterForm';
import { t, type Locale } from '@/lib/i18n';

export default function NewsletterView({ status, unsub, locale }: { status?: string; unsub?: string; locale: Locale }) {
  const L = t(locale);
  return (
    <main lang={locale}>
      <SiteHeader locale={locale} />
      <section className="cc-newsletter-page">
        <h1>{L.nlPageTitle}</h1>
        {unsub ? (
          <form method="post" action="/api/newsletter/unsubscribe" className="cc-newsletter-page__unsub">
            <p>{L.nlUnsubAsk}</p>
            <input type="hidden" name="t" value={unsub} />
            <button type="submit">{L.nlUnsubButton}</button>
          </form>
        ) : (
          <>
            {status && L.nlStatus[status] && <p className="cc-newsletter-page__status" role="status">{L.nlStatus[status]}</p>}
            <NewsletterForm locale={locale} />
          </>
        )}
      </section>
      <SiteFooter locale={locale} />
    </main>
  );
}
