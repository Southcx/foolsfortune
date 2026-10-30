// ---------------------------------------------------------------------------------------
// THE THROWN HIT, IN THE WORLD (progress/sandbox.js IMPACT, impactOf, panicOf; docs/plans/SANDBOX.md; Dawn of Mana's lesson): every loose
// thing moving fast enough (the level's crates, bricks and pots, the god hand's throws, the Sandbox's ball) strikes a creature it meets,
// an Impact blow by the energy it carries, and panics it (its agitation thrown into the band where its Lachryma yields most); a heavy one
// fills its stun meter by half. One thing strikes one creature once in IMPACT.cool real seconds; a thing that strikes IMPACT.strike
// creatures in one flight is a strike. Who threw it: the Courier, while the hand is out or the Courier stands within 8 m of the thing
// as it flies (a kick, a carry's throw); otherwise the environment (a crate falling off a ledge), whose hits the ledger never counts.
//
// Prior art: Dawn of Mana (Havok objects as weapons; Panic paying out more), Half-Life 2's gravity gun (a prop's momentum as its damage),
// the house's own god hand throw (godhand.js: what is thrown at the jar chips it, by its speed).
//
//   game.impacts = new ThrownHits(game)   .update(dt) (boot/frame.js)   .track(body, mass?)   (a body that is not the level's: the ball)
//   events: impact.hit { power, heavy, energy, speed, mass, creature, panic, training, by }   impact.strike { n, training, by }
//   (a training body's, the Sandbox's pen's, marked `training`: counted by no one, tracking.js and psyche.js)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { IMPACT, impactOf, panicOf } from '../progress/sandbox.js';
import { isTraining } from '../progress/combat/throwingroom.js';

const _c = new THREE.Vector3(), _d = new THREE.Vector3();
const NEAR = 8; // (m: within this of the Courier, a flying thing is theirs: a kick, a carry's throw)

export class ThrownHits {
  constructor(game) { this.game = game; this.extra = new Set(); this.last = new WeakMap(); this.flight = new WeakMap(); }
  /** Also watch a body the level does not list (the Sandbox's ball). */
  track(body) { this.extra.add(body); }
  untrack(body) { this.extra.delete(body); }

  *bodies() {
    const g = this.game;
    for (const e of g.level?.dynamic || []) if (e.body && !e.carried) yield e.body;
    for (const th of g.god?.thrown || []) if (th.body) yield th.body;
    for (const b of this.extra) yield b;
  }

  update() {
    const g = this.game, list = g.creatures?.list; if (!list?.length) return;
    const now = performance.now() / 1000, P = g.player?.pos;
    for (const b of this.bodies()) {
      if (!b.isValid?.() || !b.isDynamic?.()) continue;
      const v = b.linvel(), sp = Math.hypot(v.x, v.y, v.z);
      if (sp < IMPACT.speed) { this.flight.delete(b); continue; }
      const p = b.translation(), mass = b.mass?.() || 1;
      for (const c of list) {
        if (!c.alive || c.ally || c.aberrant) continue;
        c.center?.(_c) ?? _c.copy(c.pos);
        const r = (c.radius ?? c.r ?? 0.6) + 0.45;
        if ((p.x - _c.x) ** 2 + (p.y - _c.y) ** 2 + (p.z - _c.z) ** 2 > r * r) continue;
        let seen = this.last.get(b); if (!seen) this.last.set(b, (seen = new Map()));
        if (now - (seen.get(c) ?? -9) < IMPACT.cool) continue;
        seen.set(c, now);
        const hit = impactOf(mass, sp); if (!hit) continue;
        const by = g.god?.controlling || g.sandbox?.here || (P && Math.hypot(p.x - P.x, p.z - P.z) < NEAR) ? 'courier' : 'environment';
        _d.set(v.x, Math.max(0.2, v.y), v.z).normalize();
        if (!g.creatures.strike(c, _c.clone(), _d.clone(), hit.power, 'thrown', by)) continue;
        c.emo = panicOf(c.emo);
        if (hit.heavy) g.stun?.add?.(c, 0.5, { by, cause: 'thrown' });
        b.setLinvel({ x: v.x * 0.45, y: Math.abs(v.y) * 0.3 + 1, z: v.z * 0.45 }, true); // (it gives up most of its speed in the blow)
        const n = (this.flight.get(b) || 0) + 1; this.flight.set(b, n);
        g.events?.emit('impact.hit', { power: +hit.power.toFixed(2), heavy: hit.heavy, energy: hit.energy, speed: +sp.toFixed(1), mass: +mass.toFixed(1), creature: c.kind || c.type || null, panic: true, training: !!(c.training || isTraining(c)), by });
        if (n === IMPACT.strike) g.events?.emit('impact.strike', { n, by, training: !!(c.training || isTraining(c)) });
      }
    }
  }
}
