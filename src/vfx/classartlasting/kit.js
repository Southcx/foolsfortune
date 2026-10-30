// ---------------------------------------------------------------------------------------
// THE LASTING LOOKS' KIT: the pieces the class arts' lasting looks are built from (vfx/classartlasting.js and its parts here). No program
// of its own: a mesh of ours is drawn either in the one shape program (vfx/shapes/program.js, the library's shape layers' own, warmed at
// boot) with a pattern scrolled over it, or in the Dunes' stone material's own settings (a lit, flat-shaded body of vertex colours:
// world/dunes/dunes.js `stoneMat`), so three.js finds the same two programs it already holds.
//
//   shapeMat(o, ctx) -> { mat, u }   a shape-program material for a mesh of ours: o as a shape layer's fields (main, mainK, tile, scroll,
//                                    mask, maskK, maskTile, maskScroll, flow, flowK, flowTile, flowScroll, ramp, rim, rimPow, edgeU, edgeV,
//                                    core, coreAt, glow, add, back, tint, soft); `u.uK` its strength, `u.uErode` its erosion
//   whiten(geo)        the shape program's `color` (white, opaque) on a geometry that has none
//   stoneMat()         the one lit vertex-colour material (the Dunes' stone's settings), shared by every look here
//   painted(geo, fn)   a geometry made non-indexed, uv dropped, each triangle coloured fn(centroid, normal) -> THREE.Color (itemSize 3)
//   lightLine(n, o)    a ribbon of light along n points, turned to the camera each frame: { mesh, set(points, width, camPos) }
//   groundY(game, x, z, y0)   the ground under a point (a ray down past sensors, the Courier and creatures), else y0
//   envelope(e, on, dt, inS, outS)   a look's 0..1 strength eased toward on; rng(seed)
//
// Prior art: the library's own shape layers (Simon Trümpler's scrolling-mask meshes) and the house's one stone material for the Dunes' kit.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { shapeUniforms, makeShapeMaterial } from '../shapes/program.js';
import { patternPick } from '../shapes/textures.js';
import { rampRow, rampV } from '../shapes/ramps.js';

const pick = (u, key, name, ctx, k) => {
  const p = name && name !== 'none' ? patternPick(name, ctx) : null;
  if (!p) { u[`u${key}K`].value = key === 'Main' ? 0 : u[`u${key}K`].value; return; }
  u[`u${key}Map`].value = p.tex; u[`u${key}Ch`].value.copy(p.ch); u[`u${key}K`].value = k;
};

/** A shape-program material for a mesh of ours (its fields as a shape layer's). It starts unseen: set `u.uK.value`. */
export function shapeMat(o = {}, ctx = {}) {
  const u = shapeUniforms();
  pick(u, 'Main', o.main ?? 'noise', ctx, o.mainK ?? 1);
  if (o.mask) pick(u, 'Mask', o.mask, ctx, o.maskK ?? 1);
  if (o.flow) { pick(u, 'Flow', o.flow, ctx, 1); u.uFlowK.value = o.flowK ?? 0.08; }
  const v2 = (key, a, d) => u[key].value.set(...(a ?? d));
  v2('uTileMain', o.tile, [1, 1]); v2('uScrollMain', o.scroll, [0, 0.25]); v2('uTileMask', o.maskTile, [1, 1]); v2('uScrollMask', o.maskScroll, [0, 0]);
  v2('uTileFlow', o.flowTile, [1, 1]); v2('uScrollFlow', o.flowScroll, [0, 0.4]); v2('uEdgeU', o.edgeU, [0, 0]); v2('uEdgeV', o.edgeV, [0, 0]);
  u.uSeed.value.set(Math.random(), Math.random());
  u.uRampRow.value = rampV(rampRow(o.ramp ?? 'tint', ctx));
  u.uRim.value = o.rim ?? 0; u.uRimPow.value = o.rimPow ?? 2.5; u.uSoft.value = o.soft ?? 0.12;
  u.uCore.value = o.core ?? 0; u.uCoreAt.value = o.coreAt ?? 0.85; u.uGlow.value = o.glow ?? 1.5;
  u.uAdd.value = o.add ?? 1; u.uBack.value = o.back ?? 0.5; u.uTint.value.set(o.tint ?? 0xffffff);
  u.uK.value = 0; u.uErode.value = o.erode ?? 0;
  return { mat: makeShapeMaterial(u), u };
}

/** The shape program's `color` attribute, white and opaque (a geometry without one draws black in it). */
export function whiten(geo) {
  if (!geo.attributes.color) geo.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 4).fill(1), 4));
  return geo;
}

let STONE = null;
/** The one lit vertex-colour material every body here wears: the Dunes' stone's own settings, so its program is the one already held. */
export function stoneMat() { return (STONE ||= new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.9, flatShading: true })); }

const _c = new THREE.Vector3(), _n = new THREE.Vector3(), _e1 = new THREE.Vector3(), _e2 = new THREE.Vector3(), _col = new THREE.Color();
/** A geometry made non-indexed with only position, normal and a colour a triangle: fn(centroid, faceNormal, i) -> THREE.Color. */
export function painted(geo, fn) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
  const P = g.attributes.position, n = P.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i += 3) {
    _c.set(0, 0, 0); for (let j = 0; j < 3; j++) _c.x += P.getX(i + j) / 3, _c.y += P.getY(i + j) / 3, _c.z += P.getZ(i + j) / 3;
    _e1.set(P.getX(i + 1) - P.getX(i), P.getY(i + 1) - P.getY(i), P.getZ(i + 1) - P.getZ(i));
    _e2.set(P.getX(i + 2) - P.getX(i), P.getY(i + 2) - P.getY(i), P.getZ(i + 2) - P.getZ(i));
    _n.crossVectors(_e1, _e2).normalize();
    const c = fn(_c, _n, i / 3) || _col.setRGB(1, 1, 1);
    for (let j = 0; j < 3; j++) { col[(i + j) * 3] = c.r; col[(i + j) * 3 + 1] = c.g; col[(i + j) * 3 + 2] = c.b; }
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  if (!g.attributes.normal) g.computeVertexNormals();
  return g;
}

/** A ribbon of light along a line of points, its width turned to face the camera each frame (u across it, v along it). */
export function lightLine(n, o = {}, ctx = {}) {
  const N = n + 1, pos = new Float32Array(N * 2 * 3), nor = new Float32Array(N * 2 * 3), uv = new Float32Array(N * 2 * 2), idx = [];
  for (let i = 0; i < N; i++) { uv.set([0, i / n, 1, i / n], i * 4); if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx); whiten(geo);
  const S = shapeMat({ edgeU: [0.45, 0.45], ...o }, ctx), mesh = new THREE.Mesh(geo, S.mat);
  mesh.frustumCulled = false; mesh.renderOrder = 7; mesh.userData.moodExempt = true;
  const t = new THREE.Vector3(), side = new THREE.Vector3(), view = new THREE.Vector3();
  return {
    mesh, u: S.u,
    set(pts, width, cam) {
      for (let i = 0; i < N; i++) {
        const p = pts[Math.min(i, pts.length - 1)], a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
        t.subVectors(b, a); view.subVectors(cam, p).normalize(); side.crossVectors(t, view); if (side.lengthSq() < 1e-8) side.set(1, 0, 0); side.normalize().multiplyScalar(width / 2);
        const o = i * 6; // (written in place: no array a point a frame)
        pos[o] = p.x - side.x; pos[o + 1] = p.y - side.y; pos[o + 2] = p.z - side.z; pos[o + 3] = p.x + side.x; pos[o + 4] = p.y + side.y; pos[o + 5] = p.z + side.z;
        nor[o] = nor[o + 3] = view.x; nor[o + 1] = nor[o + 4] = view.y; nor[o + 2] = nor[o + 5] = view.z;
      }
      geo.attributes.position.needsUpdate = true; geo.attributes.normal.needsUpdate = true;
    },
    dispose() { mesh.parent?.remove(mesh); geo.dispose(); S.mat.dispose(); },
  };
}

const DOWN = new THREE.Vector3(0, -1, 0), _o = new THREE.Vector3();
/** The ground under (x, z) near height y0: a ray down from 2.5 m over it, past sensors, the Courier and creatures; y0 if none. */
export function groundY(game, x, z, y0) {
  const ph = game.physics; if (!ph?.raycast) return y0;
  const hit = ph.raycast(_o.set(x, y0 + 2.5, z), DOWN, 6, game.player?.collider, undefined, (k) => !k.isSensor() && ph.entityOf?.(k)?.type !== 'creature');
  return hit ? hit.point.y : y0;
}

/** A look's strength eased toward on (1) or off (0): in over inS real s, out over outS. */
export function envelope(e, on, dt, inS = 0.35, outS = 0.45) { return on ? Math.min(1, e + dt / inS) : Math.max(0, e - dt / outS); }
/** The looks' own chance (never the simulation's: core/rng.js), the same for one seed. */
export function rng(seed = 1) { let s = seed >>> 0 || 1; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const smooth = (u) => u * u * (3 - 2 * u);
