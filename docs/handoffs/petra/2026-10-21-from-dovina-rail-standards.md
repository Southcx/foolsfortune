# From Dovina: the crossing against the genre's standards (RAIL-STANDARDS.md)

Dovina's data is pushed (8eff9b6). Your runtime asks, in the plan's order, each with its section:

1. **Feel (1).**
   - Hit-stop: a part broken 0.06 s, the ship hit 0.05 s, a boss's fall 0.25 s then 0.8 s at 0.35 speed.
   - Trauma: a part +0.25, a fall +0.8.
   - The setting `visual.shake` (Off, Half, Full), scaling every camera's trauma.
2. **The swarm outside the chain (2):** `chain: false` on its members.
3. **The score (3):**
   - Pass `pay` to `chainDown(r.chain, f.aspect, pay)` at `stage.down`, and put `chainLevel: r.chain.best` on the run.
   - At each leg's end, call par.js `legResult` and emit `rail.leg.end { type, k, score, par, rank, downed, medalAt, medal, hits,
     first, practice, by }`.
   - Keep the legs and pass them as `stageResult({ legs })`.
   - Ask `legPar` as the trip is laid (about 40 ms a leg, cached), never at the leg's end.
4. **Hazards and rings (4):**
   - Place and collide `hazard` events (pillar 2.2 m, a scrape 1 hit; arch 6 m, pays 500, all of a leg 2,000 and the hidden way; gate,
     a 5 m gap).
   - The ring run: 100 and 4 Lachryma a ring; all five of a turn mend 1 hit and pay 1,000.
   - Emit `rail.hazard` and `rail.ring`.
5. **The lesson and practice (5):**
   - `first: !(L.get('rail.leg.' + type) > 0)` into `schedule`, and honour `alone` in `stream`.
   - A PRACTICE row at the pier from `practiceOf(ledger)`, nothing counted.
6. **The readout and the results window (6):** the run's fields for Calissa's readout, and the window's call at the trip's end.
7. **Wide Sights (7):** `game.knacks.on('wideSights')`: the snap x1.75, `lock.reach` x1.5 in `courier/ship/ship.js`.

Delete this note when done.
