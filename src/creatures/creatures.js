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
//   doubt   (Ego's) it hesitates: slower to wind up, weaker when it does      charm   (Influence's) it will not attack, and warms to them
//   blind   (Illusion's) it cannot see (its senses' blind)                     confusion  (Delirium's) it cannot keep a course
//
// A status is a time left and a strength; `st(c, name)` is what a creature's brain reads. Applying one again keeps the longer.
//
// THE FIGHT'S NUMBERS (docs/plans/SYSTEMS.md, B1 to B4; the data and the rules are Dovina's, in progress/combat/): every blow has a
// DAMAGE TYPE (`type`, from its cause by default: progress/combat/types.js), worth more against the type it trumps and more again when
// it annihilates; each type BUILDS its status on the target (a meter per type, emptied when the status lands; Impact's is the stun, fed
// through stun.js). Every creature carries a MENTAL STATE (`mind`, -2 Stoic .. +2 Prismatic: progress/combat/mind.js), pushed toward
// Prismatic by blows and back by a resisted status or by quiet, which scales how long a status holds it; and an EMOTIONAL OUTPUT (`emo`,
// 0 .. 1: progress/combat/emo.js), raised by blows and by hunting, falling at rest, which its mind reads (an enraged one presses harder)
// and its body shows (vfx/temper.js). A creature may declare its own `affinity` (a type) and `mindRest` (its nature's state).
//
// Prior art: the status ailments of the JRPG (Final Fantasy's Stop, Slow, Sleep, Confuse, Berserk; Dragon Quest's Sap for "soft"),
// each a timer on the target rather than a change to its code, and the "damageable" interface of most engines (Unreal's TakeDamage,
// Unity's IDamageable): the attacker calls one method and the target decides what it means.
//
//   game.creatures.add(c)   .near(p, r)   .strike(c, point, dir, power, cause, by, from?, type?)   .apply(c, status, dur, k)   st(c, status)
//   c.hurt(...) may return 'blocked': the blow was turned aside, and nothing builds
//   c.friend: another Courier, an ally the Courier's blows still reach (friendly fire: a fifth of the damage, statuses under tolerance)
//   .windup(c, { at, radius, eta, kind, parry, part })   .unwind(c)   .windups(pos, r)   .parried(c)   (a telegraphed blow, for the parry:
//   courier/parry.js answers what is listed in reach; `part` is the striking part, worn with the parry mark while it can be answered)
//   stateOf(c.mind) (mind.js) names a creature's state; c.emo, c.build[type] are its numbers
// ---------------------------------------------------------------------------------------
import { hasTag } from '../core/tags.js';
import { TYPES, BUILD, typeOf, multiplier } from '../progress/combat/types.js';
import { MIND, stateOf, pushed, settle } from '../progress/combat/mind.js';
import { rise, enraged } from '../progress/combat/emo.js';
import { sfx } from '../audio/sfx.js';
import { blowWindow } from '../courier/parry.js';
import { courierMindEffect } from '../progress/stones.js';
import { friendlyDamage, tolerance, FRIENDLY } from '../progress/combat/friendly.js';

export const STATUSES = ['halt', 'slow', 'sleep', 'forget', 'flee', 'soft', 'calm', 'melt', 'stun', 'doubt', 'charm', 'blind', 'confusion'];

/** Statuses the mental state does not scale (stun.js keeps its own timing). */
const UNSCALED = new Set(['stun']);

/** How much of a status a creature has right now (0 when none). */
export const st = (c, name) => { const s = c?.status?.get(name); return s && s.t > 0 ? s.k : 0; };

export class Creatures {
  constructor(game) {
    this.game = game;
    this.list = [];
  }
  add(c) { c.status ||= new Map(); c.mind ??= c.mindRest ?? 0; c.emo ??= 0; c.build ||= {}; this.list.push(c); return c; }
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
  strike(c, point, dir, power = 1, cause = 'shot', by = 'courier', from = null, type = typeOf(cause)) {
    if (!c?.alive || !hasTag(c, 'hurtable')) return false;
    if (c.ally && !c.friend && by === 'courier') return false; // (their own: a spirit they called up is not struck by them; a friend, another Courier, is: friendly fire)
    if (by === 'courier') c.touched = true; // (the Courier struck it: a sibling finishing it credits them, coop/fight.js)
    const g = this.game, m = multiplier(type, c.affinity ?? null, [...c.status.keys()].filter((n) => st(c, n)));
    // (the damage alone, never the build-up: the Courier's mental state, Prismatic x1.5 to Stoic x0.67, the owner's ruling in
    // progress/stones.js; and another Courier struck, friendly fire at a fifth, progress/combat/friendly.js)
    let dmgK = by === 'courier' && g.courierMind ? courierMindEffect(g.courierMind.mind).power : 1;
    if (c.friend) dmgK = friendlyDamage(dmgK); // (a fifth; and the cap below: no blow from an ally past a quarter of its health)
    const annihilates = (type === 'impact' && st(c, TYPES.delirium.builds)) || (type === 'delirium' && st(c, TYPES.impact.builds));
    let dmg = power * dmgK * m.dmg * (st(c, 'soft') ? 2 : 1);
    if (c.friend) dmg = Math.min(dmg, (c.maxHp ?? Infinity) * FRIENDLY.cap); // (FRIENDLY.cap of its full health at most: Dovina's)
    const took = c.hurt(point, dir, dmg, cause, by, from, type); // (`from`: the thing that struck, when it is not the Courier)
    if (took === 'blocked') return true; // (a blow it turned aside shows its own block and builds nothing: no stun, no mind, no status: the owner's T51)
    g.vfx?.hit({ ent: c, kind: c.kind, cause, point, dir, power, kill: !c.alive, type }); // (what the blow looks like: vfx/library.js 'hit.*', 'damage.*')
    sfx.damage?.(type, Math.min(1, power)); // (and what its type sounds like over the hit: audio/damage.js, Wanda's)
    if (annihilates) g.events?.emit('combat.annihilate', { kind: c.kind, type, by });
    // the blow moves its mind and stirs it up, and builds its type's status
    c.mind = pushed(c.mind, MIND.perBlow * power); this.mindMoved(c, by);
    c.emo = rise(c.emo, power);
    this.build(c, type, power * m.build, by, cause);
    g.temper?.set(c, { state: c.mind, emo: c.emo, enrage: enraged(c.emo) });
    return true;
  }
  /** A type's build-up on a creature: Impact's feeds its poise (stun.js); the others fill a meter that, full, puts on their status. */
  build(c, type, amount, by = 'courier', cause = 'shot') {
    if (!c?.alive || !TYPES[type] || amount <= 0) return;
    const take = stateOf(c.mind).take;
    if (type === 'impact') { this.game.stun?.add(c, TYPES.impact.poise * amount * take, { by, cause }); return; }
    const T = TYPES[type], tn = c.friend ? c.tolerance?.[T.builds] : null; // (a friend's next status of this kind needs more build-up: tolerance)
    if (tn?.left > 0) amount /= tolerance(tn.n + 1)?.build ?? Infinity;
    c.build[type] = (c.build[type] || 0) + amount * take;
    if (c.build[type] >= T.buildAt) { c.build[type] = 0; this.apply(c, T.builds, T.buildDur, 1, by); }
  }
  /** Put a status on a creature for dur seconds at strength k (the longer of old and new is kept). */
  apply(c, name, dur, k = 1, by = 'courier') {
    if (!c?.alive) return false;
    if (!UNSCALED.has(name)) {
      dur *= stateOf(c.mind).take; // (a Stoic mind holds a status a third as long; a Prismatic one twice)
      if (dur < 0.5) { // (shrugged off: and it hardens)
        c.mind = pushed(c.mind, MIND.perResist); this.mindMoved(c, by);
        this.game.events?.emit('creature.resist', { kind: c.kind, status: name, by });
        return false;
      }
    }
    if (by === 'courier') dur *= this.game.alchemy?.widen?.('focus.hold') ?? 1; // (Focus: a status you build holds longer, SOUL-ALCHEMY.md 6)
    if (c.friend) { // (a status from an ally: a trick once, not a lock; each within the window holds shorter, the third is shrugged off)
      const T0 = (c.tolerance ||= {}), was = T0[name];
      const n = was && was.left > 0 ? was.n + 1 : 0, tol = tolerance(n); T0[name] = { n, left: FRIENDLY.windowSec };
      if (!tol) { this.game.events?.emit('creature.resist', { kind: c.kind, status: name, by }); return false; }
      dur *= tol.dur;
    }
    const s = c.status.get(name);
    if (s && s.t >= dur && s.k >= k) return false;
    c.status.set(name, { t: Math.max(dur, s?.t || 0), dur, k: Math.max(k, s?.k || 0) });
    c.onStatus?.(name, dur, k, by);
    this.game.events?.emit('creature.status', { kind: c.kind, status: name, dur: +dur.toFixed(1), by });
    return true;
  }
  clearStatus(c, name) { c.status.delete(name); }
  /** A creature's telegraphed blow: what a parry in its window answers (docs/plans/PARRY.md). Cleared when it lands or is cancelled
   *  (`unwind`), or `eta` and a breath after, whichever is first. `at` may be a live vector (a lunge's body). A blow that cannot be
   *  parried (a grab, a ram) passes `parry: false`: telegraphed by its own body, never marked. */
  windup(c, { at = c.pos, radius = 1.5, eta = 1, kind = 'blow', parry = true, part = null } = {}) {
    this.unwind(c);
    c.windup = { at, radius, eta, kind, parry, t: eta + 0.3, mark: parry && part ? this.game.parryMark?.mark(part, { eta: this.shownEta(eta) }) : null };
  }
  unwind(c) { c.windup?.mark?.clear(); if (c.windup) c.windup = null; }
  /** An outlined windup run out unanswered with the Courier in its reach: a parry missed (the feat's run starts over: TRAINING.md 6). */
  missed(c, w) { const P = this.game.player; if (P && w.at.distanceTo(P.pos) <= w.radius + 1) this.game.events?.emit('parry.missed', { kind: c.kind, by: 'creature' }); }
  /** The eta a windup's mark is shown with: Perception draws the outline's thickening out over a longer lead (x its widening), and the
   *  window is never moved (vfx/parrymark.js thickens over the 0.8 s before it; SOUL-ALCHEMY.md 6). Held Breath's longer window is
   *  shown fullest from its own start: the mark's last quarter second is laid over the whole window. */
  shownEta(e) {
    const w = this.game.alchemy?.widen?.('perception.notice') ?? 1, W = blowWindow(this.game);
    return e <= W ? (e * 0.25) / W : 0.25 + (e - W) / w;
  }
  /** The answerable blows winding up within r of pos (nearest first). */
  windups(pos, r) {
    const out = [];
    for (const c of this.list) {
      const w = c.windup; if (!c.alive || c.ally || !w?.parry) continue;
      const d = w.at.distanceTo(pos); if (d <= r + w.radius) out.push([d, c]);
    }
    return out.sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  }
  /** A blow answered by a parry: it breaks off (the creature decides how: `onParried`, else its `cancel`). */
  parried(c) { this.unwind(c); if (c.onParried) c.onParried(); else c.cancel?.('parried'); }
  /** A mind that has crossed into another state says so (`creature.mind`: the sound of it going Prismatic is Wanda's, by cues.js). */
  mindMoved(c, by) {
    const id = stateOf(c.mind).id;
    if (c.mindState === undefined) { c.mindState = id; return; }
    if (id === c.mindState) return;
    c.mindState = id;
    this.game.events?.emit('creature.mind', { kind: c.kind, state: id, by });
  }
  update(dt) {
    const T = this.game.temper;
    for (const c of this.list) {
      for (const [k, s] of c.status) { s.t -= dt; if (s.t <= 0) { c.status.delete(k); c.onStatusEnd?.(k); } }
      if (c.tolerance) for (const k in c.tolerance) c.tolerance[k].left -= dt; // (friendly fire's window: the tolerance resets after it)
      if (c.windup) { const w = c.windup; w.t -= dt; w.mark?.eta(this.shownEta(Math.max(0, w.t - 0.3))); if (w.t <= 0 || !c.alive) { if (w.t <= 0 && c.alive && w.parry && w.mark) this.missed(c, w); this.unwind(c); } }
      if (!c.alive) continue;
      // quiet settles its mind back toward its nature, and its agitation rises while it hunts and falls when it does not
      c.mind = settle(c.mind, dt, c.mindRest ?? 0); this.mindMoved(c, 'environment');
      c.emo = rise(c.emo, 0, dt, !!c.brain?.action?.hunt);
      for (const t in c.build) c.build[t] = Math.max(0, c.build[t] - BUILD.drainPerSec * dt);
      T?.set(c, { state: c.mind, emo: c.emo, enrage: enraged(c.emo) });
    }
  }
}
