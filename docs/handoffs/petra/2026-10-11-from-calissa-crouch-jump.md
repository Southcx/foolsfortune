**2026-10-11, from Calissa (Art): the crouch jump, and the prone holster (branch art-crouchjump-prone)**

**The cause, measured.** Space from the v144 crouch toggle fired the jump on the press frame (`move.jump` 'ground', 6.05 m/s), but the
feet rose only 0.196 m and were down at k9 (150 ms), against 0.922 m and k34 or k35 from standing or with C held. A jump from the crouch
stands them up (`setPosture('stand')`), so the next step grows the capsule from low to standing in the air. `setShape` moved the collider
with `setTranslationWrtParent` alone, and Rapier applies that only in `world.step`. So the controller asked in that same step met the
standing capsule at the low one's centre: its foot was 0.175 m below the feet and 7.4 cm into the floor, so it read grounded while
rising, and the next step's grounded branch zeroed `vel.y`. With C held, the capsule stays low in the air, so the jump was whole.

**What I changed in your files** (each marked CROSSING):
- `courier/player.js`, `setShape`: one line under a three-line comment.
  `this.collider.setTranslation({ x: this.pos.x, y: this.pos.y + half + RADIUS, z: this.pos.z })`.
  Why not on the animation side: the body really stops 0.196 m up, and no clip can carry a jump the physics has ended.
  Why `this.pos`: the controller's move is added to `this.pos`.
  A Rapier-only probe found two things. A world translation set on a parented collider moves it at once and leaves its offset alone.
  The next step puts it back at parent times offset. So respawn's `setShape` before `place()` comes out right too.
- `courier/player.js`, the posture cycle's call: `cyclePosture(locked || !!this.techs?.get('carry')?.item)`. A pot in the hands
  means stand and crouch only, as on the line. I measured the other way first. The carry's put on the way down stood the body up into a
  stoop (k76 to k88), then it flopped flat in about 6 frames with the pot at its face.
- `tools/belt.js`: each adapter has `out()`, the mirror of `stow()`, and `draw(tool)` calls `tool.out?.()`. The belt could put a tool
  away but not bring one out. Every existing caller sets `drawTarget = 1` before `draw`, so nothing changes for them.
- `courier/moves/carry.js`: `!P.prone` on the pickup (lying down, F picks nothing up).
- `tools/psygun/weapon.js` (added after the review): while `game.proneHolster.busy`, the gun reads as another tool out (`toolOut`:
  every key held up, a charge cancelled and refunded, a move cancelled), and `buffer`, `pressT`, `wantShell` and a homing paint are let
  go. Before, a tap, a shell or a charged release lying down fired once the gun was back (k204), or at the next psygun draw. Why not the
  holster's: the gun reads its keys after the holster has run, so only the gun's own view of the keys can hold them all up.

**Measured after.** Every crouch case peaks at 0.922 m and lands at k34; standing lands at k35 (the verifier found why: a start 2 cm lower, below). That covers
toggle and held, still and walking, and Space 1, 30 or 120 frames after the C. The slide hop with C tapped goes from 0.199 m to
0.926 m. Three ground cases had the same feet heights and grounding before and after, with no rescue: C held then let go, crouch to
prone to stand, and sprinting out of the crouch. `npm run check` and `npm run build` pass. The stress test (`scripts/stress.mjs`, seed 1): 24 runs, 21,600 ticks, 0 violations, 0 controller
clips, 45 posture changes, 181 jumps, no rescue. That was the third try: the first two crashed the page ("Target crashed") at about 12
and 5 minutes, while other sessions' browsers held about 8 GB of the box's 16. No baseline run was made to compare against.

**After the review** (the verifier's two blockers, repaired on the animation side and in the gun): in the basement tunnel (1.5 m roof)
the crouch jump lands at k6, before the air is whole, and the hold was let go there while the crouch, which your `crouchBlend` aims at 0
off the ground, climbed back: the standing idle showed at 0.41. The hold now stays until the crouch is back (0.198 at most, the crouch's
own 0.20). The psygun's queue is above. Not touched, from the verifier: after a teleport while crouched and then standing up, the
Courier rests at y 0.000 where the base rests at 0.020 (the `setShape` crossing no longer lifts the grown capsule out of the
controller's 2 cm margin; a standing teleport rests at 0.000 in both); from that rest the next jump lands one frame sooner (k34).
Every other ground transition measured rests at the same height in both builds.

**Seen in passing, not mine:**
- The psygun's queue may outlive other hand-takers too, read in the code, not measured: a tech that takes the hands without blocking
  the fire button (`handsBusy` with no `blocksFire`: an emote, a ladder's rush) lets a press set the buffer, which `tryFire` holds while
  the gun is not up, so it would fire when the gun comes back after.
- The psygun brought back after getting up auto-holsters about 1 s later when it had been idle 5 s (`idleT` runs on while prone);
  the same in both builds, measured.
- A Space pressed 2 frames before getting up from the belly ends is dropped (`jumpBuf = 0` there), where a landing keeps it 0.12 s;
  and the 0.4 s get-up to the crouch leaves `postureT` at about 1e-17 after 24 steps, so a press on its last frame is eaten too.
- Achievement `lg5` ("Every Tech, Once") counts `game.techs.list.length`. The prone holster is a passive tech, so it now counts 37,
  not 36. Passives never start, so `lg5` was already out of reach. That one is Dovina's.
- From the second diagnosis, not measured: with `/art rocket` on (kept in the settings section across builds), a tap of Space while
  crouched and still is the rocket's gather, not a jump.
