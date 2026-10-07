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

## Cases

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
