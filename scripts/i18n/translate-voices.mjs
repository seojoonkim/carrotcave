#!/usr/bin/env node
// Translate the voice archive's list metadata (name, title, summary) → data/en/voices.json.
// The voice readers themselves (public/voices/*) stay Korean; English pages say so.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { interviews } from '../../data/interviews.ts';

const root = new URL('../../', import.meta.url).pathname;
const file = join(root, 'data/en/voices.json');
const current = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
const hash = (v) => createHash('sha256').update(JSON.stringify([v.name, v.title, v.summary])).digest('hex').slice(0, 16);

async function llm(prompt) {
  const base = process.env.CC_LLM_BASE_URL, key = process.env.CC_LLM_API_KEY, model = process.env.CC_LLM_MODEL || 'gpt-6-astra';
  if (!base || !key) throw new Error('CC_LLM_BASE_URL / CC_LLM_API_KEY not set');
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } }),
  });
  if (!res.ok) throw new Error(`http ${res.status}`);
  return (await res.json()).choices?.[0]?.message?.content ?? '';
}

const todo = interviews.filter((v) => current[v.slug]?.sourceHash !== hash(v));
if (todo.length) {
  const src = todo.map((v) => ({ slug: v.slug, name: v.name, nameEn: v.nameEn, title: v.title, summary: v.summary }));
  const text = await llm(`Translate these Korean archive entries (talks/interviews re-read on carrotcave.com) into natural English.
For each: "name" = the person's standard English name (use nameEn when given), "title" = a short English title, "summary" = one plain English sentence. No hype.
Return ONLY JSON: {"items":[{"slug":"...","name":"...","title":"...","summary":"..."}]}
${JSON.stringify(src)}`);
  const items = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```\s*$/g, '')).items;
  for (const it of items) {
    const v = interviews.find((x) => x.slug === it.slug);
    if (!v || /[\uac00-\ud7a3]/.test(it.name + it.title + it.summary)) throw new Error(`bad item ${it.slug}`);
    current[v.slug] = { name: it.name, title: it.title, summary: it.summary, sourceHash: hash(v) };
  }
}
const missing = interviews.filter((v) => !current[v.slug]).map((v) => v.slug);
writeFileSync(file, JSON.stringify(current, null, 2) + '\n');
console.log(`voices: ${Object.keys(current).length}/${interviews.length} translated${missing.length ? `, missing ${missing.join(',')}` : ''}`);
if (missing.length) process.exit(1);
