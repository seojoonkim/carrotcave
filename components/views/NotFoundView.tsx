import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import CaveBuddy from '@/components/CaveBuddy';
import { localePath, t, type Locale } from '@/lib/i18n';

export default function NotFoundView({ locale }: { locale: Locale }) {
  const L = t(locale);
  return (
    <main lang={locale}>
      <SiteHeader locale={locale} />
      <section className="cc-lost">
        <p className="cc-lost__code">404</p>
        <CaveBuddy mood="lost">
          <strong>{L.lostTitle}</strong>
          <span>{L.lostBody}</span>
        </CaveBuddy>
        <Link className="cc-pill-button" href={localePath(locale, '/')}>{L.lostCta}</Link>
      </section>
      <SiteFooter locale={locale} />
    </main>
  );
}
