// ---------------------------------------------------------------------------------------
// VERTEX PAINTING (`VertexPaint`, game.vertexPaint): a room's mood lamps baked into its static geometry, per vertex, so they need no
// real light. A TRIAL (the owner, 2026-10-20, via Dovina: "Who need real lights anyway am I right?"): off by default, run by the debug
// command `/vertexpaint [zone]` (`/vertexpaint off` undoes it). The numbers it was judged on are at the end of this header.
//
// What is baked, per vertex of the zone's merged static meshes (level.js finalizeStatic: one mesh a colour, zone and 64 m cell):
//   bakedLight.rgb = [shadow] x AO x sum over the lamps of colour x intensity x three's own point-light falloff x N.L   (irradiance, linear)
//                  + tint x AO                                                                                    (an optional bounce fill)
//   bakedLight.a   = AO, which also darkens the hemisphere and ambient light by `aoAmbient` (0.5: corners and contact, not a black room)
// and added to the lit shader's `irradiance` just before `lights_fragment_end`, so it goes through the same Lambert BRDF as a real
// PointLight's diffuse: with AO and shadows switched off the bake is the budget's lamps exactly (minus their small specular at the
// statics' roughness 0.92). It is a custom attribute and a chained `onBeforeCompile`, not `vertexColors`: three's vertex colour
// multiplies the albedo, which would also tint the sun and the sky's light; a lamp's light is added, never multiplied.
//
// Large faces are tessellated first (a 40 m floor is two triangles, and a lamp's pool between four corners is no pool at all: Gouraud's
// problem): every triangle within a lamp's reach is split along its longest edge until no edge is over `maxEdge` (4 m), every
// attribute interpolated (the paint map's charts, the outline's smooth normals). AO is a cosine-weighted hemisphere of rays per vertex
// and the lamps' shadows one ray from each lamp to the vertex, both against the physics world's fixed colliders (Rapier's query BVH: the
// static level's boxes, no BVH of our own to build). `maxEdge` 4 m: the basement's lamps fall off over 34 to 60 m, so 4 m carries the
// pool; 1.25 m took the zone's statics from 32k to 843k triangles (and its frame up 75%), 4 m to 144k.
// Shadows are OFF by default: the real lamps cast none, so the course's lamps light the hub through its walls today (one zone is one
// "room" to the budget), and that light is part of the look. Baked with shadows the hub's walls lost 34% of their lamp light and its
// floor 60% (measured): physically right, but a different room. `shadows: true` is there for a room built to be lit that way.
//
// Prior art (taken: the per-vertex sum, the tessellation, AO by hemisphere rays, a fixed baked term added to the dynamic light):
//   - Quake (1996) and Half-Life (1998): light baked offline, per surface (lightmaps), dynamic lights only for what moves; GoldSrc's
//     models lit per vertex from the nearest light. The split here is the same: the room baked, the Courier and the props still lit live.
//   - The PS1 and PS2 (the sixth generation, this project's performance spec): prelit vertex colours, the geometry tessellated where the
//     light needed resolution (Silent Hill 2, Ico's rooms, Jak and Daxter's "vertex lighting with baked AO").
//   - three.js `vertexColors` (examples/webgl_geometry_colors) and the `aoMap`; per-vertex AO by hemisphere ray casting as in
//     Blender's "Bake vertex colours: Ambient Occlusion" and Unity's ProBuilder vertex AO (Kontrast's / Iñigo Quílez's cosine sampling).
//
// What it does NOT do (and why it is a trial): the light budget's slots are compiled into every lit shader (render/lightbudget.js), so a
// lamp switched off frees a slot but no pixel gets cheaper; the per-pixel win comes only with fewer slots, a restart and a whole world
// baked (graphics.js `lightSlots`). Dynamic things in a baked room (the Courier, the pots, the clapperjars) lose the lamps' light unless a
// probe or one real lamp is kept for them. See docs/handoffs/petra/2026-10-20-from-calissa-vertex-paint.md.
//
//   game.vertexPaint = new VertexPaint(game)    .bake('basement', opts) -> stats    .unbake('basement')    .stats
//   bakeMeshes(meshes, { lamps, ao, shadows, maxEdge, tint, aoAmbient, castRay })   (pure enough to reuse in a builder at load)
//
// MEASURED (2026-10-20, Calissa's trial; the basement's hub at High, SwiftShader, draw ms, medians of 3 alternations; the table is in
// docs/handoffs/petra/2026-10-20-from-calissa-vertex-paint.md): live lamps 8 slots 662; baked at 4 m 8 slots 808 (+22%), 2 slots 740
// (+12%); baked untessellated 8 slots 652 (-2%, noise), 2 slots 583 (-12%); live 2 slots 593 (-10%, the look lost). Programs +2.
// The bake is free; the lamps off save nothing at 8 slots; fewer slots save ~10%; the tessellation costs more than that on a CPU
// rasteriser. It does not pay at High as the game stands: kept off by default, for Low and Minimum's few slots and a game-wide slot cut.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER } from '../core/physics.js';
import { zoneOf } from '../render/zones.js';

const KEY = 'bakedLight';
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _n = new THREE.Vector3(), _l = new THREE.Vector3();

/** Split a non-indexed geometry's triangles along their longest edge until no edge is over maxEdge (only those `want(tri)` says). */
export function tessellate(geo, maxEdge, want = () => true) {
  if (geo.index) geo = geo.toNonIndexed(); // (the ground floor's is indexed: its triangles are read three vertices at a time)
  const names = Object.keys(geo.attributes), src = names.map((n) => geo.attributes[n]), pos = geo.attributes.position;
  const out = names.map(() => []), m2 = maxEdge * maxEdge;
  const vert = (i) => src.map((a) => { const v = []; for (let k = 0; k < a.itemSize; k++) v.push(a.array[i * a.itemSize + k]); return v; });
  const mid = (p, q) => p.map((a, j) => a.map((x, k) => (x + q[j][k]) / 2));
  const pi = names.indexOf('position');
  const d2 = (p, q) => { const a = p[pi], b = q[pi]; return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2; };
  const emit = (v) => v.forEach((a, j) => out[j].push(...a));
  const split = (A, B, C, depth) => {
    const ab = d2(A, B), bc = d2(B, C), ca = d2(C, A), mx = Math.max(ab, bc, ca);
    if (mx <= m2 || depth > 14) { emit(A); emit(B); emit(C); return; }
    if (mx === ab) { const M = mid(A, B); split(A, M, C, depth + 1); split(M, B, C, depth + 1); }
    else if (mx === bc) { const M = mid(B, C); split(A, B, M, depth + 1); split(A, M, C, depth + 1); }
    else { const M = mid(C, A); split(A, B, M, depth + 1); split(M, B, C, depth + 1); }
  };
  for (let t = 0; t < pos.count; t += 3) {
    const A = vert(t), B = vert(t + 1), C = vert(t + 2);
    if (want(A[pi], B[pi], C[pi])) split(A, B, C, 0); else { emit(A); emit(B); emit(C); }
  }
  const g = new THREE.BufferGeometry();
  names.forEach((n, j) => { const a = src[j]; g.setAttribute(n, new THREE.BufferAttribute(new a.array.constructor(out[j]), a.itemSize, a.normalized)); });
  g.computeBoundingBox(); g.computeBoundingSphere();
  return g;
}

/** A cosine-weighted hemisphere of n directions round +z (a golden spiral: the same pattern every bake, no seed to keep). */
function hemisphere(n) {
  const dirs = [], ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) { const r = Math.sqrt((i + 0.5) / n), a = i * ga; dirs.push([r * Math.cos(a), r * Math.sin(a), Math.sqrt(1 - r * r)]); }
  return dirs;
}

/** three r170's point-light falloff (lights_pars_begin getDistanceAttenuation), so a baked lamp is the real one. */
const falloff = (d, cut, decay) => { let f = 1 / Math.max(Math.pow(d, decay), 0.01); if (cut > 0) { const x = Math.min(Math.max(1 - (d / cut) ** 4, 0), 1); f *= x * x; } return f; };

/** Bake the lamps into the meshes (world-space geometry: the level's merged statics stand at the origin). Returns counts. */
export function bakeMeshes(meshes, { lamps, ao = { samples: 12, radius: 2.5 }, shadows = false, maxEdge = 4, tint = null, castRay }) {
  const dirs = ao ? hemisphere(ao.samples) : [];
  const cache = new Map(); let verts = 0, rays = 0;
  const reach = (A, B, C) => lamps.some((L) => {
    const r = L.distance > 0 ? L.distance : 60;
    const cx = (A[0] + B[0] + C[0]) / 3 - L.pos.x, cy = (A[1] + B[1] + C[1]) / 3 - L.pos.y, cz = (A[2] + B[2] + C[2]) / 3 - L.pos.z;
    const ext = Math.sqrt(Math.max((A[0] - B[0]) ** 2 + (A[1] - B[1]) ** 2 + (A[2] - B[2]) ** 2, (B[0] - C[0]) ** 2 + (B[1] - C[1]) ** 2 + (B[2] - C[2]) ** 2, (C[0] - A[0]) ** 2 + (C[1] - A[1]) ** 2 + (C[2] - A[2]) ** 2));
    return Math.sqrt(cx * cx + cy * cy + cz * cz) < r + ext;
  });
  const t = new THREE.Vector3(), bt = new THREE.Vector3();
  const done = [];
  for (const mesh of meshes) {
    mesh.updateMatrixWorld(true);
    const old = mesh.geometry, geo = maxEdge > 0 ? tessellate(old, maxEdge, reach) : (old.index ? old.toNonIndexed() : old.clone());
    geo.applyMatrix4(mesh.matrixWorld); // (baked in world space, put back after)
    const P = geo.attributes.position, N = geo.attributes.normal, out = new Float32Array(P.count * 4);
    for (let i = 0; i < P.count; i++) {
      _a.fromBufferAttribute(P, i); _n.fromBufferAttribute(N, i).normalize();
      const key = `${Math.round(_a.x * 200)},${Math.round(_a.y * 200)},${Math.round(_a.z * 200)},${Math.round(_n.x * 20)},${Math.round(_n.y * 20)},${Math.round(_n.z * 20)}`;
      let c = cache.get(key);
      if (!c) {
        verts++;
        // AO: the hemisphere round the normal, each ray that meets a fixed collider within the radius counted, nearer counted more
        let occ = 0;
        if (ao) {
          t.set(Math.abs(_n.x) < 0.9 ? 1 : 0, Math.abs(_n.x) < 0.9 ? 0 : 1, 0).cross(_n).normalize(); bt.crossVectors(_n, t);
          _b.copy(_a).addScaledVector(_n, 0.03);
          for (const [x, y, z] of dirs) {
            _l.set(0, 0, 0).addScaledVector(t, x).addScaledVector(bt, y).addScaledVector(_n, z);
            const hit = castRay(_b, _l, ao.radius); rays++;
            if (hit != null) occ += 1 - (hit / ao.radius) * 0.5;
          }
          occ /= dirs.length;
        }
        const aoK = 1 - occ;
        let r = 0, g = 0, b = 0;
        for (const L of lamps) {
          _l.subVectors(L.pos, _a); const d = _l.length();
          if (L.distance > 0 && d >= L.distance) continue;
          const ndl = _n.dot(_l) / d; if (ndl <= 0) continue;
          // the lamp's shadow: one ray from the lamp toward the vertex (from open air, so a vertex in a wall's corner is not "inside")
          if (shadows) { _b.copy(L.pos); _l.multiplyScalar(-1 / d); const hit = castRay(_b, _l, d - 0.12); rays++; if (hit != null) continue; }
          const f = falloff(d, L.distance, L.decay) * ndl * L.intensity * aoK;
          r += L.color.r * f; g += L.color.g * f; b += L.color.b * f;
        }
        if (tint) { r += tint.r * aoK; g += tint.g * aoK; b += tint.b * aoK; }
        c = Number.isFinite(r + g + b + aoK) ? [r, g, b, aoK] : [0, 0, 0, 1]; cache.set(key, c);
      }
      out.set(c, i * 4);
    }
    geo.applyMatrix4(new THREE.Matrix4().copy(mesh.matrixWorld).invert());
    geo.setAttribute(KEY, new THREE.BufferAttribute(out, 4));
    done.push({ mesh, old, geo });
  }
  return { done, verts, rays };
}

/** The lit material taught to add the baked light (one program per base program: the cache key says `vpaint`). Undo restores it. */
export function paintMaterial(m, aoAmbient = 0.5) {
  if (m.userData.vertexPaint) return;
  const prev = m.onBeforeCompile, prevKey = m.customProgramCacheKey;
  m.userData.vertexPaint = { prev, prevKey };
  m.onBeforeCompile = (sh, r) => {
    prev?.call(m, sh, r);
    sh.vertexShader = `attribute vec4 ${KEY};\nvarying vec4 vBakedLight;\n` + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n  vBakedLight = ${KEY};`);
    sh.fragmentShader = 'varying vec4 vBakedLight;\n' + sh.fragmentShader.replace('#include <lights_fragment_end>',
      `irradiance = irradiance * mix(1.0, vBakedLight.a, ${aoAmbient.toFixed(3)}) + vBakedLight.rgb;\n#include <lights_fragment_end>`);
  };
  m.customProgramCacheKey = () => `vpaint|${prevKey ? prevKey.call(m) : ''}`;
  m.needsUpdate = true;
}
export function unpaintMaterial(m) {
  const u = m.userData.vertexPaint; if (!u) return;
  m.onBeforeCompile = u.prev; m.customProgramCacheKey = u.prevKey; delete m.userData.vertexPaint; m.needsUpdate = true;
}

export class VertexPaint {
  constructor(game) { this.game = game; this.zones = new Map(); this.stats = null; }

  /** The zone's static lamps (top-level PointLights the budget holds, lit) and its merged statics (the level's: dressed, lit, not moving). */
  find(zone) {
    const g = this.game, lamps = [], meshes = [];
    for (const l of g.lights?.proxies || []) {
      if (!l.isPointLight || l.parent !== g.scene || !l.userData.wants?.() || l.intensity <= 0.001) continue;
      if (zoneOf(l.position) !== zone) continue;
      lamps.push(l);
    }
    for (const o of g.scene.children) if (o.isMesh && o.userData.zone === zone && o.material?.isMeshStandardMaterial && o.material.userData.surface && !o.material.transparent) meshes.push(o);
    return { lamps, meshes };
  }

  /** opts: { ao: { samples, radius } | null, shadows, maxEdge, tint: THREE.Color (irradiance), aoAmbient } */
  bake(zone = 'basement', opts = {}) {
    if (this.zones.has(zone)) this.unbake(zone);
    const g = this.game, t0 = performance.now();
    const { lamps, meshes } = this.find(zone);
    const world = g.physics?.world || g.game?.physics?.world;
    const ray = new RAPIER.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });
    const flags = RAPIER.QueryFilterFlags.ONLY_FIXED | RAPIER.QueryFilterFlags.EXCLUDE_SENSORS;
    const castRay = (o, d, max) => { ray.origin = { x: o.x, y: o.y, z: o.z }; ray.dir = { x: d.x, y: d.y, z: d.z }; const h = world.castRay(ray, max, true, flags); return h ? h.timeOfImpact ?? h.toi : null; };
    const L = lamps.map((l) => ({ pos: l.getWorldPosition(new THREE.Vector3()), color: l.color.clone(), intensity: l.intensity, distance: l.distance, decay: l.decay }));
    const res = bakeMeshes(meshes, { lamps: L, castRay, ...opts });
    const before = meshes.reduce((n, m) => n + m.geometry.attributes.position.count / 3, 0);
    for (const { mesh, geo } of res.done) { mesh.geometry = geo; paintMaterial(mesh.material, opts.aoAmbient ?? 0.5); }
    for (const l of lamps) l.visible = false; // (the proxy's own setter: the budget stops lending it a slot; lightbudget.js adopt)
    const after = res.done.reduce((n, d) => n + d.geo.attributes.position.count / 3, 0);
    this.zones.set(zone, { lamps, done: res.done });
    this.stats = { zone, lamps: lamps.length, meshes: meshes.length, trisBefore: before, trisAfter: after, verts: res.verts, rays: res.rays, ms: Math.round(performance.now() - t0) };
    return this.stats;
  }

  unbake(zone = 'basement') {
    const z = this.zones.get(zone); if (!z) return false;
    for (const { mesh, old, geo } of z.done) { mesh.geometry = old; geo.dispose(); unpaintMaterial(mesh.material); }
    for (const l of z.lamps) l.visible = true;
    this.zones.delete(zone);
    return true;
  }
}
