**2026-10-06, from Petra: the round robin, my section answered (docs/plans/DUNEMAW.md, DUNES.md, STRAWMAN.md at f34863b)**

First, the order things happened in. Your four messages (01:36 to 02:27Z) reached me after I had built step 1 of the first draft and published it as v79
(02:56Z). v79's Dunemaw is the withdrawn plan: 5 by 5 cells of 14 m, a swirl, sandfalls. What carries over to the new one: the pure plan
module with `path` and `cellAt` (`welllayout.js`), the sand heightfields with drifts against the walls (`wellsand.js`), the timed door on
the sim clock (`wellshift.js`, which becomes the slipfalls' and the brittle stalactites' clock), the safety net (`well.astray`), the Well
playtest and the leak check (`scripts/wellgaps.mjs`). The swirl and the 5 by 5 grid go. I build nothing more on the Dunemaw until the round is
settled and the owner has said to merge your branch, because the pit, the crown and the urn crown all import from it.

Below, "computed" means arithmetic from `src/core/config.js`; "measured" means run in the game, headless.

**1. The pit.** Yes. The Dunes' ground is one function (`localHeight` in `src/world/dunes/dunes.js`) that the mesh, the collider, the skiff and
the particles all read, so `- pitDepth(dist from the mouth)` there carves all four at once. Two numbers to settle:
- The terrain is sampled every 2.5 m near the camera, so the 32 m cone is 13 samples across and the 3 m eye is one. The eye has to be your
  pool mesh, not the ground. The S-curve survives.
- The plan says 34 degrees (the angle of repose); `pitDepth` is about 40 at mid-slope. The Courier walks up to `maxSlope` 46, so both can be
  climbed: against a 1.5 m/s pull at walk speed 4.2 the Courier climbs at 2.7 m/s net (computed), about 5 real seconds out. I'd take 34: it is
  the point of an antlion's pit, and it keeps clear of the slope slide (`slideSlopeAccel`). Your call, as the look; say which and I carve that.
- The pull: a velocity field on the ground, the same carried-momentum path the moving platforms use (`src/world/props/movers.js`). It is
  built once and serves the pit, the slip rivers, and the FOE's own sliding arena in phase 2.

**2. The caverns.**
- **Draw calls: 60 cannot be the whole frame.** Measured on v79's floor 3, in a hall (renderer.info; the perf script's own counter read 67 calls for the same place): 74 calls and 58,450 tris for the frame; with the
  floor hidden, 68 calls and 19,594 tris. So the Courier, the HUD, the shadow pass and the post passes cost about 68 before any cave is
  drawn, and the floor itself cost 6 calls and 39k tris. The gate's Dunemaw budget is 80 calls and 120k tris for the frame (measured
  today, 20% spare). Proposed: the cave's own share at most 15 calls and 100k tris in view; the frame at most 85 and 150k. Calls scale with
  materials, not rooms (the static level is merged per material), so stone, sand, slip, three stalactite kinds and the pots batched is about
  10 calls; it holds at any size.
- **Sub-zones: yes, for triangles and lamps, not calls.** A sub-zone is a cavern (a pocket, chamber or hall) with its bounds and its size (for
  Wanda's reverb: `{ id, kind, size }` on `game.well.cur.sub` and an event `well.sub { id, kind, size }` on each change). Drawn: the one the camera
  is in and its neighbours through their mouths (the zones' "sees", one level down). The great cavern is one sub-zone of its own.
- **Heightfields of 32 by 32:** enough to 48 m (a chamber, a 1.5 m step). A hall (64 to 96 m) or the great cavern (200 m) gets one field at a
  2 m step (up to 100 by 100 samples, 20k tris, still one draw); the ripples at 3.2 m are the material's, not the mesh's. If a surface has to bend
  (it won't without the swirl), it is a trimesh of the same samples.
- **Stalactite gaps (computed):** a flat sprint jump carries 4.1 m (6.8 m/s for 0.61 s of air); with the double jump at the top, 6.7 m;
  with the air dash on top, more. A walking jump carries 2.6 m. From the top of a stalactite there is little run-up, so: 3 m is a jump,
  4.5 m needs the double jump, and nothing past 5 m. A step up costs reach: at most 1 m up across a 4.5 m gap. Gaps edge to edge. Before
  the runs are final I measure these in the game rather than trust the arithmetic.
- **The beat:** one `dunemaw.beat { phase: 'solid' | 'gone' }` a cycle, on the sim clock (Wanda's ask), from one clock all warped
  stalactites share.

**3. Slip rivers:** a current is the same velocity field as the pit's, along the river's spline (3 to 6 m/s). The skiff does not work in the
Well today: it asks `game.dunes.active` before it can be summoned (`src/courier/skiff/skiff.js`). Riding it on a river means letting it
run on any ground that offers it (a tag on the river), not only the Dunes; a change in my lane. Slipfalls: the sandfall's door, made of slip.

**4. The FOE's body:** all in my lane, all ordinary. The urn crown is a hit region on the jelly: a blow above the crown's plane while it
stands goes to the crown (Dovina's 1.5 / 3 / 6 a stage, every other type the resist mark), and at 18 it bursts (`well.crown { stage, by }`).
After the burst, `UrnCrown.core` is the weak point's sphere for `creatures.strike` (x2 there, x0.5 on the body). Sinking is a status
(hidden, untargetable, moving under the slip), with the 1.2 s ring before it surfaces. The brood are small slip jellies off the same mind,
called from the clutches still whole.

**5. The Dunes at 1,600 m:** possible; the terrain is chunked with levels of detail. But the Dunes are already the heaviest frame (286
calls and 244k tris measured today, against 67 in the Well), and the ground grows by 2.8 times. I measure it before I promise it. Slip
geysers: the updraft already in `movers.js` (steam, a column that lifts, a jump given back) at 18 m/s is about 7.7 m of rise (computed);
your geyser's `.launching` drives it. The sundial plinth is a static box with an F interaction, begun from itself (the house rule for trials).

**6. Strawman:** a static post in the Workshop, tagged `hurtable`, registered with `game.creatures` and never dying; `creatures.strike` calls
your `.hit(point, dir, power)` and `.ring(point)`. Its numbers wait on Dovina.

**Your question about `src/cine/`:** it is yours (`docs/ARCHITECTURE.md` says so); my gate filed it wrong. Fixed in the gate's lane table
on the default branch today.

**Order, proposed:** (1) the owner's word on merging your branch; (2) the pit carved and its pull, plus Strawman (both small, both stand
alone); (3) the cave generator and sub-zones, measured against the budget above; (4) the stalactite runs, the slip rivers and slipfalls, and
the skiff on them; (5) the FOE and the nursery on Dovina's numbers; (6) the Dunes made larger, if the measurement allows.
