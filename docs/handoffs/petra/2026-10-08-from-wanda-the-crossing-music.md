**2026-10-08, from Wanda (Audio): the rollercoaster crossing's music is built; five hooks for your runtime** (RAIL-OVERHAUL.md, PASSAGE.md).

1. **The cue a leg:** set `game.emocean.stage.legs = [{ id, aspect?, encounter? }]` (ids: shoal, wreckers, nobody, eyewall, graveyard,
   maelstrom, calm, bounty, encounter; `aspect` the maelstrom's feeling, `encounter` an id of `progress/rail/encounters.js`). Each leg's
   phase bars are Dovina's (RAIL-OVERHAUL.md section 6; a calm has no peak); `bars` or `phases` override them. `music/choose.js` then plays `tripCue(legs)`
   (`music/legs.js`) instead of the old stage cue. **The cue is the clock:** `tripLayout(legs)` gives every bar the runtime needs (the
   launch's 4, each leg's open, build, peak and release, the 4-bar turns, the arrive's 4), the same numbers the score is built from.
   **An encounter** is 4 bars under its sequence, then a 2-bar hold that loops on the bar line while
   `game.emocean.stage.encounter` is set and its `chosen` is not: set `chosen` when the choice is made, and the turn follows.
   **The trip's pressures** (PASSAGE.md 14): a leg's `feeling` (an aspect; none is fair) recolours it, `storm: true` thickens it;
   `stage.fuel` (0..1 of the tank: below a quarter, a heartbeat), `stage.adrift` (the drums go), and a calm's campfire choice holds its
   release while `stage.campfire` is set and not `chosen`.
2. **The stack** (Rez's layers) hears `rail.lock`, `rail.down { cls }` (both already emitted), and three new ones if you emit them:
   `rail.volley` (a volley released), `rail.part` (a boss part downed), `rail.core` (a boss's core). Nothing else is needed.
3. **The forms:** set `game.emocean.form = 'astral' | 'umbral'`. The ambience reads it every frame: under, the music
   (`arranger.setUnder`) and the world's effects (`sfx.setUnder`) go through a low-pass over half a bar; breaching, a lift of air;
   each crossing splashes (`sfx.railSurface(down)`). It resets by itself when the stage ends. A boss below the surface
   (`game.emocean.stage.foe.under`, Charybdis) takes its own line under from the next bar, the rest of the band staying bright.
4. **The lock tones** now follow the leg's key (each section carries its `root`; `game.music.grid().root` reads it).
5. **The sea chart:** `sfx.seaChart(true)` when the chart opens, `sfx.seaChart(false)` when it closes; while the dowse is held over it,
   `sfx.reading(off, held)` every frame (off -1..1 from true, held 0..1 of the four beats; it fades by itself 0.3 real seconds after the
   last call), and `sfx.readingEnd(q)` with the reading's quality.

Hear it in the sound test: **Crude Sea: the Crossing** (four legs: the shoal, the Wreckers, the graveyard, Old Nobody). Delete this note
when wired.
