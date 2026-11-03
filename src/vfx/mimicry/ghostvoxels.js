// ---------------------------------------------------------------------------------------
// THE MIMICRY GHOST'S CREATION (plain name; a part of the ghost, vfx/mimicry/ghost.js; docs/plans/MIMICRY.md 7, Pillar and Arch, the ruins
// stone): a creation puzzle's target is voxels (Dovina's `fr.vtarget`, progress/mimicrysculpt.js voxelSnap), not the field, so the
// ghost's sheet shows only its frame for it. This draws the creation asked, once, as the same hologram over the patch:
//   - THE BODY: the change asked (the target's densities less what already stood, `fr.vstart`) written onto a scratch VoxelGrid
//     (restoreVoxels) and meshed by its own surface nets (godhand/voxels.js mesh: the same smooth clay a raised creation is), chunk by
//     chunk into one mesh, drawn in the film: a thin wash, a bright rim where it turns from the eye, and its contours as level lines
//     every 0.2 m up the body (the topographic map's, as the sheet's), so a pillar reads as stacked rings and an arch as its span.
//   - THE COPY NEARING: where the island's own creations (game.creations.grid) already fill a point of it, that point turns gold;
//     read a few times a real second. A part hidden (inside your copy, or under the ground) is drawn as the sheet's x-ray, dashed.
//   - THE SCAN, THE SOLVE'S RING, THE FADE: the sheet's, on the same uniforms (ghost.js drives both).
// No words: a world mark. DRAWS: two (the body and its x-ray), one program for both, warmed at boot with the sheet's.
//
// Prior art: the ghost's own (the hologram table's scanned volume, the AR overlay's planned build over the site: green where it matches),
// Minecraft's structure blocks (a saved build's outline shown where it will stand), the house's surface nets (godhand/voxels.js).
//
//   const V = new VoxelGhost(game)   V.open(S) -> bool (false: no creation asked)   V.read(grid)   V.set(uniforms)   V.dispose()
//   voxelGhostMaterial({ xray })   prewarmVoxelGhost(scene) -> park
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LAB_GLSL, mindTime } from '../labradorite.js';
import { VoxelGrid, VOXEL } from '../../godhand/voxels.js';
import { restoreVoxels } from '../../progress/mimicrysculpt.js';
import { MIMIC } from '../../progress/mimicry.js';

/** The numbers: a level line every `step` m; how far in (m) a point is sampled for your copy's density; how often it is read (real s). */
export const VOXEL_GHOST = { step: 0.2, probe: 0.18, read: 0.25, scan: 3.2 };
const V = VOXEL_GHOST;

const VERT = /* glsl */`
attribute vec2 aNow;
uniform float uLift;
varying vec3 vN; varying vec3 vW; varying vec3 vView; varying vec2 vNow;
void main() {
  vec4 w = modelMatrix * vec4(position + vec3(0.0, uLift, 0.0), 1.0);
  vW = w.xyz; vView = normalize(cameraPosition - w.xyz); vN = normalize(mat3(modelMatrix) * normal); vNow = aNow;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const FRAG = /* glsl */`
uniform float uK, uXray, uT, uScan, uSolve, uStep, uHalf;
uniform vec3 uMid;
varying vec3 vN; varying vec3 vW; varying vec3 vView; varying vec2 vNow;
${LAB_GLSL}
vec2 lineAt(float f) { float d = abs(fract(f - 0.5) - 0.5) / max(fwidth(f), 1e-4); return vec2(1.0 - smoothstep(0.45, 1.15, d), 1.0 - smoothstep(1.15, 2.4, d)); }
void main() {
  vec3 n = normalize(vN); float facing = abs(dot(n, vView)), rim = pow(1.0 - facing, 2.0);
  // the level lines up the body (faded where the surface lies flat, where they would smear), and the silhouette's keyline
  vec2 L = lineAt((vW.y - uMid.y) / uStep) * (1.0 - smoothstep(0.82, 0.97, abs(n.y)));
  float sil = smoothstep(0.78, 0.95, rim); L = max(L, vec2(sil, smoothstep(0.55, 0.85, rim)));
  vec2 q = (vW.xz - uMid.xz) / (2.0 * uHalf) + 0.5;
  float diag = (q.x + q.y) * 0.5, s = fract((uT - uScan) / ${V.scan.toFixed(2)}) * 1.5 - 0.25, band = exp(-pow((diag - s) / 0.04, 2.0));
  vec3 film = labSoft(labPhase(vW, vView)), gold = vec3(1.0, 0.62, 0.16);
  vec3 c = mix(film, gold, vNow.x);
  float r = length(vW.xz - uMid.xz) / (uHalf * 1.4142), R = uSolve * 1.3;
  float ring = uSolve > 0.0 ? exp(-pow((r - R) / 0.05, 2.0)) : 0.0, behind = uSolve > 0.0 ? step(r, R) : 0.0;
  c = mix(c, gold, max(behind, ring));
  float dash = mix(1.0, step(0.45, fract((vW.x + vW.y + vW.z) * 1.6)), uXray), dim = mix(1.0, 0.42, uXray);
  float aLine = max(L.y * 0.55, L.x) * dash, core = L.x * dash;
  float aFill = (0.08 + 0.3 * rim + 0.14 * vNow.x + band * 0.08 + ring * 0.6) * dim;
  vec3 lineCol = mix(LAB_INK, c * (1.15 + 0.9 * band), smoothstep(0.0, 1.0, core / max(aLine, 1e-3)));
  float a = aLine * dim + aFill * (1.0 - aLine);
  vec3 col = (lineCol * aLine * dim + c * (1.0 + band) * aFill * (1.0 - aLine)) / max(a, 1e-3);
  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0) * uK * (1.0 - smoothstep(0.72, 1.0, uSolve)));
}`;

/** The body's material (`xray`: drawn where something hides it), one program for both. */
export function voxelGhostMaterial({ xray = false } = {}) {
  return new THREE.ShaderMaterial({
    name: xray ? 'mimicry-ghost-voxel-xray' : 'mimicry-ghost-voxel',
    uniforms: {
      uK: { value: 0 }, uXray: { value: xray ? 1 : 0 }, uT: { value: 0 }, uScan: { value: 0 }, uSolve: { value: 0 }, uLift: { value: 0 },
      uStep: { value: V.step }, uHalf: { value: MIMIC.half }, uMid: { value: new THREE.Vector3() }, uMindT: mindTime,
    },
    vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, depthTest: true,
    depthFunc: xray ? THREE.GreaterDepth : THREE.LessEqualDepth, side: THREE.DoubleSide, fog: false, forceSinglePass: true,
  });
}

/** The change asked as a snapshot: the target's densities less the start's (0 where nothing new stands). */
function changeOf(fr) {
  const T = fr.vtarget, S = fr.vstart; if (!T?.d) return null;
  const d = new Float32Array(T.d.length); let any = false;
  for (let o = 0; o < d.length; o++) { const v = Math.max(0, T.d[o] - (S?.d?.[o] ?? 0)); d[o] = v; if (v >= 0.5) any = true; }
  return any ? { ...T, d } : null;
}

/** A scratch grid's surface, every chunk and the neighbours below it (a face toward an empty chunk is meshed from that side), in one
 *  geometry with an `aNow` per vertex. */
function meshOf(grid) {
  const keys = new Set();
  for (const k of grid.keys()) { const [x, y, z] = k.split(',').map(Number); keys.add(k); keys.add(grid.key(x - 1, y, z)); keys.add(grid.key(x, y - 1, z)); keys.add(grid.key(x, y, z - 1)); }
  const parts = []; let nv = 0, ni = 0;
  for (const k of keys) { const m = grid.mesh(k); if (m) { parts.push(m); nv += m.pos.length / 3; ni += m.idx.length; } }
  if (!nv) return null;
  const pos = new Float32Array(nv * 3), idx = new Uint32Array(ni); let v = 0, i = 0;
  for (const m of parts) { pos.set(m.pos, v * 3); for (let j = 0; j < m.idx.length; j++) idx[i + j] = m.idx[j] + v; v += m.pos.length / 3; i += m.idx.length; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.computeVertexNormals();
  geo.setAttribute('aNow', new THREE.BufferAttribute(new Float32Array(nv * 2), 2).setUsage(THREE.DynamicDrawUsage));
  geo.computeBoundingSphere();
  return geo;
}

export class VoxelGhost {
  constructor(game) { this.game = game; this.group = null; this.readT = 0; }

  /** The creation asked meshed over the open puzzle's patch; false when the puzzle asks none. */
  open(S) {
    this.dispose();
    const ch = S?.fr?.family === 'creation' ? changeOf(S.fr) : null; if (!ch) return false;
    const grid = new VoxelGrid(); restoreVoxels(grid, ch);
    const geo = meshOf(grid); if (!geo) return false;
    this.geo = geo; this.mats = [voxelGhostMaterial(), voxelGhostMaterial({ xray: true })];
    const grp = (this.group = new THREE.Group()); grp.name = 'mimicry-ghost-voxel'; grp.userData.zone = 'dunes';
    this.mats.forEach((mat, i) => { mat.uniforms.uMid.value.set(S.at.x, S.at.y, S.at.z); const me = new THREE.Mesh(geo, mat); me.name = mat.name; me.renderOrder = 8 + i; me.frustumCulled = false; grp.add(me); });
    this.game.scene?.add(grp);
    this.readT = 0; this.read(this.game.creations?.grid);
    return true;
  }

  /** Your creations read into the body: gold where a point of it already stands in solid clay (sampled just inside its surface). */
  read(grid) {
    if (!this.geo || !grid) return;
    const P = this.geo.attributes.position.array, Nn = this.geo.attributes.normal.array, A = this.geo.attributes.aNow, a = A.array, s = VOXEL.size;
    for (let v = 0; v < a.length / 2; v++) {
      const x = P[v * 3] - Nn[v * 3] * V.probe, y = P[v * 3 + 1] - Nn[v * 3 + 1] * V.probe, z = P[v * 3 + 2] - Nn[v * 3 + 2] * V.probe;
      const d = grid.at(Math.round(x / s - 0.5), Math.round(y / s - 0.5), Math.round(z / s - 0.5)); // (a voxel's density sits at its centre)
      a[v * 2] = Math.min(1, Math.max(0, (d - 0.35) / 0.3));
    }
    A.needsUpdate = true;
  }

  /** The sheet's uniforms (ghost.js) laid on the body; `raw` for its own reading. */
  set(U, raw, readable) {
    if (!this.mats) return;
    for (const mat of this.mats) { const u = mat.uniforms; u.uK.value = U.k; u.uT.value = U.t; u.uSolve.value = U.solve; u.uLift.value = U.lift; u.uScan.value = U.scan; }
    if (readable && (this.readT -= raw) <= 0) { this.readT = V.read; this.read(this.game.creations?.grid); }
  }

  dispose() {
    if (this.group) this.game.scene?.remove(this.group);
    this.geo?.dispose(); for (const mat of this.mats || []) mat.dispose();
    this.group = this.geo = this.mats = null;
  }
}

/** The body's program compiled at boot beside the sheet's (a small quad, parked 50 m down); the returned function hides it. */
export function prewarmVoxelGhost(scene) {
  const geo = new THREE.PlaneGeometry(1, 1); geo.setAttribute('aNow', new THREE.BufferAttribute(new Float32Array(8), 2));
  const grp = new THREE.Group();
  for (const mat of [voxelGhostMaterial(), voxelGhostMaterial({ xray: true })]) { mat.uniforms.uK.value = 0.001; const me = new THREE.Mesh(geo, mat); me.frustumCulled = false; grp.add(me); }
  grp.position.set(0, -50, 0); grp.userData.zoneFree = true; scene.add(grp);
  return () => { grp.visible = false; };
}
