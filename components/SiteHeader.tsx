import Link from 'next/link';

export const sections = [
  { href: '/?section=탐험', label: '탐험' },
  { href: '/?section=빌딩', label: '빌딩' },
  { href: '/?section=낙서', label: '낙서' },
  { href: '/?section=소설', label: '소설' },
  { href: '/voices', label: '목소리' },
];

export default function SiteHeader() {
  return (
    <header className="cc-header">
      <Link className="cc-brand" href="/" aria-label="CARROT CAVE 홈">
        <i aria-hidden="true" />
        <span>CARROT CAVE<small>FIELD NOTES FROM THE RABBIT HOLE</small></span>
      </Link>
      <nav className="cc-nav" aria-label="주요 편집 축">
        {sections.map((section) => <Link key={section.label} href={section.href}>{section.label}</Link>)}
      </nav>
      <a className="cc-channel" href="https://t.me/carrotcave" target="_blank" rel="noreferrer">TELEGRAM ↗</a>
    </header>
  );
}
