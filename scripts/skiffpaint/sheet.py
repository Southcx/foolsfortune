"""The hull paintings' and skiff sets' contact sheet (scripts/skiffpaint/sheet.mjs takes the tiles): row one the owner's hull and the six
paintings from three-quarters, row two the same from the side, row three the six sets. A JPEG under 500 KB.
  python3 -I scripts/skiffpaint/sheet.py <tiles dir> docs/plans/art/skiff-hulls-and-sets.jpg"""
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFont

D, OUT = sys.argv[1], sys.argv[2]
HULLS = [('own', 'The owner\'s'), ('urushi', 'Urushi lacquer'), ('driftwood', 'Driftwood'), ('celadon', 'Celadon crackle'),
         ('teak', 'Racing teak and brass'), ('obsidian', 'Bone and obsidian'), ('festival', 'Festival lacquer')]
SETS = [('kintsugi', 'Kintsugi'), ('driftwood', 'Driftwood'), ('celadon', 'Celadon'), ('matsuri', 'Matsuri'), ('racing', 'Racing'), ('obsidian', 'Obsidian')]
TW, TH, CAP = 300, 210, 22
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
f = ImageFont.truetype(FONT, 13) if os.path.exists(FONT) else ImageFont.load_default()
fs = ImageFont.truetype(FONT, 10) if os.path.exists(FONT) else ImageFont.load_default()
log = json.load(open(os.path.join(D, 'sets.json')))


def tile(p):
    im = Image.open(p).convert('RGB')
    w, h = im.size
    s = min(w / TW, h / TH) * 0.95  # (cropped round the board)
    cw, ch = TW * s, TH * s
    return im.crop((int(w / 2 - cw / 2), int(h * 0.5 - ch / 2), int(w / 2 + cw / 2), int(h * 0.5 + ch / 2))).resize((TW, TH), Image.LANCZOS)


sheet = Image.new('RGB', (TW * 7, (TH + CAP) * 3 + 20), (24, 20, 18))
d = ImageDraw.Draw(sheet)
for i, (k, name) in enumerate(HULLS):
    for r, v in enumerate(('q', 's')):
        sheet.paste(tile(os.path.join(D, f'hull_{k}_{v}.png')), (i * TW, r * (TH + CAP) + CAP))
    d.text((i * TW + 6, 4), name, fill=(240, 226, 200), font=f)
for i, (k, name) in enumerate(SETS):
    y = 2 * (TH + CAP)
    sheet.paste(tile(os.path.join(D, f'set_{k}.png')), (i * TW, y + CAP))
    r = log[i] or {}
    d.text((i * TW + 6, y + 4), f'Set: {name}', fill=(255, 211, 106), font=f)
    d.text((i * TW + 6, y + CAP + TH - 14), ('worn ' + ' '.join(w.split(':')[1] for w in r.get('worn', [])))[:56], fill=(30, 24, 20), font=fs)
d.text((TW * 6 + 8, 2 * (TH + CAP) + CAP + 8), 'Rows: three-quarter, side,\nsets (hull + the slots that\nexist in git today; the rest\nskipped until built).', fill=(240, 226, 200), font=fs)
sheet.save(OUT, 'JPEG', quality=84, optimize=True)
print(OUT, os.path.getsize(OUT))
