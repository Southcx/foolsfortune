import * as THREE from 'three';
import { PALETTE, T } from './config.js';
import { weld } from './render/weld.js';

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


/** Adds a `smoothNormal` attribute (normals averaged across coincident vertices). */
export function ensureSmoothNormals(geometry) {
  if (geometry.attributes.smoothNormal) return geometry;
  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  const pos = geometry.attributes.position, nrm = geometry.attributes.normal;
  const { rep } = weld(pos); // (integer spatial hash: render/weld.js)
  const n = pos.count, acc = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const r = rep[i] * 3; acc[r] += nrm.getX(i); acc[r + 1] += nrm.getY(i); acc[r + 2] += nrm.getZ(i); }
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = rep[i] * 3, x = acc[r], y = acc[r + 1], z = acc[r + 2], l = Math.hypot(x, y, z) || 1;
    out[i * 3] = x / l; out[i * 3 + 1] = y / l; out[i * 3 + 2] = z / l;
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

export const OUTLINE_MAT_FPHIDE = withFade(makeOutlineMaterial(true), 'ol-fphide');
export const OUTLINE_MAT_CHAR = withFade(makeOutlineMaterial(), 'ol-char');

// Screen-door fade for the player character when the 3rd-person camera is
// squeezed against a wall (dithered discard keeps it opaque/sortable).
export const fadeUniform = { value: 1 };
export function withFade(material, key) {
  const prev = material.onBeforeCompile;
  material.onBeforeCompile = (shader, r) => {
    prev?.call(material, shader, r);
    shader.uniforms.uFade = fadeUniform;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uFade;')
      .replace('void main() {', `void main() {
  if (uFade < 0.999) {
    vec2 c = floor(mod(gl_FragCoord.xy, 4.0));
    float b = mod(c.x * 8.0 + c.y * 4.0 + mod(c.x + c.y * 2.0, 4.0) * 1.0, 16.0) / 16.0;
    if (uFade <= b) discard;
  }`);
  };
  const prevKey = material.customProgramCacheKey?.bind(material);
  material.customProgramCacheKey = () => `${prevKey ? prevKey() : ''}-fade-${key}`;
  return material;
}

/** Pulsing see-through outline used for marked things (own thickness, no depth test). */
export function makeGlowOutline(color, thickness, xray = false) {
  // rim: a depth-tested glowing hull. xray: the same hull drawn only where it is
  // hidden behind something (GreaterDepth), so marked things show through walls.
  const m = new THREE.MeshBasicMaterial({ color, side: xray ? THREE.FrontSide : THREE.BackSide, transparent: true, opacity: xray ? 0.22 : 0.8,
    depthTest: true, depthWrite: false, blending: THREE.AdditiveBlending });
  if (xray) m.depthFunc = THREE.GreaterDepth;
  const th = { value: thickness };
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uOutline = th;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 smoothNormal;\nuniform float uOutline;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normalize(smoothNormal) * uOutline;');
  };
  m.customProgramCacheKey = () => (xray ? 'glow-xray' : 'glow-outline');
  return m;
}
