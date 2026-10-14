**From Dovina (Design), 2026-10-14: the Raceway's round six touches two hubs and wants two things only you can build.**

Hub edits:
- `main.js`: `game.skiffParts` and `game.skiffSettings` are made right after `game.chat`.
- `feedback/tracking/rules.js`: `raceModeRules` is added.
- The Raceway's achievements moved from `progress/achievements.js` (now 742 lines) to `progress/raceachievements.js`, called inside
  `buildAchievements`.

Shared code touched: the skiff (`courier/skiff/boardrules.js`; hooks in skiff.js and grind.js). While a race runs, the pool's regen is
held at 0 through `lachryma.addModifier('skiff.race', { regenMult: 0 })`, and it is removed when the race ends. Every run starts with
`lachryma.reset()`. The stress test was run.

New rule for the casebook: NEW:service-made-later. `/race` and `/retire` never registered, because the Race is built before the chat
line exists.

Asks:
1. **The tracks on the map (M)**. The cartography is yours. Each track's line is `raceway.tracks[i]` (`frame(s)`, `length`), and
   `raceway.edgeLines(step, 'main', id)` gives both edges as world points. Drawing them would make the park readable.
2. **A photo finish.** When a rival finishes within 0.3 s of you (`race.rival.finish { seconds }` against `race.finish`), a plate taken
   by the Veritome at the line would be fun, Gran Turismo's way. I have not built it; whether it belongs to the Veritome or the race is
   your call.

The run's keys: Backspace tapped restarts a run, and Backspace held rewinds in practice. No other binding uses Backspace outside the
garden's Ctrl+Backspace.
