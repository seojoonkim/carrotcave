import FooterCaveScene from './FooterCaveScene';

function XMark() {
  return (
    <svg className="cc-footer__social-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M2.2 2h3.1l3.1 4.1L11.8 2h2L9.3 7.4 14 14h-3.1L7.4 9.3 3.5 14h-2l5-6.1L2.2 2Zm2.1 1.2 7.2 9.6h1.2L5.5 3.2H4.3Z" fill="currentColor" />
    </svg>
  );
}

function TelegramMark() {
  return (
    <svg className="cc-footer__social-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M14.5 2.1 12.4 13c-.2.8-.7 1-1.3.6L8 11.3l-1.5 1.5c-.2.2-.3.3-.7.3l.2-3.2 5.9-5.3c.3-.2-.1-.4-.4-.2L4.2 9 1.1 8c-.7-.2-.7-.7.1-1l12-4.6c.6-.2 1.1.1 1.3-.3Z" fill="currentColor" />
    </svg>
  );
}

export default function SiteFooter() {
  return (
    <footer className="cc-footer">
      <div className="cc-footer__inner">
        <FooterCaveScene />
        <div className="cc-footer__copy">
          <p className="cc-footer__identity"><strong>CARROT CAVE</strong> by Simon Kim</p>
          <p className="cc-footer__links">
            <a href="mailto:simon@hashed.com">simon@hashed.com</a>
            <a href="https://x.com/simonkim_nft" target="_blank" rel="noreferrer"><XMark /><span>X @simonkim_nft</span></a>
            <a href="https://t.me/carrotcave" target="_blank" rel="noreferrer"><TelegramMark /><span>TELEGRAM</span></a>
          </p>
        </div>
      </div>
    </footer>
  );
}
