# Soul Alchemy: the eight rulings, landed in my files (from Dovina, 2026-10-08)

Calissa's UX (SOUL-ALCHEMY.md section 4, now pasted in whole) raised eight conflicts with section 3. All ruled her way; the code is in
`progress/alchemy.js`, `progress/econ/materials.js` and `ECON.alchemy`, on top of your d4597a1. `scripts/soulalchemytest.mjs`: 17 pass,
1 fail (below, by design).

## What changed under your press
1. **The pull** (`materials.js`): a material's `path` is now `[[share, wind], ...]`: each step pulls the colour `share` of the way to the
   material's own `{ hue, sat }`, bent `wind` of the step sideways. `press(colour, mats, { extra })`, `pullStep(c, to, share, wind)`.
   A complement greys by itself; `complementGrey`, `complement`, `complementArc` are gone. `m.path.length` still counts the steps.
2. **Seasoning to a ceiling**: `swatchRadius(rank, seasoning)` (no formation argument): r + (0.13 - r) x seasoning / 100.
3. **The formation sets the fuel**: `aimedFuel(rank, d, r, formation)` divides by it (clamped 0.5 .. 2). `SoulAlchemy.radius(id)` no
   longer reads the formation.
4. **A tile's heart**: `heartRadius(rank)`; `isTrue(d, rank)` (it took `r` before).
5. **One firing a press**: `s.cocked` in the `alchemy` section; `press()` sets it, `fire()` clears it. `fire()` refusals now carry
   `code`: `outside | full | poor | spent`, and Espada's words in `why` ("The press does not fire: it needs {n} cubes.").
6. **The draught's step** in `walk()`: keyed on `game.draught` (not brimming), `draughtPull` (0.08) x its strength, toward the feeling's
   hue at the swatches' saturation. `walk()` also reads `realm.press.extra?.()` (a spirit at work: extra steps of each pull; 0 when
   absent). `walk()` is the one walk: keep the preview on it.
7. **One feeling table**: `weather.js` `COLOR`; `alchemy.js` `FEELING_HUE` derives the hues (dread is 135, green, Plutchik's fear; my old
   280 was a guess). `ECON.alchemy.feelingHue` and `brimStep` are gone. Asks: `world/garden/plots.js` `FEELING_COLOR` reads `COLOR`;
   `courier/mind.js` writes `game.draughtHex` from `COLOR` (the garden's sky reads it; nothing writes it today).

## The failing check, and its replacement
`a complement greys the colour` builds `{ hue: 180, sat: 0.5, path: [[0, 0.1]] }`: share 0, so it never moves. Replace with:
```js
A.s.colour = { h: 0, s: 0.6 }; const comp = A.walk([{ hue: 180, sat: 0.6, path: [[0.5, 0]] }], A.s.colour, { extra: 0 }).colour, same = A.walk([{ hue: 0, sat: 0.6, path: [[0.5, 0]] }], A.s.colour, { extra: 0 }).colour;
check('a complement greys the colour', comp.s < 0.05 && Math.abs(same.s - 0.6) < 1e-6, { comp: comp.s, same: same.s });
```
(And set `game.draught = {}` first, or the draught's step moves both.)

## Yours next (SOUL-ALCHEMY.md 4.25, Calissa's split)
The press view (a fourth garden view), `world/garden/press.js` as the station of 4.2 to 4.13 (the basin, the kerb, F there; the plate
shrine to its own hokora), the events of 4.19 (`alchemy.refuse { why }` from `fire()`'s `code`), the log lines of 4.20, and the
sweep checks of section 8 (7 to 10 are new).

## Fields to emit (TRAINING.md section 6; `domains.js` reads each when it arrives, and falls back until then)
- `move.parry`: `lead` for a blow (`c.windup.t - 0.3`, read before `parried()` unwinds it); `d` and `reach` for a projectile.
- `photo.take`: `score` (photo.js's continuous one) and `fresh` (false when the Compendium holds the kind at that score or better).
- `brush.glyph`: `fit` (Calissa's formula: template `(score - 0.72) / 0.28`, a loop `1 - gap / (0.32 x size)`).
- `garden.sculpt`: `q`, 0 .. 1, the water held in basins after the stroke against before.
- Ruled (TRAINING.md 6): a blow is answered only inside its window (eta 0.25 s or less, as `coop/fight.js` already gates); the kick and the
  cutlass answer blows; `parry.missed` (an outlined windup run out with the Courier in reach). Today a press at a lunge's first frame
  answers it. And `photo.js`: a placement term (the thirds, lead room) in place of `centre`, before Rule of Thirds ships.

Delete this note when done.
