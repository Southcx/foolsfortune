// ---------------------------------------------------------------------------------------
// QAIS'S EVIDENCE: a QAIS test may name the event it expects (`watch: { event, match? }`); while the test is open in the round the game
// listens, and the first sightings are written to the test (`seen`: the real time and the payload's gist). It never ticks a test: an
// event firing is not the same as it looking or sounding right (docs/plans/QAIS.md, Tests).
//
// One listener (Petra's answer 2): a single tap on `game.events` ('*'), holding the names the open tests watch; a test's `match` (plain
// fields the payload must equal) is read only when the name is among them. Writes are few: at most three a test, the first three kept.
//
// Prior art: our own ledger and achievements (a predicate over what happened, src/progress/achievements.js), and a test harness's event
// expectations (Unreal's Gauntlet: "wait for this event" as evidence, the tester still judges).
//
//   const ev = new Evidence(game, (test, seen) => store.update(...))  (seen: the test's sightings so far, the newest last)   ev.watch(tests)  (each time the tests change)   ev.dispose()
// ---------------------------------------------------------------------------------------

const KEEP = 3;
const OPEN = (s) => !s || s === 'open';

/** The payload in a line: its fields but the bus's own (`name`, `t`), short. */
export function gist(e) {
  const o = {};
  for (const [k, v] of Object.entries(e)) if (k !== 'name' && k !== 't' && (v == null || typeof v !== 'object')) o[k] = v;
  const s = JSON.stringify(o);
  return s.length > 140 ? `${s.slice(0, 137)}...` : s;
}

/** Does the payload say what the test's `match` asks (each field equal, as text)? */
export const matches = (e, match) => !match || Object.entries(match).every(([k, v]) => String(e[k]) === String(v));

export class Evidence {
  constructor(game, onSeen) {
    this.onSeen = onSeen;
    this.by = new Map(); // event name -> [test]
    this.seen = new Map(); // test id -> its sightings (from the store, then this page's: a write may not have come back yet)
    this.off = game.events.on('*', (e) => this.hear(e));
  }

  /** The round's tests: the open ones that watch something are listened for. */
  watch(tests) {
    this.by.clear();
    for (const t of tests) {
      if (!t.watch?.event || !OPEN(t.status)) continue;
      if (!this.seen.has(t.id)) this.seen.set(t.id, [...(t.seen || [])]);
      if (this.seen.get(t.id).length >= KEEP) continue;
      const list = this.by.get(t.watch.event) || [];
      list.push(t); this.by.set(t.watch.event, list);
    }
  }

  hear(e) {
    const list = this.by.get(e.name);
    if (!list) return;
    for (const t of list) {
      const seen = this.seen.get(t.id);
      if (seen.length >= KEEP || !matches(e, t.watch.match)) continue;
      seen.push({ at: Date.now(), gameT: +e.t.toFixed(2), gist: gist(e) }); // (the real time: when the owner saw it, by their own clock)
      this.onSeen(t, seen.slice());
    }
  }

  dispose() { this.off?.(); }
}
