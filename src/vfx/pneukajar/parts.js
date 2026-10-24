// ---------------------------------------------------------------------------------------
// THE JAR'S PARTS (plain names): the geometry of what the Pneuka Jar can wear that the Courier cannot (vfx/pneukajar/table.js JAR_LOOK):
// its lid, its handles, its foot, the pendant off its choker. Each is built in the owner's Jar's own bind space (it stands 1.2 tall,
// its face to +Z, its lid hinged at the back: assets/pneuka.glb), placed through the Jar's shape (vfx/pneukajar/shape.js `morph`, so a
// lid stays on a taller Jar's mouth), and skinned to the Jar's own bones (a lid to the lid bone, a handle by height), so the owner's
// clips (godhand/pneukajarclips.js) squash and open them with the clay. Merged one geometry a material, so a whole look is a few draws.
// Each names the material it wants by the kiln's region (`body`, `trim`, `mask`: their glazes; `stones`: the core's gem, the stones'
// mineral; `hair`: the hair's finish, for a cord; `gold`, `cork`: fixed), and vfx/pneukajar/dress.js gives it.
//
// Prior art: the potter's parts (a lid with its knob, lug handles and ring handles from bronze, the dragon handle of a Tang amphora, a
// basket handle wrapped in cane, the foot ring, a lotus-petal pedestal, the ball-and-claw foot), a lathe for anything turned
// (THREE.LatheGeometry: a profile spun, as the wheel does), and the house's merged props (render/propbatch.js's one draw a material).
//
//   jarParts(look, morph) -> { [material]: BufferGeometry }    (look: vfx/pneukajar/table.js; morph: shape.js jarMorph(...))
//   pendantParts(id, morph) -> { geos: { [material]: BufferGeometry }, hang: Vector3 }   (apart, so it can swing about `hang`)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { JAR_ANATOMY as A, boneAt, regionAt } from './shape.js';

const V2 = (r, y) => new THREE.Vector2(r, y);
const lathe = (pts, segs = 16) => new THREE.LatheGeometry(pts.map(([r, y]) => V2(r, y)), segs);
const sphere = (r, w = 10, h = 8) => new THREE.SphereGeometry(r, w, h);
const at = (g, x, y, z) => g.translate(x, y, z);
const deg = THREE.MathUtils.degToRad;

/** Keep only what every material reads, skinned to the Jar's bones (by height, or one), with the crack region kintsugi reads. */
function skin(g, { bone = null, maxBone = 4, side = false } = {}) {
  g = g.index ? g.toNonIndexed() : g;
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  const P = g.attributes.position, n = P.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), rg = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const y = P.getY(i); si[i * 4] = bone ?? Math.min(maxBone, boneAt(y)); sw[i * 4] = 1;
    rg[i] = side && Math.abs(P.getX(i)) > 0.2 ? (P.getX(i) < 0 ? 2 : 3) : regionAt(y); // (a handle cracks as an arm does)
  }
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
  g.setAttribute('aRegion', new THREE.BufferAttribute(rg, 1));
  return g;
}
/** Moved with the Jar's shape: by where its anchor went, and spread by how much the Jar widened there (`ring`: round the axis). */
function place(g, anchor, morph, { ring = false } = {}) {
  const to = morph(anchor.clone()), P = g.attributes.position, v = new THREE.Vector3();
  let k = 1; if (ring) { const r0 = Math.hypot(anchor.x, anchor.z) || A.mouthR, e = morph(new THREE.Vector3(r0, anchor.y, 0)); k = Math.hypot(e.x, e.z) / r0; }
  for (let i = 0; i < P.count; i++) {
    v.fromBufferAttribute(P, i);
    if (ring) { v.x *= k; v.z *= k; v.y += to.y - anchor.y; } else v.add(to).sub(anchor);
    P.setXYZ(i, v.x, v.y, v.z);
  }
  return g;
}
const add = (out, mat, g) => (out[mat] ||= []).push(g);

// ---------------------------------------------------------------- lids (on the lid bone; the mouth at y 1.2, r 0.096)
const LIDS = {
  none: () => [],
  cork: () => [['cork', lathe([[0, 1.172], [0.082, 1.172], [0.09, 1.2], [0.098, 1.245], [0.094, 1.258], [0, 1.26]])]],
  lotus: () => {
    const o = [['trim', at(new THREE.CylinderGeometry(0.104, 0.1, 0.022, 22), 0, 1.207, 0)], ['trim', at(sphere(0.034).scale(1, 1.45, 1), 0, 1.29, 0)]];
    for (let i = 0; i < 8; i++) {
      const p = sphere(0.075, 10, 6).scale(0.5, 0.16, 1).translate(0, 0, 0.06).rotateX(deg(-38)).rotateY((i / 8) * Math.PI * 2);
      o.push(['trim', at(p, 0, 1.222, 0)]);
    }
    return o;
  },
  crown: () => {
    const o = [['gold', at(new THREE.CylinderGeometry(0.108, 0.102, 0.05, 22), 0, 1.222, 0)]];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2, x = Math.sin(a) * 0.098, z = Math.cos(a) * 0.098;
      o.push(['gold', at(new THREE.ConeGeometry(0.024, 0.08, 8), x, 1.284, z)], ['stones', at(new THREE.IcosahedronGeometry(0.017, 0), x, 1.332, z)]);
    }
    return o;
  },
  roof: () => [
    ['mask', lathe([[0, 1.37], [0.04, 1.345], [0.15, 1.262], [0.212, 1.236], [0.236, 1.256], [0.2, 1.222], [0, 1.222]], 8)],
    ['trim', at(new THREE.CylinderGeometry(0.07, 0.08, 0.04, 8), 0, 1.205, 0)],
    ['gold', at(sphere(0.024), 0, 1.385, 0)], ['gold', at(new THREE.ConeGeometry(0.012, 0.06, 8), 0, 1.43, 0)],
  ],
  teardrop: () => [['stones', lathe([[0, 1.175], [0.06, 1.198], [0.078, 1.24], [0.056, 1.3], [0.022, 1.352], [0, 1.372]])]],
};

// ---------------------------------------------------------------- handles (the belly's and the head's swells)
function ear(side) {
  const g = new THREE.TorusGeometry(0.068, 0.018, 8, 18, deg(230)).rotateZ(deg(245));
  if (side < 0) g.rotateY(Math.PI);
  return at(g, side * (A.bellyR + 0.035), 0.53, 0);
}
function dragon() {
  const pts = [[0, 1.165, -0.2], [0, 1.12, -0.33], [0, 0.95, -0.41], [0, 0.76, -0.34], [0, 0.6, -0.33], [0, 0.46, -0.245]].map((p) => new THREE.Vector3(...p));
  const curve = new THREE.CatmullRomCurve3(pts), seg = 40, rad = 8, tube = new THREE.TubeGeometry(curve, seg, 1, rad, false);
  const P = tube.attributes.position, c = new THREE.Vector3(), v = new THREE.Vector3();
  for (let i = 0; i < P.count; i++) { const s = Math.floor(i / (rad + 1)) / seg; curve.getPointAt(s, c); v.fromBufferAttribute(P, i).sub(c).multiplyScalar(0.036 * (1 - s) + 0.011 * s).add(c); P.setXYZ(i, v.x, v.y, v.z); }
  tube.computeVertexNormals();
  const o = [['trim', tube], ['trim', at(sphere(0.048), 0, 1.17, -0.215)], ['trim', at(new THREE.ConeGeometry(0.032, 0.08, 8).rotateX(Math.PI / 2), 0, 1.175, -0.15)]];
  for (const s of [-1, 1]) {
    o.push(['trim', at(new THREE.ConeGeometry(0.011, 0.08, 6).rotateX(deg(-55)), s * 0.026, 1.225, -0.25)], ['stones', at(sphere(0.011, 8, 6), s * 0.032, 1.19, -0.19)]);
  }
  for (let k = 1; k < 7; k++) { const s = 0.12 + k * 0.11, p = curve.getPointAt(s), t = curve.getTangentAt(s), out = new THREE.Vector3(0, t.z, -t.y).normalize(); // (fins along its spine, outward)
    const f = new THREE.ConeGeometry(0.014, 0.045, 5); f.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), out)); o.push(['gold', at(f, p.x + out.x * 0.02, p.y + out.y * 0.02, p.z + out.z * 0.02)]); }
  return o;
}
const HANDLES = {
  none: () => [],
  ears: () => [['body', ear(1)], ['body', ear(-1)]],
  rings: () => [-1, 1].flatMap((s) => [
    ['gold', at(sphere(0.032).scale(0.5, 1, 1), s * (A.bellyR + 0.006), 0.52, 0)],
    ['gold', at(new THREE.TorusGeometry(0.058, 0.011, 8, 22).rotateY(Math.PI / 2), s * (A.bellyR + 0.02), 0.46, 0)],
  ]),
  dragon,
  basket: () => {
    const curve = new THREE.CatmullRomCurve3(Array.from({ length: 13 }, (_, i) => { const t = (i / 12) * Math.PI; return new THREE.Vector3(Math.cos(t) * 0.245, 0.97 + Math.sin(t) * 0.52, 0); }));
    return [['hair', new THREE.TubeGeometry(curve, 48, 0.017, 8, false)], ['trim', at(sphere(0.03), 0.243, 0.97, 0)], ['trim', at(sphere(0.03), -0.243, 0.97, 0)]];
  },
};

// ---------------------------------------------------------------- the foot (the base bone)
const FEET = {
  plain: () => [], scallop: () => [],
  gold: () => [['gold', at(new THREE.TorusGeometry(0.248, 0.017, 8, 33).rotateX(Math.PI / 2), 0, 0.03, 0)]],
  claws: () => [0, 1, 2].flatMap((k) => {
    const a = Math.PI + (k * Math.PI * 2) / 3, x = Math.sin(a), z = Math.cos(a), r = 0.27, o = [['stones', at(sphere(0.042), x * r, 0.042, z * r)]];
    const leg = new THREE.CylinderGeometry(0.02, 0.03, 0.12, 8).rotateZ(deg(28)).rotateY(a - Math.PI / 2); o.push(['gold', at(leg, x * 0.235, 0.12, z * 0.235)]);
    for (const s of [-1, 0, 1]) { const t = new THREE.ConeGeometry(0.011, 0.075, 6).rotateX(deg(150)).rotateY(a + s * 0.7); o.push(['gold', at(t, x * r + Math.sin(a + s * 0.7) * 0.03, 0.06, z * r + Math.cos(a + s * 0.7) * 0.03)]); }
    return o;
  }),
  lotus: () => Array.from({ length: A.sides }, (_, i) => ['trim', at(sphere(0.07, 10, 6).scale(0.55, 1, 0.18).rotateX(deg(-22)).translate(0, 0, 0.27).rotateY((i / A.sides) * Math.PI * 2), 0, 0.06, 0)]),
};

// ---------------------------------------------------------------- pendants (off the choker, against the shoulder)
const HANG_A = 0.62, HANG = new THREE.Vector3(Math.sin(HANG_A) * 0.124, 0.7, Math.cos(HANG_A) * 0.124), AT = new THREE.Vector3(Math.sin(HANG_A) * 0.235, 0.6, Math.cos(HANG_A) * 0.235);
const PENDANTS = {
  none: () => [],
  bell: () => [['gold', lathe([[0, 0.04], [0.012, 0.038], [0.022, 0.02], [0.028, -0.01], [0.035, -0.026], [0.03, -0.032], [0, -0.032]], 14)], ['gold', at(sphere(0.009), 0, -0.036, 0)]],
  moon: () => [['trim', new THREE.TorusGeometry(0.03, 0.01, 6, 16, deg(230)).rotateZ(deg(-25))]],
  fish: () => [['mask', sphere(0.03).scale(1.5, 0.75, 0.45)], ['mask', at(new THREE.ConeGeometry(0.026, 0.035, 6).rotateZ(deg(90)).scale(1, 1, 0.4), -0.055, 0, 0)], ['stones', at(sphere(0.006, 6, 4), 0.026, 0.008, 0.012)]],
  die: () => [['stones', new THREE.IcosahedronGeometry(0.034, 0)]],
  coin: () => [['gold', new THREE.TorusGeometry(0.026, 0.013, 4, 4).rotateZ(Math.PI / 4).scale(1, 1, 0.45)]],
  gourd: () => [['body', at(sphere(0.031), 0, -0.012, 0)], ['body', at(sphere(0.021), 0, 0.03, 0)], ['hair', at(new THREE.CylinderGeometry(0.004, 0.005, 0.02, 6), 0, 0.055, 0)]],
  tassel: () => [['hair', at(sphere(0.013), 0, 0.03, 0)], ...Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; return ['hair', at(new THREE.ConeGeometry(0.007, 0.1, 5).rotateX(Math.PI).rotateZ(Math.sin(a) * 0.12).rotateX(Math.cos(a) * 0.12), Math.sin(a) * 0.008, -0.025, Math.cos(a) * 0.008)]; })],
};

/** Merge each material's pieces into one geometry. */
function merged(out) {
  const res = {};
  for (const [mat, list] of Object.entries(out)) if (list.length) res[mat] = mergeGeometries(list, false);
  return res;
}

/** Everything but the pendant, for a look and a shape: { material: geometry }, skinned to the Jar's bones. */
export function jarParts(look, morph) {
  const out = {};
  for (const [mat, g] of (LIDS[look.lid] || LIDS.none)()) add(out, mat, skin(place(g, new THREE.Vector3(0, A.top, 0), morph, { ring: true }), { bone: 4 }));
  for (const [mat, g] of (HANDLES[look.handle] || HANDLES.none)()) {
    g.computeBoundingBox(); const c = g.boundingBox.getCenter(new THREE.Vector3());
    const anchor = look.handle === 'basket' || look.handle === 'dragon' ? null : new THREE.Vector3(Math.sign(c.x) * A.bellyR, c.y, 0);
    add(out, mat, skin(anchor ? place(g, anchor, morph) : placeLoose(g, morph), { maxBone: 3, side: look.handle !== 'dragon' }));
  }
  for (const [mat, g] of (FEET[look.foot] || FEET.plain)()) add(out, mat, skin(place(g, new THREE.Vector3(A.baseR, 0.03, 0), morph, { ring: true }), { bone: 1 }));
  return merged(out);
}
/** A part that spans the Jar (the basket's hoop, the dragon): each vertex moved as the nearest point of the Jar's surface moved. */
function placeLoose(g, morph) {
  const P = g.attributes.position, v = new THREE.Vector3(), w = new THREE.Vector3();
  for (let i = 0; i < P.count; i++) {
    v.fromBufferAttribute(P, i); const r = Math.hypot(v.x, v.z), s = r > 1e-4 ? Math.min(r, A.bellyR) / r : 0;
    w.set(v.x * s, v.y, v.z * s); const to = morph(w.clone()); v.add(to).sub(w); P.setXYZ(i, v.x, v.y, v.z);
  }
  return g;
}
/** The pendant, apart (it swings about `hang`, the choker's point it hangs from): a cord the hair's colour, then the piece. */
export function pendantParts(id, morph) {
  const list = (PENDANTS[id] || PENDANTS.none)(); if (!list.length) return { geos: {}, hang: morph(HANG.clone()) };
  const out = {}, d = AT.clone().sub(HANG), len = d.length();
  const cord = new THREE.CylinderGeometry(0.0035, 0.0035, len, 5).translate(0, -len / 2, 0).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), d.clone().normalize())).translate(HANG.x, HANG.y, HANG.z);
  add(out, 'hair', skin(place(cord, HANG, morph), { bone: 3 }));
  for (const [mat, g] of list) { g.rotateY(HANG_A).translate(AT.x, AT.y - 0.03, AT.z); add(out, mat, skin(place(g, HANG, morph), { bone: 3 })); }
  return { geos: merged(out), hang: morph(HANG.clone()) };
}
