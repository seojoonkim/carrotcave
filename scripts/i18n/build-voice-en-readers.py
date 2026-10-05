#!/usr/bin/env python3
"""Build index.en.html for voice readers that have an original-English transcript.

index.html stays the Korean source of truth. This copies it to index.en.html, sets lang="en",
and replaces every visible Korean string (text nodes + aria/alt/title/content attributes) with
an English rendering. Translations are cached per voice in data/voice-sources/<slug>.ui-en.json
so re-runs are deterministic; only new/changed strings go to the LLM.

Run: python3 scripts/i18n/run-with-lb.py python3 scripts/i18n/build-voice-en-readers.py
"""
import html, json, os, re, sys, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
V = ROOT / 'public/voices'
SRC = ROOT / 'data/voice-sources'
EN_VOICES = ['mark-zuckerberg-muse', 'tibo-ai-wave', 'sam-altman-startup-school-2026', 'liao-heng', 'liang-wenfeng', 'yang-zhilin', 'masayoshi-son-asi-economy', 'shin-jeongkyu-astra']
HANGUL = re.compile(r'[\uac00-\ud7a3]')
GLOSSARY = (ROOT / 'scripts/i18n/glossary.md').read_text() if (ROOT / 'scripts/i18n/glossary.md').exists() else ''

def llm(prompt):
    base, key = os.environ['CC_LLM_BASE_URL'], os.environ['CC_LLM_API_KEY']
    body = json.dumps({'model': os.environ.get('CC_LLM_MODEL', 'gpt-6-astra'), 'messages': [{'role': 'user', 'content': prompt}],
                       'response_format': {'type': 'json_object'}}).encode()
    req = urllib.request.Request(f'{base}/chat/completions', data=body, headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=600) as r:
        return json.loads(json.loads(r.read())['choices'][0]['message']['content'])

def protected_spans(doc):
    """Ranges we must not touch: <script>, <style>, <svg> and HTML comments."""
    spans = [m.span() for m in re.finditer(r'<(script|style|svg)\b.*?</\1>', doc, re.S)]
    spans += [m.span() for m in re.finditer(r'<!--.*?-->', doc, re.S)]
    return sorted(spans)

def inside(pos, spans):
    return any(a <= pos < b for a, b in spans)

def collect(doc):
    spans = protected_spans(doc)
    found = []
    for m in re.finditer(r'>([^<>]*)<', doc):
        raw = m.group(1)
        if HANGUL.search(raw) and not inside(m.start(1), spans):
            found.append(html.unescape(raw.strip()))
    for m in re.finditer(r'\s(aria-label|alt|title|content|placeholder|data-label)="([^"]*)"', doc):
        if HANGUL.search(m.group(2)) and not inside(m.start(2), spans):
            found.append(html.unescape(m.group(2)))
    return list(dict.fromkeys(found))

ORIGINAL_EN = {'mark-zuckerberg-muse', 'tibo-ai-wave', 'sam-altman-startup-school-2026'}
SOURCE_LANG = {'liao-heng': 'Chinese', 'liang-wenfeng': 'Chinese', 'yang-zhilin': 'Chinese', 'masayoshi-son-asi-economy': 'Japanese', 'shin-jeongkyu-astra': 'Korean'}
NAMES = ('마크 저커버그 → Mark Zuckerberg, 알렉스 히스 → Alex Heath, 티보 → Tibo, 매튜 버먼 → Matthew Berman, 샘 올트먼 → Sam Altman, 개리 탄 → Garry Tan, '
         '랴오헝 → Liao Heng, 샤오쥔 → Xiaojun, 화웨이 → Huawei, 하이실리콘 → HiSilicon, 어센드 → Ascend, 양즈린 → Yang Zhilin, 문샷 → Moonshot AI, 키미 → Kimi, '
         '량원펑 → Liang Wenfeng, 딥시크 → DeepSeek, 손정의 → Masayoshi Son, 소프트뱅크 → SoftBank, 신정규 → Jeongkyu Shin, 래블업 → Lablup')

def _batches(items, limit=3500):
    out, cur, size = [], [], 0
    for s in items:
        if cur and size + len(s) > limit:
            out.append(cur); cur, size = [], 0
        cur.append(s); size += len(s)
    if cur:
        out.append(cur)
    return out

def _prompt(slug, todo):
    if slug in ORIGINAL_EN:
        framing = ('The page presents the ORIGINAL ENGLISH transcript of the interview, so any wording like "한국어 번역 전사" / "Korean transcript" '
                   'must become "original English transcript" (or "English transcript"); paragraph counts in such labels must be dropped rather than guessed.\n')
    else:
        lang = SOURCE_LANG.get(slug, 'another language')
        framing = (f'The talk was originally in {lang}. This English page presents an ENGLISH TRANSLATION (made from the reviewed Korean edition), '
                   'so wording like "한국어 번역" / "Korean translation" must become "English translation"; keep counts of chapters/paragraphs as given. '
                   'Body paragraphs are interview text: translate them faithfully and completely, keeping the speaker\'s voice.\n')
    return ('Translate the UI, editorial and body strings of a CarrotCave (carrotcave.com) interview reader page from Korean to natural English.\n'
            + framing +
            f'Keep names in their official English form ({NAMES}). Dates in English (2026년 9월 8일 → September 8, 2026). Keep any numbers.\n'
            'Section names: 목소리 → Voices. 목차 → Contents. 전사 → transcript. 편집자 → editor.\n'
            + (('Glossary:\n' + GLOSSARY + '\n') if GLOSSARY else '') +
            'Return ONLY JSON: {"translations": {"<korean string exactly as given>": "<english>", ...}} covering every input string.\n\n'
            + json.dumps(todo, ensure_ascii=False))

def _translate_batch(slug, todo):
    done = {}
    for attempt in range(3):
        out = llm(_prompt(slug, todo)).get('translations', {})
        for s in todo:
            v = out.get(s)
            if isinstance(v, str) and v.strip() and not HANGUL.search(v):
                done[s] = v.strip()
        todo = [s for s in todo if s not in done]
        if not todo:
            return done
    raise SystemExit(f'{slug}: untranslated {len(todo)} strings, e.g. {todo[:3]}')

def translate(slug, strings, cache):
    from concurrent.futures import ThreadPoolExecutor
    todo = [s for s in strings if s not in cache]
    with ThreadPoolExecutor(6) as pool:
        for done in pool.map(lambda b: _translate_batch(slug, b), _batches(todo)):
            cache.update(done)
    return cache

def apply(doc, cache):
    spans = protected_spans(doc)
    out, last = [], 0
    def sub_text(m):
        raw = m.group(1)
        if not HANGUL.search(raw) or inside(m.start(1), spans):
            return m.group(0)
        lead, core, trail = re.match(r'(\s*)(.*?)(\s*)$', raw, re.S).groups()
        return '>' + lead + html.escape(cache[html.unescape(core)], quote=False) + trail + '<'
    doc = re.sub(r'>([^<>]*)<', sub_text, doc)
    spans = protected_spans(doc)
    def sub_attr(m):
        if not HANGUL.search(m.group(2)) or inside(m.start(2), spans):
            return m.group(0)
        return f' {m.group(1)}="{html.escape(cache[html.unescape(m.group(2))])}"'
    return re.sub(r'\s(aria-label|alt|title|content|placeholder|data-label)="([^"]*)"', sub_attr, doc)

def build(slug):
    src = (V / slug / 'index.html').read_text()
    cache_path = SRC / f'{slug}.ui-en.json'
    cache = json.loads(cache_path.read_text()) if cache_path.exists() else {}
    strings = collect(src)
    cache = translate(slug, strings, cache)
    cache = {k: v for k, v in cache.items() if k in strings}
    cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=1, sort_keys=True) + '\n')
    doc = apply(src, cache)
    doc = re.sub(r'<html lang="ko"', '<html lang="en"', doc, count=1)
    doc = doc.replace('href="/voices"', 'href="/en/voices"')
    left = collect(doc)
    if left:
        raise SystemExit(f'{slug}: Korean left in index.en.html: {left[:3]}')
    (V / slug / 'index.en.html').write_text(doc)
    print(slug, len(strings), 'strings')

if __name__ == '__main__':
    SRC.mkdir(parents=True, exist_ok=True)
    for slug in (sys.argv[1:] or EN_VOICES):
        build(slug)
