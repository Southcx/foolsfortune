# The casebook's cases: what was seen, the cause, the fix

One case per bug fixed (CLAUDE.md, The casebook): what was seen, the cause as measured, the fix, and its **Rule:** line, the number of
a rule in `docs/CASEBOOK.md`'s short list (or `NEW:<slug>` until the gate numbers it). A new case goes at the end.

## Cases

### 2026-10-19 · A carried pot dragged the Courier's body (the owner, long open: "the feet clip the floor; the pot should ride the hands")

- **Seen:** the owner, carrying a pot. Measured headless on c1c1493 (a jar, a bowl and an amphora lifted with F on the basement hub's
  floor, the Throwing Room's and the workshop's; still, walking at the carry's 3.02 m/s, turning, stopping, backing, strafing; at 60
  and 144 Hz frames), against the same runs empty-handed: the lowest sole vertex no lower with the pot than without (still 0.00 cm;
  walking -0.53 against -0.61, turning -0.77 against -2.11, stopping -0.26 against -0.37; 0 frames more than 1 cm under), the hips
  the walk's own (59 to 75 cm walking; still 72.2 on the braced idle a passive tech stands on, against 74.8), the IK's pull on the
  palms 2.5 cm still and 3.3 to 4.9 walking, the pot's grip 2.0 cm ahead of the palms' midpoint every frame. The feet and the hold
  were as the 2026-10-11 case left them. The pose audit (`carry.liftWalkPut`, and a new `carry.holdTurn`: held still, then walked in
  a turn) found the hands broken instead, every frame of the hold: wrists bent 107 to 123 degrees toward the thumb (radial deviation,
  range 20) and 107 to 111 back (extension, range 70), the forearms turned 95 to 98 (range 90). That is the hands not riding the pot.
- **Cause (measured):** `closeOn` built each hand's turn whole in the world (`handQuat`: fingers up and a little forward, palm in)
  wherever the carrying clip had the forearm, pointing forward and down; the wrist cannot make that turn from there, and the wrist
  ease (`anim/wristease.js`) keeps a bound hand's turn and can only swing the elbow (75 degrees at most), so the bend stayed.
- **Fix:** `carry.js` `closeOn`: the hand's turn is the clip's own hand swung the least way that faces its palm inward (the palm's
  normal onto the pot's side, `setFromUnitVectors`), its place as before. After, the pose audit: `carry.holdTurn` radial deviation
  113.6 / 116.8 (L / R) to 13.3 / 49.3, the 49.3 only in the lift's hand-off (6 frames); extension 111.1 / 107.1 and supination 94.7 /
  97.7 to within range. `carry.liftWalkPut` radial 123 / 120.5 to 22.6 / 64.1, now only in the lift's stoop (frames 85 to 108, the
  mirrored arm) and 2 frames of the set-down. The feet, the hips, the IK's pull and the pot against the palms unchanged (the same probe,
  frame for frame within 0.3 cm). Left: the lift's stoop (Chest_Open's mirrored right arm, 64 degrees toward the thumb for about 20
  frames); the pot through the head in the throw's wind-up and the throw clip's elbows off their hinge (no IK there, as before).
  Not reproduced headless: the feet in the floor with a pot (on these floors, at these paces); if the owner still sees it, the place
  and the pace are wanted.
- **Rule:** 239; 212 and 215 hold.

### 2026-10-12 · Two of the three Weir jellies stood frozen in an odd frame (the owner, v170)
- **Seen:** two of the Dunes' three slip jellies by the Weir never moved and never animated, held in whatever frame they were made in;
  they could still be struck.
- **Cause:** measured headless: a vertical ray at x = 1985 or 2015 (on the Dunes' 2.5 m height-field grid, from x = 2000) found no
  sand, from 0.7 m or from 30 m up; at x = 1984, 1986 or 1985.013 it found it at once. `SlipJellies.ground` returned null for the two
  set down on those lines, and a jelly with no ground yet skips its whole update (`continue`): no mind, no move, no pose. The third
  stood off the lines.
- **Fix:** the jelly's ground ray (and the Lantern Wisp's) starts a millimetre off the point in x and z (creatures/jelly/slipjelly.js
  `ground`); the three are also set down on the sand's own height. Measured: all three ground and act.
- **Rule:** 224.

### 2026-10-12 · The Pneuka Box's chamber menu ran off the top of the screen (the owner, v169)
- **Seen:** right-clicking a psygun chamber listed all hundred caster shells; the menu ran off the top of the screen with no way to scroll,
  so the shells before TYPE-68 could not be chosen.
- **Cause:** the menu (`PneukaUI.menu`, src/pneuka/ui.js) was placed by a guess at its height (26 px a row) with no height limit and no
  scroll; a hundred rows is about 2,500 px.
- **Fix:** the menu is capped to the screen and scrolls (its border counted, no sideways scrollbar), the wheel scrolls it and not the
  game, its title stays at the top, and it is placed by its measured size. Measured headless at 600 px tall: a hundred rows sit at
  8..592 px and scroll; three rows sit where they did.
- **Rule:** 223. A window placed on the screen is placed by its measured size and capped to the screen, never by a guess
  per row: lists grow.

### 2026-10-12 · What a caster shell set down stayed for good after a room change (Calissa's find, v168)
- **Seen:** after `shells.clear()` (a seam, a respawn) the Volcano's cone and haze, the Faraday Cage's arcs, the bubbles and the Golem
  stayed in the world, never taken away.
- **Cause:** `ShellRunner.clear()` dropped its timed effects and stopped their sounds without calling their `end`, which is where each
  takes away what it set down.
- **Fix:** `clear()` ends every timed effect as if its time were up (tools/psygun/shellrunner.js).
- **Rule:** 222 (a thing that ends one way does not also end the other; and a thing that ends does end).

### 2026-10-12 · A lobbed caster shell landed twice (Petra, the shell runner's batch 2)
- **Seen:** reading the runner to add the rest of the caster shells: a lob that touched the ground ran its landing in its hit and then
  again as its time ran out (Napalm's slick and fire twice, every lobbed Feelings shell's burst twice); since v165.
- **Cause:** `ShellRunner.step` returned `true` both when a round touched something and when its life ran out, and the caller ran
  `EXPIRE[kind]` on any `true`; `EXPIRE.lob` lands where the round is.
- **Fix:** `step` returns `'hit'` or `'expire'`; only `'expire'` runs the expiry (tools/psygun/shellrunner.js).
- **Rule:** 222.

### 2026-10-11 · Hanging on the grapnel's line: the line sagged under load and the body jittered (the owner, v155)

- **Seen:** the owner: "hanging from the ceiling not only has the fishing line itself still sagging but now IK fighting is causing huge
  amounts of jittering in the hanging position." Headless, hung from the basement hub's ceiling (the anchor 2.07 m from the chest, then
  5.97 m), the Courier started 8 cm off the anchor's plumb line and left to hang, 2 s logged: at 144 Hz the right hand moved 80 mm a frame
  on average (692 at most), the right elbow 59 (469), and the body's yaw 9.6 degrees a frame; at 60 Hz the hand moved 24 (695), the yaw
  turning 180 degrees in one frame each time the body passed under the anchor. The line stood 0.3 to 0.7 m off the straight between the
  tool's tip and the grapnel, on a span of 0.55 m. Hung dead still on the plumb line, the hand moved 0.3 mm a frame (the clip's
  breath), and the line still sagged 0.32 to 0.44 m.
- **Cause (measured):** three, none of them the IK fighting itself.
  - **Two owners of the facing, on two clocks.** `grapple.js` set `P.bodyYaw` in the fixed step: to the swing's travel above 2 m/s,
    else to `atan2` of the anchor's horizontal bearing from the chest. Under the anchor that bearing is nothing, and it flipped 180
    degrees at every pass. The core's stance turn (`player.js` `updateBody`, once a render frame; the hook is aimed while a line is out,
    so `techs.stance`) eased the same value toward the camera's yaw. At 144 Hz most frames have no fixed step, so the yaw sawed between
    the two (37, then 42 to 52 degrees, frame by frame), and every hand target with it.
  - **The hook's aim had a bearing from nothing too.** The right hand's target (`sondelass.js` `hands`) was laid off the aim's right,
    `dir × up`, from the last frame's shoulder (`hookshot.aimDir`). As the shoulder passed under the anchor that right turned 180
    degrees: with the facing fixed, a swing still swept the hand 0.4 m across the face in 8 frames at each pass (58 mm a frame, body-relative).
  - **The rope.** `vfx/rope.js` is a Verlet chain held by 7 passes of its distance constraints; the grapnel's has 76 links. Under
    gravity, with velocity carried frame to frame, so few passes cannot keep 76 links at their rest length: the loaded line, given no
    slack at all (`slack: 0`, the loaded test in `hookshot.js` was right), stretched to about twice its span and hung in a belly.
    (`hangSlack` was set at the throw and read nowhere: removed.)
  - Also found: the grapple owns the body (`overrides = 1`), so `character.js` skipped rom.js for it; the hang's fingers stood 5 to 42
    degrees past their range (12 joints).
- **Fix:**
  - `grapple.js` no longer sets the facing: the core's stance turn owns it, eased once a frame. On the line the Courier faces the aim, as
    with any tool drawn and aimed, not the swing's travel (the swing's clip reads its phase from the rope's angle against the body, so it
    plays whatever the facing).
  - `sondelass.js`: with a line out, the hook's aim is taken from this frame's shoulder; on the line in the air its right is the body's,
    square to the line (and the tool's Z is that right, negated, so the hand does not turn over on the shaft).
  - `rope.js`: a rope with no more length than its span is laid on the straight between its ends and its motion spent, eased in by the
    sag its spare length would make (straight at 0, the chain's own from 3 cm). The fishing line's slack and tension look is unchanged
    above that.
  - `character.js` (a CROSSING, Petra's, one line): a tech that owns the body but whose hands are a tool's says `limitsLast`, and
    rom.js runs for it last as for everything else. The grapple says it.
  - Measured after, the same runs: at 144 Hz the right hand moved 0.8 mm a frame (1.4 at most), the body under it 1.0: the hang's own
    slow swing; body-relative, 0.26 (0.52). The elbow 0.87 (1.54), the yaw 0. Left to swing naturally (0.57 m out, 1.7 m/s), the hand 4.3 mm
    a frame body-relative (6.9 at most; was 41, and 694). The line's sag 0 mm, on the 0.55 m span and on a 4.3 m line. rom.js clamps
    nothing more in the hang.
- **Rule:** 220.

### 2026-10-11 · A string run lived through a 5.5 s charge, a trip across the island and a held iaido (Dovina's rulings on the run's edges)

- **Seen:** headless, the blow events' battery on the base (5240719). c1 landed and LMB was held 5.5 real s: the run lived the whole
  hold and ended only at the release's whiff (`{ run 1, miss }`, 310 frames into the hold). c1 and c2 landed, then
  `places.travel('kiln')` set them down 45 m away in the workshop: the run lived it, and c3, c4 there made `{ run 4, pause }`. The
  iaido's charge and Blade Mode kept the string's window from running at all, for as long as they were held.
- **Cause (measured):** the run ended on a miss, a blow taken, the window's lapse, a stow, or the god hand, the garden or a crossing,
  and nothing else. A move on show holds the window, so the charge's hold kept it as long as LMB was down. The iaido's charge and Blade
  Mode return before the cutlass reads the engine, so its window waited for them. A place change (`course.teleport`, the respawn), a
  seam and the guard's rescue sent nothing the moveset heard, and a teleport is instant, inside any window.
- **Fix:** Dovina's four rulings (MELEE-LOADOUT-EARNING.md section 1), in `tools/moveset.js` (THE RUN'S EDGES). `holding(t)` ends the
  run (`pause`) past 2 real s of a hold: the engine's charge-hold, timed in `rawDt`, and the iaido's charge (`cutlass.js`). `leave()`
  ends it (`pause`) on a seam under way (`game.seam.busy`, read in `update` and `idle`), a guard's `courier.rescue` (not the
  controller's `clip`), `courier.respawn` and every `course.teleport` (it resets the techs: the Sondelass's new `reset()`). The cut over
  a whiff and Blade Mode needed no change: they were measured as already built. The string's place is left to its window.
  Measured after, a case for each side:
  - **The hold.** 1.5 s held: no end in it, and c1 with the charged slash made `{ run 2, pause }`. 2.5 s held: `{ run 5, pause }` 121
    frames into the hold, then the slash landed as a new run of 1.
  - **The iaido's charge** (too little Lachryma for Blade Mode). 1.5 s: run 2 lived it, and c3 made it 3. 2.5 s: `{ run 2, pause }`
    120 frames after the press; the draw cut stays apart, and c3 opened a new run.
  - **The Courier's own moves** inside the window: an air dash (8.6 m), the roll (4.0 m) and the hook's pull (14 frames reeled) each
    carried the run to 3.
  - **What is not theirs:** a seam, `places.travel`, a guard's rescue (`reset`) and `respawn` each sent `{ run 2, pause }` on the frame
    it happened (the seam's before the dark had covered anything).
  - **Blade Mode**, held 2.5 real s with three cuts: no `move.blow` from its cuts; the window stood at 0.017 s on entry and 0.021 s at
    exit; c3 made `{ run 3, pause }`.
  - **The cut over a whiff.** R, or the blink, before c2's strike (t 0.073 and 0) ended nothing; nor did the blink inside it (t 0.202,
    nothing struck yet). After it (t 0.33), R, the blink, the paid cut into the stinger and the guard all left `{ run 1, miss }`, sent
    on the frame the window passed. RMB before the strike is no cut: its press waits for the blow to end (`cutlass.js` `rmb`), so c2
    whiffed on its own and ended the run `{ run 1, miss }` as any whiff does.
  - **Every old case** (31, and 8 random) is unchanged but where the rulings reach: the travel cases and the long hold.
- **Rule:** 218.

### 2026-10-11 · The Anim Lab's takes carried the last one in, its travel line sat off the body, the psygun stayed drawn (the verifier, before it landed)

- **Seen:** the verifier's probes of the Anim Lab (b3e2c75). The same play recorded again after another one differed by up to 81 degrees
  (c1 after the guard, at footL), 69 (the rod's idle A after a cast, at handL), and 41.6 (the Lockheart's string.1 after string.3, at frame
  0). After the drawn run was shown at frame 120, the next take's travel line sat 8.47 m off the hips. After a switch to the Soul Brush
  while the psygun's ADS played, the new take showed the gun in its holster in 254 of 254 frames, with OTHER TOOLS HIDDEN.
- **Cause (measured):** three causes.
  - `AnimRig.put()` reset the body and cancelled the movesets, and nothing else. The rig's clock, the idle's phase, the foot locks,
    `st`, the lazily made fields, and each tool's own state carried over to the next take.
  - The rig stands in the stage's carry, which still held the travel of the last frame shown. Everything worked out in the world was
    off by that travel: the hips a take keeps (`getWorldPosition`), the foot locks, `headRel` and `holsterLocal`. A state dump by path
    showed the kick recorded after the sprint differing from the same kick recorded after itself only there (`holsterLocal` 0.11 m,
    the foot locks 0.11 m).
  - `choose()` records the take 20 ms later, and in the meantime `tick()` laid the old take's frames on the gun. `wear()` hides the gun
    once, and `belt.tick` hides it only when `gunOff` changes, so the new take recorded the gun as the old take had left it.
- **Fix:** four changes.
  - The seven tools are made when the rig is, in the game's order. The rig then steps two frames with none worn, so what a tool builds
    on its first frame (the Lockheart's coffin) is built once. Kept with tools made one at a time, the coffin was built anew, with new
    geometry, every take.
  - `workbench/animfresh.js` keeps that fresh state, and `put()` puts it back. The walk never writes back what the game holds (it walks
    from the game and the config tables) or the clip library. After that, `put()` lays the worn tools on again (`dress()`), which sets
    the gun's shown flag too.
  - The holder is put at the origin while the rig steps (`home()`).
  - A take keeps the hips in the holder's frame.
- **Measured:** MEASURED
- **Rule:** 217.

### 2026-10-11 · The ash-glazed kilns crawled at 480 lines (the room glazes' verifier, d391bcd)

- **Seen:** headless at 854 x 480, the world frozen and the camera slid a quarter pixel a frame for 60 frames: the share of the kiln's
  pixels whose second difference of luma passed 6 levels went 10.4% -> 13.9% (the dome at 5.6 m), 22.3% -> 33.8% (at 12.5 m) and
  14.8% -> 18.0% (the upper kiln) against the build before; the heat maps showed the box mapping's seams across the dome and checkered
  patches beside the runs. The upper kiln's cap also read as plastic: a hard white hotspot from the lamp.
- **Cause (measured):** the glaze, not the firebrick under it. With the glaze switched off in the shader (the brick body alone): 10.3%,
  22.4%, 15.1%, the build before's numbers; with the brick flat and the glaze on: 14.0% at 5.6 m. The glaze's edge was
  `smoothstep(0.5 ± (0.08 + fwidth(cover)))` over a cover that held the runs (rivulets 6 to 12 cm): the band was one value a 2x2 quad, so
  the edge moved with the quads as the camera slid, and the threshold cut the mip-softened runs back into hard edges. The box mapping
  switched axis across the dome, so the cover jumped at a seam (blending the axes alone took 13.8% to 12.7% at 5.6 m); the glass's
  highlight added more (its gloss and sheen off: 12.1%). (The glitch was switched off to measure: a tear set off by an event lay across
  some of the upper kiln's frames, and its steps follow the real clock.)
- **Fix:** `vfx/surfaces.js`: the edge a fixed band of the cover (0.35 to 0.65), the runs their own soft profile (`max` with
  `run * 1.25`), the room glaze atlas read along the three axes and blended by the normal (a box's face takes one, as before);
  `vfx/roomglazes.js`: the ash's gloss 0.3 -> 0.5 (the lamp's highlight broad and soft), the tenmoku's sheen 1.0 -> 0.3 (an even sheen
  on black lay as a grey veil: the stand read as charcoal). Measured, the same probe, the glitch off: the kiln's flickering share
  13.8% -> 11.0% at 5.6 m, 33.8% -> 23.4% at 12.5 m, 18.8% -> 15.0% upstairs (the brick alone: 10.3%, 22.4%, 15.1%); the pixels hot
  only with the glaze (above 6 where the glaze-off frame is calm, its hot pixels widened 1 px) 2,966 -> 249, 1,196 -> 43, 1,558 -> 0
  of 409,920. Programs 163 at boot and in every view; reading the brick with explicit gradients as well changed nothing measurable (10.9% at 5.6 m, 14.9% upper), so it was left out.
- **Rule:** 216.

### 2026-10-11 · The feet went into the floor at every pace since the suite came in (found verifying the carry's fix: "the walk at the carry's speed dips the feet into the floor, with or without a pot")

- **Seen:** the verifier, then measured headless with nothing in the hands (the lowest skinned vertex of each sole against the floor
  under it, every frame, 120 frames after 60 to settle; the workshop at 0, -13.5; the ramp at x 8): on 72eac06 the lowest foot was
  -3.65 cm walking at 1.3 and 2.2 m/s (52 and 45 frames more than 1 cm under), -2.83 at the carry's 3.02 (47), -1.69 at the run's 4.2
  (12), -4.19 turning at 3.02, -5.35 up the ramp and -7.40 down it, the prowl -3.59 (72). On fe9ed52: +0.03, +0.43, +0.53, +4.89, +0.04,
  -2.83 and +0.21, 0 frames under 1 cm on the flat. This is what the owner saw as the pot "causing the feet to clip into the floor".
- **Cause (measured):** bisected (`git bisect run`, good when the 3.02 m/s walk's lowest foot is at or above -1 cm; 10 steps of 808
  commits): **afb6154**, "The Courier's own suite in the game", where the walk, the run, the sprint and the crouched walk began to play
  from the suite's packs (`scripts/bake_suite.mjs`, `courier/anim/suite.js`). Their planted feet sit lower against the hips than the
  rig's rest pose stands: measured on the skin in each loop's stance, the walk 3.45 cm under, Loco_CrouchWalk 3.44, the run 0.73, the
  sprint 0.18. The foot IK (`character.js` footIK) moved the feet only by the ground's height under the ankle bone (0 on a flat floor),
  so the clip's depth went straight into the floor; a heel struck toe-up went lower than its ankle said, and on a slope the toe or the
  heel met ground the ankle's ray never read.
- **Fix:** the animation side only (`character.js`; player.js and the core movement's numbers untouched). `measureSoles()` reads each
  foot's skinned vertices within 4 cm of the rest pose's lowest, in their bones' frames; `analyseGait` measures each loop's planted sole
  on them (the lowest while the foot's contact is over 0.5) and keeps its depth as `lift`; the body is raised by the loops' depths by
  their weights (`st.soleLift`, by the gait's share of the body: none in the air, a slide, a mantle, a dash or a crawl). Then in
  footIK each foot's lowest skinned point is raised to the ground under that point when it would go under, by `planted`, at most
  `SOLE_MAX` (6 cm): a light correction. After (0c3f367), the same harness: 1.3 and 2.2 m/s 0.00 cm, 3.02 -0.03, 4.2 -0.05, the turn -0.10, up the
  ramp -1.78 (one frame), down it -0.06, the prowl 0.00; 0 frames more than 1 cm under on the flat, turning and down the ramp, 1 up it.
  The feet's largest one-frame change of their step against the capsule is as before (walk 1.0 to 2.8 cm, the run 4.4, the turn 16.5
  where it was 17.6, the base's 18.4). With the pot, walking at 3.02 m/s: -2.83 cm and 71 of 180 frames under 1 cm, now -0.03 and 0.
- **Seen again (the verifier on 0c3f367):** the feet floated instead. The slow walk's lowest foot, steady, no pot: median +3.22 cm, p90
  +5.72, both feet over 2 cm up in 107 of 150 frames (5610152: -0.23, +2.27, 22); the prowl +1.80 against -1.64, 72 frames against 2.
- **Cause (measured):** `st.soleLift` raised the whole body by each loop's deepest planted sole (the walk's 3.45 cm is its heel strike's),
  so the flat foot in mid-stance, which stood at about 0, stood 3.4 cm up, and more as the heel rose. The per-foot raise in footIK was
  already enough on its own.
- **Fix:** `st.soleLift` and the gait's `lift` are gone; the per-foot raise stays, and `measureSoles` also keeps the foot's upper skin,
  thinly (a foot lying on its instep). Steady, no pot, lowest foot min / median / p90 (cm), 5610152 then now: the slow walk -3.65 / -0.23
  / +2.27 then 0.00 / 0.00 / +2.27, both over 2 cm 22 then 22; 3.02 m/s -2.83 / +1.03 / +8.81 then -0.08 / +1.03 / +8.81; the run -1.69
  then -0.08 (median +6.33 both); the prowl -3.59 / -1.64 / +0.57 then 0.00 / 0.00 / +0.57. Left, all fewer and shallower than 5610152's:
  the turn at 4.2 m/s -3.38 cm (3 frames under 1 cm; base -5.35, 42), down the ramp -1.94 (3; -7.45, 59), down the stairs -2.71 (8;
  -8.71, 74), up them with the pot -3.34 (2; -7.11, 27): a swinging or landing foot the raise weighs down by `planted`, which the whole
  body's lift had hidden. Stopping out of the prowl -5.95 for 8 frames (base -11.95, 58).
- **Rule:** 215.

### 2026-10-11 · The carried pot stood still and the body bobbed under it (the owner: "the 'holding a pot' animation moves the main courier body relative to the pot, causing the feet to clip into the floor periodically instead of the pot in the hands moving relative to the Courier")

- **Seen:** the owner, holding a pot. Measured headless (a 0.44 m pot, kind `jar`, lifted with F in the workshop: 3 real s still, 4 on W at
  3.02 m/s, crouched, the throw; a turn in the movement lab; a 0.7 m crate), against the same runs with nothing in the hands at the
  same speed: standing still, the hips rose and fell 8.8 cm and swayed 5.9 cm every 2.0 real s while the pot did not move at all, and
  both feet sank to -7.3 cm (87 of 180 frames more than 1 cm under the floor; without the pot -0.2 cm throughout). Walking, the hips
  kept that 9 cm bob on its own clock instead of the walk's 16 cm in step; stopping, the feet sank to -7.9 cm (without: -0.5).
  Crouched, the whole body hung 22 to 37 cm off the floor. The throw sank the feet 20.5 cm.
  At the gate, the first fix (de27b96) shoved the whole Courier, and the camera, 19.3 cm back in one step on every throw of the pot
  (10.7 cm with the crate), and thrown from the floor's edge beside the Shrine (x 5 to 8.5, z -14.5 to -12.5) left them sunk into the
  floor until they walked: 9.7 cm (pot), 22.3 cm (crate). The pot trailed the hands up to 12.5 cm after the core's turn-in, and a
  second set-down started where the first had (a crate's first frame of it 207 cm from where it was drawn).
  At the gate again (090b1c5): its two rules were numbered 193 and 194, which the default branch had given to others (now written
  NEW:<slug>); and a lift ended on the move snapped the pot, and the hands on it, to the walking palms in one frame. Measured (the jar
  lifted with W held at 3.02 m/s, turning, crouched and moving, the crate; set down and thrown as they were; 60 and 144 Hz steps): on
  the hold's first frames the pot stepped 15.6 cm a frame walking, 9.9 turning, 27.5 crouched (the palms 46.9), 21.3 with the crate,
  and the body with it out of the lift's stance (the pelvis 8.4 cm walking, 36.6 crouched; a foot 12.6). The set-down's end and the
  throw's end moved the hands 51 to 67 cm in one frame and the hips up to 30 (on the base too). At 144 Hz the pot went back and forth
  against the palms 19 to 33 times in every lift on the move, and 6 to 15 in every set-down.
- **Cause (measured):** the hold and the throw blended their clips over `MASK_UPPER` with `Clips.blend`'s default `hipW` of 1
  (`courier/moves/carry.js`), so the pelvis was Walk_Carry_Loop's (65.0 to 73.8 cm on its own clock, 0.5 clip seconds a real second
  when still) or OverhandThrow's (down to 50.3 cm), under legs that kept the idle's, the walk's or the prowl's rotations; the foot IK
  follows only the ground, so every dip went into the feet (rule 43). And the pot was placed from the capsule (`renderPos` + 1.0 m, its
  own 1.5 cm sine), the palms pulled onto it by the IK from 11.7 to 34.1 cm away: the hands stayed with the pot, the body moved under both.
  The first fix's shove: through the throw its kinematic body now followed the throw's hands, overhead and inside the 0.3 m capsule,
  and `restore()` gave its collider back its groups on the release step; the controller found it there, where the last step had left
  it, and pushed the capsule out (moving the release 0.35 m further forward changed nothing; keeping the collider off for 8 steps took
  the shove away). The old throw had kept its body 0.55 m ahead, clear by luck. The second set-down's start was the pose read after the
  state had already changed to `put`, which is the last set-down's start.
  The second gate's snap: the lift ends where the carrying clip's palms are at the idle (`carryHoldAt`), and the hold's first frame put
  the pot within `LAG` (4 cm) of the walking or crouched palms, 9 to 32 cm away. The lift lays Chest_Open whole, so its last pose
  (standing) gave way to the walk's or the crouch's in one frame, and the set-down's and the throw's poses were dropped the frame they
  ended (rule 46); crouched, the lift's end was 35 cm under the standing stoop's reach. The lift's and the set-down's progress were read
  from the fixed step's `st` while the pot was placed from the interpolated `renderPos`, and the set-down's start was held in the world.
- **Fix:** `carry.js` (and one line of `main.js`). Both upper-body blends pass `hipW` 0, and the carrying clip runs on the legs' phase
  (`ht = st.phi x dur`: its left foot is forward at its frame 0, as at the legs' phase 0, measured with `analyseGait`), still when they
  are. The pot rides the hands (`followHands()`, in `afterPose`: the body posed, no hand's IK yet): its grip at the midpoint of the
  clip's palms, 2 cm ahead, in the body's frame, eased at 30 a second and never more than 4 cm behind (`LAG`); through the throw exactly
  between the throw's palms. The kinematic body (`fixed()`) reads that same `handGrip`; the release and the set-down start where the pot
  was last drawn (`drawn`). What is let go of (`restore()`: thrown, set down, dropped) takes `LET_GO`'s groups (a member of `G.DEBRIS`,
  solid to the world, the props and the creatures, no prop to the controller's query, nothing to the Courier's collider) and its own back
  each step once `contactCollider` finds it 6 cm clear of the capsule (`clearLetGo()`): a pot 2 steps after the release, a crate 3;
  lifted again before that, its own groups are the ones kept. The arms ease out of the hold into the throw over 0.07 s (`THROW_IN`): in
  one frame they, and the pot, had jumped 30 cm; now 2 to 18 cm a frame. A hard landing's squash presses the pot with the hands
  (`main.js`, the squash's `carried`). After: walking, stopping, turning and the crouched walk, the hips, legs and feet match the
  empty-handed run frame for frame (walking, feet -2.8 to +11.2 cm, the walk's own); still, the feet -0.3 to -0.1 cm and the hips move
  0.7 cm (the idle a passive tech stands on, `IDLE.under`); the throw -0.5 cm. The IK moves the palms 2.1 to 2.9 cm still and 1.8 to 4.8
  cm walking, and they sit 1.6 cm off the pot's sides; the pot's largest jerk (second difference) is half the palms'. The pot sits where
  the clip's hands hold a box, lower than before: its grip 92 to 95 cm up still, 67 to 83 walking (was 100, and 98.5 to 101.5). A 0.7 m
  crate is held out 8 cm past the palms (`clearance`, the old hold's), the IK moving its palms 17 to 21 cm (was 19 to 34). The physics
  body is the mesh's place a frame late: 0.4 to 1.9 cm apart walking, 6 to 11 cm in the throw (was 24 to 93). The throw: the capsule
  moves 0.0 cm on the release, pot and crate, on the floor and at the floor's edge, at 60, 144 and 40 Hz steps; thrown at a wall 1.1 m
  ahead the pot still strikes it and breaks. The core's turn-in: the pot trails the palms 4.0 cm at most (was 12.5), the IK pulling them
  8.9 cm at most (was 15.6). A set-down's first frame moves the pot 0.6 cm, the second as the first. Not changed: crouch-walking, the
  leading thigh still passes into a held pot's side (645 skinned vertices, 13 cm, as before the fix).
  The second gate's: every hand-off is a crossfade over `CATCH` (0.2 s) on the render clock. The lift's last pose eases out under the
  hold (`liftFade`), its hips last (on 1 - s²: a leg's length is the cosine of its half bend, so hips lowered at the rotations' rate into
  the crouch sank both feet 7 cm); the pot comes from where the lift left it to the palms along the same smoothstep while it rides them
  (`catchFrom`); the set-down's stoop eases in over the hold, its hips first; what the hands let go of eases out (`out`: the stoop and the
  hands on the pot set down, the throw's follow-through). The lift's end is no longer lowered for a crouch. The drawn lift, set-down and
  throw run on render-clock times (`liftT`, `putT`, `throwT`), the physics body on `st`; the set-down starts where the hands had it, in
  the body's frame. `holdAt` is `carryHoldAt`, "the carry's hold" a row of the glossary's "hold". After, the same harness: the hold's first frames
  move the pot 3.2 cm a frame at most walking (was 15.6), 3.8 turning (9.9), 7.6 crouched (27.5, the body going down with it), 1.6 with
  the crate (21.3); the pelvis 1.5, 2.3 and 4.6 cm a frame (8.4, 3.7, 36.6); the feet no lower than before in any hand-off (crouched
  -0.1 cm, was -3.5; walking -1.0, the walk's own -2.8). The set-down's end moves the hands 2.9 to 12.7 cm a frame and the hips 0.7 to
  3.7 (51 to 66 and 7 to 30); the throw's end the hands 8.6 to 8.8 (57 to 67). At 144 Hz, 0 reversals in every lift and set-down. The
  hold itself is unchanged: 30 frames on, the first two runs equal 090b1c5's frame for frame within 0.01 cm (the later ones within
  0.6 cm: the earlier set-downs left the room a little apart), and still, walking, stopping, crouched and turning the feet, the IK's pull
  and the mesh against the physics body equal the first fix's numbers above. Left as they were: the
  crate's palms pulled 17 to 21 cm (Walk_Carry_Loop's palms are 25 cm apart, the crate 70 cm wide: a wider grip wants another clip); the
  pot through the head in the throw's wind-up (on the base too); a let-go thing is `G.DEBRIS` for its 2 to 3 steps, or while the Courier
  stands over a dropped one, so the grapnel (`HOOKABLE`) and a sibling's collider pass it (their filters are Petra's); a 5 cm sideways
  step of the pelvis in a walking turn (the core's, on the base too).
  The verifiers' third look (b0b0ef3): a throw begun in the hold's first steps dropped the lift's last pose from the legs and hips in
  one frame. `liftFade` ran in the throw only while the throw's `into` was under 1, so the weight still left in it at `THROW_IN`
  (0.07 s) went at once: a throw 1 frame into the hold stepped the right ankle 13.2 cm and the toe 14.9 against the capsule in one frame
  (3 frames in: 7.4 and 8.3; 6 and 12 frames in: under 3.3), the pelvis 2.1; walking, the feet 36 to 41 cm (1 frame in) and 19 to 22
  (3). Now the lift's last pose eases out on its own clock (`handT`, CATCH) whatever `into` is: still, at 1, 3, 6 and 12 frames in, the
  pelvis 0.4 to 0.5 cm a frame at most and the ankles 1.9 to 3.0 (the stance sliding back from the stoop's, smoothly: its second
  difference 1.1 cm, as in a hold with no throw); walking, the feet change their step against the capsule by 5.7 to 7.4 cm at most (the
  walk's own 4.5 to 5.5; was 28 to 39). Left: walking, the pelvis moves 3.4 to 4.1 cm against the capsule on the release frame (2.9 to
  3.6 before), as the carry's slow lets go and the gait's speed goes from 3.02 to 3.94 m/s in a step (the core movement's).
  And a set-down on a flat floor lost the pot from the hands, standing or walking: Chest_Open's stoop brings the palms no lower than 57
  cm, and the pot went on to the floor 0.85 m ahead, its grip 13 cm up, the palms 1 to 100 cm off it from 12 frames of 20 on (only a
  set-down on a raised place had kept them on it). Now the stoop goes on down on to a knee (Fixing_Kneeling at 1.6 s, its palms 22 to 24
  cm up and 55 cm ahead: `PUT`, `KNEEL_T`, `deepOf()`) by how far under the stoop's reach the grip will go (a table: none; the floor:
  whole), and the pot is set where those palms are, 0.58 m ahead (plus `clearance`); `PUT` the move's time is `PUT_T`. Standing and
  walking the palms stay 0 to 2 cm off its sides all the way down and let go of it on the floor; the IK pulls them 2 to 17 cm (was up to
  40). Left: walking on, the kneel's feet slide with the capsule for its 0.34 s, as the stoop's did; and walked straight on, the Courier
  reaches the pot set down sooner (it is 27 cm nearer) and passes it while it is still `LET_GO`.
  Then the verifier: the kneel was done in mid-air, the shin and both feet 7 to 9 cm over the floor for about 10 frames (standing 7.5,
  walking 9.1, turning 7.4), and getting up the back toe went 3 cm into it. Measured on the skin: Fixing_Kneeling at KNEEL_T kneels in
  the air on this rig, its knee 4.0 cm up, its soles 7.4 to 9.1; and the stoop blended into it puts the back toe up to 10.6 cm under the
  floor on the way down and up, past footIK's 6 cm raise. Now the kneel's hips go down 2.5 cm (`KNEEL_SINK`, `Carry.kneel`) and while
  it is on the body footIK lets the feet down on to the floor by its weight (`st.footDown`, at most 6 cm) and raises them by up to 14
  (`SOLE_KNEEL`). Lowest foot (cm), still / walking / turning: kneeling 0.0 to +0.4 / 0.0 to +0.4 / 0.0 to +0.2, the whole set-down
  never under 0.0 (was -3.0, 0.0, -2.4 before the change, with the 7 to 9 cm float); the knee's skin -0.7 / -0.7 / -1.4 at the bottom
  (on it). The palms stay 0 to 2 cm off the pot.
- **Rule:** 212, 213, 214; rules 46 and 56 for the hand-offs; 215
  for the feet under it.

### 2026-10-11 · The default string no longer played as phase 2's after c4's hit (the melee loadout's verifiers, phase 3, third round)

- **Seen:** phase 2's `string.mjs`, a free calmed slip jelly 1.9 m ahead: frame for frame through c4's hit (frames 132 and 120), then the
  jelly 2.74 m off where it lay 1.95 m, and the loop's next c1 cut air (its hit at 154 gone). Also changed for every move that existed:
  `Moveset.carry`'s travel cut (by the hips' farthest ahead, to none, sidestep dropped), and c4 had a chain window.
- **Cause:** the second repair gave c4 `hit.away: 1` with the eleven new pushing rows, and rewrote the carry's cut for every whole-body
  move, not only the catalogue's new ones.
- **Fix:** c4 has no `away` again; the peak cut is opt-in, `travelCut: 'peak'` on the ten new whole-body rows, and every other move
  keeps the old cut (the clip's end, 0.15 at least, the sidestep kept). c4's chain window stays: the engine reads it only through
  `nextOf`, which gives none for the string's last slot, so the default never reads it. Measured: `string.mjs`'s five runs against phase
  2 (art-melee-p2, 02836dd), free and pinned: every move's begin, hit, cut, the pool, and the Courier's x, z on all 260 frames identical,
  and the free run identical to `string-after.json`.
- **Rule:** 210.

### 2026-10-11 · Every knock back sent a free slip jelly sideways (the melee loadout's verifiers, phase 3, second round)

- **Seen:** the verifiers, headless: one blow of each normal at a free, calmed slip jelly 1.9 m ahead. Its travel along the line from
  the Courier / across it (m): Push Kick 0.00 / 1.33, Heavy Chop 0.00 / 1.45, Low Sweep 0.00 / 1.66, c4 (Leap Strike) 0.00 / 1.24,
  the same with the lock-on; Guard Break -0.38 / 1.79, Lunge Slash -0.77 / 0.79. The cards say "Kicks them away", "knocks back", and
  wear the Knockback keyword. Measured here also: Spin Slash 4.11 m across, Power Slash 1.86, Guard Crush 1.18, Rising Cut 3.31.
- **Cause (measured):** `melee.js` `sweep` hands every hit the direction `(cos(rel + yaw), 0, -sin(rel + yaw))`, the tangent of the
  swing's arc at the thing, at right angles to the line between them; `Moveset.blow` scaled it by `hit.push` for the knock, and the
  slip jelly's own flinch (`slipjelly.js` hurt) shoves it along the same. The kick had solved this for its own blows (`FistMoves.blow`,
  `side`); the cutlass's catalogue never had.
- **Fix:** `tools/moveset.js` `blow`: a hit with `away` (0..1) is sent that share straight away from the Courier, the rest along the
  swing (`awayDir`), for its push and its flinch; none, as before, so no other tool changes. The catalogue's twelve rows that push
  carry `away: 1` (c4 at first, taken off in the third round, 210; Lunge Slash, Heavy Chop, Guard Break, Push Kick, Low Sweep, Body Blow, Spin Slash, Power Slash, Rising Cut,
  Guard Crush, Backstep Slash); the cuts with no push (c1 to c3, Quick Slash, Backhand) and the fixed grammar are unchanged.
  Measured, along / across: Push Kick 1.33 / 0, Heavy Chop 1.45 / 0, Low Sweep 1.66 / 0, c4 1.24 / 0 (with the lock-on the same),
  Guard Break 1.69 / 0.52 (0.96 / 0 locked on), Lunge Slash 0.58 / 0.51, Spin Slash 1.85 / 0, Power Slash 1.86 / 0, Guard Crush 1.18 / 0,
  Rising Cut 3.31 / 0. Phase 2's `string.mjs`: the air, pause and stinger runs as before; the free and paid strings frame for frame
  through c4's hit (frames 132 and 120), after which the jelly is 2.74 m off, not 1.95, and the next c1 cuts air where it struck at
  154 (the finisher knocks it out of the loop's reach, as a finisher does). The row rule is measured on pinned targets: unchanged.
- **Rule:** 208.

### 2026-10-11 · Empty in a middle slot cut it out, and the card and the log said the string ended (the verifiers, phase 3)

- **Seen:** DEBUG, 1280x720 and 960x600: an 8-blow string [c1, c2, c3, c4, Quick Slash, Backhand, Push Kick, Body Blow], slot 6 picked,
  its Empty card ("Ends the string before this slot.") clicked: a 7-blow string [.., Quick Slash, Push Kick, Body Blow], and the log
  "Your string now ends after its fifth blow."
- **Cause:** `SondelassLoadout.set(slot, null)` did `string.splice(i, 1)`, a removal; the card's line and the log's rule were written
  for an ending.
- **Fix:** `loadoutchosen.js`: `string.length = i`, the string ends before that slot and the slots after it go with it, as the card and
  the log say.
- **Rule:** 209.

### 2026-10-11 · A loadout set with the editor open was lost on a reload (the verifiers, phase 3)

- **Seen:** DEBUG, 1280 and 960: Heavy Chop put in slot 1 through the editor, 120 frames ticked with the window open: the stored
  `sondelassLoadout.data.string[0]` still `c1`, and `c1` after a reload. Closed first, the change was kept.
- **Cause:** `main.js` returns before `save.flush()` whenever a window is open (`modalOpen()`: the Index's window, the Codex), and no
  `pagehide` or `beforeunload` writes the save; the editor is opened only in those windows. `set()` marked the section dirty and
  waited for a flush that would not come until the window closed.
- **Fix:** `SondelassLoadout.keep()`: `dirty()` then `save.flush()`, on every `set()` and `reset()` (flush waits only on a hold).
- **Rule:** 211.

### 2026-10-11 · Every closed string slot promised "or 8 in a row", which nothing could keep (the verifiers, phase 3)

- **Seen:** STORY, 960x600: after 20 unbroken string blows on a slip jelly, `ledger.best('sond.string.best')` was null and slot 5
  still read "CLOSED 300 hits, or 8 in a row" (10, 12 and 14 for slots 6 to 8). The count way works: at 300 `cut.hit` slot 5 opens.
- **Cause:** nothing in `src/` writes the record `sond.string.best` (Dovina's earning names it; its tracking rule is to come);
  `loadoutopen.js` reads it as 0, and `slotOpening` named it all the same.
- **Fix:** `slotOpening` says only the count way ("300 hits"); the feat way stays in `SLOT_OPENS` and in `slotsOpen`, and comes back to
  the line with the record's writer.
- **Rule:** 209.

### 2026-10-11 · W + RMB's list showed RMB, a quick second change lost its log line, Backstep Slash's reach said 2.4 m (the verifiers, phase 3)

- **Seen:** the loadout editor, the W + RMB and S + RMB lists: every special's card wore the key cap RMB (only Empty showed S+RMB).
  STORY: `set(1, 'c2')` then `set(1, 'c3')` in one moment, both true; one log line, naming Rising Slash, while the slot held Hop Slash.
  Backstep Slash's reach chip 2.4 m: pressed S + RMB from rest it missed a slip jelly and Strawman at 2.2 m.
- **Cause:** `loadouteditor.js` `card()` set `key` by the row's kind, never the picked slot's. The `loadout.set` rule throttled on
  `loadout.<slot>` for 0.15 real s (`feedback/tracking/moves.js`), so a second change to a slot inside it was not said.
- **Fix:** the picked special slot's key cap is handed to its cards (`W+RMB`, `S+RMB`); the rule keeps its key without a throttle (a
  change is never repeated, `set()` refuses no change, and the same line again merges by the key). Backstep Slash's `stats.range` is
  2.1, measured from where it is pressed (the hop back taken): S + RMB and tapped, at a slip jelly and Strawman, it lands at 1.8, 1.9,
  2.0 and 2.1 m and misses at 2.2 (3 of 4). Measured: two changes in one moment, two lines, the last "Hop Slash"; DEBUG at 1280x720,
  the S + RMB list's cards all S+RMB.
- **Rule:** 209.

### 2026-10-11 · Whole-body blows walked the Courier through what they struck (the melee loadout's verifiers, phase 3)

- **Seen:** the verifiers, headless. Against Strawman, the string [Guard Break, Lunge Slash, Push Kick, Lunge Slash, Push Kick, Heavy
  Chop x3], no lock: blows 1 to 17 landed, each Heavy Chop carried the Courier about 0.14 m sideways, and from blow 18 every blow
  whiffed while they walked 4 m past Strawman's side (-39.5% power a real second against the default). A slip jelly held by halt,
  Guard Break x8: through it by blow 7, facing 180 degrees away, nothing landed after. 11 of 30 random loadouts were outside the row
  rule's 15% against a pinned slip jelly (to -94.9%). Measured here as well: with the lock-on, the same Guard Break string stood
  inside the halted jelly (0.05 to 0.27 m from its middle, its radius 0.5), and the default string walked to 0.34 m of a stunned one;
  without it, the default crept 0.1 m nearer a cycle (1.77, 1.36, 1.26, 1.15 m).
- **Cause (measured):** `Moveset.carry` cut a whole-body move's travel by `(dist - r - 0.9) / fwd`, held to 0.15..1, only when `fwd`
  (where the clip's hips END, plus its own step) was over 0.3 m, and only toward the magnet's target. Guard Break, Push Kick, Heavy Chop
  and Low Sweep end within 0.25 m of where they began, though their hips go 0.12 to 0.43 m ahead first (and Heavy Chop's and Low
  Sweep's 0.16 m to the side), so they were never cut: Guard Break went its full 0.27 m a blow however close. Lunge Slash and c4 went
  0.15 of theirs at the closest. Under the lock-on the magnet is not asked, so nothing was cut. A slip jelly does not stop the capsule;
  past it, the magnet (1 rad of the camera's look) never finds it again. Strawman does stop it, and a blow pushed into its capsule
  slid off round it.
- **Fix:** `tools/moveset.js` `carry`: the cut is by the hips' farthest ahead over the move's span (`rootOf(...).ahead`) plus the
  step, from 0 to 1, for any travel, toward the lock's target, else the magnet's (`aimedAt`); aimed at something, the clip's sidestep
  is dropped; an xyz move's rise is no longer scaled with the cut (the launcher's 0.9 m hip rise went with it, to 15% close in: rule
  192). Measured: the halted jelly with Guard Break x8 holds them at 1.40 m, lock-on or not, 16 hits in 10 real s; the loadout above
  holds them at 1.35 m from Strawman, every blow facing it; the default holds at 1.41 m. The default string's begin, hit, cut and
  stinger frames are the same in all five of phase 2's runs (`string.mjs`). The row rule, measured as the verifiers did: the 30
  loadouts of seed 7, -6.2% to +3.1% against both a pinned slip jelly and Strawman (the loadout above +0.8%); every normal alone in
  4 and 8 slots, -8.8% (Guard Break) to +6.7% (Heavy Chop), both targets. The launcher from 1 m rises as it does from 1.9 m (High
  Time's top 3.92 m).
- **Rule:** 206.

### 2026-10-11 · The Stinger's card said "Lunges 6 m" beside an 8 m reach (the melee loadout's verifiers, phase 3)

- **Seen:** the loadout editor, the default special: STINGER, "Lunges 6 m, piercing everything in line", its reach chip 8 m; the lunge
  measures 8.4 m.
- **Cause:** the catalogue row's `line` was written from the comment above it ("six metres in a quarter of a real second"), older than
  the lunge's numbers (30 m/s for 0.26 s, `range: 8`). The editor's placeholder said 8 m, and the join let the row's own words win.
- **Fix:** the row's line says "Lunges 8 m"; the two comments that said six metres (`sondelassloadout.js`, `cutlass.js`) say eight.
- **Rule:** 207.

### 2026-10-11 · The string row lit the next slot through a charge's release, the special and the dash (melee phase 6, the verifier)

- **Seen:** headless (960x600, the Throwing Room), a press on every 4th or 6th frame: after c1 held into the charge and let go, 19
  of 20 presses played c1 with c2 lit; after c1, c2 and R (the special), 7 of 16 played c1 with c3 lit; after c1, c2, a sprint and the
  dash, 17 of 19 played c1 with c3 lit. Idle into the dash, 0 of 17.
- **Cause (measured):** `Moveset.stringPlace()` kept the string's place under any move on show (`fresh = !!c`), but a move with no
  next (`nextOf()` null: the charge's release, the special, the dash) goes through `opener()`, which begins the string again once
  `after` is past RESET (11 real s into the burst's recovery in the charge's case). A press made before such a move's free recovery cut
  opens waits in the buffer and is taken when the cut opens, so the `after` that counts is that later one (the dash: 4 of 19 still
  wrong with the first half of the fix alone, pressed at 0.85 to 0.89 s and taken past RESET).
- **Fix:** the read keeps the place only under a move with a next; under one with none it asks RESET and the PAUSE window as
  `opener()` does, at the `after` the press will be taken at (`Moveset.takenAfter`: now if the paid or free cut is open, else when
  the free cut opens, 0 if the move ends first) (`src/tools/moveset.js`, 10 lines). Measured: 0 of 72 presses on the wrong pip in the
  same four scans; the verifier's 25 string plans unchanged (the charge's plan 1 to 0; the two 16-frame pauses keep their known
  one-frame buffered press); the shader programs 163 with the cutlass drawn (no new material).
- **Rule:** 204.

### 2026-10-11 · The string row lit the wrong pip through a pause string (melee phase 6, the verifier)

- **Seen:** headless (960x600, the Throwing Room), c1 and c2, then LMB 18 frames after c2 ended: j1 began with c3 lit, j2 and j3 with
  c1 lit; after c1 alone, t1 began with c2 lit and t2 with c1. 10 of 10 pause-string blows on the wrong pip, 31 of 31 plain ground
  blows right (8 plans: pauses of 18 and 30 frames, the plain string, mashing, pauses of 8 and 52 frames, outside the window).
- **Cause (measured):** `Moveset.stringPlace()` read the ground string only: in the PAUSE window after the slot a pause string
  branches from it answered the next slot, and through a pause string's run (`str` 'pause') the first; the row drew only the
  loadout's slots, so a pause string's blow had no pip to light.
- **Fix:** `stringPlace()` follows `opener()` and `nextOf()` into the pause strings too (`branch`: the slot it branches from, its moves,
  its next, its struck); the row draws it as **the pause string's row**, a second row of pips over the string, its thread rising from the gap after
  that slot, its next lit and no slot lit (`ui/cutlassstringrow.js`); the string's row never moves (that row's room kept, bottom
  anchored: the row's rect 442,502 76x18 before, its string at the same 442,502 in a 116x38 canvas after). Measured: 0 of 41 blows
  on the wrong pip, the same 8 plans; the shader programs 163 before and after with the cutlass drawn (the row is a 2D canvas).
- **Rule:** 204.

### 2026-10-11 · The bottle's arc stayed up after the brush was stowed (melee phase 6, the verifier)

- **Seen:** headless, paint, let go, G 10 frames later: the arc at full strength 24 frames after the key, last seen 36 frames after,
  18 of them with the brush gone from the hands; LMB held through the key, 34 full frames, last at 46; J (the Veritome asked for) the
  same, 24 and 35.
- **Cause (measured):** `feedback/loadgauge.js` keeps `show` at LINGER (0.8 real s) after the load stops and never asked the belt;
  phase 6 moved the arc beside the body once the paint reticle is gone, and the reticle goes with the brush, so the linger stood at the
  chest with nothing in the hands.
- **Fix:** `show` drops to 0 the frame the brush is no longer asked for (`belt.get('soulbrush').wants`), unless a jet runs. Measured:
  0 frames shown after the key in all four (G and J, let go and held); a rocket gathered and flown with the brush stowed keeps the arc
  while it runs (opacity 1 over 28 frames).
- **Rule:** 205.

### 2026-10-11 · The bottle's arc stood at the Courier's chest while painting (melee phase 6, at the merge)

- **Seen:** headless, the four phase 6 branches merged (960x600, the Soul Brush painting at Strawman): the bottle's arc beside the
  Courier's chest, not beside the paint reticle's ring on Strawman; `game.paintReticle.mesh.visible` false while painting, and true
  while carrying a pot with nothing drawn.
- **Cause (measured):** two builders in parallel, each right alone. The bell-and-brush branch had `PaintReticle`'s constructor register
  itself (`game.paintReticle = this`) so the arc could stand beside it; the Lockheart-and-throw branch built a second `PaintReticle` for
  the carry throw's landing (`CarryThrowMark`, built in `main.js` after the brush's). The last built took the name: the arc read the
  carry's reticle, hidden while painting, and fell back to the chest.
- **Fix:** a borrowed look is built `new PaintReticle(game, { aim: false })` (`vfx/brushmarks.js`, `vfx/carrythrowmark.js`). Measured:
  painting, the reticle at (462, 312) with a 34 px ring and the arc at (475, 312); carrying, the landing shown and the brush's reticle
  hidden; the programs 163 before and after.
- **Rule:** 203.

### 2026-10-11 · Space from the crouch toggle hiccuped into the standing idle (the owner, v144's posture)

- **Seen:** the owner: "jumping from crouched state causing a sort of hiccup like the courier is TRYING to jump but they transition to
  standing idle instead". Headless, every frame from Space (60 Hz, at 19.5, 0, -32.1): with C pressed once (the v144 toggle), the
  jump fired on the press frame (`move.jump` 'ground', 6.05 m/s up) but rose 0.196 m and was back on the floor at k9 (150 ms), upright,
  the standing idle at 0.40 by k9 and 0.97 by k20; standing or with C held, 0.922 m, down at k34 or k35. Still or walking, Space 1, 30
  or 120 frames after the C, all alike. With C held the jump was whole, but the standing idle showed at 0.29 in its first 0.05 s.
- **Cause (measured):** a jump from the crouch stands them up (player.js, `setPosture('stand')`), so the step after it grows the capsule
  from low to standing in the air (`setShape`). `setShape` moved the collider with `setTranslationWrtParent` alone, which Rapier
  applies only in `world.step`: the controller asked in that same step met the standing capsule at the low one's centre, its foot
  0.175 m below the feet, 7.4 cm in the floor, and called it grounded while it rose; the next step's grounded branch zeroed the jump.
  (C held kept the capsule low in the air, so nothing grew.) A Rapier-only probe: a world translation set on a parented collider moves
  it at once and leaves its offset alone; the next step puts it back at parent times offset, so the two never disagree for long.
  Over that, the crouch's weight fell at 12/s while the air's rose at 10/s, and the standing idle under both showed through.
- **Fix:** `setShape` sets the collider's world translation from `this.pos` in the same call (a CROSSING in player.js: one line under
  a three-line comment; handoff to Petra). The take-off from the crouch holds the crouch's weight under the air's until the air has the whole body
  (`character.js`, `st.crHold`; `st.crouchW` is the weight as laid). Measured: every crouch case 0.922 m and down at k34 (standing:
  k35, the fixed step's accumulator); the standing idle shown falls from the crouch's own 0.20 at k-1 (0.17 at k0) and never rises;
  walking crouched, the walk shown 0.017 at most where it was 0.96. The slide hop with C tapped: 0.199 m before, 0.926 after (C held:
  0.926 both). C held and let go, crouch to prone to stand, sprinting out of the crouch: feet heights and grounding unchanged, no rescue.
- **Found at review (the verifier):** in the basement tunnel (a 1.5 m roof, no room to stand) the crouch jump hits the roof at 0.119 m
  and lands at k6, before the air is whole; the hold was let go on landing at 12/s while the crouch (fallen to 0.30 in the air: player.js
  aims it at 0 off the ground) climbed back at 12/s, and the two crossed: the crouch's weight 0.80 to 0.44 at k8, the standing idle 0.41,
  the hip 0.455 to 0.625 m over the feet until about k20. Fix: landed into a crouch that is climbing back, the hold is kept until the
  crouch reaches it (the landing frame itself too, where the crouch still falls one more step), and the hold is taken at the larger of
  the take-off frame's crouch and the frame before's (getting up from the belly lets the crouch start falling on the take-off frame:
  0.82, the idle 0.29). Measured: the tunnel's crouch weight 0.80 throughout, the idle 0.198 at most (the crouch's own 0.20), the hip
  back to 0.46 m by k16; the get-up jump's first frame lifts the head 0.083 m (was 0.177; the C-toggle jump's 0.085), the idle 0.169.
- **Rule:** 199; 200.

### 2026-10-11 · Tools stayed in the hands on the belly (the owner: "it looks SUPER goofy otherwise")

- **Seen:** the owner: prone (C, C) with a tool out, the tool stayed in the hand along the crawl (read in the code, not measured before:
  nothing put one away or kept one in). Building the fix, a second, measured: the aim held (and the fire button) lying down, with no
  tool out, brought the psygun out on getting up.
- **Cause:** nothing put a tool away for the posture (the core's, v144); the belt could put a tool away but not bring one out. The
  psygun's own `stowed` (its ladder and swim return) remembered a combat press made while the hands were taken.
- **Fix:** `tools/proneholster.js`: going prone stows the tool asked out through the belt (its own stow), as the body goes down (in the
  holster 20 frames after); while down a worn tool's key is spent before the tools read it, with a throttled log line (a placeholder
  for Espada), and `busy` (the passive techs' both hands taken) keeps the psygun's own draws off; once up (the getting up played out),
  the one that was out is drawn again (`belt.draw`, whose adapters now have `out()`: a CROSSING in belt.js); one put away by hand as it
  went back stays away; the psygun's memory is let go each frame down. A pot in the hands keeps them off the belly (C from the crouch
  stands them up: a CROSSING in player.js), and F picks nothing up lying down (carry.js). Measured, headless: the cutlass and the
  psygun in the holster by k90 (prone at k70), drawT 0 while down, Q, X, LMB, R and RMB held all refused, drawn again at k190 (the
  getting up done at k189), in hand at k205; Q pressed as the cutlass went back: it stayed away.
- **Found at review (the verifier):** the psygun kept presses made lying down and fired them later by itself. LMB tapped prone: the
  quick-draw buffer was held at 0.05 (`tryFire` keeps it while the gun is not up) and the shot left as the gun came back; the middle
  button: `wantShell` held, a slicer shell spent; a charge released prone: `releaseCharged` held, a charged beam; a charge held into
  prone: frozen at 0.37 with its Lachryma reserved, and resumed once the gun was back. With the Sondelass or nothing coming back, the
  same fired at the next psygun draw. Cause: the holster stowed the gun every frame, but the gun's own trigger queue is not the
  belt's, and the gun read its keys after the holster had run. Fix: a CROSSING in `tools/psygun/weapon.js`: while the prone holster is
  `busy` the gun reads as another tool out (every one of its keys held up, the charge cancelled and refunded, a move cancelled), and its
  buffer, its press clock, a shell asked for and a homing paint are let go. Measured, headless, both builds: the tap, the shell, the
  charged release, the charge held through, and the same with the Sondelass or nothing coming back (X later): before, a shot or shell
  at k204, k299 or k314; after, none, and nothing queued on any frame down. A tap or a shell after getting up fires as before (k344 and
  k341 in both). Also: a seam's reset while getting up no longer ends the refusal early (`down` is read from the posture alone).
- **Found at the second review (the verifier):** F lifted a pot while the Courier was still getting up off the belly. The pickup
  refused only on `P.prone`, which is false from the frame C starts the getting up (posture 'stand', `postureT` > 0), so the lift (k171,
  `postureT` 0.47) cut the exit clip short: the capsule went from prone to standing on the lift frame and the body was pulled upright
  mid-rise. Fix: the pickup also waits on the holster's `busy` (lying down or getting up), in the same CROSSING in carry.js.
  Measured (the verifier's own case: the Sondelass put away by the holster, a pot 0.9 m ahead, C at k160, F at k170): no lift on any
  frame of the getting up (k161 to k200), the Sondelass drawn again at k201; F at k203, once up, lifts at k204 as before; F lying down
  (k130) lifts nothing.
- **Rule:** 201.

### 2026-10-11 · A stinger between string blows opened a string slot a blow early (the verifier, before merge: the blow events)

- **Seen:** headless, the blow events' oracle. c1 to c4 landed on a slip jelly, a stinger landed, c1 to c3 landed: `move.string.end
  { run 8, pause }`, where the LMB blows were 7 and 8 is slot 5's feat threshold. The iaido's draw cut and the Tidecutter after c1
  read `{ run 2 }` against 1. In 3 of 20 random sequences the best run read one higher than the LMB blows alone.
- **Cause (measured):** `Moveset.markBlow` raised the string run at every counted contact, whatever the blow's kind; only
  `closeBlow` treated a special's blow (`kind` special or iaido, the stinger's `own`) as apart, and only from the miss. Dovina's rule is
  "the longest unbroken run of LMB string blows".
- **Fix:** `specialBlow(c)`, asked by both: a special's blow sends its `move.blow` but neither adds to the run nor ends it; and
  `markBlow` marks nothing on a blow already closed. Measured: the same sequence `{ run 7, pause }`; the draw cut, the Tidecutter, and
  R inside a whiffing c2, each after c1, `{ run 1, pause }`; a whiffed stinger inside a run still ends nothing (`{ run 4, pause }`).
- **Rule:** 198.

### 2026-10-11 · A blow said hit: false, then struck; a string run lived through a form switch (the verifier, before merge: the blow events)

- **Seen:** headless, the blow events' oracle. (1) c3 with a slip jelly 0.9 m away at 2.66 to 2.84 rad off the facing (12 of 12
  tries): `move.blow { move: 'c3', hit: false }` at t 0.477, the jelly struck the next frame at t 0.495; the same band behind j1, the
  launcher and a1. (2) c1, c2 landed, the rod (2) for 5 real s, the cutlass (1): `M.after` read 0.5, the run 2 was still open, and
  j1, j2, j3 grew it to 5 with no `move.string.end`; the hook the same.
- **Cause (measured):** (1) `melee.js` `sweep()` strikes to `strike[1] + pad` (0.012 clip s); the moveset closed the blow at
  `t > strike[1]`, so a thing in the pad was struck after its blow was reported. (2) `Moveset.after` grows only in `update()`, which the
  Sondelass calls only in the cutlass form: the string's window (RESET, 0.9 s) stopped with it.
- **Fix:** (1) the moveset passes the sweep its pad (`STRIKE_PAD`) and closes a blow at `spent()`: in its recovery and past
  `strike[1] + STRIKE_PAD`; a whiff cut short in the pad by the next move is still a miss (its strike ran its course). Measured: c3 8
  of 8 placements `hit: true`, j1 7, the launcher 4, a1 3 (the others no contact at all), no blow marked after its close. (2)
  `Moveset.idle(dt)`, called by the Sondelass every frame the cutlass is not read: the same 5 s on the rod or the hook sends `end
  { run 2, pause }` 0.9 s after c2, and the next LMB is c1, a new run.
- **Rule:** 196, 197.
### 2026-10-11 · The half turn slow, the cutlass's run folding the wrist, the iaido through the thigh, the en garde off the line (the owner's animation review)

- **Seen:** the owner: "remove the animation for the 180 degree turnaround, it's slow and breaks flow"; the en garde wanted "the torso
  rotated approximately 20 degrees CCW ... more like a fencing pose", the blade "posed centerline with the main mass"; "The Sondelass being
  held while running has the wrist hyperflexed and arm clipping into the body, same with the iaido charge". Measured with the pose audit
  (285 states; the Sondelass's 46 and 22 more): the drawn run's wrist 96 degrees toward the little finger (102 sprinting), the elbow bent
  54 back, the handle 9 cm into the lower back, the hand 5.6 into the pelvis; the iaido's blade 7.7 cm into the crouched left thigh and
  its guard 7.1 into the belly, both elbows 72 to 78 off their hinges; the en garde's chest 8 degrees the wrong way, its blade 61 to 111
  cm to their right; the pommel 6 to 10 cm into the chest in c1, the charge, the launcher, the dash and the counter.
- **Cause (measured):** the drawn run turned the hand to point the blade back (`rot`, held by `steady`) and pulled it 47 cm to the hip by
  IK with the default pole: a blade on the thumb's side of a fist points back only with the arm turned in at the shoulder and the forearm
  turned palm-out (near 180 degrees between them), so the wrist took it all, and the default pole bent the elbow backward. The iaido's
  hand turn laid the blade through the crouched thigh and its reach broke the elbow. The arms' hinge pass was off with any tool out, and
  the Sond_ clips were not hinge-repaired. The en garde was Sond_Idle as captured. The handle ran 0.28 m behind the palm for every form
  (the rod's butt).
- **Fix:** the half turn out (`courier/anim/skidstop.js`, the skid stop kept; the reversal's numbers unchanged, docs/ART.md section 10).
  The en garde a stance (`stance:cutlass`): the chest 21 degrees toward their left, the head 2, the guard and tip 2 cm off the midline.
  The drawn run and the iaido re-posed by the shoulder and the elbow: the elbow's pole placed, the hand laid along its forearm with the
  blade where it is wanted (`aim`, new in stances.js); the iaido's off hand eased about the blade at its mouth, thumb toward the hilt, and
  carried there along a reach with its wrist in line (`offHand`, `easeGrip`); blade mode holds the iaido's pose; the draw cut begins at
  0.22 s of its clip. The Sondelass's set hinge-repaired, clips and posed arms (`hingedArms`). The butt slid in for the cutlass and the
  hook (0.1 m; the rod's 0.18). The hook aimed as a rod is pointed (the forearm 60 degrees below the shaft); its hand clear of the running
  thigh (`stance:hookHeld`). After (the same audit): the en garde and its walk clean; the run and the sprint 37 and 36 degrees at the wrist
  for a few frames of the blend into them (marginal), nothing in the body; the iaido's hold clean, nothing in the body; the pommel out of
  every stroke. Not fixed, with their causes, in the report: the strokes' wrists (62 to 70 degrees toward the little finger) and forearm
  turns (140 to 180) as the Sond_ clips hold them, which the hinge repair does not reach; the launcher's guard through the head; the
  Tidecutter's left forearm in the chest; the stinger's exit into the run; the off hand's first frames into the iaido.
- **Rule:** 219.

### 2026-10-11 · A blink out of the stinger flung them on at 14 m/s (found building the blink cancel, melee phase 2)

- **Seen:** headless, the blink cancel's probe: E 2 or 8 frames into the stinger, the Courier came out of the blink at 14 m/s and went
  8.03 m in the 30 frames from the press, against 6.3 m/s and 5.4 m out of c2, the launcher or the iaido's charge; an LMB 4 frames
  after was the dash slash, not the string.
- **Cause (measured):** the blink's exit is the body's speed at its start or its own 7 m/s, the greater (`blink.js`, `hs0`). The
  stinger's launch carries them at 30 m/s and sheds to its `endSpeed` 6 only in `Launch.finish()`; the cut-in ends the launch with
  `end()` alone, so the blink read 30 m/s, and the core's cap left 14.
- **Fix:** the stinger's `onEnd` and every carried move's (`Moveset.carry`) shed to the launch's `endSpeed` (`shedSpeed`; on the
  ordinary end it has already been shed, so nothing changes). Measured: out of the stinger 6.3 m/s, 5.38 m, the next LMB c1. With it,
  the dash is not taken out of a blink cancel (its 7 m/s exit is not a sprint: an LMB 3 frames after a blink out of c2 was the dash
  slash; now c3).
- **Rule:** 195.

### 2026-10-11 · The belly crawl poked through walls (Petra's v144: "the head and outstretched arms can poke into a wall")

- **Seen:** prone (C, C) at the workshop's south wall (the plane z = -15; the capsule's axis can come to 0.32 m of it), the posed body
  measured against the plane, mesh and bones, three ways. Crawling straight at it: the hands 31 and 36 cm through, the fingers 61 cm,
  the mesh 64 cm (the head's bone stopped 4 cm short: the arms lead the head, they do not follow it). Crawling along it, leaning on it:
  the shin 11 cm, the mesh 15 cm (the knees flare 0.46 m each side). Turning in place beside it (the combat stance, 90 degrees a second): a toe
  86 cm, the mesh 92 cm, facing away (the feet trail 1.25 m behind the axis); 64 cm with the capsule 0.6 m off the plane.
- **Cause (measured):** the capsule stands upright, 0.27 m in radius, 0.8 m tall: it knows nothing of the body lying on it. The belly's
  outline about the axis, from every vertex over a crawl cycle (hair, fingers, toes): 0.97 m ahead (the hands, at 15 degrees off the
  facing), 0.46 m to each side, 1.25 m behind (the toes). The wall stops the circle 0.32 m off; the rest of the body goes through.
- **Fix:** the clearance in the look (`courier/anim/crawl.js`; the body is Petra's, so `player.js` is untouched). 48 rays round the axis at
  0.3 m, each as long as the outline reaches that way and half a metre more; each surface point inside the outline (a convex polygon of
  24 support planes, `CRAWL.outline`) is moved out along its normal by the polygon's nearest edge, the planes found added by the way
  they face, and the body so slid tried again against every point (4 rounds: a prop's push into a wall is given back, the poke shared).
  The slide goes on the pelvis only (the pose, the hands and the feet are the clips'), at most 1 m, in at a rate of 60 a second (a
  rate of 30 left 14 cm of toe through the wall in a 540 degree-a-second turn) and out over about 0.15 s. Two first tries fell
  short: the plane the support function gave for a hit, taken as infinite, pushed the body 0.85 m out of the way of the end faces of two
  short walls it could pass between; the push of one surface alone sent the body 14 cm into the wall beside a prop. Measured after
  (the same harness, the clearance patched off for before): straight at it, the mesh 0.2 cm through at worst (1 cm short at rest), along
  it, 2 cm short; turning, 0.6 cm short, 4 and 6 cm through for a tick or two at 540 and 1080 degrees a second; in the open, a slide
  of exactly 0; 0.09 ms a frame prone. What it cannot hold: a gap narrower than the body (0.7 m wide, two walls: 10 cm through each,
  the same as before); handed to Petra with the numbers.
- **Rule:** 194 (new; 193 as Calissa wrote it, renumbered at the gate: Dovina's 193 was first).

### 2026-10-11 · High Time chased what it struck (the owner: "the launcher is linked to chasing the target it hits, so the action breaks when attempting to use it on the Strawman")

- **Seen:** the owner, at Strawman's sparring circle: S + LMB held does not go up. Measured (Strawman 1.9 m ahead, S + LMB held,
  then LMB every 0.1 s): the Courier's feet topped out at 0.43 m; with no press after it, the launcher's last pose stood frozen 1.4 real
  s on the ground; the air string played on the ground.
- **Cause (measured):** High Time was the ride (`tools/moveset.js`): from the launcher's strike the Courier was carried 1.3 m under the
  centre of what it had struck, at that thing's measured speed, and the launcher's pose was held until that thing fell at 3 m/s. Strawman
  takes a knock as nothing (its `knock` is empty): its centre stays at 1.35 m, so the ride held the Courier on the ground, and it never
  falls, so the pose held to the ride's 2.5 s cap. Any target that cannot be lifted did the same.
- **Fix:** the rise is the Courier's own (`HIGH`, `leap()`): from the strike's end a ballistic arc to 3.92 m over the ground they left
  (2.2 x 1.78 m) at 14.7 m/s², the launcher's pose held till that arc turns over; an air blow begun on the way up keeps the arc to its
  top. What was struck still gets the held lift (9.2) and goes up to the blade; the ride is laid on only past the top, and only on a
  thing seen to rise 0.1 m in 0.2 s (`RIDE.up`, `RIDE.still`), else let go. Measured: Strawman 3.92 m at 1.17 s, the air blows over its
  head, the plunge from 3.82 m lands at 1.85 s and its ring strikes it; a slip jelly 3.92 m (the same rise), every air blow lands (gaps
  0.62, 1.10, 1.25 m); with nothing struck, 3.92 m at 0.97 s. The paid cut from the launcher into a1 keeps the arc (3.92 m).
- **Rule:** 192 (new; 191 as Calissa wrote it, renumbered at the gate: Dovina's 190 was first).

### 2026-10-11 · Strawman could not be locked on to (the owner: "It is also impossible to lock on to the Strawman")

- **Seen:** the owner: Z never locks Strawman; the cutlass and blade mode never aim at it.
- **Cause (measured):** Strawman was a candidate all along (`game.creatures.list`, 26 m reach; headless, the sparring circle, 2 m in
  front of it: `candidates()` listed `strawman`). The line-of-sight test (`lockon.js clear`) cast from the eye to its middle (1.35 m up)
  and hit Strawman's own capsule first: a static collider with no rigid body, so the filter that skips moving bodies kept it (`clear`
  false, `acquire` false). Every creature the lock had held so far had a dynamic body and passed by that filter.
- **Fix:** `clear(pt, ref)` leaves out the colliders whose entity is the target. Petra's ruling: a training body comes to the lock
  through `game.lock.add(ref)`, added by the room that owns it (Strawman, the status bench's eleven roly-polies), and the creature loop
  skips `training`; its `lock.on` carries `training`, so the ledger never counts it. Measured after: `acquire` locks Strawman (the
  reticle on it; the cutlass's moves and blade mode aim through `game.lock`, not entered headless); `lock.on` 0 in the ledger.
- **Rule:** 191 (new; 190 as Calissa wrote it, renumbered at the gate).

### 2026-10-10 · The crouch walk's head swung (the owner: "that crouch walk has a lot of excessive head movement")

- **Seen:** the owner: excessive head movement crouch walking; "felines have a very still head". In game at 2.2 m/s, every tool off,
  against the capsule: the head bobbed 19 cm and swung 56 cm side to side, turning 1,448 degrees a second on average (2,731 at most).
- **Cause (measured):** the loop the crouch had taken that morning (case below), Loco_SneakWalk, is an upright tiptoe sneak whose head
  swings 56 cm across and 43 fore and aft at its own pace (662 degrees a second): at 4.8 times its cadence that became 1,448. The other
  crouched loops, at 2.2 m/s: Loco_CreepSideR 38 cm across, 712 degrees a second; Loco_CrouchWalk 11 cm, 23. Loco_CrouchWalk had read as
  lunges only at its own squat: its trailing knee at 13 cm off the ground.
- **Fix:** the prowl (`courier/anim/prowl.js`): Loco_CrouchWalk, its hips lifted 0.14 m by the foot IK (the knee kept 25 cm up), strides
  1.4 times its own; the head held as a cat holds it, its turn followed slowly and levelled to a gaze, its place held by the neck's swing,
  each neck bone capped. Head: bob 3.0 cm, sway 4.1, turn 3 degrees a second (6 at most). Building the crawl beside it: the foot IK's
  reach drop read a crawl's straight legs as a reach and sank the belly crawl 11 cm into the floor (the knee at -14 cm); the crawl now
  takes the reach drop and the knee guard off by its weight.
- **Rule:** 188 (new); 186 stands (its fix, the sneak, is replaced).

### 2026-10-10 · The braced idle's left hand twitched every loop (the owner: "stop the twitching motion on the Courier's left hand")

- **Seen:** the owner: the Braced idle is almost perfect but for the left hand; "secondary motion in idle animations happens way too
  often".
- **Cause (measured on the clip, frame by frame):** Loco_IdleMasc's left fingers curl and flick once a loop (the index 72 degrees a second
  in frames 15 to 24, then 344 in 31 to 53), the hand thrown 51 cm/s off the chest, and the hinge repair wheeling the near-straight
  forearm at its 360-degree cap through the same frames (175 to 497 degrees a second): every 2.5 s. The same frames are the left arm of
  the Crucibelle's and the Soul Brush's stances (baked over `idle`, 1.4 times). Loco_IdleD (weightShift) throws its right hand out at
  2.1 m/s once each 5 s loop. The breaks came every 7 to 12 s whatever the idle (two to three upright loops).
- **Fix:** `IDLES.calm` (idlebreak.js): the gesture's frames bridged for those bones (braced's left arm 14 to 56: the hand 9.6 cm/s mean,
  16 fastest, the index 3 degrees a second; weightShift's right arm 29 to 133, its throw kept as `Loco_IdleD:B`); a B (a break, or an
  idle's own) after a random 4 to 5 of A's loops (`IDLE.every`, the seed's stream): measured over 20 real minutes, 4.45 to 4.52 loops a B.
- **Rule:** 189 (new).

### 2026-10-10 · High Time stopped at 2.6 m (the owner: "there isn't enough height distance covered")

- **Seen:** the owner: the held launcher should carry the Courier about 2.2 times their own height. Measured in the juggle pen (a slip
  jelly 1.9 m ahead, S + LMB held, then LMB every 0.1 s): the feet at 2.57 m at the top; with no press after the launcher, 4.08 m.
- **Cause (measured):** a1 begins at the launcher's row time (0.55 s) and hits at 0.78 s while the jelly still rose at 5.4 m/s;
  its lift (2 m/s) is laid on as the jelly's new upward speed (each creature's `knock` sets it), so the climb stopped within 0.2 m
  and the Courier, riding 1.3 m under the jelly's centre, stopped with it. The launcher's own 9.5 m/s only showed if a1 waited for
  the apex, which no one pressing on does.
- **Fix:** an air blow's lift is a floor (`blow()` in `tools/moveset.js`: the ridden thing's measured upward speed kept when it is
  more); the held lift 9.5 to 9.2 so the top is the owner's height: the feet 3.93 m (2.2 x 1.78 m = 3.92) pressing on, 3.80 m with no
  press. The tapped launcher's numbers are unchanged to the centimetre (its rise is spent by a1's hit). Every air blow still lands:
  the gaps 1.20, 1.27, 1.28 m.
- **Rule:** 187 (new).

### 2026-10-10 · The crouch walk read as lunges (the owner; the locomotion clips round)

- **Seen:** the owner: the crouch walk reads as lunges. In game (`character.animate`, every tool off, front and side): the rear leg
  thrown long behind, its knee near the ground, every step.
- **Cause (measured):** Loco_CrouchWalk moves 0.61 m/s of its own and the crouch 2.2, so it played at 3.6 times: strides 1.65 times its
  own at 2.2 times its cadence, the hips at 0.44 m. The clip named to replace it, Loco_SneakWalk ("a slower crouch" in ART.md), is an
  upright tiptoe sneak: its hips at the walk's height (0.74 m against 0.69), 0.40 m/s of its own. Played as it is, the crouched body's
  posed top is 1.92 m (the low capsule goes under 1.5 m: the basement's tunnel); let down with the walk's strides, the legs ran out of
  reach (the foot IK's reach drop at its 0.12 m cap) and lunged again. Building the half turn beside it: the turn's planted feet locked
  while the capsule was already back at a run (0.08 s after a reversal passes zero), each dragged 0.35 m and let go, 1.6 to 2.3 m of
  planted slide a turn.
- **Fix:** the sneak whole once moving, let down 0.38 m by the foot IK (`SNEAK` in character.js: the knees bend, the feet stay), its
  strides to 1.15 times its own and the rest cadence (4.8 times its own at 2.2 m/s): posed top 1.46 m, reach drop 0.08 m at most;
  Loco_CrouchWalk out of the core pack. The turn's feet planted only under 1 to 3 m/s (`TURN.still`): its planted slide 0 to 0.01 m.
- **Rule:** 186 (new).

### 2026-10-10 · Strawman's jab glinted from its first frame (Calissa, judging the strings)

- **Seen:** on the sparring sheets, the jab (0.45 s to its strike), the one-two's jab and nearly the hat-butt (0.60 s) wore the hot line
  and the glint from the first frame of their wind-up; the one-two's second blow went hot before its first had struck.
- **Cause (measured by the builder):** the mark goes hot when V would answer: the parry's window (0.25 s) plus the quarter second a press
  keeps asking, so half a second before a strike. A wind-up of 0.5 s or less is all window: no dark beat, nothing to learn, and an early
  press always answers.
- **Fix:** `vfx/strawmanmoves.js`: no blow strikes sooner than 0.75 s after its move or its last blow begins: the jab 0.45 -> 0.75 s, the
  hat-butt 0.60 -> 0.75 s, the one-two 0.45 + 0.40 -> 0.75 + 0.55 s (each key shifted, the poses unchanged); COMBAT-LAB.md section 6.
- **Rule:** 185 (new).

### 2026-10-10 · The Figment attack telegraph climbed Strawman like a tent (Calissa's contact sheets of Strawman's moves)

- **Seen:** on every move's sheet, from the striker's place and the side, the drawn area stood up from the clay over Strawman's body, a
  tall translucent prism from the ball to the hat that hid the whole wind-up (the swing's cone, the jab's lunge, the spin's circle).
- **Cause:** the mark's drape finds the ground with a ray down from 4 m over each grid point and keeps any static collider
  (`vfx/figmenttelegraph.js rayAt`: no parent body, or a fixed one). Strawman's capsule (room.js) is a collider with no parent body, so
  every point over it took the capsule's top for the floor. No other creature stands on a static collider of its own, so no fight
  showed it.
- **Fix:** the ray's filter also refuses a collider registered to a creature (`physics.entityOf(c)?.type !== 'creature'`). Re-rendered:
  every area lies flat on the clay round Strawman's ball (`strawman-*.png`, the scratchpad's strawman-strings).
- **Rule:** 183.

### 2026-10-10 · Strawman struck on real seconds while its windup counted sim seconds

- **Seen:** found reading the swing for the attack strings, not in play: the model's swing ran in `update(raw)` (real seconds) and
  called the strike at 0.925 real s, while the windup it registered counts `w.t` down by the sim step in `creatures.update(dt)`.
- **Cause:** worked from the two clocks, not measured on the old build: under any time scale the two parted. Under a 0.25 hold the
  sleeve swept at 0.925 real s with 0.23 sim s of the windup gone (`w.t` 0.99, not 0.3): the window would have opened 2.8 real s after
  the sweep. The parry's own breath (`time.pulse('parry', 0.05, 0.08)`) parted them by a few frames every parry.
- **Fix:** Strawman's body, its moves and its strings run on `dt` (room.js `tick(dt, raw)`, `model.update(dt)`); the bout's gap stays
  on real seconds. Measured headless, every move at 1x and at 0.25x: `w.t` at the strike 0.300 to 0.317 (one 60 Hz frame of 0.3).
- **Rule:** 184.

### 2026-10-10 · The Sondelass's air string missed: two gravities, and two blades that never crossed the front (the owner: "I also had issues with the aerial portion of the launch combo")

- **Seen:** headless, a slip jelly calmed 1.9 m in front, S + LMB, then LMB every 0.1 real s: the launcher hit; a1 and a2 missed (the
  jelly's centre 2.6-3.5 and 4.3 m above the Courier's feet, the cuts reaching about 2.7 and 3.1); after making the two rise and hang
  together, a2 still missed with the jelly at a perfect 1.27 m gap and 1.4 m off, and t2 (the pause string's held thrust) never struck
  a jelly 1.48 m straight ahead.
- **Cause (measured):** (a) the launcher lifted the jelly at 9.5 m/s (4.6 m up) while the Courier rose the clip's 0.92 m; (b) in the air
  string the Courier fell at 0.12 x 21 = 2.5 m/s² and the jelly at its own 9.81, the gap growing about 1.8 m over a1 and a2; (c) the tips'
  angles about the body (`melee.js` tracks, sampled across the strikes): a2's somersault turns the blade in an upright circle 37-49
  degrees to their left, t2's thrust is held 40-92 degrees to their left, so neither sector ever reached a target dead ahead (the sweep's
  half-width and the jelly's own came to 34 degrees); (d) once the pair rode together, a1's and a2's sideways pushes (1.5, 2) carried
  both at 3.8 m/s into a wall, the Launch tech ended the plunge on the wall and a ground blow began in the air.
- **Fix:** `tools/moveset.js`: the **ride**: what a launcher or an air blow lifts is the `juggle`, its motion measured each frame from
  where it is; an air blow (and a launcher held to its strike, from the strike's end) sets the Courier's velocity to it, with a pull to
  1.3 m below its centre and 1.4 m off; the launcher's last pose held till it turns over. A move's `aim` turns the body by the angle its
  arc passes at. A blow that throws the juggle off (push 4 or more, no lift) ends the ride; the plunge's landing gives the ground's
  gravity back. `cutlass.js`: tap lift 5.5, held 9.5; a1, a2 lift 2, push 0.5; a2 aimed 0.73 rad, t2 0.95. After: held, a1, a2 and the
  plunge's chop hit at gaps of 1.20, 1.27, 1.28 m, the pair at 2.3-2.6 m; tapped, at 1.12, 1.27, 1.28; t2 stabbed three times.
- **Rule:** 182.

### 2026-10-10 · The plunge's ring struck what hung overhead and threw it 9 m (found charting the Sondelass)

- **Seen:** the same run: the plunge landed with the jelly's base 3.06 m overhead (the gap 3.5 m), and the ring "hit" it, its push 7 and
  lift 5 throwing it 9 m.
- **Cause (measured):** `Moveset.ring` tested the distance on the ground's plane only (`targets` takes a radius about the feet, and the
  loop checked x and z); the plunge's hit (lift 5) was the chop's and the ring's at once.
- **Fix:** the ring skips a target whose lowest point is more than 1.5 m above the Courier's feet, or whose top is more than 1.5 m below
  them (`RING_UP`); a move's `ringHit` gives the ring its own hit (the plunge's: push 7, lift 0; its chop's push 2, lift 0, so what it
  cut falls beside them). After: the plunge landed with the jelly's base 1.87 m up and it was out of the ring; it landed 1.5 m off and the
  next c1 struck it.
- **Rule:** 181.

### 2026-10-10 · Knees and elbows bent off their hinge (the owner: "joints pointing the wrong way"; the locomotion pass)

- **Seen:** the owner, 2026-10-10: joints pointing the wrong way. In game, every tool off, front and side
  (`docs/ART.md` section 10's states): the upright idle's right forearm angled out from the elbow; Trav_WallJump's knees out to the sides
  and its shins bent sideways under them; the slide's tucked knee. Measured on the in-game Courier (`character.animate` and `poseHands`,
  a synthetic state for each of 20 states of the core movement, 14,012 knee and elbow frames): 2,773 more than 20 degrees sideways off
  the hinge or bent back past straight (the jog 354 of 684, the strafes 326 and 316, the slide 217, the wallrun 163).
- **Cause (measured):** the clips, then the IK. Each shin's and forearm's turn against its rest, its twist about its length taken out:
  of the 9,504 limb frames of the Loco_, Air_ and Trav_ clips, 2,123 bend more than 20 degrees sideways and 212 back past straight
  (Trav_WallJump's knees 125 and 131, Trav_LadderClimb's 123, Loco_LandHard's 102, Trav_SlideLoop's left 86; Loco_IdleFem's right elbow,
  the upright idle's arm, 30 out and 26 back in every frame). In the worst, the thighs' and shins' twist is exactly 0: the suite (and the
  UAL pack before it, whose jog's elbows reach 59) was retargeted by bone direction, never turning a bone about its length, so where the
  capture's thigh or upper arm was turned the lower bone reached its direction off its hinge. The rig's hinge is the lower bone's rest X
  (the walk's knees and elbows turn about it, 2 to 113 degrees, 20 at most off it). After the clips, the IK bent more: the strafe's knees
  re-solved toward the pole (101 degrees off), the wallrun's wall hand's elbow (163 degrees off).
- **Fix:** the hinge repair (`courier/anim/hinges.js`, glossary): the upper bone turned about its own length until the lower's hinge is
  square to the bend, the joints kept; in each clip of the set being polished as it is decoded (`suite.js`, HINGED: Loco_, Air_, Trav_,
  the old swim and tread), and every frame on the posed body after the knee guard, before the joint limits (`character.js` poseHands:
  the legs always, the arms while the hands are empty). The turn changes at most 360 degrees a second in a clip (720 posed): held, a
  near-straight limb's plane wheeled round faster than the limb (Loco_IdleMasc's elbow 13.5 degrees a frame raw, 54.8 squared unheld,
  16.6 held); past the upper's range (a thigh 90, an upper arm 100) a clip's lower stays on its hinge and the wrist or ankle moves. The
  upright idle's right arm is now its left's mirror (`idlebreak.js` IDLES.baked `mirror`). After: the clips 63 sideways and 1 bent back
  of 9,504; in game 91 of 14,012, 85 of them the wallrun's wall hand in the harness's own wall (a real wall not tried); no clip's fastest
  limb step grew 5 degrees or more; every loop's last frame still its first; 23 ms at boot for the 16 clips decoded then (node).
- **Rule:** 178 (new).

### 2026-10-10 · A start snapped a foot and swapped the body in a frame (found measuring the locomotion pass)

- **Seen:** headless, a start from standing to the sprint at the ground's accel (55 m/s2): a planted foot jumped 30 to 38 cm in one
  frame, twice in the start; every joint went from the idle to the run in one frame (the right upper arm 72 degrees in a frame with the
  repaired idle, 20 before it).
- **Cause (measured):** the foot lock let a foot go when the body had run 0.35 m off it, and caught it again on the next frame at the
  clip's foot, the cycle still calling it planted: the eased position to the clip's in one frame. The idle's share is read from the gait
  speed, which passes 0.5 m/s, the whole idle-to-walk band, in one frame at that accel.
- **Fix:** a lock let go stays let go until the cycle lifts that foot (`character.js` footIK, `lock.lost`): the same start's foot 12 to
  15 cm a frame over five frames, eased. The idle's share moves at most a whole in `START_SWAP` (0.15 s), the loops scaled into the
  rest: the start's largest joint step 26 degrees (the right upper arm, with the idle's arm mirrored).
- **Rule:** 179 (new).

### 2026-10-10 · The kick-off threw the body 1.1 m ahead of the capsule (found laying it on the wall jump)

- **Seen:** headless, a jump off a wallrun with the kick-off laid on: the body drawn off the Courier's place, ahead of it (front view, 0.3
  s into the kick).
- **Cause (measured):** `airborne.js` turned Trav_WallJump back (`unturn`, its half turn taken out, the hips' offset turned with it) and
  then took its travel out (`inPlace`, the hips' 0.55 m back from the clip's first frame, unturned): at the half turn the travel was
  turned to ahead and taken off again, 1.1 m, at the kick's full weight until 0.35 s. Every kick-off from a ladder, a ledge, a pole, the
  latch or a grate since it was laid.
- **Fix:** in place first, then unturned: through the kick the hips stay 0.01 to 0.03 m off the body's place. And a jump off a
  wallrun's wall (3 m/s up in a frame while the wall holds them) now plays the kick-off over the air loop; it had played the ground jump's
  crouched spring once the wall let go.
- **Rule:** 180 (new).

### 2026-10-10 · The parry mark said "now" a quarter second after V already answered (the owner: "more apparent ... that you're in the window")

- **Seen:** headless, Strawman's swing in the Throwing Room (its windup 0.925 s, struck as it unwinds): the parry mark's width and alpha
  a frame against the windup's time to the strike `e` (`w.t - 0.3`), and V (the kick) pressed at the first frame below each of eleven
  `e`. The mark reached its fullest (3.6 px, alpha 1) at `e` 0.25 (Held Breath 0.40), exactly `blow()`'s rule; but V answered from `e`
  0.508 (not at 0.558), Held Breath from 0.608 (not at 0.675). Over that first quarter second of answering presses the mark stood at
  3.0 to 3.6 px and 0.86 to 1 alpha on a smooth ramp: 0.2 px between 0.1 s before its fullest and the fullest. Nothing in it said "now".
- **Cause (measured):** the mark read the blow's window (`creatures.shownEta`, fullest in its last 0.25 s), but a press is not a frame:
  it keeps asking for a quarter second after V (`parries.js` `WINDOW` 0.25, the kick's 0.26, the cutlass's 0.28), so a press answers
  from the blow's window plus that. The look showed half the press's real window, and showed its edge as a slope.
- **Fix:** `courier/parry.js` exports the window (`inBlowWindow`, what `blow()` asks; `pressAnswers`, the blow's window plus
  `PRESS_WINDOW`; `shotAnswers`, a shot inside answer()'s 2 m reach plus what it flies in the press's quarter second), and the parry mark
  asks them every frame: while they hold it runs hot (a white core between film rims, 7 px against the ink's 3.6) with the window's glint
  as it opens, and drops back the frame they do not (`vfx/parrymark.js`). After, the same trace: hot from `e` 0.492 (Held Breath 0.642)
  to the strike, every frame; the presses, measured again, answer from 0.508 and 0.608 as before (the rule is unchanged: a tool's
  press asks 16 frames, so it answers from 0.50, the frame the look goes hot; the kick's and the cutlass's a frame or two sooner). The
  ink's ramp now reaches its fullest as the mark goes hot.
- **Rule:** 176 (and 67).

### 2026-10-10 · A slip jelly's parry mark was a tall dome over a body crouched to lunge (found judging the parry window)

- **Seen:** headless in the Throwing Room, a slip jelly winding up a lunge (`squash` 0.62): its parry mark drew a dome about half again
  as tall as the body, its whole back filled with ink and film above the crouched body (hot, a dome of rainbow); in the lunge's flight,
  the body stretched back to its rest height, the outline fitted.
- **Cause (measured):** the jelly's squash, lean, wobble, toes and dent are done in its vertex shader (`creatures/jelly/deform.js`);
  the mark's shells were built from the same geometry with their own program, which knew nothing of it, so they drew the rest shape.
- **Fix:** the mark's vertex shader carries the jelly's bend (its defaults change nothing), and a mark over a creature with `deform`
  hands that body's uniforms to the shells over the body (by reference: a twin of each band's material, its width and heat shared);
  the glint's crest is found on the bent body too. One program as before (159 before and after the first glint). Caught before
  committing: the dent's default `new THREE.Vector4()` is (0, 0, 0, 1), and it blew Strawman's sleeve's shell out into a ball a metre
  across; the default is now (0, 0, 0, 0).
- **Rule:** 177 (and 76).

### 2026-10-10 · The slicks kept a program warm on their own (the program budget 164 -> 165 at v138)

- **Seen:** Petra's v138 gate (the case of the same day, below): the stain parked in the warm-up again and the budget raised to 165,
  because every slick drew with the stain's program. `npm run perf` at 83ebc10: the Dunes, the well and the garden 165 programs.
- **Cause (measured):** once the paint map drew the blots, the stain's program (`vfx/stains.js`) had one look left in play, the slicks
  (`uSlick` 1), and the parked stain stood only to keep that one look from compiling in play. A slick is a flat look on a quad's uv with
  the settings the ribbons' one program already has (transparent, no depth written, no fog): rule 124's flat look of a few lines.
- **Fix:** the stain's slick branch moved, as it was, into the ribbons' one program (`vfx/ribbonlight.js`, look `slick`: `uP` the ramp,
  what the mop left, the seed; a world-position varying for the grazing look), warm from the boot with the jet ring; the dead `uSlick`
  branch out of the stain's program; the parked stain out of main.js's warm-up. `npm run perf` after: the workshop 162, the Dunes, the
  well and the garden 164; programs compiled after the warm-up 3, the same three as before. A slick spilled in the Dunes and in the
  Great Dunemaw's bowl: no new program (163 and 161, before and after it), its program the jet ring's. Rendered before and after from
  three eyes at five steps of the ramp: 55 of 518,400 pixels moved more than 8 of 255 (at most 36), all on the rims' antialiasing.
  The Dunes sweep's weather part: Fury 164 against 164.
- **Rule:** 124 and 169.

### 2026-10-10 · The full mop's smear grew a mopped slick back whole and fresh (found while folding the slicks' program)

- **Seen:** headless in the Dunes: a 1.5 m slick (112 paint-map cells) mopped to 60 cells, its look at 0.54 of its size and 7 s along
  its ramp; then five of the full mop's smears into it (`tools/soulbrush/load.js`: `paintmap.slick` and `slicks.spill`, 0.3 m, every
  0.1 s): its look back to 1.0 and fresh again (4.9 s along), over 68 cells.
- **Cause (measured):** `Slicks.spill` fed any spill that fell inside a live slick by setting its `amount` to 1 and its age back to
  0.12 of its life, whatever the spill's size; `follow()` only ever lowers `amount` (cells taken), so nothing brought it back to 68.
- **Fix:** a spill inside a slick freshens it by its share of the slick's area (none under `minRadius`: a smear, a trail's drop) and
  fills it back only as far as its paint-map cells came back, or by that share where it has none (`vfx/slicks.js`). After, the same
  five smears: 0.61 of its size (68 of 112 cells), 8.5 s along its ramp.
- **Rule:** 175.

### 2026-10-10 · The Courier's idle leaned, and every tool's stance leaned with it (the owner's R21 and Dovina's note, v137)

- **Seen:** standing still, the Courier leaned to their left (the owner: "should be standing straight, with minimal swaying motion");
  the owner's guess: a bad rotation on a spine bone, carried into every animation over the idle.
- **Cause (measured in game over 10 real seconds, every tool off, and against a worktree at 92c7809^, the build before v133):** no spine
  bone was bad and nothing was rebaked wrong (core.bin before and after: 155 clips the same to 0.05 degrees, the rest pose to 0.15). The
  default idle had been made `akimbo` (Loco_IdleRelaxedMasc), whose capture stands on one leg: the pelvis rolled 8 degrees, the hips 10.6
  cm off the feet's middle, the spine leaning 11.3 degrees to their left (hips to neck), the chest tilted 14.8. And every tool's stance
  (and the gun's aim) is laid over the upper body only (`MASK_UPPER`, the hips not moved): the hips, legs and lower spine stayed the
  idle's. Drawn and standing, the Lockheart, Soul Brush, Dreamvane, Crucibelle, Sondelass and Veritome leaned 9.2 to 10.3 degrees,
  each with the pelvis rolled 8 and the spine bones rolled 8 to 12; before v133 all six leaned 0.11 or less (1.1 for the Sondelass's own
  en garde), the pelvis at 0. Walk, run and an emote were the same before and after to 0.01 (they replace the idle whole).
- **Fix:** (a) a new default, `upright` (`idle:upright`, baked at load: `courier/anim/idlebreak.js` IDLES.baked): the seven measured
  again, the straightest and stillest body is handsBehind (Loco_IdleC: lean 0.1, pelvis 0, shift 0, chest 1.1 cm/s), but its hands sit
  on the tools worn at the back and its loop pops (case below); its body with armsDown's arms (Loco_IdleFem) hung at the sides, their
  swing halved, the seam closed: lean 0.2, pelvis 0, shift 0, chest 1.1 cm/s, head 5.8 cm, hands 2.8 and 4.0 cm/s (12 at most). (b)
  `IDLE.under`: while a tool or the gun is in the hands, the aim is up or a passive tech lays its pose (a crate carried, the kick's blows), the idle
  under the layer is the pack's `idle` (Loco_IdleMasc, what every stance was made over), crossfaded over 0.4 s and held 1 s after. The six
  stances now read 0.06 to 1.13 degrees of lean and 0 to 0.04 of pelvis, the numbers of before v133. (c) the kiln's choice:
  `idles.choose(key)`, the list and a save field handed to Petra.
- **Rule:** 173 (new).

### 2026-10-10 · The stillest idle twitched its hands once a loop (found measuring the idles for R21)

- **Seen:** v133 measured handsBehind (Loco_IdleC) as the stillest standing idle but for "a quick hand move once a loop, 15 to 23 cm/s".
- **Cause (measured on the clip):** not a move: a seam. Its steps are 0.3 degrees a frame, then 2.6 and 10.5 at the last two (the right
  shoulder; 1.2 to 1.7 along the spine and head): the capture's end jumps to meet its start. With other arms laid over it, the chest's
  jump alone threw the hands at 50 to 57 cm/s.
- **Fix:** `closeLoop` in the stance bake (`courier/anim/stances.js` bakeClip; Unity's Loop Pose): the two popping frames dropped and the
  difference left between the new last frame and the first spread over the clip; the baked upright's largest step is now 2.0 degrees
  (a forearm's own swing), the spine's 0.3, and the hands' fastest 12 cm/s.
- **Rule:** 174 (new).

### 2026-10-10 · The Lockheart sat against the belly (the owner's v137, via Dovina)

- **Seen:** drawn, the coffin hung from the left hand against the Courier's belly; the owner: "move it forward and lower".
- **Cause (measured, body frame):** the held placement is the rig's: the coffin hangs straight down from the left hand on a 0.22 m chain
  (`tools/lockheart/lockheart.js` hands()), and Lock_Idle held that hand at the chest, 1.19 m up and 0.22 forward: the coffin spanned
  0.84 to 1.10 m, its back 7 cm off the belly's front, from the navel to the hips.
- **Fix:** `stance:lockheart` re-based on the suite's Lock_Idle with the left hand nudged 10 cm lower and 14 cm forward, its arm solved
  again at bake (`nudge`, `courier/anim/stances.js`); the Lockheart plays it (CROSSING, one line). The hand is at 1.09 m, 0.36 forward; the
  coffin spans 0.74 to 1.00 m, its back 21 cm off the body, hanging on its chain in front of the hips. The hoover, the flail and the
  opening are unchanged (each blends over it). Judged from the front, 45 degrees, the side and behind, every other tool off.
- **Rule:** none new (the hand is the rig's, the chain the code's; the clip moved, the code's numbers untouched).

### 2026-10-10 · A sibling wore the Courier's cracks (found building a sibling's shatter)

- **Seen:** the Courier struck on the torso (its crack 0.58), a sibling called beside them showed the same cracks on its own torso:
  its body material's `uDmg`, read from the renderer (`renderer.properties`), was `[0, 0.58, 0, 0, 0, 0]`, the Courier's numbers. A
  guest's rig and a sibling waiting to be met were dressed the same way. A sibling could not crack, or be mended in gold, on its own.
- **Cause (measured):** `courier/vessel/vessel.js` `dress` laid the kintsugi on every rig it dressed with the vessel's one `kinU`,
  `{ own: true }` as well; the uniforms are shared objects, so every Courier model read the Courier's damage (`shared: true`).
- **Fix:** a rig dressed `{ own: true }` keeps crack uniforms of its own (`ch.kinU`, made once at its first dressing); the Courier's
  rigs keep the vessel's. One program still (the uniforms are the material's; the shader is the same). Measured after: the sibling's
  `uDmg` all 0 with the Courier's torso at 0.58 (`shared: false`), and a sibling's shatter (vfx/siblingshatter.js) cracks and gilds
  only itself.
- **Rule:** 172 (new).

### 2026-10-10 · The top half of the frame went to a flat rainbow in the great cavern (the jelly-scale round's item 6, Petra's v137 ask)

- **Seen:** the Courier 32.5 m out on a ring pool's bearing, facing the FOE at W0 with its frame on (the camera 6.15 m behind, pitched
  14 degrees): the frame's top half black over a band of violet and teal; the FOE and the Courier's upper body gone. Every ring pool's
  bearing did it.
- **Cause (measured):** the eye was 6 cm over the sand and 18 cm under W3's mouth. A pool's look (`DunemawMouth`, `PoolRing`) was laid flat
  at its centre's height on a dish that falls 4 degrees to the middle: a 15 m ring pool stood 0.52 m over the sand at its inner edge and
  sank as far under it at its outer, and W0, on the cone's point, was buried but for its middle metre. The mouth was two-sided: from
  under it, its ink filled everything above the horizon and its labradorite lip, edge on, was the rainbow. With W3's mouth hidden the
  frame was right.
- **Fix:** the look laid on the slope: `layOnGround(geo, ground, k)` lifts the mouth's, the maw's and the ring's vertices onto the dish
  (the bowl passes `ground`: one line in Petra's `world/well/bowl.js`), and the mouth is one-sided. Rendered again: the same shot shows the
  whole Great Slip Jelly; W3 lies whole on the slope from above and flush from the side; W0 is a ring round the FOE's foot. The eye
  still rests a few centimetres over the sand when the frame pitches it below the pivot: the camera's, handed to Petra.
- **Rule:** 170 (new).

### 2026-10-10 · Three programs compiled after the warm-up (perf at v137: MeshStandardMaterial, ShaderMaterial, MeshDepthMaterial)

- **Seen:** `npm run perf`: 3 programs compiled after the warm-up (was 2).
- **Cause (measured, each by the object drawn when its program was made):** the Lockheart's coffin (`pneuka/thingmodels.js`,
  `flatShading: true`) is built on the first tick and drawn flat until the present's walk smooths it a second later: a flat variant. The
  Dunes' trail map (`world/ground/trailmap.js`) draws a scene of its own, which `compileAsync(scene)` never sees. The busker's mat's tip
  pot (`vfx/buskermat.js`) is two-sided and casts: the sun's depth program for a two-sided caster, used by no caster in the warm-up's frame,
  compiled the first time the Weir's mat came into the sun's shadow.
- **Fix:** the pot casts one-sided (`shadowSide: BackSide`, every one-sided caster's program). The coffin and the trail map are Petra's:
  each handed over with its line, tried here first: with all three, 0 late programs and 162 in the Dunes, the Well and the garden (164).
- **Rule:** 171 (new).

### 2026-10-09 · The skiff's glide spread nothing: the oars were asked for by their Blender names (the owner's R8, "it reads faintly")

- **Seen:** Space held in the air on the Solar Skiff: the owner read the oars' spread as faint; rendered in the Dunes from the front,
  side and above, the oars did not move at all while `wings` was 0.96.
- **Cause (measured):** `boat.js` built its stand-in `wingQ` from `['oar_shoulder.L', 'oar_shoulder.R'].filter((n) => P.index[n] != null)`;
  three.js's GLTFLoader names the bones `oar_shoulderL` / `oar_shoulderR` (the dot dropped, as `doorL` already was in SKIFF_ROM), so
  the filter left an empty table and the slerp ran over nothing. Even found, the Ollie's widest frame turned the oars 0.39 rad about
  the beam: up, not out.
- **Fix:** Skiff_Glide (`SKIFF_GLIDE`): the oars by their loaded names, each swung out over its side 1.22 rad from dead aft, a 0.3
  dihedral, its blade rolled flat, a slow flex; the rider's upper body in the suite's Air_Glide (`rider.js`); the oars specced in
  SKIFF_ROM. Judged in the Dunes from the front, side, back and above: the oars stand out as swept wings, `rom.clamped` 0.
- **Rule:** 168 (new).

### 2026-10-09 · Clean sprayed the weather's colour (the Soul Brush's radial, read while giving the paint its looks)

- **Seen:** with the radial's Clean picked, the spray's drops were drawn in a feeling's colour, so the wash looked like paint. Measured on
  the base (2f61385) at the paint range, a 110-tick hold: 73 of its 108 drops and droplets in Wonder's colours (`5ec8e0`, its film tone
  `4faabf`), the other 35 the ink every spray has (`15101c`).
- **Cause (measured):** `tools/soulbrush/load.js` handed the look `feeling: this.aspect`, and `aspect` is the getter that answers with
  the pick only when the pick is a feeling, else the bottle's grade, else the weather (Wonder at the Workshop that hour): `'clean'` never
  reached the look (`load.aspect` read `wonder` with `load.cleaning` true). The arc's droplets took `ASPECT_COLOR[d.aspect]` the same way.
- **Fix:** the look is handed `'clean'` while cleaning and draws clear water (`d8eeee`, glints `f4ffff`: `vfx/brushload.js`), and Clean's
  droplets on the arc are clear (`e8fbff`). The same hold on the branch: 89 clear (`d8eeee`, `f4ffff`, `e8fbff`), 20 ink, none in a
  feeling's colour.
- **Rule:** 167.

### 2026-10-09 · A status with no glyph drew the out chevron, and a mark shown every frame relaid its grid every frame (found reviewing the Figment attack telegraphs)

- **Seen:** reading `vfx/figmenttelegraph.js` and its look: `cellOf(id)` is `Math.max(0, indexOf)`, so a status the glyph set has no picture for (`calm`, `melt`) was drawn as cell 0, `answer.out`, the chevron that says "step out of it": a wrong word, not a missing one. And `show()` reset the slot's drape on every call, so a caller that re-shows a mark each frame (as the handoff allows for `.set`) would have laid the 49 x 49 grid again each frame.
- **Cause:** a lookup that misses fell to the first entry; the reset sat outside the "new to its slot" branch.
- **Fix:** the glyph batch skips an id the atlas lacks (`FigmentTelegraphGlyphs.add`), and the drape is reset only when a mark first takes a slot. Also the casebook's 2026-10-08 brig case said the rail's mark "is now `vfx/closingring.js`": the rename was undone, the line says `vfx/telegraph.js` again.
- **Rule:** 163 (a lookup that misses is a plain look, never another thing's meaning).

### 2026-10-09 · The vane's rose was laid once per meter, not once per model (found reviewing Gall and Fury's looks)

- **Seen:** reading `vfx/vanemeter.js` after the rose grew to seven shaped petals: the meter handed the petals over once (`petalsSet`) and never again, so a Dreamvane model built after the first (a rebuilt tool, the workbench's) kept an empty rose: a needle with no petals, and with shapes carrying the feelings, no feelings.
- **Cause:** the "laid" flag lived on the meter, the rose on the model.
- **Fix:** the meter hands the petals to any model that has none (`model.petals?.length ? null : PETALS`). Rendered standalone, seven petals, seven shapes (cube, hexagon, flame, spark, drip, needle, ring), each told from the others in greyscale.
- **Rule:** 165 (a flag that says a thing was done lives with the thing it was done to).

### 2026-10-09 · The miasma's ground fog floated at the eye's height, and a third of the weather's map of the ground was holes (Calissa's Gall and Fury looks)

- **Seen:** building the miasma's fog lenses on a coarser map of the ground round the eye (`vfx/overhead.js`, 3 m cells), lenses drawn
  in magenta lay in a thin band at the horizon and none on the near sand; from 28 m up they floated under the camera. Probing the map
  beside the Weir: 3 of 7 cells over plain sand read OPEN (nothing under the sky), though `dunes.heightAt` gave -408 there.
- **Cause (measured):** `Overhead` casts each ray straight down through its cell's centre, `(k + 0.5) * cell`. The Dunes' floor is a
  Rapier heightfield; a vertical ray exactly on its grid lines goes through it. The misses were the rows at z = -22.5 and -37.5 (on the
  floor's 7.5 m lines); -31.5 and -43.5 hit. With the rain's 1.75 m cells the centres rarely land on a line, so it showed as the odd
  hole (the rain there judged its ground from the eye, `uCam.y - 2`); with 3 m cells every fifth row did, and the lenses (and the hail's
  stones) stood on the stand-in height: the eye's.
- **Fix:** every ray is cast `NUDGE` (0.0173 m) off its cell's centre; the lenses and the stones are drawn only where the ground is
  known (`step(-9000.0, g0)`), never at a guessed height. After, in the Dunes with the hail and the miasma forced: 0 of 1,024
  cells open in the rain's map and 0 of 1,600 in the lenses' map, and the lenses lie on the sand from the ground and from 28 m up.

### 2026-10-09 · The Figment attack telegraphs' one program had no room under the budget (perf: 163 of 164, the warm-up's stain)

- **Seen:** the Figment attack telegraphs' look (`vfx/figmenttelegraph.js`) needed one shader program; the last baseline stood at 161 to 163 of the 164 the
  gate allows, and a headless boot counted 156 compiled by the warm-up, 162 after twenty frames of the workshop.
- **Cause (measured):** the warm-up still built `new Stain()` (`vfx/stains.js`) and parked it, so the stain's program was compiled at
  boot and kept alive; but spilled crude has been drawn by the paint map in the ground's own shaders since `world/ground/stains.js` was
  folded into it, and nothing in play makes a `Stain` any more (only the workbench's `brush:stains`). The parry mark was warmed on it.
- **Fix:** the stain left the warm-up (`main.js`); the parry mark is warmed on the parked Lachrymato Bottle instead (the same plain-mesh
  shell, so the same program). The Figment attack telegraphs' program took its place: 156 at boot and 162 in the workshop, as before, with a Figment attack
  telegraph and a glyph shown and nothing compiled late.
- **Rule:** 166.

### 2026-10-09 · Every stalactite in the bowl would have hung half through its own root (caught before it was committed)

- **Seen:** reading the bowl's kit grown for the BIG bowl (`vfx/cavekit.js` Stalactite), the cone's line ended
  `g.rotateX(Math.PI); // (sides and rings by its girth and length) g.translate(0, -length / 2, 0); // (hangs from its root ...)`.
- **Cause (measured):** casebook rule 25: everything after the first `//` is comment, so the translate never ran. The 11.25 m spike
  (4.5 m x2.5) spanned y -5.63 to +5.63 about its root instead of -11.25 to 0: its upper half up inside the drape, its tip 5.6 m short.
- **Fix:** the comment moved to the end of the geometry's own line, `g.rotateX(Math.PI); g.translate(0, -length / 2, 0);` on its own.
  Judged in the great cavern from the far floor and from high over the dish: the spikes hang from their roots.
- **Rule:** 25.

### 2026-10-09 · The Great Slip Jelly BIG: its crown a hollow shade seen from the floor, its cracks banded, its shards a toy's spray

- **Seen:** the owner's ruling made the Great Slip Jelly about twelve Couriers tall; `FOE.size` 14 made its body 21 m (27.8 m with the
  crown; it was 3.2 m at x1.6). From the bowl's floor the urn crown was a lampshade: its open broken edge showed the urn's inside and
  the black roof through its mouth, the jelly's egg-shaped top a pin under it. The cracks' Lachryma banded in stripes along every crack,
  the urn's 40-sided shoulder showed its facets, and at the burst its 1.9 m sherds flew at a toy's speed (x14 in the world) and were gone
  before 2 s, high in the air.
- **Cause (measured):** at 3 m no camera ever stood under the crown (the eye at 1.5 m looked at it nearly level); at 27.8 m the floor's
  eye is 19 to 26 m below it. The crack glow's phase was `dot(worldPos, k)`, about a cycle every 0.65 m, drawn for an urn 1 m in radius
  (8.7 m now); the shards' speeds and gravity were in the crown's own units, so the root's scale multiplied both.
- **Fix:** `vfx/urncrown.js`: the urn's flesh (the jelly swollen up into the urn, its rim under the teeth) closes the underside; the
  glow's phase is over the urn's radius in the world (`uUrnR`); the lathe is 120 sides round a Catmull-Rom profile, the broken lip still
  the forty-sided jag `vfx/finish.js` copies; the shards fall by Froude scaling (speeds over √λ, real gravity), left in the world where
  the urn burst, and lie at the body's feet before they fade. `vfx/foelook.js` and the bowl's kit (`cavekit.js`, `bowl.js`): their
  particles grow by the same rule (`froude()`), the pillars and stalactites take sides by their girth, and the far terraces of
  `dunemawkit.js` average out instead of crawling. Judged from the ledge and the floor, front and side, before and after.
- **Rule:** 164.

### 2026-10-09 · A slip jelly's "?" showed through the Great Dunemaw's walls (the owner, QAIS R20)

- **Seen:** the owner saw Figments' mood marks through walls (reported as the temper and the glyphs). Measured on the Great Dunemaw's
  first floor (seed 1, the clock pinned), a jelly given every mark at once (the temper at Prismatic and enraged, the charm aura, an
  "?" held over its head) and seen from a spot with a wall 2 m from the eye and 6.5 m in front of the head: the marks changed 1,328
  pixels of a 280 by 240 box round the head, and all of them were the "?". The temper's and the aura's particles changed none.
- **Cause (measured):** `vfx/glyphs.js` built every glyph's sprites with `depthTest: false` ("draws through water and walls", written
  for the angler's bite), so every pop anywhere (the ?, … and ♪ a jelly's mind pops as it changes its mind, the folk's marks, the
  stun star) drew over the world. The temper and the auras emit into the effects' sprite pools, which were depth-tested already.
- **Fix:** a glyph is depth-tested, and just before each camera draws it (`onBeforeRender`) it is moved toward that camera along its
  own line of sight by its bias (1 m, or 1.5 times its world size, whichever is more; `pop(..., { bias })` for a mark set inside
  something big) and shrunk by as much, so it covers the same pixels at a nearer depth: its own creature never hides it, a wall
  does. The first try moved it in the update along the game camera's ray; rendered from another camera (the test's) the "?" sat
  a metre to the side of its jelly, so the move is per camera. A switch for the owner's later idea (the Dreamvane's survey as a
  psychic sonar ping): `throughWalls` on a pop or on `game.glyphs`, `game.temper` and `game.auras` (true or a creature -> bool),
  which draws them over walls (the effects' x-ray pools, `vfx.js`: the same program, the depth test off). Behind the wall the marks
  now change 0 pixels; in the open 3,471 (3,449 before: the same mark, the same place); from low under the jelly's head the "?" is
  whole over it; with the switch thrown, 1,251 behind the wall. Programs 161/163/163/163, as before.
- **Review (the first fix's own regressions, measured):** it hid two marks that must show. (1) The Crucibelle's Reveal song marks every
  signature in reach (a scan, a mark over a crystal under the sand or a creature behind a wall is its whole use): it now passes
  `throughWalls: true` (`tools/crucibelle/crucibelle.js`, one option). (2) Charybdis's ward, the resist mark of rule 148, is popped
  at the whale's centre, inside its own body: on the rail at 61 m (a bias of 11 m) the ward changed 1,829 pixels with the whale
  risen (the ring's faint outline; the bar and the burst were inside the body) and 3,083 diving (cut by the sea's surface). The rail
  has no wall and its foes are bigger than any bias, so on the rail every mark is seen over the sea as before (`glyphs.js` reads
  `game.emocean.stage.active`): the whole ward, 9,943 and 9,235 pixels.
- **Rule:** 162.

### 2026-10-09 · The Reveal song stopped at the first buried crystal (found reviewing R20's fix)

- **Seen:** `Crystals.reveal` over a veiled crystal in the Dunes (seed 1) threw `TypeError: Cannot read properties of undefined
  (reading 'draw')` from `tex` in `vfx/glyphs.js`: the first crystal rose, any other veiled one in reach stayed buried, the song's
  marks on the signatures were never popped, and the pool had been spent before it.
- **Cause (measured):** `Crystals.reveal` pops a glyph of kind `'bang'`; the sheet has `bang1`, `bang2` and `bang3`. `pop` chose a
  fallback for its own record (`KINDS[kind] || KINDS.bang1`) but drew with the name it was asked, which `tex` looks up with none, so
  a kind the sheet lacks threw. The call dates from the move to `src/` by domain at the latest.
- **Fix:** `pop` resolves a kind the sheet lacks to `bang1` once, before anything is drawn. The same reveal now rises the crystal and
  pops its mark, and the song's marks follow.
- **Rule:** 163.

### 2026-10-09 · The swing's wind-up drew the sleeve behind Strawman's head, and the parry mark with it (the review of T51, v133)
- **Seen:** with the guard's signs put right, the wind-up (the sleeve "drawn back and up") showed from where the striker stands as a grey
  stub half behind the head, its cuff turned away; the outline that marks the sleeve while a parry can answer it (Petra's `swing()`,
  `part: model.arms[1]`) was a thin arc. Before the fix the sleeve had risen toward the striker, the cuff and its outline in plain view.
  A parry (`onParried()` clears `model.sw`) set the sleeve and the lean back to rest in one frame.
- **Cause:** the pose was written to the plan's words (back and up) and judged from the side. Measured in the room: at the wind-up's top
  the cuff was 1.0 m behind its centre and 0.3 m off its line (z -4.41, x 20.32 about 20), a stub 0.2 m wide in front view. The model also
  read its sleeve and lean straight from `sw`, so clearing `sw` from outside was a snap.
- **Fix:** the wind-up holds the sleeve up beside the head and only a little back (`SLEEVES.swing`: up 1.15, back 0.15 radians): its
  length stands clear of the hat and in front view, the mark on it; the cuff 0.6 m behind and 2.2 m up at the top, 0.5 m in front mid-sweep.
  The sleeve and the lean ease to rest (12 a second) when `sw` is cleared from outside. The guard's constants are one table, `SLEEVES`
  (`GUARD` alone is the Courier's held block in the glossary).
- **Rule:** 161.

### 2026-10-09 · The Courier's idle read as if on a stimulant (the owner's R14, v133)
- **Seen:** the Courier standing still swayed at the chest, bobbed the head with each breath and flicked the left hand once every
  loop (the owner: "too much torso sway, and a twitchy left hand on too short a loop").
- **Cause:** the idle was `Loco_IdleMasc`, a braced stance (knees bent, fists out). Measured in the room over 10 real seconds at 60 Hz: chest
  3.6 cm/s mean (tilt 4.8 degrees mean), head 15.8 cm/s and 9.8 cm front to back, the left hand 12 cm/s mean and 49.7 cm/s at its
  flick, on a 2.5 s loop. The suite has seven standing idles; nothing chose between them.
- **Fix:** `IDLES` (`courier/anim/idlebreak.js`): the seven by their look, one named default (`akimbo`, `Loco_IdleRelaxedMasc`, hands on
  the hips), `idles.choose(key)` for a kiln chooser later. Same measure: chest 1.7 cm/s (tilt 3.0 degrees), head 7.9 cm/s and 5.9 cm, the
  left hand 5 cm/s and 10.5 at most, a 3.0 s loop. The idle breaks, the fighting stance, the tools' stances and the walk are unchanged; the
  six idles the code now names moved from `social.bin` to `core.bin` (+268 KB, the pack's total the same). The chest ceremony stood the
  Courier in the old `idle` alias after the hit: it asks `ch.idles.clip` now (CROSSING, `world/treasure/ceremony.js`).
- **Rule:** none new: whatever stands the Courier in the idle asks `ch.idles.clip` (the alias `idle` is the stances' and the authored
  clips' base, as they were tuned), and a default among candidates is picked by measuring each in the game, not by looking at one.

### 2026-10-09 · Strawman's arms still pointed backwards in guard (the owner's T51, v133)
- **Seen:** on guard, Strawman's sleeves folded back behind its head; from in front only the cuffs' rims showed, and the crossbar stood
  out bare on both sides.
- **Cause:** the sleeves' turns had the wrong sign for the way it faces in the room (+z): `rotation.y = -1.25` on the left sleeve swings
  its cuff to -z. Measured in the room: on guard both cuffs 0.68 m behind its centre (z -4.08 for a body at -3.4). The swing was mirrored
  the same way: the wind-up drew the right sleeve forward, the sweep went back.
- **Fix:** a sleeve on side s swings forward by `rotation.y = -s * angle` (`GUARD`: the shoulders 0.16 m forward, the sleeves 129
  degrees round and tipped down, crossing in an X 0.3 m in front of the chest, clear of the head and the sack); the sweep comes
  forward (the wind-up: the case above); each sleeve carries its half of the crossbar. Measured: on guard the cuffs at z -2.86 and -2.90
  (0.5 m in front), crossed (x 20.20 and 19.84 about a centre at 20); the sweep's cuff 0.5 m in front.
- **Rule:** 160.

### 2026-10-09 · The stars jumped, in patches, every eleven minutes (R10 review, Calissa)

- **Seen:** (reviewing the stars behind the cloud) with the cloud layer's drift offset set either side of its wrap, 4.9995 and 0.0005 now,
  0.9995 and 0.0005 before, the star light in the same eighth-by-six cells of the sky changed by 44% on average and by all of it in the
  worst cell (the whole field 11% dimmer); two frames at one offset differed by 0.1%. The first octave was seamless; the haze that dims
  patches of the stars (now the cirrus) read the offset times 0.4, and the cloud's own second octave times 1.6.
- **Cause (measured):** `CloudLayer.update` kept the offset in 0..1 (`%= 1`). A shift of 1 is a whole repeat of the noise only for the
  first octave: 1.6 and 0.4 are not whole, so at the wrap the second octave and the cirrus jumped by 0.6 and 0.4 of a repeat. At the Dunes'
  wind (8) the offset wraps every 11 to 18 real minutes; the cloud's detail octave had always done it (30% of its noise, never looked for), and the new cirrus made it a field of stars dimming and brightening in patches in one frame.
- **Fix:** `vfx/clouds.js` wraps the offset at 5, the first whole number that 1, 1.6 and 0.4 all turn into whole repeats of. After: 1.8% on
  average across the wrap (the cell with the most is a few stars at the threshold), the cloud's second octave seamless too. The same pass
  renamed the cirrus and the night painting's swirls in `vfx/sky.js` and the docs: they had been called "haze" and "veil", which are the
  weather's horizon haze and the storm warp's veil (glossary).
- **Rule:** 159.

### 2026-10-09 · The wire compass vanished on a bright sky, and the Dreamvane's marks never showed outside the workshop (R11, Calissa)

- **Seen (the owner, R11, `/goto 1961.15 -407.91 50.56 4.1`, the Dreamvane worn; headless, the same spot at noon, dusk, night and the
  pall):** at noon the tape was white on a white sky, only the west glyph faintly there; at dusk it went out wherever it crossed the
  bright cloud. With the Dreamvane in the hands, no sigil, web or resonance stood over the tape anywhere in the Dunes.
- **Cause (measured):** the tape and the vane's marks were light added to the frame and nothing else: on a sky the screen shows at 0.85
  lightness (noon, measured 0.874 behind the tape) a pale line can add at most ~0.1 before it clips, and only the pendulum had a dark
  keyline (rule 105). The tape's line contrast, the 99.5th percentile of |luma - its 9-pixel median|, was 0.020 at noon. The vane's
  group is a Group at the origin until first drawn: the zones filed it in the workshop at boot (its box: the sigils round the origin),
  and its update returned at `if (!this.group.visible)`, which the zones' getter answered false, so it was never moved out (rule 149).
- **Fix:** `vfx/wirecompass.js`: one material for the whole device (`compassMaterial`: premultiplied, the colour added and the alpha
  how much of the ground it covers), every line with a keyline a pixel out in the opposite tone (`keyUnder`, one draw), and the ink
  taken from what the tape is drawn against: the dome's colour where it crosses it as drawn now (`sky.toneAt`, from the paintings'
  copies in memory and the grade) under the cloud layer (`clouds.over`), or the room's background under a roof; lightness over 0.6
  turns it to dark ink with a pale keyline, under 0.5 back to pale light with a dark one, eased over ~0.4 s (7 microseconds a read, ten a second).
  The vane (`vfx/vanehud.js`) and the pendulum (`vfx/crucibellehud.js`) draw with it; their groups are `zoneFree` and the vane's update
  keeps its own shown state. Noon line contrast 0.020 -> 0.153; the estimate against the screen: noon 0.854 / 0.874, dusk 0.817 / 0.761,
  the pall 0.807 / 0.780, night 0.242 / 0.141 (the stars not counted). Turning and pitching through a dusk for 15 s: 3 turns of the ink,
  each where the ground changed (the bright horizon to the dark zenith).
- **Rule:** 105, and 158.

### 2026-10-09 · A flat cream panel with a gold emblem lay over the crude beside Anagami's jetty (the emocean sweep's pier shot)

- **Seen:** at the jetty's end, facing the land (the sweep's `pier: closed`), a broad flat beige panel with a gold mandala filled a
  quarter of the view to the right, beside the moored hull's side; hiding the mooring's hull removed it. From out at sea, behind the
  hull, the moored sloop read fine (a small sail by the mast).
- **Cause (measured):** the moored sloop's mainsail. "Furled" was `set({ sail: 0.15 })`, which only scaled the sail's height to 0.22:
  it kept its whole 3.9 m foot along the boom and stood 1.2 m tall, 1.81 to 3.01 m over the crude, the boom swung 0.39 rad toward the
  jetty. The jetty's deck is 1.1 m over the crude, so the walker's camera (2.79 m) stood inside the sheet's height about 4 m from it:
  a vertical sheet seen from within its own height reads as a flat board, and the lotus squashed to an ellipse read as an emblem laid
  on it. From out at sea the sheet was edge-on. The frigate's and galleon's courses were the same squash (boards under each yard), and
  every jib was pushed down into its hull (the squash scales about the waterline).
- **Fix:** `FURL` (0.15) and `furlRoll` in `vfx/sloop.js`: at FURL or under, the sails are hidden and the canvas is drawn stowed: the
  main flaked along the boom's top with four ties, the boom amidships, the jib rolled on its stay from the bowsprit; the ship classes'
  courses each furled on its yard with its gaskets and their jibs rolled (one bundle and one set of ties a rig, shown only moored). The
  mooring sets `sail: 0`. Over FURL nothing changed: the workbench's `ships:classes` at sail 1 renders pixel-identical before and after
  (seven views, no pixel differs). Checked from the jetty and from the side for the five hulls.
- **Rule:** 137.

### 2026-10-08 · A mount hovered at the pier drew nothing: the window that pauses the game also stopped the preview (the review of Calissa's mount preview)

- **Seen:** the builder's report: the preview "is only clearly seen once the page is closed", the veil being the cause, handed to Petra. Read
  for what the person sees: with the pier's page open and a mount row hovered, the mooring's clock stood at 2 and the preview's fade
  (`since`) at 0 after 120 ticks (2 real seconds); the shape was in the buffer (106 marks, `visible`) at the fade's floor, an alpha of
  0.0001; with the page's veil hidden by hand the water showed no line. The pictures that had passed it were taken after `indexMenu.close()` and 70 ticks.
- **Cause:** the Index window is a modal: the loop's modal branch (`main.js`, `if (modalOpen()) { ...; return; }`) returns before
  `mooring.update`, so a preview named under the page was drawn once at `since = 0` (the fade's start) and never brought up; and the
  page, centred under a veil of `.78`, covered the middle of the screen where the hull and its shape lie.
- **Fix:** the modal branch ticks the mooring on the real clock beside the seam (`main.js`, one call); `showPage` takes `{ aside }`, a
  page in a column to one side with no veil, and the pier's is set to the side away from the hull (`mooring.side()`). Checked with the
  page up: the Vacuum's cone, the Snapshot's frame and the Grapple's line on the Courier's own camera at 1280 by 720, hovering rows.
- **Rule:** 135.

### 2026-10-08 · F with the pointer on a mount's row left that mount previewed after the page shut (the review of Calissa's mount preview)

- **Seen:** the pier's page opened, Absorb Spray hovered, F pressed with the pointer where it was: the page shut and Absorb Spray, ashore,
  stayed drawn on the hull ("the mount last taken aboard stays", the report says).
- **Cause:** the preview was set back by the row's `mouseleave`, and a page shut (the root's `display` gone) sends none.
- **Fix:** the mooring sees the page open then shut and puts the preview back to `pier.chosen.at(-1)` itself (`mooring.update`); the open
  flag is dropped when the hull is away. Checked: F, Esc and the CLOSE button, with the pointer on an ashore row, each leave the mount aboard
  (or nothing, when none is aboard).
- **Rule:** 136.

### 2026-10-08 · The choice card could not be reached by keyboard, a pick scrolled the page to the top, and a keyword's tip outlived its window (the review of Calissa's choice card)
- **Seen:** the pier's page opened headless: Tab, ArrowDown, ArrowRight and Enter each left the focus on the body, nothing moved and
  nothing was chosen (the builder's check had called `.focus()` on a card first, then pressed arrows). Any pick, mouse or key, drew the page
  again with its scroll at 0 (259 to 0 at 854 x 480: the mounts off the screen at 480 lines). With a card focused by key and the pointer parked
  on another, both cards opened their detail over one another. A click on an empty slot called `take(undefined)`. Hovering the Snapshot's
  "weak points" and pressing F shut the page and left the WEAK POINT tip over the world (`#kwtip.on` true, read in the frame).
- **Cause:** `core/input.js` spends Tab for the game; the card list's arrows moved only between cards when one already had focus; `render`
  in `feedback/indexmenu.js` empties the window's root, so a redraw is a new `.im` (scroll 0) with nothing in focus; the keyword's tip hid
  on its keyword's `pointerleave` and `blur` and a keyword hidden with its window, or removed, gets neither.
- **Fix:** `installChoiceCards` listens once: with nothing in focus the first arrow puts focus on the first card of the list on the screen
  (the last going up or left); the list's keys stop at an edge; a keyboard pick on a card or a slot is kept (`keepFocus`, 0.6 real seconds)
  and the list drawn next gives that card (or the first left) its focus back; a keyboard-led list (`.ccards.kbd`) opens no detail for a
  parked pointer, and a moving pointer takes it back; an empty slot is not a button. `Pier.open` keeps the scroll of a pier page it draws
  again (`world/emocean/pier.js`, the one crossing). The tip follows its keyword each frame and hides when the keyword has no boxes or is
  gone (`ui/keywords.js`). Measured after, at 854 x 480: ArrowDown from nothing focuses Grapple; Enter and Space pick and keep focus and
  scroll (275); a mouse pick keeps scroll 259; F with a card focused closes; F with a keyword hovered leaves no tip.
- **Rule:** 132, 133.

### 2026-10-08 · The mounts' hover detail told lengths in bars, and the charges chip read as an ellipsis (the review of Calissa's choice card)
- **Seen:** hovering the Snapshot card: "holds a weak point open two bars"; the Radar's "marked a bar ahead" (CLARITY.md section 7: one
  clock, real seconds); and the charges chip at 1x, three dots two pixels high, looked like "...".
- **Cause:** `ui/mountcards.js` turned the table's `cooldown` from bars to seconds and passed `detail` as it stood; the chip's pips were
  drawn two rows tall.
- **Fix:** `inSeconds` tells "N bars" in the detail as seconds (BAR_S: "3 s", "1.5 s ahead"), the table untouched; the chip's pips are six rows
  tall. The Blaster's detail still names Rez and a sixteenth note, in Dovina's prose, for her to settle.
- **Rule:** 134.

### 2026-10-08 · A docs list still named LOOK after LOOK was merged into ART (the review of the docs merges)
- **Seen:** `docs/ARCHITECTURE.md`'s layout block listed the bibles as "GLOSSARY, ARCHITECTURE, DESIGN, LORE, LOOK, VFX, ..." on the
  branch that deleted `docs/LOOK.md`, whose report said a grep for `LOOK.md`, `OVERLAY-LOOK` and `SUNSHINE.md` found nothing but
  provenance notes. ART was not in that list at all.
- **Cause:** the builder's sweep looked for the three file names. The list wrote the bare word, with no `.md`, so no pattern of the
  sweep could match it. Found by grepping `\bLOOK\b` over every tracked markdown file.
- **Fix:** the list names ART in LOOK's place (`docs/ARCHITECTURE.md`, one word; Petra's file, a one-word crossing). Every other bare
  mention left is a code constant or the provenance note "this was LOOK.md".
- **Rule:** 131.

### 2026-10-08 · Charybdis turned against its own whirlpool, and the whirlpool against the ship half the time (the review of Calissa's Charybdis)
- **Seen:** reading the review's numbers, not the pictures: in `crossing:charybdis` the beast's eye 0 and its sheath's ridges, as the
  world's `atan2(z, x)` has them, fell (0.156 to 0.106, and -0.424 to -0.664 radians in 1.5 real seconds) while the whirlpool's bands
  (`phi`, 0.141 to 0.236) rose: the sheath that is meant to be the crude whirling round its neck turned against the crude beside it. In
  a real maelstrom crossing the ship's own lap went the way the beast did on one arena sign (+1) and against the whirlpool, and the
  other way on the other sign (-1): half the crossings sail against the current.
- **Cause (measured on both signs, seeds 9 and 1):** the look wrote `body.rotation.y = turn` as if a positive turn were the whirl's, and
  the whirlpool's pattern angle is `atan2(z, x)` (rising with `phi`); three.js's rotation about y lowers that angle, so the two had
  opposite senses. And the whirlpool had one sense, the arena's `sign` (+1 or -1, `rng() < 0.5`, railpath.js) two: the ship laps toward a
  falling angle at +1 and a rising one at -1.
- **Fix:** one `sense` (+1 or -1) for the look and the whirlpool (`CharybdisLook.set`, `Whirlpool.set`; the spiral arms' handedness
  with it, `uWhirlT.w`), written by the crossing's look from the arena (`sense = -sign`, vfx/crossinglook.js), the body and the sheath
  turned by `-turn` so what is written is the angle the world reads. Measured on both signs after: the ship, the eye, the sheath and
  the bands all fall at +1 and all rise at -1. Also: `CharybdisLook.reset` forgets where the lip last was (`yWas`), so a beast shown
  again at a new arena is not seen to cross the surface from where the last crossing left it (a crown thrown at the first frame). And the
  throat's disc has a floor (a quarter of its colour) that stayed when the part was broken, so a broken throat still read as lit
  (cyan, seen from above after four real seconds); the floor now eases out with the part (0.02), and the header's "out broken" is true.
- **Rule:** 129.

### 2026-10-08 · Charybdis held fifteen metres under the crude, and the whirlpool's seam open to the sky (Calissa's Charybdis)
- **Seen:** building Charybdis's look on Petra's director (world/emocean/charybdis.js): the foe it holds at the arena's centre measured
  15.1 m under the crude's level all through the arena's laps (a 24-bar peak, 3 laps), so "risen 7 m" stood 8.6 m under the sea and
  "dived 6 m" 20.8 m under, and 3.5 to 4.0 m off the point the laps circle (the heartline turns about it at 44.4 to 44.9 m). Drawn where
  it is held, its maw would sit inside the crude, off the whirlpool's middle. Separately, the whirlpool's first disc showed a dotted line
  of the sky's dome round its rim from above (`crossing:charybdis`, the 'above' camera).
- **Cause (measured on the rail's own path, RailPath.lay and at over a 24-bar arena):** `arenaCentre` gives the centre in the frame at the arena's middle,
  `(-sign * radius, 0, 0)`, and `foe.local.y` its height up the frame; through the arena the frame is banked 0.35 rad inward, so its
  across points down into the sea (radius x sin 0.35 = 15.1 m) and its up leans, and the rail point is the heartline less the tilted up.
  The seam: the disc's rim is 128 chords inside its circle (1 cm in at the middle of each), the sea round it was cut on the circle, and
  the sliver between showed what is under the world.
- **Fix:** the whirlpool's heart is found from the heartline and the heading only (`whirlHeart`, vfx/whirlpool.js: the heartline's point
  at the arena's middle, the arena's radius across the unbanked heading, at the sea's level); the director holds the foe at the heart
  plus its height in the world, carried into the frame by `rail.toLocal` (the smallest edit, world/emocean/charybdis.js `take`).
  Petra's test still passes all nine; the ship now circles at 44.4 to 44.9 m from it. The disc runs 3 m on past its rim under the sea
  round it, drawn with a polygon offset (no program: a state), and only the sea round it is cut: no sliver from any camera.
- **Rule:** 127, 128.

### 2026-10-08 · Five shader programs over main's at boot, two of them one shadow (perf over the program budget, Calissa's program diet, round two)
- **Seen:** `npm run perf` on Calissa's branch (8ce7551) read 165 programs in every scene against the budget of 164 (main: 160), and the heap
  367 MB against 365. The boot's programs listed by name and cache key against main's: `leaf-canopy`, `mind-geometry`, `rail-mark`,
  `umbral-caustics` new, and two basic-map programs with `|storm1` on their key (1027 and 5123: the front and back passes of one
  transparent both-sided material), less one basic program main had and the branch no longer draws: +5.
- **Cause (measured, the materials found by their constructor's stack):** the two storm programs were Old Nobody's shadow
  (vfx/leviathan.js): world/emocean/stage.js put it through the storm's `warpMaterial`, which wraps its `onBeforeCompile` and adds
  `|storm1` to the key, so the game's shared basic-map program was compiled again for it, once a pass. It was seated with Old Nobody's
  body too (`warpObject` on its group), so it was moved twice. The other four are new looks, each already one program for its family
  (`mind-geometry`'s header is true: the rings, lattices and monoliths share it; the shoal's silhouette eye did not yet, see below).
- **Fix:** the shadow is seated with the body and no longer wrapped (stage.js): it draws with the game's basic-map program again, as its
  wake does (the workbench's storm stage already drew it so). Seen against the old way in the storm stage at full strength
  (`warpObject` and the old wrap side by side): the soft patch sits where Old Nobody is drawn rather than where the swell is bent, a
  shift in a blur with no edge. Four flat looks with the veins' vertex shader and settings, the spirit veins and Myggdrasil's threads,
  the sculpt brush's ring, the incense thread and the data drain's beam, are one program (`vfx/ribbonlight.js`, the look a uniform; each
  look's code kept): rendered old and new on one plane each, every pixel the same. Boot 163 to 158; perf 158 / 160 / 160 / 160, programs
  after the warm-up 2 (was 2). The shoal's silhouette eye (kept true under the storm) now goes through `deepMaterial` as the ambient
  geometry's header says, so it shares the warped geometry's program when the rail builds it (vfx/crossinglook.js).
- **Not fixed: the heap.** A heap snapshot of the boot against main's: +8 MB, of which +2.7 MB the new modules' source and +2.3 MB their
  inline source maps (the dev server's), +1.6 MB typed arrays (0.6 MB the rail's mark buffers, 0.3 MB Rapier's memory, the rest the new
  geometry). The built game (vite preview, two gc'd boots): main 230.2 MB, the branch's head 233.4, this branch 233.4. No look holds a
  freeable buffer of that size; the gap is the code (rule 71).
- **Rule:** 124.

### 2026-10-08 · The shot field's marks ran their clock at a fixed 60 a second (review of art-crossing-wire)

- **Seen:** not in play: read. `ShotField.draw()` handed the look `dt = 1 / 60` whatever the frame, and `clear()` drew once more and
  ran the look's clock a frame on.
- **Cause:** the draw was written when it was a placeholder with no clock; moving it to `RailShots` (whose shader's time is stepped by
  the step it is given) kept the constant.
- **Fix:** `draw(dt)` takes the frame's step from `update(dt)`; a redraw after a clear passes none. Checked by the Emocean sweep's crossing
  part and `scripts/triptest.mjs`.
- **Rule:** 121.


### 2026-10-08 · The ambient geometry's rings were never drawn in the crossing: their program failed to compile under the storm (found wiring the looks into play)

- **Seen:** the turn rings were laid (five live handles, an instanced count of five, 31 m ahead of the camera) and nothing showed. The
  console: `mind-geometry: Vertex shader is not compiled ... 'vDeepW' : undeclared identifier`, `'stormClip' : no matching overloaded
  function`, and `useProgram: program not valid` each frame.
- **Cause:** the storm warp's opt-in (`vfx/stormwarp.js` `storm()`) put its declarations after `#include <common>` and its bend after
  `#include <project_vertex>`. The Mind's geometry (`vfx/railgeometry.js`) is a ShaderMaterial that ends in `<project_vertex>` (so a warp
  written for three's materials bends it) but never includes `<common>`: the bend went in, its declarations did not. The workbench's
  stages never warped it, so it had never been compiled warped until the crossing did.
- **Fix:** when the vertex shader has no `<common>`, the storm's head (its uniforms, `stormClip`, `vDeepW`) is put at the top.
- **Rule:** 120.

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
- **Rule:** see rule 122.

### 2026-10-08 · The encounters' sets sank 420 m under the crude, the Cantor stood upright and a mooring at Margarite's dock went down with them (found in review, sailing them)
- **Seen:** sailing a passage with the Last Word and a Raft Adrift forced in: the film's second camera shot hung in a flat navy void, the
  raft's Hap Lagan lit as a silhouette in it, and Letty's cutter was nowhere in the first shot (only a far speck of the ship). On the
  workbench the same tableaux sat on the water. Reading the code: the Cantor's body never tilted and its light patch never faded.
- **Cause:** three. `film.js` handed a tableau `bob = sea.heightAt(x, z)`, which is the world's height (the Emocean's sea lies at y -420),
  while the tableau's group sits at the holder's y (also about -420) and adds `bob` to it: -840, 420 m under the surface (the workbench's sea
  is at y 0, where the two agree). The mooring did the same at Margarite's dock (`crude.heightAt` then `* 0.7`): a hull 294 m down. And two
  lines of the Cantor's tick had code after a `//` comment (rule 25): its roll and the patch's fade were comments.
- **Fix:** `bob` is `heightAt(...) - holder.y` (film) and `heightAt(...) - crude.y` (mooring); the two Cantor lines are code, the comment
  at the end of the line.
- **Rule:** 123 (and 25).

### 2026-10-08 · The fairy rings were black hoops on the garden's pale ground (found in review, placing the strains in the real garden)
- **Seen:** on the workbench's dark stage the sward round a spore bed (0x18241a to 0x2c3c2a) read as dark moss. Stood by hand on the
  Dantian (ground about (225, 230, 180) in the garden's daylight) every bed's ring was the heaviest mark on screen, a near-black hoop on
  a pastel planetoid, not a darker, lusher ground. Standing a bed on the direction from the planetoid's centre rather than the ground's
  normal buried the far half of its ring under the clay (the Dantian is not a sphere: `radiusAt` carries noise and the clay).
- **Cause:** the colours were chosen against the workbench's floor and light, and the bed was placed in the garden only in the head.
- **Fix:** the sward is moss (0x536a52 to 0x72896a) with a straw dead edge (0x8e7e56 to 0xa8986a): darker than the ground and not black,
  in the garden and on the workbench. The handoff to Petra says to stand a bed on the ground's own normal (three samples of
  `radiusAt`), measured to lay the whole ring on the Dantian.
- **Rule:** 118 (a look made on the workbench is judged once on the ground it will stand on; and 64, the normal).

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
- **Rule:** 119.

### 2026-10-08 · A rutter's page made from its passage alone gave every waypoint two pips of strength nobody had recorded (found in review, reading what the item keeps)
- **Seen:** \`chartOfRutter(r)\`, the page's chart when the item carries no \`chart\` (the item \`voyage.js\` makes keeps \`from, to, route, day, passage,
  legs, rank, read, minutes, worth\`), set every sailed waypoint to strength 1, and the page drew a sailed waypoint's strength as two pips.
- **Cause:** a default written as if it were data.
- **Fix:** the strength is \`r.strengths?.[i] ?? null\` and a waypoint with none draws no pips; the handoff asks for \`strengths\`, \`feels\` and
  \`stormsAt\` in the item.
- **Rule:** 114.

### 2026-10-08 · The sea chart's lanes stopped short of a waypoint by its true class, telling a haven from a threat among a portent's candidates (found in review, a differential draw)
- **Seen:** one waypoint at a time, its type scrambled to another class, its strength and (at a dim star) its feeling changed, over 1,187 of
  Dovina's real portents (three routes, ten game days, three sights): no icon moved, but the lanes into a waypoint whose two or three
  candidates span classes (306 of them: 103 twos and 203 threes) ended 1 to 3 art pixels nearer or farther: a lane stops 10 from a haven's
  centre, 12 from a threat's, 13 from a boss's.
- **Cause:** `gapOf(chart, id)` read the waypoint's true type for every tier but the dim star.
- **Fix:** `gapOf(chart, id, portent, classOf)` goes by what the portent shows: a dim star's gap, a class tier's `cls`, the widest of the
  candidates' classes at two and three, the true class only where it is exact. The same scramble now moves no pixel in any tier (0 of
  1,187, and 0 of 691 in `scripts/seachartlooktest.mjs`).
- **Rule:** 114.

### 2026-10-08 · The sea chart kept every ground it had drawn, 1.3 MB of canvas for each game day's sea (found in review)
- **Seen:** drawing 80 route-days in two looks at 2x, then a garbage collection: the canvases still alive went from 54 to 108 megapixels
  (216 MB of pixels), about 1.34 MB a ground drawn; nothing showed in the JS heap.
- **Cause:** `scaled()` and `blurred()` kept their copies in the one `CACHE` map keyed by the source canvas, emptied only past 900 entries;
  the ground cache was cleared past 24, but each ground's scaled copy stayed in `CACHE` under it.
- **Fix:** the copies live in `WeakMap`s keyed by the source canvas (`SCALES`, `BLURS`), so a ground that is dropped takes its copies with it.
  Over the same run: 4.48 to 4.54 megapixels.
- **Rule:** 115.

### 2026-10-08 · The workbench never called a stage's dispose, so the sea chart stage kept 32 geometries and 11 textures a time it was shown (found in review)
- **Seen:** `crossing:chart` shown and left four times: `renderer.info.memory` went from 1576 geometries and 156 textures to 1707 and 204, and
  stayed there on leaving each.
- **Cause:** `Workbench.clearHolder()` took the model out of the scene and nothing more; the stage's `userData.dispose` was read by no one
  (no other stage sets one). And the stage's own dispose left its boards' planes, frames and materials, and the materials a view mode puts
  aside (`userData.mat0`).
- **Fix:** `clearHolder` calls `userData.dispose` on what it drops; the stage frees both rutters, the boards' textures and every mesh it made.
  Four loads: 1611 geometries and 171 textures while shown, 1579 and 160 after leaving, the same each time.
- **Rule:** 116.

### 2026-10-08 · The sea chart's drawing took the name of the pier's window for its class (found in review)
- **Seen:** `ui/seachart/seachart.js` exported `class SeaChart`, as did `world/emocean/seachart.js` (Petra's window, the glossary's `SeaChart`); the
  handoff told the pier to `import { SeaChart }` into the module that declares one.
- **Cause:** the branch was cut before the window's glossary entry was merged, so nothing in it showed the name was taken.
- **Fix:** `SeaChartCanvas`, in the module, the glossary and the handoff.
- **Rule:** 117.

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
- **Rule:** 113.

### 2026-10-08 · The silhouette's eye, which is shot at, was handed to the storm to bend (Calissa, reviewing the swarm)
- **Seen (read, then run in the workbench with a recording hook):** `warpWith(fn)` gave `fn` every material the Mind's geometry made, and
  the silhouette's eye (the lens a player locks on, its ring, its shards) is made of them. The storm's droop alone at 50 m ahead and full
  strength (`STORM.bend` 0.1) is 2.7 m, nearly the eye's own radius (3 m): drawn off the outline of glints it sits in and off where a
  shot lands, the one thing the order says the storm never does.
- **Cause:** one `track()` for the whole family; nothing named what is not let in.
- **Fix:** `mindGeoMaterial(kind, { warped: false })` for the eye's three (`vfx/shoalsilhouette.js`); `warpWith(fn, { keepTrue })` hands
  those to `keepTrue` instead (the storm's `keepTrue` and `deepMaterial`: the veil leaves it, and no new program). Recording hook: 3 eye
  materials made, 0 given to the warp, 3 to `keepTrue`.
- **Rule:** 110.

### 2026-10-08 · The stone's colour on the school and the eye would have cycled a few times a second (Calissa, reviewing the swarm)
- **Seen (read, then computed from the rail's own numbers):** the glints' and the geometry's colour (`labPhase`) took the fragment's world
  position. The rail carries the school through the world at 26 m/s along +z, and the phase moves 0.057 a metre along it: 1.5 a second,
  three of the stone's bands a second across a glint's back, and about three turns of its whole palette a second on the eye's iris, the
  one thing the player hunts. The workbench stages never showed it: nothing there moves through the world.
- **Cause:** the Mind's family anchors to the world (right for the things that stand: the Dunemaw, the cave).
- **Fix:** the glints take it from their own local position and a per-fish offset (`vfx/shoal.js`, `vL`); the geometry from its local
  position at its instance's size and its seed (`vfx/railgeometry.js`, `vP`).
- **Rule:** 111.

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
- **Rule:** 112.

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
- **Rule:** 108. (A check for the Emocean sweep is handed to Dovina: the shoal look's and the wake's world matrices at the origin's
  height while a set piece runs.)

### 2026-10-08 · The far glints' sparks and the frenzy's streaks were never drawn (found headless, before it shipped)
- **Seen:** a striking glint stretched but left no streak behind it; past the fish's distance the school thinned to nothing.
- **Cause:** the spark's quad was laid on the screen along the heading and across it, the across axis turned counter-clockwise: a
  mirrored basis, so the quad's triangles faced away and the one-sided material culled them.
- **Fix:** the across axis turned clockwise (`vfx/shoal.js`, the spark's `ac`); the streaks and the far sparks are drawn
  (`wb_shoal_dash`).
- **Rule:** 109.

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
- **Rule:** 106, and the law "no flash, ever" (a large bright shape that comes and goes in a few frames is one).

### 2026-10-08 · The brig's last telegraph closed on nothing, and a port downed under its ring kept the ring (found in review of the shots' look)
- **Seen (headless, the pirates' broadside, the marks counted bar by bar):** rings stood at bars 9, 11, 13 ... 21 of the set piece and
  the volleys fired at 10, 12 ... 20: the ring at bar 21 closed at 22 on a volley that does not come (`rel < 22`). A port shot down
  while its ring was closing (the counterplay: its lid is open, so it can be hit) left the ring closing on the stump.
- **Cause:** the call site asked "is this the bar before a volley" and not "will it fire", and a mark had no way to ask whether its
  part was still there.
- **Fix:** the call asks `rel < 21` (the next bar must fire) and hands the mark `alive: () => p.alive && !this.ended`
  (`vfx/telegraph.js`; `world/emocean/pirates.js`).
- **Rule:** 107.

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
- **Rule:** 105, and 25 (read the whole line after any edit that adds a comment to it).

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
- **Rule:** 103, 104.

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

### 2026-10-07 · The Spirit Garden sweep (the owner's four and ten besides; Dovina's GARDEN-SWEEP.md, measured by scripts/sweeps/garden.mjs)
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
- **Rule:** 97.

### 2026-10-08 · A vertical loop showed one frame upside down at each quarter (found by scripts/railpathtest.mjs)
- **Seen:** the camera's up against the rail's up read -0.999 for one frame of each turn; every other frame 0.999.
- **Cause:** the cinema hands the player's camera its shot before the stage sets it: the shot's place and look are Vector3s read by
  reference (this frame's), its roll a number copied (last frame's). As the look passes the vertical, a look-at with the world's up
  flips its basis by half a turn, and the roll that undoes it arrived a frame late.
- **Fix:** the stage writes the roll into `player.camShot` as it sets the shot (stage.js `camera`). Measured after: 0.999 at every
  frame of every figure.
- **Rule:** 99.

### 2026-10-08 · The corkscrew took the ship under the sea at its middle (found in a screenshot, before it shipped)
- **Seen:** at the corkscrew's middle the screenshot showed only sky: the camera and the ship were under the crude, its surface
  culled from below.
- **Cause:** the frame rolled about the rail point, which lies at the sea's level; the ship rides 3 m up the frame (CRUISE), so
  upside down it was 3 m under the surface.
- **Fix:** each figure turns about the heartline, CRUISE up the frame (railpath.js `heart`). Measured after: the ship 3 m above the
  sea through every figure (scripts/railpathtest.mjs).
- **Rule:** 98.

### 2026-10-08 · A Great Dunemaw ostracon left lying stayed in the world after its floor was gone (Calissa, reading while testing)
- **Seen:** not in play: read. A sherd dropped from a forgotten pot and left lying stayed in `loose` after the Courier left the floor;
  its word was never dropped again (`drop` refuses a word that is loose) and it could be taken by standing where the floor had been.
- **Cause:** nothing took the floor's loose sherds away when the floor was.
- **Fix:** `Ostraca.forget('dunemaw')` on `well.floor` and `well.leave`. Checked by scripts/ostracatest.mjs and the Dunemaw sweep.
- **Rule:** 100.

### 2026-10-08 · A pull near a planetoid's pole creased the ground (Calissa's garden survey)
- **Seen:** within 0.49 m of a pole, a pull with the god hand left a crease.
- **Cause:** `Clay.heightAt` clamps the last row at 88.59 degrees, so near the pole the height is read along one longitude.
- **Fix:** within half a row of a pole the height blends to the last row's mean, all of it at the pole. Checked by the garden sweep.
- **Rule:** 101.

### 2026-10-08 · The log lost the Great Slip Jelly's second cast when two came close together (found by the Dunemaw sweep)
- **Seen:** "accept 4: the log names every cast as it begins" failed: Broodwake was cast, the log said only "readies Blowout".
- **Cause:** `log.say` folded a line into the one before it whenever the key matched within 1.6 real seconds, keeping the first's text;
  both casts' lines share the key `cast`. Headless, the sweep's ticks run faster than the wall clock, so 4 game seconds apart was
  inside the window; in play, any two casts within 1.6 real seconds would have lost the second's name.
- **Fix:** a line folds only into an identical one (or one with a counter format, `fmt`). Checked by the Dunemaw sweep.
- **Rule:** 102.

### 2026-10-08 · Esc closing the Index sometimes opened the pause menu too (the basement sweep, 1 run in 2)
- **Seen:** "Index: Esc does not also open the pause menu" failed once and passed on the re-run.
- **Cause:** read, not measured frame by frame: the pause is opened by the pointer's unlock (`onLockChange(false)`), not by the key;
  an unlock landing after the Index had closed found no window open and read as the player leaving. Its timing is the browser's, so
  the failure came and went.
- **Fix:** an Esc pressed while any window is open is marked (`input.escSpentAt`, a capture listener in main.js, before the window's
  own handler closes it); an unlock within 0.5 real seconds of it is not a pause. The Index's list also stops the Esc's propagation,
  as its pages did (GARDEN-SWEEP #9). The workshop sweep then showed the same with the map: one fix for every window.
- **Rule:** 125.

### 2026-10-08 · The adrift test passed, then failed an hour later (the v123 gate)
- **Seen:** "the current took another way" passed at 15:00 and failed at 18:00 with the same seed: the drafted lane was different.
- **Cause:** the sea chart is a pure function of the route and the game day (a real hour); the seed fixed the current's draw but not
  the sea it drew on.
- **Fix:** the adrift and Charybdis tests open the game with the clock pinned (`&clock=1791160275000`, perf's), the seed re-found
  for it. Both pass.
- **Rule:** 126.

### 2026-10-08 · Charybdis could not be shot (v123 and v124; found adding the expert Dovina asked for)
- **Seen:** a scripted expert holding the gun with the cursor on Charybdis did no damage; it was driven off at 150 of 150 hp.
- **Cause:** the arena's centre is exactly abeam of the ship (local x -45, z 0), and the peak's view was the free view, looking
  ahead: Charybdis was at screen x -3.4, off the screen, and the cursor's far plane was fixed on z. charybdistest.mjs checked its
  place, its rising and diving, and never fired a shot.
- **Fix:** the arena circles with its centre always on -x; the peak is held in the side view, which looks across the ship at it;
  the ship's aim is abeam there with the cursor free, its far plane taken along the gun's own way. Measured after: the expert fells
  it at bar 3.8 of 24.
- **Rule:** 130.

### 2026-10-08 · The Brief went blank for seventeen builds (v110 to v126; found by the owner)
- **Seen:** QAIS's Brief tab showed a "Petra" heading and nothing under it from v110 on; the owner could not tell what had landed.
- **Cause:** the Brief draws each document's `lines` and `waiting` (`ui/qais.js` `brief`); from v110 the publish wrote a `body` and a
  `title` instead. The store took them; nothing read them back through the page.
- **Fix:** the seventeen documents rewritten with `lines`, `waiting` and `at` (their `body` kept). Every Brief from here is written in
  the renderer's fields.
- **Rule:** 138.

### 2026-10-09 · Esc during a talk opened the pause menu, the talk still up (the owner's T136, v131)
- **Seen:** Esc mid-talk opened the pause menu; the talk stayed open. F ended it.
- **Cause:** a talk kept the pointer lock; while locked the browser takes Esc to release the lock and the page never sees the key. The
  release came through as you leaving: the pause menu.
- **Fix:** a talk frees the mouse when it opens (the game's own release, no pause) and takes the lock back when it ends (`main.js`
  `dialogue.onOpen`/`onClose`), as the kiln's window does; Esc then reaches the talk and ends it.
- **Rule:** 139.

### 2026-10-09 · The Throwing Room's north wall showed the room through it (the owner's R2, v131)
- **Seen:** from inside, the north wall was dark and see-through: the far outlines and the sky showed.
- **Cause:** the room's zone ended at the floor's edge (z -5.6, x 30.6) and its north, east and south wall boxes are centred 25 cm
  past it, so they were filed under the Workshop and hidden whenever the camera in the room could not see the door. The Workshop's own
  east wall, the room's west wall, was hidden the same way.
- **Fix:** the zone reaches past the walls (x 31.2, z -6.2 to 11.2); the west wall gets a 4 cm lining of the room's own, the door
  left open. Measured: a ray at the marked pixel now meets the wall at 5.8 m (it met nothing before).
- **Rule:** 140.

### 2026-10-09 · The Dunes' tally board hung 10 m off its stone (the owner's R1, v131)
- **Seen:** "The Tally" board stood in the air in front of a bare tan stone.
- **Cause:** the stone is placed from `TALLY_AT` (moved to z +41 with the pond in R46); the board kept its own copy of the old number
  (z +31).
- **Fix:** the board is placed from `TALLY_AT`, 3 cm proud of the stone's water face.
- **Rule:** 141.

### 2026-10-09 · A band flickered at the Workshop's eaves over the Throwing Room's door (the owner's R3, v131)
- **Seen:** a striped band along the top of the Workshop's east wall, under the roof.
- **Cause:** the Throwing Room's roof slab overhung 0.5 m west; its end face lay in the Workshop wall's inner face (x 10) from y 6 to
  6.5. A ray there met both at 7.02 m.
- **Fix:** the slab stops at the room's side of the wall (x 10.5). The ray now meets the wall alone.
- **Rule:** 142.

### 2026-10-09 · Strawman on guard did not block (the owner's T51, v131)
- **Seen:** blows from in front did full damage in guard mode (bouts of 13, 3 and 22 blows, every one counted).
- **Cause:** "in front" was read from the blow's `dir` as travelling -z; the tools pass `dir` by their own conventions (the shot's way,
  the swing's, the striker-to-target or the reverse), so the test failed for them.
- **Fix:** in front is where the striker stands (`from`, else the Courier), within 60 degrees of its facing. Measured headless: on
  guard, a blow from in front is blocked with either `dir`; from behind it lands. The arms' pose is Calissa's (handed on).
- **Rule:** 143.

### 2026-10-09 · A 300 ms hitch at the same lines every time (the owner's R5, the calibration room, v132)
- **Seen:** a hitch of the same length on crossing a line in the basement's calibration room; the F4 report logged "+7 geometries;
  +1 textures" at each 316 to 362 ms spike (Firefox, GTX 980).
- **Cause:** Calissa's waiting sibling (`coop/meeting.js`) was made when the Courier came within 30 m of the kiln, 20 m up or down,
  and disposed past it: the 30 m line ran through the calibration room one floor down, and every crossing built a whole skinned Courier
  (7 geometries, a texture) and uploaded it. Measured headless: six crossings, a rig built and dropped at each.
- **Fix:** the sibling is made on its own floor only (4 m), hidden and kept when you walk off, let go past 150 m. Six crossings now
  build nothing.
- **Rule:** 144.

### 2026-10-09 · A smaller hitch about once a real second (R4 and R5's diagnostics, v132)
- **Seen:** 35 to 64 ms frames about once a second on the owner's Firefox, mostly `sim` (18 to 43 ms).
- **Cause:** two whole-scene scans on one frame once a second: the shading pass (`present.update`, 2 to 3.3 ms headless over 4,961
  objects) and the light budget's scan (1.5 ms); and the zone pass four times a second worked out every top-level object's place,
  holder groups by the box of all they hold (up to 3 ms).
- **Fix:** the shading pass walks 600 objects a frame; the light scan runs half a second out of step; a still mesh keeps its zone and a
  holder group's is worked out again every two seconds or when the picture changes. Headless after: the shading pass 0.2 to 0.6 ms a
  frame.
- **Rule:** 145.

### 2026-10-09 · Talking to Pip sometimes brought up the pause menu (the owner's T10, v132)
- **Seen:** the pause menu over an open talk, now and then.
- **Cause:** the talk frees the mouse (v132, T136) and asks for it back when it ends; a refused request is retried and then reported as
  the lock lost, which opened the pause menu whatever was up, a talk begun since included.
- **Fix:** a lock lost while a talk is open is not a pause; a talk that closes asks for the lock whenever it is not held.
- **Rule:** 146.

### 2026-10-09 · The Courier stalled at a 0.25 m step (the owner's R6, v132)
- **Seen:** walking into a 0.25 m ledge in the basement, the Courier stopped and shivered 2 cm back and forth; 0.4 and 0.5 m walls
  mantled.
- **Cause:** Rapier's autostep (0.4 m) did not take it, and the game's step-over starts at 0.38 m and felt for a wall at 0.35 m, over
  the lip.
- **Fix:** pinned (pushing on at under 0.4 of the walk's speed for an eighth of a second), the step-over takes a lip from 0.08 m,
  felt for just over it. Measured: the Courier steps up and walks on at speed; free movement unchanged.
- **Rule:** 147.

### 2026-10-09 · Strawman's guard still read as not blocking (the owner's T51, v132)
- **Seen:** on v132 the owner saw no block.
- **Cause:** a blocked blow played the same flinch as a landed one, and the log's line said only "0 damage".
- **Fix:** a blocked blow shows the resist mark where it struck and the guard's clank, the sack barely stirs, and the bout's line says
  how many were blocked.
- **Rule:** 148.

### 2026-10-09 · The Blaster fired nothing on the rail (the owner's R16, v133; blocks)
- **Seen:** LMB held or clicked: no shots, in every section of a passage.
- **Cause:** it fired (63 shots in 2 s headless, 27 in flight in a frame) but its needle was drawn as light alone, alpha 0, and at alpha 0
  the mark wrote nothing: a probe put a gun shot 10 m before the camera and counted 0 pixels changed (a foe's shot there: 217). The
  lances' sparks were written the same way.
- **Fix:** the needle and the spark carry an alpha (`vfx/railmark.js`, Petra's crossing, Calissa's to refine). After: the spread of three
  shows, night and day.
- **Rule:** 149.

### 2026-10-09 · Every leg flew in the chase view (found fixing R17, v134's merge)
- **Seen:** the trip test saw only 'chase'; a passage's views were chase from end to end.
- **Cause:** the legs were doubled by a stretch helper, `P`, that multiplies; the views were written with the same helper, so every
  view was 'chase' times 2, NaN, and fell back to chase.
- **Fix:** the views go through their own helper, `V`. The trip test's budget doubled with the legs.
- **Rule:** 150.

### 2026-10-09 · F8 did nothing over an open window (the owner's R7, v133)
- **Seen:** with the Pneuka Box (or another window) up, F8 did not open QAIS.
- **Cause:** QAIS refused to open while a window was up, and the window's own key handler took the key first.
- **Fix:** QAIS hears its keys in the capture phase (`qais.keysFirst`, added before every other listener in `main.js`) and refuses only
  over the title, the workbench and a seam. Headless: Pneuka Box open, F8 opens QAIS over it; Esc closes QAIS, a second Esc the Box.
- **Rule:** 151.

### 2026-10-09 · Closing a window sometimes brought up the pause menu (the owner's R12 and T10, v133)
- **Seen:** after Esc closed a window, the click-to-play card or the pause menu came up.
- **Cause:** the browser refuses a new pointer lock for a moment after Esc; the refusal was reported as the lock lost, which pauses.
- **Fix:** a refused request is reported as `'refused'`: the log says "Click to take the mouse back." (throttled) and the next click in
  the world asks again. Nothing pauses.
- **Rule:** 152.

### 2026-10-09 · The log could not be scrolled or its tabs clicked while typing (the owner's T142, v133)
- **Seen:** typing on the chat line, the wheel and the tabs did nothing.
- **Cause:** the pointer stayed locked and the log took no pointer events.
- **Fix:** opening the chat line frees the pointer; the log takes pointer events while typing; a tab answers a mousedown; closing asks
  for the lock back if it freed it.
- **Rule:** 153.

### 2026-10-09 · The Throwing Room's shadows jumped as the Courier moved (the owner's R13, v133)
- **Seen:** a long diagonal shadow over the lectern's corner, jumping as the camera moved; the owner had come back from the Dunes.
- **Cause:** the Dunes move the sun to follow the Courier (a low gold sun, its frame snapped to 4 m) and on leaving put back only the
  shadow frame. The sun stayed where the Dunes left it, aimed at the Courier's last spot: measured back in the workshop, the sun at
  (-11.5, 27, -39) aimed at (16, 0, 0), where it belongs at (4, 30, -5) aimed at the origin. It also followed the Courier for the two
  seconds the light took to fade.
- **Fix:** the Dunes save the sun's place and aim with its frame and give all three back the frame the camera leaves
  (`dunes.giveSunBack`). Measured after: (4, 30, -5), aimed at the origin, frame ±17 m.
- **Rule:** 154.

### 2026-10-09 · Strawman: "You slash pots", stun through the guard, a swing that never came (the owner's T51, v133)
- **Seen:** blows on Strawman logged as pots; Strawman stunned while blocking; in swing mode it never swung at the Courier.
- **Cause:** the log's filter for the Throwing Room read `kind`, and a blow's payload names its target in `what`; the line mapped
  everything that was not a clapperjar to "pot". `creatures.strike` built the blow's status after `hurt` whatever `hurt` did. The swing
  was played as a look with an empty callback: no windup for the parry, no strike.
- **Fix:** the filter reads `what` too, and the line names a slip jelly or a creature by its word. A blocked `hurt` returns
  `'blocked'` and the strike stops. The swing is a windup in front of Strawman (2.6 m, 0.925 s to the sweep's middle, outlined on the
  sleeve); unanswered it shoves the Courier in reach (no harm) and the log says so; parried it breaks off. Headless: 12 Impact blows
  through the guard, no stun, poise 1; the windup listed; landed and parried each logged.
- **Rule:** 155, 156.

### 2026-10-09 · Wanda's sibling stood on the Float Shrine; the busker's mat was in slip jelly reach (the owner's R9, v133)
- **Seen:** the sibling's rig on the Shrine; jellies coming at the mat.
- **Cause:** the sibling's spot was Old Grog + (2.4, -1.6), 1 m from the Shrine. The jellies' homes were 32 to 40 m from the mat, and a
  jelly sees 15 m and keeps within 30 m of home.
- **Fix:** the spot is Grog's other side, 6 m from the Shrine; the jellies' homes are 50.8 to 56.5 m from the mat (over leash and sight
  together, 45 m).
- **Rule:** none new (a placement).

### 2026-10-09 · The skiff bailed on small drops (the owner's R8, v133)
- **Seen:** thrown off the Solar Skiff landing small hops off ledges and crests.
- **Cause:** a landing's impact was the board's bare fall speed (`-vel.y`). Off a crest at speed the board already falls with the slope
  (its follow speed about 11 m/s down at 30 m/s on 20 degrees), so a short hop onto the next downslope read past the 17 m/s bail. The
  crooked-landing bail could never fire (its test needs more than half a turn off square, which a turn's rounding never leaves).
- **Fix:** the impact is the fall into the sand's own motion under the board (`vyT - vel.y`). Headless: 18 m/s down onto sand falling 11,
  no bail; onto flat sand, a bail. The owner's asks built with it: the glide (Space held in the air: the oars spread, the fall held to
  3.2 m/s, A and D carve) and the bail thrown as a ragdoll faded into the get-up (courier/anim/ragdoll.js).
- **Rule:** 157.

### 2026-10-10 · A slick compiled a program in play (the Dunes sweep's Fury check, v138)
- **Seen:** the Dunes sweep, forcing Fury's hail at the Weir: 168 shader programs after against 167 before, "no new shader program"
  failed. The new one, named by a headless diff of `renderer.info.programs`: `stain`.
- **Cause:** Calissa's slicks (vfx/slicks.js) draw every slick with the blots' program (`stain`, `uSlick`). The same round took the parked
  stain out of the boot's warm-up under rule 166, because the paint map now draws the blots; the slicks still drew with its program, so
  the first slick laid in play (a gusher's spill, a jelly's) compiled it: a hitch on a real GPU, and a program the count never saw.
- **Fix:** the parked stain back in main.js's warm-up; the program budget 164 -> 165 (scripts/perf.mjs, the reason beside it). Headless,
  the sweep's steps: 165 programs before Gall and Fury, 165 after, none new.
- **Rule:** 169.

### 2026-10-10 · Esc closing the Pneuka Box sometimes opened the pause menu too (the workshop sweep, v142 gate)
- **Seen:** "window pneuka: Esc closes it" failed with `pause`; Calissa saw it come and go too. A probe of P, P, P, Esc, 25 times with
  every lock change traced: 2 of 25 showed the pause, each after an unlock that landed once the box had closed, and `escSpentAt`
  was never set, in any of the 25.
- **Cause:** the Pneuka Box's own Esc listener (window, capture, built at main.js's `new PneukaUI`) calls `stopImmediatePropagation`;
  case 125's marker was a capture listener on the same window registered later in main.js, so it never ran for the box. The box's
  own `exitPointerLock` unlock, when the browser delivered it after the close, found no window open and no mark: a pause.
- **Fix:** the marker moved into `Input`'s constructor (core/input.js), the first keydown listener the game registers; main.js only
  says which windows spend an Esc (`input.escSpends`). The same probe: 0 of 25, the mark set in 24 (the 25th's lock never changed).
- **Rule:** 125 (amended: the mark is taken first).

### 2026-10-10 · The basement sweep threw at the Index's tenth room (Calissa's builder, a13f991)
- **Seen:** `scripts/sweeps/basement.mjs` passed 177 checks, then threw at line 158; the rest of the sweep never ran.
- **Cause:** the sweep picked each Index room by pressing its `code`; the debug chests' rooms (past the keyed ones) have none, and
  `keyboard.press(undefined)` throws.
- **Fix:** a room with no key is picked as the Index itself offers, with arrows from its current selection and Enter. The basement
  sweep: 362 pass, 0 fail, the two debug chests' rooms reached by arrows.
- **Rule:** 190.

### 2026-10-11 · Training bodies seasoned Focus and paid Divination's exp (Calissa's handoff, melee phase 1)
- **Seen:** six statuses built on the status bench's roly-polies raised `alchemy.s.season.focus` from 0 to 6, while the ledger stayed 0.
- **Cause:** `alchemy.js` and `psyche.js` listen to the bus directly; only tracking.js's `on` wrapper skipped Strawman (`training`,
  `kind: 'strawman'`), and the roly-polies were new.
- **Fix:** `isTraining(e)` in `progress/combat/testroom.js` (Strawman, the roly-polies, anything marked `training`), asked by Soul Alchemy's
  seasoning and the domains' exp; tracking.js may ask it too (Petra's).
- **Rule:** 193 (191 as Dovina wrote it, renumbered at the gate: Calissa's 191 and 192 were first).

### 2026-10-11 · Made whole after a shatter on the belly, the Courier was still prone (Calissa's verifier, crouch-jump round)
- **Seen:** shattered while prone, the Courier was made whole at the workshop upright for a moment, then down on the belly by about
  step 345, in posture 'prone' with the prone capsule.
- **Cause:** `course.teleport` (world/basement/basement.js), which the reform calls, resets the techs and the movement but never the
  posture; `player.respawn` did, in its own copy of the lines.
- **Fix:** `player.standUp()` (posture stand, its timers and buffer cleared, the standing shape), called by both; the shape's own check
  lowers them where there is no headroom.
- **Rule:** 202.

### 2026-10-11 · Every Tech, Once could not be earned (Petra, v154's prone holster)
- **Seen:** lg5's goal was 37 techs, and no play could reach it.
- **Cause:** the goal was `game.techs.list.length`, which counts the passive techs (carry, kick, recoil, the six tools' holsters, the
  prone holster) that never start, and the five the tracking rule never logs (emote, talk, rhythm, death, ultimate). Out of reach
  since the holsters joined the list; v154 only made it 37.
- **Fix:** `loggedTechs(techs)` in `progress/skills.js`: the startable, logged techs. The tracking rule's firsts and lg5's predicate
  and goal all read it. Measured: 21.
- **Rule:** 221.

### 2026-10-13 · The Corrupt shell compiled a program mid-fight (Calissa, the shells' refire)
- **Seen:** the last late compile after every caster shell was fired twice near slip jellies: Corrupt's struck body, one program,
  key bit 2048 different from any warmed one.
- **Cause:** the corrupted material (`vfx/caster/corrupted.js`) is double-sided on a plain, not skinned, slip jelly; its sun-shadow
  depth variant (double-sided, rigid) is used by nothing at boot. Parking stand-ins as shadow casters could not warm it: they were
  skinned or single-sided.
- **Fix:** `shadowSide: THREE.BackSide` on the corrupted material, so its shadow uses the depth program the slip jelly already warms.
  The shadow looks the same. Measured: Corrupt, Meteor, Thunderhead, Hailstorm and Volcano fired twice, 0 compiled late.
- **Rule:** 225.

### 2026-10-13 · A broken god hand was committed past a failing check and build (Dovina, the bracelet's sync)
- **Seen:** commit 375c381 pushed `godhand/powers.js` with a syntax error. `npm run check` printed FAILED and the build errored, but the
  commit and the push ran anyway.
- **Cause:** two causes. An inline `// (...)` comment, added by a find-and-replace into a one-line `if (...) { emit(...); continue; }`,
  commented out the `continue; }` that closed the block. And the gates ran as `npm run check 2>&1 | tail -1 && ...`: a pipe's status is
  its last command's, so tail's success let the `&&` chain go on.
- **Fix:** the comment removed (cd 2026-10-13); the TWIN repeat retried headless (one repeat, `bracelet.charm:TWIN`).
- **Rule:** 226.

### 2026-10-13 · Knacks' and arts' feat ways on a record never opened (Dovina, headless)
- **Seen:** a probe set `grapple.swing.peak` to 15 (Portal's feat way, 14) and Portal stayed locked; Sculpt's goal bar read 0 with
  `god.manifest.len` at 5 of 10.
- **Cause:** a record (`L.hi`) lives in the ledger's `rec`, and `L.get` reads only the counters. `goalFracOf` (progress/skills.js) and the
  knacks' `G` (progress/knacks.js) read `get`, so every goal on a record was 0: Perfect Pitch's `crystal.sweet.run`, Held Breath's
  `parry.run.best`, Guide Tone's and Wet Ink's bests among them.
- **Fix:** `ledOf(L, key)` reads the greater of the counter and the record; goals, the System's goal values and the knacks read through
  it. Measured: Portal opens by the feat, Sculpt's bar reads 0.5.
- **Rule:** 227.

### 2026-10-14 · The skiff's sail drew nothing (the owner, v195)
- **Seen:** the Solar Skiff's sail was wholly transparent, from v194 on.
- **Cause:** v194 gave the sail its own screen-door fade by wrapping it in `withFade`, but `vessoulPainted` already wraps every painted
  material in `withFade`. Two wraps declared `uFade`, `uDissolve` and `uDisBase` twice, and the sail's program failed to link.
  Measured headless: `LINK_STATUS` false before, true after.
- **Fix:** the sail's own fade uniforms are passed to `vessoulPainted` (its third argument) instead of a second wrap (`courier/skiff/boat.js`).
- **Rule:** 228.

### 2026-10-14 · The skiff hung at a rail's end (the owner, v195)
- **Seen:** a grind let run to the end of its rail left the board stuck there.
- **Cause:** the grind let go at the rail's last point with no upward speed, and the next frame `tryLock` found that same point, 0 m away
  and inside the heading's cone, and locked again: an end and a lock every frame. A fall off the side set the board 1.3 m out, inside
  the 1.4 m reach, so it was retaken the same way.
- **Fix:** the rail just left cannot lock for 0.6 real s (`GRIND.relock`); no lock past a rail's ends; a fall lands outside the reach
  (`courier/skiff/grind.js`). Measured headless: one lock, one end, and the board 20.8 m past the end 4 real s later.
- **Rule:** 229.

### 2026-10-14 · A grind's fall threw the board off the wrong side (Calissa, building the balance mark)
- **Seen:** the board rolled to its right as the balance leaned right, then fell off to its left.
- **Cause:** the fall's offset took the perpendicular (-vz, 0, vx), which is the board's right (as skiff.js's), and multiplied it by
  minus the lean's sign: the roll and the fall read the same sign through two different vectors, one negated.
- **Fix:** the fall moves along the right by the lean's own sign (`courier/skiff/grind.js`).
- **Rule:** 230.

### 2026-10-14 · /race and /retire did nothing (Dovina, building the race modes)
- **Seen:** the chat line's `/race` and `/retire`, added in round five, answered as unknown commands.
- **Cause:** the Race is made with the Raceway, before `game.chat` (main.js makes the chat line later in the boot), and its constructor
  called `game.chat?.add(...)`: the optional chain met `undefined` and added nothing, with no error. Measured headless: `game.chat` was
  undefined in the Race's constructor, and the two commands were missing from the chat line's list.
- **Fix:** the commands are added by `commands()`, called from the Race's first `update` once `game.chat` exists
  (`world/raceway/race.js`). The skiff's own settings are made after the chat line (`main.js`).
- **Rule:** 231.

### 2026-10-14 · The skiff's boost kept roaring under the pause menu (the owner, v198: "soften the boost noise")
- **Seen:** opening the pause menu mid-ride left the skiff's hiss and the flare's hum sounding at full, for as long as the menu stayed open.
- **Cause:** the skiff's loop (`sfx.skiffLoop`) is set by skiff.js each frame of play; paused, nothing sets it, so it held its last level, and
  it went straight to the world's bus, which no menu touches. The flare's layer also rose to 0.17 of a hum and 0.36 of noise: loud.
- **Fix:** a loop bus (`sfx.loopBus`, `quietLoops`: audio/core.js) silenced by the ambience while `menusUp()`; the skiff's loop, the grind,
  wet sand and a shell's field go through it. The flare's layer cut to a lift (hum +0.025, noise to 0.23 at full speed), and the Raceway's
  boost whooshes (the carve's release, a sun plate, the solar start, a slope landing) to a third of their gain.
- **Rule:** 232.

### 2026-10-15 · The folk at Raku's tables never took their turns (Calissa, dressing the bazaar, v208)
- **Seen:** seated at a table, after your own move the page waited on "RAKU IS THINKING…" for ever.
- **Cause:** a table's page is an index page, so `modalOpen()` is true and main.js's tick returns before `game.bazaar.update`, which was
  the only caller of `TableSession.update` (the bots' beat). The headless probe drove `update` by hand, so it passed.
- **Fix:** `Bazaar.tickModal(dt)` runs the seat's clock from main.js's modal line while a session is open (`world/bazaar/bazaar.js`).
  Calissa's table view (`vfx/bazaartable.js`) ticks it too; both stay, and `TableSession.update` steps once a frame however many call
  it (`game.clock.frame`, main.js), so neither caller has to know of the other.
- **Rule:** 233.

### 2026-10-15 · The Raceway park kept 160 MB after one visit (Petra, the gate: `npm run perf` over budget, 466 MB against 445)
- **Seen:** the built game, after gc: 290 MB at boot, 452 after one visit to the Raceway, still 452 in the bazaar afterwards.
- **Cause, measured** (dev heap, gc'd): the park's chunked terrain is 108 MB on its 1,057 x 1,057 grid (positions and normals 29, the
  chunks' index lists 42, the index buffer 31, heights 4.5); its physics height field 5; the field of heights 4.5; my rails, kit and
  features 12; Calissa's dressing 17 at arrival and 36 more in the first seconds there. All of it was kept for the session.
- **Fix:** the ground is lent (`world/raceway/raceway.js`): `releaseGround()` after 10 real seconds away gives back the terrain and its
  height field's body; `buildGround()` makes them again from the kept field on the next arrival (0.64 s dev, 0.74 s built, under the
  travel's cover). Built: 295 at boot, 467 inside, **364 after leaving** (was 452). The dressing can follow by `onRelease`
  (Calissa's); the terrain's own arrays could shrink (lists built on demand, the index buffer sized to what is drawn: Petra's
  `render/terrain.js`).
- **Rule:** 234.

### 2026-10-18 · The Well's draw at 6x its baseline after the overlay's tool UIs went in (Petra, the gate: `npm run perf`)
- **Seen:** `npm run perf` at the Great Dunemaw's bottom floor: well draw ~1250 ms against a baseline of 213 ms; the other three places
  within tolerance.
- **Cause, as measured (in part):** the new pieces (the psygun's cylinder, the Sondelass's guard, the thermometer Lachrimeter, the Sight)
  only hid the old DOM UI with body classes (`cylinder-standing`, `sondelass-guard`, `tube-standing`) and inline styles, while the tools,
  the HUD and the tube still built, showed, hid, polled and measured it (the tube read `#shells`' rect and computed style twice a real
  second). Calissa's bisect: with `cylinder-standing` on, the Well's draw 6 ms; off, ~1230 ms. Why the DOM row cost that was not
  root-caused: it was retired instead.
- **Fix:** the old UI retired, not hidden (the owner: "why is it not being fully retired now that we have updated UI elements?"): the
  shells row (#shells, `hud.buildShells`), the Sondelass's tool strip (#toolstrip, `angling/ui.js`) and the string row
  (`ui/cutlassstringrow.js`), the flat Lachrimeter and its panel frame (`ui/lachrimeter.js`, `stepAside`), the old compass dial
  (#compass); every show, hide, poll and class went with them. **Measured after (this commit's `npm run perf`): well draw 1259 ms,
  calls 85, programs 196: unchanged.** So the DOM row was not what cost the Well its draw; the bisect's 6 ms is not reproduced by
  deleting it. **The real cause (measured after, the next case): nothing in the frame got dearer.** The Well's frame costs ~1.2 real s
  of software GL at 744bc30 (perf: 6 ms) and at this commit (perf: 1259 ms) alike; perf's number is how much of the GPU's queue its
  60 draws happen to wait on, and the bisect's 6 / 110 / 1274 ms and the body class's 6 / 1230 ms were that coin landing either side.
- **Rule:** 235.

### 2026-10-18 · The Well's 6x draw was the GPU's queue, not the frame (Calissa's builder, measured for Petra's gate)
- **Seen:** `npm run perf`, the Great Dunemaw's floor 3 in a hall: draw 1259 ms against 212.7, calls 85 and triangles the same; bisected to
  ce11b20 (the psygun's cylinder), and to the `cylinder-standing` body class before that was retired; the workshop, Dunes and garden fine.
- **Cause, measured** (headless, SwiftShader, `scripts/sweeps/harness.mjs`; probes in the session's scratchpad): perf times `G.draw()`
  with `performance.now()` and no sync, so it times only the JS that queues the frame while the GPU process has room. Timed per frame
  with nothing else: frames 1 to 72 after arriving 3 to 6 ms, one frame near 35 **41 s** (a post pass's program used for the first time:
  `getProgramInfoLog`, a sync, waiting on the ~35 frames queued before it), then from about frame 73 **~1.2 s every frame** (the
  command buffer full: the profile's time is in `getProgramInfoLog` and `uniformMatrix4fv`, waiting). Timed to a 1-pixel `readPixels`
  after each draw, the Well's frame is **1.1 to 1.3 s from the first frame, at 744bc30 and at 5cb9b3f alike**; the workshop 1050 ms,
  the Dunes 2040 (the baseline's 932 and 2059: those two were already measured blocked). At 744bc30 unsynced, the same run waits in
  bursts (7 s every ~6 frames) and the median lands on a cheap frame (5 ms); at 5cb9b3f it waits on most frames and the median lands on
  1.2 s. With the cylinder taken out of the overlay's scene, 25 of the 60 measured frames wait and the median is 5 ms again: the
  cylinder's few draws moved the median across the line, not the cost. Toggled, synced: the overlay's scene off 1150 -> ~950 ms (its
  36 draws, 43k triangles, the tube's physical glass, ~200 ms of software GL); `well-floor-3` hidden 1197 -> 225 ms (the floor is
  ~80% of the frame); the post pass off 1727 (dearer, not looked into).
- **Fix:** none in the frame; the cylinder, the link and the tube stay as approved. The measure is the bug: perf's draw should be timed
  to a sync (a 1-pixel `readPixels` after each `G.draw()` in `scripts/perf.mjs`'s `place()`) and the baseline recorded again from it;
  the Well then reads ~1.2 s against a synced baseline of the same, and a real regression shows as one. Petra's file and gate: handed
  to Petra, not edited here.
- **Rule:** 236.

### 2026-10-18 · Boot logged "two banks define sfx.sounding" (Calissa, a headless look on v218)
- **Seen:** at boot, `audio: two banks define sfx.sounding (SondelassSounds, AnglingSounds)`.
- **Cause:** sketching the Sondelass's UI to Calissa's mock round 9, Wanda added `sounding()` to audio/sondelass.js; the rod's sounding
  already had it in audio/angling.js. The banks are mixed onto one Sfx in order, so angling's (the later) won and the game sounded as
  before, but the sketch was dead and the name ambiguous. `npm run check` does not run the boot, so only a look caught it.
- **Fix:** the Sondelass's `sounding` removed; the sounding stays angling's, the one wired to `angle.sound`.
- **Rule:** 237.

### 2026-10-19 · The Pneuka Jar idled leaning forward, about 45 degrees, in the god hand and in a Shrine's cradle (the owner, v221)
- **Seen:** the Jar at rest stood crooked, leaning forward; sealed in a Shrine gate's cradle it leaned the same way.
- **Cause:** measured headless: the Jar's group came out of the Spirit Garden at x 0.47, z -0.12 rad. In the garden it is stood square to
  the planetoid under it (`placeJar`: the Dantian's ground there leans 28 degrees), which is right there; on leaving nothing put it back,
  and the world's god hand (`godhand.js`) and the cradle (`cradles.js` seal) set only its yaw, so every later rest kept the garden's lean.
- **Fix:** the garden's `leave()` stands the group upright again (its yaw kept); the cradle sets the whole rotation (0, yaw, 0).
- **Rule:** 238.

### 2026-10-19 · The overture's pre-chorus lost its bass and its lead (Petra's connectome, the deep clean)
- **Seen:** the connectome listed `const CLIMB` in `src/music/overture.js` as never read; the pre-chorus played only its chugs, toms,
  strings and snares, with no bass and no climbing lead (since 2026-10-04, the climb's accents for Calissa's board).
- **Cause:** a comment, `// (a tool drawn each half bar: Calissa's board)`, was added in the middle of the climb's line, so the bass's
  `E('pick', ...)` and the lead's `...line(CLIMB[i], 'shred', 0.4)` after it became comment text. The line still parsed, so nothing threw.
- **Fix:** the comment ends its own line; the bass and the lead are code again (`npm run build` and the connectome see CLIMB read).
- **Rule:** 240.

### 2026-10-19 · The map screen (M) had no styles since the old HUD was retired (Petra's connectome, the deep clean)
- **Seen:** the connectome listed `const CSS` in `src/feedback/cartography.js` as never read: the map screen's sixteen rules (`#mapui`,
  its bar, buttons, side panel and legend) were in the file but never in the page, so `#mapui` stood unstyled at the foot of the body
  and its `.open` toggle did nothing (read from the code; not seen in play, which is how it reached v228).
- **Cause:** one `<style>` held the compass's rules and the map's, injected by the compass's builder (`buildHud`). Retiring the old HUD
  (5cb9b3f, 2026-10-18) deleted the compass's rules and its builder, and the injection with them; the map's rules stayed, unread.
- **Fix:** `buildMap()` injects the map's own rules.
- **Rule:** 241. A sheet of rules is injected by the builder of the thing it styles, never by a neighbour's.

### 2026-10-20 · A stinger's blow never counted, and a wall was never wiped (Petra, writing the deep clean's report)
- **Seen:** reading back the stinger's line in `src/tools/sondelass/cutlass.js` for the report: `strike(...); // (its row's 3.0 ...)
  this.moves.markBlow(this.stBlow, 'creature', c);`. The comment, added at the deep clean (b021382), swallowed the `markBlow`, so a
  stinger that landed on a creature closed its blow as a miss and ended the string's run. A scan of `src/` for code after a comment's
  closing parenthesis found one more: `src/world/ground/paintwalls.js` `wipe()`, where `this.k[m] -= t; got += t; ...` had sat after
  a comment since 713bc35 (2026-10-12), so the mop and Clean took nothing off a wall for 8 days. Neither threw; neither was seen in play.
- **Cause:** a comment added to the middle of a line of statements (rule 240's case, twice more). The connectome's "never read" could
  not see either: `markBlow` and the cell arrays are read elsewhere.
- **Fix:** each comment on its own line, the code under it running again. `npm run check` now fails on code after a comment's closing
  parenthesis ending in `;` or `}` (`comment.swallows`); it caught a planted case, and finds no other in `src/`.
- **Rule:** 240.

### 2026-10-20 · Every prop's outline went transparent once a ship was built (Petra, the low-spec round's program probe)
- **Seen:** a probe listing which shader programs differ by one flag, and which materials sit on each side, found the outline hulls on
  six programs, three of them twins of the other three by the opaque bit, and every outline material in the game marked transparent.
- **Cause:** `courier/ship/ship.js` `overShots()` turns every material under a ship's look transparent, so the hull draws after the
  foes' shots. The look's parts carry outline hulls on the shared `OUTLINE_MAT` (and the character outlines on theirs), so the first
  ship built turned the outline of every prop in the game transparent: all of them moved into the sorted pass (sorted again each
  frame) and three programs more were compiled.
- **Fix:** `overShots()` skips a material marked `userData.shared`. The ship's outline rim stays opaque, under its hull, which still
  draws after the shots.
- **Rule:** 242.

### 2026-10-20 · Other foes kept shooting the Courier through a puzzle duel (the owner, in play; Dovina's rulings, PUZZLE-DUELS.md 16)
- **Seen:** the owner: "When entering the Puzzle Duel, other enemies in the area are still active and will continue shooting
  projectiles at the Courier and attacking them." A shot at an aberrant also opened its duel, which the owner ruled against.
- **Cause:** the duel pinned its own foe only (`duelsession.js` `pin`); every other creature kept its mind and its casts, its shots
  in flight kept flying, and `vesselDamage.hit` took any blow. `creatures.strike` opened the duel through `duelFoes.provoke`.
- **Fix:** the pocket (`DuelSession.pocket`, from `begin` and every frame while pending or active): every other creature halted and its
  blow called off, released at the end; every projectile in `game.projectiles` vanished; `vesselDamage.hit` refuses any blow not the
  Courier's own while a duel is pending or active. A Courier's blow on an unmended aberrant does no harm and rings off with the resist
  mark. Nearness opens the duel: `DuelFoes.updatePull`, 4 m and 1.5 real s to fill, beyond 6 m drained in 0.75 s, `duel.pull` and
  `duel.slip`. Measured headless (the test Wisp, DEBUG): a strike leaves its hp at 5; the pull reads 0.33 after 0.5 s and drains to
  0 with `duel.slip`; a full pull opens the duel through the seam; no projectile survives; an outside blow returns -1 with the pool
  unchanged (94.1); every hold released at the end. Ten roly-polys in the basement, 2 km off, had their halt cleared by their own code:
  nothing of theirs can reach the duel past the vessel's door.
- **Rule:** 243.

### 2026-10-20 · The bomb and the vacuum ended outlined shots at sea (Calissa's mount card; Dovina's ruling)
- **Seen:** reading `courier/ship/mounts.js` for the mount card: `toll()` and `gulp()` swept `[...shots.plains, ...shots.outlines]`, so
  the Crucibelle's bomb and the Lockheart's vacuum ended outlined shots, which only the parry may answer (the glossary, "plain shot /
  outlined shot"). The hook took casks only when no boarder was on the aim, and from any side within its range.
- **Cause:** both sweeps were written over every pool of shots; the hook kept the cask as a fallback after boarders.
- **Fix:** both sweep `shots.plains` only. The hook takes the nearest boarder or cask within its table cone (MOUNTS.sondelass.angle and
  range), whichever is nearer. The spray's cuts and the gulp's refill read MOUNTS' keys; the cone reads the table's angle with no
  fallback. `pirates.nearestCask` went with the old fallback.
- **Rule:** 244.

### 2026-10-20 · The ship reached a fifth of the screen in the above view (the owner, in play; Calissa's measure)
- **Seen:** the owner: "an unusual limitation to the range of motion of the ship". Measured (docs/plans/research/RAIL-BUGS-MEASURED.md
  1): the share of the screen the ship could reach was 49% x 36% in chase (the top 43% never), 19% x 31% in above (all of it in the
  lower half), 23% x 17% in side.
- **Cause:** one box, `T.ship.box` (7 m across, 1.2 to 7 m up), clamped in every view (`Ship.update`), while the cameras stand 7.5 m
  (chase) to 30 m (above) away and follow a share of the ship.
- **Fix:** `views.reachOf(view, aspect, fov)`: each view's reach found by projecting the ship through that view's camera rig at rest,
  stepped out by halving until it leaves the frame less an 8% margin (RAIL-MODULES.md 1.1), its corners checked in a second pass,
  cached a view and aspect; `Ship.update` clamps the plane's two axes to it, the pinned axis as before, the edges easing when a swing
  turns the plane. At 16:9: chase x ±11.8 m and up to 12.5 m, above x ±29 m and z -10.5 to 41.6 m, side z -21 to 27.7 m and up to 17.3 m.
- **Measured after** (a drafted trip, shoal then graveyard then the Wreckers, the ship steered to its corners): the ship reaches ±0.84
  of the screen in chase, free, above and side, up to 0.84 above; its floor is the sea's (chase -0.57, side -0.14).
- **Rule:** 245.

### 2026-10-20 · The reticle snapped, flew off the screen and came back locked at a swing (the owner, in play; Calissa's measure)
- **Seen:** the owner: "the targeting reticle breaks/becomes locked when changing perspectives". Measured: at the chase>above swing's
  midpoint the reticle jumped to the scroll line; after a scroll view it reappeared pinned at the screen's edge (the hidden cursor at
  its clamp in 3,128 of 3,147 samples); out of the side view it flew to NDC 3.4; a fallback put it at (0, 1.33); and it ran a frame
  behind in every swing.
- **Cause:** `Ship.aimAt` added the mouse to the cursor in every view, shown or not; the aim flipped views at the swing's midpoint while
  the camera was mid-turn; a ray meeting the reticle's plane behind the eye fell back to a point off the screen; the stage re-aimed
  before main.js placed the camera.
- **Fix:** the mouse is counted only while the view shows the cursor; across a swing both views' far reticles are found and eased by the
  camera's own smoothstep; a ray that meets the plane behind the eye takes the cursor's ray 36 m out; the stage's `reaim` runs from
  main.js after `player.updateCamera`; in a scroll view the far reticle is drawn in along the scroll to stay inside 0.95 of the
  screen (with the bigger reach, 36 m ahead of a ship riding high was past the top). (The same game day the owner ruled the above view
  twin-stick and Dovina's RAIL-MODULES.md 1.5 the side view the same: every view now aims by the cursor on its plane, so the scroll
  reticle and its hold went; a braked ship's box is sized at its depth, after Calissa's mock found the chase corners at 1.08.)
- **Measured after** (the same trip, the mouse moving every frame): 12,000 reticle samples, 360 in swings, none off the screen (1,151
  before the scroll reticle was held in); the hidden cursor moved in no frame of a scroll view; in the free views the reticle sits
  under the cursor (median error 0).
- **Rule:** 246.

### 2026-10-20 · The crossing's patterns leaned left, fanned into depth, fired off the beat and from no one (the owner, in play; Calissa's measurements)
- **Seen:** the owner: emitters "aiming at the left region of the screen where they will never hit the ship"; patterns "desynchronized
  and often appearing from no clear source". Calissa measured it headless (`docs/plans/research/RAIL-BUGS-MEASURED.md`, her branch):
  - every aimed and fan shot in the chase and free views tilted 20 degrees left (median 20.1);
  - in the side view, 1,064 of 1,191 shots never reached the ship;
  - 40 to 67% of many patterns' emissions were more than a quarter of a sixteenth off the grid;
  - 77% of plays had no thrower (a bare point 60 m up the rail);
  - the cage ring closed 30 m short of the ship;
  - the shoal's peak asked for a role its fish do not carry;
  - the fairness check passed it all.
- **Cause:**
  - `dirOf`'s cone mode always tilted the aim by 0.35 rad toward the frame's -x.
  - The player laid every pattern out with up +y and turned it by the shortest arc, so a side view's plane pattern lay across the
    camera's axis.
  - `every` was in plain seconds and the runs added up frame time.
  - The runner threw from `AHEAD`, or from the newest foe of a role wherever it was.
  - The cage closed on `ctx.range || 30` and no one passed the range.
  - The fairness check judged in the layout frame, not as the player turns a pattern.
- **Fix:**
  - **Aim:** a cone pattern's angle is off the aim, as in the plane; only ring rows (`ring: true`) spread in a cone.
  - **Plane:** `frameOf`/`orient` turn a laid-out pattern onto the aim keeping the view's plane (`up`: side +x). In a plane view the
    thrower and the aim are put on the ship's plane, and a cage lies in the plane.
  - **Grid:** `every`, `gap` and every shot's time snap to the cue's sixteenth (`GRID`), and the player reads the leg's bar, never frame time.
  - **Thrower:** a role's thrower is a live foe in the view's frame, or else a **carrier** (`CARRIER_AT`): a placeholder body that comes
    in, holds and leaves.
  - **Windup and swings:** each play has a windup (`leadOf`, the rail's telegraph mark), and nothing is fired into the bar before a swing.
  - **Other data:** the shoal's peak patterns come from its `glint`s, and Old Nobody's peak is in the side view his flank was written for.
  - **The check:** the fairness check now holds aimed volleys to 6 degrees, plane views to their plane and every shot to the sixteenth,
    in all three views as the player turns them (`scripts/patterns.mjs`, `scripts/legs.mjs`). On the old code both passed everything.
- **Measured after:**
  - **Probe:** a drafted trip sailed headless (shoal, then graveyard), 1,391 shots.
  - **Throwers:** every shot from a body; none fired during a swing.
  - **Grid:** none is off the sixteenth by more than a quarter of one.
  - **Aim:** aimed shots in the free view sit at 0 degrees to the ship (were 20). The chase view's twins sit at their designed 8 degrees.
  - **Plane:** none leaves the above plane.
  - **Not verified:** the side view in play (the trip did not reach it); the check covers it in the math only.
- **Rule:** 247.

### 2026-10-20 · The check called 32 tracking files dead after a doc comment was added to their hub (Petra, at the gate)
- **Seen:** `npm run check` failed with `module.orphan` on every `feedback/tracking/*.js` file, after one `/** ... */` comment was
  added to `feedback/tracking/rules.js`, the file that imports them all. Nothing was wrong with the imports.
- **Cause:** the check's comment stripper (`code()`, `scripts/check.mjs`) blanked block comments first and line comments second. The
  hub's header, a line comment, says ``every `feedback/tracking/*.js` ``: its `/*` opened a "block comment" that ran to the next `*/`.
  Before the new doc comment there was none, so nothing was blanked; with it, every import between the two was blanked.
- **Fix:** one pass, left to right, over both kinds (`/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g`), so a `/*` inside a line comment opens nothing.
- **Measured after:** the same 82 findings as before the change on the tree without it (83 with the new data file unimported: its
  orphan, as it should be); no file's imports lost.
- **Rule:** 248.

### 2026-10-20 · With the mock's chase camera, the ship's box shut to nothing at a full brake (Petra, before it shipped)
- **Seen:** `reachOf('chase', 16/9, 70, 0.84, [-4, -4])` gave x 0 to 0, then, once a floor was searched by halving, a floor of 43 m.
- **Cause:** the camera follows 62% of the ship (the owner's ruling 5). Braked, the cruise height itself sat just past the screen's
  margin, so the search began outside and stepped nowhere; and halving between 3 m and 43 m assumed one edge in the range, but a
  camera that follows the ship brings the screen round again far above the plane, so the halving settled on the wrong edge.
- **Fix:** the floor is found by stepping from the cruise height (0.25 m a step) to the first change, then halving that one step;
  where the cruise height is off the screen, the search starts from the floor it finds. The ship takes the higher of the floor and
  the sea's surface (`ship.js`).
- **Measured after** (16:9, every view, depths -4, -2, 0, 3 and 6): every corner at 0.840 or inside. Chase braked: floor 3.08 m
  (the owner's ruling says 3.1), x ±8.8 m. In the game, braked, the ship sits at -0.84 on the screen, 0 errors.
- **Rule:** 249.

### 2026-10-20 · Flash and Bomb opened no blocker in the showcase crossing's overhead leg (Calissa, in her look)
- **Seen:** Digit1 and Digit2 at the overhead and side blockers; no seam opened. Probed: the ship sailed the overhead leg in the first
  leg's kit (Bomb and Vacuum), so Digit1 was a Bomb out of its reach and Digit2 the Vacuum; nothing could open it.
- **Cause:** a leg's hull and mounts were fitted only in the turn before it (`triprun.js` leave). A leg reached any other way (a look's
  or a probe's jump of the clock) kept the kit of the last leg left.
- **Fix:** `refit(k)` is asked again as the leg begins (enter), and does nothing, says nothing, when the kit is already its own.
- **Measured after:** jumped from the launch to the overhead blocker: the destroyer with Flash and Bomb; Flash opened it (2.92 real s
  held). Sailed through a turn in order: one log line for the new hull, not two. 0 errors.
- **Rule:** 250.

### 2026-10-20 · In the side view the False Light's volleys began 1.4 to 5.2 m from the ship (Petra, measured for Dovina)
- **Seen:** measuring the side view's throwers after the side camera came closer: the brig's hull stood 17.1 to 17.8 m from the ship,
  but its stackFan and split shell began 1.4 to 5.2 m off it, against the 15 m every pattern is judged from (`scripts/legs.mjs`).
- **Cause:** in a plane view the pattern player moves the thrower onto the ship's plane before it fires (`patternplayer.js`): in the
  side view the depth (x) is dropped. The brig ran abeam on the ship's far side, 17 m deep and level with the ship along the scroll,
  so on the plane she stood beside it. The leg runner took any set piece's body as its thrower, wherever it stood.
- **Fix:** Dovina's rule (RAIL-MODULES.md 1.8): a plane view lays a thrower on the ship's plane along the camera's ray through it,
  where it is seen (`patternplayer.js` `layOnPlane`; dropped straight across, Old Nobody's throat 24 m deep was laid 6 m off its
  image); a set piece's body throws only when that point is inside its view's box (its depth not asked) and at least `THROW_MIN`
  (15 m) from the ship, else a carrier throws (`legrunner.js` `throws`). In the side view the brig keeps ahead, 21 m on and 5.5 m
  deep, and her stern chasers fire aft only from inside the frame and half a real second off (`pirates.js`).
- **Measured after** (the Wreckers' and Old Nobody's peaks, sailed headless in the side view, the eye at (18, 4.5, 3)): the brig laid
  at 16.0 to 17.5 m; 9 of 10 of its volleys thrown by its body, the first by a carrier (laid at z 22.7, past the frame); two stern
  chasers. Old Nobody's throat laid at 7.7 to 10.4 m: every volley by a carrier; then, on Dovina's ruling, its spine run 22 to 25 m
  ahead in the side view (`leviathan.js` AHEAD): its throat laid at 17.9 to 19.0 m, all 4 of its abreast volleys by its body, the
  heave's and the sounding's by carriers. 0 errors.
- **Rule:** 251.

### 2026-10-21 · In the side view the gun could not reach the False Light (Petra, found reading the aim for the boss law)
- **Seen:** reading `ship.js farOf` while giving the brig her parts: since v252 she stood ahead in the side view at x -5.5, z 21, and
  with her abeam rule gone the side gun's reticle lay on the wall plane (x 0). Her hull's sphere is 4.2 m across its centre, so every
  shot in the plane passed 1.3 m in front of it; her ports and slings stood further in. Only the lock-on's lances could reach her.
- **Cause:** the side view's cursor met only the plane the ship sails in. A body drawn deeper than the plane (the brig 5.5 m, Old
  Nobody 24 m) was a target on the screen and out of the gun's reach; the abeam rule that once turned the gun into the screen also
  made every foe in the plane unpickable while it held.
- **Fix:** in the side view the cursor takes the first foe under its ray at its depth (behind the ship's plane, never between the
  camera and it), else the wall as before; the brig and Old Nobody keep no abeam rule in the side view.
- **Measured after:** not measured in play (the owner's); headless, the brig sank and Old Nobody was felled by the gun's blows through
  the roll, 0 errors.
- **Rule:** 252.

### 2026-10-20 · A mine's tell hung the page (Wanda, testing the rail's foe roster)
- **Seen:** the headless page closed ("Target page, context or browser has been closed") on `sfx.railTell(..., 'mine')`.
- **Cause:** the mine's beeps (audio/rail.js TELL_VOICE.mine) stepped `x += gap, gap *= 0.6` until `x >= len - 0.02`; the gaps sum to
  2.5 times the first (len / 3), 0.83 of len, so `x` never got there and the loop never ended. On Wanda's branch only, never on main.
- **Fix:** the gap floors at 40 ms and the loop stops at 12 beeps; the gunship's spin-up got a count of 64 the same way.
- **Rule:** 253.

### 2026-10-21 · A hidden leg waiting for its leg read as the first leg (Petra, wiring the arches' find)
- **Seen:** by reading, not in play: the Light Whale's dive (`trip.hidden`) is set with `k: 0` to mean "no leg yet", and a leg's
  close pays and clears it when `hidden.k === k`. With the whale met at the first waypoint (k 0), its own close took the dive as
  sailed: paid on the encounter's score (none) and cleared before any fighting leg was sailed below.
- **Cause:** one value, 0, stood for "unset" and for the first leg.
- **Fix:** unset is `null`, and a leg takes the dive when `hidden.k == null` (triprun.js enter, act; hazards.js find, which now sets
  it too for every arch of a leg threaded).
- **Measured after:** not measured in play (no seeded chart puts the whale first); headless, the shoal's three pillars and its leg's
  close ran with the dive unset, 0 errors.
- **Rule:** 254.

### 2026-10-21 · The rail readout was drawn 600 px down, off the screen (Calissa, Petra's report on the wired crossing)
- **Seen:** by Petra headless at the shoal: the readout's `.rr` read opacity 1 with all its text, and nothing showed. Probed: its
  computed `top` 22.5 px with `bottom` -22.5 px (relative positioning), its box at y 623 in a 600 px view.
- **Cause:** the Brine frame (`ui/brineframe.js`) adds its class `bf` to the window it frames, and its sheet (`.bf{position:relative}`)
  is injected after the readout's (`.rr{position:fixed}`): equal weight, the later rule won, and the readout fell into the body's flow
  under the full-screen canvas. On the workbench page the sheets went in the other order, so the look passed there.
- **Fix:** `.rr,.rr.bf{position:fixed...}` (ui/railreadout.js): the readout's own placement outweighs the frame's.
- **Measured after:** headless aboard the showcase crossing, the readout's box at (13, 23), 165 x 104 px, drawn top-left over the sea.
- **Rule:** 255.

### 2026-10-22 · Every batch re-chose its program at every draw (Petra, the stutter)
- **Seen:** by measure, headless: the workshop made 1,128 KB of garbage a frame; three's `getParameters` was the largest share (161 KB).
  Counted, 50 program checks a frame in the workshop, every one on a BatchedMesh's draw (the props', their outlines', the shards') once
  kinds were kept apart, in both the main pass and the shadow's.
- **Cause:** three 0.170.0's `setProgram` asks a batch for `object.colorTexture !== null`; a BatchedMesh keeps its colours as
  `_colorsTexture`, so the answer was undefined and the test always true. Beside it, two real changes of kind: one depth material for
  every caster (8 a frame) and one outline material for plain, skinned and batched hulls (20 a frame).
- **Fix:** a getter for `colorTexture` on BatchedMesh's prototype (`render/threefixes.js`); a depth material a kind of caster
  (`render/shadowkinds.js`); a batch and a skinned hull draw a view of their material (`render/materialview.js`).
- **Measured after:** 0 program checks a frame in the workshop; 731 KB of garbage a frame (was 1,128), the Dunes 641 (was 943); the
  same frame drawn by both trees differs no more than one tree from itself (0.40% of pixels against a floor of 0.50%).
- **Rule:** 256.

### 2026-10-22 · The garden's small life compiled two programs and checked them every draw (Calissa; measured by Petra)
- **Seen:** by measure, `npm run perf`: late compiles in the garden 21, was 17, `garden-life` among them twice. Petra's probe: the two
  programs' cache keys differ in one bit, flipSided.
- **Cause:** three 0.170's renderObject draws a material that is transparent and DoubleSide, without `forceSinglePass`, twice (its back,
  then its front), setting `needsUpdate` at each switch: two programs, and two program checks every draw, every frame.
- **Fix:** `forceSinglePass: true` on the small life's material (vfx/garden/gardenlife.js), and on every transparent DoubleSide material of
  ours whose draw order cannot matter: additive ones, and the Heavenly Kiln's flat vortex (11 in vfx/).
- **Rule:** 257

### 2026-10-22 · The Weir's, the Dunes' and the skiff's help were never said (Petra; found by QA-A's first hour)
- **Seen:** by QA-A, headless: about 12 game minutes in the Dunes with neither line in the log. The rod's keys were found from the Esc
  page after 45 s.
- **Cause:** `Basement.update()` returned at its first line whenever the Courier was outside the basement, and the place's help
  (`room.help`) was chosen at its end. The Weir, the Dunes and the skiff are never in the basement, so they could never be reached.
- **Fix:** the choice is its own method (`placeHelp`), asked on both paths (world/basement/basement.js). The Siege's sign no longer says
  its help a second time.
- **Rule:** 258

### 2026-10-22 · The agent's keys never reached a window, and the skiff's speed filled the bus (Petra; found by QA-A)
- **Seen:** by QA-A: the Index's window, once open, could not be closed through the bridge, and the world stayed paused behind it for
  the rest of the run. On the skiff, the bridge lost every event older than about 5 real seconds.
- **Cause:** `press` put the key in the input's set only, and the windows (the Index, the kiln, the Box) listen for the page's own
  `keydown`. `skiff.tick` was emitted every fixed step (60 a real second), and the bus keeps the newest 300.
- **Fix:** `press` also dispatches the key as the page's keydown and keyup (src/agent/agent.js `domKey`). The skiff sends its top speed
  four times a real second (`tickOut`).
- **Rule:** 259; 260

### 2026-10-22 · "You slash 2 slip jellys." (Petra; found by QA-A)
- **Seen:** in the log, at QA-A's first fight.
- **Cause:** tracking.js's `plural` added an "s" to every word.
- **Fix:** a consonant's y becomes "ies" (jellies); the Shrine's line says "made whole", the glossary's words, never "reforged".
- **Rule:** 261

### 2026-10-22 · An islet's shallows drew black wedges over the sea (Calissa)
- **Seen:** headless, the open sea at a game noon: round the atoll and the sandbar, black bands across the shallows ring's outer part,
  cut along its triangles, on the far side.
- **Cause:** the ring's per-vertex alpha was `0.6 * (1 - t) ** 1.6`, with t the vertex's distance across the ring; at the rim float error
  put t a hair past 1, and a negative number to a fractional power is NaN. Every triangle touching a NaN vertex drew black. Proved by
  swapping materials on the ring: a uniform opacity drew clean, the vertex alpha drew the wedges; the draw order and the frame's alpha
  changed nothing.
- **Fix:** t clamped to 0..1 before the power (vfx/opensea/isletlooks.js `shallowsGeometry`).
- **Rule:** 262

### 2026-10-22 · A hull glaze fired at the kiln never showed on the Solar Skiff (Dovina found it)
- **Seen:** reading the code for SKIFF-TUNING.md: a glaze fired on the hull at the kiln's HULL tab is laid on the hull's material once,
  and the board rides in its painting all the same.
- **Cause:** the board's stakes (`applyStakes`, courier/skiff/boat.js) set the hull's colour and roughness every frame from a constant
  (white, 0.7) and wore it from there; `glazeHull` had set them once, and the next frame took them off.
- **Fix:** the hull at rest is kept as `glazeHull` leaves it (`hullRest`, again at every `skiff.glaze`), and the stakes wear it from
  there.
- **Rule:** 263

### 2026-10-22 · Closing a Shrine's page left you sealed in its gate, a second F to get out (Petra, from Dovina's sweep notes)
- **Seen:** F on a Shrine's page (its own "F closes") shut the page, and the Courier sat on as the Pneuka Jar in the gate with nothing
  open; a second F unsealed. The emocean sweep had written around it (`C.unseal('test')`, "F closed the page but you sit sealed"),
  while the dunes and workshop sweeps' comments said "F unseals: the page closes with it".
- **Cause:** the page pauses the game, so the index menu took that F and the cradle never saw it; a cradle closed its page on unseal,
  but nothing unsealed it when its page closed.
- **Fix:** a cradle may name its page (`page()`, world/cradles.js): shut, by F or Esc, it unseals the next frame. The Shrine's gate
  names its page or the arch's walk-in; the helm's cradle at the pier names the pier's page or the sea chart.
- **Rule:** 264

### 2026-10-22 · The crawl's clip turned in place against a wall, the body slid back (Calissa's prone note)
- **Seen:** crawling head-on into a wall, the arms and legs kept crawling a moment while the body did not move, and the body was pushed
  back from the capsule.
- **Cause:** the prone capsule is upright and 0.27 m round, while the body on the belly reaches 0.95 m ahead of its axis; the capsule
  crawled on after the head met the wall and the crawl's clearance slid the body back as it went. Measured at a flat wall: the capsule
  stopped 0.75 m off it, the body slid 0.197 m, the clip turned 0.23 of a cycle in place.
- **Fix:** `crawlReach` (courier/player.js): a ray along the move just over the step height, as long as the body reaches that way, takes
  the move into a wall away. After: stopped at 0.96 m, slide 0, 0.05 of a cycle; a 0.35 m step is still climbed; stress 0 violations.
- **Rule:** 265

### 2026-10-22 · Space just before the get-up's end did nothing; the psygun handed back after the belly holstered a second later (Calissa's crouch-jump note)
- **Seen:** read in code by Calissa, measured headless: Space pressed two frames before getting up off the belly ended gave no jump;
  the psygun drawn again by the prone holster put itself away about a second after, if it had idled before lying down.
- **Cause:** the get-up zeroed the jump buffer on any press while it played (the belly's "Space gets up" rule caught the rise too), and
  its timer ended a frame late on a 1e-17 float residue; the belt's draw of the psygun left its idle clock running from before.
- **Fix:** while getting up the press waits in its 0.12 s buffer and jumps at the end (player.js `rising`), the timer clears below 1e-6;
  the belt's draw starts the psygun's idle clock over, as X does. Measured after: 1 jump, at the get-up's end; idle 0.6 s a real second
  after the hand-back, still drawn at 2.5 s.
- **Rule:** 266

### 2026-10-22 · A ledge hang flung the Courier at 89 m/s (the stress test, seed 1)
- **Seen:** the stress test's run 11 on the ground floor: tech `hang`, the Courier grounded on the floor, horizontal speed 90 m/s, then
  52.9 m/s and -72.8 down; three props broke under the ledge in the same tenth of a second.
- **Cause:** the hang holds its spot by a velocity of 12 times the distance to its grip, with no bound; the body was about 7.4 m from the
  grip (the ledge's props broken, the body on the floor) and the hang still held.
- **Fix:** `hold()` (courier/moves/hang.js): farther than 1.5 m from the grip after the catch's first 0.3 real s, the hold is lost and
  the hang lets go; the pull is capped at 10 m/s. Stress after: 0 violations on seeds 1, 2 and 3.
- **Rule:** 267

### 2026-10-22 · A zandatsu aborted the page in Rapier (the stress test, seed 3)
- **Seen:** `RuntimeError: unreachable` in Rapier's `setEnabled`, from `SlipJellies.vanish`, called by blade mode's queued cut.
- **Cause:** the zandatsu queues the jelly's vanish 0.16 real s after the cut; the raid, the nursery and the cavern dispose live jellies
  (their bodies and colliders removed) without marking them dead, so the queued vanish touched a freed collider. Read in the code and
  the stack; which of the three freed it in this run was not traced.
- **Fix:** `dispose` marks the jelly dead, and vanish, take and burst return on a disposed one (creatures/jelly/slipjelly.js). Seed 3
  after: 21,600 ticks, 0 violations.
- **Rule:** 268

### 2026-10-22 · Reached the Dunes never came, the first path's sixth step (QA-C, a STORY hour)
- **Seen:** a fresh STORY save in the Dunes from minute 12 to 60 of play, and Reached the Dunes (pl6) never done; Pip still pointed at
  the Dunes at minute 22.
- **Cause:** the ledger's area time was written under the place's name as the log says it, `time.area.Dunes`; the header of
  tracking.js and all three readers (pl4, pl5, pl6) ask `time.area.dunes`.
- **Fix:** the key is written in lower case (feedback/tracking.js). Measured: 4 s in the Dunes, `time.area.dunes` 4, pl6 done.
- **Rule:** 269

### 2026-10-22 · A digit picking a talk's choice also turned the psygun's cylinder (QA-C)
- **Seen:** in a talk, 1 to 9 chose a line and the cylinder turned to that chamber (`psygun.turn`).
- **Cause:** the psygun reads the digits for its chambers before the dialogue reads them for its choices (main.js's order), and neither
  spends them.
- **Fix:** the psygun leaves the digits alone while a talk is open (tools/psygun/weapon.js). Measured: Digit2 on Saggar's five choices,
  0 turns.
- **Rule:** 270

### 2026-10-22 · A helm cradle's imprint floated off its hull (Calissa; seen by Petra)
- **Seen:** Petra, wiring the helm cradles at the pier: the imprint burned at the moored hull's helm drifted about 8 cm against the hull's
  bob, stayed where the hull had been when another was moored, and hung over the water when the hull was hidden.
- **Cause:** `SealImprints.burn` (vfx/sealimprint.js) set the imprint once at the cradle's world point and added it to the scene: right for a
  Shrine's cradle, which never moves, wrong for one on something that does.
- **Fix:** `place()` sets it on its cradle at each burn, and a cradle with an `anchor` (the helm's CradleLook group) carries it as a child,
  attached at the same world place (`attach` keeps the world transform), so it bobs and hides with the hull. Measured in node on a scaled,
  turned hull: placed and faced exactly, its world scale kept, the 8 cm bob followed, hidden with the hull.
- **Rule:** 271

### 2026-10-23 · Celestial mode's dot read as "a little buggy" (the owner, through Dovina)
- **Seen:** the owner: a dot's mark was hard to see and hard to land.
- **Cause (read in the code, not seen in play):** the mark was a vermilion glyph in the world, under the paper's CSS sepia, so its red
  washed out with everything else; and a dot reached 14 px past a thing's on-screen size, a few pixels on a far clapperjar.
- **Fix:** what a dot can mark is handed each frame to the layer over the paper (Calissa's `CelestialTargets`: its ring, your seal when
  marked); a dot lands inside a drawn outline, else on the nearest within 28 px of one (tools/soulbrush/techniques.js); hurtable creatures
  within 16 m are markable and carry prompts (sigils.js). Measured: a dot 20 px past a slip jelly's ring marks it, 60 px past does not;
  its two prompts popped strike it once, 8 hp to 6.
- **Rule:** 272

### 2026-10-23 · X drew nothing when the psygun was made the main over a drawn tool (Petra, building main and sub)
- **Seen:** headless, the Dreamvane drawn as the main, the psygun made the main, X at once: the gun stayed on the back
  (`drawTarget` 0, `manualHolster` true), and Q (Fan the Hammer) after it did nothing.
- **Cause:** two halves. The belt's X stowed whatever `inHand` named first, and the Dreamvane, still going back, was it. And the
  psygun counted any tool with `drawT > 0.02` as out (`belt.others`), so a draw asked while the last one was going back was cancelled
  the same frame (weapon.js); every other tool waits for the hands with `mayDraw`.
- **Fix:** X acts on the main first: out or asked, it goes away; otherwise it is drawn, and the draw puts the rest away (tools/belt.js
  keys). The psygun counts a tool as out only when it is asked out (`wants`) and waits for the hands like the rest (`mayDraw` in
  updateHolster). Measured: the same sequence, the gun drawn in 1 real s, the fan's three shots on Q.
- **Rule:** 273

### 2026-10-23 · A pushed commit broke the build though the gate line ran before it (Calissa, the lend gestures)
- **Seen:** 87c5be32 pushed a syntax error (a row's comma swallowed by a trailing comment) to `claude/calissa-art-cups`: `npm run check`
  printed `check: FAILED`, and the commit and push after it ran anyway.
- **Cause:** the gate ran as `npm run check 2>&1 | tail -1 && git commit ...`: a pipe's status is its last command's, and `tail` succeeds,
  so the `&&` chain never saw the failure.
- **Fix:** 9bbf3cb2 put the comma back; check and build passed, pushed. The gate is now run with `set -o pipefail` (or unpiped).
- **Rule:** 274

### 2026-10-23 · Stress seed 4: the Courier fell out of the basement to killY (Petra, the main-and-sub round's stress run)
- **Seen:** `node scripts/stress.mjs --seed 4`, run "#6 on cog1": `courier.respawn` 'fall' at (54.5, -100.4, -86.0), the only violation
  in 24 runs.
- **Cause (measured, a per-tick trace with a watcher on the Courier's position):** at tick 209 the Courier jumped 29 m in one step, from
  `Course.teleport` called by the god hand's PORTAL (`godhand/powers/space.js`). The fuzz had opened a portal earlier in the run; its far end
  lay at y -17.0, 3 m under the basement's floor (-14), and the Courier was set down at the end plus 0.2 m with no floor looked for, so
  they fell from (43.9, -16.8, -78.2) to killY. Not main and sub.
- **Fix:** the Courier comes out on the floor found under a point a step past the far rim (a ray 2 m above the end, 5 m down, solid and
  facing up); with none, or the ray begun inside a wall, they are not taken through (`floorBeside`, space.js).
- **Rule:** 275

### 2026-10-23 · The pause menu came up over a held lock after the Throwing Room's Index pick (Dovina's workshop sweep, headless)
- **Seen:** about one run in two of the workshop sweep, the Spray drill's taps landed on the pause menu: overlay up, input off, the
  pointer locked. Once each on the codex and tuning windows' Esc/Tab closes.
- **Cause (measured, every lock request, release and change logged with its caller, 24 picks):** the Index releases the lock as it
  opens (no pause: a window is up). The pick closes it, and its `onClose` asks for the lock back in the same frame as a retry left over
  from an earlier refusal (input.js lockError) and the plain fallback: three requests at once. One is refused, and Chromium then fires a
  `pointerlockchange` that still reads unlocked. `onLockChange(false)` took it as you leaving and paused; the request that won took the
  lock a moment later, under the pause. 3 picks in 24.
- **Fix:** a `pointerlockchange` that leaves the lock as it was is not passed on (core/input.js). Measured: 0 pauses in 48 picks, the
  lock held again after each. Dovina's sweep note and its clearing of the pause can go.
- **Rule:** 276

### 2026-10-23 · The laid spread was not recounted while the Pneuka Box's window was open (the reading view's probe, headless)
- **Seen:** with the Box's window open and the Box turned over, the reading view stayed at k 0 and built no positions over 5 ticks; a
  card laid from the window would not have moved the board or the tallies until the window shut.
- **Cause (measured, the view's state logged a tick at a time):** `tick` returns at its top while `modalOpen()` (the Codex, the Index,
  the map, the Box's window ...), before the world's updates. `laidSpread.update` (f5f90f3) sat with the world's, so the window it serves
  never saw it run.
- **Fix:** the modal branch updates the laid spread and the reading view too (main.js). Measured: the view opens in 0.7 real s, its
  positions built and picked, the cloth lit as the face (10 cells of 10).
- **Rule:** 277

### 2026-10-23 · A boardslide played with the board along the rail (Calissa, read from the code)
- **Seen:** a boardslide's board stayed along the rail instead of across it, and the rider's new boardslide stance (grabreach.js) twisted
  about 72° toward a rail running along the board.
- **Cause (read, then measured by Calissa's builder with the patch applied headless):** `slideYaw` (±π/2 for a boardslide) is composed
  into the heading's quaternion, but every grind step copies the rail's up (`railUp`, skiff.js), and the grind branch then sets the unit's
  rotation whole from the rail's frame (`setFromRotationMatrix`), dropping it. On every rail, not only the coaster's.
- **Fix:** the quarter turn is multiplied back on after the rail's frame (skiff.js). With it, the board lies across the rail and the rider
  faces down it (the builder's headless check); not run again here.
- **Rule:** 278

### 2026-10-23 · A card held over an empty place of the reading view was not laid (Dovina, measured headless)
- **Seen:** with a card picked, a click in the middle of an empty place of the reading view did nothing; the same probe had laid a card
  while the cards were still flying in.
- **Cause (measured):** an empty place is drawn as a hollow frame (`frameGeo`, four thin strips, vfx/readingview.js), and the frame
  itself is the pickable; `readingScene.pickAt` at the place's anchor (its middle) returned null, while a scan on an 8 px grid found no
  strip once the cards had settled. Mid-flight the strips happened to cross the grid.
- **Fix:** pneuka/underside.js `nearPlace`: a held or dragged card that touches nothing goes to the nearest place within 40 px of the
  point. Checked headless: the Priestess picked from the bar, laid in the Past by a click at its anchor. A solid pickable behind the
  frame came after (Calissa, 9edac754): `pickAt` at the middle of an empty place now returns it; the fallback stays for a near miss.
- **Rule:** 279

### 2026-10-23 · Two console errors at boot from the spread's achievements (Petra, read from the page)
- **Seen:** at boot, `achievements: "sc1" is in the sub "The Spread", not in CATS`, twice.
- **Cause (read):** sc1 to sc3 (SPREADS.md 11) were added under GENERAL's new sub "The Spread" without adding it to `CATS`; the load
  guard (achievements.js, after R57) caught it and pushed the sub itself. Nothing was hidden; the console was dirty.
- **Fix:** "The Spread" added to GENERAL's subs in `CATS`. Importing achievements.js now logs no error.
- **Rule:** 280

### 2026-10-23 · The Lockheart drank 0.8 of overflow whatever the stone (Petra; Dovina found it with the palm die)
- **Seen:** the stones' rows give the Lockheart's share of overflow by stone (the Maker's 0.8, onyx 1, amethyst 0, with amethyst's
  bleed 1), but on onyx and amethyst the coffin drank as on the Maker's; the palm die (progress/dice.js) reads the row, so the two
  disagreed on what was left.
- **Cause (read):** lockheart.js's overflow hook fed a constant `e.amount * 0.8`; nothing read `overflow.lockheart` until the palm die.
  Onyx's and amethyst's overflow trades were written and never wired.
- **Fix:** the hook feeds the worn stone's `overflow.lockheart` (stones.js `stoneOf`). Measured headless, the Lockheart worn, 50 of
  overflow: the Maker's 40 to the coffin and 10 to the palm die; onyx 50 and 0; amethyst 0 and 0.
- **Rule:** 281

### 2026-10-23 · The reading view's class card always showed the Fool (Calissa; Petra and Dovina found it)
- **Seen:** whatever was laid, the class's card behind the Courier stayed the Fool; and had a Major been read, 'arcana.emperor' would
  have drawn the Page of Cups.
- **Cause (read):** vfx/readingview.js read `laidSpread.court`, renamed `laidSpread.class` in ac35a3d while the card was built on the
  old name (the two commits crossed); `?.` turned the missing field into null, so the Fool. `classCell` split ids on the dot and took
  'arcana' as a court's rank.
- **Fix:** it reads `laidSpread.class`; an `arcana.<card>` id is a Major by its number; a Major's tint is the suit it `lifts`.
  Measured headless: a Celtic Cross reads `arcana.justice`, cell 11; 'arcana.emperor' 4; 'queen.wands' 76.
- **Rule:** 282

### 2026-10-24 · The god hand's matter met the ground in a sawtooth along its 0.5 m cells (Calissa; Dovina's handoff of 2026-10-13)
- **Seen:** from the god hand's camera, a heap of the island's matter ended on the authored ground in stair-steps half a metre a tread,
  chamfered on one diagonal; the colour lip softened the colour, not the shape.
- **Cause (read):** godhand/islandmatter.js `redraw` wrote each vertex all or nothing: a cell under `FIELD.show` (2 cm) had its vertex
  dropped 12 cm under the authored ground and its vertex alpha 0, a cell over it alpha 1; the alpha test (0.5) therefore cut every
  edge triangle at its midpoint whatever the thickness, so the outline followed the grid and its triangles' diagonals, and the skin
  dived into the ground before it was cut (a cliff, not a foot).
- **Fix:** the vertex alpha is the thickness itself, `0.5 + (a - show) / FIELD.edge`, unclamped, so the cut falls where the
  interpolated thickness crosses 2 cm; an empty cell beside matter on level ground (its base within `FIELD.step`, 25 cm, of the
  neighbour's) lies on the authored ground instead of under it, so the skin ramps down to the ground and is cut there (beside a wall
  or a crate it still dives, as before). matterlook.js lets the cut wander by the atlas's wide pooling under the lip, so a heap's foot
  feathers out in lobes. Seen headless from the same god hand camera in the workshop: /tmp/matteredge/shots/02-before-close.png
  (the treads) and 02-after-close.png (a smooth, lobed foot).
- **Rule:** 283
### 2026-10-24 · A possessed portal threw a rider back forever (Dovina, in the build)
- **Seen:** headless, a haunted race on a made track with a portal pair held red: the rider reached the first eye, was sent back
  60 m, rode into it again and was sent back again, lap after lap, never past it.
- **Cause (measured):** the send-back put the rider on the line before the eye, on the line, at speed; nothing remembered it had been
  sent, so the eye caught it on every pass. A trap with no way past is a wall, not a trap (TRACK-EDITOR.md 4).
- **Fix:** a rider sent back is spared that portal (`spared`, world/raceway/traps.js) until it is past the eye; the possessed line
  says so (`TRAPS.portal.possessed`). Measured: the rider was sent back once and finished.
- **Rule:** 284

### 2026-10-24 · A portal's warp stalled the skiff and refilled the pool (Dovina, in the build)
- **Seen:** after a portal carried the rider on, the Solar Skiff stood still for a beat with its techs ended, and the pool was full.
- **Cause (read):** the warp used `course.teleport`, which (rightly, rule 202) puts back the state of a Courier set down: it ends the
  techs and refills the pool. A warp mid-ride is not a setting down.
- **Fix:** the warp moves the rider itself (position, previous and render positions, yaw, the skiff's heading and speed) and calls
  `player.place()`; the race's gates and `prevS` are moved with it (`race.warp`).
- **Rule:** 285

### 2026-10-24 · The track editor showed a flat dark red (Dovina, headless)
- **Seen:** the editor's panel drew, the world behind it was one flat colour, no lot, no line.
- **Cause (measured):** the editor's camera hung 376 m from the lot; the house camera's far plane is 200 m (main.js) and the Dunes'
  haze is exp2 at 0.0042 (all but opaque past 250 m). The haunt's camera, at 80 m, drew fine.
- **Fix:** the editor's camera keeps 40 to 170 m up; the panel draws the whole lot as a map (click to move the camera); the line's
  ribbons and the editor's handles take no fog.
- **Rule:** 286

### 2026-10-24 · The fishing line and the grapnel's line sagged when loaded, and the line's width grew with the camera's distance (the owner; Calissa, measured)
- **Seen:** the owner (ANGLING.md): "the Sondelass's fishing line being visually loose and sagging even when hanging from a grapnel
  overhead". Measured in node on `FishingLine` itself (vfx/rope.js under angling/line.js, 240 frames at 60 Hz, a 12.15 m line, the
  camera about 9 m off): loaded in the sweet band (tension 0.55) the line hung 1.47 m off the straight between tip and hook, at 0.78
  1.46 m; only at 1.0 was it straight. The grapnel's line in flight (20 m, tension 0.7, no slack told) hung 3.54 m low. Hung from
  overhead with `slack: 0` it was straight (the 2026-10-11 fix held). The line drew 6.7 px wide at 480 lines here, and its width rose
  with the square of the camera's distance (about 3 px at 4 m, 11 px at 15 m).
- **Cause (measured):** two.
  - **The shape was the solver's, not the length's.** line.js asked for a sag from the tension (`(1 - T) (0.05 + 0.045 d)`, 0.13 m at
    0.78), which made only 2 mm of spare line on 12 m; rope.js straightened a rope only when its spare length made under 3 cm of sag,
    so the 36-link chain, held by 7 passes of its constraints, was left to hang: it stretched under its own weight to a belly eleven
    times what its length allowed. A line with no slack told at all (the grapnel in flight) did the same.
  - **The width was scaled twice.** line.js passed a radius already grown with the camera's distance (`camDist x 0.0034`), and the
    rope grew each point's radius with its own distance again on top of it (`radius / this.radius`).
- **Fix:** rope.js: the caller tells the slack (m beyond the span); at none the rope is laid straight and not simulated; it is a chain
  only while there is real slack, drawn eased to the straight by `straightness = smoothstep(slack, 0.3, 0)` (the drawn points, not the
  simulation, so a sag builds), and its belly is capped at the sag its spare length makes (`e = 8 s^2 / 3 d`). line.js: an untold line
  has no slack once loaded (eased tension 0.3 up), its bow (W in a fight) adds some; its width is a pixel count at the render's lines
  and the camera's fov, scaled once (2 px a hair, 3 px with a fish on). Measured after, the same runs: in the band and at 0.78, 0 mm;
  the grapnel in flight 0 mm, hung 0 mm (slack 0 and 0.02 m); a limp line (0.2) 0.64 m; bowed with 0.6 m of slack 1.65 m (the sag
  0.6 m allows); widths 2.00 px, 3.00 px with a fish on, the grapnel's 3.27 px, at every distance.
- **Rule:** 287

### 2026-10-24 · A track code could never be pasted (Dovina, measuring the code's size)
- **Seen:** the editor and the race board told you to paste a track code with `/edit code <code>`; a bare made track's code is about
  600 characters, one carrying its maker's ghost about 3,600.
- **Cause (read):** the chat line's input is `maxlength="200"` (feedback/gamelog.js), so the paste was cut short and its check failed:
  "That is not a track code." every time. Headless tests loaded codes through `trackEditor.load` and never through the chat line.
- **Fix:** the editor's Load code opens a box of its own in its panel, with the clipboard's Paste (a phone's way too); the race board's
  Load a code opens it; `/edit code` is gone from the help.
- **Rule:** 288

### 2026-10-24 · Sound gone after an iOS interruption or a hidden tab (Wanda, from Dovina's mobile audit)
- **Seen (read, not yet on a phone):** the audit (`docs/plans/research/MOBILE-AUDIT-PERF.md` 4) found nothing to resume the audio context
  after a call or Siri on iOS (state `interrupted`) or a tab hidden and shown again; the 50 ms schedulers run on throttled timers meanwhile.
- **Cause (read):** `sfx.unlock()` resumed the context only on the title's click; nothing else asked again.
- **Fix:** audio/core.js `recover()`: a hidden page suspends the context and a visible one resumes it; any state but running resumes
  after a quarter of a real second, and if the browser wants a gesture first, on the next touch, click or key. The schedulers read the
  context's clock, so the suspended stretch is skipped. Checked headless: suspended, resumed by itself.
- **Rule:** 289

### 2026-10-24 · No QAIS test ever gathered evidence (Petra, writing v265's tests)
- **Seen:** every QAIS test in the db (T197 read back: `"watch": "duel.flee"`) names its event as a string, and every `seen` list is
  empty, however often the owner played the thing.
- **Cause (read):** debug/qais/evidence.js listened only for `watch: { event, match? }` (`t.watch?.event`); a string has no `.event`,
  so no test was ever listened for. The writers (Petra's and the divisions' test files) wrote the name alone from the first round.
- **Fix:** `watchOf(test)` reads either shape (a name alone is `{ event: name }`), and the listener keeps the match beside the test.
  Checked in node: a string watch heard twice, an object's match heard only when it matches, an empty or a passed test not listened for.
- **Rule:** 138

### 2026-10-24 · DASH on a pad never dashed in the air after a sprint (Petra, reading the on-foot input for M2)
- **Seen (read, not yet played):** the pad's sprint latch (L3) holds Shift and keeps it once held, into a jump; the dash button is also
  Shift. In the air, the dash button changed nothing: no air dash. Touch's DASH tile (M2) would have done the same under the stick's sprint.
- **Cause (read):** core/input.js `hold` counted a code's holders and never pressed a held code twice, so the dash button's Shift, under
  the latch's, gave no `wasPressed('ShiftLeft')` (player.js's `dashBuf` and the Dodge latch read only the edge). On a keyboard the player
  lets Shift go and presses it again; a latch cannot be let go of mid-air.
- **Fix:** `hold(code, on, edge)`: a control a person pressed (core/actions.js `press`) gives its key's edge even while another holder
  holds the key; a holder's own state (the latch, a stick's keys, the skiff's touch keys) still never presses twice, and the count of
  holders is as it was. Checked in node: the latch's first hold an edge, a second state hold none, a person's press an edge, the key
  down until both let go.
- **Rule:** 290

### 2026-10-24 · A two-finger tap never undid in the garden (Petra, the M1 probe with real touches)
- **Seen:** in the M1 probe (CDP touches, a phone's 844 x 390 view), two fingers tapped together in the Spirit Garden left the undo
  list as it was (1 then 2 with the probe's entry, still 2 after). In node, with `update()` called by hand, the same tap pressed Ctrl+Z.
- **Cause (measured):** the cursor earns the tap's Ctrl+Z when the fingers lift and makes it in its next `update()`, but by then no
  finger was down and its mode was cleared, and core/touchdriver.js called `update()` only while `fingers.size || mode`. The press was
  owed and never made. The one-finger tap escaped only because its mode stays `done` until its LMB is let go.
- **Fix:** `TouchCursor.busy` (a finger down, a gesture under way, a tap's LMB or a two-finger tap's keys still to press or let go),
  and the driver calls `update()` while it is true. The probe: the two-finger tap undoes (2 to 1), 10 of 10.
- **Rule:** 291

### 2026-10-24 · The rod's and the hook's touch rows never resolved (Petra, wiring M3's driver)
- **Seen (read, then measured):** with the rod or the hook in hand, `actions.live()` held `tool.cutlass`, so on touch the rod's CRANK,
  PING and LURE tiles (core/bindings.js, ctx `tool.rod`) resolved to nothing, and the cutlass's SPECIAL swipe would have taken the rod's AIM.
- **Cause (read):** core/actions.js read the form as `belt.inHand.form`; `inHand` is the belt's adapter (tools/belt.js techTool), which
  had no `form`, so `t.form || 'cutlass'` was the cutlass every time. A reader of a wrapped thing gets `undefined`, never an error.
- **Fix:** the adapters carry `tech` (the tool behind them) and the Sondelass's `form`; core/touchtools.js reads the tool's state
  through `tech`. Measured in the M3 probe: the cutlass's ctx with the cutlass, the brush's, the Veritome's, the psygun's.
- **Rule:** 292

### 2026-10-24 · An aberrant clapperjar's copy would not compile (Calissa, the aberrant's look)
- **Seen (measured, headless at boot):** `THREE.WebGLProgram: Shader Error ... 'GREY_REF' : undeclared identifier` on `material-aberrant`,
  the look's copy of a clapperjar's material made for the boot's warm-up.
- **Cause (read):** the copy was made with `clone()`, which resets a Standard material's defines; the grey tint's hook
  (vfx/greytint.js) reads `GREY_REF` from them. The inversion's copies (vfx/aberrantinvert.js) had the same fault, unseen only because no
  clapperjar had turned aberrant yet.
- **Fix:** both copies carry the original's defines (`k.defines = { ...m.defines }`, as `cloneTinted` does). Measured: the same boot,
  no shader error.
- **Rule:** 72

### 2026-10-24 · Every clone of a reading view card encoded the house deck to a JPEG (Petra, measuring a phone's boot for the iPhone)
- **Seen (measured):** at boot, 28 canvases were turned into data URLs, 66.1 Mpx in 1,337 real ms on a desktop's CPU, 8 MB of strings;
  14 of them each the house deck's 2048 x 2304 atlas, with three.js warning "Image converted to jpg for performance reasons".
- **Cause (measured):** three.js's `Object3D.copy` deep-copies `userData` as `JSON.parse(JSON.stringify(userData))`. The reading view's
  card keeps its face, edge and edge material there (vfx/readingview.js `cardMesh`), and `buildFall` clones the back 14 times: each
  clone serialized the meshes, their materials and textures, and each texture's canvas into a data URL, then threw it away (the
  clone's userData is set right after).
- **Fix:** render/threefixes.js USERDATA COPY: a userData that keeps a three.js object is copied as JSON copies plain data, and the
  object is kept as itself. Boot: 14 data URLs, 0 Mpx, 10 ms, 0.1 MB. The reading view flips with its 14 falling cards.
- **Rule:** 293

### 2026-10-24 · The basement's labels kept 51 MB of canvas a phone had no use for (Petra, measuring a phone's memory for the iPhone)
- **Seen (measured, the built game as a phone, 844 x 390 at DPR 2):** 252 canvas textures held 137 MB of canvas beside their GPU copies;
  162 of them the basement's sign tablets (world/basement/basement.js `labelTexture`), 512 x 160 each, 50.6 MB.
- **Cause (read):** a CanvasTexture keeps its canvas as its image for the texture's life, and a label is drawn once: after the upload
  the canvas is a second copy of pixels nothing reads. Eleven texts were drawn twice.
- **Fix:** render/bakedcanvas.js: a baked canvas texture lets its canvas go once three has uploaded it (`onUpdate`), drawn again only if
  its image is asked for. The labels are baked, one texture a text, at the graphics tier's `labelScale` (High 1, Low and Minimum 0.5).
  Measured before and after on the same machine: the page's process 644 to 542 MB at boot, 682 to 586 at the Raceway; canvas 139 to
  88.5 MB; textures 190 to 138 MB.
- **Rule:** 294

### 2026-10-24 · A stone's reach was read by nothing (Dovina, reading the stones for the dice; fixed by Petra)
- **Seen (read):** progress/stones.js gives every stone a `reach` (amethyst 0.8, onyx 0.85, moonstone 1.3 by night and 0.9 by day, a
  ruby's 1.5), and its header says it "multiplies the bauble magnet's radius"; courier/lachryma.js pulled baubles in at
  `T.lachryma.magnetRadius` (3.2 m) whatever stone was worn. No file read `reach`.
- **Cause (read):** the stones reach the pool through one modifier (`modifier(id, { night })`, handed to `addModifier('stones', ...)`),
  and the modifier carried the pool's numbers only; the bauble magnet asked the config, never the pool.
- **Fix:** the pool's modifiers carry `reachMult` (courier/lachryma.js's header), and the bauble magnet's radius is
  `magnetRadius x product(reachMult)`: 1 with none, 0.8 with amethyst's. The stones' `modifier()` sets it from the stone's reach and
  the phase's (progress/stones.js, Dovina's line), so a stone changed or night falling changes the reach with the pool's other numbers.
- **Rule:** 295

### 2026-10-24 · Three achievements no one could earn (Dovina, scripts/reachable.mjs)
- **Seen:** the new reachability probe ran every achievement's own predicate against a ledger with every written key full: Elegant
  (fl9), Feeding the Tree (my5) and The Crown (my6) stayed false.
- **Cause (read):** their keys are records, written with `L.hi` (`reprogram.q`, feedback/tracking.js; `myggdrasil.caps`,
  tracking/garden.js), and the predicates read them with `L.get` (`C`, `F`), which reads counters only. A record and a counter of one
  name are two entries; the read found the empty one.
- **Fix:** fl9 is an `H` (a best); my5 and my6 read `L.best('myggdrasil.caps')`. The probe: 726 of 727 earnable, the last one (lg5)
  reads the game's tech list and is earnable in play.
- **Rule:** 296

### 2026-10-24 · Three more achievements no one could earn (Dovina, `reachable.mjs --strict`, triaged by hand)
- **Seen:** with templated writes counted as nothing, the probe listed 234; read template by template, three were real: Toxic Symbiosis
  (oc3), Pilgrim (sb2), Every Kind (sb3).
- **Cause (read):** oc3 read `crude.route.entra.margarite`, but a route is keyed by the port a cask was bought at, and no port sells
  Entropolis crude (its casks are loot, keyed `convoy` or `pirates`). sb2 asked for 10 Seal Book pages when the game has six cradles that
  give one (four Shrines, two piers). sb3 asks for an engine cradle, and none is built yet.
- **Fix:** `crude.field.<field>.<island>` counted beside the route (tracking/voyage.js) and oc3 reads it; sb2's goal is 6; sb3 hidden
  until the first engine cradle (HANKO.md's Weir sluice).
- **Rule:** 297

### 2026-10-25 · The course never split after the Shrine's page (Dovina's basement sweep; fixed by Petra)
- **Seen (measured):** the basement sweep's four course checks failed on every tree: no splits, no lap, the log saying "You rest at
  the Shrine" twice. Replayed: after the Bisque Shrine's page was shut with Esc the Courier stayed sealed and hidden; `unseal(..., { now:
  true })` did nothing; travel to the Index landed them back in front of the Shrine, and the next F sealed them in again.
- **Cause (read):** shutting the page began the slow unseal (`phase 'out'`, the Jar's dismiss), and `unseal` returned at once while
  one was running, so `now` was ignored; when the out phase ended, `stepOut` teleported the Courier to the cradle's front, undoing the
  travel made meanwhile.
- **Fix:** world/cradles.js: `unseal(..., { now })` during the out phase ends it where the Courier stands; `stepOut` clears the seal
  before it sets them down. world/basement/basement.js `teleport`: a seal standing is ended first, in place. Basement sweep 403/4 to
  407/0.
- **Rule:** 298

### 2026-10-25 · The pool caps and the skiff's settings were never built (the main.js split's builder, read; fixed by Petra)
- **Seen (read):** in main.js, `game.skiffSettings = new SkiffSettings(game); game.poolCaps = new PoolCaps(game);` stood after the
  track editor line's comment (17b4e64, 2026-10-24), so neither ran: a cracked region capped nothing, and `/skiff invert` had no reader.
- **Cause (read):** the check's swallowed-code pattern (casebook 240) caught a call or a `const` after a comment, not a property set to
  a new thing, nor a swallowed line that ends in its own comment.
- **Fix:** boot/chat.js: the two on a line of their own; scripts/check.mjs's pattern widened (it finds the old line; 0 on the tree).
- **Rule:** 299

### 2026-10-25 · The game never loaded on the owner's iPhone (Dovina's probe on the owner's XR; fixed by Petra)
- **Seen:** on iOS 18.7 the published page showed its loading line and stopped; the desk and Android loaded the same build.
- **Cause (measured, Dovina's probe rows 0 and 7 to 13):** there the artifact host answers every supporting file 403 (`/_blob` 404),
  so `assets/game.js` and everything it imports never arrive; the inline page, the database, DecompressionStream, blob: modules and an
  import map laid before any module all work.
- **Fix:** the build carries no module tag (vite.config.js `loaderEntry`); index.html's loader asks `HEAD ./assets/game.js`, and when it
  is refused reads the build packed into the database (`scripts/pack.mjs`: gzip, base64, 190 000 characters a doc, collection `pack`),
  unzips each file into a blob, lays one import map of them all and imports the entry. Asset URLs are asked of the page at run time
  (`renderBuiltUrl`, `__ffFile`). Verified headless with every asset 403'd: boot to ready, 141 docs read, 1 import map.
- **Rule:** 300

### 2026-10-25 · The well's frame doubled (Petra's perf at v268; found and fixed by Calissa)
- **Seen (measured, `npm run perf`):** the Great Dunemaw's hall drew in 5164 ms against 2276 at fe20e89 (+127%, SwiftShader) with
  its triangles +2%; boot 100.6 s to 168.7 s. On one host, back to back (rule 4): v268 4465 ms settled in the hall, fe20e89 1886; the
  Courier hidden 1433 and 1419, so the Courier's eight MeshStandard parts cost 2.9 s against 0.45 s. The camera stands 1.58 m from
  the Courier in a hall, so the body fills the frame there; in the open it is small, which is why only the well moved.
- **Cause (measured):** the vessel's one finish program (vfx/finish.js, every kind behind a branch on `uFinKind`) took three new
  families of patterns in the round: the tool skins' (toolpatterns.js), the stones' minerals (stoneminerals.js) and the skins'
  (skinpatterns.js), about 650 lines of GLSL. SwiftShader runs every branch's code on every pixel; `uFinOn` 0 changed nothing (4450).
  Each stubbed out alone: skins 3075, tools 3387, minerals 3873; all three 2012; with the old kiln patterns too 1771. The compile of
  that program was most of the boot's growth (the shaders stage 40 to 72 s, the prime draw 21 to 36 s).
- **Fix:** vfx/finish.js: each family behind a define (FIN_KILN, FIN_TOOL, FIN_MINERAL, FIN_SKINPAT) set from what the finish wears
  now (`finFlags`) and carried in its program key; the material's onBeforeRender asks for a recompile when the flags move. Nothing
  worn, the lean program. Measured: 1753 ms settled, boot 60.5 s (fe20e89 60.4); every family worn at once compiled and drew clean
  (5 programs, no error) and went back. Perf, this host: the well 1637 ms, boot 61.7 s.
- **Rule:** 301

### 2026-10-25 · The aberrant Wisp and the palm die compiled in play (Petra's perf at v268; fixed by Calissa)
- **Seen (measured):** programs compiled after the warm-up 21 to 24: LW_Glow-aberrant, LW_Flame-aberrant (the Dunes' aberrant Wisp)
  and palm-die (the god hand's, in the Spirit Garden).
- **Cause (read, then measured):** `AberrantLook.prewarm` dressed each body's main part alone, while `hold` dressed every part of the
  same signature, the Wisp's glow and flame too; and those two have emissive maps (and the flame an alpha test) the signature did not
  read, so each was a program of its own. The palm die took its finish (`dressFinish`) on the first frame the hand was shown.
- **Fix:** vfx/aberrantlook.js: one `dressParts` for hold and prewarm, and `sigOf` reads every map and switch three keys a program by,
  so the glow and flame keep their own materials (the body wears the look: one program a kind, as the header says). The palm die's
  `prewarm()` (vfx/godhand/palmdie.js), called in boot/warmup.js. Perf: 20 compiled after the warm-up (the garden's own, as before).
- **Rule:** 302

### 2026-10-25 · On the iPhone the game loaded from the store, then its WebGL context came back lost (the owner's screenshot, v269; fixed by Petra)
- **Seen:** "The game could not start (main, 2.1 s): null is not an object (evaluating 'r.getShaderPrecisionFormat(r.VERTEX_SHADER,r.HIGH_FLOAT).precision')", from blob: URLs, so the store route itself worked.
- **Cause (read, not measured on the phone):** three.js reads a shader precision from the context as the renderer is made; WebKit returns
  null for it only from a lost context. The renderer was handed a context already lost: the likeliest reasons are memory (the loader
  had just unpacked all thirty files at once) or WebKit turning WebGL off for the page after an earlier crash.
- **Fix:** boot/renderer.js makes its own context (`CONTEXT_TRIES`): a lost one is given 1.5 real s to be restored, then a plainer one is
  asked for, and a refusal by all says what each try gave. The loader unpacks three files at a time, the biggest first, letting each
  file's strings go once it is a blob. Verified headless with the first context forced lost and every asset refused: boot to ready.
- **Rule:** 303

### 2026-10-25 · PRESS START would not take a tap on the iPhone (the owner, v269; reproduced headless on an emulated iPhone; fixed by Petra)
- **Seen:** the title came up on the phone, and tapping it did nothing.
- **Cause (measured on the emulated phone):** the title started on `mousedown`. The first press only woke the sound and changed nothing on
  screen, and the browser made no `mousedown` from the second tap (touchstart, pointerdown and click came; the compatibility mouse event
  did not), so the tap that should start was lost.
- **Fix:** title/ui.js starts on `pointerdown`; a touch wakes the sound and starts in one press. Verified: one tap, then the menu.
- **Rule:** 304

### 2026-10-25 · The map had no CLOSE on a phone in landscape (Calissa's board, map-board-v1.md E; fixed by Petra)
- **Seen:** on a phone held sideways the map opened with no CLOSE on screen, and its legend lay over its side panel.
- **Cause (measured headless at 844 x 390):** the map's top bar was one row that could not wrap, nine layer buttons and CLOSE last, so
  CLOSE stood past the screen's right edge; the legend's controls line ran the width of the screen into the side panel.
- **Fix:** the bar wraps (CLOSE on the second row, at x 582 to 678 of 844); the controls line moved to the help's map row. The map is
  drawn again only when what it shows changes, and its canvas let go when it closes.
- **Rule:** 305

### 2026-10-25 · The music too heavy for a phone's audio thread (Wanda, from the owner's iPhone XR: "audio lagging")
- **Seen:** the owner hears the audio lag on an iPhone XR; Petra could not measure the audio's memory headless.
- **Cause (measured, Chromium offline renders on this container's CPU):** not memory (every sound is synthesised: three AudioBuffers,
  1.9 MB: the effects' noise and two reverb impulses) but the audio thread's work. The overture took 128% of real time to render (it
  could not keep up on this CPU); 63% of it was the rhythm guitar, which built a whole amp (a 2x oversampled clipper and seven filters)
  for every chord on each side, 89 amps in 20 s. Typical cues took 10 to 35%, about 56 oscillators and buffer sources live at once,
  175 gains and 110 filters made a second. Every cue's start also made a fresh 3.2 s stereo reverb impulse (1.1 MB and its FFT) and
  left its old graph (its echo's feedback loop, its reverb) connected after the fade.
- **Fix:** music/rock.js: one standing amp a side (muted or open), one lead amp, one bass drive, made once a band and played into by
  every note (the overture 128% -> 47%). audio/core.js: a reverb impulse made once a length and shared; a cue's whole graph let go after
  its fade (arranger.js, player.js). On a phone (`sfx.phone`: the platform, or `?phoneaudio=1`): the mixer at 32 kHz with a balanced
  buffer, reverbs no longer than 1.2 s, at most 10 sounds begun in 250 ms, the heaviest instruments thinned (the rhythm guitar's saw
  alone, strings two players a note, the hum two voices, the supersaw three, the piano four partials on one string, the sitar its saw
  without sympathetic strings, the phase guitar dry, the crackle half its pops), and the arranger's notes made 0.45 to 1.0 s ahead.
  The heaviest cues on a phone now 20 to 39% of real time (from 31 to 58% at the desk's rate before).
- **Rule:** NEW:audio-amps-standing
- **Rule:** NEW:audio-graph-let-go

### 2026-10-25 · The page reloaded at "Done" on the seal's keyboard (the owner's iPhone XR, v281; fixed in part by Petra)
- **Seen:** title, DEBUG, the seal carving; a name typed and "Done" tapped on the iOS keyboard; the whole page loaded again.
- **Cause, as measured:** no code reloads there (the field is in no form; Enter only blurs it; the one `location.reload` is the title's
  mode switch). Emulated (iPhone XR landscape) the same steps keep the page. What a real iPhone adds is the keyboard going away: a storm
  of resizes, each a new drawing buffer and the glow's targets, in a tab already booted twice (picking the other mode reloaded the page,
  and on a new build the stored mode is often the other one). A page out of memory on iOS is reloaded by Safari. Not reproduced on the
  device: the measure is the next report.
- **Fix:** the mode switch is made in place when there is nothing to swap (core/save.js `switchFresh`: no progress stored, the other
  mode's shelf empty; a new build wipes both), so the first pick of DEBUG no longer boots the game twice; the render size waits 150 real
  ms after the last resize (render/present.js); the boot watch names the moment a killed tab was at after boot (`moment`: the title, the
  seal carving, typing, the keyboard put away, the dive), said on the next load.
- **Rule:** NEW:one-boot-a-tab

### 2026-10-26 · The graphics taken back on arriving at the Raceway (the owner's iPhone XR, v283; Petra)
- **Seen:** DEBUG loads and plays at 30 fps; the Index's THE RACEWAY row, and 0.3 to 2 real s after arriving the box says the device
  took the graphics back (twice, both in the field reports: 260 and 358 geometries, "about 107 MB of the scene's").
- **Cause (measured headless as the XR, scripts' census of the scene's geometry by mesh):** the park's ground was one vertex buffer of
  every sample of its 2.6 km (render/terrain.js: 1.12 million vertices, 30.7 MB, on the card and again in the page), although the camera
  draws only 513 m round it and the full detail within 90 m. Its setup also tested the levels 4.9 million times to size the index, a
  destructured array a test: 178 MB of garbage inside the arrival, beside the park's own build (Dovina's track and ground sampling,
  Calissa's dressing: the heap's peak 185 MB over its start in the dev build).
- **Fix:** render/terrain.js keeps vertices only for the chunks at a drawn level, each in a slot of a pool of its level's size, written
  when it changes level (the same triangles, positions and normals at every camera: compared triangle by triangle); the pools sized on
  81 cameras over the middle chunk; the levels indexed, not destructured. The park's ground 30.7 MB -> 1.9 MB of vertices; its garbage
  178 -> 26 MB. The Dunes' ground the same way. The builders' garbage and the rails' outline normals on a phone handed to Dovina and Calissa.
- **Rule:** NEW:memory-bound-by-view

### 2026-10-26 · The Raceway's looks' garbage on arriving at the park (the owner's iPhone XR, v283; Calissa, from Petra's measure)
- **Seen:** the same arrival as the case above; Petra's heap sampler (collected included, as the XR) put about 380 MB of it in my
  Raceway looks: the coaster cut's `test` 200 MB, the rails' glaze 102 MB, `painted` 26 MB, the cavern's `stone` 22 MB; and the rails'
  glaze, the park's biggest mesh (228k vertices), carried `smoothNormal` (2.7 MB) on a phone, where no hull is drawn.
- **Cause (measured, scratchpad probe: one trip workshop to park as the XR, the same sampler):** a string key built per cell, nine cells
  a vertex, over the whole rail mesh, with an iterator and `Math.hypot` a point (vfx/racewaypark.js `cutCoaster`); a BoxGeometry, a
  Matrix4, two clones and a merge per rail segment (vfx/racewaylooks.js `glazeRails`); the cavern's skin coloured once per triangle a
  point is a corner of (up to six) where once does (vfx/racewaycavern.js `skinGeometry`); `ensureSmoothNormals` with no hull to read it.
- **Fix:** the cut's grid keyed by a small integer, its test in indexed loops with squared distances, its kept corners in one typed
  array; the rails written straight into one set of arrays from six painted templates made once (the same vertices); the skin's colour
  worked once a point; the hull's smooth normals only where `mesh.userData.outline` exists (the rails, the cavern's roof). The three
  modules' share of the trip: about 380 MB to about 40 MB, most of that the new geometry itself; the rails carry position, normal and
  colour only on a phone.
- **Rule:** NEW:memory-bound-by-view

### 2026-10-26 · GRAPPLE's and DRAW's words cut off, the tiles crowding the view (the owner's iPhone XR, the Raceway; Calissa)
- **Seen:** in the owner's screenshot the belt's pair's words stood cut off at the tiles' feet, DRAW's tile half hidden, BLINK over both;
  the owner asked for smaller tiles and menus that fold away.
- **Cause (measured headless as the XR, the same screen):** a glyph with a word on a 44 px tile was sized by the tile alone (0.55 of
  it, a whole number of device pixels), so glyph and word together stood taller than the face and the word's baseline fell under its
  foot; the cluster's tiles (96 and 72 px) and the open rows left the thumbs' half of a landscape phone crowded.
- **Fix:** ui/touch/tile.js sizes a worded glyph to the room its word leaves and keeps the baseline inside the face; the cluster 80 and
  60 px (hudlayout.js the same, a kept layout's least scale 0.75: 45 px), the strip's tiles 44; the top bar folds to a MENU tab and
  PAUSE (opened by a tap, folded by a choice, a tap or six real seconds untouched); the strip folds a tool's own row of two or more
  to a MORE tab, the core moves and BLINK kept out.
- **Rule:** NEW:word-inside-the-face

### 2026-10-26 · WebKit refused the duel's gems: an instanced attribute sized to the count drawn, not the room (Petra's WebKit probe; Calissa)
- **Seen:** real WebKit as the iPhone XR refused 12 draws at boot, `glDrawArraysInstanced: Vertex buffer is not big enough`, the duel
  board's gem families (duel-wonder, -fury, -mirth, -desire: 33 to 47 instances); Chromium said nothing.
- **Cause:** vfx/crystalfrets.js `CrystalFrets` sized its `aFret` and `aLit` from `mesh.count`, and the duel's pieces set `count = 0`
  before attaching them (count is how many are drawn now, not how many the mesh holds): two attributes of length 0 under 33 to 47
  instances.
- **Fix:** sized from `mesh.instanceMatrix.count` (the room), which every user of the frets now gets.
- **Rule:** NEW:instanced-by-capacity

### 2026-10-26 · A phone turned after loading kept the frame's shape it loaded in (the owner's iPhone, the box room; Petra)
- **Seen:** loaded upright and turned flat (or the reverse), the box room drew the Courier squashed: the picture filled the screen but
  kept the aspect of the orientation it loaded in.
- **Cause:** the camera's aspect was set by a resize handler in boot/title.js, a stage the box room never runs; and where it ran it
  read `innerWidth` at the event, which iOS may still give as the old size on a turn. The render size itself was already set by the
  Presentation's own handler, 150 real ms after the last resize (render/present.js).
- **Fix:** the camera's aspect is set in `Presentation.apply()` beside the render size, which also listens for `orientationchange` and the
  visual viewport's resize; the title's handler is gone. Headless, the box loaded at 414 x 896 (0.462) and read 2.164 after the turn.
- **Rule:** NEW:frame-shape-with-size

### 2026-10-26 · The iPhone took the graphics back at the first draw of a shader that read a uniform array at a computed index (the owner; Petra)
- **Seen:** the owner's iPhone XR (iOS 18.7, the Claude app, Safari and Chrome alike) lost the WebGL context 0.1 to 0.5 real s after the
  first draw of the basement's water (v289, three runs of three), and at the Raceway after the crude sea's; turning the camera was what
  brought them into view. Nothing in Chromium or WebKit on Linux showed it.
- **Cause, measured on the phone in the box room (boot/box.js, v291 to v295, one pool a pad):** the water lost the graphics whatever its
  textures, held cut short anywhere before its tint, and held whole with its vertex shader's `vTint = vec4(uTints[ti], ...)` read at
  constant indices (`ti == 0 ? uTints[0] : ...`), the same picture; lost with `uTints[ti]`. The crude sea's vertex shader reads `uW[i]`
  and `uC[i]` so. The vessel's kintsugi reads `uDmg[dR]` in its fragment shader and drew all along: the vertex stage is the likely
  trigger, but both are covered. three.js's own shaders never read so (it unrolls its loops).
- **Fix:** render/constantindex.js, on a phone: every shader's uniform arrays read at a computed index get a helper reading them at
  constant indices (a binary chain of ifs), and those reads call it; a desk's shaders go untouched. With it forced on, the whole game's
  210 programs compiled without an error (workshop, basement, Raceway, Dunes, bazaar), 25 of them rewritten, 30 arrays; the box's frame
  with the water drawn read the same to the channel with it on and off (0 of 1,121,760).
- **Rule:** NEW:uniform-array-constant-index

### 2026-10-26 · The liquid packs drawn black on iOS (the owner's iPhone XR, iOS 18.7; Petra's handoff; Calissa)
- **Seen:** the box room's teal pad (the game's water) hitched half a real second, then drew its panels black.
- **Cause (as far as measured):** the packs keep data in their fourth channel and were decoded by `THREE.ImageBitmapLoader` with
  `premultiplyAlpha: 'none'`, `colorSpaceConversion: 'none'` and the decoder's own resize; WebKit's createImageBitmap is the part not
  trusted (which option it fails on was not measured: no WebKit here).
- **Fix:** no browser is asked to keep an alpha as data any more. The packs (liquid 1 and 2, the garden's ground pack) are saved opaque,
  two halves wide, the fourth channel on the right (scripts/datapack.py, from the bakes); vfx/datapack.js draws one into a canvas, reads
  the bytes back and joins them into an RGBA DataTexture, averaging two by two for a phone's tier. Read back in Chromium: byte-exact
  against the old packs (each channel's sum and a position hash). At the gate (Petra): the 1x1 stand-in, once drawn before the load,
  held its immutable storage (texStorage2D) and the 512 upload failed (GL 1281, grey for good); the texture is disposed before its image
  is set. Measured by Petra in Playwright's WebKit: the joined bytes match Chromium's.
- **Rule:** NEW:data-never-in-alpha

### 2026-10-26 · The title placard came down mid-race (the owner's iPhone XR, v296; Petra, Calissa, Wanda)
- **Seen:** "the placard can descend at very unfortunate timing (like in the middle of a live race)".
- **Cause (as measured):** its gate (vfx/titleplacard.js) held only on the title screen and in a cinematic; the game had no one question
  for "something under way the player is steering", so a race, a crossing, a duel or a fight never held it, and the System's voice said
  each achievement at its unlock whatever was on.
- **Fix:** core/livemoment.js: `game.liveMoment()` names what is under way (a race, a trial, a crossing, a duel, the rhythm mode, a sea
  fight, the FOE awake, a fight: a blow landed either way in the last 6 real s or one winding up within 15 m), or null. The placard's queue
  and build wait on it, one up leaves at once and comes again if unsettled (Calissa); the voice says only a titled achievement, held until
  its placard descends (Wanda). Measured headless: a title queued at a race's start stayed queued, unbuilt and unsaid, and came down 15
  frames after race.end, its line said once.
- **Rule:** NEW:popup-waits-live-moment

### 2026-10-26 · DEBUG's lent things announced as new (the owner: "a bunch of log entries spam the log ... like kiln glazes")
- **Seen:** loading DEBUG, the log filled with lines such as "A new glaze is yours".
- **Cause (as far as measured):** not reproduced on a fresh save (a DEBUG load wrote 5 ordinary lines). Two sources found: the vessel
  snapshots the glazes it owns a real second into its updates and says each one new after it, so a snapshot taken before the title's
  choice (no mode, nothing lent) says every lent glaze at once; and every achievement completed in DEBUG's first minutes (every art lent,
  the whole kit) was announced with its log lines, its glaze and its voice.
- **Fix:** the vessel snapshots silently while no mode is chosen and while glazes are lent; DEBUG lends achievements (the lend panel's
  Achievements row; Dovina's gate in progress/achievements.js: done while lent, nothing announced, no rank.up), the Codex's shelf
  showing them "DONE / lent". Measured headless: no glaze said over 70 frames of a DEBUG load; 712 of 712 done, no achievement line.
- **Rule:** NEW:lent-is-silent

### 2026-10-26 · The lock-on held the target off the crosshair, and the touch lock took the aim (the owner's iPhone XR, v297; Petra)
- **Seen:** "In lock-on, the reticle is offset right from the target, making most shots miss"; "Psygun aiming gets disrupted when
  automatic lock-on occurs, and there's no easy way to disengage lock-on."
- **Cause (as read):** courier/lockon.js turned the view toward the target from the Courier's eye (renderPos + 1.3 m), but the camera
  stands a shoulder's width to the right and looks along the same yaw, and the psygun shoots down the screen's middle: the target sat
  left of the crosshair, the shots right of it, by the shoulder's offset. Its pitch was also damped (x 0.7 - 0.1) for the melee framing.
  On touch the auto lock took the nearest foe every 0.3 real s whatever the look thumb was doing, and a held lock had no touch release
  (the flick cycled targets instead).
- **Fix:** with the psygun drawn in the third person the assist aims from the camera's own position, full pitch, a little faster (9 a
  real s); a finger turning the view keeps the auto lock off for 0.8 real s after it lifts, and a look-away drag of 90 px (fading at 4 a
  real s) lets a held lock go; the flick's cycle is the desk's only. The melee framing is as it was.
- **Rule:** NEW:aim-from-the-camera

### 2026-10-26 · The belt's pair and BLINK on the Solar Skiff (the owner's mobile round 1, via Petra)
- **Seen:** riding the Solar Skiff at the Raceway on a phone, the cluster's top edge still carried LEND, DRAW and BLINK, none of which
  can be done on the board.
- **Cause (as measured):** ui/touch/actioncontext.js's `stripOf` and `beltPairOf` read the belt and the tool in hand, never the input
  context; riding, the live contexts are { any, skiff } and every press of those tiles resolved to nothing.
- **Fix:** both return nothing unless `game.actions.live()` has `foot`. Measured headless (XR landscape, the Raceway): on foot the pair
  is SKIFF, SWAP, LEND, DRAW and BLINK; riding, only the top bar's MENU and PAUSE and the log's tab stand.
- **Rule:** NEW:tile-asks-the-ctx

### 2026-10-26 · The reading table not taking a finger (the owner: "input being offset or not properly registering when pressing and dragging")
- **Seen:** on an iPhone the Pneuka Box's hand of tool cards could not be dragged onto MAIN or SUB, and a tap swapped a card in as the
  sub at once.
- **Cause (as measured):** ui/readingtable.js moved cards by HTML5 drag (`draggable`, `dataTransfer`), which iOS Safari never starts for
  a finger; the only touch path left was the click, which is the mouse's pick.
- **Fix:** a pointer that is not a mouse lifts a card on a tap (held, its preview shown) and drops it on the place tapped next, or
  carries it by a pointer-event drag (the place found with `elementFromPoint`, a ghost under the finger); both say `drop` as the mouse's
  drag did. The click a finger's lift makes is ignored.
- **Rule:** NEW:touch-never-html5-drag

### 2026-10-27 · The ship moored far off the quay on the open sea (the owner's iPhone, v299; Petra)
- **Seen:** "the boat is positioned too far away from the dock in the Open Emocean section."
- **Cause (as read):** world/opensea/opensea.js set the moored ship 16 m out from the quay's middle in three places (build, arrive,
  dockAt); the quay is 12 m deep, so its seaward face stands 6 m out and the sloop's hull (beam 2.1 m) lay about 9 m off it.
- **Fix:** `alongside()`: the quay's face, half the hull's beam and 0.4 m of water. Measured headless: the hull 0.4 m off the face.
  The moored ship is also F's offer now (`opensea.ship`: its chevron, and a double tap's target).
- **Rule:** NEW:place-from-the-measure

### 2026-10-27 · DEBUG reloading in a loop; the seal carving reloading the page (the owner's iPhone, v300; Petra)
- **Seen:** "attempting to go into debug mode does the same multiple loop load, and entering a name at the seal carving causes the game
  to reload and bypassed the hold to carve prompt".
- **Cause (as measured, then read):** the field reports of six v300 loads: each booted to ready with no error; the ones that reached the
  seal carving ended in a clean unload (pagehide) just after "typing a name, the keyboard put away"; the next load came straight into
  the seal carving (the resumed choice). The title's choice of the other mode stashes it and reloads; the reload resumes it directly
  (boot/title.js), never through the menu's pick, so the menu (title/ui.js) was not marked chosen and still heard every key. The name's
  first letter woke the sound and the next pressed PRESS START (the menu came up behind the seal picker), and the keyboard's Done, an
  Enter, picked the menu's hot row, STORY: the other mode again, so another reload, and the title back. Reproduced headless (STORY on
  the device, DEBUG picked, three letters typed, Enter): one navigation after the typing before the fix, none after. Not new in v300: the resumed path is older (v273), but v300's
  loads swapped saves where v299's did not.
- **Fix:** `choose()` takes one choice a load (none while the seal picker is open, none other than the one made) and marks the menu
  chosen; the menu hears no key and no tap once chosen.
- **Rule:** NEW:one-choice-a-load



### 2026-10-27 · A big ship hit only near its middle on the open sea (found at the gate, after the hulls went to life size; Petra)
- **Seen:** reading the fight's hull tests after the 5x hulls: the spit hit within 3.6 m of the hull's middle, the ram when its ring held
  the ship's middle, the coil within 13 m of it. On a 35 m sloop, a glob landing on the bow or the stern passed through the deck.
- **Cause (as read):** every test was a distance from `helm.pos`, a point, written when the hull was 7 m long.
- **Fix:** `helm.hullDist(p)`, the distance to the hull's footprint (its length along the heading, its beam across, 0 inside); the ram,
  the coil and the spit ask it, and the spit hits within 1.2 m of the footprint and under the deck's height plus 3 m.
- **Rule:** NEW:hull-is-a-footprint

### 2026-10-27 · The duel's board off centre and under the log on a phone (South's screenshot; Calissa)
- **Seen:** on a phone in landscape the tsuitate stood a third left of the room the controls leave, its frame's top under the log.
- **Cause (as measured):** XR landscape, 896 x 414, the 14 x 14 board: its cells' centre at x 228 against a free room centred on 344. The
  session frames the shot once, at the open (duelsession.js), and the fit reads the tiles as they stand: then the foot's, not the
  duel's that replace them a frame later. And the log as drawn reaches 26 px below the rect the layout keeps for it.
- **Fix:** the view eases the duel's shot toward a fit taken every quarter real second while the duel is open on touch; the fit's top
  is the log as drawn. Measured after: the cells' centre at x 318, the frame's top 37 px under the log.
- **Rule:** NEW:fit-to-the-room-as-it-stands

### 2026-10-27 · A big ship hit only near its middle on the open sea (found at the gate, after the hulls went to life size; Petra)
- **Seen:** reading the fight's hull tests after the 5x hulls: the spit hit within 3.6 m of the hull's middle, the ram when its ring held
  the ship's middle, the coil within 13 m of it. On a 35 m sloop, a glob landing on the bow or the stern passed through the deck.
- **Cause (as read):** every test was a distance from `helm.pos`, a point, written when the hull was 7 m long.
- **Fix:** `helm.hullDist(p)`, the distance to the hull's footprint (its length along the heading, its beam across, 0 inside); the ram,
  the coil and the spit ask it, and the spit hits within 1.2 m of the footprint and under the deck's height plus 3 m.
- **Rule:** NEW:hull-is-a-footprint


### 2026-10-27 · A fore-and-aft sail's boom set to windward (found building the open sea's wind; Calissa)
- **Seen:** reading the rig against the new wind: the vanes bellied and the pennant streamed to leeward, the boom swung the other way.
- **Cause (as measured):** at the helm with a beam wind (its way +x in the ship's frame, `side` 1), the boom's end stood at x -7.84 and
  the vanes' normals at +x: `boomYaw` turned +Y by `side`, and a +Y turn takes a spar along -z to -x; the clews followed the boom.
  Never seen before the wind: `side` was always 1 and nothing else showed which way leeward was.
- **Fix:** the boom's yaw, the main's clew and the fore-and-aft clew all take +x by `side`, the belly's side. Measured after, with the wind
  to -x: boom end -7.84, vanes -0.85 and -0.99, the pennant's tip -6.27: all to leeward.
- **Rule:** NEW:spar-and-cloth-one-side




### 2026-10-27 · The audio breaking down once the ship's gun fires on the open sea (the owner's iPhone; Wanda)
- **Seen:** "audio processing breaks down after combat is initiated and the ship's gun starts firing" (relayed by Calissa).
- **Cause (as measured, then not yet measured):** headless on a desk (the open sea boarded, a sea serpent called, the gun held, the hits
  landed at the gun's rate, the phone's mixer and a 4x slower CPU tried too): the audio clock kept real time, no voice was left
  sounding, the cue's notes were not late. The owner's field reports from v299 to v303 on the open sea show 30 fps and a worst frame of
  50 ms, so the main thread was not starving the music; what is left is the phone's audio thread. Found on the way: the hunt section's
  coiled bar gave the brass a chord (an array) where it takes one note, and each threw a non-finite frequency every bar
  (music/opensea.js). And each hit at the gun's eight a real second sets off three sounds (the struck sound, the damage, the stun's tick),
  each a new chain that stays connected after it has sounded. Whether the iPhone's audio thread chokes on those, or on something else,
  is not measured yet: the watch below will say.
- **Fix:** the coiled brass played as three notes; every one-shot's source, filter and envelope disconnected when its source ends
  (core.js `letGo`); on a phone, a blow's sounds share one budget, one each 90 real ms (`hitOk`); and the audio's health watched
  (audio/health.js): the audio clock against the wall clock each 2 real s, and a fall behind or a stopped context written into the
  field report with what was sounding, the zone and the cue's section.
- **Rule:** NEW:audio-one-shot-let-go

### 2026-10-27 · The parry at sea reached only round the hull's middle (found at the gate with the crew; Petra)
- **Seen:** reading the parry for Espada's hand: a spit was sent back only within 7 m of the hull's middle, so a glob falling on a 35 m
  sloop's bow or stern could not be parried at all, though it hit (the hull's test already went by the footprint).
- **Cause (as read):** the parry's reach was a distance from `helm.pos`, the same point test NEW:hull-is-a-footprint retired for the hits.
- **Fix:** the parry measures from the footprint (`helm.hullDist`), its reach x1.5 with Espada aboard. Measured: a spit 9 m off the bow's
  tip sent back.
- **Rule:** NEW:hull-is-a-footprint (the same rule: every test against the hull, the parry's too)


### 2026-10-27 · A fore-and-aft sail's boom set to windward (found building the open sea's wind; Calissa)
- **Seen:** reading the rig against the new wind: the vanes bellied and the pennant streamed to leeward, the boom swung the other way.
- **Cause (as measured):** at the helm with a beam wind (its way +x in the ship's frame, `side` 1), the boom's end stood at x -7.84 and
  the vanes' normals at +x: `boomYaw` turned +Y by `side`, and a +Y turn takes a spar along -z to -x; the clews followed the boom.
  Never seen before the wind: `side` was always 1 and nothing else showed which way leeward was.
- **Fix:** the boom's yaw, the main's clew and the fore-and-aft clew all take +x by `side`, the belly's side. Measured after, with the wind
  to -x: boom end -7.84, vanes -0.85 and -0.99, the pennant's tip -6.27: all to leeward.
- **Rule:** NEW:spar-and-cloth-one-side


### 2026-10-27 · A broadside's timing event named over the discovery event (caught by Calissa before the merge; Wanda)
- **Seen:** b30e657c's broadside rule emitted `sea.report { at, side }` for the muzzles' flash; `sea.report` is already Dovina's discovery
  reported at a dock (progress/opensea/seatrip.js), counted in the ledger (tracking/opensea.js) and rung as the dock's coin (cues.js).
- **Cause (as read):** a new event named without searching the bus for the name first.
- **Fix:** the broadside's moment is `sea.boom { at, side }`; nothing else uses the name.
- **Rule:** NEW:event-name-searched-first

### 2026-10-27 · The territorial sea beasts lost a ship a few metres past their zone (found probing the umibozu; Petra)
- **Seen:** headless, the umibozu hunting a cruising sloop rose once at its beam and then roamed; with the ship stopped 120 m from its
  home it never hunted. The akhlut (shipped in v310) was built the same way.
- **Cause (as measured):** the senses took `row.zone` as sight (50 m the umibozu, 60 the akhlut), so a ship leaving that circle was out of
  sight within a few seconds; and its rise, a teleport under the water to the ship's beam, set it down 124 m from home, past its leash
  (50 x 1.4 = 70 m), where the hunt fails at once.
- **Fix:** a territorial beast's sight is its zone x its leash (seaserpent.js); the mind picks no move while the ship is outside the
  leash (mind.js `pickMove`). Measured after: the umibozu inside its water rose 4 times and gripped 3, each a pour on the hull.
- **Rule:** NEW:territory-is-sight-and-leash

## The duel's previews drew the duel's dice (2026-10-27, Dovina; found by Calissa's builder)
- **Seen:** a hover preview, the foe's intent and the bot's search each advanced the puzzle duel's random stream, so looking at a move changed the next drip, and a replay of the same seed could not replay.
- **Cause, as measured:** `cloneState` seeded each copy with `s.r()`; `legalActions` sampled drags from `s.r`. Ten bot turns of seed 9 ended on a different board with previews taken than without.
- **Fix:** `quietStream(state, salt)` (progress/duel/duel.js): a lookahead's stream seeded from the state's own hash, drawing nothing from the duel; legalActions' drags from it too. The same seed now ends on the same board either way.
- **Rule:** NEW:lookahead-own-stream

### 2026-10-27 · The foe's forecast wrote into the real turn's undo (found wiring undo's look; Calissa)
- **Seen:** reading the duel's view for undo: the forecast's copy (vfx/duelview/intent.js `quietCopy`) was `{ ...s }` with its own
  board, sides and stream, but the real duel's `undo` array shared by reference.
- **Cause (as read):** `act` pushes a snapshot onto `s.undo` before each action; on the copy that was the real turn's stack, so every
  forecast drawn put the foe's plan's snapshots under the Courier's next Ctrl+Z (not measured in play: undo was bound the same round).
- **Fix:** the forecast copies with the kernel's `cloneState` (its own quiet stream and `undo: []`); the view's other `{ ...s, r }`
  copies (glows.js `quiet`, worth.js) dropped for the kernel's `preview` and `cloneState`.
- **Rule:** NEW:lookahead-own-copy

### 2026-10-27 · Every gem's clear in a puzzle duel the same note (found reading for Dovina's sound bar; Wanda)
- **Seen:** (by reading, not yet by ear) clears of different colours could never chord.
- **Cause (as read):** audio/puzzleduel.js keyed a clear's note by `COLOUR_NOTE` (red, orange, yellow ...); the board's colours are the
  feelings (`COLOURS`, progress/duel/board.js: wonder .. dread), so every lookup missed and fell back to one note; the pinch the same.
- **Fix:** a feeling's step of the duel's key (`FEELING_STEP`, over the cue's root through `sfx.musicGrid`), a limit a feeling, and the
  chain, the orbs and the pinch keyed alike.
- **Rule:** NEW:sound-keyed-by-the-kernels-names

### 2026-10-27 · The duel's view threw on a duel skill's Grab (Dovina's live probe, before push)
- **Seen:** `TypeError: Cannot read properties of undefined (reading '0')` in the duel view's tool beat, every tick after a Grab skill.
- **Cause (as measured):** the skill emitted `grab { id, from }` for each junk hooked out; the view's `grab` beat (vfx/duelview/toolbeats.js)
  is the classic Grab's, which moves a piece `from` -> `to`, and read `e.to[0]`. The same name, a different shape.
- **Fix:** the skill's events take the shape of a beat that does what they do (`hold { id, at }` removes a piece: the Grab skill's),
  and the skills with no beat yet get names of their own (`blast`, `vein`), which the view plays as a pause until Calissa's beats.
- **Rule:** NEW:new-event-new-name

### 2026-10-27 · The well's perf baseline read 76 calls; the same commit reads 93 (found ruling task 360; Petra)
- **Seen:** perf put the Great Dunemaw's hall at 93 calls against a baseline of 76 and a budget of 88, as growth since 07ebaa5.
- **Cause (as measured):** not growth. Every draw in the hall named by its object and material (a hook on `renderBufferDirect`) is the
  same list at 07ebaa5 and at cba0d4f, 112 and 112, after the same route; perf itself at 07ebaa5 reads 93 today, 92 with the floor's
  rise waited out. The floor's slip jellies were still rising when the hall was measured (the spawn look's crust, 15 draws, caught or
  not by the tick count); what made the recorded 76 is not found.
- **Fix:** perf ticks until the spawn look's runs are done before it measures the well; the well's call budget 88 -> 96 on the
  measurement, the baseline recorded again (91).
- **Rule:** NEW:baseline-reproduced-before-blamed

### 2026-10-27 · On a phone, a shop bought or sold on the first tap (Calissa's phone-windows note, 2026-10-24; routed by Petra)
- **Seen:** a tap on a good or a box slot in a keeper's window bought or sold it at once, its price never read.
- **Cause (as read):** a phone's tap fires the emulated `mouseenter` (the price line) and the `click` together; the window acted on the
  click as a mouse's (src/progress/shop/ui.js), so the line meant to come before the choice came with it.
- **Fix:** on touch (`input.device === 'touch'`) the first tap picks (`.sel`, the line said with "tap again to buy" or "to sell"), a tap
  on the picked one acts; a long press still haggles. Measured headless as a phone: 500 cubes after the first tap, 477 after the second.
- **Rule:** NEW:touch-pick-then-confirm

### 2026-10-27 · A Pneuka Jar stood at the Courier's feet from the load (South's phone, v329)
- **Seen:** in the workshop on loading, the god hand's Pneuka Jar standing in the Courier's legs, with nothing summoned.
- **Cause (as measured):** two warm-ups touched the Jar and were parked out of order. The duel view's warm-up (boot/warmup.js) opens a
  test duel, whose form's dive stands the Jar at your spot and shows it; the Jar look's warm-up, after it, saved "shown, at your feet"
  as the state to put back. The parks ran duel first (hiding the Jar), Jar look second (showing it again where it had saved it).
  A property trap on `jar.group.visible` read it shown before the title; after the fix, hidden.
- **Fix:** the parks run in the reverse of the warm-ups' order, every one.
- **Rule:** NEW:parks-reverse-order

### 2026-10-27 · A puzzle duel's bodies stood over its board, the room behind it (South's phone, v329)
- **Seen:** at the board view the Pneuka Jar's body covered the left of the board and Strawman the right; at the arena the room, its
  chests and its walls stood round the duel.
- **Cause (as measured):** the session set the two 2.7 m apart on a phone (1.35 m off the middle) in the board's own plane, and the
  board is 3 m wide (1.5 m half) at 20 cells: both stood inside the slab. A practice Strawman was never moved at all. Nothing hid the
  world: the duel was a pocket in its rules only.
- **Fix:** the duel's instance (render/duelinstance.js): the world's objects not drawn while it is open; the bodies laid beyond the
  slab's ends by their own measured size (on a phone, the flank's middle) and 0.6 m behind its face; a fixture moved with them and put
  back once the board has folded. Seen at 896 x 414 at 2x: the board clear, you left, the foe right, no room.
- **Rule:** NEW:actors-clear-of-the-board

