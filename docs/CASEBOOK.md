# The casebook: every bug fixed, its cause, and the rule it left

One case per fix, newest first: the cause (measured, not guessed), the fix, and **the rule** that keeps it from happening twice. Read
the rules before building in the same area; a rule a machine can check goes into `npm run check` or a test too. (The owner, 2026-10-06.)

## The rules, short (from the cases below)

1. **No two faces in one plane.** Before adding a floor, a slab or a decal, find what else lies in that plane (a ray down through the
   spot, or the zone's bounds): ceilings of rooms below have their tops at ground level. Cut the other one, or stand off by at least
   1.5 cm (1 mm is not enough at 20 m in a 24-bit depth buffer). Floors and slabs get `{ outline: false }`.
2. **A new zone moves things.** A zone test claims every mesh whose centre falls in it, and everything that asks `zoneOf` changes its
   answer there. Grep `zoneOf` and `zones.current` before adding one; ask `wholeOf` / `zones.whole` for "what ground is this".
3. **Pin the clock in every headless test.** Anything seeded by the game day (the Dunemaw's floors, the weather) changes daily.
4. **Times are the machine's; counts are the change's.** Before believing a perf time, measure the last published build on the same
   machine, back to back.
5. **A shader program is a cost.** A material variant no other mesh uses (instancing on a basic material, flat shading) compiles its
   own program; share an existing one.
6. **Clone skinned models with `SkeletonUtils.clone`**, never `.clone()` (the copy stays bound to the original's bones).
7. **Save records are copies, never live references** (JSON round trip at the write).
8. **Small bumps on a ramp add to the ramp.** Anything walkable stays under the controller's climb limit with its detail included.
9. **A route through doorways approaches each doorway square** (a point in front of it on each side): straight lines along a wall
   catch on anything standing proud of it.
10. **A rename is all the places, or none**: grep the old word across the repo, and read the stress test's page errors, not only its
    violation count.
11. **A character controller is handed a move along the ground, not into it.** On a slope, tip the level move onto the ground's plane;
    left to resolve a level move against a ramp, the controller climbs in uneven jumps.
12. **A correction layer is sprung, never snapped, and never fed by a foot in the air.** IK offsets and hip drops follow their targets
    with a damped spring at one rate both ways; the hips drop for the foot that stands, weighted by the clip's contact.
13. **Measure the parts, not the sum**: when something shakes, log each contributor per frame (the controller's height, each
    correction) before changing any of them; the first suspect was not the cause here.
14. **A surface tessellated by area costs by area.** Before growing anything built at so many vertices a metre (water, sand, a
    heightfield), multiply out its triangles; trim what is hidden (a box's dry corners) and say the rest in the perf baseline's reason.
15. **A module-wide uniform is everyone's.** Anything set every frame by one loop (the fade, the dissolve, the mind's time) is stale
    in a scene that loop does not run (the title, a workbench); reset it on the way out, and grep who else reads it. When a report
    will not reproduce, try the other end of the timeline first.
16. **Judge a face at play distance, not in its close-up**, and take away any line that only made sense on the shape it replaced.
17. **A warmed thing stays referenced.** A material disposed after the warm-up takes its program with it, and the first real one
    compiles again in play. Park warmed things hidden; never dispose them.
18. **The warm-up covers what is made on first need**, not only what stands in the scene at boot: a dressing laid on when a place is
    entered (a sandfall's curtain) is shown once in the warm-up, or it compiles in play.
19. **A tech's pose is drawn while its weight is above zero, not while its state is on.** The weight eases out after the state ends;
    a pose that stops at the state's end snaps. And measure a mocap clip before playing it: its pelvis against the base pose's (re-root
    it), and its per-frame jumps (mask a bone the capture got wrong).

20. **A tech reads its own key edge.** The core movement consumes its latches before or after a tech looks; a tech that starts on a
    press keeps the key's last state and detects the press itself, and a tech that spends a press marks it spent for the core
    (`jumpHeldLast`, `jumpBuf`). Test a tech by the chat line's `/art`, never by importing config into the page (another module copy).
21. **An event that sums an act fires after its last effect lands**, not when the input stops: what is still in flight (drops, a
    projectile) is part of the act.
22. **A coverage map is one channel, premultiplied, finer than its edges.** Split alphas and cells as coarse as the feature show
    the grid; filter premultiplied colour so an edge fades toward the colour, never toward black.

23. **A move to a place sets that place's floor in the same step.** The fall height is read by the next fixed step, before the frame
    that would have updated it: whatever sets the Courier down far below (a far dock, a Well) lowers `player.killY` under them first
    (`places.stand`, `course.toDunes`).

24. **A material made once for the whole game is marked `userData.shared`.** Whatever is taken down (a Well floor, the bowl) disposes
    every material it holds that is not marked; a global one disposed loses its program and recompiles at its next draw, a hitch.

25. **A trailing comment closes its line.** Nothing follows a `//` on the same line: code written after one, in a later edit that put a
    comment mid-line, is silently commented out and never runs. Put the comment last, or use `/* */` inside a line.

26. **Nothing is taken out of a list from inside that list's own update.** A callback a module calls per member (a jelly's `driven`)
    marks the member (`c.reached`); the owner removes it after the loop. A Rapier body removed mid-loop panics the whole world.
27. **A default argument is read at the call.** A module that calls its own helper while it loads (`withFade` for the outline materials)
    must not default that helper's argument to a constant declared further down: read it inside, when it is used.
28. **A second copy of a dressed model is dressed the same way**, or every one of its materials is a new program. Count
    `renderer.info.programs` before and after it first appears.

29. **A field keeps one meaning.** A name already given a meaning (a setting, a window, a limit) is never reused as a working counter
    in the same object; give the counter its own name.

30. **What an event moves, its end moves back.** A position, scale or state changed for the length of an act (a merge, a hold) keeps its
    rest value apart and is returned to it when the act's result is gone.
31. **A goal a mind sets for itself keeps the safeties of the order it serves.** A sibling closing on a foe borrowed "go", the order
    that stands where told and is never warped, and was left behind when the Courier travelled; the fight's approach is its own order.
32. **Every goal has a give-up, and every call a deadline.** A mind told to reach something measures its progress and, when it stops
    closing, is set down there or gives up and says so; a call to anything outside the page (Claude, a connector, the room) has a
    timeout, a cap, and a line in the log when it runs out. Nothing waits forever, and nothing spends the owner's usage unbounded.
33. **A tech asked to start while it is on is restarted in place**, never stopped and begun: `stop()` calls `end()`, which reads the state
    the new start has just written (Launch's options), and ends the new move instead of the old.
34. **A service is asked for when it is needed, not when the asker is built.** The techs are made before `game.interact` (main.js); a
    source registered in a constructor with `game.interact?.add` was silently dropped. Register on first use (`offer()`), and test it.
35. **A committed move does not cut the core's climb.** Whatever takes the step with `endCore` (Launch, a whole-body strike) waits for the
    mantle to finish: ended half way over a lip, the capsule is left inside it.
36. **A position set outright is checked first.** Anything that moves the Courier without the controller (a phase's step, a teleport by
    an animation's travel) asks whether the capsule is clear there, and keeps the last clear place to fall back on.
37. **A tool's clip is judged with the tool in the hand.** A body clip made without the tool (the suite's) and a grip measured on
    another clip (`torchIdle`) can disagree: measure where the tool's far end goes (its mouth, its coffin) against the head and the
    body in body space, from the front and the side, before taking the clip as a stance; correct the hand (a wrist turn on the
    layer) or the chain, never the clip's arm.
38. **A method is called on its object.** `(a || obj.m)?.()` calls `m` with no `this`; pick the function and call it where it lives
    (`a ? a() : obj.m?.()`), or bind it once where it is stored.
39. **One handoff a frame.** A track that changes clip on a condition changes once per update (an `else if` chain): a clip handed to is
    never left in the same frame because its own exit was already true, which drops the fade that was meant to show it.
40. **A blast along the floor is measured along the floor.** A radius is a cylinder of any height until its height is said: a ring
    struck from the feet takes only what stands within a body's height of them.
41. **A move that follows a whole-body move ends that move's carrier.** Launch, left to run out its time, draws the old clip over the
    new one; a string from the whole body to the upper body plays its next move whole too, or stops the carrier itself. So does a move
    cut short (the tool put away, a cancel): finished, not dropped, and at the stow's first frame, not its last.
42. **Up is asked where it can differ.** A marker, a bob, a label of floors assumes world Y only where nothing else can be up; in the
    Spirit Garden each planetoid has its own, so a source says its up and the reader stands along it.
43. **A layer over part of the body leaves the hips alone, and what a tech's weight switches follows its pose.** `Clips.blend(out, src,
    w, mask)` moves the pelvis by `w` whatever the mask: an upper-body or one-arm layer passes `hipW = 0`. The knee guard, the joint
    limits and the foot IK read a tech's weight (`override`, `legsOwn`); a pose faded out on its own clock keeps the weight up with it,
    or they switch on at full strength under a pose that is still the clip's.
44. **A body pose is judged with the kit on as well as off.** A tool worn on the back stands up through a Courier lying on it; a pose
    that puts the body on the floor is filmed with the belt full, and puts the worn tools out of sight while it lasts if they cross it.
45. **One press, one meaning, in every state the tool can be in.** When a tool's button means something else in a mode (the lens's
    shutter, the air, the busking body that keeps the bell), shut the other meaning out there: empty the combo engine's buffer, hold the
    tool in hand every frame. Drive the press in each state and across each edge between them (lens up then down, airborne then
    landed), and check that the press still does what it did before the change.

46. **A weight that can drop in one frame is eased wherever it is blended outside the crossfade.** A move's weight goes to nothing the
    frame it ends; the upper layer is crossfaded, but the legs and an IK weight blended after it are not. Damp the weight, and cancel
    a move whose update stops (the tool being put away) rather than leave it on its last frame.

47. **In first person, what is drawn from a tool is measured on its held placement.** The body is hidden and its bones are behind the
    camera; a trail, a flash or a chain taken from a bone sweeps across the whole view.

48. **A key one handler spends, no other handler sees.** A window that closes on Esc or P stops the event there; one key is read in
    one place a tick (two readers of P opened the box as the other closed it).
49. **Nothing opens under a cover, and a cover always lifts.** A page asked for inside a seam waits until the seam is up; the seam runs
    whatever early return the frame takes. What a place changes of the world (the camera's up, the sky) it puts back on leaving.
50. **The gate parses what it checks.** A rule that reads source as text passes a file no browser can load; `module.parse` (esbuild)
    runs first, and a page that will not boot is a hard failure.
51. **An act paid for at the press and done later keeps its slot until it is done.** A second press before the first lands fires the
    first at once (or refunds it); it never overwrites it. And what a move's row says it is worth (nothing, for a shove) holds for every
    kind of thing it meets, not only the one the row was written for.
52. **A whole-body clip is filmed from the eye too.** The head is hidden in first person, but the arms and the worn tools are not: a
    clip that turns the body over or flings the arms (a flip, a kick-off's push) wheels them across the view. In first person play
    the part that stays upright, or leave the clip out, and film both views before calling it done.
53. **"Nothing is happening" asks every tech, the passive ones too.** A layer that plays only when the body is free (an idle break)
    checks `active`, `override` and every `passive` tech's `engaged` (a carried crate, a kick of the unarmed V, a tool in hand).

## Cases

### 2026-10-07 · The core movement's look from the suite, reviewed: four faults found and fixed (Calissa, loco review)
- **Seen, measured headless (`.scratch/lfilm.mjs` scenarios, a per-frame bone-jump probe):** (1) a kick-off from a ladder's foot,
  landing 0.38 s later: a fingertip jumped 1.57 m in the landing frame (a plain landing: 0.25 m); (2) in first person the slam's flip
  and the kick-off's push swept the worn tools and a hand across the view, where the old slam held them still; (3) a big blow taken
  crouched lifted the hips 0.25 m for 0.3 s; (4) the idle breaks played under a carried crate (Loco_IdleLookAround at 11 s,
  Loco_IdleStretch at 20 s, the legs doing them under the crate).
- **Cause:** (1) `airborne.js` dropped the kick layer the frame the Courier was footed, at whatever weight it had; (2) only the double
  jump's flip was left out in first person; (3) the flinch blends Hit_Chest over the upper body with the pelvis at full weight (it came
  across from character.js as it was); (4) `IdleBreaks.quiet` asked the active tech and `override`, not the passive techs.
- **Fix:** (1) a landing fades the kick out over `KICK.land` (0.1 s; the landing frame's jump is 0.66 m and falling, as any landing
  from flung arms); (2) in first person the kick-off is not drawn and the slam starts from its tuck (`tuckOnly`): the view is as still
  as the old slam's; (3) the flinch passes `hipW = 0` (the hips now move under 0.02 m); (4) `quiet` also asks `passive && engaged`.
- **Rule:** 43, 46, 52, 53.

### 2026-10-07 · Put away mid-vault, the Courier slid on frozen in it for a second (Calissa, the brush and vane review)
- **Seen (headless, K pressed 0.17 s into the Dreamvane's vault):** the Launch `dreamvane.vault` ran on to its 1.21 s with the pose held at
  clip time 0.20 and the core movement shut out; the spin sweep the same (1.39 s); the Soul Brush's dive and air slam likewise (G).
- **Cause:** a held tool's blows advance only while it is in the hand (`use`, `club.update`), so from the stow's first frame the move's
  clock stopped while its Launch carried on; at the stow's end `Moveset.cancel` dropped the move and only nulled the Launch's `onEnd`.
- **Fix:** both tools cut the move on the stow's first frame (`drawTarget` 0), finishing it first so the Launch ends with it
  (dreamvane.js `cutMove`, club.js `cancel`). Measured: the Launch is off the frame K or G is pressed. The engine's own `cancel` leaves
  the same gap for every tool (the cutlass's too): worth closing there.
  The engine's own `cancel` now ends the launch too (tools/moveset.js), and the Sondelass cancels its stroke as the stow begins
  (measured: a fourth stroke put away has no launch two frames later).
- **Rule:** 41.

### 2026-10-07 · From the Dreamvane's pick into its first sweep the hips swung 15 degrees in one frame (Calissa, the brush and vane review)
- **Seen (headless, each bone's turn per frame at 60 Hz, the root's yaw taken out):** at the join of Vane_PickStrike into Vane_Combo1
  the hips 15.5, the chest 34.2 and the head 42.7 degrees in one frame (3 to 7 either side); a Soul Brush blow held into the load, the
  hips 33.6 and the chest 42.9.
- **Cause:** a join crossfades the upper layer (the engine's `joined`, tools/toolbody.js `Crossfade`), but not the legs and hips:
  `Moveset.legs` samples the new move's clip at once, drops a cut move's legs the frame it ends (`!c`), and the hips carry the chest.
- **Fix:** both tools crossfade the lower body too, over 0.15 s, weighted by how much the legs are the tool's (`legsW`: never the
  run's legs). Measured after: the pick into the sweep 2.4 / 11.7 / 16.8 degrees, the brush's second blow into its third 0.2 / 2.8;
  the blow into the load 5.3 / 11.2, spread over the frames after. Still to do (the engine's): a move begun from standing ramps its
  legs in at the engine's own rate (the vane's overhead from rest, 10.5 at the hips in its first frame).
- **Rule:** 19, widened: every channel a move writes is eased at a join, the legs too; the engine's `legs` should do it for every tool.

### 2026-10-07 · Two quick flicks of the Soul Brush paid 2 Lachryma for one fan (Calissa, the brush and vane review)
- **Seen (headless):** RMB tapped twice within 0.13 s: 2 Lachryma spent, one `brush.flick`.
- **Cause:** the fan leaves at the top of Brush_Flick (`startFlick(onRelease)`); the second tap replaced the first's callback before it ran.
- **Fix:** a throw still to leave goes at once when the next begins (club.js `startFlick`). Measured: 2 spent, 2 fans.
- **Rule:** 51.

### 2026-10-07 · The Dreamvane's vault, "never a weapon", stunned clapperjars and counted as hits; its launcher led into the air string on the ground (Calissa, the brush and vane review)
- **Seen (headless):** a sprinting LMB through a clapperjar knocked it, stunned it 2 s and emitted `dreamvane.hit` (toward the
  Dreamquake's 200); S+LMB then LMB played Vane_Combo1 as an `air` move with the Courier standing.
- **Cause:** Dovina's row gives the vault power 0, and the vane's blow rules asked the row only for creatures; the engine follows any
  launcher with the air string, but the vane's jab is an upper-body move and they never leave the ground (the cutlass's lifts them).
- **Fix:** pick.js: a move whose row is worth nothing only shoves (knocked aside, never broken, stunned or counted); a launcher on the
  ground leads into the staff's string from its first sweep. The Dreamquake's reveal and ring use the row's radius (5 m), as its blow does.
- **Rule:** 51 (its second half), and 35's note: a hook asks what the move became (where they are), not what it was meant to be.

### 2026-10-07 · The Spirit Garden sweep (the owner's four and ten besides; Dovina's GARDEN-SWEEP.md, measured by scripts/garden-sweep.mjs)
- **Seen:** 40 checks passed and 25 failed on b4c39f5. The owner's four were a black screen on the first entry, an invisible Jar,
  calibration numbers under the garden's pages, and a chevron pointing world-down on a round world.
- **Causes (measured, file:line in GARDEN-SWEEP.md):**
  1. The naming page opened inside the seam's callback, and the frame returned before the seam updated, so the cover stayed black.
  2. The god hand put the Jar away at a scale of 0.001, and the garden never reset it.
  3. The Index appended its calibration to every page, not only its list.
  4. Offers carried no `up`.
  5. A throw of 26 m/s against an orbit of 22.8 m/s, with no drag, left the Jar circling.
  6. Collision, gravity's owner and the hand's ray used the bare radius against a needle running to 28 m.
  7. Travel was read from `player.pos`, which is the Jar's in the garden.
  8. The garden was charted and announced as the upper floor.
  9. P was read twice a tick, and a window's Esc reached the pause menu.
  10. The lock was asked by `!god.active`, and a refused lock retried without asking the game.
  11. A leave during the fade was dropped.
  12. The camera's up and the sky were never put back.
  13. The garden had no help page.
  14. Several smaller ones: feelings shown mirth first, code ids shown as names, all 40 PLACE rows at once, a silent refusal, a held
      Jar hanging under the pause, a tribulation that outlived the leave.
- **Fix (Petra's halves):**
  1. Naming opens once the seam is up, and the seam updates under the windows' and the pause's early returns.
  2. The Jar is set to full size on entry and on the god hand's exit.
  3. Calibration shows only under the Index's list.
  4. Offers carry `up`, the realm passes the place's own normal, and interact turns the chevron to it.
  5. Drag over hop speed, plus a give-up after 6 s airborne (`garden.jar.back`).
  6. `rMax` per planetoid (the shape's reach plus the clay's band), used in all three, with the hand's ray marched to the ground.
  7. No travel is counted while the realm is active (Dovina's ruling).
  8. No charting and no room line while in the garden.
  9. Windows stop their Esc, and P is read in one place.
  10. `cursorFree()` decides the lock, and `input.wantLock` is asked before a retry.
  11. A leave is queued until the seam ends, and `enter` returns its refusal.
  12. The camera's up, the background and the fog are kept on entry and restored on leaving.
  13. A help page for the garden (THE SPIRIT GARDEN).
  14. STATS order, names as said, PLACE a row per feature with the unaffordable dim, `garden.refuse`, the pause sets the held thing
      down, `kiln.cancel()`.

  Measured after: **65 passed, 0 failed.** The chevron is 0.2° off the heart at the Chimney (52.2° before); a full throw lands in
  1.47 s; the Jar at the needle's top rests on it.
- **Not Petra's:** the chevron's own orientation, which belongs in `vfx/chevron.js` `target(p, up)` (Calissa; interact turns it
  meanwhile); the Jar's look apart from the torii, `jarhop.js` and `wirecompass.js` (Calissa); the 24,890 Hz oscillator (Wanda); the
  player names (Espada); which features each Firing opens (Dovina: PLACE lists all until her table).
- **Rule:** 32, 48, 49; and 50 for the line this round broke: a trailing comment ate the rest of a one-line function, `npm run check`
  passed it, and the page would not boot.

### 2026-10-07 · The bell's toll string, the coffin's flail and the book's bash, reviewed: six faults found and fixed (Calissa, belltome review)
- **Seen, measured headless (`.scratch/rv.mjs`, films front and side):** (1) LMB in the air no longer rang the bell (the old toll did,
  anywhere); (2) a photograph taken with the lens up, the lens let down within 0.35 s, swung a book bash (`veritome.swing b1` 17 frames
  after the shutter); (3) at a busker's mat, another tool's key (I) or the bell's own (U) put the bell away while the busking body went
  on playing an empty hand; (4) the legs snapped back to the run's the frame a toll, a blow of the flail or a bash ended (a shin 26.7 to
  29.3 degrees in one frame); (5) put away mid-string, a toll or a flail stood frozen on its frame until the holster (0.3 s); (6) in first
  person the flail's ribbon ran from the hidden body's left hand to the coffin before the eye, a sheet of gold across half the view.
- **Cause:** (1) the engine opens a ground string only on the ground, and no air string was given; (2) the engine buffers the press
  whether or not it may open, and opens it the first frame it may; (3) the busking body freed the hands (`handsBusy` false) so the bell
  could stay, which freed every tool's key too, and `belt.draw` puts the bell away; (4) `standLegs` was weighted by the move's weight,
  which `moves.pose` drops to nothing at its end; (5) `use` (and with it `moves.update`) runs only while the tool is fully held;
  (6) `chainSegment` took the body's hand in first person too.
- **Fix:** (1) in the air a press rings one toll at once with Bell_Toll as a gesture, `TOLL.cool` apart, and the buffer is emptied;
  (2) the buffer is emptied while the lens is up or lifting; (3) the busking body sets the bell's `drawTarget` every step; (4) the
  weight is damped both ways in `standLegs` (up 30/s, down 12/s): at the end no leg bone now turns more than 6 degrees in a frame; (5) the bell and
  the coffin cancel their move once `drawTarget` is 0; (6) in first person the chain runs from the model's bail to the coffin.
- **Rule:** 45, 46, 47.

### 2026-10-07 · In the Spirit Garden the chevron leaned off its planetoid, and the compass called the garden the upper floor (Calissa)
- **Seen (Dovina's garden sweep, #4 and #8):** the chevron off the planetoid's heart by up to 52 degrees at the Chimney; "You enter
  UPPER FLOOR." on entering the garden.
- **Cause:** the chevron (vfx/chevron.js) stood and bobbed along world Y whatever the source; the wire compass (vfx/wirecompass.js) read
  the workshop's floors at any height, and the garden sits above them.
- **Fix:** a source may give its `up` (courier/interact.js passes it on) and the chevron stands and bobs along it; the compass says no
  place while the realm is active. Petra's `realm.offer` is to pass the feature's normal.
- **Rule:** 42.

### 2026-10-07 · The Pneuka Jar was invisible in the Spirit Garden (Calissa)
- **Seen (Dovina's garden sweep, #2):** after the god hand, the garden's Jar could not be seen; its scale read 0.001.
- **Cause:** leaving the god hand leaves the Jar's group at scale 0.001; the hop (vfx/garden/jarhop.js) took the scale it found at
  entry as its rest scale, so it squashed and stretched about nothing.
- **Fix:** its rest scale is 1, never a reading of the moment. Measured headless: 0.89 / 1.27 / 0.89 mid-hop, visible.
- **Rule:** 30.

### 2026-10-07 · An emote's end snapped to the idle, and the folk talk's gestures moved the hips (Calissa, emotes)
- **Seen:** measured headless on every emote through the chat line (a frame-to-frame step of every body joint after the whole pipeline):
  an emote's last frame went straight to the body's own pose (the suite's one-shots end at their neutral stance, 17 degrees mean and 51
  at worst from the idle); a dance left by W jumped to the walk; one emote straight into another snapped; with a fade added, the
  cossack's squat still turned a foot 55 degrees in one frame as it ended.
- **Cause:** the emote drew its pose only while its state was on (rule 19). Once a fade was added, the tech's weight still fell at the
  techs' own rate (12 a second) and its `overrides` went to 0 at the end, so the knee guard switched on at full strength under a pose
  still almost wholly the clip's. Separately, the talk's answers blended over `MASK_UPPER` with the default `hipW` of 1, pulling the
  pelvis to the clip's (the suite's Cry and Tremble hold it 5 cm under the idle's, measured on the clips).
- **Fix:** the emote keeps its last pose and fades it off the body's own over 0.3 s, its weight held up by that fade (`tick`), a floor
  pose keeping its own legs to the end of it; a new emote fades the old one's pose out under it; the talk's answers pass `hipW` 0.
  Measured after, over all 134 emotes: the largest step a frame while the last pose fades is 6.9 degrees at the median; the worst (36,
  a dance left by W) comes from the foot IK as the walk starts and stops under it (the core alone, a tap of W from the idle: 26; the
  same tails with the foot IK off: 9). In a talk the hips move 6 mm at most during an answer.
- **Rule:** 19, 43.

### 2026-10-07 · Three of the suite's gestures spun a forearm half a turn in one frame (Calissa, emotes)
- **Seen:** `Taunt_KnuckleCrack` f10, `Emote_HeartHands` f53, `Emote_Hungry` f68: a 170-degree step on forearm.R between two keys (the
  clip survey), and the three end 74 to 82 degrees from where they began.
- **Cause, measured:** a swing and twist split of forearm.R against its rest: the twist goes 95 to 265 degrees (the same as -95) in one
  key in all three, and stays wound to the end. In the heart the left forearm unwinds smoothly over the same frames, so the right's is
  a bad key, not a motion.
- **Fix:** each is played only where it is whole (`emotes.js`): the knuckles from 0.34 s (after the flip; the blend-in from the body's
  own pose covers the start), the heart to 1.73 s and the rumble to 2.23 s (before theirs); the end fade carries the arm back.
- **Rule:** 19 (measure a clip's per-frame jumps before playing it).

### 2026-10-07 · The hover's feet went under the floor, and a tool stood up through the Courier lying down (Calissa, emotes)
- **Seen:** `Emote_MeditateHoverEnter` and `Exit`: the feet and toes 0.116 m under the floor while the legs uncross and the hips are
  still low. Filmed in the workshop with the debug kit on: lying down (`Emote_Sleep`, `Emote_LieBack`) a tool worn on the back stood up
  through the body.
- **Cause:** the clip's hips rise later than its legs swing down; the worn tools ride their back sockets whatever the body does.
- **Fix:** a floor pose is lifted frame by frame where a foot or toe would go more than 2.5 cm under the floor (measured once by the
  legs' FK on this skeleton, widened and smoothed: courier/moves/emote.js `liftOf`): the hover's lowest is now -0.026 m. Lying down
  (`bare`) puts the worn tools out of sight from halfway down to halfway up (the belt's `hideWorn`; each tool shows itself again from
  its own tick).
- **Rule:** 44.

### 2026-10-07 · The stress test stopped on a Dreamvane dash begun on a ledge (Calissa)
- **Seen:** the quick gate, stress seed 1: `Cannot read properties of null (reading 'drive')` in `carryInto` (tools/toolbody.js), from the
  vane's `onBegin`.
- **Cause:** a whole-body move asked for mid-mantle is played on the upper body alone (rule 35), so it starts no launch and has no tag;
  `carryInto` compared the launch's tag (undefined) with the move's (undefined), found them equal, and read the null launch.
- **Fix:** it carries only a move with a tag whose launch is on (tools/toolbody.js).
- **Rule:** 35 (and a hook on a move asks what the move became, not what it was asked to be).

### 2026-10-07 · The stress test stopped on the cutlass's first swing (Calissa)
- **Seen:** the quick gate, stress seed 1: `TypeError: Cannot read properties of undefined (reading 'ok')` at `slash`
  (audio/sondelass.js:21), from `Moveset.begin`.
- **Cause:** the engine's new per-tool swing sound picked the function as `(this.S.sound || sfx.slash)` and called it bare, so
  `sfx.slash` ran without `sfx` as `this`.
- **Fix:** the tool's own sound is called, else `sfx.slash?.()` on `sfx` (tools/moveset.js `begin`).
- **Rule:** 38.

### 2026-10-07 · The Crucibelle stood in front of the Courier's face in Bell_Idle, and the flail's coffin crossed it (Calissa, belltome)
- **Seen:** with the suite's Bell_Idle as the bell's stance, the bell covered the face from the front; the first cut of the Lockheart's
  flail swung the coffin across the face as the string began.
- **Cause, measured:** Bell_Idle holds the right hand before the shoulder at (-0.26, 1.28, 0.17) m (body space); the grip measured on
  `torchIdle` stands the bell up out of the fist, so its mouth was at (-0.22, 1.58, 0.24): 0.25 m before the face, square to it. The
  flail placed the coffin along the forearm's line, and with the coffin held at the chest the forearm points inward: at 0.07 s into the
  first blow the coffin was at (-0.33, 1.31, 0.56), across the face.
- **Fix:** the bell hand's wrist turned out 0.8 rad about the hand's own Y on every Bell_* pose (the stance, the string, the gestures,
  the busking body: `crucibelle.wrist`): the mouth at (-0.45, 1.52, 0.22), beside the head. The coffin flung along the line from the
  shoulder to the hand, its chain let out by the hand's speed (hanging while the windup is slow), and kept out of a 0.3 m column round
  the body.
- **Rule:** 37.

### 2026-10-07 · A kick off a ledge spent the double jump, and played the flip over the kick (Calissa)
- **Seen:** headless, a ledge hang caught from a jump, then Space: `airJumps` 1 before the kick, 0 one step after, the air track on
  Air_DoubleJump at 0.02 s (`.scratch/sc_kick.mjs`). From a ladder taken on the ground the same press kept it (1 after).
- **Cause:** the hang, the ladder, the pole, the latch and the grate read the kick from `P.latch('Space')` and ended; the core ran the
  same step and saw Space down with `jumpHeldLast` still false from before the hold, so it was a fresh press: an air jump whenever
  `airT` was over 0.05 s (caught in the air: yes; stepped onto from the ground: no, which is why the ladder hid it).
- **Fix:** each kick marks the press spent (`P.jumpHeldLast = true; P.jumpBuf = 0`), as the grapple's jump-off already did.
- **Rule:** 20.

### 2026-10-07 · The double jump's tuck lasted one frame (Calissa)
- **Seen:** the survey: `flipLoop` played for a single frame, its 0.2 s fade from `flipStart` overwritten the same frame.
- **Cause:** character.js handed `flipStart` to `flipLoop` at 0.75 s, and in the same frame `flipLoop`'s own exit (`vy < -2.5`, true by
  then on every air jump) handed it to `jumpLoop`: two `play` calls in one update, the first fade lost.
- **Fix:** the flip is one clip now (Air_DoubleJump, courier/anim/airborne.js), handed to the loop once, from its last frames; the
  handoffs are an `else if` chain (one change a frame).
- **Rule:** 39.

### 2026-10-07 · The stress test's edge-of-the-Dunes skiff runs ended inside the barrier (Calissa)
- **Seen:** stress seed 2, `edge skiff`: `guard:reset` after `tech.end`, and `guard:nudge` just after `skiff.summon` (none on main).
- **Cause:** the skiff's new phases set the Courier's position outright (the summon's step to the board's middle, the mount's walk on,
  the step down, the bail and the get-up), and at the barrier those places were inside it.
- **Fix:** every phase move asks `clearAt` first and keeps the last clear place; the tech's end puts an embedded Courier back there
  (courier/skiff/skiff.js).
- **Rule:** 36.

### 2026-10-07 · A ground pound broke the pots on the shelves above it (Calissa)
- **Seen:** headless, the unarmed V in the air over the workshop floor: `fist.hit` on 14 pots, `kick.hit { hits: 15 }`; the pots stood
  on shelves one to two metres up.
- **Cause:** the combo engine's ring (tools/moveset.js `ring`) takes everything within its radius across the floor, at any height.
- **Fix:** the kick's own ring (courier/moves/kick.js, `FistMoves.ring`) keeps to what is within 1.2 m above their feet and 0.6 m below.
- **Rule:** 40.

### 2026-10-07 · The shove played under the front kick (Calissa)
- **Seen:** headless, the unarmed pause string: for the first 0.5 s of the shove the active tech was still `launch`, and the shove's
  upper-body layer was drawn under the kick's held whole-body pose.
- **Cause:** a whole-body move's Launch ends when the move finishes or another whole-body move restarts it; a whole-body move followed
  by an upper-body one leaves it running out its time, its clip over the new move.
- **Fix:** the shove is a whole-body move (its clip's own step carried, `root: 'xz'`), so Launch restarts in place.
- **Rule:** 41.

### 2026-10-07 · The stress test caught the Courier in a ledge after a mantle (Calissa)
- **Seen:** the gate's stress run, seed 1: `guard:nudge` on cog0, the tech `launch`, `move.mantle` then `combo.move` 0.17 s later.
- **Cause:** a whole-body cutlass move began during the mantle; Launch's `endCore()` stopped the climb half way over the lip.
- **Fix:** the combo engine plays a whole-body move on the upper body alone while `P.mantle` or `P.freeze` (tools/moveset.js `carry`).
- **Rule:** 35.

### 2026-10-07 · The Solar Skiff's parked board had no chevron (Calissa)
- **Seen:** headless, F beside a parked board did nothing; `interact.cur` was undefined.
- **Cause:** the skiff tech registered its interact source in its constructor, and the techs are built before `game.interact` exists.
- **Fix:** the source is registered the first frame the service is there (`Skiffing.offer()`, courier/skiff/skiff.js).
- **Rule:** 34.

### 2026-10-07 · An air string would have ended at its second cut (Calissa)
- **Seen:** building the cutlass's air combo: the second committed move (a launcher straight into an air cut) dropped at once.
- **Cause:** `Launch.go` while the launch was on called `mgr.begin`, which stopped the active tech; its `end()` took the options `go`
  had just written, nulled them and called the new move's `onEnd`.
- **Fix:** a `go` while the launch is on restarts it in place (courier/moves/launch.js).
- **Rule:** 33.

### 2026-10-07 · A sibling sent to the Dunes walked into a wall and would not be told
- **Seen (the owner, v105):** asked Petra to go to the Dunes; Petra pressed against the workshop's wall, and asked to teleport, did not.
- **Cause:** "go" was an order that stands where told and is never warped, so no stuck check applied to it; the stuck check counted only
  a body that did not move, not one sliding along a wall; the answer was offered places in other regions (the Dunes is its own world,
  entered by travel) and had no order that warps.
- **Fix:** every goal measures its progress (`coop/follow.js`: six seconds without gaining half a metre) and a sibling told to go or hold
  is set down there, or gives up and comes back, and says which (`sibling.stuck`); "go" to another region is refused with the reason;
  a `warp` order (`/sib petra warp`, and the answer's) sets a sibling down beside you. With it, the deadlines and caps on the calls out
  of the page (coop/usage.js, answer.js, letters.js, guests.js). Measured headless: sent 40 m through the wall four ways, Petra
  warped twice and gave up twice (no ground there), within 6.9 to 12.5 s.
- **Rule:** 32.

### 2026-10-07 · A sibling in a fight was lost when the Courier travelled
- **Seen:** the stress test with the party (seed 2, run 13): Dovina more than 40 m away for half a second, the Courier in the Dunes.
- **Cause:** the fight's approach handed the follow mind the order "go" (stand where told, never warped), so a sibling chasing a foe
  was not set down beside the Courier when they went far.
- **Fix:** the approach is its own order, `engage`, warped like following (coop/follow.js).
- **Rule:** 31.

### 2026-10-07 · The game did not boot: "Cannot access 'COURIER_RIG' before initialization"
- **Cause:** `withFade(material, key, U = COURIER_RIG)`: the outline materials are made by `withFade` while `render/outline.js` loads,
  above the line that declares `COURIER_RIG`, and a default argument is read at the call.
- **Fix:** the default is read inside the compile hook (`own || COURIER_RIG`).
- **Rule:** 27.

### 2026-10-07 · In the Dunes the siblings never came: each step they fell, woke at the workshop and warped back
- **Seen:** the stress test (seed 2, with the party): 11,615 `sibling-lost`, the siblings at the body's spawn (0, 0, -11.5).
- **Cause:** a place sets its floor (`killY`) on `game.player` alone (world/places.js); a sibling's body kept the default -100, and the
  Dunes are 408 m down, so its own step called it fallen and respawned it at the spawn.
- **Fix:** a sibling takes its leader's `killY` each step, and its respawn is a warp to its leader (coop/sibling.js).
- **Rule:** 23 (every body in the place, not only the Courier's).

### 2026-10-07 · One sibling compiled eleven new programs
- **Cause:** the Courier's region materials carry the kiln's finish (`-fin-glaze` on their program key, `vfx/finish.js`); the sibling's
  copies did not, so each was a program of its own (145 to 156).
- **Fix:** a sibling is dressed by the vessel too, with a look of its own (`vessel.dress(rig, look, { own: true })`): one program left
  (a shadow's depth variant).
- **Rule:** 28.

### 2026-10-07 · The Heavenly Kiln's ring burned gold too soon
- **Seen (Petra, measured):** the ring turned gold, the flick's window, 0.78 s before the strike instead of 0.45.
- **Cause:** `vfx/garden/tribulation.js` used `B.flick` (the window's length) as the trace's flicker counter, so the window grew with every
  flicker.
- **Fix:** the counter is `B.frame`; `B.flick` is only the window.
- **Rule:** 29.

### 2026-10-07 · A merge in the cocoon tree moved its slot for good
- **Seen (Petra, measured):** after a merge, slot 0's pod hung where the two had met, for every cocoon after it.
- **Cause:** `vfx/garden/cocoontree.js` wrote the meeting point into the slot's only position, its rest.
- **Fix:** each slot keeps `rest` apart from `pos`; the merged pod hangs at `pos`, and opening it (or a fresh cocoon) returns it to
  `rest`. Measured: moved 2.57 m by the merge, 0.000 m from rest after the open.
- **Rule:** 30.

### 2026-10-07 · "The Lockheart catches spirit.bind."
- **Cause, measured:** the bus writes its own `name` (the event's) and `t` over a payload's (`core/events.js` emit), so every
  `spirit.bind`, `spirit.mature` and `spirit.release` line said the event's name, and `realm.name { name }` would have too.
- **Fix:** the spirit's name rides as `spirit`, the realm's as `realm` (`creatures/bound.js`, `world/garden/realm.js`, the rules in
  `tracking/garden.js`).
- **Rule:** CLAUDE.md's (payloads never use `name` or `t`); a spec's payload is checked against it before it is built.

### 2026-10-07 · The raid's brood, fed to the FOE, panicked the physics ("unreachable")
- **Cause, measured:** a brood reaching the FOE was fed and disposed inside its own `driven` callback, which `SlipJellies.update` calls
  per jelly; the loop went on to move the disposed jelly's removed body.
- **Fix:** `driven` only marks it (`c.reached`); `raid.update` feeds and disposes after the jellies' loop (`world/well/raid.js`).
- **Rule:** 26.

### 2026-10-07 · Old Nobody had no eye, a tail pinned to its middle and fins that never swept back
- **Cause, found by a sweep:** three edits in `vfx/leviathan.js` put a `// (...)` comment in the middle of a line, and the code after it
  (`head.add(eye)`, the tail tip's `setXYZ`, the fin's `rotateY`) was commented out. The same slip was caught three times while building
  `vfx/foelook.js` (the Decant lip never added) before it shipped.
- **Fix:** the comments moved to the ends of their lines; a grep for code after a mid-line `//` swept the new looks clean.
- **Rule:** 25.

### 2026-10-07 · Every Well floor taken down recompiled the outlines
- **Cause, measured:** taking a floor down (`wellkit.js` dispose) released three basic programs to zero users. The floor disposes every
  material in its group not marked `userData.shared`, and the outlines it carries are `OUTLINE_MAT`, one material for the whole game
  (`render/outline.js`): disposed, every outline in the game lost its program and the next outlined thing drawn compiled it again. It
  has done so at every floor change since the floors were outlined; the pots made the perf gate see it.
- **Fix:** the outline materials are marked shared where they are made (`makeOutlineMaterial`).
- **Rule:** 24.

### 2026-10-07 · Set down at Margarite's dock, the Courier was "fallen" and woke at the workshop
- **Cause:** the fall height was last frame's (the workshop's, -100 m); the next fixed step saw them below it and respawned them before
  main.js recomputed it for the dock.
- **Fix:** `places.stand` lowers `killY` under the point it sets them down (as `toDunes` does); main.js's own rule counts the dock and the crossing.
- **Rule:** 23.

### 2026-10-06 · Stains and paint drawn as squares (the brush load, headless shots)
- **Cause:** the paint map kept two alphas (paint, stain) in one texel and cells of 0.5 m, as coarse as a drop; filtered unpremultiplied,
  every edge blended toward black.
- **Fix:** one coverage channel, premultiplied RGBA8, 0.25 m cells (`world/ground/paintmap.js`); stains then moved to Calissa's own
  meshes (`vfx/stains.js`, `world/ground/stains.js`), out of the map.
- **Rule:** 22.

### 2026-10-06 · The paint event fired twice for one spray
- **Cause:** `brush.paint` was flushed on the release, and the drops still in the air landed after it and flushed a second.
- **Fix:** the flush waits for the last drop (`paintDue`, `tools/soulbrush/load.js`).
- **Rule:** 21.

### 2026-10-06 · The Rocket never launched, and the Hover started again in the same airtime
- **Cause:** the Rocket read the jump latch before the core filled it (and the test toggled the art through an imported config, a
  different module instance); once started, the core's own jump overwrote the launch. The Hover had no memory of having been spent.
- **Fix:** the Rocket detects the Space press itself and marks it spent for the core (`jumpHeldLast`, `jumpBuf`), and launches by
  `P.impulse`; the Hover is spent until grounded (`courier/moves/jets.js`); tests toggle by `/art`.
- **Rule:** 20.

### 2026-10-06 · The kick's bad loop and no blending (the owner's report, through Dovina; Calissa)
- **Cause (measured):** three things.
  - `Kick.animate` returned as soon as the state left `'kick'` (at 0.5 s), while the techs' weight was still easing out (`techs.js`, at 12 a second), so the body snapped back. The largest bone rotation in one frame was 159° (forearmL, at frame 31).
  - The CMU clips' pelvis stands 0.39 m (kick_a) and 0.97 m (kick_b) forward of the base pose's (0, 0.73, -0.04), so blending in threw the body forward. The pelvis's largest offset from the Courier was 1.21 m.
  - The capture's toes jump up to 50° in one frame.
- **Fix** (`courier/moves/kick.js`):
  - the last frame is held while the weight eases out;
  - a kick begun over the last crossfades from where the body was (0.12 s);
  - the clip's pelvis is taken relative to its own first frame;
  - the toes keep the base pose.

  Measured after, on the same run of kicks: the pelvis's largest offset 0.22 m (the kick's own step), and the largest rotation in one frame 34° (the right foot, mid-swing).
- **Rule:** 19.

### 2026-10-06 · A sandfall's curtain compiled in play (the perf gate's late compile, R46)
- **Cause:** the curtain is dressed on only when a floor is entered (`vfx/welldress.js`); the warm-up's stand-in floor had none. A
  first fix showed one in the warm-up and then disposed it, which released its program, so it compiled again in play.
- **Fix:** the warm-up's stand-in floor holds one falling curtain, parked hidden with the floor (`world/well/dunemaw.js` prewarm). Late
  compiles 1 to 0.
- **Rules:** 17, 18.

### 2026-10-06 · The dunes shot gained 94,000 triangles when the Weir's pond was tripled (the perf gate)
- **Measured** (the dunes shot's meshes by triangles, the head against the commit before): only `liquid-water` changed, 56,000 to
  149,568. The water surface (`vfx/water.js` `waterGeometry`) is four vertices a metre over the volume's bounding box, and the box grew
  with the pond (82 by 57 m); a third of the box is sand.
- **Fix:** the water mesh drops the triangles whose three corners are dry (`depthAt` <= 0; `courier/moves/env.js` `dryTrimmed`):
  291,398 in the shot (was 340,356; 253,616 before the pond grew). The rest is the owner's larger pond, recorded in the baseline.
- **Rule:** 14.

### 2026-10-06 · The Courier shook on slopes, worst running up a Dunemaw ramp (the owner, R46: "animations all fighting for dominance")
- **Measured** (`scratchpad`-style probe, 60 Hz, a 6 m over 18 m ramp): the hips' frame-to-frame unevenness was 20 mm running uphill,
  17 down, against 5.7 on flat ground. Split by part: the controller's own height stepped 6 to 59 mm a frame where 38 was due
  (its climb and autostep taking turns); the foot IK pulled the swinging foot to the ground and dropped the hips for it, the drop
  jumping from foot to foot each step; the reach correction pumped (40/s down, 10/s up).
- **Fix:** the grounded move is tipped onto the ground's plane (`courier/player.js` move); each foot's ground offset is sprung
  (FOOT_FOLLOW), the hips drop for the standing foot by the clip's contact and are sprung (PELVIS_FOLLOW), the reach correction has one
  rate (REACH_FOLLOW) (`courier/character.js` footIK). After: the controller climbs 41 to 43 mm every frame; the hips 4.75 mm uphill
  (was 20), 4.8 down (was 17), 3.5 on flat (was 5.7).
- **Rules:** 11, 12, 13.
### 2026-10-06 · The Courier semi-transparent after the trailer was skipped (the owner's report, R45; Calissa)
- **Cause:** the camera-near fade (`main.js`, `character.setFade`) writes one module-wide uniform (`fadeUniform`, `render/outline.js`),
  and the title's own Courier shares it. The trailer's opening close-ups (0 to 3.2 s) faded it to 0.2..0.6 (measured), and the title
  runs no world tick to set it again. A skip at 9.6 s or later never showed it, which is why the first tries could not reproduce it.
- **Fix:** no cinema shot fades the Courier (`|| game.cinema?.shots?.size`); leaving the trailer's world sets the fade to 1
  (`cine/overture.js` `leaveWorld`). Measured after: the fade never below 1 through the trailer, and 1 after a skip at 1.5 s.
- **Rule:** 15.

### 2026-10-06 · The mask's E-ink face rolled back (the owner, R45; Calissa)
- **Cause:** the bake kept the maker's shadow rim round every reshaped eye, so a lidded or cut eye showed the ghost of the whole one;
  the pupils were 15 px in a 116 px eye on the 512 px mask, judged in a close-up and never at play distance.
- **Fix:** reverted (`d4872d0`); the owner is making the atlas to puppeteer (ART.md, "The Courier's face").
- **Rule:** 16.

### 2026-10-06 · The Throwing Room's floor flickered (the owner's report, v86)
- **Cause:** the basement's east ceiling slab (`world/basement/basement.js`, top at y 0) ran under the whole room; the room's floor top
  was also at y 0. Two faces in one plane. A ray from the camera met both at the same distance. Also, the floor box had an outline
  hull, and the lane stood only 1 mm over a plank.
- **Fix:** the ceiling slab goes round the room's footprint; the floor has no outline; the lane 1.5 cm over the planks, the ring 1 cm
  over the lane.
- **Rule:** 1.

### 2026-10-06 · The Throwing Room's zone would have rained indoors and silenced the music
- **Seen (before shipping):** with a `testroom` zone, `weather.placeOf` and the music chooser asked `zoneOf`, got 'testroom', found
  no place and no cue.
- **Fix:** `zones.whole`; the weather and the music ask the whole (Dovina's and Wanda's one-word fixes).
- **Rule:** 2.

### 2026-10-06 · The Dunemaw playtest failed on some days only
- **Cause:** the Dunemaw's floors are the game day's (`wellSeed`); the playtest did not pin the calendar, and on four days of six the
  way up was farther than the agent's 30 sim seconds.
- **Fix:** the playtest pins the calendar (`--clock`); a walk across a floor gets 90 sim seconds.
- **Rule:** 3.

### 2026-10-06 · Slopes in the Dunemaw stalled the Courier to 0 m/s
- **Cause:** sand ripples (0.2 m, 3.2 m crest to crest) laid on a 23 degree ramp made 44 degree crests, at the controller's 46 degree
  climb limit. Measured with the controller's contact normals.
- **Fix:** ramps carry no ripple; their ends are rounded; flat lanes from doorway to doorway.
- **Rule:** 8.

### 2026-10-06 · The agent wedged against an arch's pilaster
- **Cause:** a route to a doorway's middle ran along the wall from the side; the new pilaster stood 0.45 m proud of it.
- **Fix:** the route passes a point 1.8 m in front of each doorway on each side.
- **Rule:** 9.

### 2026-10-06 · The testing room cost a shader program of its own
- **Cause:** the spray wall's dents were an InstancedMesh with a MeshBasicMaterial (the only instanced basic material in the game),
  and the console's wood was flat-shaded.
- **Fix:** the dents are one plain mesh written in place; the wood smooth-shaded.
- **Rule:** 5.

### 2026-10-06 · Perf "regressed" by 25 to 45 % in every zone at once
- **Cause:** a new container: the published build measured on it ran as slow as the head.
- **Fix:** none needed; the baseline re-recorded with the reason.
- **Rule:** 4.

### 2026-10-06 · An achievement's sub-category not in CATS (boot page error)
- **Cause:** a rename done in one of five places; the stress test's page errors were not read.
- **Fix:** all five renamed (Espada).
- **Rule:** 10.

### 2026-10-06 · Doubled Lachryma tools in the Pneuka Box
- **Cause:** the save kept section records as live references to the box's arrays, so restoring after a hold re-added tools.
- **Fix:** records are JSON copies at the write; `box.reconcile()` removes extra copies.
- **Rule:** 7.

### 2026-10-06 · The title's Clapperjar stood behind the Courier whatever its position said
- **Cause:** a skinned model copied with `.clone()` stays bound to the original's skeleton.
- **Fix:** `SkeletonUtils.clone`.
- **Rule:** 6.

### 2026-10-06 · Mirroring the Crucibelle to the other hip flipped its bell
- **Cause:** mirroring as M·G·M also mirrored the tool's own axis.
- **Fix:** mirror the socket, then flip the local Y (`mirrorSide`).
- **Rule:** when mirroring a held thing, mirror where it is, not what it is.

### 2026-10-07 · "Oscillator.frequency … 24890.2 outside nominal range" in every phase of the garden sweep
- **Cause:** the garden's birdsong plays the celesta up to MIDI 99 (2,489 Hz); the celesta's tenth partial is 24,890 Hz, over the
  Nyquist limit (22,050 Hz at 44.1 kHz), so the browser clamped it to a 22 kHz tone. Traced by wrapping `AudioParam.setValueAtTime`
  in the sweep's page to log any value over 22,050 with its stack (`Band.osc` from `Band.celesta`).
- **Fix:** the struck instruments built from partials (celesta, marimba, bell, tabla) drop a partial at or past half the sample rate.
- **Rule:** an additive voice skips any partial `f * r >= sampleRate / 2`: a high note loses its top overtones, never gains a whistle.
