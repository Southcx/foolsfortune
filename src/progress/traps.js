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
// The other six (G305, 2026-11-03; their geometry is progress/trapzones.js):
//   antlion          Crash Team Racing's pursuing hazards, Mario Kart's Chain Chomp, the pits' own maw (escape.js): a maw out of the sand
//                    behind the rider, lunging along the line; out-run it, carve out of its lane, or hop it.
//   boulder          Indiana Jones, Excitebike's obstacles, Donkey Kong's barrels: a rock rolls down the line at the rider; the shoulder
//                    breaks it, or hop it.
//   hasten field     Braid's time-dilation bubble, Mario Kart's mud: a patch where the board's clock drags; go round it.
//   storm cell       Mario Kart's lightning, Zelda's storms: three marks on the sand, a bolt on each in turn; read the marks.
//   ward gate        Ultimate Chicken Horse's force fields: a circle shuts for a beat; go round it.
//   pot catapult     Donkey Kong Country's barrel cannons, Crash Team Racing's TNT crates: a pot lobbed onto the line; pop it in the air
//                    or dodge the landing.
// Each is made with a god power of its domain (the editor opens it with that power), so every domain but Divination owns one, and
// Divination is the rider's: Read shows a possessed trap's next intent (TRACK-EDITOR.md 6; the ghost line: `readOf`, below, G308).
//
//   TRAP   TRAPS[kind] = { label, line, power, cost, cycle: { period, min, max, tell, active }, cooldown, size, ... }   TRAP_KINDS
//   TRAP_OPEN[kind] = { count?: [key, n], feat?: [key, n], hint } (null: given)   trapOpen(kind, L) -> bool (G309: the editor's traps by
//   achievement, never by a god power's level: DESIGN.md 22, arts only by achievement)
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
  // ---- the other six (G305; the plan's table, TRACK-EDITOR.md 4). `meet`: the share of its active stretch at which its threat is at the
  // trap's own place (the bot's timing, trapbot.js); `ahead`: metres past the trap where it lands (the pot); `lanes`: it takes a lane (the
  // possessor's Q / E, an unpossessed one's turn in turn); geometry: progress/trapzones.js.
  antlion: {
    label: 'Antlion', line: 'A maw rises out of the sand behind you and lunges along a lane. Out-run it, carve out of the lane, or hop it.',
    power: 'take', cost: 10, cycle: { period: 7, min: 4, max: 14, tell: 1.0, active: 1.2 }, cooldown: 3.5, lanes: true, meet: 0.31,
    size: { r: 4.5, back: 22, reach: 50 }, hit: { kind: 'bail' },
    possessed: 'steer it into a lane (Q / E), and lunge',
  },
  boulder: {
    label: 'Boulder', line: 'A rock rolls down a lane at you. Break it with the shoulder, or hop it.',
    power: 'telekinesis', cost: 8, cycle: { period: 8, min: 4, max: 14, tell: 1.0, active: 1.6 }, cooldown: 4, lanes: true, meet: 0.73,
    size: { r: 2.6, reach: 44, tail: 16, split: 7 }, hit: { kind: 'wall', size: 9, keep: 0.3 },
    possessed: 'choose the lane (Q / E), and let it roll',
  },
  hasten: {
    label: 'Hasten field', line: 'A patch where the board\'s clock drags: whatever is in it slows. Go round, or cross it before it shuts.',
    power: 'hasten', cost: 8, cycle: { period: 10, min: 6, max: 18, tell: 0.9, active: 3 }, cooldown: 4.5, meet: 0.3,
    size: { r: 9 }, drag: 1.6,
    possessed: 'stop time in it, over the lane you choose (Q / E)',
  },
  storm: {
    label: 'Storm cell', line: 'Marks on the sand, then a bolt on each in turn. Read the marks; the hop does not help, a lane does.',
    power: 'miracle', cost: 10, cycle: { period: 8, min: 5, max: 14, tell: 1.2, active: 1.5 }, cooldown: 4, lanes: true, meet: 0.5,
    size: { r: 3.5, bolts: 3, spread: 8 }, hit: { kind: 'bump', size: 10, shove: 10, up: 3 },
    possessed: 'place the strikes: the lane you choose (Q / E) is where the middle one falls',
  },
  ward: {
    label: 'Ward gate', line: 'A circle on the sand shuts for a beat and the board cannot cross it. Time it, or go round.',
    power: 'ward', cost: 8, cycle: { period: 8, min: 5, max: 14, tell: 1.0, active: 1.2 }, cooldown: 4, meet: 0.4,
    size: { r: 7 }, hit: { kind: 'wall', size: 8, keep: 0.2 },
    possessed: 'shut it on a rider, over the lane you choose (Q / E)',
  },
  catapult: {
    label: 'Pot catapult', line: 'Clapperjars lob a pot onto the line. Pop over it in the air, or dodge where it lands.',
    power: 'muster', cost: 10, cycle: { period: 7, min: 4, max: 12, tell: 1.1, active: 1.2 }, cooldown: 3.5, lanes: true, meet: 0.92, ahead: 36,
    size: { r: 4, range: 36, arc: 9, smash: 3.5 }, hit: { kind: 'bump', size: 9, shove: 9, up: 2 },
    possessed: 'aim the lob into a lane (Q / E)',
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
    if (this.phase === 'tell') { this.k = Math.min(1, this.t / C.tell); if (this.t >= C.tell) { this.phase = 'active'; this.t = 0; this.k = 0; } } // (k runs 0..1 through each phase: the first frame of the act is its start, not the tell's end)
    else if (this.phase === 'active') {
      const dur = this.kind === 'pendulum' ? C.period / 2 : C.active;
      this.k = Math.min(1, this.t / Math.max(1e-6, dur));
      if (this.kind === 'pendulum') this.swing = Math.cos(Math.PI * this.k) * (this.from ?? 1);
      if (this.t >= dur) { this.phase = 'idle'; this.cool = this.K.cooldown; if (this.kind === 'pendulum') this.from = -(this.from ?? 1); }
    }
  }
}

/** Which traps the editor offers (GAPS G309; TRACK-EDITOR.md 9): two given from the start, the rest each opened by a count way (haunted
 *  races run: where you meet traps fired at you, TRACK-EDITOR.md 7) or a feat way (wrecking rivals with the trap before it in the
 *  ladder while you haunt a track: you learn a trap by using the last one well). Super Mario Maker's elements unlocked as you build,
 *  Ultimate Chicken Horse's box of traps; the god powers still make them, their level never gates them. Counts sized at about two
 *  haunted races a rung (a race 3 to 4 real minutes: the whole box in about 40 minutes of haunted racing). */
export const TRAP_OPEN = {
  pillars: null,
  gust: null,
  pendulum: { count: ['race.haunted', 2], feat: ['trap.wreck.pillars', 3], hint: 'Race 2 haunted races, or wreck 3 rivals with rising pillars' },
  sinkhole: { count: ['race.haunted', 4], feat: ['trap.wreck.gust', 3], hint: 'Race 4 haunted races, or wreck 3 rivals with a gust gate' },
  gusher: { count: ['race.haunted', 6], feat: ['trap.wreck.pendulum', 3], hint: 'Race 6 haunted races, or wreck 3 rivals with a pendulum' },
  portal: { count: ['race.haunted', 8], feat: ['trap.warp.on', 3], hint: 'Race 8 haunted races, or ride a portal on 3 times' },
  turret: { count: ['race.haunted', 10], feat: ['trap.parry', 1], hint: 'Race 10 haunted races, or send a turret\'s flame back once' },
  // the other six, a rung each after the turret: the whole box of thirteen in about 55 real minutes of haunted racing
  antlion: { count: ['race.haunted', 11], feat: ['trap.wreck.turret', 3], hint: 'Race 11 haunted races, or wreck 3 rivals with a Wisp turret' },
  boulder: { count: ['race.haunted', 12], feat: ['trap.wreck.antlion', 3], hint: 'Race 12 haunted races, or wreck 3 rivals with an antlion' },
  hasten: { count: ['race.haunted', 13], feat: ['trap.break', 1], hint: 'Race 13 haunted races, or break a boulder with the shoulder once' },
  storm: { count: ['race.haunted', 14], feat: ['trap.wreck.hasten', 3], hint: 'Race 14 haunted races, or wreck 3 rivals with a hasten field' },
  ward: { count: ['race.haunted', 15], feat: ['trap.wreck.storm', 3], hint: 'Race 15 haunted races, or wreck 3 rivals with a storm cell' },
  catapult: { count: ['race.haunted', 16], feat: ['trap.smash', 3], hint: 'Race 16 haunted races, or pop 3 pots in the air' },
};
/** Is a trap kind open in the editor (a ledger predicate). */
export function trapOpen(kind, L) {
  const R = TRAP_OPEN[kind]; if (R === null) return true; if (!R) return false;
  const got = (k) => L?.get?.(k) || 0;
  return (R.count && got(R.count[0]) >= R.count[1]) || (R.feat && got(R.feat[0]) >= R.feat[1]);
}
