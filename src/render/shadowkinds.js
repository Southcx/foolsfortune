// ---------------------------------------------------------------------------------------
// SHADOW KINDS: one depth material a kind of caster, so the shadow pass stops re-choosing its program between casters.
//   three draws every caster of the sun's shadow with one shared depth material (WebGLShadowMap's _depthMaterial). Its program depends
//   on what draws it (a skinned mesh, a batch, an instanced mesh, a plain one, a batch with colours or without), and three re-checks
//   it each time the kind changes from one caster to the next: a parameters object, a cache key built and joined, the uniform list
//   rebuilt. Measured in the workshop (v258): 8 changes of kind a frame (and 9 more re-checks of the batches': render/threefixes.js).
//   So a skinned, batched or instanced caster answers `customDepthMaterial` with a depth material of its own kind, shared by every
//   caster of that kind: each keeps its program, the program is the same one three compiled before (a program is found by its key,
//   never by its material), and nothing new is compiled. A caster whose shadow needs its own copy (an alpha-tested map, a displacement
//   map, clipping planes, several materials) answers nothing and keeps three's own path. A mesh given a `customDepthMaterial` keeps it.
//
// Prior art: three's own per-variant depth materials (WebGLShadowMap's _materialCache, keyed by what changes the program), here keyed
//   by the caster's kind instead of its material.
//
//   installShadowKinds()    (once, before the first frame)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const made = () => new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }); // (as three's own _depthMaterial)
const K = { skinned: made(), batched: made(), batchedColour: made(), instanced: made(), instancedColour: made() };
const SKINNED_MORPH = new Map(); // (a skinned caster with morph targets: one a count and the attributes they move, as the program needs)

/** Does this caster's shadow need three's own copy of the depth material (its map's alpha, a displacement, clipping)? */
function own(m) {
  return !m || Array.isArray(m) || ((m.map || m.alphaMap) && m.alphaTest > 0) || (m.displacementMap && m.displacementScale !== 0) || (m.clipShadows && m.clippingPlanes?.length);
}
const morphs = (g) => g.morphAttributes.position?.length || g.morphAttributes.normal?.length || g.morphAttributes.color?.length || 0;

function skinned(o) {
  if (own(o.material)) return undefined;
  const g = o.geometry, n = morphs(g); if (!n) return K.skinned;
  const key = n * 4 + (g.morphAttributes.normal ? 2 : 0) + (g.morphAttributes.color ? 1 : 0); // (three's morphTargetsCount, morphNormals, morphColors)
  let m = SKINNED_MORPH.get(key); if (!m) SKINNED_MORPH.set(key, (m = made()));
  return m;
}
const batched = (o) => (own(o.material) || morphs(o.geometry) ? undefined : o.colorTexture ? K.batchedColour : K.batched);
const instanced = (o) => (own(o.material) || morphs(o.geometry) || o.morphTexture ? undefined : o.instanceColor ? K.instancedColour : K.instanced);

/** A getter on the kind's prototype; a mesh given its own material keeps it (an own property shadows the getter). */
function kindOf(proto, pick) {
  Object.defineProperty(proto, 'customDepthMaterial', {
    configurable: true,
    get() { return pick(this); },
    set(v) { Object.defineProperty(this, 'customDepthMaterial', { value: v, writable: true, configurable: true, enumerable: true }); },
  });
}

let installed = false;
export function installShadowKinds() {
  if (installed) return; installed = true;
  kindOf(THREE.SkinnedMesh.prototype, skinned);
  kindOf(THREE.BatchedMesh.prototype, batched);
  kindOf(THREE.InstancedMesh.prototype, instanced);
}
