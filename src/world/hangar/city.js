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
//   C.settle(rec, broke, ctx) -> { chunks, loose, felled } (cells already emptied: the collapse, the chunks flown, a felling said; a strike and
//     a fire's burn-away both end here)   C.fire (CityFire, cityfire.js: fire in the city, MECHS.md 12)
//   a steel-framed building struck loses its glass round the blow (destruction.js shatterGlass); a chunk that fell SPLIT.fall m or more splits
//     (splitChunk) and each piece is kept or rubbled; a chunk of burning cells flies `burning` and lights where it lands
//   events: city.break { building, lot, cells, chunks, at, cause?, by }, city.felled { building, lot, label, topple, cause?, by },
//   city.land { mass, height, k, on ('ground' | 'building' | 'giant' | 'mech'), by }   (fire's own: cityfire.js)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { stream } from '../../core/rng.js';
import { MATERIALS, MAT, CITY, BUILDINGS, SCORE, newBuilding, carve, collapse, cellsLeft, felled, fallBlow, shatterGlass, splitChunk } from '../../progress/mechs/destruction.js';
import { newFire, STATE, FIRE } from '../../progress/mechs/fire.js';
import { CityFire } from './cityfire.js';
import { VoxelBatch } from '../../vfx/voxels/voxelbatch.js';
import { PROVING } from './layout.js';
import { GIANT_LOOK } from './giant.js';
import { MECH_BODY, heightOf } from './mech.js';

/** The placeholder look (Calissa dresses it: the clay city's brick, glass and steel): a colour a material, each cell's lightness moved by
 *  up to `jitter` so a wall reads as cells, the glass paler and a touch glossier. */
export const CITY_LOOK = {
  colour: { glass: 0xc8e4f2, timber: 0x8a5a34, brick: 0xb0603e, stone: 0x8c8a84, steel: 0x4c5866, paper: 0xe6dcc4, furnishing: 0x4a3224 },
  jitter: 0.09,
  // a cell in fire's state (fire.js STATE), the placeholder until Calissa dresses it: burning flushed orange (flickering as the mesh is made
  // again each fire step), scorched darkened, steel gone soft heated red, a doused cell darker; `char` the colour of what burned away
  fire: { burning: 0xff6a1a, hot: 0xffc23a, soft: 0xb04a2a, char: 0x2a2220, scorch: 0.45, wet: 0.7 },
};
/** A chunk in flight: gravity (m/s², real), its tumble (rad/s at most, a little: a slab falls flat more than it spins), and what it
 *  becomes on landing: a prop when it is `keep.mass` t or more (a slab: techniques.js PROPS.chunk.shield's rule), fell under
 *  `keep.fall` m (soft enough to stay whole) and is no more than `keep.most` t (more than a mech's hands could lift: rubble); else
 *  debris, at most `debris` voxels a chunk (a tower's top sampled, each voxel then bigger), living `life` real s. A carve throws
 *  `chips` voxels a broken cell (at most `chipsMax` a strike). */
export const CHUNK = { g: 9.81, tumble: 0.5, keep: { mass: 8, fall: 6, most: 40 }, debris: 900, life: [1.1, 2.2], chips: 1, chipsMax: 260 };

const MAT_ID = (m) => MATERIALS[m]?.id;
const R = stream('world/hangar/city');
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _c = new THREE.Color(), _w2 = new THREE.Color();

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
function meshCells(cells, solid, o, ground = true, tick = 0) {
  const pos = [], nor = [], col = [], idx = [], FL = CITY_LOOK.fire;
  for (const [x, y, z, m, st] of cells) {
    const base = CITY_LOOK.colour[MAT_ID(m)] ?? 0xffffff; _c.setHex(base).multiplyScalar(1 + CITY_LOOK.jitter * (hash(x, y, z) * 2 - 1));
    if (st) { // (fire's state on the cell: a placeholder read headless)
      if (st === STATE.burning) _c.lerp(_w2.setHex(hash(x, y, z + tick * 7) > 0.5 ? FL.burning : FL.hot), 0.75);
      else if (st === STATE.scorched) _c.multiplyScalar(FL.scorch);
      else if (st === STATE.soft) _c.lerp(_w2.setHex(FL.soft), 0.5);
      else if (st === STATE.wet) _c.multiplyScalar(FL.wet);
    }
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
  constructor(hangar) { this.hangar = hangar; this.game = hangar.game; this.built = false; this.recs = []; this.chunks = []; this.onChunk = null; this.onGirder = null; this.look = CITY_LOOK; this.fire = new CityFire(this); }

  /** Every lot built as its building, whole, into `into` (the proving ground's group). */
  build(into) {
    if (this.built) return;
    const A = PROVING.at;
    this.into = into; this.group = new THREE.Group(); this.group.name = 'toycity'; into.add(this.group);
    this.mat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.88, metalness: 0.05 });
    this.recs = CITY.lots.map((L, i) => {
      const b = newBuilding(L.id, i + 1), s = L.yaw ? -1 : 1, cx = A.x + L.x, cz = A.z + L.z;
      newFire(b); // (its fire state beside its cells: fire.js)
      const rec = { i, id: L.id, label: BUILDINGS[L.id].label, b, s, cx, cz, yaw: L.yaw || 0, dirty: true, felled: false, mesh: null, fx: { on: false, watch: false, burnT: 0, tick: 0 },
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
    this.recs = []; this.chunks = []; this.group = null; this.mat = null; this.own = null; this.built = false; this.fire.reset();
  }

  // ------------------------------------------------------------------ cells and the world
  /** A world point into a building's cells (continuous: a cell's centre at its index). */
  toCell(rec, x, y, z) { const b = rec.b; return [rec.s * (x - rec.cx) + b.w / 2 - 0.5, y - PROVING.at.y - 0.5, rec.s * (z - rec.cz) + b.d / 2 - 0.5]; }
  cellWorld(rec, x, y, z, out) { const b = rec.b; return out.set(rec.cx + rec.s * (x + 0.5 - b.w / 2), PROVING.at.y + y + 0.5, rec.cz + rec.s * (z + 0.5 - b.d / 2)); }
  matAt(rec, x, y, z) { const b = rec.b; return x >= 0 && y >= 0 && z >= 0 && x < b.w && y < b.h && z < b.d ? b.mat[x + b.w * (z + b.d * y)] : 0; }
  near(rec, x, z, r) { return x > rec.x0 - r && x < rec.x1 + r && z > rec.z0 - r && z < rec.z1 + r; }

  /** The building's mesh made again from its cells (in its lot's frame: the mesh turned by its yaw). */
  meshOf(rec) {
    const b = rec.b, cells = [], fs = b.fire?.state;
    for (let y = 0; y < b.h; y++) for (let z = 0; z < b.d; z++) for (let x = 0; x < b.w; x++) { const i = x + b.w * (z + b.d * y), m = b.mat[i]; if (m) cells.push([x, y, z, m, fs ? fs[i] : 0]); }
    const geo = meshCells(cells, (x, y, z) => !!this.matAt(rec, x, y, z), [0.5 - b.w / 2, 0.5, 0.5 - b.d / 2], true, rec.fx.tick);
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

  /** A blow on the city: carved out of every building it reaches, a steel-framed one's glass showered round it, the collapse run, the
   *  chunks flown, a felled building said once. */
  strike(shape, k, by = 'courier') {
    const S = shape?.isVector3 ? { kind: 'ball', at: shape, r: 2 } : shape, out = { cells: 0, chunks: 0, felled: [], buildings: 0 };
    if (!this.built || !S?.at || !(k > 0)) return out;
    const only = S.only ? MAT[S.only] : 0;
    for (const rec of this.recs) {
      if (!this.reaches(rec, S)) continue;
      const b = rec.b, was = b.mat.slice(), keep = only ? { mat: was, hp: b.hp.slice() } : null, cs = this.cellShape(rec, S);
      let { broke } = carve(b, cs, k);
      if (keep) { // (only one material: every other cell the shape reached put back as it was)
        for (let i = 0; i < b.mat.length; i++) if (was[i] && was[i] !== only && (!b.mat[i] || b.hp[i] !== keep.hp[i])) { b.mat[i] = was[i]; b.hp[i] = keep.hp[i]; }
        broke = broke.filter((i) => was[i] === only);
      }
      if (broke.length && BUILDINGS[rec.id].frame === MAT.steel && (!only || only === MAT.glass)) { // (a steel frame's curtain of glass goes with a blow: Ultimate Destruction's showering towers)
        const mid = cs.kind === 'capsule' ? cs.at.map((v, n) => (v + cs.to[n]) / 2) : cs.kind === 'ball' ? cs.at : this.centreOf(b, broke);
        broke = broke.concat(shatterGlass(b, mid, cs.r));
      }
      if (!broke.length) continue;
      const done = this.settle(rec, broke, { by, was, brk: { cells: broke.length, at: [Math.round(S.at.x), Math.round(S.at.y), Math.round(S.at.z)] } });
      out.cells += broke.length; out.chunks += done.chunks; out.buildings++;
      if (done.felled) out.felled.push(rec);
    }
    return out;
  }

  /** What follows cells emptied from a building (`broke`, indices; a carve's, glass shattered, or fire's burn-away): the collapse run, the
   *  re-mesh asked, the debris thrown (`was` the cells' materials before, `tint`, `every`: fire throws its char), `city.break` said when
   *  `brk` { cells, at, cause? } is given and something broke or came loose, each chunk flown (one of burning cells carries `burning` and
   *  its cells' states), and a building felled said once, with `cause` when the caller names one (fire). */
  settle(rec, broke, { by = 'courier', was = null, brk = null, cause = null, chips = true, tint = null, every = 1 } = {}) {
    const g = this.game, b = rec.b, f = b.fire, left0 = cellsLeft(b), chunks = collapse(b), W = b.w, D = b.d;
    const loose = chunks.reduce((a, c) => a + c.cells.length, 0), before = left0 + broke.length + loose;
    rec.dirty = true;
    for (const c of chunks) { // (the flames a chunk carries, then its cells out of the building's fire)
      c.states = c.cells.map(([x, y, z]) => (f ? f.state[x + W * (z + D * y)] : 0));
      c.burning = c.states.some((st) => st === STATE.burning);
    }
    if (f) { for (const i of broke) f.state[i] = 0; for (const c of chunks) for (const [x, y, z] of c.cells) f.state[x + W * (z + D * y)] = 0; }
    if (chips) this.chips(rec, broke, was, { tint, every });
    if (brk && (brk.cells > 0 || chunks.length)) g.events?.emit('city.break', { building: rec.id, lot: rec.i, cells: brk.cells, chunks: chunks.length, at: brk.at, ...(brk.cause ? { cause: brk.cause } : {}), by });
    for (const c of chunks) this.fly(rec, c, by);
    let down = false;
    if (!rec.felled && (b.fallen || felled(b))) {
      rec.felled = down = true;
      g.events?.emit('city.felled', { building: rec.id, lot: rec.i, label: rec.label, topple: broke.length + loose >= SCORE.topple * before, ...(cause ? { cause } : {}), by });
      this.hangar.pilot?.quake?.({ x: rec.cx, z: rec.cz }, 2); // (a building coming down shakes the cradle hardest)
      if (BUILDINGS[rec.id].frame === MAT.steel) this.onGirder?.(new THREE.Vector3(rec.cx, PROVING.at.y, rec.cz + Math.sign(PROVING.at.z - rec.cz || 1) * (rec.b.d / 2 + 5))); // (a steel frame leaves a girder on its street side)
    }
    return { chunks: chunks.length, loose, felled: down };
  }
  /** The middle of some cells (indices), in the building's cells. */
  centreOf(b, list) {
    let x = 0, y = 0, z = 0; for (const i of list) { const cx = i % b.w, r = (i - cx) / b.w, cz = r % b.d; x += cx; z += cz; y += (r - cz) / b.d; }
    const n = list.length || 1; return [x / n, y / n, z / n];
  }

  /** The debris of cells emptied: a voxel for each (every `every`th, up to CHUNK.chipsMax), thrown out, in its material's colour (`was`: the
   *  materials before) or `tint`. */
  chips(rec, broke, was, { tint = null, every = 1 } = {}) {
    const V = this.voxels(); if (!V) return;
    const n = Math.min(Math.ceil(broke.length / every), CHUNK.chipsMax), b = rec.b;
    for (let k = 0; k < n; k++) {
      const i = broke[Math.floor((k * broke.length) / n)], x = i % b.w, r = (i - x) / b.w, z = r % b.d, y = (r - z) / b.d;
      this.cellWorld(rec, x, y, z, _w);
      if (tint !== null) _c.setHex(tint); else _c.setHex(CITY_LOOK.colour[MAT_ID(was?.[i])] ?? CITY_LOOK.colour.brick);
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
  /** A chunk's mesh: its cells about `at` (its centre of mass, in cells), drawn with fire's state when the cell has one. */
  chunkMesh(b, cells, at) {
    const set = new Set(cells.map(([x, y, z]) => x + b.w * (z + b.d * y)));
    const mesh = new THREE.Mesh(meshCells(cells, (x, y, z) => x >= 0 && z >= 0 && x < b.w && z < b.d && y >= 0 && set.has(x + b.w * (z + b.d * y)), [-at[0], -at[1], -at[2]], false), this.mat);
    mesh.castShadow = true; return mesh;
  }
  /** A chunk cut loose (destruction.js collapse) flown whole: its mesh about its centre of mass, the drop to what stands under it in its
   *  own building (or the ground), a little tumble. */
  fly(rec, c, by) {
    const b = rec.b, cells = c.cells.map(([x, y, z], n) => [x, y, z, c.mats[n], c.states?.[n] || 0]);
    const [mx, my, mz] = c.at, mesh = this.chunkMesh(b, cells, c.at);
    let drop = Infinity, lo = Infinity, xs = [Infinity, -Infinity], zs = [Infinity, -Infinity];
    for (const [x, y, z] of c.cells) {
      let under = 0; for (let yy = y - 1; yy >= 0; yy--) if (this.matAt(rec, x, yy, z)) { under = yy + 1; break; } // (the top under it in its own building, now)
      drop = Math.min(drop, y - under); lo = Math.min(lo, y);
      xs[0] = Math.min(xs[0], x); xs[1] = Math.max(xs[1], x); zs[0] = Math.min(zs[0], z); zs[1] = Math.max(zs[1], z);
    }
    this.cellWorld(rec, mx, my, mz, mesh.position); mesh.rotation.y = rec.yaw; this.group.add(mesh);
    const half = Math.max(xs[1] - xs[0], zs[1] - zs[0]) / 2 + 0.5;
    const axis = new THREE.Vector3(R() - 0.5, 0, R() - 0.5).normalize();
    this.chunks.push({ mesh, mass: c.mass, n: c.cells.length, cells, at: c.at, burning: !!c.burning, rec, by, y0: mesh.position.y, landY: mesh.position.y - Math.max(0, drop), bottom: my - lo + 0.5, half,
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
      if (Gi?.c?.alive && Gi.down <= 0 && Math.hypot(p.x - Gi.pos.x, p.z - Gi.pos.z) < (Gi.radius ?? GIANT_LOOK.radius) + C.half && foot <= Gi.pos.y + Gi.G.height && foot > Gi.pos.y) on = 'giant';
      else if (M?.mode === 'pilot' && Math.hypot(p.x - M.pos.x, p.z - M.pos.z) < MECH_BODY.radius + C.half && foot <= M.pos.y + heightOf(M.stats) && foot > M.pos.y) on = 'mech';
      else if (p.y <= C.landY) { p.y = C.landY; on = C.onBuilding ? 'building' : 'ground'; }
      if (!on) continue;
      this.chunks.splice(i, 1);
      this.land(C, on, Math.max(0, on === 'ground' || on === 'building' ? C.y0 - C.landY : fell));
    }
  }
  land(C, on, height) {
    const g = this.game, k = fallBlow(C.mass, height), H = this.hangar;
    if (on === 'giant') { H.giant.blow({ weapon: 'rubble', k, stagger: 20 * k, heavy: k >= 1, region: 'head', by: C.by }); if (C.burning) H.giant.light?.(C.by); } // (a burning chunk lights the straw giant)
    if (on === 'mech') H.pilot.hurt('head', k, 'environment');
    g.events?.emit('city.land', { mass: C.mass, height: +height.toFixed(1), k: +k.toFixed(2), on, by: C.by });
    H.pilot?.quake?.(C.mesh.position, k); // (felt in the cradle: the sealed view shakes, world/hangar/mechpilot.js)
    const solid = on === 'ground' || on === 'building';
    if (C.burning && solid) this.fire.igniteAt(C.mesh.position, 2, FIRE.light.chunk, 'chunk', C.by); // (it lights what it lands on or beside)
    for (const P of solid ? this.pieces(C, height) : [C]) {
      const K = CHUNK.keep;
      if (solid && P.mass >= K.mass && P.mass <= K.most && (P.split || height < K.fall) && this.onChunk) {
        this.onChunk({ mesh: P.mesh, mass: P.mass, at: P.mesh.position.clone(), half: P.half, bottom: P.bottom }); continue; // (a slab that came down softly, or a piece of one that split: a thing to pick up)
      }
      this.rubble(P);
      g.events?.emit('city.break', { building: C.rec.id, lot: C.rec.i, cells: P.n, chunks: 0, at: [Math.round(P.mesh.position.x), Math.round(P.mesh.position.y), Math.round(P.mesh.position.z)], by: C.by }); // (its cells broken as it lands)
    }
  }
  /** A chunk that fell hard cut across into slabs (destruction.js splitChunk), each its own mesh in the landed chunk's pose, its own mass
   *  and size; the whole mesh let go. One that did not split (or fell softly) comes back as it was. */
  pieces(C, fell) {
    const parts = splitChunk({ cells: C.cells.map(([x, y, z]) => [x, y, z]), mats: C.cells.map((p) => p[3]), mass: C.mass, at: C.at }, fell);
    if (parts.length < 2) return [C];
    const b = C.rec.b, out = [];
    for (const P of parts) {
      const cells = P.cells.map((p, n) => [p[0], p[1], p[2], P.mats[n]]), mesh = this.chunkMesh(b, cells, P.at);
      mesh.quaternion.copy(C.mesh.quaternion);
      mesh.position.set(P.at[0] - C.at[0], P.at[1] - C.at[1], P.at[2] - C.at[2]).applyQuaternion(C.mesh.quaternion).add(C.mesh.position); this.group.add(mesh);
      let xs = [Infinity, -Infinity], zs = [Infinity, -Infinity], lo = Infinity;
      for (const [x, y, z] of cells) { xs = [Math.min(xs[0], x), Math.max(xs[1], x)]; zs = [Math.min(zs[0], z), Math.max(zs[1], z)]; lo = Math.min(lo, y); }
      out.push({ ...C, mesh, mass: P.mass, n: cells.length, cells, at: P.at, half: Math.max(xs[1] - xs[0], zs[1] - zs[0]) / 2 + 0.5, bottom: P.at[1] - lo + 0.5, split: true });
    }
    C.mesh.parent?.remove(C.mesh); C.mesh.geometry.dispose();
    return out;
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
    this.fire.update(raw); // (fire stepped on real time, before the re-mesh that shows it)
    this.remesh();
    const g = this.game; if (!g.rail?.stage?.active) this.voxels()?.update(raw); // (the crossing steps the batch itself while it sails)
  }
}
