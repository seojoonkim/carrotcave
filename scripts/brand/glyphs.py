"""CarrotCave glyph + body system (shared by every brand asset). Copied from carrotcave-characters/build.py."""
import json
from pathlib import Path

NAVY = '#16324A'
CREAM, CREAM_SHADE = '#F4EEDF', '#E7DDC6'
MINT = '#14D3A0'
ORANGE, ORANGE_SHADE, GROOVE = '#FF7A3D', '#EE6A2F', '#E2622A'
LEAF, LEAF_SHADE = '#A6D36B', '#93C25A'
BG = '#FBF8F1'

# Stage themes. 'dark' uses the live CarrotCave dark tokens (--bg-0 #1e1f28, --bg-1 #252732,
# --surface-1 #303241, --bg-3 #343746, --ink-1 #eceef5).
THEMES = {
    'light': dict(bg=BG, label=NAVY, rsh='#D9EEE3', csh='#FADCCB', sheet_rsh='#E4EFE6', sheet_csh='#FBE3D5'),
    'dark':  dict(bg='#1E1F28', label='#ECEEF5', rsh='#14151C', csh='#14151C',
                  sheet_rsh='#2A2C38', sheet_csh='#2A2C38'),
}

# ---------- face parts: one glyph system ----------
# Every eye/mouth is drawn on the same grid with the same pen:
#   STROKE  = one line weight for every glyph (lines AND the rounded rim of solids)
#   EYE_R   = outer half-size of the eye box  (outer = geometry + STROKE/2)
#   MOUTH_W = outer half-width of the mouth box
# Solid shapes are drawn inset by STROKE/2 and painted with fill+stroke in the same colour,
# so every corner gets the same STROKE/2 rounding and the same outer box as line glyphs.
STROKE = 7
H = STROKE / 2          # 3.5
EYE_R = 14              # eye outer box 28 x 28
MOUTH_W = 15            # mouth outer width 30
ei = EYE_R - H          # 10.5 inner eye half-size
mi = MOUTH_W - H        # 11.5 inner mouth half-width


def line(d, kind):
    return (f'<path class="glyph" data-kind="{kind}" data-mode="line" d="{d}" fill="none" stroke="{NAVY}" '
            f'stroke-width="{STROKE}" stroke-linecap="round" stroke-linejoin="round"/>')


def solid(d, kind):
    return (f'<path class="glyph" data-kind="{kind}" data-mode="solid" d="{d}" fill="{NAVY}" stroke="{NAVY}" '
            f'stroke-width="{STROKE}" stroke-linecap="round" stroke-linejoin="round"/>')


def eye(kind, x, y, side):
    """side = -1 (left eye) / +1 (right eye)."""
    if kind == 'squint':   # flat-top triangle, apex down-inward
        return solid(f'M{x-ei} {y-6} L{x+ei} {y-6} L{x-3*side} {y+6} Z', kind)
    if kind == 'star':     # four-point sparkle
        r, k = ei, 1.6
        return solid(f'M{x} {y-r} Q{x+k} {y-k} {x+r} {y} Q{x+k} {y+k} {x} {y+r} '
                     f'Q{x-k} {y+k} {x-r} {y} Q{x-k} {y-k} {x} {y-r} Z', kind)
    if kind == 'plus':
        return line(f'M{x-ei} {y} L{x+ei} {y} M{x} {y-ei} L{x} {y+ei}', kind)
    if kind == 'heart':
        return solid(f'M{x} {y+8} C{x-ei-7} {y-2} {x-9} {y-ei-4} {x} {y-4} '
                     f'C{x+9} {y-ei-4} {x+ei+7} {y-2} {x} {y+8} Z', kind)
    if kind == 'wink':     # chevron pointing outward
        d = side
        return line(f'M{x-6*d} {y-ei+1} L{x+6*d} {y} L{x-6*d} {y+ei-1}', kind)
    if kind == 'lid':      # lid bar + half pupil (deadpan)
        return (line(f'M{x-ei} {y-6} L{x+ei} {y-6}', kind)
                + solid(f'M{x-6} {y-3} A6 6 0 0 0 {x+6} {y-3} Z', kind))
    if kind == 'joy':      # closed happy arc
        return line(f'M{x-ei} {y+4} Q{x} {y-12} {x+ei} {y+4}', kind)
    if kind == 'dot':
        return solid(f'M{x} {y-6.5} A5 6.5 0 1 1 {x} {y+6.5} A5 6.5 0 1 1 {x} {y-6.5} Z', kind)
    if kind == 'blink':
        return line(f'M{x-ei} {y} L{x+ei} {y}', kind)
    raise ValueError(kind)


def mouth(kind, x, y):
    if kind == 'bars':     # two stacked bars, squeezed shut
        return line(f'M{x-mi} {y-5} L{x+mi} {y-5} M{x-mi} {y+5} L{x+mi} {y+5}', kind)
    if kind == 'crescent':
        return solid(f'M{x-mi} {y-4} Q{x} {y+13} {x+mi} {y-4} Q{x} {y+3} {x-mi} {y-4} Z', kind)
    if kind == 'square':
        return solid(f'M{x-3.5} {y-3.5} L{x+3.5} {y-3.5} L{x+3.5} {y+3.5} L{x-3.5} {y+3.5} Z', kind)
    if kind == 'grin':     # open D grin
        return solid(f'M{x-mi} {y-6} L{x+mi} {y-6} Q{x+mi} {y+10} {x} {y+10} '
                     f'Q{x-mi} {y+10} {x-mi} {y-6} Z', kind)
    if kind == 'smirk':
        return line(f'M{x-mi+2} {y+1} Q{x+1} {y+4} {x+mi} {y-4}', kind)
    if kind == 'flat':
        return line(f'M{x-8} {y} L{x+8} {y}', kind)
    if kind == 'o':
        return solid(f'M{x} {y-3} A4 5.5 0 1 1 {x} {y+8} A4 5.5 0 1 1 {x} {y-3} Z', kind)
    raise ValueError(kind)


# expression = (left eye, right eye, mouth). Names borrowed from the reference set.
EXPR = {
    'cool':    ('squint', 'squint', 'bars'),     # mint cloud
    'sparkle': ('star', 'star', 'crescent'),     # red square
    'daze':    ('plus', 'plus', 'square'),       # purple cloud
    'love':    ('heart', 'wink', 'grin'),        # blue heart
    'meh':     ('lid', 'lid', 'smirk'),          # yellow arch
    'joy':     ('joy', 'joy', 'crescent'),
    'curious': ('dot', 'dot', 'o'),
    'blink':   ('blink', 'blink', None),         # mouth kept from current expression
}

# One face layout for every character: same scale, eye gap and eye->mouth distance.
FACE_SCALE = 1.4
FACE_GAP = 36
MOUTH_DY = 40


def face(expr, ex, ey):
    le, re_, m = EXPR[expr]
    mx, my = ex, ey + MOUTH_DY
    def S(svg, cx, cy, role):
        return (f'<g class="part" data-role="{role}" data-scale="{FACE_SCALE}" transform="translate({cx} {cy}) '
                f'scale({FACE_SCALE}) translate({-cx} {-cy})">{svg}</g>')
    parts = [S(eye(le, ex - FACE_GAP, ey, -1), ex - FACE_GAP, ey, 'eye'),
             S(eye(re_, ex + FACE_GAP, ey, 1), ex + FACE_GAP, ey, 'eye')]
    if m:
        parts.append(S(mouth(m, mx, my), mx, my, 'mouth'))
    return ''.join(parts)


# ---------- bodies (viewBox 0 0 240 280, ground at y=262) ----------
RABBIT_BODY = 'M34 214 C34 146 70 98 120 98 C170 98 206 146 206 214 C206 250 176 262 120 262 C64 262 34 250 34 214 Z'
RABBIT_FACE = dict(ex=120, ey=176)

def rabbit_svg(face_svg, ear_l=-7, ear_r=7, cid='r'):
    ears = (f'<g transform="rotate({ear_l} 96 140)"><rect x="70" y="8" width="50" height="140" rx="25" fill="{CREAM}"/>'
            f'<rect x="84" y="26" width="22" height="78" rx="11" fill="{MINT}"/></g>'
            f'<g transform="rotate({ear_r} 144 140)"><rect x="120" y="8" width="50" height="140" rx="25" fill="{CREAM}"/>'
            f'<rect x="134" y="26" width="22" height="78" rx="11" fill="{MINT}"/></g>')
    return (f'<clipPath id="{cid}-clip"><path d="{RABBIT_BODY}"/></clipPath>'
            f'<g class="ears">{ears}</g>'
            f'<path d="{RABBIT_BODY}" fill="{CREAM}"/>'
            f'<path d="M170 104 C214 140 214 228 168 262 L240 280 L240 90 Z" fill="{CREAM_SHADE}" opacity=".7" clip-path="url(#{cid}-clip)"/>'
            f'<g class="face">{face_svg}</g>')

CARROT_BODY = ('M46 128 C46 96 194 96 194 128 C194 176 158 232 128 258 '
               'C123 262 117 262 112 258 C82 232 46 176 46 128 Z')
CARROT_FACE = dict(ex=120, ey=144)

def carrot_svg(face_svg, cid='c'):
    leaves = (f'<g class="leaves">'
              f'<ellipse cx="94" cy="74" rx="16" ry="32" transform="rotate(-32 94 74)" fill="{LEAF}"/>'
              f'<ellipse cx="146" cy="74" rx="16" ry="32" transform="rotate(32 146 74)" fill="{LEAF}"/>'
              f'<ellipse cx="120" cy="64" rx="17" ry="38" fill="{LEAF}"/>'
              f'<ellipse cx="120" cy="92" rx="10" ry="8" fill="{LEAF_SHADE}"/></g>')
    grooves = (f'<g stroke="{GROOVE}" stroke-width="5" stroke-linecap="round" fill="none">'
               f'<path d="M84 214 Q94 212 102 215"/><path d="M152 200 Q144 198 136 201"/>'
               f'<path d="M110 240 Q116 238 121 240"/></g>')
    return (f'<clipPath id="{cid}-clip"><path d="{CARROT_BODY}"/></clipPath>'
            f'{leaves}<path d="{CARROT_BODY}" fill="{ORANGE}"/>'
            f'<path d="M150 104 C200 118 196 170 160 226 L240 280 L240 90 Z" fill="{ORANGE_SHADE}" '
            f'clip-path="url(#{cid}-clip)" opacity=".55"/>{grooves}'
            f'<g class="face">{face_svg}</g>')


def dashes(color, cx, top):
    return (f'<g class="dashes" stroke="{color}" stroke-width="7" stroke-linecap="round">'
            f'<path d="M{cx-26} {top+6} L{cx-36} {top-6}"/><path d="M{cx} {top} L{cx} {top-16}"/>'
            f'<path d="M{cx+26} {top+6} L{cx+36} {top-6}"/></g>')

