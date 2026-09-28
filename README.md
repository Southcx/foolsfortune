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
| Right click (hold) | aim down sights |
| R | reload |
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

## What's in the room

- Shelves, workbenches, pottery wheels, a mezzanine with stairs, a ramp platform, and a kiln.
- ~125 procedurally lathed pots: jars, amphorae, bowls, vases, cups, pitchers, and big
  urns (2 hits).
- **Ember urns** (dark, with glowing bands) explode, shattering and flinging everything nearby
  into a chain reaction.
- Hanging pots on ropes, a clay-plate target range (plates respawn), crates and a brick pyramid.
- Pots falling off shelves or ledges break on impact.

## How it works

| File | Role |
| --- | --- |
| `src/main.js` | bootstrap, fixed-step loop (60 Hz physics, interpolated camera) |
| `src/player.js` | Rapier kinematic character controller, FP/TP camera, recoil punch |
| `src/weapon.js` | firing, spread/bloom, hitscan, reload, gun placement (FP camera-space / TP aim-space) |
| `src/character.js` | procedural animation: FK gait, spine aim, two-bone arm IK onto the gun |
| `src/breakables.js` | lathe pots, fracture into convex shards, impact breaks, ember explosions |
| `src/fx.js` | tracers, muzzle flash, particles, chips, bullet-hole decals |
| `src/audio.js` | all SFX synthesized with WebAudio (no audio files) |
| `src/level.js` | greybox workshop and prop placement |
| `src/outline.js` | inverted-hull outlines (matches the .blend's Solidify outline look) |

**Fracture.** Each pot is a lathe (profile × radial segments). On break, the outer surface is
resampled on a jittered grid, each cell is cut along a random diagonal, and neighbouring
triangles are grouped into shards. Each shard is the convex hull of its outer points plus
the matching inner-wall points, so it gets both a render mesh and an exact Rapier collider.
Shards near the bullet's impact are smaller and get more push.

**Animation.** The rig has no clips yet, so everything is procedural and layered on the
T-pose each frame. The gun is placed first, then the arms IK to its grip points, so ADS
alignment is exact whatever the arm proportions. In first person, the arm armour plates are
hidden per-vertex (by arm-bone skin weight) so they don't block the sights.

## Character asset

`tools/export_courier.py` converts the source `.blend` into `public/assets/courier.glb`
and `public/assets/psygun.glb`. It strips the Solidify outline shells (outlines are rebuilt
in-engine) and exports the rig in rest pose.

```bash
pip install bpy==4.5.*   # Blender as a Python module (Python 3.11)
python3 tools/export_courier.py path/to/courier_base_rigged.blend
```

The .blend's armour and mask textures point to files outside the .blend, so the
prototype uses flat terracotta materials.
