# From Calissa: the touch rebuild's arc, my view and three mock-ups (2026-11-01)

Answering your TOUCH-REBUILD.md asks. The mock-ups are at 896 x 414 (2x), in `docs/ref/touch-rebuild/`:
- `foot.webp`
- `tool.webp` (the psygun drawn)
- `arena.webp`

The backdrops are real frames. The tiles are drawn in the Clay dress, with each slot's pad button in its corner.

**Yes to the skeleton.** One arc, relabelled and never moved, directional presses, no dead tiles: I'd build exactly that. My changes are
to the geometry.

## The arc's shape and sizes

Two rings round A, measured from A's centre. A's centre sits 52 px in from the right of the safe area and 50 px up from its bottom
(802, 343 on a 896 x 414 iPhone).

| ring | slot | size (px) | radius (px) | angle |
|---|---|---|---|---|
| — | **A** | 80 | 0 | (the corner) |
| inner: the verbs a fight mashes | **B** | 60 | 96 | 178° (left: the thumb slides) |
| inner | **D** | 60 | 96 | 137° (the diagonal: the easiest reach after A, so the second weapon verb gets it) |
| inner | **C** | 60 | 96 | 96° (up: the thumb flicks) |
| outer: the deliberate verbs | **E** | 48 | 162 | 170° |
| outer | **PICK** | 44 | 160 | 147° |
| outer | **BELT** | 44 | 160 | 123° |
| outer | **F** (the meter) | 54 | 166 | 99° |

In units of su (1 su = 4.14 px here): A 19, inner 14.5, outer 11.5; the rings at 23 and 39.

Why two rings: a mashing thumb lives inside the inner ring. The outer ring takes a reach, so a swap, a pick or an art is never pressed
by accident in a flurry.

## Where the meter slot sits

**At the top of the outer ring, over C.** I'd move it there from the far end, for two reasons:
- **The eye:** a full meter is a moment, and the top of the arc is where the eye meets it (Genshin's and Zenless's ult).
- **The thumb:** the far-left end is where the thumb sweeps when it dodges off B, so an art would go off by mistake there.

The meter's ring is the slot's rim: violet as it fills, gold and glowing when full (see `tool.webp`).

## Smaller points

- **PICK and BELT** sit on the outer ring between E and F, not on the edge. The right edge under the Sight is too narrow for two
  44 px tiles beside F.
- **The middle.** The arc keeps out of the centre 60% except its lower-right corner, which the inner ring's B and D reach into by
  about 20 px. Every corner-arc game gives that corner up, and the bodies stand higher than it.
- **A directional slot** (A and D in the Arena; D with a tool drawn) wears four small gold chevrons on its rim, so the stick's
  reading is told on the button itself.
- **CROUCH on the stick:** a gold notch under the stick's ring, labelled until the first path has taught it.

## What the mock-ups get wrong

- The on-foot frame still shows the psygun in the hand. It is the same backdrop as the tool frame.
- A sliver of the real place plate shows past the Sight on the right.

## The hearth and its window

I'll dress both once your round is on main. `hearth.js` and `kitchen.js` aren't there yet, and I won't build on a branch's files.

## Drop sprites

Done, on my branch (5746def): `game.dropSprites.texture(cat)`, all 23 kinds, 48 x 48 and nearest-filtered. I haven't done the
optional glint and take burst yet, because their events aren't on main.
