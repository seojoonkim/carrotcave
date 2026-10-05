#!/usr/bin/env python3
"""Generate reading aids (key-sentence highlights) for every post, KO + EN.
The 3-line takeaway box was removed on 2026-10-06 at Simon's request; do not bring it back.

Every highlight must be an exact substring of one paragraph line of the
post (validated by scripts/verify-reading-aids.mjs). Uses the Claude Code CLI (HOME=/Users/gimseojun).
Usage: python3 scripts/content/build-reading-aids.py [--only slug,slug] [--jobs 6]
Writes data/reading-aids.json incrementally (existing valid entries are kept).
"""
import json, os, re, subprocess, sys, threading
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'data', 'reading-aids.json')
HIGHLIGHT_MIN_CHARS = 1200   # posts shorter than this get no highlights

def load_posts():
    js = subprocess.run(['node', '-e', "import('./data/posts.ts').then(m=>process.stdout.write(JSON.stringify(m.posts.map(p=>({slug:p.slug,title:p.title,content:p.content})))))"],
                        cwd=ROOT, capture_output=True, text=True, check=True).stdout
    return json.loads(js), json.load(open(os.path.join(ROOT, 'data', 'en', 'posts.json')))

def lines_of(content):
    return [l.strip() for l in content.split('\n') if l.strip() and not l.strip().startswith(('http', '```', '#', '---'))]

def in_one_line(s, lines):
    return any(s in l for l in lines)

def check(entry, ko_lines, en_lines):
    errs = []
    for lang, lines in (('ko', ko_lines), ('en', en_lines)):
        e = entry.get(lang) or {}
        for h in e.get('highlights', []):
            if not in_one_line(h, lines): errs.append(f'{lang} highlight not verbatim: {h[:50]}')
    return errs

PROMPT = """You are an editor for a Korean essay blog. Pick reading aids for ONE post. Output ONLY JSON, no prose, no code fence.

Rules:
- "highlights": {n_hl} sentences that are the most striking, quotable lines, spread across the beginning, middle and end. Each MUST be copied EXACTLY, character for character, from ONE paragraph of the text (a full sentence, 15-110 chars). No paraphrase, no ellipsis, no joining two paragraphs, keep the original punctuation and markdown symbols out (do not include ** or *).
- Do this separately for the Korean text (key "ko") and the English text (key "en"). The English picks should correspond to the same sentences as the Korean picks.
- Never invent facts.

Shape: {{"ko":{{"highlights":[...]}},"en":{{"highlights":[...]}}}}

=== KOREAN TITLE ===
{title_ko}
=== KOREAN TEXT ===
{ko}
=== ENGLISH TITLE ===
{title_en}
=== ENGLISH TEXT ===
{en}
"""

def ask(prompt):
    # Use the Claude Code OAuth login. A login shell (background jobs run `zsh -lic`) exports a stale
    # ANTHROPIC_API_KEY/BASE_URL that outranks OAuth and fails with 401, so strip them here.
    env = {k: v for k, v in os.environ.items() if k not in ('ANTHROPIC_API_KEY', 'ANTHROPIC_BASE_URL', 'ANTHROPIC_AUTH_TOKEN')}
    env['HOME'] = '/Users/gimseojun'
    r = subprocess.run(['claude', '-p', '--output-format', 'text'], input=prompt, capture_output=True, text=True, env=env, timeout=540)
    out = r.stdout.strip()
    if 'API Error: 401' in out or 'Failed to authenticate' in out:
        raise SystemExit('claude auth failed (401) - check Claude Code login; aborting instead of retrying every post')
    m = re.search(r'\{.*\}', out, re.S)
    if not m: raise ValueError('no json: ' + (out or r.stderr)[:200])
    return json.loads(m.group(0))

def clean(entry, ko_lines, en_lines):
    # drop non-verbatim highlights rather than failing the whole post; keep highlights only
    for lang, lines in (('ko', ko_lines), ('en', en_lines)):
        e = entry.setdefault(lang, {})
        entry[lang] = e = {'highlights': e.get('highlights', [])}
        e['highlights'] = [h.strip() for h in e.get('highlights', []) if in_one_line(h.strip(), lines)]
    return entry

def main():
    args = sys.argv[1:]
    only = set(args[args.index('--only') + 1].split(',')) if '--only' in args else None
    jobs = int(args[args.index('--jobs') + 1]) if '--jobs' in args else 6
    posts, en = load_posts()
    data = json.load(open(OUT)) if os.path.exists(OUT) else {}
    lock = threading.Lock()
    todo = []
    for p in posts:
        n = len(p['content'])
        if n < HIGHLIGHT_MIN_CHARS: data.pop(p['slug'], None); continue
        if only and p['slug'] not in only: continue
        enp = en.get(p['slug'])
        if not enp: continue
        ko_lines, en_lines = lines_of(p['content']), lines_of(enp['content'])
        if not only and p['slug'] in data and not check(data[p['slug']], ko_lines, en_lines) and data[p['slug']]['ko']['highlights']: continue
        todo.append((p, enp, ko_lines, en_lines, n))
    print(f'todo {len(todo)}', flush=True)

    def work(item):
        p, enp, ko_lines, en_lines, n = item
        n_hl = '2' if n < 2500 else ('3' if n < 4500 else '4')
        prompt = PROMPT.format(n_hl=n_hl, title_ko=p['title'], ko=p['content'], title_en=enp['title'], en=enp['content'])
        last = None
        for attempt in range(3):
            try:
                entry = clean(ask(prompt if attempt == 0 else prompt + f'\n\nYour previous answer failed validation: {last}. Copy text EXACTLY.'), ko_lines, en_lines)
                errs = check(entry, ko_lines, en_lines)
                if not entry['ko']['highlights'] or not entry['en']['highlights']: errs.append('no verbatim highlights')
                if not errs:
                    with lock:
                        data[p['slug']] = entry
                        json.dump(dict(sorted(data.items())), open(OUT, 'w'), ensure_ascii=False, indent=1)
                    print(f'ok {p["slug"]}', flush=True); return
                last = '; '.join(errs)[:400]
                print(f'retry {p["slug"]} #{attempt + 1}: {last[:160]}', flush=True)
            except Exception as ex:
                last = str(ex)[:200]
                print(f'retry {p["slug"]} #{attempt + 1}: {type(ex).__name__} {last[:160]}', flush=True)
        print(f'FAIL {p["slug"]}: {last}', flush=True)

    with ThreadPoolExecutor(jobs) as ex: list(ex.map(work, todo))
    json.dump(dict(sorted(data.items())), open(OUT, 'w'), ensure_ascii=False, indent=1)
    print(f'done entries={len(data)}', flush=True)

if __name__ == '__main__':
    main()
