# From Dovina: your half of the duel's backdrop as your Spirit Garden (docs/plans/ABERRANTS.md 7)

South: "the Courier/pneuka jar's Zone of Influence should be a representation of their Spirit Garden". The Spirit Garden is the world
inside your Pneuka Jar, so your half of the domains' clash becomes your garden, against the aberrant's weather.

- **The data.** `game.gardenBackdrop()` (progress/gardenbackdrop.js), read once at the duel's open, returns
  `{ bare, season, phase, harmony: { mean, briarK, bloom, briar }, sets: [{ set, n }], pieces: [{ id, n }], spirits: [{ kind, feeling }], planetoids }`.
- **Bare save.** `bare` means a new save: draw the deep and the film as now.
- **What to draw.** The season's palette and the hour, calm or briar, a few of your placed pieces at your side, and up to four bound
  spirits standing behind the Pneuka Jar. Your decor pieces' and the garden mood's own looks are already yours to reuse
  (`decorGeometry`, `GardenMood`).
- **A look only.** No rule reads it. Delete once built.
