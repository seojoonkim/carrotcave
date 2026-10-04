import Link from 'next/link';
import type { ReactNode } from 'react';
import CarrotCaveMark from '@/components/CarrotCaveMark';
import ReadingProgress from '@/components/ReadingProgress';
import LangToggle from '@/components/LangToggle';
import { localePath, t, type Locale } from '@/lib/i18n';

interface SiteHeaderProps {
  children?: ReactNode;
  readingTitle?: string;
  readingMeta?: string;
  readingBackHref?: string;
  readingBackLabel?: string;
  locale?: Locale;
}

export default function SiteHeader({ children, readingTitle, readingMeta, readingBackHref, readingBackLabel, locale = 'ko' }: SiteHeaderProps = {}) {
  const L = t(locale);
  const home = localePath(locale, '/');
  const backHref = readingBackHref ?? home;
  const backLabel = readingBackLabel ?? L.backToList;
  return (
    <header className={readingTitle ? 'cc-header cc-header--reading' : 'cc-header'}>
      <div className="cc-header__inner">
        <Link className="cc-brand" href={readingTitle ? backHref : home} aria-label={readingTitle ? backLabel : L.homeAria}>
          {readingTitle && <span className="cc-reading-back-chevron" aria-hidden="true">‹</span>}
          <CarrotCaveMark className="cc-brand-symbol" />
          {!readingTitle && <span><span className="cc-brand-name">CarrotCave<span className="cc-brand-domain">.com</span></span><small className="cc-brand-tagline">Followed the rabbit. Lost the thread.</small></span>}
        </Link>
        {readingTitle ? (
          <>
            <span className="cc-reading-divider" aria-hidden="true" />
            <span className="cc-reading-info">
              {readingMeta && <small>{readingMeta}</small>}
              <span className="cc-reading-title">{readingTitle}</span>
            </span>
          </>
        ) : (
          <>
            {children && <div className="cc-header__axis cc-header__axis--desktop">{children}</div>}
          </>
        )}
        <LangToggle locale={locale} />
      </div>
      {readingTitle && <ReadingProgress label={L.progressAria} />}
    </header>
  );
}
