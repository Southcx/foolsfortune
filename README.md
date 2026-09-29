# Fool's Fortune: Clay Workshop (mechanics prototype)

A one-room, greyboxed shooting sandbox for tuning feel: a hybrid first/third-person
character controller, a semi-auto hand-cannon with aim-down-sights, tracer rounds, and
terracotta pots that shatter into physics shards.

Built with **Three.js** (rendering), **Rapier** (physics, via WASM) and **Vite**.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static bundle in dist/
```

## Controls

| Input | Action |
| --- | --- |
| WASD / Shift | move / sprint (any direction but backwards) |
| Space / again in the air | jump / double jump (into a ledge: mantle) |
| Space by a wall, holding W | wallrun; Space again to wall jump |
| C | crouch; while running, slide (jump out of it to keep the speed) |
| Shift in the air | air-dash (costs Lachryma, one per airtime) |
| Hold Alt | walk |
| E | blink (movement tech, see below) |
| Mouse | look |
| Left click | fire (semi-auto, one shot per click, inputs are buffered) |
| Hold left click | charge the psygun (from cold, no round fired first); release for a piercing beam |
| F / middle click | fire the selected shell (seek: hold to paint targets, release to fire) |
| 1–7 / mouse wheel | pick a shell: slice, push, well, mark, bomb, bank, seek |
| Right click (hold) | aim down sights |
| X | holster / draw (firing, aiming or a shell draws it; third person puts it away after 5 s out of combat) |
| V | toggle first / third person |
| Q | swap shoulder (third person) |
| G | time trial (again to restart) |
| R / H (basement) | back to the last checkpoint / to the hub |
| T | reset the room |
| Tab | tuning panel (frees the mouse) |
| F3 | physics debug wireframe |

## Tuning

Every number that affects feel is in `src/config.js`, and the **Tab** panel edits them live.
Changes persist in your browser's local storage. Use **Copy settings JSON** to share a
tuned set, and paste it back into `DEFAULTS` to make it the new baseline.

Main groups: `movement` (speeds, accel, jump, coyote time), `camera` (FOVs, shoulder
offsets, ADS sensitivity), `weapon` (fire interval, spread and bloom, ADS time, gun scale),
`recoil` (view kick, how much of it stays, gun kick), `tracer`, `shatter` (break speed,
burst forces, shard size and lifetime), and `explosion` (ember urn radius and force).

## Lachryma (energy)

The psygun runs on **Lachryma**. Plain shots cost a little, and a charge reserves it as it
winds up (refunded if you let go too early). It trickles back slowly, and the rest comes from
**baubles**, gummy cream-coloured drops that pop out of clapperjars, lanterns and marked
pots. They bounce, settle and wobble, then fly to you when you get close. Clapperjars will
eat baubles you leave lying around, and grow fatter (and juicier) for it.

`src/lachryma.js` has the pool as a standalone class meant to be shared by future mechanics:
costs looked up by tag, stacking modifiers (cost multipliers per tag, regen, max bonus),
reservations for wind-ups, all-or-nothing `spend()` and partial `drain()`, and events
(`change`, `spend`, `gain`, `empty`, `full`, `overflow`, `denied`).

## Shells

Special rounds loaded one at a time (the support hand racks each one). Refill at the glowing
**reliquaries** (one per floor).

| Shell | Effect |
| --- | --- |
| Slice | a blade plane along the shot cuts pots, shards, crates and earlier slices cleanly in two; pierces a whole row |
| Push | a cone of force: shelves get swept, clapperjars go flying |
| Well | a lobbed singularity that drags everything into orbit for 3 s, then pops; debris that reaches the core is crushed, and every few pieces condense into a Lachryma bauble |
| Mark | stuns clapperjars (dizzy stars) and marks pots in a radius; marked things glow through walls, take double damage and drop Lachryma |
| Bomb | a lobbed clay grenade: splash damage, a spray of molten slip that splats and cools, and a hot pool that cooks pots and scalds clapperjars |
| Bank | a ricochet round: banks off walls and floors up to 5 times, hits harder each bounce and bends toward a target after each one. ADS previews the first bounce |
| Seek | hold to paint up to 6 targets (the lock-on squares spin in and snap together), release to loose a fan of seekers |

## Moving around

Titanfall-flavoured. Sprint works in any direction but backwards. Crouch while running (above
5 m/s, or straight out of a sprint) to slide: the first slide in a while gets a speed boost,
slopes keep you going, and jumping out keeps the momentum (land with C held to chain another).
Jump beside a wall while holding W to wallrun (the camera tilts away from the wall; gravity
eases back in over a second or so), and jump again to kick off it. One air jump, refilled on
the ground and on walls. Push into a ledge while jumping or falling to mantle onto it. Shift in
the air dashes. Air steering never bleeds speed above a run, and landing fast bleeds it over a
moment instead of snapping to run speed, so a quick hop keeps it. Top speed is capped at 14 m/s.
The speedometer (bottom left) shows speed, a short peak hold, and the current move.

Crouching and sliding shorten the capsule to 1.35 m (you only stand up with headroom), and the
first-person eye follows the posed head. In first person only the hands and gun are drawn.

**The walking hitch** was Rapier's character controller occasionally returning zero motion
for a step while the capsule rested in its contact margin, which then zeroed the velocity.
Grounded steps no longer push into the floor, a stalled move is retried, and walls only take
away the velocity pointing into them. Stairs collide as smooth ramps.

## The basement (movement lab)

Drop through the glowing hole in the ground floor's south-east corner; the geyser beside the
landing fires you back up. Hub and spoke, about 5,000 m² (the old basement was ~600):

**The hub** (40 × 40 m) is the metrics gym: fixed, labelled references everything else is
measured against, so future spaces share one rubric.

- a height ladder (0.25 to 4 m, toned by what it takes: step, mantle, jump + mantle,
  double jump + mantle)
- clearance gates (1.2 to 2.2 m; the courier is 1.7 m standing, 1.9 with the hair, 1.35 m crouched)
- slope ramps (10° to 55°; 46° is the steepest you can walk up)
- a long-jump lane with 1 m ticks and the measured chain distances marked
- a metrics board: live values from the tuning panel next to the measured chains
- the index: eight pads that teleport to each room's checkpoint

**The ring** (16 m wide) is a loop of eight rooms, one skill each, with a checkpoint across every
entrance and split times (and a lap time) between them:

| Room | Skill | What's in it |
| --- | --- | --- |
| 1 S | run / slide / hop | 1.5 m slots to slide under, 0.6 and 0.7 m hurdles, two speed gates |
| 2 SE | mantle | 1.4, 2.4 and 3.0 m blocks up to the platforms |
| 3 E | gaps | 3.5 m (sprint jump), 5.5 m (double jump), 7.5 m (jump, then dash) |
| 4 NE | wallrun + wall jump | run the wall, jump across before the pillar, run the panel |
| 5 N | zigzag | wallrun and wall jump between four staggered panels |
| 6 NW | climb | 2.8 m (jump + mantle), 3.4 m (double jump + mantle) |
| 7 W | speed | slide a 17° ramp to top speed, jump a 7 m gap at the bottom |
| 8 SW | low | slide chute into a 1.5 m tunnel, back to room 1 |

Rooms 3 to 7 are over a reset floor: touch it and you're back at the room's checkpoint.
**R** returns to the last checkpoint, **H** to the hub. Teleports refill Lachryma.

**The rubric.** Distances were measured by simulating the controller at default tuning
(takeoff to landing at the same height): walk jump 2.45 m, sprint jump 4.0, slide-hop 5.3,
sprint + double jump 6.7, max-speed jump 7.9, slide-hop + double 8.5, sprint jump + dash 9.1,
sprint + dash + double 12.9, slide-hop + dash + double 13.7, max speed + dash + double 15.2.
Jump height 0.92 m, double jump 1.66 m. (Re-measured in round 10: the first run's test
teleport left the body 0.85 m up, which read about 2% long. The controller didn't change.) A wallrun over a drop covers about 16.8 m in 1.8 s and
ends 2.75 m below where it started; a wall jump carries 3 m out and about 9.5 m along. Gaps
are sized at about 85% of the measured distance.

Underground, the sun is switched off (it would light the lab outside its shadow frustum) and
the fog thins.

## Movement techs

Optional techniques over the core movement (`src/moves/`). The core (walk, sprint, crouch,
slide, jumps, wallrun, wall jump, mantle, air dash, tuned under `movement`) is the gold
standard the basement is measured against, and techs never change it: each lives in its own
module with its own `tech.<id>` tuning and an `enabled` switch, and acts only through a few
hooks (an active tech owns the fixed step; landing events; its own pose layer and camera).
Switching one off gives back the core exactly; the measured metrics above are identical with
every tech on or off. Techs start in priority order and only one is active at a time.

| Tech | Input | What it does |
| --- | --- | --- |
| Blink | E | a near-instant 5.5 m dodge along the move keys (or the view), sliding along anything in the way; leaves an afterimage, comes out with your momentum pointed where you blinked; 2 charges |
| Slam | C in the air, looking down, 1.8 m+ up | straight down; the landing breaks pots nearby and throws the rest (and clapperjars). Then Space: slam jump, higher the further you fell (about 2 m from 5 m); hold C with a direction: slam slide, the fall turned into speed. (Looking ahead, C in the air stays the core's landing slide) |
| Stomp | land on a pot or a clapperjar | it breaks under you and throws you up (+1.66 m), air jump refilled |
| Roll | hold C into a hard landing (from about 4 m) | roll out of it with the fall turned into forward speed (above slide speed the core slides instead) |
| Wall climb | jump into a wall head-on, W held | run up it for half a second; a ledge in reach is a mantle (4 m walls from the ground); Space kicks off. Off the ground only: after a wallrun the core's wall moves own the air |
| Slip dive | hold C on slip | melt into liquid clay: a fast blob (10 m/s) through slip, crawling off it; climbs slip-coated walls, fits through 0.8 m gaps, Space launches out (higher than a jump, keeping the speed), let go of C to stand. Lachryma soaks back in meanwhile. The SLIP shell (8) paints floors and walls wet; burst slip barrels leave puddles |
| Swim | deep water | float with your head out and paddle (Shift faster); C dives and you swim where you look; Space rises, and at the surface hops out; swim into an edge to climb out |
| Ladder | walk (or jump) into one | W / S climb (Shift faster), C slides down, Space kicks off, climbing past the top steps off; every hand and foot holds a rung (IK) and moves up two when the body has passed it |

**The tech lab** is through room 1's south door (or the LAB pad in the hub's index): a
station per tech, each with a checkpoint (T1-T6, R returns to it) and an index of pads by
the door. The pool (4.5 m deep, a 5 m dive tower, a wall to swim under, a ladder out), 6 and
8 m ladder towers (the 8 m one is the slam / roll platform over a field of pots), the slip
lane (a 0.8 m gap only the blob fits, a slip-coated 6 m wall), a 9 m blink gap over a reset
pit, stomp stairs (pots on rising pillars, a bounce apart) and a 4 m wall to climb.

## What's in the room

- **Ground floor**: shelves, workbenches, pottery wheels, slip barrels, a drying rack, a
  balcony with stairs (storage bay underneath), a ramp platform, and the kiln flanked by
  jōmon flame-rim pots.
- **Second floor** (up the balcony stairs, or ride the **Lachryma geyser**, the glowing ring
  under the atrium): a sculpture gallery (a giant goggle-eyed dogū, haniwa figures, busts,
  endless columns), a porcelain showroom, teetering bowl towers, an upper kiln, and a mobile
  of lanterns hanging through the atrium.
- ~290 procedurally lathed pots and sculptures in three clay bodies that break differently:
  **stoneware** (big slabs), **earthenware** (mid shards), **porcelain** (slivers and
  glittering dust).
- **Ember urns** explode and chain-react. **Slip barrels** burst into a mess of liquid clay.
- **Lanterns** on 8-segment ropes: shoot the rope to drop them, shoot the lantern and the
  rope whips.
- **Clapperjars** on both floors. They wander, taunt you (lid clapping, waving), nap when
  you're far away, eat baubles, stumble and bolt from near misses, hide behind big pots and
  peek out, and shatter from shots, slices, blasts, scalding and long falls.

## How it works

| File | Role |
| --- | --- |
| `src/main.js` | bootstrap, fixed-step loop (60 Hz physics, interpolated camera) |
| `src/player.js` | Rapier kinematic character controller (slide, wallrun, mantle, dash), FP/TP camera, recoil punch |
| `src/weapon.js` | firing, spread/bloom, hitscan, reload, holster timing, first-person gun pose |
| `src/character.js` | the Courier: clip blending by movement state, pistol aim offset, gun socket, IK corrections |
| `src/animator.js`, `src/anims.js` | pose buffers, clip sampling/blending, the baked clip pack decoder |
| `src/pottery.js` | pot profiles, shape modifiers (lobes, twist, flame rims), surface patterns, clay materials, fracture |
| `src/breakables.js` | spawning, shattering into physics shards, ropes, impact breaks, explosions |
| `src/clappers.js` | clapperjar AI (wander, forage, taunt, nap, hide, flee) + procedural layers over the authored clips |
| `src/lachryma.js` | the Lachryma energy pool + collectable baubles |
| `src/shells.js` | shell inventory and the first five shell effects, projectiles, molten/slip fluid |
| `src/specials.js` | ricochet and homing shells, lock-on reticles |
| `src/cracks.js` | crack paths on pot surfaces, kintsugi gold seams |
| `src/trial.js` | the time trial |
| `src/basement.js` | the basement movement course |
| `src/techlab.js` | the tech lab annex |
| `src/moves/` | movement techs (`techs.js` the framework, one module per tech, `env.js` water, ladders, slip coverage) |
| `src/slicing.js` | plane cutting for triangle meshes (with wall caps) and convex point sets |
| `src/fx.js` | tracers, muzzle flash, particles, chips, bullet-hole decals |
| `src/audio.js` | all SFX synthesized with WebAudio (no audio files) |
| `src/level.js` | greybox workshop and prop placement |
| `src/outline.js` | inverted-hull outlines (matches the .blend's Solidify outline look) |

**Fracture.** Each pot is a lathe (profile × radial segments) with optional lobes, twist and
flame crests. On break, the surface is resampled on a jittered grid whose cell size comes from
the clay body and the pot's size, each cell is cut along a random diagonal, and neighbouring
triangles are grouped into shards. Each shard is the convex hull of its outer points plus
the matching inner-wall points, so it gets both a render mesh and an exact Rapier collider.
Shards near the bullet's impact are smaller and get more push.

**Animation.** The Courier is driven by authored clips with IK corrections on top. The
clips are from Quaternius' [Universal Animation Library](https://quaternius.com/packs/universalanimationlibrary.html)
1 and 2 (the free Standard tiers, CC0), retargeted offline onto the Courier rig by
`tools/bake_anims.mjs` into `src/assets/anims.bin` (about 220 KB). Both rigs rest in a
T-pose, so each bone's world rotation away from the T-pose carries straight over.

- **Locomotion:** idle, walk, jog and sprint play on one shared phase and blend by speed.
  Each loop is measured at load: an in-place clip's planted foot slides back under the hips at
  the speed the character is meant to travel, so that's its ground speed (walk 0.75 m/s, jog
  4.7, sprint 4.7: the jog is authored almost exactly at the 4.2 m/s run), and each loop
  plays at ground speed / its own, split between cadence and longer strides, so the feet
  don't skate. The walk
  covers up to a brisk 2.4 m/s (Alt to walk, aiming while moving) by lengthening its steps
  before its cadence, then hands over to the jog; the hips drop for long strides so the legs
  can reach. Foot locking pins a planted foot where it landed until the cycle lifts it (or
  the body gets 35 cm away), which catches what's left: speeding up, turning, blending.
  Aiming while strafing or backpedalling turns the hips toward the move and the chest back to
  the aim (orientation warping); backpedalling runs the loops in reverse.
- **Moves:** jump take-off into the airborne loop, a tuck flip on the double jump, the
  landing squat (lighter at a run), slide drop-in and hold, the climb clip timed to the
  mantle, a stretched-out take-off frame pitched forward for the air dash, and a sprint with a
  roll off the wall for wallruns.
- **Gun:** the psygun sits in a socket on the right hand (fitted to the palm from the pistol
  aim pose), so the gun follows the hand rather than the hands chasing the gun. When the gun
  is up, a pistol aim offset (aim down / level / up) is layered over the upper body and the
  chest turns the last few degrees so the barrel lines up with the crosshair. The support
  hand is IK'd onto the gun. Relaxed, the gun just rides in the hand through the run cycle.
- **IK corrections:** feet onto slopes and stairs (the hips drop for the lower foot), the
  wall-side hand flat on the wall while wallrunning, both hands on the ledge at the start of
  a mantle, the support hand on the gun. Each chain bends toward its *animated* elbow or knee,
  so the correction stays on the animated side and can't flip.
- **Holster:** the gun lies across the small of the back like a fanny pack, barrel to the
  left, grip out on the right (on show from behind). The draw (0.26 s) reaches back, the
  shoulders turning to help, grabs the grip, and whips the gun round the right hip up into
  the hand; holstering reverses it. Clicking while holstered draws and fires as soon as the
  gun is out. Ladders and swimming stow it (both hands are busy) and bring it back after.
- **Hand swap:** on a right-side wallrun the gun passes to the left hand (a quick hand-off,
  both hands on it mid-way) so the right can take the wall; aiming then uses the mirrored
  pistol pose, and in first person the gun moves to the left of the screen. Poses mirror
  left/right in character space, corrected per bone so the rest pose maps to itself (the
  rig's left and right bones don't share axis conventions).
- **Slopes:** a slide lies along the ground under it (pitched down a hill, rolled across one).
- **First person:** only the hands and the gun are drawn. The arms are view-model arms: the
  shoulders hang off the camera, and the hands are pinned to the gun.

To rebake after changing the clip list or the rig, get the Standard `.glb` files of both
libraries and run `node tools/bake_anims.mjs ual1.glb ual2.glb`. `npm run dev` then
`/dev/animlab.html` is a clip viewer for picking frames.

Crouching uses a 1.35 m capsule, which is where the crouched body (hair included) tops out;
crawlspaces are 1.5 m.

**Impulses on ropes**: Rapier recomputes a multibody link's velocity from its joint
coordinates, so a raw impulse on a rope link or a hung pot is lost. `physics.kick()` turns
impulses on links into a one-step force instead.

**Ropes** are chains of sensor links on Rapier multibody (reduced-coordinate) joints, so they
stay stiff under heavy pots. The links are sensors because contacts on multibody links
produce NaNs; cutting a rope needs Rapier 0.21+ (0.14 panics on joint removal).

## Character assets

Animation clips: Quaternius, Universal Animation Library 1 & 2 (Standard), CC0 1.0 -
https://quaternius.com. Retargeted to the Courier; see **Animation** above.

`tools/export_courier.py` converts the source `.blend` (kept in `source_assets/`) into
`src/assets/courier.glb` and `src/assets/psygun.glb`, which are bundled into the JS build.
It strips the Solidify outline shells (outlines are rebuilt in-engine) and exports the rig
in rest pose.

```bash
pip install bpy==4.5.*   # Blender as a Python module (Python 3.11)
python3 tools/export_courier.py path/to/courier_base_rigged.blend
```

`tools/export_clapperjar.py` does the same for `source_assets/clapperjar.blend`, exporting
its idle, sprint and stumble actions as clips.

The .blend's armour and mask textures point to files outside the .blend, so the
prototype uses flat terracotta materials.
