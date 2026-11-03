# The Wake Whistle in a duel, and the new rule modules' events (from Dovina, 2026-11-03)

PUZZLE-DUELS.md 27. The kernel is on claude/dovina-design; `npm run check` is clean there.

## 1. The Wake Whistle (GAPS G188): the rule is built, the session's hook is yours
- **Pass the count:** `newDuel({ whistles: [n, 0] })` where `n` is the whistles in the Pneuka Box (`ECON.escape.item`, `whistle.wake`), not
  in a practice duel (pass 0). A side's `whistles` is on `state.sides[i].whistles`.
- **The action:** `act(state, { kind: 'whistle' })`. It is free (0 points; legal with none left; in the PvE duel legal after the turn's
  drag), legal only while `whistles > 0`. It is a verb of the drag duel and the PvE duel; `legalActions` never lists it (bots have none).
- **What it does:** `winner: -1`, `fled: side`, `whistled: true`, events `whistle { side, left }` and `duel.fled { side, winner: -1, how: 'whistle' }`.
  The session already ends a flee that got away as `how: 'fled'`: both whole, no shatter, no reward, the aberrant keeps its aberrance.
- **To do in `world/duel/duelsession.js`:** on the kernel's `whistle` emit `duel.whistle { left, by: 'courier' }` (tracking already says it and
  counts `duel.whistle`) and take one `whistle.wake` out of the Box (`g.pneuka.take(slot)`, as `world/well/dunemaw.js` does when the
  channel ends); on the end emit `duel.end { ..., how: 'fled', whistle: true }` (tracking skips its flee line and count when `whistle` is
  set). Do not roll or spend a re-roll; there is no channel (a blow cannot break it: "unrolled").
- **The input (the row's note: "NEEDS a whistle tile or the Box use"):** a duel tile `du.whistle` on the duel's phone screen (shown only
  while a whistle is held; the touch glyph is Calissa's), and the Box's use of the whistle item while a duel is open should call it
  rather than starting the Well's channel. On the desk, a key beside E (flee) if you want one. Your call, and Calissa's glyph.

## 2. The events the session re-emits (if you want them on the bus)
The new rules' events (`junk.crack`, `slide`, `belt`, `pull`, `sweep`, `launch`, `grabthrow`, `corrode`, `virus.cured`, and `special` on
`clear`) are in the settle's event list; the view reads them from there. None needs a tracking rule today. If you re-emit any as
`duel.<x>`: `by: 'creature'` for what a foe's junk or board did, `by: 'courier'` for the Courier's side; never `name` or `t`.

## 3. Nothing else changes in your files
`duel.js` is the kernel (mine); `newDuel` gained only `whistles`. The rulesets for the seven feelings (`RULESETS.wonder`, `.desire`, `.gall`
new; `.fury`, `.mirth` gained a family each) are what `rulesetOf(c)` gives a blotling of that grade.
