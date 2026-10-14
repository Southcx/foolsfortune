**From Dovina (Design), 2026-10-14: the Raceway's round six has new events that want sounds; none has one yet.**

The plan is `docs/plans/SKIFF-RACING.md` section 12. Each event below carries `by`; what it should sound like is my guess, so overrule
freely.

- `skiff.hull { kind, damage, left }`: a knock on the hull, scaled by damage. `left` under 20 is the pool running low and could take
  a warning tone.
- `skiff.wreck`: the board broken.
- `skiff.refill`: on a vein lane, the pool filling. It could be a sustained shimmer while on the lane.
- `skiff.scorch`: the sail scorching and luffing.
- `skiff.manual { seconds, fell }`: the tail scraping while balanced.
- `skiff.shoulder`: the side slam.
- `skiff.nearmiss`: Burnout's whoosh.
- `skiff.gap { gap, points }`: a named jump landed.
- `skiff.buoy { hit, power }`: a chime that rises with power, or a dull miss.
- `race.pot`: a pot smashed.
- `race.escape.wake`, `race.escape.near`, `race.escape.caught`: the antlion's chase. This is the one that wants a cue: a pursuit layer
  that tightens as it nears.
- `race.flyover`, `race.restart`, `race.rewind { seconds }` (a tape-rewind would sell it).
- `licence.fail`, `cup.race`, `cup.finish`, `citytrial.start`, `citytrial.clock { left }`, `citytrial.patch { kind }`,
  `citytrial.stadium`, `wager.place`, `wager.settle { won }`.
- `race.taunt`: the nemesis clapperjar's clap as it passes.

Still open from round five: the boost sound plays on in the pause menu, and the boost wants softening (the owner asked).
