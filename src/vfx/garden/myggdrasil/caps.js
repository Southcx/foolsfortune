// ---------------------------------------------------------------------------------------
// MYGGDRASIL'S CAPS: the ten fruiting bodies (Dovina's CAPS, on CAP_SITES), great glowing caps with gills under them. Each is one surface
// of revolution laid twice with the same vertices: OPEN (a smooth dome, its rim wavy and curling under, freckled, gills radiating to the
// stem below it, glowing) and SHUT (a round button, its gills folded away inside it; on the Beauty ring a collar round the column).
// Opening is a morph from the one to the other, written into the tree's geometry only while a cap is moving (`setCap`): no rebuild, no
// second program, and the sun's shadow follows it (the shadow pass draws the same buffer).
//
//   THE TOP      its theme's colour from the middle out to the rim (bone, peach, coral, a violet blush; the Crown cream with an Ohmu-blue
//                rim), pale freckles on some, the rim lit through when the sun is behind it, leaned to the tincture a little
//   THE GILLS    ridges radiating from the stem (the near body only: far off they would crawl), dark violet with their glow over them,
//                teal, violet or amber by cap, brighter toward the rim, leaned to the tincture; faint by day, luminous by night
//
// Prior art: Mycena chlorophos and Omphalotus's glowing gills, Amanita's button and its warts (the freckles), the parasol mushroom's
// wavy rim, Nausicaa's Fukai caps (pale, spotted, lit from within) and Princess Mononoke's kodama forest; morph targets as consoles did
// them on the CPU for a few vertices at a time.
//
//   const caps = buildCaps(K, F, lod, S)   (S(k): part k's own stream of chance)   [{ i, C, M, R, start, count, ... }]   setCap(geometry, cap, k)   fruitAt(cap, a, frac, out)
//   capFrame(C, F, rnd) -> Matrix4   capSpores(cap, n, rnd) -> [{ p }] (points under its gills, the tree's frame)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { CAP_SITES, MYGG, trunkR, noise3, smooth01, D2R } from './layout.js';
import { ink, mixLin, lin } from './kit.js';
import { PAL } from './palette.js';

/** Each cap's theme: the top's middle and rim, its gills' glow, freckled or not (the Crown's band the Ohmu's teal). */
const THEMES = {
  kingdom: { c0: PAL.peach, c1: PAL.coralDeep, glow: PAL.gTeal, spots: true },
  foundation: { c0: PAL.coral, c1: PAL.coralDeep, glow: PAL.gViolet },
  splendour: { c0: PAL.boneWarm, c1: PAL.orange, glow: PAL.gTeal, spots: true },
  victory: { c0: lin(0xc4e4dc), c1: PAL.tealDeep, glow: PAL.gViolet },
  beauty: { c0: PAL.peach, c1: PAL.orange, glow: PAL.gTeal },
  severity: { c0: lin(0xe0b6d8), c1: PAL.violet, glow: PAL.gTeal, spots: true },
  mercy: { c0: PAL.peach, c1: PAL.coral, glow: PAL.gViolet },
  understanding: { c0: lin(0xece2ec), c1: PAL.violet, glow: PAL.gTeal },
  wisdom: { c0: lin(0xf6c4b4), c1: PAL.coralDeep, glow: PAL.gAmber, spots: true },
  crown: { c0: PAL.cream, c1: PAL.ohmu, band: PAL.teal, glow: PAL.gTeal, spots: true },
};

/** Where a cap stands in the tree's frame, tilted a little: a side cap outward off its limb. */
export function capFrame(C, F, rnd) {
  const r = new THREE.Vector3(Math.sin(C.az * D2R), 0, Math.cos(C.az * D2R)), axis = C.out ? new THREE.Vector3(r.z, 0, -r.x) : new THREE.Vector3(rnd() - 0.5, 0, rnd() - 0.5).normalize();
  const tilt = C.ring ? 0 : C.out ? 9 : 1.5 + rnd() * 1.5, q = new THREE.Quaternion().setFromAxisAngle(axis, tilt * D2R);
  return new THREE.Matrix4().compose(F.at(C.az, C.out, C.y), q, new THREE.Vector3(1, 1, 1));
}

/** A cap's shapes: its rows from the top's middle (or its inner edge) over the rim and back under along the gills, each row's open and
 *  shut (rho, y) at a turn phi, and what it is (for the painter). */
function rowsOf(C, lod) {
  const R = C.r, h = C.ring ? trunkR(C.y) + 0.95 : 0, dome = C.top ? 0.4 : C.ring ? 0.3 : 0.5, rb = C.top ? 5.2 : C.ring ? 1.7 : Math.max(1.25, 0.34 * R);
  const cb = C.ring ? 0 : rb * 0.72, stemR = h ? h + 0.1 : Math.max(0.85, 0.11 * R), seed = C.r * 3.7, Jt = lod ? 6 : C.top ? 14 : 10, Jg = lod ? 4 : C.top ? 9 : 6, Nphi = (C.top ? 112 : C.ring ? 80 : 64) / (lod ? 2 : 1);
  const bud = (a, s) => (C.ring ? [h + rb - rb * s * Math.cos(a), cb + rb * s * Math.sin(a)] : [rb * s * Math.sin(a), cb + rb * s * Math.cos(a)]);
  const aTop = C.ring ? 1.8 * Math.PI : 0.9 * Math.PI, aLip = C.ring ? [1.85, 1.9] : [0.93, 0.96], gillA = (g) => (C.ring ? 1.9 - 0.8 * g : 0.96 - 0.45 * g) * Math.PI;
  const wave = (phi, t) => 1 + 0.028 * t * t * t * Math.sin(phi * 6 + seed) + 0.012 * t * t * Math.sin(phi * 11 + seed * 2);
  const rows = [];
  if (!h) rows.push({ pole: true, kind: 'top', t: 0, open: () => [0, R * dome + R * 0.045], bud: () => bud(0, 1) });
  for (let j = h ? 0 : 1; j <= Jt; j++) {
    const t = j / Jt;
    rows.push({ kind: 'top', t, open: (phi) => { const w = wave(phi, t); return [(h + (R - h) * t) * w, R * dome * Math.pow(Math.max(0, 1 - Math.pow(t, 2.4)), 0.7) + (h ? 0 : R * 0.045 * Math.exp(-((t / 0.22) ** 2))) - R * 0.06 * t ** 6 + R * 0.03 * t ** 4 * Math.sin(phi * 5 + seed)]; }, bud: () => bud(aTop * t, 1) });
  }
  rows.push({ kind: 'lip', t: 1, open: (phi) => [R * 0.99 * wave(phi, 1), -R * 0.055 + R * 0.03 * Math.sin(phi * 5 + seed)], bud: () => bud(aLip[0] * Math.PI, 1) });
  rows.push({ kind: 'lip', t: 1, open: (phi) => [R * 0.955 * wave(phi, 0.95), -R * 0.08 + R * 0.025 * Math.sin(phi * 5 + seed)], bud: () => bud(aLip[1] * Math.PI, 0.97) });
  for (let j = 1; j <= Jg; j++) {
    const g = j / Jg, ridge = lod ? 0 : 0.04 * R * Math.pow(Math.sin(Math.PI * Math.min(1, g * 1.1)), 0.8);
    rows.push({ kind: 'gill', t: g, open: (phi, jj) => [THREE.MathUtils.lerp(R * 0.93, stemR, g), -R * 0.08 - R * 0.1 * Math.pow(g, 1.4) + R * 0.02 * (1 - g) * Math.sin(phi * 5 + seed) - ridge * (jj % 2)], bud: () => bud(gillA(g), 0.8) });
  }
  if (!h) rows.push({ pole: true, kind: 'stem', t: 1, open: () => [0, -R * 0.26], bud: () => [0, cb - rb * 0.95] });
  else { // (a ring's inner wall against the column, up to where its top began: closed, so the lattice never shows its inside)
    const top = rows[0];
    rows.push({ kind: 'stem', t: 1, open: () => [h, (R * dome - R * 0.18) / 2], bud: () => bud(1.2 * Math.PI, 0.6) });
    rows.push({ kind: 'stem', t: 1, open: top.open, bud: top.bud });
  }
  return { rows, Nphi, R, h, rb, cb, stemR };
}

const _c = [0, 0, 0], _e = [0, 0, 0];
/** The ten caps laid into the kit, open, each with its two shapes kept for `setCap`. */
export function buildCaps(K, F, lod, S) {
  return CAP_SITES.map((C, i) => {
    const M = capFrame(C, F, S(800 + i)), shape = rowsOf(C, lod), T = THEMES[C.id], N = shape.Nphi, start = K.n;
    // the vertices of both shapes, in the cap's frame, then the tree's
    const idx = [], open = [], shut = [], meta = [], rowStart = [];
    for (const row of shape.rows) {
      rowStart.push(open.length / 3);
      const n = row.pole ? 1 : N;
      for (let j = 0; j < n; j++) {
        const phi = (j / N) * Math.PI * 2, [ro, yo] = row.open(phi, j), [rs, ys] = row.bud(phi, j);
        open.push(Math.sin(phi) * ro, yo, Math.cos(phi) * ro); shut.push(Math.sin(phi) * rs, ys, Math.cos(phi) * rs); meta.push(row, j);
      }
    }
    for (let r = 0; r < shape.rows.length - 1; r++) {
      const A = shape.rows[r], B = shape.rows[r + 1], a0 = rowStart[r], b0 = rowStart[r + 1];
      for (let j = 0; j < N; j++) {
        const j1 = (j + 1) % N;
        if (A.pole) idx.push(a0, b0 + j, b0 + j1);
        else if (B.pole) idx.push(a0 + j, b0, a0 + j1);
        else idx.push(a0 + j, b0 + j, a0 + j1, a0 + j1, b0 + j, b0 + j1);
      }
    }
    const shapes = [open, shut].map((arr) => {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); g.setIndex(idx); g.applyMatrix4(M); g.computeVertexNormals();
      const out = { P: g.attributes.position.array.slice(), N: g.attributes.normal.array.slice() }; g.dispose(); return out;
    });
    // laid open, painted as the open shape is
    const P1 = shapes[0].P, N1 = shapes[0].N, count = P1.length / 3;
    for (let v = 0; v < count; v++) {
      const row = meta[v * 2], j = meta[v * 2 + 1], phi = (j / N) * Math.PI * 2, lx = open[v * 3], lz = open[v * 3 + 2];
      paintCap(C, T, row, phi, j, lx, lz);
      K.vtx(P1[v * 3], P1[v * 3 + 1], P1[v * 3 + 2], N1[v * 3], N1[v * 3 + 1], N1[v * 3 + 2]);
    }
    for (let k = 0; k < idx.length; k += 3) K.tri(start + idx[k], start + idx[k + 1], start + idx[k + 2]);
    return { i, C, M, R: shape.R, h: shape.h, stemR: shape.stemR, start, count, P1, N1, P0: shapes[1].P, N0: shapes[1].N, k: 1 };
  });
}

/** A cap vertex's paint (in its open shape's terms). */
function paintCap(C, T, row, phi, j, lx, lz) {
  const R = C.r;
  if (row.kind === 'top') {
    const t = row.t, freq = 2.6 / Math.max(2.5, R) * 1.2, spot = T.spots ? smooth01(0.7, 0.76, noise3(lx * freq + C.r, lz * freq, C.y * 0.3)) * smooth01(0.08, 0.3, t) * (1 - smooth01(0.8, 0.95, t)) : 0;
    mixLin(_c, T.c0, T.c1, Math.pow(smooth01(0.4, 1, t), 1.3));
    if (T.band) { mixLin(_e, _c, T.band, Math.exp(-(((t - 0.78) / 0.07) ** 2)) * 0.7); _c[0] = _e[0]; _c[1] = _e[1]; _c[2] = _e[2]; }
    mixLin(_c, _c, PAL.cream, spot * 0.85);
    ink(_c, 0.94 + 0.06 * noise3(lx * 0.7, lz * 0.7, R), T.glow, 0.05 * smooth01(0.85, 1, t), MYGG.tintMax, 0, 0.25 + 0.55 * smooth01(0.5, 1, t), 0.5);
  } else if (row.kind === 'lip') {
    mixLin(_c, T.c1, PAL.gill, 0.3); ink(_c, 0.9, T.glow, 0.16, MYGG.tintMax, 0, 0.7, 0.55);
  } else if (row.kind === 'gill') {
    const g = row.t, ridge = j % 2 ? 0.82 : 1.12;
    mixLin(_c, PAL.gill, T.glow, 0.18 + 0.12 * (1 - g)); ink(_c, ridge * (0.8 + 0.2 * (1 - g)), T.glow, (0.13 + 0.2 * (1 - g)) * ridge, 0.85, 0, 0.3, 0.72);
  } else { ink(PAL.boneShade, 0.8, T.glow, 0.08, 0.85, 0, 0, 0.8); }
}

/** A cap opened to k (0 shut .. 1 open, eased): its vertices written into the geometry (and the far one's), only the cap's range. */
export function setCap(geometry, cap, k) {
  const e = k * k * (3 - 2 * k), P = geometry.attributes.position, N = geometry.attributes.normal, o = cap.start * 3, n = cap.count * 3, pa = P.array, na = N.array;
  for (let v = 0; v < n; v += 3) {
    pa[o + v] = cap.P0[v] + (cap.P1[v] - cap.P0[v]) * e; pa[o + v + 1] = cap.P0[v + 1] + (cap.P1[v + 1] - cap.P0[v + 1]) * e; pa[o + v + 2] = cap.P0[v + 2] + (cap.P1[v + 2] - cap.P0[v + 2]) * e;
    let x = cap.N0[v] + (cap.N1[v] - cap.N0[v]) * e, y = cap.N0[v + 1] + (cap.N1[v + 1] - cap.N0[v + 1]) * e, z = cap.N0[v + 2] + (cap.N1[v + 2] - cap.N0[v + 2]) * e;
    const l = Math.hypot(x, y, z) || 1; na[o + v] = x / l; na[o + v + 1] = y / l; na[o + v + 2] = z / l;
  }
  P.addUpdateRange(o, n); N.addUpdateRange(o, n); P.needsUpdate = true; N.needsUpdate = true;
  cap.k = k;
}

/** Where a fruit hangs from an open cap: at turn `a` (radians), `frac` of the way out under its gills (the tree's frame). */
export function fruitAt(cap, a, frac, out = new THREE.Vector3()) {
  const R = cap.R, rho = THREE.MathUtils.lerp(cap.h ? cap.h + 0.6 : cap.stemR + 0.4, R * 0.85, frac), g = 1 - (rho - cap.stemR) / Math.max(0.1, R * 0.93 - cap.stemR);
  return out.set(Math.sin(a) * rho, -R * 0.08 - R * 0.1 * Math.pow(THREE.MathUtils.clamp(g, 0, 1), 1.4) - 0.15, Math.cos(a) * rho).applyMatrix4(cap.M);
}
/** Points under a cap's gills where its spores fall from (the tree's frame). */
export function capSpores(cap, n, rnd) {
  const out = [];
  for (let k = 0; k < n; k++) out.push({ p: fruitAt(cap, rnd() * Math.PI * 2, 0.2 + rnd() * 0.7, new THREE.Vector3()), cap: cap.i });
  return out;
}
