import * as THREE from 'three';
import { PALETTE } from './config.js';

// ---------------------------------------------------------------------------
// Pottery: lathe profiles + shape modifiers + surface patterns + materials.
// Every point on a pot comes from `potPoint()`, so the intact mesh, its
// collider and the fracture shards all agree on the same surface.
// ---------------------------------------------------------------------------

// How a clay body breaks. `cell` is the rough fragment edge length in metres,
// `chunk` how many surface triangles a shard may merge, `keep` caps physics
// shards (the rest turn into glittering dust).
export const MATERIALS = {
  earthenware: { cell: 0.1, chunk: 3, minChunk: 1, density: 80, shardDensity: 900, dust: 1, chips: 1, glitter: 0, keep: Infinity, sound: 'clay', fracture: PALETTE.fracture },
  stoneware: { cell: 0.19, chunk: 4, minChunk: 2, density: 150, shardDensity: 1500, dust: 2.2, chips: 1.6, glitter: 0, keep: Infinity, sound: 'stone', fracture: 0xcf906c },
  porcelain: { cell: 0.06, chunk: 1, minChunk: 1, density: 60, shardDensity: 700, dust: 0.25, chips: 0.3, glitter: 1, keep: 6, sound: 'glass', fracture: PALETTE.cream },
};

// [radius, height] from base edge up to rim, metres at scale 1.
// Optional: lobes {n, amp, from, to}, twist (rad over height),
// flame {n, amp, flare, start}, pattern [...], mat, hp.
export const PROFILES = {
  jar: { pts: [[0.1, 0], [0.15, 0.04], [0.18, 0.14], [0.17, 0.25], [0.12, 0.32], [0.11, 0.36], [0.13, 0.38]], segs: 9, th: 0.016, pattern: [{ type: 'band', from: 0.55, to: 0.62, k: 0.72 }] },
  amphora: { pts: [[0.06, 0], [0.1, 0.05], [0.17, 0.18], [0.19, 0.32], [0.15, 0.46], [0.08, 0.54], [0.07, 0.62], [0.1, 0.66]], segs: 9, th: 0.016, pattern: [{ type: 'zigzag', from: 0.38, to: 0.52, n: 9, k: 0.7 }] },
  bowl: { pts: [[0.07, 0], [0.14, 0.03], [0.19, 0.08], [0.21, 0.13]], segs: 10, th: 0.014 },
  vase: { pts: [[0.07, 0], [0.11, 0.06], [0.12, 0.16], [0.08, 0.28], [0.06, 0.36], [0.09, 0.44]], segs: 8, th: 0.013, mat: 'porcelain' },
  cup: { pts: [[0.05, 0], [0.07, 0.03], [0.08, 0.1], [0.085, 0.14]], segs: 8, th: 0.011, mat: 'porcelain' },
  urn: { pts: [[0.18, 0], [0.26, 0.08], [0.34, 0.3], [0.35, 0.55], [0.28, 0.8], [0.2, 0.92], [0.19, 1.0], [0.24, 1.04]], segs: 11, th: 0.03, mat: 'stoneware', hp: 180, pattern: [{ type: 'band', from: 0.7, to: 0.76, k: 0.7 }] },
  pitcher: { pts: [[0.09, 0], [0.13, 0.05], [0.15, 0.16], [0.12, 0.28], [0.1, 0.34], [0.12, 0.4]], segs: 9, th: 0.014 },
  ember: { pts: [[0.12, 0], [0.2, 0.06], [0.25, 0.22], [0.24, 0.38], [0.16, 0.5], [0.12, 0.54], [0.14, 0.57]], segs: 10, th: 0.02 },
  plate: { pts: [[0.12, 0], [0.26, 0.02], [0.3, 0.05], [0.31, 0.07]], segs: 12, th: 0.02, pattern: [{ type: 'rings', n: 3, k: 0.75 }] },

  // --- the weird ones -------------------------------------------------------
  // Jōmon kaen-doki: flame rim with four big crests, cord-marked body
  jomon: {
    pts: [[0.16, 0], [0.2, 0.05], [0.22, 0.3], [0.2, 0.5], [0.24, 0.62], [0.34, 0.78], [0.38, 0.86], [0.36, 0.9]],
    segs: 24, th: 0.028, mat: 'stoneware', hp: 200,
    flame: { n: 4, amp: 0.3, flare: 0.3, start: 0.7 },
    pattern: [{ type: 'cord', from: 0.06, to: 0.58, n: 14, k: 0.72 }, { type: 'zigzag', from: 0.6, to: 0.72, n: 12, k: 0.62 }],
  },
  // hyōtan gourd: lobed lower bulb, pinched waist, long neck
  gourd: {
    pts: [[0.12, 0], [0.24, 0.06], [0.32, 0.22], [0.3, 0.4], [0.18, 0.52], [0.14, 0.58], [0.2, 0.7], [0.21, 0.8], [0.14, 0.92], [0.06, 1.0], [0.05, 1.1], [0.07, 1.14]],
    segs: 18, th: 0.024, mat: 'stoneware', hp: 180,
    lobes: { n: 6, amp: 0.07, from: 0, to: 0.5 },
    pattern: [{ type: 'band', from: 0.5, to: 0.55, k: 0.65 }, { type: 'band', from: 0.86, to: 0.9, k: 0.65 }],
  },
  // big storage jar
  tsubo: {
    pts: [[0.22, 0], [0.34, 0.1], [0.52, 0.45], [0.56, 0.75], [0.48, 1.05], [0.3, 1.3], [0.2, 1.38], [0.2, 1.45], [0.25, 1.5]],
    segs: 16, th: 0.035, mat: 'stoneware', hp: 260,
    pattern: [{ type: 'band', from: 0.62, to: 0.66, k: 0.68 }, { type: 'wave', from: 0.68, to: 0.8, n: 7, k: 0.72 }, { type: 'band', from: 0.82, to: 0.85, k: 0.68 }],
  },
  // squat melon jar, deeply lobed
  melon: {
    pts: [[0.1, 0], [0.22, 0.05], [0.3, 0.16], [0.29, 0.3], [0.18, 0.4], [0.13, 0.43], [0.15, 0.46]],
    segs: 32, th: 0.018, lobes: { n: 8, amp: 0.11, from: 0.02, to: 0.92 },
  },
  // twisted onion dome
  onion: {
    pts: [[0.08, 0], [0.16, 0.04], [0.26, 0.18], [0.24, 0.3], [0.12, 0.46], [0.05, 0.6], [0.04, 0.7], [0.07, 0.74]],
    segs: 12, th: 0.016, twist: 1.3, lobes: { n: 6, amp: 0.08, from: 0.05, to: 0.8 },
    pattern: [{ type: 'band', from: 0.28, to: 0.33, k: 0.7 }],
  },
  // three stacked bulbs, a clay totem
  stack: {
    pts: [[0.12, 0], [0.2, 0.06], [0.22, 0.16], [0.12, 0.26], [0.1, 0.28], [0.17, 0.36], [0.18, 0.44], [0.1, 0.52], [0.08, 0.54], [0.13, 0.6], [0.13, 0.66], [0.07, 0.72], [0.06, 0.78], [0.09, 0.8]],
    segs: 10, th: 0.016,
    pattern: [{ type: 'band', from: 0.1, to: 0.2, k: 0.75 }, { type: 'band', from: 0.44, to: 0.52, k: 0.75 }, { type: 'band', from: 0.74, to: 0.8, k: 0.75 }],
  },
  // porcelain bottle with a needle neck
  bottle: { pts: [[0.05, 0], [0.09, 0.03], [0.11, 0.1], [0.09, 0.17], [0.03, 0.22], [0.025, 0.32], [0.04, 0.34]], segs: 10, th: 0.009, mat: 'porcelain' },
  // hexagonal vase with a quarter twist
  twist: { pts: [[0.05, 0], [0.08, 0.05], [0.1, 0.18], [0.07, 0.32], [0.05, 0.42], [0.08, 0.5]], segs: 6, th: 0.01, twist: 1.6, mat: 'porcelain' },
  // little porcelain crown bowl with a spiky rim
  crown: { pts: [[0.05, 0], [0.1, 0.03], [0.14, 0.08], [0.15, 0.12]], segs: 16, th: 0.008, mat: 'porcelain', flame: { n: 8, amp: 0.45, flare: 0.15, start: 0.55 } },
  // spindle / top-heavy amphora
  spindle: {
    pts: [[0.05, 0], [0.07, 0.05], [0.16, 0.35], [0.17, 0.45], [0.08, 0.75], [0.04, 0.85], [0.06, 0.88]],
    segs: 10, th: 0.014, pattern: [{ type: 'zigzag', from: 0.3, to: 0.5, n: 10, k: 0.68 }],
  },
  // hanging lantern jar (gets a glowing core)
  lantern: { pts: [[0.06, 0], [0.13, 0.04], [0.16, 0.14], [0.15, 0.24], [0.09, 0.3], [0.08, 0.34]], segs: 10, th: 0.012, pattern: [{ type: 'dots', from: 0.3, to: 0.7, n: 8, k: 0.55 }] },
  // clapperjar body proxy (for its shatter)
  clapper: { pts: [[0.12, 0], [0.2, 0.08], [0.24, 0.22], [0.22, 0.4], [0.17, 0.5], [0.18, 0.58]], segs: 10, th: 0.018 },
};

const DEFAULT_MAT = (kind) => PROFILES[kind].mat || 'earthenware';

// ---- profile evaluation ---------------------------------------------------

export function prepProfile(kind, scale, overrides = {}) {
  const def = PROFILES[kind];
  const pts = def.pts.map(([r, h]) => new THREE.Vector2(r * scale, h * scale));
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const rMax = Math.max(...pts.map((p) => p.x));
  const height = pts[pts.length - 1].y;
  const mat = overrides.mat || DEFAULT_MAT(kind);
  const flameH = def.flame ? def.flame.amp * height : 0;
  return {
    kind, def, pts, cum, len: cum[cum.length - 1], rMax: rMax * (1 + (def.lobes?.amp || 0) + (def.flame?.flare || 0)),
    height, fullHeight: height + flameH, th: def.th * Math.sqrt(scale), segs: def.segs, mat, M: MATERIALS[mat],
    lobes: def.lobes, twist: def.twist || 0, flame: def.flame, pattern: def.pattern || [],
  };
}

function evalProfile(P, u) {
  const { pts, cum } = P;
  u = THREE.MathUtils.clamp(u, 0, P.len);
  let i = 1;
  while (i < pts.length - 1 && cum[i] < u) i++;
  const a = pts[i - 1], b = pts[i];
  const t = (u - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
  const p = new THREE.Vector2().lerpVectors(a, b, t);
  const tan = new THREE.Vector2().subVectors(b, a).normalize();
  const n = new THREE.Vector2(tan.y, -tan.x);
  if (n.x < 0) n.negate();
  return { p, n };
}

const win = (f, a, b) => THREE.MathUtils.smoothstep(f, a, a + 0.08) * (1 - THREE.MathUtils.smoothstep(f, b - 0.08, b));

/** Surface point at arc-length u and angle ang (inner = inside wall). */
export function potPoint(P, u, ang, inner, out = new THREE.Vector3()) {
  const pr = evalProfile(P, u);
  const th = P.th;
  let r = Math.max(0.004, pr.p.x - (inner ? pr.n.x * th : 0));
  let h = pr.p.y - (inner ? pr.n.y * th : 0) + (inner && pr.p.y < 1e-4 ? th : 0);
  h = Math.max(inner ? th : 0, h);
  const f = THREE.MathUtils.clamp(pr.p.y / P.height, 0, 1);
  const a = ang + P.twist * f;
  if (P.lobes) r *= 1 + P.lobes.amp * Math.cos(P.lobes.n * a) * win(f, P.lobes.from, P.lobes.to);
  if (P.flame && f > P.flame.start) {
    const t = (f - P.flame.start) / (1 - P.flame.start);
    const spike = Math.pow(Math.max(0, Math.cos(P.flame.n * a * 0.5) ** 2 * 2 - 1), 2); // sharp crests
    const crest = t * t * spike;
    h += P.flame.amp * P.height * crest;
    r *= 1 + P.flame.flare * crest;
  }
  return out.set(Math.cos(a) * r, h, Math.sin(a) * r);
}

/** Pattern brightness multiplier at a point on the outer surface. */
export function patternAt(P, p) {
  const f = THREE.MathUtils.clamp(p.y / P.height, 0, 1.2);
  const ang = Math.atan2(p.z, p.x);
  let k = 1;
  for (const pt of P.pattern) {
    const from = pt.from ?? 0, to = pt.to ?? 1;
    if (pt.type === 'rings') { // concentric (plates)
      const r = Math.hypot(p.x, p.z) / P.rMax;
      if (Math.floor(r * pt.n * 2) % 2 === 1) k *= pt.k;
      continue;
    }
    if (f < from || f > to) continue;
    const t = (f - from) / (to - from);
    const tri = (x) => Math.abs(((x % 1) + 1) % 1 - 0.5) * 2; // 0..1 triangle wave
    switch (pt.type) {
      case 'band': k *= pt.k; break;
      case 'zigzag': if (Math.abs(t - 0.5) < 0.18 + 0.32 * (tri(ang / (Math.PI * 2) * pt.n) - 0.5)) k *= pt.k; break;
      case 'wave': if (Math.abs(t - 0.5 - 0.3 * Math.sin(ang * pt.n)) < 0.18) k *= pt.k; break;
      case 'cord': if (((t * pt.n + ang / (Math.PI * 2) * pt.n * 1.5) % 1 + 1) % 1 < 0.45) k *= pt.k; break;
      case 'dots': {
        const u = ((ang / (Math.PI * 2)) * pt.n % 1 + 1) % 1;
        if ((u - 0.5) ** 2 * 4 + (t - 0.5) ** 2 * 5 < 0.35) k *= pt.k;
        break;
      }
      default: break;
    }
  }
  return k;
}

// ---- intact mesh + collider ----------------------------------------------

function ringUs(P, spacing) {
  const n = Math.max(2, Math.round(P.len / spacing));
  const us = [];
  for (let i = 0; i <= n; i++) us.push((P.len * i) / n);
  return us;
}

/** Non-indexed, per-face coloured geometry (flat lowpoly look, crisp patterns). */
export function buildPotGeometry(P, baseColor) {
  const S = P.segs;
  const spacing = Math.min((2 * Math.PI * P.rMax) / S * 0.85, P.pattern.length ? 0.035 + P.height * 0.03 : 1);
  const us = ringUs(P, spacing);
  const R = us.length;
  const outer = [], inner = [];
  for (const u of us) {
    for (let j = 0; j < S; j++) {
      const ang = (j / S) * Math.PI * 2;
      outer.push(potPoint(P, u, ang, false));
      inner.push(potPoint(P, u, ang, true));
    }
  }
  const pos = [], col = [];
  const base = new THREE.Color(baseColor);
  const innerCol = base.clone().multiplyScalar(0.62);
  const c = new THREE.Color();
  const cen = new THREE.Vector3();
  const tri = (a, b, d, isInner) => {
    pos.push(a.x, a.y, a.z, b.x, b.y, b.z, d.x, d.y, d.z);
    if (isInner) c.copy(innerCol);
    else { cen.copy(a).add(b).add(d).divideScalar(3); c.copy(base).multiplyScalar(patternAt(P, cen)); }
    for (let k = 0; k < 3; k++) col.push(c.r, c.g, c.b);
  };
  const V = (arr, i, j) => arr[i * S + ((j + S) % S)];
  for (let i = 0; i < R - 1; i++) {
    for (let j = 0; j < S; j++) {
      const a = V(outer, i, j), b = V(outer, i, j + 1), cc = V(outer, i + 1, j + 1), d = V(outer, i + 1, j);
      tri(a, d, cc, false); tri(a, cc, b, false);
      const ia = V(inner, i, j), ib = V(inner, i, j + 1), ic = V(inner, i + 1, j + 1), id = V(inner, i + 1, j);
      tri(ia, ic, id, true); tri(ia, ib, ic, true);
    }
  }
  for (let j = 0; j < S; j++) { // rim
    const a = V(outer, R - 1, j), b = V(outer, R - 1, j + 1), ia = V(inner, R - 1, j), ib = V(inner, R - 1, j + 1);
    tri(a, b, ib, false); tri(a, ib, ia, false);
  }
  const bc = new THREE.Vector3(0, 0, 0), ic = new THREE.Vector3(0, P.th, 0);
  for (let j = 0; j < S; j++) { // base caps
    tri(bc, V(outer, 0, j), V(outer, 0, j + 1), false);
    tri(ic, V(inner, 0, j + 1), V(inner, 0, j), true);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

export function hullPoints(P) {
  const pts = [];
  const S = Math.max(P.segs, P.flame ? P.flame.n * 4 : 0);
  for (const [i, u] of ringUs(P, P.len / 8).entries()) {
    for (let j = 0; j < S; j++) {
      const v = potPoint(P, u, (j / S) * Math.PI * 2 + (i % 2) * 0.01, false);
      pts.push(v.x, v.y, v.z);
    }
  }
  pts.push(0, 0, 0);
  return new Float32Array(pts);
}

// ---- fracture --------------------------------------------------------------

export const keyOf = (x, y, z) => `${Math.round(x * 2000)},${Math.round(y * 2000)},${Math.round(z * 2000)}`;

/**
 * Splits a pot into convex pieces. The surface is sampled on a jittered
 * (ring x segment) grid whose cell size comes from the clay's material and the
 * pot's size, cells are cut along random diagonals, and neighbouring triangles
 * merge into shards. Each shard = hull(outer points + matching inner points).
 * Returns [{ points, innerKeys, colors: Map(key->k), small }].
 */
export function fracturePieces(P, hitLocal, extraChunk = 0) {
  const M = P.M;
  const size = Math.max(P.height, P.rMax * 2);
  const cell = M.cell * THREE.MathUtils.clamp(Math.sqrt(size / 0.5), 0.8, 1.7);
  const S = THREE.MathUtils.clamp(Math.round((2 * Math.PI * P.rMax) / cell), 5, 30);
  const Rn = THREE.MathUtils.clamp(Math.round(P.len / cell), 2, 24);
  const us = [];
  for (let i = 0; i <= Rn; i++) us.push((P.len * i) / Rn);
  const R = us.length;
  const du = P.len / Rn;
  const dA = (Math.PI * 2) / S;
  const outer = [], inner = [];
  const ringOffset = Math.random() * dA;
  for (let i = 0; i < R; i++) {
    for (let j = 0; j < S; j++) {
      const edge = i === 0 || i === R - 1;
      const u = us[i] + (edge ? 0 : (Math.random() - 0.5) * 0.6 * du);
      const ang = ringOffset + j * dA + (i === 0 ? 0 : (Math.random() - 0.5) * 0.5 * dA);
      outer.push(potPoint(P, u, ang, false));
      inner.push(potPoint(P, u, ang, true));
    }
  }
  const V = (i, j) => i * S + ((j + S) % S);
  const tris = [];
  for (let i = 0; i < R - 1; i++) {
    for (let j = 0; j < S; j++) {
      const a = V(i, j), b = V(i, j + 1), c = V(i + 1, j + 1), d = V(i + 1, j);
      if (Math.random() < 0.5) tris.push({ v: [a, b, c], col: j }, { v: [a, c, d], col: j });
      else tris.push({ v: [a, b, d], col: j }, { v: [b, c, d], col: j });
    }
  }
  const edgeMap = new Map();
  const ek = (x, y) => (x < y ? `${x}_${y}` : `${y}_${x}`);
  tris.forEach((t, ti) => {
    for (let e = 0; e < 3; e++) {
      const k = ek(t.v[e], t.v[(e + 1) % 3]);
      if (!edgeMap.has(k)) edgeMap.set(k, []);
      edgeMap.get(k).push(ti);
    }
  });
  const neighbours = (ti) => {
    const t = tris[ti], out = [];
    for (let e = 0; e < 3; e++) for (const o of edgeMap.get(ek(t.v[e], t.v[(e + 1) % 3]))) if (o !== ti) out.push(o);
    return out;
  };
  const allowWrap = S >= 12 ? 1 : 0;
  const colDist = (a, b) => { const d = Math.abs(a - b) % S; return Math.min(d, S - d); };

  const maxChunk = M.chunk + extraChunk;
  const assigned = new Int32Array(tris.length).fill(-1);
  const order = [...tris.keys()].sort(() => Math.random() - 0.5);
  const groups = [];
  const nearR = Math.min(P.rMax * 0.9, 0.35);
  for (const seed of order) {
    if (assigned[seed] >= 0) continue;
    const t0 = tris[seed];
    const cen = outer[t0.v[0]].clone().add(outer[t0.v[1]]).add(outer[t0.v[2]]).divideScalar(3);
    const near = cen.distanceTo(hitLocal) < nearR;
    const lo = near ? 1 : M.minChunk;
    const target = lo + Math.floor(Math.random() * (maxChunk - lo + 1));
    const g = [seed];
    assigned[seed] = groups.length;
    for (let k = 0; k < g.length && g.length < target; k++) {
      for (const nb of neighbours(g[k])) {
        if (g.length >= target) break;
        if (assigned[nb] >= 0 || colDist(tris[nb].col, t0.col) > allowWrap) continue;
        assigned[nb] = groups.length;
        g.push(nb);
      }
    }
    groups.push(g);
  }

  const pieces = [];
  const pushPiece = (vs, extra = [], small = false) => {
    const points = [], innerKeys = [], colors = new Map();
    for (const p of extra) { points.push(p.pt); if (p.inner) innerKeys.push(keyOf(p.pt.x, p.pt.y, p.pt.z)); }
    for (const v of vs) {
      const o = outer[v], n = inner[v];
      points.push(o.clone(), n.clone());
      innerKeys.push(keyOf(n.x, n.y, n.z));
      colors.set(keyOf(o.x, o.y, o.z), patternAt(P, o));
    }
    pieces.push({ points, innerKeys, colors, small });
  };
  for (const g of groups) {
    const vs = new Set();
    for (const ti of g) for (const v of tris[ti].v) vs.add(v);
    pushPiece(vs, [], g.length === 1);
  }
  // base: 1-3 wedges (big stoneware bases crack in more pieces)
  const wedges = S >= 9 && Math.random() < 0.7 ? 2 + (Math.random() < (P.mat === 'stoneware' ? 0.7 : 0.3) ? 1 : 0) : 1;
  const per = Math.ceil(S / wedges);
  for (let w = 0; w < wedges; w++) {
    const end = wedges === 1 ? S : Math.min(S, (w + 1) * per);
    const vs = [];
    for (let j = w * per; j <= end; j++) vs.push(V(0, j));
    pushPiece(vs, [{ pt: new THREE.Vector3(0, 0, 0) }, { pt: new THREE.Vector3(0, P.th, 0), inner: true }]);
  }
  return pieces;
}
