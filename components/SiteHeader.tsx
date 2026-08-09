import Link from 'next/link';

export default function SiteHeader() {
  return (
    <header className="cc-header">
      <Link className="cc-brand" href="/" aria-label="CARROT CAVE 홈">
        <i aria-hidden="true" />
        <span>CARROT CAVE<small>FIELD NOTES FROM THE RABBIT HOLE</small></span>
      </Link>
      <a className="cc-channel" href="https://t.me/carrotcave" target="_blank" rel="noreferrer">TELEGRAM ↗</a>
    </header>
  );
}
