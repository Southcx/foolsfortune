# Three mimicry puzzles: the runtime's hooks (from Dovina, 2026-11-02)

The rules are on claude/dovina-design (GAPS G141 to G143; MIMICRY.md 7). `progress/mimicry.js` now has a puzzle **family**, and two
new rules modules sit beside it: `progress/mimicryherd.js` (the flock) and `progress/mimicrysculpt.js` (the creations, voxel to voxel).
I did not touch `world/mimicry/mimicry.js`. Nothing of yours breaks meanwhile:
- A family you do not run yet is never open (`MIMIC_RUNS`), and the ladder steps over it (`MIMIC_LIVE`).
- The Flock and Pillar and Arch wait. Below the Surface runs today as a plain MATCH.

## What works today with no change of yours

**Below the Surface** (the ridges, last rung) is a matter puzzle:
- `P.powers` is `['strata', 'shape']`: Layer View is lent first, so `start()` puts it in hand.
- `framesOn` returns `fr.veil` beside the frames. It is unused until hook 6.

## The hooks, by family

1. **Strokes.** Add `'god.sculpt': 'sculpt'` and `'god.herd': 'herd'` to `STROKES`. A Layer View read (`god.strata`) is not a stroke.

2. **Frames.** Call `framesOn(F, P, at, g.creations?.grid)`. The grid is the creation puzzle's start: what already stands on the patch
   is kept, never wiped. Frames now carry:
   - `family`, for every puzzle;
   - for a creation, `vstart` and `vtarget`;
   - for a herd, `flock` and `pen` (patch-local `[x, z]`);
   - for a veiled puzzle, `veil`.

   A creation's and a herd's matter `start` and `target` are the same. Their ghost is empty, and `restore` works as it does now.

3. **The score.** Replace the `matchOf` line in `update` with
   `S.match = scoreOf(S.fr, { snap, voxels, bodies })`, building only what the family needs:
   - `snap(S.F, S.at)` for matter;
   - `voxelSnap(g.creations.grid, S.at)` for a creation (about 1 ms a score on a desk, as `matchOf`'s 1.3);
   - `S.flock.map((c) => [c.pos.x - S.at.x, c.pos.z - S.at.z])` for a herd.

4. **The flock** (The Flock, the shore).
   - **Spawn.** At `start`, spawn a clapperjar at each `fr.flock` point on the ground. Keep them as `S.flock`.
   - **Puzzle bodies, not counted.**
     - Mark each one (`c.puzzle = true`).
     - Its outcome events carry `by: 'environment'`. No drops, no ledger, never hostile, never `friend` (Herd's `near` leaves out a friend).
     - Despawn them at `finish` and on leaving: sunk into the sand, no shatter counted.
   - **The pen.** A body whose walk ends inside it (`inPen`, mimicryherd.js) stays inside: clamp its wander to the pen, or an ecology
     offer there, as you like.
     - A body left outside goes back to its own mind.
     - Draw the pen's polygon as a placeholder line on the ground. Calissa has the look.
   - **The demonstration.** For a `herd` step:
     - `herdSpots(bodies, step, MIMIC_TOOL.herd)` gives every body's place after the drag. It takes the nearest 4 within 6 m, as
       `WILL.herd` does.
     - Walk the moved ones there with the runner's `walk(c, to, 20)`.
     - Once the steps are done, set every body back at its `fr.flock` point under a puff and clear its walk.
   - Herd's `near` need not sort by distance for the score. The check assumes the nearest four, as the demonstration does.

5. **The creations** (Pillar and Arch, the ruins).
   - **The demonstration.** For a `sculpt` step, `sculptOf(step, (x, z) => S.F.groundAt(x, z), S.at)` gives `{ shape, a, b, opts }`.
     Then call `g.creations.raise(shape, a, b, opts)`.
   - **Putting it back.** Once the steps are done, call `restoreVoxels(g.creations.grid, S.fr.vstart)`. Then queue
     `g.creations.grid.takeDirty()` into `g.creations.queue`, as `raise` does.
   - **The mending.** It eats about 0.002 of a voxel's density every 30 real s, which is nothing over a puzzle. Holding the box's
     chunks while open is optional.
   - **What Sculpt costs.** Sculpt pays what it makes from nothing. `allow` is the System's own estimate (`fr.made`), so a copy made
     the same way keeps its third star.

6. **The veil** (Below the Surface).
   - Keep `S.read = new Uint8Array(fr.veil.length)` while open.
   - `god.strata` carries only `len` today. Please add the drag's ends, `a: [x, z]` and `b: [x, z]` (world), in `godhand/powers/sight.js`
     `SIGHT.strata.end`.
   - On it, call `unveil(S.read, [a[0] - at.x, a[1] - at.z], [b[0] - at.x, b[1] - at.z])`. Emit
     `mimic.read { puzzle, cells, by: 'courier' }` when it read any. Calissa's ghost and Wanda's chime hang on it.
   - Expose `game.mimicry.veiled()`: the mask of cells still hidden (`fr.veil[o] && !S.read[o]`), or null. The ghost hides those
     cells.

7. **Going live.** Once a family runs, set it true in `MIMIC_RUNS` (`progress/mimicry.js`). That is a one-word edit in my file, and
   yours to make. Nothing else of mine changes: the ladder, the stones' rungs and the achievements read `MIMIC_LIVE`.

## Checked

- `node scripts/mimicry.mjs` plays all three headless. All PASS.
  - **The Flock:** the System's 1.00; a hand's 1.00; half the steps 0.50; one drag from between the knots 0.67 (not solved).
  - **Pillar and Arch:** the System's 1.00; a hand's 0.78; the pillar alone 0.22.
  - **Below the Surface:** the veil hides 32 cells; copying only what is shown scores 0.33; a hand's 0.77; three reads across leave
    none hidden.
- Not checked: anything in the world. The runtime has no hooks yet.

Delete this note when done.
