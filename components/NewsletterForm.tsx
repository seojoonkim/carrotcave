"use client";
import { useState } from 'react';

type Phase = 'idle' | 'sending' | 'done' | 'already' | 'error';

export default function NewsletterForm() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [queued, setQueued] = useState(false);
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPhase('sending');
    try {
      const res = await fetch('/api/newsletter/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: data.get('email'), website: data.get('website') }) });
      const json = await res.json();
      if (!res.ok || !json.ok) return setPhase('error');
      setQueued(json.delivery === 'outbox');
      setPhase(json.status === 'already' ? 'already' : 'done');
    } catch { setPhase('error'); }
  }
  return (
    <form className="cc-newsletter" onSubmit={onSubmit} aria-label="새 글 메일 구독">
      <p className="cc-newsletter__title">새 글이 올라오면 다음 날 아침 8시에 메일로 보내드려요.</p>
      {phase === 'done' || phase === 'already' ? (
        <p className="cc-newsletter__note" role="status">
          {phase === 'already' ? '이미 구독 중이에요. 고마워요.' : queued ? '신청을 받았어요. 확인 메일을 곧 보내드릴게요.' : '확인 메일을 보냈어요. 메일의 버튼을 누르면 구독이 시작돼요.'}
        </p>
      ) : (
        <div className="cc-newsletter__row">
          <label className="sr-only" htmlFor="cc-newsletter-email">이메일</label>
          <input id="cc-newsletter-email" name="email" type="email" required autoComplete="email" inputMode="email" placeholder="you@example.com" />
          <input className="cc-newsletter__trap" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <button type="submit" disabled={phase === 'sending'}>{phase === 'sending' ? '보내는 중' : '구독'}</button>
        </div>
      )}
      {phase === 'error' && <p className="cc-newsletter__note" role="alert">이메일 주소를 다시 확인해 주세요.</p>}
      <a className="cc-newsletter__rss" href="/rss.xml">RSS로 받기</a>
    </form>
  );
}
