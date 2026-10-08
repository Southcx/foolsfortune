**2026-10-08, from Calissa (Art): the glints at 300 to 800, the shoal's silhouette, the ambient geometry (branch art-rail-swarm)**

Looks your rail's runtime will call. Nothing here moves a glint or decides a hit; every interface is below, exactly.

**Two crossings into your files, for review**
- `src/main.js` (2 lines, a bug): the warm-up moved the parked sea looks to (0, -50, 0) and never put them back, so the shoal's glints,
  its boil, the Conductor and both wake lines were drawn 50 m under the crude in every crossing (casebook, 2026-10-08, rule 72). The
  warm-up now keeps each parked look's position and restores it as it hides it.
- `src/world/emocean/shoal.js` (2 call-site lines in `draw()`): `L.set(..., this.roll[i], this.mood[i] === 2 ? 1 : 0)` (a strike's dash:
  its streak) and `L.ball(shipWorld, this.radius + 1, scattered ? 0 : 1)` (the ring read as one turning mass). The count is unchanged
  (SHOAL.count, Dovina's; MAX 160 and `ShoalLook({ max: 192 })`, yours).

**The glints** (`src/vfx/shoal.js`, one instanced draw, 68 triangles a glint: 60 body, 6 fins, 2 spark)
```
const S = new ShoalLook({ max: 800 }); scene.add(S.group); S._s.setScalar(2)   // (2: twice life, the rail's)
each frame, for the live glints packed 0..n-1:  S.set(i, worldPos, worldQuat /* +Z its heading */, roll 0..1, dash 0..1)
S.count = n;  S.ball(centreWorld, radius, k 0..1);  S.glow(k 0..1);  S.update(rawDt)   // (after the sets)
also: S.conductor(pos, quat, alive)  S.boil(pos, radius, k, sea)  S.light({ dir, hi, lo })  S.lod(near, far)
```
roll: the silver turn (the telegraph, onto its side); dash: the strike (stretched, and a streak behind); ball: the bait ball's centre and
radius (inside, darker; a band of rolling sweeps round it); glow: the school lit from within (the silhouette). The fish becomes a
two-triangle spark between 52 and 92 m at scale 2 (each glint at its own distance), never under 2.5 px.

**The silhouette** (`src/vfx/shoalsilhouette.js`)
```
const T = silhouetteTargets(n, 'leviathan' | 'ball' | 'ring', { length: 56, radius, depth })
  T.points: Float32Array(n * 3) in the shape's frame (+Z the head, Y up, X its thickness: the profile faces +X / -X), metres
  T.kind: Uint8Array (0 fill, 1 outline, 2 eye rim); T.eye: Vector3 (shape frame) | null; T.eyeRadius
  glint i makes for point i (stable: the outline first, the eye's rim, then the fill)
silhouetteSwim(T, t, out)   the points with the body's wave at real time t (the head steady, the tail beating)
silhouetteEyeAt(T, t, out)  where the eye is then
facing(centreWorld, camPos, outQuat)   the turn that shows the profile to the camera; world = compose(centre, quat, 1) * point
const E = new SilhouetteEye({ radius: 3 }); scene.add(E.group); E.group.position.copy(eyeWorld)
E.set({ open 0..1, locked 0..1, crack 0..1 }); E.shatter(); E.update(rawDt); E.reset(); E.broken
```
The stand-in steering in my stage (each glint seeks its point with arrival, plus a small circle so it never hovers, heading blended
toward the shape's head while forming) reads well; your boids can do the same with a strong seek weight.

**The ambient geometry** (`src/vfx/railgeometry.js`)
```
const G = new RailGeometry({ env: game.sky.env, seaY: SEA_AT.y, warp }); scene.add(G.group)
G.update(rawDt, { t, camera })                      // all handles and the folded sea, once a frame
const r = G.ring(pos, quat, radius)                 // axis: the quat's +Z.  r.pass()  r.crossed(a, b) -> bool (lights it)  r.set({ lit })  r.pos, r.quat (move it)  r.dispose()
const l = G.lattice(pos, quat, size, { cells, fold }) // the sheet in the quat's XY.  l.set({ fold 0..1 })  l.mesh (move it)  l.dispose()
const m = G.monolith(pos, { height, width, depth, yaw, rise })  // pos.y: the crude's level there.  m.set({ rise 0..1 })  m.pos  m.dispose()
const c = G.ceiling(on, { height: 48, ahead: 240, forward })    // the folded sea (one).  c.k (0..1 how far folded)  c.dispose()
```
Each handle's `update(dt)` is called by `G.update`. Rings and monoliths are one instanced draw each (64 and 48 at most); a lattice is one
draw; the folded sea one draw (22.5k triangles, crude-sea-3's program).

**The storm's hook:** `warpWith(warpMaterial)` (or `{ warp }`, or `G.warp(fn)`) applies the storm builder's `warpMaterial` to every
material of the family, made before or after. Their vertex shaders end in three's `#include <project_vertex>` with `transformed`, so a
warp written for three's own materials applies unchanged; the folded sea is a MeshStandardMaterial like the sea's.

**Measured** (headless, SwiftShader, the crossing at the shoal's bar 72, chase view): 600 glints and the eye add 3 draw calls
(glints, lens, its ring), 42,136 triangles and 1 program (`mind-geometry`, shared by the eye, the rings, the lattices and the
monoliths: the geometry adds no other; the folded sea adds none). The geometry as placed (4 rings, 2 lattices, 4 monoliths): 4 calls,
3.9k triangles; the folded sea 1 call, 45k triangles at 150 by 150 cells. CPU: 600 `set`s and the `update` 0.48 ms a frame. Frame
time on SwiftShader (medians of 7, readPixels-synced, a loaded machine): 462 ms bare, 579 with the 600, 572 with the geometry: not a
GPU's number; `npm run perf` does not visit the rail. **The current `Flock` (creatures/ai/flock.js) costs 4.9 ms a step at 300 and 16.2
at 600, 34 at 800** (node, a dense ball): its string-keyed hash is the cost; the typed-array grid of RAIL-OVERHAUL.md section 5 is the fix.
