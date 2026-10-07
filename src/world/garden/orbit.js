// ---------------------------------------------------------------------------------------
// THE GARDEN'S ORBIT (docs/plans/SPIRIT-GARDEN.md section 7, item 19; Dovina's ORBIT and orbitSlot in progress/realm.js, the prices
// ECON.place.planetoids and the Firings that open them ECON.place.planetoidFiring): the planetoids beyond the first six, bought in
// turn (Espada's names: the Moonflower Moon, the Koi Pond, the Drill Yard, the Bone Bed: npc/realmnames.js). One is bought at the
// Dantian's shed (its page); its seed is put in the god hand, which carries it up into the sky and lets go (the left button, over no
// planetoid): it takes the free slot of the ring nearest where it was let go, ORBIT.radius metres round the Dantian, ORBIT.tilt
// degrees above or below its equator by turn (Galaxy's observatory: domes round a hub), and grows launch lotuses and a spirit vein to
// its two nearest neighbours. A new planetoid is clay like the rest (sculpted, painted, watered, planted) with plots of its own. Its
// look is Calissa's grove until hers comes (a stand-in). Kept in the realm's save: which were bought, and their slots.
// Events: garden.planetoid.buy { planetoid }, garden.planetoid { planetoid, slot }.
//
// Prior art: Super Mario Galaxy's Comet Observatory (domes added round a hub as the game opens), Spore's solar system (worlds bought
// and placed), and the Animal Crossing house loan paid down for the next room.
//
//   const O = new Orbit(realm)   O.next() -> { id, n, cubes, firing } | null   O.buy()   O.release(point) (the hand let the seed go)
//   O.slots() -> [{ n, pos, free }]   O.bought [{ id, slot }]   O.dump() / O.load(d)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { ORBIT, orbitSlot } from '../../progress/realm.js';
import { ECON } from '../../progress/econ/table.js';
import { firingOf, ranksOf } from '../../progress/spirits.js';
import { PLANETOIDS as NAMES } from '../../npc/realmnames.js';

/** The planetoids bought, in the order they are offered: their radius and the plots they open (8 to 16 m, 4 to 8 plots: SPIRIT-GARDEN.md). */
export const BOUGHT = [
  { id: 'moon', r: 9, plots: 4 },
  { id: 'koi', r: 12, plots: 5 },
  { id: 'drills', r: 14, plots: 6 },
  { id: 'fossils', r: 16, plots: 8 },
];

export class Orbit {
  constructor(realm) {
    this.R = realm; this.game = realm.game; this.bought = [];
  }

  /** Where slot n stands: round the Dantian's heart, at ORBIT's radius, tilted above or below by turn. */
  slotPos(n) {
    const s = orbitSlot(n), D = this.R.site.by.dantian, a = (s.angle * Math.PI) / 180, t = (s.tilt * Math.PI) / 180;
    return D.c.clone().add(new THREE.Vector3(Math.sin(a) * Math.cos(t), Math.sin(t), Math.cos(a) * Math.cos(t)).multiplyScalar(s.radius));
  }
  /** The ring's slots, and which are free (a slot is taken by a bought planetoid, or by one of the first six standing too near it). */
  slots() {
    const out = [];
    for (let n = 0; n < ORBIT.slots; n++) {
      const pos = this.slotPos(n), taken = this.bought.some((b) => b.slot === n) || this.R.site.planets.some((P) => P.c.distanceTo(pos) < P.rMax + 18);
      out.push({ n, pos, free: !taken });
    }
    return out;
  }

  /** The next planetoid to buy, its price and the Firing that opens it; null when all are bought. */
  next() {
    const n = this.bought.length, B = BOUGHT[n]; if (!B) return null;
    return { ...B, n, name: NAMES[B.id]?.name || B.id, cubes: Math.round((ECON.place.planetoids[n] || 0) * ECON.perMinute), firing: ECON.place.planetoidFiring[n] || 1 };
  }
  /** Bought at the shed: paid, and its seed put in the hand. A reason why not, else null. */
  buy() {
    const g = this.game, N = this.next(); if (!N) return 'Every planetoid is bought.';
    if (this.R.hand.seed) return 'Your hand already carries a seed.';
    if (!this.slots().some((s) => s.free)) return 'The ring has no free place.';
    const fired = g.ledger ? firingOf(ranksOf(g.ledger)) : Infinity;
    if (fired < N.firing) return `It opens with the ${['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth'][N.firing - 1] || `${N.firing}th`} Firing.`;
    if (N.cubes > 0 && !g.cubes?.spend(N.cubes, 'garden')) return `It costs ${N.cubes} cubes.`;
    this.R.hand.carrySeed(N.id);
    g.events?.emit('garden.planetoid.buy', { planetoid: N.id, cubes: N.cubes, by: 'courier' });
    return null;
  }
  /** The hand let the seed go at a point in the sky: it takes the nearest free slot. */
  release(id, point) {
    const free = this.slots().filter((s) => s.free); if (!free.length) return false;
    const s = free.reduce((b, x) => (x.pos.distanceTo(point) < b.pos.distanceTo(point) ? x : b));
    this.add(id, s.n);
    this.game.events?.emit('garden.planetoid', { planetoid: id, slot: s.n, by: 'courier' });
    this.game.save?.dirty('realm');
    return true;
  }
  /** A bought planetoid made in its slot: the site's planetoid and its look, its clay, its plots, its lotuses and veins. */
  add(id, slot) {
    const B = BOUGHT.find((b) => b.id === id); if (!B || this.R.site.by[id]) return null;
    const P = this.R.site.addPlanet({ id, r: B.r, c: this.slotPos(slot), name: NAMES[id]?.name || id });
    this.R.adopt(P, B.plots);
    this.bought.push({ id, slot });
    return P;
  }

  dump() { return this.bought.map((b) => [b.id, b.slot]); }
  load(d) { for (const [id, slot] of Array.isArray(d) ? d : []) if (!this.bought.some((b) => b.id === id)) this.add(id, slot | 0); }
}
