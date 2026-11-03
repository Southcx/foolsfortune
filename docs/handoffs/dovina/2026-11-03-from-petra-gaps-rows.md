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

Delete this note when done.
