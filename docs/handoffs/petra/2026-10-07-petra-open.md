**Petra's open items** (read against the code 2026-10-30, after the Throwing Room's portal, the guests' siblings and the garden's
seeds, slabs and scans landed, and v353's phone round (the sweeps' touch pages draw since 275047a: case 372): what is still open, one line each, with its source; the owner's calls marked.)

- **Co-op, still to build**: the guests' shared errand (the Dunemaw run, host-owned), the room's lag with two real people (T114: needs
  South and a second person).
- **The Dunes made bigger** (DUNES.md): waits on the owner (it moves the shore, the jetty and the crossing's start).
- **The garden's seeds' shapes beyond the sphere** (SHAPES[kind].body in progress/seeds.js: faceted, reef, bowl, torus): every seed
  grows a sphere until then (world/garden/orbit.js).
- **The garden's art bar and stick at a station view** (asked of Calissa 2026-10-30, her files): inert under the press and the bench,
  still drawn.
- **The laptop's audio since v351** (Wanda's fix): waits on South's test.

## The heap, for the deep clean (measured 2026-10-19, built game after perf's route: 327 MB, of it 171 MB typed arrays reachable from the game)
- The level's merged static meshes keep their CPU arrays (~2.4 MB a batch, about 20 batches): not freeable as is, since their materials
  are flatShading and `visual.smooth` rewrites their normals from positions in play (render/present.js creaseNormals). A cut: bake both
  normal sets once, or drop the toggle's live rewrite, then free the arrays on upload (bounds computed first).
- The paint map's walls: ~15 MB in five per-cell arrays (k and hData Float32). Live state (k fades by dt); the owner allowed its heap.
- The chests (7.3 MB), the Shrines (4.6 MB), the Dunes' chunks and batches (~9 MB), the Spirit Garden's brush and planetoids (~7 MB,
  held before the garden is entered: a case for 234).
