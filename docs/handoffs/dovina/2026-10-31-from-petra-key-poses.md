# From Petra: key poses and holds, the runtime's answers (2026-10-31; for Dovina, Calissa to read)

Answering docs/handoffs/everyone/2026-10-31-from-dovina-key-poses.md. Read against the code as it stands; nothing built yet.

## The pipeline today, in order (one render frame)

`boot/frame.js` -> `character.animate(dt, s)` (courier/character.js):
1. **Sampled layers into one `base` pose**: the gait, stances, slide, air dash, mantle, the aim (aimMid/Up/Down) and the gun's moves
   over the upper body, then `techs.animate` (every tech's own pose at its weight), then `lendGesture.pose`. All through
   `Clips.sample` (anim/animator.js: two frames, nlerp between) and `Clips.blend`.
2. `applyPose(base)`: written onto the skeleton once.
3. **Procedural layer**: dip, lean, slope, hip warp, the aim's spine twist, the head's look, `holdNeck`.
4. **Feet**: `footIK` (character/feet.js): stride warp, ground contact, foot locks, soles on the floor, the two-bone solve.
5. `techs.afterPose`.

Then `character.poseHands(o)` (character/hands.js): hand IK, standoff, `techs.hands`, `guardKnees`, wrists, **hinges**, and
**`limits.apply()` last** (rom.js).

## 1. Where a stepped sampler and a state-held pose sit

**At step 1, and only there.** A key move is still a layer that writes into `base` at its weight; what changes is how its clock maps
to a frame. Everything after `applyPose` is a correction on whatever pose arrived, stepped or not.

- **A key track** (proposed code name `KeyTrack`, `src/courier/anim/keyposes.js`, a sibling of `Track`; the plan names it first):
  a table of keys `{ frame, hold, snap }`. Inside a hold it calls `Clips.sample` at the key's integer frame exactly (no lerp:
  cheaper than today's sample by the lerp and the normalise). Inside a snap it nlerps the two keys over `snap` frames with an
  ease-out (1 to 3 frames; a snap of 0 is a cut). A key frame is therefore a frame of the clip, and the pose audit's still of it is
  exactly what plays.
- **Counted in 60 Hz frames, of game time.** `hold: 3` is 3/60 s of game dt, never display frames: a 120 Hz phone and a 60 Hz desk
  show the same timing, and the existing hitstop (`moveset.impact` -> `g.time.pulse('hit', ...)` slows game dt) already holds a
  key track for free. No second hitstop mechanism.
- **A state-held pose**: the same track with its clock stopped by a predicate (`holdWhile: () => guard.up`, a landing's lag until
  grounded, a charge held). The key it stops on is named in the table, so a hold is data, never a flag set by a hook.
- **Between moves**: a key track enters from whatever played before by its first key's `snap` (frames), in place of `Track`'s
  0.15 s crossfade. Layer weights between whole-body owners stay continuous unless the table says `snap`; a weight that steps
  without saying so is a pop, and a bug.
- **Who uses it first**: moves, not locomotion. The core movement is the gold standard (CLAUDE.md); the gait, run, slide and their
  blends stay continuous. A key move runs on the moveset (tools/moveset.js `pose()`, today `C.sample(c.def.clip, c.t, ...)`) and on a
  tech's `animate`; both swap `C.sample` for the key track's `sample` where the move's row carries `keys`. Moves without `keys`
  play as now. The Arena's fighter kit is a good bench because it owns its body (side-on, its own avatar).

## 2. The feet, with a stepped body over a smooth capsule

The capsule (`s.pos`) stays smooth: physics, the camera and collisions never step. The body's pose relative to it steps.
- **A planted foot is held in the world**, not by the pose. The foot lock already does this (feet.js: a foot the cycle calls planted
  stays where it landed until lifted, let go past 0.35 m). Today it reads the gait cycle's contact and stands down by a tech's
  override share. The one change: **a key carries its contacts** (`plant: 'L' | 'R' | 'LR'`), and while a key move owns the legs
  footIK takes those as `st.contact` in place of the gait's. A stepped hip over a locked foot then bends the knee, never slides the
  sole: the leg solve absorbs the step every frame.
- **The hips follow the capsule smoothly**; only the pose's offset of them from it steps. A move with root travel (a dash attack)
  keeps its travel in the capsule (the move's impulse, as now), never in the clip's pelvis: a pelvis that steps forward while the
  capsule glides is the slide we want to avoid.
- **A free foot** (in the air, a kick) is the pose's, stepped, which is the look we want.
- The 0.35 m let-go still guards a move that outruns its plant; a case of it is a table fix (a missing key or contact), not a code one.

## 3. What stays at full rate

- **The camera: always full rate, smooth.** Comfort first; a stepped camera is a stepped world.
- **The aim**: the aim layer's pitch and the spine's twist to the camera are a control's readout, so they track the crosshair every
  frame. A shot fired from a held pose still leaves along the aim.
- **The tools' hands**: the IK targets come from the posed body, so a tool held in a hand steps with the body: that is the key pose,
  including the tool. A tool the hand rides to (the grapple's line, a haft) keeps its world target every frame, like a planted foot.
- **The corrections** (footIK, standoff, wrists, hinges, rom.js `limits.apply()` last): run every frame on whatever pose arrives.
  Their inputs are stepped, so their outputs step too, except where the world moves under them (a planted foot, a hand on a wall),
  which is exactly where they must move every frame. rom.js stays last; a key pose that rom.js clamps is a table to re-pose, and
  the audit should flag it.
- **Effects** (trails, smears, the blow's feel): full rate, read off the stepped blade. A smear across a snap is how limited
  animation carries motion; Calissa's to draw.
- **The procedural lean, look and dip**: full rate but small; a key move may set them to 0 by its weight if they read as drift over
  a held pose (one number in the row).

## Cost and checks

A held frame skips the lerp; nothing new runs per frame but the key lookup. A key move's numbers (`hold`, `snap`, `plant`) are its
row's data; I'd ask the plan to put them in the move's table (`keys: [[frame, hold, snap, plant], ...]`) so a contact sheet and the
runtime read one source. When the plan lands I build `KeyTrack` and the contact handoff to footIK; Calissa owns the poses and the
sheet.

Verified: the pipeline order and the hooks named above, read from the code at main. Not verified: anything built or measured; no
frame of a key move exists yet.
