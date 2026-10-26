# ---------------------------------------------------------------------------------------
# A DATA PACK, SAVED SO NO BROWSER CAN SPOIL ITS FOURTH CHANNEL (the owner's iPhone XR, 2026-10-26: WebKit drew the liquid packs black
# when decoded as an ImageBitmap with premultiplyAlpha 'none' and a resize): four grey channels of data written as ONE OPAQUE image twice
# as wide, its left half RGB the first three channels and its right half the fourth (grey, in all three), alpha 255 everywhere, so the
# decoder has nothing to premultiply and the page reads the bytes back exact (src/vfx/datapack.js joins them into an RGBA data texture).
# Lossless WebP: the bytes are numbers, not colours.
#
#   from datapack import save_split   save_split(rgba_uint8 (H x W x 4), path)
#   python3 -I scripts/datapack.py in.webp out.webp     (an RGBA pack already baked, split as it is: exact)
# ---------------------------------------------------------------------------------------
import sys
import numpy as np
from PIL import Image

def save_split(rgba, path):
    rgba = np.asarray(rgba, dtype=np.uint8)
    a = rgba[..., 3:4]
    out = np.concatenate([rgba[..., :3], np.repeat(a, 3, axis=2)], axis=1)
    Image.fromarray(out, 'RGB').save(path, 'WEBP', lossless=True, exact=True, method=6)

if __name__ == '__main__':
    im = np.asarray(Image.open(sys.argv[1]).convert('RGBA'))
    save_split(im, sys.argv[2])
    back = np.asarray(Image.open(sys.argv[2]).convert('RGB')); w = im.shape[1]
    ok = (back[:, :w] == im[..., :3]).all() and (back[:, w:, 0] == im[..., 3]).all()
    print(f'datapack: {sys.argv[2]} {back.shape[1]}x{back.shape[0]}, round trip {"exact" if ok else "NOT EXACT"}')
