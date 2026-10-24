import sys, time, numpy as np
from PIL import Image
import painter as P
from painter import hexc, ss, fbm, gnoise, warp, blur, wash, ramp

import os
OUT = os.environ.get('SKY_OUT', '/tmp/sky/')

def band(lat, lo, hi, soft=0.15):
    return ss(lo - soft, lo + soft, lat) * (1 - ss(hi - soft, hi + soft, lat))

def sundir(az, el):
    return np.array([np.cos(el) * np.cos(az), np.sin(el), np.cos(el) * np.sin(az)], np.float32)

def below(img, lat, col, k=0.85):
    """Under the horizon: the sky's own horizon colour going down into a haze (the dunes hide it; the water mirrors the sky)."""
    m = ss(0.0, -0.25, lat)[..., None] * k
    return img * (1 - m) + hexc(col) * m

def clouds(D, lat, lo, hi, scale, seed, cover=0.0, squash=1.0, warpk=0.35):
    Ds = D * np.array([1, squash, 1], np.float32)
    F = fbm(warp(Ds, warpk, 1.2, seed) * scale, 5, seed=seed + 1) + 0.45 * band(lat, lo, hi, 0.12) - 0.3 + cover
    return F * ss(-0.02, 0.06, lat)            # never under the horizon


def cumulus(D, lat, base, top, scale, seed, cover=0.0, warpk=0.35, squash=1.0):
    """Clouds with flat bases and billowed tops: the field thins with height and is cut flat (but ragged) at the base.
    Returns (density 0..1 soft, the height in the cloud 0 base .. 1 top)."""
    Ds = D * np.array([1, squash, 1], np.float32)
    f = fbm(warp(Ds, warpk, 1.1, seed) * scale, 5, seed=seed + 1)
    hf = np.clip((lat - base) / (top - base), 0, 1)
    rag = 0.012 * fbm(D * 9, 3, seed=seed + 2)
    F = f + cover - 0.4 * hf ** 1.4 + 0.06
    F = F * ss(base + rag, base + rag + 0.012, lat) * (1 - ss(top, top + 0.1, lat))
    return F, hf

# ================================================================== OIL: Desire
def desire(D, lat, lon):
    """Desire, in oil: a coral evening after Turner's Fighting Temeraire and Monet's Parliament: long stratus brushed across a
    burning horizon, the sun's glow smeared through them, apricot to rose to a violet zenith."""
    el = lat / (np.pi / 2)
    sun = sundir(0.3, 0.05)
    cs = np.clip((D * sun).sum(-1), -1, 1)
    base = ramp(el, [(-1, '#5a3a4c'), (-0.04, '#d7896e'), (0.0, '#ffcf96'), (0.1, '#ffa070'), (0.3, '#ee7a8c'), (0.6, '#9a5c9e'), (1, '#3e2f62')])
    glow = np.exp((cs - 1) * 10)[..., None]; halo = np.exp((cs - 1) * 2.2)[..., None]
    base = base * (1 - 0.7 * glow) + hexc('#fff3d0') * 0.8 * glow + hexc('#ffb060') * 0.35 * halo
    F = clouds(D, lat, 0.03, 0.45, 1.6, 5, cover=0.05, squash=5.0, warpk=0.3)
    dens = ss(-0.05, 0.22, F)
    Fl = clouds(D - sun * 0.05, lat, 0.03, 0.45, 1.6, 5, cover=0.05, squash=5.0, warpk=0.3)
    lit = np.clip((ss(-0.05, 0.22, F) - ss(-0.05, 0.22, Fl)) * 4, 0, 1)
    cloud = ramp(el, [(-1, '#4a2e44'), (0.0, '#b85c70'), (0.25, '#8a4e80'), (1, '#3a2e5a')])
    img = base * (1 - dens[..., None] * 0.8) + cloud * dens[..., None] * 0.8
    img = img + hexc('#ffd59a') * np.clip(lit + glow[..., 0] * dens * 0.9, 0, 1)[..., None] * 0.6
    img = below(img, lat, '#b9787a', 0.6)
    fx, fy = P.flow_field(D, lat, dens, along=0.7, curl=0.32, scale=1.6, seed=7)
    edge = np.clip(np.hypot(*np.gradient(blur(dens, 2))) * 60, 0, 1)
    cv = P.strokes(img, fx, fy, [dict(w=26, len=12, step=14, jitter=0.05, bristles=5, stop=0.5),
                                 dict(w=13, len=9, step=8, jitter=0.04, bristles=4, stop=0.35),
                                 dict(w=6, len=7, step=4, jitter=0.03, bristles=3, stop=0.25, where=0.15 + 0.85 * edge + glow[..., 0])],
                   seed=8, lat=lat)
    return P.finish_oil(cv, impasto=0.6)


# ================================================================== OIL: Fury
def fury(D, lat, lon):
    """Fury, in oil, laid on thick: a crimson storm after Turner's Snow Storm and Munch's Scream sky: an anvil of bruised red cloud
    over a horizon of ember, the strokes slashing and broken; Fury's cracks as lit seams in the cloud."""
    el = lat / (np.pi / 2)
    base = ramp(el, [(-1, '#2a0a0c'), (-0.04, '#7a1418'), (0.0, '#ff7a2a'), (0.06, '#e8402a'), (0.25, '#a01820'), (0.6, '#4a0e1a'), (1, '#1c0812')])
    F, hf = cumulus(D, lat, 0.06, 0.75, 1.8, 91, cover=0.18, warpk=0.6)
    dens = ss(0.0, 0.08, F)
    cloud = ramp(hf, [(0, '#24060c'), (0.4, '#5a1220'), (0.8, '#8a2230'), (1, '#c04040')])
    img = base * (1 - dens[..., None] * 0.9) + cloud * dens[..., None] * 0.9
    # Fury's cracks: lit seams through the cloud (ridged noise)
    crack = ss(0.94, 0.985, 1 - np.abs(fbm(warp(D, 0.4, 1.5, 92) * 4, 4, seed=93))) * dens * (1 - hf * 0.5)
    img = img + hexc('#ffb050') * crack[..., None] * 0.9
    img = below(img, lat, '#3a0a10', 0.7)
    fx, fy = P.flow_field(D, lat, dens, along=0.5, curl=0.9, scale=2.6, seed=94)
    edge = np.clip(np.hypot(*np.gradient(blur(dens, 2))) * 60 + crack * 2, 0, 1)
    cv = P.strokes(img, fx, fy, [dict(w=30, len=9, step=16, jitter=0.07, bristles=6, stop=0.6),
                                 dict(w=14, len=7, step=9, jitter=0.06, bristles=4, stop=0.4),
                                 dict(w=6, len=5, step=5, jitter=0.05, bristles=3, stop=0.3, where=0.2 + 0.8 * edge)],
                   seed=95, lat=lat)
    return P.finish_oil(cv, impasto=1.1)

# ================================================================== OIL: Dread
def dread(D, lat, lon):
    """Dread, in oil: a low green-black sky after Ryder's moonlit marines and Böcklin's Isle of the Dead: marbled cloud (Dread's
    marbling) pressing down, one sick pale break at the horizon, the strokes slow and swirling."""
    el = lat / (np.pi / 2)
    base = ramp(el, [(-1, '#0a120e'), (-0.03, '#1e2e24'), (0.0, '#9fb08a'), (0.04, '#4a6a52'), (0.2, '#1c3026'), (1, '#060a08')])
    m = fbm(warp(D, 0.9, 1.0, 111) * 2.0, 5, seed=112)
    marble = 0.5 + 0.5 * np.sin(m * 9 + lat * 4)
    dens = ss(0.04, 0.12, lat) * (0.6 + 0.4 * marble)
    cloud = ramp(marble, [(0, '#0c1410'), (0.6, '#24382c'), (0.85, '#3f6a4a'), (1, '#7a9a78')])
    img = base * (1 - dens[..., None]) + cloud * dens[..., None]
    img = below(img, lat, '#14201a', 0.8)
    fx, fy = P.flow_field(D, lat, marble, along=0.8, curl=0.8, scale=1.8, seed=113)
    cv = P.strokes(img, fx, fy, [dict(w=26, len=12, step=12, jitter=0.05, bristles=5, stop=0.5),
                                 dict(w=12, len=10, step=7, jitter=0.04, bristles=4, stop=0.35),
                                 dict(w=5, len=8, step=4, jitter=0.04, bristles=3, stop=0.25, where=0.35)],
                   seed=114, lat=lat)
    return P.finish_oil(cv, impasto=0.5)

# ================================================================== marks laid over a stroked canvas (the 2x supersampled oil canvas)
def _px(lat_, lon_, w=P.W, h=P.H):
    return (lon_ / (2 * np.pi) + 0.5) * w, (0.5 - lat_ / np.pi) * h

def streaks(cv, rng, n, lat_lo, lat_hi, length, width, cols, slant=0.0, where=None, SS=2):
    """Short falling streaks (drops, rain) drawn on the canvas: each a line tapering from its head, `slant` px of x a px of y."""
    from PIL import ImageDraw
    dr = ImageDraw.Draw(cv); w, h = P.W, P.H
    lat_ = rng.uniform(lat_lo, lat_hi, n * 3); lon_ = rng.uniform(-np.pi, np.pi, n * 3)
    keep = rng.random(n * 3) < np.cos(lat_)                                   # evenly over the sphere, not the map
    if where is not None:
        x0, y0 = _px(lat_, lon_); keep &= rng.random(n * 3) < where[np.clip(y0.astype(int), 0, h - 1), np.clip(x0.astype(int), 0, w - 1)]
    lat_, lon_ = lat_[keep][:n], lon_[keep][:n]
    x0, y0 = _px(lat_, lon_)
    for x, y in zip(x0, y0):
        L = length * rng.uniform(0.5, 1.4); c = cols[rng.integers(len(cols))] * rng.uniform(0.85, 1.1)
        cc = tuple(int(v) for v in np.clip(c * 255, 0, 255))
        for dx in (-w, 0, w):
            X, Y = (x + dx) * SS, y * SS
            if X < -50 or X > w * SS + 50: continue
            seg = 4
            for j in range(seg):                                                  # head thick, tail thin
                a = j / seg; b = (j + 1) / seg
                dr.line([(X + slant * L * a * SS, Y + L * a * SS), (X + slant * L * b * SS, Y + L * b * SS)], fill=cc,
                        width=max(1, int(width * SS * (1 - 0.6 * a) + 0.5)))
    return cv

def dabs(cv, rng, n, where, src, rad, tint, k=0.5, SS=2):
    """Round dabs of broken colour (pointillist dots) where `where` holds: each the colour under it pulled toward one of `tint`."""
    from PIL import ImageDraw
    dr = ImageDraw.Draw(cv); w, h = P.W, P.H
    ys = rng.random(n) * h; xs = rng.random(n) * w
    keep = rng.random(n) < where[ys.astype(int), xs.astype(int)]
    for x, y in zip(xs[keep], ys[keep]):
        lat_ = (0.5 - y / h) * np.pi; cl = np.clip(np.cos(lat_), 0.15, 1)
        base = src[int(y), int(x)]; t = tint[rng.integers(len(tint))]
        c = base * (1 - k) + t * k
        cc = tuple(int(v) for v in np.clip(c * 255, 0, 255))
        r = rad * rng.uniform(0.6, 1.3) * SS
        for dx in (-w, 0, w):
            X, Y = (x + dx) * SS, y * SS
            if X < -60 or X > w * SS + 60: continue
            dr.ellipse([X - r / cl, Y - r, X + r / cl, Y + r], fill=cc)
    return cv

def ring(D, centre, deg):
    """Angle from `centre` minus `deg` degrees (radians): 0 on a ring of that radius round it (a halo, a bow)."""
    return np.arccos(np.clip((D * centre).sum(-1), -1, 1)) - np.radians(deg)

# ================================================================== WATERCOLOUR: Wonder
def wonder(D, lat, lon):
    """Wonder, in watercolour: a sky you stop walking for, kept pale and airy: cool washes from a milky ice-blue horizon to periwinkle and
    a violet crown, laid thin so the paper glows through; aurora ribbons hung across it (curtains from the labradorite's green to lapis
    and violet, their lower hems bright and their folds striated), the 22-degree halo and its two sun dogs round a high pale sun, and
    diamond dust: specks of paper lifted out and glinting in prism colours. After Sargent's Alpine watercolours, Turner's colour
    beginnings, and the auroras painted by Frederic Church (Aurora Borealis, 1865)."""
    img, tooth = P.paper(D, '#f6f3ea')
    gr = P.granule(D)
    el = lat / (np.pi / 2)
    sun = sundir(1.1, 0.42)
    img = wash(img, (0.35 + 0.4 * ss(-0.05, 0.9, el)) * (0.9 + 0.2 * fbm(D * 1.8, 4, seed=71)), '#8fbce8', 0.95, rim=0.0, gran=0.5, grain=gr)
    img = wash(img, ss(0.25, 1.0, el) * 0.75 * (0.85 + 0.3 * fbm(D * 2.4, 3, seed=72)), '#9a92e0', 0.85, rim=0.15, rim_r=6, gran=0.7, grain=gr)
    img = wash(img, ss(0.55, 1.0, el) * 0.8, '#6e62c8', 0.75, rim=0.0, gran=0.7, grain=gr)
    img = wash(img, band(lat, -0.02, 0.18, 0.1) * 0.5, '#d2eef0', 0.6, rim=0.0)                         # the milky ice at the horizon
    # the aurora: curtains hung along wandering paths round the dome, bright at the hem, fading upward, striated in their folds
    ringD = lambda a, b, sh=0: np.stack([np.cos(lon + sh) * a, lat * b, np.sin(lon + sh) * a], -1)
    for seed, mid, amp, k in ((131, 0.62, 0.16, 1.0), (137, 0.9, 0.12, 0.75), (141, 0.42, 0.1, 0.55)):
        hem = mid + amp * fbm(ringD(1.4, 0.0), 3, seed=seed) + 0.04 * fbm(ringD(5, 0.0), 2, seed=seed + 1)
        up = lat - hem
        curtain = ss(-0.025, 0.0, up) * np.exp(-np.clip(up, 0, None) / 0.2)
        rays = 0.55 + 0.45 * ss(-0.4, 0.5, gnoise(ringD(70, 2.5), seed + 2) * 0.7 + gnoise(ringD(180, 5), seed + 3) * 0.3)
        on = ss(-0.15, 0.25, fbm(ringD(1.1, 0.0, 1.0), 3, seed=seed + 4))                                 # the ribbon breaks and resumes
        A = curtain * rays * on * k
        img = wash(img, ss(0.0, 0.45, A) * ss(-0.02, 0.05, -up + 0.06), '#5ad0a0', 0.85, rim=0.9, rim_r=2, gran=0.5, grain=gr)   # the green hem
        img = wash(img, A * ss(0.02, 0.14, up), '#5f74e0', 0.8, rim=0.6, rim_r=3, gran=0.6, grain=gr)                          # lapis above
        img = wash(img, A * ss(0.12, 0.3, up) * 0.8, '#a272dc', 0.7, rim=0.4, rim_r=3, gran=0.6, grain=gr)                     # violet tops
    # the halo at 22 degrees, a prism's edge (red inside to violet out), and the two sun dogs at the sun's height
    r = ring(D, sun, 22)
    for off, wdt, col, k in ((0, 0.009, '#ffb08a', 0.45), (0.011, 0.01, '#ffe8a0', 0.35), (0.022, 0.011, '#a0e0c0', 0.3), (0.034, 0.014, '#9a9af0', 0.35)):
        img = wash(img, np.exp(-((r - off) / wdt) ** 2) * k, col, 0.7, rim=0.0)
    for s in (-1, 1):
        dog = sundir(1.1 + s * np.radians(22) / np.cos(0.42), 0.42)
        d = np.arccos(np.clip((D * dog).sum(-1), -1, 1))
        img = wash(img, np.exp(-(d / 0.02) ** 2) * 0.8, '#ffd6a0', 0.6, rim=0.0)
        img = img * (1 - np.exp(-(d / 0.008) ** 2)[..., None] * 0.7) + hexc('#fffcf2') * np.exp(-(d / 0.008) ** 2)[..., None] * 0.7
    cs = np.clip((D * sun).sum(-1), -1, 1)
    lift = np.exp(-(np.arccos(cs) / 0.06) ** 2)
    img = img * (1 - lift[..., None]) + hexc('#fffef8') * lift[..., None]
    # diamond dust: paper lifted out in tiny specks, some carrying a prism tint
    sparse = ss(0.0, 0.4, fbm(D * 3, 3, seed=151)) * ss(-0.02, 0.1, lat)
    speck = ss(0.62, 0.8, gnoise(D * 900, 152)) * sparse
    tint = ramp(0.5 + 0.5 * gnoise(D * 300, 153), [(0, '#ffd0f0'), (0.33, '#fff8e0'), (0.66, '#d0f4ff'), (1, '#e0d8ff')])
    img = img * (1 - speck[..., None]) + tint * speck[..., None]
    img = below(img, lat, '#c4d4ea', 0.7)
    return wonder_glints(img)

def wonder_glints(img, seed=155):
    """The bigger glints of the diamond dust: six-rayed sparkles (hexagonal ice) scattered over the finished wash."""
    from PIL import ImageDraw
    rng = np.random.default_rng(seed); w, h = P.W, P.H
    im = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)); dr = ImageDraw.Draw(im)
    n = 0
    while n < 420:
        lat_ = rng.uniform(0.04, 1.3); lon_ = rng.uniform(-np.pi, np.pi)
        if rng.random() > np.cos(lat_): continue
        n += 1; x, y = _px(lat_, lon_); cl = max(np.cos(lat_), 0.2)
        R = rng.uniform(1.5, 5.5); col = tuple(int(v * 255) for v in [hexc('#ffffff'), hexc('#e8f6ff'), hexc('#fff0fa'), hexc('#eaffee')][rng.integers(4)])
        rot = rng.uniform(0, np.pi / 3)
        for dx in (-w, 0, w):
            for i in range(3):
                a = rot + i * np.pi / 3; ex, ey = np.cos(a) * R / cl, np.sin(a) * R
                dr.line([(x + dx - ex, y - ey), (x + dx + ex, y + ey)], fill=col, width=1)
            dr.ellipse([x + dx - 1, y - 1, x + dx + 1, y + 1], fill=col)
    return np.asarray(im, np.float32) / 255

# ================================================================== OIL: Mirth
def mirth(D, lat, lon):
    """Mirth, in oil: the fox's wedding (kitsune no yomeiri), rain falling out of sunshine: warm gold light from a low sun, cumulus with
    butter-lit tops and apricot shadows, a rainbow opposite the sun (the primary at 42 degrees, brighter inside it, Alexander's dark
    band, the faint secondary at 51 reversed), gold drops falling through it all, and Mirth's dots dabbed into the clouds as broken
    colour. After Turner's late suns, Constable's rainbow over Salisbury, and the pointillists' dabs (Seurat, Signac)."""
    el = lat / (np.pi / 2)
    sun = sundir(-0.6, 0.3)
    cs = np.clip((D * sun).sum(-1), -1, 1)
    base = ramp(el, [(-1, '#b8862e'), (-0.03, '#f6d27a'), (0.05, '#ffe6a0'), (0.25, '#f8d27a'), (0.55, '#e8c06a'), (0.8, '#b8c8a0'), (1, '#8ab8c0')])
    glow = np.exp((cs - 1) * 7)[..., None]; halo = np.exp((cs - 1) * 1.6)[..., None]
    base = base * (1 - 0.6 * glow) + hexc('#fff8d8') * glow * 0.9 + hexc('#ffd040') * halo * 0.3
    # the bow round the antisolar point: violet inside (40.6 deg) to red outside (42.4), widened a touch for the brush
    anti = -sun
    rb = ring(D, anti, 40.2) / np.radians(2.8)
    bowc = ramp(rb, [(0, '#9a6ad8'), (0.2, '#5a8ae8'), (0.4, '#58c070'), (0.6, '#f8e040'), (0.8, '#f8a040'), (1, '#e85040')])
    bowk = (ss(-0.05, 0.1, rb) * (1 - ss(0.9, 1.05, rb)) * 0.8 * ss(0.0, 0.08, lat))[..., None]
    inside = (ss(0.5, -1.5, rb) * np.exp(np.clip(rb, -20, 0) * 0.08) * ss(0.0, 0.08, lat))[..., None]
    alex = (ss(1.0, 1.4, rb) * (1 - ss(3.0, 3.4, rb)) * ss(0.0, 0.08, lat))[..., None]
    base = base * (1 + 0.12 * inside) * (1 - 0.1 * alex)
    rb2 = ring(D, anti, 50.4) / np.radians(3.4)
    bow2 = ramp(rb2, [(0, '#e85040'), (0.25, '#f8b040'), (0.5, '#80c060'), (0.75, '#5a8ae8'), (1, '#9a6ad8')])
    bow2k = (ss(-0.05, 0.1, rb2) * (1 - ss(0.9, 1.05, rb2)) * 0.32 * ss(0.0, 0.08, lat))[..., None]
    F, hf = cumulus(D, lat, 0.03, 0.42, 2.0, 81, cover=0.06)
    dens = ss(0.0, 0.06, F)
    Fl, _ = cumulus(D - sun * 0.04, lat, 0.03, 0.42, 2.0, 81, cover=0.06)
    lit = np.clip((ss(0.0, 0.06, F) - ss(0.0, 0.06, Fl)) * 3 + hf * 0.5 + 0.5 * halo[..., 0], 0, 1)
    shade = ramp(hf, [(0, '#d08a5a'), (0.5, '#e8aa70'), (1, '#f5d090')])
    cloud = shade * (1 - lit[..., None]) + hexc('#fff0b0') * lit[..., None]
    img = base * (1 - dens[..., None]) + cloud * dens[..., None]
    img = img * (1 - bowk * (1 - dens[..., None] * 0.7)) + bowc * bowk * (1 - dens[..., None] * 0.7)
    img = img * (1 - bow2k) + bow2 * bow2k
    img = below(img, lat, '#c99a40', 0.6)
    bowmask = np.clip(bowk[..., 0] * 2 + bow2k[..., 0] * 3, 0, 1)
    fx, fy = P.flow_field(D, lat, np.clip(dens + bowmask, 0, 1), along=0.85, curl=0.45, scale=2.0, seed=82)
    edge = np.clip(np.hypot(*np.gradient(blur(dens, 2))) * 60, 0, 1)
    cv = P.strokes(img, fx, fy, [dict(w=24, len=7, step=12, jitter=0.02, bristles=5, stop=0.35),
                                 dict(w=11, len=6, step=7, jitter=0.02, bristles=4, stop=0.25),
                                 dict(w=5, len=5, step=4, jitter=0.03, bristles=3, stop=0.15, where=0.1 + 0.9 * edge + bowmask + 0.5 * glow[..., 0])],
                   seed=83, lat=lat)
    rng = np.random.default_rng(84)
    tints = [hexc(c) for c in ('#fff4c0', '#ffc8a0', '#ffe070', '#f8b0b8', '#ffffff')]
    cv = dabs(cv, rng, 26000, np.clip(dens * (0.3 + 0.7 * hf), 0, 1), img, 2.6, tints, k=0.55)        # Mirth's dots in the clouds
    gold = [hexc(c) for c in ('#ffe27a', '#ffd040', '#fff2b8', '#f8c050')]
    cv = streaks(cv, rng, 2600, 0.0, 1.0, 9, 1.4, gold, slant=0.12)                                    # the sunshower's drops
    return P.finish_oil(cv, impasto=0.7)

# ================================================================== OIL: Grief
def grief(D, lat, lon):
    """Grief, in oil: the long rain. A low, heavy overcast drained nearly of colour, grey on grey, the banks' bellies sagging; under them
    the rain in sheets, curtains of silver dragged straight down to the horizon and slanting with the wind, thicker and thinner in
    turn; and in the greys the labradorite's sheen (Illusion's), a cold play of teal, green and a little gold that comes and goes as the
    stone is turned. After Whistler's grey nocturnes, Constable's rain studies (Rainstorm over the Sea) and Hiroshige's Sudden Shower."""
    el = lat / (np.pi / 2)
    base = ramp(el, [(-1, '#3a3e44'), (-0.03, '#7e848a'), (0.0, '#b2b6b8'), (0.06, '#8e9498'), (0.25, '#6a7078'), (0.6, '#545a64'), (1, '#40454e')])
    F, hf = cumulus(D, lat, 0.08, 0.95, 1.5, 161, cover=0.32, squash=2.2, warpk=0.4)
    dens = ss(0.0, 0.1, F)
    belly = ramp(hf, [(0, '#3a3e46'), (0.4, '#585e68'), (0.8, '#767c84'), (1, '#8a9096')])
    img = base * (1 - dens[..., None] * 0.85) + belly * dens[..., None] * 0.85
    # the labradorite's sheen: a cold schiller played through the greys, in patches
    ph = fbm(warp(D, 0.5, 1.2, 162) * 2.2, 4, seed=163)
    sheen = ramp(0.5 + 0.5 * np.sin(ph * 7), [(0, '#4a8a9e'), (0.35, '#5aa08a'), (0.6, '#8aa070'), (0.8, '#b0a06a'), (1, '#6a7ab0')])
    sk = (ss(0.1, 0.4, fbm(D * 1.6, 3, seed=164)) * 0.4 * (0.4 + 0.6 * dens) * ss(0.0, 0.1, lat))[..., None]
    img = img * (1 - sk) + sheen * (img.mean(-1, keepdims=True) * 1.25) * sk
    # the sheets of rain: curtains (on a ring round the dome) from under the cloud to the horizon, slanted by the wind
    slant = 0.35
    ringD = lambda a, b: np.stack([np.cos(lon + lat * slant) * a, lat * b, np.sin(lon + lat * slant) * a], -1)
    sheets = ss(-0.1, 0.35, fbm(ringD(2.2, 0.2), 3, seed=165)) * (1 - ss(0.35, 0.6, lat)) * ss(-0.02, 0.03, lat)
    streak = ss(-0.2, 0.6, gnoise(ringD(90, 0.6), 166) * 0.6 + gnoise(ringD(260, 1.2), 167) * 0.4)
    rain = sheets * (0.45 + 0.55 * streak)
    img = img * (1 - rain[..., None] * 0.45) + hexc('#b8bec6') * rain[..., None] * 0.45
    img = below(img, lat, '#5a6068', 0.8)
    fx, fy = P.flow_field(D, lat, dens, along=0.5, curl=0.25, scale=1.6, seed=168)
    # in the rain the strokes run down (a little slanted): the brush dragged with the falling water
    rk = np.clip(sheets * 1.6, 0, 1)
    vx, vy = np.full_like(fx, -slant * 0.6), np.ones_like(fy)
    sg = np.sign(fy * vy + fx * vx + 1e-6)
    fx2 = fx * (1 - rk) + vx * rk * sg; fy2 = fy * (1 - rk) + vy * rk * sg
    n = np.hypot(fx2, fy2) + 1e-6; fx2, fy2 = (fx2 / n).astype(np.float32), (fy2 / n).astype(np.float32)
    cv = P.strokes(img, fx2, fy2, [dict(w=28, len=12, step=14, jitter=0.03, bristles=6, stop=0.45),
                                   dict(w=13, len=10, step=8, jitter=0.03, bristles=4, stop=0.3),
                                   dict(w=5, len=9, step=5, jitter=0.03, bristles=3, stop=0.2, where=0.15 + 0.85 * rk)],
                   seed=169, lat=lat)
    rng = np.random.default_rng(170)
    silver = [hexc(c) for c in ('#a8b0ba', '#bcc2ca', '#98a4b0', '#a8bcc0')]
    cv = streaks(cv, rng, 2400, 0.0, 0.62, 30, 0.7, silver, slant=-slant * 0.6, where=np.clip(0.04 + sheets ** 1.5, 0, 1))
    return P.finish_oil(cv, impasto=0.55)

# ================================================================== OIL: Gall
def gall(D, lat, lon):
    """Gall, in oil: the miasma's sky, low and flat and bilious. A lid of curdled cloud (Gall's curds: soft swollen lumps in rows, a
    mackerel sky gone off), Gall's violet greyed toward bile, each curd's top skinned a sickly pale and its underside sour green; at the
    horizon a band of sour green-yellow (#a8c040) under a bruise. After Turner's sulphurous skies (The Burning of the Houses of Lords
    and Commons) and Ensor's soured palettes."""
    el = lat / (np.pi / 2)
    base = ramp(el, [(-1, '#2e3020'), (-0.03, '#7a8a30'), (0.0, '#c8d860'), (0.03, '#a8c040'), (0.08, '#7e8a48'), (0.14, '#6a4e6e'),
                     (0.3, '#6e6470'), (0.6, '#5a5262'), (1, '#3e3446')])
    cellD = warp(D, 0.2, 1.4, 101) * np.array([4, 7, 4], np.float32)                                  # the curds, bigger than the last pass
    lump = fbm(cellD, 3, seed=102)
    region = ss(-0.35, 0.05, fbm(D * 1.3, 3, seed=103)) * band(lat, 0.07, 1.0, 0.12)
    drops = ss(-0.02, 0.24, lump) * region
    skin = ss(0.14, 0.42, lump + 0.08 * (lat - 0.4)) * drops
    under = ss(0.12, -0.04, lump) * drops
    body = hexc('#5e5272')
    img = base * (1 - drops[..., None] * 0.85) + body * drops[..., None] * 0.85
    img = img * (1 - skin[..., None] * 0.6) + hexc('#c8c48a') * skin[..., None] * 0.6
    img = img * (1 - under[..., None] * 0.55) + hexc('#7e8a3a') * under[..., None] * 0.55
    bruise = band(lat, 0.06, 0.16, 0.05) * (0.6 + 0.4 * fbm(D * 3, 3, seed=104))
    img = img * (1 - bruise[..., None] * 0.4) + hexc('#4e3a5a') * bruise[..., None] * 0.4
    img = below(img, lat, '#4a4a30', 0.75)
    fx, fy = P.flow_field(D, lat, drops, along=0.85, curl=0.7, scale=2.0, seed=105)
    edge = np.clip(np.hypot(*np.gradient(blur(drops, 2))) * 60, 0, 1)
    cv = P.strokes(img, fx, fy, [dict(w=28, len=9, step=13, jitter=0.04, bristles=5, stop=0.45),
                                 dict(w=13, len=7, step=8, jitter=0.04, bristles=4, stop=0.3),
                                 dict(w=6, len=6, step=4, jitter=0.04, bristles=3, stop=0.2, where=0.15 + 0.85 * edge)],
                   seed=106, lat=lat)
    return P.finish_oil(cv, impasto=0.8)

# ================================================================== WATERCOLOUR: Calm (dawn)
def dawn(D, lat, lon):
    """Fair, at dawn, in watercolour: the calm, after Turner's Venice sketchbooks: rose and peach rising from a bright horizon into a
    clean pale blue, two long bars of lilac cloud each laid in one stroke, the sun a reserve of bare paper with its warmth bled round it."""
    img, tooth = P.paper(D, '#f6f0e2')
    gr = P.granule(D)
    el = lat / (np.pi / 2)
    sun = sundir(2.6, 0.02)
    cs = np.clip((D * sun).sum(-1), -1, 1)
    halo = np.exp((cs - 1) * 3)
    img = wash(img, ss(0.1, 1.0, el) * 0.95, '#8fb6e2', 0.8, rim=0.0, gran=0.4, grain=gr)
    img = wash(img, band(lat, -0.05, 0.35, 0.15) * (0.55 + 0.45 * halo), '#f4a988', 0.8, rim=0.0, gran=0.3, grain=gr)
    img = wash(img, band(lat, 0.18, 0.55, 0.15) * 0.6, '#e9a6c0', 0.5, rim=0.0, gran=0.3, grain=gr)
    img = wash(img, band(lat, -0.02, 0.1, 0.06) * (0.4 + 0.6 * halo), '#ffd98a', 0.7, rim=0.0)
    Dh = D * np.array([1, 14, 1], np.float32)
    bars = ss(0.1, 0.22, fbm(warp(Dh, 0.2, 0.7, 121) * 1.2, 4, seed=122)) * band(lat, 0.05, 0.22, 0.04)
    img = wash(img, bars, '#9a7ab0', 0.7, rim=1.4, rim_r=2, gran=0.8, grain=gr)
    lift = np.exp(-(np.arccos(cs) / 0.05) ** 2)
    img = img * (1 - lift[..., None]) + hexc('#fffbea') * lift[..., None]
    img = below(img, lat, '#d8b8b0', 0.7)
    return img

from eye import eye
EYE = {'wonder': ('#8a96e0', 'water'), 'mirth': ('#f2c84a', 'oil'), 'desire': ('#ff7a4a', 'oil'), 'fury': ('#c80018', 'oil'),
       'gall': ('#8a9a40', 'oil'), 'grief': ('#8a9aac', 'oil'), 'dread': ('#3f6a4a', 'oil'), 'dawn': ('#c9a27a', 'water')}
RECIPES = {'grief': grief, 'desire': desire, 'wonder': wonder, 'mirth': mirth, 'fury': fury, 'gall': gall, 'dread': dread, 'dawn': dawn}

def sheet(img, path):
    vs = [P.view(img, yaw, 0.12, 75) for yaw in (0.3, 2.2, 4.2)] + [P.view(img, 1.0, 0.9, 75)]
    top = np.concatenate(vs[:2], 1); bot = np.concatenate(vs[2:], 1)
    small = np.asarray(Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).resize((1280, 640), Image.LANCZOS), np.float32) / 255
    P.save(np.concatenate([top, bot, small], 0), path)

if __name__ == '__main__':
    names = sys.argv[1:] or list(RECIPES)
    D, lat, lon = P.dirs()
    for n in names:
        t = time.time(); img = RECIPES[n](D, lat, lon)
        img = eye(img, D, lat, lon, EYE[n][0], EYE[n][1])
        P.save(img, f'{OUT}{n}.png'); sheet(img, f'{OUT}{n}_sheet.png')
        print(n, f'{time.time() - t:.1f}s', flush=True)
