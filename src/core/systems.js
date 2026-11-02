// ---------------------------------------------------------------------------------------
// THE SYSTEMS: what runs each frame, registered by whoever builds it, in place of a line added to the frame by hand
// (docs/plans/SOLID.md 3.1). The frame (boot/frame.js) runs a phase at its fixed point in the tick; a system joins a phase when
// it is built and leaves it when it is taken down. Adding a system never edits the frame (open for extension, closed for change);
// the frame depends on one small interface, `update(dt)`, never on what the system is.
//
// A phase keeps the order systems joined it in, except where a system declares `after: 'name'` (or a list): then it runs after
// those, wherever they joined (a stable topological sort, join order breaking ties; a name not in the phase is ignored, so a
// system built late or never still orders the rest). A system says which clock it reads: the game's (`dt`, slowed by the hitstop and
// the time scale) or the wall's (`raw`, real seconds: a look that must not stall with the world). `when` skips it on a frame
// (a room asleep), so the frame holds no conditions of its own for it.
//
// Prior art: Bevy's and Unity DOTS's system schedules (systems in named stages, the stage's order fixed, a system's place in it
// declared by the system), and Godot's process groups.
//
//   game.systems = new Systems()
//   const off = game.systems.add('looks', thing, { clock: 'raw', name: 'seaLooks', when: () => !asleep })   off() (leave)
//   game.systems.add('looks', (dt) => ..., { name })      (a function is a system too)
//   game.systems.add('world', race, { name: 'race', after: 'raceway' })   (runs after the Raceway's, whoever joined first)
//   game.systems.run('looks', dt, rawDt)   (the frame, at the phase's point)   .list(phase) -> names   PHASES
// ---------------------------------------------------------------------------------------

/** The phases, in the order the frame runs them. Each is a fixed point in boot/frame.js's tick: `looks` after the rooms' runtimes
 *  (the crossing, the open sea, the garden), `world` after the props and the pool (the rooms' and progress's own services: the
 *  Well, the Raceway, the pier, the quests ...), `fx` with the effects (the weather's look, the night, the water, the wipes,
 *  the glitch and the storm warp, the duel's view ...), `marks` after the effects (the world's dressers and each tool's marks). */
export const PHASES = ['looks', 'minds', 'world', 'fx', 'marks'];

export class Systems {
  constructor() { this.phases = new Map(PHASES.map((p) => [p, []])); }

  /** Join a phase. `sys` is an object with `update(dt)` or a function of dt (missing: it throws, so a registration made before its
   *  thing is built fails at boot, not by never running). Returns the function that takes it out again. */
  add(phase, sys, { clock = 'game', name = sys?.constructor?.name || 'system', when = null, after = null } = {}) {
    const list = this.phases.get(phase);
    if (!list) throw new Error(`systems: no phase '${phase}' (PHASES: ${PHASES.join(', ')})`);
    if (!sys) throw new Error(`systems: '${name}' joined '${phase}' before it was built`); // (a registration ahead of its construction would never run, silently)
    const run = typeof sys === 'function' ? sys : (dt) => sys.update(dt);
    const entry = { run, clock, name, when, after: after == null ? null : [].concat(after), seq: this._seq = (this._seq || 0) + 1 };
    list.push(entry);
    if (entry.after || list.some((e) => e.after)) this.phases.set(phase, order(list));
    return () => { const l = this.phases.get(phase), i = l.indexOf(entry); if (i >= 0) l.splice(i, 1); };
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

/** A phase's entries sorted so each runs after the names it declares, join order breaking ties (Kahn's, lowest `seq` first). A
 *  cycle is a mistake: it throws, naming who is in it. */
function order(list) {
  const byName = new Map();
  for (const e of list) { if (!byName.has(e.name)) byName.set(e.name, []); byName.get(e.name).push(e); }
  const need = new Map(list.map((e) => [e, new Set((e.after || []).flatMap((n) => byName.get(n) || []).filter((d) => d !== e))]));
  const out = [], left = [...list].sort((a, b) => a.seq - b.seq);
  while (left.length) {
    const i = left.findIndex((e) => [...need.get(e)].every((d) => out.includes(d)));
    if (i < 0) throw new Error(`systems: a cycle in 'after' among ${left.map((e) => e.name).join(', ')}`);
    out.push(left.splice(i, 1)[0]);
  }
  return out;
}
