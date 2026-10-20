// ---------------------------------------------------------------------------------------
// MATTE: a lit surface that has no gloss to show drawn as Lambert, not Standard (the low-spec round, 2026-10-20: Petra's
// RENDER-INVENTORY 2.5, the junk laptop). Lambert costs 0.5 to 0.7 of Standard a lit pixel and its program half the GLSL, and the cel
// ramp and the rim (render/toon.js) are patched into both families, so a matte surface reads the same in either: what Standard adds at
// roughness 0.85 and over, with no metal and no environment, is a faint broad sheen that the 480-line present does not show.
//
// What counts as matte: roughness 0.85 or more (Standard's default 1 when unsaid), no metalness, no environment map, no roughness or
// metalness map, no clearcoat. Anything else keeps its Standard material. A material whose shader patch reads `roughnessFactor` or
// `metalnessFactor` (vfx/surfaces.js, the paint map, vfx/finish.js, a per-vertex surface like the bracelet's) is not matte to this
// module: those stay Standard, by hand.
//
// Prior art: the sixth generation's per-material lighting models (Gouraud diffuse for the world, specular only where it sells: Wind
// Waker, Dark Cloud 2), three.js's own MeshLambertMaterial (per-fragment since r145), and every engine's "unlit / diffuse-only" quality
// tier that drops the specular term from surfaces that never showed one.
//
//   isMatte(o)                  -> true when the Standard parameters o have no gloss to show
//   matteMaterial(o)            -> a MeshLambertMaterial from Standard parameters (roughness, metalness, envMapIntensity dropped)
//   litMaterial(o)              -> matteMaterial(o) when isMatte(o), else a MeshStandardMaterial(o)
//   matteFrom(m)                -> a MeshLambertMaterial carrying a loaded material's colour, maps, emissive and flags (a glTF's
//                                  Standard or Physical with no gloss: the Lantern Wisp's, whose specular is 0)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const GLOSS_KEYS = ['roughness', 'metalness', 'envMapIntensity', 'roughnessMap', 'metalnessMap', 'envMap', 'clearcoat'];

/** Do these Standard parameters have no gloss to show? */
export const isMatte = (o = {}) => (o.roughness ?? 1) >= 0.85 && !(o.metalness > 0) && !o.envMap && !o.roughnessMap && !o.metalnessMap && !(o.clearcoat > 0);

/** A MeshLambertMaterial from Standard parameters. */
export function matteMaterial(o = {}) {
  const p = { ...o };
  for (const k of GLOSS_KEYS) delete p[k];
  return new THREE.MeshLambertMaterial(p);
}

/** Lambert when matte, Standard otherwise. */
export const litMaterial = (o = {}) => (isMatte(o) ? matteMaterial(o) : new THREE.MeshStandardMaterial(o));

const CARRY = ['name', 'map', 'emissiveMap', 'emissiveIntensity', 'normalMap', 'normalMapType', 'normalScale', 'bumpMap', 'bumpScale', 'aoMap', 'aoMapIntensity',
  'lightMap', 'lightMapIntensity', 'alphaMap', 'displacementMap', 'displacementScale', 'displacementBias', 'transparent', 'opacity', 'alphaTest', 'side', 'shadowSide',
  'vertexColors', 'flatShading', 'fog', 'depthWrite', 'depthTest', 'toneMapped', 'blending', 'wireframe', 'visible', 'polygonOffset', 'polygonOffsetFactor', 'polygonOffsetUnits', 'userData'];
/** A MeshLambertMaterial with what a loaded material shows (colour, maps, emissive, flags); its gloss left behind. */
export function matteFrom(m) {
  const l = new THREE.MeshLambertMaterial();
  l.color.copy(m.color); l.emissive.copy(m.emissive);
  for (const k of CARRY) if (m[k] !== undefined) l[k] = k === 'userData' ? { ...m[k] } : m[k]?.isVector2 ? m[k].clone() : m[k];
  return l;
}
