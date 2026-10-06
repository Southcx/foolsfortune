**2026-10-06, from Petra: the Dunemaw made big, step 1 built to `docs/plans/DUNEMAW.md` (where I departed from it and why, and what is yours to hook)**

What stands (`src/world/well/`: `welllayout.js` the plan, `wellsand.js` the sand, `wellshift.js` the sandfalls, `wellkit.js` the build):
- 5 by 5 cells of 14 m; 10 to 20 rooms a floor (13.8 on average over 900 floors); 1 to 3 halls of 2 by 2 cells, open to the dark; two tiers
  6 m apart, the path crossing them exactly twice through slope cells (a ramp of sand, 23 degrees, walked either way); 2 to 4
  sandfalls a floor on side links (open 30 sim seconds, falling 12, 3 of warning; never on the Courier).
- Sand in every room, by your numbers: ripples and drifts on floor 1, dunes on 2, rooms half buried on 3. Doorways and pools lie flat.
  Nothing a jelly can stand on is steeper than about 36 degrees, so the Courier can follow it anywhere.

Where I departed from the spec, measured:
1. **The twist is a swirl, not turned cell frames.** Turning each cell's frame about the floor's centre by `twist * (c + r - 4)` made rooms
   on floor 3 overlap by 10 m; turning them about their own centres broke the doorways. So the floor is swirled: each point turned about
   the centre by an angle growing with its distance out, `4 * twist` at the corners (0, 28, 56 degrees). From above it is a spiral and the
   corridors bend, as you wanted. A swirl shears as much as it turns, so walls are laid piece by piece between their swirled ends, and the
   sand and the ceilings are swirled meshes. That is why the sand's collider is a **trimesh** a room, not a heightfield (a heightfield
   cannot bend): the same 32 by 32 samples, the same cost.
2. **Walls are taller than WALL_H by the sand they hold**: +1.5, +2.5, +3 m by floor (7, 8 and 8.5 m; halls 1.6 times that). With drifts
   of 2 to 3 m against them, 5.5 m walls were within a hang's reach (the playtest's agent climbed out onto a roof).
3. **No floor slab**: the sand is the floor (it covers each room to the walls' middles; rooms meet edge to edge). The kit's glass floor is
   not drawn down there now.
4. A **safety net**: off the plan for a real second (out between the rooms), the Courier is set back where the floor began
   (`well.astray`, a placeholder log line for Espada).

What is yours to hook (all on `game.well.cur`, the floor standing):
- `path`: the guaranteed path's cells in order, as points on the sand (Vector3), from the way in to the way down. The flythrough's.
- `sandfalls`: `[{ pos, yaw, state: 'open' | 'warn' | 'falling', k }]`, and `well.sandfall { floor, i, state, by: 'environment' }` on each
  change. A plain sand-coloured sheet stands in for each (`sandfall-<i>`, material `well-sandfall-standin`): replace or hide it.
- The sand: one mesh a floor, `well-sand`, material `K.sand` from your kit when it has one, else a stand-in (`well-sand-standin`).
- `cells` (each `{ x, z, y, c, r, role, hall, slope }`), `cellAt(x, z)`, `door(c, r, side)`, `onSand(c, r, lx, lz)` for placing dressing.
- Not built yet (phase 2, as the spec orders): drift tides, the turning hall, the throat; floor 3's tilted rooms and sand sills.
