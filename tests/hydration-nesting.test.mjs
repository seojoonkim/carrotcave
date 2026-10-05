// 2026-10-05: post pages threw React #418 (hydration mismatch) on live because the reading meta line was a <p>
// containing <LangToggle> (<nav>). Browsers auto-close <p> before <nav>, so server HTML ≠ client tree.
// Guard: no component may render a block element (nav/div/ul/section/header/footer) inside a <p>.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const BLOCK_COMPONENTS = ['LangToggle', 'AxisRail', 'SiteFooter', 'FooterCaveScene'];
const BLOCK_TAGS = ['nav', 'div', 'ul', 'ol', 'section', 'header', 'footer', 'article', 'figure', 'p'];

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.tsx') ? [p] : [];
  });
}

test('PostView reading meta line is not a <p> (it contains the <nav> language switch)', () => {
  const view = readFileSync('components/views/PostView.tsx', 'utf8');
  assert.doesNotMatch(view, /<p className="post-reader-meta"/);
  assert.match(view, /<div className="post-reader-meta"/);
});

test('no <p> in components/app wraps a block element or a block component', () => {
  const bad = [];
  for (const f of [...walk('components'), ...walk('app')]) {
    const s = readFileSync(f, 'utf8');
    const re = /<p(\s[^>]*)?>/g;
    let m;
    while ((m = re.exec(s))) {
      if (m[0].endsWith('/>')) continue;
      const end = s.indexOf('</p>', m.index);
      if (end < 0) continue;
      const body = s.slice(m.index + m[0].length, end);
      const hit = BLOCK_TAGS.find((t) => new RegExp(`<${t}[\\s>]`).test(body)) ||
        BLOCK_COMPONENTS.find((c) => new RegExp(`<${c}[\\s/>]`).test(body));
      if (hit) bad.push(`${f}:${s.slice(0, m.index).split('\n').length} <p> contains <${hit}>`);
    }
  }
  assert.deepEqual(bad, []);
});
