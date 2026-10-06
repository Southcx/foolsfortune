#!/usr/bin/env python3
# ---------------------------------------------------------------------------------------
# BAKE THE MASK'S FACES: the Courier's expressions, painted for the mask's E-ink face (src/vfx/maskface.js; the owner, 2026-10-06:
# "treat the Courier mask like an E-ink display"). Eight cells of the eye-and-brow region of the maker's mask (src/assets/courier/
# courier_mask.png), each made FROM the maker's own shapes, so the face stays the maker's: their eyes lidded, cut, squeezed or tilted,
# their brow commas raised, lowered or turned, never a new drawing over theirs. The mid-brown shadow under each eye (the maker's) is
# kept on every cell. Drawn at 4x and taken down to the mask's own resolution (its 512 px), so the edges are as soft as the maker's.
#
#   cells (4 by 2, in this order): neutral, happy, sad, angry, surprised, hurt, focused, sleepy
#   python3 scripts/bake_mask_faces.py   -> src/assets/courier/courier_mask_faces.png  (and a preview in source_assets/courier/)
# ---------------------------------------------------------------------------------------
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src', 'assets', 'courier', 'courier_mask.png')
OUT = os.path.join(ROOT, 'src', 'assets', 'courier', 'courier_mask_faces.png')
PREVIEW = os.path.join(ROOT, 'source_assets', 'courier', 'courier_mask_faces_preview.png')
R = (12, 200, 336, 372)            # the region of the mask the faces replace (x0, y0, x1, y1, in the mask's 512 px)
CELLS = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'hurt', 'focused', 'sleepy']
INK, CREAM, SHADOW = (80, 19, 19), (221, 190, 158), (109, 49, 39)
K = 4                              # supersampling

mask = np.asarray(Image.open(SRC).convert('RGBA')).astype(np.int32)
region = mask[R[1]:R[3], R[0]:R[2]].copy()
H, W = region.shape[:2]
lum = region[..., 0] * 0.3 + region[..., 1] * 0.59 + region[..., 2] * 0.11
cream = (region[..., 0] > 180) & (region[..., 1] > 150)
shadowm = (np.abs(region[..., 0] - SHADOW[0]) < 18) & (np.abs(region[..., 1] - SHADOW[1]) < 18)

def blobs(m):
    """Connected parts of a boolean mask (4-neighbour), largest first: [(mask, bbox)]."""
    lab = np.zeros(m.shape, np.int32); out = []
    for y0, x0 in zip(*np.nonzero(m)):
        if lab[y0, x0]: continue
        n = len(out) + 1; st = [(y0, x0)]; lab[y0, x0] = n; pts = []
        while st:
            y, x = st.pop(); pts.append((y, x))
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                yy, xx = y + dy, x + dx
                if 0 <= yy < m.shape[0] and 0 <= xx < m.shape[1] and m[yy, xx] and not lab[yy, xx]: lab[yy, xx] = n; st.append((yy, xx))
        b = np.zeros(m.shape, bool); ys, xs = zip(*pts); b[ys, xs] = True
        out.append((b, (min(xs), min(ys), max(xs), max(ys))))
    return sorted(out, key=lambda o: -o[0].sum())

parts = blobs(cream)
eyes = sorted(parts[:2], key=lambda o: o[1][0])   # left, right
brows = sorted(parts[2:4], key=lambda o: o[1][0])

# the ground: the region with the maker's eyes and brows (and the shadow rims under them) inked over, the dark band and tear marks kept
def dilate(m, r):
    o = m.copy()
    for _ in range(r):
        o = o | np.roll(o, 1, 0) | np.roll(o, -1, 0) | np.roll(o, 1, 1) | np.roll(o, -1, 1)
    return o
erase = dilate(cream | shadowm, 3)
ground = region.copy()
ground[erase, 0], ground[erase, 1], ground[erase, 2] = INK

def up(m):  # a boolean mask at K times the size
    return np.kron(m, np.ones((K, K), bool))

def paint_cell(name):
    img = Image.fromarray(np.kron(ground[..., :3], np.ones((K, K, 1))).astype(np.uint8), 'RGB')
    layer_c = np.zeros((H * K, W * K), bool); layer_s = np.zeros((H * K, W * K), bool)
    for side, (em, (x0, y0, x1, y1)) in enumerate(eyes):
        E = up(em); cx, cy = (x0 + x1) / 2 * K, (y0 + y1) / 2 * K; ew, eh = (x1 - x0) * K, (y1 - y0) * K
        yy, xx = np.mgrid[0:H * K, 0:W * K]
        out = 1 if side == 1 else -1                           # (+1: toward the outer corner, on the right eye)
        rx = (xx - cx) / (ew / 2) * out                        # (-1 inner .. +1 outer)
        ry = (yy - cy) / (eh / 2)                              # (-1 top .. +1 bottom)
        if name == 'neutral': shape = E
        elif name == 'happy': shape = E & ~((rx ** 2 / 1.6 + (ry - 0.62) ** 2 / 0.95) < 1.0) & (ry < 0.35)  # (a smile's arch: only a band along the top)
        elif name == 'sad': shape = E & (ry > -0.55 + 0.42 * rx)                                         # (the lid drooping to the outer corner)
        elif name == 'angry': shape = E & (ry > -0.45 - 0.48 * rx)                                       # (the lid slanting down to the nose)
        elif name == 'surprised':
            X = ((xx - cx) / 1.08 + cx).astype(int).clip(0, W * K - 1); Y = ((yy - cy) / 1.22 + cy).astype(int).clip(0, H * K - 1); shape = E[Y, X]  # (wide open: taller, a little wider)
        elif name == 'focused': Y = ((yy - cy) / 0.5 + cy).astype(int).clip(0, H * K - 1); shape = E[Y, xx] & (np.abs(ry) < 0.5)  # (narrowed)
        elif name == 'sleepy': shape = E & (ry > 0.1)                                                     # (half-lidded)
        elif name == 'hurt':                                                                              # (> <: a chevron pointing in)
            t = np.abs(ry) * 0.55 - rx * 0.7; shape = E & (np.abs(t - 0.05) < 0.17)  # (the point toward the nose)
        layer_c |= shape
        sh = np.roll(np.roll(shape, 4 * K // 2, 0), int(out * 3 * K // 2), 1) & ~shape                   # (the maker's shadow, under the lower outer rim)
        layer_s |= sh
    for side, (bm, (x0, y0, x1, y1)) in enumerate(brows):
        B = up(bm); cx, cy = (x0 + x1) / 2 * K, (y0 + y1) / 2 * K
        yy, xx = np.mgrid[0:H * K, 0:W * K]
        dy, rot = {'happy': (-9, 0.0), 'surprised': (-15, 0.0), 'sad': (-4, 0.28), 'angry': (6, -0.32), 'focused': (5, -0.12), 'sleepy': (4, 0.1), 'hurt': (2, -0.22)}.get(name, (0, 0.0))
        out = 1 if side == 1 else -1
        a = -rot * out; ca, sa = np.cos(a), np.sin(a)
        X = (ca * (xx - cx) + sa * (yy - cy - dy * K) + cx).astype(int).clip(0, W * K - 1)
        Y = (-sa * (xx - cx) + ca * (yy - cy - dy * K) + cy).astype(int).clip(0, H * K - 1)
        layer_c |= B[Y, X]
    arr = np.asarray(img).copy()
    arr[layer_s] = SHADOW; arr[layer_c] = CREAM
    return Image.fromarray(arr).resize((W, H), Image.LANCZOS)

cells = [paint_cell(n) for n in CELLS]
atlas = Image.new('RGB', (W * 4, H * 2))
for i, c in enumerate(cells): atlas.paste(c, ((i % 4) * W, (i // 4) * H))
atlas.save(OUT)
os.makedirs(os.path.dirname(PREVIEW), exist_ok=True)
atlas.resize((W * 2, H), Image.LANCZOS).save(PREVIEW)
print(f'bake_mask_faces: {OUT} ({atlas.size[0]}x{atlas.size[1]}, cells {W}x{H}: {", ".join(CELLS)})')
