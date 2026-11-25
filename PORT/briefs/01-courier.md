# Brief 01: the Courier's character controller

South's favourite system with the skiff. Port it first and match its feel number for number. All tuning is
`PORT/data/core/config.json` → `DEFAULTS.movement` (below), `DEFAULTS.camera`, `DEFAULTS.anim`, `DEFAULTS.tech.<id>`.

Source: `src/courier/player.js` (527 lines: state, the fixed step) and its parts in `src/courier/player/`:
`capsule.js` (shapes, posture), `ground.js` (the move, landing, platforms), `air.js` (wallrun, wall jump, water probe),
`mantle.js` (mantle, step-over), `view.js` (look, body facing, camera), `rescue.js` (the safety net). Techs: `src/courier/moves/`.
The rig: `src/courier/character.js` + `src/courier/character/*`, `src/courier/anim/*`.

**The law:** the core movement is the gold standard. Every other mode lays modifiers over it and takes them off on leaving.
Nothing changes `DEFAULTS.movement` at run time but the tuning panel. A mode's switches are `P.mods` (`ownJumps`, `noCoyote`,
`noSlide`, `noWallrun`, `noRisingMantle`: empty means the core as it was) and `input.claim(owner, keys)`.

## 1. The body

- **Kinematic capsule**, radius 0.3. Four shapes by half-height (the capsule's centre at `half + radius` above the feet):
  `stand` 0.55 (1.7 m tall), `low` 0.375 (1.35 m: crouch and slide), `prone` 0.13 (0.8 m: on the belly), `blob` 0.05 (a tech only).
  A shape is changed only if it fits there (`fits`); standing up waits for headroom (`canStand`).
- **Controller** (Rapier's): offset 0.02, up +Y, pushes dynamic bodies, character mass 80, snap to ground 0.3, autostep
  `stepHeight` 0.4 (min width 0.15, not onto dynamic bodies), max slope climb 46°, slides on slopes past 50°.
- **Godot**: `CharacterBody3D`, `FloorMaxAngle = 46°`, `FloorSnapLength = 0.3`, `SafeMargin ≈ 0.02`. Godot has no autostep: do it
  as the JS fallback does (`tryMantle(stepHeight - 0.02, 0, stepOnly)` when blocked while pushing forward) or with a test-move
  up-forward-down. `MoveAndSlide` takes velocity, so the move-on-a-slope tip below is done for you; keep the rest.
- **The move** (`ground.js move`): the wanted displacement is `vel*dt + shove`. On a slope (grounded, `vel.y == 0`, normal under 46°)
  the move is tipped onto the ground's plane. After the controller's move, **only the velocity walls actually took away is removed**
  (the velocity is not replaced by the result). If the controller returns under half the wanted horizontal move, the move is retried
  flat, then a hair upward, then a few cm up (Rapier's resting-in-margin hitch: Godot may not need this). Then land (fall speed,
  `move.land`), clamp rising over a crest, carry with the moving platform under the feet (added after the move, as a rigid frame), and
  respawn below the world floor.
- **The rescue** (`rescue.js guard`, after every fixed step): non-finite position or velocity put back at the last clear spot; speed
  over 90 m/s cut; a body embedded in level geometry nudged out the shortest way, else reset. It should never fire.

## 2. The fixed step (60 Hz), in order (`player.js fixedUpdate`)

1. Timers count down (slide buffer, posture, dash buffer, cooldowns, landing window `landT`, invulnerability, latches); `airT` and the
   air's peak height kept. Passive techs run (`techs.passives`). A mantle in progress owns the step. **An active tech owns the step**
   (`techs.step(dt)` returns true: the core does not run).
2. Input → **wish**: `forward * W/S + right * A/D`, normalized if longer than 1 (analog sticks give less). `hv` = horizontal velocity.
3. **Slide** starts when C is pressed (buffered 0.2 s) or held at landing, grounded, fast (`hs > slideMinSpeed 5`, or sprinting at
   `> 0.8 × walkSpeed`), off cooldown (0.25 s). Speed set to `max(hs + slideBoost 2, slideSpeed 9.5)` if the boost is off its
   1.6 s cooldown, else `max(hs, sprintSpeed)`. Event `slide.start`.
4. **Posture**: C cycles stand → crouch → prone (when not sliding, grounded). Sprint forward stands up from the crouch. Leaving the ground
   while prone for 0.2 s drops to crouch. The capsule shape follows (low while sliding or crouched, prone while prone).
5. **Sprint**: Shift, not walking (Alt), not backward, not aiming (`adsT < 0.3`), not firing, not low.
6. **Jumps**: coyote time 0.1 s, jump buffer 0.12 s (a press, not a hold). In order:
   - on a wallrun → **wall jump** (`air.js wallJump`: out `wallJumpOut` 5.5, up `wallJumpUp` 6.2).
   - within coyote → if forward at a ledge, **mantle** instead; else `vel.y = jumpVelocity 6.4`. From a slide: a **slide-hop**:
     `hv *= slideJumpBoost 1.08`, capped at `maxSpeed 14`, slide ends. Event `move.jump { kind: ground | slide }`.
   - else one **air jump** (`airJumps 1`, after 0.05 s airborne): `vel.y = max(vel.y, 6.4 × 0.9)`, and momentum swung to the stick at
     `max(hs, walkSpeed)`. Event `move.jump { kind: air }`.
   - from prone, Space gets up to the crouch (no jump).
7. **Wallrun** (Titanfall's; `air.js`): begun in the air pushing forward, `airT > 0.06`, off cooldown, a wall within `wallrunReach` 0.9
   beside, speed over `wallrunMinSpeed` 4.2, at least 0.6 m up. Runs at `wallrunSpeed` 9.5 (accel 7), gravity 3, max fall 3, at most 1.8 s,
   an initial up 1.2. Camera tilts 12°.
8. **Horizontal velocity**:
   - *sliding*: friction `slideFriction` 5.5 (a fifth of it downhill), gravity along the ground `slideSlopeAccel` 30 × the normal's
     horizontal part, steer toward the wish at `slideSteer` 2.5/s keeping speed. Ends when slower than `crouchSpeed + 0.3`, C released
     after 0.2 s, timed out (`slideMaxTime` 1.2 s, only once down near sprint speed and not downhill), or 0.15 s airborne. Event `slide.end`.
   - *dashing*: the dash owns the velocity for `dashTime`.
   - *else*: target speed by state: prone 0.6, crouch 2.2, sprint 6.8 (×0.9 strafing), walk (Alt) 1.8, run 4.2; ×`adsSpeedMult` 0.55 by
     aim; ×a tech's `speedMult`; ×wading; ×the charge's move multiplier.
     - **Overspeed on the ground** (landed from a hop or slide faster than target): steer freely toward the wish at `groundSteer` 6/s
       and bleed `overspeedDecel` 10 m/s² toward the target. This is what keeps a hop's momentum.
     - otherwise accelerate toward `wish × speed` at `groundAccel` 55 (input) / `groundDecel` 40 (no input) on the ground, `airAccel`
       10 in the air; **in the air, steering never throws away speed above run speed** (only `airDrag` 2.5 m/s² of it).
9. **Air dash** (Shift in the air, buffered): one charge a jump (`dashCharges` 1, refilled on the ground), costs `dashCost` 12 Lachryma
   from the pool (`game.lachryma.spend`); speed `max(dashSpeed 13, hs)` along the wish (or facing), `vel.y ≥ dashUp` 1.2, for 0.17 s,
   gravity at 15% during it. FOV punch 7°. Event `move.dash`. Out of Lachryma: a fizzle and the Lachrimeter pulses.
10. `hv` capped at `maxSpeed` 14. **Vertical**: gravity 21 when airborne or just jumped; 0 when grounded (snap keeps it down).
11. **Rising mantle**: airborne, pushing forward, `vel.y < 3.5`, a ledge 0.45 to 1.9 m above the feet with room on top → mantle
    (`mantleTime` 0.34 s, up then over). **Step-over**: grounded, pushing forward into a wall no taller than 0.55 m → hop it at speed
    (also when pinned 0.12 s against a lip the autostep missed).
12. Clapperjars (small creatures) underfoot are bowled over by a slide or dash, jostled by a walk. Then `move(dt)`.

## 3. The look, the body and the camera (`view.js`, `DEFAULTS.camera`)

- First and third person (Z toggles). Third person: pivot 1.5 m up, distance 3 (1.5 aiming), shoulder offset 0.7, FOV 70 (50 aiming);
  first person FOV 78 (54 aiming), eye 1.6. Speed widens FOV by up to 8°. A collision sphere of 0.2 pulls the camera in.
- The body turns toward the move in third person at `tpTurnSpeed` 11 rad/s (max 540°/s); in combat (a tool out, `combatStanceTime`
  1.6 s after acting) it faces the aim and strafes.
- Recoil: `addRecoil(pitch, yaw)`: a permanent share and a sprung punch. Shake and FOV punch decay in `updateCamera`.
- Godot: a `SpringArm3D` for the third-person boom; the camera's lag and shake in a script on it.

## 4. Techs (`courier/moves/techs.js`)

A tech is an optional technique that **takes the body for a while** and hands it back exactly. The contract:

```
class Tech { id; passive?: bool; engaged; busy; speedMult; noSprint; moveLock; cuts?: bool
  canStart(): bool        // an idle tech may claim the fixed step
  step(dt): bool          // an active tech owns the step (the core does not run); return false to hand back
  fixed(dt)               // a passive tech: runs every step beside the core (carry, kick, recoil)
  onLand(v)               // landings from the controller
  animate(ch, base, dt)   // blend its own pose over the core animation, then IK
  camera(fp, pivot)       // adjust the eye or the pivot
  yields(): bool          // may a cutting tech (the blink) take the step from it
}
```

One active tech at a time; the **blink** cuts any other that yields. Techs read their own keys through `player.latch(code)` (an edge press
held a short buffer, since fixed steps don't line up with frames). Each has `DEFAULTS.tech.<id>` with an `enabled` switch.
The 25 in `courier/moves/`: hover, rocket, skim (the Soul Brush's jets), blink, slam, stomp, roll, slip (the Paint Dive), swim, ladder,
hang, latch (wall latch), pole, grate, balance, carry (a pot in both hands), push, kick (the unarmed moveset), recoil (shoot down to
rise), grapple (the hook), the jelly mount, **skiff** (the Solar Skiff: brief 02), and the tools' stances (sondelass, veritome, soulbrush,
dreamvane, crucibelle, lockheart). In Godot: a `TechManager` node with child `Tech` nodes, the Courier's `_PhysicsProcess` asking it first.

## 5. Animation (`courier/character.js`, `courier/anim/`)

- Clips: 386, from `source_assets/Courier/courier_anims_*.glb` (move, melee, skiff, emotes, social; the owner's suite) plus older UAL
  (retargeted) and CMU mocap packs. Import the glbs into Godot as AnimationLibraries; the names are what the code plays.
- **Gait**: idle, walk, jog and sprint on **one shared phase** (so blending never puts a foot out of step). Bands (`DEFAULTS.anim`):
  idle → walk from 0.5 m/s, walk up to 2.4, jog from 3.4 (full jog at `walkSpeed`), sprint at `sprintSpeed`. Above a clip's own speed,
  half the extra comes from longer strides (`strideShare` 0.5; capped 1.65 walking, 1.3 running), the rest from cadence.
- **Layers**: crouch (depth 0.8 into the low clips), slide (from frame 0.15 s), the air (jump take-off 0.15, the air jump's tuck flip
  0.12, landing 0.1, dash holds 0.19 pitched 38°), mantle (the climb clip 0.15 to 0.62), wallrun roll 24°. The aim and the tool's
  moves over the upper body (aim pitch ±50° onto aim-up/down poses). Techs blend their own poses in.
- **Procedural pass after the clips**: hips turned toward the move, chest toward the aim, head look; **feet onto the ground** (stride and
  orientation warping, foot locks against skating, the hips dropped to the lower foot: `character/feet.js`); hands (the gun held, a hand
  on a wall or ledge: `character/hands.js`). IK is a light correction, never a whole pose; every chain bends toward its animated
  knee or elbow. **Joint limits last** on every posed joint (`anim/rom.js`, the data `anim/romdata.js`), knees and elbows squared to their
  hinge (`anim/hinges.js`).
- Godot: `AnimationTree` (BlendSpace1D on speed with sync on, layered `Blend2`/`Add2` with bone filters, one-shots for moves);
  `SkeletonModifier3D` subclasses for the foot locks, hip drop and the joint-limit pass.

## 6. Events it emits

`slide.start {speed}`, `slide.end {dur, dist, why}`, `move.jump {kind: ground|slide|air|wall, speed}`, `move.dash {speed}`,
`move.land` (fall speed, what's underfoot), `move.mantle`, `wallrun.start`, `wallrun.end`, `courier.impulse {why, mag, dir}`,
`courier.respawn`, `courier.rescue {kind: nan|nudge|reset|clip}`, `move.step {surface, speed}` (footsteps, for sound).
Outside pushes go through one door: `player.impulse(v, why)`.

## 7. How to check the port

- The basement's **course** (`world/basement/course.js`): eight stations, laps and splits. Run it in the JS build (`npm run dev`, the
  Index → the course) and in Godot; the times should be close.
- **Feel checks** that South will notice: a slide-hop chain keeps speed (overspeed is bled at 10 m/s², not snapped); air steering never
  costs speed above run speed; coyote time and the jump buffer; the step-over never stops you at a 0.4 m lip; a dash out of a
  double jump; the wallrun's 1.8 s.
