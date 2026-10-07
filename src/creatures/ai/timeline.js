// ---------------------------------------------------------------------------------------
// THE TIMELINE: a scripted fight's clock (docs/AI.md, "Timelines"). A boss that is a pattern to be learned is not a mind weighing
// drives: it is a script of named CASTS at set times from the pull, the same every pull, grouped in PHASES that begin at a share of
// its health and loop, each loop faster, until the next phase begins. The runner keeps the clock and says three things, in order:
// a phase begins (`phase`), a cast begins (`cast`: its windup starts, the log names it), a cast lands (`blow`: its windup is over).
// What a cast DOES is the body's (the creature decides what each means, as with statuses); the script is data
// (progress/combat/greatjelly.js is the first). Casts never overlap: one due while another winds up waits for its blow, as a boss's
// cast bar holds one cast at a time. A phase marked `once` (a transition) ends after its `loop` and is not entered again; `marks` are
// casts at a share of health, once each (the second Slip Nova); `at` are casts at a time from the pull, once each (the hard enrage).
// Phases only go forward: a boss healed back over a phase's share (its adds fed it) stays in the phase it is in, and a transition
// run its course gives way to the phase after it. A cast `at` a time cuts in: the cast winding up then never lands.
//
// Prior art: FFXIV's boss timelines (the community's own timeline files: a cast at a time, a phase push at a share of health, the
// enrage at a fixed time; Cactbot's and ACT's timeline format: `time "Cast Name"`), Monster Hunter's scripted elder phases, and the
// Thunder Force boss whose attacks fall on the music's bars.
//
//   const T = new Timeline({ phases, casts, pick(share, done) -> phase, schedule(phase, t0) -> [{ t, cast }], marks, at, on })
//   on: { phase(p, prev), cast(id, def), blow(id, def) }
//   T.start()   T.update(dt, share)   T.stop()   T.t (seconds since the pull)   T.phase   T.casting { id, def, left } | null   T.running
// ---------------------------------------------------------------------------------------

export class Timeline {
  constructor({ phases, casts, pick, schedule, marks = [], at = [], on = {} }) {
    this.phases = phases; this.casts = casts; this.pick = pick; this.schedule = schedule || loopSchedule;
    this.marks = marks; this.at = at; this.on = on;
    this.running = false; this.t = 0; this.phase = null; this.queue = []; this.casting = null; this.waiting = [];
    this.done = new Set(); this.fired = new Set();
  }

  /** The pull: the clock starts at nought in the phase the full health picks. */
  start(share = 1) {
    this.running = true; this.t = 0; this.queue = []; this.casting = null; this.waiting = []; this.done.clear(); this.fired.clear();
    this.phase = null; this.enter(this.pick(share, this.done));
  }
  stop() { this.running = false; this.casting = null; this.queue = []; this.waiting = []; }

  enter(p) {
    const prev = this.phase;
    this.phase = p; this.entered = this.t;
    this.queue = this.schedule(p, this.t).filter((e) => e.t >= this.t); // (the old phase's casts not yet begun are dropped: a push skips them)
    this.on.phase?.(p, prev);
  }

  /** One step of the fight's clock (real seconds) at the boss's share of health now. */
  update(dt, share) {
    if (!this.running) return;
    this.t += dt;
    // a transition run its course is done; then the phase the health picks
    if (this.phase?.once && this.t - this.entered >= this.phase.loop) this.done.add(this.phase.id);
    const cur = this.phases.indexOf(this.phase);
    let i = this.phases.indexOf(this.pick(share, this.done));
    if (this.phase?.once && this.done.has(this.phase.id)) i = Math.max(i, cur + 1); // (a transition over gives way to what follows it)
    if (i > cur && this.phases[i]) this.enter(this.phases[i]);
    // the marks at a share, and the casts at a time, once each
    for (const m of this.marks) if (!this.fired.has(m) && share <= m.below) { this.fired.add(m); this.waiting.push(m.cast); }
    for (const a of this.at) if (!this.fired.has(a) && this.t >= a.t) { this.fired.add(a); this.waiting.unshift(a.cast); this.casting = null; } // (the enrage cuts in: the cast winding up never lands)
    while (this.queue.length && this.queue[0].t <= this.t) this.waiting.push(this.queue.shift().cast);
    // the cast winding up lands; the next waiting begins
    const C = this.casting;
    if (C && (C.left -= dt) <= 0) { this.casting = null; this.on.blow?.(C.id, C.def); }
    if (!this.casting && this.waiting.length) {
      const id = this.waiting.shift(), def = this.casts[id];
      if (!def) return;
      this.casting = { id, def, left: def.windup || 0 };
      this.on.cast?.(id, def);
    }
  }

  /** The casts of the phase still to come, for a test or a look (the next n). */
  upcoming(n = 4) { return [...this.waiting.map((cast) => ({ t: this.t, cast })), ...this.queue].slice(0, n); }
}

/** The default schedule: a phase's casts loop after loop from `t0`, each loop a fifth faster (greatjelly.js's `timeline` is the same rule). */
export function loopSchedule(phase, t0 = 0, until = 3600) {
  const out = [];
  let start = t0, speed = 1;
  for (let k = 0; start < until && k < 50; k++) {
    for (const [at, cast] of phase.casts) { const t = start + at / speed; if (t < until) out.push({ t, cast }); }
    if (phase.once) break;
    start += phase.loop / speed; speed *= 1.2;
  }
  return out;
}
