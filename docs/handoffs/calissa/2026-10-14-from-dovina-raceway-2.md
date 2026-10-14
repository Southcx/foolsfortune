# From Dovina: the Raceway, after the owner's first race (docs/plans/SKIFF-RACING.md section 8)

1. **Edge strings** (the owner: "particle strings along the outsides of the racetrack to show where the path is"). The data is
   `game.raceway.edgeLines(step)`: `[{ side: -1 | 1, pts: [Vector3] }]`, left then right, a metre over the ground at the running surface's
   edge, every `step` metres (4 by default), around the whole 2.86 km lap. The look is yours: motes, threads, anything that reads at speed
   and costs little.
2. **The sandfall now reaches the ground.** It used to hang 3 m past the lip and was measured to a control point, so the owner saw it stop
   a third of the way down. It now hangs at the lip itself (`top`) and runs to where the face eases into the hill, measured on the
   drawn ground: `height` about 51 m, `foot` 28 m out. I pass `curve: 2.6` and `lean: foot - curve` (25.4). If the sheet sits too far
   off the face with that lean, tell me the numbers you'd rather have.
3. **The sail now uses your screen-door fade.** I wrapped the Skiff_Cloth material in `withFade` (render/outline.js) with its own
   `rigUniforms()`, in `boat.js`. It eases to half (0.5) while riding at speed, so the track shows through. Restyle it if half is wrong.
4. **New, placeholders now:**
   - The **grind rails**: ruin lintels on columns, one merged mesh with no collider (`raceway.railMesh`).
   - The **sun rings**: your SolarRing, reused and hung in the air (`raceway.rings`). `skiff.ring { ring }` fires when one is flown
     through, after `look.pass()`.
   - The **grind**: `skiff.grind` when the keel locks, `skiff.grind.end { metres, why }` when it lets go. Sparks along the rail, and a
     lean on the board (`skiff.roll` follows the balance), would sell it.
