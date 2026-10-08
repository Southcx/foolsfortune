# The garden's ground: the finer planetoid and the five grounds, as built (from Calissa, 2026-10-08)

Branch `art-garden-ground`. What it changes in your files, and what is yours to do after:

- **Two crossings, made small (your note asked for the look):**
  - `world/garden/clay.js` `toLook`: its first line hands the look to `look.fromClay(this)` when the look has one. The planetoid look
    keeps its own map onto the clay's grid and redraws only the cells that changed, its grounds too.
  - `world/garden/realm.js` `reshape`: the `shapeT` skip is gone. Every call now costs 0.1 to 0.3 ms at 3 m and 0.8 to 1.8 ms at 12 m
    (p50 in the page). Dropping it also fixes erosion leaving every other planetoid drawn as it was (casebook 2026-10-08, rule 69).
- **Yours to delete when you like:** in `clay.js`, `GROUND_LOOK`, `TINT`, the `cellMap` and the tint loop under the new line. Nothing
  reaches them now. In `place.js`, the comment over `PLANETOID_SITES` ("Calissa's planetoid looks key the old ones ... this bridge
  goes then") is stale: the old ids' alias is gone from `vfx/garden/planetoid.js`, and nothing passed them.
- **The perf baseline:** the garden's planetoids went from 4,620 triangles to 75,000 (six at 12,500, detail 24), and the shadow pass
  draws them again where it reaches. In one garden view: 34,822 to 69,902 triangles a frame, draws unchanged at 159. The garden is still
  not a scene in `scripts/perf.mjs`; please add one (survey item 31). Programs: +1 at boot (the grounds' patch: 152 to 153), none on
  entering.
- **Still compiled in play:** done in step 2: the stand-in is gone and the water's look is parked (`2026-10-08-from-calissa-garden-water.md`).
- **The feeling colours:** the grounds take their accents from `progress/weather.js` `COLOR`, the table Dovina ruled the game's one
  (her ruling 7). `world/garden/plots.js` `FEELING_COLOR` still differs: wonder 0x7fd6a0 against 0x5ec8e0, dread 0x7a62b8 against
  0x3f6a4a, and the other three too. It colours the features placed with a feeling and the Dantian's lake tint (`realm.js` line 116).
  Ask: import `COLOR` there instead.
- **The pole crease** (the survey's): `Clay.heightAt` clamps the last row at 88.59 degrees, so within 0.49 m of a pole the height is
  read along one longitude and a pull there creases. The look follows the clay exactly, crease included. The fix is in `heightAt`
  (average the last row round the pole). Yours, if you want it.
- **The ground pack** is fetched beside the bundle (`src/assets/ground_pack.webp`, 180 KB, through `new URL(..., import.meta.url)`), as
  the suite's `.bin` packs are. The publish carries it like them. It uploads to the GPU on the first garden frame (256 px, one upload).

Delete this note in your branch when done.
