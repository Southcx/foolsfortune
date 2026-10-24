// ---------------------------------------------------------------------------------------
// THE TRAPS (docs/plans/TRACK-EDITOR.md 4; the owner, 2026-10-24: "seven initial trap types, we can copy other games' homework on trap
// design"): a made track's dangers, each a thing in the world with four parts or it is not a trap but a wall:
//   1. a CYCLE: what it does on its own (its period and offset settable in the editor: Fall Guys' exposed timing);
//   2. a TELL: at least TRAP.tellMin real seconds of warning (the Figment attack telegraph's grammar: where, when, what kind), never an
//      unseen blow;
//   3. an ANSWER: one of the skiff's own verbs beats it (the hop, the carve, the pop, the glide, another lane, the parry);
//   4. a POSSESSED mode: what a possessor does with it (Crawl's ghosts), and its cooldown; a possessed trap keeps its tell.
// The core movement is never touched: a trap is a modifier with a source you can see (DESIGN.md 22). This module is the rules and the
// clock, pure; the world's traps are world/raceway/traps.js.
//
// The homework, trap by trap (what each copies):
//   rising pillars   Fall Guys' pistons, Mario Kart's Thwomps: a lane closes on a beat; read the tell, take another lane.
//   pendulum         every platformer's swinging blade, Ultimate Chicken Horse's swing: time it.
//   gust gate        Ultimate Chicken Horse's fan, Wave Race's wind: a shove across the track; carve into it.
//   sinkhole         Mario Kart's pits, Crash Bandicoot's collapsing floor: the sand opens; hop or glide over.
//   crude gusher     Mario Kart's oil slick, Spy Hunter's: grip lost over a patch for a while; pop over it, or ride round.
//   portal pair      Ultimate Chicken Horse's teleporters, Portal: lit, a shortcut; possessed, a send-back. Read shows which.
//   Wisp turret      Ultimate Chicken Horse's crossbow, Crawl's turrets, the Lantern Wisp's own flame: a shot at the rider; parry it
//                    and it flies home and stuns the turret (and its possessor).
// Each is made with a god power of its domain (the editor opens it with that power), so every domain but Divination owns one, and
// Divination is the rider's: Read shows a possessed trap's next intent (TRACK-EDITOR.md 6).
//
//   TRAP   TRAPS[kind] = { label, line, power, cost, cycle: { period, min, max, tell, active }, cooldown, size, ... }   TRAP_KINDS
//   autoPhase(kind, period, offset, t) -> { phase: 'idle' | 'tell' | 'active', k (0..1 through it), swing? }
//   class TrapClock: .phase .k  .fire() -> bool  .ready  .step(dt)   (a possessed trap's clock: idle -> tell -> active -> cooldown)
// ---------------------------------------------------------------------------------------

/** The law of every trap. `tellMin`: real seconds of warning at least; `grace`: metres after a gate where no trap may stand; `perTrack`:
 *  traps at most on a track; `wrath`: Crawl's: a possessor who goes `wrath.lap` real seconds without a hit grows its trap a step (to
 *  `wrath.max`), each step `wrath.k` stronger; a hit resets it. */
export const TRAP = { tellMin: 0.6, grace: 30, perTrack: 12, wrath: { every: 40, max: 3, k: 0.15 } };

export const TRAPS = {
  pillars: {
    label: 'Rising pillars', line: 'A row of pillars rises across one lane, then sinks. Read the tell; take another lane.',
    power: 'sculpt', cost: 8, cycle: { period: 4, min: 2.5, max: 8, tell: 0.8, active: 1.4 }, cooldown: 2.5,
    size: { len: 4, w: 24, lanes: 3, h: 4 }, hit: { kind: 'wall', size: 9, keep: 0.25 },
    possessed: 'pick the lane that rises (Q / E), and when',
  },
  pendulum: {
    label: 'Pendulum', line: 'A stone swings across the track. Time it.',
    power: 'totem', cost: 8, cycle: { period: 3.2, min: 2, max: 6, tell: 0.7, active: 0 }, cooldown: 2,
    size: { len: 3, arm: 9, reach: 12, bob: 1.8 }, hit: { kind: 'bump', size: 8, shove: 11, up: 3 },
    possessed: 'hold it at one end, and let it swing',
  },
  gust: {
    label: 'Gust gate', line: 'A blast of wind across the track. Carve into it.',
    power: 'gust', cost: 8, cycle: { period: 5, min: 3, max: 10, tell: 0.9, active: 1.2 }, cooldown: 3,
    size: { len: 14, w: 24 }, push: 15,
    possessed: 'fire it, and choose its side (Q / E)',
  },
  sinkhole: {
    label: 'Sinkhole', line: 'The sand opens for a moment. Hop or glide over.',
    power: 'scoop', cost: 8, cycle: { period: 6, min: 3, max: 12, tell: 1.0, active: 1.5 }, cooldown: 3.5,
    size: { r: 5 }, hit: { kind: 'bail' },
    possessed: 'open it under a rider',
  },
  gusher: {
    label: 'Crude gusher', line: 'Crude spills across a lane: the board slides on it until it dries. Pop over it, or ride round.',
    power: 'transmute', cost: 8, cycle: { period: 9, min: 5, max: 16, tell: 1.0, active: 6 }, cooldown: 5,
    size: { r: 7 }, grip: 0.3,
    possessed: 'spill it',
  },
  portal: {
    label: 'Portal pair', line: 'Two linked eyes. Lit, the first sends you on to the second: a shortcut. Possessed, it sends you back.',
    power: 'portal', cost: 8, cycle: { period: 8, min: 4, max: 14, tell: 0.8, active: 4 }, cooldown: 4, pair: true,
    size: { r: 3 },
    possessed: 'turn it red: while red, the first eye sends a rider back as far as the shortcut would have taken it on (once: a rider sent back is spared until it is past the eye)',
  },
  turret: {
    label: 'Wisp turret', line: 'A Lantern Wisp in a lamp casts its flame at the rider. Parry it, and it flies home and stuns the turret.',
    power: 'take', cost: 8, cycle: { period: 3.5, min: 2.5, max: 8, tell: 0.9, active: 0.2 }, cooldown: 2.5,
    size: { r: 1.5, range: 70 }, ball: { speed: 24, r: 1.3, life: 4, home: 0.8, parry: 5 }, stun: 4, hit: { kind: 'bump', size: 10, shove: 6, up: 2 },
    possessed: 'aim it and cast',
  },
};
export const TRAP_KINDS = Object.keys(TRAPS);
for (const K of Object.values(TRAPS)) if (K.cycle.tell < TRAP.tellMin && K.cycle.active > 0) throw new Error(`a trap's tell under ${TRAP.tellMin} s: ${K.label}`);

/** An unpossessed trap's place in its cycle at real time t: idle, then the tell, then active, then idle again (period and offset its own).
 *  The pendulum always swings: `swing` is its angle's share of its arc (-1 .. 1), its tell the stretch before it crosses the track. */
export function autoPhase(kind, period, offset, t) {
  const K = TRAPS[kind], P = Math.max(K.cycle.min, Math.min(K.cycle.max, period || K.cycle.period)), c = (((t + (offset || 0)) % P) + P) % P;
  if (kind === 'pendulum') { const swing = Math.sin((2 * Math.PI * c) / P); return { phase: Math.abs(swing) < 0.45 ? 'active' : 'idle', k: c / P, swing }; }
  const act = K.cycle.active, tell = K.cycle.tell, a0 = P - act, t0 = a0 - tell;
  if (c >= a0) return { phase: 'active', k: (c - a0) / Math.max(1e-6, act) };
  if (c >= t0) return { phase: 'tell', k: (c - t0) / tell };
  return { phase: 'idle', k: c / Math.max(1e-6, t0) };
}

/** A possessed trap's clock: fired, it tells, acts, then cools; it cannot be fired again until cool. (A pendulum held: `swing` stays at
 *  its end until fired, then swings across once.) */
export class TrapClock {
  constructor(kind) { this.kind = kind; this.K = TRAPS[kind]; this.phase = 'idle'; this.t = 0; this.k = 0; this.cool = 0; this.swing = 1; }
  get ready() { return this.phase === 'idle' && this.cool <= 0; }
  fire() { if (!this.ready) return false; this.phase = 'tell'; this.t = 0; return true; }
  step(dt) {
    this.cool = Math.max(0, this.cool - dt);
    const C = this.K.cycle; if (this.phase === 'idle') { this.k = 0; return; }
    this.t += dt;
    if (this.phase === 'tell') { this.k = Math.min(1, this.t / C.tell); if (this.t >= C.tell) { this.phase = 'active'; this.t = 0; } }
    else if (this.phase === 'active') {
      const dur = this.kind === 'pendulum' ? C.period / 2 : C.active;
      this.k = Math.min(1, this.t / Math.max(1e-6, dur));
      if (this.kind === 'pendulum') this.swing = Math.cos(Math.PI * this.k) * (this.from ?? 1);
      if (this.t >= dur) { this.phase = 'idle'; this.cool = this.K.cooldown; if (this.kind === 'pendulum') this.from = -(this.from ?? 1); }
    }
  }
}
