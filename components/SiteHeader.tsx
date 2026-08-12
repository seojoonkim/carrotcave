import Image from 'next/image';
import Link from 'next/link';
import ReadingProgress from '@/components/ReadingProgress';

interface SiteHeaderProps {
  readingTitle?: string;
  readingMeta?: string;
  readingBackHref?: string;
  readingBackLabel?: string;
}

export default function SiteHeader({ readingTitle, readingMeta, readingBackHref = '/', readingBackLabel = '목록으로 돌아가기' }: SiteHeaderProps = {}) {
  return (
    <header className={readingTitle ? 'cc-header cc-header--reading' : 'cc-header'}>
      <Link className="cc-brand" href={readingTitle ? readingBackHref : '/'} aria-label={readingTitle ? readingBackLabel : 'CarrotCave.com 홈'}>
        {readingTitle && <span className="cc-reading-back-chevron" aria-hidden="true">‹</span>}
        <Image className="cc-brand-symbol" src="/carrot-cave-symbol.png" alt="" width={192} height={192} aria-hidden="true" priority />
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
        <a className="cc-channel" href="https://t.me/carrotcave" target="_blank" rel="noreferrer">TELEGRAM ↗</a>
      )}
      {readingTitle && <ReadingProgress />}
    </header>
  );
}
