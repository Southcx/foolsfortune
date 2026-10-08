#!/usr/bin/env python3
# ---------------------------------------------------------------------------------------
# BAKE THE GROUND PACK: four of the owner's noise gradients (source_assets/vfx/Noise_Gradients/) packed as the four grey channels of one
# texture, the height each painted ground of the Spirit Garden is drawn from (src/vfx/garden/gardengrounds.js; the glossary's "the
# ground's materials" and "the ground pack"). Each source is taken to grey, levelled (its 1st to 99th percentile to the full range) and
# scaled to SIZE; they tile already (measured: the step across the wrap is 1.0 to 1.2 times the step inside), so no seamless blend:
#
#   R  moss    T_Random_39   soft cushions with dark hollows between them (the celadon moss's clumps)
#   G  loam    T_Random_46   a felt of fine fibres (the rootlets through the loess)
#   B  slate   T_Random_62   long streaks down one axis (the cleft of the stone)
#   A  silt    T_Random_22   cells parted by dark lines (mud polygons: silt crazed as it dried)
#   (ash has no channel here: it is drawn from the liquid pack's glowing cells, liquid_pack2.webp's A, the embers under the ash)
#
# Saved lossless and exact (the fourth channel is data, not coverage: what lies under a "transparent" texel is kept), as
# scripts/bake_liquid.py saves the liquid packs, which this follows.
#
#   python3 -I scripts/bake_ground.py          (writes src/assets/ground_pack.webp)
# ---------------------------------------------------------------------------------------
import os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NOISE = os.path.join(ROOT, 'source_assets', 'vfx', 'Noise_Gradients')
OUT = os.path.join(ROOT, 'src', 'assets', 'ground_pack.webp')
SIZE = 256 # (a texel 8 mm at the tile the shader lays, 2 m: finer than a 480-line pixel at any distance but the first-person view's nearest metre)
CHANNELS = ['T_Random_39', 'T_Random_46', 'T_Random_62', 'T_Random_22'] # (R moss, G loam, B slate, A silt)

def load(name):
    p = os.path.join(NOISE, name + '.png')
    if not os.path.exists(p):
        print(f'bake_ground: no {name} in {NOISE}: its channel stays mid-grey', file=sys.stderr)
        return None
    return np.asarray(Image.open(p).convert('L')).astype(np.float64) / 255.0

def level(a):
    lo, hi = np.percentile(a, 1), np.percentile(a, 99)
    return np.clip((a - lo) / max(1e-6, hi - lo), 0, 1)

def resize(a):
    return np.asarray(Image.fromarray((a * 255).astype(np.uint8)).resize((SIZE, SIZE), Image.LANCZOS)).astype(np.float64) / 255.0

def main():
    chans = []
    for n in CHANNELS:
        a = load(n)
        chans.append(np.full((SIZE, SIZE), 0.5) if a is None else resize(level(a)))
    rgba = np.stack(chans, -1)
    Image.fromarray((rgba * 255).round().astype(np.uint8), 'RGBA').save(OUT, 'WEBP', lossless=True, exact=True, method=6)
    print(f'bake_ground: {OUT} ({os.path.getsize(OUT) // 1024} KB, {SIZE}px)')

if __name__ == '__main__':
    main()
