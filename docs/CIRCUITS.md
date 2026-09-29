# The gymnasium, taken apart, and four new lap circuits

A draft: nothing here is built yet. Part 1 lists what the gymnasium is made of (from the code as it stands),
what it measures and what it never asks. Part 2 designs four circuits to fill the gaps. Part 3 is the shared
machinery they would need. Numbers are the measured ones from the basement's rubric (`RUBRIC` in
`src/basement.js`) and `T.movement` / `T.tech` in `src/config.js`; a gap is sized at about 85% of what the
controller can clear, as the ring already does.

---

## 1. Meta-analysis

### 1.1 The parts bin (what exists)

**Core movement** (the gold standard; tuned under `movement`): walk 4.2, sprint 6.8, top speed 14 m/s; jump 0.92 m
high / 2.45 m long walking, 4.0 m sprinting; double jump +1.66 m; slide (boost +2, 1.6 s cooldown, 1.2 s long);
slide-hop; mantle to 3.0 m (jump + mantle 3.4); wallrun (9.5 m/s, about 16.8 m in 1.8 s, drops 2.75 m); wall jump (3 m out,
9.5 m along); air dash (1 charge per airtime). Longest measured chain: max speed + dash + double = 15.2 m.

**Body moves** (always yours): swim, ladders, hang (ledges 1.9 to 2.95 m up, shimmy, bars, zipline), wall latch
(2.2 s of cling), poles and ropes, grates (walls and ceilings), balance beams (0.3 and 0.2 m), carry, push / pull, kick
and parry, recoil jump.

**Movement Arts** (learned): blink (5.5 m, 2 charges), slam and slam-jump / slam-slide, stomp (+1.66 m off a pot),
slip (blob form through 0.8 m gaps, up slip-coated walls), roll (20 m+ falls, evasive dodge with i-frames), and now the
Solar Surfer on the dunes.

**Kit**: the psygun (semi-auto, charge beam, ADS, recoil), 11 shells, Lachryma (a shared meter that blink, dash, flare
and the arts draw on).

**World components**, by room:

| Where | Components |
| --- | --- |
| Hub | height ladder 0.25 to 4 m; clearance gates 1.2 to 2.2 m; slope ramps 10° to 55°; long-jump lane with 1 m ticks; metrics board; the index |
| Ring 1 to 8 | slide slots 1.5 m, hurdles 0.6 / 0.7 m, speed gates; mantle blocks 1.4 / 2.4 / 3.0 m; gaps 3.5 / 5.5 / 7.5 m; wallrun panels and pillar; zigzag of 4 staggered panels; climbs 2.8 / 3.4 m; 17° speed ramp into a 7 m gap; slide chute into a 1.5 m tunnel |
| Tech lab | pool 4.5 m deep with a 5 m dive tower; 6 and 8 m ladder towers; pot field to slam into; slip lane; 9 m blink gap over a pit; stomp stairs; 4 m climb wall |
| Mill | four cogs across a chasm; millstone; conveyors and gates; two freight lifts to a 10 m gantry; 14 m shuttle gap; ferris wheel; steam updraft to a 9 m ledge; kiln stack (57 m well, rail carts, lift, ladder) |
| Rigging | 2.7 m ledge with shimmy; 5.5 m latch pillar; bar / zipline / beam crossing of one pit; 8.6 m grate wall and an overhang; pole, rope, tower |
| Hands | crates to push and lift; targets at 10 / 16 / 22 m; a parry mortar; a 7.2 m recoil platform |
| Dunes | 640 m sand sea, wind, ruins, a spire: the Solar Surfer |
| Siege | an arena: cover, pots, crates, a dais |

**Instrumentation that exists**: checkpoints with a trigger across every entrance, split times and a lap time for the ring
only (`Course.touch`), best times in localStorage, reset floors (`PITS`) that send you to the last checkpoint, R / H.

### 1.2 What it measures well

- **One skill at a time, against a number.** Every station is sized from the rubric, so a fail means a specific skill
  or number is missing. That is what the hub is for and it does it well.
- **Core movement coverage.** Every core verb has a room, and the ring is the only place with a clock.
- **Mechanism variety.** Movers, water, vertical shafts, grates and cables all exist as pieces.

### 1.3 What it never asks (the gaps)

1. **Chaining.** No station needs three different verbs in a row without solid floor between. Ring room 5 (zigzag) is the
   closest, and it chains only wallrun and wall jump. The interesting question, "does your speed and state carry from one
   move into the next", is never asked.
2. **Speed preservation.** Only ring room 7 rewards arriving fast. Nothing punishes shedding speed, so nothing rewards
   slide-hops, wall exits, dash timing or a clean landing line.
3. **Timing under motion.** The mill has moving ground, but each mover is a standalone puzzle, with a checkpoint
   next to it. There is no course that strings movers so that being late at the first ruins the third.
4. **Descent.** Slam, roll, zipline, pole slide and ladder slide are tested as isolated drops. No circuit is a
   *descent*, where the skill is losing height without losing speed or landing badly.
5. **Precision at low speed.** Only the two balance beams ask for narrow lines; nothing asks for a sequence of small,
   exact things (a pole, then a beam, then a bar) where the floor is a reset pit.
6. **Route choice.** Every room is a single line. There are no shortcuts, no risk / reward forks, so lap times never
   depend on a decision.
7. **Aim while moving.** Shooting appears only in the hands room, standing still, at static targets, with a mortar that
   throws on a fixed beat.
8. **Resource pacing.** Lachryma, the dash charge and the two blink charges are never budgeted: a room can be run
   with the meters full every time. (Teleports refill them.)
9. **Non-axis-aligned play.** Everything is on a grid; corners are at 45° at most. Diagonal lines, curves and
   banked surfaces are untested. The dunes are the only curved ground.
10. **Whole-run feedback.** Times exist, but no view of *where* time went, and no way to compare a run against a
    better one.

### 1.4 What a good dexterity circuit does, then

Each new circuit takes two or three of those gaps and makes them the point, reuses existing pieces almost entirely,
and asks for a *lap*: a loop you can run again immediately, with splits, a clean-run bonus (no reset), and a par table.

---

## 2. Four circuits

Par times below are estimates from path length and the speeds above (a clean run is roughly 75 to 85% of top
speed on the flats); they are starting points to be tuned by playing.

### A. THE SPINDLE: chaining and descent (vertical)

*Gaps hit: 1 (chaining), 4 (descent), 2 (speed preservation).*

A 30 m drum tower (new construction; it wants a free 30 x 30 m footprint in the basement, for instance south of the siege arena), run as a helix: **up** the outside,
**down** the inside, a lap being one of each. Nothing on the way up rests on solid floor for more than a stride.

- **Ascent (about 60 m of path).** Start on the floor. Slide under a slot (1.5 m) into a sprint jump (3.5 m gap) onto a
  wall panel; wallrun 12 m round the outside of the drum (the panels curve in three 30° facets, the first curved
  wallrun the game has); wall jump to a latch pillar (5.5 m); latch and crawl 2 m (the budget is 2.2 s, so no dawdling);
  kick off to a ledge at 2.7 m for a hang and pull-up; mantle 3.0 m to the next landing; dash-jump the 9 m gap to the
  inner drum; ladder (8 m) to the top, fast climb (Shift).
- **Descent (about 70 m of path).** From the top: slam (8 m), slam-slide out of it into a long chute (17° like room 7,
  then 30°) that ends on a zipline (12 m long, hang-and-release at the end) over a pot field; roll out of the last 20 m
  drop (the roll art's auto-trigger height); the finish line is a speed gate that wants at least 9 m/s.
- **Skill checks.** Speed at the top of the wallrun (min 8 m/s or the wall jump falls short: the gap is 85% of the
  8 m/s jump); latch budget; slam-slide keeping speed (gate at 12 m/s at the bottom of the chute).
- **New pieces.** A curved wallrun surface (three facets: reuses `wallrun` unchanged if facets are 30°), a long
  slope chute (exists in room 7 and 8, lengthen), a speed-gate reader on the finish (exists: `GATE` popup).
- **Reset design.** The tower is over one big reset floor with checkpoints at the top and bottom only, so a fall costs
  the run, but a fall from the descent is a short walk.
- **Par.** Ascent 22 s gold / 28 s silver / 36 s bronze; descent 9 / 12 / 16 s; lap 32 / 42 / 55 s.

### B. THE MILL RACE: timing and carried momentum (moving ground)

*Gaps hit: 3 (timing under motion), 2 (speed), 6 (route choice).*

The mill's pieces, strung into a single loop with **no safe floor between movers** (a shallow reset pit under all of it,
so you can see the water wheel turning below you as you fail), and a fork:

- Start at the steam updraft (x 39..47): ride it to the 9 m ledge (a launch that gives real height).
- Cog walk (four cogs, meshing): the carried speed of the last cog is your take-off speed into the gantry lift shaft.
- **Fork at the gantry (10 m).** *Low line*: the belts and gates (conveyor with you, then against you), 5 s of pure
  timing; *high line*: the shuttle gap (14 m), needing the shuttle to be on your side when you arrive (a 9 s cycle;
  jump off it fast and keep its speed) then the ferris wheel to the deck. The high line is 6 s faster if the shuttle is
  right and 8 s slower if it is not.
- Finish across the millstone (a turning floor, raised 0.6 m: you can be thrown off it) into the start.
- **Skill checks.** Landing on a mover with the right speed vector (a mover gives you its speed when you leave it: use
  it), waiting versus going, reading a cycle.
- **New pieces.** None physical: a `route` tag per checkpoint so the split table can show which fork you took; a
  second checkpoint on each line so a fork is not skippable.
- **Par.** 48 s gold / 60 s silver / 80 s bronze via the low line; 42 / 56 / 78 via the high line.

### C. THE BRAID: precision without ground (low speed, high exactness)

*Gaps hit: 5 (precision), 6 (route choice), 8 (resource pacing).*

A slow circuit and the opposite of the others: a braid of three lines woven through one big pit, each ~40 m long and a
different skill, that cross each other at five junction platforms. You may change line at any junction.

- **Line 1, the beam line (narrow).** Balance beams 0.3 m then 0.2 m with a 90° turn on a 0.5 m post, a pole down, a rope
  up to the next junction. Nothing above walking speed.
- **Line 2, the rail line (hanging).** Overhead bars (2.6 m swing-jump gaps, alternating with 1.5 m gaps), the
  zipline between junctions 2 and 3 (ends in a catch-hang onto a 2.7 m ledge), a grate overhang crawl.
- **Line 3, the blink line (resources).** Gaps sized for blink (5.5 m) and the dash; you have exactly the charges for
  the line, and a stomp pot at the middle recovers one air jump (a bounce, +1.66 m): spend them in the wrong order
  and the line is not completable. Between junctions, a bauble regenerates Lachryma (a pickup, three seconds of
  safe standing).
- **Junction cost.** Changing line on the fly costs nothing; a junction platform is 3 m wide, so approach speed
  matters.
- **Skill checks.** Lines have very different clocks (line 1 is ~55 s, line 2 ~40 s, line 3 ~25 s but unforgiving),
  so the winning route is a mix, and *which* mix depends on the player. That is the point.
- **New pieces.** Junction platforms (blocks), a pole-to-rope-to-beam sequence (all exist), a beam with a 90° corner (a
  post), a Lachryma pickup placed as a target (exists: `Baubles`).
- **Par.** 34 s gold / 44 s silver / 60 s bronze via the best mix; a "clean" medal for no resets.

### D. THE SANDBAR: the Solar Surfer, slalom and air (dunes)

*Gaps hit: 9 (curved, non-axis-aligned), 2 (speed preservation), 8 (resources).*

A closed loop across the sand sea, marked by glowing gate rings (the same ring the speed gates use, but standing
in the sand), 24 gates over about 1.4 km, with three set pieces:

- **The reach.** Straight, across the wind: 500 m of beam reach. Hitting all six gates without braking
  (they alternate 4 m left and right) tests steering at speed; the surfer's turn rate falls with speed, so the line
  is a small carve, not a lock-to-lock.
- **The lee face.** A ~25 m drop down a lee face to a gate at the bottom that wants 30 m/s. Flare (costing Lachryma)
  through a headwind section later needs saved Lachryma, so how it is spent on the way down matters.
- **The crest run.** Four crests in a row: each is a launch, the gate is in the air on the far side (a 3 m ring at 4 m
  height). Landing a spin gives the boost that makes the next crest reachable.
- **Drift bends.** Two hairpins (150°) at the ruin field; the drift (hold C) and its boost on release turns
  the hairpin into a speed gain instead of a loss (needs at least 0.7 s of drift).
- **Trail as a scorecard.** The fading sand trail (`trailmap.js`) shows the line taken. A best-run ribbon (a slow-fading
  tracer) is laid down as the ghost to beat.
- **New pieces.** Gate rings in the dunes (reuses `strip` and glow), a course list in `dunes.js`, a lap timer (the ring's `Course` timer generalised).
- **Par.** 70 s gold / 85 s silver / 110 s bronze, at ~20 m/s average.

*(A fifth, held back: THE GAUNTLET, a combat-movement lap: moving targets on rails and a parry mortar on a
short fuse along a slide-and-blink route, scored on time plus hits. It needs the target rails first.)*

---

## 3. Shared machinery

All four want the same small piece: a **circuit runner**, made from what `Course` already does.

```
Circuit { id, name, layer, gates[], forks[], par: { gold, silver, bronze }, resets[] }
Gate    { at: [x, y, z], radius | zone: [x0,x1,z0,z1], order, route?: 'low' | 'high' | ..., minSpeed? }
```

- **Data-driven**, in a `src/circuits.js` list, like `CHECKPOINTS`, instead of hand-written per room.
- **Splits, medals, clean-run**: each gate records time and speed; a reset ends the "clean" flag; the finish scores a
  medal from `par`. (`Course.touch` is the model; it currently hard-codes the ring.)
- **Speed-gated gates**: a gate with `minSpeed` shows the speed like the hub's gate popups; missing it does not fail
  the run, it costs a second (a soft penalty, so the run continues).
- **The ribbon**: the best run's path, stored as a sampled polyline (one point per 0.25 s; a few KB), drawn as a glow
  ribbon, or written into the trail map on the dunes. The cheap, useful ghost.
- **Index entries**: one line per circuit in the console (`group: 'CIRCUITS'`); the circuits appear next to the rooms
  they are made from.
- **Stress test**: the fuzzer already visits by teleport (`starts()`); each circuit adds a start, plus an invariant
  "every gate is reachable from the previous one by some sequence" checked offline by a **scripted run per circuit**
  (a recorded input line that clears it, kept in `tools/lines/`), so a level edit that makes a circuit impossible is
  caught by `npm run stress`.

### Suggested order of work

1. The circuit runner and the split table (small; everything else builds on it).
2. **C, The Braid** (no new physical pieces, and the best test of the runner's fork handling).
3. **B, The Mill Race** (also nearly free).
4. **D, The Sandbar** (needs the runner in the dunes and the ring gates, but no new terrain).
5. **A, The Spindle** (the only new construction: the drum and the curved wallrun).
