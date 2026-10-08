// ---------------------------------------------------------------------------------------
// A GARDEN TREE: a trunk of the garden's plum-dark bark, a few branches, and a leaf canopy at their ends (vfx/garden/leafcanopy.js, the
// owner's billboarded leaves in labradorite and gold). Grown, not built: the trunk leans and bends a little, flares at its foot, and its
// branches run into the crown's spheres, so the canopy hides where they end.
//
//   THE SHAPES   by its leaf: 'round' and 'mulberry' a round crown (a big sphere and two to four round it), 'willow' a crown spread wide
//                and hanging low, 'gingko' a crown stacked upward (spheres smaller as they climb), 'gill' and 'cap' Myggdrasil's (its
//                own module will lay them out; here they take the round crown)
//   ONE TREE     new GardenTree(opts): its own two meshes (the bark, the canopy)
//   A GROVE      plantGrove([{ matrix, ...opts }]): every tree's bark one mesh and every canopy one mesh, two draws for the lot
//   THE BARK     one material for every tree, a plain standard one in the plum-dark (a program the garden already has)
//
// Prior art: the stylised trees of Breath of the Wild and Ghibli's backgrounds (a soft crown on a few strong limbs), the space
// colonisation idea of branches reaching toward the crown's masses (Runions et al., 2007: here a branch per sphere, as low-poly
// trees do), and the white mulberry, the ginkgo and the weeping willow for the three silhouettes.
//
//   const T = new GardenTree({ height: 3.2, crown: 1.6, leaf: 'round', seed: 1, tint: { color, amount } })   T.group   T.canopy   T.dispose()
//   const G = plantGrove([{ matrix, height, crown, leaf, seed }])   G.bark   G.canopy   G.leaves   G.dispose()
//   treeParts(opts) -> { bark: BufferGeometry, spheres }   barkMaterial()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LeafCanopy, canopyGeometry, canopyMesh } from './leafcanopy.js';

const BARK = 0x3e2c30; // (the garden's plum-dark bark: vfx/spiritpress.js's and the hokora's wood)
let BARK_MAT = null;
/** The one bark material (shared, never disposed). */
export function barkMaterial() {
  if (BARK_MAT) return BARK_MAT;
  BARK_MAT = new THREE.MeshStandardMaterial({ name: 'garden-bark', color: BARK, roughness: 0.92, metalness: 0 }); // (a plain standard material: a program the garden already has)
  BARK_MAT.userData.shared = true;
  return BARK_MAT;
}

/** A limb from `a` to `b`, radius r0 at a and r1 at b, bowed sideways by `bow` (m). */
function limb(a, b, r0, r1, bow, rnd) {
  const len = a.distanceTo(b), g = new THREE.CylinderGeometry(1, 1, 1, 7, 4, true), P = g.attributes.position;
  const side = rnd() * Math.PI * 2;
  for (let i = 0; i < P.count; i++) {
    const f = P.getY(i) + 0.5, r = THREE.MathUtils.lerp(r0, r1, f) * (1 + 0.06 * Math.sin(P.getX(i) * 9 + f * 11)), bend = bow * Math.sin(Math.PI * f);
    P.setXYZ(i, P.getX(i) * r + Math.cos(side) * bend, f * len, P.getZ(i) * r + Math.sin(side) * bend);
  }
  g.deleteAttribute('uv'); g.computeVertexNormals();
  const q = new THREE.Quaternion().setFromUnitVectors(_y, _d.copy(b).sub(a).normalize());
  g.applyMatrix4(new THREE.Matrix4().compose(a, q, _one));
  return g;
}

/** A tree's bark (one geometry, in its own frame: +Y up, its foot at the origin) and its crown's spheres. */
export function treeParts({ height = 3.2, crown = 1.6, leaf = 'round', seed = 1, lean = 0.08 } = {}) {
  const rnd = lcg(seed * 131 + 7), yaw = rnd() * Math.PI * 2, geos = [];
  const r0 = Math.max(0.12, crown * 0.13), top = new THREE.Vector3(Math.sin(yaw) * lean * height, height, Math.cos(yaw) * lean * height);
  geos.push(limb(new THREE.Vector3(0, -0.35, 0), top, r0, r0 * 0.6, height * 0.04, rnd));
  for (let i = 0; i < 4; i++) { const a = yaw + (i / 4) * Math.PI * 2 + rnd() * 0.5, f = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)); geos.push(limb(f.clone().multiplyScalar(r0 * 0.6).setY(0.35), f.clone().multiplyScalar(r0 * 2.6).setY(-0.25), r0 * 0.55, r0 * 0.2, 0.02, rnd)); } // (the foot's flare: roots into the ground)
  const spheres = [], kind = leaf;
  if (kind === 'gingko') {
    const n = 3; for (let k = 0; k < n; k++) { const r = crown * (1 - k * 0.24), c = top.clone().add(new THREE.Vector3((rnd() - 0.5) * 0.3 * crown, crown * (0.15 + k * 0.85), (rnd() - 0.5) * 0.3 * crown)); spheres.push({ c, r }); }
    geos.push(limb(top, spheres[n - 1].c.clone(), r0 * 0.6, r0 * 0.25, 0.05, rnd)); // (the leader runs up through the crown)
  } else {
    const willow = kind === 'willow', main = { c: top.clone().add(new THREE.Vector3(0, crown * (willow ? 0.2 : 0.55), 0)), r: crown };
    spheres.push(main);
    const n = 2 + Math.floor(rnd() * 3);
    for (let k = 0; k < n; k++) {
      const a = yaw + (k / n) * Math.PI * 2 + (rnd() - 0.5) * 0.7, out = crown * (willow ? 1.05 : 0.8), y = willow ? -crown * (0.15 + rnd() * 0.35) : crown * (0.05 + rnd() * 0.4);
      spheres.push({ c: top.clone().add(new THREE.Vector3(Math.cos(a) * out, y, Math.sin(a) * out)), r: crown * (willow ? 0.7 : 0.58 + rnd() * 0.17) });
    }
  }
  for (const s of spheres.slice(kind === 'gingko' ? 1 : 0)) { // (a branch toward each sphere, ending inside it)
    const from = top.clone().lerp(new THREE.Vector3(0, 0, 0), 0.12 + rnd() * 0.15), to = from.clone().lerp(s.c, 0.8);
    geos.push(limb(from, to, r0 * 0.45, r0 * 0.15, s.r * 0.12, rnd));
  }
  const bark = mergeGeometries(geos, false); geos.forEach((g) => g.dispose());
  return { bark, spheres };
}

/** One tree: its bark and its canopy, standing on its origin. */
export class GardenTree {
  constructor(opts = {}) {
    const { bark, spheres } = treeParts(opts);
    this.group = new THREE.Group(); this.group.name = 'garden-tree';
    this.bark = new THREE.Mesh(bark, barkMaterial()); this.bark.castShadow = this.bark.receiveShadow = true; this.group.add(this.bark);
    this.canopy = new LeafCanopy({ spheres, leaf: opts.leaf || 'round', density: opts.density ?? 1, seed: opts.seed ?? 1, tint: opts.tint || null });
    this.group.add(this.canopy.mesh);
  }
  tint(color, amount = 1) { this.canopy.tint(color, amount); }
  dispose() { this.group.parent?.remove(this.group); this.bark.geometry.dispose(); this.canopy.dispose(); }
}

/** Many trees as two meshes: every bark in one, every canopy in one. Each entry: `matrix` (where it stands) and treeParts' options;
 *  `slot` (a tint's, vfx/garden/leafcanopy.js canopySlot) if its canopy is to take one. */
export function plantGrove(entries) {
  const barks = [], crowns = [];
  for (const E of entries) {
    const { bark, spheres } = treeParts(E); bark.applyMatrix4(E.matrix); barks.push(bark);
    crowns.push({ spheres, matrix: E.matrix, leaf: E.leaf || 'round', density: E.density ?? 1, seed: E.seed ?? 1, slot: E.slot ?? 0 });
  }
  const bark = new THREE.Mesh(mergeGeometries(barks, false), barkMaterial()); barks.forEach((g) => g.dispose());
  bark.name = 'garden-bark'; bark.castShadow = bark.receiveShadow = true;
  const geo = canopyGeometry(crowns), canopy = canopyMesh(geo);
  return { bark, canopy, leaves: geo.userData.leaves, dispose() { bark.parent?.remove(bark); canopy.parent?.remove(canopy); bark.geometry.dispose(); geo.dispose(); } };
}

function lcg(seed) { let a = Math.floor(Math.abs(seed) * 1000) % 2147483647 || 7; return () => ((a = (a * 16807) % 2147483647) / 2147483647); }
const _y = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3(), _one = new THREE.Vector3(1, 1, 1);
