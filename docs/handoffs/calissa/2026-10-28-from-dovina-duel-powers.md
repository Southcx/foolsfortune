# From Dovina: the duel's seven powers are in (8a0f7856; PUZZLE-DUELS.md 24)

The table your power tiles and casts build on. Rules in `src/progress/duel/powers.js`; delete this note once your part is merged.

- **Tiles.** `powersOf(state, 0)` -> `[{ id, domain, label, line, target, cost, rest, left, used, ready }]` in domain order (Swap
  ouranurgy, Manifest manifestation, Scan divination, Lift psychokinesis, Herd possession, Transmute alteration, Miracle spellscription).
  `cost` is the pool it takes (the number on the tile), `left` the turns it still rests, `ready` false when resting, too dear, or a power
  already cast this turn (one a turn). Each tile in its domain's `DOMAIN_LOOK`.
- **Reach under the finger.** `powerReach(state, 0, action)` -> cells. Targets: Swap two cells (`at`, `to`: each a 2 x 2 patch's
  top-left); Manifest a cell (+ `colour`, optional: else the colour most round it); Scan none; Lift a cell + `dir` (E W N S) + `by`;
  Herd a cell + `dir` 'H' or 'V'; Transmute a cell (+ `colour`, optional: else the one most on your half); Miracle a cell.
- **Casts** (kernel events, each after `power { side, power, domain, cost, pool, at }`): `swap { a, b, size, moved: [{ id, from, to }] }`,
  `manifest { at, colour, cells: [{ at, id, was }] }`, `scan { skill, left, delay }`, `lift { at, dir, by, moved }`, `herd { at, dir,
  colour, moved }`, `transmute { from, colour, turns, cells: [{ at, id }] }` and `transmute.end`, `miracle { at, colour, need, turns }`
  (its clears come in the settle after it, under the tune; `tune.end` closes it). `drink { side, n, pool }`: the pool your clears filled.
  The live probe cast all seven through the session with your view up: no errors, the view and the board agree after each (the moves
  are resynced, not yet drawn).
- **No skills in the PvE duel**: side 0's `tools` is `[]` there, so `skillsOf` is empty (your skill gauges and tiles stand down by
  themselves). The AP row is yours to take out, as Petra's note says.
- **The badge tooltip**: `game.foeSeen.seen(skill)` (progress/foeseen.js); `how(skill)` is 'watched' or 'scanned'. Unseen: its countdown
  and a ?. Seen: `FOE_SKILLS[skill].label` and `.line`. `duel.seen { skill, how }` fires the first time.
- **The Lantern Wisp is 5 colours now** (was 4) and Strawman 7: every gem silhouette is on the board. The probe's shot reads.
