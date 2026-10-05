// Rasterizes brand v4 SVGs: favicon.ico (16/32/48), favicon-192.png, apple-touch-icon.png, app/apple-icon.png, app/favicon.ico,
// and copies the rendered home share card to the fixed static OG files. Run after build_brand.py and og-preview.mjs (OUT=/tmp/cc-og).
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
const R = new URL('../../', import.meta.url).pathname;
const fav = readFileSync(R + 'public/favicon.svg', 'utf8');
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage();
const png = async (size) => {
  await p.setViewportSize({ width: size, height: size });
  await p.setContent(`<html><body style="margin:0;background:transparent">${fav.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  return p.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
};
// apple icons must be opaque full-bleed squares (iOS rounds them itself)
const opaque = async (size) => {
  await p.setViewportSize({ width: size, height: size });
  const full = fav.replace('rx="14"', 'rx="0"').replace('<svg ', `<svg width="${size}" height="${size}" `);
  await p.setContent(`<html><body style="margin:0;background:#1E1F28">${full}</body></html>`);
  return p.screenshot({ clip: { x: 0, y: 0, width: size, height: size } });
};
writeFileSync(R + 'public/favicon-192.png', await png(192));
const apple = await opaque(180);
writeFileSync(R + 'public/apple-touch-icon.png', apple);
writeFileSync(R + 'app/apple-icon.png', apple);
// ICO with embedded PNGs
const sizes = [16, 32, 48];
const imgs = [];
for (const s of sizes) imgs.push(await png(s));
const head = Buffer.alloc(6 + 16 * sizes.length);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
let off = head.length;
sizes.forEach((s, i) => {
  const o = 6 + 16 * i;
  head.writeUInt8(s, o); head.writeUInt8(s, o + 1); head.writeUInt8(0, o + 2); head.writeUInt8(0, o + 3);
  head.writeUInt16LE(1, o + 4); head.writeUInt16LE(32, o + 6);
  head.writeUInt32LE(imgs[i].length, o + 8); head.writeUInt32LE(off, o + 12);
  off += imgs[i].length;
});
const ico = Buffer.concat([head, ...imgs]);
writeFileSync(R + 'public/favicon.ico', ico);
writeFileSync(R + 'app/favicon.ico', ico);
await b.close();
const og = (process.env.OUT || '/tmp/cc-og') + '/og-home.png';
if (existsSync(og)) {
  copyFileSync(og, R + 'public/carrotcave-og-20260814.png');
  copyFileSync(og, R + 'public/opengraph-image.png');
}
console.log('raster ok', existsSync(og) ? '+ static og' : '(no og-home.png; static og untouched)');
