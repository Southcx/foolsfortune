import sys, time, numpy as np
from PIL import Image
import painter as P
from painter import hexc, ss, fbm, gnoise, warp, blur, wash, ramp

OUT = '/tmp/sky/'

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

# ================================================================== WATERCOLOUR: Grief
def grief(D, lat, lon):
    """Grief, in watercolour: melancholy, the colour nearly drained out of it: a low, even overcast of grey-blue (Grief's periwinkle with
    most of its colour gone), soft banks laid wet in wet with darker pooled bases, long slanted veils of rain (Grief's streaks), and no
    break of light; after Whistler's nocturnes and Turner's late grey washes."""
    img, tooth = P.paper(D, '#eeece7')
    gr = P.granule(D)
    el = lat / (np.pi / 2)
    A = (0.5 + 0.4 * ss(-0.05, 1.0, el)) * (0.88 + 0.22 * fbm(D * 2.2, 4, seed=2))
    img = wash(img, A, '#9ea8bd', 0.9, rim=0.0, gran=0.5, grain=gr)
    img = wash(img, A * 0.6 * ss(-0.3, 0.3, fbm(D * 1.6, 4, seed=3)), '#8e93a6', 0.6, rim=0.0, gran=0.5, grain=gr)
    for base_, top, sc, seed, cov in ((0.03, 0.4, 1.6, 11, 0.2), (0.25, 0.75, 2.2, 51, 0.1)):
        F, hf = cumulus(D, lat, base_, top, sc, seed, cov, squash=1.8)
        inside = ss(0.0, 0.05, F)
        belly = inside * (1 - ss(0.0, 0.7, hf + 0.25 * fbm(D * 6, 3, seed=seed + 5)))
        img = wash(img, inside * 0.5, '#8a90a2', 0.55, rim=0.8, rim_r=3, gran=0.9, grain=gr)
        img = wash(img, belly * 0.8, '#5f6577', 0.6, rim=1.3, rim_r=2, gran=1.2, grain=gr)
    slant = lat * 1.4
    cyl = lambda a, b, sh: np.stack([np.cos(lon + sh) * a, lat * b, np.sin(lon + sh) * a], -1)
    shafts = ss(-0.05, 0.3, fbm(cyl(1.6, 0.15, slant * 0.6), 3, seed=23))
    streak = gnoise(cyl(16, 0.4, slant), 21) * 0.6 + gnoise(cyl(60, 1.0, slant), 22) * 0.4
    rain = shafts * band(lat, -0.02, 0.2, 0.06) * (0.35 + 0.65 * ss(-0.1, 0.35, streak))
    img = wash(img, rain, '#6c7286', 0.7, rim=0.3, rim_r=2, gran=1.2, grain=gr)
    img = below(img, lat, '#9ca2b0', 0.75)
    return img

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


# ================================================================== WATERCOLOUR: Wonder
def wonder(D, lat, lon):
    """Wonder, in watercolour: a sky you stop walking for, in Wonder's own cyan: a cerulean-to-turquoise wash laid wet and strong, frost
    feathers of cirrus lifted out of it (Wonder's frost), a 22-degree halo with a prism's edge, and a second, paler arc of a sundog;
    after Sargent's Alpine sketches and the Hudson River painters' clear skies."""
    img, tooth = P.paper(D, '#f5f1e6')
    gr = P.granule(D)
    el = lat / (np.pi / 2)
    sun = sundir(1.1, 0.75)
    cs = np.clip((D * sun).sum(-1), -1, 1)
    ang = np.arccos(cs)
    A = (0.55 + 0.45 * ss(-0.05, 0.8, el)) * (0.9 + 0.2 * fbm(D * 2, 4, seed=71))
    img = wash(img, A, '#4fc6e2', 0.95, rim=0.0, gran=0.5, grain=gr)
    img = wash(img, ss(0.3, 1.0, el) * 0.8, '#2a8fd0', 0.75, rim=0.0, gran=0.6, grain=gr)
    img = wash(img, band(lat, 0.0, 0.25, 0.12) * 0.55, '#8fe4dc', 0.6, rim=0.0, gran=0.3, grain=gr)      # turquoise low down
    for sc, seed, k in ((2.2, 72, 1.0), (3.5, 73, 0.75)):
        Dh = warp(D, 0.5, 0.8, seed) * np.array([1, 3.5, 1], np.float32)
        spine = fbm(Dh * sc, 4, seed=seed)
        comb = 0.5 + 0.5 * np.sin(fbm(D * 1.3, 2, seed=seed + 1) * 60 + spine * 18)
        feather = ss(0.08, 0.28, spine) * (0.4 + 0.6 * comb) * band(lat, 0.15, 1.4, 0.2) * k
        img = img * (1 - feather[..., None] * 0.85) + hexc('#f8f8f2') * feather[..., None] * 0.85
        img = wash(img, feather * 0.3, '#5aa8d8', 0.5, rim=1.4, rim_r=1, gran=0.7, grain=gr)
    r = ang - np.radians(22)
    for off, wdt, col, k in ((0, 0.011, '#ff9a6a', 0.65), (0.012, 0.011, '#ffe27a', 0.5), (0.024, 0.012, '#7ad8a0', 0.45), (0.036, 0.014, '#6a7ef0', 0.5)):
        img = wash(img, np.exp(-((r - off) / wdt) ** 2) * k, col, 0.7, rim=0.0)                       # the halo's prism, red inside to violet out
    lift = np.exp(-(ang / 0.09) ** 2)
    img = img * (1 - lift[..., None]) + hexc('#fffef6') * lift[..., None]
    img = below(img, lat, '#8fd2e0', 0.7)
    return img

# ================================================================== OIL: Mirth
def mirth(D, lat, lon):
    """Mirth, in oil: golden radiance after Turner's late suns and Monet's Impression, Sunrise: the whole dome a blaze of gold and
    honey, a low sun throwing rays through heaped cumulus whose lit sides burn butter-yellow, the shadows warm apricot, a breath of
    turquoise only far overhead; Mirth's dots in the dabbed broken colour."""
    el = lat / (np.pi / 2)
    sun = sundir(-0.6, 0.22)
    cs = np.clip((D * sun).sum(-1), -1, 1)
    base = ramp(el, [(-1, '#b8862e'), (-0.03, '#f7d77a'), (0.05, '#ffe9a0'), (0.25, '#f6c95a'), (0.6, '#e9b84a'), (0.85, '#cfc27a'), (1, '#9cc7b4')])
    glow = np.exp((cs - 1) * 7)[..., None]; halo = np.exp((cs - 1) * 1.6)[..., None]
    rays = (0.5 + 0.5 * np.sin(np.arctan2((D * np.cross(sun, [0, 1, 0])).sum(-1), (D * [0, 1, 0]).sum(-1) - sun[1] * cs) * 26 + fbm(D * 2, 2, seed=84) * 3)) ** 3
    base = base * (1 - 0.6 * glow) + hexc('#fff8d8') * glow * 0.9 + hexc('#ffd040') * halo * 0.35
    base = base + hexc('#fff2b0') * (rays * np.exp((cs - 1) * 2.5) * 0.35)[..., None]
    F, hf = cumulus(D, lat, 0.03, 0.42, 2.0, 81, cover=0.12)
    dens = ss(0.0, 0.06, F)
    Fl, _ = cumulus(D - sun * 0.04, lat, 0.03, 0.42, 2.0, 81, cover=0.12)
    lit = np.clip((ss(0.0, 0.06, F) - ss(0.0, 0.06, Fl)) * 3 + hf * 0.5 + 0.5 * halo[..., 0], 0, 1)
    shade = ramp(hf, [(0, '#d08a4a'), (0.5, '#e6a860'), (1, '#f5d08a')])
    cloud = shade * (1 - lit[..., None]) + hexc('#fff0a8') * lit[..., None]
    img = base * (1 - dens[..., None]) + cloud * dens[..., None]
    img = below(img, lat, '#c99a40', 0.6)
    fx, fy = P.flow_field(D, lat, dens, along=0.85, curl=0.5, scale=2.0, seed=82)
    edge = np.clip(np.hypot(*np.gradient(blur(dens, 2))) * 60, 0, 1)
    cv = P.strokes(img, fx, fy, [dict(w=26, len=7, step=12, jitter=0.02, bristles=5, stop=0.45),
                                 dict(w=12, len=5, step=7, jitter=0.02, bristles=4, stop=0.3),
                                 dict(w=6, len=3, step=4, jitter=0.03, bristles=3, stop=0.2, where=0.1 + 0.9 * edge + 0.5 * glow[..., 0])],
                   seed=83, lat=lat)
    return P.finish_oil(cv, impasto=0.7)

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

# ================================================================== WATERCOLOUR: Gall
def gall(D, lat, lon):
    """Gall, in watercolour: a bruised violet sky in Gall's own colour, a mackerel sky curdled into lumps (Gall's curds): each lump a
    rounded drop of granulating violet laid wet into wet, its rim pooled dark, a pale skin on its top; a sour green band at the horizon,
    the colour of a grudge held."""
    img, tooth = P.paper(D, '#f1ede2')
    gr = P.granule(D)
    el = lat / (np.pi / 2)
    img = wash(img, (0.55 + 0.45 * ss(-0.05, 1.0, el)), '#9a72d0', 0.95, rim=0.0, gran=1.0, grain=gr)
    img = wash(img, ss(0.35, 1.0, el) * 0.9, '#5a2f96', 0.8, rim=0.0, gran=1.1, grain=gr)
    img = wash(img, band(lat, -0.05, 0.14, 0.08), '#a8c040', 0.75, rim=0.3, rim_r=4, gran=0.5, grain=gr)     # the sour green
    # the curds: soft swollen lumps in rows (a mackerel sky curdled), laid wet into wet: big, overlapping, their rims only a little darker
    cellD = warp(D, 0.18, 1.6, 101) * np.array([5, 9, 5], np.float32)
    lump = fbm(cellD, 3, seed=102)
    region = ss(-0.3, 0.1, fbm(D * 1.4, 3, seed=103)) * band(lat, 0.06, 0.95, 0.14)
    drops = ss(0.0, 0.22, lump) * region
    img = wash(img, drops, '#4f2d86', 0.75, rim=0.9, rim_r=4, gran=1.8, grain=gr)
    skin = ss(0.18, 0.45, lump + 0.1 * (lat - 0.4)) * drops
    img = img * (1 - skin[..., None] * 0.45) + hexc('#d9c4ea') * skin[..., None] * 0.45
    img = wash(img, ss(0.25, 0.5, lump) * region * band(lat, 0.0, 0.3, 0.1), '#8a9a3a', 0.35, rim=0.0, gran=1.0, grain=gr)  # the curds' sour underbellies
    img = below(img, lat, '#7d6a9a', 0.75)
    return img

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
EYE = {'wonder': ('#5ec8e0', 'water'), 'mirth': ('#f2c84a', 'oil'), 'desire': ('#ff7a4a', 'oil'), 'fury': ('#c80018', 'oil'),
       'gall': ('#8a5ac8', 'water'), 'grief': ('#8fb0ff', 'water'), 'dread': ('#3f6a4a', 'oil'), 'dawn': ('#c9a27a', 'water')}
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
