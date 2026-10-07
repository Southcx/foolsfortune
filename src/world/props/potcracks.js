// ---------------------------------------------------------------------------
// Crack lines on intact pots. A crack is a jagged random walk in the pot's
// surface parameters (profile arc-length u, angle), mapped onto the faceted
// mesh and drawn as a thin tapered ribbon. Kintsugi repairs re-draw the same
// paths in gold.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { PALETTE } from '../../core/config.js';
import { surfaceGrid, facetPoint, locateOnPot } from './pottery.js';
import { stream } from '../../core/rng.js';
const simRand = stream('world/props/potcracks'); // (the simulation's chance: core/rng.js, the same twice)


export const crackMat = new THREE.MeshBasicMaterial({ color: PALETTE.outline, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
// (no environment map in the scene, so a truly metallic gold would render near-black: fake it bright)
export const goldMat = new THREE.MeshStandardMaterial({ color: 0xffc65c, metalness: 0.15, roughness: 0.3, emissive: 0xc27414, emissiveIntensity: 0.9,
  side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });

const _p = new THREE.Vector3(), _n = new THREE.Vector3();

function gridOf(P) { return P._grid || (P._grid = surfaceGrid(P)); }

/** A jagged path from (u, ang). Returns [{ p: Vector3, n: Vector3 }], plus branches. */
function walk(P, u, ang, len, heading, out, depth = 0) {
  const grid = gridOf(P);
  const step = THREE.MathUtils.clamp(len / 9, 0.012, 0.05);
  const pts = [];
  let th = heading;
  for (let d = 0; d <= len; d += step) {
    const p = facetPoint(P, grid, u, ang, new THREE.Vector3());
    // outward: radial on walls, up on the rim/base caps
    _n.set(p.x, 0, p.z);
    if (_n.lengthSq() < 1e-6) _n.set(0, 1, 0); else _n.normalize();
    pts.push({ p: p.addScaledVector(_n, 0.0015), n: _n.clone() });
    th += (simRand() - 0.5) * 1.1; // jagged
    const r = Math.max(0.03, Math.hypot(p.x, p.z));
    u += Math.cos(th) * step;
    ang += (Math.sin(th) * step) / r;
    if (u < 0.004 || u > P.len - 0.004) break;
    if (depth < 1 && pts.length > 2 && simRand() < 0.14) walk(P, u, ang, len * 0.45, th + (simRand() < 0.5 ? 0.9 : -0.9), out, depth + 1);
  }
  if (pts.length > 1) out.push(pts);
}

/** New crack paths spreading from a local-space point. */
export function crackPaths(P, local, n, len) {
  const { u, ang } = locateOnPot(P, local);
  const out = [];
  for (let k = 0; k < n; k++) walk(P, u, ang, len * (0.6 + simRand() * 0.6), (k / n) * Math.PI * 2 + simRand() * 0.8, out);
  return out;
}

/** Random crack paths anywhere on the pot (for kintsugi seams on a rebuilt pot). */
export function randomPaths(P, n, len) {
  const out = [];
  for (let k = 0; k < n; k++) {
    const u = P.len * (0.15 + simRand() * 0.75), ang = simRand() * Math.PI * 2;
    walk(P, u, ang, len * (0.7 + simRand() * 0.6), simRand() * Math.PI * 2, out);
  }
  return out;
}

/** Tapered ribbons along the paths (width in metres at the crack's origin). */
export function ribbonGeometry(paths, width) {
  const pos = [];
  const side = new THREE.Vector3(), tan = new THREE.Vector3();
  for (const path of paths) {
    const L = path.length;
    const edges = path.map((pt, i) => {
      const a = path[Math.max(0, i - 1)].p, b = path[Math.min(L - 1, i + 1)].p;
      tan.subVectors(b, a).normalize();
      side.crossVectors(pt.n, tan).normalize();
      const w = width * (1 - 0.75 * (i / (L - 1))) * (0.7 + simRand() * 0.6);
      return [pt.p.clone().addScaledVector(side, w / 2), pt.p.clone().addScaledVector(side, -w / 2)];
    });
    for (let i = 0; i < L - 1; i++) {
      const [a, b] = edges[i], [c, d] = edges[i + 1];
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, b.x, b.y, b.z, d.x, d.y, d.z, c.x, c.y, c.z);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

/**
 * Keeps an ent's crack ribbons (dark cracks + gold seams) as children of its mesh.
 * ent.cracks = { dark: [...paths], gold: [...paths], darkMesh, goldMesh }
 */
export function setCracks(ent, { dark, gold }) {
  const c = ent.cracks || (ent.cracks = { dark: [], gold: [] });
  if (dark) c.dark = dark;
  if (gold) c.gold = gold;
  const size = Math.max(0.3, ent.size || 0.5);
  for (const [key, mat, w] of [['dark', crackMat, 0.006], ['gold', goldMat, 0.011]]) {
    const meshKey = `${key}Mesh`;
    if (c[meshKey]) { ent.mesh.remove(c[meshKey]); c[meshKey].geometry.dispose(); c[meshKey] = null; }
    if (!c[key].length) continue;
    const m = new THREE.Mesh(ribbonGeometry(c[key], w * Math.sqrt(size / 0.5)), mat);
    m.userData.isCrack = true;
    ent.mesh.add(m);
    c[meshKey] = m;
  }
}
