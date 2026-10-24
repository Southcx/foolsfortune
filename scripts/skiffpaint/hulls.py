"""THE SOLAR SKIFF'S HULL PAINTINGS (the owner, 2026-10-24: "what about the base skiff texture, do you have alternate designs for that?"):
six alternates of the owner's hull painting (source_assets/Courier/courier_solarskiff_hull.png, embedded in src/assets/solarskiff.glb),
painted at its size on its UV islands, so each reads as the same board repainted, never another board. The owner's painting stays the
default and is never changed; these are worn over it by vfx/skiffhulls.js (a hull painting, `game.skiffPaint.worn.hull`).

How: the owner's painting is read out of the glb (scripts/skiffpaint/glb.py) with its UV triangles, and its posterised tones are read as
five layers by lightness: the ink (its linework and deepest shadow), the ground (the maroon body), the mid (the panels' second tone), the
accent (the brown trim) and the light (the cream ornament, the oars, the ribs). Each painting gives each layer a material of its own, its
texture laid along the grain of the island it is on (the deck's planks run along v, the hull's and the rails' along u, read off the
islands' positions), keeps the owner's in-layer shading (the grain streaks inside the maroon) and draws the ink over everything: the
linework and the panel reading stay the owner's. Last, each is posterised to a painted palette, as the original is.

Prior art: a palette swap over a painting's tone layers (the house's pixel art, src/ui/pixel.js); urushi with maki-e (sprinkled gold
waves over black lacquer, Kōdai-ji ware) and negoro (the red showing where the black wears); driftwood's silvered grain and salt bloom;
Longquan celadon and guan crackle; a racing launch's varnished teak, brass fittings and a number band (Riva's runabouts); bone inlay
over obsidian (Aztec mirrors, Mixtec inlay); a matsuri float's vermilion lacquer with gold clouds (the Gion Matsuri's hoko).

  python3 -I scripts/skiffpaint/hulls.py [out_dir]   (default src/assets/: skiff_hull_<id>.webp, quality 80; deterministic: seeded)
  HULLS (the ids, in order): urushi, driftwood, celadon, teak, obsidian, festival
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import glb  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
GLB = os.path.join(ROOT, 'src', 'assets', 'solarskiff.glb')
HULLS = ['urushi', 'driftwood', 'celadon', 'teak', 'obsidian', 'festival']


# ------------------------------------------------------------------ helpers
def hexc(h):
    return np.array([(h >> 16) & 255, (h >> 8) & 255, h & 255], np.float32) / 255.0


def ss(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def vnoise(W, H, cx, cy, seed):
    """Value noise, cx by cy cells over the image, bicubic between them."""
    r = np.random.default_rng(seed).random((cy + 3, cx + 3)).astype(np.float32)
    im = Image.fromarray(r, 'F').resize((W + W * 3 // max(cx, 1), H + H * 3 // max(cy, 1)), Image.BICUBIC)
    return np.array(im)[:H, :W]


def fbm(W, H, cx, cy, seed, oct=4):
    s, a, tot = 0, 1.0, 0
    for o in range(oct):
        s = s + a * vnoise(W, H, cx * 2 ** o, cy * 2 ** o, seed + o * 17)
        tot += a
        a *= 0.5
    return s / tot


def worley(W, H, cell, seed):
    """(F1, F2) distances in pixels to the nearest jittered points of a grid of `cell` px (Worley's cellular noise)."""
    gx, gy = W // cell + 2, H // cell + 2
    pts = (np.random.default_rng(seed).random((gy, gx, 2)) + np.stack(np.meshgrid(np.arange(gx), np.arange(gy)), -1)) * cell
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    ix, iy = (xx // cell).astype(int), (yy // cell).astype(int)
    d = []
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            jx, jy = np.clip(ix + dx, 0, gx - 1), np.clip(iy + dy, 0, gy - 1)
            p = pts[jy, jx]
            d.append(np.hypot(p[..., 0] - xx, p[..., 1] - yy))
    d = np.sort(np.stack(d), 0)
    return d[0], d[1]


# ------------------------------------------------------------------ the owner's painting, read
def read():
    img, uv, pos = glb.hull(GLB)
    W, H = img.size
    rgb = np.asarray(img.convert('RGB'), np.float32) / 255.0
    L = rgb @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    # the islands, each with the way its grain runs: by the triangles' positions (the deck faces up, the oars run along z in v)
    mask = Image.new('L', (W, H), 0)
    grain = Image.new('L', (W, H), 0)  # 0: along u, 255: along v
    dm, dg = ImageDraw.Draw(mask), ImageDraw.Draw(grain)
    for t, p in zip(uv, pos):
        poly = [(float(a) * W, float(b) * H) for a, b in t]
        dm.polygon(poly, fill=255)
        n = np.cross(p[1] - p[0], p[2] - p[0])
        n = n / (np.linalg.norm(n) + 1e-9)
        cz = np.corrcoef(t[:, 1], p[:, 2])[0, 1] if np.ptp(t[:, 1]) > 1e-6 and np.ptp(p[:, 2]) > 1e-6 else 0
        along_v = abs(n[1]) > 0.9 or abs(np.nan_to_num(cz)) > 0.9 and np.ptp(p[:, 2]) > np.ptp(p[:, 0])
        dg.polygon(poly, fill=255 if along_v else 0)
    m = np.asarray(mask.filter(ImageFilter.MaxFilter(3)), np.float32) / 255.0
    gv = np.asarray(grain.filter(ImageFilter.MaxFilter(3)), np.float32) / 255.0
    # the five tone layers (the posterised painting's own steps: ink .03-.07, ground .10-.12, mid .20-.29, accent .32-.41, light .74)
    light = ss(0.5, 0.62, L)
    acc = ss(0.3, 0.35, L) * (1 - light)
    mid = ss(0.17, 0.2, L) * (1 - ss(0.3, 0.35, L))
    ink = (1 - ss(0.075, 0.095, L)) * m
    ground = np.clip(1 - light - acc - mid - ink, 0, 1)
    centre = ink * 0.05 + ground * 0.115 + mid * 0.245 + acc * 0.39 + light * 0.739
    shade = np.where(m > 0, np.clip(L / np.maximum(centre, 1e-3), 0.75, 1.2), 1.0)  # (the owner's in-layer shading: grain streaks)
    return dict(W=W, H=H, L=L, m=m, gv=gv, ink=ink, ground=ground, mid=mid, acc=acc, light=light, shade=shade)


def grainfield(S, seed, fine=48, coarse=6, stretch=10):
    """Wood grain along each island's way: noise stretched along it (u or v), mixed by the island's grain map."""
    W, H = S['W'], S['H']
    a = fbm(W, H, coarse, coarse * stretch, seed, 3) * 0.5 + fbm(W, H, fine // stretch + 1, fine, seed + 3, 2) * 0.5  # (streaks along u)
    b = fbm(W, H, coarse * stretch, coarse, seed + 7, 3) * 0.5 + fbm(W, H, fine, fine // stretch + 1, seed + 9, 2) * 0.5  # (along v)
    return a * (1 - S['gv']) + b * S['gv']


def along(S):
    """Pixel coordinates (across, down-the-grain) for laying planks: across the grain is v where it runs along u."""
    H, W = S['H'], S['W']
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    return yy * (1 - S['gv']) + xx * S['gv'], xx * (1 - S['gv']) + yy * S['gv']


def layers(S, cols):
    """Each tone layer in its colour (an (H, W, 3) per layer, or a colour), summed by the layers' weights."""
    out = 0
    full = lambda c: c if isinstance(c, np.ndarray) and c.ndim == 3 else np.broadcast_to(c, (S['H'], S['W'], 3))
    for k in ('ground', 'mid', 'acc', 'light', 'ink'):
        c = full(cols[k])
        if k == 'ink':  # (the owner's darks: half the painting's ink, half its ground deepened, so a broad shadow keeps its material)
            c = 0.5 * c + 0.5 * 0.3 * full(cols['ground'])
        out = out + c * S[k][..., None]
    return out


def finish(S, img, shade_k=0.6, colours=56):
    """The owner's shading kept, the ink kept, the outside of the islands as the ground (no seam in the mips), posterised."""
    img = img * (1 + (S['shade'][..., None] - 1) * shade_k)
    img = np.clip(img, 0, 1)
    pim = Image.fromarray((img * 255 + 0.5).astype(np.uint8), 'RGB')
    return pim.quantize(colors=colours, method=Image.MEDIANCUT, dither=Image.NONE).convert('RGB')


# ------------------------------------------------------------------ the six
def urushi(S):
    """Urushi lacquer: black, deep and a little warm; the owner's mid panels worn through to negoro red; the cream in gold maki-e, its
    hirame flakes glinting; gold waves (seigaiha's arcs) sprinkled over the black in drifts, as maki-e waves run over a box's lid."""
    W, H = S['W'], S['H']
    f = fbm(W, H, 8, 8, 11)
    black = hexc(0x0c0909)[None, None] * (0.85 + 0.3 * f[..., None])
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    R = 11.0
    row = np.floor(yy / (R * 0.5))
    ox = xx + (row % 2) * R
    cx = (np.floor(ox / (2 * R)) * 2 + 1) * R
    cy = (row + 1) * R * 0.5
    d = np.hypot(ox - cx, (yy - cy) * 1.0)
    ring = (np.abs((d % (R / 3.0)) - R / 6.0) < 0.9) & (yy < cy) & (d < R)
    drift = ss(0.56, 0.64, fbm(W, H, 5, 5, 23))
    waves = ring * drift
    flakes = (np.random.default_rng(5).random((H, W)) > 0.985).astype(np.float32)
    gold = hexc(0xd8b05a)[None, None] * (0.9 + 0.25 * flakes[..., None])
    ground = black * (1 - waves[..., None] * 0.85) + hexc(0xc79a45) * (waves[..., None] * 0.85)
    negoro = hexc(0x4a120d) * (0.8 + 0.4 * fbm(W, H, 16, 16, 31)[..., None])
    return finish(S, layers(S, dict(ground=ground, mid=negoro, acc=hexc(0x8d6a2c), light=gold, ink=hexc(0x030202))), 0.4)


def driftwood(S):
    """Driftwood: wood silvered by sun and salt, its grain opened and raised (darker streaks), the cream bleached to bone-pale, the
    trim a weathered brown; salt dried in white blooms where the spray sat, and pinholes of shipworm."""
    W, H = S['W'], S['H']
    g = grainfield(S, 41, fine=64, coarse=5, stretch=12)
    streak = ss(0.42, 0.62, g)
    wood = hexc(0x958f84)[None, None] * (1 - 0.32 * streak[..., None]) + hexc(0x5e574e) * 0.0
    salt = ss(0.6, 0.72, fbm(W, H, 7, 7, 43)) * (0.5 + 0.5 * (np.random.default_rng(44).random((H, W)) > 0.55))
    holes = (np.random.default_rng(45).random((H, W)) > 0.997).astype(np.float32)
    ground = wood * (1 - salt[..., None] * 0.6) + hexc(0xeeece4) * salt[..., None] * 0.6
    ground = ground * (1 - holes[..., None] * 0.6)
    mid = hexc(0x6f675d)[None, None] * (1 - 0.25 * streak[..., None])
    light = hexc(0xddd7c9)[None, None] * (1 - 0.12 * streak[..., None])
    return finish(S, layers(S, dict(ground=ground, mid=mid, acc=hexc(0x9c8e78), light=light, ink=hexc(0x3b3632))), 0.5)


def celadon(S):
    """Celadon crackle: a pale sea-green glaze, pooled deeper where the owner's panels sit, near white over the cream; crazed all over
    in a guan net, a coarse crackle stained dark and a fine one pale (a two-fired crackle, gold-thread-and-iron-wire's kin)."""
    W, H = S['W'], S['H']
    th = fbm(W, H, 6, 6, 61)
    f1, f2 = worley(W, H, 11, 62)
    coarse = 1 - ss(0.6, 1.6, f2 - f1)
    g1, g2 = worley(W, H, 5, 63)
    fine = 1 - ss(0.3, 0.9, g2 - g1)
    def glaze(c, deep):
        base = hexc(c)[None, None] * (1 - deep * (th[..., None] - 0.5))
        base = base * (1 - 0.45 * coarse[..., None]) + hexc(0x3c5446) * 0.45 * coarse[..., None] * 0
        return base * (1 - 0.0 * fine[..., None]) + (hexc(0xe8f2e6) - base) * 0.25 * fine[..., None]
    ground = glaze(0x8db79b, 0.25)
    ground = ground * (1 - 0.4 * coarse[..., None]) + hexc(0x3e5a49) * 0.4 * coarse[..., None]
    mid = glaze(0x6e9b80, 0.3) * (1 - 0.5 * coarse[..., None]) + hexc(0x34503f) * 0.5 * coarse[..., None]
    light = glaze(0xd3e5d2, 0.12) * (1 - 0.4 * coarse[..., None]) + hexc(0x7d9a88) * 0.4 * coarse[..., None]
    acc = glaze(0xb2ceb8, 0.15)
    return finish(S, layers(S, dict(ground=ground, mid=mid, acc=acc, light=light, ink=hexc(0x2d463a))), 0.35)


def teak(S):
    """Racing teak and brass: varnished teak planks along the hull (each plank its own tone, caulked seams, a fine grain), brass where
    the owner painted cream and trim (a rubbed gradient), brass rivets along the seams, and a white number band round the stern, 07."""
    W, H = S['W'], S['H']
    a, b = along(S)
    P = 14.0
    plank = np.floor(a / P)
    tone = np.random.default_rng(71).random(int(plank.max()) + 2)[plank.astype(int)]
    seam = (np.abs((a % P) - 0.5) < 0.8).astype(np.float32)
    g = grainfield(S, 72, fine=80, coarse=8, stretch=14)
    wood = hexc(0x9a5426)[None, None] * (0.82 + 0.3 * tone[..., None]) * (0.85 + 0.3 * g[..., None])
    wood = wood * (1 - 0.6 * seam[..., None]) + hexc(0x2a170c) * 0.6 * seam[..., None]
    stag = (np.floor(a / P) % 2) * 9
    rivet = (np.hypot(((b + stag) % 18) - 9, (a % P) - P + 1.5) < 1.3).astype(np.float32)
    wood = wood * (1 - rivet[..., None]) + hexc(0xe0c070) * rivet[..., None]
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    rub = 0.85 + 0.3 * ss(0, 1, fbm(W, H, 4, 4, 73))
    brass = hexc(0xd9b450)[None, None] * rub[..., None]
    mid = hexc(0x6b3417)[None, None] * (0.85 + 0.3 * g[..., None])
    img = layers(S, dict(ground=wood, mid=mid, acc=hexc(0xa98337), light=brass, ink=hexc(0x24130a)))
    # the number band: round the stern's sides (the stern island: u across the beam, v down its height), white with its number
    band = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(band)
    y0, y1 = int(0.705 * H), int(0.745 * H)
    d.rectangle([int(0.53 * W), y0, int(0.985 * W), y1], fill=255)
    bm = np.asarray(band, np.float32)[..., None] / 255.0 * S['m'][..., None]
    img = img * (1 - bm) + hexc(0xf1ebdc) * bm
    num = Image.new('L', (W, H), 0)
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30) if os.path.exists('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf') else ImageFont.load_default()
    dn = ImageDraw.Draw(num)
    for cx in (0.66, 0.87):
        dn.text((int(cx * W), int(0.725 * H)), '07', fill=255, font=font, anchor='mm')
    nm = np.asarray(num, np.float32)[..., None] / 255.0 * S['m'][..., None]
    nm = nm * (np.abs(yy - 0.725 * H) < 0.04 * H)[..., None]
    img = img * (1 - nm) + hexc(0x1d2a4a) * nm
    S2 = dict(S)
    S2['shade'] = np.where(bm[..., 0] > 0.5, 1.0, S['shade'])
    return finish(S2, img, 0.45, 64)


def obsidian(S):
    """Bone and obsidian: black volcanic glass for the body, conchoidal (its fractures' ripples catching a cold violet sheen), ivory
    bone where the owner painted cream (the ribs, the oars, the dome), a fine bone grain and a yellowed edge; the trim in horn."""
    W, H = S['W'], S['H']
    f = fbm(W, H, 5, 5, 81)
    rip = 0.5 + 0.5 * np.sin(f * 60.0)
    sheen = ss(0.86, 0.99, rip) * ss(0.45, 0.7, fbm(W, H, 3, 3, 82))
    glass = hexc(0x0f0e14)[None, None] * (0.9 + 0.2 * f[..., None]) + hexc(0x5b4f86) * (0.55 * sheen[..., None])
    g = grainfield(S, 83, fine=96, coarse=10, stretch=8)
    edge = 1 - ss(0.02, 0.12, np.asarray(Image.fromarray((S['light'] * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2)), np.float32) / 255.0)
    bone = hexc(0xeee5cf)[None, None] * (0.92 + 0.12 * g[..., None])
    bone = bone * (1 - 0.0 * edge[..., None])
    mid = hexc(0x26222e)[None, None] + hexc(0x3a3350) * (0.4 * sheen[..., None])
    return finish(S, layers(S, dict(ground=glass, mid=mid, acc=hexc(0x8a7b5f), light=bone, ink=hexc(0x000000))), 0.3)


def festival(S):
    """Festival lacquer: a matsuri float's vermilion, black lacquer at its deepest panels, gold where the owner painted cream and trim,
    and gold clouds (the float's carved kumo, banded and outlined) drifting over the vermilion."""
    W, H = S['W'], S['H']
    a, b = along(S)
    f = fbm(W, H, 11, 8, 91)
    cloud = ss(0.66, 0.69, f + 0.08 * np.sin(b / 9.0) * np.sin(a / 13.0))
    rim = ss(0.625, 0.65, f + 0.08 * np.sin(b / 9.0) * np.sin(a / 13.0)) - cloud
    band = (np.abs(((f - 0.66) * 90) % 6 - 3) < 0.7) * cloud
    verm = hexc(0xc8341f)[None, None] * (0.92 + 0.16 * fbm(W, H, 20, 20, 92)[..., None])
    gold = hexc(0xe8c25a)
    ground = verm * (1 - cloud[..., None]) + gold * cloud[..., None]
    ground = ground * (1 - rim[..., None]) + hexc(0x2a0806) * rim[..., None]
    ground = ground * (1 - 0.35 * band[..., None])
    return finish(S, layers(S, dict(ground=ground, mid=hexc(0x1a0807), acc=hexc(0xb58a33), light=hexc(0xf0cf6a), ink=hexc(0x220504))), 0.35)


PAINTERS = dict(urushi=urushi, driftwood=driftwood, celadon=celadon, teak=teak, obsidian=obsidian, festival=festival)


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'src', 'assets')
    S = read()
    for k in HULLS:
        im = PAINTERS[k](S)
        p = os.path.join(out, f'skiff_hull_{k}.webp')
        im.save(p, 'WEBP', quality=80, method=6)
        print(p, os.path.getsize(p))


if __name__ == '__main__':
    main()
