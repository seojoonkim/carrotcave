import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../components/views/PostView.tsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');

test('review item 6: post images follow the two opening paragraphs, not the title', () => {
  assert.match(page, /const LEAD_PARAGRAPHS = 2;/);
  assert.match(page, /placeLeadMedia\(renderedContent, imageMedia\)/);
  assert.match(page, /className="post-lead-media"/);
  assert.match(page, /\{imageMedia && !leadMediaPlaced && imageMedia\}/, 'posts that open without prose keep images on top');
  assert.match(page, /node\.type === 'p' && !\(node\.props as \{ className\?: string \}\)\.className/, 'dialogue turns and cards never count as lead paragraphs');
  assert.match(css, /\.post-lead-media\{[^}]*min-width:0/);
});
