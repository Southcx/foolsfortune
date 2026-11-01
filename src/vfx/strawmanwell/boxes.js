// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S BOXES, READ BACK: the stage kit (world/strawmanwell/stagekit.js, Dovina's) merges a lane's placeholder boxes by colour
// into one mesh a colour; a look that dresses a colour finds that mesh, reads every box back out of it (each a BoxGeometry laid
// non-indexed: 36 vertices, its faces +x, -x, +y, -y, +z, -z in that order, 6 vertices each), draws its own thing for each, and hides the
// placeholder (its outline hull is a child and goes with it). The colliders are the kit's and stay as they are: a look never moves a
// surface. A box made `own` (a spool that changes colour, a door that slides) is a mesh of its own: `ownBoxes` hands back the mesh with
// its box so a look can ride it (a child of it), keeping whatever the mechanics do to it (moved, recoloured).
//
// Prior art: the Sandbox's hall look (vfx/sandbox/hall.js: Dovina's placeholders found by colour, their geometry reused).
//
//   laneGroup(well, laneId) -> Group   mergedOf(well, laneId, color) -> Mesh | null   boxesOf(mesh) -> [box]   ownBoxes(well, laneId, color) -> [{ mesh, box }]
//   hide(mesh)   box: { c: Vector3, ax: Vector3, ay: Vector3, az: Vector3 (unit axes), w, h, d (sizes along them, m) }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The lane's group (`strawmanwell.<laneId>`, the kit's), or null. */
export const laneGroup = (W, id) => W?.room?.getObjectByName(`strawmanwell.${id}`) ?? null;

const colorOf = (m) => (m.material && !Array.isArray(m.material) && m.material.color ? m.material.color.getHex() : null);
const isMerged = (m) => m.isMesh && !m.userData.isOutline && m.geometry && !m.geometry.index && m.geometry.attributes.position.count % 36 === 0;

/** The lane's merged mesh of one placeholder colour (COLOR, stagekit.js), or null. */
export function mergedOf(W, id, color) {
  const gr = laneGroup(W, id); if (!gr) return null;
  return gr.children.find((m) => isMerged(m) && colorOf(m) === color) ?? null;
}

const _p = new THREE.Vector3();
/** Every box in a merged mesh (world space: the kit bakes the boxes' places into the geometry, the mesh itself at the origin). */
export function boxesOf(mesh) {
  if (!mesh) return [];
  mesh.updateWorldMatrix(true, false);
  const P = mesh.geometry.attributes.position, N = mesh.geometry.attributes.normal, n = P.count / 36, out = [];
  const nm = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
  for (let b = 0; b < n; b++) {
    const o = b * 36;
    const ax = new THREE.Vector3().fromBufferAttribute(N, o).applyMatrix3(nm).normalize();
    const ay = new THREE.Vector3().fromBufferAttribute(N, o + 12).applyMatrix3(nm).normalize();
    const az = new THREE.Vector3().fromBufferAttribute(N, o + 24).applyMatrix3(nm).normalize();
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity], axes = [ax, ay, az];
    for (let v = 0; v < 36; v++) {
      _p.fromBufferAttribute(P, o + v).applyMatrix4(mesh.matrixWorld);
      for (let k = 0; k < 3; k++) { const t = _p.dot(axes[k]); if (t < lo[k]) lo[k] = t; if (t > hi[k]) hi[k] = t; }
    }
    const c = new THREE.Vector3();
    for (let k = 0; k < 3; k++) c.addScaledVector(axes[k], (lo[k] + hi[k]) / 2);
    out.push({ c, ax, ay, az, w: hi[0] - lo[0], h: hi[1] - lo[1], d: hi[2] - lo[2] });
  }
  return out;
}

/** The lane's own-mesh boxes of one colour (a box made `own`: a BoxGeometry of its size, placed by the mesh), each with its mesh. */
export function ownBoxes(W, id, color) {
  const gr = laneGroup(W, id); if (!gr) return [];
  const out = [];
  gr.traverse((m) => {
    if (!m.isMesh || m.userData.isOutline || colorOf(m) !== color || !m.geometry?.parameters || m.geometry.type !== 'BoxGeometry') return;
    const { width: w, height: h, depth: d } = m.geometry.parameters;
    out.push({ mesh: m, box: { w, h, d } });
  });
  return out;
}

/** A placeholder put out of sight (its outline hull with it); its body, if any, untouched. */
export function hide(mesh) { if (mesh) mesh.visible = false; }
