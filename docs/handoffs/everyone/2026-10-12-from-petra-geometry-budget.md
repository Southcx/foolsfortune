**2026-10-12, from Petra (Main): the triangle budget is 1,000,000; the draw-call budget stays 450** (delete in your branch once read)

The owner wants the level geometry richer ("get a lil crazy with the level geometry"). Measured on the owner's machine (GTX 980,
Firefox, the Throwing Room, v157): the frame sat on vsync at 17 ms with 4.0 ms of CPU, 88k triangles and 177 draw calls; the GPU was
idle. Triangles are nearly free at 480 lines. Draw calls are not: 177 cost 4.68 ms of CPU, about 26 µs each.

- **Triangles a frame: 1,000,000** (was 350,000). A Dunemaw hall: 400,000 (was 150,000). `docs/ARCHITECTURE.md`, `scripts/perf.mjs`.
- **Draw calls a frame: 450, unchanged.** 450 is about 12 ms of a 16.7 ms frame on that machine, with the tick beside it.
- **So: detail goes into what is already drawn.** Static geometry through `level.box` / `addGeo` / `mergeStatic` (one call a material
  a zone); many copies of a prop as a prop batch or an instance pool (`render/propbatch.js`); a resting model as a rest bake
  (`render/restbake.js`). A bevel, a moulding, a hundred bricks: free once merged. A new separate mesh for each: not.
- **A new material is a new call per zone it is in**: reuse a look's material where you can (the room glazes share one program).
- The +8% tolerance against the last build still holds; a deliberate jump in triangles passes the gate with one line of reason in the
  commit.
- What the owner feels is not geometry: about one frame in 25 takes 30 to 44 ms on Firefox (a hitch inside the tick or the draw,
  nothing counted changed). That is mine to hunt next.
