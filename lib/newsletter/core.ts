// Carrot Cave newsletter core: pure logic with injected storage and mail delivery.
// No app imports, so node --test can load this file directly.
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type FeedItem = { key: string; kind: 'post' | 'voice'; title: string; summary: string; url: string; date: string; category: string };
export type SubStatus = 'pending' | 'active' | 'unsubscribed';
export type Subscriber = { id: string; email: string; status: SubStatus; createdAt: string; confirmedAt?: string; unsubscribedAt?: string; source?: string };
export type State = { baselineAt?: string; sentKeys: string[]; lastRunDate?: string; lastSentAt?: string; skipDate?: string };
export type SendLog = { at: string; mode: 'cron' | 'manual' | 'test'; items: string[]; recipients: number; sent: number; failed: number; delivery: 'resend' | 'outbox'; note?: string };
export type Mail = { to: string; subject: string; html: string; text: string; headers?: Record<string, string> };
export interface Store {
  getJSON<T>(key: string): Promise<T | null>;
  putJSON(key: string, value: unknown): Promise<void>;
  list(prefix: string): Promise<string[]>;
  del(key: string): Promise<void>;
}
export interface Mailer { kind: 'resend' | 'outbox'; sendBatch(mails: Mail[]): Promise<{ sent: number; failed: number }> }
export type Deps = { store: Store; mailer: Mailer; secret: string; siteUrl: string; now?: () => Date };

const DAY = 86_400_000;
const nowOf = (deps: Deps) => (deps.now ? deps.now() : new Date());
const derive = (secret: string, purpose: string) => createHash('sha256').update(`${purpose}:${secret}`).digest();

export function normalizeEmail(raw: unknown): string | null {
  const email = String(raw ?? '').trim().toLowerCase();
  if (email.length > 254) return null;
  return /^[^\s@<>()[\]\\,;:"]{1,64}@[a-z0-9.-]+\.[a-z]{2,}$/.test(email) ? email : null;
}
export function subscriberId(email: string, secret: string) {
  return createHmac('sha256', derive(secret, 'id')).update(email).digest('hex').slice(0, 32);
}
export type Sealed = { v: 1; iv: string; tag: string; data: string };
export function seal(value: unknown, secret: string): Sealed {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', derive(secret, 'enc'), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return { v: 1, iv: iv.toString('base64url'), tag: cipher.getAuthTag().toString('base64url'), data: data.toString('base64url') };
}
export function unseal<T>(box: Sealed, secret: string): T {
  const decipher = createDecipheriv('aes-256-gcm', derive(secret, 'enc'), Buffer.from(box.iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(box.tag, 'base64url'));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(box.data, 'base64url')), decipher.final()]).toString('utf8')) as T;
}
export function safeEqual(a: string, b: string) {
  return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
}
export function signToken(payload: { a: string; id: string; exp: number }, secret: string) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', derive(secret, 'token')).update(body).digest('base64url');
  return `${body}.${sig}`;
}
export function verifyToken(token: unknown, action: string, secret: string, now = Date.now()): string | null {
  const [body, sig] = String(token ?? '').split('.');
  if (!body || !sig) return null;
  const expected = createHmac('sha256', derive(secret, 'token')).update(body).digest('base64url');
  if (!safeEqual(sig, expected)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return p && p.a === action && typeof p.id === 'string' && Number(p.exp) > now ? p.id : null;
  } catch { return null; }
}
export const kstDate = (d: Date) => new Date(d.getTime() + 9 * 3_600_000).toISOString().slice(0, 10);

const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ── RSS ───────────────────────────────────────────────────────────
export function rssXml(items: FeedItem[], site = 'https://carrotcave.com') {
  const entries = items.map((i) => `    <item>
      <title>${esc(i.title)}</title>
      <link>${esc(i.url)}</link>
      <guid isPermaLink="true">${esc(i.url)}</guid>
      <category>${esc(i.category)}</category>
      <pubDate>${new Date(`${i.date}T09:00:00+09:00`).toUTCString()}</pubDate>
      <description>${esc(i.summary)}</description>
    </item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Carrot Cave</title>
    <link>${site}</link>
    <description>토끼를 따라왔는데, 생각이 길을 잃었습니다. Simon Kim의 글과 목소리 아카이브.</description>
    <language>ko</language>
    <atom:link href="${site}/rss.xml" rel="self" type="application/rss+xml" />
${entries}
  </channel>
</rss>
`;
}

// ── Mail rendering ────────────────────────────────────────────────
export function renderDigest(items: FeedItem[], unsubscribeUrl: string, site = 'https://carrotcave.com') {
  const subject = items.length === 1 ? `[당근동굴] ${items[0].title}` : `[당근동굴] 새 글 ${items.length}편 · ${items[0].title} 외`;
  const rows = items.map((i) => `<tr><td style="padding:22px 0;border-top:1px solid #253041">
<p style="margin:0 0 6px;color:#f39a52;font:600 12px/1.4 -apple-system,Segoe UI,sans-serif;letter-spacing:.06em">${esc(i.category)} · ${esc(i.date)}</p>
<a href="${esc(i.url)}?utm_source=newsletter" style="color:#dfe5ed;text-decoration:none;font:700 20px/1.4 -apple-system,Segoe UI,sans-serif">${esc(i.title)}</a>
<p style="margin:8px 0 0;color:#a3adbb;font:400 15px/1.7 -apple-system,Segoe UI,sans-serif">${esc(i.summary)}</p>
</td></tr>`).join('');
  const html = `<!doctype html><html lang="ko"><body style="margin:0;background:#0b0e14">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0e14"><tr><td align="center" style="padding:36px 20px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
<tr><td style="padding-bottom:18px"><a href="${site}" style="color:#dfe5ed;text-decoration:none;font:600 15px/1 ui-monospace,Menlo,monospace">CarrotCave<span style="color:#8e99a8">.com</span></a></td></tr>
${rows}
<tr><td style="padding:26px 0 0;border-top:1px solid #253041;color:#7a8595;font:400 12px/1.7 -apple-system,Segoe UI,sans-serif">
당근동굴 새 글 알림을 신청하셔서 받는 메일입니다. 새 글이 있는 날 아침 8시에 한 번만 보내드려요.<br>
<a href="${esc(unsubscribeUrl)}" style="color:#a3adbb">구독 해지</a> · <a href="${site}/rss.xml" style="color:#a3adbb">RSS</a>
</td></tr></table></td></tr></table></body></html>`;
  const text = `${items.map((i) => `${i.title}\n${i.summary}\n${i.url}`).join('\n\n')}\n\n구독 해지: ${unsubscribeUrl}\n`;
  return { subject, html, text };
}
export function renderConfirm(confirmUrl: string, site = 'https://carrotcave.com') {
  const subject = '[당근동굴] 구독을 확인해 주세요';
  const html = `<!doctype html><html lang="ko"><body style="margin:0;background:#0b0e14;padding:40px 20px">
<div style="max-width:520px;margin:0 auto;font:400 16px/1.7 -apple-system,Segoe UI,sans-serif;color:#cdd5df">
<p style="font:600 15px/1 ui-monospace,Menlo,monospace;color:#dfe5ed">CarrotCave<span style="color:#8e99a8">.com</span></p>
<p>당근동굴 새 글 알림을 신청해 주셔서 고마워요. 아래 버튼을 누르면 구독이 확정돼요.</p>
<p><a href="${esc(confirmUrl)}" style="display:inline-block;padding:12px 20px;border-radius:4px;background:#f39a52;color:#0b0e14;font-weight:700;text-decoration:none">구독 확정하기</a></p>
<p style="color:#7a8595;font-size:13px">직접 신청하지 않으셨다면 이 메일은 무시하셔도 돼요. 링크는 7일 동안 유효해요. · <a href="${site}" style="color:#a3adbb">${site.replace('https://', '')}</a></p>
</div></body></html>`;
  return { subject, html, text: `당근동굴 구독을 확정하려면 아래 링크를 열어 주세요.\n${confirmUrl}\n` };
}

// ── Delivery adapters ─────────────────────────────────────────────
export function resendMailer(apiKey: string, from: string, fetchImpl: typeof fetch = fetch): Mailer {
  return {
    kind: 'resend',
    async sendBatch(mails) {
      let sent = 0; let failed = 0;
      for (let i = 0; i < mails.length; i += 100) {
        const chunk = mails.slice(i, i + 100);
        const res = await fetchImpl('https://api.resend.com/emails/batch', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(chunk.map((m) => ({ from, to: [m.to], subject: m.subject, html: m.html, text: m.text, headers: m.headers }))),
        }).catch(() => null);
        if (res && res.ok) sent += chunk.length; else failed += chunk.length;
      }
      return { sent, failed };
    },
  };
}
/** Used until a mail provider is connected: nothing leaves the server. */
export function outboxMailer(): Mailer {
  return { kind: 'outbox', async sendBatch(mails) { return { sent: 0, failed: mails.length }; } };
}
export function memoryStore(seed: Record<string, unknown> = {}): Store & { data: Map<string, unknown> } {
  const data = new Map<string, unknown>(Object.entries(seed));
  return {
    data,
    async getJSON<T>(key: string) { return data.has(key) ? (structuredClone(data.get(key)) as T) : null; },
    async putJSON(key, value) { data.set(key, structuredClone(value)); },
    async list(prefix) { return [...data.keys()].filter((k) => k.startsWith(prefix)); },
    async del(key) { data.delete(key); },
  };
}
export function fileStore(dir: string): Store {
  const file = (key: string) => join(dir, key);
  const walk = (base: string, rel = ''): string[] => {
    const abs = join(base, rel);
    if (!existsSync(abs)) return [];
    return readdirSync(abs, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(base, join(rel, e.name)) : [join(rel, e.name)]));
  };
  return {
    async getJSON<T>(key: string) { return existsSync(file(key)) ? (JSON.parse(readFileSync(file(key), 'utf8')) as T) : null; },
    async putJSON(key, value) { mkdirSync(dirname(file(key)), { recursive: true }); writeFileSync(file(key), JSON.stringify(value)); },
    async list(prefix) { return walk(dir).filter((k) => k.startsWith(prefix)); },
    async del(key) { rmSync(file(key), { force: true }); },
  };
}

// ── Subscribers ───────────────────────────────────────────────────
const subKey = (id: string) => `subscribers/${id}.json`;
async function loadSub(deps: Deps, id: string) {
  const box = await deps.store.getJSON<Sealed>(subKey(id));
  return box ? unseal<Subscriber>(box, deps.secret) : null;
}
const saveSub = (deps: Deps, sub: Subscriber) => deps.store.putJSON(subKey(sub.id), seal(sub, deps.secret));
export const confirmUrl = (deps: Deps, id: string) =>
  `${deps.siteUrl}/api/newsletter/confirm?t=${signToken({ a: 'confirm', id, exp: nowOf(deps).getTime() + 7 * DAY }, deps.secret)}`;
export const unsubscribeUrl = (deps: Deps, id: string) =>
  `${deps.siteUrl}/api/newsletter/unsubscribe?t=${signToken({ a: 'unsub', id, exp: nowOf(deps).getTime() + 3650 * DAY }, deps.secret)}`;

export async function subscribe(deps: Deps, rawEmail: unknown, source = 'site') {
  const email = normalizeEmail(rawEmail);
  if (!email) return { ok: false as const, error: 'invalid-email' };
  const id = subscriberId(email, deps.secret);
  const existing = await loadSub(deps, id);
  if (existing?.status === 'active') return { ok: true as const, status: 'already' as const, delivery: deps.mailer.kind };
  const sub: Subscriber = { createdAt: existing?.createdAt ?? nowOf(deps).toISOString(), id, email, status: 'pending', source };
  await saveSub(deps, sub);
  const m = renderConfirm(confirmUrl(deps, id), deps.siteUrl);
  await deps.mailer.sendBatch([{ to: email, ...m }]);
  return { ok: true as const, status: 'pending' as const, delivery: deps.mailer.kind };
}
export async function confirm(deps: Deps, token: unknown) {
  const id = verifyToken(token, 'confirm', deps.secret, nowOf(deps).getTime());
  const sub = id ? await loadSub(deps, id) : null;
  if (!sub) return 'invalid' as const;
  if (sub.status !== 'active') await saveSub(deps, { ...sub, status: 'active', confirmedAt: nowOf(deps).toISOString(), unsubscribedAt: undefined });
  return 'confirmed' as const;
}
export async function unsubscribe(deps: Deps, token: unknown) {
  const id = verifyToken(token, 'unsub', deps.secret, nowOf(deps).getTime());
  const sub = id ? await loadSub(deps, id) : null;
  if (!sub) return 'invalid' as const;
  await saveSub(deps, { ...sub, status: 'unsubscribed', unsubscribedAt: nowOf(deps).toISOString() });
  return 'unsubscribed' as const;
}
export async function listSubscribers(deps: Deps) {
  const keys = await deps.store.list('subscribers/');
  const subs = await Promise.all(keys.map((k) => loadSub(deps, k.replace(/^subscribers\//, '').replace(/\.json$/, ''))));
  return subs.filter((s): s is Subscriber => !!s).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function adminAdd(deps: Deps, rawEmail: unknown) {
  const email = normalizeEmail(rawEmail);
  if (!email) return false;
  const id = subscriberId(email, deps.secret);
  const at = nowOf(deps).toISOString();
  const existing = await loadSub(deps, id);
  await saveSub(deps, { createdAt: existing?.createdAt ?? at, id, email, status: 'active', confirmedAt: at, source: 'admin' });
  return true;
}
export const adminRemove = (deps: Deps, id: string) => deps.store.del(subKey(id));
export async function resendConfirmations(deps: Deps) {
  const pending = (await listSubscribers(deps)).filter((s) => s.status === 'pending');
  if (!pending.length) return { sent: 0, failed: 0 };
  return deps.mailer.sendBatch(pending.map((s) => ({ to: s.email, ...renderConfirm(confirmUrl(deps, s.id), deps.siteUrl) })));
}

// ── Daily digest ──────────────────────────────────────────────────
export async function readState(deps: Deps) { return deps.store.getJSON<State>('state.json'); }
export function pendingItems(items: FeedItem[], state: State | null) {
  if (!state) return [];
  const sent = new Set(state.sentKeys);
  return items.filter((i) => !sent.has(i.key));
}
async function log(deps: Deps, entry: SendLog) { await deps.store.putJSON(`sends/${entry.at}.json`, entry); }
export async function listSends(deps: Deps, limit = 20) {
  const keys = (await deps.store.list('sends/')).sort().reverse().slice(0, limit);
  return (await Promise.all(keys.map((k) => deps.store.getJSON<SendLog>(k)))).filter((x): x is SendLog => !!x);
}
export async function skipToday(deps: Deps) {
  const state = (await readState(deps)) ?? { sentKeys: [] };
  await deps.store.putJSON('state.json', { ...state, skipDate: kstDate(nowOf(deps)) });
}

export type RunResult =
  | { status: 'baseline'; count: number }
  | { status: 'already-ran' | 'skipped' | 'nothing-new' }
  | { status: 'preview'; items: FeedItem[]; recipients: number }
  | { status: 'mailer-missing'; items: FeedItem[]; recipients: number }
  | { status: 'failed' | 'sent'; items: number; recipients: number; sent: number; failed: number };

/** Sends each new item once. The first run records a baseline so the archive is never blasted. */
export async function runDigest(deps: Deps, items: FeedItem[], { mode = 'cron', dryRun = false }: { mode?: 'cron' | 'manual'; dryRun?: boolean } = {}): Promise<RunResult> {
  const now = nowOf(deps);
  const today = kstDate(now);
  const state = await readState(deps);
  if (!state) {
    if (dryRun) return { status: 'preview', items: [], recipients: 0 };
    await deps.store.putJSON('state.json', { baselineAt: now.toISOString(), sentKeys: items.map((i) => i.key), lastRunDate: today } satisfies State);
    return { status: 'baseline', count: items.length };
  }
  if (!dryRun && mode === 'cron' && state.lastRunDate === today) return { status: 'already-ran' };
  if (!dryRun && mode === 'cron' && state.skipDate === today) {
    await deps.store.putJSON('state.json', { ...state, lastRunDate: today });
    return { status: 'skipped' };
  }
  const fresh = pendingItems(items, state);
  const active = (await listSubscribers(deps)).filter((s) => s.status === 'active');
  if (dryRun) return { status: 'preview', items: fresh, recipients: active.length };
  if (!fresh.length) {
    await deps.store.putJSON('state.json', { ...state, lastRunDate: today });
    return { status: 'nothing-new' };
  }
  if (deps.mailer.kind === 'outbox') return { status: 'mailer-missing', items: fresh, recipients: active.length };
  const mails = active.map((s) => {
    const u = unsubscribeUrl(deps, s.id);
    return { to: s.email, ...renderDigest(fresh, u, deps.siteUrl), headers: { 'List-Unsubscribe': `<${u}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } };
  });
  const r = mails.length ? await deps.mailer.sendBatch(mails) : { sent: 0, failed: 0 };
  const entry: SendLog = { at: now.toISOString(), mode, items: fresh.map((i) => i.key), recipients: mails.length, ...r, delivery: deps.mailer.kind };
  if (mails.length && r.sent === 0) {
    await log(deps, { ...entry, note: 'all failed; will retry next run' });
    return { status: 'failed', items: fresh.length, recipients: mails.length, ...r };
  }
  await deps.store.putJSON('state.json', { ...state, sentKeys: [...new Set([...state.sentKeys, ...fresh.map((i) => i.key)])], lastRunDate: today, lastSentAt: now.toISOString() });
  await log(deps, entry);
  return { status: 'sent', items: fresh.length, recipients: mails.length, ...r };
}
export async function testSend(deps: Deps, items: FeedItem[], to: unknown) {
  const email = normalizeEmail(to);
  if (!email) return { sent: 0, failed: 1 };
  const state = await readState(deps);
  const fresh = pendingItems(items, state);
  const sample = (fresh.length ? fresh : items).slice(0, 3);
  const r = await deps.mailer.sendBatch([{ to: email, ...renderDigest(sample, `${deps.siteUrl}/newsletter`, deps.siteUrl) }]);
  await log(deps, { at: nowOf(deps).toISOString(), mode: 'test', items: sample.map((i) => i.key), recipients: 1, ...r, delivery: deps.mailer.kind, note: 'test' });
  return r;
}
export const adminToken = (secret: string, now = Date.now()) => signToken({ a: 'admin', id: 'owner', exp: now + 7 * DAY }, secret);
export const isAdminToken = (token: unknown, secret: string, now = Date.now()) => verifyToken(token, 'admin', secret, now) === 'owner';

/* ── Admin login throttle ──────────────────────────────────────────────
 * A short PIN (e.g. 4 digits) is only safe behind a hard attempt limit.
 * Per client: 5 wrong tries per 15 min → locked 15 min.
 * Site-wide ceiling: 30 wrong tries per hour → everyone locked for the rest of the hour
 * (stops distributed guessing across many IPs; the owner can wait it out). */
export const LOGIN_LIMITS = { perClient: 5, clientWindowMs: 15 * 60_000, global: 30, globalWindowMs: 60 * 60_000 };
type Attempts = { fails: number[] };
const clientKey = (client: string) => `auth/fail-${createHash('sha256').update(client).digest('hex').slice(0, 24)}.json`;
const recent = (a: Attempts | null, now: number, win: number) => (a?.fails ?? []).filter((t) => now - t < win);
export async function loginGate(store: Store, client: string, now = Date.now()) {
  const mine = recent(await store.getJSON<Attempts>(clientKey(client)), now, LOGIN_LIMITS.clientWindowMs);
  const all = recent(await store.getJSON<Attempts>('auth/fail-global.json'), now, LOGIN_LIMITS.globalWindowMs);
  return { locked: mine.length >= LOGIN_LIMITS.perClient || all.length >= LOGIN_LIMITS.global };
}
export async function recordLoginFailure(store: Store, client: string, now = Date.now()) {
  const mine = recent(await store.getJSON<Attempts>(clientKey(client)), now, LOGIN_LIMITS.clientWindowMs);
  const all = recent(await store.getJSON<Attempts>('auth/fail-global.json'), now, LOGIN_LIMITS.globalWindowMs);
  await store.putJSON(clientKey(client), { fails: [...mine, now] });
  await store.putJSON('auth/fail-global.json', { fails: [...all, now].slice(-200) });
}
export async function clearLoginFailures(store: Store, client: string) {
  await store.del(clientKey(client));
}
/** Session cookies are bound to the current password: changing ADMIN_PASSWORD logs every browser out. */
export const sessionSecret = (secret: string, password: string) =>
  createHmac('sha256', secret).update('admin-session:' + password).digest('base64url');
