"""Calissa's sky painter: equirectangular skies painted on the sphere (seamless round, true at the poles).
Two hands:
  WATERCOLOUR  washes laid over warm paper: each a pigment that multiplies (transmits), its edge darkened where the water dried
               (the pooled rim), granulation in the heavy pigment, blooms (cauliflowers) where wet met damp, the paper's tooth; the
               clouds are the paper left white with their shadows washed in.
  OIL          the scene laid in, then dragged along a stroke field (line integral convolution of the colour itself: the brush pulls
               paint), bristle texture from LIC'd noise, a light impasto emboss, and the colours pulled toward a limited palette.
Prior art: Monet's and Turner's skies (the oil), Winslow Homer's and John Singer Sargent's watercolour skies; Curtis et al., "Computer-
Generated Watercolor" (SIGGRAPH 1997: edge darkening, granulation, backruns); Cabral & Leedom, "Imaging Vector Fields Using Line Integral
Convolution" (1993); Hertzmann's painterly rendering (1998).
"""
import numpy as np
from PIL import Image

W, H = 2048, 1024

def dirs(w=W, h=H):
    u = (np.arange(w) + 0.5) / w
    v = (np.arange(h) + 0.5) / h
    U, V = np.meshgrid(u, v)
    lon = (U - 0.5) * 2 * np.pi
    lat = (0.5 - V) * np.pi           # row 0 = zenith
    x = np.cos(lat) * np.cos(lon); z = np.cos(lat) * np.sin(lon); y = np.sin(lat)
    return np.stack([x, y, z], -1).astype(np.float32), lat.astype(np.float32), lon.astype(np.float32)

# ------------------------------------------------------------------ noise (3D gradient noise, vectorised)
_rng = np.random.default_rng(7)
_perm = np.concatenate([_rng.permutation(256)] * 2)
_grad = _rng.normal(size=(256, 3)); _grad /= np.linalg.norm(_grad, axis=1, keepdims=True)

def _fade(t): return t * t * t * (t * (t * 6 - 15) + 10)

def gnoise(p, seed=0):
    p = p + seed * 17.13
    pi = np.floor(p).astype(np.int64); pf = (p - pi).astype(np.float32)
    xi, yi, zi = pi[..., 0] & 255, pi[..., 1] & 255, pi[..., 2] & 255
    u, v, w = _fade(pf[..., 0]), _fade(pf[..., 1]), _fade(pf[..., 2])
    out = 0
    acc = []
    for dz in (0, 1):
        for dy in (0, 1):
            for dx in (0, 1):
                h = _perm[_perm[_perm[xi + dx] + yi + dy] + zi + dz]
                g = _grad[h]
                d = pf - np.array([dx, dy, dz], np.float32)
                acc.append(np.sum(g * d, -1))
    c = acc
    x00 = c[0] + u * (c[1] - c[0]); x10 = c[2] + u * (c[3] - c[2])
    x01 = c[4] + u * (c[5] - c[4]); x11 = c[6] + u * (c[7] - c[6])
    y0 = x00 + v * (x10 - x00); y1 = x01 + v * (x11 - x01)
    return (y0 + w * (y1 - y0)) * 1.4

def fbm(p, oct=5, lac=2.0, gain=0.5, seed=0):
    s, a, f = 0, 1.0, 1.0; tot = 0
    for i in range(oct):
        s = s + a * gnoise(p * f, seed + i * 3.1); tot += a; a *= gain; f *= lac
    return s / tot

def warp(p, k, scale, seed):
    q = np.stack([fbm(p * scale, 3, seed=seed), fbm(p * scale, 3, seed=seed + 5), fbm(p * scale, 3, seed=seed + 9)], -1)
    return p + k * q

def ss(a, b, x): t = np.clip((x - a) / (b - a + 1e-9), 0, 1); return t * t * (3 - 2 * t)

def hexc(h): h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], np.float32)

def ramp(t, stops):
    """stops: [(t, '#rrggbb'), ...] ascending t."""
    t = np.clip(t, stops[0][0], stops[-1][0])
    out = np.zeros(t.shape + (3,), np.float32)
    for (a, ca), (b, cb) in zip(stops[:-1], stops[1:]):
        m = (t >= a) & (t <= b)
        k = ((t - a) / (b - a + 1e-9))[..., None]
        k = k * k * (3 - 2 * k)
        out = np.where(m[..., None], hexc(ca) * (1 - k) + hexc(cb) * k, out)
    return out

# ------------------------------------------------------------------ sampling in equirect pixel space (x wraps)
def bilerp(img, x, y):
    h, w = img.shape[:2]
    x = np.mod(x, w); y = np.clip(y, 0, h - 1.001)
    x0 = np.floor(x).astype(np.int64); y0 = np.floor(y).astype(np.int64)
    fx = (x - x0)[..., None] if img.ndim == 3 else x - x0; fy = (y - y0)[..., None] if img.ndim == 3 else y - y0
    x1 = (x0 + 1) % w; y1 = np.minimum(y0 + 1, h - 1)
    a = img[y0, x0]; b = img[y0, x1]; c = img[y1, x0]; d = img[y1, x1]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy

def lic(img, fx, fy, steps=12, step=1.5, weights=None):
    """Line integral convolution of img along (fx, fy) (pixel units, unit length)."""
    h, w = fx.shape
    X, Y = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    acc = img.astype(np.float32).copy(); tot = 1.0
    for sgn in (1, -1):
        x, y = X.copy(), Y.copy()
        for i in range(steps):
            vx = bilerp(fx, x, y); vy = bilerp(fy, x, y)
            x = x + sgn * vx * step; y = y + sgn * vy * step
            wgt = 1.0 - (i + 1) / (steps + 1)
            acc += wgt * bilerp(img, x, y); tot += wgt
    return acc / tot

def blur(img, r):
    """separable box blur x3 (≈ gaussian), wrapping in x."""
    out = img.astype(np.float32)
    for _ in range(3):
        k = 2 * r + 1
        c = np.cumsum(np.concatenate([out[:, -r - 1:], out, out[:, :r]], 1), 1)
        out = (c[:, k:] - c[:, :-k]) / k
        p = np.concatenate([np.repeat(out[:1], r + 1, 0), out, np.repeat(out[-1:], r, 0)], 0)
        c = np.cumsum(p, 0)
        out = (c[k:] - c[:-k]) / k
    return out

def save(img, path, size=None):
    im = Image.fromarray((np.clip(img, 0, 1) ** (1 / 1.0) * 255 + 0.5).astype(np.uint8))
    if size: im = im.resize(size, Image.LANCZOS)
    im.save(path)
    return im

# ------------------------------------------------------------------ WATERCOLOUR
def paper(D, warm='#f4ecdc', tooth=0.06):
    t = gnoise(D * 260, 41) * 0.6 + gnoise(D * 700, 43) * 0.4
    img = np.ones(D.shape[:2] + (3,), np.float32) * hexc(warm)
    return img * (1 - tooth * (0.5 + 0.5 * t))[..., None], t

def wash(img, A, pigment, opacity=1.0, rim=0.5, rim_r=3, gran=0.0, grain=None, bloom=None):
    """Lay one wash: A is the water's reach 0..1 (already soft-edged). The rim pools darker where the wash dried."""
    A = np.clip(A, 0, 1)
    if bloom is not None: A = np.clip(A + bloom, 0, 1)
    edge = np.clip(A - blur(A, rim_r), 0, 1) * 4.0           # inside the boundary, near it
    amt = A + rim * edge * A
    if gran and grain is not None: amt = amt * (1 + gran * grain * np.clip(amt, 0, 1))
    amt = np.clip(amt * opacity, 0, 1.6)[..., None]
    trans = hexc(pigment)
    return img * (1 - amt * (1 - trans))

def granule(D, seed=50):
    return (gnoise(D * 260, seed) * 0.5 + gnoise(D * 700, seed + 1) * 0.5)

# ------------------------------------------------------------------ OIL
def flow_field(D, lat, density=None, along=0.0, curl=0.7, scale=2.5, seed=60, horiz=1.0):
    """Unit stroke directions in pixel space: mostly along the horizon (skies are brushed across), swung by a curl of noise and
    turned to run round the clouds' contours where `density` has an edge."""
    th = curl * fbm(D * scale, 3, seed=seed) * np.pi * horiz
    fx, fy = np.cos(th), np.sin(th) * 0.6
    if density is not None and along:
        gy, gx = np.gradient(blur(density, 3))
        gx, gy = gx, gy
        m = np.hypot(gx, gy) + 1e-6
        tx, ty = -gy / m, gx / m                               # the contour's tangent
        k = np.clip(m * 400, 0, 1) * along
        sgn = np.sign(fx * tx + fy * ty + 1e-6)
        fx = fx * (1 - k) + tx * sgn * k; fy = fy * (1 - k) + ty * sgn * k
    n = np.hypot(fx, fy) + 1e-6
    return (fx / n).astype(np.float32), (fy / n).astype(np.float32)

def oil(img, D, fx, fy, drag=10, bristle=0.22, impasto=0.5, palette=None, pull=0.25, seed=70, fine=True):
    rng = np.random.default_rng(seed)
    # underpainting: the colour dragged along the strokes (the brush pulls paint)
    out = lic(img, fx, fy, steps=drag, step=1.8)
    # broken colour: each stroke carries a slightly different mix
    jit = lic(rng.random(fx.shape).astype(np.float32), fx, fy, steps=drag, step=1.8)
    jit = (jit - jit.mean()) / (jit.std() + 1e-6)
    out = out * (1 + 0.05 * jit[..., None])
    # bristles: fine noise smeared along the strokes, and the paint's ridges lit from above
    nz = rng.random(fx.shape).astype(np.float32)
    br = lic(nz, fx, fy, steps=8, step=1.2)
    br = (br - br.mean()) / (br.std() + 1e-6)
    lum = 1 + bristle * 0.12 * br
    gy, gx = np.gradient(br)
    lum = lum + impasto * 0.035 * (-gy + gx * 0.5)
    out = out * lum[..., None]
    if palette:
        P = np.stack([hexc(c) for c in palette])
        d = ((out[..., None, :] - P[None, None]) ** 2).sum(-1)
        near = P[np.argmin(d, -1)]
        out = out * (1 - pull) + near * pull
    if fine:  # a second, shorter pass of strokes over the top (Hertzmann's layers)
        out = lic(out, fx, fy, steps=4, step=1.2) * 0.6 + out * 0.4
    return out

# ------------------------------------------------------------------ OIL, as strokes (Hertzmann 1998, "Painterly Rendering with Curved Brush Strokes")
from PIL import ImageDraw

def strokes(target, fx, fy, layers, seed=80, canvas=None, lat=None):
    """Paint `target` (H x W x 3, 0..1) with curved strokes that follow (fx, fy), coarse to fine. Each layer: dict(w=width px,
    n=count or None, len=steps, step=px, jitter=colour jitter, where=mask or None, bristles=k). Each stroke takes its colour at its
    start, bends along the field, and is drawn as k bristles (thin parallel lines, each a touch lighter or darker). Strokes are stretched
    in x by 1/cos(lat) so they keep their size on the sphere, and drawn twice across the seam so it wraps."""
    rng = np.random.default_rng(seed)
    h, w = target.shape[:2]
    SS = 2  # supersample
    if canvas is None:
        canvas = Image.fromarray((np.clip(blur(target, 12), 0, 1) * 255).astype(np.uint8)).resize((w * SS, h * SS), Image.BILINEAR)
    dr = ImageDraw.Draw(canvas)
    coslat = np.cos(lat) if lat is not None else np.ones((h, w), np.float32)
    for L in layers:
        sw = L['w']; n = L.get('n') or int(w * h / (sw * sw * L.get('len', 8) * 0.55))
        where = L.get('where')
        if np.isscalar(where): where = np.full((h, w), where, np.float32)
        ys = rng.random(n) * h; xs = rng.random(n) * w
        if where is not None:
            keep = rng.random(n) < where[np.clip(ys.astype(int), 0, h - 1), np.clip(xs.astype(int), 0, w - 1)]
            xs, ys = xs[keep], ys[keep]
        order = rng.permutation(len(xs))
        src = blur(target, max(1, sw // 3)) if sw > 4 else target
        for i in order:
            x, y = xs[i], ys[i]
            iy, ix = int(min(h - 1, y)), int(x) % w
            col = src[iy, ix] * (1 + rng.normal(0, L.get('jitter', 0.04), 3))
            cl = np.clip(coslat[iy, ix], 0.12, 1)
            pts = [(x, y)]
            dirx, diry = fx[iy, ix], fy[iy, ix]
            for s in range(L.get('len', 8)):
                iy, ix = int(np.clip(y, 0, h - 1)), int(x) % w
                vx, vy = fx[iy, ix], fy[iy, ix]
                if vx * dirx + vy * diry < 0: vx, vy = -vx, -vy
                dirx, diry = vx, vy
                x += vx * L.get('step', sw * 0.6) / np.clip(coslat[iy, ix], 0.12, 1); y += vy * L.get('step', sw * 0.6)
                pts.append((x, y))
                # a stroke stops where the colour under it has moved on (Hertzmann's error stop)
                if np.abs(src[int(np.clip(y, 0, h - 1)), int(x) % w] - col).sum() > L.get('stop', 0.35): break
            k = L.get('bristles', 4); wid = sw * SS / k
            nx, ny = -diry, dirx
            npts = len(pts)
            for b in range(k):
                off = (b - (k - 1) / 2) * wid * 0.95
                c = np.clip(col * (1 + rng.normal(0, 0.02)) + rng.normal(0, 0.006), 0, 1)
                cc = tuple(int(v * 255) for v in c)
                edge_b = 1 - abs(b - (k - 1) / 2) / max(1, k / 2)            # the outer bristles carry less paint: the stroke rounds off
                for dx in (-w, 0, w):
                    P2 = [((px + dx) * SS + nx * off / cl, py * SS + ny * off) for px, py in pts]
                    if max(p[0] for p in P2) < 0 or min(p[0] for p in P2) > w * SS: continue
                    # each bristle tapers from loaded to dry along the stroke, and the outer ones start late and lift early
                    a0 = int((1 - edge_b) * 0.35 * (npts - 1)); a1 = max(a0 + 1, npts - 1 - int((1 - edge_b) * 0.3 * (npts - 1)))
                    for j in range(a0, a1):
                        u = (j - a0) / max(1, a1 - a0)
                        ww = max(1, int(wid * (0.55 + 0.6 * edge_b) * (1.1 - 0.6 * u ** 1.5) + 0.5))
                        dr.line([P2[j], P2[j + 1]], fill=cc, width=ww)
                    r0 = max(1, int(wid * (0.55 + 0.6 * edge_b) * 0.55))
                    x0, y0 = P2[a0]; dr.ellipse([x0 - r0, y0 - r0, x0 + r0, y0 + r0], fill=cc)   # the loaded, rounded start
    return canvas

def finish_oil(canvas, w=W, h=H, impasto=0.5, seed=90):
    img = np.asarray(canvas.resize((w, h), Image.LANCZOS), np.float32) / 255
    lum = img.mean(-1)
    gy, gx = np.gradient(blur(lum, 1))
    img = img * (1 + impasto * 0.6 * (-gy + 0.5 * gx))[..., None]          # the ridges lit from above-left
    # the canvas weave, faintly
    yy, xx = np.mgrid[0:h, 0:w]
    weave = (np.sin(xx * 1.9) * np.sin(yy * 1.9)) * 0.012
    return np.clip(img * (1 + weave[..., None]), 0, 1)

# ------------------------------------------------------------------ the player's view: a perspective look into the dome
def view(img, yaw=0.0, pitch=0.15, fov=70, w=640, h=360):
    H_, W_ = img.shape[:2]
    f = 1 / np.tan(np.radians(fov) / 2)
    xs = (np.arange(w) + 0.5) / w * 2 - 1; ys = ((np.arange(h) + 0.5) / h * 2 - 1) * h / w
    X, Y = np.meshgrid(xs, -ys)
    d = np.stack([X, Y, np.full_like(X, f)], -1); d /= np.linalg.norm(d, axis=-1, keepdims=True)
    cp, sp = np.cos(pitch), np.sin(pitch)
    dy = d[..., 1] * cp + d[..., 2] * sp; dz = -d[..., 1] * sp + d[..., 2] * cp; dx = d[..., 0]
    cy, sy = np.cos(yaw), np.sin(yaw)
    wx = dx * cy + dz * sy; wz = -dx * sy + dz * cy
    lon = np.arctan2(wz, wx); lat = np.arcsin(np.clip(dy, -1, 1))
    u = (lon / (2 * np.pi) + 0.5) * W_ - 0.5; v = (0.5 - lat / np.pi) * H_ - 0.5
    return bilerp(img, u, v)
