// ---------------------------------------------------------------------------------------
// CREATURES: the things in the world that live, fight and can be hurt, other than the clapperjars (which came first and keep their own
// module). A creature is a plain object with a small contract, so a weapon asks the creature to be hurt and does not know what it is:
//
//   { type: 'creature', kind, name, pos, radius, height, alive, tags: Set('hurtable', 'programmable', 'sliceable', ...),
//     hurt(point, dir, power, cause, by, from), knock(vel), center(out), head(), vanish(by, cause) (gone without a death of its own:
//     a zandatsu's dissolve), macros (what reprogramming may write into it: tools/veritome/reprogram.js), poise, stunFor (stun.js) }
//
// and every creature carries STATUSES, timed conditions anything may put on it (the Veritome's reprogramming, a shell, a trap):
//
//   halt    it stops where it is (time keeps running for everyone else)       slow    it moves and winds up at a fraction of its speed
//   sleep   it sinks down and does nothing until hit or the time runs out      forget  it loses whoever it was after, and wanders
//   flee    it goes away from the Courier                                      soft    it takes double from every blow
//   calm    it will not attack, though it still follows                        melt    it pools into a harmless puddle
//   stun    it is knocked out of itself (stun.js): it sways where it stands, and what a mind would refuse works on it
//
// A status is a time left and a strength; `st(c, name)` is what a creature's brain reads. Applying one again keeps the longer.
//
// Prior art: the status ailments of the JRPG (Final Fantasy's Stop, Slow, Sleep, Confuse, Berserk; Dragon Quest's Sap for "soft"),
// each a timer on the target rather than a change to its code, and the "damageable" interface of most engines (Unreal's TakeDamage,
// Unity's IDamageable): the attacker calls one method and the target decides what it means.
//
//   game.creatures.add(c)   .near(p, r)   .strike(c, point, dir, power, cause, by, from?)   .apply(c, status, dur, k)   st(c, status)
// ---------------------------------------------------------------------------------------
import { hasTag } from '../core/tags.js';

export const STATUSES = ['halt', 'slow', 'sleep', 'forget', 'flee', 'soft', 'calm', 'melt', 'stun'];

/** How much of a status a creature has right now (0 when none). */
export const st = (c, name) => { const s = c?.status?.get(name); return s && s.t > 0 ? s.k : 0; };

export class Creatures {
  constructor(game) {
    this.game = game;
    this.list = [];
  }
  add(c) { c.status ||= new Map(); this.list.push(c); return c; }
  remove(c) { const i = this.list.indexOf(c); if (i >= 0) this.list.splice(i, 1); }
  /** The living creatures within r of p (horizontal and vertical both), nearest first. */
  near(p, r) {
    const out = [];
    for (const c of this.list) {
      if (!c.alive) continue;
      const dx = c.pos.x - p.x, dz = c.pos.z - p.z, dy = (c.pos.y + c.height * 0.5) - p.y;
      const d = Math.hypot(dx, dz);
      if (d < r + c.radius && Math.abs(dy) < r + c.height) out.push([d, c]);
    }
    return out.sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  }
  /** A blow lands on a creature (anything that strikes asks the tag, not the kind). */
  strike(c, point, dir, power = 1, cause = 'shot', by = 'courier', from = null) {
    if (!c?.alive || !hasTag(c, 'hurtable')) return false;
    if (c.ally && by === 'courier') return false; // (their own: a spirit they called up is not struck by them)
    c.hurt(point, dir, power * (st(c, 'soft') ? 2 : 1), cause, by, from); // (`from`: the thing that struck, when it is not the Courier)
    this.game.vfx?.hit({ ent: c, kind: c.kind, cause, point, dir, power, kill: !c.alive }); // (what the blow looks like: vfx/library.js 'hit.*')
    return true;
  }
  /** Put a status on a creature for dur seconds at strength k (the longer of old and new is kept). */
  apply(c, name, dur, k = 1, by = 'courier') {
    if (!c?.alive) return false;
    const s = c.status.get(name);
    if (s && s.t >= dur && s.k >= k) return false;
    c.status.set(name, { t: Math.max(dur, s?.t || 0), dur, k: Math.max(k, s?.k || 0) });
    c.onStatus?.(name, dur, k, by);
    this.game.events?.emit('creature.status', { kind: c.kind, status: name, dur: +dur.toFixed(1), by });
    return true;
  }
  clearStatus(c, name) { c.status.delete(name); }
  update(dt) {
    for (const c of this.list) {
      for (const [k, s] of c.status) { s.t -= dt; if (s.t <= 0) { c.status.delete(k); c.onStatusEnd?.(k); } }
    }
  }
}
