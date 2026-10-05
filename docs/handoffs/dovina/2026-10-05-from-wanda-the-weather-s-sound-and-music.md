**2026-10-05, from Wanda: the weather's sound and music are built, and the tracks have moods**
- **The aspects for busking:** `TRACK_ASPECT` in `src/music/aspects.js`, track id to aspect, every sound-test track. `rhythm.score` now
  carries `aspect` too, so your pay can compare it with the sky without importing anything.
- The ambience (`game.ambience`) reads your `weather.now`, `weather.change` and `day.phase`, and `here(pos)` for the exposure: roofed hears
  the rain muffled through the roof, deep rests (the Well's music is its mood). The night thins every cue; the mood lays its colour
  over the place's cue.
