// ---------------------------------------------------------------------------------------
// THE GARDEN'S CASCADES (docs/plans/SPIRIT-GARDEN.md section 7, item 12: water between planetoids): water held deep in a basin on the
// side of a planetoid that faces a linked one (within its spirit vein's cone, Dovina's VEIN.cone) spills over and falls to it, carried
// by the other's gravity: so a lake built on the Dantian's rim toward the Terraces waters the Terraces. Each linked pair is checked a few
// times a real second; the deepest such cell over CASCADE.depth gives CASCADE.rate cubic metres a real second, with its feeling, to the
// cell of the other planetoid that faces back. Drawn as an arc of moving dashes between the two (a stand-in for Calissa's falling
// water, item 29). Events: garden.cascade { from, to } when one starts.
//
// Prior art: From Dust's waterfalls off a cliff's edge, and Super Mario Galaxy's planetoids whose water falls toward the next.
//
//   const C = new Cascades(realm)   C.step(dt) (from the waterworks' step)   C.update(raw) (the look)   C.running [{ from, to, k, fall }]
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { VEIN } from '../../progress/realm.js';
import { NX, NY, CELL_DIRS } from './clay.js';
import { FEELINGS } from './water.js';

const CASCADE = { depth: 0.6, rate: 1.5, every: 0.25, segs: 24 }; // (metres deep to spill; cubic metres a real second; real seconds between checks; the arc's points)
const _a = new THREE.Vector3(), _b = new THREE.Vector3();

export class Cascades {
  constructor(realm) {
    this.R = realm; this.t = 0; this.running = [];
    this.group = new THREE.Group(); this.group.name = 'garden-cascades'; realm.site.group.add(this.group);
    this.mat = new THREE.LineDashedMaterial({ name: 'garden-cascade', color: 0xbfe8ff, dashSize: 0.8, gapSize: 0.6, transparent: true, opacity: 0.85 });
    this.looks = new Map(); // (a pair's key -> its arc)
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
      if (took > 0) { WW.water(Q).pour(_b.fromArray(CELL_DIRS, land * 3).clone(), took, f); now.push({ from: P, to: Q, at: from, land: _b.fromArray(CELL_DIRS, land * 3).clone() }); }
    }
    for (const c of now) if (!this.running.some((r) => r.from === c.from && r.to === c.to)) this.R.game.events?.emit('garden.cascade', { from: c.from.id, to: c.to.id, by: 'courier' });
    this.running = now;
  }

  /** The arcs: one a running cascade, its dashes moving toward where it lands. */
  update(raw) {
    const live = new Set();
    for (const c of this.running) {
      const key = `${c.from.id}>${c.to.id}`; live.add(key);
      let L = this.looks.get(key);
      const a = c.from.c.clone().addScaledVector(c.at, c.from.radiusAt(c.at) + 0.1), b = c.to.c.clone().addScaledVector(c.land, c.to.radiusAt(c.land) + 0.1);
      const mid = a.clone().lerp(b, 0.5).add(a.clone().sub(c.from.c).normalize().multiplyScalar(a.distanceTo(b) * 0.25)); // (it leaves outward, then falls)
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b), pts = curve.getPoints(CASCADE.segs);
      if (!L) { L = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), this.mat); L.name = 'garden-cascade'; this.group.add(L); this.looks.set(key, L); }
      else L.geometry.setFromPoints(pts);
      L.computeLineDistances();
    }
    for (const [key, L] of this.looks) if (!live.has(key)) { this.group.remove(L); L.geometry.dispose(); this.looks.delete(key); }
    this.mat.dashOffset -= raw * 4; // (the dashes run toward where it lands)
  }
}
