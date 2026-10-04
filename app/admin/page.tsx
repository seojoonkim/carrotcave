import type { Metadata } from 'next';
import Link from 'next/link';
import { kstDate, listSends, listSubscribers, readState, runDigest } from '@/lib/newsletter/core';
import { newsletterDeps } from '@/lib/newsletter/deps';
import { feedItems } from '@/lib/newsletter/feed';
import { loadRange, summarize } from '@/lib/stats/core';
import { posts } from '@/data/posts';
import { interviews } from '@/data/interviews';
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
const RANGES = [7, 30, 90] as const;
const n = (x: number) => x.toLocaleString('ko-KR');
const dur = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}분 ${s % 60}초` : `${s}초`);
const DEVICE: Record<string, string> = { mobile: '휴대폰', desktop: '컴퓨터', tablet: '태블릿' };
const COUNTRY: Record<string, string> = { KR: '한국', US: '미국', JP: '일본', CN: '중국', SG: '싱가포르', TW: '대만', HK: '홍콩', AE: 'UAE', GB: '영국', DE: '독일', CA: '캐나다', VN: '베트남', '??': '알 수 없음' };
const SRC: Record<string, string> = { newsletter: '뉴스레터', '': '' };

function titleOf(path: string) {
  if (path === '/') return { title: '홈', kind: '목록' };
  if (path === '/voices') return { title: '목소리 목록', kind: '목록' };
  if (path === '/newsletter') return { title: '뉴스레터 안내', kind: '안내' };
  const slug = decodeURIComponent(path.split('/')[2] ?? '');
  if (path.startsWith('/posts/')) { const p = posts.find((x) => x.slug === slug); return { title: p?.title ?? slug, kind: p?.category ?? '글' }; }
  const v = interviews.find((x) => x.slug === slug); return { title: v ? `${v.name} · ${v.title}` : slug, kind: '목소리' };
}

function Bars({ values, labels, unit }: { values: number[]; labels: string[]; unit: string }) {
  const max = Math.max(1, ...values);
  return (
    <div className="cc-stat-bars" role="img" aria-label={`${unit} 추이`}>
      {values.map((v, i) => (
        <span key={i} className="cc-stat-bars__col" title={`${labels[i]} · ${n(v)}${unit}`}>
          <i data-zero={v ? undefined : ''} style={{ height: `${Math.max(v ? 6 : 2, (v / max) * 100)}%` }} />
        </span>
      ))}
    </div>
  );
}
function Share({ rows, map }: { rows: [string, number][]; map?: Record<string, string> }) {
  const total = rows.reduce((s, [, v]) => s + v, 0) || 1;
  if (!rows.length) return <p className="cc-admin__muted">아직 데이터가 없어요.</p>;
  return (
    <ul className="cc-stat-share">
      {rows.map(([k, v]) => (
        <li key={k}><span>{map?.[k] || k}</span><b>{n(v)}</b><i style={{ width: `${(v / total) * 100}%` }} /></li>
      ))}
    </ul>
  );
}

async function StatsTab({ range }: { range: number }) {
  const deps = newsletterDeps();
  const { series } = await loadRange(deps.store, new Date(), range);
  const s = summarize(series);
  const reads = s.rows.filter((r) => r.path.startsWith('/posts/') || /^\/voices\/./.test(r.path));
  const labels = s.daily.map((d) => d.date.slice(5).replace('-', '.'));
  const peak = s.hours.indexOf(Math.max(...s.hours));
  return (
    <>
      <nav className="cc-admin__range" aria-label="기간">
        {RANGES.map((r) => <Link key={r} href={`/admin?tab=stats&range=${r}`} aria-current={r === range ? 'page' : undefined}>최근 {r}일</Link>)}
      </nav>
      <section className="cc-admin__kpis" aria-label="요약">
        <div><span>방문자</span><b>{n(s.visitors)}</b><small>같은 기기는 한 명</small></div>
        <div><span>조회수</span><b>{n(s.views)}</b><small>페이지를 연 횟수</small></div>
        <div><span>평균 읽은 깊이</span><b>{s.depth}%</b><small>글·목소리 기준</small></div>
        <div><span>끝까지 읽음</span><b>{s.completion}%</b><small>90% 이상 내려간 비율</small></div>
        <div><span>평균 머문 시간</span><b>{dur(s.time)}</b><small>화면을 보고 있던 시간</small></div>
      </section>

      <section className="cc-admin__card">
        <header className="cc-admin__card-head"><h2>날짜별 방문</h2><small>막대에 마우스를 올리면 숫자가 보여요</small></header>
        <Bars values={s.daily.map((d) => d.visitors)} labels={labels} unit="명" />
        <div className="cc-stat-bars__axis"><span>{labels[0]}</span><span>{labels.at(-1)}</span></div>
      </section>

      <section className="cc-admin__card">
        <header className="cc-admin__card-head"><h2>많이 읽힌 글</h2><small>{reads.length}편</small></header>
        <div className="cc-admin__table-wrap">
          <table className="cc-admin__table cc-admin__table--stats">
            <thead><tr><th>글</th><th>방문자</th><th>조회</th><th>읽은 깊이</th><th>끝까지</th><th>머문 시간</th></tr></thead>
            <tbody>
              {reads.slice(0, 30).map((r) => {
                const t = titleOf(r.path);
                return (
                  <tr key={r.path}>
                    <td className="cc-admin__title-cell"><a href={r.path} target="_blank" rel="noreferrer"><span>{t.kind}</span>{t.title}</a></td>
                    <td>{n(r.visitors)}</td><td>{n(r.views)}</td>
                    <td><span className="cc-stat-meter"><i style={{ width: `${r.depth}%` }} /></span>{r.depth}%</td>
                    <td>{r.completion}%</td><td>{dur(r.time)}</td>
                  </tr>
                );
              })}
              {!reads.length && <tr><td colSpan={6} className="cc-admin__muted">이 기간에는 아직 읽은 기록이 없어요. 새로 들어오는 방문부터 쌓여요.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <div className="cc-admin__grid">
        <section className="cc-admin__card"><header className="cc-admin__card-head"><h2>어디서 왔나</h2></header><Share rows={s.refs} /></section>
        <section className="cc-admin__card"><header className="cc-admin__card-head"><h2>나라</h2></header><Share rows={s.countries} map={COUNTRY} /></section>
        <section className="cc-admin__card"><header className="cc-admin__card-head"><h2>기기</h2></header><Share rows={s.devices} map={DEVICE} /></section>
        <section className="cc-admin__card">
          <header className="cc-admin__card-head"><h2>읽는 시간대</h2><small>{s.views ? `가장 많은 때 ${peak}시` : ''}</small></header>
          <Bars values={s.hours} labels={s.hours.map((_, i) => `${i}시`)} unit="회" />
          <div className="cc-stat-bars__axis"><span>0시</span><span>12시</span><span>23시</span></div>
        </section>
      </div>
      {!!s.sources.length && <section className="cc-admin__card"><header className="cc-admin__card-head"><h2>뉴스레터로 들어온 방문</h2></header><Share rows={s.sources} map={SRC} /></section>}
      <p className="cc-admin__fine">이름·이메일·IP는 저장하지 않아요. 방문자는 브라우저마다 무작위 번호로만 구분하고, &lsquo;추적 안 함&rsquo;을 켠 브라우저는 세지 않아요. 로봇과 미리보기 요청은 빼고 세요.</p>
    </>
  );
}

async function NewsletterTab({ m }: { m?: string }) {
  const deps = newsletterDeps();
  const items = feedItems();
  const [subs, sends, state, preview] = await Promise.all([listSubscribers(deps), listSends(deps), readState(deps), runDigest(deps, items, { dryRun: true })]);
  const count = (st: keyof typeof label) => subs.filter((x) => x.status === st).length;
  const next = preview.status === 'preview' ? preview.items : [];
  const today = kstDate(new Date());
  return (
    <>
      {deps.mailer.kind === 'outbox' && <p className="cc-admin__warn">발송 서비스(Resend)가 아직 연결되지 않았어요. 구독 신청은 받고 있고, 연결되면 바로 보낼 수 있어요.</p>}
      <section className="cc-admin__kpis" aria-label="구독 현황">
        <div><span>구독 중</span><b>{count('active')}</b><small>메일을 받는 사람</small></div>
        <div><span>확인 대기</span><b>{count('pending')}</b><small>확인 메일을 안 누름</small></div>
        <div><span>해지</span><b>{count('unsubscribed')}</b><small>구독을 끊은 사람</small></div>
        <div><span>발송 시각</span><b>매일 08:00</b><small>{state?.skipDate === today ? '오늘은 건너뜀' : '새 글 있을 때만'}</small></div>
        <div><span>마지막 발송</span><b>{fmt(state?.lastSentAt)}</b><small>자동·수동 포함</small></div>
      </section>

      <section className="cc-admin__card">
        <header className="cc-admin__card-head"><h2>다음 발송</h2><small>{next.length}편 · 받는 사람 {preview.status === 'preview' ? preview.recipients : 0}명</small></header>
        {!state && <p className="cc-admin__muted">첫 실행 때 지금까지의 글을 기준점으로 기록하고, 그 뒤에 올라오는 글부터 보내요.</p>}
        {next.length ? <ol className="cc-admin__items">{next.map((i) => <li key={i.key}><span>{i.category}</span><a href={i.url}>{i.title}</a></li>)}</ol> : state && <p className="cc-admin__muted">아직 보낼 새 글이 없어요.</p>}
        <div className="cc-admin__toolbar">
          <form action={sendTest} className="cc-admin__field">
            <input name="to" type="email" defaultValue="simon@hashed.com" aria-label="테스트 받을 이메일" />
            <button type="submit" className="cc-admin__ghost">테스트 메일</button>
          </form>
          <div className="cc-admin__buttons">
            <form action={skip}><button type="submit" className="cc-admin__ghost">오늘 건너뛰기</button></form>
            <form action={resendPending}><button type="submit" className="cc-admin__ghost">확인 메일 다시 보내기</button></form>
            <form action={sendNow}><button type="submit">지금 보내기</button></form>
          </div>
        </div>
      </section>

      <section className="cc-admin__card">
        <header className="cc-admin__card-head">
          <h2>구독자</h2><small>{subs.length}명</small>
          <form action={addSubscriber} className="cc-admin__field cc-admin__field--end">
            <input name="email" type="email" required placeholder="직접 추가할 이메일" aria-label="직접 추가할 이메일" />
            <button type="submit">추가</button>
          </form>
        </header>
        <div className="cc-admin__table-wrap">
          <table className="cc-admin__table">
            <thead><tr><th>이메일</th><th>상태</th><th>신청</th><th className="cc-admin__hide-sm">경로</th><th><span className="sr-only">삭제</span></th></tr></thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id}>
                  <td>{s.email}</td><td><span className="cc-admin__pill" data-status={s.status}>{label[s.status]}</span></td><td>{fmt(s.createdAt)}</td><td className="cc-admin__hide-sm">{s.source === 'admin' ? '직접 추가' : '사이트'}</td>
                  <td className="cc-admin__row-end"><form action={removeSubscriber}><input type="hidden" name="id" value={s.id} /><button type="submit" className="cc-admin__text-btn">삭제</button></form></td>
                </tr>
              ))}
              {!subs.length && <tr><td colSpan={5} className="cc-admin__empty">아직 구독자가 없어요. 사이트 맨 아래 구독칸으로 들어온 신청이 여기에 쌓여요.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="cc-admin__card">
        <header className="cc-admin__card-head"><h2>발송 기록</h2><small>최근 20건</small></header>
        <div className="cc-admin__table-wrap">
          <table className="cc-admin__table">
            <thead><tr><th>시각</th><th className="cc-admin__hide-sm">종류</th><th>글</th><th>받은 수</th><th>성공 / 실패</th></tr></thead>
            <tbody>
              {sends.map((s) => <tr key={s.at}><td>{fmt(s.at)}</td><td className="cc-admin__hide-sm">{s.mode === 'test' ? '테스트' : s.mode === 'cron' ? '자동' : '수동'}</td><td>{s.items.length}편</td><td>{s.recipients}</td><td>{s.sent} / {s.failed}</td></tr>)}
              {!sends.length && <tr><td colSpan={5} className="cc-admin__empty">아직 발송 기록이 없어요.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      {m && null}
    </>
  );
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ e?: string; m?: string; tab?: string; range?: string }> }) {
  const { e, m, tab, range } = await searchParams;
  if (!(await isAdmin())) {
    return (
      <main className="cc-admin cc-admin--login">
        <form action={login} className="cc-admin__login">
          <h1>Carrot Cave 관리자</h1>
          <label htmlFor="cc-admin-password">비밀번호</label>
          <input id="cc-admin-password" name="password" type="password" inputMode="numeric" required autoComplete="current-password" />
          {e === 'locked' ? <p className="cc-admin__error" role="alert">잠시 잠겼어요. 15분 뒤 다시 시도해 주세요.</p> : e && <p className="cc-admin__error" role="alert">비밀번호가 맞지 않아요.</p>}
          <button type="submit">들어가기</button>
        </form>
      </main>
    );
  }
  const active = tab === 'newsletter' || (!tab && m) ? 'newsletter' : 'stats';
  const days = RANGES.includes(Number(range) as (typeof RANGES)[number]) ? Number(range) : 30;
  return (
    <main className="cc-admin">
      <header className="cc-admin__head">
        <div className="cc-admin__brand"><h1>Carrot Cave 관리자</h1><small>carrotcave.com</small></div>
        <nav className="cc-admin__tabs" aria-label="관리 메뉴">
          <Link href="/admin?tab=stats" aria-current={active === 'stats' ? 'page' : undefined}>읽기 통계</Link>
          <Link href="/admin?tab=newsletter" aria-current={active === 'newsletter' ? 'page' : undefined}>뉴스레터</Link>
        </nav>
        <form action={logout}><button type="submit" className="cc-admin__text-btn">로그아웃</button></form>
      </header>
      {m && notices[m] && <p className="cc-admin__notice" role="status">{notices[m]}</p>}
      {active === 'stats' ? <StatsTab range={days} /> : <NewsletterTab m={m} />}
    </main>
  );
}
