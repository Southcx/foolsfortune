// ---------------------------------------------------------------------------------------
// THE TOY CITY (docs/plans/MECHS.md 9.1; South, 2026-11-02: "a strong showcase of environmental destruction elements ... think
// incredible hulk's ultimate destruction for Ps2, or even the voxel carving mechanic we've already shown for fossils"): the proving
// ground's buildings as voxel volumes, built from Dovina's rules (progress/mechs/destruction.js: newBuilding, carve, collapse) on every
// lot of CITY.lots, one cell a metre. A blow strikes them as a shape in the world (a fist a ball, the boost a capsule, the clap a cone,
// the beam a ray): the shape is put into each building's cells, carved, the collapse run, and what came loose flies as chunks.
//   each building one merged mesh, a face only where a cell meets air, vertex-coloured by material, flat shaded; re-meshed only when
//     it changed (a frame's carves gathered into one re-mesh)
//   a chunk flies whole (one merged mesh of its cells), falling from where it stood and tumbling a little, onto what stands under it
//     in its own building or the ground; on the way it may land on the straw giant or the mech (fallBlow: its mass and the height it
//     fell); then it breaks into the voxel batch's debris (game.voxels), or, a slab of CHUNK.keep.mass t or more that fell softly, it
//     stays as a prop to pick up (props.js, through onChunk)
//   a steel-framed building felled leaves a girder (props.js, through onGirder)
//   the mech stands on it and is stopped by it: solidAt (any standing cell in a footprint between two heights), topAt (the top under it)
// Built with the proving ground and taken down with it (hangar.js): the city is whole on every visit. A toy: no cubes.
//
// Prior art: The Incredible Hulk: Ultimate Destruction (every building breakable, the chunks as weapons), Teardown (voxels carved by
// shape, what is left unsupported falling whole), Red Faction Guerrilla (supports and collapse), Rampage, Minecraft's face culling (a
// face only between a block and air), the spirit slab's bench at a mech's scale (progress/slabs.js), the voxel batch's debris
// (vfx/voxels/voxelbatch.js: Resogun's cubes).
//
//   const C = new ToyCity(hangar)   C.build(into)   C.teardown()   C.update(dt, raw)   C.built   C.recs [{ i, id, label, b, cx, cz, ... }]
//   C.strike(shape | worldPoint, k, by = 'courier') -> { cells, chunks, felled: [rec], buildings }   (shape, in world metres:
//     { kind: 'ball' | 'capsule' | 'cone' | 'ray', at, to?, dir?, r, angle?, only? ('glass': only cells of that material) })
//   C.solidAt(x, z, y0, y1, r = 0) -> bool   C.topAt(x, z, below = Infinity, r = 0) -> world y | null   C.raycast(from, dir, max) -> { point, rec } | null
//   C.onChunk(chunk) (a slab kept: { mesh, mass, at })   C.onGirder(at) (hooks the hangar sets)   CITY_LOOK   CHUNK
//   events: city.break { building, lot, cells, chunks, at, by }, city.felled { building, lot, label, topple, by },
//   city.land { mass, height, k, on ('ground' | 'building' | 'giant' | 'mech'), by }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { stream } from '../../core/rng.js';
import { MATERIALS, MAT, CITY, BUILDINGS, SCORE, newBuilding, carve, collapse, cellsLeft, felled, fallBlow } from '../../progress/mechs/destruction.js';
import { VoxelBatch } from '../../vfx/voxels/voxelbatch.js';
import { PROVING } from './layout.js';
import { GIANT_LOOK } from './giant.js';
import { MECH_BODY, heightOf } from './mech.js';

/** The placeholder look (Calissa dresses it: the clay city's brick, glass and steel): a colour a material, each cell's lightness moved by
 *  up to `jitter` so a wall reads as cells, the glass paler and a touch glossier. */
export const CITY_LOOK = {
  colour: { glass: 0xc8e4f2, timber: 0x8a5a34, brick: 0xb0603e, stone: 0x8c8a84, steel: 0x4c5866 },
  jitter: 0.09,
};
/** A chunk in flight: gravity (m/s², real), its tumble (rad/s at most, a little: a slab falls flat more than it spins), and what it
 *  becomes on landing: a prop when it is `keep.mass` t or more (a slab: techniques.js PROPS.chunk.shield's rule), fell under
 *  `keep.fall` m (soft enough to stay whole) and is no more than `keep.most` t (more than a mech's hands could lift: rubble); else
 *  debris, at most `debris` voxels a chunk (a tower's top sampled, each voxel then bigger), living `life` real s. A carve throws
 *  `chips` voxels a broken cell (at most `chipsMax` a strike). */
export const CHUNK = { g: 9.81, tumble: 0.5, keep: { mass: 8, fall: 6, most: 40 }, debris: 900, life: [1.1, 2.2], chips: 1, chipsMax: 260 };

const MAT_ID = (m) => MATERIALS[m]?.id;
const R = stream('world/hangar/city');
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _c = new THREE.Color();

/** The six faces of a unit cell (its corners at ±0.5), each wound counter-clockwise seen from outside (checked by its cross product). */
const FACES = [];
for (const [ax, sg] of [[0, 1], [0, -1], [1, 1], [1, -1], [2, 1], [2, -1]]) {
  const u = (ax + 1) % 3, w = (ax + 2) % 3, quad = [], n = [0, 0, 0]; n[ax] = sg;
  for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const p = [0, 0, 0]; p[ax] = sg * 0.5; p[u] = a * 0.5; p[w] = b * 0.5; quad.push(p); }
  const e1 = quad[1].map((v, i) => v - quad[0][i]), e2 = quad[2].map((v, i) => v - quad[0][i]);
  const cr = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
  if (cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] < 0) quad.reverse();
  FACES.push({ n, quad });
}
const hash = (x, y, z) => { let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

/** One merged geometry of cells: `cells` [[x, y, z, mat]], `solid(x, y, z)` (is a neighbour there), `o` the cell space's offset (a
 *  cell's centre at its index + o). A face is drawn only where a cell meets air (Minecraft's culling); the ground's face never. */
function meshCells(cells, solid, o, ground = true) {
  const pos = [], nor = [], col = [], idx = [];
  for (const [x, y, z, m] of cells) {
    const base = CITY_LOOK.colour[MAT_ID(m)] ?? 0xffffff; _c.setHex(base).multiplyScalar(1 + CITY_LOOK.jitter * (hash(x, y, z) * 2 - 1));
    for (const F of FACES) {
      const nx = x + F.n[0], ny = y + F.n[1], nz = z + F.n[2];
      if (solid(nx, ny, nz) || (ground && ny < 0)) continue;
      const v0 = pos.length / 3;
      for (const q of F.quad) { pos.push(x + o[0] + q[0], y + o[1] + q[1], z + o[2] + q[2]); nor.push(...F.n); col.push(_c.r, _c.g, _c.b); }
      idx.push(v0, v0 + 1, v0 + 2, v0, v0 + 2, v0 + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeBoundingSphere();
  return g;
}

export class ToyCity {
  constructor(hangar) { this.hangar = hangar; this.game = hangar.game; this.built = false; this.recs = []; this.chunks = []; this.onChunk = null; this.onGirder = null; }

  /** Every lot built as its building, whole, into `into` (the proving ground's group). */
  build(into) {
    if (this.built) return;
    const A = PROVING.at;
    this.into = into; this.group = new THREE.Group(); this.group.name = 'toycity'; into.add(this.group);
    this.mat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.88, metalness: 0.05 });
    this.recs = CITY.lots.map((L, i) => {
      const b = newBuilding(L.id, i + 1), s = L.yaw ? -1 : 1, cx = A.x + L.x, cz = A.z + L.z;
      const rec = { i, id: L.id, label: BUILDINGS[L.id].label, b, s, cx, cz, yaw: L.yaw || 0, dirty: true, felled: false, mesh: null,
        x0: cx - b.w / 2, x1: cx + b.w / 2, z0: cz - b.d / 2, z1: cz + b.d / 2, y0: A.y, y1: A.y + b.h };
      return rec;
    });
    this.remesh();
    this.built = true;
  }
  teardown() {
    if (!this.built) return;
    for (const r of this.recs) r.mesh?.geometry.dispose();
    for (const c of this.chunks) c.mesh.geometry.dispose();
    this.group?.parent?.remove(this.group); this.mat?.dispose(); this.own?.dispose();
    this.recs = []; this.chunks = []; this.group = null; this.mat = null; this.own = null; this.built = false;
  }

  // ------------------------------------------------------------------ cells and the world
  /** A world point into a building's cells (continuous: a cell's centre at its index). */
  toCell(rec, x, y, z) { const b = rec.b; return [rec.s * (x - rec.cx) + b.w / 2 - 0.5, y - PROVING.at.y - 0.5, rec.s * (z - rec.cz) + b.d / 2 - 0.5]; }
  cellWorld(rec, x, y, z, out) { const b = rec.b; return out.set(rec.cx + rec.s * (x + 0.5 - b.w / 2), PROVING.at.y + y + 0.5, rec.cz + rec.s * (z + 0.5 - b.d / 2)); }
  matAt(rec, x, y, z) { const b = rec.b; return x >= 0 && y >= 0 && z >= 0 && x < b.w && y < b.h && z < b.d ? b.mat[x + b.w * (z + b.d * y)] : 0; }
  near(rec, x, z, r) { return x > rec.x0 - r && x < rec.x1 + r && z > rec.z0 - r && z < rec.z1 + r; }

  /** The building's mesh made again from its cells (in its lot's frame: the mesh turned by its yaw). */
  meshOf(rec) {
    const b = rec.b, cells = [];
    for (let y = 0; y < b.h; y++) for (let z = 0; z < b.d; z++) for (let x = 0; x < b.w; x++) { const m = b.mat[x + b.w * (z + b.d * y)]; if (m) cells.push([x, y, z, m]); }
    const geo = meshCells(cells, (x, y, z) => !!this.matAt(rec, x, y, z), [0.5 - b.w / 2, 0.5, 0.5 - b.d / 2]);
    if (!rec.mesh) {
      rec.mesh = new THREE.Mesh(geo, this.mat); rec.mesh.name = `toycity.${rec.id}.${rec.i}`;
      rec.mesh.position.set(rec.cx, PROVING.at.y, rec.cz); rec.mesh.rotation.y = rec.yaw; rec.mesh.castShadow = rec.mesh.receiveShadow = true;
      this.group.add(rec.mesh);
    } else { rec.mesh.geometry.dispose(); rec.mesh.geometry = geo; }
    rec.dirty = false;
  }
  remesh() { for (const r of this.recs) if (r.dirty) this.meshOf(r); }

  /** Any standing cell inside a footprint (a circle of `r` m at x, z) between world heights y0 and y1? (the mech's wall) */
  solidAt(x, z, y0, y1, r = 0) {
    for (const rec of this.recs) {
      if (!this.near(rec, x, z, r) || y1 < rec.y0 || y0 > rec.y1) continue;
      const [px, , pz] = this.toCell(rec, x, 0, z), lo = Math.max(0, Math.floor(y0 - PROVING.at.y)), hi = Math.min(rec.b.h - 1, Math.floor(y1 - PROVING.at.y - 1e-3));
      for (let cx = Math.floor(px - r), X = Math.ceil(px + r); cx <= X; cx++) for (let cz = Math.floor(pz - r), Z = Math.ceil(pz + r); cz <= Z; cz++) {
        const dx = Math.max(0, Math.abs(px - cx) - 0.5), dz = Math.max(0, Math.abs(pz - cz) - 0.5); if (dx * dx + dz * dz > r * r) continue;
        for (let y = lo; y <= hi; y++) if (this.matAt(rec, cx, y, cz)) return true;
      }
    }
    return false;
  }
  /** The highest top (world y) of standing cells under a footprint, no higher than `below` (what the mech stands on: a roof, a floor, a
   *  stub of rubble), or null where nothing stands. */
  topAt(x, z, below = Infinity, r = 0) {
    let best = null;
    for (const rec of this.recs) {
      if (!this.near(rec, x, z, r)) continue;
      const [px, , pz] = this.toCell(rec, x, 0, z), cap = Math.min(rec.b.h, Math.floor(below - PROVING.at.y + 1e-3));
      for (let cx = Math.floor(px - r), X = Math.ceil(px + r); cx <= X; cx++) for (let cz = Math.floor(pz - r), Z = Math.ceil(pz + r); cz <= Z; cz++) {
        const dx = Math.max(0, Math.abs(px - cx) - 0.5), dz = Math.max(0, Math.abs(pz - cz) - 0.5); if (dx * dx + dz * dz > r * r) continue;
        for (let y = cap - 1; y >= 0; y--) if (this.matAt(rec, cx, y, cz)) { const top = PROVING.at.y + y + 1; if (best === null || top > best) best = top; break; }
      }
    }
    return best;
  }
  /** The first standing cell along a line (0.5 m steps), or null within `max` m. */
  raycast(from, dir, max) {
    const cand = this.recs.filter((rec) => { const ex = from.x + dir.x * max, ez = from.z + dir.z * max; return Math.max(from.x, ex) > rec.x0 - 1 && Math.min(from.x, ex) < rec.x1 + 1 && Math.max(from.z, ez) > rec.z0 - 1 && Math.min(from.z, ez) < rec.z1 + 1; });
    if (!cand.length) return null;
    for (let t = 0; t <= max; t += 0.5) {
      const x = from.x + dir.x * t, y = from.y + dir.y * t, z = from.z + dir.z * t;
      for (const rec of cand) {
        if (!this.near(rec, x, z, 0) || y < rec.y0 || y > rec.y1) continue;
        const [cx, cy, cz] = this.toCell(rec, x, y, z);
        if (this.matAt(rec, Math.round(cx), Math.round(cy), Math.round(cz))) return { point: new THREE.Vector3(x, y, z), rec, t };
      }
    }
    return null;
  }

  // ------------------------------------------------------------------ the strike
  /** Does a world shape reach a building's box at all? */
  reaches(rec, S) {
    const r = S.r ?? 2, at = S.at;
    if (S.kind === 'ball') return this.near(rec, at.x, at.z, r) && at.y - r < rec.y1 && at.y + r > rec.y0;
    if (S.kind === 'capsule') { const to = S.to; return Math.max(at.x, to.x) > rec.x0 - r && Math.min(at.x, to.x) < rec.x1 + r && Math.max(at.z, to.z) > rec.z0 - r && Math.min(at.z, to.z) < rec.z1 + r && Math.min(at.y, to.y) - r < rec.y1; }
    const len = S.kind === 'cone' ? r * 4 : 200; // (a cone reaches four times its r: destruction.js carve's cone falloff)
    const qx = Math.max(rec.x0, Math.min(rec.x1, at.x)), qz = Math.max(rec.z0, Math.min(rec.z1, at.z));
    if (Math.hypot(qx - at.x, qz - at.z) > len) return false;
    const dx = rec.cx - at.x, dz = rec.cz - at.z, d = Math.hypot(dx, dz) || 1, half = Math.hypot(rec.b.w, rec.b.d) / 2;
    const c = (dx * S.dir.x + dz * S.dir.z) / (d * (Math.hypot(S.dir.x, S.dir.z) || 1));
    return c >= Math.cos(Math.min(Math.PI, (S.kind === 'cone' ? S.angle ?? 0.6 : 0.05) + Math.atan2(half + (S.kind === 'ray' ? r : 0), d)));
  }
  /** The world shape put into a building's cells (destruction.js carve's shape). */
  cellShape(rec, S) {
    const at = this.toCell(rec, S.at.x, S.at.y, S.at.z), out = { kind: S.kind, at, r: S.r ?? 2, angle: S.angle };
    if (S.to) out.to = this.toCell(rec, S.to.x, S.to.y, S.to.z);
    if (S.dir) { const n = Math.hypot(S.dir.x, S.dir.y, S.dir.z) || 1; out.dir = [(rec.s * S.dir.x) / n, S.dir.y / n, (rec.s * S.dir.z) / n]; }
    return out;
  }

  /** A blow on the city: carved out of every building it reaches, the collapse run, the chunks flown, a felled building said once. */
  strike(shape, k, by = 'courier') {
    const S = shape?.isVector3 ? { kind: 'ball', at: shape, r: 2 } : shape, out = { cells: 0, chunks: 0, felled: [], buildings: 0 };
    if (!this.built || !S?.at || !(k > 0)) return out;
    const g = this.game, only = S.only ? MAT[S.only] : 0;
    for (const rec of this.recs) {
      if (!this.reaches(rec, S)) continue;
      const b = rec.b, before = cellsLeft(b), keep = only ? { mat: b.mat.slice(), hp: b.hp.slice() } : null;
      let { broke, cracked } = carve(b, this.cellShape(rec, S), k);
      if (keep) { // (only one material: every other cell the shape reached put back as it was)
        for (const i of [...broke, ...cracked]) if (keep.mat[i] !== only) { b.mat[i] = keep.mat[i]; b.hp[i] = keep.hp[i]; }
        broke = broke.filter((i) => keep.mat[i] === only);
      }
      if (!broke.length) continue;
      const chunks = collapse(b); rec.dirty = true; out.buildings++;
      const loose = chunks.reduce((a, c) => a + c.cells.length, 0);
      this.chips(rec, broke, keep);
      g.events?.emit('city.break', { building: rec.id, lot: rec.i, cells: broke.length, chunks: chunks.length, at: [Math.round(S.at.x), Math.round(S.at.y), Math.round(S.at.z)], by });
      for (const c of chunks) this.fly(rec, c, by);
      out.cells += broke.length; out.chunks += chunks.length;
      if (!rec.felled && (b.fallen || felled(b))) {
        rec.felled = true; out.felled.push(rec);
        g.events?.emit('city.felled', { building: rec.id, lot: rec.i, label: rec.label, topple: broke.length + loose >= SCORE.topple * before, by });
        if (BUILDINGS[rec.id].frame === MAT.steel) this.onGirder?.(new THREE.Vector3(rec.cx, PROVING.at.y, rec.cz + Math.sign(PROVING.at.z - rec.cz || 1) * (rec.b.d / 2 + 5))); // (a steel frame leaves a girder on its street side)
      }
    }
    return out;
  }

  /** The debris of a carve: a voxel a broken cell (up to CHUNK.chipsMax), thrown out, in its material's colour. */
  chips(rec, broke, keep) {
    const V = this.voxels(); if (!V) return;
    const n = Math.min(broke.length, CHUNK.chipsMax), b = rec.b;
    for (let k = 0; k < n; k++) {
      const i = broke[Math.floor((k * broke.length) / n)], x = i % b.w, r = (i - x) / b.w, z = r % b.d, y = (r - z) / b.d;
      const m = keep ? keep.mat[i] : 0; this.cellWorld(rec, x, y, z, _w);
      _c.setHex(CITY_LOOK.colour[MAT_ID(m)] ?? CITY_LOOK.colour.brick);
      V.emit(_w.x, _w.y, _w.z, (R() - 0.5) * 8, 2 + R() * 5, (R() - 0.5) * 8, 0.35 + R() * 0.4, _c.r, _c.g, _c.b, CHUNK.life[0] + R() * (CHUNK.life[1] - CHUNK.life[0]), 0, null, 2 + R() * 6);
    }
  }
  /** The voxel batch (built at boot with the crossing; built here into the scene if it is not, our own if there is none). */
  voxels() {
    const g = this.game; let V = g.voxels || this.own;
    if (V && !V.mesh && g.scene) V.build(g.scene);
    if (!V && g.scene) { V = this.own = new VoxelBatch(g).build(g.scene); }
    return V?.mesh ? V : null;
  }

  // ------------------------------------------------------------------ the chunks
  /** A chunk cut loose (destruction.js collapse) flown whole: its mesh about its centre of mass, the drop to what stands under it in its
   *  own building (or the ground), a little tumble. */
  fly(rec, c, by) {
    const b = rec.b, set = new Set(c.cells.map(([x, y, z]) => x + b.w * (z + b.d * y))), cells = c.cells.map(([x, y, z], n) => [x, y, z, c.mats[n]]);
    const [mx, my, mz] = c.at, mesh = new THREE.Mesh(meshCells(cells, (x, y, z) => x >= 0 && z >= 0 && x < b.w && z < b.d && y >= 0 && set.has(x + b.w * (z + b.d * y)), [-mx, -my, -mz], false), this.mat);
    let drop = Infinity, lo = Infinity, xs = [Infinity, -Infinity], zs = [Infinity, -Infinity];
    for (const [x, y, z] of c.cells) {
      let under = 0; for (let yy = y - 1; yy >= 0; yy--) if (this.matAt(rec, x, yy, z)) { under = yy + 1; break; } // (the top under it in its own building, now)
      drop = Math.min(drop, y - under); lo = Math.min(lo, y);
      xs[0] = Math.min(xs[0], x); xs[1] = Math.max(xs[1], x); zs[0] = Math.min(zs[0], z); zs[1] = Math.max(zs[1], z);
    }
    this.cellWorld(rec, mx, my, mz, mesh.position); mesh.rotation.y = rec.yaw; mesh.castShadow = true; this.group.add(mesh);
    const half = Math.max(xs[1] - xs[0], zs[1] - zs[0]) / 2 + 0.5;
    const axis = new THREE.Vector3(R() - 0.5, 0, R() - 0.5).normalize();
    this.chunks.push({ mesh, mass: c.mass, n: c.cells.length, cells, rec, by, y0: mesh.position.y, landY: mesh.position.y - Math.max(0, drop), bottom: my - lo + 0.5, half,
      vy: 0, axis, spin: (R() * 2 - 1) * CHUNK.tumble, onBuilding: drop < lo });
  }

  /** The chunks falling: landed on the giant or the mech on the way, else on what stands under them; then debris, or kept as a slab. */
  fall(dt) {
    const H = this.hangar, Gi = H.giant, M = H.pilot;
    for (let i = this.chunks.length - 1; i >= 0; i--) {
      const C = this.chunks[i], p = C.mesh.position;
      C.vy -= CHUNK.g * dt; p.y += C.vy * dt; C.mesh.rotateOnWorldAxis(C.axis, C.spin * dt);
      const foot = p.y - C.bottom, fell = C.y0 - p.y;
      let on = null;
      if (Gi?.c?.alive && Gi.down <= 0 && Math.hypot(p.x - Gi.pos.x, p.z - Gi.pos.z) < GIANT_LOOK.radius + C.half && foot <= Gi.pos.y + Gi.G.height && foot > Gi.pos.y) on = 'giant';
      else if (M?.mode === 'pilot' && Math.hypot(p.x - M.pos.x, p.z - M.pos.z) < MECH_BODY.radius + C.half && foot <= M.pos.y + heightOf(M.stats) && foot > M.pos.y) on = 'mech';
      else if (p.y <= C.landY) { p.y = C.landY; on = C.onBuilding ? 'building' : 'ground'; }
      if (!on) continue;
      this.chunks.splice(i, 1);
      this.land(C, on, Math.max(0, on === 'ground' || on === 'building' ? C.y0 - C.landY : fell));
    }
  }
  land(C, on, height) {
    const g = this.game, k = fallBlow(C.mass, height), H = this.hangar;
    if (on === 'giant') H.giant.blow({ weapon: 'rubble', k, stagger: 20 * k, heavy: k >= 1, region: 'head', by: C.by });
    if (on === 'mech') H.pilot.hurt('head', k, 'environment');
    g.events?.emit('city.land', { mass: C.mass, height: +height.toFixed(1), k: +k.toFixed(2), on, by: C.by });
    const K = CHUNK.keep;
    if ((on === 'ground' || on === 'building') && C.mass >= K.mass && C.mass <= K.most && height < K.fall && this.onChunk) {
      this.onChunk({ mesh: C.mesh, mass: C.mass, at: C.mesh.position.clone(), half: C.half, bottom: C.bottom }); return; // (a slab that came down softly: a thing to pick up)
    }
    this.rubble(C);
    g.events?.emit('city.break', { building: C.rec.id, lot: C.rec.i, cells: C.n, chunks: 0, at: [Math.round(C.mesh.position.x), Math.round(C.mesh.position.y), Math.round(C.mesh.position.z)], by: C.by }); // (its cells broken as it lands)
  }
  /** A chunk broken into the voxel batch's debris where it landed (sampled to CHUNK.debris, each voxel bigger by what it stands for). */
  rubble(C) {
    const V = this.voxels(), m = C.mesh;
    if (V) {
      const n = Math.min(C.cells.length, CHUNK.debris), size = Math.cbrt(C.cells.length / n) * 0.8;
      m.updateMatrixWorld(true); const [mx, my, mz] = C.cells.reduce((a, [x, y, z]) => [a[0] + x, a[1] + y, a[2] + z], [0, 0, 0]).map((v) => v / C.cells.length);
      for (let j = 0; j < n; j++) {
        const [x, y, z, mat] = C.cells[Math.floor((j * C.cells.length) / n)];
        _v.set(x - mx, y - my, z - mz).applyMatrix4(m.matrixWorld); _c.setHex(CITY_LOOK.colour[MAT_ID(mat)] ?? CITY_LOOK.colour.brick);
        V.emit(_v.x, _v.y, _v.z, (R() - 0.5) * 7, 1 + R() * 4, (R() - 0.5) * 7, size * (0.7 + R() * 0.5), _c.r, _c.g, _c.b, CHUNK.life[0] + R() * (CHUNK.life[1] - CHUNK.life[0]), 0, null, 1 + R() * 5);
      }
    }
    m.parent?.remove(m); m.geometry.dispose();
  }

  update(dt, raw = dt) {
    if (!this.built) return;
    this.fall(dt);
    this.remesh();
    const g = this.game; if (!g.rail?.stage?.active) this.voxels()?.update(raw); // (the crossing steps the batch itself while it sails)
  }
}
