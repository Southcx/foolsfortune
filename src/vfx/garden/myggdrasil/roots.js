// ---------------------------------------------------------------------------------------
// MYGGDRASIL'S ROOTS AND TRUNK: the tree grows as one knot of roots. Ten STRANDS run in over the planetoid's ground, half sunk in it and
// humping over it as old roots do, climb into THE BOLE (wide and closed round a dark hollow, 0 .. 7 m), and braid on up THE TRUNK in a
// lattice you see through (strands twisting both ways, crossing and fused where they cross, as a strangler fig's roots knit round the
// tree they killed). Six peel off as coral LIMBS to the side caps; four pull in to THE COLUMN that carries the Crown. Every strand is one
// tube from its tip in the ground to its cap.
//
//   THE MOUTH     the two strands either side of bearing 90 part at the bole's foot and meet again overhead (MOUTH): a pointed arch, and
//                 behind it THE HOLLOW, a dark shell inside the bole (its faces turned in, so it is seen only through a gap), its floor of
//                 dark loam and in the middle a pool lit in the tincture's colour (`mouthAt`: where the world's F stands)
//   PROP ROOTS    aerial roots that came down from the trunk and took hold (arches between them and the bole)
//   GROUND ROOTS  forks off the strands' runs over the ground, and four long roots that grip on down the planetoid's sides
//   THE PAINT     ashen mauve going dark where it sinks, lichened teal (a faint glow by night), bone white up the trunk; its inner faces
//                 and undersides shaded (painted occlusion: the lattice reads deep)
//
// Prior art: the strangler fig (Ficus aurea, F. watkinsiana: a lattice of fused roots, hollow when its host has rotted), Laputa's great
// tree (roots wrapped round its world), the Ta Prohm silk-cotton trees' roots over the stones, Princess Mononoke's forest floor, and
// Nausicaa's fungal forest's hollow stems.
//
//   const R = buildRoots(K, F, lod, S)   (S(k): part k's own stream of chance)   R.limbs [{ cap, curve, from, strand }]   R.tips [{ az, s }]
//   R.mouthAt   R.mouthIn   R.mouthOut (Vector3s)   R.hollow (spots for the hollow's own small fungi: [{ p, n }])   strandBearing(i, h)   STRAND_BASE
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { CAP_SITES, MOUTH, COLUMN, trunkR, D2R, angDiff, noise3, smooth01 } from './layout.js';
import { tube, sheet, ink, mixLin } from './kit.js';
import { PAL } from './palette.js';

/** The strands' bearings at the bole's foot (the mouth's two first and last), and their twist up the trunk (degrees a metre). */
export const STRAND_BASE = [108, 144, 180, 216, 252, 288, 324, 0, 36, 72];
const TWIST = 4.3, LIMB_CAPS = ['splendour', 'victory', 'severity', 'mercy', 'understanding', 'wisdom'];

/** A strand's bearing at a height in the bole and trunk (the mouth's two pushed apart at the foot and meeting over the arch). */
export function strandBearing(i, h) {
  const b = STRAND_BASE[i], d = i % 2 ? 1 : -1;
  let th = b + d * TWIST * Math.max(0, h - 3);
  if (b === 108 || b === 72) th += (b === 108 ? 1 : -1) * (MOUTH.spread - 18) * (1 - smooth01(0, MOUTH.top - 0.2, h));
  return th;
}

const _c = [0, 0, 0], _e = [0, 0, 0];
/** The roots' painter: by height, by how far it has sunk, lichen in patches, its inner faces and undersides shaded; past `limb` (u) it
 *  warms toward `tip` and grows polyps (a strand become coral). */
function rootPaint(F, { limb = 2, tip = null, rev = false } = {}) {
  return (u0, v, p, n) => {
    const u = rev ? 1 - u0 : u0, hx = Math.hypot(p.x, p.z) || 1, h = p.y - F.y0, clear = p.length() - F.groundR(p);
    mixLin(_c, PAL.root, PAL.rootLight, smooth01(0.5, 7, h));
    mixLin(_c, _c, PAL.bone, smooth01(5, 21, h));
    const ln = noise3(p.x * 0.55 + 3.1, p.y * 0.55, p.z * 0.55), lich = smooth01(0.68, 0.78, ln) * (1 - smooth01(9, 17, h));
    mixLin(_c, _c, PAL.lichen, lich * 0.7);
    mixLin(_c, _c, PAL.sunk, 1 - smooth01(-0.15, 1.1, clear));
    let polyp = 0;
    if (u > limb && tip) { const k = smooth01(limb, 1, u); mixLin(_e, PAL.bone, tip, k * k); mixLin(_c, _c, _e, smooth01(limb, limb + 0.08, u)); polyp = 0.75 * k; }
    const inner = Math.max(0, -(n.x * p.x + n.z * p.z) / hx) * (1 - smooth01(24, 34, h)), under = Math.max(0, -n.y);
    const shade = (1 - 0.55 * inner * (hx < trunkR(h) + 1.5 ? 1 : 0.35)) * (1 - 0.3 * under) * (0.92 + 0.08 * noise3(p.x * 1.7, p.y * 1.7, p.z * 1.7));
    ink(_c, shade, PAL.gTeal, lich * 0.025, 0, polyp, 0, 0.9);
  };
}

/** A radius along control points: [u, r] pairs by chord length, eased between. */
function radiusAlong(pts, rs) {
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const T = L[L.length - 1] || 1, U = L.map((x) => x / T);
  return { U, r: (u) => { let i = 1; while (i < U.length - 1 && U[i] < u) i++; const k = THREE.MathUtils.clamp((u - U[i - 1]) / ((U[i] - U[i - 1]) || 1), 0, 1); return rs[i - 1] + (rs[i] - rs[i - 1]) * k; } };
}

export function buildRoots(K, F, lod, S) {
  const Q = lod ? { radial: 0.55, seg: 0.45 } : { radial: 1, seg: 1 }, rad = (n) => Math.max(5, Math.round(n * Q.radial));
  const segsOf = (pts, perM = 1.4) => { let L = 0; for (let i = 1; i < pts.length; i++) L += pts[i].distanceTo(pts[i - 1]); return Math.max(6, Math.round(L * perM * Q.seg)); };
  const cap = (id) => CAP_SITES.find((c) => c.id === id), tips = [], limbs = [], out = { tips, limbs };
  // which strand peels off to which cap: lowest first, each the strand whose bearing is nearest the cap's where it peels
  const role = new Array(STRAND_BASE.length).fill('column');
  for (const id of [...LIMB_CAPS].sort((a, b) => cap(a).arm - cap(b).arm)) {
    const C = cap(id); let best = -1, bd = 1e9;
    STRAND_BASE.forEach((_, i) => { if (role[i] !== 'column') return; const d = Math.abs(angDiff(strandBearing(i, C.arm), C.az)); if (d < bd) { bd = d; best = i; } });
    role[best] = id;
  }
  // ---- the ten strands
  STRAND_BASE.forEach((b0, i) => {
    const rnd = S(i), d = i % 2 ? 1 : -1, gb = strandBearing(i, 0), sTip = 14.5 + rnd() * 3.5, pts = [], rs = [];
    // the run in over the ground, half sunk, humping
    for (let s = sTip; s > 7.4; s -= 1.7) {
      const k = (sTip - s) / (sTip - 7.4), r = 0.4 + 1.15 * Math.pow(k, 0.8);
      pts.push(F.ground(gb + 4 * Math.sin(s * 0.7 + i), s, r * (0.05 + 0.32 * Math.sin(s * 1.1 + i * 1.9)))); rs.push(r);
    }
    tips.push({ az: gb, s: sTip });
    // the bole
    for (const [h, rho, r] of [[0.7, 6.4, 1.7], [2.3, 5.5, 1.62], [4.4, trunkR(4.4) + 0.1, 1.42]]) { pts.push(F.at(strandBearing(i, h), rho, h)); rs.push(r); }
    // the trunk, woven
    const R = role[i], C = R === 'column' ? null : cap(R), peel = C ? C.arm : COLUMN.from;
    for (let h = 6.4; h <= peel + 0.01; h += 1.6) {
      const th = strandBearing(i, h), rho = trunkR(h) + 0.45 * d * Math.sin(5 * th * D2R) * smooth01(7, 10, h);
      pts.push(F.at(th, rho, h)); rs.push(1.22 - 0.2 * smooth01(6, 21, h));
    }
    let limbU = 2, tipCol = null;
    if (C) {
      // a limb: out and up from where it peels to its cap's heart, swept round to the cap's bearing
      const hp = pts[pts.length - 1].y - F.y0, th = strandBearing(i, hp), D = angDiff(th, C.az), base = pts.length;
      for (const [f, rho, h, r] of [[0.22, trunkR(hp) + 2.4, hp + 1.7, 0.98], [0.55, THREE.MathUtils.lerp(trunkR(hp), C.out, 0.5), hp + (C.y - hp) * 0.55, 0.88], [0.85, C.out * 0.86, C.y - 1.6, 0.8], [1, C.out, C.y - 0.5, 0.72]]) {
        pts.push(F.at(th + D * f + (f < 1 ? 6 * Math.sin(f * 9 + i) : 0), rho, h)); rs.push(r);
      }
      const RA = radiusAlong(pts, rs); limbU = RA.U[base - 1]; tipCol = C.az % 120 === 0 ? PAL.coral : PAL.peach;
      const curve = tube(K, pts, { r: RA.r, radial: rad(12), segs: segsOf(pts), paint: rootPaint(F, { limb: limbU, tip: tipCol }), lump: 0.17, seed: i * 3.1 });
      limbs.push({ cap: R, curve, from: limbU, strand: i });
    } else {
      // the column: pulled in and on up, twisting, to the Crown's underside
      const colFrom = pts.length;
      for (let h = 23; h <= COLUMN.to + 0.01; h += 2.1) { const th = strandBearing(i, h); pts.push(F.at(th, trunkR(h) + 0.25 * Math.sin(th * 3 * D2R), h)); rs.push(0.95 - 0.25 * smooth01(23, COLUMN.to, h)); }
      const RA = radiusAlong(pts, rs);
      const curve = tube(K, pts, { r: RA.r, radial: rad(11), segs: segsOf(pts), paint: rootPaint(F), lump: 0.16, seed: i * 3.1 });
      limbs.push({ cap: null, curve, from: RA.U[colFrom] ?? 0.7, strand: i });
    }
  });
  // ---- three thinner strands knit through the column the other way, born on the trunk
  for (let k = 0; k < 3; k++) {
    const pts = [], b = 30 + k * 120;
    for (let h = 17; h <= COLUMN.to - 0.5; h += 2) pts.push(F.at(b - 5.5 * (h - 17), trunkR(h) + 0.1, h));
    tube(K, pts, { r: (u) => 0.62 - 0.18 * u, radial: rad(8), segs: segsOf(pts), paint: rootPaint(F), lump: 0.1, seed: 40 + k });
  }
  // ---- the Foundation's limb and the Kingdom's stalk (built from the cap down, rounded where they meet the trunk or the ground)
  { const C = cap('foundation'), pts = [F.at(C.az, C.out, C.y - 0.4), F.at(C.az - 6, C.out * 0.72, C.y - 1.6), F.at(C.az - 10, trunkR(C.arm) + 1.6, C.arm + 0.4), F.at(C.az - 14, trunkR(C.arm) - 0.8, C.arm - 0.4)];
    const curve = tube(K, pts, { r: (u) => 0.72 + 0.4 * u, radial: rad(11), segs: segsOf(pts), paint: rootPaint(F, { limb: 0.3, tip: PAL.coral, rev: true }), tip: 'round', seed: 77 });
    limbs.push({ cap: 'foundation', curve, from: 0, strand: -1, reversed: true }); }
  { const C = cap('kingdom'), pts = [F.at(C.az, C.out, C.y - 0.5), F.at(C.az + 4, C.out - 0.4, C.y * 0.55), F.ground(C.az + 6, C.out - 0.6, 0.4), F.ground(C.az + 9, C.out - 0.4, -0.9)];
    tube(K, pts, { r: (u) => 0.62 + 0.55 * u * u, radial: rad(10), segs: segsOf(pts), paint: rootPaint(F, { limb: 0.35, tip: PAL.peach, rev: true }), seed: 91 }); }
  // ---- prop roots: come down from the trunk and taken hold (from the ground up, rounded where they join it)
  for (let k = 0; k < 7; k++) {
    const rnd = S(200 + k), az = 126 + k * 36 + (rnd() - 0.5) * 10, h = 9 + rnd() * 8, sE = 9.5 + rnd() * 2.5;
    if (Math.abs(angDiff(az, MOUTH.az)) < 26) continue;
    const pts = [F.ground(az + 4, sE + 1.6, -0.5), F.ground(az + 2, sE, 0.25), F.at(az, trunkR(h) + 4.2, h * 0.42), F.at(az - 3, trunkR(h) + 1.9, h - 1.4), F.at(az - 6, trunkR(h) - 0.5, h)];
    tube(K, pts, { r: (u) => 0.62 - 0.12 * u, radial: rad(9), segs: segsOf(pts), paint: rootPaint(F), tip: 'round', lump: 0.14, seed: 120 + k });
  }
  // ---- forks off the strands' runs, and four long roots gripping on down the planetoid
  tips.forEach((T, i) => {
    const n = 1 + (i % 2);
    for (let f = 0; f < n; f++) {
      const rnd = S(100 + i * 3 + f), s0 = 8.6 + rnd() * 4, side = (f ? -1 : 1) * (i % 3 ? 1 : -1), az0 = T.az + 4 * Math.sin(s0 * 0.7 + i), len = 5 + rnd() * 4, pts = [];
      for (let k = 0; k <= 5; k++) { const t = k / 5; pts.push(F.ground(az0 + side * (8 + 30 * t) * (1 + 0.2 * Math.sin(t * 5 + i)), s0 + len * t, (k === 5 ? -0.45 : 0.12 + 0.2 * Math.sin(t * 6 + f)))); }
      tube(K, pts, { r: (u) => 0.55 - 0.38 * u, radial: rad(7), segs: segsOf(pts, 1.6), paint: rootPaint(F), lump: 0.16, seed: 200 + i * 7 + f });
    }
  });
  for (const i of [1, 3, 6, 8]) {
    const rnd = S(300 + i), T = tips[i], pts = [], sEnd = 27 + rnd() * 5;
    for (let k = 0; k <= 7; k++) { const t = k / 7, s = T.s - 0.6 + (sEnd - T.s) * t; pts.push(F.ground(T.az + 7 * Math.sin(t * 4 + i), s, k === 7 ? -0.4 : 0.1 + 0.18 * Math.sin(t * 9 + i))); }
    tube(K, pts, { r: (u) => 0.44 - 0.32 * u, radial: rad(7), segs: segsOf(pts, 1.2), paint: rootPaint(F), lump: 0.16, seed: 300 + i });
    T.s = sEnd;
  }
  // ---- the hollow: a dark shell inside the bole (faces turned in), its floor of loam, the pool in the middle
  const prof = [[4.6, -1.6], [4.75, 0.4], [4.55, 2.6], [3.95, 4.8], [2.95, 6.6], [1.6, 7.7], [0.35, 8.2]], around = lod ? 18 : 28;
  sheet(K, prof.length, around, (i, j, o) => { const a = (j / around) * 360; return F.at(a, prof[i][0], prof[i][1], o); }, { wrap: true, paint: (u, v, p) => {
    const sp = smooth01(0.66, 0.78, noise3(p.x * 0.9, p.y * 0.9, p.z * 0.9));
    mixLin(_c, PAL.loam, PAL.dark, smooth01(0, 0.6, u)); ink(_c, 1, PAL.gTeal, sp * 0.18, 0, 0.5, 0, 0.95);
  } });
  const rings = lod ? 5 : 8;
  sheet(K, rings, around, (i, j, o) => F.ground((j / around) * 360, 0.02 + (4.7 * i) / (rings - 1), 0.06, o), { wrap: true, paint: (u, v, p) => {
    const s = u * 4.7, pool = 1 - smooth01(1.3, 1.9, s);
    mixLin(_c, PAL.loam, PAL.tealDeep, pool * 0.6); ink(_c, 1 - 0.4 * pool, PAL.gAmber, 0.62 * pool, pool, 0, 0, 0.3 + 0.6 * (1 - pool));
  } });
  out.mouthAt = F.ground(MOUTH.az, MOUTH.s, MOUTH.lift); out.mouthIn = F.ground(MOUTH.az, 2.2, 0.7); out.mouthOut = new THREE.Vector3(Math.sin(MOUTH.az * D2R), 0, Math.cos(MOUTH.az * D2R));
  out.hollow = [];
  for (let k = 0; k < 7; k++) { const rnd = S(400 + k), a = MOUTH.az + 180 + (k - 3) * 34 + (rnd() - 0.5) * 12, h = 0.4 + rnd() * 3.2, rho = 4.3 - h * 0.12; const p = F.at(a, rho, h), n = new THREE.Vector3(-Math.sin(a * D2R), 0.6, -Math.cos(a * D2R)).normalize(); out.hollow.push({ p, n }); }
  return out;
}
