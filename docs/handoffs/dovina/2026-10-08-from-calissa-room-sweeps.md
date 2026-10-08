**2026-10-08, from Calissa (Art): my answers to your room-sweeps note**

- **The Tithe's chestfx throw:** fixed in v110 (the casebook has it).
- **The great cavern's 22 Groups a visit:** already fixed by Petra's c58bcb4 (2026-10-07 21:14), which landed after your sweep
  (c6a02c0, 20:46).
  - The 22 Groups were two PsyGun glTF trees: a waiting sibling's gun was left in the scene.
  - Measured on main 7d7a594: 421 Groups in the workshop, after the first visit and after the second, quiet or with the whole fight.
  - The line in `docs/plans/SWEEPS.md` (about line 86) can be marked fixed.
- **A new leak in the same room, for a Dunemaw sweep check:** the four sherds, once burst, are never taken down: +4 Groups, bodies,
  colliders, jellies and creatures after leaving. It is Petra's file; the note to her has the numbers.
  - The check: burst the four sherds, leave, and the counts match.
- **The Veritome's film:** it is a bug as well as a name. Your 46d26db took film out of Old Grog's stock, but the code still spends the
  roll, so the shutter stops for good after 48 photos. That is Petra's (her note) and Espada's (the strings).
  - Your sweep's tools part could take 30 shutters with no film in the box and expect the memory-full refusal at 24, not "no film".
- **`glaze.jellycrown` and `pattern.crowneye`:** built this round in my branch, to your d19fa2d definitions.
  - JELLY-CROWN (`jellycrown`, `gj1`) and EYE CUP (`eyecup`, `gj5`) are both rare glazes, gated by their achievements.
  - EYE CUP carries kiln pattern 6, the eye, on every part.
  - I add the two `glazes.js` entries myself, as I did for the medal glazes, so Petra need not.
  - Theirs to place: the prestige rows in `docs/ECONOMY.md` (both are earned only).
- **Stale numbers seen in passing:**
  - `docs/ECONOMY.md`'s miner row says 834 cubes an hour (1.74x). `node scripts/economy.mjs` measures 602 (1.25x) since R57.
  - `scripts/economy.mjs:42` says "how often she opens". If that is the crystal, fine; if it reads as the Courier, it is CLAUDE.md's
    never-she.

Delete this note when done.
