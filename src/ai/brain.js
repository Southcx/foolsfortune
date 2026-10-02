// ---------------------------------------------------------------------------------------
// BRAIN: the parts of a mind put together. A creature's brain has senses (senses.js) that write into its memory (memory.js), drives
// (drives.js) that creep up, and a reasoner (utility.js) that, a few times a second, scores every action against all of that and picks
// one. The chosen action then runs every frame (it steers, it winds up, it bites) until it finishes, fails, or something scores better.
// Everything a creature does is an action, and everything an action needs to know is in the CONTEXT it is handed:
//
//   ctx = { game, c (the creature), brain, mem, drives, eco (ecology.js), now, P (the Courier),
//           focus (the fact it is most sure of), bb (the running action's own scratch: cleared when it changes) }
//
//   const b = new Brain(game, creature, { senses, memory, drives, actions, think: 0.2 })
//   b.update(dt)        every frame (it decides how often to think, and how much, by how far it is from the Courier: below)
//   b.signal()          think again at once (it was hurt, a status landed, a macro was typed into it)
//   b.force(id, why)    start that action now, whatever it scores (a reprogrammed order; it still ends as actions end)
//   b.direct(id, secs)  a DIRECTIVE: that action, for so long (a reprogrammed mind: mind/macros.js)
//   b.describe()        one line for the F3 panel: what it is doing, what it wants, who it is watching
//
// LEVEL OF DETAIL: near the Courier (within `near` metres) it thinks five times a second; further off (within `far`) twice; beyond
// that it does not think or look at all, its drives still tick, and the creature's own update keeps it parked where it is (the
// abstract simulation of an off-screen creature, at the cost of a few additions).
//
// Prior art: the agent architectures of the games that made creatures feel alive (Halo's sense-think-act loop and its knowledge model;
// Monster Hunter's and Rain World's creatures with their own wants, ranked every so often; F.E.A.R.'s and Shadow of Mordor's minds
// built from parts), the blackboard (a scratch per behaviour) of every behaviour-tree engine, and the off-screen "abstract AI" of Rain
// World and of the MMOs, where a creature far from any player costs next to nothing.
// ---------------------------------------------------------------------------------------
import { Reasoner } from './utility.js';

export class Brain {
  constructor(game, c, { senses, memory, drives, actions, think = 0.2, near = 45, far = 130, watch = 26, mods = null } = {}) {
    this.game = game; this.c = c;
    this.senses = senses; this.mem = memory; this.drives = drives;
    this.reasoner = new Reasoner(actions);
    this.think = think; this.near = near; this.far = far; this.watchR = watch; this.mods = mods;
    this.action = null; this.score = 0; this.cool = new Map();
    this.now = 0; this.thinkT = Math.random() * think; this.acc = 0; this.wake = false;
    this.bb = {};
    this.lod = 'near';
    this._ctx = { game, c, brain: this, mem: memory, drives, eco: game.ai?.eco, now: 0, P: game.player, focus: null, bb: this.bb };
  }

  get ctx() {
    const x = this._ctx;
    x.now = this.now; x.bb = this.bb; x.eco = this.game.ai?.eco; x.P = this.game.player;
    x.focus = this.mem.focus();
    return x;
  }

  /** What it can see this think: the Courier, and the creatures near it. */
  watchList() {
    const g = this.game, P = g.player, c = this.c, out = this._watch || (this._watch = []);
    out.length = 0;
    const hidden = !!g.character?.hidden || (g.character?.dissolve ?? 0) > 0.5 || !!g.god?.active;
    const sp = Math.hypot(P.vel?.x || 0, P.vel?.z || 0);
    const loud = (P.sliding ? 1.2 : P.crouching ? 0.45 : sp > 5 ? 1.35 : sp > 0.5 ? 0.9 : 0.55) * (g.belt?.inHand ? 1.15 : 1);
    out.push({ ent: P, kind: 'courier', pos: P.pos, vel: P.vel, loud, height: 1.7, hidden });
    for (const o of g.creatures?.near(c.pos, this.watchR) || []) if (o !== c) out.push({ ent: o, kind: o.kind, pos: o.pos, vel: o.vel, loud: o.loud ?? 1, height: o.height });
    return out;
  }

  update(dt) {
    const P = this.game.player, c = this.c;
    this.now += dt; this.mem.tick(dt);
    const d = Math.hypot(P.pos.x - c.pos.x, P.pos.z - c.pos.z) + Math.abs(P.pos.y - c.pos.y) * 0.5;
    this.lod = d < this.near ? 'near' : d < this.far ? 'mid' : 'far';
    this.drives?.tick(dt, this.mods?.(this.ctx) || undefined);
    // relations written into it (a reprogrammed mind: c.rel with c.relUntil) wear off in their time
    if (c.relUntil) for (const [k, t] of c.relUntil) if (this.now >= t) { c.rel?.delete(k); c.relUntil.delete(k); this.game.events?.emit('reprogram.wear', { macro: 'rel', kind: c.kind }); }
    if (this.lod === 'far') { this.acc = 0; return; }
    this.acc += dt; this.thinkT -= dt;
    if (this.thinkT <= 0 || this.wake) {
      this.thinkT = (this.lod === 'near' ? this.think : this.think * 2.5) * (0.85 + Math.random() * 0.3); // (a little jitter: minds do not tick together)
      this.senses?.update(this.acc, c, this.mem, this.watchList());
      this.acc = 0; this.wake = false;
      this.decide();
    }
    if (this.action) {
      const r = this.action.tick?.(this.ctx, dt) ?? 'run';
      if (r !== 'run') { this.end(r); this.decide(); }
    }
  }

  decide() {
    const { action, score } = this.reasoner.choose(this.ctx);
    this.score = score;
    // a DIRECTIVE (a reprogrammed mind, mind/macros.js): for its time, that action is what it does, unless something urgent takes it
    // (stunned, asleep, melted: the urgent actions of weight 5 and up are the body's, not the mind's, and win)
    const d = this.directive;
    if (d && this.now < d.until && !(action?.urgent && (action.weight ?? 1) >= 5)) {
      if (d.action !== this.action) this.start(d.action, 'directive');
      this.score = 9;
      return;
    }
    if (d && this.now >= d.until) this.directive = null;
    if (action && action !== this.action) this.start(action, 'chose');
  }

  /** Make an action what it does for `secs` (its own `when` is not asked: it was told). False if its mind has no such action. */
  direct(id, secs) {
    const a = this.reasoner.actions.find((x) => x.id === id);
    if (!a) return false;
    this.directive = { action: a, until: this.now + secs };
    this.cool.delete(id);
    this.wake = true;
    return true;
  }

  start(a, why) {
    if (this.action) this.end('switch');
    this.action = a; this.bb = {}; this.since = this.now;
    a.enter?.(this.ctx, why);
  }
  end(why) {
    const a = this.action;
    if (!a) return;
    a.exit?.(this.ctx, why);
    if (a.cooldown) this.cool.set(a.id, this.now + (typeof a.cooldown === 'function' ? a.cooldown(this.ctx) : a.cooldown));
    this.action = null; this.bb = {};
  }

  signal() { this.wake = true; }
  force(id, why = 'forced') {
    const a = this.reasoner.actions.find((x) => x.id === id);
    if (a) { this.cool.delete(id); this.start(a, why); }
    return !!a;
  }
  /** How long the running action has run. */
  get running() { return this.now - (this.since ?? this.now); }

  describe() {
    const f = this.mem.focus();
    return `${this.action?.id ?? '-'}${this.directive ? '*' : ''} ${this.score.toFixed(2)} [${this.lod}] | ${this.drives ?? ''} | ${f ? `${f.kind} ${f.aware.toFixed(2)}${f.threat > 0.05 ? ` t${f.threat.toFixed(2)}` : ''}` : 'nothing'}`;
  }
}
