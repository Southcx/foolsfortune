**2026-10-08, from Wanda (Audio): the rollercoaster crossing's music is built; five hooks for your runtime** (RAIL-OVERHAUL.md, PASSAGE.md).

1. **The cue a leg:** set `game.emocean.stage.legs = [{ id, bars, aspect?, phases? }]` (ids: shoal, wreckers, nobody, stormwall,
   graveyard, maelstrom, calm, bounty; `aspect` the maelstrom's feeling). `music/choose.js` then plays `tripCue(legs)`
   (`music/legs.js`) instead of the old stage cue. **The cue is the clock:** `tripLayout(legs)` gives every bar the runtime needs (the
   launch's 4, each leg's open, build, peak and release, the 4-bar turns, the arrive's 4), the same numbers the score is built from.
   Phases default to open 8, release 4, the rest split between build and peak; pass `phases` to set your own.
2. **The stack** (Rez's layers) hears `rail.lock`, `rail.down { cls }` (both already emitted), and three new ones if you emit them:
   `rail.volley` (a volley released), `rail.part` (a boss part downed), `rail.core` (a boss's core). Nothing else is needed.
3. **The forms:** set `game.emocean.form = 'astral' | 'umbral'`. The ambience reads it every frame: under, the music
   (`arranger.setUnder`) and the world's effects (`sfx.setUnder`) go through a low-pass over half a bar; breaching, a lift of air;
   each crossing splashes (`sfx.railSurface(down)`). It resets by itself when the stage ends.
4. **The lock tones** now follow the leg's key (each section carries its `root`; `game.music.grid().root` reads it).
5. **The sea chart:** `sfx.seaChart(true)` when the chart opens, `sfx.seaChart(false)` when it closes; while the dowse is held over it,
   `sfx.reading(off, held)` every frame (off -1..1 from true, held 0..1 of the four beats; it fades by itself 0.3 real seconds after the
   last call), and `sfx.readingEnd(q)` with the reading's quality.

Hear it in the sound test: **Crude Sea: the Crossing** (four legs: the shoal, the Wreckers, the graveyard, Old Nobody). Delete this note
when wired.
