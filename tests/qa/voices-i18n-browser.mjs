// Temp QA: all 8 voices — English page fully English, KO/EN switch on the date line, key sentences, reading end.
import { chromium, webkit } from 'playwright-core';
const base = process.env.BASE || 'http://localhost:3331';
const slugs = ['mark-zuckerberg-muse', 'shin-jeongkyu-astra', 'masayoshi-son-asi-economy', 'tibo-ai-wave', 'sam-altman-startup-school-2026', 'liao-heng', 'liang-wenfeng', 'yang-zhilin'];
let bad = 0;
await Promise.all([['chrome', chromium, { channel: 'chrome' }], ['webkit', webkit, {}]].map(async ([name, type, opt]) => {
  const b = await type.launch(opt);
  await Promise.all([390, 1280].map(async (w) => {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 100)));
    for (const slug of slugs) for (const lang of ['en', 'ko']) {
      const url = (lang === 'en' ? '/en/voices/' : '/voices/') + slug;
      const t0 = Date.now(); await p.goto(base + url, { waitUntil: 'load', timeout: 20000 });
      const f = p.frames().find((x) => x !== p.mainFrame() && x.url().includes('/voices/'));
      if (!f) { console.log(name, w, url, 'NOFRAME'); bad++; continue; }
      await f.waitForFunction(() => { const t = document.getElementById('transcript'); return !t || t.getAttribute('aria-busy') === 'false'; }, null, { timeout: 15000 }).catch(() => {});
      await f.evaluate(() => scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(700);
      const r = await f.evaluate(() => {
        const line = document.querySelector('.hero > .hero-date'); const t = line?.querySelector('.cc-lang');
        const tr = t?.getBoundingClientRect(), xr = line?.querySelector('.hero-date__text')?.getBoundingClientRect(), lr = line?.getBoundingClientRect();
        const hangul = (document.body.innerText.match(/[^\n]*[가-힣][^\n]*/g) || []).filter((l) => !/^(KO )?한국어$/.test(l.trim())).length;
        return { file: location.pathname.split('/').pop(), toggle: !!t, cur: t?.querySelector('[aria-current="true"]')?.textContent.slice(0, 2),
          sameRow: tr && xr ? tr.top < xr.bottom && tr.bottom > xr.top : false, rightGap: tr ? Math.round(lr.right - tr.right) : null,
          keys: document.querySelectorAll('mark.key-sentence, .key-sentence').length, hangul,
          end: !!document.querySelector('.cc-reading-end'), err: !!document.getElementById('transcriptError') && !document.getElementById('transcriptError').hidden,
          ovf: document.documentElement.scrollWidth > innerWidth + 1 };
      });
      const ok = r.toggle && r.sameRow && r.rightGap === 0 && r.cur === lang.toUpperCase() && r.keys >= 10 && r.end && !r.err && !r.ovf && (lang === 'ko' || r.hangul === 0) && (lang === 'ko' || r.file === 'index.en.html');
      if (!ok) { bad++; console.log('BAD', name, w, url, JSON.stringify(r)); }
      else console.log('ok', name, w, url, 'keys', r.keys, (Date.now() - t0) + 'ms');
    }
    if (errs.length) { bad++; console.log('errors', name, w, errs.slice(0, 3)); }
    await p.close();
  }));
  await b.close();
}));
console.log('BAD_TOTAL', bad);
