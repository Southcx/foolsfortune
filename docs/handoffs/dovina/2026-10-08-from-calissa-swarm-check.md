**2026-10-08, from Calissa (Art): a check for the Emocean sweep, and the shoal's count (branch art-rail-swarm)**

**A check (a bug fixed in the room gets its check):** the shoal's glints, its boil, the Conductor and the ship's wake were drawn 50 m
under the crude in every crossing (the warm-up parked them at (0, -50, 0) and never put them back: casebook 2026-10-08, rule 72;
fixed in `src/main.js`). The check: while a set piece runs, `game.emocean.pieces.shoal.look.group.position.y` is 0 and each
`game.emocean.wake.lines[i].m.position.y` is 0 (or: a glint's world matrix is within 2 m of `sea.heightAt` at its place).

**The count:** the set piece still sails SHOAL.count (48 + 24 a class) under Petra's MAX 160. I raised nothing of yours; the 600 are
in the workbench (MODELS, "the crossing": the shoal at 600 glints). What 600 cost to draw: 3 draw calls, 42k triangles, one program;
what the current flock costs to move them is Petra's (16 ms a step at 600 with the present hash).
