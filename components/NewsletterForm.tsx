"use client";
import { useState } from 'react';
import CaveBuddy from './CaveBuddy';
import { t, type Locale } from '@/lib/i18n';

type Phase = 'idle' | 'sending' | 'done' | 'already' | 'error';

export default function NewsletterForm({ locale = 'ko' }: { locale?: Locale }) {
  const L = t(locale);
  const [phase, setPhase] = useState<Phase>('idle');
  const [queued, setQueued] = useState(false);
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPhase('sending');
    try {
      const res = await fetch('/api/newsletter/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: data.get('email'), website: data.get('website'), lang: locale }) });
      const json = await res.json();
      if (!res.ok || !json.ok) return setPhase('error');
      setQueued(json.delivery === 'outbox');
      setPhase(json.status === 'already' ? 'already' : 'done');
    } catch { setPhase('error'); }
  }
  return (
    <form className="cc-newsletter" onSubmit={onSubmit} aria-label={L.nlAria}>
      <div className="cc-newsletter__head">
        <p className="cc-newsletter__eyebrow">NEWSLETTER</p>
        <p className="cc-newsletter__title">{L.nlTitle}</p>
        <p className="cc-newsletter__desc">{L.nlDesc}</p>
      </div>
      {phase === 'done' || phase === 'already' ? (
        <div className="cc-newsletter__note" role="status">
          <CaveBuddy mood="happy">
            <strong>{phase === 'already' ? L.nlAlreadyTitle : L.nlDoneTitle}</strong>
            <span>{phase === 'already' ? L.nlAlreadyBody : queued ? L.nlQueuedBody : L.nlSentBody}</span>
          </CaveBuddy>
        </div>
      ) : (
        <div className="cc-newsletter__row">
          <label className="sr-only" htmlFor="cc-newsletter-email">{L.nlEmail}</label>
          <input id="cc-newsletter-email" name="email" type="email" required autoComplete="email" inputMode="email" placeholder="you@example.com" />
          <input className="cc-newsletter__trap" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <button type="submit" disabled={phase === 'sending'}>{phase === 'sending' ? L.nlSending : L.nlSubmit}</button>
        </div>
      )}
      {phase === 'error' && <p className="cc-newsletter__note" role="alert">{L.nlError}</p>}
      <p className="cc-newsletter__meta">
        <span>{L.nlLeave}</span>
        <a className="cc-newsletter__rss" href={locale === 'en' ? '/en/rss.xml' : '/rss.xml'}>{L.nlRss}</a>
      </p>
    </form>
  );
}
