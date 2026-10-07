#!/usr/bin/env python3
"""CarrotCave brand v4 — every brand asset from ONE glyph/body system (scripts/brand/glyphs.py).

Writes:
  lib/brand-svg.ts                 MARK / BUDDY / FOOTER svg strings (React + OG + readers share them)
  public/brand/mark.svg            header mark (96 box)
  public/carrot-mark.svg           tiny carrot accent (24 box)
  public/favicon.svg               rabbit tile icon
  public/brand/footer-cave.svg     animated footer scene (source of FOOTER_SCENE_SVG)
  public/voices/*/index*.html      reader brand-mark replaced between its <svg class="brand-mark"> tags

Run: python3 scripts/brand/build_brand.py   (then node scripts/brand/raster.mjs for png/ico)
"""
import json
import os
import re
import sys
sys.dont_write_bytecode = True  # release gate: verify must leave the tree clean (no __pycache__)
from pathlib import Path

HERE = Path(__file__).parent
ROOT = HERE.parent.parent
sys.path.insert(0, str(HERE))
import glyphs as G  # noqa: E402

NAVY = G.NAVY
CAVE = dict(bg='#1E1F28', ring=('#232531', '#282A37', '#2E3040', '#353849'), rock='#15161D',
            floor='#2A2C38', lip='#202230', crystal=G.MINT, crystal_shade='#0FA87F', shadow='#14151C')


def char(kind, faces_svg, cid, extra_cls=''):
    body = G.rabbit_svg(faces_svg, cid=cid) if kind == 'rabbit' else G.carrot_svg(faces_svg, cid=cid)
    return f'<g class="cc-{kind}{(" " + extra_cls) if extra_cls else ""}">{body}</g>'


def face_static(kind, expr):
    f = G.RABBIT_FACE if kind == 'rabbit' else G.CARROT_FACE
    return G.face(expr, **f)


def face_layers(kind, prefix, exprs):
    """Separate eye-pair and mouth layers for each expression so CSS can swap eyes and mouths independently."""
    f = G.RABBIT_FACE if kind == 'rabbit' else G.CARROT_FACE
    eyes, mouths = [], []
    seen_m = set()
    for e in exprs:
        svg = G.face(e, **f)
        chunks = re.split(r'(?=<g class="part" data-role=)', svg)
        e_html = ''.join(c for c in chunks if 'data-role="eye"' in c)
        m_html = ''.join(c for c in chunks if 'data-role="mouth"' in c)
        eyes.append(f'<g class="{prefix}-eyes {prefix}-eyes--{e}">{e_html}</g>')
        m_name = G.EXPR[e][2]
        if m_name and m_name not in seen_m:
            seen_m.add(m_name)
            mouths.append(f'<g class="{prefix}-mouth {prefix}-mouth--{m_name}">{m_html}</g>')
    return ''.join(eyes) + ''.join(mouths)


def dashes(color, cx, top, cls):
    return G.dashes(color, cx, top).replace('class="dashes"', f'class="dashes {cls}"', 1)


# ---------------------------------------------------------------- header mark (96 x 96)
def mark_svg(id_prefix='cc', with_xmlns=False, hover=False):
    """Cave arch with the rabbit and carrot standing in its mouth.
    Static (OG / readers / favicon-free uses): one face each. hover=True adds a hidden second face the site swaps on hover."""
    x = ' xmlns="http://www.w3.org/2000/svg"' if with_xmlns else ''
    arch = ('<path class="mark-cave" d="M4 92 C4 36 22 4 48 4 C74 4 92 36 92 92 Z" fill="#3A3E52"/>'
            '<path d="M14 92 C14 46 29 18 48 18 C67 18 82 46 82 92 Z" fill="#272A37"/>')
    def faces(kind, rest, hi):
        f = f'<g class="mark-face mark-face--rest">{face_static(kind, rest)}</g>'
        if hover:
            f += f'<g class="mark-face mark-face--hi">{face_static(kind, hi)}</g>'
        return f
    rabbit = (f'<g class="mark-rabbit" transform="translate(9 23.1) scale(.255)">'
              f'{G.rabbit_svg(faces("rabbit", "cool", "joy"), cid=id_prefix + "-mr")}</g>')
    carrot = (f'<g class="mark-carrot" transform="translate(49.5 39.6) scale(.19)">'
              f'{G.carrot_svg(faces("carrot", "sparkle", "love"), cid=id_prefix + "-mc")}</g>')
    return (f'<svg{x} viewBox="0 0 96 96">{arch}'
            f'<rect x="10" y="88.6" width="76" height="3.4" rx="1.7" fill="{CAVE["shadow"]}"/>{rabbit}{carrot}</svg>')


def favicon_svg():
    """Rabbit only, on a rounded cave tile — legible at 16-32px."""
    face = face_static('rabbit', 'cool')
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
            f'<rect width="64" height="64" rx="14" fill="{CAVE["bg"]}"/>'
            '<path d="M8 64 C8 30 20 12 32 12 C44 12 56 30 56 64 Z" fill="#343849"/>'
            f'<g transform="translate(5.6 5.5) scale(.22)">{G.rabbit_svg(face, cid="fv")}</g></svg>')


def carrot_mark_svg():
    face = face_static('carrot', 'joy')
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">'
            f'<g transform="translate(12 12) rotate(14) translate(-12.5 -14.6) scale(.104)">{G.carrot_svg(face, cid="cm")}</g></svg>')


# ---------------------------------------------------------------- share-card art (380 x 400)
def og_art_svg():
    """Cave arch with the pair, for share cards without a picture. Concentric rings echo the footer tunnel."""
    rings = ''.join(f'<path d="M{190 - r} 400 C{190 - r} {400 - r * 1.5:.0f} {190 - r * .55:.0f} {400 - r * 1.86:.0f} 190 {400 - r * 1.86:.0f} '
                    f'C{190 + r * .55:.0f} {400 - r * 1.86:.0f} {190 + r} {400 - r * 1.5:.0f} {190 + r} 400 Z" fill="{c}"/>'
                    for r, c in ((190, '#2E3142'), (160, '#353849'), (128, '#272A37')))
    rabbit = f'<g transform="translate(28 156) scale(.86)">{G.rabbit_svg(face_static("rabbit", "cool"), cid="og-r")}{dashes(G.MINT, 120, -10, "d")}</g>'
    carrot = f'<g transform="translate(206 218) scale(.62)">{G.carrot_svg(face_static("carrot", "sparkle"), cid="og-c")}{dashes(G.ORANGE, 120, 2, "d")}</g>'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 400">{rings}'
            f'<rect x="20" y="381" width="340" height="12" rx="6" fill="{CAVE["shadow"]}"/>{rabbit}{carrot}</svg>')


# ---------------------------------------------------------------- buddy (empty / done / lost)
BUDDY_MOODS = {'idle': ('cool', 'sparkle'), 'happy': ('joy', 'love'), 'lost': ('daze', 'curious')}


def buddy_svg():
    r_faces, c_faces = [], []
    for mood, (r, c) in BUDDY_MOODS.items():
        r_faces.append(f'<g class="buddy-face buddy-face--{mood}">{face_static("rabbit", r)}</g>')
        c_faces.append(f'<g class="buddy-face buddy-face--{mood}">{face_static("carrot", c)}</g>')
    r_faces.append(f'<g class="buddy-blink">{face_static("rabbit", "blink")}</g>')
    c_faces.append(f'<g class="buddy-blink">{face_static("carrot", "blink")}</g>')
    blink = ('<style>.buddy-face,.buddy-blink{opacity:0}'
             '.cc-buddy--idle .buddy-face--idle,.cc-buddy--happy .buddy-face--happy,.cc-buddy--lost .buddy-face--lost{opacity:1;animation:cc-buddy-eyes 5.2s steps(1,end) infinite}'
             '.buddy-blink{animation:cc-buddy-blink 5.2s steps(1,end) infinite}'
             '@keyframes cc-buddy-eyes{0%,93%{opacity:1}94%,96%{opacity:0}97%,100%{opacity:1}}'
             '@keyframes cc-buddy-blink{0%,93%{opacity:0}94%,96%{opacity:1}97%,100%{opacity:0}}'
             '@media (prefers-reduced-motion:reduce){.buddy-face,.buddy-blink{animation:none!important}.buddy-blink{opacity:0}}</style>')
    return ('<svg viewBox="0 0 132 96" aria-hidden="true" focusable="false">' + blink +
            f'<ellipse cx="44" cy="92" rx="34" ry="4" fill="{CAVE["shadow"]}"/><ellipse cx="102" cy="92" rx="22" ry="4" fill="{CAVE["shadow"]}"/>'
            f'<g class="buddy-rabbit" transform="translate(4 12) scale(.30)">{G.rabbit_svg("".join(r_faces), cid="br")}</g>'
            f'<g class="buddy-carrot" transform="translate(74 30) scale(.24)">{G.carrot_svg("".join(c_faces), cid="bc")}</g></svg>')


# ---------------------------------------------------------------- footer scene (1100 x 220, floor y=204)
LOOP = 18.0
# (start, end, rabbit expr, carrot expr) — eyes and mouths swap on these beats; a blink covers every cut.
BEATS = [(0, 3, 'cool', 'sparkle'), (3, 6, 'meh', 'cool'), (6, 8.4, 'curious', 'curious'),
         (8.4, 10.2, 'daze', 'curious'), (10.2, 12.4, 'sparkle', 'sparkle'), (12.4, 15.2, 'joy', 'love'),
         (15.2, 18, 'cool', 'meh')]
BLINK = 0.14  # seconds the blink eyes cover each cut
R_X, C_X, FLOOR = 640, 868, 204
R_S, C_S = .62, .52

# ---- rabbit choreography (seconds on the shared LOOP; local units are the rabbit's own 240-wide box)
# The rabbit tells a small story with the carrot: hops in, sways bored, sneaks toward the rock where the carrot
# hides, gets dizzy looking for it, jumps back when it pops out, flips for joy and walks home.
# (start, end, peak height) — each hop gets anticipation squash, take-off stretch and landing squash.
R_HOPS = [(0.6, 1.2, 26), (6.2, 6.6, 16), (7.05, 7.45, 16), (10.4, 11.6, 40), (12.6, 13.6, 34), (14.05, 14.75, 22)]
# horizontal travel (local units, right = toward the carrot). Never left of home: phones crop the left side.
R_WALK = [(0, 0), (6.2, 0), (6.6, 24), (7.05, 24), (7.45, 44), (10.4, 44), (11.6, 12), (14.05, 12), (14.75, 0), (LOOP, 0)]
R_WALK_MAX = 44
# whole-body lean (deg, around the feet): bored sway, curious lean toward the rock, dizzy wobble, startle, joy wiggle
R_TILT = [(0, 0), (3.0, 0), (3.5, -4), (4.4, 4), (5.3, -3), (5.9, 0), (7.45, 0), (7.8, 6), (8.3, 6), (8.6, -6), (8.9, 6),
          (9.2, -5), (9.5, 4), (9.8, -2), (10.1, 0), (10.45, -7), (11.2, 0), (14.8, 0), (15.0, -5), (15.2, 5), (15.4, 0), (LOOP, 0)]
R_FLIP = (12.62, 13.58)  # one full somersault inside the joy hop
# ears (both together, from the base): droop when bored, perk when curious, shoot up when startled
R_EARS = [(0, 1), (3.0, 1), (3.4, .86), (5.8, .86), (6.1, 1), (7.6, 1.07), (8.4, 1.07), (8.6, 1), (10.3, 1),
          (10.45, 1.16), (10.9, 1), (LOOP, 1)]
SQUASH_PRE, SQUASH_POST = .12, .26


def kf(name, stops, prop):
    """@keyframes from [(seconds, value)] — merges equal times, clamps to the loop."""
    body = ''.join(f'{pct(min(max(t, 0), LOOP))}{{{prop}:{v}}}' for t, v in stops)
    return f'@keyframes {name}{{{body}}}'


def lerp_track(track, t):
    for (a, va), (b, vb) in zip(track, track[1:]):
        if a <= t <= b:
            return va if b == a else va + (vb - va) * (t - a) / (b - a)
    return track[-1][1]


def hop_height(t):
    for a, b, h in R_HOPS:
        if a <= t <= b:
            m = (a + b) / 2
            return h * (1 - ((t - m) / (m - a)) ** 2)  # parabola: the shadow follows the real arc
    return 0.0


def rabbit_motion_css():
    """Classes + keyframes for the rabbit's layered motion. Returns (css rules, keyframes, checks)."""
    hop = []
    for a, b, h in R_HOPS:
        m = (a + b) / 2
        hop += [(a, 'translateY(0);animation-timing-function:cubic-bezier(.2,.7,.4,1)'),
                (m, f'translateY(-{h}px);animation-timing-function:cubic-bezier(.6,0,.8,.3)'), (b, 'translateY(0)')]
    hop = [(0, 'translateY(0)')] + hop + [(LOOP, 'translateY(0)')]
    sq = [(0, 'scale(1,1)')]
    for a, b, h in R_HOPS:
        sq += [(a - SQUASH_PRE - .06, 'scale(1,1)'), (a - .02, 'scale(1.12,.86)'), (a + .08, 'scale(.9,1.12)'),
               ((a + b) / 2, 'scale(1,1)'), (b, 'scale(1.14,.84)'), (b + .14, 'scale(.97,1.03)'), (b + SQUASH_POST, 'scale(1,1)')]
    sq.append((LOOP, 'scale(1,1)'))
    # squash windows must not overlap or the body would snap between hops
    wins = [(a - SQUASH_PRE - .06, b + SQUASH_POST) for a, b, _ in R_HOPS]
    assert all(w1[1] <= w2[0] for w1, w2 in zip(wins, wins[1:])), 'rabbit squash windows overlap'
    a, b = R_FLIP
    flip = [(0, 'rotate(0deg)'), (a, 'rotate(0deg);animation-timing-function:cubic-bezier(.45,0,.55,1)'),
            (b, 'rotate(-360deg)'), (LOOP, 'rotate(-360deg)')]
    walk = [(t, f'translateX({x}px)') for t, x in R_WALK]
    tilt = [(t, f'rotate({d}deg)') for t, d in R_TILT]
    ears = [(t, f'scale(1,{v})') for t, v in R_EARS]
    # the shadow is in scene units: follows the walk, shrinks and fades while the rabbit is in the air
    times = sorted({round(t, 3) for t, _ in R_WALK} | {round(x, 3) for a, b, _ in R_HOPS for x in (a, (a + b) / 2, b)}
                   | {round(a + (b - a) * k / 4, 3) for a, b, _ in R_HOPS for k in (1, 3)})
    shadow = [(t, f'translateX({lerp_track(R_WALK, t) * R_S:.1f}px) scale({1 - .45 * hop_height(t) / 40:.3f})')
              for t in times]
    L = f'{LOOP}s'
    css = [
        f'.rabbit-walk{{animation:cc-r-walk {L} cubic-bezier(.4,0,.4,1) infinite}}',
        f'.rabbit-hop{{animation:cc-r-hop {L} linear infinite}}',
        f'.rabbit-squash,.rabbit-tilt{{transform-box:fill-box;transform-origin:50% 100%}}',
        f'.rabbit-squash{{animation:cc-r-squash {L} ease-in-out infinite}}',
        f'.rabbit-tilt{{animation:cc-r-tilt {L} ease-in-out infinite}}',
        f'.rabbit-flip{{transform-box:fill-box;transform-origin:50% 55%;animation:cc-r-flip {L} linear infinite}}',
        f'.ears{{transform-box:fill-box;transform-origin:50% 100%;animation:cc-r-ears {L} ease-in-out infinite}}',
        f'.rabbit-shadow{{transform-box:fill-box;transform-origin:50% 50%;animation:cc-r-shadow {L} linear infinite}}',
    ]
    kfs = [kf('cc-r-walk', walk, 'transform'), kf('cc-r-hop', hop, 'transform'), kf('cc-r-squash', sq, 'transform'),
           kf('cc-r-tilt', tilt, 'transform'), kf('cc-r-flip', flip, 'transform'), kf('cc-r-ears', ears, 'transform'),
           kf('cc-r-shadow', shadow, 'transform')]
    return css, kfs


def pct(t):
    return f'{t / LOOP * 100:.3f}%'


def window_keyframes(name, windows):
    """opacity 1 inside [a,b) windows, 0 elsewhere; hard cuts (step) so parts never cross-fade into mush."""
    stops = []
    eps = 0.001
    on = sorted(windows)
    stops.append(f'0%{{opacity:{1 if on and on[0][0] <= 0 else 0}}}')
    for a, b in on:
        if a > 0:
            stops.append(f'{pct(max(a - eps, 0))}{{opacity:0}}{pct(a)}{{opacity:1}}')
        stops.append(f'{pct(min(b - eps, LOOP))}{{opacity:1}}{pct(min(b, LOOP))}{{opacity:{1 if b >= LOOP and on[0][0] <= 0 else 0}}}')
    stops.append(f'100%{{opacity:{1 if on and on[-1][1] >= LOOP else 0}}}')
    return f'@keyframes {name}{{{"".join(stops)}}}'


def face_timeline(prefix, idx):
    """CSS for one character: which eyes/mouth layer is visible when, plus blink eyes over every cut."""
    eyes, mouths = {}, {}
    cuts = [b[0] for b in BEATS]
    for (a, b, *ex) in BEATS:
        e = ex[idx]
        ea, eb = (a + BLINK / 2 if a > 0 else a), (b - BLINK / 2 if b < LOOP else b)
        eyes.setdefault(e, []).append((ea, eb))
        mouths.setdefault(G.EXPR[e][2], []).append((a, b))
    blink = [(max(c - BLINK / 2, 0), c + BLINK / 2) for c in cuts if c > 0] + [(LOOP - BLINK / 2, LOOP)]
    eyes['blink'] = blink
    css, kf = [], []
    for e, w in eyes.items():
        n = f'cc-{prefix}-e-{e}'
        kf.append(window_keyframes(n, w))
        css.append(f'.{prefix}-eyes--{e}{{animation:{n} {LOOP}s linear infinite}}')
    for m, w in mouths.items():
        n = f'cc-{prefix}-m-{m}'
        kf.append(window_keyframes(n, w))
        css.append(f'.{prefix}-mouth--{m}{{animation:{n} {LOOP}s linear infinite}}')
    return css, kf, list(eyes), list(mouths)


def footer_svg():
    exprs_r = list(dict.fromkeys([b[2] for b in BEATS] + ['joy']))
    exprs_c = list(dict.fromkeys([b[3] for b in BEATS] + ['love']))
    r_css, r_kf, r_eyes, r_m = face_timeline('fr', 0)
    c_css, c_kf, c_eyes, c_m = face_timeline('fc', 1)

    r_layers = face_layers('rabbit', 'fr', exprs_r) + f'<g class="fr-eyes fr-eyes--blink">{"".join(re.split(r"(?=<g class=.part.)", face_static("rabbit", "blink"))[1:])}</g>'
    c_layers = face_layers('carrot', 'fc', exprs_c) + f'<g class="fc-eyes fc-eyes--blink">{"".join(re.split(r"(?=<g class=.part.)", face_static("carrot", "blink"))[1:])}</g>'
    tap_face = f'<g class="fc-tapface">{face_static("carrot", "love")}</g>'

    C = CAVE
    def rounded(d, fill, w=10):
        return f'<path d="{d}" fill="{fill}" stroke="{fill}" stroke-width="{w}" stroke-linejoin="round"/>'

    sky = ('<g class="cave-mouth">'
           '<path class="mouth-sky" d="M70 204 C70 120 104 70 150 70 C196 70 230 120 230 204 Z"/>'
           '<g class="sky-night"><circle class="sky-star" cx="120" cy="110" r="2.4"/><circle class="sky-star" cx="168" cy="96" r="1.8"/>'
           '<circle class="sky-star" cx="190" cy="136" r="2.2"/><circle class="sky-star" cx="110" cy="150" r="1.6"/>'
           '<path class="moon" d="M168 128 A20 20 0 1 1 150 104 A15 15 0 0 0 168 128 Z" fill="#F4EEDF"/></g>'
           '<circle class="sun" cx="150" cy="128" r="20" fill="#FFC56B"/>'
           '<path d="M70 204 C70 120 104 70 150 70 C196 70 230 120 230 204" fill="none" stroke="#353849" stroke-width="16"/></g>')
    rings = ''.join(f'<path d="M{760 - r} {FLOOR} A{r} {r * .74:.0f} 0 0 1 {760 + r} {FLOOR} Z" fill="{col}"/>'
                    for r, col in zip((420, 340, 260, 180), C['ring']))
    crystals = ''
    for x, s_ in ((300, 1.0), (326, .66), (1030, .86), (520, .55)):
        h, w = 40 * s_, 13 * s_
        crystals += (f'<g class="crystal"><path d="M{x} {FLOOR - h:.1f} L{x + w:.1f} {FLOOR - h * .62:.1f} L{x + w * .7:.1f} {FLOOR + 2} '
                     f'L{x - w * .7:.1f} {FLOOR + 2} L{x - w:.1f} {FLOOR - h * .62:.1f} Z" fill="{C["crystal"]}" stroke="{C["crystal"]}" stroke-width="4" stroke-linejoin="round"/>'
                     f'<path d="M{x} {FLOOR - h:.1f} L{x + w:.1f} {FLOOR - h * .62:.1f} L{x + w * .7:.1f} {FLOOR + 2} L{x} {FLOOR + 2} Z" fill="{C["crystal_shade"]}"/></g>')
    motes = ''.join(f'<circle class="mote mote--{i % 3}" cx="{x}" cy="{y}" r="3" fill="{col}"/>'
                    for i, (x, y, col) in enumerate(((420, 120, G.MINT), (560, 70, G.ORANGE), (700, 50, G.MINT),
                                                     (980, 80, G.ORANGE), (1060, 140, G.MINT), (460, 170, G.ORANGE))))
    # mood props: one flat object per menu, standing left of the rabbit
    PX = 470
    props = {
        'explore': f'<g class="prop prop--explore"><rect x="{PX - 12}" y="{FLOOR - 44}" width="24" height="40" rx="8" fill="#353849"/><rect x="{PX - 7}" y="{FLOOR - 37}" width="14" height="24" rx="5" fill="#FFC56B"/><rect x="{PX - 6}" y="{FLOOR - 52}" width="12" height="8" rx="3" fill="#353849"/></g>',
        'build': f'<g class="prop prop--build"><rect x="{PX - 26}" y="{FLOOR - 24}" width="24" height="24" rx="5" fill="{G.MINT}"/><rect x="{PX}" y="{FLOOR - 24}" width="24" height="24" rx="5" fill="{G.ORANGE}"/><rect x="{PX - 13}" y="{FLOOR - 49}" width="24" height="24" rx="5" fill="#F4EEDF"/></g>',
        'doodle': f'<g class="prop prop--doodle" transform="rotate(-24 {PX} {FLOOR - 20})"><rect x="{PX - 7}" y="{FLOOR - 58}" width="14" height="50" rx="4" fill="#FFC56B"/><path d="M{PX - 7} {FLOOR - 8} L{PX + 7} {FLOOR - 8} L{PX} {FLOOR + 6} Z" fill="#F4EEDF" stroke="#F4EEDF" stroke-width="3" stroke-linejoin="round"/><rect x="{PX - 7}" y="{FLOOR - 62}" width="14" height="8" rx="3" fill="{G.ORANGE}"/></g>',
        'fiction': f'<g class="prop prop--fiction"><rect x="{PX - 26}" y="{FLOOR - 16}" width="52" height="14" rx="4" fill="{G.MINT}"/><rect x="{PX - 22}" y="{FLOOR - 30}" width="46" height="14" rx="4" fill="{G.ORANGE}"/><rect x="{PX - 24}" y="{FLOOR - 44}" width="48" height="14" rx="4" fill="#F4EEDF"/></g>',
        'voices': f'<g class="prop prop--voices"><rect x="{PX - 11}" y="{FLOOR - 62}" width="22" height="34" rx="11" fill="#F4EEDF"/><path d="M{PX - 18} {FLOOR - 42} C{PX - 18} {FLOOR - 22} {PX + 18} {FLOOR - 22} {PX + 18} {FLOOR - 42}" fill="none" stroke="#353849" stroke-width="6" stroke-linecap="round"/><rect x="{PX - 3}" y="{FLOOR - 26}" width="6" height="22" rx="3" fill="#353849"/></g>',
    }
    flag = (f'<g class="news-flag"><rect x="1000" y="{FLOOR - 72}" width="6" height="72" rx="3" fill="#353849"/>'
            f'<path d="M1006 {FLOOR - 70} L1052 {FLOOR - 70} L1042 {FLOOR - 58} L1052 {FLOOR - 46} L1006 {FLOOR - 46} Z" fill="{G.MINT}" stroke="{G.MINT}" stroke-width="4" stroke-linejoin="round"/>'
            f'<text x="1026" y="{FLOOR - 52}" text-anchor="middle" font-size="13" font-weight="800" font-family="Pretendard, sans-serif" fill="{NAVY}">NEW</text></g>')

    rabbit = (f'<g class="rabbit-position" transform="translate({R_X - 120 * R_S:.1f} {FLOOR - 262 * R_S:.1f}) scale({R_S})">'
              f'<g class="rabbit-walk"><g class="rabbit-hop"><g class="rabbit-react"><g class="rabbit-squash"><g class="rabbit-tilt">'
              f'<g class="rabbit-flip"><g class="rabbit-breathe">'
              f'{dashes(G.MINT, 120, -10, "rabbit-dashes")}{G.rabbit_svg(r_layers, cid="fr")}</g></g></g></g></g></g></g></g>')
    hole = f'<ellipse class="burrow-hole" cx="{C_X}" cy="{FLOOR + 1}" rx="54" ry="8" fill="#101117"/>'
    carrot = (f'<g clip-path="url(#fc-ground)"><g class="carrot-position" transform="translate({C_X - 120 * C_S:.1f} {FLOOR - 262 * C_S:.1f}) scale({C_S})">'
              f'<g class="carrot-hide"><g class="carrot-hop"><g class="carrot-clip">'
              f'{dashes(G.ORANGE, 120, 2, "carrot-dashes")}{G.carrot_svg(c_layers + tap_face, cid="fc")}</g></g></g></g></g>')
    hit = (f'<rect class="carrot-hit" x="{C_X - 70}" y="{FLOOR - 160}" width="140" height="160" rx="24" fill="transparent" '
           'role="button" tabindex="0" aria-label="당근 쓰다듬기"/>')
    # rabbit tap target covers its whole walk (home .. +R_WALK_MAX) and the ears
    r_hit = (f'<rect class="rabbit-hit" x="{R_X - 80}" y="{FLOOR - 172}" width="{160 + R_WALK_MAX * R_S:.0f}" height="172" rx="24" '
             'fill="transparent" role="button" tabindex="0" aria-label="토끼 쓰다듬기"/>')
    pop = (f'<g class="tap-pop"><rect x="{C_X - 78}" y="12" width="156" height="40" rx="20" fill="#F4EEDF"/>'
           f'<path d="M{C_X - 8} 50 L{C_X} 62 L{C_X + 8} 50 Z" fill="#F4EEDF"/>'
           f'<text class="tap-text" x="{C_X}" y="38" text-anchor="middle" font-size="17" font-weight="700" font-family="Pretendard, sans-serif" fill="{NAVY}">들켰다!</text></g>')

    rock_d = (f'M{C_X - 86} 214 C{C_X - 84} 176 {C_X - 50} 160 {C_X - 4} 162 '
              f'C{C_X + 44} 160 {C_X + 82} 178 {C_X + 84} 214 Z')
    rock = (f'<clipPath id="fc-ground"><rect x="{C_X - 160}" y="-40" width="320" height="{FLOOR + 41}"/></clipPath>')
    css = scene_css(r_css + c_css, r_kf + c_kf)
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 220" role="img" aria-labelledby="fcs-title">'
            '<title id="fcs-title">CarrotCave footer cave</title>'
            f'<style>{css}</style>'
            f'<g class="scene">{rings}{sky}'
            f'{rounded("M-10 204 Q180 196 380 204 Q600 212 820 204 Q980 198 1110 204 L1110 230 L-10 230 Z", C["floor"])}'
            f'<rect x="-10" y="212" width="1120" height="20" fill="{C["lip"]}"/>'
            f'{crystals}{motes}{"".join(props.values())}{flag}'
            f'<ellipse class="rabbit-shadow" cx="{R_X}" cy="{FLOOR}" rx="64" ry="7" fill="{C["shadow"]}"/>'
            f'<ellipse class="carrot-shadow" cx="{C_X}" cy="{FLOOR}" rx="44" ry="7" fill="{C["shadow"]}"/>'
            f'{rock}{hole}{rabbit}{carrot}'
            f'{r_hit}{hit}{pop}</g></svg>')


def scene_css(face_css, face_kf):
    L = f'{LOOP}s'
    r_css, r_kfs = rabbit_motion_css()
    c_hop = (f'@keyframes cc-c-hop{{0%,{pct(.9)},{pct(1.9)},{pct(12.4)},{pct(13.4)},100%{{transform:translateY(0)}}'
             f'{pct(1.35)}{{transform:translateY(-40px)}}{pct(12.9)}{{transform:translateY(-46px)}}}}')
    # carrot ducks behind the rock (6.6 -> 7.6), stays hidden, peeks (9.2), pops out (10.2)
    hide = (f'@keyframes cc-c-hide{{0%,{pct(6.4)},{pct(10.4)},100%{{transform:translateY(0)}}'
            f'{pct(7.4)},{pct(8.8)}{{transform:translateY(200px)}}{pct(9.4)},{pct(9.9)}{{transform:translateY(86px)}}}}')
    c_shadow = (f'@keyframes cc-c-shadow{{0%,{pct(6.4)},{pct(10.4)},100%{{opacity:1}}{pct(7.4)},{pct(8.8)}{{opacity:0}}}}')
    dash = (lambda n, windows: f'@keyframes {n}{{0%,100%{{opacity:0;transform:scale(.6)}}' +
            ''.join(f'{pct(a)}{{opacity:0;transform:scale(.6)}}{pct(a + .25)}{{opacity:1;transform:scale(1.08)}}'
                    f'{pct(a + .5)},{pct(b - .2)}{{opacity:1;transform:scale(1)}}{pct(b)}{{opacity:0;transform:scale(.8)}}' for a, b in windows) + '}')
    base = [
        '.scene{opacity:1}',
        '.mouth-sky{fill:#2B3550;transition:fill .6s ease}.sun{opacity:0}.sky-night{opacity:1}',
        '.rabbit-position,.carrot-position{will-change:transform}',
        *r_css,
        '.rabbit-breathe{transform-box:fill-box;transform-origin:50% 100%;animation:cc-breathe 2.6s ease-in-out infinite}',
        '.cc-rabbit-ears,.ears>g{transform-box:fill-box;transform-origin:50% 100%}',
        '.ears>g:first-child{animation:cc-ear-l 4.6s ease-in-out infinite}.ears>g:last-child{animation:cc-ear-r 4.6s .3s ease-in-out infinite}',
        f'.carrot-hop{{animation:cc-c-hop {L} cubic-bezier(.3,.7,.3,1) infinite}}',
        f'.carrot-hide{{animation:cc-c-hide {L} cubic-bezier(.5,0,.3,1) infinite}}',
        '.leaves{transform-box:fill-box;transform-origin:50% 100%;animation:cc-leaf 3.6s ease-in-out infinite}',
        '.dashes{opacity:0;transform-box:fill-box;transform-origin:50% 100%}',
        f'.rabbit-dashes{{animation:cc-r-dash {L} ease-out infinite}}.carrot-dashes{{animation:cc-c-dash {L} ease-out infinite}}',
        '.fr-eyes,.fr-mouth,.fc-eyes,.fc-mouth{opacity:0}',
        '.fc-tapface{opacity:0}',
        f'.carrot-shadow{{animation:cc-c-shadow {L} ease-in-out infinite}}',
        '.mote{opacity:.55;animation:cc-mote 7s ease-in-out infinite}.mote--1{animation-delay:-2.3s}.mote--2{animation-delay:-4.6s}',
        '.sky-star{fill:#F4EEDF;animation:cc-twinkle 3.4s ease-in-out infinite}.sky-star:nth-child(2n){animation-delay:-1.7s}',
    ] + face_css
    kfs = [*r_kfs, c_hop, hide, c_shadow,
           dash('cc-r-dash', [(10.2, 12.0), (12.4, 14.6)]), dash('cc-c-dash', [(1.0, 2.6), (10.2, 12.2), (12.4, 14.6)]),
           '@keyframes cc-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.035,.965)}}',
           '@keyframes cc-ear-l{0%,70%,100%{transform:rotate(0)}78%{transform:rotate(-7deg)}86%{transform:rotate(3deg)}}',
           '@keyframes cc-ear-r{0%,64%,100%{transform:rotate(0)}72%{transform:rotate(8deg)}80%{transform:rotate(-3deg)}}',
           '@keyframes cc-leaf{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}',
           '@keyframes cc-mote{0%,100%{transform:translateY(0);opacity:.25}50%{transform:translateY(-14px);opacity:.7}}',
           '@keyframes cc-twinkle{0%,100%{opacity:.35}50%{opacity:1}}'] + face_kf
    reduced = ('@media (prefers-reduced-motion: reduce){'
               '.rabbit-walk,.rabbit-hop,.rabbit-squash,.rabbit-tilt,.rabbit-flip,.rabbit-shadow,.ears,.rabbit-breathe,.ears>g,.carrot-hop,.carrot-hide,.carrot-shadow,.leaves,.dashes,.rabbit-dashes,.carrot-dashes,.mote,.sky-star,'
               '.fr-eyes,.fr-mouth,.fc-eyes,.fc-mouth{animation:none!important}'
               '.fr-eyes--joy,.fr-mouth--crescent,.fc-eyes--sparkle,.fc-mouth--crescent{opacity:1}}')
    return ''.join(base) + ''.join(kfs) + reduced


# ---------------------------------------------------------------- outputs
def scoped_ids(svg, prefix):
    ids = set(re.findall(r'id="([^"]+)"', svg))
    for i in ids:
        svg = svg.replace(f'id="{i}"', f'id="{prefix}{i}"').replace(f'url(#{i})', f'url(#{prefix}{i})')
    return svg


def write_if_changed(path, text):
    """Atomic, no-op-safe write. Tests run build_brand.py while other tests read the same files in
    parallel; Path.write_text truncates first, so a concurrent reader could see an empty file
    (release 8b81767 failed this way). Skip identical content, otherwise replace via rename."""
    path = Path(path)
    if path.exists() and path.read_text() == text:
        return False
    tmp = path.with_name(f'.{path.name}.{os.getpid()}.tmp')
    tmp.write_text(text)
    os.replace(tmp, path)
    return True


def main():
    (ROOT / 'public/brand').mkdir(exist_ok=True)
    mark = mark_svg('cc', with_xmlns=True)
    write_if_changed(ROOT / 'public/brand/mark.svg', mark)
    write_if_changed(ROOT / 'public/favicon.svg', favicon_svg())
    write_if_changed(ROOT / 'public/carrot-mark.svg', carrot_mark_svg())
    footer = footer_svg()
    write_if_changed(ROOT / 'public/brand/footer-cave.svg', footer)
    # standalone <img> copies for the static voice readers: the site's scoped rules (props, flags, tap) are inlined here.
    lone = '<style>.prop,.news-flag,.tap-pop,.fc-tapface{display:none}.mouth-sky{fill:#2B3550}</style>'
    head_end = footer.index('>') + 1
    write_if_changed(ROOT / 'public/footer-rabbit-carrot-v3.svg', footer[:head_end] + lone + footer[head_end:])
    still = lone + ('<style>*{animation:none!important}.fr-eyes,.fr-mouth,.fc-eyes,.fc-mouth,.rabbit-dashes,.carrot-dashes{opacity:0}'
                    '.fr-eyes--joy,.fr-mouth--crescent,.fc-eyes--sparkle,.fc-mouth--crescent{opacity:1}</style>')
    write_if_changed(ROOT / 'public/footer-rabbit-carrot-static.svg', footer[:head_end] + still + footer[head_end:])
    buddy = buddy_svg()

    inner = lambda s: re.sub(r'^<svg[^>]*>|</svg>$', '', s)
    ts = ('// Generated by scripts/brand/build_brand.py from scripts/brand/glyphs.py. Do not edit by hand.\n'
          f'export const MARK_INNER = {json.dumps(inner(mark_svg("hd", hover=True)))};\n'
          f'export const MARK_SVG = {json.dumps(mark)};\n'
          f'export const OG_ART_SVG = {json.dumps(og_art_svg())};\n'
          f'export const BUDDY_INNER = {json.dumps(inner(buddy))};\n'
          f'export const STROKE = {G.STROKE};\n')
    write_if_changed(ROOT / 'lib/brand-svg.ts', ts)

    # voice readers: swap the whole <svg class="brand-mark"> element
    reader_mark = mark_svg('rd').replace('<svg viewBox="0 0 96 96">',
        '<svg class="brand-mark" viewBox="0 0 96 96" width="192" height="192" aria-hidden="true" focusable="false">')
    n = 0
    for f in sorted((ROOT / 'public/voices').glob('*/index*.html')):
        s = f.read_text()
        s2, k = re.subn(r'<svg class="brand-mark".*?</svg>', lambda _: reader_mark, s, count=1, flags=re.S)
        if k:
            write_if_changed(f, s2); n += 1
    print(f'brand: mark, favicon, carrot-mark, footer ({len(footer)//1024}KB), buddy, readers={n}')


if __name__ == '__main__':
    main()
