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
97. **The storm bends the world, never the danger, and the danger is marked where it is built.** Every material of what hurts or is
    aimed at (a shot, an outlined shot and its parry mark, a reticle, a lock mark, a hurtbox mark) goes through `keepTrue` at its
    owner's build (free on a transparent one; an opaque one costs a program, so say it); a big object the storm seats moves less than its
    smallest part's radius (`STORM.seat`), because a hurtbox is where the logic puts it. Measure it: render with the veil on and off,
    the danger isolated by differencing with and without it, and read its shift in pixels.
98. **A wrapped `onBeforeCompile` keeps its old code in its program key, taken before the wrap.** The default
    `customProgramCacheKey` is `this.onBeforeCompile.toString()`, read late: once the hook is wrapped it is the wrapper's text for every
    material, and two wrapped materials of one kind with different old code would share one program.
99. **A mark the player must read carries a light part and a dark part.** The black crude and the gold storm are both grounds at sea:
    a danger drawn only dark (ink on the ink sea) or only as added light (white on the gold) vanishes on one of them. Give it both (an
    astral shot's dark rim, an umbral shot's pale rim, the outline's film beside its ink, a ribbon's shade at its edges) and render it
    over both grounds before calling it done.
100. **What a mark draws from a number, it draws from the thing's own, never its place in a list.** A packed list is rewritten every
    frame: when one entry ends, every entry after it takes the one before's index. A film's phase, a flicker's offset, a wobble's seed
    taken from the index changes colour for every mark behind the one that ended; take it from the record (its pool slot).
101. **A mark that says "this, now" is asked whether it is still true, every frame.** A telegraph closes on a part that can act and on
    a bar that will fire; the part downed, the fight ended or the volley that will not come takes the mark with it (`alive`), or the
    player learns to ignore the one mark they must not.
102. **A warm-up puts back what it moved.** Whatever is moved, scaled or re-parented to be compiled is put back where it is hidden
    again; never trust each owner to reposition its look every frame (a look drawn in the world's own frame never does).
103. **A quad built in screen space keeps its winding.** Its across axis is the along axis turned clockwise on the screen ((x, y) to
    (y, -x)); turned the other way the quad is mirrored, faces away and is culled on a one-sided material.
104. **A warp's door names who is not let in.** The storm bends the world, never the danger: whatever is shot at, hurt by or locked on
    (an eye, a shot, a hurtbox) is made outside the warp's family and is handed only to its own hook (`warpWith`'s `keepTrue`).
105. **A colour pinned to the world is for things that stand.** Anything the rail carries through the world (the school, the geometry
    placed in the rail's frame) takes its stone's phase from itself (its local position at its size, plus its own seed), or the colours
    cycle at the rail's speed.
106. **A mark sized from a projection is clamped, and a flag that draws a mark is eased before it reaches the look.** A streak as long as
    five fish, however close the camera, and a strike's 0 / 1 flag, are a flash on the screen in the one frame a group turns on. And a
    rate is never driven by an eased number: the phase swings by the clock times the change.
107. **A mark a model lays in the world rides in the model's group, counter-moved, so it is warmed and hidden with it.** A shadow or a wake
    added to the scene on its first use compiles in play and outlives its model's `visible`. And count a material's settings, not its
    class: a transparent `DoubleSide` material draws twice (back faces, then front) and is two programs, and `fog: false` is a third;
    match a material the game already warms (`renderer.info.programs` before and after), or set `forceSinglePass`.
108. **What a portent does not show, no part of the drawing shows.** A picture made from the truth beside what is shown leaks by its side
    channels (a lane's length, an offset, a draw order): draw twice with only the hidden fields changed and compare the pixels
    (`scripts/seachartlooktest.mjs`: one waypoint at a time, its type, strength and a dim star's feeling). Nor
    what the record never held: an unrecorded strength is not drawn as a default one.
109. **What is made of a canvas is kept on the canvas.** A scaled or blurred copy lives in a `WeakMap` keyed by its source; a `Map` keyed by the
    canvas, emptied at a size, keeps every canvas it ever saw. Count the canvases alive after a GC (a `createElement` wrapper and
    `WeakRef`s): their pixels are outside the heap, and the heap's number will not show them.
110. **A hook is read by someone.** A name set on `userData` (a stage's `dispose`) is a promise only the one who takes the thing down keeps: grep
    for who reads it before relying on it, and measure `renderer.info.memory` before, while and after leaving, more than once.
111. **A class a module exports has a name no other module of the game exports.** The glossary calls the pier's window `SeaChart`; its drawing
    took the word for a class, and the one module that imports the one declares the other. Grep `export class` and the glossary first, and
    qualify (`SeaChartCanvas`).
112. **A look made on the workbench is judged once on the ground it will stand on.** The workbench's floor is near black and its light
    strong; the Spirit Garden's ground is pale (225, 230, 180) and its light soft. A colour chosen against the one is wrong on the
    other (a "darker, lusher" ring that was near black read as a hoop), so a look for a place is placed in that place by hand, in its
    own light and on its own ground's normal, before it is called done.
113. **A clock a shader's sine reads wraps at a whole number of that sine's periods, and a step that is not a number is no step.** A
    uniform wrapped at 3600 real seconds jumps the phase of `sin(0.7 t)` (2520 rad is 401.07 turns) by the fraction left over; and `NaN` added once
    stays in a running clock for good. Wrap at N whole periods, add only a step above zero, and keep a setter's old value when it is
    handed a number that is not one.
114. **A rule's effect is applied where the rule lives, once.** When a pure module owns a rule (trip.js's mend on arriving at an
    encounter), the world calls it and does not apply the same number again on its own; the world acts only on what the rule asks.
115. **A turned frame turns about the rider, not the track.** A figure that rolls or pitches the rail turns about the heartline (where
    the ship rides), or the ship is swung through the sea's surface.
116. **What one frame hands another is all of one frame.** When part of a camera's shot is read by reference (this frame's) and part
    copied (last frame's), the two disagree at any discontinuity; hand all of it the same way.
117. **A camera-facing quad is never square to the eye, never at it, and never trusted to alpha to coverage on a software rasterizer.**
     Lean billboards a little in depth (toward the surface they stand for), shrink them away near the eye, and ask the renderer's name
     before turning on alpha to coverage: SwiftShader, which every headless check runs on, stripes the first and speckles the last, and a
     look that cannot be verified headless cannot be judged.

## Cases

### 2026-10-08 · Myggdrasil's fruit hung under caps that were still buds, and its mouth was drawn where the ground hid it (found in review)
- **Seen:** feeding the tree a step (caps 3 to 4) hung its next fruit at once under the fourth cap while that cap was still a shut bud,
  for as long as the cap took to open (2.6 real seconds a cap, so up to 23 for the last); fruit on a thread from a bud is a mark that
  lies about what is open. Earlier in the same build the mouth, a throat sunk in the ground, was covered by the planetoid's skin, and the
  world's F stood at `dirOf(78, 0)`, inside the stipe's foot, not where anything was drawn.
- **Cause:** the fruit's hosts were read from the state's cap count, not from the caps as drawn (`cap.k`); the mouth and the F point
  were each placed from a number, not from the other.
- **Fix:** fruit is rebuilt when the number of caps that have begun to open changes, and hangs only under those; the mouth is a raised
  cup on the ground and the world's F point is read from its drawn centre (`mouthAt`), so the two cannot disagree (`myggdrasil.js`,
  `world/garden/mycelium.js`).
- **Rule:** a thing shown for a state is hung on the thing as drawn, not on the count that will draw it; a place the Courier stands at
  is read from the model that marks it.

### 2026-10-08 · The new leaf canopy's leaves near the eye were striped in rows, and every leaf was speckled with what was behind it (found in the build)
- **Seen:** in the workbench's grove and inside the cocoon tree's crown (headless, SwiftShader), leaves within about 3 m of the camera
  rendered in horizontal rows with gaps (whole quads as ladders of dashes over the floor; long lines across the screen once the near
  fade was off), and with alpha to coverage on, the inside of every leaf, where its alpha is exactly one, was dotted in rows with the sky
  behind it.
- **Cause, measured:** two things, each switched off on its own. The rows went with depth writes (gone with `depthWrite` off), with
  back-face culling (gone with `DoubleSide`) and with a quad lying square to the eye (gone when its corners were tilted in depth by 1%):
  SwiftShader rasterizes a triangle of one view depth near the eye in broken rows; the quads' corners agreed on their centre to the last
  bit (a JS replay of the vertex shader: worst disagreement 0). The dots went only with `alphaToCoverage` off: SwiftShader drops samples
  in an ordered pattern even at an alpha of one, where the spec intends full coverage.
- **Fix:** each leaf leans a third of the way to its sphere's surface plus a 1% tilt (never one depth, and leaves now shingle instead of
  cutting through each other in a line); leaves shrink away between 2.2 and 0.8 m of the eye; alpha to coverage is used only where the
  renderer is not a software one (`coverageTrusted`, asked once of a throwaway context), else a plain cut at one half, kept stable by
  mips that preserve each cell's coverage (`src/vfx/garden/leafcanopy.js`).
- **Rule:** see rule 117.

### 2026-10-08 · The fairy rings were black hoops on the garden's pale ground (found in review, placing the strains in the real garden)
- **Seen:** on the workbench's dark stage the sward round a spore bed (0x18241a to 0x2c3c2a) read as dark moss. Stood by hand on the
  Dantian (ground about (225, 230, 180) in the garden's daylight) every bed's ring was the heaviest mark on screen, a near-black hoop on
  a pastel planetoid, not a darker, lusher ground. Standing a bed on the direction from the planetoid's centre rather than the ground's
  normal buried the far half of its ring under the clay (the Dantian is not a sphere: `radiusAt` carries noise and the clay).
- **Cause:** the colours were chosen against the workbench's floor and light, and the bed was placed in the garden only in the head.
- **Fix:** the sward is moss (0x536a52 to 0x72896a) with a straw dead edge (0x8e7e56 to 0xa8986a): darker than the ground and not black,
  in the garden and on the workbench. The handoff to Petra says to stand a bed on the ground's own normal (three samples of
  `radiusAt`), measured to lay the whole ring on the Dantian.
- **Rule:** 112 (a look made on the workbench is judged once on the ground it will stand on; and 64, the normal).

### 2026-10-08 · The koji's foxfire boiled, a bad step poisoned the glow for good, and its clock jumped once an hour (found in review)
- **Seen:** the foxfire's breath over a night cycle, four samples a pixel: the two koji trays showed fine per-pixel noise in how much each
  pixel breathed (mean relative range 0.10, up to 0.35) where every other part breathed whole. `bed.update(NaN)` left the clock `NaN` for
  good (the glow's `sin` of it undefined: black or white on a driver that does not drop it), `bed.set({ growth: NaN })` clamped to `NaN`
  and the whole bed vanished, and a sporeling's `update(NaN)` bent every vertex to `NaN`.
- **Cause:** the breath's phase came from each vertex's growth root, and the koji's fuzz grows each vertex from its own root, so every
  vertex breathed on its own phase. `clamp(NaN)` and `NaN + dt` are `NaN`. The clocks wrapped at 3600 real seconds, which is 401.07 turns of
  `sin(0.7 t)` (a step in the glow of up to 0.09) and 515.66 turns of the sporeling's `sin(0.9 t)` (up to a third of its glow).
- **Fix:** the phase is taken from the root's quarter-metre patch (the mottle after: mean range 0.064, smooth patches); the clocks wrap
  at 400 and 500 whole breaths; `update` adds only a step above zero, `set` keeps its old value when handed a number that is not one,
  and `hop(NaN)` is no hop. 560 beds over every strain, seed and size, 252 pots and 30 sporelings fed bad arguments: no `NaN` attribute or uniform.
- **Rule:** 113.

### 2026-10-08 · A rutter's page made from its passage alone gave every waypoint two pips of strength nobody had recorded (found in review, reading what the item keeps)
- **Seen:** \`chartOfRutter(r)\`, the page's chart when the item carries no \`chart\` (the item \`voyage.js\` makes keeps \`from, to, route, day, passage,
  legs, rank, read, minutes, worth\`), set every sailed waypoint to strength 1, and the page drew a sailed waypoint's strength as two pips.
- **Cause:** a default written as if it were data.
- **Fix:** the strength is \`r.strengths?.[i] ?? null\` and a waypoint with none draws no pips; the handoff asks for \`strengths\`, \`feels\` and
  \`stormsAt\` in the item.
- **Rule:** 108.

### 2026-10-08 · The sea chart's lanes stopped short of a waypoint by its true class, telling a haven from a threat among a portent's candidates (found in review, a differential draw)
- **Seen:** one waypoint at a time, its type scrambled to another class, its strength and (at a dim star) its feeling changed, over 1,187 of
  Dovina's real portents (three routes, ten game days, three sights): no icon moved, but the lanes into a waypoint whose two or three
  candidates span classes (306 of them: 103 twos and 203 threes) ended 1 to 3 art pixels nearer or farther: a lane stops 10 from a haven's
  centre, 12 from a threat's, 13 from a boss's.
- **Cause:** `gapOf(chart, id)` read the waypoint's true type for every tier but the dim star.
- **Fix:** `gapOf(chart, id, portent, classOf)` goes by what the portent shows: a dim star's gap, a class tier's `cls`, the widest of the
  candidates' classes at two and three, the true class only where it is exact. The same scramble now moves no pixel in any tier (0 of
  1,187, and 0 of 691 in `scripts/seachartlooktest.mjs`).
- **Rule:** 108.

### 2026-10-08 · The sea chart kept every ground it had drawn, 1.3 MB of canvas for each game day's sea (found in review)
- **Seen:** drawing 80 route-days in two looks at 2x, then a garbage collection: the canvases still alive went from 54 to 108 megapixels
  (216 MB of pixels), about 1.34 MB a ground drawn; nothing showed in the JS heap.
- **Cause:** `scaled()` and `blurred()` kept their copies in the one `CACHE` map keyed by the source canvas, emptied only past 900 entries;
  the ground cache was cleared past 24, but each ground's scaled copy stayed in `CACHE` under it.
- **Fix:** the copies live in `WeakMap`s keyed by the source canvas (`SCALES`, `BLURS`), so a ground that is dropped takes its copies with it.
  Over the same run: 4.48 to 4.54 megapixels.
- **Rule:** 109.

### 2026-10-08 · The workbench never called a stage's dispose, so the sea chart stage kept 32 geometries and 11 textures a time it was shown (found in review)
- **Seen:** `crossing:chart` shown and left four times: `renderer.info.memory` went from 1576 geometries and 156 textures to 1707 and 204, and
  stayed there on leaving each.
- **Cause:** `Workbench.clearHolder()` took the model out of the scene and nothing more; the stage's `userData.dispose` was read by no one
  (no other stage sets one). And the stage's own dispose left its boards' planes, frames and materials, and the materials a view mode puts
  aside (`userData.mat0`).
- **Fix:** `clearHolder` calls `userData.dispose` on what it drops; the stage frees both rutters, the boards' textures and every mesh it made.
  Four loads: 1611 geometries and 171 textures while shown, 1579 and 160 after leaving, the same each time.
- **Rule:** 110.

### 2026-10-08 · The sea chart's drawing took the name of the pier's window for its class (found in review)
- **Seen:** `ui/seachart/seachart.js` exported `class SeaChart`, as did `world/emocean/seachart.js` (Petra's window, the glossary's `SeaChart`); the
  handoff told the pier to `import { SeaChart }` into the module that declares one.
- **Cause:** the branch was cut before the window's glossary entry was merged, so nothing in it showed the name was taken.
- **Fix:** `SeaChartCanvas`, in the module, the glossary and the handoff.
- **Rule:** 111.

### 2026-10-08 · The False Light's keel seams never answered the keel (found in review)
- **Seen:** looking at her from under, the seams along the keel were the lure's full gold whether the keel was whole, damaged or broken
  (the sheets' `fl-below-intact`, `-damaged` and `-broken` showed one and the same line). Beside it: a part's windup never lifted its
  line and glow, the colours jumped to the rail in a frame when the last sling was cut, and the Drowned Light's `ghosts` were records
  where its interface said Object3Ds.
- **Cause:** the update wrote the seam's brightness and its colour on one line, `const seam = ...; // (its windup: the seams flare)
  this.seamMat.color.setHex(...)`: the colour was after the `//` and never ran (rule 25). It parses, the check passes and no error is
  thrown, so nothing said so. The windup set `windupK` and never asked the line and glow to read it; the colours' `strike` was set
  straight into the draw.
- **Fix:** the colour on a line of its own, so the seams are a thin dim line intact, brighter damaged, brightest broken with the hold's
  gold pouring (the workbench, `crossing:bosses.falselight`, from below); `windup()` redraws the line and glow; the colours ease down
  (`strikeE`) and fly again at once on `strike(0)`; `ghosts` are Object3Ds with their wreck and drift in `userData`.
- **Rule:** 25. A line with a `//` in its middle was found in seven modules by a few lines of script (a `//` whose text goes on past a
  closing parenthesis into `this.` or a statement): a check for it in `scripts/check.mjs` is Petra's to add.

### 2026-10-08 · Old Nobody's shadow compiled its program in play, at its first heave (found building its wake)
- **Seen:** the boot's warm-up compiled 163 programs and `leviathan-shadow` was not among them (`renderer.info.programs`, the cache keys
  listed before and after); the shadow mesh was added to the scene by its first `shadow()` call, so its program compiled on Old
  Nobody's first heave, a hitch on a real GPU at the set piece's first beat. Building the boss parts, the lighthouse lamp's beam first
  added two programs of its own (a basic map, both sides, transparent: one for the back pass and one for the front, with `fog: false`
  a variant the game had not got).
- **Cause:** the mark lay outside the group `stage.parked()` shows for the warm-up (casebook 18); and a material's settings, not its
  class, make its program.
- **Fix:** the shadow and the new wake ride in the beast's group with `matrixAutoUpdate` off and a matrix that undoes the group's
  (`unframe`), so their vertices stay in the world's frame, they are warmed with the group and hidden with it; and both are drawn with the
  game's own basic-map program (a soft halo for the shadow, a slick texture streaming aft for the wake), as are the beam, the glass and the
  ghosts' sails, which keep fog to match it. Boot programs 163 before and after; `leviathan-shadow` is gone, so one fewer compiles in play.
- **Rule:** 107.

### 2026-10-08 · The silhouette's eye, which is shot at, was handed to the storm to bend (Calissa, reviewing the swarm)
- **Seen (read, then run in the workbench with a recording hook):** `warpWith(fn)` gave `fn` every material the Mind's geometry made, and
  the silhouette's eye (the lens a player locks on, its ring, its shards) is made of them. The storm's droop alone at 50 m ahead and full
  strength (`STORM.bend` 0.1) is 2.7 m, nearly the eye's own radius (3 m): drawn off the outline of glints it sits in and off where a
  shot lands, the one thing the order says the storm never does.
- **Cause:** one `track()` for the whole family; nothing named what is not let in.
- **Fix:** `mindGeoMaterial(kind, { warped: false })` for the eye's three (`vfx/shoalsilhouette.js`); `warpWith(fn, { keepTrue })` hands
  those to `keepTrue` instead (the storm's `keepTrue` and `deepMaterial`: the veil leaves it, and no new program). Recording hook: 3 eye
  materials made, 0 given to the warp, 3 to `keepTrue`.
- **Rule:** 104.

### 2026-10-08 · The stone's colour on the school and the eye would have cycled a few times a second (Calissa, reviewing the swarm)
- **Seen (read, then computed from the rail's own numbers):** the glints' and the geometry's colour (`labPhase`) took the fragment's world
  position. The rail carries the school through the world at 26 m/s along +z, and the phase moves 0.057 a metre along it: 1.5 a second,
  three of the stone's bands a second across a glint's back, and about three turns of its whole palette a second on the eye's iris, the
  one thing the player hunts. The workbench stages never showed it: nothing there moves through the world.
- **Cause:** the Mind's family anchors to the world (right for the things that stand: the Dunemaw, the cave).
- **Fix:** the glints take it from their own local position and a per-fish offset (`vfx/shoal.js`, `vL`); the geometry from its local
  position at its instance's size and its seed (`vfx/railgeometry.js`, `vP`).
- **Rule:** 105.

### 2026-10-08 · A dashing glint near the camera threw a streak across the screen, and every strike's streak came on in one frame (Calissa, reviewing the swarm)
- **Seen (a glint set 2.5 m from the rail's camera with dash 1, rendered after the fix; the old length computed at 137 px a metre; and the
  call site read):** the streak was five of the glint's projected lengths behind it, 470 px long and 22 px wide in gold-white; and the
  dash was the mood's 0 / 1, so a bar's group of strikes turned its streaks on in a single frame.
  And, once the dash was eased, the tail's beat (its rate was 13 + 10 dash a second) swung its phase by the clock times the change at
  every step of the ease, hundreds of radians: a tail fluttering at random through every ease (computed; a rate is never driven by a
  number that moves).
- **Cause:** a mark sized by a projected length with no limit, fed by a flag; and a rate driven by an eased number.
- **Fix:** the beat keeps its rate and a dash beats harder and tighter; the length stops growing at 30 px (a streak at most 156 px,
  7 px wide), both in `vfx/shoal.js`; the dash is a per-member number eased in and out beside the roll, 12 a real second
  (`world/emocean/shoal.js`, five lines: CROSSING). The first try, an expression of the mood's clock and the roll, stepped by up to
  0.49 on a strike that began behind the ship: measured, so replaced.
- **Rule:** 106.

### 2026-10-08 · The shoal's glints, its boil and the ship's wake were drawn 50 m under the crude (Calissa, wiring 600 glints)
- **Seen (headless, a crossing under /crossing shoal, the set piece at bar 72):** no glint, no Conductor, no boil round the ship in
  any view, and no wake behind it; the shoal's look reported 54 glints drawn, its group visible, every glint within 6 m of the ship
  (world y -421.9 .. -419 against the sea at -420.7). The same with the look as it was before this change.
- **Cause (measured):** main.js's warm-up moved every parked sea look to (0, -50, 0) to compile it and, after, only hid them again.
  The looks that place their group every frame (the sea, the sloop, the brig, Old Nobody, the boarders) recovered; the two that draw
  in the world's own frame from a group left where it was (`vfx/shoal.js` ShoalLook, `vfx/rail.js` ShipWake's two lines) kept the
  -50 m, so every glint and the wake were drawn 50 m down, under the opaque crude.
- **Fix:** the warm-up keeps each parked sea look's position and puts it back as it hides it (`src/main.js`, two lines). The glints,
  the boil and both wake lines are on the sea (screenshots `rail_shoal_above`, `rail_shoal_chase`).
- **Rule:** 102. (A check for the Emocean sweep is handed to Dovina: the shoal look's and the wake's world matrices at the origin's
  height while a set piece runs.)

### 2026-10-08 · The far glints' sparks and the frenzy's streaks were never drawn (found headless, before it shipped)
- **Seen:** a striking glint stretched but left no streak behind it; past the fish's distance the school thinned to nothing.
- **Cause:** the spark's quad was laid on the screen along the heading and across it, the across axis turned counter-clockwise: a
  mirrored basis, so the quad's triangles faced away and the one-sided material culled them.
- **Fix:** the across axis turned clockwise (`vfx/shoal.js`, the spark's `ac`); the streaks and the far sparks are drawn
  (`wb_shoal_dash`).
- **Rule:** 103.

### 2026-10-08 · An outlined shot's film changed colour whenever another shot ended, and a shot passing the eye filled the screen (found in review of the shots' look)
- **Seen (headless, the shoal's crossing, the shots' buffer read before and after):** an outlined shot's film phase read 0.236 with
  three shots flying and 0.618 the frame the shot in front of it in the pool ended: a jump of 0.38 of a hue cycle, every outlined shot
  at once, every time any plain shot ended ahead of them (several times a second in a pattern). And one astral shot set a metre from
  the eye drew a head 230 px across, at sixty centimetres a third of the screen: a white-gold core, past the glow's threshold, with its dark rim.
- **Cause:** the film's seed was `(i * 0.618) % 1` with `i` the shot's place in this frame's packed list (plains first, outlined
  after), which moves when any earlier shot ends. The capsule is drawn true to perspective and nothing limited it near the eye.
- **Fix:** `RailShots.set` takes a `seed` (the outlined shot's own pool slot, kept for its whole flight; `courier/ship/shots.js`
  passes it); the capsule's alpha fades over its last four metres from the eye (`vfx/railmark.js` `nearFade`: 1.2 m gone, 5 m whole;
  the nearest view's camera is 7.5 m from the ship, so nothing a player must read is touched).
- **Rule:** 100, and the law "no flash, ever" (a large bright shape that comes and goes in a few frames is one).

### 2026-10-08 · The brig's last telegraph closed on nothing, and a port downed under its ring kept the ring (found in review of the shots' look)
- **Seen (headless, the pirates' broadside, the marks counted bar by bar):** rings stood at bars 9, 11, 13 ... 21 of the set piece and
  the volleys fired at 10, 12 ... 20: the ring at bar 21 closed at 22 on a volley that does not come (`rel < 22`). A port shot down
  while its ring was closing (the counterplay: its lid is open, so it can be hit) left the ring closing on the stump.
- **Cause:** the call site asked "is this the bar before a volley" and not "will it fire", and a mark had no way to ask whether its
  part was still there.
- **Fix:** the call asks `rel < 21` (the next bar must fire) and hands the mark `alive: () => p.alive && !this.ended`
  (`vfx/telegraph.js`, `world/emocean/pirates.js`).
- **Rule:** 101.

### 2026-10-08 · The lances' ribbons never drew in the crossing, and the outlined shots were ink on the ink sea (Calissa)
- **Seen (headless, the crossing's pincer from above):** eight lances flown, `ribbons.active` 8, and nothing on screen; the same
  ribbons drew on the workbench's stage. Before the shots were refired, an outlined shot was an ink body (#160c1e) inside the parry
  mark's shell (ink, its film at a tenth) on a sea of #07050b: on the crude, nothing to see.
- **Cause (probed, not guessed):** the ribbons' mesh had no parent after boot and never fired `removed`: an edit had put a comment
  before `scene.add(this.ribbons.mesh)` on its line (`courier/ship/shots.js` build), so it was never added (rule 25, again). The
  outlined shot had no light part at all.
- **Fix:** the call put before its comment; the shots drawn by `vfx/railshots.js` (`vfx/railmark.js`): every kind with a light and a
  dark part, the outlined with the parry mark's ink band and its film bright at the band's edge; the ribbons laid over the frame
  (not added: added light went white on the gold) with a shade at their edges.
- **Rule:** 99, and 25 (read the whole line after any edit that adds a comment to it).

### 2026-10-08 · The storm's veil moved the shots and the seat moved the hurtboxes (Calissa, the review of the storm warp)
- **Seen (the rail headless, `/crossing pirates` and `/crossing shoal`, 960 x 600, the storm at its wall):** (1) the veil's haze moved a
  foe's shot 0.5 to 3.7 px (1.9 on average) across the frame, because nothing called `keepTrue` on the shots, the reticles or the
  lock marks (those two were not measured); (2) the seated False Light was drawn 0.99 m off her place at 41 m under the stand-in storm (0.45) and 1.53 m at the
  wall, while her gunports' hurtboxes (radius 0.85 m) and slings' (0.9 m) stayed where the logic puts them: a drawn gunport lay beside
  its own hurtbox; (3) `set({ mind: 'Prismatic' })` read as Balanced (`STATES` holds objects: `indexOf` on a name is -1), and the
  workbench stage left `mind: 0` on the game's storm after it was closed, so the Courier's own state no longer weighed; (4) a wrapped
  material's program key was the wrapper's text, not its old code's; (5) "the twist", the storm's whorl, was already the glossary's
  word for the Great Dunemaw's rooms.
- **Cause:** the veil marks the danger by its alpha (`keepTrue`) and the handoff left the calls to the runtime's owner, so the current
  rail, which has no new shots yet, had none; the seat took the bend at the object's origin whole, which is a metre at 40 m;
  `STATES.indexOf(name)`; `customProgramCacheKey` read after the wrap; a word used twice.
- **Fix:** `world/emocean/stage.js build()` marks every mesh of `shots.meshes`, each outlined shot (and its parry shell), the two
  reticles and the lock marks (shift now 0.03 to 1.09 px, 0.27 on average: the rest is the differencing's own edge); `warpObject`
  caps the seat at `STORM.seat` = 0.4 m (0.28 m at 20 m, 0.4 from 40 m) and hands the shift back as `root.userData.seatOff`;
  `mindOf` finds a name by its `name`, the stage puts `mind: null` back; `storm()` takes the old key before it wraps; the storm's
  turn is "the whorl" (glossary, `STORM.whorl`, `uStormWhorl`). Cost: the plain shots' opaque instanced material is now non-opaque
  (a program of its own, +1: 154 to 155 at boot), given back when the shots' new look (`vfx/railshots.js`, one transparent material)
  replaces it.
- **Rule:** 97, 98.

### 2026-10-08 · The compass, the vane's marks and the pendulum compiled their programs in play (found by the program audit, Calissa)
- **Seen (headless, programs counted):** showing the wire compass, the Dreamvane's marks and the Crucibelle's pendulum for the first time
  compiled 3 programs (155 to 158): a hitch the first time the Dreamvane is worn or the Crucibelle drawn.
- **Cause:** all three were made lazily on the first tick after the warm-up (`main.js`, `game.wireCompass ||= ...`), so the warm-up
  never saw their materials.
- **Fix:** they are made before the warm-up and shown for its compile; their own update hides them on the first frame (`main.js`).
  Measured: 158 at boot, 158 after showing them; nothing compiles in play.
- **Rule:** 17 and 18 (a look made on first need is made at boot and compiled with the rest).

### 2026-10-08 · Thirteen shader programs compiled for a frame that is never drawn (perf over the program budget, Calissa's program diet)
- **Seen:** `npm run perf` on Calissa's branch read 168, 170 and 170 programs against the budget of 164. Listing every live program with
  its cache key, thirteen (ids 2 to 14, the first compiled) had no clipping plane and three point lights in their keys (four of them
  flat shading too), while every program the frames use has the God Hand's one plane, the light budget's eight lamps and the present's
  smooth shading: the same looks a second time (the particles, the pots and their shards, the bismuth, a beam, and the rave's own
  beams, ball, wire and specks).
- **Cause:** `Rave.warm` (vfx/rave.js), called by main.js as the rave was made, compiled the whole scene with `renderer.compile` long
  before the God Hand installed its plane (and before the lamps and the shading were set); a material keeps every program it has been
  compiled with, so all thirteen lived on unused. Its own purpose was already met: the warm-up compiles hidden objects too, and the prime
  draw shows them.
- **Fix:** the rave has no warm-up of its own (main.js no longer calls one); the boot's warm-up compiles and draws it with everything
  else. Measured after (the same listing): the thirteen are gone (no program is left without the plane but the shadow's depth
  programs, which never clip, and one screen pass compiled in play), the rave's beams, ball, wire, pools and specks each still have
  their program at boot, with the plane and the eight lamps, and perf's programs compiled after the warm-up stay at 2, neither the rave's.
- **Rule:** 96.

### 2026-10-08 · An ostracon dug out on a dune's slope lay flat, and the steepest dig hovered over the drawn sand (found in review)
- **Seen:** the buried ostraca lie on slopes of 8 to 25 degrees (five of the six sites, 13 degrees or more at four); dug out, each lay level
  while the sand under it did not: measured against the drawn sand at the dig on a 21.6 degree slope, its rim stood 4.6 cm above it at
  one edge and 3.3 cm under it at the other, so a third of the painted face was covered and the rest hung over the slope. At the
  24.5 degree dig the sand's height function stands 15 cm above the sand that is drawn (and walked on), so the veiled mound hung in the air
  and jumped down to the ground when the pick lifted it.
- **Cause:** the dig put the ostracon at the function's height (`heightAt`) and turned it about the world's up only (CASEBOOK 64 said so).
- **Fix:** `build()` and `drop()` take the point and the normal from a ray down onto the sand (the one `drop` already cast), and
  `Ostracon.lieOn(normal, yaw)` turns the look's up to the normal (never past 40 degrees); the veiled look, the one rising and the one
  lying all use it. Measured after on the three steepest digs: the look's origin 0.0 cm over the drawn sand, its rim under it 0.0 cm, over
  it 2.9 cm at most (the ostracon's own curve is 1.6 cm of that); the face shows whole.
- **Rule:** 64 (a look that lies on a surface is given the surface's normal and height by whoever places it).

### 2026-10-08 · The sealed room's stele was drawn inside its shut walls and offered to F through the back wall (found in review)
- **Seen:** with the sealed room's door shut, `Ostraca.near()` offered the stele from outside the back wall: it stands 0.8 m inside a
  0.4 m wall and the reach is 2.2 m, so the chevron stood over the wall and `stele.read` fired without the fork ever ringing in the
  door (measured: `near()` from 1.9 m behind the stele returned it). Its 9,000 triangles and shadow calls were drawn for no one.
- **Cause:** the stele was always drawn, and `near()` asked only the distance; the guard on `look.group.visible` (made for the cavern's
  stele) had nothing to read for the sealed one.
- **Fix:** the sealed stele is hidden while the door is shut and shown by `open()` (and at load, when the door was opened before);
  `near()` offers a stele only while its look is drawn. Measured after: shut, `near()` from the same spot returns nothing; open, the
  stele inside is offered.
- **Rule:** 88.

### 2026-10-08 · A stele's sand bank was a pale square on the great cavern's stone (found headless, swapping in the ostraca's looks)
- **Seen:** the stele in the great cavern's upper ring stood in a bright rectangle 1.8 m by 1.4 m on the gallery's dark stone
  (the builder's headless shot); in the Dunes it never showed, sand on sand.
- **Cause:** the bank (`vfx/ostracon.js` `bankGeometry`) is a plane whose height falls to nothing toward its edge, but every vertex kept
  the sand's colour at full strength: its flat margin is sand-coloured floor laid over whatever floor it stands on.
- **Fix:** the triangles of the margin are cut away where the bank is under 4 to 12 mm high (the line wandering by noise), so it ends
  as a drift on the gallery's stone and on the Dunes' sand alike, in the mound's own sand material. (A vertex-alpha fade was tried
  first: it looked softer but cost a transparent shader program, and the Dunes stood at the 160-program budget.)
- **Rule:** 86.

### 2026-10-08 · The plaster patch was painted far too dark (found headless, before it shipped)
- **Seen:** the first plaster patch on the workshop's west wall rendered near black (measured RGB 45, 0, 10 against the wall's 125, 32, 22).
- **Cause:** its canvas was painted from `THREE.Color` channels read raw (`c.r * 255`): with colour management on those are linear
  values, so every colour went onto the canvas as if much darker, and the HSL shifts were made in linear space too.
- **Fix:** `vfx/plasterpatch.js` reads `getRGB(target, SRGBColorSpace)` and shifts shades with `getHSL`/`setHSL` in `SRGBColorSpace`;
  measured after: the skim 129, 37, 23 against the wall's 125, 32, 22, a shade off as meant.
- **Rule:** 87.

### 2026-10-08 · A burning light showed as a hard polygon, then as a glow cut straight (found in the firing's frames, review of the press)
- **Seen:** at a firing the attribute's light hung over its tile, and a pale flat 12-sided disc lay round the tile, its edges straight; in
  a true firing, after the glow was softened, it was cut along a straight line across the bath.
- **Cause:** the light's glow (`halo` in the code) was an additive sphere of 12 by 8 segments at full opacity (a polygon from above, grown 1.6 times at the
  burn); a soft camera-facing sprite in its place was cut by the bath's and the kerb's planes where the light dives to 4 cm over them.
- **Fix:** the glow is a soft radial sprite (`vfx/alchemy/huering.js`), drawn after the marks and with the depth test off while its light
  is over the kerb or the bath (a seated, lifted or diving light); the core sphere is 20 by 14.
- **Rule:** 84.

### 2026-10-08 · Opening the press view wrote the player's log fold to their saved choice (found reading the review, Calissa)
- **Seen:** reading `vfx/alchemy/presslook.js`: it folded the log to its tab strip when the view opened and unfolded it for 4 seconds for
  every line said; `setMini` keeps what it is given in the saved choice each time, so a tab closed in the press view left the log folded
  at the next boot, and a line said while they typed could fold it under them.
- **Cause:** the setter is the player's own (the fold button, the backslash key) and kept its argument unconditionally.
- **Fix:** `setMini(v, keep = true)` (`feedback/gamelog.js`, a small crossing): the press look folds without keeping, restores what it found
  when the view is left, and holds the log open while they type.
- **Rule:** 85.

### 2026-10-08 · Leaving the press view with a lump in the hand threw on the next frame (found headless, Calissa)
- **Seen:** with a lump carried at the spirit press, F (or Esc, or W A S D) left the press view, and the next frame the garden's grab
  threw `Cannot read properties of undefined (reading 'radius')`; reproduced headless by setting what the station set and leaving.
- **Cause:** the station wrote its carry into the garden hand's own `held` (`hand.held = !!this.carry`, a boolean where the hand keeps
  the body it holds) to get a pinching pose, and the leave returned before the line that set it back; the garden's grab then read
  `held.body.radius` off `true`. The same flag also sent the hand to the last thing it had held and played the garden's grab clip.
- **Fix:** the station no longer touches the hand's state: the hand's clips read the station's own `carry`, `hover`, `lever` and
  `walk` (`godhand/godhandclips.js` `atPress`), and where the hand stands is the press's look (`vfx/alchemy/presslook.js` `handPoint`).
- **Rule:** 82.

### 2026-10-08 · The spirit press stood a metre under its bath, its drum inside the basin's plinth (Calissa, from the side renders)
- **Seen:** from the side the press's drum was hidden behind the basin's plinth, its front lip 0.28 m under the liquid and 3.22 m from
  the centre, inside the ware ring (measured headless), so no spout could pour from it into the bath.
- **Cause:** the bath was laid level over the highest ground under its footprint, the press stood on the ground 4.35 m north, and on
  the Athanor (10 m across) the ground falls 1.06 m in that distance: two parts that work together were each placed on their own ground.
- **Fix:** the press stands in the bath's own frame, 4.35 m north and 5 cm under the liquid, on **the press's footing** (a round of the
  basin's stone with its own skirt into the ground, merged into the basin's mesh: `vfx/alchemy/basin.js` `FOOTING`); the root spout
  then reaches from the drum's lip over the ware ring and the kerb, and the thread falls into the bath at north.
- **Rule:** 83.

### 2026-10-08 · A cracked vessel in EYE CUP or JELLY-CROWN lost the violet thread in its cracks, and its mending gold read orange and green (Calissa, the reviewer of the Great Slip Jelly's glazes)
- **Seen (headless, cracks 0.85 on every region, then mending, four looks side by side: terracotta, guan, EYE CUP, JELLY-CROWN):**
  terracotta's and guan's cracks carry a bright violet thread of Lachryma and, mending, a cream-gold line; EYE CUP's threads were a
  faint orange scratch (none at all over its black) and its gold orange, JELLY-CROWN's a dull green and its gold green.
- **Cause (measured):** `kintsugi.js` adds the cracks' Lachryma and the mend's gold to `totalEmissiveRadiance` straight after
  `#include <emissivemap_fragment>`, and the glaze's `ownLight` multiply (`totalEmissiveRadiance *= finEmC`, put there for the firing)
  came after it in the same program, so it multiplied the violet by the clay's or the celadon's colour and the black's black.
- **Fix:** the multiply moved ahead of the emissive map (`LIGHT_BEFORE` in `vfx/finish.js`): it scales only what the map then
  multiplies (the painting's own glow and the firing's), commutatively, so the firing frames are unchanged and the cracks' light is
  added whole behind it. Both now read as terracotta's and guan's.
- **Rule:** 81 (amended).

### 2026-10-08 · Fired in EYE CUP or JELLY-CROWN, the vessel barely warmed where yohen glowed kiln-orange (Calissa, the Great Slip Jelly's glazes)
- **Seen (headless, before it shipped):** the firing's frames (vessel.fireT 2.5, 1.3, 0.25, the workshop): yohen's body kiln-orange
  cooling to its black; EYE CUP's and JELLY-CROWN's a faint warm tint, the eye's black and the mask not at all.
- **Cause (measured):** the armour and the mask glow back their painting (`character.js` PAINT_LIGHT 0.45: the emissive times the
  painting), and a glaze sets that emissive to its colour. A pattern in colours of its own (the eye's black, white and blue; the dip's
  slip under the celadon) would glow the glaze's colour over them (the black lit red in the shade), so those two were given a white
  emissive, multiplied in the shader by the colour each point is (`finEmC`). That multiplied the firing's orange too: orange times the
  clay or the green is a dim glow, times the black none.
- **Fix:** `vfx/finish.js` reads the firing's share from the emissive's own hue (1 - b/r: 0.99 at the kiln-orange the firing starts
  from, 0 at white) and lets that share through unmultiplied: at rest each colour glows its own, firing the whole body glows orange and
  cools into it. The three frames now read as yohen's (`ownLight` in finish.js, `vessel.js` dress).
- **Rule:** 81.

### 2026-10-08 · The fret under the crosshair was not always the fret the strike read (the crystal frets' review)
- **Seen (the reviewer, by ray into the mesh, 20 000 looks at three formations):** a look at a fret near its edge sounded the next fret
  over: 15 in 100 over all poses, 3 to 4 in 100 at the camera's own play distance (7 m out, 1.5 m up), 50 to 70 in 100 looking steeply
  down (4 m up, 2 m out).
- **Cause (measured):** `aimHeight` read the height where the look passes the formation's axis, but the frets are drawn on its skin,
  and the look meets the skin before the axis: a look pitched down by `a` meets the skin `r tan a` higher (the stave's half width is 0.3
  to 0.37 m, a fret is 0.4 to 0.67 m).
- **Fix:** `aimHeight` takes the height where the look meets the stave's near side (half its width across the look, tapering over the
  point), by one correction. Measured the same way: 5.7 in 100 over all poses, 1 to 4 in 100 at play distance; the rest is the six-sided
  prism's facets, the lean and the lesser spires in front. With the game's own camera, 30 of 30 looks 8 to 22 cm from a fret's edge read
  the colour they showed (the old reading missed at 1 cm).
- **Rule:** 80.

### 2026-10-08 · A wrong strike at a crystal's point showed gold, the colour of the true note (Calissa, the crystal frets)
- **Seen (Calissa's survey of the crystals):** aiming at the point of a formation (formation 3, its sweet spot at 0.316 of its
  height) sounded a wrong note and burst in gold, the colour `music/tone.js` keeps for "the home note: a crystal struck true".
- **Cause (measured):** `crystaltuning.js` stepped through the seven degrees of the major scale (`deg` from -7 to 7, a step a seventh
  of nine tenths of the height from a hidden, random spot), and `crystals.js` coloured the burst `degreeColor(deg)`, which wraps round
  the Crucibelle's five colours: deg 5 read as 0. At the point of formation 3, deg = round((1 - 0.316) x 7) = 5, so gold. 9 of the 18
  formations could reach +-5 at one end (3, 5, 6, 10, 11, 13 to 16, by their sweet heights).
- **Fix:** the owner's frets (2026-10-08): five fixed frets on every stave (`fretAt(u)`, a fifth of the span each), fret k sounding the
  Crucibelle's k-th note, the sweet spot a fret (`spot.fret`, one draw, as the height was, so every formation and the seed's sequence
  are as they were); `deg` is now `fret - spot.fret`, -4 to 4; the burst takes `degreeColor(fret)`, 0 to 4, which never wraps, so gold
  is the root fret, the foot. The fork's reference burst is neutral (the fork's own light): in the sweet fret's colour it would show the
  answer. Measured headless (20 checks, game noon and midnight): every fret struck sounds itself (fret, `pitchOff`, key + 12 + SCALE[k]),
  each fret's colour within 5 degrees of hue of its note's at noon, the sweet fret from the spot's bearing opens it.
- **Rule:** 79.

### 2026-10-08 · The Solar Skiff's hull and cloth compiled twice, the second at their first draw (Calissa's review of the skiff's model)
- **Seen (headless, programs counted before and after the first summon):** the model's load compiled its programs (`compileAsync`, off the
  main thread, as intended), and the first frames that drew it built `Skiff_Hull` and `Skiff_Cloth` again: 3 programs new at the first
  draw, two of them the PBR shaders with eight point lights and the sun's shadow, a stall the load was written to avoid.
- **Cause:** the two programs differed in one number of the cache key, `numClippingPlanes` (0, then 1). `compile` reads the clipping
  state the last render left; the trail map's pass (`world/ground/trailmap.js`) sets the renderer's planes to none, renders, and puts
  them back without telling the clipping state, which holds zero until the next draw; the God Hand's cutaway plane is always installed,
  so every real draw has one. main.js's warm-up already renders an empty frame first for this (its comment says so); the skiff's lazy
  load did not. (A page that draws between its ticks, as a player's does, leaves one plane; the manual mode the sweeps, the stress test
  and `npm run perf` run in does not, and counted the extra programs.)
- **Fix:** `Skiff.load` renders an empty scene into the post target before `compileAsync` (courier/skiff/boat.js). Programs new at the
  first summon draw: 3 to 1 (a depth program), and no duplicate of the hull or the cloth.
- **Rule:** 78.

### 2026-10-08 · The summon's sigil was cream on the noon sand and could not be seen (Calissa's review of the skiff's model)
- **Seen (headless, from above, game noon):** the ring of marks the boat rises out of was a faint pattern of paler arcs on the sand; at
  play distance there was no ring.
- **Cause:** the sigil is drawn with the Courier's energy (`CourierEnergy`: cream, a warm glow at 0.3), which on lit sand is the sand's
  own colour.
- **Fix:** the energy burns at 1.7 above its rest while the ring is out (frames 4 to 25 of `Skiff_Summon`, then eased off by 0.9 s)
  (courier/skiff/boat.js posePhase): the marks stand out white, the engine and the mast light with them.
- **Rule:** none new (a glow is judged in the light it will be seen in, at noon as at night).

### 2026-10-08 · The Solar Skiff's flare drew a black wall across the screen (Calissa, the skiff's model)
- **Seen (headless, the owner's model on the board, Shift held):** a black quad tens of metres wide over the view from the flare's
  start to its end.
- **Cause:** the flare and the summon's sigil are collapsed to a point in the .blend and opened by their bones scaled 1000 to 1264
  times. The outline shell (render/outline.js) pushes each vertex out along its normal *before* skinning, so the bone scaled the
  outline's thickness by the same thousand: a shell 10 to 30 m across round the engine. (The sigil's went straight up, out of view.)
- **Fix:** the Lachryma (`CourierEnergy`: the engine, the finial, the inner mast, the flare and the sigil) is not outlined, as the
  Courier's own is not (courier/skiff/boat.js); the hull and the fittings keep theirs (their bones scale 0.001 to 1.16).
- **Rule:** 76.

### 2026-10-08 · The first summon in the Dunes rose with no board for a quarter second (Calissa, the skiff's model)
- **Seen (headless, the first Y after arriving in the Dunes):** the rider's summon played with the board hidden until 0.2 s in; every
  later summon showed it from its first frame.
- **Cause:** the skiff's group is a top-level object with no zone of its own; the zones (render/zones.js) placed it where it waited
  hidden, at the origin, in the workshop, and kept it hidden from the Dunes until their next pass, a quarter second later.
- **Fix:** the group is `zoneFree` (courier/skiff/boat.js): the tech shows it only in the Dunes and hides it everywhere else.
- **Rule:** 77's note: a thing that is moved into place when it is wanted says how the zones should see it.

### 2026-10-08 · At every mount the parked skiff jumped to the rider and sank into the sand (Calissa, the skiff's model)
- **Seen (headless, F at a parked board):** in the mount's first frame the board left where it hovered, stood under the rider 0.9 m
  away with its deck at the sand (0.6 m down), then slid back and rose over 0.35 s.
- **Cause:** skiff.js tick placed the group at the Courier's own position in every phase but the dismount, the bail and the getting
  up; the mount moves the Courier from where they stood to the board and up (stepPhase), so the board went with them from the
  first frame. (The old procedural board did the same; the owner's model, 4.5 m tall, made it plain.)
- **Fix:** in the mount the board stays at its parked place and heading; the rider is placed from the Courier's position onto the
  deck's spot, the spot's offset eased in with the step (courier/skiff/skiff.js tick).
- **Rule:** 77.

### 2026-10-08 · The god hand's pointing finger fell open in its hold, it stayed at a clip's last frame when wanted again, and the Jar shut its lid before it swallowed (Calissa's review)
- **Seen (headless, after the clips went in):** a held move (the hand's `point` while Sunder is held, its `scoop`, the Jar's `hop`) is
  played in to a held stretch cut from the clip. In the page the ring finger of `point` stepped 102 degrees in one frame at the seam
  into its hold (the cut clip had 9 of the clip's 20 tracks), and `scoop` lost 7: the hand showed an open claw, not a point. In a
  catch the Jar was `open` while the Figment struggled, `idle` (lid shut) for the 0.45 s it was drawn down the tether, then `gulp`
  from its first frame. And a held move let go of (Sunder not cast, a carve stroke ended) and wanted again inside its 0.4 s way out
  stayed at its clip's last frame for as long as it was wanted (`point/once@44`, `scoop/once@54`).
- **Cause:** `RigClips.cut` used `AnimationUtils.subclip`, which keeps the keys inside the stretch and nothing else, and the clips are
  lean (a straight run of poses is two keys): a bone with no key inside the stretch is dropped from the cut clip, and the mixer puts a
  bone no action drives back at its rest pose. The Jar's chooser read `catch.held`, which `HandCatch.hold` clears when the draw-in
  begins, not the look's `take`. The hand's chooser (`GodHandClips.choose`) returned at once when the move wanted was the move
  named, though that move was in its way out or done, and a done move is not replayed without `again`.
- **Fix:** `cut` samples every frame of the stretch through each track's own interpolant (all 20 tracks, held pose within 2 degrees
  of the full clip's at every frame, no step at the seam); the Jar's chooser keeps `open` while the look is taking, so the gulp enters
  at frame 7 as its `from` meant; the hand's chooser returns only for a move in its loop or its hold, and plays one that is in its
  way out or done again.
- **Rule:** 73, 74 and 75.

### 2026-10-08 · The god hand's and the Pneuka Jar's own clips would have been wiped, bent, scaled twice and left their cracks behind (Calissa)
- **Seen (the surveys, measured headless before the clips went in):** the hand's pose code reset all 18 bones to rest every frame
  (godhand.js poseHand), so any clip under it was wiped; run after a clip, the finger limits learned from the old rest pose bent the
  owner's clips on most frames, worst 27.3 degrees at `thumb03R` (punch, crush, fistClench, spawn, vanish). The Jar's group was
  scaled by the god hand (in and out), by the reforge's regrow and by the garden's squash spring, while its new clips scale its
  `root`: two squashes. Its crack ribbons were rigid in the group's space: up to 24.7 cm off the surface at the top of the hop,
  19.1 cm in `sad`.
- **Cause:** one procedural layer per rig had stood in for animation; the clips now carry what it did (the curl, the scale-up, the
  squash), and the limits were not the rig's.
- **Fix:** each rig plays its own actions on its own mixer (`courier/anim/rigclips.js`; `godhand/godhandclips.js`,
  `godhand/pneukajarclips.js`); poseHand, the finger curl and every scale write on the hand and the Jar are gone; the limits are
  learned from the clips (rom.js `GODHAND_ROM`, `PNEUKA_JAR_ROM`: 0 of 1,506 and 0 of 621 frames clamped, and none in a crossfade);
  the cracks are skinned to the Jar (`vfx/crackskin.js`: worst 0.55 cm off the posed surface over every clip); the garden's hop
  and landing go to the Jar's clips (`vfx/garden/jarhop.js`), the spring kept for the workbench's stand-in.
- **Rule:** 69, and 58 widened.
### 2026-10-08 · The clapperjars' pupils sat on the rim of their white disc eyes (Calissa's review of the owner's texture)
- **Seen:** with the grey texture on, the disc eyes are white (the painting's white tab) and each drawn pupil stood at its disc's inner
  edge: the jar looked cross-eyed (the face at 0.9 m). Before the texture the discs were terracotta and the offset was not seen.
- **Cause (measured):** the pupils in `Clappers.spawn` were at x ±0.055 in the eyes bone's space. The disc eyes (the vertices weighted
  to that bone) are flat in that bone's x-z plane, 0.05 across, spanning x 0.056 to 0.106 on each side, centred at ±0.081. The
  pupils were placed for the drawn eyes of an earlier model and left where they were when the owner's discs came (2026-10-06).
- **Fix:** the pupils at x ±0.081, scaled 0.7 across and along the disc (0.039 wide, inside the 0.05 disc): a ring of white round each.
- **Rule:** none new: a part drawn over a model's feature is placed by the measured centre of that feature in the same bone's space.

### 2026-10-08 · Every clapperjar had lost its rim (Calissa, putting on the owner's texture)
- **Seen:** measured, not seen: the shared clapperjar material carried `RIM 0.256` (render/toon.js `addRim`, the Courier's thin
  Lachryma rim), and every jar in the workshop drew with `{ STANDARD: '' }` alone. The owner's grey texture would have lost its tint
  the same way (read from three.js, not run: the copy keeps the map but not the hook, so each jar would draw a plain multiply).
- **Cause (measured):** `Clappers.spawn` gives each jar `this.mat.clone()` (its own colour, for the kiln's heat). three.js's
  `MeshStandardMaterial.copy` sets `defines = { STANDARD: '' }` after copying the rest, and `Material.copy` never copies
  `onBeforeCompile` or `customProgramCacheKey`. The colour, roughness and flat shading came across; the rim never did.
- **Fix:** each jar's material is `cloneTinted(this.mat)` (`vfx/greytint.js`): the clone with the defines and the hook carried over.
  Headless, all six jars: `{ STANDARD, RIM: 0.256, GREY_REF: 0.1329 }`, the texture on each, one program for all six.
- **Rule:** 72.

### 2026-10-08 · The garden's water was two programs, and the perf budget broke (Calissa, the review of her garden look)
- **Seen (`npm run perf` on Calissa's branch with `art-garden-water-r` merged, against her branch alone):** programs 159 / 162 / 162 (workshop /
  dunes / well) became 165 / 168 / 168 where the garden's work was reckoned at four more; the budget is 164.
- **Cause (measured, the warm-up's programs listed by name):** six new programs, not four or five: the grounds, the rain, the plants, the
  cascade and the water **twice**. The two water programs differ in one bit of their cache key (`flipSided`, 5123 against 1027): the water is
  transparent and double-sided, which three.js draws as a back-face pass and a front-face pass, a program each.
- **Fix:** `forceSinglePass: true` on the water's and the cascade's materials (`vfx/garden/gardenwater.js`, `gardencascade.js`): one pass, one
  program, and nothing drawn differently (a sheet of water and a ribbon have no second layer to order; the pond looks the same in the
  renders before and after). Boot is 158 programs on this branch (it was 159). The garden's looks are still five programs (the grounds, the
  water, the rain, the plants, the cascade), each parked in the warm-up so that nothing compiles on entering, pouring or the first cascade;
  the budget has to carry them (the handoff to Petra says by how much).
- **Rule:** 93.

### 2026-10-08 · The garden's rain rings were NaN until each was first laid (Calissa, the review of her garden look)
- **Seen (reading `vfx/garden/gardenrain.js`, then the shader's arithmetic by hand):** the pool of 360 rings starts with `iB` (the ring's
  up) at zero, and the vertex shader took `normalize(iB.xyz)` for every ring, laid or not.
- **Cause:** `normalize(vec3(0))` is NaN; the cross products and `wp = iA.xyz + (t * aQ.x + b * aQ.y) * s` carried it (`NaN * -0` is NaN, so
  `on = 0` did not save it), so every unused ring had NaN corners. SwiftShader drops such a triangle; the spec leaves what a NaN corner
  does undefined, so another driver might draw it. The streaks were safe (a dead one is moved to its head by `if (live < 0.5) wp = head`).
- **Fix:** the ring's up is `iB.xyz * inversesqrt(nl)` only when its length is above 1e-6 and straight up otherwise, its age divides by
  `max(life, 0.001)` and `on` also needs a life of 0 or more. SwiftShader never showed the fault (it drops the triangle), so it was found by
  reading, and the rain's renders after the change were looked at (the rings and streaks are unchanged).
- **Rule:** 92.

### 2026-10-08 · The garden's tufts floated after a stroke, and the cap dropped the crown first (Calissa, from the survey)
- **Seen (Calissa's garden survey, 2026-10-08):** a pull or press under grown plants left their tufts hanging in the air or sunk in the
  clay until the green next changed; with more than 3,000 planted cells, the Dantian's crown lost its tufts first.
- **Cause (read, then measured):** `plants.js` redrew a planetoid's tufts only when its own grid changed (`dirty`); `realm.reshape`
  never told it the clay had moved. The cap filled in cell order from the south pole. Measured with the new look's own check before it
  follows: 10 of 239 plants more than 2 cm over their ground after a 6-pull, 3-press stroke, the worst 0.137 m.
- **Fix:** the plants' look (`vfx/garden/gardenplants.js`) keys on each planted planetoid's clay version too, and is placed again
  within 0.1 real seconds (the debt kept: rule 89), nearest the eye first. After the same stroke: 0 of 239 over their ground (the worst
  2.5 cm under, its foot let down by the slope: rule 64).
- **Rule:** 91.

### 2026-10-08 · The garden's water had a hole at each pole, streaks near the crown, and compiled on the first pour (Calissa, from the survey)
- **Seen (Calissa's garden survey, 2026-10-08, `03-water-standin.png`; Petra's note, 2026-10-07):** broken white streaks in water near
  the Dantian's crown; no water within half a metre of a pole; the first pour hitched while the water's program compiled; and the
  water hid under the planetoid wherever the planetoid's mesh was coarser than the clay.
- **Cause:** the stand-in (`watermesh.js`) was its own latitude-longitude sphere on the clay's grid: its cells near the crown were
  slivers (0.2 by 1 m at 80 degrees), its quads stopped a row short of each pole, it drew only triangles wet at all three corners (so
  the shore stepped cell by cell), and it was made on the first pour, after the warm-up (rule 18).
- **Fix:** the water's look (`vfx/garden/gardenwater.js`) is drawn on the planetoid's own vertices (the shared icosphere the ground is
  drawn on), each at the drawn ground plus the water's depth plus 1 cm, a lake level to its bank; triangles with a wet corner are
  drawn and the shore is cut by the depth interpolated across them (5 mm, fading in to 6 cm), so the water always stands 1.5 cm or
  more over the ground where it shows (rule 1); one material for every planetoid, parked in the warm-up. Measured headless on the
  Dantian (four pits, a run down a hill): 0 drawn triangles dry at every corner, 0 wet vertices under their ground (the least 1.5 cm
  over), 0 programs compiled on entering or pouring; two frames 1/60 s apart with the camera still flip 0 to 10 pixels of 368,640,
  and a 4 mm camera move flips no more with the water than without it.
- **Rule:** 90 (and 1, 18).

### 2026-10-08 · The garden's ground worn by its water stayed drawn as it was on every other planetoid (Calissa, from the survey)
- **Seen (Calissa's garden survey, 2026-10-08):** with two planetoids eroding at once, one of them kept its old drawn ground until the
  next stroke ended on it; the Jar stands on the clay (`radiusAt`), so it stood off the ground it was drawn on.
- **Cause (measured, this build, main's `reshape` put back in the page):** `realm.reshape` skipped every other call that was not `now`
  on one counter (`shapeT`) shared by every planetoid, the hand's strokes and erosion's look tick; the water's look tick clears each
  planetoid's `eroded` flag and then calls `reshape` for it, in site order. Three planetoids worn by 0.3 m in one tick: the Dantian and
  the Athanor drawn 0.299 m off their clay, the Terraces right; the next tick the other way round. The skip was there because the
  redraw cost a full `toLook` (heightAt at every vertex, all normals: 4.5 to 6 ms at the clay's fineness).
- **Fix:** the look keeps a map onto the clay's grid and redraws only the cells that changed since it last looked
  (vfx/garden/planetoidmesh.js `refreshFromClay`, through `Clay.toLook`): a brush tick in the page 0.1 to 0.3 ms at 3 m, 0.8 to 1.8 ms at
  12 m (p50), so `reshape` runs at every call and the skip is gone (world/garden/realm.js). The same three planetoids, three rounds:
  every one within 2.6 micrometres of its clay after each tick.
- **Rule:** 89.

### 2026-10-08 · The title's chess pieces stretched with their clips, and their bases floated on the drain (Calissa, from Petra's measure)
- **Seen (the owner):** "the chess pieces are stretching all over the place with their animations, and they need to have their bases
  snapped to the surface of the checkerboard black hole" (THE FOOL'S PRECIPICE).
- **Cause (measured):** two. (1) The export, not the file. In `chess_pieces.blend` each mesh stands with its rig at the rig's place in
  the row, parented with an inverse that undoes that place (+15 the pawn, +12 the rook, +9 the knight, +6 the bishop, +3 the queen, 0
  the king). `scripts/export_chess.py` zeroed the rig's location and the mesh's but kept the inverse, so each mesh left its rig by that
  much (the pawn's POSITION x 14..16, its joints and inverse binds at x 0) and every bone's turn swung the body round a pivot that far
  off: the widest frame of lookAround 14.1 units (the pawn), 11.9 (the rook), 9.2 (the knight), 6.7 (the bishop), 4.6 (the queen)
  against 2 at rest; the king alone was right (2.1). On the board the bases' rims stood −11.0 m to +9.3 m off the surface. (The script
  also wrote `chess.bin.glb`: Blender adds `.glb` to any other name, so the pack had not been re-exported since its rename.) (2)
  `title/board.js` stood each piece upright at its square's centre; the drain slopes 0.65 (33 degrees) at 14 m, so with the export
  fixed a rim still floated downhill and sank uphill by up to 1.5 m at 18 m out, 0.65 m at 40 to 80 m.
- **Fix:** the export keeps each mesh's matrix against its rig, clears the inverse, takes the pair to the origin, prints each mesh's
  centre on its rig (all 0.0000) and warns when one is off; it writes the `.glb` and renames it to the `.bin`. Every clip's widest
  frame is now its rest width or what the clip authors (the pawn's lookAround 2.00; bow, fall and getUp lean or lay the piece over,
  2.6 to 5.2, as the king's always did). `board.js` tilts each holder from up to the board's normal (`boardSlope`, analytic), its yaw
  and its clip on top, and lets it down by half the radial bend times the rim's reach squared, so no edge floats. The rim against the
  board while a piece stands idle, over 40 s of play headless: +0.2 cm at most; across the radius the board rises round the base, so
  that edge sits in by 21 cm at the steepest square a piece stands on (the queen, rim 2.9 m, 18 m out), 11 cm at 25 to 40 m, 3.5 cm at
  40 to 80 m, under 1 cm beyond (a pixel at the title's camera is about 19 cm at 100 m). The drain's sink, the fall and the spawn are
  as they were.
- **Rule:** 63, 64.

### 2026-10-07 · The Tithe's opening threw every frame (Calissa)
- **Seen (Dovina's room sweeps):** `TypeError` reading `rig` at vfx/chestfx.js:45 every frame of the Tithe's opening; the rest of that
  tick after main.js's chest update was skipped.
- **Cause:** the Tithe's act sets `chests.cur` with no `.chest`; the chest's effects read `C.chest.rig` whenever `chests.cur` was set.
- **Fix:** the effects draw only for a current act that has a chest with a rig (vfx/chestfx.js).
- **Rule:** 35's note, widened: a hook asks what it was given, not what the field usually holds.

### 2026-10-07 · The Pneuka Jar unseen after the god hand, in the garden
- **Seen (the owner):** in the Spirit Garden, ` and back: the Jar invisible.
- **Cause (measured):** in the garden ` entered the world's god hand, and its exit sets `jar.group.visible = false`; the garden draws
  the Jar with that same model and never set it visible again (headless: `visible: false` after the toggle).
- **Fix:** in the garden ` opens the overhead view (`world/garden/gardencam.js`) and never the world's god hand; and the realm sets the
  model visible every frame it is the Jar's (`placeJar`), hidden only in first person.
- **Rule:** 58.

### 2026-10-07 · The held Pneuka Jar sank into the planetoid, then fled
- **Seen (the owner):** grabbing the Jar with the hand, you slowly clip through the planetoid you are on.
- **Cause (measured):** the held Jar went where the cursor's ray reached at the grab's distance, with no floor (dragged down, 5.6 m
  under the ground); and the camera followed the Jar, so the ray was re-cast from a camera the Jar had just moved, and the Jar ran away
  (130 m/s; held still afterwards, 459 m to 861 m off the ground in 4 s).
- **Fix:** what the hand holds is kept at least 0.1 m over the ground under it (`hand.js` grab); a followed view holds still while
  the Jar is held (`gardencam.js` anchor). Measured after: 0.6 m over the ground through the whole drag, and still.
- **Rule:** 57.

### 2026-10-07 · The garden's water flickered as specks round its shore
- **Seen (Petra, headless, the first build of the water):** white specks on the ground round a filled pit.
- **Cause:** the water's dry points were tucked 0.25 m under the clay's ground, at the clay's 1 m grid; the planetoid is drawn on a
  coarser mesh (about 3 m), whose ground lies above or below the clay's between its vertices, so the tucked edges poked through.
- **Fix:** only the triangles wet at all three corners are drawn (`watermesh.js`). The water under the coarse ground still does not
  show until the planetoid's mesh is as fine as the clay's (Calissa's, asked).
- **Rule:** 1 (no aliasing crawl).

### 2026-10-07 · The unarmed V and the psygun's moves, reviewed: eight faults found and fixed (Calissa, fistgun review)
- **Seen, measured headless (`.scratch/fgr.mjs` against a stub creature; films front and side):** (1) the front kick knocked what it
  struck sideways, `knock(-6.0, 0, 0.2)` facing +Z, the shove `(8.9, 0, -1.0)` (sideways and back toward the Courier), the jab and the
  cross left and right by turns, and a clapperjar flew the same way; (2) the uppercut and the ground pound replaced the engine's
  `poseFix`, so neither faded in from the pose before it, and the join state they left (`from`, `fadeT` 0) faded the next move in from a
  pose long gone; (3) the kick switched off mid ground pound (the System, a reset) left its Launch running: the Courier hung at 0.93 m,
  the clip frozen, for the Launch's six seconds; (4) R twice in the fan paid 8 Lachryma for no shots (a fan restarted in place); (5) the
  flourish went on spinning the gun while X or a ladder holstered it; (6) the roundhouse handed its 126 degrees to the facing and left
  them facing away, so the next press turned the whole body 127 degrees in one frame; (7) a jab begun 1.4 m from something stepped in at
  6.0 m/s on the run's legs: a toe moved 0.38 m in one frame three frames in; (8) the leg sweep put the hips at 0.35 m with the Soul
  Brush on the back lying through the legs and the floor. Also `kick.hit` carried no `by`, and the glossary's "sweep" was Dovina's room test.
- **Cause:** (1) melee.js's sweep direction is tangential, right for a blade; the kick passed it on; (2) `lift()` assigned new hooks
  over the engine's; (3) `Moveset.cancel` only unhooks the carrier's `onEnd`; (4) the engine lets a special restart itself; (5) the
  flourish's clock ignored the holster; (6) the kick had no stance, so nothing turned the body back to the aim between moves;
  (7) the engine's standing legs leave the step's speed to the run's; (8) a floor pose with the kit on (rule 44).
- **Fix:** (1) `FistMoves.blow` drives every blow away from them, `hit.side` (0.5 for the haymaker, the roundhouse and the leg sweep)
  keeping a share of the swing: now `(0.2, 0, 6.0)` and `(1.0, 0, 8.9)`; (2) the hooks wrap the engine's; (3) `Kick.stop()` ends a
  kick-tagged Launch with the moves (they fall and land); (4) the gun's moves take no R while the fan plays; (5) the flourish stops when
  the gun is put away by other means; (6) `Kick.stance` while a move plays, as every held tool: the body turns back on the core's eased
  turn within 0.15 s and the next jab begins 3 degrees off; (7) the punch's own legs during the step's first 0.3 s (that jump is gone;
  the first frame's 0.52 m is the core foot IK's stride stretch reacting to the speed, left to Petra); (8) `bare` on the leg sweep hides
  the worn tools while the hips are down, as the emotes lying down.
- **Rule:** 45, 46, 54, 55.

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

### 2026-10-07 · The Soul Brush went through the floor under every sitting emote (Calissa, the emotes review)
- **Seen:** filmed from the side with the starting belt worn: under /sit, /hugknees, /meditate, /hover and /sulk the Soul Brush at the
  left hip ran down through the floor, and under /sleep and /recline it came back into sight under the floor as they got up. Measured
  on its model, the lowest point of every visible worn tool against the floor through all 134 emotes: the brush 0.135 m under (sit,
  meditate, hover), 0.235 (sulk), 0.313 (hugknees), 0.457 (sleep and recline, at 0.77 s into their exits); every other tool stays above.
- **Cause, measured:** the hide was only for lying down and only "halfway down to halfway up" of the clips (`bare`); a hip tool hangs
  0.36 m above the floor standing, so any pose that brings the hips lower than that puts it through the floor, and the exits are still
  low past their halfway mark.
- **Fix:** under any floor pose, a worn tool whose model reaches the floor goes out of sight until it is 3 cm above it again (measured
  on the model each frame, courier/moves/emote.js `offFloor`; its own tick shows it again, so nothing stays hidden). After, the same
  measure over the twelve floor poses: the lowest visible point of any worn tool is 0.004 m above the floor.
- **Rule:** 44 (measure every worn tool against the floor through the whole emote, not only the poses that lie down).

### 2026-10-07 · Sitting, /wave stood the Courier up through the floor in a fifth of a second (Calissa, the emotes review)
- **Seen:** /sit, then /wave while seated: the crossed legs unfolded to standing in 13 frames, the feet and toes down to 0.139 m under
  the floor on the way, the knees turning 15 degrees a frame. And leaving the hover halfway up its rise, the body sprang 0.3 m higher in
  0.15 s before it came down.
- **Cause, measured:** one emote into another stopped the old and crossfaded its last pose into the new over 0.22 s, whatever it was;
  from a floor pose that is a seated body blended to a standing one with no way up, the foot IK switched on at once under it. And a way
  in left halfway began its way out from the way out's start: the hover's way out starts at the top of the hover.
- **Fix:** from a floor pose a new emote waits for the old one's way out (courier/moves/emote.js `request`; `/stand` forgets a queued
  one); a way in left partway begins its way out as far in as the way in had still to go (`leaving`). After: sit into wave, the lowest
  foot -0.016 m and the wave begins when the Courier is up; the hover left at 43 % of its rise, the hips 0.439 m and then 0.438 m, down
  from there.
- **Rule:** 56.

### 2026-10-07 · An emote whose clip is missing would have waited for ever (Calissa, the emotes review)
- **Seen:** by reading, then tested with a clip taken out of the pack after it landed: `/bow` was accepted, never began, and said nothing.
- **Cause:** the refusal waited on the pack's promise resolving false; a pack that lands without one of the emote's clips resolves true.
- **Fix:** the refusal is said when the pack lands and the emote still cannot begin (courier/moves/emote.js `request`).
- **Rule:** 32 (every call a deadline).

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

### 2026-10-07 · The ledger counted what the Courier did not do (the room sweeps, `docs/plans/SWEEPS.md`)
- **Seen:** a shoal crossing added 3,904 m to `dist.total` (Footsore earned at sea); leaving a raid mid-wave counted its raiders as
  clapperjars downed (Clapped earned); the Dreamvane's twirl counted toward the cutlass's Turned Aside; "The Great Slip Jelly bursts."
  said twice; "You are now known as a Apprentice."
- **Cause:** the distance rule left out the god hand and the garden but not the rail (`tracking.js`); `clapper.down` carries no `by` and
  the dismissal reaches it through `hit()`; `guard.block` is emitted by both guards; `well.foe` and `foe.end` both said the burst.
- **Fix:** the rail is excluded from distance; `clapper.down` with a `by` other than the Courier's is not counted (Petra adds the `by`);
  the twirl counts as `guard.twirl`; one line, `foe.end`'s, which follows how it ended; the article chosen by the word.
- **Rule:** a ledger rule names what the Courier must be doing for it to count (on foot, the Courier's blow, this tool), never only what
  happened; a sweep checks each against a place where it must not count.

### 2026-10-07 · F never ended a talk, and each F at a Shrine rested again (the room sweeps, groups 1 and 2)
- **Seen:** in every room the sweeps found a key that closed something opening it again: a talk with any of the folk restarted on the
  F that ended it; a Shrine's page, the pier's and the Throwing Room's Index reopened (12 presses, 12 `shrine.rest`); B that picked the
  Braid on the Index opened the Codex; W held with the Index open sent the Courier 1,897 m to the Dunemaw. B, P, M, Enter and F8 opened
  over the kiln station; P under the maw wipe; M mid-crossing; the pointer locked over the kiln in 5 of 15 openings.
- **Cause:** the close ran on the key's own event (or the dialogue's frame), but the press stayed in `input.pressed` and was latched
  for the Courier's body that frame, so the place under them read it next tick. The Index took `e.repeat`. Each opener kept its own
  list of what it may not open over, and each list was short a window.
- **Fix:** `input.spend(...codes)` clears the press and, through `input.onSpend`, the latch; the dialogue box spends its keys every
  frame it reads them and on its end, the Index every key it takes, and it ignores repeats. One `game.windowOpen()` (`main.js`) read
  by B, P, the chat line, M (`cartography.js`), F8 (`qais.canOpen`) and the pointer lock.
- **Rule:** 48 and 49 (extended).

### 2026-10-07 · Travel set the Courier in the crude, beside Saggar, and out of a Well with pay it never gave
- **Seen:** `travel('jetty')` dropped them under the deck into the crude; `kiln` stood them 1.5 m from Saggar, so F talked to her;
  `tithe` 2.6 m from its mark; `/goto` mid-crossing left a full-size Courier on the sloop; travel out of a Dunemaw run said "Pay: 3
  cubes" and gave nothing.
- **Cause:** `travel` snapped every Dunes place to `heightAt` (the seabed under a deck); a place was only a point and a distance from
  it; nothing asked whether a crossing owned the body; the Well was ended with `false`, read as 'walk', which reports the run's pay
  while only `leave()` gives it.
- **Fix:** a place may give `stand` (the spot) and `deck` (its own height); the kiln and the Tithe stand on their marks; Strawman and
  the spray wall are places; travel and stand refuse mid-crossing; a run travelled out of ends 'abandon' (nothing paid, its log line
  its own).
- **Rule:** 23 (extended).

### 2026-10-07 · The Solar Skiffing trial won with gold in 1.1 s on foot
- **Seen:** running through the last ring first finished the trial; F at the Gnomon restarted it; back in the Dunes after travel the
  Courier was on the skiff unasked.
- **Cause:** a pass through any later ring counted, skipping the rest as "missed" at two seconds each; `start()` did not ask whether it
  ran; the skiff's `want` outlived the Dunes.
- **Fix:** only the next lit ring counts, and only ridden (Dovina's ruling: begun from the skiff too, so the Gnomon's offer shows while
  riding); `start()` refuses while running; out of the Dunes the skiff is put away. No lit ring is no win.
- **Rule:** a trial counts the act it names (a ring passed *on the skiff*) in the order it names; a sweep runs it the careless way.

### 2026-10-07 · Blade Mode outlived its tool, and the hand took 24 real seconds to open in it
- **Seen:** stowing the Sondelass in Blade Mode left the world at 5% speed for about six real seconds; ~ in Blade Mode opened the god
  hand over 24 real seconds; the hand could be taken mid time trial; the tuning panel's teleport left the hand's view 36 m off.
- **Cause:** Blade Mode ended at the holster's end, and the holster ran on game time slowed by Blade Mode itself; the hand's opening
  likewise. `godhand.canEnter` read `trial.active`, which the trial never sets (`running`). `course.teleport` moved the body under a
  hand still out.
- **Fix:** Blade Mode exits when the tool is put away and when the hand is taken; the hand reads `trial.running`; a teleport lets the
  hand go first.
- **Rule:** 30: what slows time ends with what began it, not on a clock it slows.

### 2026-10-07 · Each visit to the great cavern left two guns in the scene (the Dunemaw sweep)
- **Seen:** three trips to the great cavern and back added 226 objects (8 at the scene's top), no geometry, no bodies.
- **Cause:** a census of the scene by type, name and parent: two `PsyGun` groups a trip, with the glTF's meshes under them. A sibling's
  waiting rig is made near its meeting spot and let go when the Courier walks off; `letGo()` removed `rig.root` but the gun hangs from
  the scene on its own (`character.js`: `scene.add(this.gun)`).
- **Fix:** `Character.dispose()` takes down the body and the gun; the meeting, the party, the guests and a sibling call it.
- **Rule:** 59.

### 2026-10-07 · The god hand still opened in Blade Mode after the fix for it
- **Seen:** the tools sweep: ~ in Blade Mode, 2 real seconds later Blade Mode on, time at 0.05.
- **Cause:** the fix called `belt.get('sondelass').cutlass.blade.exit()`; the belt's entry is an adapter (`sondelassTool`) with no
  `cutlass`, so the optional chain did nothing, silently.
- **Fix:** `game.techs.get('sondelass')`, the Sondelass itself. The form strip is taken off as the hand opens (its tick, which puts it
  back, does not run under the hand), and a walking climb lets only the gun out (`belt.mayDraw` asks the tech's `oneHand`).
- **Rule:** 60.

### 2026-10-07 · node_modules replaced by a link to itself
- **Seen:** after a fast-forward of main, `node_modules` was a symlink pointing at itself; nothing built.
- **Cause:** a scratch worktree linked its `node_modules` to main's; `git add -A` there committed the link (`.gitignore` had
  `node_modules/`, which matches a folder and not a link); the fast-forward put the link where the folder was.
- **Fix:** the link out of git (pushed before anyone merged), `.gitignore` says `node_modules`, the folder reinstalled (`npm ci`), the
  worktree retired.
- **Rule:** 61.

### 2026-10-08 · On the title, the Courier fell through the board while the menu was open (the owner)
- **Seen:** after the Fool's Step, waiting at the menu, the Courier passed through the checkerboard and fell on into the void.
- **Cause:** the menu's slowed fall was `1.15 + 0.1 x` real seconds open, unbounded: measured from the board's own height
  (`boardY`), the Courier crossed it at about 35 real seconds (3.5 m under it then). The dive also started its fall time at 1.15
  again, so a long wait would have snapped the Courier back up into view as the dive began.
- **Fix:** the menu's fall eases toward `FALL_HANG` (1.5 added at most, the same 0.1 a second at its start): they hang 15.4 m over
  the board after 600 real seconds (measured in the running title); the dive carries on from where they hung and ends 2.9 m over it
  at the worst.
- **Rule:** 62.

### 2026-10-08 · The four sherds stayed in the scene after they burst (Calissa's survey of the room sweeps)
- **Seen:** strike the four sherds down and leave the bowl: four more bodies, colliders, jellies and creatures than before, the sherds
  still in the scene, out of sight (measured on main 7d7a594 by Calissa).
- **Cause:** `raid.js` set `sherds = null` once none was alive without taking the dead ones down, and `dispose()` took down only the
  live ones; a dead `once` jelly is never re-formed (`slipjelly.js`), so nothing else did.
- **Fix:** the sherds go to `spent` when the moment ends; each is taken down once its pop is over (`dying == null`); `dispose()` takes
  down every sherd, alive or dead. Measured headless (a temporary check in a copy of the Dunemaw sweep): four burst, jellies 12 before
  and 12 after the pops, `spent` empty; after leaving, bodies 840 to 816 and jellies 12 to 3, as before the cavern.
  The first version also put the sherds the mend had just taken down into `spent`, so each was taken down twice; the second
  `removeRigidBody` threw Rapier's "recursive use of an object" in the Dunemaw sweep's fight. Those go to `spent` no more, and a
  jelly's `dispose` is now a no-op the second time.
- **Rule:** 65. (The check belongs in the Dunemaw sweep: Dovina's.)

### 2026-10-08 · The Veritome would stop for good after 48 photographs (Calissa's survey; Espada's list)
- **Seen:** the shutter still spent a roll of film (`mat.film`) though the owner retired film on 2026-10-06 and Old Grog no longer
  sells it: the start kit's one roll and the camera's own gave 48 plates, then "You have no film. (Old Grog sells it on the pier.)",
  a line no longer true, and no way past it.
- **Cause:** the glossary and the shop changed; the code did not. The handoff that asked for it was deleted from `docs/handoffs/petra/`
  without the work.
- **Fix:** `film.js` is `memory.js` (`VeritomeMemory`, `MEMORY_PLATES`); `loadFilm`, `useShot`, the Book's `shots`, the item, its kit
  entry, `film.load` and its rule are gone; the one refusal is a full memory. `npm run check` refuses the film's names (two lines left
  in Wanda's and Calissa's files, baselined, theirs to take out). Measured headless: an empty memory takes a plate with no film in the
  box; a full one refuses; one plate appraised and it takes again. (The stress page still read `book.film` and threw on its first
  run: a rename is searched for in `scripts/` as well as `src/`.)
- **Rule:** 66.

### 2026-10-08 · A parry pressed at a lunge's first frame answered it (Calissa's survey, TRAINING.md 6)
- **Seen:** blows could be parried by mashing V: a press at the start of a 0.8 s lunge broke it off.
- **Cause:** `parry.js` `blow()` took the first windup in reach with no test of its `eta`, and `answer` runs on every frame of the
  press's window, so any windup in reach was answered however early.
- **Fix:** a blow is answered only when it will land within `BLOW_WINDOW` (0.25 real seconds, the siblings' own rule in
  `coop/fight.js`); the kick and the cutlass answer blows when no shot is in reach, as every tool does; `move.parry` carries `lead`
  (a blow) or `d` and `reach` (a shot); an outlined windup run out with the Courier in reach is `parry.missed`, which starts the
  ledger's `parry.run.best` over. Measured headless: 0.8 s early refused, 0.2 s answered (`lead` 0.2), a run-out windup counted missed.
- **Rule:** 67.

### 2026-10-08 · The press view looked away from the bath (found headless, before it shipped)
- **Seen:** in the press view the cursor's ray missed every lump by 13.5 m and the press drew at the bottom of the frame.
- **Cause:** the view's target pose was a plain `Object3D` turned with `lookAt(focus)`, which points its +Z at the focus; the camera
  slerped to that rotation and so looked down its -Z, straight away from the bath and upside down.
- **Fix:** the target rotation from `Matrix4.lookAt(pos, focus, up)` (the camera's convention). Measured: the mouth at y 35 of 300,
  a lump under the cursor missed by 0.013 m; hover, pinch, load, press and the lever all answer (scripts/soulalchemytest.mjs).
- **Rule:** 68.

### 2026-10-08 · The ruins' two ostraca lay on the column stumps (v116; found in a screenshot wiring Calissa's look)
- **Seen:** the sherd "at the foot of" a broken column sat on the stump's rim, 2 m up, the chevron over it.
- **Cause:** it was placed 1.17 m from the column's foot, and the columns are up to 1.6 m wide and lean up to 0.45 rad; the drop's ray
  down (which puts a sherd on what is under it) found the stump.
- **Fix:** `Ostraca.footOf`: eight bearings 2.4 m out, the first where a ray from 8 m up meets the sand within 0.3 m. Seen in a
  screenshot after: on the sand beside the stump.
- **Rule:** 70.

### 2026-10-08 · perf said the heap was over budget; the player's page was not (v117's gate)
- **Seen:** `npm run perf` read 346 MB against a 340 budget after the round's merges (+10 MB).
- **Cause:** perf reads the heap of the DEV server's page, which holds each module's source text and source map; a heap snapshot
  diff of the trees before and after the merges was 5.6 MB of strings (the new modules' sources and maps) of 6.4. The built game
  (vite preview, two gc'd boots each) read 223 MB before and 228 after.
- **Fix:** the budget raised to 350 with that written beside it (scripts/perf.mjs); the built figure reported at publish.
- **Rule:** 71.

### 2026-10-08 · "You are brimming." and "You settle." alternating at sea (found in a trip's screenshot)
- **Seen:** on a drafted passage the log filled with the pair, a line every few seconds.
- **Cause:** brimming lasted 2 real seconds after each overflow and its end was said at once; at sea absorbed shots overflow the pool
  every few seconds, so each gap said "You settle." and the next shot "You are brimming." again.
- **Fix:** courier/mind.js says "brimming" once a spell and "You settle." only after 6 real seconds with no overflow.
- **Rule:** 94.

### 2026-10-08 · The rail's gun aimed back at the camera when a foe passed close by it (v119; found by scripts/railaimtest.mjs)
- **Seen:** in a free view the far reticle left the cursor by up to 0.13 of the screen for a frame or two, twice a crossing.
- **Cause:** the aim takes the first foe the cursor's ray crosses; a big foe passing beside the camera was crossed in front of the ship,
  so the aim point lay between the camera and the ship and the gun pointed back at it.
- **Fix:** only a foe the ray meets 2 m or more beyond the ship's nose is picked. Measured: worst 0.007 of the screen through a crossing.
- **Rule:** 95.

### 2026-10-08 · An encounter at sea mended the hull twice (v120; found by Dovina reading triprun.js)
- **Seen:** not in play: read in the code. An encounter would give back 6 of the hull where the rule says 3.
- **Cause:** `offer()` added the encounter's `mend` (3) when the choice opened, and `trip.js arrive()` added `LEG.mend` (3) again
  as the leg closed: the world applied a rule the pure module already applies.
- **Fix:** the mend in `offer()` dropped; the choice is now Dovina's `apply(state, id, choice, ctx)` and the world does only its asks
  (triprun.js `act`). Checked by scripts/triptest.mjs (an encounter sailed, each ask done).
- **Rule:** 114.

### 2026-10-08 · A vertical loop showed one frame upside down at each quarter (found by scripts/railpathtest.mjs)
- **Seen:** the camera's up against the rail's up read -0.999 for one frame of each turn; every other frame 0.999.
- **Cause:** the cinema hands the player's camera its shot before the stage sets it: the shot's place and look are Vector3s read by
  reference (this frame's), its roll a number copied (last frame's). As the look passes the vertical, a look-at with the world's up
  flips its basis by half a turn, and the roll that undoes it arrived a frame late.
- **Fix:** the stage writes the roll into `player.camShot` as it sets the shot (stage.js `camera`). Measured after: 0.999 at every
  frame of every figure.
- **Rule:** 116.

### 2026-10-08 · The corkscrew took the ship under the sea at its middle (found in a screenshot, before it shipped)
- **Seen:** at the corkscrew's middle the screenshot showed only sky: the camera and the ship were under the crude, its surface
  culled from below.
- **Cause:** the frame rolled about the rail point, which lies at the sea's level; the ship rides 3 m up the frame (CRUISE), so
  upside down it was 3 m under the surface.
- **Fix:** each figure turns about the heartline, CRUISE up the frame (railpath.js `heart`). Measured after: the ship 3 m above the
  sea through every figure (scripts/railpathtest.mjs).
- **Rule:** 115.
