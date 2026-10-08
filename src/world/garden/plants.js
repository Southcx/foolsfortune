// ---------------------------------------------------------------------------------------
// THE GARDEN'S PLANTS (docs/plans/SPIRIT-GARDEN.md section 7, item 15): green that spreads by itself over wet, fertile ground, a
// cellular rule on each planetoid's clay grid (world/garden/clay.js). A cell grows in stages (0 bare .. 3 full); every game hour a
// growing cell on ground that `spreads` (Dovina's GROUND: moss, loam, silt) and is wet (water standing on it, or within a cell of it)
// grows a stage, and a full one seeds its bare neighbours that are wet and fertile too. Dry ground holds what it has; ground that does not
// spread (ash, slate) or none at all wilts a stage a game hour. Seeds: each herb terrace seeds the cells round its plot, and painting moss
// seeds where it is painted. Drawn by Calissa's look (vfx/garden/gardenplants.js: moss, herbs and reeds by the ground).
// Kept in the realm's save as runs.
//
// Prior art: Conway's Life and every cellular grass (From Dust's vegetation spreading over wet ground, Viva Pinata's grass that the
// gardener waters), and SimCity's land value spreading cell to cell.
//
//   const G = new Plants(realm)   G.tick(gameHours)   G.update(raw)   G.at(planet, dir) -> 0..3   G.seed(planet, dir, r)   G.dump() / G.load(d)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { NX, NY, CELL_DIRS, GROUNDS } from './clay.js';
import { GROUND } from '../../progress/realm.js';
import { GardenPlants } from '../../vfx/garden/gardenplants.js';

const PLANT = { most: 3, wet: 0.02, every: 1 }; // (stages; metres of water that wets; game hours a step)
const SPREADS = new Uint8Array(GROUNDS.length + 1); GROUNDS.forEach((g, i) => { SPREADS[i + 1] = GROUND[g].spreads ? 1 : 0; });
const _d = new THREE.Vector3();

export class Plants {
  constructor(realm) {
    this.R = realm; this.grids = {}; this.owed = 0; this.dirty = new Set();
    this.look = new GardenPlants(realm); // (Calissa's look: a kind a ground, placed by density, vfx/garden/gardenplants.js)
  }
  grid(P) { return (this.grids[P.id] ||= new Uint8Array(NX * NY)); }
  at(P, dir) { const G = this.grids[P.id]; return G ? G[this.R.clays[P.id].cellOf(dir)] : 0; }
  /** Green started round a direction (`r` metres): a terrace's plot, a patch of moss painted. */
  seed(P, dir, r = 2) {
    const G = this.grid(P), d0 = _d.copy(dir).normalize(), cosMax = Math.cos(r / P.r); let any = false;
    for (let k = 0; k < NX * NY; k++) if (!G[k] && CELL_DIRS[k * 3] * d0.x + CELL_DIRS[k * 3 + 1] * d0.y + CELL_DIRS[k * 3 + 2] * d0.z >= cosMax) { G[k] = 1; any = true; }
    if (any) this.dirty.add(P.id);
    return any;
  }

  /** Game hours passed: a step of the rule each PLANT.every of them. */
  tick(hours) {
    this.owed += hours;
    while (this.owed >= PLANT.every) { this.owed -= PLANT.every; this.step(); }
  }
  step() {
    for (const P of this.R.site.planets) {
      const G = this.grids[P.id]; if (!G) continue;
      const clay = this.R.clays[P.id], Wt = this.R.waterworks.waters[P.id]?.w, next = G.slice();
      const wetAt = (k) => !!Wt && Wt[k] > PLANT.wet;
      let changed = false;
      for (let k = 0; k < NX * NY; k++) {
        const j = (k / NX) | 0, i = k % NX, nb = [j * NX + (i + 1) % NX, j * NX + (i + NX - 1) % NX, Math.min(NY - 1, j + 1) * NX + i, Math.max(0, j - 1) * NX + i];
        const fertile = SPREADS[clay.ground[k]], wet = wetAt(k) || nb.some(wetAt);
        if (G[k]) {
          if (!fertile) { next[k] = G[k] - 1; changed = true; continue; } // (ash, slate or bare clay: it wilts)
          if (wet && G[k] < PLANT.most) { next[k] = G[k] + 1; changed = true; }
          if (G[k] === PLANT.most && wet) for (const n of nb) if (!G[n] && SPREADS[clay.ground[n]] && (wetAt(n) || wet)) { next[n] = 1; changed = true; }
        }
      }
      if (changed) { G.set(next); this.dirty.add(P.id); }
    }
  }

  /** The green drawn where it changed, or where the clay under it moved (Calissa's look: vfx/garden/gardenplants.js). */
  update() { this.look.update(this.dirty, this.grids); this.dirty.clear(); }

  dump() {
    const out = {};
    for (const [id, G] of Object.entries(this.grids)) { if (!G.some((v) => v)) continue; const runs = []; for (let k = 0; k < G.length;) { const v = G[k]; let n = 0; while (k < G.length && G[k] === v) { n++; k++; } runs.push(v, n); } out[id] = runs; }
    return out;
  }
  load(d) {
    for (const G of Object.values(this.grids)) G.fill(0);
    for (const [id, runs] of Object.entries(d || {})) {
      const P = this.R.site.by[id]; if (!P || !Array.isArray(runs)) continue;
      const G = this.grid(P); for (let i = 0, k = 0; i + 1 < runs.length && k < G.length; i += 2) { G.fill(Math.min(PLANT.most, runs[i] | 0), k, Math.min(G.length, k + (runs[i + 1] | 0))); k += runs[i + 1] | 0; }
    }
    for (const id of Object.keys(this.grids)) this.dirty.add(id);
  }
  /** A planetoid bare again (the hand's reset). */
  clear(P) { this.grids[P.id]?.fill(0); this.dirty.add(P.id); }
}
