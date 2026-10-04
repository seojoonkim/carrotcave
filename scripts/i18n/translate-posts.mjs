#!/usr/bin/env node
// Translate CarrotCave posts to English with an OpenAI-compatible LLM endpoint.
// Output: data/en/posts/<slug>.json  {slug,title,summary,content,sourceHash,model,translatedAt}
// Re-runs skip posts whose source hash is unchanged. Usage:
//   node scripts/i18n/translate-posts.mjs [--only slug,slug] [--limit N] [--concurrency 4]
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { posts } from '../../data/posts.ts';

const root = new URL('../../', import.meta.url).pathname;
const outDir = join(root, 'data/en/posts');
mkdirSync(outDir, { recursive: true });
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const only = opt('--only', '')?.split(',').filter(Boolean);
const limit = Number(opt('--limit', '0'));
const conc = Number(opt('--concurrency', '4'));
const TITLES_EN = JSON.parse(readFileSync(join(root, 'data/post-titles-en.json'), 'utf8'));
const glossaryPath = join(root, 'scripts/i18n/glossary.md');
const glossary = existsSync(glossaryPath) ? readFileSync(glossaryPath, 'utf8') : '';

export const sourceHash = (p) => createHash('sha256').update(JSON.stringify([p.title, p.summary, p.content])).digest('hex').slice(0, 16);

const PROMPT = (p) => `You are translating a Korean essay from CarrotCave (carrotcave.com), the personal writing archive of Simon Kim (김서준), a Korean venture investor and builder, into natural, publishable English.

Voice: keep Simon's voice — plain, warm, concrete, thoughtful; short clear sentences; no corporate tone, no added hype, no added explanations. It should read as if Simon wrote it in English. Do not summarize or omit anything; do not add anything.

Hard rules for "content":
- Keep the exact paragraph/line structure: same number of lines, same blank lines, same order. Translate line by line.
- Copy every URL exactly, unchanged, in the same place. A line that is only a URL stays exactly that URL. In "label URL" or "label: URL" lines translate only the label.
- Keep markdown/markup characters (#, -, *, >, numbered lists, [text](url), backticks, emojis, 〈〉 titles → use italics-free plain English titles) intact.
- Speaker labels in transcripts: "김서준:" → "Simon Kim:"; other Korean names → standard English romanization (family name last, e.g. 정병기 → Byung-ki Chung if commonly known, else romanize).
- Korean company/product names: use their official English names (모드하우스 → MODHAUS, 해시드 → Hashed, 트리플에스 → tripleS).
- Dates in English (2026년 9월 28일 → September 28, 2026).
- When the Korean gives an original-language name in parentheses (트리플에스(tripleS)), write the name once (tripleS) — never "tripleS (tripleS)".
${glossary ? `\nGlossary (follow exactly):\n${glossary}\n` : ''}
${TITLES_EN[p.slug] ? `Use exactly this English title (already published on share cards): ${JSON.stringify(TITLES_EN[p.slug])}\n` : ''}
Return ONLY a JSON object, no code fences, no commentary:
{"title": "...", "summary": "...", "content": "..."}

Source:
${JSON.stringify({ title: p.title, summary: p.summary, content: p.content })}`;

// LLM endpoint: OpenAI-compatible chat completions. Credentials come from env only
// (CC_LLM_BASE_URL, CC_LLM_API_KEY, CC_LLM_MODEL) — never from the repo.
async function runClaude(prompt) {
  const base = process.env.CC_LLM_BASE_URL, key = process.env.CC_LLM_API_KEY, model = process.env.CC_LLM_MODEL || 'gpt-6-astra';
  if (!base || !key) throw new Error('CC_LLM_BASE_URL / CC_LLM_API_KEY not set');
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 10 * 60 * 1000);
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST', signal: ctrl.signal,
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } }),
    });
    if (!res.ok) throw new Error(`http ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const j = await res.json();
    return { text: j.choices?.[0]?.message?.content ?? '', model: j.model ?? model };
  } finally { clearTimeout(timer); }
}

export function validate(p, t) {
  const problems = [];
  for (const k of ['title', 'summary', 'content']) if (typeof t[k] !== 'string' || !t[k].trim()) problems.push(`missing ${k}`);
  if (problems.length) return problems;
  const urls = (s) => (s.match(/https?:\/\/[^\s)\]>"']+/g) ?? []).sort();
  const a = urls(p.content), b = urls(t.content);
  const missing = a.filter((u) => !b.includes(u));
  if (missing.length) problems.push(`urls missing: ${missing.slice(0, 3).join(' ')}`);
  const hangul = (t.title + t.summary + t.content).match(/[\uac00-\ud7a3]/g)?.length ?? 0;
  if (hangul > 40) problems.push(`hangul left: ${hangul}`);
  for (const [ko, en] of NAME_MAP) {
    if (new RegExp(`(?<![가-힣])${ko}`).test(p.content) && !(t.title + t.summary + t.content).includes(en)) problems.push(`proper name ${ko} must be written "${en}"`);
  }
  const ratio = t.content.length / Math.max(1, p.content.length);
  if (p.content.length > 200 && (ratio < 0.9 || ratio > 4.5)) problems.push(`length ratio ${ratio.toFixed(2)}`);
  return problems;
}

// Proper names the model tends to romanize wrongly (e.g. 제온 → "Jeon"). Shared with tests/i18n.test.mjs.
export const NAME_MAP = JSON.parse(readFileSync(join(root, 'scripts/i18n/names.json'), 'utf8'));

async function translate(p) {
  const file = join(outDir, `${p.slug}.json`);
  const hash = sourceHash(p);
  if (existsSync(file)) {
    try { const prev = JSON.parse(readFileSync(file, 'utf8')); if (prev.sourceHash === hash && validate(p, prev).length === 0) return 'skip'; } catch {}
  }
  let last = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { text, model } = await runClaude(PROMPT(p) + (last ? `\n\nPrevious attempt was rejected: ${last}. Fix that.` : ''));
      const json = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```\s*$/g, '').trim());
      const problems = validate(p, json);
      if (problems.length) { last = problems.join('; '); continue; }
      writeFileSync(file, JSON.stringify({ slug: p.slug, title: json.title.trim(), summary: json.summary.trim(), content: json.content.replace(/\s+$/, ''), sourceHash: hash, model, translatedAt: new Date().toISOString() }, null, 2) + '\n');
      return 'ok';
    } catch (e) { last = String(e.message).slice(0, 200); }
  }
  writeFileSync(join(outDir, `${p.slug}.error.txt`), last + '\n');
  return 'fail: ' + last;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let list = posts.filter((p) => !only?.length || only.includes(p.slug));
  if (limit) list = list.slice(0, limit);
  let i = 0, done = 0;
  const started = Date.now();
  const worker = async () => {
    while (i < list.length) {
      const p = list[i++];
      const r = await translate(p);
      done++;
      console.log(`[${done}/${list.length}] ${r} ${p.slug} (${Math.round((Date.now() - started) / 1000)}s)`);
    }
  };
  await Promise.all(Array.from({ length: Math.min(conc, list.length) }, worker));
}
