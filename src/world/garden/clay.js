// ---------------------------------------------------------------------------------------
// THE PLANETOIDS' CLAY: a planetoid's surface as a height over its radius, reshaped by the god hand (docs/plans/SPIRIT-GARDEN.md
// section 4, "sculpt" and "lead water"; the owner: "literally let you reshape your inner world like clay", and "terraforming ... fluid
// sims, mesh deformation, the works"). Each planetoid keeps a grid of heights over latitude and longitude (128 by 64: a cell about a metre
// at the Dantian's equator), read with a bilinear sample in any direction; a pull, a press, a smoothing, a flattening (to the height the
// stroke began at: terraces), a carve or a roughening is a soft brush on that grid, held within a band of the radius (a third of it: a
// hill or a hollow, never through the heart) and held still round what stands on the ground (a feature never floats or sinks). The
// garden's water runs on the same grid and wears it away (world/garden/water.js: erosion moves the heights through `add`). The last
// ten strokes can be undone (`snapshot`, `restore`). Calissa's planetoid
// look (vfx/garden/planetoid.js) is the base shape under it and is redrawn from it, and the planetoid bodies stand on the sum (world/garden/planetbody.js asks `radiusAt`). Water led from a pond runs down the
// slope the hand carved, cell by cell, until it pools (From Dust's water, a ribbon of Lachryma). Each cell also keeps its ground's
// material (SPIRIT-GARDEN.md item 6, Dovina's GROUND: moss, ash, loam, slate, silt, one a phase), painted by the hand and free; the look
// is tinted toward it (a stand-in tint until Calissa's five grounds: GROUND_LOOK).
//
// Prior art: Populous's raise and lower, From Dust's sculpted ground and its water that finds the low path, Spore's planet editor
// (a sphere's height field under a brush), and the potter's thumb on a pot's wall.
//
//   const C = new Clay(planet, { band })   C.heightAt(dir)   C.radiusAt(dir)   C.brush(dir, how, strength, radius, { to })   C.keep(dir, r)
//   C.flow(fromDir, steps) -> [dirs]   C.toLook(planetoidLook)   C.dump() -> [int]   C.load([int])   C.snapshot()   C.restore(a)   C.add(k, dh)
//   (how: 'pull' | 'press' | 'smooth' | 'flatten' | 'carve' | 'roughen')   NX, NY, CELL_DIRS, dirOf(i, j), uvOf(dir), groundAt(k) (the grid, shared)
//   C.paint(dir, ground | null, radius)   C.groundOf(dir) -> 'moss' ... | null   C.dumpGround() / C.loadGround(runs)   GROUNDS (their order: a cell's number less one)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GROUND } from '../../progress/realm.js';

export const NX = 128, NY = 64;
const _d = new THREE.Vector3(), _c = new THREE.Color();
export const GROUNDS = Object.keys(GROUND); // (moss, ash, loam, slate, silt: a cell keeps its index plus one, 0 for none)
const GROUND_LOOK = { moss: 0x5f8f4e, ash: 0xbab2a8, loam: 0x6b4a32, slate: 0x4f5866, silt: 0x8f8670 }; // (stand-ins: Calissa's five grounds, item 29)
const TINT = 0.8; // (how far a painted vertex's colour goes toward its ground's)
/** The grid cell's direction (unit vector) for a column and row. */
export const dirOf = (i, j, out = new THREE.Vector3()) => { const lon = (i / NX) * Math.PI * 2, lat = ((j + 0.5) / NY - 0.5) * Math.PI; return out.set(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)); };
/** Every cell's direction, worked out once (x, y, z a cell; the brushes and the water walk these, never the trigonometry). */
export const CELL_DIRS = (() => { const a = new Float32Array(NX * NY * 3), v = new THREE.Vector3(); for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { dirOf(i, j, v); a.set([v.x, v.y, v.z], (j * NX + i) * 3); } return a; })();
/** A direction's place on the grid (fractional column and row). */
export const uvOf = (d) => { const lon = Math.atan2(d.x, d.z), lat = Math.asin(THREE.MathUtils.clamp(d.y, -1, 1)); return [((lon / (Math.PI * 2)) * NX + NX) % NX, (lat / Math.PI + 0.5) * NY - 0.5]; };

export class Clay {
  constructor(planet, { band = null } = {}) {
    this.P = planet; this.band = band ?? planet.r / 3; // (a hill or a hollow of up to a third of the radius: the Dantian's 6.7 m, the Chimney's 2.7)
    this.h = new Float32Array(NX * NY); this.kept = []; this.version = 0;
    this.base = new Float32Array(NX * NY); // (the unsculpted shape under each cell, metres from the heart: asked once, the water reads it every step)
    const c = new THREE.Vector3(); for (let k = 0; k < NX * NY; k++) this.base[k] = planet.base ? planet.base(c.fromArray(CELL_DIRS, k * 3)) : planet.r;
    this.hold = new Float32Array(NX * NY).fill(1); // (how free each cell is to move: 0 where a feature stands, worked out as features are kept)
    this.ground = new Uint8Array(NX * NY); this.painted = 0; // (each cell's ground, GROUNDS' index plus one; how many cells are painted)
  }
  /** The nearest cell to a direction. */
  cellOf(dir) { const [u, v] = uvOf(dir); return THREE.MathUtils.clamp(Math.round(v), 0, NY - 1) * NX + (Math.round(u) % NX); }
  /** The ground's material in a direction ('moss' ...), or null where none is painted. */
  groundOf(dir) { const g = this.ground[this.cellOf(dir)]; return g ? GROUNDS[g - 1] : null; }
  /** Paint a ground (or none: null) over a disc `radius` metres across the surface. True if any cell changed. */
  paint(dir, ground, radius = 3) {
    const d0 = _d.copy(dir).normalize(), D = CELL_DIRS, G = this.ground, v = ground ? GROUNDS.indexOf(ground) + 1 : 0, cosMax = Math.cos(radius / this.P.r);
    if (v < 0) return false;
    let moved = false;
    for (let k = 0; k < NX * NY; k++) { if (D[k * 3] * d0.x + D[k * 3 + 1] * d0.y + D[k * 3 + 2] * d0.z < cosMax || G[k] === v) continue; this.painted += (v ? 1 : 0) - (G[k] ? 1 : 0); G[k] = v; moved = true; }
    if (moved) this.version++;
    return moved;
  }
  /** Kept as runs ([value, count, ...]: painting comes in patches), or null when nothing is painted. */
  dumpGround() { if (!this.painted) return null; const out = []; for (let k = 0; k < NX * NY;) { const v = this.ground[k]; let n = 0; while (k < NX * NY && this.ground[k] === v) { n++; k++; } out.push(v, n); } return out; }
  loadGround(runs) {
    this.ground.fill(0); this.painted = 0; if (!Array.isArray(runs)) return;
    for (let i = 0, k = 0; i + 1 < runs.length && k < NX * NY; i += 2) { const v = runs[i] | 0, n = runs[i + 1] | 0; if (v < 0 || v > GROUNDS.length) return; this.ground.fill(v, k, Math.min(NX * NY, k + n)); if (v) this.painted += Math.min(n, NX * NY - k); k += n; }
    this.version++;
  }
  /** The height over the radius in a direction (bilinear on the grid, wrapping round in longitude, clamped at the poles). */
  heightAt(dir) {
    const [u, v] = uvOf(dir), i0 = Math.floor(u), j0 = THREE.MathUtils.clamp(Math.floor(v), 0, NY - 1), j1 = Math.min(NY - 1, j0 + 1);
    const fu = u - i0, fv = THREE.MathUtils.clamp(v - j0, 0, 1), i1 = (i0 + 1) % NX, H = this.h;
    return (H[j0 * NX + i0] * (1 - fu) + H[j0 * NX + i1] * fu) * (1 - fv) + (H[j1 * NX + i0] * (1 - fu) + H[j1 * NX + i1] * fu) * fv;
  }
  radiusAt(dir) { return (this.P.base ? this.P.base(dir) : this.P.r) + this.heightAt(dir); } // (the unsculpted shape, Calissa's, under the clay)
  /** Hold the ground still within `r` metres of a direction (a feature stands there). */
  keep(dir, r = 3) { this.kept.push({ d: dir.clone().normalize(), r }); const c = new THREE.Vector3(); for (let k = 0; k < NX * NY; k++) this.hold[k] = this.held(c.fromArray(CELL_DIRS, k * 3)); }
  /** The ground's radius at a cell (the shape and the clay): what the water stands on. */
  groundAt(k) { return this.base[k] + this.h[k]; }
  /** Move a cell's ground by `dh` metres (erosion and laying down), within the band and where it is free to move. */
  add(k, dh) { const v = THREE.MathUtils.clamp(this.h[k] + dh * this.hold[k], -this.band, this.band), moved = v - this.h[k]; this.h[k] = v; return moved; }
  snapshot() { return { h: this.h.slice(), g: this.ground.slice(), painted: this.painted }; }
  restore(a) { if (a?.h?.length !== this.h.length) return; this.h.set(a.h); this.ground.set(a.g); this.painted = a.painted; this.version++; }
  held(d) { let k = 1; for (const q of this.kept) { const s = this.P.r * Math.acos(THREE.MathUtils.clamp(d.dot(q.d), -1, 1)); k = Math.min(k, THREE.MathUtils.smoothstep(s, q.r, q.r + 2)); } return k; }

  /** A brush stroke at a direction: `pull` raises, `press` lowers, `smooth` eases toward the neighbourhood's mean, `flatten` toward
   *  `to` (the height where the stroke began), `carve` cuts a narrow groove, `roughen` raises and lowers by a fixed noise. `radius` in
   *  metres along the surface; `strength` metres a full stroke. True if anything moved. */
  brush(dir, how = 'pull', strength = 0.3, radius = 3, { to = 0 } = {}) {
    const d0 = _d.copy(dir).normalize(), H = this.h, D = CELL_DIRS, ang = (how === 'carve' ? radius * 0.5 : radius) / this.P.r, cosMax = Math.cos(ang * 2);
    let mean = 0, n = 0, moved = false;
    if (how === 'smooth') for (let k = 0; k < NX * NY; k++) { if (D[k * 3] * d0.x + D[k * 3 + 1] * d0.y + D[k * 3 + 2] * d0.z > cosMax) { mean += H[k]; n++; } }
    mean = n ? mean / n : 0;
    for (let k = 0; k < NX * NY; k++) {
      const dot = D[k * 3] * d0.x + D[k * 3 + 1] * d0.y + D[k * 3 + 2] * d0.z; if (dot < cosMax) continue;
      const a = Math.acos(Math.min(1, dot)), w = Math.exp(-(a * a) / (2 * ang * ang)) * this.hold[k];
      if (w < 0.01) continue;
      const was = H[k];
      if (how === 'smooth') H[k] += (mean - H[k]) * Math.min(1, w * strength * 2);
      else if (how === 'flatten') H[k] += (to - H[k]) * Math.min(1, w * strength * 2);
      else if (how === 'roughen') H[k] += strength * w * 0.6 * (((Math.sin(k * 12.9898 + this.version * 0.37) * 43758.5453) % 1 + 1) % 1 - 0.5);
      else H[k] += (how === 'pull' ? 1 : -1) * strength * w * (how === 'carve' ? 1.5 : 1);
      H[k] = THREE.MathUtils.clamp(H[k], -this.band, this.band);
      if (H[k] !== was) moved = true;
    }
    if (moved) this.version++;
    return moved;
  }

  /** Water led from a direction: downhill a cell at a time until it pools (at most `steps`); the directions it passes. */
  flow(from, steps = 80) {
    const out = [from.clone().normalize()], c = new THREE.Vector3(), step = 0.8 / this.P.r; // (0.8 m a step along the ground)
    let d = out[0].clone(), h = this.radiusAt(d);
    for (let s = 0; s < steps; s++) {
      // the lowest of eight neighbours a step away (in the plane tangent to here)
      const t1 = new THREE.Vector3(0, 1, 0).cross(d); if (t1.lengthSq() < 1e-6) t1.set(1, 0, 0); t1.normalize(); const t2 = d.clone().cross(t1);
      let best = null, bh = h - 1e-3;
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; c.copy(d).addScaledVector(t1, Math.cos(a) * step).addScaledVector(t2, Math.sin(a) * step).normalize(); const ch = this.radiusAt(c); if (ch < bh) { bh = ch; best = c.clone(); } }
      if (!best) break; // (it pools here)
      d = best; h = bh; out.push(d.clone());
    }
    return out;
  }

  /** A look made to follow the grid (vfx/garden/planetoid.js: its vertices' directions `dir`, heights `h` in units of its radius `R`). */
  toLook(look) {
    if (look.fromClay) return look.fromClay(this); // (Calissa's look keeps its own maps and redraws only what changed, its grounds too)
    const D = look.dir, H = look.h;
    for (let i = 0; i < H.length; i++) H[i] = this.heightAt(_d.set(D[i * 3], D[i * 3 + 1], D[i * 3 + 2])) / look.R;
    look.rebuild();
    if (!this.painted && !look.tinted) return;
    // the painted grounds: each vertex's colour toward its cell's ground (the vertex-to-cell map worked out once a look)
    if (look.cellMap?.length !== H.length) { look.cellMap = new Int32Array(H.length); for (let i = 0; i < H.length; i++) look.cellMap[i] = this.cellOf(_d.set(D[i * 3], D[i * 3 + 1], D[i * 3 + 2])); }
    const C = look.geo.attributes.color, M = look.cellMap, G = this.ground;
    for (let i = 0; i < H.length; i++) { const v = G[M[i]]; if (!v) continue; _c.setHex(GROUND_LOOK[GROUNDS[v - 1]]); C.setXYZ(i, C.getX(i) + (_c.r - C.getX(i)) * TINT, C.getY(i) + (_c.g - C.getY(i)) * TINT, C.getZ(i) + (_c.b - C.getZ(i)) * TINT); }
    C.needsUpdate = true; look.tinted = this.painted > 0;
  }

  /** Kept as whole centimetres (a planetoid's ground in the save: core/save.js). */
  dump() { let any = false; const a = Array.from(this.h, (v) => { const c = Math.round(v * 100); if (c) any = true; return c; }); return any ? a : null; }
  load(a) { if (!Array.isArray(a) || a.length !== this.h.length) { if (a == null && this.h.some((v) => v)) { this.h.fill(0); this.version++; } return; } for (let i = 0; i < a.length; i++) this.h[i] = (a[i] || 0) / 100; this.version++; }
}
