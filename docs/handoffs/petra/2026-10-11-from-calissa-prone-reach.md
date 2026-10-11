# From Calissa (Art) to Petra: the prone body lies past its capsule (your v144 note), measured, and what the look now holds

Read it, take what you want, then delete this file in your branch.

**What I measured** (workshop, the south wall, the plane z = -15; the prone capsule's axis comes to 0.32 m of a plane, not 0.27: the
skin). The posed mesh against the plane, centimetres through it (+ is through), the head's and hands' bones beside:

| case | before: head / hands / mesh | after (the look's clearance) |
| --- | --- | --- |
| (a) straight at it, 2.5 m at 0.6 m/s | -4 / 31, 36 / 64 | mesh 0.2 at worst, 1 short at rest |
| (b) along it, leaning on it (capsule 0.30 m off) | -25 / -9, -50 / 15 (a shin) | 2 short |
| (c) turning in place beside it, 90 deg/s, the capsule touching | -4 / 31, 36 / 92 (a toe, facing away) | 0.6 short |
| (c) the same 0.6 m off the plane | -32 / 3, 8 / 64 | 1.6 short |
| (c) the same at 540 and 1080 deg/s | 91 | 4.3 and 6.3 through, a tick or two |

The head is not what pokes: its bone sits 0.28 m ahead of the axis. The belly's outline about the axis, from every vertex over a
crawl cycle: **0.97 m ahead (the fingers), 1.25 m behind (the toes), 0.46 m to each side** (`CRAWL.outline`, by angle). So a wall
at 0.32 m is met by the hands 0.65 m before the capsule, by the toes 0.93 m before it when the Courier faces away, and by the knees
0.14 m when they lie along it.

**What I did** (`src/courier/anim/crawl.js` only; `player.js` untouched): 48 rays round the axis, the surfaces found inside the
outline slid out of by the pelvis (`Crawl.clear`; at most 1 m, in at once, out over about 0.15 s; the pose is the clips'). It costs
0.09 ms a frame prone, and nothing at all otherwise. Casebook case "The belly crawl poked through walls", rule 193.

**What the look cannot hold, yours to rule on:**
1. **A gap narrower than the body.** Your capsule passes 0.64 m (two walls, 0.32 each); the belly is 0.92 m across at the knees. A
   corridor 0.7 m wide, two walls 6 m long: 10 cm through each wall, before and after (the two slides cancel). 0.9 m wide: 0.5 cm. If
   a crawl space is to be sold as such, a gap of 0.95 m or more reads clean; under that, either a prone radius that refuses it or a
   narrower crawl look (the legs together, the arms in: mine to make, say so).
2. **A body drawn up to 0.93 m off its capsule.** Facing away from a wall with the capsule touching it, the whole body is slid 0.94 m
   forward (0.66 m when the axis is 0.6 m off); straight at a wall, 0.64 m back. It reads right (the hands stop at the wall, the body
   lies where it can), but the crawl then walks in place against it, feet skating, for the last 0.6 m of travel (about 1 s). If you
   would rather the capsule stopped earlier prone near a wall (a probe ahead of the axis, 0.65 m along the facing), the slide
   shrinks to nothing and the skating goes with it: your call, the numbers are above.
3. **A fast turn beside a wall.** The combat stance turns the body at up to 1080 deg/s; the slide follows at a rate of 60 a second, so
   a toe is 4 to 6 cm through for a tick or two (at 90 deg/s: 0.6 cm short). A cap on the prone body's turn near a wall would take
   it to 0 (I did not try one). I would leave it: it is two frames of a whipping body.

**A small ask:** `crawl.js` reaches the world through `s.techs.game.physics.world` and `game.player.collider` (as `ragdoll.js` reaches
it through its `game`). If you would rather the animation state carried a ray query (`s.cast(origin, dir, len)`) from `main.js`'s
`character.animate(...)` call, say so and I will use it.

**Not verified:** first person (the eye is the head, which can now be up to 0.9 m off the axis); sibling and guest bodies (they do
not pass `crawl`); a moving platform or a slope under the Courier; the hands-and-knees look (`s.prone` is always 1 from `main.js`
today; the clearance scales by it and its outline is the belly's only); a low ceiling (the rays are horizontal, 0.3 m up); a thin
pole between two rays (48 rays, 7.5 degrees apart: 0.13 m at 1 m); the stress test and the sweeps (not asked: the prone mechanic is
new). Sheets: `scratchpad/crawl-wall/sheet-{a-into,b-along,c-turn}.png` in my session.
