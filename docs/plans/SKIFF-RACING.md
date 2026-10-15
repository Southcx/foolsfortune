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
| **drift with a charged boost** | MK8 (mini-turbo tiers), Sonic Riders (drift) | **yes** | **the carve**: Q or E held on the sand at speed (the side it carves to). The board slides and loads in three tiers; let go and it pops out with a boost by tier. (First built on Space held through a turn; a hop in a turn then began carves nobody asked for, so Petra moved it to Q and E in v196 and Space is the hop alone. Q and E are the glide's bank in the air, so one pair of keys leans the board on the sand and in the air.) |
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

## 7. Grind rails: the skiff alone (built 2026-10-14: courier/skiff/grind.js, world/raceway/railsrings.js)

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

## 8. The owner's first race (2026-10-14), and what came of it

Three laps in 5:48, with bails. What changed:
- **Q and E felt reversed** to the owner. The turn was right (E turns right, as D does); the board's lean in the glide was wrong: it leaned
  out of the turn where on the sand it leans in. Fixed in the lean; the keys stay Q left, E right. (Flipping the keys instead sent the
  test autopilot off the lip and round a respawn loop.)
- **The sandfall stopped a third of the way down.** It hung 3 m past the lip and was measured to the track's control point, so it began
  partway down the face and ended early. Now it hangs at the lip and runs down to where the ground stops being sheer (the slope under
  0.6), measured on the ground as drawn.
- **The sail hid what was ahead.** The house's screen-door fade (`render/outline.js` `withFade`, as when the camera squeezes the Courier
  against a wall) now screens the sail to half while riding under way.
- **New:** grind rails (section 7: five on the circuit, on turn one's inside, the whoops, the slalom, the canyon and the gale); **sun
  rings**, the Gnomon's rings hung in the air after the kickers and down the drop on a 5-to-1 glide's line (a glide flown well takes them,
  a dive does not), each a push of 8 m/s for a real second and 4 Lachryma; **R in a race** goes back to the last gate passed
  (Trackmania's checkpoint respawn); and **the best lap's ghost is kept** in the save.
- **For Calissa:** the edge strings the owner asked for (motes along both sides of the track); the rails' and rings' look.

## 9. Round three (2026-10-14): conditions, the trick combo, grabs, curves, ramps, the cavern

The owner: expand the conditions and the combo; a cavern course under the circuit; grabs on the free mouse buttons; what Crash Team Racing
and Kirby Air Ride do that we can take; curved rails; more ramps; a mark when a pop is nailed; bigger carve sparks; a Lachryma-coloured
boost. The goal at each scale: the next 30 seconds is a chain of tricks into a banked flare; the lap is a choice of lines (the cavern or
the mesa, a side ramp or the berm); the week is the boards (each condition its own best) and the night lap.

**What the two games have, and what we take.**
| from | what it does | ours |
| --- | --- | --- |
| CTR | power-slide boosts in tiers, timed by a press | the carve already loads in tiers (MK8's way); kept |
| CTR | **reserves**: boosts chained while one runs bank their time, and the speed holds | **taken**: a push while another runs adds its length, to 4 real s (`TURBO.cap`) |
| CTR | Wumpa fruit: ten held, everything faster | not taken: the pool is our resource; the combo is the reward |
| CTR | the turbo counter, the boost meter's colour going red at the moment to press | not taken: the carve's tiers show on the board (Calissa's sparks) |
| KAR | landing on a downslope keeps the fall as speed | **taken**: the slope landing (below), and it is a trick |
| KAR | one button: charge to brake, release to boost | ours is the hop's crouch already (Space charges, releases) |
| KAR | gliding machines that dive for speed and pull up | the glide (section 4) |
| KAR | City Trial: minutes in an open map gathering patches, then a stadium event | **later**: a Dunes mode, its patches the stones' stats (a pitch, not built) |
| KAR | rails ridden by touching them | the grind (section 7) |
| SSX Tricky | tricks fill a boost meter; a bail loses what the run added | **taken**: the trick combo |
| THPS | the multiplier, a variety bonus, the manual as the link on the ground | **taken**: kinds raise the multiplier; the link runs 2 real s on the sand |

**Conditions** (`world/raceway/conditions.js`). The Raceway now has Anagami's sky (`weather.js` ZONE_PLACE: open), read every half a real
second. The sun feeds the sun plates: light under 0.12 (night) none, full from 0.62, a plate's push scaled by it (dawn and dusk weak, night
dead: `skiff.plate { power }`). The weather, scaled by its strength: Grief (the long rain) wet sand, grip x0.6, carve loads x1.35, drag
x0.85, the sun x0.55; Mirth (a sunshower) wet sand under the sun; Fury (the hail) squalls, the wind swinging +-45% and shoving the board
across it (10 m/s^2 for a whole gust's excess, crosswind); Gall (the miasma) drag x1.25, grip x1.2; Desire the course wind x1.35; Wonder
the rings x1.4; Dread fog (the look Calissa's). The lesson under it is land sailing's: wet beach sand is the fast, hard surface; dry sand
drags. A race says its condition at the start and keeps its time on that condition's board (`race.raceway.best.<light>.<aspect>`, light
day, twilight or night): 24 boards. **Not built:** one seeded condition per game day (the weather already changes by the game hour block).

**The trick combo** (`courier/skiff/combo.js`). Points: a spin landed square 100 a turn; a grab 80 a real second (to 3) and 50 for a tweak
held 0.6 s, the double x1.5; a grind 6 a metre (from 12 m); a late pop 50, a perfect one 100; a carve let go 40, 90, 160 by tier; a sun
ring 60; a slope landing 50. Each kind past the first adds 0.5 to the multiplier (to x4). The chain lives in the air, on a rail and in a
carve, and 2 real seconds on the sand after a trick; then it is banked: 1,000 points a banked flare, three at most, each 1.5 real s of
Shift's flare, spent before the pool. A wobble banks at once; a bail or a respawn loses it. It replaces the Lachryma a spin, a grind and a
ring gave the pool: tricks pay in speed. Measured on the autopilot (no tricks but its carves and pops): see the round's report.

**Grabs** (LMB the nose, RMB the tail, both the double), held in the air; let go before landing and it is a trick. Still held as you land:
a wobble (speed x0.8), nothing for the grab, the chain banked. The board tweaks (0.3 rad nose or tail down, rolled for the double) as a
placeholder until Calissa's rider reaches for the board (IK on the hand: a light correction, as CLAUDE.md asks).

**The pop, nailed.** Let go of Space in the first 0.08 real s after leaving a crest (of the late pop's 0.22) and it is a perfect pop: 0.95
of a hop's height (the late pop's 0.7), more push, a mark on the board (a glyph pop, Lachryma's colour, a placeholder for Calissa's),
`skiff.pop { perfect }`, and the log says so. Let go up to 0.5 s and it is a missed pop (`skiff.pop.miss`): the log says how to time it.

**The slope landing** (KAR's, and every board game's transition). Landing square on a downslope keeps 0.8 of the fall's speed along it
(the fall times the slope's tilt along the travel, to 8 m/s); from 2 m/s it is a trick. Landed on the flat, the hover takes it all.

**Curves.** Rails now follow the line (`along`), its lat eased between the ends, the slalom's weaving 1.8 m across; a new long one round the
last switchback's bend onto the mesa, and the cavern's. On a curved rail the lean is thrown outward by v^2 x the bend (`GRIND.bend` 0.04):
a fast grind round a bend is held into it with A or D.

**Ramps.** Three more full kickers (turn one's exit, a big one after the whoops, 3.2 m over 12, the last turn's) and six side ramps over
part of the width only (SSX's side hits: [1, 90] right, [5, -40] left, [10, 30], [13, -40], the canyon's, the gale's), with rings over two
landings.

**The cavern** (working name; `world/raceway/cavern.js`, `track.js` BRANCH). A branch off the line 25 m after the landing hill's foot
(cp 21) that runs down into a gorge through the circuit's middle and back onto the line at the gale's end (cp 25), past gate 8: 368 m
against the line's 389 (an S through the circuit's middle; about 2 to 4 s faster than the line on the autopilot). Its floor falls to 0 m (the line there runs at 22 to 26), its walls rise 15 to 18 m to the sand, steep over 3 m;
where they stand 7 m or more (about 175 m of it) a roof of stone slabs lies across at the sand's height, one slab in seven left out for a
shaft of sun, stalactites toward the walls (7 m clear of the floor at least), Lachryma crystals glowing low on the walls. It is one height
field with the rest (a heightfield cannot overhang, so the cave is a roofed gorge: the board rides and collides as anywhere). Where the
branch and the line meet, a running surface wins over the other's berm or wall. Its wind is the course's at 0.45 (a cave breathes); its
pads are crystal veins, fed by Lachryma, not the sun: **the night lap's line goes under**. A rail down its middle (62 to 150 m), a kicker
at 178 m, two veins. The race maps the branch onto the stretch of line it stands for, so gate 8 is crossed for you and the ghost runs as
ever; a bail in it sets you back in it. Through it whole from its fork: `raceway.branch { branch }`.

**For the other divisions.** Calissa: bigger carve sparks (the owner); the flare and the board's boost glow in Lachryma's colour (it is
Lachryma-fuelled); the perfect pop's mark; the grab (the rider's hand to the board); the combo's gauge and the banked flares (no words, no
numbers); the dark sun plate and the plates' brightness by `raceway.sun`; the cavern's rock, crystals, veins and its dark; Dread's fog; rain
not falling under the cavern's roof; the cavern's edge strings (`edgeLines(step, 'cavern')`). Wanda: the grab, the perfect pop and the
missed one, the combo's bank and its loss, the cavern's sound (inside a stone gorge), wet sand under the board. Espada: the cavern's name,
the log's lines. Petra: the hubs touched (`weather.js` ZONE_PLACE), and the medal line again (the cavern and the ramps move it).

## 10. Round four (2026-10-14): the Raceway as a park of tracks

The owner: "quadruple the size of the raceway level ... nest multiple tracks into one map ... THE zone where we're going to test ALL of
our racing module mechanics. We need water features, spirals, loop-de-loops and rollercoaster-like grind rail sections, an antlion
sandpit, more sandfalls, CANYONS ... think in layers of complexity." And: the edge lights cut across the main track at the cavern; the
cavern wants more ceiling clearance and more intrigue; the flares' indicator to the board's back; a balance indicator for the grind.

**Research** (a reference catalogue and 16 pictures, kept out of the repo): Laguna Seca's Corkscrew (a blind crest and an 18 m fall over
137 m), Spa's Eau Rouge (a dip into a 15 to 17 percent climb), the Nordschleife's Karussell (a banked bowl), Suzuka's figure eight (the
crossover), Mount Panorama's ridge, Mario Kart's Shy Guy Falls, Dry Dry Desert and Bone-Dry Dunes, Sonic Riders' Sand Ruins, SSX's rail
lines and forks within 5 percent of each other, Antelope Canyon and Beggar's Canyon, roller coasters (the lift, the first drop,
camelbacks, the loop, the helix finale), Hot Wheels' and F-Zero's loops. What a height field cannot do (an overhang, a crossover, a loop)
is done another way below: bridges, decks, coaster rails.

**The park** (`world/raceway/park.js`). 2.6 km across (it was 1.1), at x 6000, its round barrier at 1,270 m. One height function: the
sand, the park's base shapes (the hub's plaza, the craters), every track's corridor pulled in (a running surface wins over another's berm;
two at once, their mean), then its cut shapes (the half-pipe, the lakes' beds, the antlion pits). The Index sets you down at THE HUB,
the middle, among the three tracks' starts. Layers of complexity:
| layer | track | where | what it tests |
| --- | --- | --- | --- |
| 1 | the Sun Circuit (2,855 m, the cavern 368 m) | south-west, turned to face the hub | the carve, the plates, the glide off the lip, the first rails, the cavern line |
| 2 | the Gorge Run (3,751 m) | south-east | lines and hazards: a blind crest, two cliffs with sandfalls, a slot canyon, a crater's spiral round an antlion pit, a crossover under a bridge, a lake ford, Eau Rouge, a Karussell bowl |
| 3 | the Coaster (2,428 m, its rail 896 m) | north-east | grinding as a line: a lift to a mesa, then the road down or the coaster rail (a first drop, camelbacks, a banked turn, a loop, a helix round a tower) |
| free | the antlion's pit, the half-pipe | north-west, by the hub | free riding, the pit's pull, air in the pipe |

**New mechanics, each general (any track can use them).**
- **Cuts** (a control point's sixth number, `cut`): the walls rise steeply over that many metres to the ground beside the line: a slot
  canyon. A track can be laid 20 m under the sand and ride between walls.
- **Bridges** (`features.bridges`; `world/raceway/features.js`): a stretch of the line left out of the height field and built as a stone
  deck on piers, collided; another line passes under it (the Gorge's climb out of the crater runs under its spiral's first turn:
  Suzuka's crossover). The board rides the deck through `rideHeight` (the deck under the Courier when they are above it).
- **Craters and the spiral**: a bowl sunk into the sand (`PARK.craters`); a track's control points can spiral down its wall
  (`tracks/gorge.js` spiral()), its road a shelf on the cone.
- **The antlion pits** (`PARK.pits`): cones at the sand's angle of repose (33 degrees: dry sand will not lie steeper, which is the
  antlion's whole trick); inside the rim the sand flows to the middle and drags the board (9 m/s^2 at the bottom); the maw takes a board
  that reaches it (a bail, `raceway.pit`), and you are set back on the track. One free in the north-west, one at the crater's floor.
- **Water** (`PARK.lakes`, a track's `fords`, the cavern's `pools`): a flat sheet the board skims (`rideHeight`); the bed under it.
- **Banked bowls** (`features.bowls`): a stretch banked steeper than its bend asks (the Karussell: 37 degrees).
- **Coaster rails** (`world/raceway/coasterrail.js`): grind rails laid in three dimensions from a few points, with a loop and a helix
  spliced in. Each point carries the rail's up (banked into turns, toward a loop's middle) and a push (a Lachryma conduit drives a loop,
  16 m/s^2). The grind (`courier/skiff/grind.js`) now runs gravity along the rail's tangent in three dimensions, stands the board on
  the rail's up, holds the balance through a loop, takes a banked turn's pull off the balance (g tan(bank): a banked curve rides
  itself, as on a coaster), lets a coaster rail's drift never grow (it is ridden for its curves), and leaves a rail's end with its
  climb (a kicker). It locks only where the rail is upright. Measured: the Coaster's rail ridden end to end, 895 m, through the loop
  upside down and the helix, off at the end with no bail, 53 m/s at the fastest.
- **Multi-track races**: F at any track's start pillar races that track; each keeps its own ghost; the ledger keeps each track's best
  (`race.track.<id>.best`); medals stay the Sun Circuit's until the others are measured.
- **The cavern, again**: its floor 6 to 8 m lower and wider (its walls 22 to 32 m), the roof only where the walls stand 11 m, the
  stalactites 10 m clear; inside it now a pool under the roof with a kicker to jump it, four crystal pillars to weave (collided), and a
  sandfall pouring through a skylight. The edge strings' points that lie on the other line's running surface are marked `hide` (the
  fork and the merge): Calissa's strings break there.

**The tools** (the owner asked whether better diagnostics would help: yes, and they are built).
- `node scripts/raceway/map.mjs out.png [--px m] [--at x,z --size m] [--trace t.json]`: the park from above as a PNG, from the same height
  function, in about 2 real seconds with no browser: hill-shaded sand tinted by height, the water, every line, branch, gate, start,
  plate, rail (the coaster rail magenta, darker upside down), sandfall, pit, pipe; a drive's trace over it, coloured by speed, with its
  bails.
- `node scripts/raceway/drive.mjs --track sun|gorge|coaster [--laps n] [--cave] [--rail <id>] [--trace t.json]`: the game headless, an
  autopilot racing the track (or dropped onto a coaster rail and riding it out), and a report: laps, gates, bails and why, grinds and
  how they ended, the pits, the combo, top speed.
Measured this round (autopilot, a fair day): the Sun Circuit 114.4 s, through the cavern 109.7 s; the Gorge Run 152.2 s; the Coaster
102.8 s on the road; the Coaster's rail 895 m. No bails on any lap. Building the park takes about 5 real seconds on arrival, headless
(the field is 1.1 million samples).

**For the other divisions.** Calissa: the flares' indicator to the board's back (the owner: the front is hidden by the skiff); a balance
mark for the grind (`techs.get('skiff').grind.lean`, -1..1, past 1 you fall; `grind.on`); the edge strings for every track
(`edgeLines(step, line, trackId)`) honouring `hide`; the gates' marks and lamps for the Gorge and the Coaster; looks for the water, the
bridge decks, the antlion's maw, the coaster rail and its helix tower, the cavern's pillars and pool. Petra: the shader cap to 200 (the
owner's word); the zone map's bounds; the 5 s build on arrival. Wanda: the coaster rail (the loop, the helix), skimming water, the
antlion. Espada: names (the hub, the Gorge Run, the Break, the Step, the Mirror, the Coaster, the Station, the antlion).

## 11. Round five (2026-10-14): the owner's notes on v198

| the owner's note | what was done | whose |
| --- | --- | --- |
| banked flares need their own key, C | C spends a banked flare (free); Shift spends the pool | Dovina |
| A and D feel reversed on the rail | the balance answers the other way: lean right, press A (Tony Hawk's) | Dovina |
| grind tricks by double-clicking LMB / RMB | a double click on a rail: nose grind (LMB) or tail slide (RMB); 120 points, a new kind for the multiplier, the grind's metres worth half again, the balance 1.4 times livelier; the board tweaked (`skiff.grind.trick`) | Dovina (the pose: Calissa) |
| boosting in midair gives no course correction | Q / E steer the flight in the air (0.45 rad/s, 1.3 while flaring) | Dovina |
| carve sparks 20% sooner, for snaking | the carve's tiers at 0.48, 1.04, 1.76 real s (were 0.6, 1.3, 2.2) | Dovina |
| edge markers jagged in the canyons | between walls (a cut, a berm over 3 m, the cavern) the edge lines sit 1 m inside the floor's edge | Dovina |
| no way to quick retire | R held 1.2 real s retires; /retire | Dovina |
| racetrack selection | a race board at the hub (F: the tracks, your bests, click to race); /race sun / gorge / coaster [solo] | Dovina |
| clapperjars on mini skiffs as rivals, rubber banding | three rivals (`world/raceway/rivals.js`): a lane and a skill each, braking for the bend they see (v = sqrt(grip / curvature)), gliding off drops, one taking the cavern; rubber banding (a leader eases to 0.8, a trailer is pushed to 1.18); your place each lap and at the finish | Dovina (their look and riding: Calissa) |
| Flatout / Burnout bumping | touching pushes both apart by the closing speed; a side hit over 7 m/s is a TAKEDOWN: the rival spins out 2.4 s, you get a push and a third of a banked flare (Burnout 3's) | Dovina |
| no wake or trail over water, nor entering the Lachryma pool | `skiff.water { on }` when the board starts and stops skimming (and `skiff.onWater`) | Calissa (the splash, the wake), Wanda (the sound) |
| the water's glare too strong at a low angle | | Calissa |
| the boost's sound plays on in the pause menu; soften it | | Wanda |
| what are the diamonds on the board? | the combo's multiplier: one lit for each kind of trick in the chain (each adds x0.5) | (answered) |

Measured: the Sun Circuit with three rivals, autopilot, three laps: no errors, 24 gates, the rivals 304.9, 314.9 and 326.1 s against the
autopilot's 338.1 s (which never carves or flares), before the band was tightened.

## 12. Round six (2026-10-14): everything (the owner: "Build. Everything.")

The owner took the whole list from the last round's answer. What each is, where it lives, and the prior art it was taken from.

**The board's rules** (`courier/skiff/boardrules.js`; skiff.js keeps the sailing, this keeps the stakes):

| rule | what it does | numbers | taken from |
| --- | --- | --- | --- |
| the pool is the hull | the Courier's own pool, its regen untouched (the owner, 2026-10-14: "the literal same pool"; round 6 first held its regen in a race and filled it at each start: both undone). A bump drains 0.9 a m/s of closing speed, a wall 1.4 a m/s lost past 4, a hard landing 0.6 a m/s past the hard line, a bail 12; with the pool empty (under 0.5), a hit of 3 or more WRECKS the board | `HULL` | F-Zero's energy (health and boost one bar); the owner: "so resonant with the ARPG portion" |
| a vein lane | a strip of Lachrymite beside the line, refilling the pool 40 a real second while ridden (ten times its regen, and with no wait after a spend); off the line's best, so a pit is a choice | `lanes` on each track; `HULL.refill` | F-Zero's pit strip |
| the scorch | a flare held builds heat 0.4 a real second (cools 0.5); full, the sail luffs 2 real s at 0.6 of its pace | `SCORCH` | Excitebike's overheat |
| the manual | W and S together on the sand with a combo live: balanced on the tail, A / D answering a drift that grows; the link held while it lasts, 30 points a real second; a fall banks the combo | `MANUAL` | Tony Hawk's Pro Skater 2 |
| snaking | a carve begun the other way within 1.2 real s of letting one go loads 25% faster, up to twice | `SNAKE` | Mario Kart Wii |
| the shoulder | Q or E tapped twice: 7 m/s sideways; a rival within 3.5 m that side is taken down | `SHOULDER` | F-Zero GX's side attack |
| aftertouch | thrown in a bail, W A S D push the tumbling body (9 m/s a real second for 1.4 s); onto a rival, a takedown | `AFTER` | Burnout 3 |
| a near miss | past a pillar, a column, an arch or a rival at 18 m/s or more, within 1.3 m and not touching: 40 points to the combo | `NEAR`; the kit's near-miss grid | Burnout |
| a gap | a named jump, off one stretch and onto another: said by name, points to the combo, kept on the ledger (seven to find) | `GAPS`, `world/raceway/gaps.js` | Tony Hawk's gaps |
| a buoy run | buoys passed on their sides (red: go right of it; yellow: left) raise the POWER a step to five (2% top speed each); one missed, it drops to nothing | `BUOYS`, `world/raceway/buoys.js` | Wave Race 64 |

**The siphons** (round 6, after the owner's "a gate of sorts", 2026-10-15; `world/raceway/siphons.js`): an arch across each track just
before its second vein lane drinks the pool to a quarter of its max as you pass under it; the two make a pit stretch. The Pit lane
licence runs through the Sun Circuit's (it no longer sets the pool itself: the law that a mode never changes a base rule, DESIGN.md 22.6).

**The garage** (`progress/skiffparts.js`): a sail, a keel and a hull, each a trade, never an upgrade (MK8's parts), opened by achievements:
the Racing Sail (top 1.07, acceleration 0.88: rw21), the Storm Sail (0.95 / 1.15: rw5), the Grind Keel (a steadier rail, a looser carve:
rw9), the Deep Keel (more grip, a wobblier rail: rw6), the Light Hull (quicker, lighter in a bump: rw13), the Heavy Hull (hits like a kiln
door: rw22). Chosen at the race board's GARAGE tab. The balance's answer can be turned round: `/skiff invert` (a setting, kept).

**The modes** (`world/raceway/modes.js`; one race engine, a mode and its ruleset):

| mode | what | ruleset |
| --- | --- | --- |
| race | three laps against the rivals, standing start, the flyover first, medals on the Sun Circuit | |
| hot lap | one lap alone, a flying start (220 m back, pushed off at 24 m/s); the clock starts at the line | |
| practice | laps until you retire; Backspace held rewinds (20 frames a real second, 30 real s kept); nothing recorded | |
| pot smash | one lap, 30 pots on the line at the track's own seed; each smashed takes a real second off | `pottrial.js` |
| escape | the Gorge Run's crater: from gate 4, round the spiral and up the climb out, the antlion behind you (from 120 m back, 16 m/s gaining 0.28 a real second to 30); caught within 3 m, wrecked | `escape.js` |
| licence | a stretch, a rule, a medal (gold, silver, bronze at 27, 24, 20 m/s over the stretch); seven tests: Carve (no flare), Snake (three snaking carves), Grind (40 m of grind), Hull (the pool over 60%), Pit lane (from a quarter, ride the lane, end over 75%), Big air (a spin landed square), Clean lap (no bump, wall or bail) | `licences.js` |

Above the modes: **the cups** (`cups.js`: three races, 10/6/4/2 points by place; the Clay Cup against the clapperjars, the Sibling Cup
against the siblings), **the City Trial** (`citytrial.js`: 150 real s to roam the park taking 48 patches (top, acceleration, grip, the pool,
a banked flare), then the Stadium: a race, a hot lap, a pot smash or the escape, drawn), and **the wager** (`progress/econ/wager.js`; docs/
ECONOMY.md).

**The run's keys**: Backspace tapped RESTARTS the run where it began (Trackmania's Delete; the R+W I offered collides with R, which is
already the gate respawn and, held, the retire, and W is always held); Backspace held rewinds in practice. F or Space skips the flyover.

**The rivals' minds** (`rivals.js`): four personalities on the one mind. A BLOCKER takes your line when you are within 25 m behind it; a
RAIL HOG rides the track's lintels (8% quicker there); a GAMBLER takes the inside of every bend (3 m) and the cavern; a CLEAN racer keeps
its lane. THE NEMESIS: the rival that beat you last is 3% quicker next race and claps at you as it passes; beat it and the grudge is
settled (the save's `raceNemesis`). THE SIBLINGS: Petra (clean), Calissa (rail hog) and Espada (gambler) on skiffs, the hard field, opened
by winning a race (rw21) or the DEBUG save's Racing lend.

**The race board** (`raceboard.js`): RACES (each track's four modes, the rivals to race, the wager), CUPS, LICENCES, TRIALS (the escape,
the City Trial), GARAGE.

**Left to other divisions** (docs/handoffs/): tracks on the map (M) and a photo finish (Petra); the looks of the vein lanes, the scorch, the
hull's damage, the sibling riders, the pots, the antlion chaser, the patches, the buoys, a wreck, and hull glazes fired at the kiln (Calissa); their sounds (Wanda); every
name and line (Espada).

Measured (the autopilot, which never carves, flares or takes a lane): a race lap of the Sun Circuit 113.2 s with the flyover, four buoys
and a near miss, no errors; the Coaster's pot smash 7 of 30 pots, 97.5 s less 7; the escape caught at the climb out at 65 s before the
antlion was eased (34 m/s and 0.32 to 30 and 0.28); the Carve licence silver (22.95 s over 588 m); the Pit lane licence failed (the
autopilot keeps to the line, so never takes the lane). After the easing: a City Trial whose Stadium drew the escape, escaped in 71.95 s
with 76 m to spare. The Clay Cup run whole: three races, three flyovers, 9 laps, 72 gates, 21 hull hits, 15 bumps, a takedown, 4 gaps,
39 buoys; the autopilot 4th each time (6 points), Clink its nemesis throughout; no errors. The stress test: 24 runs, 0 violations.

## 6. Who does what

- **Dovina**: this plan; the skiff's rules (the carve, the pop, the plates, the glide, the bails, the trick combo, the grabs, the conditions); the track, the
  race, the ledger, the achievements; the Raceway's ground and props from the Dunes' kit.
- **Calissa**: remove the oval glow under the hull (boat.js `emit`: it clips); **the sandfall**: a curved, waterfall-like plane down the
  face with a scrolling UV texture of falling sand (the owner's ask: elegant and cheap), with a puff where it meets the hill; the carve's
  sparks by tier; the sun plates' glyph; the gate's countdown lights; the ghost's look; anything the track wants to read.
- **Wanda**: the race's cue, the countdown, the carve's charge and release, the plate, the gate chime.
- **Espada**: named them (2026-10-13): the Raceway, the carve, a late pop, a sun plate (its UI label: Boost pad), the glide lip, the
  solar start; the log's lines stand.
- **Petra**: the gate; the medal line, measured.
