import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { transformSync } from 'next/dist/build/swc/index.js';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../components/EditorialCard.tsx', import.meta.url), 'utf8');
const { code } = transformSync(source, {
  filename: 'EditorialCard.tsx',
  isModule: true,
  jsc: {
    parser: { syntax: 'typescript', tsx: true },
    transform: { react: { runtime: 'classic' } },
    target: 'es2020',
  },
  module: { type: 'commonjs' },
});

const module = { exports: {} };
const localRequire = (id) => {
  if (id === 'next/link') return ({ children, ...props }) => React.createElement('a', props, children);
  if (id === 'next/image') return ({ priority, width, height, sizes, ...props }) => React.createElement('img', props);
  return require(id);
};
vm.runInNewContext(code, { module, exports: module.exports, require: localRequire, React }, { filename: 'EditorialCard.js' });
const EditorialCard = module.exports.default;

const render = (props) => renderToStaticMarkup(React.createElement(EditorialCard, {
  href: '/entry',
  date: '2025-08-27',
  axis: '목소리',
  title: '양즈린 · 무한의 시작에 서서',
  summary: 'Moonshot AI와 Kimi 창업자의 대화 앞부분입니다.',
  imageUrl: '/portrait.jpg',
  className: 'wall-card--voice',
  ...props,
}));

test('EditorialCard renders the complete shared visual and semantic contract', () => {
  const html = render({});
  assert.match(html, /class="wall-card wall-card--with-image wall-card--voice"/);
  assert.match(html, /data-axis="목소리"/);
  assert.match(html, /<time class="wall-card__date" dateTime="2025-08-27">/);
  assert.match(html, /<span class="wall-card__axis">목소리<\/span>/);
  assert.match(html, /<h2>양즈린 · 무한의 시작에 서서<\/h2>/);
  assert.match(html, /<p class="wall-card__abstract">Moonshot AI와 Kimi 창업자의 대화 앞부분입니다.<\/p>/);
  assert.match(html, /<img class="wall-card__image"[^>]*src="\/portrait.jpg"/);
  assert.doesNotMatch(html, /wall-card__eyebrow|wall-card__door|ENTER|OPEN FIELD NOTE/);
});

test('EditorialCard groups title and summary for the shared mobile bottom row', () => {
  const html = render({});
  assert.match(html, /<div class="wall-card__copy"><h2>양즈린 · 무한의 시작에 서서<\/h2><p class="wall-card__abstract">/);

  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
  assert.match(css, /@media\(max-width:520px\)\{\.editorial-wall \.wall-card__copy\{display:grid;grid-template-columns:minmax\(0,8fr\) minmax\(0,5fr\);align-items:end/);
  assert.match(css, /\.editorial-wall \.wall-card__copy>\*\{min-width:0\}/);
  assert.match(css, /\.editorial-wall \.wall-card__copy \.wall-card__abstract\{margin:0 0 0 8px/);
});

test('EditorialCard omits only optional content and keeps the base contract', () => {
  const html = render({ summary: undefined, imageUrl: undefined, className: '' });
  assert.match(html, /class="wall-card"/);
  assert.doesNotMatch(html, /wall-card__eyebrow|wall-card__door|<p>|<img/);
  assert.match(html, /<time class="wall-card__date"/);
  assert.match(html, /<h2>/);
});
