// ---------------------------------------------------------------------------------------
// THE GARDEN'S WATERWORKS: the water on every planetoid (world/garden/water.js, one a planetoid, on its clay's grid), what the hand does
// with it, and what keeps it. The hand's WATER art (world/garden/hand.js) pours Lachryma where it points (the left button, 2 cubic metres
// a real second, of your draught's feeling, else wonder), drinks it up (the right, 4), sets a **spring** (Shift and the left: a source
// that runs 0.4 a real second for good) or a **drain** (Ctrl and the left: takes 0.8 a real second), and takes the nearest of either away
// (Shift and the right). The water runs at 60 steps a real second where there is any, and a sculpted slope slumps a few times a real
// second; what the water wears away reaches the planetoid's look twice a real second (world/garden/realm.js `reshape`). Springs and
// drains are marked by a stand-in (a ring on the ground, Calissa's to dress); the water's look is world/garden/watermesh.js.
// The planetoid bodies (the Jar, the spirits) ask `planet.waterAt(dir)` and wade or float (world/garden/planetbody.js).
// Kept in the realm's save: each planetoid's wet cells, and the springs and drains.
// Events: garden.water { planetoid, how: 'pour' | 'drink' | 'spring' | 'drain' | 'unset' }.
//
// Prior art: From Dust's water placed and drained by the hand, the springs of SimCity 2000's and Populous's water tools, and Minecraft's
// infinite source block.
//
//   game.realm.waterworks = new Waterworks(realm)   .fixed(dt)   .update(dt)   .handle(dt, hit, intent)   .disturb(planet)   .dump() / .load(d)
//   .waters[id] (a PlanetWater)   .springs / .drains [{ planet, dir, rate, feeling }]
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { PlanetWater } from './water.js';
import { WaterLook } from './watermesh.js';

const FLOW = { pour: 2, drink: 4, spring: 0.4, drain: 0.8, slumpEvery: 0.2, lookEvery: 0.5, near: 3 }; // (cubic metres a real second; real seconds; metres)

export class Waterworks {
  constructor(realm) {
    this.R = realm; this.game = realm.game;
    this.waters = {}; this.looks = {}; this.springs = []; this.drains = []; this.slumpT = 0; this.lookT = 0; this.marks = new THREE.Group(); this.marks.name = 'garden-springs';
    for (const P of realm.site.planets) {
      const W = (this.waters[P.id] = new PlanetWater(realm.clays[P.id]));
      P.waterAt = (dir) => W.depthAt(dir); // (the bodies wade and float: world/garden/planetbody.js)
    }
    realm.site.group.add(this.marks);
    this.markGeo = new THREE.TorusGeometry(0.7, 0.08, 6, 20).rotateX(Math.PI / 2); // (a stand-in: Calissa's to dress)
    this.markMat = { spring: new THREE.MeshBasicMaterial({ color: 0x9fe8ff }), drain: new THREE.MeshBasicMaterial({ color: 0x3a2a4a }) };
  }

  /** The water on a planetoid told its ground moved under it (a stroke, an undo). */
  disturb(P) { const W = this.waters[P.id]; if (W?.total || W?.springs) W.wake(); this.slumpDue = true; }

  feeling() { const d = this.game.draught?.aspect || this.game.draught; return typeof d === 'string' ? d : 'wonder'; }

  /** The WATER art, a frame: what the buttons ask at the ground under the hand. */
  handle(dt, hit, { pour, drink, spring, drain, unset }) {
    if (!hit) return;
    const P = hit.planet, W = this.waters[P.id], dir = hit.point.clone().sub(P.c).normalize(), say = (how) => this.game.events?.emit('garden.water', { planetoid: P.id, how, by: 'courier' });
    if (pour) { W.pour(dir, FLOW.pour * dt, this.feeling()); if (!this.pouring) { this.pouring = true; say('pour'); } } else this.pouring = false;
    if (drink) { const got = W.drink(dir, FLOW.drink * dt); if (got && !this.drinking) { this.drinking = true; say('drink'); } } else this.drinking = false;
    if (spring || drain) { const L = spring ? this.springs : this.drains; L.push({ planet: P, dir, rate: spring ? FLOW.spring : FLOW.drain, feeling: this.feeling() }); this.mark(); W.wake(); say(spring ? 'spring' : 'drain'); this.dirty(); }
    if (unset) {
      let best = null, bd = FLOW.near, from = null;
      for (const L of [this.springs, this.drains]) for (const s of L) { if (s.planet !== P) continue; const d = P.c.clone().addScaledVector(s.dir, P.radiusAt(s.dir)).distanceTo(hit.point); if (d < bd) { bd = d; best = s; from = L; } }
      if (best) { from.splice(from.indexOf(best), 1); this.mark(); say('unset'); this.dirty(); }
    }
  }

  /** The springs and drains marked on the ground (a ring each). */
  mark() {
    this.marks.clear();
    for (const [L, kind] of [[this.springs, 'spring'], [this.drains, 'drain']]) for (const s of L) {
      const m = new THREE.Mesh(this.markGeo, this.markMat[kind]); m.position.copy(s.planet.c).addScaledVector(s.dir, s.planet.radiusAt(s.dir) + 0.05); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), s.dir); this.marks.add(m);
    }
    for (const [id, W] of Object.entries(this.waters)) W.springs = this.springs.filter((s) => s.planet.id === id).length + this.drains.filter((s) => s.planet.id === id).length;
  }

  dirty() { this.game.save?.dirty('realm'); }

  /** The water's step: the springs run, the drains take, every wet planetoid steps; the slopes slump; what was worn reaches the look. */
  fixed(dt) {
    for (const s of this.springs) this.waters[s.planet.id].pour(s.dir, s.rate * dt, s.feeling);
    for (const s of this.drains) this.waters[s.planet.id].drink(s.dir, s.rate * dt);
    for (const W of Object.values(this.waters)) W.step(dt);
    if ((this.slumpT -= dt) <= 0) {
      this.slumpT = FLOW.slumpEvery;
      for (const W of Object.values(this.waters)) if (W.awake || this.slumpDue) W.slump(FLOW.slumpEvery);
      this.slumpDue = false;
    }
  }

  /** The looks: the water drawn where it lies, and the ground reshaped where the water wore it. */
  update(dt) {
    for (const P of this.R.site.planets) {
      const W = this.waters[P.id];
      if (W.total > 0 && !this.looks[P.id]) { this.looks[P.id] = new WaterLook(W, P); this.R.site.group.add(this.looks[P.id].mesh); }
      this.looks[P.id]?.update(dt);
    }
    if ((this.lookT -= dt) <= 0) {
      this.lookT = FLOW.lookEvery;
      for (const P of this.R.site.planets) { const W = this.waters[P.id]; if (W.eroded) { W.eroded = false; this.R.clays[P.id].version++; this.R.reshape(P); } }
    }
  }

  /** Kept: each planetoid's wet cells, the springs and the drains (their directions as three numbers). */
  dump() {
    const water = {}; for (const [id, W] of Object.entries(this.waters)) { const a = W.dump(); if (a) water[id] = a; }
    const out = (L) => L.map((s) => [s.planet.id, +s.dir.x.toFixed(4), +s.dir.y.toFixed(4), +s.dir.z.toFixed(4), s.rate, s.feeling]);
    return { water, springs: out(this.springs), drains: out(this.drains) };
  }
  load(d) {
    for (const [id, W] of Object.entries(this.waters)) W.load(d?.water?.[id]);
    const back = (a) => (Array.isArray(a) ? a : []).map(([id, x, y, z, rate, feeling]) => ({ planet: this.R.site.by[id], dir: new THREE.Vector3(x, y, z).normalize(), rate: +rate || 0, feeling: feeling || 'wonder' })).filter((s) => s.planet);
    this.springs = back(d?.springs); this.drains = back(d?.drains); this.mark();
  }
}
