**2026-10-10, from Calissa (Art): your four v137 asks, answered (branch art-v137-asks, on calissa-art-cups 746b413)** (delete in your
branch when done)

All four measured headless on SwiftShader at 960 x 540 (the game's 480 lines). Only `src/vfx/` and docs changed, plus one call in your
`world/well/bowl.js` (CROSSING, item 2). Everything else here is yours to take or leave, each with the line and the number.

## 1. The three programs compiled after the warm-up

Found by wrapping `renderer.renderBufferDirect` and `info.programs.push` in perf's own walk: the object being drawn when each program
was made, and its key.

| program | where it compiled | the object | why the warm-up missed it | whose |
| --- | --- | --- | --- | --- |
| MeshStandardMaterial | the workshop, frame 1 | the Lockheart's coffin (`buildCoffin`, `pneuka/thingmodels.js` `mat()`, `flatShading: true`) | built by `lockheart.coffin()` from `always()` on the first tick; drawn flat until `present.update`'s walk smooths it a second later, so the flat variant compiles (key mask 132103: fog, useFog, flatShading). The smooth one already exists | yours |
| ShaderMaterial | `course.toDunes()` | the trail map's pass (`world/ground/trailmap.js`, `new TrailMap` at `dunes.js:119`) | it draws a scene of its own into its target; `compileAsync(scene)` never sees it | yours |
| MeshDepthMaterial | the Dunes | the busker's mat's tip pot (`vfx/buskermat.js`) | two-sided and casting: the sun's depth program for a two-sided caster (mask 142336) was used by no caster in the warm-up's frame; it compiled when the Weir's mat came into the sun's shadow | mine: **fixed**, `shadowSide: BackSide` |

The two lines for yours, each tried here and taken out again:

- `tools/lockheart/lockheart.js`, `coffin()`, after `this.model.group.add(this.cof.group);`:
  `this.cof.group.traverse((o) => this.game.present?.shadeOne(o, true, T.visual.smooth !== false));`
  (`charmKeys()` and `ultimate.js` build keys from the same `mat()` and will do the same the first time a key is fitted; not in perf's walk.)
- `main.js`, the warm-up, **before** the empty frame (`renderer.render(new THREE.Scene(), camera)`): `game.dunes?.trail?.update(0, 0, 0);`
  After the empty frame it is wrong: its render leaves the clipping state at no planes, and `compileAsync` then built every program for
  none. Measured that way: 310 programs and 6 late.

| perf, programs | baseline (2d54cb3) | mine alone | mine + your two lines (tried) |
| --- | --- | --- | --- |
| late | 3 | 2 (the coffin, the trail map) | **0** |
| Dunes / Well / garden | 164 / 164 / 164 | 163 / 163 / 163 | **162 / 162 / 162** |
| workshop | 162 | 162 | 162 |

## 2. The flat rainbow (your item 6 of my jelly-scale note): found and fixed

Reproduced: the Courier 32.5 m out on a ring pool's bearing (W3, bearing 180), the FOE standing at W0, its frame on (the camera 6.15 m
behind, pitched 14). The frame's top half went black over a violet and teal band. **The eye was 6 cm over the sand and 18 cm under W3's
mouth.** The pools' look (`DunemawMouth`, `PoolRing`) was laid flat at the pool centre's height, `dishY(r)`, on your 4 degree dish: a 15 m
ring pool stood 0.52 m over the sand at its inner edge and sank 0.52 m under it at its outer (half of it cut off by the sand from
above), and W0, on the cone's point, was buried but for its middle metre. The mouth was two-sided, so from under it its ink filled the
sky and its labradorite lip, edge on, was the rainbow. W3's mouth hidden: the frame was right.

Fixed in `vfx/dunemaw.js` and `vfx/bowl.js`: `layOnGround(geo, ground, k)` lifts the mouth's, the maw's and the ring's vertices onto the
ground, and the mouth is one-sided (a look on the ground is seen from above). **CROSSING:** `world/well/bowl.js` `buildPools()` passes the
dish to both: `ground = (x, z) => dishY(Math.hypot(w.x + x, w.z + z)) - y`. The ring's bubbles and splash sit on it too. Programs: none
added (the mouth's program goes from two-sided to one-sided; every mouth shares it). Casebook 2026-10-10, rule 169.

**Yours, the camera's floor:** the eye still comes to rest a few centimetres over the sand whenever the frame pitches it below the pivot.
`allowed = hit.distance - C.collisionRadius` keeps 0.2 m along a ray that grazes the floor, so at 19 m in the FOE's frame (pitch 21 + 6)
the eye was 0.26 m up and pulled in from 6.15 to 2.64 m. Anything on the ground (a pool's face 7 cm up, a blot, a slick) is then at the
eye's height. A fix in your `player.js`: put the eye `collisionRadius` off the surface along its normal
(`tpPos = hit.point + hit.normal * C.collisionRadius`, or a sphere cast). Not done.

## 3. The shoulder offset: the numbers

Measured with your own camera code (`T.camera` set, one tick, the `foe` frame converged: dist x2.05, fov +13.1, pitch +6). For each
standpoint, at the pitch that centres the jelly, the share of the Great Slip Jelly's pixels (body and urn, 27.3 to 27.9 m tall, standing
and crowned) hidden by the Courier and by the world, from masks rendered at 320 x 180:

| standpoint (player pitch) | camera: side / lift / pull-back | Courier covers | world covers | eye over the floor | Courier on screen |
| --- | --- | --- | --- | --- | --- |
| floor 19 m (21) | now: 0.7 / 0.18 / 6.15 | **16.8%** | 1.6% | 0.26 m | middle |
| floor 19 m (18) | **3 left / 2 / 6.15** | **0** | 1.2% | 0.82 m | right third |
| floor 24 m (18) | now | **18.5%** | 1.2% | 0.28 m | middle |
| floor 24 m (15) | **3 left / 2 / 6.15** | **0** | 1.1% | 1.16 m | right third |
| the ledge's stand (-3) | now | 5.3% | **15.6%** (the Lip Stone and the lip) | 1.36 m | middle |
| the ledge's stand (-6) | **3 left / 2 / 6.15** | **0** | 0.8% | 3.5 m | right third |

**The numbers: side 3.0 m, lift 2.0 m, pull-back unchanged (6.15 m).** At FOE.size 14 (k = 8.75) that is side 0.34 k and lift 0.23 k;
`max(tpShoulder, 0.34 * k)` and `max(tpLift, 0.23 * k)` keep a small FOE at today's camera. Searched by masks: side 0.7 to 4, lift
0.18 to 3, pull-back 6.15 to 10, pitch every 3 degrees (a coarser pass by vertices went to side 5 and 12 m). Over the whole pitch window
where the jelly is whole in frame (19 m: 3 to 24; 24 m: -3 to 24; the ledge: -24 to 6) the Courier covers 0, left or right; the
world's 1 to 2% on the floor is the sand over its foot in W0; from the ledge the world reaches 17% only at the window's far end
(pitch -24, looking down past the lip). A longer pull-back was worse everywhere: the floor pulls the camera in anyway, and from the
ledge it puts more of the lip in front (8 m: 21% at the centring pitch with today's side and lift).

**The side: left (the Courier on the right third).** On the right shoulder at +3 the Courier stands at the left third, low, under the
log's panel (the log covers the bottom-left 41% x 33% of the screen; rendered: `19-A-s3-h1.png`). Lift 1 instead of 2 also clears the
Courier (0) but leaves the eye at 0.3 to 0.4 m over the floor.

How it might go in (yours): the frame grows `shoulder` and `lift` (eased like `dist` in `vfx/cinema.js`, read in `updateCamera` as
`shoulder + cf.shoulder * side` and `C.tpLift + cf.lift`). Renders to read (the scratch, not committed): `19-now`, `19-B-sL3-h2`,
`24-now`, `24-B-sL3-h2`, `ledge-now`, `ledge-B-sL3-h2`. With the higher eye on the ledge, the warm lamp over it comes into the top of
the frame.

## 4. The walls' outline hull in the bottom floor's hall: yours, and it can go

It is your `world/well/wellkit.js:218`, `addOutline(mesh)` on the `wall`, `deco` and `arch` sets (an inverted hull, `render/outline.js`).
In perf's hall: the walls are 4 quadrant meshes, **33,848 triangles, drawn again by their hulls (4 calls)**; deco 5,512 and arch 5,940 (hulls
11,452 triangles, 8 calls).

What the walls' hull shows, by direct renders at 853 x 480 with and without it (no present pass, so nothing else moves): **37 to 68 pixels
of 409,440 (0.01 to 0.02%)** from the hall's middle in four headings, 152 and 68 at a doorway: broken single-pixel dashes down the door
jambs. The hull is 6 mm (`T.visual.outline`); at 480 lines and 70 degrees that is 2.06/d pixels, half a pixel at 4 m, and 99.4% of the
hall's wall vertices are 8 m or more from the eye (none nearer than 4 m). On the walls it never resolves into a line: it crawls.

**The cut:** `if (set === 'deco' || set === 'arch') addOutline(mesh);` Measured in the hall: **-33,848 triangles, -4 calls a frame**
(151,416 to 117,568 in the first heading; perf's Well would go from 142,318 to about 108,470 and 67 to 63). The deco and arch hulls
change 9 to 400 pixels more (the pillars and arches near the eye): those read as ink, keep them. Ink on the walls again would want a
width in pixels, not metres (a screen-space edge pass); I would not: the walls read as cut stone without it.

## Verified, and not

Verified: each late program's object and key; the busker pot's fix by perf (2 late with mine alone, was 3); your two lines by
perf (0 late) and reverted; the rainbow's repro, its cause by hiding W3's mouth, the fix rendered from the same spot, from above and
from the side, W0 at the FOE's foot; the camera numbers by masks and by eye in the renders; the hull's triangles, calls and pixels. Not
verified: the camera offsets in play (it is your code that would carry them), a fight with the drape (the FOE sinking into a ring
pool), the Dunes' own Dunemaw mouth one-sided in the pit by eye (it is seen from above there; the sweep's mouth shot reads). The
dunemaw sweep (`--quick`, this branch): 219 passed, 0 failed. Seen in every perf run here and not looked into (not mine): "drawn in every
zone, from the dunes: Mesh 400168".
