# The Solar Skiff's tune: precision and paint (Dovina's plan, 2026-10-22)

The owner's ask (2026-10-22):

> "look more into solar skiff customization too for fine-tuning how it handles? We can get that Beam.NG or forza precision, but also
> have some fun modifying with things like color."

This plan has two halves:
- **The tune:** how it handles, sheet and telemetry.
- **The paint:** how it looks, the fun.

It is a plan. Nothing in it is built yet except where it says so.

## 0. What is there now (read from the code, 2026-10-22)

- **The model is arcade and kinematic,** at a fixed 60 Hz step (`courier/skiff/skiff.js:313`). It keeps a heading, a forward speed that
  chases the sail's target, a sideslip that decays by grip, and a height that follows the ground. The slip angle is there implicitly
  (`atan(vl / vf)`), but nothing shows it. It has:
  - no tyre curve;
  - no weight transfer;
  - no suspension beyond one damped follow;
  - no grip by surface: sand, water and Lachrymite handle alike.
- **The parts:** three slots of three each (`progress/skiffparts.js`). Together they multiply six numbers: top, accel, grip, the grind's
  answer and drift, and mass. Mass is read in one place only, a rival's bump (`world/raceway/rivals.js:181`). The parts are chosen at
  the race board's GARAGE tab as radio rows, with no numbers and no preview.
- **The seam is right:** `BoardRules.mult(key)` (`courier/skiff/boardrules.js:55`) already merges parts, City Trial patches and buoys,
  each from a source you can see. A tune is one more source there, so it stays a modifier (the design laws: base change bad, modifiers
  good). Switched off, it restores the stock board exactly.
- **Cosmetics:** one, the hull glaze (fired at the kiln's HULL tab).
- **Two bugs found in the reading:**
  - **The hull glaze never shows in the world.** `Skiff.applyStakes` (`boat.js:283`) resets the hull's colour to white and its
    roughness every frame, over what `glazeHull` set. *Fixed by Petra in `boat.js` (3fd75c4).*
  - **The weather's wind strength never reaches the sail.** The sail's power reads `W.gust` only (`skiff.js:364`). `W.speed` (where
    `CONDITION.wind` and `BRANCH.wind` land, `raceway.js:253`) drives only the pennant. Desire's "the wanting wind blows harder down the
    course" does nothing. It is mine to fix (T1).

## 1. Prior art

- **Forza Horizon's tuning:**
  - the upgrade first, then the tune;
  - every slider with its feel said in words;
  - the Performance Index, one number for the build;
  - the telemetry pages (tyre temperature, suspension travel, slip).
- **Gran Turismo's setting sheet:** a few sliders, each a trade, saved as named setups.
- **BeamNG:** parts change the physics they are made of (mass, where it sits, grip), not a stat bar.
- **F-Zero GX's machine balance:** one slider from acceleration to top speed, the whole tune in one hand. It is the model for each of
  our sliders: one trade, two named ends, stock in the middle.
- **Mario Kart 8's kart builder:** parts whose stats trade, and hidden numbers shown as bars. We show the numbers.
- **Trackmania:** no tuning, so a time is pure skill. That is why the records keep a stock class.
- **Sailing itself:**
  - **Sail trim:** a flatter sail points higher and is faster at the top; a fuller sail drives harder off the line.
  - **Mast rake:** helm balance.
  - **Fin size and toe** (windsurfing, kitesurfing): hold against looseness.
  - **Ballast.**
  - **Rocker:** the hull's curve, turning against speed.

## 2. The tune (the precision half)

### 2.1 The tune sheet: five sliders, each one trade

- **Each slider runs from -3 to +3.** 0 is the stock board, so all at 0 is the board exactly as it is.
- **Each step is 4% on the keys it moves,** so the ends are ±12%. A step moves one key up and its partner down, by the sizes in the
  table.
- **Each end is named in feel, never in a number.** The numbers sit beside the words as stats (CLARITY.md).

| slider | the trade (− end / + end) | keys it moves (+ end) | sailing's own word |
|---|---|---|---|
| **Sail trim** | "Drives hard off the line" / "Faster at the top" | top +, accel − | full / flat sail |
| **Fin** | "Holds the sand, slow to slide" / "Slides early, turns tight" | grip −, carveRate +, turn + | fin area |
| **Rake** | "Steady at speed" / "Sharp turn-in, twitchy" | turn +, wobble tolerance − | mast rake (helm balance) |
| **Ballast** | "Light: quick, kicked about" / "Heavy: carries speed, hits hard" | mass +, accel −, coast − (keeps its way) | ballast |
| **Ride** | "Low: planted, stiff landings" / "High: soaks landings, floats in the air" | hover +, follow −, air drag − | rocker and ride height |

### 2.2 New keys on the seam

`BoardRules.mult` grows six keys, each one token at its call site in `skiff.js`:
- `turn` (`:418`);
- `carveRate` (`:413`);
- `coast` (`:375`);
- `hover` and `follow` (`:475`, `:479`);
- `wobble` (`BAIL.wobble`).

Two more changes go with them:
- **Mass becomes real:** a divisor on accel and on the coast's loss (`:369`, `:375`), the bump's as now. A heavy board winds up slowly
  and keeps its way.
- **Grip by surface:** sand 1, water 0.85, Lachrymite (vein lanes and pads) 1.1. This is a modifier (a source you can see: the
  ground), and it gives the Fin slider something to mean.

### 2.3 The Performance Index (PI)

- **What it is:** one number for the board, 100 for stock. It is the lap time on a reference model of the Sun Circuit, scaled against
  the stock board's time: PI = 100 × stock time / this time.
- **How it is measured:** `scripts/skifftune.mjs` (Dovina's; T3). A point-mass lap along the track's line:
  - corner speed limited by grip and turn;
  - straights by accel and top, with the coast and the climbs;
  - the line's curvature from `world/raceway/track.js`.
  It is not the game's physics. It is a ruler, as `economy.mjs` is for cubes.
- **Every slider's step is costed in PI.** The sliders are balanced so that no corner of the sheet beats stock by more than about 3 PI
  on the reference lap, though a tune may beat it by more on its own kind of track. That is the point of tuning: the Gorge Run rewards
  grip, the Coaster rewards top speed.

### 2.4 Records, rivals, wager

- **Two classes:**
  - **STOCK:** standard parts, the sheet at 0. The Trackmania class, where a time is skill alone.
  - **OPEN:** anything goes.
- **What each class keeps:** medals, bests and the ghost. A record says its class. The ledger keys get a class suffix
  (`race.track.<id>.best.open`).
- **Rivals in OPEN** are paced to your PI, so the rubber band answers your build, not just your gap.
- **The wager's odds** read the class and the PI.

### 2.5 Telemetry (Forza's pages, the System's sight)

- **While you ride:** a slip arc under the board, its needle at the slip angle and its band where grip lets go. It is a world mark with
  no words, Calissa's look.
- **After a run:** a run trace at the race board's GARAGE. A ring buffer of the last lap holds speed, slip angle, sail and grip, drawn
  as two strips over the track's map, with where you slid lit, and the last run's trace beside this one.
- **The trim run:** a short loop from the race board's stone, ridden twice. Once is stock or the last tune as a ghost, once is the new
  tune; the split at each gate shows. This is Forza Horizon's "test drive", and it is how a slider's words become a feel you trust.

### 2.6 Setups

- Up to three named setups, kept in the save's `skiffParts` section. Each holds the parts and the sheet, and is picked at the race
  board.
- A setup can be pinned to a track, so it is worn when you start that track.

### 2.7 How the tune is earned

The design laws apply: arts and their kin only by achievement, a count way and a feat way.
- **The sheet opens with a part.** The first achievement that opens a part also opens the sheet.
- **Each slider opens with its part slot.** Sail trim opens with a sail, Fin and Rake with a keel, Ballast and Ride with a hull.
- **Two new part slots:**
  - **Mast:** the Rake's partner. A tall mast (top, a heavier wobble) and a short mast (accel, steadier).
  - **Fin:** the Fin's partner. A surf fin (carveRate) and a race fin (grip).
  Each is opened by Raceway achievements, a count way and a feat way.
- **No cubes for any of it.** A tune is knowledge, not wealth (skill skips grind).

## 3. The paint (the fun half)

- **The hull glaze:** as it is (fixed, 3fd75c4).
- **The sail's dye:**
  - the seven feelings' colours, each opened when you awaken to that feeling;
  - the cloth's own;
  - a dye for every glaze you own, at the kiln's HULL tab beside the hull.
  - A dye costs a firing's price, as the hull glaze does. It is a sink: chosen, never full.
- **The sail's pattern:** solid, a stripe, a chevron, the feeling's motif (`PAINT_MOTIF`: Wonder's frost, Mirth's dots, ...), and a
  kiln pattern you have fired. Calissa's looks; one opens with each Raceway cup's gold.
- **Your seal on the sail:** your seal (`cradles.mine`) stamped on the cloth, so a race reads as yours. Free.
- **The trail:**
  - **On the sand:** the wake's colour, from a few: its own, Lachryma, the glaze's.
  - **In the air:** the boost's ribbon.
  Opened by the trick combo's achievements.
- **The pennant:** its colour and its length. A small thing, and so a gift: the farewell's feelings, a cup's win.
- **None of the paint touches the handling.** A look is never a number.

## 4. Build order and who

| # | what | who |
|---|---|---|
| T1 | the wind's strength to the sail (`W.strength` from `CONDITION.wind`, square-rooted: x1.16 under desire); the six new keys; mass made real; grip by surface | Dovina (skiff.js and boardrules are the board's own: one token a call site) |
| T2 | the hull glaze fix (`applyStakes` lerps from the glazed base) | done: Petra, 3fd75c4 |
| T3 | `scripts/skifftune.mjs`: the reference lap and PI; the sheet's numbers balanced against it | Dovina |
| T4 | the tune sheet and setups (`TUNE`, `tuneOf`, the save), the two new slots, their achievements | Dovina |
| T5 | the GARAGE as a sheet: sliders with the feel words and the numbers, compare arrows (`ChoiceCard`), the PI | Calissa (the look), Petra (the board's page) |
| T6 | the classes: STOCK and OPEN records, ghosts and medals; rivals paced to PI; the wager's odds | Dovina |
| T7 | telemetry: the slip arc (Calissa); the run trace's ring buffer (Dovina) and its drawing (Calissa); the trim run (Dovina) | Dovina, Calissa |
| T8 | the paint: the sail's dye, pattern and seal, the trail and the pennant | Calissa (looks), Dovina (what opens each, the price) |
| T9 | the parts' and sliders' names | Espada (plain names until the owner calls it settled) |
| T10 | a sound for the sail's trim (the sheet in the wind) | Wanda, if she wants one |

## 5. For the owner

1. **Two record classes, STOCK and OPEN?** My call is yes. Otherwise every best is a tuning contest, and the Trackmania player loses
   their game.
2. **The ±12% ends.** Forza's real ranges are far wider. Ours stay narrow because the skiff is an arcade board, the medal times are
   tight, and a tune should feel like a trim, not a different machine. Wider is one number if you want it.
3. **The wind fix changes how the board feels under desire's weather** (×1.16 speed). Races keep a best per condition already, so it is
   fair, but it is a change you will feel.

## 6. The owner's rulings (2026-10-22)

"I agree with all your skiff plans, and being faster in desire weather is a-okay."
- **Records:** STOCK and OPEN, both.
- **The ends:** ±12%.
- **The wind:** fixed.

**T1 built (2026-10-22):**
- The Raceway weather's wind strength now reaches the sail, square-rooted: desire's 1.35 is a ×1.16 sail. (`skiff.js:364`, `CD.wind`; in
  the Dunes there is no condition, so ×1.)
- Grip by surface: `SURFACE` in `boardrules.js` (sand 1, water 0.85, a vein lane's Lachrymite 1.1), through `rules.surfaceGrip`.
- The six neutral keys on the seam (2190ec58).
- Mass made real waits for T3's ruler, since it would change the Heavy and Light hulls already earned.

**T3, T4, T6 and Dovina's half of T7 built (2026-10-24):**
- **The ruler** (`progress/skiffruler.js`, printed by `node scripts/skifftune.mjs`): a point-mass lap on each track's line (the turn rate
  carving against the curvature, the sail's speed by the wind's polar, slopes, the slip's loss, the carve's tiers paid at a bend's exit,
  a backward pass for braking). Two rulers: a **flying lap** and a **race** (three laps from a standing start, knocked to 55% of its speed
  three times a km: the field). The PI is the race's.
- **What it found:** the tracks are sail-limited, not bend-limited (the reference rider averages 25 m/s against a cruise of 24), so a 1%
  step of top speed is worth about 1 PI and a 1% step of acceleration about 0.1. The Racing Sail (top +7%, acceleration -12%) was a
  straight upgrade (+5.8 PI): a part must be a trade (round 6's law). Rebalanced on the ruler, each part now wins on its own kind of run:

  | part | was | now | PI clean / in a rough field (15 knocks a km) |
  | --- | --- | --- | --- |
  | Racing Sail | top 1.07, accel 0.88 | top 1.03, accel 0.80 | +2.4 / -0.9 |
  | Storm Sail | top 0.95, accel 1.15 | top 0.98, accel 1.30 | -1.8 / +1 |
  | Light Hull | accel 1.08, mass 0.7 | mass 0.7 | +0.1 / +1.8 |
  | Heavy Hull | accel 0.92, mass 1.5 | mass 1.5 (and every bump) | 0 / -1.3 |

- **Mass made real** (T1's last item): acceleration and the coast's loss are divided by mass^0.25 (`MASS`, `skiff.js`): a heavy board winds
  up slowly and keeps its way, so the hulls carry no accel number of their own.
- **The sheet** (`TUNE`, `progress/skifftune.js`): Sail trim moves top 0.25 a step and acceleration -1 (its ends +-3% and -+12%), so its
  ends are +-2.5 PI. Every corner of the sheet (243) is within **2.7 PI** of stock on every track; Fin and Rake barely move the PI
  (the bends seldom bind), so they are feel: the carve's loading, the grip, the wobble. Parts and sheet together reach about +6 PI: the
  OPEN class.
- **The medals on every track** (`RACE.medals`, `race.js`): the Sun Circuit's gold is 0.718 of its reference race; the Gorge Run and the
  Coaster at the same ratio: gold 336 / silver 376 / bronze 435 s and 217 / 242 / 280 s. Each medal pays once a track.
- **T4:** the sheet, opened slider by slider with its slot's first part (`SkiffParts.sliderOpen`); the two partner slots, MAST (Tall: top
  1.02, wobble 0.85, rw44; Short: accel 1.12, top 0.99, wobble 1.2, rw45) and FIN (Surf: carveRate 1.2, grip 0.9, rw46; Race: grip 1.12,
  carveRate 0.88, rw47), each opened by a count way or a feat way; three setups (`saveSetup`, `wear`, `pin`), a pinned one worn when its
  track starts. Kept in `skiffParts` (version 2). No cubes for any of it.
- **T6:** a run's record class (`recordClass`, STOCK or OPEN) on `race.lap` and `race.finish`; the ghost and the best kept per class
  (`race.track.<id>.best.<class>`, `<medal>.<class>`); rw48 Bone Stock (gold on the stock board), rw49 Three Golds. In OPEN the rivals
  answer half your build's edge (skill x sqrt(PI / 100)) and the wager's odds the other half.
- **T7 (mine):** the run trace (`race.traces.last` / `.prev`: s, speed, slip angle, sail, grip at 10 Hz) and the trim run (`MODES.trim`:
  a flying lap against the ghost of your last trim run). The GARAGE prints the trace's numbers; its drawing over the map and the slip
  arc are Calissa's.
- **The GARAGE** (`raceboard.js`): the build's class and PI on each track, the five slots with each part's numbers, the sheet (a
  slider's left half steps it down, its right half up), the setups, the trim runs and the telemetry. Plain rows until T5's dress.
