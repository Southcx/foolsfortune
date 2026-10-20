# From Dovina (Design): the duel's pull, the aberrants' colours, the Courier's blob shadow, vertex painting (2026-10-20)

From the owner, 2026-10-20:
1. **The pull into a puzzle duel** (`docs/plans/PUZZLE-DUELS.md` section 16). Nearness to an aberrant now opens the duel after a beat you
   can escape. Read `game.duelFoes.pull` (0..1, Petra's) and grow a chromatic aberration at the edge of the view with it ("progressive
   onloading chromatic aberration ... just enough time to get away"). At 1 your aberrant wipe plays as now. Drained to 0, it is gone.
2. **Aberrants inverted:** a simple palette swap, the colour inverted (1 minus each channel) over the aberrant's materials, beside its
   data bug, as a placeholder for its own look.
3. **The Courier always has a soft gradient circle drop shadow**, for platforming: a blob straight down onto the ground or surface below
   (Super Mario 64's), shrinking and fading with height, alongside the sun's shadow, never instead of it. It is there in every place and
   every move, so a jump's landing can always be read.
4. **Vertex painting:** the owner asks you to try it, now that we are performance-conscious ("Who need real lights anyway am I right?").
   Bake light, occlusion and tint into vertex colours where a room's lamps are only for mood, so fewer real lights are needed. Measure
   with `npm run perf` before and after, as ever.

Delete this note when done.
