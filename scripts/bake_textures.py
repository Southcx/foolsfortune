#!/usr/bin/env python3
# ---------------------------------------------------------------------------------------
# BAKE THE TILING TEXTURES: the CC0 surfaces for the triplanar material (render/triplanar.js; the owner, R46: "pull open source cc0
# options for now and credit accordingly"). Each is an ambientCG material (CC0 1.0, https://ambientcg.com), taken at 1K and brought to
# the game: its light and shade (the colour map's, darkened by its occlusion map where it has one) graded to the colour that surface already has in the game (its light and shade kept, its hue pulled to the palette:
# docs/ART.md, precept 1) and taken down to 256 px (the 480-line look), still tiling.
#
#   python3 scripts/bake_textures.py <folder with the unzipped 1K-JPG sets>   -> src/assets/textures/<name>.jpg
# ---------------------------------------------------------------------------------------
import os, sys, glob
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', 'assets', 'textures')
# name: (ambientCG id, the game's colour for it, how much of the photo's own colour is kept, contrast)
SETS = {
    'sand':        ('Ground080',       0xe8b070, 0.25, 1.8),   # (the Dunes' sand, dunes.js)
    'sand_packed': ('Ground079S',      0xd9a066, 0.25, 1.0),   # (the Dunemaw's sand, vfx/dunemawkit.js)
    'rock':        ('Rock061',         0x9a5a40, 0.3, 1.1),    # (layered sandstone in the Dunemaw's oxide)
    'clay_floor':  ('Tiles144',        0x8c4a33, 0.35, 1.0),   # (terracotta tiles; the Workshop's clay, PALETTE.wall)
    'plaster':     ('Plaster001',      0xd8b896, 0.2, 1.3),    # (lime plaster, warm)
    'stone_flags': ('PavingStones128', 0xa48a72, 0.25, 1.1),   # (flagstones, a warm grey)
}

def lin(c): c = c / 255.0; return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def srgb(c): c = np.clip(c, 0, 1); return np.where(c <= 0.0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - 0.055) * 255

src = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
for name, (aid, hexc, keep, k) in SETS.items():
    f = glob.glob(os.path.join(src, '**', f'{aid}_1K-JPG_Color.jpg'), recursive=True)[0]
    im = lin(np.asarray(Image.open(f).convert('RGB')).astype(np.float64))
    L = im @ np.array([0.2126, 0.7152, 0.0722])
    ao = glob.glob(os.path.join(src, '**', f'{aid}_1K-JPG_AmbientOcclusion.jpg'), recursive=True)
    if ao: L = L * (np.asarray(Image.open(ao[0]).convert('L')).astype(np.float64) / 255.0) ** 0.8  # (the ripples and the cracks live in the occlusion more than in the colour)
    rel = (L / L.mean()) ** k                                            # (its light and shade, about 1)
    tgt = lin(np.array([(hexc >> 16) & 255, (hexc >> 8) & 255, hexc & 255], np.float64))
    own = im / np.maximum(L, 1e-4)[..., None] * (tgt @ np.array([0.2126, 0.7152, 0.0722]))  # (the photo's own hue at the target's brightness)
    out = (tgt * (1 - keep) + own * keep) * rel[..., None]
    img = Image.fromarray(srgb(out).astype(np.uint8)).resize((256, 256), Image.LANCZOS)
    img.save(os.path.join(OUT, f'{name}.jpg'), quality=88)
    print(f'{name}: {aid} -> {name}.jpg, mean #{hexc:06x}')
