import type { Metadata } from 'next';
import { kstDate, listSends, listSubscribers, readState, runDigest } from '@/lib/newsletter/core';
import { newsletterDeps } from '@/lib/newsletter/deps';
import { feedItems } from '@/lib/newsletter/feed';
import { isAdmin } from './auth';
import { addSubscriber, login, logout, removeSubscriber, resendPending, sendNow, sendTest, skip } from './actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '관리자 · Carrot Cave', robots: { index: false, follow: false } };

const notices: Record<string, string> = {
  added: '구독자를 추가했어요.', invalid: '이메일 주소가 올바르지 않아요.', removed: '구독자를 삭제했어요.',
  'test-sent': '테스트 메일을 보냈어요.', 'test-failed': '테스트 메일을 보내지 못했어요. 발송 서비스 연결을 확인해 주세요.',
  'run-sent': '새 글 메일을 보냈어요.', 'run-nothing-new': '보낼 새 글이 없어요.', 'run-baseline': '기준점을 기록했어요. 이후 새 글부터 보내요.',
  'run-mailer-missing': '발송 서비스가 아직 연결되지 않아 보내지 않았어요.', 'run-failed': '발송이 모두 실패했어요. 다음 실행에서 다시 시도해요.',
  skipped: '오늘 발송을 건너뛰도록 했어요.', 'confirm-sent': '대기 중인 구독자에게 확인 메일을 다시 보냈어요.', 'confirm-none': '다시 보낼 확인 메일이 없거나 보내지 못했어요.',
};
const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'short', timeStyle: 'short' }) : '—');
const label = { active: '구독 중', pending: '확인 대기', unsubscribed: '해지' } as const;

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ e?: string; m?: string }> }) {
  const { e, m } = await searchParams;
  if (!(await isAdmin())) {
    return (
      <main className="cc-admin cc-admin--login">
        <form action={login} className="cc-admin__login">
          <h1>Carrot Cave 관리자</h1>
          <label htmlFor="cc-admin-password">비밀번호</label>
          <input id="cc-admin-password" name="password" type="password" required autoComplete="current-password" />
          {e && <p className="cc-admin__error" role="alert">비밀번호가 맞지 않아요.</p>}
          <button type="submit">들어가기</button>
        </form>
      </main>
    );
  }
  const deps = newsletterDeps();
  const items = feedItems();
  const [subs, sends, state, preview] = await Promise.all([listSubscribers(deps), listSends(deps), readState(deps), runDigest(deps, items, { dryRun: true })]);
  const count = (s: keyof typeof label) => subs.filter((x) => x.status === s).length;
  const next = preview.status === 'preview' ? preview.items : [];
  const today = kstDate(new Date());
  return (
    <main className="cc-admin">
      <header className="cc-admin__head">
        <h1>뉴스레터 관리</h1>
        <form action={logout}><button type="submit" className="cc-admin__ghost">로그아웃</button></form>
      </header>
      {m && notices[m] && <p className="cc-admin__notice" role="status">{notices[m]}</p>}
      {deps.mailer.kind === 'outbox' && <p className="cc-admin__warn">발송 서비스(Resend)가 아직 연결되지 않았어요. 구독 신청은 받고 있고, 연결되면 바로 보낼 수 있어요.</p>}

      <section className="cc-admin__stats" aria-label="현황">
        <div><b>{count('active')}</b><span>구독 중</span></div>
        <div><b>{count('pending')}</b><span>확인 대기</span></div>
        <div><b>{count('unsubscribed')}</b><span>해지</span></div>
        <div><b>매일 08:00</b><span>{state?.skipDate === today ? '오늘은 건너뜀' : '새 글 있을 때만 발송'}</span></div>
        <div><b>{fmt(state?.lastSentAt)}</b><span>마지막 발송</span></div>
      </section>

      <section className="cc-admin__card">
        <h2>다음 발송 미리보기 <small>{next.length}편 · 받는 사람 {preview.status === 'preview' ? preview.recipients : 0}명</small></h2>
        {!state && <p className="cc-admin__muted">첫 실행 때 지금까지의 글을 기준점으로 기록하고, 그 뒤에 올라오는 글부터 보내요.</p>}
        {next.length ? <ol className="cc-admin__items">{next.map((i) => <li key={i.key}><span>{i.category}</span><a href={i.url}>{i.title}</a></li>)}</ol> : state && <p className="cc-admin__muted">아직 보낼 새 글이 없어요.</p>}
        <div className="cc-admin__actions">
          <form action={sendTest} className="cc-admin__inline">
            <input name="to" type="email" defaultValue="simon@hashed.com" aria-label="테스트 받을 이메일" />
            <button type="submit">테스트 메일</button>
          </form>
          <form action={sendNow}><button type="submit">지금 보내기</button></form>
          <form action={skip}><button type="submit" className="cc-admin__ghost">오늘 건너뛰기</button></form>
          <form action={resendPending}><button type="submit" className="cc-admin__ghost">확인 메일 다시 보내기</button></form>
        </div>
      </section>

      <section className="cc-admin__card">
        <h2>구독자 <small>{subs.length}명</small></h2>
        <form action={addSubscriber} className="cc-admin__inline">
          <input name="email" type="email" required placeholder="직접 추가할 이메일" aria-label="직접 추가할 이메일" />
          <button type="submit">추가</button>
        </form>
        <div className="cc-admin__table-wrap">
          <table className="cc-admin__table">
            <thead><tr><th>이메일</th><th>상태</th><th>신청</th><th>경로</th><th><span className="sr-only">삭제</span></th></tr></thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id}>
                  <td>{s.email}</td><td data-status={s.status}>{label[s.status]}</td><td>{fmt(s.createdAt)}</td><td>{s.source === 'admin' ? '직접 추가' : '사이트'}</td>
                  <td><form action={removeSubscriber}><input type="hidden" name="id" value={s.id} /><button type="submit" className="cc-admin__ghost">삭제</button></form></td>
                </tr>
              ))}
              {!subs.length && <tr><td colSpan={5} className="cc-admin__muted">아직 구독자가 없어요.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="cc-admin__card">
        <h2>발송 기록</h2>
        <div className="cc-admin__table-wrap">
          <table className="cc-admin__table">
            <thead><tr><th>시각</th><th>종류</th><th>글</th><th>받는 사람</th><th>성공/실패</th></tr></thead>
            <tbody>
              {sends.map((s) => <tr key={s.at}><td>{fmt(s.at)}</td><td>{s.mode === 'test' ? '테스트' : s.mode === 'cron' ? '자동' : '수동'}</td><td>{s.items.length}편</td><td>{s.recipients}</td><td>{s.sent}/{s.failed}</td></tr>)}
              {!sends.length && <tr><td colSpan={5} className="cc-admin__muted">아직 발송 기록이 없어요.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
