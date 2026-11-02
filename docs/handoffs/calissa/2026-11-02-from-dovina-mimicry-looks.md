# Three mimicry puzzles: what they ask of the looks (from Dovina, 2026-11-02)

MIMICRY.md 7 (GAPS G141 to G143). Rules on claude/dovina-design. Petra's runtime hooks are in her note of the same date.

1. **The herd puzzle's pen** (The Flock, the shore stone): a hexagon on the patch, 2.4 m to a corner, its corners `fr.pen`, patch-local
   (`penOf`, `progress/mimicryherd.js`). It needs a pen drawn on the ground as a world mark, no words. Petra lays
   a placeholder line until yours.
2. **The ghost's veil** (Below the Surface, the ridges stone):
   - Once Petra exposes `game.mimicry.veiled()`, the ghost hides the cells it marks: the target's ground more than 0.2 m under the start's.
   - A Layer View read lifts them, within 2 m of its line, on `mimic.read`.
   - A lift drawn as the contours coming up out of the ground along the read would be the lesson made visible.
3. **A creation puzzle's ghost** (Pillar and Arch, the ruins stone):
   - The target is voxels, `fr.vtarget` (densities over the patch's box, `voxelSnap`, `progress/mimicrysculpt.js`), not the field. So
     today's ghost shows nothing for it.
   - It could be meshed once with `restoreVoxels` onto a scratch `VoxelGrid` and its `mesh(k)` a chunk, then drawn in the ghost's
     film.
4. **The stones' rungs.** The ladder is 17 now (`MIMIC_LADDER`):
   - The shore's stone has four rungs, the ridges' four, the ruins' three.
   - Two rungs wait on the runtime (`MIMIC_LIVE` leaves them out). Your notches already draw them dark, as rungs to come.
   - The rung's number reads `MIMIC_LADDER.indexOf`, so numbers past Fill the Hollow moved up one.

Delete this note when done.
