// ---------------------------------------------------------------------------------------
// A SEED'S LOOK: a planetoid grown from a seed, by its kind (Dovina's SEEDS and SHAPES, progress/seeds.js; the ring's runtime Petra's,
// world/garden/orbit.js; docs/plans/SEEDS-SLABS-SCANS.md section 1). Read by vfx/garden/planetoid.js through SEED_LOOKS: `palette`
// (its top, low and rock), `matter` (the colour of what it is made of: its growth's burst), `roots` (false: no roots of stone hang under
// it), `shape(x, y, z, r, L)` (its unsculpted radius in units of R; `r` the common hills, `L` the look: its radius L.R), `skin(L, i, x, y,
// z, c, up)` (its own pattern in the ground's vertex colours) and `dress(L, std)` (its props, merged as the first six's are). Every shape
// is a height over the sphere (one radius a direction), the ground Petra's body stands on as it is; the bodies beyond a sphere (the
// bowl lived in from inside, the torus walked inside and out, the geode stood in deep) are Petra's (the handoff of 2026-10-30), drawn over
// the sphere here until then. Each must read at all four sizes (5, 9, 14, 20 m: SIZES) and as a large one's own moon (2 m):
//
//   clay     round: wheel-thrown terracotta, its throwing rings circling the pole, slip washed over it, a few pots and coils of fresh
//            clay standing on it (the garden as it began)
//   crystal  faceted, eighteen flat faces of pale quartz, their edges catching the light, clusters of amethyst and quartz points; at
//            medium a seam splits its crown, and at large it is split open like a geode: banded agate at the lip, a hollow lined with
//            amethyst points you stand inside; crystals hang under it in place of roots
//   coral    a round reef heart of brain-coral meanders and polyps, swelling where its arms grow; the arms (staghorn branching, sea
//            fans, tube clusters, table corals) more and longer with each size
//   bowl     a tea bowl: its crown sunk into a well where the garden is lived in, an iron-brown lip, a cream glaze outside running down in
//            drips and stopping short of an unglazed foot ring (the true hemisphere lived inside is Petra's body)
//   ring     a porcelain donut: dished deep at both poles into a hole of indigo dark ringed in gold, a belt of the film's schiller round
//            its waist (Galaxy's donut over the sphere; walked inside and out is Petra's body)
//   bone     round sandstone in strata, Lachrymite fossils weathering out of it: a spine and ribs across the crown, ammonites half sunk
//   moonlet  tiny and round, in its feeling's colour and paint motif (vfx/garden/seedskins.js); no roots, nothing on it
//
// Prior art: Super Mario Galaxy's planetoids (one readable idea each, every size and shape, a donut among them; the Hungry Luma's planet
// grown from what it is fed), geodes (a rind split to a hollow of amethyst, agate banding at the lip), coral reefs (staghorn Acropora,
// gorgonian fans, table and tube corals, brain coral's meanders), the chawan (a tea bowl's well, its kuchibeni lip, shino glaze running
// in drips above a bare foot ring), the throwing rings of a wheel-thrown pot, and the fossil beds of Dinosaur Provincial Park and the
// Jurassic Coast's ammonites, here in Lachrymite as vfx/garden/fossil.js's are.
//
//   import { SEED_LOOKS, SEED_KIND_OF, matterOf } from './seedplanetoids.js'   SEED_LOOKS[kind] -> { palette, matter, roots?, shape, skin, dress }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { fbm3, cells3, hash3, motifOf, lightDark } from './seedskins.js';
import { COLOR } from '../../progress/weather.js';

/** Petra's stand-in names (world/garden/orbit.js STAND_IN) read as the seeds' kinds, until her STAND_IN is deleted (her handoff). */
export const SEED_KIND_OF = { fossils: 'bone', moon: 'crystal', koi: 'coral' };

const TAU = Math.PI * 2, _y = new THREE.Vector3(0, 1, 0), _v = new THREE.Vector3(), _w = new THREE.Vector3(), _c = new THREE.Color(), _e = new THREE.Color();
const sstep = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp1 = (v) => Math.max(-1, Math.min(1, v));
// its underside a touch deeper: the island's keel (vfx/garden/planetoid.js's)
const keel = (y, r, k = 0.08) => (y < -0.35 ? r * (1 + k * (-y - 0.35)) : r);
/** A seeded stream for a look's dressing (the same planetoid dresses the same way every time it is made). */
const rng = (seed) => { let a = (Math.floor(Math.abs(seed) * 1000) % 2147483647) || 7; return () => ((a = (a * 16807) % 2147483647) / 2147483647); };
const unit = (x, y, z) => { const l = Math.hypot(x, y, z) || 1; return new THREE.Vector3(x / l, y / l, z / l); };
/** Directions spread over the sphere (a golden spiral), from the crown down to `low` (y), turned by `turn`. */
const spread = (n, low = -0.6, turn = 0) => Array.from({ length: n }, (_, k) => {
  const y = 1 - ((k + 0.5) / n) * (1 - low), s = Math.sqrt(Math.max(0, 1 - y * y)), a = k * 2.399963 + turn;
  return unit(Math.cos(a) * s, y, Math.sin(a) * s);
});
/** A direction tipped `a` radians off `d`, toward the side at `ph` (0..1 of a turn). */
function around(d, a, ph) {
  const s = new THREE.Vector3(1, 0, 0).cross(d); if (s.lengthSq() < 1e-4) s.set(0, 0, 1).cross(d);
  s.normalize().applyAxisAngle(d, ph * TAU);
  return d.clone().applyAxisAngle(s, a).normalize();
}
const tip = (d, a, rnd) => around(d, a, rnd());
/** Stand a mesh on the look's own unsculpted ground (its shape: a regrow builds the new look before the clay is moved out to it), its +Y
 *  along `up` (the ground's up when none), `lift` metres over it. */
function stand(L, mesh, dir, lift = 0, up = null) {
  const d = _v.copy(dir).normalize(), r = L.R * L.shape(d.x, d.y, d.z);
  mesh.position.copy(d).multiplyScalar(r + lift); mesh.quaternion.setFromUnitVectors(_y, _w.copy(up || d).normalize());
  L.props.add(mesh); return mesh;
}
/** A mesh set at a point, +Y along `dir`. */
function put(L, geo, mat, at, dir) { const m = new THREE.Mesh(geo, mat); m.position.copy(at); m.quaternion.setFromUnitVectors(_y, dir); L.props.add(m); return m; }

// ------------------------------------------------------------------ crystal: the faces and the geode
/** The crystal's eighteen faces: a golden spiral's normals jittered, so no two faces are alike and none lines up with the poles. */
const FACETS = Array.from({ length: 18 }, (_, k) => {
  const y = 1 - (2 * (k + 0.5)) / 18, s = Math.sqrt(1 - y * y), a = k * 2.399963 + 0.4 * Math.sin(k * 3.7);
  return unit(Math.cos(a) * s + 0.12 * Math.sin(k * 5.1), y + 0.1 * Math.cos(k * 2.3), Math.sin(a) * s + 0.12 * Math.cos(k * 4.3));
});
// the geode's axis (a little off the pole), the medium seam's plane, the radii it splits and opens at, the hollow's half-angle
const CLEFT = unit(0.15, 1, 0.1), SEAM = unit(1, 0, 0.25), GEODE = { open: 19.5, seam: 13.5, half: 0.6 };
const SEAM_E1 = CLEFT.clone().addScaledVector(SEAM, -CLEFT.dot(SEAM)).normalize(), SEAM_E2 = new THREE.Vector3().crossVectors(SEAM, SEAM_E1);
const FACET = { d1: 0, d2: 0, id: 0 };
function facetOf(x, y, z) {
  let d1 = -2, d2 = -2, id = 0;
  for (let k = 0; k < FACETS.length; k++) { const F = FACETS[k], d = F.x * x + F.y * y + F.z * z; if (d > d1) { d2 = d1; d1 = d; id = k; } else if (d > d2) d2 = d; }
  FACET.d1 = d1; FACET.d2 = d2; FACET.id = id; return FACET;
}
const cleftAngle = (x, y, z) => Math.acos(clamp1(x * CLEFT.x + y * CLEFT.y + z * CLEFT.z));
const seamOf = (x, y, z) => Math.abs(x * SEAM.x + y * SEAM.y + z * SEAM.z);
/** A hexagonal crystal point standing on its base, flat-faced (its own face normals: no flat-shading program, casebook rule 5). */
function crystalPoint(rb, h) {
  const prism = new THREE.CylinderGeometry(rb, rb * 1.08, h * 0.72, 6, 1).translate(0, h * 0.36, 0).toNonIndexed();
  const cap = new THREE.ConeGeometry(rb, h * 0.28, 6, 1).translate(0, h * 0.86, 0).toNonIndexed();
  const g = mergeGeometries([prism, cap]); prism.dispose(); cap.dispose(); g.deleteAttribute('uv'); g.computeVertexNormals();
  return g;
}
/** A cluster of `n` points round a direction, leaning out by up to `splay`, sunk `sink` of their height. */
function cluster(L, rnd, d, n, size, mat, splay = 0.45, sink = 0.05) {
  for (let k = 0; k < n; k++) { const h = size * (0.6 + 0.6 * rnd()); stand(L, new THREE.Mesh(crystalPoint(h * 0.16, h), mat), tip(d, 0.03, rnd), -sink * h, tip(d, splay * rnd(), rnd)); }
}

// ------------------------------------------------------------------ coral: where its arms grow, and what they are
const ARMS = spread(9, -0.45, 0.7);
const armsOf = (R) => (R < 4 ? 2 : R < 7 ? 3 : R < 11 ? 5 : R < 17 ? 7 : 9);
const CORAL = { stag: [0xf07a6a, 0xf2a05a, 0xd86aa0], tip: 0xffe2d4, fan: 0x9a5ab8, tube: 0xf2c84a, mouth: 0x7a4a2a, table: 0xf09a5a, ARM: ['stag', 'fan', 'stag', 'tube', 'table'] };
/** A tapered open segment from `base` along `dir`; returns its end. */
function segment(L, base, dir, len, rad, mat) { put(L, new THREE.CylinderGeometry(rad * 0.68, rad, len, 6, 1, true).translate(0, len / 2, 0), mat, base, dir); return base.clone().addScaledVector(dir, len); }
/** Staghorn: a segment, a knob at its end, and two or three branches off it, `depth` times. */
function staghorn(L, rnd, M, base, dir, len, rad, depth, mat) {
  const end = segment(L, base, dir, len, rad, mat);
  put(L, new THREE.IcosahedronGeometry(rad * 0.72, 0), depth ? mat : M.tip, end, dir);
  if (!depth) return;
  for (let k = 0, n = 2 + (rnd() < 0.4 ? 1 : 0); k < n; k++) staghorn(L, rnd, M, end, tip(dir, 0.45 + 0.35 * rnd(), rnd), len * (0.62 + 0.15 * rnd()), rad * 0.62, depth - 1, mat);
}
/** A sea fan: thin branches forking in one plane (a gorgonian's lattice), never a solid plate (a plate read as a hole, 2026-10-30). */
function seaFan(L, rnd, M, base, d, len, R) {
  const n = new THREE.Vector3(1, 0, 0).cross(d); if (n.lengthSq() < 1e-4) n.set(0, 0, 1).cross(d); n.normalize().applyAxisAngle(d, rnd() * TAU);
  const fork = (at, dir, l, r, depth) => {
    const end = segment(L, at, dir, l, r, M.fan); if (!depth) return;
    for (const s of [-1, 1]) fork(end, dir.clone().applyAxisAngle(n, s * (0.32 + 0.2 * rnd())), l * (0.72 + 0.12 * rnd()), r * 0.75, depth - 1);
  };
  fork(base, d, len * 0.3, Math.max(0.05, R * 0.012), R < 7 ? 3 : 4);
}
function tubes(L, rnd, M, d, g, len, R) {
  for (let t = 0; t < 6; t++) {
    const h = len * (0.35 + 0.45 * rnd()), rt = R * (0.03 + 0.015 * rnd()), up = tip(d, 0.25 * rnd(), rnd);
    const at = d.clone().multiplyScalar(g).addScaledVector(around(d, Math.PI / 2, rnd()), R * 0.05 * rnd()).addScaledVector(d, -0.1 * h);
    put(L, new THREE.CylinderGeometry(rt, rt * 1.1, h, 7).translate(0, h / 2, 0), M.tube, at, up);
    put(L, new THREE.CylinderGeometry(rt * 0.72, rt * 0.72, rt * 0.2, 7).translate(0, h * 0.9 + rt * 0.1, 0), M.mouth, at, up);
  }
}
function tableCoral(L, rnd, M, base, d, len, R) {
  const end = segment(L, base, d, len * 0.3, R * 0.025, M.table), w = len * 0.55;
  put(L, new THREE.CylinderGeometry(w, w * 0.82, w * 0.14, 12).translate(0, w * 0.07, 0), M.table, end, tip(d, 0.1, rnd));
}

// ------------------------------------------------------------------ the bowl's profile (angles from its crown), the ring's dimples (from the nearer pole)
const BOWL = { lip: 0.78, depth: 0.22, rim: 0.035, foot: Math.PI - 0.32, glazeTo: Math.PI - 0.55 };
const RING = { dimple: 0.4, wide: 0.52, gold: 0.72, belt: 0.06 };
// a thumb pot's profile: out up its wall to the rim, then down its inside to its floor (so its inside is drawn, never seen through)
const CLAY_POT = [[0, 0], [0.2, 0], [0.29, 0.07], [0.33, 0.2], [0.3, 0.34], [0.2, 0.44], [0.23, 0.5], [0.25, 0.53], [0.2, 0.52], [0.16, 0.44], [0.24, 0.32], [0.26, 0.2], [0.2, 0.1], [0, 0.08]].map(([x, y]) => new THREE.Vector2(x, y));
const BONE_LAYERS = [0xf0e0c0, 0xc89a64, 0xe2bca4, 0xb88e5c];

export const SEED_LOOKS = {
  clay: {
    palette: { top: 0xc47a4a, low: 0xa8603a, rock: 0x6e4030 }, matter: 0xc47a4a,
    // round, a ridge for each throwing ring
    shape(x, y, z, r) { return keel(y, r + 0.008 * Math.sin(Math.asin(clamp1(y)) * 34) * (1 - y * y)); },
    skin(L, i, x, y, z, c) {
      const rings = Math.sin(Math.asin(clamp1(y)) * 34), slip = sstep(0.55, 0.72, fbm3(x * 3 + 1, y * 3, z * 3));
      c.copy(L.sLow).lerp(L.sTop, sstep(-0.7, 0.6, y)).lerp(L.sRock, sstep(-0.35, -0.85, y));
      c.multiplyScalar(0.84 + 0.16 * rings).lerp(_c.setHex(0xe8b48a), slip * 0.4);
    },
    dress(L, std) {
      const rnd = rng(L.R * 13 + 3), pot = [std(0xd08850, { roughness: 0.9 }), std(0xead0b2, { roughness: 0.85 })], coil = std(0xb06a40, { roughness: 0.95 });
      const n = L.R < 4 ? 1 : 2 + Math.floor(L.R / 5), s = Math.min(2.6, 1.1 + L.R * 0.07);
      spread(n, -0.3, rnd() * 6).forEach((d, k) => {
        const g = new THREE.LatheGeometry(CLAY_POT, 12).scale(s * (0.9 + 0.3 * rnd()), s * (0.8 + 0.6 * rnd()), s * (0.9 + 0.3 * rnd()));
        stand(L, new THREE.Mesh(g, pot[k % 3 === 2 ? 1 : 0]), tip(d, 0.15, rnd), -0.04 * s);
        if (L.R < 4) return;
        const t = new THREE.TorusGeometry(0.34 * s, 0.07 * s, 5, 14, Math.PI * (1.2 + 0.6 * rnd())).rotateX(-Math.PI / 2);
        stand(L, new THREE.Mesh(t, coil), tip(d, 0.12 + 0.05 * rnd(), rnd), 0.02);
      });
    },
  },
  crystal: {
    palette: { top: 0xc8b4ee, low: 0x9a82d4, rock: 0x5a4688 }, matter: 0xb8a0e8, roots: false,
    shape(x, y, z, r, L) {
      let s = 0.94 / facetOf(x, y, z).d1;
      // its underside drawn to a point
      if (y < -0.3) s *= 1 + 0.18 * (-y - 0.3);
      const R = L?.R ?? 9, th = cleftAngle(x, y, z);
      if (R >= GEODE.open) {
        const open = sstep(GEODE.half + 0.02, GEODE.half - 0.12, th);
        s = s * (1 - open) + (0.72 + 0.1 * (th / GEODE.half) ** 2) * open + 0.022 * Math.exp(-(((th - GEODE.half) / 0.05) ** 2));
      } else if (R >= GEODE.seam) s -= 0.035 * Math.exp(-((seamOf(x, y, z) / 0.04) ** 2)) * sstep(0.35, 0.6, Math.cos(th));
      return s;
    },
    skin(L, i, x, y, z, c) {
      const F = facetOf(x, y, z), th = cleftAngle(x, y, z);
      c.copy(L.sLow).lerp(L.sTop, hash3(F.id, 1, 2) * 0.8 + 0.2 * sstep(-0.3, 0.8, y)).lerp(_c.setHex(0xa8c4f0), 0.35 * hash3(F.id, 4, 9)).multiplyScalar(0.78 + 0.34 * hash3(F.id, 7, 3));
      c.lerp(L.sRock, sstep(-0.2, -0.9, y) * 0.7);
      // a face's edge catching the light
      c.lerp(_c.setHex(0xf6f2ff), 0.6 * (1 - sstep(0.006, 0.03, F.d1 - F.d2)));
      if (L.R >= GEODE.open && th < GEODE.half + 0.04) {
        // the geode: agate banded at the lip, amethyst within, its points' feet glinting
        const deep = sstep(GEODE.half - 0.1, GEODE.half - 0.3, th), b = ((GEODE.half - th) / 0.022 + 0.6 * fbm3(x * 9, y * 9, z * 9)) % 3, C = cells3(x * 30, y * 30, z * 30);
        c.setHex(b < 1 ? 0xf2eef8 : b < 2 ? 0x8e9cc8 : 0x5a5878).lerp(_c.setHex(0x4a2470), deep).lerp(_c.setHex(0xb88ae8), deep * (1 - sstep(0.05, 0.22, C.f1)) * 0.8);
      } else if (L.R >= GEODE.seam) {
        // the seam: a dark split over the crown, its edges lit violet
        const dist = seamOf(x, y, z), crown = sstep(0.35, 0.6, Math.cos(th));
        c.lerp(_c.setHex(0x3a1a5a), crown * (1 - sstep(0.02, 0.05, dist))).lerp(_c.setHex(0xa078e0), crown * (sstep(0.02, 0.04, dist) - sstep(0.05, 0.08, dist)) * 0.7);
      }
    },
    dress(L, std) {
      const rnd = rng(L.R * 7 + 1), R = L.R, open = R >= GEODE.open;
      const am = std(0x9a6ad8, { roughness: 0.25, metalness: 0.1, emissive: 0x3a1a6a, emissiveIntensity: 0.45 }), qz = std(0xeae6fa, { roughness: 0.2, metalness: 0.05, emissive: 0x2a2a4e, emissiveIntensity: 0.35 });
      // clusters out of the faces, more as it grows (none over the hollow)
      spread(R < 4 ? 2 : 3 + Math.floor(R / 4), -0.5, 1.3).forEach((d, k) => { if (!open || cleftAngle(d.x, d.y, d.z) > GEODE.half + 0.15) cluster(L, rnd, d, 4 + Math.floor(rnd() * 3), Math.max(0.5, R * 0.1), k % 2 ? qz : am); });
      // at medium, points poking out along the seam
      if (R >= GEODE.seam && !open) for (let k = 0; k < 7; k++) { const a = (k / 6 - 0.5) * 1.1; cluster(L, rnd, SEAM_E1.clone().multiplyScalar(Math.cos(a)).addScaledVector(SEAM_E2, Math.sin(a)), 2, R * 0.05, am, 0.6, 0.2); }
      // at large, the hollow lined with points leaning in to its middle
      if (open) for (let k = 0; k < 34; k++) {
        const d = around(CLEFT, Math.sqrt(rnd()) * (GEODE.half - 0.06), rnd()), h = R * (0.05 + 0.05 * rnd());
        stand(L, new THREE.Mesh(crystalPoint(h * 0.17, h), k % 5 ? am : qz), d, -0.1 * h, tip(d.clone().lerp(CLEFT, 0.5).normalize(), 0.35 * rnd(), rnd));
      }
      // crystals hanging under it, in place of roots of stone
      for (let k = 0; k < (R < 4 ? 2 : 4); k++) { const d = unit(Math.cos(k * 1.9) * 0.4, -1, Math.sin(k * 1.9) * 0.4), h = R * (0.22 + 0.14 * rnd()); stand(L, new THREE.Mesh(crystalPoint(h * 0.2, h), k % 2 ? qz : am), d, -0.12 * h, tip(d, 0.12, rnd)); }
    },
  },
  coral: {
    palette: { top: 0xf2a088, low: 0xd8786a, rock: 0x8a5468 }, matter: 0xf09a88,
    shape(x, y, z, r, L) {
      // brain coral's meanders, and the heart swelling where an arm grows
      let s = r + 0.008 * Math.sin(x * 13 + Math.sin(z * 7) * 2) * Math.sin(y * 11 + Math.sin(x * 5) * 2);
      for (let k = 0, n = armsOf(L?.R ?? 9); k < n; k++) { const A = ARMS[k], a = Math.acos(clamp1(A.x * x + A.y * y + A.z * z)); s += 0.05 * Math.exp(-((a / 0.22) ** 2)); }
      return keel(y, s);
    },
    skin(L, i, x, y, z, c) {
      const g = Math.abs(Math.sin(fbm3(x * 2.6, y * 2.6, z * 2.6) * 26)), C = cells3(x * 16, y * 16, z * 16);
      c.multiplyScalar(0.68 + 0.32 * sstep(0.1, 0.45, g)).lerp(_c.setHex(0xffe8d8), 0.45 * (1 - sstep(0.12, 0.2, C.f1)) * sstep(-0.2, 0.3, y));
    },
    dress(L, std) {
      const rnd = rng(L.R * 11 + 5), R = L.R, depth = R < 7 ? 1 : R < 15 ? 2 : 3;
      const M = { stag: CORAL.stag.map((h) => std(h, { roughness: 0.75 })), tip: std(CORAL.tip, { roughness: 0.6, emissive: 0x3a1a14, emissiveIntensity: 0.2 }), fan: std(CORAL.fan, { roughness: 0.8 }), tube: std(CORAL.tube, { roughness: 0.7 }), mouth: std(CORAL.mouth, { roughness: 0.9 }), table: std(CORAL.table, { roughness: 0.75 }) };
      for (let k = 0, n = armsOf(R); k < n; k++) {
        const d = ARMS[k], g = R * L.shape(d.x, d.y, d.z), base = d.clone().multiplyScalar(g - 0.05 * R), len = R * (0.34 + 0.1 * rnd()), kind = CORAL.ARM[k % CORAL.ARM.length];
        if (kind === 'stag') staghorn(L, rnd, M, base, tip(d, 0.12, rnd), len * 0.42, Math.max(0.1, R * 0.035), depth, M.stag[k % 3]);
        else if (kind === 'fan') seaFan(L, rnd, M, base, d, len, R);
        else if (kind === 'tube') tubes(L, rnd, M, d, g, len, R);
        else tableCoral(L, rnd, M, base, d, len, R);
      }
    },
  },
  bowl: {
    palette: { top: 0x8cc47c, low: 0x6aa060, rock: 0xb87c54 }, matter: 0xece2cc, roots: false,
    shape(x, y, z) {
      const th = Math.acos(clamp1(y)), B = BOWL;
      // the well, then the wall narrowing to the foot; the lip's rim, the foot ring and the base recessed inside it
      let s = th < B.lip ? 1.04 - B.depth * (1 - (th / B.lip) ** 2) : 1.04 - 0.16 * sstep(B.lip, Math.PI, th) ** 1.5;
      s += B.rim * Math.exp(-(((th - B.lip) / 0.07) ** 2)) + 0.04 * Math.exp(-(((th - B.foot) / 0.05) ** 2)) - (th > B.foot + 0.04 ? 0.03 : 0);
      return s + 0.004 * Math.sin(x * 9 + z * 7);
    },
    skin(L, i, x, y, z, c) {
      const th = Math.acos(clamp1(y)), B = BOWL, lon = Math.atan2(x, z);
      const drip = 0.06 * Math.sin(lon * 7) + 0.04 * Math.sin(lon * 13 + 1) - 0.14 * sstep(0.7, 0.95, Math.abs(Math.sin(lon * 5.5 + 0.6))), edge = B.glazeTo + drip;
      // shino outside: cream, thicker toward its bead, iron in it; under the bead the bare foot, a shadow at the bead
      _e.setHex(0xece2cc).lerp(_c.setHex(0xd8c8aa), sstep(edge - 0.25, edge, th)).lerp(_c.setHex(0xb8683a), sstep(0.62, 0.75, fbm3(x * 6, y * 6, z * 6)) * 0.5);
      _c.copy(L.sRock).multiplyScalar((0.95 + 0.08 * fbm3(x * 8, y * 8, z * 8)) * (1 - 0.25 * (1 - sstep(0.02, 0.09, th - edge))));
      _e.lerp(_c, sstep(edge - 0.03, edge + 0.05, th));
      // the well, the garden lived in, blended in over two rows of vertices; then the lip's iron over it all
      c.copy(L.sLow).lerp(L.sTop, sstep(B.lip, 0.1, th)).lerp(_e, sstep(B.lip - 0.12, B.lip - 0.02, th));
      c.lerp(_c.setHex(0x7a3c22), 1 - sstep(0.04, 0.11, Math.abs(th - B.lip)));
    },
    dress() {},
  },
  ring: {
    palette: { top: 0xeef2f8, low: 0xd2dae8, rock: 0x9aa2ba }, matter: 0xdfe6f2, roots: false,
    // a donut over the sphere: wide at the waist, dished deep at both poles, a belt round the waist
    shape(x, y, z, r) { const p = Math.acos(Math.min(1, Math.abs(y))); return (1 + 0.3 * (r - 1) + 0.08 * (1 - y * y)) * (1 - 0.14 * y * y) - RING.dimple * Math.exp(-((p / RING.wide) ** 2)) + 0.02 * Math.exp(-((y / RING.belt) ** 2)); },
    skin(L, i, x, y, z, c) {
      const p = Math.acos(Math.min(1, Math.abs(y))), q = Math.exp(-((p / RING.wide) ** 2)), lon = Math.atan2(x, z);
      // porcelain going to celadon blue into the dimple, then the hole's indigo dark
      c.copy(L.sLow).lerp(L.sTop, 0.6 + 0.4 * Math.abs(y)).lerp(_c.setHex(0x9ab4d8), sstep(0.15, 0.4, q) * 0.4).lerp(_c.setHex(0x221c50), sstep(0.35, 0.75, q)).lerp(_c.setHex(0x0e0a24), sstep(0.75, 0.95, q));
      // the hole's gold rim
      c.lerp(_c.setHex(0xe0b04a), 1 - sstep(0.025, 0.07, Math.abs(p - RING.gold)));
      // the film's schiller in its belt
      const belt = 1 - sstep(0.035, 0.085, Math.abs(y)), t = (lon / TAU) * 3 + 0.25 * fbm3(x * 4, y * 4, z * 4);
      if (belt > 0) c.lerp(_c.setRGB(0.3 + 0.25 * Math.cos(TAU * t), 0.45 + 0.3 * Math.cos(TAU * (t + 0.33)), 0.6 + 0.3 * Math.cos(TAU * (t + 0.67))), belt * 0.9);
    },
    dress() {},
  },
  bone: {
    palette: { top: 0xe0c89a, low: 0xc8a674, rock: 0x8a6e58 }, matter: 0xe6d4ae,
    // weathered into low ridges
    shape(x, y, z, r) { return keel(y, r + 0.012 * Math.sin(x * 11 + z * 7) * Math.sin(y * 9)); },
    skin(L, i, x, y, z, c) {
      const b = (((y * 7 + 0.35 * fbm3(x * 1.6, y * 1.6, z * 1.6)) % 4) + 4) % 4, C = cells3(x * 12, y * 12, z * 12);
      c.lerp(_c.setHex(BONE_LAYERS[Math.floor(b)]), 0.7).multiplyScalar(0.92 + 0.12 * sstep(0.1, 0.3, C.f1));
    },
    dress(L, std) {
      // Lachrymite, as vfx/garden/fossil.js's crystal is: dark glass lit from within
      const rnd = rng(L.R * 5 + 9), R = L.R, lach = std(0x6ab4c4, { roughness: 0.22, metalness: 0.15, emissive: 0x2a8aa8, emissiveIntensity: 0.25 }), ribs = R >= 4 ? 7 : 4;
      // the ribs across a meridian over the crown, shortest at the ends, half sunk; the spine under them
      for (let i = 0; i < ribs; i++) {
        const t = (i - (ribs - 1) / 2) / (ribs / 2), d = unit(Math.sin(t * 0.6), Math.cos(t * 0.6), 0.05), w = R * (0.15 - 0.05 * t * t);
        stand(L, new THREE.Mesh(new THREE.TorusGeometry(w, Math.max(0.08, R * 0.018) * (1.3 - t * t * 0.4), 6, 14, Math.PI).rotateY(Math.PI / 2), lach), d, -w * 0.45);
      }
      for (let i = 0; i < ribs + 2; i++) { const t = (i - (ribs + 1) / 2) / ((ribs + 2) / 2), s = R * 0.032; stand(L, new THREE.Mesh(new THREE.BoxGeometry(s * 1.4, s, s * 1.7), lach), unit(Math.sin(t * 0.62), Math.cos(t * 0.62), 0.05), -s * 0.2); }
      // ammonites, lying in the ground half sunk (never on the ribs)
      spread(R < 7 ? 1 : 2 + Math.floor(R / 10), -0.4, 2.2).forEach((d0) => {
        const d = d0.y > 0.85 ? tip(d0, 0.6, rnd) : d0, s = R * 0.075, pts = [];
        for (let k = 0; k <= 48; k++) { const a = k * 0.26, rr = s * (0.15 + k * 0.019); pts.push(new THREE.Vector3(Math.cos(a) * rr, 0, Math.sin(a) * rr)); }
        const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, s * 0.2, 6, false); g.deleteAttribute('uv');
        stand(L, new THREE.Mesh(g, lach), d, -s * 0.08);
      });
      // chips of it in the ground
      for (let k = 0; k < 4 + Math.floor(R / 3); k++) { const s = R * (0.01 + 0.01 * rnd()); stand(L, new THREE.Mesh(new THREE.OctahedronGeometry(s, 0), lach), tip(_y, 0.2 + 1.3 * rnd(), rnd), -s * 0.3); }
    },
  },
  moonlet: {
    palette: { top: 0xe8e2ee, low: 0xc8c0d4, rock: 0x8a8098 }, matter: 0xffffff, roots: false,
    shape(x, y, z, r) { return 1 + 0.4 * (r - 1); },
    skin(L, i, x, y, z, c, up) {
      const f = L.dressing.feeling; if (!f || COLOR[f] == null) return;
      // its feeling's colour, lighter on its crown, darker under it; then its paint motif, light and dark
      _c.setHex(COLOR[f]); _e.copy(_c).lerp(WHITE, 0.22);
      c.copy(_c).multiplyScalar(0.78).lerp(_e, up).multiplyScalar(1 - 0.4 * sstep(-0.2, -0.9, y));
      lightDark(c, motifOf(f, x * L.R, y * L.R, z * L.R, L.R));
    },
    dress() {},
  },
};
const WHITE = new THREE.Color(1, 1, 1);
/** Its matter's colour: what its growth's burst throws (a moonlet's its feeling's). */
export const matterOf = (L) => (L.seedLook === SEED_LOOKS.moonlet && COLOR[L.dressing?.feeling] != null ? COLOR[L.dressing.feeling] : L.seedLook?.matter ?? 0xffffff);
