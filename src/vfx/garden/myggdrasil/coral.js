// ---------------------------------------------------------------------------------------
// MYGGDRASIL'S CORALS: the crown grown out of the trunk as a reef would, in the air. Its limbs (./roots.js) carry the side caps; round
// them and up the column:
//
//   STAGHORN     antler branches forking off the limbs and the column, blunt tips warming to coral pink, orange or violet, their polyps
//                a speckle of light by night (Acropora cervicornis)
//   TABLES       flat plates on stalks in two tiers between the caps, lobed at the rim, sage at the middle going to coral at the edge,
//                ribbed under (Acropora hyacinthus): the crown's layered silhouette from afar
//   SEA FANS     lattices of ribs and links standing on the tables (Gorgonia ventalina), violet or orange; far off a solid fan, so a
//                rib thinner than a pixel never crawls
//   BRAIN CORAL  domes grooved in a meander (Diploria), sage or the Ohmu's blue-grey, the grooves amber and glowing by night
//   TUBE SPONGES clusters of open tubes (Aplysina, the azure vase), violet outside, their throats glowing teal: they breathe the spores
//                (`emit`: where ./spores.js lets them rise from)
//   AERIAL ROOTS a root let down from each table to the ground, bowed out and swaying as it fell (the strangler fig's curtain)
//
// Prior art: the reefs themselves (staghorn and table Acropora, Gorgonia, Diploria, Aplysina and Callyspongia), Nausicaa's Sea of
// Corruption (coral and fungus as one forest, the Ohmu's shell), the strangler fig's aerial roots, and L-systems' branching (Lindenmayer
// 1968) kept to a few forks.
//
//   const C = buildCorals(K, F, lod, S, limbs)   (S(k): part k's own stream of chance)   C.emit [{ p, kind: 'sponge' }]   C.tables [{ c, R, az, y }]   C.under [{ p }] (spots
//   under the tables and limbs for the hanging fungi)   C.ground [{ az, s }] (sponge clusters on the ground)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { CAP_SITES, trunkR, D2R, noise3, smooth01 } from './layout.js';
import { tube, sheet, strut, addGeo, ink, mixLin } from './kit.js';
import { PAL } from './palette.js';

/** The two tiers of tables: bearing, height (m), distance out (m), radius (m), what stands on each. */
const TABLES = [
  { az: 30, y: 24, rho: 10.6, R: 4.6, on: 'fan' }, { az: 150, y: 25.4, rho: 10.4, R: 4.2, on: 'brain' }, { az: 270, y: 24.4, rho: 10.2, R: 4.4, on: 'fan' },
  { az: 90, y: 34, rho: 9.6, R: 5, on: 'sponge' }, { az: 210, y: 33.6, rho: 9.6, R: 4.6, on: 'fan' }, { az: 330, y: 33.2, rho: 9.4, R: 4.4, on: 'brain' },
];
/** Staghorn clumps on the column: bearing, height. */
const COLUMN_CLUMPS = [[95, 20.6, 0.5], [215, 20.4, 0.5], [335, 20.8, 0.5], [15, 33.6, 0.6], [125, 33.2, 0.6], [235, 33.9, 0.6]];
const TIPS = [PAL.coral, PAL.orange, PAL.peach, PAL.violet, PAL.coral, PAL.magenta];
const _c = [0, 0, 0], _e = [0, 0, 0], _up = new THREE.Vector3(0, 1, 0), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3();

/** A coral's painter: bone at its foot warming to `tip` toward its ends (u, or the clump's own reach `k`), polyps over it. */
const coralPaint = (tip, k0 = 0, k1 = 1) => (u, v, p, n) => {
  const k = THREE.MathUtils.lerp(k0, k1, u), w = smooth01(0.25, 1, k);
  mixLin(_c, PAL.bone, tip, w * w); ink(_c, (0.86 + 0.14 * Math.max(0, n.y)) * (0.93 + 0.07 * noise3(p.x * 2, p.y * 2, p.z * 2)), PAL.gTeal, 0.1 * Math.pow(k, 6), 0, 0.85, 0.15, 0.72);
};

/** A staghorn branch from p along dir: three bends, rounded tip, forking `depth` times more (two ways, now and then three). */
function staghorn(K, p, dir, len, r, depth, rnd, Q, tip, k0 = 0) {
  const pts = [p.clone()], d = dir.clone().normalize(), q = p.clone();
  for (let s = 1; s <= 3; s++) { d.x += (rnd() - 0.5) * 0.35; d.z += (rnd() - 0.5) * 0.35; d.y += 0.14; d.normalize(); q.addScaledVector(d, len / 3); pts.push(q.clone()); }
  const k1 = k0 + (1 - k0) * (depth ? 0.45 : 1);
  tube(K, pts, { r: (u) => r * (1 - 0.28 * u), radial: Q.radial(7), segs: Math.max(4, Math.round(len * 1.6 * Q.seg)), tip: 'round', lump: 0.06, seed: rnd() * 9, paint: coralPaint(tip, k0, k1) });
  if (!depth) return;
  const n = rnd() < 0.3 ? 3 : 2;
  for (let c = 0; c < n; c++) {
    _x.set(rnd() - 0.5, 0, rnd() - 0.5).cross(d).normalize(); if (_x.lengthSq() < 0.1) _x.set(1, 0, 0);
    const cd = d.clone().applyAxisAngle(_x, (22 + rnd() * 18) * D2R * (c % 2 ? 1 : -1)).add(new THREE.Vector3(0, 0.25, 0)).normalize();
    staghorn(K, q, cd, len * (0.66 + rnd() * 0.12), r * 0.72, depth - 1, rnd, Q, tip, k1);
  }
}

/** A table: a lobed plate on a stalk from the column, ribbed under, its rim lit through. */
function table(K, F, T, rnd, Q) {
  const c = F.at(T.az, T.rho, T.y), tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(Math.cos(T.az * D2R), 0, -Math.sin(T.az * D2R)), -5 * D2R);
  const M = new THREE.Matrix4().compose(c, tilt, new THREE.Vector3(1, 1, 1)), seed = T.az * 0.1, nu = Q.lod ? 5 : 9, nv = Q.lod ? 28 : 56;
  const Rt = (a) => T.R * (1 + 0.13 * Math.sin(5 * a + seed) + 0.06 * Math.sin(9 * a + seed * 2.1)), lip = T.az % 60 === 30 ? PAL.coral : PAL.orange;
  const top = (rho, a, R) => 0.1 * T.R * (rho / R) ** 2 + 0.12 * noise3(Math.sin(a) * rho * 0.8, Math.cos(a) * rho * 0.8, seed);
  const thick = (rho, R) => 0.12 + 0.55 * Math.pow(Math.max(0, 1 - rho / R), 0.7);
  const P = (rho, a, y, o) => o.set(Math.sin(a) * rho, y, Math.cos(a) * rho).applyMatrix4(M);
  const paintTop = (u, v, p) => { mixLin(_c, PAL.sage, PAL.bone, smooth01(0.1, 0.5, u)); mixLin(_c, _c, lip, smooth01(0.6, 1, u)); ink(_c, 0.95 + 0.05 * noise3(p.x * 3, p.y * 3, p.z * 3), PAL.gTeal, 0.12 * smooth01(0.85, 1, u), 0, 0.9, 0.2 + 0.5 * smooth01(0.7, 1, u), 0.7); };
  sheet(K, nu, nv, (i, j, o) => { const a = (j / nv) * Math.PI * 2, R = Rt(a), rho = THREE.MathUtils.lerp(0.5, R, i / (nu - 1)); return P(rho, a, top(rho, a, R), o); }, { wrap: true, paint: paintTop });
  sheet(K, nu, nv, (i, j, o) => { const a = (j / nv) * Math.PI * 2, R = Rt(a), rho = THREE.MathUtils.lerp(0.5, R, i / (nu - 1)); return P(rho, a, top(rho, a, R) - thick(rho, R), o); }, { wrap: true, flip: true, paint: (u, v) => {
    const rib = 0.82 + 0.18 * Math.cos(v * Math.PI * 2 * 12); mixLin(_c, PAL.boneShade, lip, smooth01(0.7, 1, u) * 0.6); ink(_c, rib * 0.85, PAL.gTeal, 0, 0, 0.3, 0.4, 0.8);
  } });
  sheet(K, 2, nv, (i, j, o) => { const a = (j / nv) * Math.PI * 2, R = Rt(a); return P(R, a, top(R, a, R) - (i ? thick(R, R) : 0), o); }, { wrap: true, paint: () => ink(lip, 0.9, PAL.gTeal, 0.14, 0, 0.6, 0.7, 0.7) });
  // its stalk, from the column out and up to its middle
  const s0 = F.at(T.az - 8, trunkR(T.y - 3.5) - 0.2, T.y - 3.6), s1 = F.at(T.az - 3, T.rho * 0.55, T.y - 2.2), s2 = c.clone().addScaledVector(_up, -0.4);
  tube(K, [s0, s1, s2], { r: (u) => 0.62 - 0.12 * u, radial: Q.radial(9), segs: Math.max(5, Math.round(12 * Q.seg)), tip: 'round', paint: coralPaint(PAL.bone, 0, 0.3), seed: seed });
  return { c, M, R: T.R, top: (rho, a) => P(rho, a, top(rho, a, Rt(a)), new THREE.Vector3()) };
}

/** A sea fan standing at base, its face along `out` (its normal), `h` tall: ribs fanning up and links between them; far off one sheet. */
function seaFan(K, base, out, h, rnd, Q, col) {
  _z.copy(out).setY(0).normalize(); _x.crossVectors(_up, _z).normalize();
  const w = h * 0.95, rays = Q.lod ? 0 : 9, nodes = 6, at = (a, rho, o = new THREE.Vector3()) => {
    const x = Math.sin(a) * rho * (w / h), y = Math.cos(a) * rho, bend = 0.14 * w * (x / w) ** 2 * 4 - 0.1 * y;
    return o.copy(base).addScaledVector(_x, x).addScaledVector(_up, y).addScaledVector(_z, bend);
  };
  const paint = (u, v, p, n) => { mixLin(_c, col, PAL.magenta, 0.3 * (1 - u)); ink(_c, 0.9, PAL.gPink, 0.04, 0, 0.6, 0.6, 0.8); };
  if (!rays) {
    // far: the fan as one sheet both ways
    const nu = 5, nv = 9, pos = (i, j, o) => at((j / (nv - 1) - 0.5) * 2 * 60 * D2R, h * (0.12 + 0.88 * i / (nu - 1)) * (0.8 + 0.2 * Math.cos((j / (nv - 1) - 0.5) * 2.4)), o);
    sheet(K, nu, nv, pos, { paint }); sheet(K, nu, nv, pos, { paint, flip: true });
    return;
  }
  const len = [], R = [];
  for (let r = 0; r < rays; r++) { const a = (r / (rays - 1) - 0.5) * 2 * 58 * D2R; R.push(a); len.push(h * (0.78 + 0.22 * Math.cos(a * 1.3)) * (0.9 + rnd() * 0.18)); }
  const node = (r, k) => at(R[r] + 0.06 * Math.sin(k * 2.1 + r), len[r] * (0.14 + 0.86 * k / nodes));
  for (let r = 0; r < rays; r++) for (let k = 0; k < nodes; k++) strut(K, node(r, k), node(r, k + 1), 0.24 - 0.012 * k, 0.22 - 0.012 * k, _z, paint);
  for (let r = 0; r < rays - 1; r++) for (let k = 1; k <= nodes; k++) if (rnd() < 0.78) strut(K, node(r, k), node(r + 1, k), 0.15, 0.15, _z, paint);
  for (let r = 0; r < rays; r += 2) strut(K, base, node(r, 0), 0.34, 0.24, _z, paint);
}

/** A brain coral: a dome grooved in a meander, its grooves glowing amber by night. */
function brainCoral(K, c, R, rnd, Q, ohmu) {
  const g = new THREE.IcosahedronGeometry(1, Q.lod ? 2 : 4); g.deleteAttribute('uv'); g.deleteAttribute('normal');
  const geo = mergeLike(g), P = geo.attributes.position, seed = rnd() * 50, grooveOf = new Float32Array(P.count);
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i), n1 = noise3(x * 1.5 + seed, y * 1.5, z * 1.5), n2 = noise3(x * 3.2, y * 3.2 + seed, z * 3.2);
    const m = Math.abs(Math.sin(8.5 * (n1 + 0.45 * n2))), gr = 1 - smooth01(0.12, 0.55, m); grooveOf[i] = gr;
    const s = 1 - 0.07 * gr; P.setXYZ(i, x * s, y * s, z * s);
  }
  geo.computeVertexNormals();
  const M = new THREE.Matrix4().compose(c, new THREE.Quaternion(), new THREE.Vector3(R, R * 0.74, R)); let k = 0;
  addGeo(K, geo, M, (u, v, p, n) => {
    const gr = grooveOf[k++]; mixLin(_c, ohmu ? PAL.ohmu : PAL.sage, ohmu ? PAL.ohmuDeep : PAL.ochre, gr * 0.85);
    ink(_c, 0.9 + 0.1 * Math.max(0, n.y), PAL.gAmber, 0.22 * gr * gr, 0, 0, 0.1, 0.6 + 0.2 * gr);
  });
  geo.dispose();
}
/** A sphere's vertices welded (three's icosphere repeats each corner per face). */
function mergeLike(g) {
  const P = g.attributes.position, map = new Map(), pos = [], idx = [];
  for (let i = 0; i < P.count; i++) { const k = `${P.getX(i).toFixed(4)},${P.getY(i).toFixed(4)},${P.getZ(i).toFixed(4)}`; let j = map.get(k); if (j === undefined) { j = pos.length / 3; map.set(k, j); pos.push(P.getX(i), P.getY(i), P.getZ(i)); } idx.push(j); }
  g.dispose(); const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.setIndex(idx); return out;
}

/** A cluster of tube sponges round p on up `n`: each an open tube, violet, its throat glowing teal; the mouths returned. */
export function spongeCluster(K, p, n, count, scale, rnd, Q, emit) {
  _y.copy(n).normalize(); _x.set(1, 0, 0).cross(_y); if (_x.lengthSq() < 0.01) _x.set(0, 0, 1).cross(_y); _x.normalize(); _z.crossVectors(_x, _y);
  const basis = new THREE.Matrix4().makeBasis(_x.clone(), _y.clone(), _z.clone()), nv = Q.lod ? 8 : 14;
  for (let t = 0; t < count; t++) {
    const a = (t / count) * Math.PI * 2 + rnd(), off = t ? 0.5 + rnd() * 0.9 * scale : 0, h = (1.6 + rnd() * 2.6) * scale * (t ? 0.85 : 1.2), r = (0.36 + rnd() * 0.36) * scale;
    const lean = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(Math.cos(a), 0, -Math.sin(a)), (6 + rnd() * 14) * D2R * (t ? 1 : 0.3));
    const M = new THREE.Matrix4().compose(new THREE.Vector3(Math.sin(a) * off, -0.2, Math.cos(a) * off), lean, new THREE.Vector3(1, 1, 1)).premultiply(basis).premultiply(new THREE.Matrix4().makeTranslation(p.x, p.y, p.z));
    const prof = [[r * 0.8, -0.4], [r, 0.25 * h], [r * 1.06, 0.7 * h], [r * 1.2, h], [r * 0.98, h * 1.01], [r * 0.82, 0.72 * h], [r * 0.66, 0.3 * h], [0.02, 0.18 * h]];
    sheet(K, prof.length, nv, (i, j, o) => { const ph = (j / nv) * Math.PI * 2; return o.set(Math.sin(ph) * prof[i][0], prof[i][1], Math.cos(ph) * prof[i][0]).applyMatrix4(M); }, { wrap: true, flip: true, paint: (u) => {
      const inside = u > 0.55, lipK = Math.exp(-(((u - 0.5) / 0.1) ** 2));
      if (inside) { mixLin(_c, PAL.violetDeep, PAL.tealDeep, smooth01(0.6, 1, u)); ink(_c, 0.8, PAL.gTeal, 0.32 + 0.3 * smooth01(0.6, 1, u), 0.3, 0, 0.2, 0.6); }
      else { mixLin(_c, PAL.violet, PAL.magenta, smooth01(0.1, 0.5, u)); mixLin(_c, _c, PAL.coral, lipK * 0.5); ink(_c, 0.9, PAL.gTeal, 0.25 * lipK, 0.3, 0.3, 0.55 * lipK, 0.7); }
    } });
    emit?.push({ p: new THREE.Vector3(0, h * 0.9, 0).applyMatrix4(M), up: _y.clone(), kind: 'sponge', r });
  }
}

/** Is a hanging thing at (x, z) from yTop down to yBot clear of every cap (its radius and a margin)? */
function clearOfCaps(F, x, z, yTop, yBot) {
  return CAP_SITES.every((C) => { const c = F.at(C.az, C.out, C.y), top = c.y + C.r * 0.6, bot = c.y - C.r * 0.3; return top < yBot || bot > yTop || Math.hypot(x - c.x, z - c.z) > C.r + 0.8; });
}

/** A root let down from a to the ground at (az, s), bowed out and swaying as it fell, sunk where it took hold. */
function hangingRoot(K, F, a, ground, rnd, Q) {
  const end = F.ground(ground.az, ground.s, -0.4), pts = [a.clone()];
  const out = new THREE.Vector3(a.x, 0, a.z).normalize(), side = new THREE.Vector3(-out.z, 0, out.x), bow = 1.6 + rnd() * 1.4, sway = (rnd() - 0.5) * 2.4;
  for (let k = 1; k < 6; k++) { const t = k / 6; pts.push(a.clone().lerp(end, t).addScaledVector(out, bow * Math.sin(Math.PI * t)).addScaledVector(side, sway * Math.sin(2 * Math.PI * t))); }
  pts.push(end);
  tube(K, pts, { r: (u) => THREE.MathUtils.lerp(0.34, 0.24, u), radial: Q.radial(6), segs: Math.max(4, Math.round(a.distanceTo(end) * 0.9 * Q.seg)), lump: 0.08, seed: rnd() * 9, paint: (u, v, p, n) => {
    const clear = p.length() - F.groundR(p); mixLin(_c, PAL.rootLight, PAL.root, u); mixLin(_c, _c, PAL.sunk, 1 - smooth01(-0.1, 1, clear)); ink(_c, 0.9 + 0.1 * Math.max(0, n.x), null, 0, 0, 0, 0.1, 0.9);
  } });
}

export function buildCorals(K, F, lod, S, limbs) {
  const Q = { lod, seg: lod ? 0.45 : 1, radial: (n) => Math.max(4, Math.round(n * (lod ? 0.6 : 1))) }, emit = [], under = [], tables = [];
  // staghorn off each cap's limb, twice
  for (const L of limbs) if (L.cap && !L.reversed) for (const f of [0.3, 0.55]) {
    const rnd = S(500 + L.strand * 2 + (f > 0.5 ? 1 : 0)), u = L.from + (1 - L.from) * f, p = L.curve.getPointAt(u), out = new THREE.Vector3(p.x, 0, p.z).normalize(), side = L.curve.getTangentAt(u).cross(_up).normalize();
    const dir = out.multiplyScalar(0.55).addScaledVector(_up, 0.45).addScaledVector(side, (f > 0.5 ? 1 : -1) * (0.7 + rnd() * 0.4));
    staghorn(K, p, dir, 3.6 + rnd() * 1.8, 0.62, lod ? 1 : 2, rnd, Q, TIPS[(L.strand + (f > 0.5 ? 1 : 0)) % TIPS.length]);
    under.push({ p: L.curve.getPointAt(L.from + (1 - L.from) * 0.55).addScaledVector(_up, -0.9), limb: true });
  }
  // clumps off the column
  COLUMN_CLUMPS.forEach(([az, y, up], k) => {
    const rnd = S(600 + k), p = F.at(az, trunkR(y) + 0.3, y), dir = new THREE.Vector3(Math.sin(az * D2R), up, Math.cos(az * D2R));
    staghorn(K, p, dir, 3 + rnd() * 1.6, 0.56, lod ? 1 : 2, rnd, Q, TIPS[k % TIPS.length]);
  });
  // the tables, and what stands on them
  TABLES.forEach((T, ti) => {
    const t = table(K, F, T, S(700 + ti * 10), Q), rnd = S(701 + ti * 10); tables.push({ ...T, c: t.c });
    const outA = T.az * D2R + (rnd() - 0.5) * 0.6, stand = t.top(T.R * 0.55, outA), out = new THREE.Vector3(Math.sin(T.az * D2R), 0, Math.cos(T.az * D2R));
    const fanH = 4.4 + rnd() * 1.4, brainR = 1.9 + rnd() * 0.5;
    if (T.on === 'fan') seaFan(K, stand.addScaledVector(_up, -0.15), out, fanH, S(702 + ti * 10), Q, T.az % 60 === 30 ? PAL.violet : PAL.orange);
    else if (T.on === 'brain') brainCoral(K, t.top(T.R * 0.2, 1.2).addScaledVector(_up, -0.2), brainR, S(703 + ti * 10), Q, T.az === 330);
    else spongeCluster(K, t.top(T.R * 0.3, 0.5), _up, lod ? 3 : 5, 1, S(704 + ti * 10), Q, emit);
    // its hanging root: one down to the ground, bowed, on the side clear of the caps below
    const sides = [18, -18].map((d) => { const at = t.top(T.R * 0.82, (T.az + d) * D2R).addScaledVector(_up, -0.7); return { at, ok: clearOfCaps(F, at.x, at.z, at.y, F.y0 - 2) }; });
    const G = sides.find((x) => x.ok); if (G) { const hx = Math.hypot(G.at.x, G.at.z), az = Math.atan2(G.at.x, G.at.z) / D2R; hangingRoot(K, F, G.at, { az, s: hx * 1.02 }, S(705 + ti * 10), Q); }
    under.push({ p: t.top(T.R * 0.4, (T.az + 160) * D2R).addScaledVector(_up, -1.1) });
  });
  // two brain corals where limbs leave the trunk
  brainCoral(K, F.at(75, trunkR(21.5) + 0.8, 21.6), 1.7, S(780), Q, true);
  brainCoral(K, F.at(255, trunkR(21.8) + 0.8, 21.9), 1.5, S(781), Q, false);
  // tube sponges on the ground among the roots
  const groundSpots = [{ az: 162, s: 11.6 }, { az: 18, s: 12.2 }, { az: 234, s: 12.6 }];
  groundSpots.forEach((G, k) => spongeCluster(K, F.ground(G.az, G.s, 0), F.up(G.az, G.s), lod ? 3 : 6, 1.35, S(790 + k), Q, emit));
  return { emit, under, tables, ground: groundSpots };
}
