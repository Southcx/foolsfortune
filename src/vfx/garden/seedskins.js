// ---------------------------------------------------------------------------------------
// THE SEEDS' SKINS: what a planetoid grown from a seed wears in its ground's vertex colours, past its kind's own pattern
// (vfx/garden/seedplanetoids.js): a feeling's moonlet's paint motif, and the tint of what a planetoid of the ring was fed (Dovina's
// `tintOf`, progress/seeds.js: the feeling fed most, once it is a third of all). Drawn on the planetoid's own ground program (every
// planetoid shares one: vfx/garden/gardengrounds.js), so none of it is a program of its own (casebook rule 5).
//
//   A MOONLET'S MOTIF  the seven paint motifs of vfx/paintmotifs.js (the ground's own GLSL there) laid again on a 5 m sphere in metres,
//                      at the vertex's fineness (a vertex about every 0.22 m, so each period is 0.8 m or more and each line spans two
//                      vertices): Wonder a frost net of pale lines and glints, Mirth bright round dapples, Desire the wind's ripples (a
//                      crest and its lee), Fury plates parted by cracks of light and charred inside, Gall dark curds with pale skins,
//                      Grief the long rain's broken streaks down the meridians, Dread marbled ink in pale contours. Each has a light
//                      part and a dark part against its feeling's colour, as the paint's do (casebook rule 105)
//   A FED TINT         patches laid over the kind, in the planetoid's own directions (so they read the same at 5 m and at 20 m), never
//                      the whole of it and never more than about half strength, so the kind is read first and what it ate second:
//                        grief  rain-moss: blue-green moss in the hollows and down the flanks, wet streaks running down
//                        crude  oil-sheen: dark stains with the thin film's bands in them (crude is no feeling; the look waits for it)
//                        wonder frost on the tops, glints in it      mirth  gold sun-dapples      desire  rose dust drifted in ripples
//                        fury   scorched patches cracked with embers  gall   violet lichen rosettes  dread  ink marbled in the hollows
//
// Prior art: vfx/paintmotifs.js (its seven motifs, their weights and their light-and-dark rule), Worley's cell noise (1996) for the nets,
// the plates and the curds, Perlin's value noise and fBm for the patches, the thin film's cosine palette (Inigo Quilez, "palettes", 2013)
// for the oil's sheen, and the moss and lichen that colonise a stone by where water runs (the rain-moss moon is a dry-stone wall's).
//
//   motifOf(feeling, x, y, z, R) -> m (-1 dark .. +1 light)   lightDark(c, m)   fedTint(c, tint, x, y, z, up)   (c a THREE.Color, changed)
//   noise3(x, y, z)   fbm3(x, y, z)   cells3(x, y, z) -> { f1, f2, id }   (shared with the kinds' skins)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const TAU = Math.PI * 2;
const fr = (v) => v - Math.floor(v);
const sstep = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
/** A hash of a lattice point, 0..1 (doubles: no precision lost at a planetoid's few metres). */
export const hash3 = (x, y, z) => fr(Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453);
/** Value noise, smooth, 0..1. */
export function noise3(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  let u = x - ix, v = y - iy, w = z - iz; u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v); w = w * w * (3 - 2 * w);
  const a = hash3(ix, iy, iz), b = hash3(ix + 1, iy, iz), c = hash3(ix, iy + 1, iz), d = hash3(ix + 1, iy + 1, iz);
  const e = hash3(ix, iy, iz + 1), f = hash3(ix + 1, iy, iz + 1), g = hash3(ix, iy + 1, iz + 1), h = hash3(ix + 1, iy + 1, iz + 1);
  const x0 = a + (b - a) * u, x1 = c + (d - c) * u, x2 = e + (f - e) * u, x3 = g + (h - g) * u;
  return (x0 + (x1 - x0) * v) + ((x2 + (x3 - x2) * v) - (x0 + (x1 - x0) * v)) * w;
}
export const fbm3 = (x, y, z) => 0.55 * noise3(x, y, z) + 0.3 * noise3(x * 2.03 + 7.1, y * 2.03, z * 2.03 - 3.3) + 0.15 * noise3(x * 4.1 + 3.3, y * 4.1 - 1.7, z * 4.1);
const CELL = { f1: 0, f2: 0, id: 0 };
/** Worley's cells: the nearest point's distance, the second's, and the nearest cell's hash (one object, reused: read it at once). */
export function cells3(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  let f1 = 9, f2 = 9, id = 0;
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) {
    const cx = ix + a, cy = iy + b, cz = iz + c;
    const px = cx + 0.1 + 0.8 * hash3(cx, cy, cz), py = cy + 0.1 + 0.8 * hash3(cx + 17.3, cy, cz), pz = cz + 0.1 + 0.8 * hash3(cx, cy + 41.9, cz);
    const d = Math.hypot(px - x, py - y, pz - z);
    if (d < f1) { f2 = f1; f1 = d; id = hash3(cx + 5.1, cy + 2.7, cz + 9.3); } else if (d < f2) f2 = d;
  }
  CELL.f1 = f1; CELL.f2 = f2; CELL.id = id; return CELL;
}
/** A line of half-width `hw` at distance `d` (both in the same units), soft over its own width: 1 on it, 0 off it. */
const line = (d, hw) => 1 - sstep(hw * 0.5, hw * 1.5, d);
const band = (ph) => 0.5 - Math.abs(fr(ph) - 0.5);

/** The motifs on a moonlet, in metres (`R` its radius): +1 the motif's light part, -1 its dark part, 0 the colour as it is. Each is
 *  vfx/paintmotifs.js's, at about four times its scale (the paint's is drawn a pixel at a time; this a vertex at a time). */
const MOTIFS = {
  wonder(x, y, z) { const S = 1.0, C = cells3(x / S, y / S, z / S); return Math.min(1, 0.9 * line((C.f2 - C.f1) * S * 0.5, 0.09) + (C.id > 0.72 ? line(C.f1 * S, 0.12) : 0)); },
  mirth(x, y, z) { const S = 0.9, C = cells3(x / S + 1.3, y / S, z / S), r = (0.2 + 0.12 * C.id) * S; return 1 - sstep(r - 0.06, r + 0.06, C.f1 * S); },
  desire(x, y, z, R) {
    const S = 0.8, ph = (x * 0.8 + y * 0.3 + z * 0.52) / S + 0.55 * Math.sin((x * -0.52 + z * 0.8) / R * 7);
    return 0.9 * line(band(ph) * S, 0.09) - 0.6 * line(band(ph - 0.24) * S, 0.08);
  },
  fury(x, y, z) { const S = 1.1, C = cells3(x / S - 2.1, y / S, z / S), crack = line((C.f2 - C.f1) * 0.5 * S, 0.08); return Math.max(-1, Math.min(1, 1.1 * crack - 0.45 * sstep(0.05, 0.45, C.f1))); },
  gall(x, y, z) {
    const S = 0.9, C = cells3(x / S + 3.7, y / S, z / S + 3.7), r = (0.14 + 0.18 * C.id) * S, d = C.f1 * S;
    return -0.95 * (1 - sstep(r - 0.05, r + 0.05, d)) + 0.6 * line(Math.abs(d - r - 0.06), 0.05);
  },
  grief(x, y, z, R) {
    const S = 0.55, lon = Math.atan2(x, z), lat = Math.asin(Math.max(-1, Math.min(1, y / R)));
    const across = (lon * R) / S, lane = Math.round(across), len = 0.6 + 0.5 * hash3(lane, 3, 0), dash = fr((lat * R) / len + hash3(lane, 9, 0));
    return -0.8 * line(Math.abs(across - lane) * S, 0.07) * (dash < 0.64 ? 1 : 0);
  },
  dread(x, y, z) {
    const wx = fbm3(x * 0.32, y * 0.32, z * 0.32), wz = fbm3(x * 0.32 + 5.2, y * 0.32, z * 0.32 - 1.3);
    const n = fbm3(x * 0.42 + wx * 1.6, y * 0.42, z * 0.42 + wz * 1.6) * 6;
    return 0.95 * (1 - sstep(0.04, 0.11, band(n)));
  },
};
export const motifOf = (feeling, x, y, z, R) => (MOTIFS[feeling] ? MOTIFS[feeling](x, y, z, R) : 0);
const WARM_WHITE = new THREE.Color(1, 0.97, 0.92);
/** The paint motifs' rule for the light and the dark part: toward a warm white by half of m, or darker by 0.7 of it. */
export function lightDark(c, m) { if (m > 0) c.lerp(WARM_WHITE, 0.5 * m); else if (m < 0) c.multiplyScalar(1 + 0.7 * m); return c; }

// ------------------------------------------------------------------ the fed tints
const hex = (h) => new THREE.Color().setHex(h);
const T = {
  moss: hex(0x3f8a78), wet: hex(0x24404a), stain: hex(0x16121e), ice: hex(0xd8f0fa), gold: hex(0xf4cc62), rose: hex(0xe6907c),
  char: hex(0x2e2224), ember: hex(0xe0482a), violet: hex(0xa080d0), violetD: hex(0x5a3a86), ink: hex(0x14281e),
};
const _f = new THREE.Color();
/** The thin film's colour at phase t (the oil's sheen: a cosine palette, its saturation held at a half so it is a sheen, never a rainbow). */
const film = (t, out) => out.setRGB(0.55 + 0.35 * Math.cos(TAU * t), 0.55 + 0.35 * Math.cos(TAU * (t + 0.33)), 0.55 + 0.35 * Math.cos(TAU * (t + 0.67)));
/** How strong a tint lies where it lies: 0.4 at a third of what was fed, 0.65 when it was all, in patches (never louder than the kind). */
export const tintStrength = (share) => 0.4 + 0.25 * Math.min(1, Math.max(0, (share - 1 / 3) / (2 / 3)));
/** What it was fed, laid on `c` at a unit direction (x, y, z); `up` how much the ground faces the crown (0..1). */
export function fedTint(c, tint, x, y, z, up = 0.5) {
  if (!tint?.feeling) return c;
  const k = tintStrength(tint.share ?? 0.34), q = 3.2, patch = fbm3(x * q + 4.1, y * q, z * q - 2.3);
  switch (tint.feeling) {
    case 'grief': {
      const m = sstep(0.4, 0.6, patch) * (0.55 + 0.45 * (1 - up)), lon = Math.atan2(x, z), lane = fr(lon / TAU * 46);
      const streak = line(Math.abs(lane - 0.5), 0.12) * sstep(0.3, 0.7, fbm3(x * 9, y * 2, z * 9));
      c.lerp(T.moss, Math.min(0.85, k * m * 1.5)); c.lerp(T.wet, k * streak * 0.6); break;
    }
    case 'crude': {
      const m = sstep(0.44, 0.6, patch), t = fbm3(x * 7, y * 7, z * 7) * 2.6 + Math.atan2(x, z) * 0.15;
      c.lerp(T.stain, k * m * 1.1); film(t, _f); c.r += _f.r * 0.28 * k * m; c.g += _f.g * 0.28 * k * m; c.b += _f.b * 0.28 * k * m; break;
    }
    case 'wonder': {
      const m = sstep(0.45, 0.85, up + (patch - 0.5) * 0.7), glint = hash3(Math.round(x * 40), Math.round(y * 40), Math.round(z * 40)) > 0.94 ? 1 : 0;
      c.lerp(T.ice, k * m * 1.3); if (glint && m > 0.3) c.lerp(WARM_WHITE, 0.6); break;
    }
    case 'mirth': { const C = cells3(x * 5, y * 5, z * 5), m = 1 - sstep(0.24, 0.32, C.f1); c.lerp(T.gold, k * m * (0.6 + 0.6 * sstep(0.4, 0.6, patch))); break; }
    case 'desire': {
      const ph = (x * 0.6 + y * 0.2 + z * 0.77) * 9 + 0.6 * Math.sin((x * -0.77 + y * 0.3 + z * 0.6) * 6);
      c.lerp(T.rose, k * sstep(0.4, 0.6, patch) * (0.5 + 0.7 * line(band(ph), 0.12))); break;
    }
    case 'fury': {
      const C = cells3(x * 4 - 1, y * 4, z * 4), m = sstep(0.48, 0.62, patch);
      c.lerp(T.char, k * m * 1.1); c.lerp(T.ember, k * m * 1.4 * line(C.f2 - C.f1, 0.05)); break;
    }
    case 'gall': {
      const C = cells3(x * 6 + 2, y * 6, z * 6), m = sstep(0.42, 0.58, patch);
      c.lerp(T.violet, k * m * (1 - sstep(0.18, 0.26, C.f1))); c.lerp(T.violetD, k * m * line(Math.abs(C.f1 - 0.3), 0.05)); break;
    }
    case 'dread': {
      const n = fbm3(x * 3.8, y * 3.8, z * 3.8) * 5, m = sstep(0.4, 0.6, patch) * (0.5 + 0.5 * (1 - up));
      c.lerp(T.ink, k * m * (0.6 + 0.6 * line(band(n), 0.12))); break;
    }
    default: break;
  }
  return c;
}
