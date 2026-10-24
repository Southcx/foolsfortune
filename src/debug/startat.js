// ---------------------------------------------------------------------------------------
// START AT: `?at=dunes|raceway|godhand|workshop` sets the Courier down in a place after the title's choice, so a tester (the owner on a phone,
// before touch play exists: docs/plans/MOBILE.md 10.3) can shoot four places without walking to them.
//   workshop   where the Courier wakes: nothing to do.
//   dunes      the sand sea, the oasis: `game.places.travel('dunes')`, the same teleport the Index's THE DUNES row does (`course.toDunes`),
//              without the gate-out cover.
//   raceway    the park's hub: `game.places.travel('raceway')`, which is `raceway.arrive()`, as the Index's THE RACEWAY row does.
//   godhand    the workshop with the god hand taken: `god.toggle()` (the ~ key's call), as soon as the Courier stands on solid ground.
// It works in either save mode and counts nothing: what the travel's events tally in the ledger (the hand taken, a place entered) is put
// back, and nothing is written to the save. A replay is played from its own start, never from `?at`. With no `?at`, or an unknown place, the
// game starts as always (an unknown one is said once in the log).
//
// Prior art: Unity's and Unreal's "play from here" (a start position the editor sets), Quake's `+map` and Source's `map` launch options,
// and the sweeps' own `S.go` (scripts/sweeps/harness.mjs), which sends the Courier to a place through the agent (`game.places.travel`).
//
//   const at = new StartAt(game)     (listens for `title.enter`; main.js calls `at.apply()` itself where a test drive skips the title)
//   at.apply() -> bool     at.update(rawDt)   (each tick: the hand waits for solid ground)     START_PLACES
//   Event: start.at { place, ok, why?, by: 'environment' }   (feedback/tracking/startat.js says it)
// ---------------------------------------------------------------------------------------

export const START_PLACES = ['workshop', 'dunes', 'raceway', 'godhand'];
const HAND_WAIT = 6; // (real s the god hand waits for solid ground before it is given up)

/** `fn` run with the ledger put back as it was after (its own `hold`: progress/stats.js): the counts and firsts the events of a travel
 *  tally (the hand taken, a Raceway entered) are not play; achievements read the ledger a frame later, so none is awarded for it. */
export const uncounted = (game, fn) => (game.ledger?.hold ? game.ledger.hold(fn) : fn());

export class StartAt {
  constructor(game, query = new URLSearchParams(location.search)) {
    this.game = game;
    this.want = (query.get('at') || '').trim().toLowerCase() || null;
    this.done = false; this.hand = null;
    game.events.on('title.enter', () => this.apply());
  }

  say(place, ok, why = null) { this.game.events.emit('start.at', { place, ok, ...(why ? { why } : {}), by: 'environment' }); return ok; }

  /** Once, after the title's choice (or at the end of a test drive's boot). True if the Courier was set down, or the hand is on its way. */
  apply() {
    const g = this.game, id = this.want;
    if (this.done || !id) return false;
    this.done = true;
    if (!START_PLACES.includes(id)) return this.say(id, false, `try ${START_PLACES.join(', ')}`);
    if (id === 'workshop') return this.say(id, true);
    if (id === 'godhand') { this.hand = { waited: 0 }; return true; }
    if (!g.places?.get(id)) return this.say(id, false, 'that place is not built');
    try {
      const at = uncounted(g, () => g.places.travel(id));
      return this.say(id, !!at, at ? null : 'the game would not take you there from here');
    } catch (e) { return this.say(id, false, e.message); } // (a start that fails is said, never a failed boot)
  }

  /** Each tick: the god hand opens once the Courier is on solid ground (the first ticks after a title's dive may find them in the air). */
  update(dt) {
    const g = this.game, h = this.hand;
    if (!h) return;
    if (g.god?.canEnter()) {
      this.hand = null;
      try { uncounted(g, () => g.god.toggle()); this.say('godhand', g.god.state !== 'off'); } catch (e) { this.say('godhand', false, e.message); }
      return;
    }
    if ((h.waited += dt) > HAND_WAIT) { this.hand = null; this.say('godhand', false, 'there is no solid ground to take the hand on'); }
  }
}
