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
| WASD / Shift | move / sprint |
| Space | jump |
| Mouse | look |
| Left click | fire (semi-auto, one shot per click, inputs are buffered) |
| Hold left click | charge the psygun (from cold, no round fired first); release for a piercing beam |
| F / middle click | fire the selected shell |
| 1–5 / mouse wheel | pick a shell: slice, push, well, mark, bomb |
| Right click (hold) | aim down sights |
| V | toggle first / third person |
| Q | swap shoulder (third person) |
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
| Well | a lobbed singularity that drags everything into orbit for 3 s, then pops |
| Mark | stuns clapperjars (dizzy stars) and marks pots in a radius; marked things glow through walls, take double damage and drop Lachryma |
| Bomb | a lobbed clay grenade: splash damage, a spray of molten slip that splats and cools, and a hot pool that cooks pots and scalds clapperjars |

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
| `src/player.js` | Rapier kinematic character controller, FP/TP camera, recoil punch |
| `src/weapon.js` | firing, spread/bloom, hitscan, reload, gun placement (FP camera-space / TP aim-space) |
| `src/character.js` | procedural animation: FK gait, spine aim, two-bone arm IK onto the gun |
| `src/pottery.js` | pot profiles, shape modifiers (lobes, twist, flame rims), surface patterns, clay materials, fracture |
| `src/breakables.js` | spawning, shattering into physics shards, ropes, impact breaks, explosions |
| `src/clappers.js` | clapperjar AI (wander, forage, taunt, nap, hide, flee) + procedural layers over the authored clips |
| `src/lachryma.js` | the Lachryma energy pool + collectable baubles |
| `src/shells.js` | shell inventory and the five shell effects, projectiles, molten/slip fluid |
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

**Animation.** The rig has no clips yet, so everything is procedural and layered on the
T-pose each frame. The gun is placed first, then the arms IK to its grip points, so ADS
alignment is exact whatever the arm proportions. In first person, the arm armour plates are
hidden per-vertex (by arm-bone skin weight) so they don't block the sights.

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
