const DEFAULT_UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36', 'Accept-Language': 'ko,en;q=0.8' };

// Some sites (e.g. vaneck.com) answer with a cookie-check 302 loop: undici's
// redirect:'follow' never stores Set-Cookie, so it fails with "redirect count
// exceeded" (TypeError). Follow redirects by hand and carry cookies forward.
export async function fetchWithCookies(url, { fetchImpl = fetch, maxRedirects = 8, timeoutMs = 15000, headers = DEFAULT_UA } = {}) {
  const jar = new Map();
  let current = url;
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
    const r = await fetchImpl(current, { headers: cookie ? { ...headers, cookie } : headers, redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) });
    const setCookies = typeof r.headers.getSetCookie === 'function' ? r.headers.getSetCookie() : [];
    for (const c of setCookies) {
      const pair = c.split(';')[0];
      const eq = pair.indexOf('=');
      if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
    const location = r.headers.get('location');
    if (r.status >= 300 && r.status < 400 && location) { current = new URL(location, current).href; continue; }
    return r;
  }
  throw new TypeError(`redirect count exceeded for ${url}`);
}


// Named and numeric (&#39; / &#xA0;) entities; whitespace collapsed.
export const decodeEntities = (s) => s
  ?.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&hellip;/g, '\u2026')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').trim();
