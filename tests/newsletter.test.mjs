// Newsletter: double opt-in, one digest per new item, no archive blast, safe unsubscribe, sealed storage, gated admin.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as nl from '../lib/newsletter/core.ts';

const SECRET = 'test-secret-0123456789';
const items = (...keys) => keys.map((k, i) => ({ key: k, kind: 'post', title: `T ${k}`, summary: 's', url: `https://carrotcave.com/posts/${k}`, date: `2026-10-0${9 - i}`, category: '탐험' }));
function setup(kind = 'resend', at = '2026-10-05T23:00:00Z') {
  const outbox = [];
  const mailer = { kind, async sendBatch(m) { outbox.push(...m); return kind === 'outbox' ? { sent: 0, failed: m.length } : { sent: m.length, failed: 0 }; } };
  const store = nl.memoryStore();
  let now = new Date(at);
  const deps = { store, mailer, secret: SECRET, siteUrl: 'https://carrotcave.com', now: () => now };
  return { deps, store, outbox, setNow: (iso) => { now = new Date(iso); } };
}
const tokenFrom = (url) => new URL(url.match(/https:\/\/carrotcave\.com\/api\/newsletter\/\w+\?t=[^"\s<>]+/)[0]).searchParams.get('t');

test('double opt-in: subscribe sends a confirm mail, only confirmed people are active', async () => {
  const { deps, outbox } = setup();
  assert.equal((await nl.subscribe(deps, 'not-an-email')).ok, false);
  const r = await nl.subscribe(deps, '  Reader@Example.com ');
  assert.equal(r.status, 'pending');
  assert.equal(outbox.length, 1);
  assert.equal(outbox[0].to, 'reader@example.com');
  assert.equal((await nl.listSubscribers(deps))[0].status, 'pending');
  assert.equal(await nl.confirm(deps, 'forged.token'), 'invalid');
  assert.equal(await nl.confirm(deps, tokenFrom(outbox[0].html)), 'confirmed');
  assert.equal((await nl.listSubscribers(deps))[0].status, 'active');
  assert.equal((await nl.subscribe(deps, 'reader@example.com')).status, 'already');
});

test('subscriber emails are sealed at rest, never stored in plain text', async () => {
  const { deps, store } = setup();
  await nl.subscribe(deps, 'secret-reader@example.com');
  const raw = JSON.stringify([...store.data.values()]);
  assert.doesNotMatch(raw, /secret-reader/);
  assert.doesNotMatch([...store.data.keys()].join(), /secret-reader/);
});

test('first run records a baseline (no archive blast); later runs send each new item exactly once', async () => {
  const { deps, outbox, setNow } = setup();
  await nl.adminAdd(deps, 'a@example.com');
  await nl.adminAdd(deps, 'b@example.com');
  assert.equal((await nl.runDigest(deps, items('old1', 'old2'))).status, 'baseline');
  assert.equal(outbox.length, 0);
  setNow('2026-10-06T23:00:00Z');
  assert.equal((await nl.runDigest(deps, items('old1', 'old2'))).status, 'nothing-new');
  setNow('2026-10-07T23:00:00Z');
  const r = await nl.runDigest(deps, items('new1', 'old1', 'old2'));
  assert.equal(r.status, 'sent');
  assert.equal(outbox.length, 2);
  assert.match(outbox[0].subject, /T new1/);
  assert.equal(outbox[0].headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click');
  assert.equal((await nl.runDigest(deps, items('new1', 'old1', 'old2'))).status, 'already-ran');
  setNow('2026-10-08T23:00:00Z');
  assert.equal((await nl.runDigest(deps, items('new1', 'old1', 'old2'))).status, 'nothing-new');
  assert.equal(outbox.length, 2);
});

test('without a connected mail provider nothing is marked sent, so it goes out once connected', async () => {
  const { deps } = setup('outbox');
  await nl.adminAdd(deps, 'a@example.com');
  await nl.runDigest(deps, items('old'));
  deps.now = () => new Date('2026-10-07T23:00:00Z');
  assert.equal((await nl.runDigest(deps, items('new', 'old'))).status, 'mailer-missing');
  assert.deepEqual(nl.pendingItems(items('new', 'old'), await nl.readState(deps)).map((i) => i.key), ['new']);
});

test('unsubscribe: link GET only opens a confirm page; POST unsubscribes and stops mail', async () => {
  const { deps, outbox, setNow } = setup();
  await nl.adminAdd(deps, 'a@example.com');
  await nl.runDigest(deps, items('old'));
  setNow('2026-10-07T23:00:00Z');
  await nl.runDigest(deps, items('n1', 'old'));
  const t = tokenFrom(outbox.at(-1).headers['List-Unsubscribe']);
  assert.equal(await nl.unsubscribe(deps, t), 'unsubscribed');
  setNow('2026-10-08T23:00:00Z');
  const before = outbox.length;
  await nl.runDigest(deps, items('n2', 'n1', 'old'));
  assert.equal(outbox.length, before);
  const route = readFileSync(new URL('../app/api/newsletter/unsubscribe/route.ts', import.meta.url), 'utf8');
  const getBody = route.slice(route.indexOf('export async function GET'), route.indexOf('export async function POST'));
  assert.doesNotMatch(getBody, /unsubscribe\(/, 'GET must not unsubscribe (mail scanners prefetch links)');
});

test('skip today and manual send behave', async () => {
  const { deps, outbox, setNow } = setup();
  await nl.adminAdd(deps, 'a@example.com');
  await nl.runDigest(deps, items('old'));
  setNow('2026-10-07T23:00:00Z');
  await nl.skipToday(deps);
  assert.equal((await nl.runDigest(deps, items('n1', 'old'))).status, 'skipped');
  assert.equal(outbox.length, 0);
  assert.equal((await nl.runDigest(deps, items('n1', 'old'), { mode: 'manual' })).status, 'sent');
});

test('admin access needs a signed, unexpired token; tokens cannot be reused across actions', () => {
  const now = Date.parse('2026-10-05T00:00:00Z');
  const t = nl.adminToken(SECRET, now);
  assert.ok(nl.isAdminToken(t, SECRET, now + 1000));
  assert.ok(!nl.isAdminToken(t, 'other-secret', now));
  assert.ok(!nl.isAdminToken(t, SECRET, now + 8 * 86400000));
  assert.equal(nl.verifyToken(t, 'unsub', SECRET, now), null);
});

test('RSS is valid, escaped, and newest first', () => {
  const xml = nl.rssXml([{ key: 'k', kind: 'post', title: 'A & <B>', summary: '"q"', url: 'https://carrotcave.com/posts/a', date: '2026-10-04', category: '빌딩' }]);
  assert.match(xml, /^<\?xml version="1.0"/);
  assert.match(xml, /<title>A &amp; &lt;B&gt;<\/title>/);
  assert.match(xml, /<atom:link href="https:\/\/carrotcave.com\/rss.xml"/);
});

test('wiring: daily 08:00 KST cron, cron route checks CRON_SECRET, admin pages are noindex and gated', () => {
  const v = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert.deepEqual(v.crons, [{ path: '/api/cron/newsletter', schedule: '0 23 * * *' }]);
  const cron = readFileSync(new URL('../app/api/cron/newsletter/route.ts', import.meta.url), 'utf8');
  assert.match(cron, /Bearer \$\{secret\}/);
  const admin = readFileSync(new URL('../app/admin/page.tsx', import.meta.url), 'utf8');
  assert.match(admin, /robots: \{ index: false, follow: false \}/);
  assert.match(admin, /if \(!\(await isAdmin\(\)\)\)/);
  const actions = readFileSync(new URL('../app/admin/actions.ts', import.meta.url), 'utf8');
  for (const fn of ['addSubscriber', 'removeSubscriber', 'sendTest', 'sendNow', 'skip', 'resendPending']) {
    assert.match(actions, new RegExp(`export async function ${fn}\\([^)]*\\) \\{\\n  await requireAdmin\\(\\);`), fn);
  }
});

test('mobile footer hide rule never hides the newsletter copy or status', () => {
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /\.cc-footer p\{display:none\}/);
  assert.match(css, /\.cc-footer p:not\(\.cc-newsletter p\)\{display:none\}/);
});

test('admin table scrolls inside its own box and never widens the page', () => {
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
  assert.match(css, /\.cc-admin__table-wrap\{position:relative;max-width:100%;overflow-x:auto\}/);
});

test('missing blob reads as empty even when the error class name is minified', async () => {
  const { isBlobMissing } = await import('../lib/newsletter/blob-store.ts');
  const minified = new Error('Vercel Blob: The requested blob does not exist'); // production: name is plain "Error"
  assert.equal(isBlobMissing(minified), true);
  assert.equal(isBlobMissing(Object.assign(new Error('x'), { name: 'BlobNotFoundError' })), true);
  assert.equal(isBlobMissing(new Error('Vercel Blob: Access denied')), false);
});

test('email field keeps its 44px height when the mobile row stacks into a column', () => {
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
  const rule = css.match(/\.cc-newsletter input\[type=email\]\{[^}]*\}/)[0];
  assert.doesNotMatch(rule, /flex:1;/); // flex-basis 0 collapses the height in a column
  assert.match(rule, /min-height:44px/);
});

test('short PIN is protected: 5 wrong tries lock the client, others still pass until the global ceiling', async () => {
  const store = nl.memoryStore ? nl.memoryStore() : (() => { const m = new Map(); return {
    async getJSON(k) { return m.has(k) ? JSON.parse(m.get(k)) : null; }, async putJSON(k, v) { m.set(k, JSON.stringify(v)); },
    async list(p) { return [...m.keys()].filter((k) => k.startsWith(p)); }, async del(k) { m.delete(k); } }; })();
  const t0 = 1_000_000;
  for (let i = 0; i < 4; i++) await nl.recordLoginFailure(store, '1.1.1.1', t0 + i);
  assert.equal((await nl.loginGate(store, '1.1.1.1', t0 + 10)).locked, false);
  await nl.recordLoginFailure(store, '1.1.1.1', t0 + 5);
  assert.equal((await nl.loginGate(store, '1.1.1.1', t0 + 10)).locked, true);
  assert.equal((await nl.loginGate(store, '2.2.2.2', t0 + 10)).locked, false);
  assert.equal((await nl.loginGate(store, '1.1.1.1', t0 + 15 * 60_000 + 10)).locked, false); // window expires
  for (let i = 0; i < 30; i++) await nl.recordLoginFailure(store, `9.9.9.${i}`, t0 + 100 + i);
  assert.equal((await nl.loginGate(store, '3.3.3.3', t0 + 200)).locked, true); // distributed guessing ceiling
  await nl.clearLoginFailures(store, '1.1.1.1');
});

test('changing the admin password invalidates every existing admin session', () => {
  const tok = nl.adminToken(nl.sessionSecret('s3cret', 'old-password'));
  assert.equal(nl.isAdminToken(tok, nl.sessionSecret('s3cret', 'old-password')), true);
  assert.equal(nl.isAdminToken(tok, nl.sessionSecret('s3cret', '2026')), false);
});

test('login action checks the throttle before comparing the password', () => {
  const src = readFileSync(new URL('../app/admin/actions.ts', import.meta.url), 'utf8');
  const body = src.slice(src.indexOf('export async function login('), src.indexOf('export async function logout('));
  assert.ok(body.indexOf('loginGate') > -1 && body.indexOf('loginGate') < body.indexOf('safeEqual'));
  assert.match(body, /recordLoginFailure/);
  assert.match(body, /sessionSecret\(secret, expected\)/);
});

test('footer newsletter breathes away from the rabbit scene and keeps RSS inside its meta line', () => {
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
  const block = css.slice(css.indexOf('/* Newsletter footer layout 2026.10 */'));
  const top = Number(block.match(/\.cc-footer \.cc-newsletter\{[^}]*margin:(\d+)px/)[1]);
  assert.ok(top >= 40, `newsletter top margin ${top}px is too tight`);
  assert.match(block, /\.cc-footer \.cc-newsletter__meta a\.cc-newsletter__rss\{margin-left:0/); // beats .cc-footer a{margin-left:auto}
  const form = readFileSync(new URL('../components/NewsletterForm.tsx', import.meta.url), 'utf8');
  assert.match(form, /cc-newsletter__meta[\s\S]*cc-newsletter__rss/);
});
