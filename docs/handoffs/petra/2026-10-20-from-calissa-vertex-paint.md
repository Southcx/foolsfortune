# From Calissa (Art), 2026-10-20: vertex painting, a trial (the owner via Dovina: "Who need real lights anyway am I right?")

The answer, measured: **it does not pay at High as the game stands; it would pay as part of a game-wide slot cut, and as a look on Low and
Minimum.** The module is in (`src/vfx/vertexpaint.js`, `VertexPaint`, `game.vertexPaint`), off by default, behind `/vertexpaint` (DEBUG).
Nothing of yours was edited; nothing needs doing unless you want it permanent (end of this note).

## The survey

- The basement zone has **26 lamps**, all `0xffa066`, all static, none stored or animated by anyone: mood only. The hub 5
  (`basement.js` 286), the tech wing 3, the mill and the kiln stack 8 (`mill.js`), the rigging 5 (`rigwing.js`), the siege 5 (`siege.js`).
  The workshop's two kiln lamps flicker (`main.js` sets `kilnLight.intensity` each frame) and the bazaar's turn with the dome: not mood-only.
- The budget lends 8 a frame; 87 lamps in the world are proxies. Every lit shader is compiled for 8 point lights whether lent or dark.
- The statics are `MeshStandardMaterial` (flat, dressed by `vfx/surfaces.js`, the paint map's patch), merged per colour, zone and 64 m
  cell by `level.finalizeStatic`: 86 meshes, 32,429 triangles in the basement. One of them (the floor with a `color` attribute) is indexed.

## The numbers (draw ms, SwiftShader at High, 960x540, the hub at (14, -14, 14); A/B alternated 3 times, medians)

| variant | draw ms | vs live | tris drawn | calls | lamps lent |
| --- | --- | --- | --- | --- | --- |
| A live lamps, 8 slots | 662 / 663 (two runs) | | 59.7k | 116 | 8 |
| B baked (4 m tessellation), 8 slots | 808 | +22% | 87.6k | 116 | 0 |
| C baked (4 m), 2 slots | 740 | +12% | 88.0k | 116 | 0 |
| E baked untessellated, 8 slots | 652 | -2% (noise) | 59.7k | 116 | 0 |
| F baked untessellated, 2 slots | 583 | -12% | 60.5k | 116 | 0 |
| D live lamps, 2 slots (the look lost) | 593 / 599 | -10% | 60.9k | 116 | 8 |

(The first try tessellated to 1.25 m: 32k -> 843k triangles in the zone, 280k drawn, 1,189 ms, +75%; and its bake took 12.8 s.)

- **Programs:** the bake adds 2 (169 -> 171: the `vpaint` twins of the statics' programs). Changing the slot count recompiled every lit
  program (171 -> 191 to 193): a slot count is a restart, never a per-zone switch, or it is a hitch at every door.
- **The bake's cost:** 0.6 s untessellated, 2.2 s at 4 m with AO (12 rays a vertex, 81,754 vertices, 0.98M rays on Rapier's query BVH).
- `npm run perf` before and after (the bake off by default): programs 169 / 170 / 170 / 186 both times, calls 437 -> 439 (workshop), 231 -> 237 (dunes, particles), 85, 196; perf OK both times.

Reading it: the bake itself (an attribute, a varying, one line in the shader) costs nothing; turning lamps off at a fixed 8 slots saves
nothing (the slots still run); fewer slots save 10 to 12% of a lamp-heavy room's draw; tessellation for the light's resolution costs more
than that on a CPU rasteriser (it would be nearly free on a GPU, but SwiftShader is our gauge). Untessellated, a 40 m floor is lit at its
corners only, which is not the look.

## Where it would pay

1. **Low and Minimum** (4 and 2 slots): the basement's 26 lamps are 4 or 2 there today; baked, all 26 are back, for nothing per pixel.
   That is a look gained, not a frame.
2. **A game-wide slot cut** (8 -> 4 at High) once every mood lamp is baked: the basement, the Throwing Room's 6, the Dunemaw's bowls,
   Margarite's, the circuits' (candidates, not surveyed for animation). The win measured above, about 10%, everywhere at once.
3. Lamp shadows for free (`shadows: true`): not used here. The real lamps cast none, so the course's lamps light the hub through its
   walls today; baked with shadows the hub's walls lost 34% of their lamp light and the floor 60%. Right for a room built for it, not this one.

## What making it permanent would take (yours, if you want it)

- Bake at build, not by command: `level.finalizeStatic` (or a pass after it, per zone) calls `bakeMeshes` with the zone's lamps, and those
  lamps are never added (or are added with `userData.baked` so the budget skips them in `scan`). The program warm-up must see the `vpaint`
  twins (2 programs) so none compiles in play.
- Tessellate where the light needs it, not every face: by the lamp's gradient over the face (a split only where the irradiance at the
  midpoint differs from the corners' mean by more than a few %), or a coarser `maxEdge` on walls than floors.
- Dynamic things (the Courier, pots, clapperjars) lose the baked lamps. Keep one budget slot per room for its strongest lamp, or a
  `LightProbe` per zone with the baked lamps' SH (three's `LightProbeGenerator`), excluded from the statics.
- The scripts: `measure.mjs` and `measure3.mjs` (adapted from `scripts/perf.mjs`) are in my scratchpad; I'll add one to `scripts/` if you
  want it kept.

Verified: the module runs headless (bake, unbake, 9 alternations each run, no page errors), `npm run check` OK, `npm run build` OK.
Not verified: on a real GPU; the Courier's look in a baked room; the look of the 4 m shadowless bake (the one shot taken was the first try,
1.25 m with shadows: `before.png` / `after.png`, not broken, but darker on the upper walls for the reason in 3).
