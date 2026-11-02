# From Calissa: the touch rebuild's arc, my view and three mock-ups (2026-11-01)

Answering your TOUCH-REBUILD.md asks. The mock-ups are at 896 x 414 (2x), in `docs/ref/touch-rebuild/`:
- `foot.webp`
- `tool.webp` (the psygun drawn)
- `arena.webp`

The backdrops are real frames. The tiles are drawn in the Clay dress, with each slot's pad button in its corner.

**Yes to the skeleton.** One arc, relabelled and never moved, directional presses, no dead tiles: I'd build exactly that. My changes are
to the geometry.

## The arc's shape and sizes (redrawn to South's rulings of 2026-11-01)

The arc is two rings round A, measured from A's centre. A's centre sits 52 px in from the safe area's right edge and 50 px up from its
bottom: (802, 343) on a 896 x 414 iPhone.

| ring | slot | size (px) | radius (px) | angle |
|---|---|---|---|---|
| (the corner) | **A** | 80 | | |
| inner | **G** CROUCH (3D only) | 60 | 120 | 183° (the inner end, beside B) |
| inner | **B** | 60 | 120 | 152° |
| inner | **D** | 60 | 120 | 122° (the diagonal: the easiest reach after A, so the second weapon verb has it) |
| inner | **C** | 60 | 120 | 92° (up: the thumb flicks to it) |
| outer | **F** the meter | 54 | 196 | 176° (the far end, as ruled; ringed, gold when full) |
| outer | **E** | 48 | 194 | 153° |
| outer | **PICK** | 44 | 192 | 131° |
| outer | **BELT** | 44 | 192 | 110° |

- **The inner ring** holds what a fight presses over and over. **The outer ring** holds the deliberate presses, so a swap, a pick or an
  art never goes off in a flurry.
- **Why the inner radius grew from 96 to 120:** with G added, four 60 px tiles 30° apart need it to keep from touching.
- **In the Arena, G is not drawn.** There the stick's ring carries a gold notch: crouch is the stick pushed down.

## Smaller points

- **PICK and BELT** sit on the outer ring's upper end, past E, not on the screen's edge. The right edge under the Sight is too narrow
  for two 44 px tiles.
- **The middle.** The arc keeps out of the centre 60% except its lower-right corner. The outer ring's F and E reach into it by about
  80 px at the bottom, under where the bodies stand. Every corner-arc game gives that corner up.
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

## The fold (South's ruling 4): redrawn

The mock-ups now use square tiles (glazed clay, 9 px corners) and the reversed outer order (E 110°, F 131°, PICK 153°, BELT 176°).
- **Their default states:** on foot is folded; a tool drawn in a fight and the Arena are half open.
- **`fold-strip.webp`:** the right half of the screen in five frames:
  1. folded: one stack at 110°, the other tiles' edges stepping out along the arc behind E;
  2. opening: PICK mid-flip, the ribbons crossing from F;
  3. half open: PICK and BELT stacked on F's back;
  4. open;
  5. the top bar's FOLD: everything in one stack at A, the FOLD tile lit.
- **The ribbons (my call, the same as yours):** they show only while a tile flips. They are two crossed ribbons, vermilion and gold,
  from the landed tile's edge to the flipping one. At rest the stack's stepped edges say how many tiles are folded in it. When F is
  in the stack and full, the stack's edge glows gold.
