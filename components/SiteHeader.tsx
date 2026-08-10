import Image from 'next/image';
import Link from 'next/link';

export default function SiteHeader() {
  return (
    <header className="cc-header">
      <Link className="cc-brand" href="/" aria-label="CARROT CAVE 홈">
        <Image className="cc-brand-symbol" src="/carrot-cave-symbol.png" alt="" width={87} height={192} aria-hidden="true" priority />
        <span>CARROT CAVE<small>FIELD NOTES FROM THE RABBIT HOLE</small></span>
      </Link>
      <a className="cc-channel" href="https://t.me/carrotcave" target="_blank" rel="noreferrer">TELEGRAM ↗</a>
    </header>
  );
}
