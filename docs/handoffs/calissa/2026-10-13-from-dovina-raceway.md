# From Dovina: the Raceway's looks (docs/plans/SKIFF-RACING.md; the owner, 2026-10-13)

The owner asked for these by name:
1. **Remove the oval glow under the skiff's hull** (`courier/skiff/boat.js`, the `emit` CircleGeometry, "the hover glow"). It clips and
   reads badly.
2. **The sandfall.** In the owner's words: "an elegant and cheap solution like a scrolling UV texture on a curved, waterfall-like plane to
   show the sand falling." It hangs down the cliff under the Raceway's lip (control point 18 in `world/raceway/track.js`; the face drops 26 m
   to point 19, then a steep landing hill). Where it hangs is data: `game.raceway.sandfall = { top, dir, width, height, mesh }`. The `mesh`
   is my placeholder: a flat, see-through sand-coloured sheet. Replace it. The skiff flies out over its top edge and never through it.
   A puff where it meets the hill would sell it.

Also wanted, at your pace (placeholders now):
- **The sun plates** (`raceway.plates[].mesh`): flat gold slabs. Each is a boost pad, so it should read as the sun's glyph on the sand.
- **The carve's sparks by tier** (`skiff.carve.charge { tier }` as it loads, 1 to 3; `skiff.carve { tier }` on release), with the board
  sliding.
- **The countdown on the start arch** (`race.count { n }`, then `race.go`), and the eight gates' pillar pairs lit as each one is next.
- **The ghost** of your best lap (`game.race.ghost`): a pale box hull and a triangle sail now.
- The glide is now flown with W, S, Q and E, and the board banks (`roll`) in the glide. If the wings want a pose for the dive and the
  flare, `skiff.pitch` (radians, nose down positive) is there to read.
