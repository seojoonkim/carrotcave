#!/usr/bin/env python3
"""key-sentences.en.json: the same key sentences, quoted exactly from the English transcript.

For each Korean key sentence, the paragraph's English text is given to the model, which must return
the English sentence(s) that carry the same quote, copied verbatim. The result is accepted only if
it occurs exactly once in that English paragraph (same check the reader applies).

Run: python3 scripts/i18n/run-with-lb.py python3 scripts/i18n/build-voice-key-sentences-en.py [slug ...]
"""
import json, os, re, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
V = ROOT / 'public/voices'
HANGUL = re.compile(r'[\uac00-\ud7a3]')

def llm(prompt):
    base, key = os.environ['CC_LLM_BASE_URL'], os.environ['CC_LLM_API_KEY']
    body = json.dumps({'model': os.environ.get('CC_LLM_MODEL', 'gpt-6-astra'), 'messages': [{'role': 'user', 'content': prompt}],
                       'response_format': {'type': 'json_object'}}).encode()
    req = urllib.request.Request(f'{base}/chat/completions', data=body, headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=600) as r:
        return json.loads(json.loads(r.read())['choices'][0]['message']['content'])

def pick(quote_ko, context_ko, english):
    prompt = ('A Korean key sentence was highlighted in a Korean paragraph. Below is the English version of the same passage.\n'
              'Return the shortest contiguous span of the ENGLISH text that carries the same meaning as the key sentence, '
              'copied EXACTLY character for character (it must be a substring of the English text). Prefer whole sentences.\n'
              'Return ONLY JSON {"quote": "<exact English substring>"}.\n\n'
              f'KEY SENTENCE (Korean): {quote_ko}\n\nKOREAN PARAGRAPH: {context_ko[:3000]}\n\nENGLISH TEXT: {english[:6000]}')
    for _ in range(3):
        q = (llm(prompt).get('quote') or '').strip()
        if q and english.count(q) == 1 and not HANGUL.search(q):
            return q
        prompt += f'\n\nYour answer "{q[:80]}" is not a unique exact substring of the English text. Copy it exactly.'
    return None

def by_segment_id(slug):
    """Readers keyed by the transcript paragraph/segment id that the key sentence sits in."""
    ko = json.loads((V / slug / 'transcript-ko.json').read_text())
    en = json.loads((V / slug / 'transcript-en.json').read_text()) if slug in ('liao-heng', 'masayoshi-son-asi-economy', 'yang-zhilin') else None
    keys = json.loads((V / slug / 'key-sentences.json').read_text()) if (V / slug / 'key-sentences.json').exists() else []
    if slug == 'liao-heng':
        kp = {p['segmentStartId']: p['text'] for p in ko['paragraphs']}
        ep = {p['segmentStartId']: p['text'] for p in en['paragraphs']}
        field = 'segmentStartId'
        return keys, kp, ep, field, None, None
    elif slug == 'masayoshi-son-asi-economy':
        kp = {i['id']: i['text'] for i in ko['items']}
        ep = {i['id']: i['text'] for i in en['items']}
        field = 'id'
        return keys, kp, ep, field, None, None
    elif slug in ('tibo-ai-wave', 'sam-altman-startup-school-2026', 'mark-zuckerberg-muse'):
        # English-original voices: the English reader was re-paragraphed, so match the Korean paragraph's
        # time span to the English paragraphs that overlap it; the result is re-keyed to the English id.
        en = json.loads((V / slug / 'transcript-en-reader.json').read_text())['items']
        if slug == 'mark-zuckerberg-muse':
            keys = []
            for it in ko['items']:
                for t in it['turns']:
                    for q in t.get('highlights') or []:
                        keys.append({'id': it['id'], 'exact_quote': q})
            kitems = {it['id']: it for it in ko['items']}
            kp = {it['id']: ' '.join(t['text'] for t in it['turns']) for it in ko['items']}
        else:
            kitems = {it['id']: it for it in (ko.get('items') or ko.get('segments'))}
            kp = {i: it['text'] for i, it in kitems.items()}
        def overlap(k):
            a, b = kitems[k]['start'], kitems[k]['end']
            ids = [e['id'] for e in en if e['start'] < b + 2 and e['end'] > a - 2]
            return ids
        ep, remap = {}, {}
        for k in keys:
            ids = overlap(k['id'])
            ep[k['id']] = '\n'.join(en[i]['text'] for i in ids)
            remap[k['id']] = ids
        return keys, kp, ep, 'id', remap, en
    else:  # yang-zhilin: id is a segment; give a window of neighbouring segments as context
        ks = {s['id']: s['text'] for s in ko['segments']}
        es = {s['id']: s['text'] for s in en['segments']}
        kp = {k['id']: ' '.join(ks.get(i, '') for i in range(k['id'] - 3, k['id'] + 4)) for k in keys}
        ep = {k['id']: es.get(k['id'], '') for k in keys}
        field = 'id'
    return keys, kp, ep, field, None, None

def build(slug):
    keys, kp, ep, field, remap, en = by_segment_id(slug)
    def one(k):
        q = pick(k['exact_quote'], kp.get(k[field], ''), ep.get(k[field], ''))
        if not q:
            return None
        if remap is None:
            return {**k, 'exact_quote': q}
        # Re-key to the English paragraph that contains the quote exactly once.
        hits = [i for i in remap[k[field]] if en[i]['text'].count(q) == 1]
        return {'id': hits[0], 'exact_quote': q} if hits else None
    with ThreadPoolExecutor(6) as pool:
        out = [x for x in pool.map(one, keys) if x]
    (V / slug / 'key-sentences.en.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
    print(slug, f'{len(out)}/{len(keys)} key sentences')

if __name__ == '__main__':
    for slug in (sys.argv[1:] or ['liao-heng', 'masayoshi-son-asi-economy', 'yang-zhilin', 'tibo-ai-wave', 'sam-altman-startup-school-2026', 'mark-zuckerberg-muse']):
        build(slug)
