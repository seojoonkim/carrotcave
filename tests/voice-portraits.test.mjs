import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

test('Shin Jeongkyu voice uses the 4:3 portrait for the list thumbnail and the page hero', async () => {
  const data = await readFile(new URL('../data/interviews.ts', import.meta.url), 'utf8');
  const entry = data.slice(data.indexOf("slug: 'shin-jeongkyu-astra'"), data.indexOf("status: 'published'", data.indexOf("slug: 'shin-jeongkyu-astra'")));
  assert.match(entry, /thumbnailUrl: '\/voices\/shin-jeongkyu-astra\/shin-jeongkyu\.jpg'/);
  const html = await readFile(new URL('../public/voices/shin-jeongkyu-astra/index.html', import.meta.url), 'utf8');
  assert.match(html, /<p class="kicker">목소리<\/p><figure class="hero-portrait"><img src="shin-jeongkyu\.jpg" alt="[^"]+" width="1200" height="900"/);
  const meta = await sharp(new URL('../public/voices/shin-jeongkyu-astra/shin-jeongkyu.jpg', import.meta.url).pathname).metadata();
  assert.equal(meta.width * 3, meta.height * 4, 'portrait must be exactly 4:3');
});
