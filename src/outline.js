import * as THREE from 'three';
import { PALETTE, T } from './config.js';

// Inverted-hull outlines, same trick as the Solidify+Outline setup in the .blend.
// A back-face-only copy of the mesh is pushed out along a *smoothed* normal so
// hard edges (flat-shaded lowpoly) don't crack open.

const outlineUniform = { value: T.visual.outline };
export function setOutlineThickness(v) { outlineUniform.value = v; }

function makeOutlineMaterial(fpHide = false) {
  const m = new THREE.MeshBasicMaterial({ color: PALETTE.outline, side: THREE.BackSide });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uOutline = outlineUniform;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 smoothNormal;\nuniform float uOutline;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normalize(smoothNormal) * uOutline;');
    if (fpHide) applyFpHide(shader);
  };
  m.customProgramCacheKey = () => (fpHide ? 'outline-fphide' : 'outline');
  return m;
}

// First-person arm-armor hiding: vertices tagged with `fpHide` (skin weight on
// arm bones) are discarded while uFpHide = 1 so the bulky plates don't block ADS.
export const fpHideUniform = { value: 0 };
export function applyFpHide(shader) {
  shader.uniforms.uFpHide = fpHideUniform;
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nattribute float fpHide;\nvarying float vFpHide;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFpHide = fpHide;');
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nuniform float uFpHide;\nvarying float vFpHide;')
    .replace('void main() {', 'void main() {\n  if (uFpHide > 0.5 && vFpHide > 0.35) discard;');
}

export const OUTLINE_MAT = makeOutlineMaterial();
export const OUTLINE_MAT_FPHIDE = makeOutlineMaterial(true);

/** Adds a `smoothNormal` attribute (normals averaged across coincident vertices). */
export function ensureSmoothNormals(geometry) {
  if (geometry.attributes.smoothNormal) return geometry;
  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  const pos = geometry.attributes.position;
  const nrm = geometry.attributes.normal;
  const map = new Map();
  const key = (i) => `${Math.round(pos.getX(i) * 1e4)},${Math.round(pos.getY(i) * 1e4)},${Math.round(pos.getZ(i) * 1e4)}`;
  const acc = [];
  for (let i = 0; i < pos.count; i++) {
    const k = key(i);
    let a = map.get(k);
    if (!a) { a = [0, 0, 0]; map.set(k, a); }
    a[0] += nrm.getX(i); a[1] += nrm.getY(i); a[2] += nrm.getZ(i);
    acc.push(a);
  }
  const out = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const a = acc[i];
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    out[i * 3] = a[0] / l; out[i * 3 + 1] = a[1] / l; out[i * 3 + 2] = a[2] / l;
  }
  geometry.setAttribute('smoothNormal', new THREE.BufferAttribute(out, 3));
  return geometry;
}

/** Returns the outline mesh (added as a child of `mesh`). Works for Mesh and SkinnedMesh. */
export function addOutline(mesh, material = OUTLINE_MAT) {
  ensureSmoothNormals(mesh.geometry);
  let o;
  if (mesh.isSkinnedMesh) {
    o = new THREE.SkinnedMesh(mesh.geometry, material);
    o.bind(mesh.skeleton, mesh.bindMatrix);
    o.bindMode = mesh.bindMode;
    // keep it in the same space as the source skinned mesh
    mesh.parent.add(o);
    o.position.copy(mesh.position); o.quaternion.copy(mesh.quaternion); o.scale.copy(mesh.scale);
  } else {
    o = new THREE.Mesh(mesh.geometry, material);
    mesh.add(o);
  }
  o.castShadow = false;
  o.receiveShadow = false;
  o.userData.isOutline = true;
  o.frustumCulled = mesh.frustumCulled;
  mesh.userData.outline = o;
  return o;
}
