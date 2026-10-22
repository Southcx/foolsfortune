# The casebook: every bug fixed left a rule

One rule per fix: what keeps a bug from happening twice. Read the rules before building in the same area; a rule a machine can check
goes into `npm run check` or a test too (the owner, 2026-10-06). Each rule's case (what was seen, the cause measured, not guessed, the
fix) is in `docs/CASEBOOK-CASES.md`, cited by its **Rule:** line; a new case goes at that file's end.
A new rule is written `NEW:<slug>` (here, in its case's **Rule:** line, and wherever it is cited) and numbered at the gate by
`scripts/casebook-number.mjs`; `npm run check` fails on a number used twice or a rule a case cites that is not here (2026-10-11).

## The rules, short (their cases: docs/CASEBOOK-CASES.md)

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
    (`places.stand`, `course.toDunes`). And it sets them down on what stands there (a deck, not the seabed under it), within reach of
    what F does there and of nothing else, and never out of a mode that owns the body (a crossing): it refuses instead.

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
    one place a tick (two readers of P opened the box as the other closed it). Whatever closes or picks on a key spends it,
    for the body too (`input.spend(code)`: the press and the Courier's latch), or the place under the Courier opens it again.
49. **Nothing opens under a cover, and a cover always lifts.** A page asked for inside a seam waits until the seam is up; the seam runs
    whatever early return the frame takes. What a place changes of the world (the camera's up, the sky) it puts back on leaving.
    One window at a time: every opener asks `game.windowOpen()` (a window, the kiln's, the dialogue box, a seam, a crossing) unless
    it is closing itself.
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
54. **A blow sends a thing the way the blow goes.** melee.js gives the direction along the swing, a blade's cut; a thrust (a jab, a
    front kick, a shove) drives what it strikes away from the striker, and a swung blow keeps only its share of the swing. Read the
    knock off a stub creature headless (its `knock(v)`), not off the code.
55. **A hook laid over the engine's calls the engine's.** A tool that adds to a carrier's options (`poseFix`, `drive`, `onEnd`) wraps
    what is there; replaced, the engine's own work in it (the join's fade from the last pose, and the pose kept for the next join)
    silently stops, and the next move inherits the stale state.
56. **A pose that cannot be crossfaded to the next in a fifth of a second leaves by its own way out first.** A seated body blended
    straight to a standing one passes its legs through the floor; a way in left partway leaves from as far into its way out as it had
    still to go, never from the way out's start.

57. **A view that follows a thing lets go of it while the hand holds it.** Whatever the cursor moves must not move the camera the
    cursor's ray is cast from, or each frame chases the last; and what the hand holds stays on the near side of the ground.
58. **A model two modes share is set up by the one drawing it, every frame it draws it.** The god hand and the garden share the Jar's
    model; whichever leaves last must not decide whether the other sees it. Its clip too: the mode drawing it picks the clip, and
    entering the garden starts the Jar at idle (a dismiss held at its last frame, the root at nothing, never carries over).
59. **What a thing adds to the scene, its own dispose takes away, all of it.** A rig that hangs two roots from the scene (the body
    and the gun) has a `dispose()` that removes both; callers never take it apart by hand.
60. **An adapter is not the thing.** A registry's entry (the belt's tool) answers the registry's questions; to reach the thing's own
    state (the Sondelass's Blade Mode), ask the thing's own service (`game.techs.get`), and check the call did something.
61. **A shortcut to a shared folder is never committed.** A worktree's link to `node_modules` (or any folder outside the tree) is
    named in `.gitignore` as a file as well as a folder, and a commit made with `add -A` is read before it is merged.
62. **A motion written as a curve of time has a floor, and the next stage starts where it stopped.** A wait the player controls (a
    menu left open) can be any length: a fall that grows with it is bounded by an easing that ends above whatever it falls toward, and
    the stage after it reads where it hung, never its own start again.
63. **An export moves a child by its matrix against its parent, never by its location alone.** Blender keeps part of a parented
    object's place in its parent inverse: zero the location and the inverse still carries it. Keep `parent.matrix_world⁻¹ @
    child.matrix_world`, clear the inverse, and have the export print where each mesh stands on its rig (a skinned mesh off its rig
    turns about a far pivot, and reads as stretching).
64. **What stands on a surface stands on its normal.** Tilt it from up to the surface's normal under it (analytic where the surface
    is), its yaw and its clip on top, and measure its rim against the surface: on a bent surface one tilt leaves the rim apart from it
    by half the bend times the reach squared, so let it down by that where the surface falls away, and say what is left.
65. **What a fight makes, the fight takes down, dead or alive.** A list of things a moment spawned is kept until each is gone from the
    scene; dropping the list when the last falls leaves the fallen in it (a `once` creature is never re-formed by its pool). Taking
    down is idempotent: a second `dispose` does nothing.
66. **A handoff is deleted with the work, never instead of it.** A note leaves `docs/handoffs/` in the commit that does what it asks,
    or with a line in the reader's reply saying why not.
67. **An answer reads the window it answers.** A check that runs every frame of a press (the parry's window) tests the thing's own
    timing too (a windup's eta), or holding the button early answers what has not yet come.
68. **A pose built for a camera is built in the camera's convention.** `Object3D.lookAt` turns a plain object's +Z to its target and
    only a camera's (or a light's) -Z; a target pose for a camera is made with `Matrix4.lookAt(eye, target, up)`, or on a camera.
69. **A rig with its own clips is moved by them alone.** The code places the group it stands in (where, which way) and nothing more: no
    scale writes, no squash spring, no procedural pose under or over the clips. Its joint limits are learned from those clips (none of
    their frames clamped), and anything laid on it (a crack, a decal) is skinned to its skeleton, never left rigid beside it.
70. **"At the foot of" is found by a ray, never a fixed offset.** A thing laid beside a prop of varying size and lean is placed where a
    ray down from above meets the ground it was meant for (open sand, not the prop), trying bearings until one does.
71. **Know what a number measures before acting on it.** perf's heap is the dev page's (code and source maps included); a player's
    memory is the built page's. A budget over on the first is checked against the second before anything is cut or raised.
72. **A material's `clone()` keeps its numbers, not its shader.** A Standard or Physical material's copy resets its defines to
    `STANDARD` alone, and no copy keeps `onBeforeCompile` or `customProgramCacheKey`: a material dressed by a define (the rim) or a
    hook (the grey tint) is cloned with what carries them over (`vfx/greytint.js` `cloneTinted`), or dressed again after, and the
    copy's defines are read once headless.

73. **A stretch cut from a lean clip is sampled, never cut by keys.** `AnimationUtils.subclip` keeps only the keys inside the stretch; a
    lean export keeps few keys (a straight line is two), so a bone with none inside drops out of the held clip and falls to its rest
    pose. Sample every frame of the stretch through each track's own interpolant (`RigClips.cut`), and test a held move against the
    full clip at the same frames (the largest bone difference, the largest step at the seam).
74. **A clip chosen by a state reads the whole of that state.** The catch's `held` is let go of the moment the Figment is drawn in, 0.45
    s before it is bound: the Jar must read the look's `take` too, or its lid shuts and opens again for the gulp.
75. **A chooser asks the phase, not only the name.** A move that is named is not a move that is playing: in its way out, or done, it is
    not held, so wanting it again plays it again (`GodHandClips.choose`).
76. **An outline grows with the bone that carries it.** The inverted hull's offset is added before skinning (render/outline.js), so a
    bone that scales a piece open (a collapsed flare or sigil scaled a thousandfold) opens its outline a thousandfold too: a piece a
    bone scales past its rest by more than a little is never outlined.
77. **What waits to be mounted waits where it was left.** A phase that brings the rider to a thing (the skiff's mount) moves the rider
    and leaves the thing; whatever drew the thing at the rider's own position in the other phases is told so.
78. **A compile made between frames is made after an empty frame.** `compile` and `compileAsync` read the clipping state the last render
    left, and an offscreen pass that clears the renderer's planes (the trail map's) leaves none until the next draw; a piece compiled
    lazily renders an empty scene into the frame's own target first (as main.js's warm-up does), else its programs are built for no
    planes and again, for the God Hand's one, at their first draw.
79. **A table read round by index is fed numbers from its own range.** A lookup that wraps (a colour for each scale degree) aliases
    anything wider: a seven-step scale read through five colours showed the "true" gold five steps off. Read it from the set it was
    made for, or clamp, and say which.
80. **A mark the player reads is read where the player sees it.** What a strike measures must be taken at the surface the crosshair
    meets, not at a line through the thing (a crystal's axis): a look pitched down meets a column's skin higher than it passes
    its axis, and the colour under the crosshair was a fret off. Measure the mechanic against the render, by a ray into the mesh.
81. **A look in colours of its own owns its glow too.** The armour and the mask glow back their painting in the emissive, which every
    other glaze sets to its own colour; a kiln pattern that paints a part in several colours gives each its own glow, and anything
    else that borrows the emissive (the firing's kiln-orange) is looked at on it before it ships. What it does to the emissive is done
    before the emissive map (`LIGHT_BEFORE`), never after: the light other code adds right behind the map (the cracks' Lachryma, the
    mend's gold, `kintsugi.js`) is nobody's colour to multiply.
82. **A mode never writes another mode's state to borrow its look.** A field one system keeps (the garden hand's `held`: the body it
    holds) is set by that system alone; a pose wanted elsewhere is read from the borrower's own state by whoever draws it.
83. **Parts that meet are placed in one frame.** A spout and its basin, a press and its bath: stood each on its own ground, a planetoid's
    curve puts them a metre apart; stand them in the frame of the one that must be level, and give the other a footing.
84. **The glow round a light is a falloff, never a low-poly sphere, and where it hangs on a surface it lies over it.** A sphere's silhouette is a hard
    polygon at any opacity, and a camera-facing glow cut by the plane it hangs over is a straight edge: draw a soft radial sprite, and
    with the depth test off (drawn after what it lights) wherever it sits within its own radius of a surface.
85. **A fold the player did not choose never goes through the setter that keeps their choice.** A feature that folds a window while it is
    up asks for the fold without keeping it (`log.setMini(v, false)`), so closing the tab mid-feature leaves their saved choice as it was.
86. **A dressing laid on the ground ends at its own edge, never in a margin of its colour at zero height.** A bank of sand, a drift, a
    stain that falls to nothing still shows its colour where it is flat; on a floor not its colour that margin is a pale square. Cut
    it away along a wandering line (or fade it, if a program can be spared), and look at it on every floor it can stand on.
87. **A canvas painted from a `THREE.Color` takes the colour's sRGB values.** `.r .g .b` are the renderer's linear working values: written
    as CSS they paint far too dark. Use `getRGB(target, SRGBColorSpace)` or `getStyle()`, and shift a shade in sRGB (`getHSL` /
    `setHSL` with `SRGBColorSpace`), where the eye judges it.
88. **What is not drawn is not offered.** A thing hidden for a reason (a shut room's stele, a floor that is gone) is left out of what F
    can take or read: the offer asks `visible` as well as the distance, or the interact chevron stands over a wall and the find is
    made through it.
89. **A skipped call leaves its work owed.** A throttle that drops every other call (a counter's parity, a cooldown) drops whoever
    lands on the skip, the same one each time when the callers come in a fixed order, and a caller that clears its own flag first never
    asks again. Make the work cheap enough to do at every call (redraw only what changed), or keep the debt per thing and clear it when
    the work is done.
90. **What lies on a surface is drawn on that surface's own mesh.** A layer over the ground (water, a film, a decal that follows it) is
    built on the ground's vertices and triangles, lifted along them, so the two can never cross between vertices; a mesh of its own,
    coarser or finer, pokes through or hides where they disagree. Its edge is cut by a value interpolated across those triangles (a
    depth), never by dropping whole triangles.
91. **What stands on a surface listens for the surface.** Anything placed on ground that can move (plants on the clay, a marker on the
    water) is placed again when the ground's version changes, not only when its own state does; test it by moving the ground under it
    and measuring the gap.
92. **An instance never drawn has nothing to normalize.** A pooled instance's unset attributes are zeros, and `normalize(vec3(0))` is NaN
    in a vertex shader: what a GPU does with a NaN position is undefined (SwiftShader drops the triangle; another driver need not). Guard the
    length (or move the dead instance outside the clip volume) before it is divided by; read every pooled shader for what its zeros do.
93. **A double-sided transparent material is two programs unless it is told to be one.** three.js draws it back faces then front faces,
    and the two passes differ in the program's key (`flipSided`), so both compile; a sheet or a ribbon has no second layer to order, so
    `forceSinglePass: true` draws it once and compiles once. Count a new material's programs in the warm-up (`npm run perf`), not its materials.
94. **A line said on a state's edge needs hysteresis.** Where a state can flicker (brimming at sea, overflow after overflow), say it on
    entering and say its end only after it has lapsed a while; a flicker is one spell, never a pair of lines each time.
95. **A ray from the eye picks only what lies beyond the one who shoots.** What the cursor's ray crosses between the camera and the
    ship is not what the cursor means; the pick starts past the shooter.
96. **The scene is compiled once, by the boot's warm-up.** A module that compiles the whole scene itself while the game is still being
    built compiles every material in it for the state of that moment (no cutaway plane, three lamps, flat shading), programs no frame
    draws with, and each lives as long as its material. `compile` takes hidden objects too and the prime draw shows them, so a look made
    at boot needs no warm-up of its own; a look made later compiles its own group, after an empty frame (78).
97. **A rule's effect is applied where the rule lives, once.** When a pure module owns a rule (trip.js's mend on arriving at an
    encounter), the world calls it and does not apply the same number again on its own; the world acts only on what the rule asks.
98. **A turned frame turns about the rider, not the track.** A figure that rolls or pitches the rail turns about the heartline (where
    the ship rides), or the ship is swung through the sea's surface.
99. **What one frame hands another is all of one frame.** When part of a camera's shot is read by reference (this frame's) and part
    copied (last frame's), the two disagree at any discontinuity; hand all of it the same way.
100. **What lies in a place that is taken down goes with it.** A thing a place leaves in a list (a sherd on a floor of a Well) is
    dropped when the place is: listen for the place's end (another floor, the way out) and forget what it held.
101. **A grid on a sphere meets itself at the poles.** Read the last row round a pole as one point (its mean) near the pole, never
    along one longitude, or the ground creases there.
102. **A merged line is the same line.** The log folds a repeat into the line before it (a count); a different line under the same key is
    its own, or the second's words are lost.
103. **The storm bends the world, never the danger, and the danger is marked where it is built.** Every material of what hurts or is
    aimed at (a shot, an outlined shot and its parry mark, a reticle, a lock mark, a hurtbox mark) goes through `keepTrue` at its
    owner's build (free on a transparent one; an opaque one costs a program, so say it); a big object the storm seats moves less than its
    smallest part's radius (`STORM.seat`), because a hurtbox is where the logic puts it. Measure it: render with the veil on and off,
    the danger isolated by differencing with and without it, and read its shift in pixels.
104. **A wrapped `onBeforeCompile` keeps its old code in its program key, taken before the wrap.** The default
    `customProgramCacheKey` is `this.onBeforeCompile.toString()`, read late: once the hook is wrapped it is the wrapper's text for every
    material, and two wrapped materials of one kind with different old code would share one program.
105. **A mark the player must read carries a light part and a dark part.** The black crude and the gold storm are both grounds at sea:
    a danger drawn only dark (ink on the ink sea) or only as added light (white on the gold) vanishes on one of them. Give it both (an
    astral shot's dark rim, an umbral shot's pale rim, the outline's film beside its ink, a ribbon's shade at its edges) and render it
    over both grounds before calling it done.
106. **What a mark draws from a number, it draws from the thing's own, never its place in a list.** A packed list is rewritten every
    frame: when one entry ends, every entry after it takes the one before's index. A film's phase, a flicker's offset, a wobble's seed
    taken from the index changes colour for every mark behind the one that ended; take it from the record (its pool slot).
107. **A mark that says "this, now" is asked whether it is still true, every frame.** A telegraph closes on a part that can act and on
    a bar that will fire; the part downed, the fight ended or the volley that will not come takes the mark with it (`alive`), or the
    player learns to ignore the one mark they must not.
108. **A warm-up puts back what it moved.** Whatever is moved, scaled or re-parented to be compiled is put back where it is hidden
    again; never trust each owner to reposition its look every frame (a look drawn in the world's own frame never does).
109. **A quad built in screen space keeps its winding.** Its across axis is the along axis turned clockwise on the screen ((x, y) to
    (y, -x)); turned the other way the quad is mirrored, faces away and is culled on a one-sided material.
110. **A warp's door names who is not let in.** The storm bends the world, never the danger: whatever is shot at, hurt by or locked on
    (an eye, a shot, a hurtbox) is made outside the warp's family and is handed only to its own hook (`warpWith`'s `keepTrue`).
111. **A colour pinned to the world is for things that stand.** Anything the rail carries through the world (the school, the geometry
    placed in the rail's frame) takes its stone's phase from itself (its local position at its size, plus its own seed), or the colours
    cycle at the rail's speed.
112. **A mark sized from a projection is clamped, and a flag that draws a mark is eased before it reaches the look.** A streak as long as
    five fish, however close the camera, and a strike's 0 / 1 flag, are a flash on the screen in the one frame a group turns on. And a
    rate is never driven by an eased number: the phase swings by the clock times the change.
113. **A mark a model lays in the world rides in the model's group, counter-moved, so it is warmed and hidden with it.** A shadow or a wake
    added to the scene on its first use compiles in play and outlives its model's `visible`. And count a material's settings, not its
    class: a transparent `DoubleSide` material draws twice (back faces, then front) and is two programs, and `fog: false` is a third;
    match a material the game already warms (`renderer.info.programs` before and after), or set `forceSinglePass`.
114. **What a portent does not show, no part of the drawing shows.** A picture made from the truth beside what is shown leaks by its side
    channels (a lane's length, an offset, a draw order): draw twice with only the hidden fields changed and compare the pixels
    (`scripts/seachartlooktest.mjs`: one waypoint at a time, its type, strength and a dim star's feeling). Nor
    what the record never held: an unrecorded strength is not drawn as a default one.
115. **What is made of a canvas is kept on the canvas.** A scaled or blurred copy lives in a `WeakMap` keyed by its source; a `Map` keyed by the
    canvas, emptied at a size, keeps every canvas it ever saw. Count the canvases alive after a GC (a `createElement` wrapper and
    `WeakRef`s): their pixels are outside the heap, and the heap's number will not show them.
116. **A hook is read by someone.** A name set on `userData` (a stage's `dispose`) is a promise only the one who takes the thing down keeps: grep
    for who reads it before relying on it, and measure `renderer.info.memory` before, while and after leaving, more than once.
117. **A class a module exports has a name no other module of the game exports.** The glossary calls the pier's window `SeaChart`; its drawing
    took the word for a class, and the one module that imports the one declares the other. Grep `export class` and the glossary first, and
    qualify (`SeaChartCanvas`).
118. **A look made on the workbench is judged once on the ground it will stand on.** The workbench's floor is near black and its light
    strong; the Spirit Garden's ground is pale (225, 230, 180) and its light soft. A colour chosen against the one is wrong on the
    other (a "darker, lusher" ring that was near black read as a hoop), so a look for a place is placed in that place by hand, in its
    own light and on its own ground's normal, before it is called done.
119. **A clock a shader's sine reads wraps at a whole number of that sine's periods, and a step that is not a number is no step.** A
    uniform wrapped at 3600 real seconds jumps the phase of `sin(0.7 t)` (2520 rad is 401.07 turns) by the fraction left over; and `NaN` added once
    stays in a running clock for good. Wrap at N whole periods, add only a step above zero, and keep a setter's old value when it is
    handed a number that is not one.
120. **A shader patch says where its declarations go when the anchor is missing.** A function that splices code into another program
    at a chunk (`#include <common>`, `<project_vertex>`) checks for every anchor it uses; a program of its own that ends in one chunk
    but has no other (a ShaderMaterial) gets the head put first, never silently dropped. Prove it on the material it was written for,
    in the game, with the console's shader log read.

121. **A look's clock is the frame's own, passed down.** A look that animates by a clock (a shader's time, a scroll) is handed the
    frame's real step by whoever draws it; a constant standing in for the frame (`1 / 60`) runs it at half speed at 30 frames a second
    and double at 120. Where a draw is only a redraw (after a clear), the step is nothing, not a frame.

122. **A camera-facing quad is never square to the eye, never at it, and never trusted to alpha to coverage on a software rasterizer.**
     Lean billboards a little in depth (toward the surface they stand for), shrink them away near the eye, and ask the renderer's name
     before turning on alpha to coverage: SwiftShader, which every headless check runs on, stripes the first and speckles the last, and a
     look that cannot be verified headless cannot be judged.
123. **A height asked of the crude sea is the world's, its own y in it.** `CrudeSea.heightAt` returns `this.y + the swell` (the Emocean's sea
    lies at -420), so a thing placed *relative* to a parent that already stands on the sea takes `heightAt(...) - parent.y`, never the bare value.
    On the workbench the sea lies at y 0 and the two are the same, which is how the wrong one passed there.
124. **A wrapper that adds to a program's key makes a new program of every program it touches; a look of a few lines shares its family's.**
     The storm's `warpMaterial` (and any chained `onBeforeCompile` with its own key) on a material of the game's shared basic-map
     program is a program of its own, two if it is transparent and both-sided: give a mark that rides a body the body's seat instead,
     and wrap only materials whose program is already their own. A flat look with the same settings and vertex shader as another
     (a ribbon, a band, a smoke thread) is a branch on a uniform in that one program (`vfx/ribbonlight.js`), never a ShaderMaterial of
     its own. List the boot's programs by name and cache key against main's before calling a branch's count its own.
125. **An Esc a window spends is not a pause.** The pointer's unlock can land after the window has closed; a lock change read
    alone cannot tell it from the player leaving, so the window marks the moment and the pause waits past it. The mark is taken
    first, by the earliest listener, so no window's own handler can stop the key before it is marked.
126. **A test's seed names no game day.** What the calendar lays (a sea chart, a Well's floors) changes with the real hour; a test that
    depends on it pins the clock (`?clock=`) as perf does, or its seed means a different world each hour.
127. **A point fixed in the world is found in the world and carried into a moving frame, never written as the frame's numbers.** A
    rail frame that banks, rolls or loops tilts its own axes: a centre "across" a banked frame lies under the sea, and a height "up" it
    leans. Find the point from what does not tilt (the heartline and the heading), add world heights in the world, then `toLocal`.
128. **Two meshes that meet on a curve overlap; they never abut.** A ring of chords lies inside its circle and a camera-following grid
    never matches a fixed one, so a seam cut on the circle opens a sliver onto whatever is under the world (the sky's dome, from above).
    Run one a few metres on under the other and let it win their shared ground by polygon offset (a state, not a program).
129. **A way of turning is measured on the thing, never read off a sign.** three.js's positive rotation about y takes +x toward -z, so
    it turns the world's `atan2(z, x)` the other way; a look that turns "with" a flow, or a flow "with" a ship, is checked by reading each
    one's angle in that one function over a few frames and comparing the signs (a look's own `sense`, +1 or -1, carries it to all of them).
130. **A boss is proved by a shooter, not by its place.** A target checked only for where it stands can stand where no view
    shows it and no gun reaches; its test fires at it (a scripted expert) and reports when it falls.
131. **A removed doc is hunted by its bare name as well as its file name.** A list that writes `LOOK` where a path writes `LOOK.md`
    slips past a grep for the path; before a doc is deleted, grep its name alone (and in capitals) and every list of docs.
132. **A window's keys need a way in as well as a way along.** Tab is spent by the game (`core/input.js`), a list of focusable things is
    not reached until something puts focus on it, and a window drawn again drops focus and scroll: the first arrow enters the list on the
    screen, a keyboard pick gives its focus back to the card that was picked, and a redraw keeps the window's scroll. A test for a window's
    keyboard starts with nothing in focus; it never calls `.focus()` to begin.
133. **What is shown for a thing that can vanish is tied to the thing, not to its events.** A tip placed on the body hides on the pointer's
    leaving; a window shut or drawn again sends no pointerleave and no blur to what it hid or removed. Follow the thing each frame while the tip
    shows and hide it when the thing has no boxes (`getClientRects().length === 0`) or is gone.
134. **A view model converts every field a row carries, not the one that was noticed.** A table kept in the crossing's own clock is told in
    real seconds in its cooldown and in its prose (`ui/mountcards.js` `inSeconds`); a picture is judged at 1x on a dark ground and a pale one,
    where a two-pixel-high row of dots reads as an ellipsis.
135. **A thing shown while a window pauses the world is ticked by that window's own branch of the loop, and judged with the window
    open.** A look that fades in or moves on a clock stands at nothing if the loop returns before it; a picture proved only after the
    window has shut proves the picture, not the choosing. Name what the window calls, and photograph it with the window up.
136. **A hover is the pointer's state, and a window shut under the pointer sends no leave.** Whatever a hover set is set back by what
    owns it when the window closes (read in its own update), never left to the pointer's leaving.
137. **A state is modelled as that state, never as another state scaled toward it.** A furled sail is canvas stowed on its spar, not
    the sail squashed to a fifth of its height (which keeps its whole width: a board 4 m long with its emblem squashed into a decal);
    a sheathed blade, a folded wing or a shut lid likewise. And a look is judged from where a person stands beside it (the jetty
    walker's eye, inside the height of what is moored there), not only from the stage's own views of it.

138. **A writer to a store writes the shape its reader draws.** A document the page renders is written in the fields the renderer reads
    (QAIS's Brief: `division`, `build`, `lines`, `waiting`, `at`), and read back through the page once after the first write.

139. **A window that wants Esc frees the mouse.** While the pointer is locked the browser keeps Esc; a window that ends on Esc
    (the talk, the kiln) releases the lock itself when it opens and takes it back when it closes.
140. **A zone's bounds take in its own walls.** A box is filed by its centre; a wall centred outside the floor's edge falls to the next
    zone and is hidden from inside. Bounds reach past the outer faces, and a wall shared with another zone gets a lining of its own.
141. **A thing drawn on another reads the other's numbers.** A board, a label, a decal on a stone takes the stone's position from the
    stone's constant, never a copy of its numbers, or it stays behind when the stone moves.
142. **No overhang ends on another's face.** A slab that overhangs into a neighbour's wall puts its end face in the wall's plane;
    stop it at the wall, or a band fights at the joint.
143. **"From the front" is judged by where the striker stands.** A blow's `dir` is each tool's own convention; a facing test reads
    the striker's position (`from`, else the Courier).

144. **Nothing heavy is built and thrown away at a line the player crosses.** A model made on approach is kept (hidden) on the way
    out and let go only far off; a radius test that means "this floor" says so in height too.
145. **No whole-scene pass runs in one frame on a timer.** A periodic scan walks a slice a frame, and two of them never share a
    frame; what has not moved keeps its last answer.
146. **A refused pointer lock is asked again by the next window to close.** The click-to-play card waits until no window is up; a
    window's close asks for the lock whenever it is not held.
147. **The engine's autostep is not trusted alone.** A body pinned against a lip under the step height is stepped over by the game's
    own step-over, felt for at the lip's height.
148. **A rule the player cannot see is not working.** A block, a resist or a refusal shows itself at the point of contact (a mark, a
    sound) and is counted in its line.
149. **A mark is drawn with an alpha.** Light added at alpha 0 writes nothing through this pipeline; every style of a mark carries
    one, and a new style is proved by counting the pixels it changes.
150. **A helper that scales numbers is never handed names.** A table's numbers and its words go through different helpers.
151. **A key that opens a development window is heard first.** F8 is taken in the capture phase, before any window's own keys, and
    a window up is no reason to refuse it; only the title, the workbench and a seam are.
152. **The browser's refusal is not the player's choice.** A pointer lock refused (the cooldown after Esc) says how to take it back
    and takes it on the next click; it never opens the pause menu.
153. **A window that takes typing takes the mouse.** The chat line typing frees the pointer and its tabs answer a click; closing it
    asks for the lock back.
154. **Whatever borrows a shared light gives back all of it.** Place, aim and frame are saved together and restored together, the
    moment the borrower's area is left, not when its fade ends.
155. **The log names a thing by its own word, and a dummy is never counted.** An outcome line maps every `what` it can be sent;
    the filter that keeps the Throwing Room out reads every field that can name it (`kind`, `what`).
156. **A blow turned aside builds nothing.** A guard's `hurt` returns `'blocked'` and `creatures.strike` stops there: no mind, no
    status, no stun.
157. **An impact is measured against the surface it lands on.** A landing's hardness is the speed into the ground's own motion
    under the body (a slope falls away too), never the bare fall speed.
158. **An object's `visible` is the zones' answer too: an update never stops on it.** The zones (render/zones.js) make `visible` a getter
    that reads false while the object's zone is not drawn; an update that returns on its own object's `visible` never moves it out of
    that zone, and it is hidden for good. Keep the shown state in a number of its own, and mark a HUD (or anything moved to the eye)
    `zoneFree`.
159. **A scrolled texture's offset wraps where every reader of it turns whole.** An offset kept in 0..1 is a seam for any reader that
    multiplies it by something that is not a whole number (a second octave at 1.6, a cirrus at 0.4): when it wraps, that field jumps.
    Wrap at a whole number every multiplier turns into whole repeats (5 for 1, 1.6 and 0.4), or keep an unwrapped sum.
160. **A turn's sign is proved by where the part ends up.** A limb that should swing forward is measured (its tip's position in the
    thing's own facing, +z where it stands) and looked at from in front and the side, never read off the sign it was written with.
161. **A telegraph is judged from where the blow is answered, with its mark on.** The part that carries the parry mark stays in sight
    from the striker's place for the whole wind-up (rendered from in front, with the mark), never behind the body it belongs to.
162. **A mark is hidden by what hides its thing.** A world mark on a creature is depth-tested by default and drawn so its own body
    never hides it; one that shows through walls says so (`throughWalls`) for a reason the player can see (a scan's marks, the Reveal
    song's), and on the rail every one does (no wall stands there, and a mark set in a foe's own body is hidden by it). An offset
    that depends on the eye is applied per camera as it draws (`onBeforeRender`), never once in the update: another camera sees it
    displaced.
163. **A look asked for by name falls back to a plain one.** A glyph kind, an effect or a sound a table lacks is a wrong look and
    nothing else, never a thrown frame that stops what the caller was doing; the one place that reads the table picks the fallback.
164. **A model scaled is a look judged again, from where it is now seen.** Whatever its shaders and effects measure in metres (a
    world-space phase, a particle's size and speed, a gravity) is put against the model's own size, and every face the old size hid
    (an underside, a back face, a silhouette's facets) is looked at from the new eye line.
165. **A probe is never cast down a grid line.** A ray that samples a heightfield or a tiled level on a regular grid is nudged off
    the grid's lines (a few millimetres on no grid a level uses); a miss over solid ground is a bug, never open sky.
166. **A warm-up's stand-in is a look the game still draws.** When a look leaves play (drawn now by another module), its stand-in
    leaves the warm-up in the same change: a program compiled at boot for nothing is a program the budget cannot give to something new.
167. **A choice that is none of a list's kinds is passed as itself.** A getter that falls back to a default kind (the brush's `aspect`:
    the pick, else the bottle's grade, else the weather) answers "which feeling", never "what was picked"; a look that must show the pick
    reads the pick.
168. **A bone is asked for by the name three.js gave it, and a look that finds nothing says so.** The glTF loader drops a Blender
    name's dots and other reserved characters (`oar_shoulder.L` is `oar_shoulderL`, PropertyBinding.sanitizeNodeName); a table of
    bones is keyed by the loaded names, and code that filters a rig's bones by name is judged by rendering the pose, never by its
    running without an error.
169. **A stand-in leaves the warm-up only when no look draws its program.** Rule 166 asks the look; this asks the program: before a
    parked stand-in goes, list who draws with its program (`customProgramCacheKey`, a shared material's) and keep it while any one does.
    The check that proves it: the program list after the look is first drawn in play equals the list after the boot.

170. **A flat look on sloping ground is laid on the slope, and judged from the camera's lowest place.** A disc, a decal or a pool's
    face set at one height on ground that is not level floats over it on one side and sinks under it on the other: lift its vertices
    to the ground under each (`layOnGround`, `vfx/dunemaw.js`) or level the ground under it. A look on the ground is one-sided: an eye
    that sinks under it sees the ground, never its underside. Look at it from the floor with the camera pitched up, not only from above.
171. **A program is what a material is at its first draw, shadow included.** The sun's depth program differs by a caster's sides
    (and skinning, morphs, instancing): a two-sided look casts one-sided (`shadowSide`) unless its silhouette needs both. A material
    built flat after the warm-up is drawn flat until the present's walk smooths it: shade it as it is built. A pass with a scene of its
    own (a trail map, a render target) is drawn once in the warm-up, before the empty frame, or it compiles in play.
172. **A uniform is the body's that wears it.** A shader's uniforms are objects handed over by reference: a second body dressed with
    the first's set shows whatever happens to the first. Another Courier's rig (a sibling's, a guest's) takes its own set (fade,
    dissolve, cracks) on the same program; prove it by changing the first and reading the second's uniform from the renderer.
173. **A layer over part of the body stands on the pose it was made over.** A pose laid over the upper body only (a mask, the hips not
    moved) takes the hips, the legs and the lower spine from whatever is under it; when what is under it can change (a chosen idle), the
    layer says what it was made over and that is put under it. Judged by the spine chain (the pelvis's roll, the hips' shift off the
    feet, each spine bone's roll) in every state that lays a layer, against the numbers from before the change.
174. **A loop is measured at its seam.** A clip played on a loop is checked for its last step against its others (each bone's turn
    from frame to frame); a step several times the rest is a pop at the seam, not motion in the capture. Closed (the popping frames
    dropped, the difference spread over the clip: stances.js `closeLoop`) before the clip is measured or chosen for its stillness.
175. **What tops a thing up adds what it adds.** A spill, a smear or a refill into something partly taken raises it by its own share
    (its area, its cells), never back to whole; the look follows the count of what lies there.
176. **A look that says "now" asks the rule that answers.** A mark that shows a window (the parry mark hot) is driven every frame by
    the same predicate the press uses, the press's own length included (a press keeps asking for a quarter second), never by a copy of
    its number or a ramp toward it. Measured by pressing at every frame and reading the look on the same frame.
177. **A shell drawn from a body's geometry takes what bends the body.** An inverted hull (the parry mark, any outline) made from a mesh
    whose vertex shader moves it (a jelly's squash, a skin) is given the same bend, or it draws the rest shape. Judged in the pose that
    bends the most. A uniform a bend reads defaults to doing nothing: a `Vector4()` is (0, 0, 0, 1), not zero.
178. **A knee or an elbow bends on its hinge.** A clip retargeted by bone direction, a blend or an IK solve can bend a shin or a forearm
    sideways or back off its hinge with every joint where it should be: measure the lower bone's swing off its rest hinge, its twist
    taken out first (never the joints' places), in game, in every state. Square it by turning the upper bone about its own length (the
    joints stay), at a joint's own speed and within its own range; past the range, keep the hinge and let the wrist or ankle move.
179. **What lets go eases out, and is not caught again in the same breath.** A foot lock let go by distance waits for the cycle to lift
    that foot; a weight that swaps one whole pose for another (the idle for the run) moves at its own pace, never at the pace of a speed
    that crosses its band in a frame.
180. **A clip's travel comes out in its own frame, before anything turns it.** In place, then unturned: turned first, the travel is turned
    and then taken off unturned, and the body is thrown twice the travel off the capsule.
181. **A blast laid on the ground tests height.** A ring round a landing or a slam strikes what is within reach of the ground it is laid
    on (the target's lowest point to the feet), never the plane alone: what hangs overhead is out of it.
182. **What must move together shares one motion, and a blade is checked against where the thing is.** A body kept at another (a juggle,
    a carry) follows the other's measured motion with a pull to the gap, never two gravities tuned to agree; and a blow is proven by the
    tip's measured angle and height against where the target stands, not by the clip's look (an arc that never crosses the front is
    aimed by its own angle; a push that carries the pair is a push too far).
183. **A creature's body is never the ground.** A mark laid on the ground finds the ground under it with static colliders that belong to
    no creature (`physics.entityOf(c)?.type !== 'creature'`): a creature that stands on a static collider of its own is not a floor.
184. **A body and its windup keep one clock.** A creature's animation, the strike it calls and the windup the parry asks of all run on the
    sim step (`dt`), never the body on real seconds: under any time scale (a hit-stop, a held slowdown, a tempo) the strike lands as the
    window closes. Only what is said in real seconds (a bout's gap, a press's quarter second) reads `rawDt`.
185. **A tell has a dark beat before its glint.** A look that says "now" can only teach if there is a "not yet" before it: a wind-up
    shorter than the time its mark runs hot (the window and a press's quarter second, 0.5 s) glints from its first frame.
186. **A clip is cast by its measures, not its name.** Before a clip takes a state, its own speed (from its planted foot), its hips'
    height and its posed top are measured against the state's speed and the room it must fit. A loop played past twice its own speed
    takes short steps at a quick cadence, never long low strides; and a foot is planted only while the capsule is slow enough for it
    to stay there.
187. **A lift is a floor, never a ceiling.** A blow that holds a thing up in the air sets its rise to at least the blow's lift, never
    to less: what is still rising faster keeps its rise. Measured as the thing's own speed (the engine never assumes its gravity) at the
    blow, against the press timings a person makes (every 0.1 s), not only the one that waits for the top.
188. **A cadence multiplies everything in the loop.** A loop played at n times its pace swings its head, hands and hips n times as fast:
    a loop is judged at the state's speed by its head's world motion (bob, sway, turn rate) as well as its feet, and a low gait holds
    its head still (the prowl: `courier/anim/prowl.js`), the neck taking the body's motion.
189. **A gesture in every loop is a B.** An idle's loop holds no gesture that plays each time round: it is held out of the loop (A) and,
    if it is wanted, kept as a B played 1 in 4 to 5 (`IDLES.calm`, idlebreak.js). A clip changed in place changes every bake built on
    it: look at those too (the stances over braced).
190. **A sweep reaches a thing the way the player can, every way the game offers.** A list the game shows (the Index's rooms) may hold
   entries with no key of their own; a sweep that presses only keys throws on the first one, and every check after it never runs.
191. **A line of sight to a thing never counts the thing.** A ray from the eye to a target's middle ends inside the target: its own
    collider is left out of the test (by entity, `physics.entityOf`), or every solid target reads as hidden behind itself. Measure the
    ray's hit before blaming the candidate list.
192. **A move's own motion is its own.** What the Courier does in a move (a rise, a lunge, a fall) is a number of the move, never borrowed
    from what it struck: a target may not move at all (Strawman, a heavy thing, a wall). Following a target is a second layer, laid on
    only once the target is seen to move as asked, and let go when it does not; test every such move against a thing that cannot move.
193. **A listener on the bus asks the same filter the ledger's rules ask.** Anything that pays for an event outside tracking.js (the domains'
   exp, Soul Alchemy's seasoning) skips a training body (`isTraining`, `combat/testroom.js`): one list of what never pays, for every payer.
194. **A pose longer than its capsule is cleared where it is drawn.** A look that lies past the capsule it stands on (the belly crawl: 2.2 m
    over a circle 0.27 m in radius) pokes through what the capsule stops at, and a thing's extent is measured, not guessed: the posed
    mesh's reach by angle about the capsule's axis, then the poke at a plain wall in each way the body meets one (into it, along it,
    turning beside it). The look slides off what it meets (`Crawl.clear`: rays from the axis, the pelvis only), never bends its pose
    and never asks the capsule for room it was not given; what no slide can hold (a gap narrower than the body) is the body's, and
    goes to its owner with the numbers.
195. **A launch hands back the speed it promised, however it ends.** A move carried by the launch
    (`courier/moves/launch.js`) names its exit speed (`endSpeed`), and `finish()` sheds to it; a cut-in (the blink: `techs.js`) ends the
    launch without `finish()`, so the caller's `onEnd` sheds to it too (`shedSpeed`, `tools/moveset.js`). Whatever reads the body's
    speed at a handover reads the move's own speed otherwise.
196. **An outcome is sent once nothing can change it.** An event that says how something went (a blow's
    `move.blow`: hit or not) is sent when the check that decides it has run its whole window (the sweep's strike, padded as the sweep
    pads it: `Moveset.spent()`), never on a tighter window of its own; a test of it places the thing at the window's edges.
197. **A window kept in an update runs on while that update is not called.** A clock a module adds `dt` to in its own
    update (the string's window, `Moveset.after`) stops when its owner stops calling it (the Sondelass's rod or hook form): tick it
    from the owner every frame it is not read (`Moveset.idle`), or read the time from a clock that always runs.
198. **A count for a record counts what the record's own rule names.** A counter an engine keeps for the
    ledger (a run, a streak) takes its definition from the plan that owns the record (Dovina's `sond.string.best`: "LMB string blows"),
    not from whatever reaches the same door; every kind that reaches it is named in or out, and a test mixes in the kinds left out.
199. **A collider's shape and its place change in the same call.** A collider moved on its parent
    (`setTranslationWrtParent`) is moved in the world only by the next `world.step`; anything asked in this step (the character
    controller, a shape cast) meets the new shape at the old place. Set its world translation there and then too (`player.setShape`).
200. **A layer that hands the body to another keeps its weight until the other is whole.** Two weights eased at
    their own rates (the crouch out at 12/s, the air in at 10/s) show whatever lies under both for the length of the handover (the
    standing idle, at 0.29). Hold the outgoing one's weight under the incoming one until it is whole, then let it go at its own rate;
    and when the handover turns back before it is done (a jump cut short by a roof), keep the hold until the layer has climbed back.
201. **What takes the hands puts the tool away through the belt and gives it back through it.** The one asked out
    is remembered and drawn again once the hands are free; one put away by hand meanwhile stays away; and nothing pressed while
    the hands were taken (a draw key, the aim held, the trigger's own queue: a tap, a shell, a charge) is kept for after
    (`tools/proneholster.js`; the psygun's queue is its own, let go in `weapon.js`).
202. **Every way of setting the Courier down puts back the same state, through one method.** A respawn and a teleport
    that each list what they reset drift apart; the posture is the Courier's (`player.standUp`), and both call it.
203. **A name a class gives itself on `game` is its owner's alone.** A class that registers itself where others find it
    (`game.paintReticle = this`) is built under that name once; a second use of its look asks not to take it (`{ aim: false }`), or the
    last one built holds the name and everything that reads it follows the wrong one. Before reusing a class, grep it for `game.<x> =`.
204. **A mark that says what a press will do reads every way the engine can take it.** A read of the engine's choice
    (the string row's lit pip: `Moveset.stringPlace()`) follows the engine's own rules down every branch (the pause window, a pause
    string's run, the blink's offset), not the common path alone; it is tested against each branch, the rare one first.
205. **A tool's mark lingers only while the tool is asked for.** A mark kept up a moment after its use (the bottle's
    arc, 0.8 real s) asks the belt each frame (`belt.get(id).wants`): stowed or another tool asked for, the linger is cut that frame.
206. **A move's travel toward a thing is cut by the farthest it goes, down to none.** A whole-body move carried
    toward what it is aimed at (the lock's target, else the magnet's: `aimedAt`, `tools/moveset.js`) is cut so the hips' farthest point
    ahead in the move, with its own step, stops a reach short of it. Never by where the clip ends (a kick or a hop goes out and comes
    back), never with a floor, never skipped for a short clip: a held slip jelly does not stop the capsule, and any travel left over
    walks them through it. Aimed at a thing, the clip's sidestep is dropped (a string of them walks round it); the rise stays the
    move's own (192). Test every whole-body move alone in every slot against a thing that cannot move and a thing that does not block,
    with the lock-on and without.
207. **A number in a card's line is the row's stat.** A figure written into a line (a reach, a time) is checked
    against the row's `stats` where the row is written, and a join that lets one source's words win over another's is read card by
    card for the numbers it now shows.
208. **A knock back goes back.** A swing's direction at the thing it strikes is the tangent of its arc (`melee.js`),
    across the striker, so a push along it alone sends the thing sideways, never away. A blow whose words say it knocks, shoves, kicks
    or launches drives what it strikes away from the one who struck (`hit.away`, `tools/moveset.js`; the kick's `side`, the same rule),
    measured as the thing's travel along and across the line between them, at a free target, never a pinned one.
209. **A line the player reads is what the click or the play will do.** A choice's card line and the log line
    after it are read against the state the click leaves (a slot emptied, a string ended), and a way to open a thing is shown only
    when what it reads has a writer: a record nothing keeps is a promise nothing keeps.
210. **A new option never moves the default.** An engine change or a data fix made for new rows is opt-in
    on the row (`travelCut: 'peak'`, `hit.away`), never applied to the rows that already played, and the default is proven by the old
    probe run as it was, frame for frame, against a free target as well as a pinned one.
211. **A change made in a window is written when it is made.** The main loop writes the save once a frame
    only while no window is open (`main.js`), and nothing writes it when the page goes, so what a window changes (the loadout editor,
    a page of the Index's window, the Codex) calls `save.flush()` itself after `dirty()`; flush waits only on a hold.
212. **A thing in the hands is placed from the hands.** A held prop goes where the clip's palms are (their midpoint, read once the body
    is posed and before any hand's IK), in the body's frame, and the IK only closes them on it. Placed from the capsule, it stands still
    while the body bobs under it and the IK drags the arms to it. Measured as the IK's pull on the palms (a few cm, not tens) and the
    feet against the same run without it.
213. **What is let go of is solid to the Courier only once it is clear of them.** A thing out of the hands (thrown, set down, dropped)
    keeps out of the Courier's collider and the character controller's query until its shape is a margin clear of the capsule. The
    controller sees a collider where the last step left it; made solid inside or against the capsule, it shoves the capsule out in one
    step. Measured as the capsule's step on the frame of the release, at the floor's edge too.
214. **What is drawn moves on the render clock.** A move's progress read from the fixed step (`st`) moves in
    60 Hz steps under a faster frame, and a thing placed from it and from the interpolated body (`renderPos`) goes back and forth against
    the body. The drawn pose and the drawn prop take their time from the frame (0 on the state's first drawn frame); the physics keeps
    the fixed step's. Measured at 144 Hz as the prop's reversals against the palms.
215. **A clip's planted sole stands on the floor it is played over.** A new pack of the same captures can plant its
    feet lower than the rig's rest sole; keep each foot's lowest skinned point on the ground under that point, not under the ankle, per
    foot. Never raise the whole body by a loop's deepest strike: the flat stance foot then stands in the air. Measured as the lowest sole
    vertex against the floor, every frame, at every pace, turning and on a ramp, its median as well as its minimum.
216. **A pattern cut from a texture keeps a band of its own.** A smoothstep of a texture (a glaze's edge, a mask,
    a rim) sharpens what the mips softened: give it a fixed band in the texture's own units, wide enough to span pixels at play distance,
    never one widened by `fwidth()` (one value a 2x2 quad: the edge moves with the quads as the camera slides). Draw a thin feature (a
    run, a line) as its own soft profile, never cut at a level; and on a curved face blend the box mapping's projections (a switch of
    axis is a seam, and every quad on it reads a blurred mip). Measure crawl over a frozen world with the camera slid a quarter pixel a
    frame, against the build before and against the shader with the new part switched off.
217. **A preview that runs the game's own code begins every run from a kept fresh state, standing where the game's
    stands.** A second copy of a stateful stack (the Anim Lab's rig and tools) carries whatever the last run left in it: a clock, a foot
    lock, a cast, a flag set once. Keep its state once it is built, and settled a frame so that what is built on the first frame is built
    only once. Put that state back before every run (`workbench/animfresh.js`), and never write back what the game holds. Step it with
    its parent at the world's origin, as the game's rig stands, since the IK and the holster are worked out in the world. To check it,
    record the same run after a different one: the bones are identical.
218. **A streak names every way it ends, and bounds every way it waits.** A count kept in a row for a record (the
    string run) is ended by every way the body leaves play, heard where all of them already pass (`course.teleport` and the respawn
    reset the techs: the tool's `reset()`; a seam, read while it is under way; the guard's rescues, as events), never one caller at a
    time. A clock that waits on a held input waits a stated time (`HOLD_MAX`), never for as long as it is held; and a wait made by not
    calling the clock's update (the iaido's charge, Blade Mode) is a wait too: named in the rule, and bounded or ruled to stand.

219. **A held thing is pointed by the shoulder and the elbow; the wrist only finishes it.** A blade on the thumb's
    side of a fist points within 55 to 110 degrees of the forearm and to the thumb's side of the elbow's bend, give or take the forearm's
    90 degrees of turn: a pose that asks the tool to point elsewhere is solved by moving the elbow (the pole) and the hand, the hand laid
    along its forearm (`aim` in courier/anim/stances.js; an off hand on a handle eased about it, `easeGrip` in tools/grip.js), never by
    turning the hand alone, and never by an IK reach left to its default pole. A tool's set taken up is hinge-repaired whole, its clips and
    its posed arms (hinges.js HINGED, `hingedArms`). Proved by the pose audit (scripts/poseaudit.mjs) on the states it touches, its
    blends included, before it ships.

220. **What is posed every frame has one owner, on one clock, and no bearing taken from nothing.** A tech
    that sets the body's facing (or a hand's target) in the fixed step while the core eases it once a render frame makes a sawtooth at
    every frame rate but 60 Hz: give it to one of them (the core's stance turn, or the tech's `faceYaw()`), and measure headless at
    144 Hz as well (`tick(1 / 144)`). A direction worked out from a vector that passes through zero in play (the anchor's bearing from
    under it, `atan2` of its horizontal, `dir × up` for a line straight up) turns 180 degrees in a frame: take it from the body's frame
    there. A rope with no more length than its span is drawn straight; a few-pass Verlet chain is not left to hold it.
221. **An achievement's goal counts only what the player can do.** A goal read off a whole list
    (`game.techs.list.length`) grows with every entry, reachable or not; the predicate and its goal read one named set, shared
    with the rule that writes the ledger (`loggedTechs`).
222. **A thing that ends one way does not also end the other.** A step that can finish a round two ways (a touch,
    its time run out) returns which, and only that ending runs its code; a bare `true` from both lets the caller run both.

223. **A window on the screen is placed by its measured size and capped to the screen**, never by a guess per row:
    lists grow (a menu of a hundred shells); what is taller than the screen scrolls.
224. **A ray cast straight down at a height field is nudged off its grid lines** (a millimetre in x and z): Rapier lets
    a vertical ray along a grid line through, and a body set down on whole metres stood on one.
225. **A double-sided material sets its `shadowSide`** to a side whose depth program is already warm (the
    bodies it rides on cast back-faced): left alone, its sun-shadow depth variant is one nothing at boot uses, and it compiles mid-fight.
226. **A gate's result is its exit code, never its last line through a pipe**: `npm run check | tail` and
    `npm run build | tail` return tail's success, so a failing gate let a broken commit through. Chain a gate bare, or with `set -o pipefail`.
227. **A goal over the ledger reads a record with `best`, never `get`**: `L.hi` keeps a best apart from the counters,
    so `L.get('parry.run.best')` is always 0. Read a goal's key through `ledOf` (progress/skills.js), which takes either.
228. **A shader patch is applied to a material once.** `withFade` and its kin add uniforms by string replacement; run
    twice on one material (a helper that already wraps, wrapped again) it declares them twice, the program fails to link, and the mesh
    draws nothing with no error in play. Pass the patch's options to the helper that applies it; check a new material's link status.
229. **What lets a body go does not take it again at once.** A lock that is tested every frame (a grind, a grab, a
    ledge) and releases at the place it would lock is retaken the next frame, forever: the place just left is barred for a beat, and a
    lock never takes a point past its own ends.
230. **A side has one sign, written once.** Where a value means a side (a lean, a steer, a lateral offset), every use of
    it (the roll it draws, the mark it shows, the push it gives) takes its sign from one named vector, never a re-derived perpendicular.
231. **A module that asks a service at construction asks it again once that service exists.** Boot order is not a
    contract: a `game.chat?.add` (or any `game.x?.`) in a constructor that runs before `game.x` is made silently does nothing. Register on
    first use (a lazy `commands()` from `update`), or construct after the service, and check the command exists headless.
232. **A held sound goes through the loop bus.** A loop that only moves while play steps (the skiff's run, a
    grind, a field) keeps its last level when play stops; so every held loop sounds through `sfx.loopBus`, which the ambience silences
    while a menu is over the game.
233. **What runs under its own window keeps its clock there.** A page that counts as a modal window (the index's,
   the Codex's) stops the world's tick; a game played on that page (a table's bots, a timer) is ticked from main.js's modal line
   (`tickModal`), never only from the module's `update`. A headless probe that calls `update` itself does not prove it.
234. **A place's big arrays are lent, not kept.** A place whose ground or geometry runs to tens of MB builds it on
   arrival and gives it back a few real seconds after the Courier has left (keeping only what is slow to work out again, like a
   field of heights); the heap after a visit is measured, not only the heap inside.
235. **A replaced UI is deleted in the same change, never hidden.** When a new piece takes an old one's job,
   the old element, its builder, its CSS, its update code and every line that shows, hides, polls or measures it go in that commit;
   no body class or `display: none` is left keeping it alive underneath.
236. **A draw is timed to a sync, or it times the queue.** WebGL returns before the GPU has drawn; a
   frame's draw timed by `performance.now()` alone reads ~5 ms while the queue still has room and the whole backlog when something
   syncs (a program's first use, a full command buffer). Time each measured draw to a 1-pixel `readPixels`, and judge a draw that
   jumped by its synced number before bisecting anything.
237. **A new sound's name is searched across the banks first.** Every bank is mixed onto the one Sfx, so a name
    used twice is one sound overwriting the other (audio/sfx.js logs it at boot); grep `src/audio/` for the name, and name a tool's sound
    for its thing in full (`lureNotch`, not `notch`).
238. **A place that turns a shared body gives the turn back when it is left.** The Pneuka Jar is one model in
    the world, the god hand and the Spirit Garden; a place that sets more of its pose than the others read (the garden its whole
    orientation, the world only its yaw) puts the rest back on leaving, or the next place inherits it.
239. **A hand the IK sets on a thing keeps the clip's turn but for the least swing.** The hand's place is the IK's;
    its turn is the clip's hand swung the least way that lays the palm on the surface, never a turn built whole in the world (fingers
    up, palm in), which the wrist cannot make from where the clip has the forearm. Measured with the pose audit's wrist ranges.

240. **A comment goes at a line's end or on its own line, never in the middle of code.** A `//` dropped into a line
    of events silences everything after it with no error; `npm run check` refuses it (`comment.swallows`, 2026-10-20).

241. **A sheet of rules is injected by the builder of the thing it styles, never by a neighbour's.** Retire the
    neighbour and the rules go with it, silently; the connectome's "never read" on a `CSS` const is the tell.

242. **A shared material is never changed by one of its users.** A module that restyles what it holds
    (transparent for an order, a colour for a mark) skips anything marked `userData.shared`, or gives its part a material of its own.

243. **Whatever holds the Courier in place holds what could reach them.** A mode that takes the
    Courier's body (a duel, a cutscene) holds the creatures round them, clears what is in flight, and refuses an outside blow at the one
    door every blow comes through (`vesselDamage.hit`), not at each creature.

244. **What only one action may answer is left out by name in every other's loop.** An outlined
    shot is the parry's alone, so a bomb's or a vacuum's sweep walks the plain shots only; a sweep over "all shots" breaks the rule
    without a word.

245. **A limit on what moves on the screen is sized from the camera that shows it.** One box in metres for
    every view, whatever its camera's distance, left the ship a fifth of the screen in one view and most of it in another; a view's
    bounds are found by projecting through that view's own camera (the frame less its margin), and ease when the view changes.

246. **A reticle is aimed through this frame's camera, after it is placed, and eased across a change of
    view; input is counted only while what it moves is shown.** A hidden cursor that keeps counting comes back pinned at the edge; a
    reticle aimed before the camera moves lags it a frame; one that flips at a swing's midpoint snaps.

247. **A check judges a thing as the runtime turns and throws it, in every view it is thrown in.** A pattern laid out in
    one frame and checked there passed while the player turned it 20 degrees off the ship and out of the side view's plane; the check
    builds the same frame the player builds.

248. **Code is read past its comments in one pass, left to right.** Blanking one kind of comment and then the
    other let a `/*` written inside a line comment open a block that ran to the next doc comment, and the check lost 32 imports.

249. **Find an edge by stepping to it, then halve the last step.** Halving a range assumes one edge in it; a
    camera that follows the thing it frames brings the screen round again, and the halving found the far edge.

250. **What a stretch needs is set as the stretch begins, not only on the way out of the one before.** A leg's kit fitted
    only in the turn before it was missing whenever the leg was reached another way.

251. **Measure a distance where the thing is laid, not where it stands.** A plane view moves a thrower onto the
    ship's plane before it fires: the brig 17 m off in the world stood 1.4 m off where her shots began.

252. **A view's aim reaches every target it draws, at its depth.** A body moved deeper than the play plane
    to fit the frame was still a target on the screen, and the gun's reticle stayed on the plane in front of it.

253. **A sound's scheduling loop is counted, never only timed.** A run of ticks whose gaps shrink (an accelerating
    beep, a spin-up) can converge short of its end and never leave; every such loop carries a hard count beside its time.

254. **"Not yet" is never a value the thing can take.** An index, a count or an id that waits to be set
    waits as `null`: 0 is the first leg, the first slot, the first lap, and a check for "unset" that reads 0 takes it.

255. **A shared frame never decides where its window sits.** A class a frame adds to the element it
    dresses holds no `position`, or the window's own placement is written with more weight than it: the sheets' order differs from page
    to page, and a later equal rule wins.

256. **A library's hot path is counted, not trusted.** What three (or any engine) does a frame (program checks,
    uploads, garbage) is measured by counting the calls, and a count that does not fall when the cause is removed means another cause.

257. **A transparent DoubleSide material is drawn in one pass unless its order matters.** three draws it twice
    (back, then front) and compiles two programs; `forceSinglePass: true` wherever the two-pass sort buys nothing (additive, flat, sprites).

258. **What an early return skips is listed with it.** A method that returns early for "not here" is read
    to its end before anything new goes below the return; a job that belongs everywhere gets its own method, called on every path.

259. **A driven key reaches everything a person's does.** A tool that presses keys sends them the way the
    page gets them (the input's set and the page's keydown), or a window that listens to the page is a wall it cannot pass.

260. **No event every step.** The bus keeps its newest 300; a feature that would emit every fixed step sends a few a
    real second with what it carries (the most, the last), so nothing else is pushed out.

261. **Player text uses the glossary's words, and a helper that builds words is checked on
    irregular ones** (a plural, an article) before it is trusted with any noun.

262. **A ratio is clamped before it is raised to a fractional power.** `x ** 1.6` of a hair below 0 is NaN,
    and a NaN vertex blacks out every triangle it touches; clamp the ratio (or `Math.max(0, ...)`) where it is made, not where it is drawn.

263. **What is worn every frame is worn from the rest another writer left, never from a constant.** A look set once (a
    glaze, a tint, a part chosen) and a look set every frame (wear, a flash, a fade) on one material: the frame's writer keeps the rest
    the other leaves and starts from it, or the first is gone a frame later.
