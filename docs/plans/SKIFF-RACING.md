# Solar Skiffing as a racer: the audit, the rules, the Raceway

Dovina, 2026-10-13. The owner's ask: "evaluate what elements we're missing from other racing genres, and how to implement them in a way
that has really good synergy with what we've got so far. Then build out a large level circuit using the same assets present in The Dunes
as our test racetrack" (Sonic Riders, Mario Kart 8, Ratchet & Clank's hoverboard races, whatever else comes to mind); proper bail
criteria; a glide with a hang glider's pitch; a segment with a large sandfall drop.

## 1. What the skiff already has

| verb | how | its genre twin |
| --- | --- | --- |
| the sail (W hoists, S furls and brakes) | speed set by how far up it is and by the wind's angle (the polar) | Wind Waker; windsurf games |
| the pump (furl low, hoist full) | +3.2 m/s a pump | Wind Waker's sail pumping |
| the flare (Shift) | x1.45 top speed for 20 Lachryma a second | Sonic Riders' boost (air meter) |
| the hop (Space, held to charge) | 7.6 to 13.6 m/s up | SSX's ollie, MK8's hop |
| air spins (A/D in the air) | a whole turn landed square: +3 to +7 m/s | Sonic Riders' tricks, SSX |
| the glide (Space held in the air) | the fall held to 3.2 m/s | MK8's glider, BotW's paraglider |
| crests and geysers | the hover lags the sand, so a crest launches; a geyser throws 18 m/s up | Wave Race's swells, Sonic's springs |
| the wind | fixed across the Dunes; tailwind fast, headwind 28% | Wind Waker |

A good base: a sail is a throttle you have to manage, and the trick-for-speed loop is already there.

## 2. What the genres have that we don't, and what we take

| element | where it's from | take it? | how, in our terms |
| --- | --- | --- | --- |
| **drift with a charged boost** | MK8 (mini-turbo tiers), Sonic Riders (drift) | **yes** | **the carve**: Space held while steering hard at speed. The board slides and the springs load in three tiers; let go and it pops out with a boost by tier. Space already means "load the springs, let go to hop", so the carve is the same verb held through a turn. |
| **boost pads** | MK8 dash panels, Sonic Riders' dash panels, F-Zero | **yes** | **sun plates**: glyphs on the sand that throw a flare's push without its Lachryma. Solar, so they read as the skiff's own power. |
| **ramp tricks for boost** | MK8 (trick off a ramp), Sonic Riders, SSX | **yes, deepened** | **the late pop**: a hop let go in the first fifth of a second after a crest or kicker throws you higher, and counts as a pop. Spins already pay boost. |
| **tricks refill the boost meter** | Sonic Riders (tricks fill air), SSX (tricks fill boost) | **yes** | A landed spin gives Lachryma to the pool (6 a turn), so tricks fuel the flare: one meter, two ways to fill it. |
| **glider sections** | MK8 (glider ramps auto-deploy), R&C | **yes** | **the glide lip**: a lip that opens the wings by itself (the sandfall's). Steered with a hang glider's pitch (below). |
| **rocket start** | MK8 (accelerate at the right count) | **yes** | **the solar start**: the sail run up full in the quarter second after GO is a pump off the line; up too early, it luffs. |
| **time trial ghost** | MK8, every racer | **yes** | Your best lap rides beside you as a ghost. Placeholder look (Calissa's). |
| **laps, checkpoints, splits** | all | **yes** | Gates along the track, three laps; times and splits said in the log (the only text feedback). |
| **respawn on the track** | MK8's Lakitu | **yes** | Left far off the track for a few seconds, or R: set back on the track at the last gate, mounted. |
| **wind as course design** | (ours) | **yes** | **the course's wind**: on the Raceway the wind follows the track (Wind Waker HD's Swift Sail), mostly behind you, swung across in the gale section. Headwinds are left out: on a lap they are only slow. |
| shortcuts at a risk | MK8, Sonic Riders | yes, through the glide | Off the sandfall, a skilled dive lands sooner than drifting down. Branching paths come later. |
| grind rails | Sonic Riders, R&C, Jet Set Radio | later, the skiff alone | **The Solar Skiff only, no other tool** (the owner, 2026-10-13). The board's own keel fin drops onto a rail it lands on or hops onto; Space hops off. See section 7. |
| rivals and slipstream | MK8, Sonic Riders' turbulence | **skipped** (the owner, 2026-10-13) | Not now. Slipstream only makes sense with rivals, so it waits with them. |
| items | MK8 | no | Skill only: the flare is the item. |
| rubber banding | MK8 | no | A time trial wants none. |

## 3. Bails: the rule (the owner: "right now it's quite finicky")

**What was finicky (measured from the code).** A wall bail fired whenever the board moved less than 55% of its speed at over 14 m/s,
so a glancing scrape along a column at speed was a bail. The "crooked spin" bail could never fire (its angle could never pass 3.6
radians). And a landing's impact was measured vertically, not into the slope, so a steep landing hill read up to twice as hard as it was.

**The rule now, in one line: you bail when something stops you head-on, or the board lands pointing somewhere other than where it is
going. A fall alone never bails while the board lands square, short of a sheer drop.**

| what | measure | below | between | above |
| --- | --- | --- | --- | --- |
| a wall or a ruin | the speed lost into it (\|v in − v out\|) | glancing: you slide along | sparks at 8 | **bail at 15 m/s** (54 km/h head-on) |
| a landing, broadside | the board's facing against its travel | 30°: clean | 30° to 70°: a wobble, speed x0.7, snapped straight | **bail past 70°** at over 8 m/s |
| a landing, hard | impact into the sand along its normal | 16 m/s: clean | 16 to 40: a hard landing, speed x0.85 down to x0.55 | **bail at 40 m/s** (a sheer 33 m onto the flat) |
| never | under 8 m/s; the first half second after mounting | | | |

A spin landed within a quarter turn of whole is a trick, and the board is square. Each bail says why in the log.

## 4. The glide, as a hang glider (the owner: "W and S just kill momentum")

**Why W and S killed the momentum.** In the air W and S still worked the sail, and S kept the ground's brake: 16 m/s² of braking while
flying. A and D turned the heading but not the velocity, so a turn in the air also threw speed away on landing.

**Now the glide flies** (the owner, 2026-10-13: Q and E bank, so A and D stay the tricks). The wings hold the speed along the flight path.
- **W pushes the nose down** (a dive: gains speed, loses height). **S pulls it up** (a flare: trades speed for height, and stalls if it
  goes on). With neither, it trims to a 5-to-1 glide at about 24 m/s (a race's glide: a 12-to-1 float carried the first test lap over the whole canyon). A dive is 1.3 to 1 and fast, so diving is how you land sooner. While gliding, W and S never touch the sail.
- **Q and E bank.** The heading turns and the velocity turns with it, for the small cost of a banked turn's drag.
- **A and D still spin**, in the glide as out of it: a spin landed square is a trick.
- The sums: pitch eases to its aim at 4 a second (trim 0.2 rad, a dive of 0.65, a flare of −0.15); along the path, gravity times the
  sine of the pitch, less drag (0.008 v²), less the bank's drag; vertical speed is the path's; under 9 m/s it stalls and sinks faster.
- **No brake in the air at all**: S lets the sail down and nothing more. Every turn in the air carries the velocity with it.

## 5. The Raceway (Espada's name, 2026-10-13)

A test circuit built of the Dunes' kit (their sand, sky, dune noise, ruins, columns, arches, geysers) in a place of its own, at the
Dunes' layer far to the east (x 5200). It is entered from the Index (R: THE RACEWAY) and raced from the start line (F at the start's
pillar: a race of three laps). Riding it outside a race is free.

The circuit, one lap about 2.6 km, about 90 real seconds at race pace:
1. **The start straight**, under an arch of ruin pillars, tailwind.
2. **Turn one**, a long banked sweeper: the carve's first lesson.
3. **The whoops**, dune crests across the track in rhythm: pumps and late pops.
4. **The ruin slalom**: columns in the line; glancing is fine, head-on is a bail.
5. **The climb**: switchbacks up to the mesa, wind across, sun plates on the corners.
6. **The mesa top**: kickers and sun plates, a run at the lip.
7. **The sandfall drop**: the lip opens the wings. A sheer face of 26 m where the sand pours over, then a steep landing hill, about 75 m
   of height in all. Dive to land sooner; float to land soft.
8. **The canyon run**: high berms, two geysers in the line to ride over.
9. **The gale**: a crosswind straight, sail management.
10. **The last hairpin** and the line.

**The track as data** (world/raceway/track.js): a closed centripetal Catmull-Rom line through control points, each with a height and a
half-width; banking from the curve's own bend; features along it (kickers, whoops, sun plates, geysers, the glide lip, gates, the
wind's angle). The ground is one height function: the Dunes' noise for the sea, the track's corridor cut through it with berms, all
sampled into the same chunked terrain and physics height field the Dunes use.

**The race** (world/raceway/race.js): F at the start pillar, a countdown (3, 2, 1, GO said in the log and lit on the gate), three laps
through eight gates in order, splits against your best, a ghost of your best lap, medals by total time (gold, silver, bronze: Petra
measures the line and they move with it). Each medal pays once, ever (a test, not a farm), as the Solar Skiffing trial does.
Events: `race.start`, `race.go { solarStart }`, `race.gate { lap, gate, split }`, `race.lap { lap, seconds, best }`,
`race.finish { seconds, medal, laps }`, `race.end { why }`, `race.respawn`; and the skiff's new `skiff.carve { tier }`,
`skiff.pop { late }`, `skiff.plate`, `skiff.landhard { impact }`.

## 7. Grind rails: the skiff alone (a spec for a later round)

The owner's rule (2026-10-13): a grind involves **no tool but the Solar Skiff**. No hook, no grapnel, nothing drawn from the belt.
- **Getting on.** The board lands on a rail, or hops onto it (Space, as any hop), within 1.2 m of its line and heading within 35° of it.
  The keel fin (the hull's forefoot fin, boat.js) drops and locks to the rail. No button for it.
- **On the rail.** The board runs along the rail's line at the speed it came in with. A downhill rail gains speed, an uphill one loses it,
  and so does the sail's wind along it. The sail stays worked as on the sand (W, S), and Shift still flares.
- **Balance** (Tony Hawk's). A/D lean against a slow drift that grows with time on the rail. Lean too far one way and you drop off that
  side: no bail, you land and ride on. Holding balance a long time makes the grind a trick, and like a spin it pays Lachryma.
- **Getting off.** Space hops off: a pop, higher if timed at the rail's kicked end. Or ride off the end.
- **Data.** Rails are polylines on the track, as features (`FEATURES.rails`: from a control point and metres on, a height over the
  track, a length), drawn from the Dunes' kit: a fallen column, a toppled arch's lintel, a ruin wall's top.
- **Events.** `skiff.grind { by }` on, `skiff.grind.end { metres, why: 'hop' | 'end' | 'fell', by }` off.
- No bail on a rail: falling off is only a lost line.

## 6. Who does what

- **Dovina**: this plan; the skiff's rules (the carve, the pop, the plates, the glide, the bails, the trick refill); the track, the
  race, the ledger, the achievements; the Raceway's ground and props from the Dunes' kit.
- **Calissa**: remove the oval glow under the hull (boat.js `emit`: it clips); **the sandfall**: a curved, waterfall-like plane down the
  face with a scrolling UV texture of falling sand (the owner's ask: elegant and cheap), with a puff where it meets the hill; the carve's
  sparks by tier; the sun plates' glyph; the gate's countdown lights; the ghost's look; anything the track wants to read.
- **Wanda**: the race's cue, the countdown, the carve's charge and release, the plate, the gate chime.
- **Espada**: named them (2026-10-13): the Raceway, the carve, a late pop, a sun plate (its UI label: Boost pad), the glide lip, the
  solar start; the log's lines stand.
- **Petra**: the gate; the medal line, measured.
