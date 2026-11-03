From Dovina (design): the six later traps, Read's ghost line, the plate on the beat, painted ground (G305, G308, G312). Delete this note when done.

Rules in `progress/traps.js` (data), `progress/trapzones.js` (geometry); the world in `world/raceway/trapkinds.js`. Your `racewaytraps.js` `place` is asked first and returns null for a kind it has no body for, so the plain placeholders below stand until you dress them. Same contract as the first seven: `look.show(Tp, t)` each frame, `Tp.phase` idle / tell / active, `Tp.k` 0..1 through the tell or the act (it is 0 on the act's first frame now), `Tp.stun`, `Tp.wrath`. The trap's frame: `root` on the line at `Tp.s`, local x = -lat, local z along the race; `F.w` is the half-width; a lane is a third of the width (`laneLat(lane, W)`, lane 0 on the left edge).

Each trap, its placeholder parts, and what `Tp` carries (tells at least 0.6 real s, the reach drawn on the sand lit through the tell as in your kit):

- **antlion** (`Tp.lane`): placeholder = a long glow pad over the lane (back 22 m + reach 50 m) and a cone (r 3.6) sunk at -22 m. Tell: the lane lights and the maw surfaces (y -4 to -1, k). Act: the maw lunges from a = -22 to +50 along the lane in 1.2 s (`mawAt(K, k, lane, W)`, r 4.5), faster than a rider. Hit zone is the maw's footprint; a hop clears it.
- **boulder** (`Tp.lane`, `Tp.broken`): placeholder = a lane pad and an icosahedron (r 2.6). Tell: the lane lights, the rock waits at a = +44 m. Act: rolls toward the riders down to a = -16 over 1.6 s (`boulderAt`); spin it by distance. `Tp.broken` true when the Courier's shoulder broke it (event `trap.break`): crack it apart there.
- **hasten field** (`Tp.lat`, or the lane when possessed): placeholder = a glow disc (r 9) and a ring (torus) that spins up. Tell: ring grows from 0.5; act: ring full and spinning for 3 s, the sand and the board slowing in it (a time-dilation look: Braid's bubble).
- **storm cell** (`Tp.marks` [{ a, lat, at }] set at the tell's start, `Tp.struck` [real-time stamp per mark]): placeholder = three small glow discs (r 3.5) at the marks and three bolt cylinders flashed 0.25 s when struck. Tell: the marks lit on the sand; act: a bolt on each at k = 0.25, 0.5, 0.75 (`trap.bolt { mark }`). Lightning from the sky; your caster `Lightning` fits.
- **ward gate** (`Tp.lat`, or the lane when possessed): placeholder = a glow disc (r 7) and an open cylinder wall rising from the sand in the act. Tell: the circle written on the sand (the Ward's circle); act: the wall of strokes stands 1.2 s (your `wardWall`).
- **pot catapult** (`Tp.lane`, `Tp.smashed`, `Tp.landed`): placeholder = a post and arm at the track's left edge (lat -(W + 4)), a pot (sphere), a landing ring (r 4) at a = +36 in the lane. Tell: the arm draws back (rotation by k), the landing ring lights; act: the pot flies the parabola `potAt(K, k, lane, W)` (arc 9 m) in 1.2 s and lands at k = 0.92 (`trap.land`). `Tp.smashed` is true when the Courier popped it in the air (`trap.smash`): burst it there. A clapperjar working the arm is the plan's picture.

Read (G308): `game.raceway.traps.reads` is a list each frame, empty unless the rider has Read and a possessed trap is about to fire: `{ i, kind, from: 'bot' | 'recorded', in (real s to firing, within +-0.8), lane, dir (-1 / 1), origin (Vector3, the trap's root), to (Vector3, where its aim falls) }`. Draw the possessor's aim as a ghost line origin -> to (a dashed line in the Divination ramp, brightening as `in` nears 0). Event `trap.read { kind, i, from }` once per trap shown.

Plate on the beat (G312.1): `skiff.plate.beat { plate, grade: 'perfect' | 'good', off (seconds from the beat, signed) }` fires as the board crosses a sun plate on the beat; the plate's own `skiff.plate` event carries the bigger `power` (x1.35 perfect, x1.15 good). A pulse on the sun plates with the cue's beat (the plates glow on `game.music.clock().beat`) would let a player find it by eye; a brighter ring on a perfect.

Painted ground (G312.2): no look asked, the paint map's own look stands. Grip by feeling is in `progress/trackpaint.js` `LINE_PAINT` if the paint look wants to hint at it (Wonder grips, Grief is slick).

Shelf and endless (G307): `endless.start / track / fail / skip / end` and `shelf.add` events; no look asked (the race board's rows are plain).

Placeholders are mine and plain; nothing here is final.
