// ---------------------------------------------------------------------------------------
// A CLASS'S ARTS IN PLAY (CLASS-ARTS.md; the rules Dovina's, progress/classarts.js): the runtime of the worn action and the worn
// reaction. The action is the input action `art` (G on foot; touch `art`), paid from the pool at its row's cost after its cooldown; the
// reaction fires itself at its moment. Every number is read from `game.classArts.numbers(slot)` at the moment of use, so the accent of
// the class read now (x1.25, cost x0.8) is always the one applied. Each art is a modifier with a source you can see (DESIGN.md 22):
// the pool's modifiers (a cost taken off), a multiplier handed to the one blow it changes, the body held by a tech while it runs; none
// changes a base rule, and with no art worn this module does nothing.
//
// Built in waves, four classes a wave (CLASSES.md 6). Wave 1: the Fool (Beginner's Luck, Running on Empty) and the four Knights (Onrush,
// Momentum; Water Walk, Gallant; Riposte Rush, Edge; Bulwark, Steadfast). An art not built yet is refused at the key in the log.
//
// Prior art: Final Fantasy Tactics' action and reaction abilities (one verb on a key, one passive that answers a moment), Hades' boons
// (each a small modifier on one thing the body already does), Dark Souls' "next attack" buffs (Momentum's one blow).
//
//   game.classArtsRun = techs.add(new ClassArtsBody(techs))   (a passive tech: its speedMult holds the body for Bulwark)
//   .onStrike(c, m) -> { dmg, build } | null   (creatures.strike asks, the Courier's blows only)
//   .takenMult() (the vessel's damage asks)   .ward() -> bool (Steadfast: the next blow cracks nothing)
//   .lucky() -> bool (Beginner's Luck spent on a roll of chance: the Lockheart's spins, a puzzle duel's flee)
//   events: art.use { art, kind, accented, by }, art.fire { art, by }, art.end { art, by }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Tech } from '../moves/techs.js';
import { sfx } from '../../audio/sfx.js';

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3();

/** How near a point lies to the segment a..b, on the ground's plane. */
function nearSegment(p, a, b) {
  const abx = b.x - a.x, abz = b.z - a.z, L2 = abx * abx + abz * abz || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.z - a.z) * abz) / L2));
  return Math.hypot(p.x - (a.x + abx * t), p.z - (a.z + abz * t));
}

export class ClassArtsBody extends Tech {
  constructor(mgr) {
    super(mgr, 'classarts');
    this.passive = true;
    this.now = 0; this.cool = {}; // (real seconds of play, and each art's cooldown end on that clock)
    this.luckUntil = -1; this.freeUntil = -1; this.braceUntil = -1; this.braceTaken = 1;
    this.sprintT = 0; this.momentum = false; this.stillT = 0; this.steady = false;
    this.parried = null; // ({ c, at }: the last blow parried, for Riposte Rush)
    const g = this.game;
    g.events?.on?.('move.parry', (e) => {
      if (e.by !== 'courier') return;
      if (e.what === 'blow' && g.lastParried) this.parried = { c: g.lastParried, at: this.now };
      const R = this.reaction('gallant'); if (R) { g.lachryma?.gain?.(R.does.pool, 'art'); this.fire('gallant'); }
    });
  }
  usable() { return true; }
  get speedMult() { return this.now < this.braceUntil ? 0 : this.paintK(); }

  /** The worn row of a slot, if it is the art `id` (its numbers accented for the class read now). */
  worn(slot, id) { const n = this.game.classArts?.numbers?.(slot); return n && (!id || n.id === id) ? n : null; }
  reaction(id) { return this.worn('reaction', id); }
  ready(id) { return !(this.cool[id] > this.now); }
  fire(id) { this.game.events?.emit('art.fire', { art: id, by: 'courier' }); }

  // ---- the hooks the game asks ------------------------------------------------
  /** A blow of the Courier's landing on `c` (`m`: the damage type's multiplier): Momentum's one blow, Edge on a weak point. */
  onStrike(c, m) {
    let dmg = 1, build = 1;
    if (this.momentum) { const R = this.reaction('momentum'); if (R) { dmg *= R.does.mult; this.momentum = false; this.sprintT = 0; this.fire('momentum'); } }
    if (m?.dmg > 1) { const R = this.reaction('edge'); if (R) build *= R.does.weakBuild; }
    return dmg === 1 && build === 1 ? null : { dmg, build };
  }
  /** What a blow on the vessel is worth while Bulwark braces. */
  takenMult() { return this.now < this.braceUntil ? this.braceTaken : 1; }
  /** Steadfast held: the blow cracks nothing, and it is spent. */
  ward() {
    if (!this.steady || !this.reaction('steadfast')) return false;
    this.steady = false; this.stillT = 0; this.fire('steadfast'); return true;
  }
  /** Beginner's Luck armed: this roll of chance is thrown twice, and it is spent. */
  lucky() { if (this.now > this.luckUntil) return false; this.luckUntil = -1; this.fire('beginnersLuck'); return true; }

  // ---- the reactions' moments -------------------------------------------------
  /** The pool ran dry: Running on Empty takes every cost off for a while. */
  dry() {
    const R = this.reaction('zero'); if (!R || !this.ready('zero')) return;
    this.cool.zero = this.now + (R.cooldown ?? 45);
    this.freeUntil = this.now + R.does.free;
    this.game.lachryma?.addModifier?.('art.zero', { costMult: { '*': 0 } });
    this.fire('zero');
  }
  /** Water Walk's other half: paint under the feet runs faster while it lasts. */
  paintK() {
    const W = this.mgr.get?.('waterwalk'); if (!(W?.left > 0)) return 1;
    const R = this.wadeK, P = this.P, k = this.game.paintmap?.kAt?.(P.pos.x, P.pos.y, P.pos.z) || 0;
    return k > 0.1 ? R : 1;
  }

  // ---- the action on its key --------------------------------------------------
  press() {
    const g = this.game, R = this.worn('action');
    if (!R) { g.log?.say('warn', 'You wear no action art yet. /art lists the ones you have opened.', { key: 'art.none', throttle: 3 }); return; }
    if (!this.ready(R.id)) { g.log?.say('warn', `${R.label} is cooling down.`, { key: 'art.cool', throttle: 1.5 }); sfx.fizzle?.(); return; }
    const act = ACTS[R.id];
    if (!act) { g.log?.say('warn', `${R.label} is not in the game yet.`, { key: 'art.unbuilt', throttle: 3 }); return; }
    const why = act.can?.(this, R);
    if (why) { g.log?.say('warn', why, { key: `art.no.${R.id}`, throttle: 1.5 }); sfx.fizzle?.(); return; }
    if (R.cost && !g.lachryma?.spend(R.cost, 'art')) { g.log?.say('warn', `Your pool is too low for ${R.label}.`, { key: 'art.pay', throttle: 1.5 }); return; }
    this.cool[R.id] = this.now + (R.cooldown ?? 0);
    act.go(this, R);
    g.events?.emit('art.use', { art: R.id, kind: 'action', accented: !!R.accented, by: 'courier' });
  }
  /** The blink's body forced along a line (Onrush, Riposte Rush): `done(from, to)` at its end. */
  rush(dir, dist, done) { const b = this.mgr.get?.('blink'); if (!b?.force) return false; b.force(dir, dist, done); return true; }
  /** Every creature within `width` of the line a..b struck once by the art. */
  sweep(a, b, width, power, id) {
    const g = this.game, mid = _a.copy(a).lerp(b, 0.5), r = a.distanceTo(b) / 2 + width;
    for (const c of g.creatures?.near?.(mid, r) || []) if (nearSegment(c.pos, a, b) <= width / 2 + (c.radius ?? 0.5)) {
      _d.copy(c.pos).sub(a).setY(0).normalize();
      g.creatures.strike(c, c.pos.clone().setY(c.pos.y + 0.8), _d.clone(), power, 'art', 'courier');
    }
  }

  tick(dt) {
    const g = this.game, P = this.P;
    this.now += dt;
    if (!this.hooked && g.lachryma?.on) { this.hooked = true; g.lachryma.on('empty', () => this.dry()); } // (the pool is made after the techs: boot/pneuka.js)
    if (this.freeUntil >= 0 && this.now >= this.freeUntil) { this.freeUntil = -1; g.lachryma?.removeModifier?.('art.zero'); g.events?.emit('art.end', { art: 'zero', by: 'courier' }); }
    if (this.braceUntil >= 0 && this.now >= this.braceUntil) { this.braceUntil = -1; g.events?.emit('art.end', { art: 'bulwark', by: 'courier' }); }
    // Momentum: a sprint held long enough arms the next blow
    const mo = this.reaction('momentum');
    if (mo && P?.sprinting) { this.sprintT += dt; if (this.sprintT >= mo.does.after && !this.momentum) this.momentum = true; } else if (!this.momentum) this.sprintT = 0;
    // Steadfast: standing still long enough arms the next blow taken
    const sf = this.reaction('steadfast'), still = P && P.grounded && Math.hypot(P.vel.x, P.vel.z) < 0.2;
    if (sf && still) { this.stillT += dt; if (this.stillT >= sf.does.still) this.steady = true; } else { this.stillT = 0; this.steady = false; }
    // the action's key, on foot only (the duel, the god hand, the skiff and the helm keep their own keys: core/actions.js)
    if (g.input?.wasPressed?.('KeyG') && g.actions?.live?.().has('foot')) this.press();
  }
}

/** The actions built, by art id: `can(run, R)` a refusal's words or nothing, `go(run, R)` the art. */
const ACTS = {
  beginnersLuck: { go: (run, R) => { run.luckUntil = run.now + R.does.within; } },
  charge: { // Onrush: the blink's body run forward, everything on the line struck
    go: (run, R) => {
      const P = run.P, dir = P.forward(new THREE.Vector3());
      run.rush(dir, R.does.dist, (from, to) => run.sweep(from, to, R.does.width, R.does.power, R.id));
    },
  },
  wade: { // Water Walk: the surface bears them, paint runs faster
    go: (run, R) => { run.wadeK = R.does.paintSpeed; run.mgr.get?.('waterwalk')?.on(R.does.dur); },
  },
  ripostRush: { // within its window of a parry: blinked behind what was parried, and struck
    can: (run, R) => { const p = run.parried; return p && p.c?.alive && run.now - p.at <= R.does.after ? null : `Riposte Rush needs a parry first: parry a blow, then use it within ${R.does.after} s.`; },
    go: (run, R) => {
      const P = run.P, c = run.parried.c; run.parried = null;
      const to = _b.copy(c.pos).sub(P.pos).setY(0), d = to.length(); if (d < 1e-3) return;
      const dir = to.normalize().clone(), dist = d + (c.radius ?? 0.6) + 0.9;
      run.rush(dir, dist, () => { if (c.alive) run.game.creatures?.strike(c, c.pos.clone().setY(c.pos.y + 0.8), dir.clone().negate(), R.does.power, 'art', 'courier'); });
    },
  },
  bulwark: { // braced: blows worth less, the body held still
    go: (run, R) => { run.braceUntil = run.now + R.does.dur; run.braceTaken = R.does.taken; },
  },
};
