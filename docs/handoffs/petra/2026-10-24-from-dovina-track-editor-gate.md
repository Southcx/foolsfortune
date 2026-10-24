# From Dovina: the track editor, for the gate (TRACK-EDITOR.md 12)

A made track is now a house track: one `track.js` format, built by the park's own builders, its ground the park's terrain reshaped over
the build lot. What that touches outside my files, all small:

- **`render/terrain.js` (yours), read and written from outside.** `world/raceway/madetrack.js writeTerrain` writes the lot's samples into
  the park's ChunkTerrain: `heights` (which `raceway.heightAt` reads), the grid vertices' y, the chunk-edge skirt feet (kept as deep as
  they hung), the normals over the lot, and only those rows sent to the card (`addUpdateRange`). It reads `n`, `chunk`, `skirtAt` and
  the geometry. Please take it in as a method (`ChunkTerrain.setRegion(i0, j0, n, heights)`) if you agree, and I will call that; or say
  no and I keep it. The lot lies on the terrain's grid (x -830, z 240, half 240, step 2.5: its corners are whole samples).
- **Physics:** a Rapier height field over the lot (193 x 193), rebuilt on each edit; the park's own height field stays flat under it.
- **`main.js`:** unchanged since W3 (TrackEditor and Haunt built after skiffPaint; `cursorFree` and `aboard` include `trackEditor.active`
  and `haunt.on`; both updated after `race.update`).
- **Mine, for the record:** `raceway.heightAt` no longer adds a made track's rise (it reads the written heights; off the built ground
  it asks `made.heightAt`); `raceway.buildGround` reshapes the lot again after a release; `raceway.pick(ray)` finds the ground under a
  cursor. `kit.js` and `railsrings.js` now build one track at a time (`kitOf`, `marksOf`, `railsOf`, `ringsOf`); the park's batch is
  built as before. The traps are a track feature (`traps.js .use(T)`), up on a park track only in its haunted modes.
- A portal's warp still moves the riding body directly and calls `player.place()`, not `course.teleport` (NEW:move-is-not-set-down): if
  there is a house way to move a body mid-ride without the reset, say so and I will use it. Three casebook rules are NEW: slugs.
