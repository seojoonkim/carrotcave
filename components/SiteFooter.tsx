import CaveJourneyScene from './CaveJourneyScene';

export default function SiteFooter() {
  return (
    <footer className="cc-footer">
      <div className="cc-footer__inner">
        <div className="cc-footer__journey" aria-label="당근을 찾은 토끼">
          <CaveJourneyScene depth={6} />
        </div>
        <b>CARROT CAVE</b>
        <span className="cc-footer__contact">
          <span>Simon Kim</span>
          <a href="mailto:simon@hashed.com">simon@hashed.com</a>
        </span>
        <span className="cc-footer__socials">
          <a href="https://x.com/simonkim_nft" target="_blank" rel="noreferrer">X ↗</a>
          <a href="https://t.me/carrotcave" target="_blank" rel="noreferrer">TELEGRAM ↗</a>
        </span>
      </div>
    </footer>
  );
}
