// ---------------------------------------------------------------------------------------
// THE HAND'S CATCH: a Figment caught by the god hand in battle (docs/plans/SPIRIT-GARDEN.md, 5a; the owner, 2026-10-07: "something
// really fun about using the Pneuka Jar and Godhand form in battle to capture them when stunned"). With the hand out (~) and its first
// art (telekinesis), a STUNNED Figment can be grabbed, as anything loose is; held over the Jar's mouth it is drawn in, but it STRUGGLES:
// a second a class (a Guppy one, a Leviathan five: `need`), tugging the hand off the mouth in jerks that the player must hold against.
// Off the mouth the drawing-in ebbs. Held through, it is certain: BOUND (creatures/bound.js). Let go, or let the stun run out, and it
// is free where it is (`catch.free`). The Jar stands still the whole time and the fight goes on round it: whatever is hitting the Jar
// can crack it. Skill over luck: the Lockheart's catch is the gamble (tools/lockheart/lockheart.js).
//
// Its look is Calissa's (game.catchLook, vfx/catch.js): the tether from the mouth, the struggle, the take and the snap.
//
// Prior art: Black & White's hand (a creature picked up, struggling in the fingers), Luigi's Mansion's Poltergust tug of war, Pikmin's
// carry, and the genie drawn back into the bottle.
//
//   const C = new HandCatch(god)   C.hover(cursor) -> { creature } | null   C.begin(c)   C.hold(target, dt) -> target (tugged)   C.drop(why)
//   C.held   (godhand.js routes its grab through these when what it grabs is a creature)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { stream } from '../core/rng.js';
const simRand = stream('godhand/catch'); // (the simulation's chance: core/rng.js, the same twice)

const MOUTH = { r: 0.8, lo: 0.6, hi: 3.2 }; // (over the Jar: within 0.8 m of its axis, 0.6 to 3.2 m above its foot)
const TUG = { every: [0.35, 0.7], pull: 1.6, ebb: 0.5 }; // (a jerk every so often, this far; off the mouth the drawing-in ebbs at half speed)

export class HandCatch {
  constructor(god) { this.god = god; this.game = god.game; this.held = null; }

  /** A stunned Figment under the cursor (the hand's pick sees rigid bodies; a creature is kinematic, so it is looked for here). */
  hover(K) {
    const g = this.game; if (!K?.ok) return null;
    let best = null, bd = 1.6;
    for (const c of g.creatures?.list || []) {
      if (!g.bound?.catchable(c) || !g.stun?.stunned(c)) continue;
      const mid = c.center?.(new THREE.Vector3()) ?? c.pos;
      // (the distance from the cursor's ray to its middle)
      const o = K.ray.origin, d = K.ray.dir, t = Math.max(0, mid.clone().sub(o).dot(d)), near = o.clone().addScaledVector(d, t).distanceTo(mid);
      if (near < bd) { bd = near; best = c; }
    }
    return best ? { creature: best } : null;
  }

  /** Grabbed: it is the hand's now, struggling. */
  begin(c) {
    const need = (c.cls || 0) + 1;
    this.held = { c, t: 0, need, tug: new THREE.Vector3(), next: 0.3, at: c.pos.clone() };
    c.held = c.pos.clone();
    const V = this.god.jar; this.game.catchLook?.begin(c.root, () => V.clips?.mouth() ?? V.pos.clone().setY(V.pos.y + 1.2)); // (the Jar's mouth, as its clips hold it: godhand/pneukajarclips.js)
    this.game.events?.emit('catch.grab', { kind: c.kind, cls: c.cls || 0, need, by: 'courier' });
    return this.held;
  }

  /** Each physics step while held: it hangs from the hand (tugged), and over the Jar's mouth it is drawn in. True while it holds. */
  hold(target, dt) {
    const H = this.held, g = this.game; if (!H) return false;
    const c = H.c, V = this.god.jar;
    if (!c.alive) { this.held = null; return false; }
    if (!g.stun?.stunned(c)) { this.drop('woke'); return false; } // (a stun that runs out mid-struggle frees it)
    // the struggle: a jerk away from the mouth now and then, eased back by the hand
    if ((H.next -= dt) <= 0) {
      H.next = TUG.every[0] + simRand() * (TUG.every[1] - TUG.every[0]);
      const a = simRand() * Math.PI * 2; H.tug.set(Math.cos(a), 0.2, Math.sin(a)).multiplyScalar(TUG.pull * (0.6 + 0.4 * simRand()));
      c.deform?.kick(-3, new THREE.Vector2(H.tug.x, H.tug.z), 0.15);
    }
    H.tug.multiplyScalar(Math.max(0, 1 - dt * 3));
    H.at.lerp(target, 1 - Math.exp(-14 * dt)).add(H.tug.clone().multiplyScalar(dt * 6));
    c.held.copy(H.at).setY(H.at.y - 0.9); // (it hangs from the fingers)
    // over the mouth: drawn in, a second a class; off it, the drawing-in ebbs
    const over = Math.hypot(H.at.x - V.pos.x, H.at.z - V.pos.z) < MOUTH.r && H.at.y - V.pos.y > MOUTH.lo && H.at.y - V.pos.y < MOUTH.hi;
    H.t = over ? H.t + dt : Math.max(0, H.t - dt * TUG.ebb);
    H.over = over;
    if (over) g.stun?.hold(c, 0.5); // (being drawn in keeps it down: the struggle is the clock, not the stun)
    g.catchLook?.set({ k: H.t / H.need, tug: Math.min(1, H.tug.length() / TUG.pull) });
    if (H.t >= H.need) { // (held through: drawn down the tether into the mouth, then bound)
      this.held = null; c.taking = true;
      const done = () => { c.taking = false; c.held = null; g.bound?.bind(c, 'hand'); };
      if (g.catchLook?.state === 'hold') g.catchLook.take(done); else done();
      return false;
    }
    return true;
  }

  /** Let go: it drops where it is, free. */
  drop(why = 'dropped') {
    const H = this.held; if (!H) return;
    this.held = null;
    const c = H.c; c.held = null;
    this.game.catchLook?.free();
    if (c.alive) { c.air = true; c.vy = 0; c.groundY = null; }
    this.game.events?.emit('catch.free', { from: 'hand', kind: c.kind, why, by: 'courier' });
  }

  /** How far through the struggle (0..1), for the hand's look (its grip tightening). */
  get progress() { return this.held ? Math.min(1, this.held.t / this.held.need) : 0; }
}
