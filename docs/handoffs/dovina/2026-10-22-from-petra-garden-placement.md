# From Petra: placing decor in the Spirit Garden (the cozy round's research, my lane)

Research first, as asked. These are proposals for GARDEN-COZY.md; the owner prunes. The numbers are measured unless they say otherwise.

## What I propose

1. **A decor grid of its own, a cube-sphere per planetoid.**
   - **The grid:** each planetoid's six cube faces subdivided into quads of about 1 m: 16 to 31 cells along a face's edge for radii 10 to 20 m. A cell is `(face, u, v)`.
   - **Placement:** half-cell steps (Animal Crossing's half-tile), the yaw in steps (four turns, or 15 degrees). Shift held places freely and stops at alignments with the neighbours instead of jumping to them (snap-and-go).
   - **Why not the clay's grid:** it is latitude by longitude, 128 x 64, and its cells shrink toward the poles: at 80 degrees a cell is 17% as wide as at the equator, in the last row 2.5%. Decor snapped to it would bunch there.
   - **The cube-sphere, measured:** with the equal-angle mapping its cell edges stay within 1.41 : 1 (16 cells a face). The plain projection is 2 : 1 in edges and 4 : 1 in area, so it is the equal-angle one.
   - **The clay keeps its grid:** that is fine for a heightfield. Decor reads it: each piece sits at `clay.radiusAt(dir)`, and holds the ground under it with `clay.keep(dir, r)`, as a feature does today.
   - **Townscaper's look:** its relaxed irregular quads are a later option. The grid is any quad mesh's faces (Sylves' MeshGrid), so a relaxed cube-sphere drops in without changing the save.
2. **Many props for little.**
   - **The draws:** decor drawn by one `BatchedMesh` per material, as the prop batches are (render/propbatch.js; since v258 a batch starts at 4,096 vertices and grows).
   - **Per piece:** three r170 gives each piece a tint (`setColorAt`), a visibility (`setVisibleAt`) and its form (`setGeometryIdAt`). The garden can turn tended or briar piece by piece with no new draw calls: a modifier with a source in the world, not a base change.
   - **Shadows:** small pieces cast none.
   - **Budget, measured at v258's baseline:** the garden draws 196 calls (budget 450) and 114,532 triangles (1,000,000).
   - **The one cost already there:** the 17 shader programs compiled after the warm-up are all the garden's. Decor must share existing programs, or be warmed when the realm is built, or every new material is a hitch the first time it is seen.
3. **Saving a layout.**
   - **The record:** a `decor` list in the realm's save section (scope player, version 4), a piece as small integers: `[kind, planet, face, u, v (half-cells), yaw step, tint]`. That is about 20 to 30 bytes a piece in JSON, so 1,000 pieces is about 25 KB.
   - **For scale:** a sculpted planetoid's clay already saves 8,192 integers (about 25 to 40 KB) in the same section.
   - **Sharing:** a layout can later be copied as a text code to a sibling or a guest (the co-op room).
4. **Undo.**
   - **A command stack:** place, remove, move, turn, tint, each with its inverse; 50 deep, with redo.
   - **One Ctrl+Z for everything:** it serves decor and clay alike if a clay stroke is recorded as a command holding the snapshot the clay keeps today. The clay's own undo is ten full snapshots, two arrays a planetoid each.
5. **A camera for decorating.**
   - **As built:** the garden's overhead view is half of it already: straight down, WASD pans over the surface and on to the next planetoid, Q/E turn, the wheel zooms.
   - **To add:** a tilted variant (about 50 degrees) to see heights; a ghost of the piece under the cursor (lit while free, red where blocked); and a sound on each snap (Unpacking's foley is half its feel).
6. **The hand.**
   - **The keys are spent:** 1 GRAB to 9 PLACE and 0 PAINT. R turns the choice, Q/E turn the view, the wheel zooms, Shift with the wheel sizes a stroke.
   - **Decor's home:** PLACE's second mode, plots or decor on R, with the catalogue window opened from it. While a piece is held, the wheel turns it instead of zooming.

## What our garden's code allows

- **Seating a piece:** `clay.radiusAt(dir)` and `clay.keep(dir, r)`.
- **Moving and saving:** the hand already lifts a placed feature and sets it down elsewhere (GRAB), and plots dump and load with the realm.
- **Undo:** ten clay snapshots.
- **Views:** the overhead view and the press's fixed view (the camera can ease to a pose and back).
- **Mood:** the garden's light changes by phase, and decor can follow it.

## What it blocks or limits

- **The plots are fixed and few:** 6 on the Dantian, 6 on the Herb Terraces, 3 on the Athanor, 5 on the Pavilions, and so on, laid on a golden spiral. Free decor needs the new layer above; the plots can stay for the features that work (beds, the press).
- **The latitude grid:** above.
- **Nothing collides with features:** the planetoid bodies (the Pneuka Jar, the spirits) stand on the clay, so the Jar walks through a placed piece. Big pieces need a keep-out circle on the sphere, and the spirits' wander has to read it.
- **Built late:** the realm is built on its first entry. Its heap is the garden's +9 MB (perf: 471 against 462 MB, dev). Decor adds to that build, not the boot.
- **The 17 programs** above.
- **The keys** above.

## The tick

- **The garden's tick is not up from the last round:** measured back to back, 4.0 to 4.1 ms at the round's start against 4.2 now.
- **What was up:** perf's own readings (6.2, 6.6) were the machine's variance under the software renderer.
- **Still under way (my free round, the stutter):** garbage each frame, about 1.1 MB in the workshop, down from 1.2. Cut so far: physics no longer syncs sleeping bodies; the Courier's IK keeps its objects. Poses compared bone by bone: identical within 4e-15 m.

## Sources

- Townscaper's grid, built and relaxed: [Sylves, Townscaper Grid](https://boristhebrave.com/docs/sylves/1/articles/tutorials/townscaper.html).
- A grid from any mesh's faces: [Sylves, MeshGrid](https://boristhebrave.com/docs/sylves/1/articles/grids/meshgrid.html).
- Grids on a sphere, latitude cells shrinking at the poles: [frozenfractal, "Everything is harder on a sphere"](https://frozenfractal.com/blog/2024/1/8/around-the-world-11-everything-is-harder-on-a-sphere/).
- Animal Crossing's furniture sizes, 1.0 x 0.5 to 3 x 3 tiles: [Nookipedia, Furniture](https://nookipedia.com/wiki/Furniture).
- Its half-step placement, from Happy Home Designer: [GamePro](https://www.gamepro.de/artikel/animal-crossing-moebel-platzieren-ganz-leicht,3354543.html).
- Rotation in build mode: [Twinfinite](https://twinfinite.net/guides/animal-crossing-new-horizons-rotate-furniture-items/). A guide from 2020; details may have changed.
- Unpacking's isometric grid made to feel intuitive: [Tim Dawson interview](https://limitedrungames.com/blogs/news/unpacking-unpacking-with-designer-tim-dawson).
- Unpacking's snap and its sound: [Game Developer, the audio of Unpacking](https://www.gamedeveloper.com/marketing/auditory-tales-from-the-making-of-zen-puzzler-unpacking).
- Snapping that stops at alignments instead of warping: [Microsoft Research, snap-and-go (CHI 2005)](https://microsoft.com/en-us/research/?p=154188).
- The Sims' free placement (Alt held off the grid; bb.moveobjects): [GGRecon](https://ggrecon.com/guides/sims4-how-to-move-objects). How it is built inside is not public.
- No reliable source found for Stardew's placement rules or Townscaper on a sphere; nothing above rests on them.

Delete this note when done.
