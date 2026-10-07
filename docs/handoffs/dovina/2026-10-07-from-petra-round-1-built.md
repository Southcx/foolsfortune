**2026-10-07, from Petra: Round 1's bodies are in; what they emit and what I chose**

`node scripts/unbuilt.mjs` lists only `trial.solar` now (Round 4's). It runs in the gate as a report line (`npm run gate`).
- **Emitted, as your contract has them**: `foe.crack { stage, cause: 'ram' | 'slam' | 'blow', by }` (a ram is the Courier's: they drew it),
  `foe.break`, `foe.end { how }`, `clutch.break { floor, roe, by }`, `find.take { kind, warped, floor, by }`, `floor.shift { floor, by }`.
- **New, for your rules if you want them** (none has a rule yet): `foe.strike { move }`, `foe.call { n }`, `foe.wake`, `foe.sink/rise/
  surface { pool }`, `clutch.hatch { called }`, `well.cavern`, `spirit.bind { from, kind, cls, by }`, `catch.miss { from, kind, cls,
  odds, by }`, `catch.free { from, kind, why, by }`, `catch.grab`, `busk.start { mat, by }`, `cavern.force` (/cavern; its rule is in).
  `well.foe` now also carries `how`.
- **Choices to confirm or overrule**: a blow to the crown's sides chips the body a quarter and does not crack the crown (only blows
  that land on the crown, the Courier's slam anywhere, the FOE's own rams and its slam on a fallen stalactite crack it); the brood a
  clutch hatches on its own come from its eggs beyond the two it keeps for the FOE's call; a reprogrammed FOE counts 0.5 of a FOE in
  `wellPay` (`FOE.pay.reprogram.floors / FOE.pay.burst.floors`); an artifact's worth (`findWorth * ECON.perMinute`) is added to the run's
  pay at the walk out (lost on a shatter, ECON.escape.keep of it on an escape); a pot's find spills as cubes where it breaks.
- **Measured**: a full FOE fight driven headless: three rams into P1 (crack, fell) and its log (rubble) burst the crown; the reel; the
  sink at 12 s, the ring 1.2 s before, the surface in another pool; brood called twice (3 + 3 of the 8 clutches' 16); burst and reprogram
  both end it, and the pale pool forms (W0, W2). The Lockheart catch at 0.47 (class 0, emo factor 0.5, a twin key) missed once and caught
  the second time; the hand's catch of a class-0 took 1.0 s over the mouth.
- **Still open, yours**: `heart.summoning` and slip roe's item (my earlier message); the Divination widening that names what a warped
  artifact will shift (not built: the Dreamvane hears the warp); a gardener's use of `game.bound.list` (each `{ kind, name, cls, from,
  emo, mind, traits, at }`, kept in the save's player scope as `bound`).
