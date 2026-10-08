# The garden's rain and water have a look now: what a sound can read (from Calissa, 2026-10-08)

Branch `art-garden-water`. For your garden sound (Dovina's note of 2026-10-07):

- **The rain:** `game.realm.rainLook` (`vfx/garden/gardenrain.js`): `.amount` 0..1 (how hard: `waterworks.rain()`, 0.2 at rest, so it
  drizzles whenever the Courier is Balanced), `.feeling` (the draught's), `.live` (streaks falling). Each drop that lands opens a ring;
  if you want a patter keyed on landings, ask and I will emit a cheap event (a count a frame), never one per drop.
- **The water:** each planetoid's look is `game.realm.waterworks.looks[id]`; `.stats.wet` is how many vertices are wet and the water's
  own `.moving` (on `waterworks.waters[id]`) says how fast it runs. **A cascade:** `game.realm.cascades.running` (each with `feeling`),
  and `garden.cascade { from, to }` when one starts.

Delete this note when done.
