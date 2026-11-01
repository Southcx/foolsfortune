# Stealth, and the Veritome as a safari

South, 2026-11-01: "Plan and execute on stealth only for now, consider it an update to Figment AI and behavior and part of a bigger
'pokemon snapification' of how the veritome works, which is a lachryma tool that definitely needs some updating both visually and
mechanically as sort of like our 'mental safari' tool, hunting down and snapping pictures of Figments."

This plan has two parts:
- **Stealth (sections 1 to 7).** Planned and built this round. The rules are `src/progress/stealth.js`, the counts are
  `tracking/stealth.js`, and the achievements are `progress/stealthachievements.js`.
- **The safari (section 8).** The Veritome's larger overhaul. Planned only, to be built next with Petra and Calissa.

The research, every number with its source, is kept in three files:
- `research/STEALTH-SNAP.md`: the photo-safari games, the stealth games, ethology and photography.
- `research/STEALTH-AUDIT.md`: what the minds and the Veritome do today, file by file.

## 1. What is there, and what was missing

The minds already see and hear the way Thief's guards do (`creatures/ai/`, docs/AI.md):
- **Sight:** a cone with a line of sight, recast every 0.25 s.
- **Awareness:** it fills from a glimpse, "?" at 0.35 and "!" at 1, and ebbs after 2.5 s unseen.
- **Feel:** a short radius where a creature knows you without eyes.
- **Hearing:** stimuli with a radius.

The Courier's side was one line: a fixed `loud` by speed and crouch (brain.js). Four things were missing:
- **Footsteps made no noise.** `move.step` went only to the audio.
- **Light, weather and stillness changed nothing.**
- **A creature watched with the same eyes every frame.** It had no rhythm to read.
- **The camera did not care whether a Figment knew you were there.**

So stealth is not a new system. It is the Courier's side of the existing one, plus the watcher's rhythm, laid as modifiers on the minds'
one substrate (CLAUDE.md: base change bad, modifiers good).

## 2. Prior art, and what was taken

| from | what | where it went |
|---|---|---|
| Thief, The Dark Mod | loud and quiet surfaces; the light gem; alert stages whose forget time grows by stage | `STEP.surface`, `EXPOSE.light`, caution |
| Mark of the Ninja | noise as rings you can see; the cone's edge forgiving; the rules shown, never hidden | the noise ripple and the head tell (section 5) |
| Metal Gear Solid | Alert, Evasion, Caution | caution after a fright (section 3.4) |
| Splinter Cell | your noise against the ambient | rain and hail cover footsteps |
| Breath of the Wild | the sneak, wildlife that spooks | crouch and prone as a sight and noise multiplier |
| New Pokemon Snap | stars rate the behaviour, not the framing; behaviour unseen is the prize | the candid multiplier; section 8's two readouts |
| Deer stalking | move while the head is down, freeze when it comes up | the watch (section 3.3) |
| Ethology | vigilance bouts; Hediger's flight zones; a direct or fast approach flushes sooner (Stankowich and Blumstein 2005, a meta-analysis); habituation | the watch now; flight rings and habituation next (section 7) |
| Wildlife photography | the candid frame; "if it moves away, you were too close" | the candid multiplier and the Fieldcraft achievements |

## 3. The rules (progress/stealth.js)

### 3.1 How visible you are: `exposureOf`

A multiplier on a mind's sight gain for the Courier. 1 is today's default standing walk. Each factor is something you can see.

| factor | values | why |
|---|---|---|
| posture | stand 1, crouch 0.6, prone 0.3 | a smaller, lower shape (the Dark Mod halves it crouched) |
| pace | still 0.4, walk 0.85, run 1.15, sprint or slide 1.35 | movement is what an eye catches; stillness hides better than cover |
| light | the hour's light (0.08 starlit to 1 noon) mapped to 0.45 to 1; under a roof 0.8 | Thief's light gem, Mark of the Ninja's dark |
| weather | Grief's rain 0.75 at full strength, Dread's fog 0.6, Gall 0.9 | a feeling's weather that veils |
| tool in hand | 1.15 | the old rule, kept |

Measured on the rules:
- standing still at noon: 0.40;
- walking: 0.85;
- sprinting: 1.35;
- crouched and still at night: 0.12;
- prone and still at dusk in full fog: 0.05.

The old line gave a still stand 0.55 and a crouch 0.45 at any hour.

### 3.2 How loud you are: `stepNoise`, `landNoise`

Each footstep (`move.step`, with its surface) and each hard landing (`move.land`) becomes a noise stimulus the minds already hear. The
radius is the gait's reach times the ground's ring:
- **Gait:** a walk 3 m, a run 7 m, a sprint 11 m. Standing still makes no step.
- **Ground:**
  - sand 0.55, moss 0.5, grass 0.6;
  - clay 0.8, stone 1, Lachrymite 1.1, wood 1.2;
  - water 1.3, paint and crude 1.4;
  - metal and grates 1.6.
- **Posture:** a crouched step is half; a prone one is silent.
- **Weather:** rain covers it. Grief's rain takes 45% off at full strength, Fury's hail 35%, Dread's fog 15%.
- **A landing** is silent under 5 m/s of fall, then 1.4 m of radius for each m/s past that, up to 18 m.

Measured:
- a walk on sand: 1.65 m;
- a crouched walk on stone: 1.5 m;
- a run on metal: 11.2 m;
- a sprint on stone in full rain: 6.05 m.

What it teaches: keep to soft ground, slow down near a Figment, and use the rain.

### 3.3 The watch: `vigilAt`

A Figment's head is down (its own business) or up (scanning), in bouts of its own length and offset, so no two are in step:
- **Head down:** it sees you at 0.3 of its sight.
- **Head up:** at full sight.
- **The bouts:** a scan comes every 4 to 9 s and lasts 1.2 to 2.4 s, so the head is up about 27% of the time.
- **Temperament:** a timid individual (`bold` below 1) scans more often.

Deer stalking's rule, taught without a word: move while its head is down, freeze when it comes up. The minds' feel radius is untouched:
inside it, a creature knows you whatever its head is doing.

### 3.4 Caution after a fright

A creature that has had its "!" at you (the minds stamp `c.noticedT`) stays on caution for 60 real s:
- it scans twice as often (the head up about 43% of the time);
- with its head down it sees at 0.65.

It also comes back to its business slowly, as a frightened animal does. This is Metal Gear's Caution and the Dark Mod's longer forget
time.

### 3.5 The candid photograph: `CANDID`

A plate's subject that did not know you were there is worth more. The multiplier is read from its awareness of the Courier when the
shutter fell:

| awareness | name | the score's multiplier |
|---|---|---|
| below 0.35 | candid | 1.5 |
| 0.35 to 1 (its "?") | curious | 1.1 |
| 1 (its "!") | aware | 0.8 |

This is the bridge to section 8: the safari's prize is what a Figment does when it doesn't know you're there.

## 4. The running half

`Stealth` (`game.stealth`, progress/stealth.js) does four things a frame:
- sets `game.stealth.loud`, the Courier's exposure, for the brain to read;
- turns `move.step` and `move.land` into noise stimuli (`game.ai.stimuli`);
- stamps each nearby creature's watch on it as `c.vigil = { up, k }`: k for the senses, up for the body's tell;
- puts a creature that has noticed you on caution.

It reads nothing it owns. Every input is an event or a field the game already has. Training bodies (Strawman's dolls, `training: true`)
keep no watch.

## 5. How it shows (two avenues or more, no meters)

| what | the body | the world | the log |
|---|---|---|---|
| its watch | its head up and scanning, or down at its business (Calissa: `c.vigil.up`) | none | none |
| its "?" and "!" | it turns and looks (as now) | the glyphs "?" and "!" (as now) | none |
| your footsteps | the step's own sound, louder on metal (Wanda's, as now) | a faint ripple on the ground at the step's radius while sneaking (Calissa; Mark of the Ninja's rings) | none |
| your exposure | your shape: crouched, prone, still | none | none |
| a candid plate | none | the plate's stars | "Candid! It never knew you were there." |

There is no visibility meter: the overlay reads what is, and the body and the ground carry it. Calissa may judge that a world mark is
needed for your own exposure. If so, it is a world mark without words (CLAUDE.md).

## 6. The ledger and achievements

Counted by `tracking/stealth.js` from `photo.take`'s `candid` and `d`:
- `photo.candid`, and `photo.candid.<kind>`;
- `photo.candid.near`: within 3 m;
- `photo.candid.night`.

The achievements are in the Veritome's new **Fieldcraft** sub, worded by Espada (2026-11-01).

| id | tier | name | what |
|---|---|---|---|
| fc1 | Easy | Candid | one candid photograph of a Figment |
| fc2 | Hard | Fly on the Wall | 50 candid photographs |
| fc3 | Medium | Field Notes | a candid photograph of every kind of Figment in the Dunes (the slip jelly and the Lantern Wisp) |
| fc4 | Hard | Close Encounter | a candid photograph from 3 m or closer |
| fc5 | Medium | Night Watch | a candid photograph at night |

## 7. Handoffs

**Petra.** Four lines in her files, built (c05b48d). Her two calls, kept: the candid multiplier applies only to creatures (subjects with an awareness), and a plate's `aware` stays a boolean (0.35 and up) with `candid` beside it. The multiplier moves stars too (a 160 plate becomes 240, four stars): kept until section 8 splits stars from the score.
1. `creatures/ai/brain.js:58`: `const loud = g.stealth ? g.stealth.loud : (the old expression)`.
2. `creatures/ai/senses.js`: the sight gain times `(owner.vigil?.k ?? 1)`. That is the `mem.see` call in the cone, not the feel radius.
3. `tools/veritome/subjects.js`, a subject's awareness:
   - read it from the creature's memory of the Courier (`c.brain?.mem` focus on `game.player`, its `aware` 0..1), in place of
     `c.aggro`, which nothing sets;
   - add the Lantern Wisp as a subject (kind `wisp`).
4. `tools/veritome/photo.js` and `veritome.js`:
   - the score times `candidOf(aware).k`;
   - `photo.take` carrying the best subject's `candid` (its word) and `d` (its distance, m).

Next, for the safari (section 8):
- **Flight rings.** An unaware Figment approached inside its flight distance bolts. The distance is set by temperament and by how
  direct and fast the approach is: Hediger's zones and the flight-initiation meta-analysis, where a path that passes by rather than at
  it lowers the risk it reads by about 31%.
- **Habituation.** A Figment approached gently and often lets you closer.
- **A Lachryma scent on the wind.** Your signature carried downwind, once the island has a wind of its own.

**Calissa:**
- the head-up and head-down tell on the slip jelly and the Lantern Wisp, from `c.vigil.up`;
- the footstep ripple on the ground while crouched or prone (section 5);
- whether your own exposure wants a world mark at all.

**Wanda:** nothing new. The steps already sound by surface. Optional: a creature's head coming up could make a small sound, a sniff or
a turn, as a second avenue for the watch.

**Espada:** the Fieldcraft achievements' words, and the log's candid line.

## 8. The safari: the Veritome's overhaul (planned, not built)

South's ask is a "mental safari": hunting Figments down and photographing them, Pokemon Snap's loop in a Lachryma tool. The Veritome
already has most of a Snap:
- a score from size, framing, facing and pose (`photo.js`);
- the bestiary, learned from plates at 2 stars or more;
- familiarity from photographs;
- the open sea's research: four habits a species, caught on a plate (`progress/opensea/habits.js`), which is New Pokemon Snap's
  research in all but name.

What it lacks is Snap's two readouts and its reason to go back. The overhaul, in order:

1. **Two readouts per plate** (New Pokemon Snap):
   - **Stars** rate the behaviour caught: how rare it is.
   - **The score** rates the framing.
   - Today the stars are cut from the score. They become the behaviour's own rating.
   - A candid plate is the only way to the rarest behaviour.
2. **Behaviour, not states.** Each Figment gets four behaviours, like the sea's habits:
   - one seen anywhere;
   - one under a condition (an hour, a weather);
   - one only when unaware (candid);
   - one only when provoked by a lure.
   - A behaviour is what the body is doing when the shutter falls, read from the mind's current action. Today it is guessed from the
     hour at plate time.
3. **Research by area.** A Dunes area's Figments photographed raise its research level, as New Pokemon Snap's courses do. A level opens
   the area's night variant and its rare finds (the ruins' aberrant Wisp is already one, AREAS.md 5).
4. **Lures as the provocation** (Snap's apples, the fluffruit, Bugsnax's sauces). A Lachryma lure of a feeling, thrown or painted (the
   Soul Brush's paint is already a feeling on the ground), draws a Figment of that feeling out and sets off its lured behaviour. The
   cost is in the pool.
5. **The darkroom as Professor Oak.** The day's best plate of each Figment is judged, and the log says why: framing, behaviour, candid.
6. **The look** (Calissa's):
   - the Veritome's lens is reworked as a safari camera: the frame, focus, the shutter's beat;
   - the plate's stars drawn as the behaviour's;
   - the candid mark on a plate.
7. **What it pays.** A research level pays as the sea's discoveries do (ECONOMY.md's aim). A behaviour's first plate is a first
   (`FirstToday`).

Each step lands as its own round. Step 1 waits on Petra's subject awareness (section 7), which this round's candid multiplier already
asks for.

## 9. Open

- Does stealth reach the Great Dunemaw's floors? Its FOE is a timeline with no mind, so not yet.
- The clapperjars run their own 8 m check with no cone. They join the minds' parts when Petra next touches them.
- The sea serpent's throttle-step `loud` is the one sneak-by-throttle case. It is left as it is.
- Names: all plain until South calls stealth settled.
