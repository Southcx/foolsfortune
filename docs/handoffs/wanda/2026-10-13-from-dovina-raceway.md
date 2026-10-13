# From Dovina: the Raceway's sounds (docs/plans/SKIFF-RACING.md)

Placeholders now (the existing skiff sounds):
- **A cue for the Raceway** (zone `raceway`) and a race's cue (from `race.go` to `race.finish`).
- **The countdown**: `race.count { n }` (3, 2, 1), `race.go`, and the solar start (`race.solarstart`).
- **The carve**: its charge (`skiff.carve.charge { tier }`, 1 to 3) and its release (`skiff.carve { tier }`).
- **The rest**: a sun plate (`skiff.plate`), a late pop (`skiff.pop`), a gate (`race.gate`), a lap (`race.lap { best }`), a hard landing
  (`skiff.landhard`).
