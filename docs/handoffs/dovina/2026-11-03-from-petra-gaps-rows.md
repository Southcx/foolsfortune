# From Petra: GAPS rows of mine closed or ruled this round (2026-11-03); please update the ledger

- **G37 built:** `scripts/clarity.mjs` now runs inside `npm run check`. A clarity failure fails the check.
- **G40 built:** the Codex's CLASS ARTS shelf (`feedback/codex/classarts.js`). It has two columns, the action and the reaction. Each
  lists the worn art and every opened one; a tap wears it through `art.wear`. Under them are your class's closed arts with both of
  their ways. Mobile: the Codex (its top bar tile), a tap.
- **G116 built (place half):** the shed's page has THE MAILBOX row with its unread count; a tap reads it (`spiritLife.read()`).
  Mobile: USE at the shed, a tap. The mailbox as a model stays Calissa's.
- **G289:** Espada's text on your grain line (`grainText`).
- **G104 ruled, nothing to build:** clapperjars have no blow in the world (an aberrant one is met by duel), and the lobber is a
  mortar, not a creature. Neither has a windup to draw. Close the row unless a clapperjar gets a lunge.
- **G17 and G19 are built** (v409: the Dunes as five areas; Margarite built on entry). The ledger still says not started.

Later the same round (v412):
- **G137 built:** the Dunes' crystals and geysers carry seeded ids (`c0..`, `g0..`). `crystal.harvest` and `geyser.launch` carry
  `id` (a geyser's also `rider`). The ledger writes `crystal.sweet.at.<id>` and `geyser.ride.<id>`; the map's checklist counts both
  rows per area. I dropped their `needs` from CHECKLIST_ROWS (two words in your areas.js).
- **G210 built:** a route scouted at the sea chart raises each wave's edge mark `reckonLead` real s before it is due (measured: the
  first wave at bar 9 marked at bar 7.32, the full 3 s). A wave hatched `from` a foe is not marked.
- **Stale rows, built earlier:** G145 (the crossing's tiles: `railCluster`, the arc's `rail` row), G164 (the sandbar's tide), G188
  (the `du.whistle` tile on the duel screen).
- **G150, a question for South's digest:** on touch, B is DASH in the air and the roll crouched; BLINK takes it only on the ground,
  standing. Making B BLINK in the air, as the row says, takes the air dash off touch once Blink is learned. The alternatives are a
  second tile in the air, or a double tap on B. Which one?

And v413:
- **G274 built:** painted ground is a signature (`kind: 'paint'`). The paint map's cells are binned 2 m a side
  (`paintmap.patches()`), each bin's strength 0.3 + 0.025 x its paint (a full bin about 1.9). The Dreamvane's LOOSE mode hears it.
  Still open: the brush profile in `scripts/economy.mjs` to price the bottles (yours).
- **G135 built:** a blot the Courier washes may hide a find, chosen by `CLEAN.findChance` and seeded by the blot. Measured: 10 of 42.
  The find bursts out as cubes worth `CLEAN.worth`, which falls back to a minute of play (8) until you name "a pot's worth";
  `stain.find { what, worth, at, by }` is counted. An ostracon or a cache in its place is yours to rule.

And v414:
- **G316 built:** a light term in `photo.js` (`LIGHT`, `lightOf`). Out in the Dunes, front-lit counts half and the hour (`phaseAt`:
  dawn and dusk 1, day 0.6, night 0.25) the other half. Elsewhere it reads 0.5, so it moves nothing. It is worth +-20 points about
  the middle, so stars are not inflated. `photo.take` carries `light` (0..1); measured 0.31 shot into the sun at day, 0.79 with it
  behind the lens. TRAINING.md's "light reading trains Divination" is yours: `domains.js` can read `photo.take.light` as a source.

And v415:
- **G266 built (the session's half):** the board's pool is written into the real pool as it moves (`duelsession.js syncPool`, by
  difference, on every move's events and at the close). A move's spend now shows on the tube at once. Measured: 81, a spend of 12
  read 69 straight away, a gain of 5 read 74, and the close left it at 74. Regen stays held by the `duel` modifier. Still a copy in
  the kernel (`sides[0].pool`); the kernel reading the pool itself is yours if you want the copy gone.

Delete this note when done.
