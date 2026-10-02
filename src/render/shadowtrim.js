// ---------------------------------------------------------------------------------------
// SHADOW TRIM: a caster smaller than a texel of the shadow map casts nothing anyone can see, and still costs a draw in the shadow
// pass. The one sun shadow (render/present.js) is 1024 texels over 64 metres out in the dunes, six centimetres a texel: a chest's rivet,
// a gem, a lamp's ring, a tool's crank throw a shadow of a pixel or none. So, once the world is built, every mesh whose bounds are
// smaller than `min` (world size, its scale included) stops casting. Things made later (a spawned creature, a burst) are not touched:
// call it again on them if they are small and many.
//
// Prior art: shadow-caster culling by size (Unreal's per-primitive "cast shadow" bound to a minimum screen size, Unity's shadow
// distance and caster culling), and the sixth generation's plain rule that only the big things cast (on PS2 one blob or one projected
// shadow per character, and none for the props).
//
//   const n = trimShadows(root, 0.06)    (how many stopped casting)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const _p = new THREE.Vector3(), _s = new THREE.Vector3(), _q = new THREE.Quaternion();

export function trimShadows(root, min = 0.06) {
  let n = 0;
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!o.isMesh || !o.castShadow || o.isSkinnedMesh || o.isInstancedMesh || o.isBatchedMesh || o.userData.keepShadow) return;
    const g = o.geometry;
    if (!g.boundingSphere) g.computeBoundingSphere();
    o.matrixWorld.decompose(_p, _q, _s);
    const r = g.boundingSphere.radius * Math.max(Math.abs(_s.x), Math.abs(_s.y), Math.abs(_s.z));
    if (r < min) { o.castShadow = false; n++; }
  });
  return n;
}
