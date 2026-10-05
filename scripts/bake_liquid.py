#!/usr/bin/env python3
# ---------------------------------------------------------------------------------------
# BAKE THE LIQUID PACK: the owner's noise photographs (source_assets/liquid/) made into the tileable masks the water and Lachryma
# shaders read (src/vfx/liquid.js). Each source is taken to grey, cropped square, levelled (its 1st to 99th percentile to the full
# range), made seamless, and scaled to SIZE; the four are packed as the channels of one texture:
#
#   R  marbling      oil cells and veins (marbling.jpg): the film on Lachryma, the slow swell on water
#   G  bubbles       rings and foam (bubbles.jpg): foam made of bubbles at the shore and on crests; Lachryma's rising beads
#   B  sand ripples  (sand_ripples.jpg): the floor seen through the water
#   A  veins         the marbling's bright ridges, high-passed: the film's veins on Lachryma
#   and a second pack (liquid_pack2.webp) from the owner's noise gradients (source_assets/vfx/Noise_Gradients/, tileable already):
#   R a dense caustic net, G a finer one, B wind-streaked ripples, A soft glowing cells
#
# SEAMLESS: the image is blended with a copy of itself offset by half (its seams in the middle), the copy weighted toward the borders;
# the blend is histogram-preserving (Heitz and Neyret, "High-Performance By-Example Noise using a Histogram-Preserving Blending
# Operator", 2018): the two are mixed with weights w1, w2 and the result divided by sqrt(w1^2 + w2^2) about the mean, so the blended
# band keeps the original's contrast instead of greying out. A missing source leaves its channel at mid-grey and says so.
#
#   python3 scripts/bake_liquid.py          (writes src/assets/liquid_pack.webp; add a source to source_assets/liquid/ and run it again)
# ---------------------------------------------------------------------------------------
import os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'source_assets', 'liquid')
NOISE = os.path.join(ROOT, 'source_assets', 'vfx', 'Noise_Gradients') # (the owner's noise gradients: already tileable)
OUT = os.path.join(ROOT, 'src', 'assets', 'liquid_pack.webp')
OUT2 = os.path.join(ROOT, 'src', 'assets', 'liquid_pack2.webp')
SIZE = 512
CHANNELS = ['marbling', 'bubbles', 'sand_ripples']
# the second pack, from the owner's noise gradients: R a dense caustic net (T_Random_53), G a finer one (48), B wind-streaked ripples
# (45), A soft glowing cells (23: light pooled inside Lachryma)
CHANNELS2 = ['T_Random_53', 'T_Random_48', 'T_Random_45', 'T_Random_23']

def load(name, src=SRC):
    for ext in ('.jpg', '.jpeg', '.png', '.webp'):
        p = os.path.join(src, name + ext)
        if os.path.exists(p):
            return np.asarray(Image.open(p).convert('L')).astype(np.float64) / 255.0
    print(f'bake_liquid: no {name} in {SRC}: its channel stays mid-grey', file=sys.stderr)
    return None

def soften(a):
    # (the sources are JPEGs: their 8 px blocks would be lifted into a grid by the levelling; a hair of blur first)
    from PIL import ImageFilter
    im = Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.3))
    return np.asarray(im).astype(np.float64) / 255.0

def square(a):
    h, w = a.shape; s = min(h, w); y0, x0 = (h - s) // 2, (w - s) // 2
    return a[y0:y0 + s, x0:x0 + s]

def level(a):
    lo, hi = np.percentile(a, 1), np.percentile(a, 99)
    return np.clip((a - lo) / max(1e-6, hi - lo), 0, 1)

def seamless(a):
    s = a.shape[0]; b = np.roll(np.roll(a, s // 2, 0), s // 2, 1)
    t = np.linspace(0, 1, s); edge = np.minimum(t, 1 - t) * 2        # (0 at the borders, 1 in the middle)
    e = np.minimum(edge[:, None], edge[None, :])
    w2 = np.clip(1 - e / 0.45, 0, 1) ** 2                             # (the shifted copy near the borders, where the original's seams are)
    w1 = 1 - w2
    m = a.mean()
    out = ((a - m) * w1 + (b - m) * w2) / np.sqrt(w1 ** 2 + w2 ** 2) + m
    return np.clip(out, 0, 1)

def resize(a):
    return np.asarray(Image.fromarray((a * 255).astype(np.uint8)).resize((SIZE, SIZE), Image.LANCZOS)).astype(np.float64) / 255.0

def veins(m):
    # the marbling's bright thin ridges: the image less its blur, kept where it is brighter than its surround
    from PIL import ImageFilter
    big = Image.fromarray((np.tile(m, (3, 3)) * 255).astype(np.uint8))   # (blurred as a tile, so the ridges wrap too)
    blur = np.asarray(big.filter(ImageFilter.GaussianBlur(3))).astype(np.float64)[SIZE:2 * SIZE, SIZE:2 * SIZE] / 255.0
    hp = np.clip((m - blur) * 4.0, 0, 1)
    return level(hp)

def main():
    chans = []
    for n in CHANNELS:
        a = load(n)
        if a is None: chans.append(np.full((SIZE, SIZE), 0.5)); continue
        chans.append(resize(seamless(level(square(soften(a))))))
    chans.append(veins(chans[0]))
    rgba = np.stack(chans, -1)
    Image.fromarray((rgba * 255).astype(np.uint8), 'RGBA').save(OUT, 'WEBP', lossless=True, exact=True, method=6)  # (lossless and exact: the fourth channel is data, not alpha, so what is under a 'transparent' pixel is kept)
    print(f'bake_liquid: {OUT} ({os.path.getsize(OUT) // 1024} KB, {SIZE}px)')
    # the second pack: these tile already (their edges match), so they are only levelled and scaled
    chans = []
    for n in CHANNELS2:
        a = load(n, NOISE)
        chans.append(np.full((SIZE, SIZE), 0.5) if a is None else resize(level(a)))
    Image.fromarray((np.stack(chans, -1) * 255).astype(np.uint8), 'RGBA').save(OUT2, 'WEBP', lossless=True, exact=True, method=6)
    print(f'bake_liquid: {OUT2} ({os.path.getsize(OUT2) // 1024} KB, {SIZE}px)')

if __name__ == '__main__':
    main()
