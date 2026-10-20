# Research: the crossing as three modules (overhead, side-scrolling, chase), and the Gummi Ship as the bar (2026-10-20)

Gathered for Calissa (Art) by a research agent, on the owner's ask of 2026-10-20: "deep research on the technical implementation of
shoot-em-up games, and break down the rail crossing into the 'overhead', 'sidescrolling' and 'chase' modules ... if each mechanical
element doesn't work then they certainly won't work together. The KH2 Gummi ship sections are our north star ... Enemies need clear
silhouettes, movement paths and communicate that they're firing."

Builds on, never repeats: `docs/plans/research/RAIL-PATTERNS.md` (the 28 emitters, fair danmaku, boids, the warp) and
`docs/plans/research/RAIL-SETPIECES.md` (36 lessons from the set pieces). Read against the repo as it stands (`docs/plans/RAIL.md`,
`RAIL-OVERHAUL.md`; `src/courier/ship/views.js`, `ship.js`; `src/world/emocean/waves.js`, `patternplayer.js`, `shotfield.js`,
`legrunner.js`, `stage.js`; `src/progress/rail/patterns.js`, `crossing.js`).

Marks: **[own]** the researcher's derivation or standard maths; **[play]** from memory of play, to be checked on a longplay before it is
trusted; **[unverified]** a search snippet only. Video links are matched by title; timestamps unchecked. Primary sources (GDC talks,
postmortems) were again scarce: the GDC Vault pages for the Panzer Dragoon postmortem and Mizuguchi's Rez talk are behind membership,
Iwata Asks (Sin and Punishment) returned 503 twice, and the KH2 Ultimania is not online.

Glossary words used as written: the crossing, the rail, a stage, an act, a swing, a set piece, a leg, a plain shot / outlined shot, the
hurtbox, the lock-on, a mount, a windup (`creatures.windup`), the rail's telegraph mark (`vfx/telegraph.js`). New things carry plain
names (CLAUDE.md "Plain names until settled"): **the play plane**, **a muzzle**, **an entry / hold / exit path**, **the overhead module /
the side-scrolling module / the chase module** (the views `above`, `side`, `chase` in `crossing.js` VIEWS). "Tell" is avoided (the
glossary gives it to Nebula Bluff); a foe's wind-up is its **windup**, and the closing ring is **the rail's telegraph mark**.

---

## 0. The top findings, short

1. **Every 2.5D shmup keeps one gameplay plane and moves only the camera** (Einhänder, Gradius V, Radiant Silvergun, Ikaruga): 3D to
   look at, 2D to collide in. Our crossing does not yet: foes, their paths and their shots live in full 3D in the rail's frame in every
   view, so in the side view a fan spread about world up (`waves.js` heavy, `patterns.js` `basis()` with up = [0,1,0]) opens *into the
   screen's depth*, where the eye cannot see it and the ship (pinned at x = 0 on the wall plane) cannot move. What is seen and what hits
   disagree. This is the first thing each module must fix for itself.
2. **Each pair of the three planes shares exactly one axis** [own]: overhead (x across, z along), side (z along, y up), chase (x across,
   y up). A swing keeps the shared coordinate and eases the other two: that is already `views.js`'s rule ("the ship keeps its world
   place"), and it is the clean seam between modules.
3. **Paths must be authored in the plane, not in the rail's 3D frame.** `waves.js` PATHS are closed forms in (x, y, z) shared by all
   views: a `line` of eight across x reads as a line from behind and from above, and as one overlapping blob from the side. A path should
   be a curve in plane coordinates (u, v) over time, mapped through the module's plane basis.
4. **Emitters belong to a muzzle on a body, not the body's centre.** Every foe shot in the repo starts at `f.local` (the centre). Shmups
   attach a turret or familiar to the parent transform and spawn in its frame (Boghog: "Enemy emitter positions can be fixed for clean
   patterns, or tied to enemy movement for distorted patterns"); the muzzle is also where the windup is drawn.
5. **Aim at the ship's position at the moment of release, in the same space as the muzzle.** BulletML's `type="aim"` is an angle
   relative to the line to the ship when the `<fire>` runs. The repo is right here (both `ship.local` and `f.local` are rail-frame, and
   `PatternPlayer` re-aims each release); the risks are elsewhere: a pattern turned onto the aim with `setFromUnitVectors` (no roll kept,
   so the pattern's plane twists with the aim) and fans turned about world up instead of the play plane's normal.
6. **Nothing in the repo winds up before it fires.** Foes fire on their sixteenth with no windup; the tether is drawn only after the
   shot (`shotfield.js` TETHER). The pirates' "gunports open a bar before each volley" (`crossing.js`) is the one exception and the model:
   on a music clock **a windup can be exactly one beat (or half a bar) long, every time**, so the music itself becomes the warning.
7. **The KH2 Gummi's own tutorial text** (khwiki's log of the in-game advice): stick turns the ship, X fires, **hold X to lock on,
   release X to fire**, O rolls, L1 / R1 move the camera, **L1 + R1 together turn it 180°**, a radar shows foes "from all sides", medal
   level **falls when damage is taken**, **Berserk at medal level 30, lost on a hit**, rare yellow and red foes drop prizes, a Slash
   gauge filled by downs fires on Triangle.
8. **The Gummi's wave tables tag every group with its screen: Front, Back, Left or Right.** Missions 1 and 2 swing the camera for you;
   Mission 3 hands you the quarter-turns and sounds a red alert toward the side the next group comes from. "Which side the threat comes
   from" is the Gummi's whole camera language.
9. **Phantom Storm's Pirate Ship is a part table** (khwiki): Mega-Cannon 3000 HP, two Medium-Cannons 600, many Mini-Cannons 200, Bow
   Ornament 3000, two Shafts 5000, the Skull 30000 behind a shield that opens late; **its cannonballs are foes (500 HP) you shoot down
   before they burst**. A shootable shot is a windup the player can answer with the gun.
10. **The music clock is the only clock patterns may read.** Frame time drifts (Gaffer, "Fix Your Timestep"); browser timers drift by
    "tens of milliseconds or more" (Chris Wilson, "A Tale of Two Clocks"); schedule against the audio clock with a lookahead.
    `stage.js` already slews its clock to the cue, but `PatternPlayer.update` advances each run by `dt` (`r.t += dt`), so a volley's
    later shots ride the frame clock, not the bar.
11. **Quantise late, show early** (Matthew Burns, "Planckogenesis: Quantizing Events"): a down's sound waits for the next slot but the
    hit shows at once (Planck keeps "a 'destroyed' version of the enemy in play until the next available note"). Ours: `sfx.railDown(cls,
    grid)` quantises the sound; the look of the down should not wait.
12. **Bounds per view should come from the camera, not a fixed box.** `T.ship.box` is a world-space box (x 7, y 1.2..7, z 7) used in
    every view; in the side view at 24 m the frustum's width at the plane is unrelated to it. Shmups bound the ship to the screen's
    safe area; Star Fox 64's chase bounds are a world box the camera half follows. Each module should own its bounds.
13. **Reticles differ by module and must be derived, never stored in world space.** Star Fox 64: "Shots fired will pass between the two
    targeting reticles" (two squares on the nose's line; the far one flashes red on a charge lock). Sin and Punishment: a free cursor, or
    a lock mode whose "shots are much weaker". Panzer Dragoon: hold, sweep up to eight, release. Our cursor in NDC is right; locks must be
    held as foes, not screen points, and re-projected every frame and across a swing.
14. **Readability is a contract of silhouette, path and colour** (Boghog; Dieterich's "Bright, Slow, and Deadly"; Sparen): directional
    shots, bright core / dark rim, the background midtone, foes kept off the edges, high-HP foes spawned one at a time, never drifting down
    onto the ship; enemy shots never the player's colour.
15. **What the Gummi did that the critics remembered** was the one giant thing with parts (Larsen singled out the pirate ship) and the
    "Disney theme park ride" framing; what they complained of was dead time and the ship blocking the view (GamesRadar). KH3's open
    flight was called empty between fights; KH2's structured missions "felt intentionally designed".

---

## 1. Shoot-'em-up technical implementation

### 1.1 How patterns are authored

- **BulletML** (Kenta Cho, reference v0.21: https://allstar.jhuapl.edu/repo/p2/amd64/libbulletml-dev/doc/doc/bulletml_ref.html;
  Unity port docs: https://pixelnest.io/docs/bulletml-for-unity/pattern-file/). Elements: `bullet`, `action`, `fire`, `changeDirection`,
  `changeSpeed`, `accel`, `wait`, `vanish`, `repeat`, refs with `$1..`, `$rand`, `$rank` (0..1, difficulty). `direction` types: **aim**
  (0 = toward the ship), **absolute** (0 = up, clockwise), **relative** (to this bullet's own direction), **sequence** (to the previous
  bullet fired: the spiral and n-way engine). `wait` and `term` count **frames of 1/60 s**. The root's `type` is `vertical` or
  `horizontal`: the language itself is written in a 2D play plane and knows which way the screen scrolls.
  *What we take:* a pattern is a small tree of timed actions run against a live target; "aim" is resolved when `fire` runs; the plane
  and scroll direction are part of the pattern's context, not hard-coded in it; time in a pattern is a count, so ours should be a count of
  sixteenths of the cue, not frames.
- **Danmokou** (Bagoum, design philosophy t06: https://github.com/Bagoum/danmokou/blob/5b236eb213267c59ad17af6d425c4d7a990e6ade/docs/articles/t06.md):
  movement is a function of time, not speed-and-acceleration ("you provide a function that tells the engine how to calculate the next
  position", e.g. `polar(2 * t, 80 * t)`); patterns nest (`gsrepeat({ times(4) circle }, ...)`); "Moving relative to another moving
  object" is one of its movement kinds; claims 100,000+ bullets at 4K 120 fps with one function call a bullet.
  *What we take:* closed-form motion `pos(t)` is what makes a pattern replayable, seekable to a bar and testable headless: the repo's
  `patterns.js` already does this (`positionAt`); keep it.
- **Sparen's Danmaku Design Studio** (https://sparen.github.io/ph3tutorials/ddsga2.html): aimed angles "play a very minor role" in pure
  danmaku theory; "their true value is by incorporating fixed angle systems into patterns where the initial angle is random or aimed";
  fixed seeds leave blind spots; directional bullets "you can immediately tell which direction they are moving in"; players ignore
  bullets moving away. *What we take:* aim the seed, not every bullet; draw every shot elongated along its heading.
- **Cave** (fan translation of the DoDonPachi interviews: https://shmups.system11.org/viewtopic.php?p=51689 [translation]): Ikeda did
  "ship turning and enemy placement" himself; Kouyama counted bullets off Garegga screens ("if they had 60 bullets, we'd make 100"; at
  most "Up to 245"); slower, more numerous bullets show skill visually. Time Extension:
  https://www.timeextension.com/features/cave-story-the-history-of-donpachi-the-shmup-series-that-changed-everything.
  *What we take:* enemy placement is a designer's hand job, not a generator's; the cap (ours 400) is a budget, not a target.
- **Our library** (`progress/rail/patterns.js`): 28 emitters, pure, `emit(pattern, params, ctx) -> shots`, `fair()` checker. Good bones.
  Two gaps for the modules: `basis()` builds the pattern's plane from `ctx.up` defaulting to world up, and `PatternPlayer` turns the
  laid-out pattern onto the aim with `Quaternion.setFromUnitVectors(AIM0, aim)`, which keeps no roll (§1.3).

### 1.2 Emitters on a parent transform (turret, muzzle, familiar)

- **The convention** [own, from every engine's scene graph; Touhou's familiars and Ikaruga's turrets as seen in play [play]]: a body has
  sockets (named child transforms); an emitter is bound to a socket; each shot spawns at the socket's **world** position, with a heading
  composed as `socket orientation x pattern angle`, and then **leaves the hierarchy** (a bullet is never parented to its shooter: Godot
  thread "they will inherit any offsets to the player's transform": https://godotforums.org/d/24284-how-do-i-make-a-projectile-solved).
- **Inheriting motion is a choice, made per pattern:** Boghog: "Enemy emitter positions can be fixed for clean patterns, or tied to
  enemy movement for distorted patterns" (https://shmups.wiki/library/Boghog's_bullet_hell_shmup_101). A Unity thread's fix for turret
  shots that "spiral" was to spawn at the turret's world position instead of a local offset
  (https://discussions.unity.com/t/help-with-firing-projectiles-out-of-turret/89438); the opposite case, a missile that must keep its
  launcher's velocity, copies it at spawn (https://discussions.unity.com/t/proper-inerita-in-missle/420987).
  *What we take:* three modes, named in the pattern's data: **detached** (spawned at the muzzle's place now, then free: the default),
  **carried** (the whole volley's origin rides the muzzle: a ring that stays a ring round a moving foe, Touhou's familiar), **inherit**
  (each shot adds the muzzle's velocity at spawn: a broadside from a ship under way).
- **In a rail game there are two moving frames:** the rail's (everything that fights is carried in it: `stage.js` "Everything that
  fights is kept in the rail's frame and carried") and the foe's. The repo does the first right (shots fly in rail-frame coordinates,
  `ShotField` "in the RAIL'S FRAME"). The second is missing: `waves.fire` and `PatternPlayer` use `f.local`, the body's centre.
- **Where the muzzle is decides what reads** [own]: a shot leaving a visible barrel, gunport or mouth is its own explanation; a shot
  appearing from the middle of a mesh reads as the mesh "emitting", and from the chase view a centre is often hidden behind the body's
  silhouette. Phantom Storm's cannonballs come "only from two large canons, from the area below the center mast" (khwiki Pirate Ship:
  https://khwiki.com/Pirate_Ship).
- *What we take:* each body (Calissa's model) exports named muzzle nodes (`muzzle.0`, `muzzle.port.3`); the foe's data names which
  pattern fires from which muzzle; the pattern player reads the muzzle's world matrix at each release; the windup (§1.7) draws on the
  same node.

### 1.3 Aimed, fixed and rotating; and aiming at the right ship in the right space

- **Kinds** (Shmups Wiki dodging strategy: https://shmups.wiki/library/Dodging_strategy; Boghog): **aimed** ("odd" patterns put a shot
  on the line to you: "tap once perpendicular to the bullet source"), **even** (streams either side: "not move and let the danger pass"),
  **fixed / static** (lanes and walls: the designer's control), **rotating** (a seed advancing by a delta), **random** (refreshing but
  unfair unless stratified). Mixed: an aimed chunk pushes you into a static lane.
- **What "aimed" means:** BulletML's `aim` is relative to the line from the shooter to the ship at the moment the `fire` action runs
  (reference above). Leading (aiming where the ship will be) is a different pattern, used sparingly, because it punishes the
  telegraphed dodge [own].
- **The classic bugs** (forum threads above; [own] for the list):
  1. *Stale target:* the aim captured when the pattern started (or when the windup started) and reused for every later shot; streams
     then stay locked to where you were. BulletML avoids it by resolving aim per `fire`. (`PatternPlayer` re-aims per release batch:
     correct.)
  2. *Wrong space:* the ship's world position minus the foe's rail-frame position (or the reverse) while the rail turns; the error grows
     with the rail's curvature, so it hides on straight legs and appears in a turn of the rail. (Repo: both in rail frame: correct. Keep a
     single helper so no one ever mixes them.)
  3. *Wrong frame order:* the foe moved this frame, the ship not yet, or the muzzle read before the body's animation was applied; the
     shot leaves from where the barrel was last frame. Order: rail, ship, bodies and their animation, then emitters, then shots.
  4. *Wrong plane:* an aim correct in 3D but outside the play plane (the ship's pinned axis differs from the foe's): the shot passes
     "through" the ship on screen and misses in 3D, or the reverse. In the side view this is the default today (§2.2).
  5. *Lost roll:* turning a laid-out planar pattern onto the aim by the shortest arc (`setFromUnitVectors`) twists the pattern's plane
     by however the aim happens to lie; a ring laid flat ends up edge-on to the camera for some aims. Build the turn from two axes: the
     aim and the play plane's normal (a look-at with a fixed up), so the pattern's plane is always the play plane.
- *What we take:* aim = `normalize(shipNow - muzzleNow)` in the rail frame, **then projected into the play plane** (drop the component
  along the plane's normal) before any fan or ring is laid round it.

### 1.4 The clock: fixed timestep, the music, and why patterns drift

- **Fixed timestep** (Glenn Fiedler, "Fix Your Timestep!": https://gafferongames.com/post/fix_your_timestep/): accumulate frame time
  (capped at 0.25 s), step the simulation in fixed `dt`, render with the remainder interpolated; a variable step "is not exactly the
  same due to the limited precision of floating point arithmetic", so patterns stepped with frame `dt` are not reproducible, and Euler
  steps of curving or accelerating shots differ between a 60 Hz and a 144 Hz monitor [own].
- **The audio clock** (Chris Wilson, "A Tale of Two Clocks": https://web.dev/articles/audio-scheduling): JS timers can be "skewed by tens
  of milliseconds or more by layout, rendering, garbage collection"; `AudioContext.currentTime` is the hardware clock; schedule with a
  short timer (25 ms) and a **lookahead (100 ms)**; draw in `requestAnimationFrame` by comparing the audio clock to a queue of scheduled
  events.
- **Quantisation** (Matthew Burns, Game Developer, 2009: https://www.gamedeveloper.com/design/planckogenesis-part-i-quantizing-events):
  "Quantizing can be performed in real-time by simply delaying notes until the next available time slot"; sixteenths suit "hi-hats or
  claps"; big sounds need coarse grids; Rez plays its crash only after eight shots on eighths; Planck shows the kill at once and holds
  "a 'destroyed' version of the enemy in play until the next available note".
- **Authored to the song:** Thumper's engine was built so "both the tracks and the audio" are made together (Unwinnable:
  https://unwinnable.com/2016/01/06/thumper-dev-talks-star-wars-braid-and-the-weirdness-of-playing-games/); Sayonara Wild Hearts' composer
  "discussed nearly every section and transition in every level" and cut songs to a third or added a drop for a sequence
  (https://simogo.com/work/sayonara-wild-hearts/daniel-about-sayonara-wild-hearts/); Mushroom Men's emitters "would fire them off on beat"
  and the system "was kind of like a sequencer" (https://designingsound.org/2011/01/03/audio-implementation-greats-10-made-for-the-metronome/).
  Child of Eden: an 8-lock release in time with the music multiplies score up to x8; the Euphoria bomb costs rank
  (https://en.wikipedia.org/wiki/Child_of_Eden).
- **The repo:** the stage reads the bar off the cue and slews toward it, jumping forward after a pause (`stage.js` THE CLOCK): right.
  Waves enter on bars and fire on sixteenths: right. **`PatternPlayer.update` advances `r.t += dt`**, so the shots inside a volley are
  spaced by frame time from whenever `play()` ran; a slew or a long frame shifts them off the grid.
- *What we take:* every scheduled thing (a shot's release, a windup's start, a path's time) is a **bar position**, read as `bar - startBar`
  in seconds (`BAR_S`), never an accumulated `dt`; shots in flight may step with a fixed sub-step for collision, but their position is a
  function of `bar - releaseBar` (closed form), so a slew moves them consistently and a test can seek to any bar.

### 1.5 Pooling

- **Object Pool** (Robert Nystrom, Game Programming Patterns: https://gameprogrammingpatterns.com/object-pool.html): allocate once, a
  free list "cannibalize[s] the memory of the dead particles themselves"; when full: **prevent** (size so it never overflows: "suits
  important objects like enemies"), **don't create** (fine for sparks), **kill an existing one**, or **grow**; reused objects must be fully
  reinitialised.
- **The repo:** `ShotField` is a fixed 400 with a free list and counts `dropped`. A dropped *foe shot* is a pattern with a hole in it (a
  fairness checker's gap the player did not earn). *What we take:* foe shots are "prevent" (the leg's schedule is checked against the cap
  before it ships; `dropped` > 0 is a bug); sparks and trails are "don't create".

### 1.6 Hitboxes and graze

- Shmups Wiki glossary (https://shmups.wiki/library/Hitbox): hitboxes are "often much smaller than the objects might appear"; hinted by
  "a bright cockpit on a ship" or shown as "a small dot"; a bullet's hitbox is often "a different colored region toward the center";
  **graze** pays for passing close. Boghog: tiny and "Perfectly centering the hitbox is also important"; give the player's shots big
  hitboxes and foes big hurtboxes. Gradius V reduced the Vic Viper's hitbox (HG101: https://www.hardcoregaming101.net/gradius-v/). TH04/05
  define collision as "a kill delta of 8×8 pixels between the center points" (rec98: https://rec98.nmlgc.net/blog/2025-02-24).
- **The repo:** the hurtbox is a 0.35 m radius on a 1.6 m ship, drawn as a pale core (`T.ship.hurt`, `vfx/railshots.js`): right. In a
  2D module collision should be **2D in the play plane** (distance in (u, v) only) so it matches what the camera shows; in the chase
  module, 3D with the depth tolerance generous (§2.2).
- *What we take:* collision in plane coordinates per module; graze is a cheap score source and a readability aid (a near shot sparks)
  if the owner wants it (Dovina's call).

### 1.7 Telling the player a foe is about to fire

- **Sources:** an enemy-design write-up calls telegraphing one of the most important things in shmup enemy design, most for fast bursts,
  least for slow popcorn (moddb, "Designing enemies on a budget": https://www.moddb.com/games/rick-henderson/features/designing-enemies-on-a-budget
  [snippet: the page returned 403]); a GDC-talk write-up splits readability into "telegraphing (what happens before) and expectations
  (what happens after)" (https://medium.com/p/c3d04f642c9a [snippet: 403]); "Large gestures, color coded attacks, voice and sound cues"
  (same). Elemental Gearbolt: **shrinking boxes round the foe** before it fires (already lesson 15). Touhou: TH01 had "decay and delay
  cloud effects" round a bullet's spawn, removed in TH02 (rec98 above): the spawn cloud is a known, optional tell. Boghog's alternative:
  "only make enemies vulnerable after their first shot", so every foe fires once. KH2: **the cannonball is itself a foe with HP**, shot down
  before it bursts (khwiki Pirate Ship); the Hex Ring's laser ring is dodged "by barrel rolling or holding still" (Stardust Sweep:
  https://www.khwiki.com/Stardust_Sweep). Child of Eden: purple projectiles fall only to the Tracer (the rapid gun), not the lock-on
  (https://handwiki.org/wiki/Software:Child_of_Eden): **the shot's colour says which verb answers it** (ours: the outlined shot and the roll).
- **The three stages of a shot, on the beat** [own, from the above]:
  1. **windup** (`creatures.windup` already emitted for every telegraph): the body shows intent: turns its muzzle to you, a gunport opens,
     a glow gathers at the muzzle, the rail's telegraph mark closes on it. Starts exactly **one beat before** a plain volley and **half a
     bar before** an outlined one or a boss part (a whole bar for a beam's warning line). The music makes the length known; the eye learns
     it once.
  2. **release:** a muzzle flash and recoil at the muzzle on the beat, the sound quantised to the same sixteenth; the tether (already in
     `shotfield.js`) from muzzle to shot.
  3. **flight:** directional, core-and-rim, the kind's colours (§1.8).
  - A foe downed during its windup cancels the volley (`PatternPlayer` already drops a downed thrower's unfired shots: Ikaruga) and
    should pay a little extra: it rewards reading the windup.
- *What we take:* no foe fires a volley without a windup of a known length; the windup is drawn at the muzzle that will fire, from every
  module's camera (a glow and a ring read from behind; a turning barrel reads from above and the side).

### 1.8 Readability: silhouettes, paths, colour

- **Shots:** "Bright, Slow, and Deadly" (Robert Dieterich, 2012: https://www.gamedeveloper.com/design/bright-slow-and-deadly): shots
  "must stand-out from the rest of the graphics", drawn above most things, and enemy projectiles are "one of the few cases where it may be
  advisable to ignore the color palette"; halving their speed made the prototype a game of weaving. Boghog: bright cores beside dark
  borders, a low-contrast midtone background, reds, pinks, purples; avoid yellow and orange (explosions, gold items); fast shots long.
  An itch.io dev: enemy shots never in the player's shot colour (https://itch.io/post/6862780).
- **Foes:** Boghog: popcorn with "not much more HP than is needed"; high-HP foes command attention and must not drift down onto you
  ("being under them is inherently very dangerous"); spawn high-HP foes one at a time; no foes near the borders (traps); **lanes**: the
  Toaplan habit of 5 to 7 lanes, alternating sides, none at the extreme edges; overlap waves so they arrive in quick succession; a hit
  foe must react (flash, particles, shake).
- **Silhouette** [own]: at 480 lines (`render/present.js`) a foe at 40 to 60 m is a handful of pixels: what reads is outline and motion,
  not detail. Each role needs one shape that is unmistakable from **all three cameras** (a fish's flank from the side, its back from
  above, its head-on disc from behind are three different silhouettes). The Gummi's foes are toys built for this: Knight Head, Bomb Bell,
  Spider, Hex Ring, U.F.O., Cyclops: each name is its silhouette [play].
- **Paths as communication** [own; Galaga's swoops and Gradius's lines as seen in play [play]]: **entry** (from a named edge, on a curve
  that shows where it is going), **hold** (a station, where it fires: the windup happens here), **exit** (leaves by a different edge, does
  not fire on the way out). A player reads "it has stopped, so it is about to fire" without any mark.

### 1.9 Waves and formations

- **Practice:** precompute spline paths into tables and give each foe a float index along its path (Allegro forum, 2004:
  https://www.allegro.cc/forums/thread/595231/730038); a state machine fly-in -> on-path -> in-formation (Unity Galaga course outline:
  https://www.udemy.com/course/unity-course-galaga-3d/); foes leave their entry path and "become children of the relative formation"
  (Emanon devlog: https://watto-a.itch.io/emanon/devlog/438108/enemy-spawning); curved-path specials "should not fire" and despawn off
  screen, at least two distinct path shapes a stage (bglga notes: https://git.hoyer.xyz/harald/bglga/commit/a0863b2).
- **The repo:** `crossing.js` script() gives each wave a bar, role, class, count, formation and lane; `waves.js` PATHS are six closed
  forms (line, vee, pincer, ring, dash, hold) in rail-frame 3D. `legrunner.js` reads a leg's schedule. This is the right structure; what
  is missing is the plane (§2) and the hold-fire-exit grammar (the closed forms move continuously; firing is gated by `z` between 6 and
  70 m, not by a hold).
- *What we take:* a wave is `{ bar, path (in plane coords), formation offsets, role, muzzle patterns per phase }`; a path is a few
  Catmull-Rom or Hermite keys with times in bars (entry keys, hold keys, exit keys), sampled by arc length; formation offsets are added in
  plane coordinates after the path, so a formation turns with its leader.

---

## 2. Camera and view: one play plane per module

### 2.1 How the genre maps 2D play into 3D

- **Einhänder** (https://en.wikipedia.org/wiki/Einh%C3%A4nder): "3D with occasional shifting of camera angles, but with the player's
  movement restricted to a two-dimensional plane"; IGN credited the tilting camera with much of the excitement; its foes "would cooperate
  with each other" to herd you. **Gradius V**: "still played on a 2D plane ... all of the visuals are 3D"; a stage "rotates back and forth
  as you fly forward" (HG101, above); levels alternate horizontal and vertical scrolling. **Radiant Silvergun**: "sweeping camera angles,
  vertigo inducing 3D backgrounds" (https://www.timeextension.com/reviews/saturn/radiant-silvergun). **Ikaruga**: polarity, 2D plane, 3D
  set dressing (https://en.wikipedia.org/wiki/Ikaruga).
  *Rule they share* [own, consistent with every source]: the camera may tilt, roll, swing and dolly; the **plane does not move relative
  to the action**; everything that can hurt or be hurt lies on the plane; things off the plane are scenery (or a separate layer that is
  plainly marked as such).
- **Sin and Punishment**: the hero runs on a line near the bottom ("you can only move left or right", HG101:
  https://www.hardcoregaming101.net/sin-punishment/) while a free crosshair aims into the 3D scene; Treasure's Nakagawa on the problem:
  hitting a 3D foe needs 2D aiming, and foes' bullets at first failed to hit the player (Iwata Asks, via search snippet:
  https://iwataasks.nintendo.com/interviews/wii/sinandpunishment/0/1 [unverified, 503]); "a few times ... the perspective changes to a
  side scrolling view". That is our chase module's shape: move in one plane, aim into depth.
- **Star Fox 64**: rails with the Arwing in a box the camera half follows; All-Range Mode as free arenas (Giant Bomb review:
  https://giantbomb.com/user-reviews/uid/9255/a-groundbreaking-leap-into-3d-space-combat). Its rail stages "are heavily scripted"
  (Nintendo World Report: https://nintendoworldreport.com/feature/12002/star-fox-command-retrospective).
- **KH2 Gummi**: the ship moves in the screen's plane; the camera is authored in Missions 1 and 2 and yours in Mission 3 in quarter turns
  and 180° (tutorial log, §3); groups come from Front, Back, Left or Right "screens". When the camera turns, **your movement plane turns
  with it** [play]: you are always dodging in the screen.

### 2.2 The three modules' planes (with what is wrong today)

| module (view id) | play plane (rail frame) | pinned axis | camera | threats come | collision |
|---|---|---|---|---|---|
| **overhead** (`above`) | x across, z along (the sea) | y at cruise | high, looking down the sea, the scroll toward the top | from the top of the screen (ahead), flanks | 2D in (x, z) |
| **side-scrolling** (`side`) | z along, y up (the wall) | x = 0 | abeam, the scroll toward the right | from the right (ahead), above, below | 2D in (z, y) |
| **chase** (`chase`, and `free`, `astern` as its variants) | x across, y up (the screen) | z at the boost's place | behind and above | out of the depth toward the camera | 3D, generous in depth |

What the repo does today that breaks the table:
- **Foes are not on the plane.** In `side`, PATHS place a `line` across x = L*6 ± 2.2 i, i.e. into the screen; a `ring` circles in (x, y).
  From the side camera the members overlap and their distance to the ship's x = 0 is invisible. In `above`, PATHS vary y (3.4 to 3.6,
  rings ± 0.6 r) round the ship's cruise height: harmless for spheres of 0.8 m, wrong in principle.
- **Patterns are not in the plane.** `basis()` (patterns.js) lays a planar pattern in (u, f) with u = up x f: a horizontal plane. That is
  the overhead plane by luck; in the side view it is perpendicular to the screen; in the chase view a ring becomes an edge-on line.
  `mode: 'cone'` exists for the chase view; the side view has nothing.
- **Fans turn about world up** (`waves.js` heavy: `applyAxisAngle(_w.set(0, 1, 0), k * 0.16)`): in the side view the five shots of the fan
  separate along x, the depth axis: on screen one shot, in 3D a fan of which four pass beside a ship that cannot move in x.
- **Fix in one move** [own]: each module provides its plane's basis `(origin, U, V, N)` in the rail frame; foes' paths and formation
  offsets are written in (U, V); patterns are laid out with `up = N` (so u, f span the plane); every aim and every spawned velocity has its
  N component removed; collision measures distance in (U, V). The chase module keeps N = forward and uses `cone` mode.

### 2.3 The ship's bounds per module

- Today: one world box `T.ship.box { x: 7, yLo: 1.2, yHi: 7, z: 7 }` about the rail point, scaled by hull and form, in every view.
- Shmups bound the ship to the visible play field (the screen minus a margin); Star Fox's box is world-space with a camera that follows a
  share of the offset (`VIEW_RIGS.chase.follow 0.35`).
- *What we take* [own]: overhead and side-scrolling: **bounds = the camera frustum cut by the play plane, inset by a margin** (the HUD's
  and the hull's half-size), recomputed when the camera's rig or fov changes, so the ship reaches the screen's safe edge exactly and never
  leaves it; foes may spawn outside the bounds but fire only from inside the frame. Chase: a world box (Star Fox), sized so the ship at
  full deflection still sits inside the screen's safe area at the camera's follow share. During a swing, the bounds blend with the camera
  (clamp to the union until the midpoint, the new one after: the input plane already turns at the midpoint).

### 2.4 The reticle in each module

- **Star Fox 64:** the manual: "Shots fired will pass between the two targeting reticles"; charging, "the second cursor will flash red when
  it has locked onto an enemy" (manual text via search: https://www.wikipedia.org/wiki/Starfox_64 and the Star Fox wiki's Reticle page
  [unverified: page bot-blocked]). The reticles are drawn on the nose's line at two depths, so aim is the ship's attitude [play]; ours:
  `T.ship.reticles [12, 36]`.
- **Sin and Punishment:** free aim, or a lock mode where "your shots are much weaker" (HG101): accuracy traded for power.
- **Panzer Dragoon Zwei:** hold fire, sweep the reticle over up to eight, release; Berserk homes on everything on screen
  (https://segaretro.org/Panzer_Dragoon_Zwei). Crimson Dragon: lock on as soon as the cursor passes over
  (https://www.gamerevolution.com/games/60449-crimson-dragon-preview).
- **KH2 Gummi:** "Press down [X] to lock onto a target!", "After locking onto a target, release [X] to fire!" (tutorial log, §3): the
  gun and the lock-on are one button.
- **Rez / Child of Eden:** up to eight locks, each lock a note; a release in time multiplies.
- **The repo:** the cursor is NDC over the whole screen, a ray through it each frame meets the plane 36 m ahead or the first foe on it,
  and "a swing carries the cursor's screen position, never its world offset" (`ship.js`, RAIL-OVERHAUL 1.4): right. In `above` and `side`
  "the gun fires along the scroll and the mouse rests".
- *What we take, per module* [own]:
  - **overhead:** the gun fires along the scroll (up the screen), or toward the cursor *projected onto the sea plane* if the owner wants
    twin-stick aim; the reticle is a ring on the plane a fixed distance ahead of the ship; the lock-on sweep is the cursor's circle on the
    plane.
  - **side-scrolling:** fire along the scroll (right); the reticle is a mark on the plane ahead; `abeam` (into the screen at a set piece
    alongside) is a different module in all but name (it aims along N, off the plane): keep it, but treat it as the chase module's aim
    pointed sideways, with the set piece the only target off the plane.
  - **chase:** the two reticles on the aim ray (Star Fox), cursor in NDC (Sin and Punishment), locks painted by screen distance.
  - **All:** locks are held as **foes** (references), re-projected each frame; a lock whose foe leaves the frame or the plane is dropped
    with a sound, never left pointing at an empty screen point; the reticle's screen position is derived each frame from the cursor (or
    from the ship's facing), never stored as a world point across a swing.

### 2.5 The swing between modules

- The genre swings rarely and on purpose: Einhänder mid-stage, Gradius V between stages' sections, the Gummi on authored beats or by your
  quarter-turns, with the radar and alert pointing to the next side.
- **Shared axes make the handover clean** [own]: overhead<->side share z (along); overhead<->chase share x (across); side<->chase share y
  (up). The ship keeps the shared one and eases the other into the new plane's range; `views.js` already turns the input plane at the
  midpoint and keeps the ship's world place.
- **What crosses a swing** (the repo's rule: "nothing new enters during a swing"): live shots of the old plane are either **cancelled**
  (turned into absorbable Lachryma, a bullet cancel that pays: Boghog's cancel after a death, Ikaruga's absorption) or **finish their
  flight off the plane as scenery** (no collision); live foes either exit on their path's exit keys or are re-pathed onto the new plane by
  their shared coordinate; locks persist (they are foes) and are re-projected; the cursor keeps its NDC.

---

## 3. Kingdom Hearts II: the Gummi Ship missions

### 3.1 The rules of the mode (the in-game tutorial, quoted by khwiki)

Source: https://www.khwiki.com/Forum:Notes_27,_(KHII,_Gummi_Tutorial_Logs)_-_Xion4ever (a fan log of the in-game advice; verify against
a longplay).
- "Use the left analog stick to turn the Gummi Ship and press [X] to fire!" / "Press down [X] to lock onto a target!" / "After locking
  onto a target, release [X] to fire!" / "Use [O] to roll!" "Dodge enemies by rolling the Gummi Ship."
- "Use [L1] or [R1] to move the camera!" / "Press [L1] and [R1] simultaneously to rotate the camera 180°!" (HD guides describe a
  quarter turn a press [unverified: TrueAchievements 403].)
- "The Medal level is shown in the top left corner." "When damage is taken, Medal levels will decrease!" "Enter Berserk Mode with a Medal
  level of 30!" "The Gummi Ship will power up in Berserk Mode until damage is taken."
- "Defeat the rare Yellow and Red enemies to pick up Special Orbs containing Gummi Blocks!" (gold and red variants appear when the group
  before them is cleared: Asteroid Sweep, https://www.khwiki.com/Asteroid_Sweep).
- "Fill the Slash Gauge ... by defeating enemies." "Once full, press [Triangle] to use Slash Gummies!" (a filled panic button).
- "Teeny Ships fight alongside the Gummi Ship, while blocking normal enemy attacks!"; formations on L2 / R2; EX-formation on Square.
- "Use the Radar to see incoming enemies from all sides." "Be especially careful of different colored enemies!"
- Mission levels: "Collect Medals in Mission Level 1!", "Defeat the enemies in Mission Level 2!", "Aim for the top score in Mission Level
  3!" Mission 3 opens at C in both and "requires the player to manually rotate the camera" (Gamer Guides:
  https://gamerguides.com/kingdom-hearts-hd-25-remix/guide/kingdom-hearts-ii-final-mix/gummi-missions).
- Ship stats: HP, Offense, Power, **Mobility** (turns and spins), **Speed** (how fast you move through the course)
  (https://www.khwiki.com/Gummi_Ship). Abilities include **Auto-Counter** ("Fires lasers automatically when the ship is hit"), **Draw**,
  **Medal Converter** (https://www.khwiki.com/Gummi_Ability).
- *What we take:* one button for gun and lock-on is the Gummi's (ours splits LMB and RMB: keep ours, the mouse has two); **a rank that
  falls when you are hit** (medal level) and **a power state lost on a hit** (Berserk) make the hurtbox matter without killing you; the
  radar plus a sound toward the side is how a camera you do not hold stays fair.

### 3.2 The routes (khwiki wave tables and guides; behaviour beyond them is [play])

| route | its foes (khwiki) | what each teaches / its set piece | sources |
|---|---|---|---|
| **Asteroid Sweep** | Bomb Bell, Knight Head, Mega Tank, Ring Tank, Shield, Spider, U.F.O., Driller | the tutorial route; Bomb Bells come "kamikaze style" (roll away); Shields are shot **from behind** (wait for them to pass); a gold Knight Head after its group; the **red Spider** twice, its laser barrage rolled, **appendages before torso**; Mission 3: you turn the camera, "a red alert beep" says where | https://www.khwiki.com/Asteroid_Sweep |
| **Stardust Sweep** | adds **Hex Ring** | Hex Rings fire laser rings, dodged "by barrel rolling or holding still"; a Spider from behind; Cyclops that spawn item-holders; a large Hunter Ship | https://www.khwiki.com/Stardust_Sweep; guide text: https://www.cheathappens.com/text/khearts2guide.zip.txt |
| **Phantom Storm** | Pirate Ship, Driller; Knight Head, Grappler, Spiked Roller, Gatling Ship; ghosts, ghouls, phantoms | a green tunnel of buildings to dodge, then **the Pirate Ship** fills most of the mission (parts below); Mission 2: starts behind, Knight Heads and Rollers, the ship follows with waves, **the camera to the front** among flying debris, a Driller then red then gold, the ship again; Mission 3: an ambush from behind, an alert from the front, foes on all sides: "wiping out enemies and camera adjusting" | https://www.khwiki.com/Phantom_Storm; https://khwiki.com/Pirate_Ship |
| **Splash Island** | Bomber, Shield groups | clearing every Bomber group early summons a gold Bomber; a Gold Shield under the Red and Blue | guide text above |
| **Floating Island** | Teeny-ship foes | use Formation Change against them | guide text above |
| **Ancient Highway** | Hunter, Reaper's Wheel; Bomber, Gatling Ship, Grappler, Hex Ring, Knight Head, Mad Rider, Phoenix, Speeder, U.F.O. | screens Front, Back, Left; field theme "Hazardous Highway" | https://www.khwiki.com/Ancient_Highway |
| **Broken Highway** | (tables only) | the Highway again, broken (the route's return) | guide text above |
| **Sunlight Storm** | Driller, Hunter; Bomber, Grappler, Hex Ring, Knight Head, Mystic Flyer, Phoenix, Spider, Spiked Roller | S 600 kills; field theme "Cloudchasers" | https://www.khwiki.com/Sunlight_Storm |
| **Assault of the Dreadnought** | Hunter-X; Bomber, **Cruiser** and Mini Cruiser ("They don't attack, but large Cruisers drop treasures"), Cyclops, Gatling Ship, Grappler, Knight Head, Mystic Flyer, Phoenix, Speeder, Spider, **Core** ("The armored core.") | the last route; S 650 kills; field theme "Battleship Bravery" | https://www.khwiki.com/Assault_of_the_Dreadnought; https://khwiki.com/Cruiser |

Every route's wave table gives each group a **Screen** (Front, Back, Left, Right) and an (R) / (G) tag (red, gold [unverified meaning]).

**Phantom Storm's Pirate Ship, part by part** (khwiki): one Mega-Cannon (3000 HP, before the main mast), two Medium-Cannons (600, bow and
aft; their cannonballs "explode in front of the ship and knock it across the screen"), many Mini-Cannons (200, the rear's sides), the Bow
Ornament (3000), Small and Large Shafts (5000: "Destroying the shaft and wheel gives enough points to 'jump up two medal rankings'"),
the Skull (30000, in the mouth, revealed "near the end", its "metal shield opens after the ship is rounded", it "summons other ships to
protect itself"), Grapplers that "grab hold of your ship" (a roll frees you), Cannon Balls (500 HP, 20 damage: "if this enemy is not
destroyed in time, it will explode"), Ghosts and Ghouls (100 HP, respawning, charge you).
*What we take:* the False Light (the Wreckers' set piece, RAIL-OVERHAUL 6) is already modelled on it; take the **part table with HP that
pays out of proportion** (a shaft worth two medal ranks), **the late-revealed core**, **shootable cannonballs**, **grapplers answered by
the roll**, and **the return to the same ship from another side** (Mission 2's front camera).

### 3.3 Camera language, enemy design, lock-on, score, music, polish

- **Camera** [play, to verify on the longplays below]: Missions 1 and 2 hold a chase camera behind and above, with authored swings to the
  front (flying away from a pursuer: Phantom Storm Mission 2), and the big set piece framed broadside or ahead; Mission 3 makes the
  camera's quarter-turns a verb, with the radar and a red alert toward the side. The ship moves in the screen's plane whatever the
  camera faces.
- **Foe design** [play]: Nobody ships white and silver, Heartless black and red with their emblem; each a toy with one shape and one
  behaviour (Bomb Bell rushes, Shield guards its front, Hex Ring throws rings, Spider barrages, Grappler clamps, Cruiser carries treasure
  and does not fight); groups enter as formations from one screen edge; colour variants (red, gold) are the reward layer, not new threats.
- **Lock-on** [play]: X held paints what the cursor passes, release fires lasers (Thunder lasers among the weapons: Gummi Ship page);
  lasers and lock-on Gummis are "your best friend" in Mission 3 (Asteroid Sweep).
- **Score:** three missions per route, ranked S to E: medal level (S 30), kills (S 350 to 650 by route), score (S 1,000,000 in KH2; FM
  1.9 to 7 million by route, then S+1 to S+10 up to 5.6 million in Phantom Storm), each with an EX build rule in Final Mix (khwiki route
  pages above). 100% on all routes gives Crown/G: permanent Berserk at 1 HP (Gamer Guides).
- **Music:** Yoko Shimomura's Gummi cues: "Asteroid Attack" (1:16), "Cloudchasers" (1:39), "Blast Off!", "Crossing the Finish Line",
  "Shipmeisters' Shanty" (https://www.khwiki.com/Cloudchasers, https://khwiki.com/Asteroid_Attack, https://www.khwiki.com/Blast_Off!).
  The tracks loop under the mission; no source says the waves are cut to the bar (unlike Rez) [unverified either way].
- **Reception:** "widely agreed to be an improvement"; reworked to be "more enjoyable", a mix of rail shooter and "Disney theme park
  ride"; compared to Star Fox, Panzer Dragoon, Gradius, R-Type, Einhänder and Cave; Larsen "did single out a battle against a giant pirate
  ship as a highlight" (https://en.wikipedia.org/wiki/Kingdom_Hearts_II). GamesRadar: the ship "often blocks your view of your targets"
  (https://gamesradar.com/kingdom-hearts-ii-review/4); GameSpot users: "monotonous" routes.
- **What made it read as polished** [own, from the above]: (1) one foe, one shape, one behaviour, so a group is read at a glance; (2) a
  side for every group, announced (radar, alert) before it arrives; (3) a big object whose parts pay out of proportion; (4) a score that
  falls when hit, so the player reads every shot; (5) colour variants that reward clearing; (6) the camera authored where it matters and
  handed over only in the mastery tier; (7) short missions, replayed for three different goals.
- **Its faults to avoid:** the ship's body covering targets (GamesRadar) [ours: the chase camera's follow and the hull's opacity]; dead
  time you cannot skip (RAIL-SETPIECES lesson 35).

### 3.4 KH1 and KH3

- **KH1:** auto-forward flight through asteroid fields steering the ship's screen position, a brake, Warp-G per route, Warp Holes, no
  points in the base game (https://www.khwiki.com/Gummi_Ship); reviewers found it "baffling" and the worst of the game
  (https://archive.rpgamer.com/games/kh/kinghearts/reviews/kingheartsstrev2.html). Its control list: L1 + R1 rotate the camera, X held
  to lock on, O to roll (StrategyWiki: https://strategywiki.org/wiki/Kingdom_Hearts/Gummi_Ship): KH2 kept the verbs and rebuilt the
  missions.
- **KH3:** three open 3D spaces flown freely (pitch limited: "You cannot fly directly up or down"), battles that "revert to an on-rails
  system" (IGN, via search); a player review: KH2's missions "felt intentionally designed", KH3's freedom left "long stretches ... with
  very little to do" (https://backloggd.com/u/coralbeau15/; TrueAchievements walkthrough
  https://i1.trueachievements.com/game/KINGDOM-HEARTS-3-Asian/walkthrough/20).
- *What we take:* the open sea is already its own room (`game.opensea`); the crossing stays authored.

### 3.5 Videos to watch before trusting the [play] notes (titles matched only)

Phantom Storm, all three: https://www.youtube.com/watch?v=rwVFnkC3_OE; every Mission 3: https://www.youtube.com/watch?v=n4RaO2WoMU4;
https://www.youtube.com/watch?v=Q9wLPMpT7uU; Assault of the Dreadnought: https://www.youtube.com/watch?v=3xIG9lcb5ww (from
RAIL-SETPIECES.md; this round's searches returned no new video links).

---

## 4. A modular breakdown of the crossing

The owner: three modules, each working alone before they are combined. Below: the shared core, then each module, then how they join.
Names are plain; `above` / `side` / `chase` are the existing view ids.

### 4.1 The shared core (one contract, three implementations)

```
module = {
  id: 'above' | 'side' | 'chase',
  plane(Q) -> { O, U, V, N }            // the play plane in the rail frame: U and V span it, N is its normal (depth for the camera)
  camera(ship, out) -> { pos, look, fov }  // views.js's rig, unchanged
  bounds(camera) -> { uMin, uMax, vMin, vMax } // frustum cut by the plane, inset; chase: the world box
  toPlane(p) -> (u, v)  fromPlane(u, v) -> p  // the only conversion anyone uses
  flatten(vec) -> vec minus its N part       // every aim and every spawned velocity goes through it
  hit(shot, ship) -> bool                    // 2D in (U, V) for above and side; 3D with depth tolerance for chase
  reticle(cursorNDC, ship, foes) -> { aim, near, far, locks }  // derived each frame, never stored as a world point
  patternMode: 'plane' | 'cone'              // patterns.js: plane with up = N; chase uses cone
}
```
- **Foes:** a body with named **muzzles** (Calissa's models export them), a **path** in (u, v) with entry, hold and exit keys timed in
  bars, a **role** (popcorn, pressure, area denial, elite: Boghog's roles), and a **timeline of patterns** per muzzle (CLAUDE.md: a
  scripted fight is a timeline), each with its windup length.
- **The beat clock:** one reader of the cue's bar (`stage.js` clock); patterns, windups and paths take `bar` and return positions in
  closed form; no `+= dt` in anything scheduled.
- **The windup:** `creatures.windup` emitted at the windup's start with the muzzle's place; the rail's telegraph mark draws on the muzzle;
  the volley releases on the beat; a foe downed in its windup cancels the volley.
- **The shots:** `ShotField` unchanged in kind (plain, outlined, astral, umbral), spawned at the muzzle with the module's `flatten`; the
  pool sized so foe shots are never dropped.

### 4.2 The overhead module (`above`: Ikaruga, Mushihime-sama, DoDonPachi)

- **Plane** the sea: U = across, V = along (up the screen), N = up. **Camera** high and slightly back (`VIEW_RIGS.above`), scroll toward
  the top. **Bounds** from the frustum at cruise height. **Collision** 2D.
- **Gun** along the scroll (or to the cursor projected on the sea, if the owner rules twin-stick); **lock-on** a circle on the sea.
- **Foes** enter from the top and the flanks on curves, hold in lanes (5 to 7, none at the edges), exit by the bottom or the far side; big
  foes never drift down onto the ship. **Patterns** in the plane: rings, fans, spirals, walls read best here (the danmaku module).
- **The Astral and Umbral forms read best here** (Ikaruga's view); the Umbral layer can be literally under the sea plane, seen through
  the crude.
- **Alone, it is done when** [own]: a scripted run of 32 bars of the overhead module can be played from a practice start (the pier's list
  or a chat command), every shot seen to pass over the ship is a hit, every shot seen to miss is a miss, every volley has a windup a beat
  long, and the ship reaches each edge of the screen and no further. (No new automated check while the rail is in flux: CLAUDE.md "Test
  lean"; the owner plays it.)

### 4.3 The side-scrolling module (`side`: R-Type, Gradius, Einhänder, the broadside)

- **Plane** the wall: U = along (right on screen), V = up, N = across (into the screen). **Camera** abeam. **Bounds** from the frustum at
  x = 0. **Collision** 2D in (z, y).
- **Gun** along the scroll; **lock-on** on the plane ahead.
- **Foes** enter from the right, above and below (and from the left as a surprise, announced), on the wall plane only; anything at
  x ≠ 0 is scenery. Terrain matters here (the sea's surface is the floor line: the Astral above, the Umbral below the line, visible in
  section: the clearest place to show the two worlds).
- **The broadside** (`abeam`: the pirates' and Old Nobody's flanks) is the chase module's aim turned sideways: keep it a separate case,
  with the set piece the only target off the plane, and its shots crossing the plane only at their target point.
- **Alone, it is done when:** as overhead, plus every fan and ring of the library is seen as a fan and a ring from the side camera (no
  pattern edge-on).

### 4.4 The chase module (`chase`, with `free` and `astern` as variants: Star Fox 64, Panzer Dragoon, Sin and Punishment, the Gummi)

- **Plane** the screen: U = across, V = up, N = along (depth). **Camera** behind and above, following a share of the ship (Star Fox).
  **Bounds** a world box sized to the screen's safe area at the follow share. **Collision** 3D with a depth tolerance (a shot is
  "at the ship" when within the hurtbox in (U, V) and within a depth band that the near reticle's distance makes readable).
- **Gun** to the cursor (NDC ray; the two reticles at 12 and 36 m on it); **lock-on** the RMB sweep, painted by screen distance.
- **Foes** come out of the depth: entry far ahead (small, a silhouette read head-on), hold at a station 30 to 60 m out in a lane of the
  screen, fire, exit to a screen edge or past the camera; a pursuer from behind is shown by the radar and a sound before it enters
  (`astern` or a swing). **Patterns** in `cone` mode toward the ship; rings and fans laid in the screen plane (up = N) so they read as
  rings opening toward the camera.
- **This is the Gummi's module:** the big object with parts sits here (broadside or ahead), the cannonball-as-foe here, the grappler
  answered by the roll here.
- **Alone, it is done when:** the cursor reaches every corner, the aim point is under the cursor, a shot that grows toward the hull and
  overlaps it hits, and the hull never hides the reticle or a windup (the GamesRadar fault: fade or outline the hull when a target is
  behind it).

### 4.5 Combining them

- **Order of work** [own]: chase first (it is the Gummi's, and most of the crossing), then overhead (the danmaku and the forms), then
  side-scrolling (the broadside and terrain); then the swings.
- **A swing** is a bar, on the bar line, nothing new enters (kept). Shared axis kept, the others eased; the input plane turns at the
  midpoint (kept); bounds blend; **shots of the old plane are cancelled into Lachryma motes** (pays the pool: a reason to welcome the
  swing) or fly on as scenery without collision; foes exit or are re-pathed by their shared coordinate; locks persist and re-project; the
  cursor keeps its NDC.
- **Where the threat comes from changes at least once a leg** (RAIL-OVERHAUL pacing law 4) and **is announced** (a radar and a sound toward
  the side, the Gummi's red alert) before the swing, never during.
- **A set piece may span modules** (Phantom Storm: behind, then the camera to the front, then the ship again): its parts are foes with
  muzzles in the rail frame; each module sees the parts on its plane as targets and the rest as scenery (the False Light's keel from
  below, her rigging from above: RAIL-OVERHAUL 4's "a weak point is a world" maps onto "a weak point is a plane").

---

## 5. Rules for our crossing (concrete, each traceable above)

1. **One play plane per module;** everything that can hurt or be hurt lies on it; off the plane is scenery (Einhänder, Gradius V).
2. **Collision in plane coordinates** in the overhead and side-scrolling modules; 3D with a depth band only in the chase module.
3. **Paths are authored in (u, v),** with entry, hold and exit keys timed in bars; formation offsets in (u, v) after the path.
4. **Foes fire only while holding,** never on entry or exit; a big foe never drifts onto the ship; no foe holds at the screen's edge;
   5 to 7 lanes, alternating sides (Boghog, Toaplan).
5. **Every shot leaves a named muzzle** on its body, at the muzzle's world place this frame (read after the body is animated).
6. **Inherit motion by declaration:** detached (default), carried, or inherit, written in the pattern's data.
7. **Aim = ship now minus muzzle now, in the rail frame, flattened onto the plane,** resolved at each release (BulletML's `aim`).
8. **Lay patterns with up = the plane's normal;** turn them onto the aim with a look-at that keeps that up, never by shortest arc.
9. **Every volley has a windup of a known musical length** (a beat for plain shots, half a bar for outlined shots and boss parts, a bar
   for a beam's warning line), drawn at the muzzle and on the rail's telegraph mark, emitted as `creatures.windup`.
10. **A foe downed in its windup cancels its volley** and pays a little more (reading rewarded).
11. **Some shots are foes:** a slow heavy shell (the Gummi's cannonball) can be shot down before it bursts.
12. **Everything scheduled reads the bar,** in closed form; nothing scheduled accumulates `dt` (fix `PatternPlayer`'s `r.t += dt`).
13. **Show at once, sound on the grid:** a down's look is immediate, its sound quantised (Planck).
14. **The foe-shot pool never drops;** a leg's schedule is checked against the cap (Nystrom's "prevent").
15. **Bounds come from the camera** in the overhead and side-scrolling modules (the frustum on the plane, inset); a world box in the
    chase module.
16. **The reticle is derived every frame** from the cursor's NDC or the ship's facing; locks are foes, re-projected; a lock that leaves
    the plane or the frame is dropped with a sound.
17. **A swing cancels the old plane's shots into Lachryma** (or leaves them as scenery), keeps locks and the cursor, keeps the shared
    axis.
18. **The next side is announced before it arrives** (radar and a sound: the Gummi's alert); never a threat from a side not announced.
19. **One foe, one shape, one behaviour,** readable as a silhouette from all three cameras at 480 lines; colour variants are rewards.
20. **Shots: directional, bright core and dark rim, drawn over everything, never the player's colours, never yellow or orange;** the
    background midtone where they fly (Dieterich, Boghog; RAIL-OVERHAUL 8 kept).
21. **The hull never hides a target or a windup** in the chase module (fade or outline it).
22. **A hit costs standing, not just hull:** something visible falls (the chain, a rank step: the Gummi's medal level and Berserk);
    Dovina's to number.
23. **Each module is played alone first** from a practice start; automated checks wait until the owner calls the rail settled (CLAUDE.md
    "Test lean": the rail and crossing are in flux).

**Open, for the owner (through Dovina):** twin-stick aim in the overhead module or fire along the scroll; whether shots of the old plane
are cancelled into Lachryma on a swing or fly on as scenery; whether graze pays; whether the chase module's Mission-3-style quarter turns
(the camera as a verb) belong to any leg.

**Not verified:** KH2's camera behaviour and foe firing beyond the wiki and the tutorial log (watch the longplays); the meaning of the
wave tables' (R) / (G) tags; Star Fox 64's reticle construction (manual text only); Iwata Asks' Sin and Punishment text (503); the
moddb and Medium pieces on telegraphing (403, snippets only); any GDC talk's own words (Vault membership).
