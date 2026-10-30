// ---------------------------------------------------------------------------------------
// A SHAPE'S PATTERNS: the tiling greyscale pictures a shape layer scrolls over its effect shape (vfx/shapes/layer.js), twelve of them
// packed one a channel into three RGBA textures of 256 x 256 (128 on the phone's tier: vfx/tierscale.js), each mipmapped and repeating.
// Every pattern is worked out as a function of (u, v) on the torus, with whole-number periods only (the lattice of a noise, a cell grid,
// a wave's frequency), so it tiles both ways at any size and scrolls with no seam; the two drawn with the canvas (frost, the running
// hand) are drawn nine times, a tile apart each way, so what leaves one edge comes in at the other. Made once, on the first ask, from a
// fixed seed: the same pictures every load.
//
//   noise    fbm of periodic gradient noise            cells    Voronoi cells, bright at their hearts
//   streaks  rain: vertical dashes of many lengths     ripple   rings round three centres, interfering
//   cracks   Voronoi edges, thin bright lines          dots     halftone, its dots swelling with a slow noise
//   marble   domain-warped bands and veins             frost    needles and dendrites (Wonder's frost)
//   curds    lumpy blobs (Gall's curds)                rays     vertical bars of many widths: rays on a band or a cone
//   stars    sparse sharp points, a few with glints    script   rows of neuralese in the running hand (ui/runninghand.js)
// The seven feelings' paint motifs (vfx/paintmotifs.js, the glossary's "paint motif") each have theirs: MOTIF.
//
// Why a DataTexture and not a baked canvas (render/bakedcanvas.js): each CHANNEL is its own pattern, the alpha one too, and a canvas
// stores its colour premultiplied by its alpha, so a pattern in the alpha channel would wipe the other three where it is dark. The bytes
// are written straight into the texture instead (a canvas is only a scratch pad for the two drawn ones, read back a channel at a time).
//
// Prior art: the tiling noise sheets of every effects artist's kit (Simon Trümpler's "Technical VFX" breakdowns and his RiME and Diablo
// III notes: a few greyscale noises, one per channel of one texture, scrolled and multiplied); periodic Perlin noise (Perlin 1985, its
// lattice wrapped); Worley's cellular noise (1996) on a wrapped grid for the cells, the cracks and the curds; the halftone screen; the
// marble of Perlin's "Image Synthesizer" (a sine warped by turbulence).
//
//   patternTextures() -> [texA, texB, texC]      PATTERNS (name -> { tex, ch })      MOTIF (feeling -> pattern name)
//   patternPick(name, ctx) -> { tex, ch: Vector4, name }   'motif' gives ctx.feeling's; 'none' or an unknown name, null
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { tierSize } from '../tierscale.js';
import { runningHand } from '../../ui/runninghand.js';
import { cellsOf } from '../../npc/neuralesespelling.js';

/** Each pattern's texture (0..2) and channel (0 r, 1 g, 2 b, 3 a). */
export const PATTERNS = {
  noise: { tex: 0, ch: 0 }, cells: { tex: 0, ch: 1 }, streaks: { tex: 0, ch: 2 }, ripple: { tex: 0, ch: 3 },
  cracks: { tex: 1, ch: 0 }, dots: { tex: 1, ch: 1 }, marble: { tex: 1, ch: 2 }, frost: { tex: 1, ch: 3 },
  curds: { tex: 2, ch: 0 }, rays: { tex: 2, ch: 1 }, stars: { tex: 2, ch: 2 }, script: { tex: 2, ch: 3 },
};
/** Each feeling's paint motif as a pattern (the glossary: Wonder frost, Mirth dots, Desire ripples, Fury cracks, Gall curds, Grief
 *  streaks, Dread marbling). */
export const MOTIF = { wonder: 'frost', mirth: 'dots', desire: 'ripple', fury: 'cracks', gall: 'curds', grief: 'streaks', dread: 'marble' };

// ---- the maths: a hash, periodic gradient noise, periodic Voronoi (all in tile units, u and v 0..1, periods whole numbers)
const TAU = Math.PI * 2;
const hash = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const wrap = (i, P) => ((i % P) + P) % P;
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
/** Gradient noise with its lattice wrapped every P cells: about -0.7..0.7. */
function gnoise(u, v, P, s) {
  const x = u * P, y = v * P, x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  const g = (ix, iy, dx, dy) => { const a = hash(wrap(ix, P), wrap(iy, P), s) * TAU; return Math.cos(a) * dx + Math.sin(a) * dy; };
  const n00 = g(x0, y0, fx, fy), n10 = g(x0 + 1, y0, fx - 1, fy), n01 = g(x0, y0 + 1, fx, fy - 1), n11 = g(x0 + 1, y0 + 1, fx - 1, fy - 1);
  const sx = fade(fx), sy = fade(fy);
  return (n00 + (n10 - n00) * sx) + ((n01 + (n11 - n01) * sx) - (n00 + (n10 - n00) * sx)) * sy;
}
/** Fractal sums of it, each octave's period doubled (so every octave wraps too): about -1..1. */
function fbm(u, v, P, oct, s) { let a = 0, amp = 0.5, n = 0; for (let i = 0; i < oct; i++) { a += amp * gnoise(u, v, P << i, s + i * 17); n += amp; amp *= 0.5; } return a / n * 1.6; }
/** The nearest and second-nearest jittered points of a G x G wrapped grid, in cell units. */
const _vo = { f1: 0, f2: 0, id: 0 };
function voronoi(u, v, G, s, jit = 0.9) {
  const x = u * G, y = v * G, ix = Math.floor(x), iy = Math.floor(y);
  let f1 = 9, f2 = 9, id = 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const cx = ix + dx, cy = iy + dy, wx = wrap(cx, G), wy = wrap(cy, G);
    const px = cx + 0.5 + (hash(wx, wy, s) - 0.5) * jit, py = cy + 0.5 + (hash(wx, wy, s + 7) - 0.5) * jit;
    const d = Math.hypot(x - px, y - py);
    if (d < f1) { f2 = f1; f1 = d; id = wx + wy * G; } else if (d < f2) f2 = d;
  }
  _vo.f1 = f1; _vo.f2 = f2; _vo.id = id; return _vo;
}
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/** Stretched to fill 0..1 (the brightest pixel 1, the darkest 0), then a gamma. */
function stretch(f, gamma = 1) {
  let lo = Infinity, hi = -Infinity; for (const x of f) { if (x < lo) lo = x; if (x > hi) hi = x; }
  const k = 1 / Math.max(1e-6, hi - lo); for (let i = 0; i < f.length; i++) f[i] = Math.pow((f[i] - lo) * k, gamma);
  return f;
}
/** A seeded draw (the patterns are the same every load). */
const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
/** Each pixel of an N x N field from fn(u, v) at the pixel's centre. */
function field(N, fn) { const f = new Float32Array(N * N); for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) f[j * N + i] = fn((i + 0.5) / N, (j + 0.5) / N); return f; }
/** A splat: fn(dx, dy) in tile pixels (at 256) added over a box round (cx, cy), wrapped, keeping the larger (`max`) or the sum. */
function splat(f, N, cx, cy, rx, ry, fn, max = true) {
  const k = N / 256, x0 = Math.floor((cx - rx) * k), x1 = Math.ceil((cx + rx) * k), y0 = Math.floor((cy - ry) * k), y1 = Math.ceil((cy + ry) * k);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const w = fn((x + 0.5) / k - cx, (y + 0.5) / k - cy); if (w <= 0) continue;
    const i = wrap(y, N) * N + wrap(x, N); f[i] = max ? Math.max(f[i], w) : f[i] + w;
  }
}
/** A canvas painted in tile units (256) at N, drawn at the nine shifts of a tile so it wraps; read back one channel, flipped so the
 *  canvas's top is v = 1 (script reads upright up a band). */
function drawn(N, paint) {
  const c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, N, N); g.scale(N / 256, N / 256);
  for (const sy of [-256, 0, 256]) for (const sx of [-256, 0, 256]) { g.save(); g.translate(sx, sy); paint(g); g.restore(); }
  const d = g.getImageData(0, 0, N, N).data, f = new Float32Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) f[(N - 1 - j) * N + i] = d[(j * N + i) * 4] / 255;
  return f;
}

// ---- the twelve
const MAKE = {
  noise: (N) => stretch(field(N, (u, v) => fbm(u, v, 4, 5, 11)), 1.1),
  cells: (N) => stretch(field(N, (u, v) => 1 - sstep(0, 0.78, voronoi(u, v, 6, 21).f1)), 1.2),
  streaks: (N) => {
    const f = new Float32Array(N * N), r = rng(31);
    for (let n = 0; n < 90; n++) {
      const x = r() * 256, y = r() * 256, len = 14 + Math.pow(r(), 1.6) * 140, w = 0.55 + r() * 1.1, b = 0.3 + r() * 0.7;
      splat(f, N, x, y + len / 2, w * 3, len / 2 + 1, (dx, dy) => { const t = (dy + len / 2) / len; if (t < 0 || t > 1) return 0; return b * Math.exp(-(dx * dx) / (w * w)) * Math.pow(t, 1.4) * sstep(1, 0.9, t); });
    }
    return f;
  },
  ripple: (N) => {
    const C = [[0.23, 0.31, 7], [0.71, 0.62, 9], [0.48, 0.88, 6]];
    return stretch(field(N, (u, v) => {
      let s = 0, w = 0;
      for (const [cx, cy, fq] of C) { let dx = Math.abs(u - cx), dy = Math.abs(v - cy); dx = Math.min(dx, 1 - dx); dy = Math.min(dy, 1 - dy); const d = Math.hypot(dx, dy), k = Math.exp(-(d * d) / 0.09); s += k * Math.sin(d * fq * TAU); w += k; }
      return 0.5 + 0.5 * s / Math.max(1e-4, w);
    }), 1.4);
  },
  cracks: (N) => field(N, (u, v) => {
    const a = voronoi(u, v, 5, 41), big = 1 - sstep(0, 0.06, a.f2 - a.f1);
    const b = voronoi(u, v, 11, 43), fine = (1 - sstep(0, 0.07, b.f2 - b.f1)) * sstep(0.05, 0.45, fbm(u, v, 3, 3, 47));
    return Math.max(big, fine * 0.6);
  }),
  dots: (N) => field(N, (u, v) => {
    const G = 14, x = u * G, y = v * G, d = Math.hypot(x - Math.floor(x) - 0.5, y - Math.floor(y) - 0.5);
    const r = 0.1 + 0.32 * (0.5 + 0.5 * fbm((Math.floor(x) + 0.5) / G, (Math.floor(y) + 0.5) / G, 2, 2, 53)), aa = G / N;
    return Math.min(1, Math.max(0, (r - d) / aa + 0.5));
  }),
  marble: (N) => stretch(field(N, (u, v) => {
    const s = u + 2 * v + 0.45 * fbm(u, v, 3, 4, 61), w = Math.sin(s * 3 * TAU);
    return 0.55 * (0.5 + 0.5 * w) * (0.5 + 0.5 * w) + 0.7 * Math.pow(1 - Math.abs(w), 7);
  }), 1),
  frost: (N) => drawn(N, (g) => {
    const r = rng(71), segs = [[], [], []];
    const branch = (x, y, a, len, d) => {
      const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len; segs[d].push(x, y, ex, ey);
      if (d >= 2) return;
      const n = Math.max(1, Math.floor(len / (d ? 7 : 11)));
      for (let k = 1; k <= n; k++) {
        const t = k / (n + 1), px = x + (ex - x) * t, py = y + (ey - y) * t, l = len * (0.22 + 0.2 * r()) * (1 - t * 0.6);
        branch(px, py, a + Math.PI / 3, l, d + 1); branch(px, py, a - Math.PI / 3, l * (0.8 + 0.4 * r()), d + 1);
      }
    };
    for (let i = 0; i < 18; i++) { const x = r() * 256, y = r() * 256, a0 = r() * TAU, arms = r() < 0.4 ? 6 : 1; for (let k = 0; k < arms; k++) branch(x, y, a0 + (k * TAU) / 6, (arms > 1 ? 18 : 34) + r() * (arms > 1 ? 16 : 50), 0); }
    g.lineCap = 'round'; g.strokeStyle = '#fff';
    const stroke = (d, lw, a) => { g.globalAlpha = a; g.lineWidth = lw; g.beginPath(); const s = segs[d]; for (let i = 0; i < s.length; i += 4) { g.moveTo(s[i], s[i + 1]); g.lineTo(s[i + 2], s[i + 3]); } g.stroke(); };
    stroke(0, 4.5, 0.12); stroke(1, 3, 0.1); // (a soft halo under the needles)
    stroke(0, 1.6, 1); stroke(1, 1.1, 0.8); stroke(2, 0.8, 0.6);
    g.globalAlpha = 1;
  }),
  curds: (N) => field(N, (u, v) => {
    const c = voronoi(u, v, 7, 81, 0.8), blob = 1 - c.f1 / 0.62 + 0.38 * fbm(u, v, 6, 3, 83);
    return sstep(0.12, 0.5, blob) * (0.55 + 0.45 * (0.5 + 0.5 * fbm(u, v, 8, 2, 89)));
  }),
  rays: (N) => {
    const f = new Float32Array(N * N), r = rng(91), bars = [];
    for (let n = 0; n < 28; n++) bars.push({ x: r() * 256, w: 1.5 + Math.pow(r(), 2) * 18, b: 0.25 + r() * 0.75, k: 1 + Math.floor(r() * 3), ph: r() });
    for (let j = 0; j < N; j++) {
      const v = (j + 0.5) / N;
      for (let i = 0; i < N; i++) {
        let s = 0; const x = ((i + 0.5) / N) * 256;
        for (const B of bars) { let dx = Math.abs(x - B.x); dx = Math.min(dx, 256 - dx); if (dx > B.w) continue; const c = Math.cos((dx / B.w) * Math.PI * 0.5); s += B.b * c * c * (0.72 + 0.28 * Math.sin((v * B.k + B.ph) * TAU)); }
        f[j * N + i] = Math.min(1, s);
      }
    }
    return f;
  },
  stars: (N) => {
    const f = new Float32Array(N * N), r = rng(101);
    for (let n = 0; n < 80; n++) {
      const x = r() * 256, y = r() * 256, s = 0.5 + Math.pow(r(), 3) * 1.8, b = 0.35 + r() * 0.65, glint = r() < 0.18 ? 5 + r() * 9 : 0;
      splat(f, N, x, y, Math.max(s * 3, glint), Math.max(s * 3, glint), (dx, dy) => b * Math.max(Math.exp(-(dx * dx + dy * dy) / (s * s)),
        glint ? 0.8 * Math.max(Math.exp(-Math.abs(dx) / (glint * 0.35)) * Math.exp(-dy * dy / 0.35), Math.exp(-Math.abs(dy) / (glint * 0.35)) * Math.exp(-dx * dx / 0.35)) : 0));
    }
    return f;
  },
  script: (N) => drawn(N, (g) => {
    // (rows of neuralese, the feelings' words and a few roots, in the running hand: each row's words laid until the tile is nearly full,
    // set at a random place along its row, so the gaps where a row closes on its star never line up down the tile)
    const W = ['MIRA', 'HILA', 'POTHA', 'FURA', 'FELA', 'MOR', 'PAVA', 'NUSA', 'EMO', 'ATMA', 'SIVA', 'MELU', 'STIL', 'HUSA'], r = rng(113), rows = 8, rowH = 256 / rows;
    for (let row = 0; row < rows; row++) {
      const words = []; let m = null;
      for (let k = 0; k < 9; k++) {
        const next = [...words, { cells: cellsOf(W[Math.floor(r() * W.length)].toLowerCase()) }], mm = runningHand(null, next, { scale: 1, end: true });
        if (m && mm.width * 1.9 > 236) break; words.length = 0; words.push(...next); m = mm;
      }
      const sc = 1.9, x0 = r() * 256, y = row * rowH + rowH / 2 - ((m.y0 + m.y1) / 2) * sc;
      runningHand(g, words, { x: x0 - m.x0 * sc, y, scale: sc, ink: '#ffffff', end: true, lw: 1.5 });
    }
  }),
};

let _tex = null;
/** The three pattern textures, made the first time they are asked for and kept for the session (shared by every shape layer). */
export function patternTextures() {
  if (_tex) return _tex;
  const N = tierSize(256, 64), data = [0, 1, 2].map(() => new Uint8Array(N * N * 4));
  for (const [name, { tex, ch }] of Object.entries(PATTERNS)) {
    const f = MAKE[name](N), D = data[tex];
    for (let i = 0; i < N * N; i++) D[i * 4 + ch] = Math.round(Math.min(1, Math.max(0, f[i])) * 255);
  }
  _tex = data.map((d, i) => {
    const t = new THREE.DataTexture(d, N, N, THREE.RGBAFormat, THREE.UnsignedByteType);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true; t.anisotropy = 4; t.colorSpace = THREE.NoColorSpace; t.name = `shape-patterns-${'abc'[i]}`; t.needsUpdate = true;
    return t;
  });
  return _tex;
}

const CH = [new THREE.Vector4(1, 0, 0, 0), new THREE.Vector4(0, 1, 0, 0), new THREE.Vector4(0, 0, 1, 0), new THREE.Vector4(0, 0, 0, 1)];
/** A pattern by name: its texture and the channel weights that pick it out of that texture's four. 'motif' is the feeling's in ctx
 *  (ctx.feeling, else noise); 'none', null or a name not here gives null (the layer reads 1 there: a solid shape). */
export function patternPick(name, ctx = {}) {
  if (name === 'motif') name = MOTIF[ctx.feeling ?? ctx.aspect] ?? 'noise';
  const P = PATTERNS[name]; if (!P) return null;
  return { name, tex: patternTextures()[P.tex], ch: CH[P.ch] };
}
