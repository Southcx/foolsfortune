// ---------------------------------------------------------------------------------------
// AURAS: what a status looks like on whatever has it. Each frame this reads every creature's statuses (creatures.js: sleep, halt,
// slow, melt, calm, soft, haste, empower, forget, and the four the damage types build: doubt, charm, blind, confusion) and holds the library's look for each (`aura.<status>`, or `aura.<status>.<kind>`
// for one creature's own), on the creature, sized to it, as strong as the status and fading out as it runs down. The creature's body
// still decides what a status MEANS (a sleeping jelly sags); this is only the particles round it. A status with no look in the
// library shows nothing here (stun has its own wheel of stars: vfx/dizzy.js).
//
// Prior art: the status auras of Final Fantasy XIV and World of Warcraft (a looping effect on the target per buff and debuff, named by
// the status, tuned apart from it), Kingdom Hearts' sleep bubbles and stop-frost, Monster Hunter's status particles over a monster.
//
//   game.auras = new Auras(game)   .update()  (main.js, every frame, after creatures)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const FADE = 0.6; // (seconds: the last of a status fades its aura out)

export class Auras {
  constructor(game) {
    this.game = game;
    this.on = new Map(); // creature -> Map(status -> handle)
  }

  update() {
    const g = this.game, V = g.vfx, list = g.creatures?.list;
    if (!V || !list) return;
    const seen = new Set();
    for (const c of list) {
      if (!c.alive || !c.status?.size) continue;
      for (const [name, s] of c.status) {
        if (s.t <= 0) continue;
        const fx = `aura.${name}.${c.kind}`;
        const R = V.resolve(fx);
        if (!R || !R.name.startsWith(`aura.${name}`)) continue; // (only a look made for this status: never the bare family's)
        let m = this.on.get(c);
        if (!m) this.on.set(c, (m = new Map()));
        let h = m.get(name);
        if (!h || !h.alive) { h = V.play(fx, { pos: this.centre(c), scale: THREE.MathUtils.clamp(c.height || 1, 0.5, 2.5), power: 1 }); m.set(name, h); }
        this.centre(c, h.pos);
        h.k = Math.min(1, s.k ?? 1) * Math.min(1, s.t / FADE);
        seen.add(h);
      }
    }
    // what has ended (the status ran out, or the creature is gone)
    for (const [c, m] of this.on) {
      for (const [name, h] of m) if (!seen.has(h)) { h.stop?.(); m.delete(name); }
      if (!m.size) this.on.delete(c);
    }
  }

  centre(c, out = new THREE.Vector3()) { return out.set(c.pos.x, c.pos.y + (c.height || 1) * 0.5, c.pos.z); }
}
