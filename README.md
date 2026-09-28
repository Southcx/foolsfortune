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
(takeoff to landing at the same height): walk jump 2.5 m, sprint jump 4.1, slide-hop 5.5,
sprint + double jump 6.7, max-speed jump 7.9, slide-hop + double 8.5, sprint jump + dash 8.9,
sprint + dash + double 12.9, slide-hop + dash + double 13.7, max speed + dash + double 15.2.
Jump height 0.94 m, double jump 1.68 m. A wallrun over a drop covers about 16.8 m in 1.8 s and
ends 2.75 m below where it started; a wall jump carries 3 m out and about 9.5 m along. Gaps
are sized at about 85% of the measured distance.

Underground, the sun is switched off (it would light the lab outside its shadow frustum) and
the fog thins.

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
| `src/weapon.js` | firing, spread/bloom, hitscan, reload, gun placement (FP camera-space / TP aim-space) |
| `src/character.js` | procedural animation: FK gait, spine aim, two-bone arm IK onto the gun |
| `src/pottery.js` | pot profiles, shape modifiers (lobes, twist, flame rims), surface patterns, clay materials, fracture |
| `src/breakables.js` | spawning, shattering into physics shards, ropes, impact breaks, explosions |
| `src/clappers.js` | clapperjar AI (wander, forage, taunt, nap, hide, flee) + procedural layers over the authored clips |
| `src/lachryma.js` | the Lachryma energy pool + collectable baubles |
| `src/shells.js` | shell inventory and the first five shell effects, projectiles, molten/slip fluid |
| `src/specials.js` | ricochet and homing shells, lock-on reticles |
| `src/cracks.js` | crack paths on pot surfaces, kintsugi gold seams |
| `src/trial.js` | the time trial |
| `src/basement.js` | the basement movement course |
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

**Animation.** The rig has no clips, so everything is procedural and posed from targets
rather than joint angles, every frame:

- **Legs:** the hips get a height and lean for each movement mode (deep crouch, low slide,
  sprint lean, dash, wallrun roll), each foot gets a target, and two-bone IK bends the knees
  to fit. On the ground, the feet follow a gait path (planted, then an arc through the swing)
  whose stride matches the speed, so they don't skate. The feet are raycast onto slopes and
  stairs, and the hips drop for the lower one. In the air it's a tuck rising, reaching
  falling, and a bigger tuck on the double jump; mantling tucks the knees; sliding puts the
  lead leg out and folds the trailing one under.
- **Arms:** each hand has a target and an elbow pole. Hands swing opposite the legs when
  walking, pump when sprinting, and go out for balance in the air. The wall-side hand plants
  on the wall while wallrunning (raycast from the shoulder), both hands plant on the ledge
  when mantling, the left hand drags on the floor in a slide, and hands blend onto the gun
  grips by weight.
- **Holster:** the gun rides on the right hip. Drawing is two beats: the hand reaches the hip,
  then the gun comes up and the support hand joins. Holstering reverses it. Clicking while
  holstered draws and fires as soon as the gun is out.
- **First person:** only the hands and the gun are drawn.

Crouching uses a 1.35 m capsule, which is where the crouched body (hair included) tops out;
crawlspaces are 1.5 m.

**Impulses on ropes**: Rapier recomputes a multibody link's velocity from its joint
coordinates, so a raw impulse on a rope link or a hung pot is lost. `physics.kick()` turns
impulses on links into a one-step force instead.

**Ropes** are chains of sensor links on Rapier multibody (reduced-coordinate) joints, so they
stay stiff under heavy pots. The links are sensors because contacts on multibody links
produce NaNs; cutting a rope needs Rapier 0.21+ (0.14 panics on joint removal).

## Character assets

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
