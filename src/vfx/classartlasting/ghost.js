// ---------------------------------------------------------------------------------------
// A BODY'S GHOST: the Courier's pose kept as a print and drawn later as a shape of the shape program (vfx/classartlasting/kit.js shapeMat):
// Vanish's smoke Courier is one (ink smoke in their shape), Encore's afterimage another (light in their shape, where the move was struck).
// A PRINT is cheap (a matrix a bone of each skinned part of the body, taken at the moment); the ghost's geometry is skinned from it on the
// CPU only when it is shown, once. Its UVs are cylindrical about the body's own upright (u round it, v up it, 1.9 m a turn of v), so
// a pattern scrolled in v rises up the body as smoke or light does; its `color` is white (the program's).
//
// Prior art: the house's afterimages (vfx/afterimage.js: courier/character.js snapshot, the pose baked to a mesh in world space), which this
// keeps apart in two steps so a pose can be kept without baking it (three.js SkinnedMesh.applyBoneTransform's sum, written out with the
// bone matrices stored); Devil May Cry's and Bayonetta's afterimages.
//
//   posePrint(character) -> print | null   (the posed body now: null while it is hidden)
//   ghostGeometries(print, origin) -> [BufferGeometry]   (positions relative to origin; uv, normal, color)
//   ghostMesh(geos, mat) -> Group (one mesh a part, sharing mat)   disposeGhost(group)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { whiten } from './kit.js';

const V_TURN = 1.9; // (metres of the body a whole turn of v covers: the Courier's height)
const _m = new THREE.Matrix4(), _pre = new THREE.Matrix4();
const comp = (A, i, k) => (k === 0 ? A.getX(i) : k === 1 ? A.getY(i) : k === 2 ? A.getZ(i) : A.getW(i));

/** The posed body as a print: for each skinned part, its geometry and a matrix a bone taking a bind-pose vertex straight to the world. */
export function posePrint(ch) {
  if (!ch?.model || ch.hidden) return null;
  ch.root?.updateMatrixWorld(true);
  const parts = [];
  ch.model.traverse((o) => {
    if (!o.isSkinnedMesh || o.userData.isOutline || !o.visible || !o.skeleton) return;
    const S = o.skeleton, n = S.bones.length, K = new Float32Array(n * 16);
    _pre.multiplyMatrices(o.matrixWorld, o.bindMatrixInverse);
    for (let b = 0; b < n; b++) { _m.multiplyMatrices(S.bones[b].matrixWorld, S.boneInverses[b]).premultiply(_pre).multiply(o.bindMatrix); _m.toArray(K, b * 16); }
    parts.push({ geo: o.geometry, K });
  });
  return parts.length ? parts : null;
}

/** The print skinned into geometries about `origin` (its foot): positions relative to it, normals, cylindrical UVs, white colour. */
export function ghostGeometries(print, origin) {
  const out = [];
  for (const { geo, K } of print || []) {
    const P = geo.attributes.position, SI = geo.attributes.skinIndex, SW = geo.attributes.skinWeight; if (!P || !SI || !SW) continue;
    const n = P.count, pos = new Float32Array(n * 3), uv = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i); let sx = 0, sy = 0, sz = 0;
      for (let k = 0; k < 4; k++) {
        const w = comp(SW, i, k); if (!w) continue; const e = comp(SI, i, k) * 16;
        sx += w * (K[e] * x + K[e + 4] * y + K[e + 8] * z + K[e + 12]);
        sy += w * (K[e + 1] * x + K[e + 5] * y + K[e + 9] * z + K[e + 13]);
        sz += w * (K[e + 2] * x + K[e + 6] * y + K[e + 10] * z + K[e + 14]);
      }
      const dx = sx - origin.x, dy = sy - origin.y, dz = sz - origin.z;
      pos[i * 3] = dx; pos[i * 3 + 1] = dy; pos[i * 3 + 2] = dz;
      uv[i * 2] = Math.atan2(dx, dz) / (Math.PI * 2) + 0.5; uv[i * 2 + 1] = dy / V_TURN;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    if (geo.index) g.setIndex(new THREE.BufferAttribute(geo.index.array.slice(), 1)); // (its own copy: a ghost's dispose never takes the body's index off the GPU)
    g.computeVertexNormals(); whiten(g);
    out.push(g);
  }
  return out;
}

/** The ghost as a group of meshes, one a part, all wearing `mat` (each mesh may wear its own: `mats` an array, one a layer). */
export function ghostMesh(geos, mats) {
  const G = new THREE.Group(); G.name = 'classart-ghost';
  for (const mat of [].concat(mats)) for (const g of geos) { const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 7; m.userData.moodExempt = true; G.add(m); }
  return G;
}
/** A ghost taken down: its geometries (its materials are its owner's). */
export function disposeGhost(G) { G.parent?.remove(G); const seen = new Set(); G.traverse((o) => { if (o.geometry && !seen.has(o.geometry)) { seen.add(o.geometry); o.geometry.dispose(); } }); }
