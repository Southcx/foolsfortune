"""THE AREA CARDS, PAINTED (the owner, 2026-10-25: loading screens that build anticipation, "stylish when done well"; "We can live with
low resolution!"): one small establishing shot an area of AREA_CARDS (src/vfx/areacards.js), what the place is, its light and one landmark,
in the hand of the feelings' skies (scripts/skypaint/: the same brushes, imported from painter.py). Each is laid in at 640 x 360, painted,
given the ragged brushed edge of a print (its alpha), and saved at 320 x 180 as webp (about q80) to src/assets/areacards/<id>.webp,
which the area wipe (vfx/areawipe.js) draws on its held cover. The palette of each card is its row's (sky, sun, far, near, ink), read
from areacards.js itself, so a row's colours changed there are the card's when it is painted again.

Two hands, as the skies:
  WATERCOLOUR  shapes laid as washes over warm paper: each pools darker at its rim, granulates where the pigment is heavy, its edge
               ragged where the water ran; the lights are the paper left (painter.paper, painter.granule, the rim of painter.wash).
  OIL          the scene laid in flat, then painted over in curved strokes coarse to fine along a stroke field (painter.strokes,
               Hertzmann 1998) and finished with the impasto and the canvas weave (painter.finish_oil).

Prior art: Okami's painted location cards (Clover, 2006: the ragged brush edge), Final Fantasy XII's area cards, the Ghibli background
painters' small establishing shots (Kazuo Oga), John Singer Sargent's and Winslow Homer's watercolour sketches (the reserved lights),
Turner's oil sketches (the lamp-lit interiors and dusks); Curtis et al. 1997 (the pooled rim), Hertzmann 1998 (the strokes).

  python3 scripts/areacards/paint.py [id ...]          paints the named cards (all when none)
  SHEET=/path.jpg python3 scripts/areacards/paint.py   also lays every card painted on one sheet to look at
"""
import os
import re
import sys
import time

import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, os.path.join(HERE, '..', 'skypaint'))
import painter as P  # noqa: E402
from painter import hexc, ss, fbm, blur  # noqa: E402

W, H = 640, 360                     # painted at twice the card
OUT_SIZE = (320, 180)
OUT = os.path.join(ROOT, 'src', 'assets', 'areacards')
QUALITY = 80
X = (np.arange(W) + 0.5) / W
Y = (np.arange(H) + 0.5) / H
U, V = np.meshgrid(X, Y)
U = U.astype(np.float32); V = V.astype(np.float32)
ASP = W / H
D = np.stack([U * ASP, V, np.zeros_like(U)], -1).astype(np.float32)   # (the brushes' noise space: about the sky painter's scale a pixel)


# ------------------------------------------------------------------ the rows' palettes, read from areacards.js
def rows():
    src = open(os.path.join(ROOT, 'src', 'vfx', 'areacards.js'), encoding='utf-8').read()
    out = {}
    pat = re.compile(r"^\s*(\w+): ROW\('((?:[^'\\]|\\.)*)', '([^']*)', '(\w+)', \['(#\w+)', '(#\w+)'\], '(#\w+)', '(#\w+)', '(#\w+)'(.*)$", re.M)
    for m in pat.finditer(src):
        id_, name, layer, motif, s0, s1, sun, far, near, rest = m.groups()
        ink = re.search(r"ink: '(#\w+)'", rest)
        out[id_] = dict(name=name, sky0=s0, sky1=s1, sun=sun, far=far, near=near, ink=ink.group(1) if ink else '#2a140c')
    return out


# ------------------------------------------------------------------ small helpers
def mix(a, b, t):
    a = hexc(a) if isinstance(a, str) else np.asarray(a, np.float32)
    b = hexc(b) if isinstance(b, str) else np.asarray(b, np.float32)
    return a * (1 - t) + b * t

def col(c):
    return hexc(c) if isinstance(c, str) else np.asarray(c, np.float32)

def n2(scale, seed, oct=4, sx=1.0, sy=1.0):
    return fbm(D * np.array([scale * sx, scale * sy, 1], np.float32), oct, seed=seed)

def under(yf, soft=0.004, rag=0.0, seed=0):
    """The ground under a line: 1 below y = yf(U) (fractions of the height), its edge softened and, given rag, wobbled."""
    y = yf(U) + (rag * n2(30, seed) if rag else 0)
    return ss(-soft, soft, V - y)

def ellipse(cx, cy, rx, ry, soft=0.006):
    d = np.sqrt(((U - cx) / rx) ** 2 + ((V - cy) / ry) ** 2)
    e = soft / min(rx, ry)
    return 1 - ss(1 - e, 1 + e, d)

def glow(cx, cy, r, sq=1.0):
    return np.exp(-(((U - cx) * ASP) ** 2 + ((V - cy) * sq) ** 2) / (r * r))

def rag(m, k=0.1, scale=40, seed=0, soft=0.12):
    """A wash's edge where the water ran: the mask's edge pushed in and out by noise."""
    b = blur(m, 1)
    return ss(0.5 - soft, 0.5 + soft, b + k * n2(scale, seed))

def vgrad(top, bot, y0=0.0, y1=1.0, gamma=1.0):
    t = np.clip((V - y0) / (y1 - y0), 0, 1) ** gamma
    return col(top) * (1 - t[..., None]) + col(bot) * t[..., None]


class Pen:
    """Shapes drawn at 3x on a grey mask (PIL), returned as a soft mask the card's size. Coordinates are fractions (u across, v down);
    widths are fractions of the height."""
    S = 3

    def __init__(self):
        self.im = Image.new('L', (W * self.S, H * self.S), 0); self.d = ImageDraw.Draw(self.im)

    def p(self, u, v): return (u * W * self.S, v * H * self.S)

    def poly(self, pts, a=255):
        self.d.polygon([self.p(*q) for q in pts], fill=a); return self

    def ell(self, cx, cy, rx, ry, a=255):
        (x0, y0), (x1, y1) = self.p(cx - rx, cy - ry), self.p(cx + rx, cy + ry); self.d.ellipse([x0, y0, x1, y1], fill=a); return self

    def ring(self, cx, cy, rx, ry, w, a=255, start=0, end=360):
        (x0, y0), (x1, y1) = self.p(cx - rx, cy - ry), self.p(cx + rx, cy + ry)
        self.d.arc([x0, y0, x1, y1], start, end, fill=a, width=max(1, int(w * H * self.S))); return self

    def line(self, pts, w0, w1=None, a=255):
        """A tapered stroke along pts, round at its joints."""
        w1 = w0 if w1 is None else w1; n = len(pts) - 1
        for i in range(n):
            w = (w0 + (w1 - w0) * (i + 0.5) / n) * H * self.S
            self.d.line([self.p(*pts[i]), self.p(*pts[i + 1])], fill=a, width=max(1, int(w + 0.5)))
            x, y = self.p(*pts[i + 1]); r = w / 2; self.d.ellipse([x - r, y - r, x + r, y + r], fill=a)
        x, y = self.p(*pts[0]); r = w0 * H * self.S / 2; self.d.ellipse([x - r, y - r, x + r, y + r], fill=a)
        return self

    def mask(self, soft=0.0):
        m = np.asarray(self.im.resize((W, H), Image.LANCZOS), np.float32) / 255
        return blur(m, int(soft)) if soft >= 1 else m


def curve(p0, p1, p2, n=12):
    """A quadratic Bezier's points."""
    t = np.linspace(0, 1, n)[:, None]; p0, p1, p2 = map(np.array, (p0, p1, p2))
    return [tuple(q) for q in ((1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t * t * p2)]


# ------------------------------------------------------------------ the card being painted
class Card:
    def __init__(self, pal, hand, seed):
        self.pal, self.hand, self.seed = pal, hand, seed
        self.img = np.ones((H, W, 3), np.float32) * hexc('#f4ecdc')
        self.grain = P.granule(D, seed + 50)
        self.grain2 = np.clip(0.6 * self.grain + 0.8 * fbm(D * 55, 2, seed=seed + 52), -1, 1)   # (granulation the card's size still shows)
        self.after = []; self.n = 0                                           # (marks laid over the oil once it is stroked)

    def lay(self, m, c, a=1.0, rim=0.5, gran=0.25, run=0.05):
        """A shape laid in: in watercolour a wash, its edge ragged where the water ran, pooling darker at its rim, uneven inside
        (the pigment settling) and granulating; in oil flat paint, its value broken a little (stroked later)."""
        self.n += 1
        c = col(c)
        if c.ndim == 1: c = np.broadcast_to(c, self.img.shape)
        if self.hand == 'water':
            if run: m = np.maximum(rag(m, k=run * 2.2, scale=28, seed=self.seed + self.n, soft=0.25) * ss(0.0, 0.08, blur(m, 2)), 0)
            # the brush's passes: the wash lighter and darker in bands along the stroke, and the paper showing where it skipped
            passes = fbm(D * np.array([1.5, 16, 1], np.float32), 3, seed=self.seed + self.n * 5)
            m = np.clip(m * a * (1 - 0.18 * ss(0.2, 0.7, passes)), 0, 1)
            edge = np.clip(m - blur(m, 3), 0, 1) * 3
            settle = fbm(D * 2.2, 3, seed=self.seed + self.n * 7)
            c = c * (1 - rim * 0.45 * np.clip(edge, 0, 1) + 0.12 * settle)[..., None]
            c = c * (1 - gran * 0.45 * self.grain2 * np.clip(m, 0, 1))[..., None]
        else:
            m = np.clip(m * a, 0, 1)
            c = c * (1 + 0.05 * fbm(D * 3, 2, seed=self.seed + self.n * 7))[..., None]
        self.img = self.img * (1 - m[..., None]) + c * m[..., None]
        return self

    def light(self, m, c, k=1.0):
        """Light added (a lamp, a sun's halo, a glow): never pooled."""
        self.img = self.img + col(c) * (m * k)[..., None]
        return self

    def shade(self, m, k=0.5, c='#000000'):
        self.img = self.img * (1 - (m * k)[..., None]) + col(c) * (m * k)[..., None]
        return self

    def later(self, fn): self.after.append(fn); return self

    # common pieces
    def sky(self, hy, clouds=0.0, cseed=1, ccol=None, gamma=0.9):
        p = self.pal
        self.img = vgrad(p['sky0'], p['sky1'], 0, hy, gamma)
        if clouds:
            Dh = D * np.array([1.2, 7, 1], np.float32)
            F = fbm(P.warp(Dh, 0.3, 0.8, cseed) * 1.6, 4, seed=cseed + 1)
            dens = ss(0.05, 0.3, F + clouds - 0.25) * ss(0.02, 0.12, V) * (1 - ss(hy - 0.12, hy, V))
            self.lay(dens, ccol if ccol is not None else mix(p['sky1'], p['sun'], 0.5), 0.55, rim=0.7, gran=0.4)
        return self

    def sun(self, x, y, r, halo=0.45, disc=True, c=None):
        c = c or self.pal['sun']
        self.light(glow(x, y, r * 6), c, halo * 0.6)
        self.light(glow(x, y, r * 2.2), c, halo)
        if disc: self.lay(ellipse(x, y, r / ASP, r, 0.004), mix(c, '#ffffff', 0.4), 1.0, rim=0.0, gran=0.0)
        return self

    def stars(self, n, top=0.45, seed=3):
        rng = np.random.default_rng(seed); pen = Pen()
        for _ in range(n):
            u, v = rng.random(), rng.random() ** 1.6 * top; r = rng.uniform(0.0015, 0.004)
            pen.ell(u, v, r / ASP, r)
        self.later(lambda c, m=pen.mask(): c.light(m, '#fff6e8', 0.85))
        return self


# ------------------------------------------------------------------ painting it: the two hands, then the print's ragged edge
def finish(card):
    rng = np.random.default_rng(card.seed)
    if card.hand == 'oil':
        th = card.field if hasattr(card, 'field') else 0.0
        th = th + 0.32 * fbm(D * 2.5, 3, seed=card.seed + 60) * np.pi
        fx, fy = np.cos(th).astype(np.float32), (np.sin(th) * 0.7).astype(np.float32)
        nrm = np.hypot(fx, fy) + 1e-6; fx, fy = fx / nrm, fy / nrm
        edge = np.clip(np.hypot(*np.gradient(blur(card.img.mean(-1), 1))) * 40, 0, 1)
        cv = P.strokes(card.img, fx, fy, [dict(w=12, len=6, step=5, jitter=0.06, bristles=4, stop=0.4),
                                          dict(w=6, len=7, step=4, jitter=0.04, bristles=3, stop=0.3),
                                          dict(w=3, len=5, step=2.5, jitter=0.03, bristles=2, stop=0.2, where=0.15 + 0.85 * edge)],
                       seed=card.seed + 70)
        card.img = P.finish_oil(cv, W, H, impasto=0.8, seed=card.seed)
    for fn in card.after: fn(card)
    if card.hand == 'water':
        card.img = card.img * 0.75 + blur(card.img, 1) * 0.25                       # (the wet edges bleed a hair)
        card.img = card.img * (1 + 0.05 * fbm(P.warp(D, 0.3, 1.5, card.seed + 90) * 3, 3, seed=card.seed + 91))[..., None]  # (blooms)
        _, tooth = P.paper(D * 1.0, '#f4ecdc')
        card.img = card.img * (1 - 0.07 * (0.5 + 0.5 * tooth))[..., None]
    # the print's ragged edge: a card's rounded rectangle, its rim torn by the brush's bristles where it ran off the paper
    x, y = (U - 0.5) * 2, (V - 0.5) * 2
    d = (np.abs(x) ** 9 + np.abs(y) ** 9) ** (1 / 9)
    bristle = fbm(D * np.array([1.5, 22, 1], np.float32), 3, seed=card.seed + 81)        # streaks along the stroke (across)
    bristle_v = fbm(D * np.array([22, 1.5, 1], np.float32), 3, seed=card.seed + 83)
    r = d + 0.03 * fbm(D * 6, 4, seed=card.seed + 80) + 0.012 * fbm(D * 30, 3, seed=card.seed + 82)
    r = r + 0.035 * bristle * ss(0.8, 1.0, np.abs(x)) + 0.025 * bristle_v * ss(0.8, 1.0, np.abs(y))
    alpha = 1 - ss(0.925, 0.945, r)
    pool = ss(0.84, 0.935, r) * alpha                                                    # the paint gathered at the rim, darker
    card.img = card.img * (1 - (0.22 if card.hand == 'water' else 0.14) * pool)[..., None]
    rgba = np.concatenate([np.clip(card.img, 0, 1), alpha[..., None]], -1)
    im = Image.fromarray((rgba * 255 + 0.5).astype(np.uint8), 'RGBA').resize(OUT_SIZE, Image.LANCZOS)
    return im


# ================================================================== THE CARDS
# Each recipe: (hand, function). The function lays the scene in on a Card; its landmark first in mind.

def weir(c):
    """The Weir: the oasis's pools under a high sun, its pier reaching out over the water, palms by the bank (a Sargent sketch)."""
    p = c.pal; hy = 0.5
    c.sky(hy, clouds=0.15, cseed=11).sun(0.78, 0.17, 0.035, 0.5)
    c.lay(rag(under(lambda u: 0.47 + 0.025 * np.sin(u * 6 + 1) + 0.012 * np.sin(u * 17)), seed=12), mix(p['far'], p['sky1'], 0.35), 0.9)
    c.lay(rag(under(lambda u: 0.56 + 0.03 * np.sin(u * 4.4 + 2.5) + 0.01 * np.sin(u * 13)), seed=13), p['far'], 0.95)
    c.lay(rag(under(lambda u: 0.63 + 0.02 * np.sin(u * 3 + 0.5)), seed=14), mix(p['far'], p['near'], 0.5), 1)
    # the pools: the sky's colour come down into teal, a bright band where the far bank meets them
    pool = rag(ellipse(0.42, 0.75, 0.33, 0.085) + ellipse(0.82, 0.69, 0.15, 0.035), k=0.06, seed=15)
    water = vgrad(mix(p['sky1'], '#4f8fa0', 0.45), '#2f6f88', 0.66, 0.86)
    c.lay(pool, water, 1, rim=0.9, gran=0.1)
    c.light(pool * ss(0.03, 0.0, np.abs(V - 0.705 - 0.01 * np.sin(U * 30))) , '#ffffff', 0.25)
    # the pier: a deck run out from the left bank, its posts in the water, their reflections broken
    pen = Pen().poly([(0.0, 0.705), (0.5, 0.735), (0.5, 0.745), (0.0, 0.73)])
    for k in range(9):
        u = 0.03 + k * 0.058; pen.line([(u, 0.71 + k * 0.003), (u, 0.79 + k * 0.004)], 0.008)
    c.lay(pen.mask(), mix(p['ink'], p['near'], 0.25), 1, rim=0.3)
    refl = Pen()
    for k in range(9):
        u = 0.03 + k * 0.058; refl.line([(u, 0.8 + k * 0.004), (u + 0.003, 0.84 + k * 0.004)], 0.006)
    c.lay(refl.mask() * (0.5 + 0.5 * ss(-0.2, 0.4, n2(80, 16, sx=0.2))), '#244a5a', 0.5)
    # palms by the bank
    for (x, y, h, lean) in [(0.17, 0.705, 0.34, 0.03), (0.25, 0.7, 0.27, -0.02), (0.9, 0.675, 0.3, -0.03), (0.66, 0.69, 0.2, 0.02)]:
        top = (x + lean, y - h); pen = Pen().line(curve((x, y), (x + lean * 0.2 + 0.01, y - h * 0.5), top, 10), 0.012, 0.006)
        c.lay(pen.mask(), mix(p['ink'], p['near'], 0.35), 1, rim=0.2)
        fr = Pen()
        for k in range(7):
            a = np.pi * (-0.05 - k * 0.15); L = 0.075 + 0.02 * (k % 2)
            end = (top[0] + np.cos(a) * L / ASP * 1.8, top[1] + np.sin(a) * L * 0.6 + 0.05)
            mid = (top[0] + np.cos(a) * L / ASP, top[1] + np.sin(a) * L - 0.01)
            fr.line(curve(top, mid, end, 8), 0.016, 0.003)
        c.lay(rag(fr.mask(), k=0.05, scale=90, seed=17), '#3f5f34', 1, rim=0.8, gran=0.5)
    # reeds and the near sand
    reeds = Pen(); rng = np.random.default_rng(18)
    for _ in range(40):
        u = rng.choice([rng.uniform(0.08, 0.3), rng.uniform(0.58, 0.76)]); v = 0.8 + rng.uniform(-0.01, 0.03)
        reeds.line([(u, v), (u + rng.uniform(-0.01, 0.01), v - rng.uniform(0.04, 0.09))], 0.005, 0.001)
    c.lay(reeds.mask(), '#5a6a32', 0.9, rim=0.2)
    c.lay(rag(under(lambda u: 0.86 + 0.025 * np.sin(u * 5 + 1.3)), seed=19), p['near'], 1, gran=0.6)


def shore(c):
    """The shore: the Dunes running down to the Emocean, the waterline's foam, the jetty out over the Lachryma sea (Homer's coast)."""
    p = c.pal; hy = 0.47
    c.sky(hy, clouds=0.25, cseed=21).sun(0.28, 0.2, 0.032, 0.55)
    c.lay(rag(under(lambda u: hy - 0.02 * ss(0.0, 0.2, 0.2 - np.abs(u - 0.82)) * 2), seed=22), mix(p['far'], p['sky1'], 0.5), 0.7)
    sea = under(lambda u: hy, 0.002)
    c.lay(sea, vgrad(mix(p['far'], p['sky1'], 0.45), mix(p['far'], '#1e4a60', 0.4), hy, 0.72), 1, rim=0.2)
    # the sun's road on the water, and the Lachryma's schiller in its swells (teal, rose, gold)
    road = ss(0.06, 0.0, np.abs(U - 0.28) - (V - hy) * 0.25) * sea * ss(0.1, 0.5, n2(70, 23, sx=0.15, sy=3))
    c.light(road, '#fff4dc', 0.6)
    for k, (cc, s) in enumerate([('#5fd0c0', 24), ('#e88ac0', 25), ('#ffd36a', 26)]):
        c.light(sea * ss(0.32, 0.45, n2(25, s, sx=0.25, sy=4)) * ss(hy, hy + 0.2, V), cc, 0.22)
    wl = lambda u: 0.68 + 0.02 * np.sin(u * 5 + 0.7) + 0.008 * np.sin(u * 19)
    c.lay(rag(under(lambda u: wl(u) - 0.004), seed=27), '#e9f2ee', 0.9, rim=0.2)            # (the foam)
    c.lay(rag(under(wl), seed=28), mix(p['near'], '#6a5a4a', 0.35), 1, gran=0.5)           # (the wet sand)
    c.lay(rag(under(lambda u: wl(u) + 0.035), seed=29), p['near'], 1, gran=0.6)
    # the jetty: from the near right out over the water, its posts stepping down into it
    pen = Pen().poly([(1.02, 0.84), (0.6, 0.6), (0.6, 0.607), (1.02, 0.875)])
    for k in range(11):
        t = k / 10; u = 1.0 - 0.38 * t; v = 0.86 - 0.25 * t; w = 0.012 * (1 - t * 0.6)
        pen.line([(u, v), (u, v + 0.07 * (1 - t * 0.6) + 0.02)], w)
    c.lay(pen.mask(), mix(p['ink'], '#4a3a30', 0.3), 1, rim=0.4)
    c.lay(Pen().line([(0.6, 0.6), (0.6, 0.53)], 0.007).ell(0.6, 0.525, 0.006, 0.01).mask(), p['ink'], 1)   # (the jetty's lamp post)
    c.light(glow(0.6, 0.525, 0.02), '#ffd36a', 0.8)


def ridges(c):
    """The crystal ridges: Lachrymite standing on the dune crests at a violet dusk, each crystal lit on one face, its glow on the sand."""
    p = c.pal; hy = 0.55
    c.sky(hy, clouds=0.1, cseed=31, ccol=mix(p['sky0'], p['sun'], 0.4)).sun(0.5, 0.47, 0.06, 0.5, disc=False)
    def dune(base, amp, freq, ph):
        return lambda u: base - amp * (1 - np.abs(np.sin(u * freq + ph))) ** 1.6
    layers = [(dune(0.58, 0.07, 3.2, 0.4), mix(p['far'], p['sky1'], 0.55)), (dune(0.7, 0.12, 2.6, 1.9), mix(p['near'], p['far'], 0.4)),
              (dune(0.86, 0.14, 2.2, 0.2), p['near'])]
    for i, (f, cc) in enumerate(layers):
        m = under(f, 0.003)
        c.lay(m, cc, 1)
        # the shadow side of each crest (the sun ahead, low: the slope that faces away goes dark)
        g = np.gradient(f(X))[None, :] * np.ones((H, 1))
        c.shade(m * ss(0.0, 0.004, g) * ss(0.0, 0.1, V - f(U)) * (1 - ss(0.15, 0.3, V - f(U))), 0.35, mix(p['far'], '#20102a', 0.5))
    rng = np.random.default_rng(32)
    for (u0, f, scale) in [(0.2, layers[1][0], 1.0), (0.66, layers[1][0], 1.1), (0.86, layers[0][0], 0.6), (0.4, layers[2][0], 1.9), (0.06, layers[0][0], 0.55)]:
        crest = float(f(np.array([u0]))[0])
        body, lit = Pen(), Pen()
        for k in range(rng.integers(3, 6)):
            x = u0 + rng.uniform(-0.04, 0.04) * scale; h = rng.uniform(0.07, 0.2) * scale; w = rng.uniform(0.012, 0.022) * scale
            lean = rng.uniform(-0.25, 0.25); top = (x + lean * h / ASP, crest - h)
            body.poly([(x - w, crest + 0.01), top, (x + w, crest + 0.01)])
            lit.poly([top, (x + w, crest + 0.01), (x + w * 0.15, crest + 0.01)])
        c.light(glow(u0, crest - 0.06 * scale, 0.09 * scale), p['sun'], 0.35)
        c.lay(body.mask(), p['far'], 1)
        c.lay(lit.mask(), mix(p['far'], p['sun'], 0.65), 1)
        c.later(lambda cd, m=lit.mask(): cd.light(m, p['sun'], 0.12))


def flats(c):
    """The Gnomon flats: the pale spire on the open sand, its long shadow keeping the hour; the Great Dunemaw's mouth open beside it."""
    p = c.pal; hy = 0.58
    c.sky(hy, clouds=0.18, cseed=41).sun(0.13, 0.44, 0.04, 0.6)
    c.lay(under(lambda u: hy - 0.02 * np.exp(-((u - 0.85) / 0.08) ** 2) - 0.012 * np.exp(-((u - 0.4) / 0.1) ** 2), 0.003), mix(p['far'], p['sky1'], 0.45))
    c.lay(under(lambda u: hy + 0.012 + 0.004 * np.sin(u * 9), 0.003), vgrad(mix(p['near'], p['sky1'], 0.35), p['near'], hy, 1.0))
    c.shade(ss(0.4, 0.6, n2(18, 42, sx=0.15, sy=5)) * ss(hy + 0.01, hy + 0.1, V), 0.08, p['far'])       # (the sand's ripples)
    # the mouth: a dark ellipse let into the sand, its rim lifted, a cold light down in it
    c.lay(ellipse(0.3, 0.76, 0.15, 0.045), mix(p['near'], '#fff0c8', 0.35), 1)
    c.lay(ellipse(0.3, 0.765, 0.125, 0.033), '#1a0e20', 1)
    c.light(ellipse(0.3, 0.775, 0.09, 0.016, 0.02), '#7fdcff', 0.35)
    # the Gnomon's shadow, raked long away from the low sun, and the spire itself
    gx = 0.64
    sh = Pen().poly([(gx - 0.014, 0.665), (1.05, 0.84), (1.05, 0.93), (gx + 0.016, 0.667)]).mask(1)
    c.shade(sh, 0.6, mix(p['far'], '#4a2a20', 0.4)); c.later(lambda cd: cd.shade(sh, 0.3, mix(p['far'], '#4a2a20', 0.4)))
    sp = Pen().poly([(gx - 0.016, 0.665), (gx - 0.002, 0.08), (gx + 0.002, 0.08), (gx + 0.016, 0.665)])
    lit = Pen().poly([(gx - 0.016, 0.665), (gx - 0.002, 0.08), (gx, 0.08), (gx - 0.002, 0.665)])
    c.lay(sp.mask(), mix('#e8dcc8', p['far'], 0.3), 1)
    c.lay(lit.mask(), '#fbf2e2', 1)
    c.later(lambda cd: cd.lay(sp.mask(), mix('#e8dcc8', p['far'], 0.35), 0.55).lay(lit.mask(), '#fff6e6', 0.6))
    c.field = 0.0


def ruins(c):
    """The ruins at dusk: broken arches and columns against a rose horizon, the Lantern Wisps lit and drifting between them."""
    p = c.pal; hy = 0.62
    c.sky(hy, clouds=0.12, cseed=51, ccol=mix(p['sky0'], p['sky1'], 0.6)).sun(0.8, 0.2, 0.03, 0.4, c=p['sun']).stars(40, 0.35, 52)
    c.lay(rag(under(lambda u: 0.6 + 0.03 * np.sin(u * 5 + 2)), seed=53), mix(p['far'], p['sky1'], 0.35), 0.9)
    stone = mix(p['far'], p['ink'], 0.25)
    pen, rim = Pen(), Pen()
    def arch(x, w, h, base=0.72, round_=False):
        y = base
        pen.poly([(x, y), (x, y - h), (x + w * 0.2, y - h), (x + w * 0.2, y)])
        pen.poly([(x + w * 0.8, y), (x + w * 0.8, y - h), (x + w, y - h), (x + w, y)])
        if round_:
            pen.ring(x + w / 2, y - h, w / 2 * 0.98, w * ASP * 0.32, w * 0.22 * ASP * 0.8, start=180, end=360)
        else:
            pen.poly([(x - w * 0.05, y - h), (x + w * 1.05, y - h - w * 0.02), (x + w * 1.0, y - h - w * 0.2), (x, y - h - w * 0.18)])
        rim.poly([(x, y), (x, y - h), (x + w * 0.04, y - h), (x + w * 0.04, y)])
    arch(0.1, 0.24, 0.32); arch(0.66, 0.16, 0.22, 0.71, round_=True)
    rng = np.random.default_rng(54)
    for k in range(5):
        x = 0.4 + k * 0.045 + rng.uniform(-0.01, 0.01); h = rng.uniform(0.06, 0.24); w = 0.022
        pen.poly([(x, 0.72), (x, 0.72 - h), (x + w * 0.4, 0.72 - h - 0.012), (x + w, 0.72 - h + 0.005), (x + w, 0.72)])
    pen.poly([(0.89, 0.72), (0.905, 0.3), (0.92, 0.72)])           # (an obelisk)
    c.lay(pen.mask(), stone, 1, rim=0.6)
    c.lay(rim.mask(), mix(stone, p['sky1'], 0.45), 0.8)
    c.lay(rag(under(lambda u: 0.72 + 0.01 * np.sin(u * 9)), seed=55), mix(p['near'], p['far'], 0.4), 1)
    c.lay(rag(under(lambda u: 0.84 + 0.025 * np.sin(u * 4 + 1)), seed=56), p['near'], 1, gran=0.6)
    for (x, y, r) in [(0.22, 0.48, 0.022), (0.5, 0.42, 0.018), (0.58, 0.56, 0.014), (0.74, 0.47, 0.016), (0.36, 0.6, 0.012)]:
        c.later(lambda cd, x=x, y=y, r=r: cd.light(glow(x, y, r * 4), '#ff9a3a', 0.45).light(glow(x, y + r * 0.6, r * 1.5, 0.7), '#ffd68c', 1.0)
                .lay(ellipse(x, y, r * 0.35 / ASP * 1.6, r * 0.55), '#fff6dc', 1, rim=0, gran=0))


def workshop(c):
    """The workshop: the kiln's mouth burning in a clay room at night, its light on the floor, pots on the shelves (a Turner interior)."""
    p = c.pal
    c.img = vgrad(p['sky0'], p['sky1'], 0.0, 0.9, 1.3) * 0.55
    c.shade(ss(0.45, 0.5, np.abs(np.sin(V * 60 + np.floor(V * 60 / np.pi) * 0.0))) * 0.6, 0.12, p['ink'])  # (the brick courses)
    c.lay(Pen().poly([(0, 0.07), (1, 0.03), (1, 0.1), (0, 0.13)]).mask(), mix(p['ink'], p['far'], 0.4), 1)  # (a beam)
    c.lay(under(lambda u: 0.8 + 0.0 * u, 0.002), vgrad(p['far'], p['ink'], 0.8, 1.0), 1)
    # shelves of pots, left and right
    sh = Pen(); pots = Pen(); rng = np.random.default_rng(61)
    for (x0, x1) in [(0.0, 0.2), (0.82, 1.0)]:
        for yy in (0.36, 0.56):
            sh.poly([(x0, yy), (x1, yy), (x1, yy + 0.015), (x0, yy + 0.015)])
            x = x0 + 0.02
            while x < x1 - 0.03:
                w = rng.uniform(0.018, 0.03); h = rng.uniform(0.06, 0.12)
                pots.ell(x + w / 2 / ASP * 2, yy - h * 0.45, w, h * 0.45).poly([(x + w * 0.6, yy - h * 0.8), (x + w * 0.6, yy - h * 1.05), (x + w * 1.4, yy - h * 1.05), (x + w * 1.4, yy - h * 0.8)])
                x += w * 2.4
    c.lay(sh.mask(), mix(p['far'], p['ink'], 0.4), 1).lay(pots.mask(), mix(p['far'], p['sun'], 0.3), 1)
    c.shade(pots.mask() * ss(0.0, 0.5, np.abs(U - 0.5)), 0.2, p['ink'])
    # the kiln: a clay dome with its chimney, its arched mouth burning
    k = Pen().poly([(0.27, 0.82), (0.27, 0.52), (0.3, 0.4), (0.38, 0.31), (0.5, 0.28), (0.62, 0.31), (0.7, 0.4), (0.73, 0.52), (0.73, 0.82)])
    k.poly([(0.66, 0.36), (0.66, 0.0), (0.72, 0.0), (0.72, 0.45)])
    c.lay(k.mask(), vgrad(mix(p['far'], '#b8683a', 0.55), mix(p['far'], '#d88a4a', 0.6), 0.3, 0.8), 1)
    c.shade(k.mask() * ss(0.45, 0.75, U), 0.45, p['ink'])
    c.shade(ss(0.25, 0.0, V) * (1 - k.mask()), 0.5, p['ink'])
    mouth = Pen().poly([(0.43, 0.82), (0.43, 0.66)]).ring(0.5, 0.66, 0.07, 0.11, 0.0)
    mouth = Pen().poly([(0.43, 0.82), (0.43, 0.65), (0.57, 0.65), (0.57, 0.82)]).ell(0.5, 0.65, 0.07, 0.11)
    m = mouth.mask()
    c.lay(m, vgrad('#ffe6a0', p['sun'], 0.55, 0.82), 1)
    c.later(lambda cd: cd.light(glow(0.5, 0.72, 0.18), p['sun'], 0.55).light(glow(0.5, 0.86, 0.22, 2.5), p['sun'], 0.35)
            .light(m * glow(0.5, 0.7, 0.08), '#fff4d0', 0.6))
    em = Pen(); rng = np.random.default_rng(62)
    for _ in range(26):
        u, v = 0.5 + rng.normal(0, 0.06), 0.6 - rng.random() * 0.5; r = rng.uniform(0.002, 0.005); em.ell(u, v, r / ASP, r)
    c.later(lambda cd, em=em.mask(): cd.light(em, '#ffc070', 0.9))
    c.field = 0.0


def hub(c):
    """The basement's hub: the Index on its plinth under the Gate's three glazed hoops turning round their pale sphere, brick arches."""
    p = c.pal
    c.img = vgrad(p['sky0'], p['sky1'], 0.0, 0.78, 1.0)
    ar = Pen()
    for k, x in enumerate([0.02, 0.24, 0.66, 0.88]):
        ar.poly([(x, 0.78), (x, 0.42), (x + 0.1, 0.42), (x + 0.1, 0.78)]).ell(x + 0.05, 0.42, 0.05, 0.09)
    c.lay(ar.mask(), mix(p['sky0'], '#000000', 0.4), 1)
    for x in [0.07, 0.29, 0.71, 0.93]: c.light(glow(x, 0.5, 0.035), '#ffb46a', 0.3)
    c.lay(under(lambda u: 0.78, 0.002), vgrad(mix(p['near'], p['sky1'], 0.4), p['near'], 0.78, 1.0), 1)
    c.lay(ellipse(0.5, 0.86, 0.3, 0.06), mix(p['near'], p['far'], 0.3), 1)
    c.later(lambda cd: cd.light(Pen().ring(0.5, 0.86, 0.3, 0.06, 0.006).mask(1), p['far'], 0.5))
    # the Index: a plinth with its lit face
    c.lay(Pen().poly([(0.44, 0.86), (0.46, 0.7), (0.54, 0.7), (0.56, 0.86)]).mask(), mix(p['ink'], p['far'], 0.2), 1)
    c.lay(Pen().poly([(0.465, 0.715), (0.535, 0.715), (0.53, 0.76), (0.47, 0.76)]).mask(), '#9fd8c0', 1)
    c.light(glow(0.5, 0.74, 0.05), '#9fd8c0', 0.35)
    c.light(glow(0.5, 0.36, 0.3), p['sun'], 0.18)
    def hoops(cd):
        cd.light(glow(0.5, 0.36, 0.06), '#fff2dc', 0.8)
        cd.lay(ellipse(0.5, 0.36, 0.035 / ASP * 1.0, 0.035), p['sun'], 1, rim=0, gran=0)
        for (cc, rx, ry, rot) in [('#8fb59c', 0.2, 0.1, 0.0), ('#ece2d2', 0.16, 0.17, 0.0), ('#7a9450', 0.12, 0.26, 0.0)]:
            th = np.linspace(0, 2 * np.pi, 80); a = {'#8fb59c': 0.25, '#ece2d2': -0.5, '#7a9450': 0.9}[cc]
            xs, ys = np.cos(th) * rx / ASP * 1.6, np.sin(th) * ry
            pts = [(0.5 + xx * np.cos(a) - yy * np.sin(a) / ASP, 0.36 + xx * np.sin(a) * ASP * 0.5 + yy * np.cos(a)) for xx, yy in zip(xs, ys)]
            m = Pen().line(pts, 0.012).mask()
            cd.lay(m, cc, 1, rim=0, gran=0).light(blur(m, 3), cc, 0.25)
    c.later(hoops)
    c.field = 0.0


def siege(c):
    """The siege: the god hand's arena, a round sunken floor walled in tiers, a ward's circle burning on it, the hand above."""
    p = c.pal
    c.img = vgrad(p['sky0'], p['sky1'], 0.0, 0.85, 1.0)
    for k, (yy, cc) in enumerate([(0.42, mix(p['far'], p['sky1'], 0.3)), (0.52, p['far']), (0.6, mix(p['far'], p['near'], 0.5))]):
        c.lay(ellipse(0.5, 0.95, 0.75 - k * 0.06, 0.95 - yy, 0.004), cc, 1)
        m = Pen()
        for j in range(18):
            u = 0.04 + j * 0.054; m.poly([(u, yy + 0.05 + 0.04 * ((u - 0.5) ** 2) * 4 - 0.03), (u + 0.02, yy + 0.05 + 0.04 * ((u - 0.5) ** 2) * 4 - 0.03), (u + 0.02, yy + 0.08), (u, yy + 0.08)])
        c.shade(m.mask() * ellipse(0.5, 0.95, 0.75 - k * 0.06, 0.95 - yy, 0.004), 0.25, p['ink'])
        c.later(lambda cd, k=k, yy=yy: cd.light(Pen().ring(0.5, 0.95, 0.75 - k * 0.06, 0.95 - yy, 0.005, start=180, end=360).mask(1), p['sun'], 0.35 - k * 0.05))
    c.lay(ellipse(0.5, 0.82, 0.4, 0.12), mix(p['near'], '#5a2a20', 0.4), 1)
    def ward(cd):
        r = Pen().ring(0.5, 0.82, 0.3, 0.085, 0.008)
        pts = [(0.5 + 0.3 * np.cos(-np.pi / 2 + k * 4 * np.pi / 7), 0.82 + 0.085 * np.sin(-np.pi / 2 + k * 4 * np.pi / 7)) for k in range(8)]
        r.line(pts, 0.004)
        m = r.mask()
        cd.light(blur(m, 4), p['sun'], 0.6).lay(m, '#ffd0a0', 0.9, rim=0, gran=0)
        cd.light(glow(0.5, 0.82, 0.28, 3.5), p['sun'], 0.25)
    c.later(ward)
    # the god hand, open, fingers down, over the arena
    hp = Pen(); cx, cy = 0.5, 0.2
    hp.ell(cx, cy, 0.075, 0.12)
    for k, (dx, L) in enumerate([(-0.05, 0.14), (-0.017, 0.17), (0.017, 0.165), (0.05, 0.13)]):
        hp.line([(cx + dx, cy + 0.04), (cx + dx * 1.15, cy + 0.04 + L)], 0.05, 0.04)
    hp.line([(cx - 0.065, cy - 0.02), (cx - 0.12, cy + 0.08)], 0.055, 0.045)
    m = hp.mask(1)
    c.lay(m, mix('#e8d2b8', p['sky1'], 0.35), 0.9)
    c.shade(m * ss(0.0, 0.08, U - cx), 0.25, p['ink'])
    c.later(lambda cd: cd.light(glow(cx, cy + 0.12, 0.2), '#ffe0c0', 0.12))
    em = Pen(); rng = np.random.default_rng(71)
    for _ in range(30):
        u, v = rng.uniform(0.1, 0.9), rng.uniform(0.35, 0.8); r = rng.uniform(0.002, 0.004); em.ell(u, v, r / ASP, r)
    c.later(lambda cd, em=em.mask(): cd.light(em, '#ff9a5a', 0.9))
    c.field = 0.0


def raceway(c):
    """The Raceway park: the sand track curving off to the mesas under a clean sky, its start arch, the gold sun plates, a coaster loop."""
    p = c.pal; hy = 0.5
    c.sky(hy, clouds=0.3, cseed=81).sun(0.2, 0.15, 0.03, 0.45)
    mesa = Pen()
    for (x, w, h) in [(0.05, 0.12, 0.08), (0.3, 0.06, 0.05), (0.62, 0.18, 0.1), (0.85, 0.1, 0.06)]:
        mesa.poly([(x - 0.02, hy + 0.01), (x, hy - h), (x + w, hy - h - 0.005), (x + w + 0.025, hy + 0.01)])
    c.lay(rag(mesa.mask(), k=0.05, seed=82), mix(p['far'], p['sky1'], 0.45), 0.95)
    c.lay(rag(under(lambda u: hy + 0.005 + 0.01 * np.sin(u * 7)), seed=83), mix(p['near'], p['far'], 0.3), 1, gran=0.5)
    # the track: a pale ribbon from under the eye curving away to the horizon
    t = np.linspace(0, 1, 40)
    cx = 0.5 + 0.25 * np.sin(t * 2.8 + 0.3) * (1 - t) - 0.05 * t
    cy = 1.02 - (1.02 - (hy + 0.03)) * (1 - (1 - t) ** 1.6)
    hw = 0.22 * (1 - t) ** 1.4 + 0.006
    left = [(x - w, y) for x, y, w in zip(cx, cy, hw)]; right = [(x + w, y) for x, y, w in zip(cx, cy, hw)]
    tr = Pen().poly(left + right[::-1]).mask()
    c.lay(tr, mix('#f2dcb0', p['near'], 0.25), 1, rim=0.6)
    edges = Pen()
    for i in range(0, 39, 2):
        for s in (left, right):
            r = 0.006 * (1 - t[i]) + 0.0015; edges.ell(s[i][0], s[i][1], r / ASP * 1.4, r)
    c.later(lambda cd, m=edges.mask(): cd.light(m, '#ffe28a', 0.7).light(blur(m, 3), '#ffd36a', 0.3))
    pl = Pen()
    for i in (4, 12, 20):
        w = hw[i] * 0.5; x, y = cx[i], cy[i]; d = 0.035 * (1 - t[i])
        pl.line([(x - w, y + d), (x, y), (x + w, y + d)], 0.012 * (1 - t[i]) + 0.003)
    c.lay(pl.mask(), '#e8a83a', 1, rim=0.2)
    # the start arch over the track
    i = 9; x, y, w = cx[i], cy[i], hw[i] * 1.25
    arch = Pen().line([(x - w, y), (x - w, y - 0.2)], 0.014).line([(x + w, y), (x + w, y - 0.2)], 0.014).poly([(x - w - 0.01, y - 0.2), (x + w + 0.01, y - 0.2), (x + w + 0.01, y - 0.225), (x - w - 0.01, y - 0.225)])
    c.lay(arch.mask(), mix(p['ink'], '#7a4a2a', 0.3), 1)
    for k in range(5):
        lx = x - w * 0.6 + k * w * 0.3
        c.later(lambda cd, lx=lx, y=y, k=k: cd.light(glow(lx, y - 0.212, 0.008), '#ff5a3a' if k < 3 else '#ffd36a', 0.9))
    # a coaster loop on the right, its rail a lajvardina blue
    lp = Pen().ring(0.86, 0.36, 0.07, 0.12, 0.01).line([(0.82, 0.5), (0.82, 0.58)], 0.006).line([(0.9, 0.5), (0.9, 0.58)], 0.006).line(curve((0.86, 0.48), (0.95, 0.5), (1.02, 0.42)), 0.009)
    c.lay(lp.mask(), '#2a4a8a', 1, rim=0.3)
    c.lay(rag(under(lambda u: 0.93 + 0.02 * np.sin(u * 5)), seed=84) * (1 - tr), p['near'], 1, gran=0.6)


def bazaar(c):
    """Raku's Bazaar: the clay dome lit at night in gold, rose and cyan neon, lanterns strung over the way in, the wheel of fortune."""
    p = c.pal; hy = 0.72
    c.img = vgrad(p['sky0'], p['sky1'], 0.0, hy, 1.0)
    c.stars(30, 0.3, 91)
    c.light(glow(0.5, 0.6, 0.35), p['sun'], 0.25)
    dome = ellipse(0.5, 0.72, 0.34, 0.42, 0.003) * (V < 0.72)
    c.lay(dome, vgrad(mix(p['far'], p['sun'], 0.25), p['far'], 0.3, 0.72), 1)
    c.shade(dome * ss(0.5, 0.82, U), 0.3, p['ink'])
    c.lay(Pen().poly([(0.48, 0.33), (0.5, 0.22), (0.52, 0.33)]).mask(), '#d8a840', 1)           # (its finial)
    c.lay(under(lambda u: 0.72, 0.002), vgrad(p['near'], mix(p['near'], '#000000', 0.4), 0.72, 1.0), 1)
    gate = Pen().poly([(0.44, 0.72), (0.44, 0.6), (0.56, 0.6), (0.56, 0.72)]).ell(0.5, 0.6, 0.06, 0.08).mask()
    c.lay(gate, vgrad('#fff0c0', p['sun'], 0.52, 0.72), 1)
    def neon(cd):
        for k, (yy, cc) in enumerate([(0.46, '#ffd36a'), (0.53, '#d91a80'), (0.6, '#0a8cbf')]):
            half = np.sqrt(max(0.0, 1 - ((0.72 - yy) / 0.42) ** 2)) * 0.34
            m = Pen().line(curve((0.5 - half, yy), (0.5, yy + 0.03), (0.5 + half, yy)), 0.01).mask() * (1 - gate)
            cd.light(blur(m, 4), cc, 0.8).lay(m, mix(cc, '#ffffff', 0.45), 1, rim=0, gran=0)
        cd.light(glow(0.5, 0.75, 0.12, 3), p['sun'], 0.6)
        for (y0, sag, ph) in [(0.12, 0.08, 0), (0.22, 0.06, 1)]:
            pts = curve((-0.02, y0), (0.5, y0 + sag * 2), (1.02, y0), 20)
            cd.lay(Pen().line(pts, 0.003).mask(), p['ink'], 0.7, rim=0, gran=0)
            for j, (x, y) in enumerate(pts[1:-1:2]):
                cc = ['#ffd36a', '#ff6a5a', '#7adcff'][(j + ph) % 3]
                cd.light(glow(x, y + 0.012, 0.012), cc, 0.9)
        wm = Pen().ring(0.87, 0.55, 0.06, 0.1, 0.008)
        for a in np.linspace(0, np.pi, 4, endpoint=False):
            wm.line([(0.87 - np.cos(a) * 0.06, 0.55 - np.sin(a) * 0.1), (0.87 + np.cos(a) * 0.06, 0.55 + np.sin(a) * 0.1)], 0.004)
        wm.line([(0.87, 0.55), (0.84, 0.72)], 0.006).line([(0.87, 0.55), (0.9, 0.72)], 0.006)
        m = wm.mask(); cd.lay(m, '#e8b84a', 1, rim=0, gran=0).light(blur(m, 3), '#ffd36a', 0.4)
    c.later(neon)
    c.field = 0.0


def garden(c):
    """The Spirit Garden: your Pneuka Jar's pocket world at blue dusk, planetoids hung in the sky with their trees, the lake's lotuses."""
    p = c.pal
    c.img = vgrad(p['sky0'], p['sky1'], 0.0, 0.75, 1.0)
    c.stars(70, 0.6, 101)
    c.light(glow(0.5, 0.72, 0.4, 2.0), '#ffe8c0', 0.25)
    for (x, y, r, sd) in [(0.15, 0.24, 0.07, 102), (0.83, 0.18, 0.05, 103), (0.66, 0.42, 0.035, 104)]:
        m = ellipse(x, y, r / ASP, r, 0.003)
        c.lay(m, vgrad(mix(p['far'], '#c8e0a0', 0.3), mix(p['far'], p['sky0'], 0.5), y - r, y + r), 1)
        c.shade(m * ss(y - r * 0.2, y + r, V), 0.25, p['sky0'])
        tr = Pen()
        for k in range(3):
            tx = x + (k - 1) * r * 0.35 / ASP * 1.5; tr.line([(tx, y - r * 0.85), (tx, y - r * 1.25)], r * 0.08).ell(tx, y - r * 1.35, r * 0.18 / ASP * 1.6, r * 0.22)
        c.lay(tr.mask(), mix(p['near'], '#1a2a1a', 0.3), 1)
    # the near planetoid, its curve the horizon; the lake on it with its lotuses; the Jar on the bank
    ground = ellipse(0.5, 2.15, 1.2, 1.45, 0.004)
    c.lay(ground, vgrad(mix(p['far'], '#b8d890', 0.3), p['near'], 0.7, 1.0), 1, gran=0.5)
    lake = ellipse(0.62, 0.84, 0.2, 0.045)
    c.lay(rag(lake, k=0.05, seed=105), vgrad(mix(p['sky1'], '#ffffff', 0.2), mix(p['sky0'], p['sky1'], 0.5), 0.8, 0.89), 1, rim=0.9)
    for (x, y) in [(0.52, 0.84), (0.6, 0.83), (0.69, 0.855), (0.75, 0.835), (0.57, 0.86)]:
        c.lay(ellipse(x, y, 0.009, 0.007), '#f2a8c0', 1, rim=0.2)
        c.later(lambda cd, x=x, y=y: cd.light(glow(x, y, 0.012), '#ffd0e0', 0.35))
    jar = Pen().ell(0.3, 0.75, 0.022, 0.04).poly([(0.29, 0.715), (0.29, 0.695), (0.31, 0.695), (0.31, 0.715)]).ell(0.3, 0.693, 0.012, 0.007)
    c.lay(jar.mask(), '#c86a4a', 1, rim=0.6)
    c.later(lambda cd: cd.light(glow(0.3, 0.735, 0.03), '#ffe0b0', 0.35))
    sp = Pen(); rng = np.random.default_rng(106)
    for _ in range(14):
        x = rng.uniform(0.05, 0.95); h = rng.uniform(0.04, 0.09); base = 2.15 - 1.45 * np.sqrt(max(0, 1 - ((x - 0.5) / 1.2) ** 2)) + 0.005
        if abs(x - 0.62) < 0.2 and base > 0.8: continue
        sp.line([(x, base), (x, base - h)], 0.004).ell(x, base - h - 0.02, 0.016, 0.03)
    c.lay(sp.mask(), mix(p['near'], '#102010', 0.35), 1, rim=0.6, gran=0.5)
    ff = Pen()
    for _ in range(22):
        u, v = rng.uniform(0.05, 0.95), rng.uniform(0.5, 0.8); r = rng.uniform(0.002, 0.004); ff.ell(u, v, r / ASP, r)
    c.later(lambda cd, m=ff.mask(): cd.light(m, '#fff0a0', 0.9).light(blur(m, 3), '#fff0a0', 0.4))


def dunemaw(c):
    """The Great Dunemaw: the sand's funnel turning down into the dark, a cold light rising from the deep, a sandfall over the far lip."""
    p = c.pal
    c.img = vgrad(p['sky0'], p['sky1'], 0.0, 0.2, 1.0)
    cx, cy = 0.5, 0.64
    rr = np.sqrt(((U - cx) / 0.5) ** 2 + ((V - cy) / 0.26) ** 2)
    sand = under(lambda u: 0.2 + 0.02 * np.sin(u * 5 + 1), 0.003)
    c.lay(sand, mix('#8a6a4a', p['far'], 0.3), 1)
    ang = np.arctan2((V - cy) * 2, (U - cx))
    swirl = 0.5 + 0.5 * np.sin(ang * 3 + rr * 14 + 2 * fbm(D * 4, 3, seed=111))
    funnel = 1 - ss(0.85, 0.95, rr)
    c.lay(funnel, vgrad('#6a4a3a', p['far'], 0.3, 0.75) * 1.0, 1)
    c.shade(funnel * swirl, 0.25, p['near'])
    c.shade(funnel * (1 - ss(0.1, 0.8, rr)), 0.9, p['near'])
    c.light(glow(cx, cy + 0.02, 0.12, 2.2), p['sun'], 0.55)
    c.light(glow(cx, cy, 0.04, 2.0), '#e8fbff', 0.6)
    fall = Pen()
    rng = np.random.default_rng(112)
    fall.poly([(0.44, 0.39), (0.56, 0.39), (0.535, 0.55), (0.465, 0.55)])
    sheet = fall.mask(5) * 0.8 * (0.55 + 0.45 * ss(0.3, 0.7, n2(30, 113, sx=3, sy=0.08))) * (1 - ss(0.45, 0.58, V))
    c.lay(sheet, mix('#c8a07a', p['far'], 0.2), 0.9)
    c.later(lambda cd, m=sheet: cd.lay(m, '#c8a07a', 0.45, rim=0, gran=0))
    c.field = ang + np.pi / 2 + 0.5


def crossing(c):
    """A crossing: a sloop running down the rail at night over the Emocean's crude, its lanterns lit, the moon over a storm's edge."""
    p = c.pal; hy = 0.55
    c.sky(hy, clouds=0.35, cseed=121, ccol=mix(p['sky0'], p['sky1'], 0.55)).sun(0.75, 0.2, 0.035, 0.45)
    sea = under(lambda u: hy, 0.002)
    c.lay(sea, vgrad(mix(p['far'], p['sky1'], 0.3), p['near'], hy, 1.0), 1)
    for k, (cc, s) in enumerate([('#3fb0b0', 122), ('#c86aa8', 123), ('#d8b04a', 124)]):
        c.light(sea * ss(0.3, 0.45, n2(20, s, sx=0.25, sy=4)) * (1 - ss(hy, 0.95, V)) , cc, 0.18)
    c.light(sea * ss(0.05, 0.0, np.abs(U - 0.75) - (V - hy) * 0.3) * ss(0.2, 0.5, n2(70, 125, sx=0.15, sy=3)), p['sun'], 0.5)
    rail = Pen()
    for k in range(14):
        t0, t1 = k / 14, (k + 0.5) / 14
        y0, y1 = 1.0 - (1.0 - hy) * t0 ** 0.6, 1.0 - (1.0 - hy) * t1 ** 0.6
        rail.line([(0.5 - 0.0 * t0, y0), (0.5, y1)], 0.008 * (1 - t0) + 0.001)
    c.later(lambda cd, m=rail.mask(): cd.light(m, '#ffd36a', 0.6).light(blur(m, 3), '#ffd36a', 0.25))
    # the sloop: hull, mast, the mainsail and jib lit by the moon; its wake
    hull = Pen().poly([(0.36, 0.7), (0.62, 0.7), (0.58, 0.745), (0.4, 0.745)])
    c.lay(hull.mask(), mix(p['ink'], '#2a1a2a', 0.3), 1)
    c.lay(Pen().line([(0.36, 0.7), (0.62, 0.7)], 0.006).mask(), '#d8b04a', 1)
    c.lay(Pen().line([(0.49, 0.7), (0.49, 0.3)], 0.007).mask(), p['ink'], 1)
    c.lay(Pen().poly([(0.495, 0.32), (0.495, 0.68), (0.6, 0.68)]).mask(), mix('#e8e0d0', p['sun'], 0.3), 1)
    c.lay(Pen().poly([(0.485, 0.34), (0.39, 0.685), (0.485, 0.685)]).mask(), mix('#c8c0b8', p['sky0'], 0.25), 1)
    wake = Pen().line([(0.4, 0.74), (0.2, 0.8), (0.0, 0.84)], 0.006, 0.02).line([(0.6, 0.745), (0.8, 0.8), (1.0, 0.86)], 0.006, 0.02)
    c.later(lambda cd, m=wake.mask(): cd.lay(m * ss(0.2, 0.6, n2(60, 126)), '#e8f2f0', 0.7, rim=0, gran=0))
    c.later(lambda cd: cd.light(glow(0.6, 0.69, 0.012), '#ffd36a', 1.0).light(glow(0.37, 0.69, 0.01), '#ffd36a', 0.9))
    c.field = 0.0


def margarite(c):
    """Margarite's dock: the King's pearl-white quay at a soft morning, the lamp tower lit at its end, moored hulls, nacre roofs."""
    p = c.pal; hy = 0.56
    c.sky(hy, clouds=0.25, cseed=131, ccol=mix(p['sky1'], '#ffffff', 0.4)).sun(0.25, 0.25, 0.03, 0.4)
    town = Pen(); rng = np.random.default_rng(132)
    x = 0.42
    NACRE = ['#d8b8c8', '#c0b0d0', '#e0c8b8', '#b8a8c0', '#d0c0d8']
    win = Pen()
    while x < 1.0:
        w = rng.uniform(0.04, 0.08); h = rng.uniform(0.06, 0.16); b = Pen().poly([(x, hy), (x, hy - h), (x + w, hy - h), (x + w, hy)])
        if rng.random() < 0.4: b.ell(x + w / 2, hy - h, w / 2, w * 0.7)
        c.lay(b.mask(), mix(NACRE[rng.integers(5)], p['far'], 0.3), 1, rim=0.8)
        c.shade(b.mask() * ss(x + w * 0.55, x + w * 0.6, U), 0.18, p['far'])
        for j in range(int(h / 0.04)):
            win.ell(x + w * 0.3, hy - 0.02 - j * 0.04, 0.003, 0.006).ell(x + w * 0.7, hy - 0.02 - j * 0.04, 0.003, 0.006)
        x += w * 0.95
    c.lay(win.mask(), p['near'], 0.6, rim=0, run=0)
    c.lay(Pen().ell(0.84, hy - 0.16, 0.05, 0.08).mask(), mix('#ffffff', '#e8c8e0', 0.4), 1, rim=0.9)   # (the Pearl Shrine's dome)
    sea = under(lambda u: hy, 0.002)
    c.lay(sea, vgrad(mix(p['far'], p['sky1'], 0.4), p['far'], hy, 1.0), 1, rim=0.2)
    c.light(sea * ss(0.3, 0.42, n2(25, 134, sx=0.25, sy=4)), '#ffffff', 0.25)
    c.lay(Pen().poly([(-0.02, 0.8), (0.3, 0.68), (0.42, 0.68), (0.3, 1.02), (-0.02, 1.02)]).mask(), mix('#e0d0c8', p['near'], 0.25), 1, gran=0.6)
    c.lay(Pen().poly([(0.42, 0.68), (0.43, 0.7), (0.32, 1.02), (0.3, 1.02)]).mask(), mix(p['near'], p['far'], 0.3), 1)
    bol = Pen()
    for k in range(6):
        t = k / 5; bol.ell(0.4 - 0.1 * t, 0.68 + 0.3 * t, 0.004 + 0.006 * t, 0.008 + 0.012 * t)
    c.lay(bol.mask(), p['near'], 1)
    tw = Pen().poly([(0.335, 0.68), (0.345, 0.3), (0.375, 0.3), (0.385, 0.68)])
    c.lay(tw.mask(), mix('#f6f0ec', p['far'], 0.2), 1, rim=0.6)
    c.lay(Pen().poly([(0.34, 0.3), (0.36, 0.24), (0.38, 0.3)]).mask(), p['near'], 1)
    c.later(lambda cd: cd.light(glow(0.36, 0.28, 0.025), '#ffd36a', 1.0).light(glow(0.36, 0.28, 0.12), '#ffe8a0', 0.3)
            .light(np.exp(-((U - 0.36) / 0.02) ** 2) * sea * (1 - ss(hy, 0.85, V)) * ss(0.2, 0.6, n2(60, 135, sx=0.15, sy=4)), '#ffd36a', 0.6))
    for (x0, s) in [(0.55, 1.0), (0.72, 0.8), (0.9, 0.7)]:
        b = Pen().poly([(x0, 0.66 + 0.02 * s), (x0 + 0.08 * s, 0.66 + 0.02 * s), (x0 + 0.07 * s, 0.68 + 0.02 * s), (x0 + 0.01 * s, 0.68 + 0.02 * s)])
        b.line([(x0 + 0.04 * s, 0.66 + 0.02 * s), (x0 + 0.04 * s, 0.66 - 0.16 * s)], 0.004)
        c.lay(b.mask(), p['near'], 1, rim=0.4)


def opensea(c):
    """The open sea: the Emocean off the lanes under tall cloud, an islet with its one palm, a sea serpent's back breaking the swell."""
    p = c.pal; hy = 0.5
    c.sky(hy, clouds=0.45, cseed=141, ccol='#ffffff').sun(0.32, 0.12, 0.03, 0.4)
    sea = under(lambda u: hy, 0.002)
    c.lay(sea, vgrad(mix(p['far'], p['sky1'], 0.45), mix(p['far'], '#0e2a3a', 0.4), hy, 1.0), 1, rim=0.2)
    c.light(sea * ss(0.32, 0.46, n2(22, 142, sx=0.2, sy=4)), '#ffffff', 0.3)
    c.light(sea * ss(0.05, 0.0, np.abs(U - 0.32) - (V - hy) * 0.3) * ss(0.2, 0.5, n2(70, 143, sx=0.15, sy=3)), '#ffffff', 0.5)
    isl = Pen().ell(0.76, hy + 0.005, 0.09, 0.03).poly([(0.68, hy + 0.005), (0.84, hy + 0.005), (0.82, hy + 0.012), (0.7, hy + 0.012)])
    c.lay(rag(isl.mask() * (V < hy + 0.006), k=0.04, seed=144), '#c8a878', 1)
    c.lay(Pen().ell(0.73, hy - 0.004, 0.03, 0.02).ell(0.8, hy - 0.002, 0.02, 0.014).mask() * (V < hy + 0.004), '#4a6a3a', 1)
    palm = Pen().line(curve((0.76, hy - 0.01), (0.765, hy - 0.06), (0.775, hy - 0.11)), 0.006, 0.003)
    for k in range(6):
        a = np.pi * (-0.05 - k * 0.18); palm.line(curve((0.775, hy - 0.11), (0.775 + np.cos(a) * 0.02, hy - 0.115 + np.sin(a) * 0.03), (0.775 + np.cos(a) * 0.035, hy - 0.09)), 0.008, 0.002)
    c.lay(palm.mask(), '#2f4a2a', 1, rim=0.4)
    # the sea serpent's back: three humps out of the swell, the film's schiller on its fins
    body = Pen()
    for (x, w, h) in [(0.18, 0.07, 0.07), (0.32, 0.06, 0.055), (0.44, 0.045, 0.04)]:
        body.ring(x, 0.68, w, h, 0.03, start=180, end=360)
    m = body.mask() * (V < 0.682)
    c.lay(m, mix('#1e4a4a', p['far'], 0.3), 1, rim=0.8)
    c.later(lambda cd, m=m: cd.light(m * ss(0.0, 0.02, 0.665 - V) * ss(0.3, 0.6, n2(30, 145)), '#7adcc8', 0.5))
    foam = Pen()
    for x in (0.11, 0.25, 0.26, 0.39, 0.41, 0.48):
        foam.ell(x, 0.684, 0.02, 0.006)
    c.lay(rag(foam.mask(), k=0.08, scale=90, seed=146), '#f0f6f4', 0.85, rim=0.2)
    c.lay(Pen().poly([(0.6, hy - 0.002), (0.605, hy - 0.035), (0.62, hy - 0.002)]).mask(), '#f0ece0', 0.8)  # (a far sail)


RECIPES = {
    'weir': ('water', weir), 'shore': ('water', shore), 'ridges': ('oil', ridges), 'flats': ('oil', flats), 'ruins': ('water', ruins),
    'workshop': ('oil', workshop), 'hub': ('oil', hub), 'siege': ('oil', siege), 'raceway': ('water', raceway), 'bazaar': ('oil', bazaar),
    'garden': ('water', garden), 'dunemaw': ('oil', dunemaw), 'crossing': ('oil', crossing), 'margarite': ('water', margarite),
    'opensea': ('water', opensea),
}

if __name__ == '__main__':
    pals = rows()
    names = sys.argv[1:] or list(RECIPES)
    os.makedirs(OUT, exist_ok=True)
    made = []
    for i, n in enumerate(names):
        t = time.time(); hand, fn = RECIPES[n]
        card = Card(pals[n], hand, 1000 + 37 * list(RECIPES).index(n))
        fn(card)
        im = finish(card)
        path = os.path.join(OUT, f'{n}.webp')
        im.save(path, 'WEBP', quality=QUALITY, alpha_quality=80, method=6)
        made.append((n, im)); print(f'{n:10s} {hand:5s} {os.path.getsize(path):6d} B  {time.time() - t:.1f}s', flush=True)
    if os.environ.get('SHEET'):
        cols = 5; rws = (len(made) + cols - 1) // cols
        sh = Image.new('RGB', (cols * 330 + 10, rws * 190 + 10), (67, 36, 26))
        for k, (n, im) in enumerate(made):
            sh.paste(im, (10 + (k % cols) * 330, 10 + (k // cols) * 190), im)
        sh.save(os.environ['SHEET'], quality=90)
