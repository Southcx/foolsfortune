// ---------------------------------------------------------------------------------------
// THE JAR'S SHAPE (plain name): the owner's Pneuka Jar mesh (assets/pneuka.glb: a lathe of 22 sides on five bones, root > base > belly >
// chest > lid) bent into another of its family, as a vertex morph of the owner's own vertices, never a replacement: taller, squatter, a
// gourd waist, faceted, melon-lobed; and its foot ring scalloped. Done on the bind pose on the CPU, once a change (the clips skin what
// it gives; no morph target, so the program is the one the vessel's finish already compiled). Its parts (vfx/pneukajar/parts.js) and
// the bracelet's choker ask `morph` where a point of the owner's Jar went, so they sit where they sat. Also the jar's anatomy every
// part of the look reads: which bone a height rides (`boneAt`), which of the vessel's regions it is (`regionAt`, kintsugi's crack
// regions), and the partition of the body into the kiln's regions (`partition`: the trim's bands, the mask's face, the body's swells).
//
// Prior art: the potter's own reshaping of a thrown form (drawn up, settled, pinched, faceted with a knife, pressed into lobes: Goryeo's
// melon ewers), the lathe as a profile turned (a surface of revolution: r(y) and its angle), and the morph of a game character's sliders
// (one mesh, its vertices moved: The Sims' and Soulcalibur's creators).
//
//   const f = jarMorph(shapeId, footId, phase)   f(v: Vector3) -> v moved (in place)
//   morphGeometry(geometry, f)   (keeps its bind positions in geometry.userData.jarBind; the identity puts them back exactly)
//   boneAt(y) -> 1..4   regionAt(y) -> kintsugi region (0 mask, 1 torso, 4 a leg)   partition(geometry) -> groups body 0, trim 1, mask 2
//   seamPhase(geometry) -> the angle of the lathe's first column   JAR_ANATOMY (the owner's heights and radii)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { ensureSmoothNormals } from '../../render/outline.js';
import { weld } from '../../render/weld.js';

/** The owner's Jar, measured from its lathe (pneuka.glb's rows): its heights and radii, model units (it stands 1.2 tall). */
export const JAR_ANATOMY = {
  top: 1.2, mouthR: 0.096, lipY: 1.17, neckY: 0.723, neckR: 0.114, waistY: 0.235, waistR: 0.125, bellyY: 0.45, bellyR: 0.242,
  headY: 0.95, headR: 0.232, shoulderY: 0.82, footR: 0.257, baseR: 0.231, sides: 11,
};
const A = JAR_ANATOMY;
const G = (y, c, s) => Math.exp(-(((y - c) / s) ** 2));
const smooth = THREE.MathUtils.smoothstep;

/** Which bone a height of the Jar rides (its skin's: the base below the waist, the belly to the neck, the chest the head, the lid above). */
export const boneAt = (y) => (y < 0.25 ? 1 : y < 0.72 ? 2 : y < 1.14 ? 3 : 4);
/** Which of the vessel's crack regions a height is (courier/vessel/damage.js REGIONS: the face the mask's, the foot a leg's). */
export const regionAt = (y) => (y > 0.74 ? 0 : y < 0.21 ? 4 : 1);

/** The angle of the lathe's first column (where its facets and lobes are laid from). */
export function seamPhase(geo) {
  const P = geo.userData.jarBind?.pos || geo.attributes.position.array;
  for (let i = 0; i < P.length; i += 3) if (Math.hypot(P[i], P[i + 2]) > 0.05) return Math.atan2(P[i], P[i + 2]);
  return 0;
}

/** Where a point of the owner's Jar goes in a shape (and a foot): a function moving a Vector3 in place. */
export function jarMorph(shape = 'owner', foot = 'plain', phase = 0) {
  const n = A.sides, step = (Math.PI * 2) / n;
  return (v) => {
    let r = Math.hypot(v.x, v.z), y = v.y; const th = Math.atan2(v.x, v.z);
    if (r < 1e-5) { v.y = shapeY(shape, y); return v; }
    let k = 1;
    if (shape === 'tall') { k = 0.93; y *= 1.15; }
    else if (shape === 'squat') { k = 1.1; y *= 0.85; }
    else if (shape === 'gourd') k = 1 + 0.16 * G(y, A.bellyY, 0.11) + 0.12 * G(y, A.headY, 0.13) - 0.28 * G(y, A.waistY, 0.045) - 0.22 * G(y, A.neckY, 0.045);
    else if (shape === 'faceted') { const a = ((((th - phase) % step) + step) % step) - step / 2; k = Math.cos(step / 2) / Math.cos(a) * (1 - 0.02); k = 1 + (k - 1) * (1 - smooth(v.y, 1.15, 1.2)); }
    else if (shape === 'melon') { const w = smooth(v.y, 0.27, 0.34) * (1 - smooth(v.y, 0.64, 0.69)) + smooth(v.y, 0.78, 0.84) * (1 - smooth(v.y, 1.08, 1.14)); k = 1 + 0.06 * w * Math.cos(n * (th - phase)) - 0.02 * w; }
    if (foot === 'scallop') { const w = 1 - smooth(v.y, 0.06, 0.12); k *= 1 + 0.07 * w * Math.cos(n * (th - phase)); }
    r *= k;
    v.x = Math.sin(th) * r; v.z = Math.cos(th) * r; v.y = y;
    return v;
  };
}
const shapeY = (shape, y) => (shape === 'tall' ? y * 1.15 : shape === 'squat' ? y * 0.85 : y);

/** Bend a geometry of the Jar by `f` from its bind positions (kept the first time); the identity puts back its own normals. */
export function morphGeometry(geo, f, identity = false) {
  const P = geo.attributes.position, N = geo.attributes.normal;
  const B = (geo.userData.jarBind ||= { pos: P.array.slice(), nrm: N.array.slice() });
  const v = new THREE.Vector3();
  for (let i = 0; i < P.count; i++) { v.fromArray(B.pos, i * 3); if (!identity) f(v); v.toArray(P.array, i * 3); }
  P.needsUpdate = true;
  if (identity) { N.array.set(B.nrm); N.needsUpdate = true; }
  else {
    geo.computeVertexNormals();
    const { rep } = weld(P), acc = new Float32Array(P.count * 3); // (the lathe's seam welded: no crease down its back)
    for (let i = 0; i < P.count; i++) { const r = rep[i] * 3; acc[r] += N.getX(i); acc[r + 1] += N.getY(i); acc[r + 2] += N.getZ(i); }
    for (let i = 0; i < P.count; i++) { const r = rep[i] * 3; v.set(acc[r], acc[r + 1], acc[r + 2]).normalize(); N.setXYZ(i, v.x, v.y, v.z); }
    N.needsUpdate = true;
  }
  geo.deleteAttribute('smoothNormal'); ensureSmoothNormals(geo); // (the outline's hull follows: render/outline.js)
  geo.computeBoundingBox(); geo.computeBoundingSphere();
}

/** The body cut into the kiln's regions by height (once): the trim's bands (the foot, the waist's line, the neck's line, the lip), the
 *  mask on the face's swell, the body the rest. Its triangles reordered so each is one group: body 0, trim 1, mask 2. */
export function partition(geo) {
  if (geo.userData.jarParts) return;
  const P = geo.attributes.position, I = geo.index, tri = I.count / 3, out = [[], [], []];
  for (let t = 0; t < tri; t++) {
    const a = I.getX(t * 3), b = I.getX(t * 3 + 1), c = I.getX(t * 3 + 2), y = (P.getY(a) + P.getY(b) + P.getY(c)) / 3;
    const trim = y < 0.07 || (y > 0.2 && y < 0.27) || (y > 0.69 && y < 0.76) || y > 1.16;
    out[trim ? 1 : y > 0.76 ? 2 : 0].push(a, b, c);
  }
  const all = new (I.array.constructor)(I.count); let o = 0;
  geo.clearGroups();
  out.forEach((list, k) => { all.set(list, o); geo.addGroup(o, list.length, k); o += list.length; });
  geo.setIndex(new THREE.BufferAttribute(all, 1));
  geo.userData.jarParts = true;
}
