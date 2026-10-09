// Layout gate: catches the breakages Simon keeps seeing — vertical label wrap ("줄/기"),
// horizontal overflow, clipped text, overlapping siblings, and broken images — across widths.
// Usage: node scripts/verify-layout.mjs [baseUrl] [--shots dir]   (exit 1 on any failure)
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'http://localhost:3000';
const shotIdx = process.argv.indexOf('--shots');
const shotDir = shotIdx > 0 ? process.argv[shotIdx + 1] : null;
if (shotDir) fs.mkdirSync(shotDir, { recursive: true });

const pages = ['/', '/?section=%ED%83%90%ED%97%98', '/?section=%EB%B9%8C%EB%94%A9', '/?section=%EB%82%99%EC%84%9C', '/?section=%EC%86%8C%EC%84%A4', '/?section=%EB%AA%A9%EC%86%8C%EB%A6%AC', '/en', '/en?section=explore', '/en?section=fiction'];
const widths = [320, 360, 390, 430, 768, 1024, 1280, 1440];

// Elements whose text must never wrap (single-line labels, chips, meta)
const ONE_LINE = '.ccx-chip, .ccx-fl, .ccx-k, .ccx-m, .archive-meta time, .wall-heading__axis, .site-nav a, .axis-rail a';
// Containers whose direct children must not overlap each other
const NO_OVERLAP = '.ccx-threadlink, .ccx-frow, .archive-meta, .archive-row, .ccx-hubs, .site-header, .wall-heading';

const browser = await chromium.launch({ channel: 'chrome' });
const failures = [];
let checked = 0;
for (const w of widths) {
  for (const p of pages) {
    const pg = await browser.newPage({ viewport: { width: w, height: 900 } });
    try {
      const res = await pg.goto(base + p, { waitUntil: 'networkidle', timeout: 45000 });
      if (!res || res.status() >= 400) { failures.push(`${w} ${p} HTTP ${res?.status()}`); continue; }
      await pg.evaluate(() => document.fonts.ready);
      const inspect = () => pg.evaluate(({ ONE_LINE, NO_OVERLAP }) => {
        const out = [];
        const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 1 && r.height > 1 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0' && !el.closest('.sr-only, [aria-hidden="true"]'); };
        const name = (el) => (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : el.tagName.toLowerCase()) + ` "${(el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 24)}"`;
        const docW = document.documentElement.clientWidth;
        // 1) page-level horizontal overflow
        if (document.documentElement.scrollWidth > docW + 1) out.push(`page overflow-x ${document.documentElement.scrollWidth}>${docW}`);
        // 2) elements poking out of the viewport (skip scroll containers' children)
        for (const el of document.querySelectorAll('body *')) {
          if (!vis(el) || el.closest('svg') !== el && el.closest('svg')) continue;
          const r = el.getBoundingClientRect();
          if (r.right > docW + 1 || r.left < -1) {
            let a = el.parentElement, scrolled = false;
            while (a) { const o = getComputedStyle(a).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') { scrolled = true; break; } a = a.parentElement; }
            if (!scrolled && getComputedStyle(el).position !== 'fixed') out.push(`out-of-viewport ${name(el)} [${Math.round(r.left)},${Math.round(r.right)}]`);
          }
        }
        // 3) single-line labels wrapped (e.g. "줄/기"): a single text node rendered on 2+ lines
        const linesOf = (node, fs) => {
          const rg = document.createRange(); rg.selectNodeContents(node);
          const tops = [...rg.getClientRects()].filter((q) => q.width > 0).map((q) => q.top).sort((a, b) => a - b);
          let n = 0, last = -Infinity;
          for (const t of tops) { if (t - last > fs * 0.6) n++; last = t; }
          return n;
        };
        for (const el of document.querySelectorAll(ONE_LINE)) {
          if (!vis(el)) continue;
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            if (!node.textContent.trim() || !node.parentElement || !vis(node.parentElement)) continue;
            const fs = parseFloat(getComputedStyle(node.parentElement).fontSize) || 14;
            const n = linesOf(node, fs);
            if (n > 1) { out.push(`wrapped ${name(el)} "${node.textContent.trim().slice(0, 16)}" lines=${n}`); break; }
          }
        }
        // 4) clipped text: content wider than box with hidden overflow and no ellipsis
        for (const el of document.querySelectorAll('h1,h2,h3,b,a,span,p,time')) {
          if (!vis(el)) continue;
          const cs = getComputedStyle(el);
          if ((cs.overflow === 'hidden' || cs.overflowX === 'hidden') && cs.textOverflow !== 'ellipsis' && !cs.webkitLineClamp?.match(/\d/) && el.scrollWidth > el.clientWidth + 2) out.push(`clipped ${name(el)}`);
        }
        // 5) overlapping siblings
        for (const box of document.querySelectorAll(NO_OVERLAP)) {
          if (!vis(box)) continue;
          const kids = [...box.children].filter(vis).filter((k) => !['absolute', 'fixed'].includes(getComputedStyle(k).position));
          for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) {
            const a = kids[i].getBoundingClientRect(), b = kids[j].getBoundingClientRect();
            const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left), oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            if (ox > 2 && oy > 2) out.push(`overlap ${name(kids[i])} × ${name(kids[j])}`);
          }
        }
        // 6) broken images in view of the first screens
        for (const img of document.querySelectorAll('img')) {
          if (img.complete && img.naturalWidth === 0 && img.loading !== 'lazy' && vis(img)) out.push(`broken img ${img.src.slice(-40)}`);
        }
        // 7) hidden chips: a child pushed outside its row with no visible scroll hint (fade mask)
        for (const row of document.querySelectorAll('.ccx-frow, .axis-rail__inner')) {
          if (!vis(row)) continue;
          const rb = row.getBoundingClientRect();
          const cs = getComputedStyle(row);
          const mask = cs.maskImage || cs.webkitMaskImage || 'none';
          if (mask !== 'none') continue;
          for (const c of row.children) {
            if (!vis(c)) continue;
            const q = c.getBoundingClientRect();
            if (q.right > rb.right + 1 || q.left < rb.left - 1) out.push(`hidden-child ${name(row)} -> ${name(c)}`);
          }
        }
        // 8) cramped spacing: text vs thumbnail, filter row vs list, search vs filters
        const mobile = innerWidth < 900;
        const MIN_TEXT_THUMB = mobile ? 20 : 40;
        for (const link of [...document.querySelectorAll('.archive-row__link, .archive-lead')].slice(0, 6)) {
          if (!vis(link)) continue;
          const thumb = link.querySelector('.archive-thumb');
          if (!thumb || !vis(thumb)) continue;
          const tb = thumb.getBoundingClientRect();
          for (const t of link.querySelectorAll('h2, .archive-row__summary, .archive-lead__summary, .archive-meta')) {
            if (!vis(t)) continue;
            const r = t.getBoundingClientRect();
            if (r.bottom <= tb.top || r.top >= tb.bottom) continue; // not side by side
            const gap = r.right <= tb.left ? tb.left - r.right : r.left >= tb.right ? r.left - tb.right : -1;
            if (gap < MIN_TEXT_THUMB) { out.push(`cramped text-thumb ${Math.round(gap)}<${MIN_TEXT_THUMB} ${name(t)}`); break; }
          }
        }
        const firstBelow = (anchorSel, sel) => {
          const A = document.querySelector(anchorSel); if (!A || !vis(A)) return null;
          const ab = A.getBoundingClientRect().bottom;
          return [...document.querySelectorAll(sel)].find((e) => vis(e) && e.getBoundingClientRect().top >= ab - 40) || null;
        };
        const V = (a, b, min, label) => {
          const A = document.querySelector(a), B = firstBelow(a, b);
          if (!A || !B || !vis(A)) return;
          const g = B.getBoundingClientRect().top - A.getBoundingClientRect().bottom;
          if (g < min) out.push(`cramped ${label} ${Math.round(g)}<${min}`);
        };
        V('.archive-search', '.ccx-filters', 12, 'search-filters');
        V('.ccx-filters', '.archive-row, .archive-lead', mobile ? 16 : 20, 'filters-list');
        // 10) a label sitting right above a boxed control (search field) needs breathing room
        for (const box of document.querySelectorAll('.archive-search')) {
          if (!vis(box)) continue;
          const bt = box.getBoundingClientRect().top;
          let best = null;
          for (const t of document.querySelectorAll('.ccx-k, .wall-heading, h1, h2, h3, p')) {
            if (!vis(t) || box.contains(t) || t.contains(box)) continue;
            const r = t.getBoundingClientRect();
            if (r.bottom <= bt + 1 && r.right > box.getBoundingClientRect().left && (!best || r.bottom > best.r.bottom)) best = { t, r };
          }
          if (best && bt - best.r.bottom < 12) out.push(`label-hugs-box ${name(best.t)} / .archive-search ${Math.round(bt - best.r.bottom)}px`);
        }
        // 9) archive stack (search / filters / status / list) must never overlap each other
        const stack = ['.archive-search', '.ccx-filters', '.archive-status', '.archive-list']
          .map((sel) => document.querySelector(sel)).filter((el) => el && vis(el));
        for (let i = 0; i < stack.length; i++) {
          for (let j = i + 1; j < stack.length; j++) {
            const a = stack[i].getBoundingClientRect(), b = stack[j].getBoundingClientRect();
            if (b.top < a.bottom - 1) out.push(`stack-overlap ${name(stack[i])} / ${name(stack[j])} ${Math.round(a.bottom - b.top)}px`);
          }
        }
        // label touching first chip
        for (const fl of document.querySelectorAll('.ccx-fl')) {
          const nx = fl.nextElementSibling; if (!nx || !vis(fl) || !vis(nx)) continue;
          const g = nx.getBoundingClientRect().left - fl.getBoundingClientRect().right;
          if (g >= 0 && g < 8) out.push(`cramped label-chip ${Math.round(g)}<8`);
        }
        return [...new Set(out)].slice(0, 12);
      }, { ONE_LINE, NO_OVERLAP });
      const issues = (await inspect()).map((i) => `[base] ${i}`);
      // State 2: a thread filter picked (status line "N편을 골랐어요." appears)
      const chips = pg.locator('.ccx-frow .ccx-chip');
      if (await chips.count() > 1) {
        await chips.nth((await chips.count()) - 1).click();
        await pg.waitForTimeout(250);
        for (const i of await inspect()) issues.push(`[filtered] ${i}`);
        await chips.first().click();
        await pg.waitForTimeout(150);
      }
      // State 3: a search typed (status line "N개 찾았어요" appears)
      const input = pg.locator('.archive-search__input');
      if (await input.count()) {
        await input.first().fill('AI');
        await pg.waitForTimeout(350);
        for (const i of await inspect()) issues.push(`[search] ${i}`);
        await input.first().fill('');
      }
      checked++;
      for (const i of [...new Set(issues)]) failures.push(`${w} ${p} ${i}`);
      if (shotDir && [390, 1280].includes(w)) {
        const f = path.join(shotDir, `${w}-${p.replace(/[^a-z0-9]+/gi, '_') || 'home'}.png`);
        await pg.screenshot({ path: f, fullPage: false, clip: undefined });
        await pg.evaluate(() => { const el = document.querySelector('.ccx-sec, .ccx-catgrid'); el?.scrollIntoView({ block: 'start' }); });
        await pg.waitForTimeout(200);
        await pg.screenshot({ path: f.replace('.png', '-mid.png') });
        await pg.evaluate(() => { const el = document.querySelector('.ccx-frow'); el?.scrollIntoView({ block: 'center' }); });
        await pg.waitForTimeout(200);
        await pg.screenshot({ path: f.replace('.png', '-list.png') });
      }
    } catch (e) {
      failures.push(`${w} ${p} ERROR ${e.message.split('\n')[0]}`);
    } finally {
      await pg.close();
    }
  }
}
await browser.close();
console.log(JSON.stringify({ checked, failures: failures.length }));
for (const f of failures) console.log('FAIL', f);
process.exit(failures.length ? 1 : 0);
