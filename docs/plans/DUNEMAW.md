# The Great Dunemaw, made big (the owner, 2026-10-06)

Kept by Calissa (the look and the numbers). Petra builds the layout, the colliders and the shifting (`src/world/well/wellkit.js`,
`src/world/well/dunemaw.js`) from this file; Calissa dresses it (`src/vfx/dunemawkit.js`, `src/vfx/dunemaw.js`, `src/vfx/glitch.js`).
Every number here is a first guess to be tuned in play. Times are **real seconds** unless they say **sim seconds** (the game's own
clock, `dt` summed: it stops when the game pauses, and a replay sees the same).

## The owner's ask

> "WRT the Dunemaw, I want you to think about how to make it bigger, make it psychedelic, make the level design twisting and shifting
> like sand (and also fill it with sand). You saw that the music was full of trippy motifs. Don't hold back on me!"

And from the same message: lean into .hack's glitch (datamosh, chromatic aberration), use the frame accumulation for "a sweeping pan or
camera flythrough previewing the Dunemaw"; the look may reach for the seventh generation while the performance spec stays the sixth.

## One look, named plainly: A MIND FULL OF SAND

The Dunemaw is a Well: Lachryma's own place, under the island's mood. Down there the sand of the Dunes has poured into a mind, and the
mind is bending it. It starts as a soft verse (pale, hushed, almost the Dunes) and ends as a wall (saturated, turning, torn), as the
owner's favourite songs do (`docs/OST.md` §6: the soft verse that drops into a wall, silence used as a hit).

## Prior art

- **Psychonauts' mind levels** (Double Fine, 2005; the Milkman Conspiracy's streets bent round a planetoid): a level that is a mind
  bends its architecture to the mind's shape. Taken: the rooms twist more the deeper the mind.
- **Journey's sunken city and sandfalls** (thatgamecompany, 2012): sand that flows like water, falls from the ceiling and is surfed.
  Taken: sandfalls as the shifting doors, and sand slopes the Courier can ride.
- **Uncharted 3's Iram of the Pillars** (Naughty Dog, 2011): a city half drowned in sand, sand pouring through it. Taken: rooms half
  buried, the doorways' sills of sand.
- **Spelunky's room grid** (Derek Yu, 2008: already the kit's) and **Persona 3's Tartarus** (floors from a seed): kept as they are.
- **M. C. Escher's Relativity, Antichamber**: a place that will not sit square. Taken lightly: twisted frames, never a gravity trick
  (the core movement is the gold standard).
- **LSD: Dream Emulator, Silent Hill's Otherworld**: the walls that breathe and the colours that drift. Taken: a few centimetres of
  breath on the walls (looks only), the oxide colours drifting.
- **.hack's Lost Ground and Data Drain**: the place shows its data when it tears (`src/vfx/glitch.js`).

## The floors (Petra's to build)

Three floors stay (the economy's pay and the FOE count are Dovina's and do not change); each floor is much bigger.

| | now | proposed |
|---|---|---|
| grid | 3 by 3 rooms | **5 by 5** cells |
| a room | 14 m | 14 m, and **halls** of 2 by 2 cells (28 m), 1 to 3 a floor |
| a floor | 42 m square | **70 m square**, in **two tiers** (see below) |
| rooms a floor | 4 to 9 | 12 to 18 on the path and off it |

- **Two tiers.** Every floor has an upper and a lower tier, about 6 m apart; the guaranteed path crosses between them at least twice,
  down **sand slopes** (a slope of sand from a doorway to the tier below, 20 to 30 degrees: the Courier walks down or rides it, as the
  skiff rides the dunes) and up by a ledge to mantle or a ramp.
- **The twist.** Each cell's frame is turned about the floor's centre by `twist * (c + r - 4)` degrees (c, r the cell's column and row),
  so the grid is a spiral seen from above and the corridors between rooms are short angled tunnels. `twist` grows with depth:
  **0 degrees on floor 1, 7 on floor 2, 14 on floor 3** (the verse is square; the wall is bent). Rotated boxes are `level.box` with
  `rotY`; the walls of a twisted room are still straight boxes.
- **The lean.** On floor 3 a room's floor may tilt up to 8 degrees (sand piled to one side); the heightfield carries it, no box tilts.
- **The doors** stay 4 m wide and 4 m high, and never less than 2.4 m clear above the sand in them.

## The sand (Petra's colliders, Calissa's look)

- **Sand to walk on** is a Rapier heightfield per room: at most **32 by 32** samples (0.45 m apart in a room, 0.9 m in a hall).
- Its shape, by floor (seeded, `seeded(seed ^ floor ^ cell)`):
  - floor 1: a ripple field 0.2 m high, drifts against the walls up to 1.2 m;
  - floor 2: dunes inside rooms up to 2 m, drifts to 2 m;
  - floor 3: rooms half buried, dunes to 3 m, a doorway's sill of sand up to 1.5 m (still 2.4 m clear).
- **Drifts too small for the heightfield** are dressing, not colliders (Calissa's: drawn, not walked on).
- The sand is drawn with the Dunes' own sand material (the terrain's, `src/render/terrain.js`), with the owner's sand-ripple texture
  (the liquid pack's B channel) and the Lachryma showing in the troughs (Calissa's, in the kit: `K.sand`).
- One merged sand mesh a floor (the heightfields' surfaces, built with the floor and disposed with it): one draw.

## The shifting (Petra's, on the sim clock, seeded per floor)

- **Sandfalls.** On a side passage (never the guaranteed path), a curtain of sand pours from the ceiling on a cycle: **open 30 sim
  seconds, falling 12 sim seconds** (a blocking collider while it falls; drawn by Calissa as a sandfall, the spout's falling shader).
  2 to 4 a floor, out of phase. **A sandfall never closes on the Courier**: while they stand in it, it stays open, and it starts to fall
  only once they are clear. A warning: 3 sim seconds before it falls, a trickle starts (Calissa's look; Wanda's hiss).
- **Drift tides.** On 1 or 2 slopes a floor, the sand rises and falls 1.5 m over **60 sim seconds**, in **10 steps** (the heightfield
  rebuilt at each step: a ledge opens to mantle onto at the low tide, a low passage is buried at the high). Never under the Courier's
  feet: a step that would lift the sand through them waits.
- **The turning hall** (floor 3 only, at most one, phase 2): a round hall whose floor is a disc of sand turning slowly (one turn in 90
  sim seconds, a kinematic body), sand pouring off its rim into the dark.
- Nothing shifts on the guaranteed path's floor in a way that cuts the path: the path is always walkable.

## The look (Calissa's)

- **The grade by depth: the verse into the wall.** Floor 1 is hushed: the walls' oxide colours at a third, a violet haze close in, the
  floor's labradorite slow. Floor 2 brings the colours up. Floor 3 is the wall: everything at full cry, the oxide colours drifting, the
  walls breathing (3 cm, a slow vertex wave: looks only), sand falling upward in the corners (motes, looks only).
- **When the FOE shows itself** (`well.foe`): the cut (two frames of silence, the glitch's drop-out), then the slam: the glitch tears,
  the room's lamps and colours jump to full. With Wanda's drop (OST.md: "the soft-to-crushing drop") on the same beat.
- **The sky down there.** Where a room has no ceiling (halls), the dark overhead is the maw seen from below: the labradorite swirl, with
  sand pouring down out of it.
- **The flythrough.** On arriving on a floor, a preview: the camera sweeps the floor from above along the guaranteed path (about 4 real
  seconds), with the frame accumulation on (`post.accum`: amt 0.55, zoom 0.006), and lands behind the Courier; any key skips it. It
  needs the floor's path in order (`layout.path`, Petra's: the cells from the way in to the way down) and borrows the camera as the
  overture does (`src/cine/`, Calissa's).
- **The throat** (phase 2): going in, a ride down a twisting chute of sand from the mouth to floor 1 (6 real seconds, the Courier
  sliding, the frame accumulation and the glitch on), in place of the maw wipe's cut.
- **The landmark** (done, `DunemawSpout` in `src/vfx/dunemaw.js`): the spout of sand pouring up out of the mouth, 70 m, and falling
  back round it.

## Budgets (the gate's)

- It stays one `well` zone; the static parts are merged per floor (`level.box` / `addGeo`).
- A floor: at most **60 draw calls** standing in a hall (walls and trim merged: about 6; the sand: 1; sandfalls and dressing:
  instanced, about 4; creatures and the rest), at most **120k triangles** (the sand: 18 rooms by 2k).
- Colliders: one heightfield a room, 32 by 32 at most; the shifting rebuilds at most one heightfield a sim second.
- Perf gains a Dunemaw case (Petra), and its first numbers become the budget.
- `npm run playtest well` must still pass (Petra extends it to the new floors).

## Order of work

1. Petra: the 5 by 5 grid, halls, two tiers, the twist, heightfield sand, the sandfalls (the colliders and the cycle); `layout.path`.
2. Calissa: the sand's material, the sandfalls' look, the grade by depth, the flythrough, the FOE's slam (the glitch is in).
3. Phase 2: drift tides, the turning hall, the throat.
