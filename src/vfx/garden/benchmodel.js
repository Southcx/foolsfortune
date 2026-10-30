// ---------------------------------------------------------------------------------------
// THE CARVING BENCH'S MODEL (docs/plans/SEEDS-SLABS-SCANS.md 2; Petra's bench, world/garden/bench.js, its table top 0.55 m up, the slab
// on it): a stone carving table that reads as a fossil-preparation bench. In the bench's frame (x east along the table, y up, z north; the
// camera's station looks from the south, so what is racked stands behind the slab):
//
//   THE TABLE      a thick top of dark sandstone on two stone trestles, a lip round it so the grit stays on (a prep tray), a leather mat
//                  under the slab, a low shelf between the trestles with the jars of consolidant on it
//   THE RACK       a board along the north edge with seven pegs, each tool a verb hanging on it in the order of the keys (1 to 7): the
//                  brush (the Soul Brush's), the pick (the Dreamvane's), the air pen (the psygun's blast), the blade (the Sondelass's
//                  slice), the coffin with its funnel (the Lockheart's hoover), the bell (the Crucibelle's toll), the loupe and its plate
//                  (the Veritome's silhouette); their working ends in Lachrymite or brass
//   THE LAMP       a magnifier lamp on an arm from the north-west corner, its ring lit warm over the slab (a face that glows: no lamp of
//                  the light budget's)
//
// One geometry in the matter look's program (vfx/godhand/matterlook.js, role 'bench': the colour in the vertices, `aMl.w` the class: stone
// takes the atlas's grain, wood and iron and leather are plain, the tools' edges Lachrymite, the lamp's ring lit), built in the geometry's
// grain units as the slab is (vfx/garden/slabmesh.js SLAB_MESH.grain). No program of its own, one draw call.
//
// Prior art: a palaeontologist's preparation lab (the sandbag and the mat, air scribes and dental picks racked, the magnifier lamp
// over the specimen, consolidant in jars), Fossil Fighters' cleaning rock on its stand, a stonemason's banker (the bench a block is
// worked on), the decor kit's soft boxes (vfx/garden/decorpieces/kit.js).
//
//   benchGeometry() -> BufferGeometry (built once)   BENCH_LOOK   RACK (each tool's peg, in the keys' order)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { softBox } from './decorpieces/kit.js';
import { SLAB_MESH } from './slabmesh.js';

/** Its colours (sRGB hex) and the table's numbers (metres): the top under the slab at `top` (Petra's BENCH.top). */
export const BENCH_LOOK = {
  top: 0.55, w: 1.0, d: 0.66, thick: 0.09,
  stone: 0x6b5a4e, stoneL: 0x857262, trestle: 0x5c4c42, leather: 0x6a3a24, wood: 0x7a5234, woodD: 0x4e3220, iron: 0x3a3836,
  brass: 0xc0943e, paper: 0xeee2c6, bristle: 0xe8d6b0, glass: 0x9fc6c0, lamp: 0xfff0c8, lachrymite: 0x3f3170, jar: [0x9a6a3a, 0x5a7a68, 0x8a8aa0],
};
/** The rack's pegs along the north edge (x), in the keys' order: brush, pick, blast, slice, hoover, toll, silhouette, left to right as the
 *  station's camera sees them. */
export const RACK = { z: 0.27, y: 0.86, x: [0.36, 0.24, 0.12, 0, -0.12, -0.24, -0.36] }; // (east is the station's left: it looks north, so 1 to 7 read left to right as the slot row does)

const CLS = { stone: 0, lachrymite: 1, plain: 2, lamp: 3 };
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();

/** The bench's little builder: any geometry placed, coloured and classed (non-indexed, its own normals). */
class Build {
  constructor() { this.pos = []; this.nor = []; this.col = []; this.ml = []; }
  geo(g, { at = [0, 0, 0], rot = [0, 0, 0], sc = 1, c = 0xffffff, cls = 'plain', rough = 0.8 } = {}) {
    const q = g.index ? g.toNonIndexed() : g.clone();
    _m.compose(_p.set(...at), _q.setFromEuler(_e.set(...rot)), Array.isArray(sc) ? _s.set(...sc) : _s.set(sc, sc, sc)); q.applyMatrix4(_m);
    const P = q.attributes.position, N = q.attributes.normal; _c.setHex(c);
    for (let i = 0; i < P.count; i++) { this.pos.push(P.getX(i), P.getY(i), P.getZ(i)); this.nor.push(N.getX(i), N.getY(i), N.getZ(i)); this.col.push(_c.r, _c.g, _c.b, 1); this.ml.push(0, rough, 0, CLS[cls]); }
    g.dispose(); if (q !== g) q.dispose();
    return this;
  }
  box(w, h, d, o, r) { return this.geo(r === 0 ? new THREE.BoxGeometry(w, h, d) : softBox(w, h, d, r), o); }
  cyl(rt, rb, h, o, seg = 10) { return this.geo(new THREE.CylinderGeometry(rt, rb, h, seg, 1), o); }
  /** A rod from a to b. */
  rod(a, b, r, o, seg = 6) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length();
    const e = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()), 'YXZ');
    return this.geo(new THREE.CylinderGeometry(r, r, len, seg, 1), { ...o, at: A.add(B).multiplyScalar(0.5).toArray(), rot: [e.x, e.y, e.z] });
  }
  done(K) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos.map((v) => v * K), 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 4)); g.setAttribute('aMl', new THREE.Float32BufferAttribute(this.ml, 4));
    g.computeBoundingSphere();
    return g;
  }
}

let built = null;
/** The bench (table, rack, tools, lamp) as one geometry, in grain units. */
export function benchGeometry() {
  if (built) return built;
  const B = new Build(), L = BENCH_LOOK, T = L.top, st = (c, rough = 0.92) => ({ c, cls: 'stone', rough });
  // the table: its top (a tray: the slab of sandstone and its lip), two trestles, the shelf between them and the mat under the slab
  B.box(L.w, L.thick, L.d, { at: [0, T - L.thick / 2 - 0.005, 0], ...st(L.stone) }, 0.02);
  for (const s of [-1, 1]) {
    B.box(L.w - 0.04, 0.03, 0.03, { at: [0, T + 0.005, s * (L.d / 2 - 0.02)], ...st(L.stoneL) }, 0.01);
    B.box(0.03, 0.03, L.d - 0.04, { at: [s * (L.w / 2 - 0.02), T + 0.005, 0], ...st(L.stoneL) }, 0.01);
    B.box(0.16, T - L.thick, 0.5, { at: [s * 0.36, (T - L.thick) / 2, 0], ...st(L.trestle) }, 0.03);
    B.box(0.22, 0.05, 0.56, { at: [s * 0.36, 0.025, 0], ...st(L.stone) }, 0.02);
  }
  B.box(0.56, 0.03, 0.34, { at: [0, 0.16, 0], c: L.woodD, rough: 0.85 }, 0.01);
  [[-0.17, 0.05, 0.065], [-0.06, -0.06, 0.08], [0.07, 0.04, 0.06], [0.18, -0.05, 0.075]].forEach(([x, z, h], i) => {
    B.cyl(0.035, 0.032, h, { at: [x, 0.175 + h / 2, z], c: L.jar[i % 3], rough: 0.35 }, 10);
    B.cyl(0.03, 0.03, 0.012, { at: [x, 0.175 + h + 0.006, z], c: L.woodD, rough: 0.7 }, 10);
  });
  B.box(0.6, 0.006, 0.36, { at: [0, T - 0.004, 0], c: L.leather, rough: 0.7 }, 0);
  // the rack: a board on two posts along the north edge, seven pegs
  for (const s of [-1, 1]) B.box(0.035, 0.36, 0.035, { at: [s * 0.44, T + 0.18, RACK.z + 0.02], c: L.woodD, rough: 0.8 }, 0.008);
  B.box(0.92, 0.07, 0.02, { at: [0, RACK.y + 0.02, RACK.z + 0.03], c: L.wood, rough: 0.8 }, 0.006);
  B.box(0.92, 0.02, 0.05, { at: [0, T + 0.01, RACK.z + 0.01], c: L.wood, rough: 0.8 }, 0.004);
  for (const x of RACK.x) B.rod([x, RACK.y + 0.01, RACK.z + 0.02], [x, RACK.y + 0.02, RACK.z - 0.02], 0.005, { c: L.brass, rough: 0.4 });
  tools(B, L);
  // the magnifier lamp: a post at the north-west corner, two arms, the lit ring over the slab
  const base = [-0.44, T, 0.24], el = [-0.4, T + 0.42, 0.2], hd = [-0.12, T + 0.5, 0.07];
  B.cyl(0.05, 0.06, 0.03, { at: [base[0], T + 0.015, base[2]], c: L.iron, rough: 0.5 }, 12);
  B.rod(base, el, 0.01, { c: L.iron, rough: 0.5 }); B.rod(el, hd, 0.009, { c: L.iron, rough: 0.5 });
  B.geo(new THREE.TorusGeometry(0.075, 0.016, 6, 20).rotateX(Math.PI / 2), { at: hd, rot: [0.25, 0, -0.2], c: L.iron, rough: 0.45 });
  B.geo(new THREE.TorusGeometry(0.075, 0.007, 4, 20).rotateX(Math.PI / 2), { at: [hd[0], hd[1] - 0.012, hd[2]], rot: [0.25, 0, -0.2], c: L.lamp, cls: 'lamp' });
  B.geo(new THREE.CircleGeometry(0.06, 16).rotateX(Math.PI / 2), { at: [hd[0], hd[1] - 0.004, hd[2]], rot: [0.25, 0, -0.2], c: L.glass, rough: 0.1 });
  built = B.done(SLAB_MESH.grain);
  return built;
}

/** The seven tools on their pegs (each hangs from its peg, its working end down), the keys' order. */
function tools(B, L) {
  const [bx, px, ax, sx, hx, tx, vx] = RACK.x, y = RACK.y, z = RACK.z - 0.035;
  // 1 the brush: a long handle, a ferrule, a tuft (the Soul Brush's)
  B.rod([bx, y, z], [bx, y - 0.16, z], 0.007, { c: L.wood, rough: 0.6 });
  B.cyl(0.011, 0.009, 0.02, { at: [bx, y - 0.17, z], c: L.brass, rough: 0.35 });
  B.cyl(0.012, 0.002, 0.05, { at: [bx, y - 0.205, z], c: L.bristle, rough: 0.9 }, 8);
  // 2 the pick: a handle and its head, the edge Lachrymite (the Dreamvane's)
  B.rod([px, y, z], [px, y - 0.18, z], 0.007, { c: L.woodD, rough: 0.6 });
  B.box(0.09, 0.016, 0.016, { at: [px, y - 0.185, z], c: L.iron, rough: 0.45 }, 0.004);
  B.cyl(0.0, 0.009, 0.04, { at: [px + 0.06, y - 0.185, z], rot: [0, 0, Math.PI / 2], c: L.lachrymite, cls: 'lachrymite', rough: 0.2 }, 6);
  // 3 the air pen: a brass body, a hose loop, a fine nozzle (the psygun's blast)
  B.cyl(0.012, 0.012, 0.1, { at: [ax, y - 0.07, z], c: L.brass, rough: 0.35 }, 10);
  B.cyl(0.012, 0.003, 0.04, { at: [ax, y - 0.14, z], c: L.iron, rough: 0.4 }, 10);
  B.geo(new THREE.TorusGeometry(0.03, 0.005, 5, 14, Math.PI * 1.4), { at: [ax + 0.02, y - 0.02, z + 0.005], rot: [0, 0, 0.6], c: L.iron, rough: 0.6 });
  // 4 the blade: a curved cutting edge on a short grip (the Sondelass's slice)
  B.rod([sx, y, z], [sx, y - 0.07, z], 0.008, { c: L.woodD, rough: 0.6 });
  B.box(0.012, 0.012, 0.012, { at: [sx, y - 0.075, z], c: L.brass, rough: 0.35 }, 0.003);
  B.geo(new THREE.CylinderGeometry(0.06, 0.06, 0.004, 12, 1, false, 0, Math.PI * 0.55), { at: [sx - 0.03, y - 0.09, z], rot: [Math.PI / 2, 0, -0.4], c: L.lachrymite, cls: 'lachrymite', rough: 0.2 });
  // 5 the coffin with its funnel (the Lockheart's hoover)
  B.box(0.045, 0.08, 0.025, { at: [hx, y - 0.06, z], c: L.woodD, rough: 0.7 }, 0.006);
  B.box(0.05, 0.012, 0.03, { at: [hx, y - 0.04, z], c: L.brass, rough: 0.35 }, 0.003);
  B.cyl(0.03, 0.006, 0.05, { at: [hx, y - 0.125, z], c: L.brass, rough: 0.35 }, 12);
  // 6 the bell (the Crucibelle's toll)
  B.rod([tx, y, z], [tx, y - 0.03, z], 0.003, { c: L.iron });
  B.geo(new THREE.LatheGeometry([[0.0, 0], [0.012, 0.0], [0.016, -0.01], [0.02, -0.04], [0.032, -0.065], [0.033, -0.07]].map(([r, h]) => new THREE.Vector2(r, h)), 12), { at: [tx, y - 0.03, z], c: L.brass, rough: 0.3 });
  B.geo(new THREE.SphereGeometry(0.008, 6, 4), { at: [tx, y - 0.1, z], c: L.lachrymite, cls: 'lachrymite', rough: 0.2 });
  // 7 the loupe and its plate (the Veritome's silhouette): a framed plate hung by a cord, a lens on a ring before it
  B.box(0.07, 0.09, 0.008, { at: [vx, y - 0.07, z + 0.005], c: L.woodD, rough: 0.7 }, 0.003);
  B.box(0.056, 0.074, 0.004, { at: [vx, y - 0.07, z], c: L.paper, rough: 0.9 }, 0);
  B.geo(new THREE.TorusGeometry(0.02, 0.004, 5, 14), { at: [vx + 0.025, y - 0.105, z - 0.012], c: L.brass, rough: 0.35 });
  B.geo(new THREE.CircleGeometry(0.018, 12), { at: [vx + 0.025, y - 0.105, z - 0.013], rot: [0, Math.PI, 0], c: L.glass, rough: 0.1 });
}
