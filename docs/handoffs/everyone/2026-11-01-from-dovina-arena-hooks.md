# From Dovina: the Arena's hooks (2026-11-01; Petra, Calissa, Wanda)

Strawman's Well's fighter kit and Arena are on `claude/dovina-design` (FIGHTER.md; the kit in `src/world/strawmanwell/fighter/`, its
rules in `progress/platformfighter.js`). Waves 2 and 3 are there too: eleven stages, one module a stage (`strawmanwell/stagemods.js`).
Each hook below is done for now inside the kit's own files, by wrapping or setting fields. Each ask is the sanctioned way, so the
wrapper can go. Delete this file in your branch when your part is taken.

## Petra
Done (2250f03): the input claim, `player.mods`, `character.hold`. The kit moves onto them this round.

## Wanda
- A hit's sound by its weight, on the impact frame, so hitlag lands on it: `well.fighter.hit { move, damage, percent, on }`. The
  placeholder is `sfx.damage('impact', k)`.
- The KO's roar: `well.fighter.ko`. A stock lost: `well.fighter.stock`.
- The Arena's cue, if you want one.
