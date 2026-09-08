import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';

const base = process.env.APP_URL || 'http://127.0.0.1:3197';
const proof = process.env.PROOF_PATH || '/tmp/carrotcave-header-proof.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
const readHeader = (page) => page.evaluate(() => {
  const read = (selector, pseudo) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const css = getComputedStyle(el, pseudo);
    return { background: css.backgroundColor, image: css.backgroundImage,
      shadow: css.boxShadow, border: css.borderBottomWidth, filter: css.backdropFilter,
      display: css.display, width: css.width, rect: el.getBoundingClientRect().toJSON() };
  };
  return { header: read('.cc-header'), lower: read('.cc-header-axis-mobile'),
    rail: read('.cc-header-axis-mobile .axis-rail'),
    surface: read('.cc-header-axis-mobile', '::before'),
    overflow: document.documentElement.scrollWidth > innerWidth };
});
try {
  for (const width of [390, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base, { waitUntil: 'networkidle' });
    const initial = await readHeader(page);
    assert.equal(initial.overflow, false);
    assert.equal(initial.header.image, 'none');
    assert.equal(initial.header.background, 'rgb(34, 37, 43)');
    if (width === 390) {
      for (const layer of [initial.lower, initial.rail, initial.surface]) {
        assert.equal(layer.background, initial.header.background);
        assert.equal(layer.image, 'none');
        assert.equal(layer.border, '0px');
      }
      assert.equal(initial.header.shadow, 'none');
      assert.equal(initial.header.border, '0px');
      assert.equal(initial.lower.shadow, 'none');
      assert.equal(initial.rail.shadow, 'none');
      assert.equal(initial.surface.shadow, 'rgba(0, 0, 0, 0.22) 0px 3px 6px -3px');
      assert.equal(initial.surface.width, `${width}px`);
      assert.ok(Math.abs(initial.lower.rect.top - initial.header.rect.bottom) < 1);
    } else {
      assert.equal(initial.lower.display, 'none');
      assert.equal(initial.header.shadow, 'rgba(0, 0, 0, 0.22) 0px 4px 14px 0px');
      assert.equal(initial.header.border, '1px');
    }
    await page.evaluate(() => window.scrollTo(0, 650));
    await page.waitForTimeout(200);
    const scrolled = await readHeader(page);
    assert.ok(await page.evaluate(() => scrollY > 600));
    assert.equal(scrolled.header.rect.top, 0);
    assert.equal(scrolled.overflow, false);
    if (width === 390) assert.ok(Math.abs(scrolled.lower.rect.top - scrolled.header.rect.bottom) < 1);
    const nav = width === 390 ? '.cc-header-axis-mobile' : '.cc-header__axis--desktop';
    const links = await page.locator(`${nav} a`).evaluateAll(nodes => nodes.map(a => ({ href: a.getAttribute('href'), label: a.querySelector('b').textContent })));
    assert.equal(links.length, 6);
    for (const link of links) {
      await page.locator(`${nav} a`).filter({ has: page.locator('b', { hasText: new RegExp(`^${link.label}$`) }) }).click();
      await page.waitForURL(url => url.pathname + url.search === new URL(link.href, base).pathname + new URL(link.href, base).search);
      await page.locator(`${nav} a[aria-current="page"] b`).filter({ hasText: new RegExp(`^${link.label}$`) }).waitFor();
      assert.equal((await readHeader(page)).overflow, false);
    }
    const voices = await readHeader(page);
    if (width === 390) assert.equal(voices.header.shadow, 'none');
    await page.goto(`${base}/posts/brain-files-minecraft-flies`, { waitUntil: 'networkidle' });
    const reader = await readHeader(page);
    assert.equal(reader.lower, null);
    assert.equal(reader.header.shadow, 'rgba(0, 0, 0, 0.22) 0px 4px 14px 0px');
    assert.equal(reader.header.border, '1px');
    assert.equal(reader.overflow, false);
    assert.deepEqual(errors, []);
    results.push({ width, initial, scrolled, navigation: links, voices, reader, errors });
    writeFileSync(proof, JSON.stringify({ base, results }, null, 2));
    await page.close();
  }
} finally {
  await browser.close();
}
assert.equal(results.length, 2);
console.log(JSON.stringify({ base, passed: results.map(r => ({ width: r.width, menuLinks: r.navigation.length, sticky: true, readerPreserved: true })), proof }, null, 2));
