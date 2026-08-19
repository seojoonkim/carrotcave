import Link from 'next/link';
import type { ReactNode } from 'react';
import CarrotCaveMark from '@/components/CarrotCaveMark';
import ReadingProgress from '@/components/ReadingProgress';

interface SiteHeaderProps {
  children?: ReactNode;
  readingTitle?: string;
  readingMeta?: string;
  readingBackHref?: string;
  readingBackLabel?: string;
}

export default function SiteHeader({ children, readingTitle, readingMeta, readingBackHref = '/', readingBackLabel = '목록으로 돌아가기' }: SiteHeaderProps = {}) {
  return (
    <header className={readingTitle ? 'cc-header cc-header--reading' : 'cc-header'}>
      <div className="cc-header__inner">
        <Link className="cc-brand" href={readingTitle ? readingBackHref : '/'} aria-label={readingTitle ? readingBackLabel : 'CarrotCave.com 홈'}>
          {readingTitle && <span className="cc-reading-back-chevron" aria-hidden="true">‹</span>}
          <CarrotCaveMark className="cc-brand-symbol" />
          {!readingTitle && <span><span className="cc-brand-name">CarrotCave<span className="cc-brand-domain">.com</span></span><small>FIELD NOTES FROM THE RABBIT HOLE</small></span>}
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
      </div>
      {readingTitle && <ReadingProgress />}
    </header>
  );
}
