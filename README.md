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
| WASD / Shift | move / sprint (any direction but backwards) |
| Space / again in the air | jump / double jump (into a ledge: mantle) |
| Space by a wall, holding W | wallrun; Space again to wall jump |
| C | crouch; while running, slide (jump out of it to keep the speed) |
| Shift in the air | air-dash (costs Lachryma, one per airtime) |
| Hold Alt | walk |
| Shift while crouched | roll: a dodge, invulnerable for its first third (also automatic out of a fall of 20 m or more) |
| F | interact: pick up something small (hoisted overhead: fire throws, F sets down) · hold F at a heavy crate: W push, S pull · at the index console (basement hub): pick a room to teleport to |
| V | kick (on the run, or standing; parry a projectile with the timing) |
| E | blink (a learned ability, see The System) |
| B | the System's Codex: Movement Arts, variants, Lab mode, save code (pauses the game) |
| Mouse | look |
| Left click | fire (semi-auto, one shot per click, inputs are buffered) |
| Hold left click | charge the psygun (from cold, no round fired first); release for a piercing beam |
| Middle click | fire the selected shell (seek: hold to paint targets, release to fire) |
| 1–9, 0, − / mouse wheel | pick a shell: slice, push, well, mark, bomb, bank, seek, slip, groove, anchor, hatch |
| M / N | the map / a survey pulse (charts the ground around you) |
| ~ | **the god hand**: the Courier becomes a jar and you become a hand (see below); ~ again to come back |
| Right click (hold) | aim down sights |
| X | holster / draw (firing, aiming or a shell draws it; third person puts it away after 5 s out of combat) |
| Z | toggle first / third person |
| Q | swap shoulder (third person) |
| G | time trial (again to restart) |
| R / H (basement) | back to the last checkpoint / to the hub |
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

## Lachryma (energy)

The psygun runs on **Lachryma**. Plain shots cost a little, and a charge reserves it as it
winds up (refunded if you let go too early). It trickles back slowly, and the rest comes from
**baubles**, gummy cream-coloured drops that pop out of clapperjars, lanterns and marked
pots. They bounce, settle and wobble, then fly to you when you get close. Clapperjars will
eat baubles you leave lying around, and grow fatter (and juicier) for it.

`src/lachryma.js` has the pool as a standalone class meant to be shared by future mechanics:
costs looked up by tag, stacking modifiers (cost multipliers per tag, regen, max bonus),
reservations for wind-ups, all-or-nothing `spend()` and partial `drain()`, and events
(`change`, `spend`, `gain`, `empty`, `full`, `overflow`, `denied`).

## Shells

Special rounds loaded one at a time (the support hand racks each one). Refill at the glowing
**reliquaries** (one per floor).

| Shell | Effect |
| --- | --- |
| Slice | a blade plane along the shot cuts pots, shards, crates and earlier slices cleanly in two; pierces a whole row |
| Push | a cone of force: shelves get swept, clapperjars go flying |
| Well | a lobbed singularity that drags everything into orbit for 3 s, then pops; debris that reaches the core is crushed, and every few pieces condense into a Lachryma bauble |
| Mark | stuns clapperjars (dizzy stars) and marks pots in a radius; marked things glow through walls, take double damage and drop Lachryma |
| Bomb | a lobbed clay grenade: splash damage, a spray of molten slip that splats and cools, and a hot pool that cooks pots and scalds clapperjars |
| Bank | a ricochet round: banks off walls and floors up to 5 times, hits harder each bounce and bends toward a target after each one. ADS previews the first bounce |
| Seek | hold to paint up to 6 targets (the lock-on squares spin in and snap together), release to loose a fan of seekers |
| Slip | a lobbed ball of liquid clay that paints floors and walls wet (dive in: C) |
| Groove | a mirror-ball orb opens where it lands (9 s, 128 bpm): every clapperjar nearby dances and forgets what it was doing, pots and crates hop to the beat |
| Anchor | pins one thing where it is, in mid-air if that's where it was: it turns solid and stays for 12 s (a crate becomes a step, a thrown ball hangs there, a critter is stuck) |
| Hatch | a pot cracks open and a clapperjar climbs out, friendly (a helper that mends cracked pots); a clapperjar hit by it turns friendly. At most 5 helpers |

## The god hand (~)

Press **~** on solid ground and the Courier turns into a **Pneuka jar**, an immobile vessel
(`courier_pneuka.blend`), and you become a disembodied **hand** (`courier_godhand.blend`): the
camera pulls up into a turnable isometric view, the cursor is the hand, and the game becomes a
physics god game over the same rooms. Ceilings and everything above head height are cut away.

| | |
| --- | --- |
| Left click (hold) | the selected God Art: by default telekinesis, grab anything loose; release throws it (as fast as the hand was going); Shift lifts it higher |
| Right click (hold) | the art wheel (1–5 pick too): telekinesis, sunder, swell, wring, manifest, each usable only inside the ground you have explored (see below). Shells are the Courier's; the hand's powers are God Arts |
| Q / E, wheel, WASD or the screen edges | turn the view an eighth of a turn, zoom, pan |
| ~ | back to the Courier where the jar stood (once the vessel is whole) |

The hand is on a **tether**: it can't reach further than 36 m from the vessel. The vessel can be
hurt: **raids** (in the Siege room only, see Raids: crimson clapperjars, kamikaze, from 22 s in and every 34 s, one more
each wave), a lobber's balls, blasts (your own bombs too), and whatever you throw at it. Hits
crack it (the cracks are drawn on the jar); at zero it shatters, and reforges 7 s later at 60%,
its old cracks now gold seams. Counters: grab a raider and throw it away, cut or blow it up, pin it
(anchor), make it dance (groove), or turn it (hatch: a turned clapperjar guards the vessel against
raiders and mends it, the way clapperjars mend cracked pots). A wave cleared gives a shell of each
kind and mends the vessel a little. Everything is in `src/godmode.js`; the shells' new effects in
`src/casters.js`. The stress test drops into it now and then and fuzzes the hand.

## God Arts

In god-hand mode the psygun's shell strip gives way to the **art bar**. Shells are prepackaged
one-shot rounds and cost no Lachryma; **God Arts** are powers of the hand itself and run on
Lachryma (regenerating a little faster while you are the hand). Pick with **1–5** or hold
**right click** for the radial wheel.

| Art | Does |
| --- | --- |
| 1 Telekinesis | hold left click: lift anything loose and throw it (costs Lachryma while held, by weight) |
| 2 Sunder | drag a blade across the floor: everything it passes through above is cut in two on that plane |
| 3 Swell | on a pot or crate, drag up / down: grow or shrink it (its weight follows) |
| 4 Wring | on a pot, drag sideways: twist it; drag up: scallop its walls (pots are re-lathed live) |
| 5 Manifest | drag: raise a wall of clay from the floor, hold for height; it crumbles after a while |

They live in the Codex (**B**) on a second shelf beside the Movement Arts, with variants, and
their numbers are in `T.arts`. Code: `src/godarts.js`.

## The Zone of Influence and psychic cartography

Arts work only where you have **been**: the Zone of Influence is, for now, simply the ground you have explored (there are
no "understanding" prompts; outside it the ground just doesn't answer, and the ring under the hand shows it). Every layer
of the world (the dunes, the basement, the ground floor, the upper floor) is a grid of cells, each holding *knowledge* from
0 to 1 that the veil on the floor shows (grey, amber, gold). Knowledge comes from walking about, from line of sight around
you, and from the **survey pulse** (**N**: a ring of psychic sonar, costs Lachryma, stronger from the hand); around the
vessel the ground is always known. Mapping a whole named room fills it in, and it stays known: it is saved.

* **Compass** (top right): bearing, the layer and place you are in, the mapped cells around you as a little radar, a
  waypoint arrow. North is −Z.
* **Map** (**M**, again to close, or Esc): every layer, drag / wheel to pan and zoom, click to set a waypoint, right
  click to clear, layer tabs, and the named places with how well you know each.
* `src/cartography.js` (grid, pulses, compass, map, the veil); `T.zoi` has the numbers.

## Raids

Raids (waves of crimson clapperjars that make for the vessel) happen in **one room, THE SIEGE** (the index: S; an arena
south of the lab with cover, pots and crates, and a dais), and nowhere else: the timer does not run elsewhere, so the
hand can be learned in peace. `src/raids.js` sends the attackers; `src/siege.js` is the room; the vessel itself only
knows how to be hurt (`src/godmode.js`).

## The dunes and the Solar Surfer

Far below the workshop there is an open layer: a sand sea in a bowl of mountains, low gold sun,
half-buried ruins and a pale spire with a beam of light to sail toward. Take the index console
(**F** in the hub) to **THE DUNES**, or come back any time with **H**. You arrive standing on the
**Solar Surfer**, a hover-board with a light-sail (after the one in Treasure Planet):

| Key | Action |
| --- | --- |
| A / D | steer (quick at low speed, calmer fast) |
| W / S | trim the sail in (a faster cruise) / let it out and brake |
| Shift | solar flare: top speed and acceleration jump, for Lachryma |
| Space | hold to crouch the springs, release to hop; in the air A / D spin, land a spin for a boost |
| C | drift: hold it in a turn, and a long one (0.7 s+) pays out as a burst when you let go |
| Y | stow / summon the board |
| R | start again at the arrival basin |

The psygun is stowed and cannot be fired while you ride.

The board accelerates by itself to a cruise speed that the wind shapes (a beam reach is quickest, dead upwind slowest, but
you never stall); the vane at the bottom left shows where the wind goes and how full the sail is. Gravity does the rest: a lee face is the
fastest anything goes here, the board follows the sand with a little lag, and a crest is a launch. The sand keeps
a fading trail of where you went (a hull wash and a fine score down the middle) with a fan of spray behind, and
footprints when you walk. Stowed, you walk, and the god hand works (no raids in the open). Feel was taken from arcade riders and
karts (auto-acceleration, speed-scaled steering, a loosened keel to drift, the slip paid back as speed on exit),
the trail from Journey's ripple-layer trails and the render-to-texture trail maps of Horizon / God of War: see the headers of
`src/dunes.js`, `src/moves/surfer.js`, `src/trailmap.js`, `src/marks.js`; tuning in `T.tech.surfer`.

## Moving around

Titanfall-flavoured. Sprint works in any direction but backwards. Crouch while running (above
5 m/s, or straight out of a sprint) to slide: the first slide in a while gets a speed boost,
slopes keep you going, and jumping out keeps the momentum (land with C held to chain another).
Jump beside a wall while holding W to wallrun (the camera tilts away from the wall; gravity
eases back in over a second or so), and jump again to kick off it. One air jump, refilled on
the ground and on walls. Push into a ledge while jumping or falling to mantle onto it. Shift in
the air dashes. Air steering never bleeds speed above a run, and landing fast bleeds it over a
moment instead of snapping to run speed, so a quick hop keeps it. Top speed is capped at 14 m/s.
The speedometer (bottom left) shows speed, a short peak hold, and the current move.

Crouching and sliding shorten the capsule to 1.35 m (you only stand up with headroom), and the
first-person eye follows the posed head. In first person only the hands and gun are drawn.

**The walking hitch** was Rapier's character controller occasionally returning zero motion
for a step while the capsule rested in its contact margin, which then zeroed the velocity.
Grounded steps no longer push into the floor, a stalled move is retried, and walls only take
away the velocity pointing into them. Stairs collide as smooth ramps.

## The basement (movement lab)

Drop through the glowing hole in the ground floor's south-east corner; the geyser beside the
landing fires you back up. Hub and spoke, about 5,000 m² (the old basement was ~600):

**The hub** (40 × 40 m) is the metrics gym: fixed, labelled references everything else is
measured against, so future spaces share one rubric.

- a height ladder (0.25 to 4 m, toned by what it takes: step, mantle, jump + mantle,
  double jump + mantle)
- clearance gates (1.2 to 2.2 m; the courier is 1.7 m standing, 1.9 with the hair, 1.35 m crouched)
- slope ramps (10° to 55°; 46° is the steepest you can walk up)
- a long-jump lane with 1 m ticks and the measured chain distances marked
- a metrics board: live values from the tuning panel next to the measured chains
- the index: a console in the hub (F) that lists every room and teleports to its checkpoint, one entry per room

**The ring** (16 m wide) is a loop of eight rooms, one skill each, with a checkpoint across every
entrance and split times (and a lap time) between them:

| Room | Skill | What's in it |
| --- | --- | --- |
| 1 S | run / slide / hop | 1.5 m slots to slide under, 0.6 and 0.7 m hurdles, two speed gates |
| 2 SE | mantle | 1.4, 2.4 and 3.0 m blocks up to the platforms |
| 3 E | gaps | 3.5 m (sprint jump), 5.5 m (double jump), 7.5 m (jump, then dash) |
| 4 NE | wallrun + wall jump | run the wall, jump across before the pillar, run the panel |
| 5 N | zigzag | wallrun and wall jump between four staggered panels |
| 6 NW | climb | 2.8 m (jump + mantle), 3.4 m (double jump + mantle) |
| 7 W | speed | slide a 17° ramp to top speed, jump a 7 m gap at the bottom |
| 8 SW | low | slide chute into a 1.5 m tunnel, back to room 1 |

Rooms 3 to 7 are over a reset floor: touch it and you're back at the room's checkpoint.
**R** returns to the last checkpoint, **H** to the hub. Teleports refill Lachryma.

**The rubric.** Distances were measured by simulating the controller at default tuning
(takeoff to landing at the same height): walk jump 2.45 m, sprint jump 4.0, slide-hop 5.3,
sprint + double jump 6.7, max-speed jump 7.9, slide-hop + double 8.5, sprint jump + dash 9.1,
sprint + dash + double 12.9, slide-hop + dash + double 13.7, max speed + dash + double 15.2.
Jump height 0.92 m, double jump 1.66 m. (Re-measured in round 10: the first run's test
teleport left the body 0.85 m up, which read about 2% long. The controller didn't change.) A wallrun over a drop covers about 16.8 m in 1.8 s and
ends 2.75 m below where it started; a wall jump carries 3 m out and about 9.5 m along. Gaps
are sized at about 85% of the measured distance.

Underground, the sun is switched off (it would light the lab outside its shadow frustum) and
the fog thins.

## Movement techs

Optional techniques over the core movement (`src/moves/`). The core (walk, sprint, crouch,
slide, jumps, wallrun, wall jump, mantle, air dash, tuned under `movement`) is the gold
standard the basement is measured against, and techs never change it: each lives in its own
module with its own `tech.<id>` tuning and an `enabled` switch, and acts only through a few
hooks (an active tech owns the fixed step; landing events; its own pose layer and camera).
Switching one off gives back the core exactly; the measured metrics above are identical with
every tech on or off. Techs start in priority order and only one is active at a time.

Some techs are *Movement Arts* you learn (see **The System**); the body moves (swim, ladders,
hanging, poles and ropes, grates, balance, carrying, pushing) come with a humanoid. In **Lab mode**
(Codex, B; the default while it's just us testing) every art is unlocked: that's what the tech
lab and the stress test use. Techs are *active* (one owns the movement step at a time) or
*passive* (carry, kick, recoil: they run beside whatever else is going on).

| Tech | Input | What it does |
| --- | --- | --- |
| Blink | E | a near-instant 5.5 m dodge along the move keys (or the view), sliding along anything in the way; leaves an afterimage, comes out with your momentum pointed where you blinked; 2 charges |
| Slam | C in the air, looking down, 1.8 m+ up | straight down; the landing breaks pots nearby and throws the rest (and clapperjars). Then Space: slam jump, higher the further you fell (about 2 m from 5 m); hold C with a direction: slam slide, the fall turned into speed. (Looking ahead, C in the air stays the core's landing slide) |
| Stomp | land on a pot or a clapperjar | it breaks under you and throws you up (+1.66 m), air jump refilled |
| Roll | Shift while crouched; automatic only out of a fall of 20 m or more | a low dash the way you steer (or face) with invulnerability frames at the start (`player.invuln`, ready for a damage system); out of a fall it also mitigates the landing and turns the fall into forward speed (above slide speed the core slides instead). Space out of the second half keeps the speed |
| Slip dive | hold C on slip | melt into liquid clay: a fast blob (10 m/s) through slip, crawling off it; climbs slip-coated walls, fits through 0.8 m gaps, Space launches out (higher than a jump, keeping the speed), let go of C to stand. Lachryma soaks back in meanwhile. The SLIP shell (8) paints floors and walls wet; burst slip barrels leave puddles |
| Swim | deep water | float with your head out and paddle (Shift faster); C dives and you swim where you look; Space rises, and at the surface hops out; swim into an edge to climb out |
| Ladder | walk (or jump) into one | W / S climb (Shift faster), C slides down, Space kicks off, climbing past the top steps off; the limbs climb contralateral (right hand with left foot, a rung apart) and each hops two rungs when the body has passed it. The gun stays out at a walk (one hand climbs, one shoots); a fast climb or a slide stows it |
| Hang | jump at a ledge 1.9-2.95 m up with W held; jump at an overhead bar or cable | both hands catch it and you dangle (the gun hand stays on the gun: aim and fire). A / D shimmy along a ledge, W pulls up onto it, Space kicks off, C drops. On a bar, W / S go hand over hand and Space swings you on (a 2.6 m gap is a swing-jump). A slanted cable is a **zipline**: it runs you down, hanging, and lets go at the end |
| Wall latch | C in the air beside a wall (not looking down) | cling by the feet and one hand (the other free for the gun), WASD crawl along it, Space kicks off, over the top is a mantle. 2.2 s a jump, then you slide; the time comes back on the ground |
| Pole / rope | walk (or jump) into one | arms and legs round it: W / S climb (Shift faster), A / D swing round a pole, C slides, Space jumps off. A rope hangs from its top and sways with you |
| Grate | walk into a grate wall; jump up under a grate ceiling | any direction, for as long as you like. W / S / A / D on a wall; up under a roof it meets, W carries you on out under it (until you look elsewhere), then WASD crawls where you look; the roof's edge lets go. C drops, Space kicks off a wall or hops off a roof |
| Balance | walk onto a beam | a careful step (1.9 m/s) with your arms out, settling on the middle by itself; Shift is a trot that wobbles you off it and takes steering back. The beam is as wide as your boots (0.3 m and 0.2 m in the lab) |
| Carry | Z at something small (pots, crates up to 0.9 m) | Zelda-style: a crouch and both hands under it, hoisted over your head (0.55 s), then 72% speed, no sprint, no gun. Fire throws it along where you look (pots shatter where they land, targets ring); Z sets it down |
| Push / pull | hold Z at a heavy crate (over 0.9 m) | take hold and slide it along the way you face: W pushes, S pulls. It can't turn; a wall stops it and lets go if it gets away |
| Kick / parry | Z on the run, or with nothing to lift | a leg swing that knocks pots (and cracks them), crates, clapperjars, and rings targets. The first 0.25 s is also a parry: kick a projectile coming at you and it goes back where you look (with a little help toward a target), and you are invulnerable for a beat |
| Recoil jump | shoot down (steeper than ~20°) in the air | the gun's kick is real: up and back the way the barrel points, three shots a jump (a charged shot counts two), back on the ground; costs what a shot costs |

**The tech lab** is through room 1's south door (or the LAB entry in the hub's index): a
station per tech, each with a checkpoint (T1-T6, R returns to it). The pool (4.5 m deep, a 5 m dive tower, a wall to swim under, a ladder out), 6 and
8 m ladder towers (the 8 m one is the slam / roll platform over a field of pots), the slip
lane (a 0.8 m gap only the blob fits, a slip-coated 6 m wall), a 9 m blink gap over a reset
pit, stomp stairs (pots on rising pillars, a bounce apart) and a 4 m wall to climb.

**The rigging and the hands** are two more wings, west of the lab (through its west door, or
the index console's RIGGING / HANDS entries). *The rigging* (`src/riglab.js`, built with the
`Rigging` class in `src/moves/rigging.js`: bars, poles, ropes, grates, beams): R1 a 2.7 m ledge to
catch and shimmy with a shelf of targets behind you, and a 5.5 m pillar to latch up; R2 a pit
crossed three ways at once, on two overhead bars a swing-jump apart, a 15 m zipline from a tower,
and two balance beams (0.3 and 0.2 m); R3 an 8.6 m grate wall up to a grate roof that runs out
over a pit to a tower; R4 a pole to slide down, a rope to climb, and a tower to get back up.
*The hands* (`src/moves/carry.js`, `push.js`, `kick.js`, `recoil.js`, `src/lobber.js`): H1 heavy
and small crates and a 3.2 m wall to stack up to; H2 a throwing range (targets at 10, 16 and 22
m) with pots and crates on a bench; H3 a mortar that throws a glazed ball at you every few
seconds (kick it back at the two targets beside it: a parry); H4 a 7.2 m platform you can only
reach by shooting down in the air.

## Moving ground, and the clockwork mill

**Movers** (`src/movers.js`) are kinematic platforms driven by a pose function of time: shuttles
(lifts, gates, rail carts), cogs (a turning disc), pendulum swings, orbiters (a wheel's
gondolas), belts (a fixed surface that moves), plus updraft columns. A rider is **carried** by the
platform (the controller moves the rider against it, then the whole move is carried by the
platform's displacement under the feet, which is exact for a turning cog: the radius holds to the
millimetre) and **keeps its velocity** when it leaves: a jump off a 4 m/s shuttle starts at 4 m/s,
a step off a rising lift keeps rising. Locked feet ride the platform, mantles aim at a moving
ledge, and anything a platform moves into is pushed out along the shortest way. The core
controller only ever sees a `carry`: with none, the measured metrics are unchanged.

**The mill** is east of the tech lab (the lab's east door, or the MILL pad in the hub):
- **Cog walk**: a chasm crossed on four meshing cogs (12 teeth, phased so they really mesh; each
  turns the opposite way, so at the contact the surfaces move together). Steer, or the turn
  carries you off the side.
- **Millstone**: a stone wheel raised 0.6 m that turns under your feet, under a hopper.
- **Belts and gates**: conveyors with and against you (3 m/s) and gates that lift and drop.
- **Lifts, gantry, shuttle**: two staggered freight lifts up to a 10 m gantry, a 14 m gap crossed
  on a shuttle (jump off it moving and clear it by metres), a ladder down.
- **Ferris wheel**: board a gondola low, ride round, hop onto the deck at the top (ladder down).
- **Steam**: an updraft column to a 9 m ledge.
- Wall gears (three meshing on the south wall, two on the north), a line shaft with pulleys
  turning overhead.

**The kiln stack** beyond it is a 57 m well: depth bands on every wall, a ladder floor to brink,
a freight lift (the slow way up), and two rail carts running on the floor: the moving targets.
Look down and slam from the brink (or from higher): a 57 m fall takes about 2.4 s, and you
steer 3 m/s to meet a cart that has moved. That is the **Super Slam** feat.

## The stress test

`tools/stress.mjs` (Playwright; `npm i --no-save playwright`, `npm run dev`, then
`npm run stress -- --seed 1 --runs 40 --ticks 900`) drives the simulation with random,
human-shaped input from teleports all over the workshop, in Lab mode, and checks after every step:
finite numbers, the body not inside geometry, sane speeds, the blob form only while slip diving,
no controller stall, no tech stuck for a minute, no falling out of the world. `--pairs` runs every
pair of techs alone with the rest off (the interference matrix: 154 configurations with 17 techs). It exits
non-zero on a violation and prints where, with the last few moves and what the body was inside.
The player's own safety net (`Player.guard()`, and a check on every move that pulls a move back
to the last clear spot if the controller leaves the capsule inside a wall) is counted, not hidden:
the stress test reports how often the controller needed catching.

## The System

Nothing here is bought with experience points: **skills are learned by doing.** The core movement
(and the body moves: swimming, ladders, hanging, poles, grates, balance, carrying, pushing) is yours from the start; the Movement Arts are earned, each by something you
can do with what you already have, and each has variants with harder asks. Press **B** for the
Codex: the Movement Arts, what you know, the shapes of what you don't (a hint, and a bar that only fills as
you get closer), and which variant is selected. The game pauses while it's open.

| Ability | Learned by | Variants (and what earns them) |
| --- | --- | --- |
| Blink | 20 air dashes | **Rush** (30 blinks): 8 m; **Flicker** (a blink right after a blink, 8 times): 3 short charges |
| Slam | 3 drops of 12 m or more | **Quake** (40 slams): a wider shockwave; **Super Slam** (slam onto a *moving* target from 50 m up: the kiln stack's carts): a huge double ring, a taller slam jump |
| Roll | 5 hard landings | **Tumble** (15 rolls): rolls from lower falls, faster, longer invulnerable |
| Stomp | 25 pots broken | **Spring** (three stomps in a row): a higher bounce |
| Slip dive | 6 slip-shell splats | **Tide** (90 seconds under the slip): faster, higher launch |
| Wall latch | 6 ledge and bar hangs | **Iron Grip** (15 latches): longer, faster |
| Kick & parry | 15 pots broken | **Counter** (4 parries): a wider parry window, thrown back harder, longer invulnerable |
| Recoil jump | 15 shots fired in mid-air | **Boost** (25 recoil jumps): harder kicks, one more a jump |

All the arts you've learned are always on (there is no loadout: the Codex shows how to earn the
rest, and which variant of each is selected). Progress saves as you go, and **EXPORT CODE / IMPORT** carries a save between
browsers (`FFS1.<base64>.<checksum>`). A variant only changes its ability's tuning
(`skills.js: cfg`), laid over `tech.<id>` through a live proxy, so nothing about the core moves.

How it works: everything that happens is reported to an event bus (`src/events.js`:
`jump`, `land {drop, fall}`, `slide.end`, `wallrun.end`, `dash`, `blink`, `slam.impact {height,
target}`, `target.hit {cause, drop, moving}`, `break`, `tech.start/end`, ...). `src/system/skills.js`
is the data: a goal is `count`, `feat`, `sum` or `chain` over events. `system.js` feeds events
to the goals of whatever's still to learn, unlocks and saves; a tech asks
`system.allows(id)` before it may start (`Tech.usable()`). New moves ship with an unlock rule, a
variant and a lab station.

## What's in the room

- **Ground floor**: shelves, workbenches, pottery wheels, slip barrels, a drying rack, a
  balcony with stairs (storage bay underneath), a ramp platform, and the kiln flanked by
  jōmon flame-rim pots.
- **Second floor** (up the balcony stairs, or ride the **Lachryma geyser**, the glowing ring
  under the atrium): a sculpture gallery (a giant goggle-eyed dogū, haniwa figures, busts,
  endless columns), a porcelain showroom, teetering bowl towers, an upper kiln, and a mobile
  of lanterns hanging through the atrium.
- ~290 procedurally lathed pots and sculptures in three clay bodies that break differently:
  **stoneware** (big slabs), **earthenware** (mid shards), **porcelain** (slivers and
  glittering dust).
- **Ember urns** explode and chain-react. **Slip barrels** burst into a mess of liquid clay.
- **Lanterns** on 8-segment ropes: shoot the rope to drop them, shoot the lantern and the
  rope whips.
- **Clapperjars** on both floors. They wander, taunt you (lid clapping, waving), nap when
  you're far away, eat baubles, stumble and bolt from near misses, hide behind big pots and
  peek out, and shatter from shots, slices, blasts, scalding and long falls.

## Animation

Motion comes from three places, in this order of preference: baked clips (Quaternius UAL Standard,
retargeted to the Courier by `tools/bake_anims.mjs` into `src/assets/anims.bin`), clips authored
once at startup from key poses (`src/authoring.js`, `src/authored.js`), and only then a light
runtime IK correction on the contact points.

- **Authored clips** are built on the Courier itself: for every frame the body is put in a base
  pose, the hips and spine are placed, and each hand and foot is solved with two-bone IK onto a
  contact taken from the level's geometry (ladder rung pitch and reach, a ledge's lip, a pole's
  radius, a grate's face). The result is stored like any other clip. `warn.mjs`-style checks (the
  builder logs `contacts out of reach` in the console) keep every contact within 2 cm. At runtime
  a tech plays them **by distance**, not time: a ladder cycle is two rungs of climbing, a hang
  shimmy is 0.4 m of travel, a pole cycle 0.9 m, so the limbs in stance stay planted while the body
  moves past them, and going the other way is the same clip in reverse. Stopped, the cycle eases
  to the nearest phase where every limb holds.
- **Clips authored**: `ladderUp` / `ladderSlide`, `hangLedge` / `hangShimmy` / `hangBar` /
  `hangBarGo`, `poleUp` / `poleSlide`, `grateSide` (the wall latch and grates reuse the ladder
  cycle up and down, and blend to `grateSide` moving sideways; under a grate roof the hang bar
  clips play).
- **Aim profile**: a tech can say `get aim() { return { arm: 'R', turn: 0.3 } }`: only the gun
  arm aims (arm IK) while the other hand keeps its hold and the torso hardly turns, so you can
  shoot one-handed off a ladder, a ledge, a pole or a grate.
- **Layers**: the base locomotion clip, then each tech's `animate` (a clip, weighted), the aim
  layer (masked), stride warp and foot IK, the tech's `afterPose` (small body corrections: the
  torso under a carried load, the lean of a kick, the body drawn in toward a ledge wall), and
  last `hands`: the contact correction that puts palms and soles on the surface, capped at a few
  centimetres so the clip's motion is what you see.
- Push uses the UAL `push` clip; balance beams keep the locomotion clip with soft, bobbing arms.
- `tools/bake_cmu.mjs` (with `tools/cmu_clips.json`) probes, finds loops in, and retargets BVH
  files from the CMU database onto the Courier; use it to add real climbing or kicking clips.

## How it works

| File | Role |
| --- | --- |
| `src/main.js` | bootstrap, fixed-step loop (60 Hz physics, interpolated camera) |
| `src/player.js` | Rapier kinematic character controller (slide, wallrun, mantle, dash), FP/TP camera, recoil punch |
| `src/weapon.js` | firing, spread/bloom, hitscan, reload, holster timing, first-person gun pose |
| `src/character.js` | the Courier: clip blending by movement state, pistol aim offset, gun socket, IK corrections |
| `src/animator.js`, `src/anims.js` | pose buffers, clip sampling/blending, the baked clip pack decoder |
| `src/authoring.js`, `src/authored.js` | the clip author (IK key poses baked into clips) and the ladder / hang / pole / grate clips |
| `src/indexmenu.js` | the index console UI (one teleport per room) |
| `src/pottery.js` | pot profiles, shape modifiers (lobes, twist, flame rims), surface patterns, clay materials, fracture |
| `src/breakables.js` | spawning, shattering into physics shards, ropes, impact breaks, explosions |
| `src/clappers.js` | clapperjar AI (wander, forage, taunt, nap, hide, flee) + procedural layers over the authored clips |
| `src/lachryma.js` | the Lachryma energy pool + collectable baubles |
| `src/shells.js` | shell inventory and the first five shell effects, projectiles, molten/slip fluid |
| `src/specials.js` | ricochet and homing shells, lock-on reticles |
| `src/cracks.js` | crack paths on pot surfaces, kintsugi gold seams |
| `src/trial.js` | the time trial |
| `src/basement.js` | the basement movement course |
| `src/techlab.js` | the tech lab annex |
| `src/mill.js` | the clockwork mill and the kiln stack |
| `src/riglab.js` | the rigging and the hands wings west of the lab |
| `src/lobber.js` | clay mortars that throw balls to parry |
| `src/godarts.js` | the five God Arts, the radial wheel, the art bar |
| `src/cartography.js` | the map grid, Zone of Influence tiers, compass, map screen, survey pulses |
| `src/dunes.js`, `src/moves/surfer.js` | the sand-sea layer (terrain, sky, ruins, wind) and the Solar Surfer |
| `src/trailmap.js`, `src/marks.js` | a fading top-down trail map any surface can read, and what feet and boards write into it |
| `src/rom.js`, `src/romdata.js` | range-of-motion limits applied after every pose (fingers, elbows, knees, wrists) |
| `src/siege.js`, `src/raids.js` | the Siege room and the raids that only happen there |
| `src/godmode.js`, `src/casters.js` | the god hand (isometric view, grab / cast, the vessel, raids) and the groove / anchor / hatch shells |
| `src/movers.js` | moving ground: shuttles, cogs, swings, orbiters, belts, updrafts, rail carts and targets |
| `src/events.js` | the event bus everything reports to |
| `src/system/` | the System: `skills.js` (what can be learned, and how), `system.js` (progress, saves), `codex.js` (toasts, the Codex) |
| `tools/stress.mjs`, `tools/stress.page.js` | the stress test (random-input fuzzing with invariants) |
| `tools/learn_rom.mjs` | learns finger joint limits from the game's own clips into `src/romdata.js` |
| `src/moves/` | movement techs (`techs.js` the framework, one module per tech, `env.js` water, ladders, slip coverage, `rigging.js` bars, poles, grates, beams) |
| `src/slicing.js` | plane cutting for triangle meshes (with wall caps) and convex point sets |
| `src/fx.js` | tracers, muzzle flash, particles, chips, bullet-hole decals |
| `src/audio.js` | all SFX synthesized with WebAudio (no audio files) |
| `src/level.js` | greybox workshop and prop placement |
| `src/outline.js` | inverted-hull outlines (matches the .blend's Solidify outline look) |

**Fracture.** Each pot is a lathe (profile × radial segments) with optional lobes, twist and
flame crests. On break, the surface is resampled on a jittered grid whose cell size comes from
the clay body and the pot's size, each cell is cut along a random diagonal, and neighbouring
triangles are grouped into shards. Each shard is the convex hull of its outer points plus
the matching inner-wall points, so it gets both a render mesh and an exact Rapier collider.
Shards near the bullet's impact are smaller and get more push.

**Animation.** The Courier is driven by authored clips with IK corrections on top. The
clips are from Quaternius' [Universal Animation Library](https://quaternius.com/packs/universalanimationlibrary.html)
1 and 2 (the free Standard tiers, CC0), retargeted offline onto the Courier rig by
`tools/bake_anims.mjs` into `src/assets/anims.bin` (about 220 KB). Both rigs rest in a
T-pose, so each bone's world rotation away from the T-pose carries straight over.

- **Locomotion:** idle, walk, jog and sprint play on one shared phase and blend by speed.
  Each loop is measured at load: an in-place clip's planted foot slides back under the hips at
  the speed the character is meant to travel, so that's its ground speed (walk 0.75 m/s, jog
  4.7, sprint 4.7: the jog is authored almost exactly at the 4.2 m/s run), and each loop
  plays at ground speed / its own, split between cadence and longer strides, so the feet
  don't skate. The walk
  covers up to a brisk 2.4 m/s (Alt to walk, aiming while moving) by lengthening its steps
  before its cadence, then hands over to the jog; the hips drop for long strides so the legs
  can reach. Foot locking pins a planted foot where it landed until the cycle lifts it (or
  the body gets 35 cm away), which catches what's left: speeding up, turning, blending.
  Aiming while strafing or backpedalling turns the hips toward the move and the chest back to
  the aim (orientation warping); backpedalling runs the loops in reverse.
- **Moves:** jump take-off into the airborne loop, a tuck flip on the double jump, the
  landing squat (lighter at a run), slide drop-in and hold, the climb clip timed to the
  mantle, a stretched-out take-off frame pitched forward for the air dash, and a sprint with a
  roll off the wall for wallruns.
- **Gun:** the psygun sits in a socket on the right hand (fitted to the palm from the pistol
  aim pose), so the gun follows the hand rather than the hands chasing the gun. When the gun
  is up, a pistol aim offset (aim down / level / up) is layered over the upper body and the
  chest turns the last few degrees so the barrel lines up with the crosshair. The support
  hand is IK'd onto the gun. Relaxed, the gun just rides in the hand through the run cycle.
- **IK corrections:** feet onto slopes and stairs (the hips drop for the lower foot), the
  wall-side hand flat on the wall while wallrunning, both hands on the ledge at the start of
  a mantle, the support hand on the gun. Each chain bends toward its *animated* elbow or knee,
  so the correction stays on the animated side and can't flip.
- **Holster:** the gun lies across the small of the back like a fanny pack, barrel to the
  left, grip out on the right (on show from behind). The draw (0.26 s) reaches back, the
  shoulders turning to help, grabs the grip, and whips the gun round the right hip up into
  the hand; holstering reverses it. Clicking while holstered draws and fires as soon as the
  gun is out. Swimming, fast ladder climbs and slides, and carrying stow it (both hands are busy) and bring it back after; hanging, latching, walking a ladder and the rest leave the gun hand alone.
- **Hand swap:** on a right-side wallrun the gun passes to the left hand (a quick hand-off,
  both hands on it mid-way) so the right can take the wall; aiming then uses the mirrored
  pistol pose, and in first person the gun moves to the left of the screen. Poses mirror
  left/right in character space, corrected per bone so the rest pose maps to itself (the
  rig's left and right bones don't share axis conventions).
- **Slopes:** a slide lies along the ground under it (pitched down a hill, rolled across one).
- **First person:** only the hands and the gun are drawn. The arms are view-model arms: the
  shoulders hang off the camera, and the hands are pinned to the gun.

To rebake after changing the clip list or the rig, get the Standard `.glb` files of both
libraries and run `node tools/bake_anims.mjs ual1.glb ual2.glb`. `npm run dev` then
`/dev/animlab.html` is a clip viewer for picking frames.

Crouching uses a 1.35 m capsule, which is where the crouched body (hair included) tops out;
crawlspaces are 1.5 m.

**Impulses on ropes**: Rapier recomputes a multibody link's velocity from its joint
coordinates, so a raw impulse on a rope link or a hung pot is lost. `physics.kick()` turns
impulses on links into a one-step force instead.

**Ropes** are chains of sensor links on Rapier multibody (reduced-coordinate) joints, so they
stay stiff under heavy pots. The links are sensors because contacts on multibody links
produce NaNs; cutting a rope needs Rapier 0.21+ (0.14 panics on joint removal).

## Character assets

Animation clips: Quaternius, Universal Animation Library 1 & 2 (Standard), CC0 1.0 -
https://quaternius.com. Retargeted to the Courier; see **Animation** above. (Only the free
Standard tiers are used; the paid full tiers are not included.) Motion capture: CMU Graphics Lab
Motion Capture Database, free for research and games, no resale of the data itself
(http://mocap.cs.cmu.edu), retargeted with `tools/bake_cmu.mjs` from the BVH conversion;
`src/assets/anims_cmu.bin` is that exploratory pack (not loaded by the game yet).

`tools/export_godmode.py` exports the god-mode assets (`source_assets/courier_godhand.blend`, a rigged hand, and `courier_pneuka.blend`, the jar) to `src/assets/godhand.glb` / `pneuka.glb`.

`tools/export_courier.py` converts the source `.blend` (kept in `source_assets/`) into
`src/assets/courier.glb` and `src/assets/psygun.glb`, which are bundled into the JS build.
It strips the Solidify outline shells (outlines are rebuilt in-engine) and exports the rig
in rest pose.

```bash
pip install bpy==4.5.*   # Blender as a Python module (Python 3.11)
python3 tools/export_courier.py path/to/courier_base_rigged.blend
```

`tools/export_clapperjar.py` does the same for `source_assets/clapperjar.blend`, exporting
its idle, sprint and stumble actions as clips.

The .blend's armour and mask textures point to files outside the .blend, so the
prototype uses flat terracotta materials.
