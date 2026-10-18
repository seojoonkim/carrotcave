import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { decodeEntities, fetchWithCookies } from '../scripts/lib/fetch-with-cookies.mjs';

// Reproduces the vaneck.com cookie-check redirect loop that left
// data/link-previews.json with {status:"TypeError"} and blocked release (2026-10-18).
function cookieGateServer() {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url, cookie: init.headers.cookie ?? '' , redirect: init.redirect });
    const hasCookie = /gate=ok/.test(init.headers.cookie ?? '');
    if (!hasCookie) return new Response(null, { status: 302, headers: { location: '/post/?cken=true', 'set-cookie': 'gate=ok; Path=/; Secure' } });
    return new Response('<meta property="og:title" content="Real Title">', { status: 200 });
  };
  return { impl, calls };
}

test('cookie-gated redirect resolves instead of looping', async () => {
  const { impl, calls } = cookieGateServer();
  const r = await fetchWithCookies('https://example.test/post/', { fetchImpl: impl });
  assert.equal(r.status, 200);
  assert.match(await r.text(), /Real Title/);
  assert.equal(calls[0].redirect, 'manual');
  assert.match(calls.at(-1).cookie, /gate=ok/);
});

test('a real redirect loop still fails with a bounded error', async () => {
  const impl = async () => new Response(null, { status: 302, headers: { location: '/again' } });
  await assert.rejects(fetchWithCookies('https://example.test/', { fetchImpl: impl, maxRedirects: 3 }), /redirect count exceeded/);
});

test('preview collector retries stored fetch failures and uses the cookie-aware fetch', () => {
  const src = readFileSync(new URL('../scripts/update-link-previews.mjs', import.meta.url), 'utf8');
  assert.match(src, /fetchWithCookies\(url\)/);
  assert.doesNotMatch(src, /redirect: 'follow'/);
  assert.match(src, /previews\[url\]\.status && !previews\[url\]\.title/);
});

test('numeric HTML entities in og:title are decoded', () => {
  assert.equal(decodeEntities('A Potential Valuation Methodology for Ethereum |&#xA0;VanEck'), 'A Potential Valuation Methodology for Ethereum | VanEck');
  assert.equal(decodeEntities('Ethereum&#x2019;s &amp; T-bills &#39;x&#39;'), 'Ethereum\u2019s & T-bills \'x\'');
});

test('stored link previews contain no undecoded HTML entities', () => {
  const previews = JSON.parse(readFileSync(new URL('../data/link-previews.json', import.meta.url), 'utf8'));
  const bad = Object.entries(previews).filter(([, p]) => /&#x?[0-9a-f]+;|&(?:amp|quot|hellip|nbsp);/i.test(`${p.title ?? ''} ${p.description ?? ''} ${p.siteName ?? ''}`)).map(([u]) => u);
  assert.deepEqual(bad, []);
});
