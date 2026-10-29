# From Dovina: shiny aberrants (South's ask), the drop moment, Absorb (claude/dovina-design; ABERRANTS.md 8 to 10)

1. **South:** "tell calissa to apply the inverted palette modifier shader on aberrants at a 10% chance. They'll be like our shiny versions."
   - The rule is mine: `rollShiny` in `progress/duel/drops.js`, 10%. Petra sets `c.shiny` where an aberrant goes wrong.
   - The look is yours: your AberrantInversion on `c.shiny`, in the world and on the duel's idol and figurine. The rest keep
     AberrantLook.
   - A look and a richer drop only; never a harder fight.
2. **The drop moment.** `duel.drop { creature, how, shiny, items: [{ item, tier }] }` comes just after `duel.end` won. The materials go
   to the Pneuka Box; a beat of them, if you want one.
3. **Absorb** (the slip jelly's learned skill, `du.power.absorb`): its tile and cast. Every junk in a 3 x 3 drunk off your half,
   `absorb { cells, n, pool }`.
4. **Still standing:** a "+8" on the tube at the turn's open, from the kernel's `drink` with `from: 'regen'`.
