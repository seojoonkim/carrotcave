import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../components/views/PostView.tsx', import.meta.url), 'utf8');
const gallery = await readFile(new URL('../components/PostGallery.tsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');

test('posts with 2+ images use the gallery, not a grid', () => {
  assert.match(page, /post\.mediaUrls\.length > 1 \? \(\s*<PostGallery urls=\{post\.mediaUrls\} locale=\{locale\} \/>/);
  assert.doesNotMatch(page, /post\.mediaUrls\.map\(/, 'no multi-image grid on the post page');
});

test('gallery: one large swipeable slide + clickable thumbnails', () => {
  assert.match(css, /\.post-gallery-track\{[^}]*scroll-snap-type:x mandatory/);
  assert.match(css, /\.post-gallery-slide\{[^}]*flex:0 0 100%[^}]*scroll-snap-align:center/);
  assert.match(css, /\.post-gallery-slide img\{[^}]*object-fit:contain/, 'large image is never cropped');
  assert.match(gallery, /className="post-gallery-thumb"[\s\S]*onClick=\{\(\) => goTo\(i\)\}/);
  assert.match(gallery, /aria-selected=\{i === active\}/);
  assert.match(gallery, /ArrowRight[\s\S]*ArrowLeft/);
  assert.match(gallery, /prefers-reduced-motion/);
});
