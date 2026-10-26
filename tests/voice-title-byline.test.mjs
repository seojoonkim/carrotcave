import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

// Review 2026-10-27 item 5: voice rows carry only the topic as the title; speakers sit on a small line below.
test('voice archive entries split the speaker line from the topic title', () => {
  for (const [file, v] of [['components/views/VoicesView.tsx', 'item'], ['components/views/HomeView.tsx', 'interview']]) {
    const src = read(file);
    assert.match(src, new RegExp(`title: ${v}\\.title,\\n\\s+byline: ${v}\\.name,`), `${file} sets title=topic, byline=speaker`);
    assert.doesNotMatch(src, new RegExp(`\\$\\{${v}\\.name\\} · \\$\\{${v}\\.title\\}`), `${file} must not glue speaker and topic into one title`);
  }
  const list = read('components/ArchiveList.tsx');
  assert.match(list, /byline\?: string;/);
  assert.equal((list.match(/className="archive-byline"/g) ?? []).length, 2, 'lead and rows both render the byline');
  assert.match(list, /\$\{entry\.byline \?\? ''\}/, 'speaker names stay searchable');
  const css = read('app/globals.css');
  assert.match(css, /\.archive-byline\{display:block;[^}]*var\(--sans\)/);
});
