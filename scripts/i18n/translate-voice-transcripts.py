#!/usr/bin/env python3
"""English transcripts for voices whose original is NOT English (Chinese / Japanese).

There is no English original for these talks, so the English page reads an English translation
of the reviewed Korean reader text. Output keeps the Korean file's exact schema (same ids,
counts, timestamps, chapters) as transcript-en.json, so each reader renders it with its own code.
Cached per voice in data/voice-sources/<slug>.transcript-en-cache.json (only new text is sent).

Run: python3 scripts/i18n/run-with-lb.py python3 scripts/i18n/translate-voice-transcripts.py [slug ...]
"""
import copy, json, os, re, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
V = ROOT / 'public/voices'
SRC = ROOT / 'data/voice-sources'
HANGUL = re.compile(r'[\uac00-\ud7a3]')
NAMES = ('랴오헝 → Liao Heng, 샤오쥔 → Xiaojun, 화웨이 → Huawei, 하이실리콘 → HiSilicon, 어센드 → Ascend, '
         '양즈린 → Yang Zhilin, 문샷 → Moonshot AI, 키미 → Kimi, 량원펑 → Liang Wenfeng, 딥시크 → DeepSeek, '
         '손정의 → Masayoshi Son, 소프트뱅크 → SoftBank, 신정규 → Jeongkyu Shin, 래블업 → Lablup')
SOURCE = {'liao-heng': 'Chinese', 'yang-zhilin': 'Chinese', 'masayoshi-son-asi-economy': 'Japanese'}

def llm(prompt):
    base, key = os.environ['CC_LLM_BASE_URL'], os.environ['CC_LLM_API_KEY']
    body = json.dumps({'model': os.environ.get('CC_LLM_MODEL', 'gpt-6-astra'), 'messages': [{'role': 'user', 'content': prompt}],
                       'response_format': {'type': 'json_object'}}).encode()
    req = urllib.request.Request(f'{base}/chat/completions', data=body, headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=600) as r:
        return json.loads(json.loads(r.read())['choices'][0]['message']['content'])

def batches(pairs, limit=3500):
    out, cur, size = [], [], 0
    for k, t in pairs:
        if cur and size + len(t) > limit:
            out.append(cur); cur, size = [], 0
        cur.append((k, t)); size += len(t)
    if cur:
        out.append(cur)
    return out

def translate_batch(slug, batch, fragments):
    lines = {k: t for k, t in batch}
    note = ('These are CONSECUTIVE short speech fragments of one talk; translate each so that read in order they form natural English sentences, '
            'one output per id, without moving words between ids more than needed.\n') if fragments else ''
    prompt = (f'Translate this interview transcript text from Korean to natural, faithful English. The talk was originally in {SOURCE[slug]}; '
              'the Korean is a careful translation of it. Keep the speaker\'s voice, keep every number, do not summarize or add.\n'
              f'{note}Official names: {NAMES}.\n'
              'Return ONLY JSON {"t": {"<id>": "<english>", ...}} with every id.\n\n' + json.dumps(lines, ensure_ascii=False))
    for _ in range(3):
        out = llm(prompt).get('t', {})
        bad = [k for k in lines if not isinstance(out.get(k), str) or not out[k].strip() or HANGUL.search(out[k])]
        if not bad:
            return {k: out[k].strip() for k in lines}
        prompt += f'\n\nPrevious answer missed or left Korean in ids {bad[:20]}. Return all ids in English.'
    raise SystemExit(f'{slug}: batch failed, e.g. {bad[:5]}')

def run(slug, pairs, fragments=False):
    cache_path = SRC / f'{slug}.transcript-en-cache.json'
    cache = json.loads(cache_path.read_text()) if cache_path.exists() else {}
    todo = [(k, t) for k, t in pairs if cache.get(k, {}).get('ko') != t]
    with ThreadPoolExecutor(6) as pool:
        for result, batch in zip(pool.map(lambda b: translate_batch(slug, b, fragments), batches(todo)), batches(todo)):
            for k, t in batch:
                cache[k] = {'ko': t, 'en': result[k]}
            cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=0) + '\n')
    return {k: cache[k]['en'] for k, _ in pairs}

def liao():
    slug = 'liao-heng'
    ko = json.loads((V / slug / 'transcript-ko.json').read_text())
    pairs = [(f'p{p["id"]}', p['text']) for p in ko['paragraphs']]
    pairs += [(f'c{c["id"]}', c['title']) for c in ko['chapters']] + [(f'h{h["id"]}', h['title']) for h in ko['highlights']]
    en_text = run(slug, pairs)
    en = copy.deepcopy(ko)
    for p in en['paragraphs']: p['text'] = en_text[f'p{p["id"]}']
    for c in en['chapters']: c['title'] = en_text[f'c{c["id"]}']
    for h in en['highlights']: h['title'] = en_text[f'h{h["id"]}']
    for s in en['segments']: s['text'] = ''  # timing anchors only; the reader shows paragraph text
    en['language'] = 'en'; en['meta']['language'] = 'en'
    en['translationModel'] = 'English translation of the reviewed Korean reader (original: Chinese)'
    return slug, en

def yang():
    slug = 'yang-zhilin'
    ko = json.loads((V / slug / 'transcript-ko.json').read_text())
    en_text = run(slug, [(str(s['id']), s['text']) for s in ko['segments'] if s['text'].strip()], fragments=True)
    en = copy.deepcopy(ko)
    for s in en['segments']:
        if s['text'].strip(): s['text'] = en_text[str(s['id'])]
    en['language'] = 'en'
    en['method'] = 'English translation of the Korean reader (original: Chinese audio)'
    return slug, en

def son():
    slug = 'masayoshi-son-asi-economy'
    ko = json.loads((V / slug / 'transcript-ko.json').read_text())
    pairs = [(f'i{i["id"]}', i['text']) for i in ko['items']] + [(f'c{c["id"]}', c['title']) for c in ko['chapters']]
    en_text = run(slug, pairs)
    en = copy.deepcopy(ko)
    for i in en['items']:
        i['text'] = en_text[f'i{i["id"]}']; i['speaker'] = 'Masayoshi Son'
    for c in en['chapters']: c['title'] = en_text[f'c{c["id"]}']
    en['language'] = 'en'
    en['method'] = 'English translation of the reviewed Korean reader (original: Japanese); Japanese source kept per item'
    return slug, en

def check(slug, en):
    def walk(x, path=''):
        if isinstance(x, dict):
            for k, v in x.items():
                if k in ('sourceJa',):  # original-language source text is kept on purpose
                    continue
                walk(v, f'{path}.{k}')
        elif isinstance(x, list):
            for i, v in enumerate(x): walk(v, f'{path}[{i}]')
        elif isinstance(x, str) and HANGUL.search(x):
            raise SystemExit(f'{slug}: Korean left at {path}: {x[:60]}')
    walk(en)

if __name__ == '__main__':
    SRC.mkdir(parents=True, exist_ok=True)
    jobs = {'liao-heng': liao, 'yang-zhilin': yang, 'masayoshi-son-asi-economy': son}
    for name in (sys.argv[1:] or jobs):
        slug, en = jobs[name]()
        check(slug, en)
        (V / slug / 'transcript-en.json').write_text(json.dumps(en, ensure_ascii=False) + '\n')
        print(slug, 'ok')
