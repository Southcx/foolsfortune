// ---------------------------------------------------------------------------------------
// MYGGDRASIL'S FUNGI: what grows on the tree besides its ten caps. All painted vertices in the tree's one geometry.
//
//   SHELF FUNGI   brackets stacked on the trunk's strands and the limbs, banded in zones (rust, ochre, cream, the Ohmu's blue-grey: a
//                 turkey tail), or the chicken of the woods' orange; their pores cream, faintly amber by night
//   LION'S MANE   white cascades of spines hung under the tables and limbs, peach at the tips, a pale glow by night (Hericium)
//   MORELS        honeycombed cones in clusters among the roots, honey ridges over dark pits (Morchella), giant
//   THE HOLLOW'S  small caps on the hollow's inner wall and floor, glowing teal and violet in its dark (Mycena)
//
// Prior art: Trametes versicolor's zones and Laetiporus's orange shelves, Hericium erinaceus, Morchella esculenta, the glowing Mycena of
// a forest at night, and Nausicaa's Fukai, where every surface is grown on.
//
//   buildFungi(K, F, lod, S, { limbs, under, hollow })   (S(k): part k's own stream of chance)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { MOUTH, D2R, noise3, smooth01 } from './layout.js';
import { sheet, addGeo, ink, mixLin } from './kit.js';
import { PAL } from './palette.js';

const _c = [0, 0, 0], _up = new THREE.Vector3(0, 1, 0);
const ZONES = [PAL.ochre, PAL.cream, PAL.coralDeep, PAL.ohmu, PAL.cream, PAL.amber];

/** A frame standing +Y on `up` with +Z along `out` at p. */
function frameAt(p, out, up = _up) {
  const z = out.clone().addScaledVector(up, -out.dot(up));
  if (z.lengthSq() < 1e-6) z.set(1, 0, 0).addScaledVector(up, -up.x); // (out along up: any way round will do)
  z.normalize(); const x = new THREE.Vector3().crossVectors(up, z).normalize(), y = new THREE.Vector3().crossVectors(z, x);
  return new THREE.Matrix4().makeBasis(x, y, z).setPosition(p);
}

/** A bracket on a surface at p facing `out`: a half disc (a little more), domed, its edge thin; banded, or orange. */
function bracket(K, p, out, R, rnd, Q, orange) {
  const M = frameAt(p, out), nu = Q.lod ? 3 : 6, nv = Q.lod ? 7 : 13, A = 105 * D2R, seed = rnd() * 9;
  const edge = (a) => R * (1 + 0.08 * Math.sin(a * 5 + seed));
  const top = (rho, a, Re) => 0.34 * R * Math.pow(Math.max(0, 1 - rho / Re), 0.75) + 0.04 * R, bot = (rho, Re) => -0.06 * R * Math.max(0, 1 - rho / Re);
  const pos = (f) => (i, j, o) => { const a = -A + (2 * A * j) / (nv - 1), Re = edge(a), rho = (Re * i) / (nu - 1); return o.set(Math.sin(a) * rho, f(rho, a, Re), Math.cos(a) * rho).applyMatrix4(M); };
  sheet(K, nu, nv, pos((rho, a, Re) => top(rho, a, Re)), { paint: (u) => {
    if (orange) mixLin(_c, PAL.orange, PAL.peach, u * u); else { const z = Math.floor(u * 5.5 + seed) % ZONES.length; mixLin(_c, ZONES[z], ZONES[(z + 1) % ZONES.length], (u * 5.5 + seed) % 1 > 0.7 ? 0.5 : 0); }
    ink(_c, 0.9, PAL.gAmber, 0, 0, 0, 0.35 * u, 0.75);
  } });
  sheet(K, nu, nv, pos((rho, a, Re) => bot(rho, Re)), { flip: true, paint: (u) => ink(orange ? PAL.peach : PAL.cream, 0.85, PAL.gAmber, 0.06 * u, 0, 0, 0.3, 0.85) });
  sheet(K, 2, nv, (i, j, o) => { const a = -A + (2 * A * j) / (nv - 1), Re = edge(a); return o.set(Math.sin(a) * Re, i ? bot(Re, Re) : top(Re, a, Re), Math.cos(a) * Re).applyMatrix4(M); }, { paint: () => ink(orange ? PAL.orange : PAL.cream, 0.95, PAL.gAmber, 0.05, 0, 0, 0.6, 0.75) });
}

/** A lion's mane hung at p: a lumpy body and spines falling from it. */
function lionsMane(K, p, s, rnd, Q) {
  const body = new THREE.IcosahedronGeometry(s * 0.55, 1), M = new THREE.Matrix4().compose(p, new THREE.Quaternion(), new THREE.Vector3(1.1, 0.7, 1));
  addGeo(K, body, M, (u, v, q, n) => ink(PAL.cream, 0.9 + 0.1 * n.y, PAL.gPale, 0.08, 0, 0, 0.5, 0.9)); body.dispose();
  const n = Q.lod ? 10 : 36, cone = new THREE.ConeGeometry(1, 1, Q.lod ? 4 : 5, 1, true); cone.translate(0, 0.5, 0); cone.rotateX(Math.PI); // (its base at the origin, its point a metre down)
  for (let k = 0; k < n; k++) {
    const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * s * 0.55, L = s * (0.6 + rnd() * 0.9), w = s * (0.05 + rnd() * 0.04);
    const at = p.clone().add(new THREE.Vector3(Math.sin(a) * rr, -s * 0.2 + (rnd() - 0.5) * 0.2 * s, Math.cos(a) * rr));
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(Math.cos(a), 0, -Math.sin(a)), (rr / s) * 0.4);
    const Mc = new THREE.Matrix4().compose(at, q, new THREE.Vector3(w, L, w));
    addGeo(K, cone, Mc, (u, v, q2) => { const t = THREE.MathUtils.clamp((at.y - q2.y) / L, 0, 1); mixLin(_c, PAL.cream, PAL.peach, t * t); ink(_c, 0.95, PAL.gPale, 0.08 + 0.1 * t, 0, 0, 0.5, 0.9); });
  }
  cone.dispose();
}

/** A morel standing at p on up: a pale stalk and a honeycombed cone. */
function morel(K, p, up, H, rnd, Q) {
  const M = frameAt(p, new THREE.Vector3(1, 0, 0.3), up.clone().normalize()), nv = Q.lod ? 8 : 16, seed = rnd() * 20;
  const prof = [[0.2, -0.2], [0.21, 0], [0.17, 0.16], [0.16, 0.34], [0.29, 0.38], [0.31, 0.48], [0.29, 0.6], [0.24, 0.72], [0.16, 0.84], [0.07, 0.95], [0.005, 1]];
  const pit = (i, j) => (i >= 4 ? smooth01(0.42, 0.62, noise3(j * 0.9 + seed, i * 1.3, seed)) : 1);
  sheet(K, prof.length, nv, (i, j, o) => { const a = (j / nv) * Math.PI * 2, r = prof[i][0] * H * (1 - 0.14 * (1 - pit(i, j))); return o.set(Math.sin(a) * r, prof[i][1] * H, Math.cos(a) * r).applyMatrix4(M); }, { wrap: true, flip: true, paint: (u, v) => {
    const i = Math.round(u * (prof.length - 1)), j = Math.round(v * nv) % nv;
    if (i < 4) ink(PAL.cream, 0.9, null, 0, 0, 0, 0.3, 0.9); else { mixLin(_c, PAL.loam, PAL.honey, pit(i, j)); ink(_c, 1, PAL.gAmber, 0.04, 0, 0, 0.1, 0.8); }
  } });
}

/** A small glowing cap (the hollow's): a stem and a dome lit from beneath. */
function glowCap(K, p, up, s, glow) {
  const M = frameAt(p, new THREE.Vector3(0.3, 0, 1), up.clone().normalize()), nv = 10;
  const prof = [[0.06, -0.1], [0.07, 0.5], [0.08, 0.62], [0.42, 0.6], [0.4, 0.72], [0.28, 0.86], [0.005, 0.95]];
  sheet(K, prof.length, nv, (i, j, o) => { const a = (j / nv) * Math.PI * 2; return o.set(Math.sin(a) * prof[i][0] * s, prof[i][1] * s, Math.cos(a) * prof[i][0] * s).applyMatrix4(M); }, { wrap: true, flip: true, paint: (u) => {
    const capK = smooth01(0.3, 0.5, u); mixLin(_c, PAL.cream, glow, 0.4); ink(_c, 0.8, glow, 0.35 + 0.35 * capK, 0.3, 0, 0.6, 0.6);
  } });
}

export function buildFungi(K, F, lod, S, { limbs, under, hollow }) {
  const Q = { lod };
  // shelf brackets up the trunk's strands (on their outer side) and along the limbs, in stacks of two to four
  limbs.forEach((L, i) => {
    const stacks = L.cap ? 1 : 2;
    for (let s = 0; s < stacks + (lod ? 0 : 1); s++) {
      const rnd = S(900 + i * 5 + s), u = L.reversed ? 0.55 : L.cap ? L.from + (1 - L.from) * (0.2 + 0.25 * rnd()) : 0.32 + 0.28 * rnd() + s * 0.1, p = L.curve.getPointAt(u);
      if (p.y - F.y0 < 5 || (Math.abs(Math.atan2(p.x, p.z) / D2R - MOUTH.az) < 20 && p.y - F.y0 < 10)) continue;
      const along = L.curve.getTangentAt(u), side = along.clone().cross(_up), out = L.cap && side.lengthSq() > 0.04 ? side.normalize().multiplyScalar(rnd() < 0.5 ? 1 : -1) : new THREE.Vector3(p.x, 0, p.z).normalize();
      const orange = (i + s) % 4 === 1, n = 2 + Math.floor(rnd() * 3);
      for (let k = 0; k < n; k++) {
        const R = (1.4 - k * 0.22) * (0.8 + rnd() * 0.5), at = p.clone().addScaledVector(along, (k - n / 2) * 0.9).addScaledVector(out, L.cap ? 0.75 : 1.0).addScaledVector(_up, (rnd() - 0.5) * 0.3);
        bracket(K, at, out.clone().applyAxisAngle(_up, (rnd() - 0.5) * 0.6), R, rnd, Q, orange);
      }
    }
  });
  // lion's mane under the tables and limbs
  under.forEach((U, k) => { const rnd = S(1000 + k); if (!lod || k % 2 === 0) lionsMane(K, U.p, U.limb ? 1.1 : 1.6 + rnd() * 0.5, rnd, Q); });
  // under the Crown's brim, between the side caps, three more
  [30, 150, 270].forEach((az, k) => lionsMane(K, F.at(az, 11.5, 38.6), 1.5, S(1050 + k), Q));
  // morels among the roots
  [[126, 9.6, 4], [306, 10.4, 5], [342, 9.4, 3], [62, 13.8, 3]].forEach(([az, s, n], c) => { for (let k = 0; k < (lod ? 2 : n); k++) {
    const rnd = S(1100 + c * 10 + k), a = az + (rnd() - 0.5) * 14, ss = s + (rnd() - 0.5) * 2.4, H = 1.3 + rnd() * 1.3;
    morel(K, F.ground(a, ss, -0.15), F.up(a, ss), H, rnd, Q);
  } });
  // the hollow's small glowing caps
  hollow.forEach((H, k) => glowCap(K, H.p, H.n, 0.7 + S(1200 + k)() * 0.6, k % 3 === 1 ? PAL.gViolet : PAL.gTeal));
  for (let k = 0; k < (lod ? 2 : 5); k++) { const rnd = S(1250 + k), a = MOUTH.az + 180 + (rnd() - 0.5) * 160, s = 1.9 + rnd() * 2; glowCap(K, F.ground(a, s, 0.02), F.up(a, s), 0.5 + rnd() * 0.5, k % 2 ? PAL.gViolet : PAL.gTeal); }
}
