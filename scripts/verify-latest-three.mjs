import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { transformSync } from 'next/dist/build/swc/index.js';
import { chromium } from 'playwright-core';

const base = process.env.APP_URL;
const output = process.env.PROOF_PATH || 'docs/eval/latest-three-source.json';
const hash = value => createHash('sha256').update(value).digest('hex');
const norm = value => value.replace(/\s+/g, ' ').trim();
const { code } = transformSync(readFileSync('data/posts.ts', 'utf8'), { filename: 'posts.ts', jsc: { parser: { syntax: 'typescript' }, target: 'es2020' }, module: { type: 'commonjs' } });
const module = { exports: {} };
vm.runInNewContext(code, { module, exports: module.exports });
const posts = module.exports.posts;
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
try {
  const page = await browser.newPage();
  await page.goto('https://t.me/s/carrotcave', { waitUntil: 'domcontentloaded' });
  const messages = await page.locator('.tgme_widget_message[data-post]').evaluateAll(nodes => nodes.map(node => ({
    id: Number(node.dataset.post.split('/')[1]),
    text: node.querySelector('.tgme_widget_message_text')?.innerText || '',
    datetime: node.querySelector('time[datetime]')?.dateTime,
  })).filter(message => message.text.trim()));
  const latest = messages.sort((a, b) => b.id - a.id).slice(0, 3);
  assert.equal(new Set(latest.map(x => x.id)).size, 3);
  const proof = { checkedAt: new Date().toISOString(), source: 'https://t.me/s/carrotcave', base: base || null, items: [], viewports: [] };
  for (const message of latest) {
    const post = posts.find(p => p.telegramMsgId === message.id);
    assert.ok(post, `Missing local #${message.id}`);
    const lines = message.text.trim().split('\n');
    const title = lines.shift().trim();
    const content = lines.join('\n').trim();
    assert.equal(title, post.title, `Source title mapping #${message.id}`);
    assert.equal(post.telegramMsgId, message.id, `Local ID mapping #${message.id}`);
    assert.equal(norm(content), norm(post.content), `Source body #${message.id}`);
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(message.datetime));
    assert.equal(date, post.date, `Source date #${message.id}`);
    proof.items.push({ id: message.id, title, slug: post.slug, date, sourceDatetime: message.datetime, sourceUrl: `https://t.me/carrotcave/${message.id}`, bodySha256Normalized: hash(norm(content)), status: base ? 'live-verified' : 'source-local-match', media: post.mediaUrls || [] });
  }
  if (base) {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base, { waitUntil: 'networkidle' });
      for (const item of proof.items) assert.equal(await page.locator(`a[href="/posts/${item.slug}"]`).count(), 1);
      assert.equal(await page.locator('.wall-card__date-part').count(), 0);
      assert.equal(await page.locator('.wall-heading').innerText().then(t => /ENTRIES|THE CAVE WALL/.test(t)), false);
      assert.equal(await page.locator('.footer-rabbit-carrot').getAttribute('src'), '/footer-rabbit-carrot-v2.svg');
      await page.locator(`a[href="/posts/${proof.items[0].slug}"]`).click();
      await page.waitForURL(`**/posts/${proof.items[0].slug}`);
      const pages = [];
      for (const item of proof.items) {
        const response = await page.goto(`${base}/posts/${item.slug}`, { waitUntil: 'networkidle' });
        assert.equal(response.status(), 200);
        assert.equal(await page.locator('article h1').innerText(), item.title);
        const post = posts.find(p => p.slug === item.slug);
        const body = norm(await page.locator('.post-content').innerText());
        // Plain URLs may render as rich embeds: verify every prose paragraph independently.
        const paragraphs = post.content.split(/\n\s*\n/).map(norm).filter(p => p && !/^https?:\/\/\S+$/.test(p));
        for (const paragraph of paragraphs) assert.ok(body.includes(paragraph), `Missing prose #${item.id}: ${paragraph.slice(0, 70)}`);
        assert.equal(await page.locator(`a[href="${item.sourceUrl}"]`).count(), 1);
        const images = await page.locator('.post-media-grid img').evaluateAll(nodes => nodes.map(n => ({ src: n.getAttribute('src'), loaded: n.complete && n.naturalWidth > 0 })));
        assert.ok(images.every(x => x.loaded));
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
        assert.equal(overflow, false);
        pages.push({ id: item.id, status: response.status(), proseParagraphsVerified: paragraphs.length, bodySha256: hash(body), images, overflow });
      }
      proof.viewports.push({ width, pages });
    }
    assert.deepEqual(errors, []);
    proof.pageErrors = errors;
    proof.assets = [];
    for (const path of [...new Set(proof.items.flatMap(x => x.media)), '/footer-rabbit-carrot-v2.svg']) {
      const response = await page.request.get(`${base}${path}`);
      assert.equal(response.status(), 200);
      const bytes = await response.body();
      assert.equal(hash(bytes), hash(readFileSync(`public${path}`)), `Asset bytes ${path}`);
      proof.assets.push({ path, status: 200, sha256: hash(bytes), bytes: bytes.length });
    }
  }
  mkdirSync('docs/eval', { recursive: true });
  writeFileSync(output, JSON.stringify(proof, null, 2) + '\n');
  console.log(JSON.stringify(proof, null, 2));
} finally { await browser.close(); }
