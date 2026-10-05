#!/usr/bin/env python3
"""Build English reader transcripts for voices whose source language is English.

The English text is the original YouTube English caption track — never a back-translation.
Paragraphs, timestamps and speakers come from the reviewed Korean reader so both languages
share chapters, anchors and speaker attribution. Where caption text has to be cut between two
paragraphs (or two speaker turns), an LLM only *chooses the cut word*; the script then verifies
that the concatenated English output equals the caption words exactly (no word added, dropped
or changed).

Output: public/voices/<slug>/transcript-en-reader.json
  {language:'en', source, method, items:[{id,start,end,chapter?,speaker,role,text}]}

Run with LLM credentials in env (CC_LLM_BASE_URL / CC_LLM_API_KEY / CC_LLM_MODEL), e.g.
  python3 scripts/i18n/run-with-lb.py python3 scripts/i18n/build-voice-en-transcripts.py
Cut choices are cached in data/voice-sources/cuts.json so re-runs are deterministic.
"""
import json, os, re, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
V = ROOT / 'public/voices'
SRC = ROOT / 'data/voice-sources'
CACHE = SRC / 'cuts.json'
cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}

def words_of(text):
    return text.replace('>>', ' ').split()

def join(words):
    return re.sub(r'\s+', ' ', ' '.join(words)).strip()

def first_sentence(t, n=160):
    return t.strip()[:n]

def last_sentence(t, n=160):
    return t.strip()[-n:]

def llm(prompt):
    base, key = os.environ['CC_LLM_BASE_URL'], os.environ['CC_LLM_API_KEY']
    model = os.environ.get('CC_LLM_MODEL', 'gpt-6-astra')
    body = json.dumps({'model': model, 'messages': [{'role': 'user', 'content': prompt}], 'response_format': {'type': 'json_object'}}).encode()
    req = urllib.request.Request(f'{base}/chat/completions', data=body, headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=300) as r:
        return json.loads(json.loads(r.read())['choices'][0]['message']['content'])

def choose_cut(key, numbered, before_ko, after_ko, before_spk, after_spk, lo, hi):
    """Return the index (lo<=i<=hi) of the first English word that belongs to the next part."""
    if key in cache and lo <= cache[key] <= hi:
        return cache[key]
    prompt = (
        'Below is a numbered window of an English interview caption (auto-generated, no punctuation guarantees).\n'
        'A Korean translation splits it into two consecutive parts. Find where the second part begins in the English.\n'
        f'Part A speaker: {before_spk}. Part A (Korean) ends with: {json.dumps(before_ko, ensure_ascii=False)}\n'
        f'Part B speaker: {after_spk}. Part B (Korean) starts with: {json.dumps(after_ko, ensure_ascii=False)}\n'
        f'Return JSON {{"first_word_of_part_b": <number between {lo} and {hi}>}} only.\n\n'
        + ' '.join(f'[{i}]{w}' for i, w in numbered)
    )
    for _ in range(3):
        try:
            i = int(llm(prompt)['first_word_of_part_b'])
            if lo <= i <= hi:
                cache[key] = i
                return i
        except Exception as e:  # retry on malformed output / transient errors
            last = e
    raise SystemExit(f'cut failed for {key}')

def merge_mid_sentence(items):
    """Join same-speaker paragraphs that the caption grouping broke in the middle of a sentence."""
    out = []
    for it in items:
        prev = out[-1] if out else None
        if (prev and prev['speaker'] == it['speaker'] and prev.get('chapter') == it.get('chapter')
                and not re.search(r'[.?!"\]\)]$', prev['text']) and re.match(r'[a-z]', it['text'])):
            prev['text'] = f"{prev['text']} {it['text']}"
            prev['end'] = it['end']
        else:
            out.append(dict(it))
    return out

def write(slug, source, method, items):
    items = merge_mid_sentence(items)
    for i, it in enumerate(items):
        if not it['text'] or re.search(r'[\uac00-\ud7a3]', it['text']):
            raise SystemExit(f'{slug}: bad paragraph {i}')
        it['id'] = i
    out = {'language': 'en', 'source': source, 'method': method, 'items': items}
    (V / slug / 'transcript-en-reader.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
    print(slug, len(items), 'paragraphs')

# ── Zuckerberg: paragraphs already map 1:1 to caption cues; only multi-speaker paragraphs need cuts.
def zuckerberg(pool):
    ko = json.loads((V / 'mark-zuckerberg-muse/transcript-ko.json').read_text())
    cues = json.loads((V / 'mark-zuckerberg-muse/source-en.json').read_text())['segments']
    names = {'마크 저커버그': ('Mark Zuckerberg', 'main'), '알렉스 히스': ('Alex Heath', 'host')}
    # The reviewed paragraphs group whole caption lines, which often end mid-sentence. Cut the
    # caption word stream again near each paragraph/turn boundary, at the sentence the Korean marks.
    words, cue_first = [], {}
    for ci, c in enumerate(cues):
        cue_first[ci] = len(words)
        words.extend(words_of(c['text']))
    parts = []  # (item, turn, estimated first word)
    for it in ko['items']:
        a = cue_first[it['sourceCueIds'][0]]
        b = cue_first.get(it['sourceCueIds'][-1] + 1, len(words))
        total = sum(len(t['text']) for t in it['turns'])
        acc = 0
        for t in it['turns']:
            parts.append((it, t, a + round((b - a) * acc / max(1, total))))
            acc += len(t['text'])
    def boundary(k):
        est = parts[k][2]
        lo, hi = max(1, est - 30), min(len(words) - 1, est + 30)
        prev, cur = parts[k - 1], parts[k]
        return choose_cut(f'zuck2:{k}', [(i, words[i]) for i in range(lo, hi + 1)], last_sentence(prev[1]['text']), first_sentence(cur[1]['text']),
                          prev[1]['speaker'], cur[1]['speaker'], lo, hi)
    cuts = list(pool.map(boundary, range(1, len(parts))))
    for x, y in zip(cuts, cuts[1:]):
        if y <= x:
            raise SystemExit(f'zuckerberg: non-monotonic cuts {x} {y}')
    bounds = [0] + cuts + [len(words)]
    items = []
    for (it, t, _), a, b in zip(parts, bounds, bounds[1:]):
        name, role = names[t['speaker']]
        items.append({'start': it['start'], 'end': it['end'], 'chapter': it['chapter'], 'speaker': name, 'role': role, 'text': join(words[a:b])})
    assert words_of(' '.join(i['text'] for i in items)) == words, 'zuckerberg: caption words changed'
    write('mark-zuckerberg-muse', ko['source'], 'Original YouTube English captions (auto-generated). Paragraphs, chapters and speakers follow the reviewed reader; caption words unchanged. Sponsor segment included.', items)

# ── Tibo: paragraphs already map to caption segment ids.
def tibo():
    ko = json.loads((V / 'tibo-ai-wave/transcript-ko.json').read_text())
    segs = json.loads((V / 'tibo-ai-wave/transcript-en.json').read_text())['segments']
    by_id = {s['id']: s for s in segs}
    items = [{'start': it['start'], 'end': it['end'], 'speaker': it['speaker'], 'role': 'main' if it['speaker'] == 'Tibo' else 'host',
              'text': join(words_of(' '.join(by_id[i]['text'] for i in it['segmentIds'])))} for it in ko['items']]
    write('tibo-ai-wave', ko['source'], 'Original YouTube English captions (auto-generated). Paragraphs and speakers follow the reader; caption words unchanged.', items)

# ── Sam Altman: Korean paragraphs carry times only; cut the caption word stream at each boundary.
def sam(pool):
    ko = json.loads((V / 'sam-altman-startup-school-2026/transcript-ko.json').read_text())
    cues = json.loads((SRC / 'sam-altman-startup-school-2026.en.json').read_text())['segments']
    words, times = [], []
    for c in cues:
        ws = words_of(c['text'])
        for j, w in enumerate(ws):
            words.append(w); times.append(c['start'] + c['duration'] * j / max(1, len(ws)))
    segs = ko['segments']
    def boundary(i):
        t = segs[i]['start']
        idx = [k for k, tm in enumerate(times) if t - 25 <= tm <= t + 25]
        lo, hi = idx[0], idx[-1]
        return choose_cut(f'sam:{i}', [(k, words[k]) for k in idx], last_sentence(segs[i-1]['text']), first_sentence(segs[i]['text']),
                          segs[i-1]['speaker'], segs[i]['speaker'], lo, hi)
    cuts = list(pool.map(boundary, range(1, len(segs))))
    for a, b in zip(cuts, cuts[1:]):
        if b <= a:
            raise SystemExit(f'sam: non-monotonic cuts {a} {b}')
    bounds = [0] + cuts + [len(words)]
    roles = {'Sam Altman': 'main', 'Garry Tan': 'host', 'Audience': 'audience'}
    items = [{'start': s['start'], 'end': s['end'], 'speaker': s['speaker'], 'role': roles[s['speaker']], 'text': join(words[a:b])}
             for s, a, b in zip(segs, bounds, bounds[1:])]
    assert words_of(' '.join(i['text'] for i in items)) == words, 'sam: caption words changed'
    write('sam-altman-startup-school-2026', ko['source'], 'Original Y Combinator YouTube English captions (auto-generated). Paragraphs and speakers follow the reader; caption words unchanged.', items)

if __name__ == '__main__':
    with ThreadPoolExecutor(8) as pool:
        try:
            tibo(); zuckerberg(pool); sam(pool)
        finally:
            CACHE.write_text(json.dumps(cache, indent=0, sort_keys=True) + '\n')
