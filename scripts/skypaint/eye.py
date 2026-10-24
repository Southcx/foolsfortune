"""The eye at the zenith (the owner's convention, 2026-10-24: a thin strip along the top edge, so looking straight up you meet an iris and a
pupil: the eye is the window to the soul, and an Island of Ego is a mind's). In the owner's paintings the pupil reaches about 3.5 degrees
from the zenith and the iris about 9. Here: a dark pupil, an iris of radial fibres in the feeling's colour with a paler collarette and a
dark limbal ring and no catchlight, feathered into the sky round it; drawn with the painting's own grain (watercolour granulation or oil
streaks along the fibres)."""
import numpy as np
from painter import hexc, ss, gnoise, fbm

PUPIL, IRIS, FEATHER = 0.062, 0.16, 0.03

def eye(img, D, lat, lon, colour, medium='oil', pupil='#0b0910'):
    th = np.pi / 2 - lat                                             # angle from the zenith
    if th.min() > IRIS + FEATHER: return img
    cyl = lambda a, b, s: np.stack([np.cos(lon) * a, th * b, np.sin(lon) * a], -1)
    fib = gnoise(cyl(42, 6, 0), 301) * 0.6 + gnoise(cyl(110, 14, 0), 302) * 0.4      # radial fibres: fast round, slow out
    crypt = ss(0.25, 0.55, gnoise(cyl(12, 40, 0), 303))                               # the iris's crypts, darker hollows
    base = hexc(colour)
    dark = base * 0.35; light = np.clip(base * 1.35 + 0.08, 0, 1)
    r = np.clip((th - PUPIL) / (IRIS - PUPIL), 0, 1)                                 # 0 at the pupil's edge .. 1 at the limbus
    iris = dark[None, None] * (1 - ss(-0.6, 0.6, fib))[..., None] + light[None, None] * ss(-0.6, 0.6, fib)[..., None]
    iris = iris * (1 - 0.35 * crypt[..., None] * (1 - r[..., None]))
    collar = np.exp(-((r - 0.28) / 0.07) ** 2)                                        # the collarette: a paler ring near the pupil
    iris = iris + (light - iris) * collar[..., None] * 0.5
    limbus = ss(0.75, 1.0, r)                                                         # the dark ring at the iris's edge
    iris = iris * (1 - 0.6 * limbus[..., None])
    grain = gnoise(np.stack([D[..., 0] * 400, D[..., 1] * 400, D[..., 2] * 400], -1), 304)
    iris = iris * (1 + (0.08 if medium == 'water' else 0.05) * grain[..., None])
    pm = 1 - ss(PUPIL - 0.008, PUPIL + 0.008, th)
    out = iris * (1 - pm[..., None]) + hexc(pupil) * pm[..., None]
    # no catchlight (the owner, 2026-10-24: a shine makes it too plainly an eye; keep it ambiguous)
    k = 1 - ss(IRIS, IRIS + FEATHER, th + 0.01 * fib)                                 # the eye over the sky, its edge feathered
    return img * (1 - k[..., None]) + out * k[..., None]
