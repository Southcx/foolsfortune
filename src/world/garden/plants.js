// ---------------------------------------------------------------------------------------
// THE GARDEN'S PLANTS (docs/plans/SPIRIT-GARDEN.md section 7, item 15): green that spreads by itself over wet, fertile ground, a
// cellular rule on each planetoid's clay grid (world/garden/clay.js). A cell grows in stages (0 bare .. 3 full); every game hour a
// growing cell on ground that `spreads` (Dovina's GROUND: moss, loam, silt) and is wet (water standing on it, or within a cell of it)
// grows a stage, and a full one seeds its bare neighbours that are wet and fertile too. Dry ground holds what it has; ground that does not
// spread (ash, slate) or none at all wilts a stage a game hour. Seeds: each herb terrace seeds the cells round its plot, and painting moss
// seeds where it is painted. A thorn patch (world/garden/thornpatches.js) is a modifier on the ground under it: no green seeds into a
// cell within its clump's reach (GARDEN-COZY.md A4); what grows there already stays. Drawn by Calissa's look (vfx/garden/gardenplants.js:
// moss, herbs and reeds by the ground).
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
import { PATCH } from './thornpatches.js';
import { souredBy, scorchStep } from '../../progress/gardenweather.js';
import { plantRate, rollOf } from '../../progress/seasonlife.js';
import { seasonOf } from '../../progress/seasons.js';
import { FEELINGS } from './water.js';

const PLANT = { most: 3, wet: 0.02, every: 1 }; // (stages; metres of water that wets; game hours a step)
const _d = new THREE.Vector3();
const SPREADS = new Uint8Array(GROUNDS.length + 1); GROUNDS.forEach((g, i) => { SPREADS[i + 1] = GROUND[g].spreads ? 1 : 0; });

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
    const season = seasonOf().id, n0 = (this.steps = (this.steps || 0) + 1); // (the season paces the green, progress/seasonlife.js: winter rests)
    const draw = (k, salt) => { let h = (k * 374761393 + n0 * 668265263 + salt * 2246822519) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }; // (a seeded draw: the same twice)
    for (const P of this.R.site.planets) {
      const G = this.grids[P.id]; if (!G) continue;
      const clay = this.R.clays[P.id], Wt = this.R.waterworks.waters[P.id]?.w, next = G.slice();
      const wetAt = (k) => !!Wt && Wt[k] > PLANT.wet, thorny = this.thorny(P), Wp = this.R.waterworks.waters[P.id];
      const sour = (k) => wetAt(k) && souredBy(Wp.mix(k), FEELINGS); // (Gall: a cell in water led by Gall wilts as on dead ground and grows none, progress/gardenweather.js)
      let changed = this.scorch(P, clay);
      for (let k = 0; k < NX * NY; k++) {
        const j = (k / NX) | 0, i = k % NX, nb = [j * NX + (i + 1) % NX, j * NX + (i + NX - 1) % NX, Math.min(NY - 1, j + 1) * NX + i, Math.max(0, j - 1) * NX + i];
        const fertile = SPREADS[clay.ground[k]], wet = wetAt(k) || nb.some(wetAt);
        if (G[k]) {
          if (!fertile || sour(k)) { next[k] = G[k] - 1; changed = true; continue; } // (ash, slate or bare clay, or soured water: it wilts)
          const r = wet ? plantRate(season, GROUNDS[clay.ground[k] - 1]) : null;
          if (r && G[k] < PLANT.most) { const up = rollOf(r.step, draw(k, 1)); if (up) { next[k] = Math.min(PLANT.most, G[k] + up); changed = true; } }
          if (r && G[k] === PLANT.most) { let tries = rollOf(r.seed, draw(k, 2)); for (const n of nb) { if (tries <= 0) break; if (!G[n] && !next[n] && SPREADS[clay.ground[n]] && !(thorny && thorny[n])) { next[n] = 1; changed = true; tries--; } } }
        }
      }
      if (changed) { G.set(next); this.dirty.add(P.id); }
    }
  }

  /** Fury: moss sat under Fury rain at `stiffAt` or harder for `scorch` game hours turns to ash (the clock per planetoid, the rain falls
   *  on them all; let go the moment it stops: progress/gardenweather.js scorchStep). True when it scorched. */
  scorch(P, clay) {
    const ww = this.R.waterworks, r = scorchStep((this.scorchH ||= {})[P.id] || 0, ww.feeling?.(), ww.rain?.() || 0, PLANT.every);
    this.scorchH[P.id] = r.hours; if (!r.scorch || !clay) return false;
    const moss = GROUNDS.indexOf('moss') + 1, ash = GROUNDS.indexOf('ash') + 1; if (moss < 1 || ash < 1) return false;
    let any = false; for (let k = 0; k < NX * NY; k++) if (clay.ground[k] === moss) { clay.ground[k] = ash; any = true; }
    if (any) { clay.version++; this.R.reshape?.(P); this.R.game?.events?.emit('garden.scorch', { planetoid: P.id, by: 'environment' }); }
    return any;
  }

  /** The cells under a thorn patch's clumps on P (within PATCH.reach of one), or null when it has none: no green seeds into them. */
  thorny(P) {
    let out = null;
    for (const s of this.R.thornPatches?.spots || []) {
      if (s.planet !== P) continue;
      out ||= (this._thorny ||= new Uint8Array(NX * NY)).fill(0);
      const r = _d.copy(s.pos).sub(P.c).length(), c = Math.cos(PATCH.reach / Math.max(r, 1e-3)); _d.divideScalar(r || 1);
      for (let k = 0; k < NX * NY; k++) if (CELL_DIRS[k * 3] * _d.x + CELL_DIRS[k * 3 + 1] * _d.y + CELL_DIRS[k * 3 + 2] * _d.z > c) out[k] = 1;
    }
    return out;
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
