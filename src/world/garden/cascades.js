// ---------------------------------------------------------------------------------------
// THE GARDEN'S CASCADES (docs/plans/SPIRIT-GARDEN.md section 7, item 12: water between planetoids): water held deep in a basin on the
// side of a planetoid that faces a linked one (within its spirit vein's cone, Dovina's VEIN.cone) spills over and falls to it, carried
// by the other's gravity: so a lake built on the Dantian's rim toward the Terraces waters the Terraces. Each linked pair is checked a few
// times a real second; the deepest such cell over CASCADE.depth gives CASCADE.rate cubic metres a real second, with its feeling, to the
// cell of the other planetoid that faces back. Drawn by Calissa's look (vfx/garden/gardencascade.js: a ribbon of Lachryma along the
// arc, spray where it lands). Events: garden.cascade { from, to } when one starts.
//
// Prior art: From Dust's waterfalls off a cliff's edge, and Super Mario Galaxy's planetoids whose water falls toward the next.
//
//   const C = new Cascades(realm)   C.step(dt) (from the waterworks' step)   C.update(raw) (the look)   C.running [{ from, to, at, land, feeling }]
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { VEIN } from '../../progress/realm.js';
import { NX, NY, CELL_DIRS } from './clay.js';
import { FEELINGS } from './water.js';
import { CascadeLook } from '../../vfx/garden/gardencascade.js';

const CASCADE = { depth: 0.6, rate: 1.5, every: 0.25 }; // (metres deep to spill; cubic metres a real second; real seconds between checks)
const _a = new THREE.Vector3(), _b = new THREE.Vector3();

export class Cascades {
  constructor(realm) {
    this.R = realm; this.t = 0; this.running = [];
    this.group = new THREE.Group(); this.group.name = 'garden-cascades'; realm.site.group.add(this.group);
    this.look = new CascadeLook(this.group); // (Calissa's falling ribbon: vfx/garden/gardencascade.js)
  }

  /** The cells of P facing Q (within the vein's cone): worked out once a pair. */
  facing(P, Q) {
    const key = `${P.id}>${Q.id}`; this.cells ||= new Map();
    if (this.cells.has(key)) return this.cells.get(key);
    const to = Q.c.clone().sub(P.c).normalize(), cos = Math.cos((VEIN.cone * Math.PI) / 180), out = [];
    for (let k = 0; k < NX * NY; k++) if (CELL_DIRS[k * 3] * to.x + CELL_DIRS[k * 3 + 1] * to.y + CELL_DIRS[k * 3 + 2] * to.z >= cos) out.push(k);
    this.cells.set(key, out); return out;
  }

  /** From the waterworks' step: every linked pair, both ways, spills what it holds deep enough. */
  step(dt) {
    if ((this.t -= dt) > 0) return;
    const span = CASCADE.every - this.t; this.t = CASCADE.every;
    const WW = this.R.waterworks, now = [];
    for (const L of this.R.site.links || []) for (const [P, Q] of [[L.a, L.b], [L.b, L.a]]) {
      const W = WW.waters[P.id]; if (!W || !(W.total > 0)) continue;
      let best = -1, bw = CASCADE.depth;
      for (const k of this.facing(P, Q)) if (W.w[k] > bw) { bw = W.w[k]; best = k; }
      if (best < 0) continue;
      const from = _a.fromArray(CELL_DIRS, best * 3).clone(), back = this.facing(Q, P), land = back.length ? back[back.length >> 1] : 0;
      const M = W.mix(best), f = FEELINGS[M.indexOf(Math.max(...M))] || 'wonder';
      const took = W.drink(from, CASCADE.rate * span);
      if (took > 0) { WW.water(Q).pour(_b.fromArray(CELL_DIRS, land * 3).clone(), took, f); now.push({ from: P, to: Q, at: from, land: _b.fromArray(CELL_DIRS, land * 3).clone(), feeling: f }); }
    }
    for (const c of now) if (!this.running.some((r) => r.from === c.from && r.to === c.to)) this.R.game.events?.emit('garden.cascade', { from: c.from.id, to: c.to.id, by: 'courier' });
    this.running = now;
  }

  /** The falls drawn (Calissa's look: a ribbon of Lachryma along each arc, spray where it lands, vfx/garden/gardencascade.js). */
  update(raw) { this.look.update(raw, this.running, this.R.game.camera); }
}
