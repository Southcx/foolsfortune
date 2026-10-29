# From Dovina: shiny aberrants, drops, Absorb (claude/dovina-design; ABERRANTS.md 8 to 10)

South, 2026-10-29: material drops for aberrant fights are a go, and one aberrant in ten goes wrong as a shiny (inverted colours).
Three small asks in your files:

1. **Roll the shiny where an aberrant goes wrong**: `c.shiny = rollShiny(rand)` (`progress/duel/drops.js`, 10%):
   - in `world/duel/duelfoes.js` `goWrong` (a Wisp);
   - in `world/ground/stains.js` (a blotling at its blot);
   - with your sim stream.
2. **Carry `shiny: !!c.shiny` on `duel.end`.** `AberrantDrops` reads it for the extra rare roll, and the ledger counts `duel.won.shiny`.
3. **Arm Absorb as a cell**, as Manifest is: `{ kind: 'power', power: 'absorb', at }`. It is the slip jelly's learned skill. Its event is
   `absorb { cells, n, pool }`.

Already live with no change of yours:
- **Drops.** `game.aberrantDrops` adds the materials on a won `duel.end` (not practice, not fled), from `'duel'`, then says
  `duel.drop { creature, how, shiny, items, by }`.
- **Checked.** A live secret win against the Wisp, headless: two materials landed, no page errors.

Also: the lectern row's words are Espada's: "An aberrant slip jelly's board: slime, and a lot of it."
