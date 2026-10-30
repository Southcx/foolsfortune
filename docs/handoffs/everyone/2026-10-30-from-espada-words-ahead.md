# From Espada: words written ahead of the builds (Petra's close-every-thread list, 2026-10-30)

These are placeholders no longer: paste them as each piece lands. Ask me for anything not covered here.

## 1. Pair specials: done in the file
`feedback/tracking/pairspecialsplay.js` `DID` now has a line for all 21 (69baa014), keyed by pair, so each wave picks up its own.

## 2. Class arts, waves 2 to 5: the refusals at the key (`courier/classarts/body.js`, each art's `can`)
Use the shared lines from wave 1 (cooling down, the pool too low, not in the game yet). Use these only where an art needs a moment:

| art (id) | refusal |
| --- | --- |
| Catch the Rain (wellUp) | `Catch the Rain needs falling weather.` |
| Harvest (harvest) | `Harvest needs a Spirit Garden bed or a crystal in reach.` |
| Ride (ride) | `Ride needs a staggered creature in reach.` |
| Tame (tame) | `Tame needs a creature stunned or out cold.` |
| Reap (reap) | `Reap finds no creature near its end.` |
| Starlight (wish) | `Starlight needs the open night sky.` |
| Shackle (bind) | `Shackle needs a creature in reach.` |
| Mark for Death (verdict) | `Mark for Death needs a creature in reach.` |
| Encore (echo) | `Encore has no tool move to play again.` |
| Spin (spin) | `Spin is spent until the next game day.` |
| Quick Swap (sleight) | `Quick Swap needs a tool in hand.` |
| Settle the Score (reckoning) | `Settle the Score finds no one who hurt you near.` |
| Earth Wall (stronghold) | `Earth Wall needs open ground in front of you.` |
| Ram, Roar, Still Waters, Scout, Veil, Daybreak, Collapse | `<label> finds nothing in reach.` |

Reactions never refuse. Their `art.fire` line is the shared one: `<label> triggers.`

## 3. The photo finish
- A rival within 0.3 s at the line, you ahead: `Photo finish: you take it by ${gap} s.`
- You behind: `Photo finish: ${rival} takes it by ${gap} s.`
- The plate taken at the line: `The finish line's plate is kept in your Veritome.` This only applies if it goes to the Veritome's memory;
  if it goes somewhere else, tell me where and I will reword it.
- `${gap}` is written as a digit with two places (0.12), the same way race times are.

## 4. The slip jelly mount: waiting
I need to know what the drop is before I word it: a thing in the Pneuka Box, a mount that is called up, or a look. Send me its kind
and how it is used, and I will reply with the drop line and its use line in one note.

## 5. The renames pass
None of `testroom` to `throwingRoom`, `rank.up` to `standing.up` or `film` to `memory` is player text, so no strings change. If the
standing's log line reads "rank" anywhere, it becomes "standing" (the glossary's homonym table). Send me the mapping and I will check
the strings in one pass.
