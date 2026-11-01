// ---------------------------------------------------------------------------------------
// THE SYSTEMS: what runs each frame, registered by whoever builds it, in place of a line added to the frame by hand
// (docs/plans/SOLID.md 3.1). The frame (boot/frame.js) runs a phase at its fixed point in the tick; a system joins a phase when
// it is built and leaves it when it is taken down. Adding a system never edits the frame (open for extension, closed for change);
// the frame depends on one small interface, `update(dt)`, never on what the system is.
//
// A phase keeps the order systems joined it in. A system says which clock it reads: the game's (`dt`, slowed by the hitstop and
// the time scale) or the wall's (`raw`, real seconds: a look that must not stall with the world). `when` skips it on a frame
// (a room asleep), so the frame holds no conditions of its own for it.
//
// Prior art: Bevy's and Unity DOTS's system schedules (systems in named stages, the stage's order fixed, a system's place in it
// declared by the system), and Godot's process groups.
//
//   game.systems = new Systems()
//   const off = game.systems.add('looks', thing, { clock: 'raw', name: 'seaLooks', when: () => !asleep })   off() (leave)
//   game.systems.add('looks', (dt) => ..., { name })      (a function is a system too)
//   game.systems.run('looks', dt, rawDt)   (the frame, at the phase's point)   .list(phase) -> names   PHASES
// ---------------------------------------------------------------------------------------

/** The phases, in the order the frame runs them. Each is a fixed point in boot/frame.js's tick. */
export const PHASES = ['looks'];

export class Systems {
  constructor() { this.phases = new Map(PHASES.map((p) => [p, []])); }

  /** Join a phase. `sys` is an object with `update(dt)` or a function of dt. Returns the function that takes it out again. */
  add(phase, sys, { clock = 'game', name = sys?.constructor?.name || 'system', when = null } = {}) {
    const list = this.phases.get(phase);
    if (!list) throw new Error(`systems: no phase '${phase}' (PHASES: ${PHASES.join(', ')})`);
    if (!sys) return () => {};
    const run = typeof sys === 'function' ? sys : (dt) => sys.update(dt);
    const entry = { run, clock, name, when };
    list.push(entry);
    return () => { const i = list.indexOf(entry); if (i >= 0) list.splice(i, 1); };
  }

  /** Run a phase's systems in the order they joined, each on its own clock. */
  run(phase, dt, raw = dt) {
    const list = this.phases.get(phase);
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (e.when && !e.when()) continue;
      e.run(e.clock === 'raw' ? raw : dt);
    }
  }

  /** The names in a phase, in order (the diagnostics' and the gate's view). */
  list(phase) { return (this.phases.get(phase) || []).map((e) => e.name); }
}
