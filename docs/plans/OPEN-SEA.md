# The open sea: exploring the Emocean off the lanes

Dovina's plan, 2026-10-20, from the owner's rulings of the same game day. It is a working spec: plain names throughout ("Plain names until
settled"); Espada names it when the owner calls it final.

The rules engine is built and measured: `src/progress/opensea/` (the grid, the finds, the safari, the islets, the voyage, the sea
serpent's numbers), its numbers in `ECON.openSea` (`progress/econ/table.js`), and the simulator `scripts/opensea.mjs`. The free helm,
the sea as a place, the islets as rooms, the serpent's mind and every look, sound and word are the other divisions' (section 10).

## 0. The owner's rulings (2026-10-20)

1. **A safari, not a highway.** The Crossings are the shipping lanes, with the bandits and set pieces. Off the lanes, the sea is quiet,
   strange, and mostly minds its own business.
2. **A free helm.** You steer: Wind Waker's sea, not a rail ("why bother otherwise").
3. **Combat only with what is hostile by nature**, Monster Hunter's way: most Egregores ignore you or shy off; a few hunt. The first
   hostile one is a **Marlin-class sea serpent**, simple to animate, as part of a vertical slice.
4. **Islets of Ego** (the owner's words): small islands that never grew into Islands of Ego. **Landing is in the first pass.**
5. Planetoids stay the Spirit Garden's word.

## 1. The loop at each scale

- **The next thirty seconds:** a square of sea. Something is in it (an islet on the horizon, a wake that is not yours, a light under
  the water). Steer to it, photograph it, land on it, or leave it.
- **The session (an hour or two):** a sortie. Cast off with a full tank, chart the squares you can reach and still get home, read the
  sky when you lose your place, run from or fight what hunts you, and dock to report your finds and refuel.
- **The week:** the whole sea charted (about two and a half real hours), the phenomena that keep their hours (a light that rises only at
  dawn, a ship that sails only in grief) caught on later trips, the bestiary's plates brought to four stars.

## 2. The grid (`seagrid.js`)

- **9 columns by 7 rows.** The columns run along the Law-Chaos line the islands sit on: Margarite's port at the Law end (column 0),
  Anagami's in the middle (column 4), Entropolis's at the Chaos end (column 8). The lanes run along the middle row (row 3); rows 0 to
  2 and 4 to 6 are the open sea, up to three squares off the lanes.
- **A square's danger** is 0.6 per row off the lane plus 0.5 per step of law. It runs from -1 (by Margarite, on the lane) to 2.8 (the
  Chaos corners, farthest out). Its class (`classAt`) is the danger rounded, 0 Guppy to 4 Leviathan.
- **Every square holds something** (Wind Waker's rule). A budgeted pool is dealt over the sea, Slay the Spire's map way:
  - 18 islets, 12 monuments, 10 wrecks, 8 phenomena and 6 seeps;
  - at most two features in a square, never a kind twice in one;
  - no islet, monument, phenomenon or seep on the shipping lanes;
  - 3 legend-tier finds, on the outermost rows, at the wildest squares.
  
  The lane squares hold wrecks and traffic.
- **The sea is the save's, not the game day's.** The same seed lays the same sea all build long; what moves is the weather, the fronts and
  the Egregores.

## 3. The voyage (`seatrip.js`)

- **Fuel is the clock.** A sloop's tank is 7.5 measures, and a square burns 0.25 of them at cruise (1.5 times that at full sail). A
  full tank sails 30 squares, so a sortie reaches about three squares off the lanes and comes home. A measure costs 0.8 minutes of play,
  so a full tank is about 48 cubes, the price of the Margarite hop's fuel. A dry tank is **towed** to the nearest lane square for 6
  minutes of play: a drain, never a shatter.
- **Doubt is getting lost (dead reckoning).** Each square sailed with no fix adds 0.35 squares of doubt, up to 2. With doubt, a step
  may end one square off (the current, a quarter of a chance per square of doubt, at most a half). The map shows you only to within
  your doubt.
  - **A fix** clears the doubt: a charted landmark in sight (an islet, a monument, a port) fixes you on its own, or you read the sky
    with the Dreamvane.
  - The sky cannot be read inside a front or under grief's or dread's overcast.
  - The lesson is real: carry your position forward from the last fix, and take a fix when you can.
- **Fronts are the weather out here.** A squall line two columns wide walks the sea one column a game hour, off the lanes. Inside it the
  sea is a class wilder (LORE.md: Figments come out of a front a class bigger) and the sky is hidden. Its look is the storm warp's
  and the plume's; it is never a damage source of its own (base change bad, modifiers good: it modifies the class and the sky).
- **A dock** is an island's port: the finds are reported for their fees, the tank is filled and paid for, and the doubt is cleared.

## 4. Discoveries (`discoveries.js`)

- **A find** is reported once at a dock for a fee by its tier, in minutes of play: common 0.75, uncommon 1.5, rare 3.5, legend 12
  (6, 12, 28 and 96 cubes).
- **Late reports lose value.** A find left unreported halves every 6 game days (Sunless Sea's port reports), so a voyage ends at a dock.
- **The whole sea's fees come to about 1,050 cubes, 2.2 hours of the aim.** Exploration is a bounded faucet: it pays once.
- **Most finds are found by sailing into their square.** A **phenomenon** is found only at its hour (night, dawn, dusk) or in its weather
  (wonder, mirth, grief, dread, fury), so some wait for a second trip.

## 5. The safari (`safari.js`)

- **The Egregores are the sea's creatures, real human myths.** The ids are placeholders, with the myth in a comment; Espada names them
  when the open sea is final.

  | id | class | disposition | where it lives | its myth |
  | --- | --- | --- | --- | --- |
  | sealFolk | 0 | wary (shies at 25 m) | 1+ off, the Law half | the selkie |
  | seaLights | 0 | passive | 1+ off, at night | St Elmo's fire |
  | horseHerd | 1 | passive | 1+ off | the hippocamp |
  | fishPeople | 1 | wary (40 m) | 2+ off, the Chaos half | the ningyo |
  | wolfWhale | 2 | territorial (60 m) | 2+ off, the Law half | the akhlut |
  | seaSerpent | 2 | **hostile** (120 m) | 2+ off | the sea serpent (the test enemy) |
  | seaMonk | 2 | territorial (50 m) | 2+ off, at night or in dread | the umibozu |
  | islandWhale | 3 | passive | 3 off | the aspidochelone: an islet that is a whale, and dives |
  | ghostShip | 3 | wary (150 m) | 2+ off, in grief | the Flying Dutchman |
  | bigSquid | 3 | territorial (90 m) | 3 off, the Chaos half | the kraken |
  | worldSerpent | 4 | **hostile** (300 m) | 3 off, the Chaos half | Jormungandr |

- **A square holds its own class and one above** (`sightings`); a front brings the one above in.
- **A plate is scored as Pokemon Snap scores a photo** (`plateScore`), out of 140:
  - how much of the frame the Egregore fills: best near a third (45 of the 100);
  - how centred it is (30);
  - whether it faces you (25);
  - **a habit caught in the act** (a breach, a call, a coil): plus 40.

  The stars come from the score: 1, then 2 at 45, 3 at 70, 4 at 95.
- **The first plate of a species pays** 0.05, 0.1, 0.2 or 0.35 of its class's hunt (`ECON.hunt`), by stars. **A better plate later pays
  the difference** (the professor pays for an improvement, never twice). Every species at four stars comes to 1,236 cubes.
- **A plate also raises familiarity** (`progress/familiarity.js`), as every plate does, so the tag and the bestiary fill in out here too.

## 6. Islets (`islets.js`)

- **An islet** is tens of metres across, built from a **kit** (a rock, an atoll, a sea stack, a ruin, a dead lighthouse, or a sandbar
  that shows only at low water), with **one secret**, Wind Waker's way:
  - a chest;
  - an ostracon;
  - a vantage point;
  - a Figment nest (a small fight on foot);
  - a fuel cache (3 measures, once a game day);
  - a stele;
  - a fishing spot;
  - a crystal.

  Each secret pays through the system that already owns it.
- **Landing:**
  1. The ship moors beside the islet and holds at its anchor.
  2. The Courier seals out of the helm's cradle (HANKO.md: every ship has a cradle for the Pneuka Jar) and steps off.
  3. The islet is a small room of its own, a zone streamed in as the ship nears.
- **The island whale is an islet that is an Egregore.** Land on it and it may dive: a legend waiting to happen.

## 7. The sea serpent: the Marlin-class test (`seaserpent.js`)

- **The body:** class 2. A chain of 14 segments over 30 m, its spine driven as a wave (no rig, so it is simple to animate). Its head is
  the weak point (x3), its coils x0.5. It takes 60 hits of the ship's gun to sink, about two real minutes with the head up a third of
  the time.
- **Speed:** it swims at 9 m a real second against the sloop's cruise of about 10, so it keeps pace with a cruising ship but cannot
  catch one at full sail. Inside 120 m it hunts.
- **Its moves.** Each is a windup the Figment attack telegraph draws on the water, with one answer:
  - **the ram:** 1.4 s; steer out;
  - **the spit:** 0.9 s; an outlined shot, so parry it back at the head;
  - **the coil:** 2.0 s; it wraps the ship for 5 s and halves the helm's turn; shoot the head to break it;
  - **the dive:** 0.5 s; under for 3 to 6 s, its wake showing where it comes up.
- **Spoils:** a material (a placeholder) and a bounty if one is posted. A plate of it in its habit (the coil, the spit) pays as a plate does.
- **What a kill pays** (Dovina, 2026-10-22, on Petra's measured fight; `serpentPay`, wired in `world/opensea/opensea.js`; the log's
  `seaserpent.paid`):
  - **Priced by its own time, not as a hunt.** Petra measured about 50 real s of perfect aim, so with ordinary aim and the sail to its
    lair a kill is about 4 real minutes. ECON.hunt's Marlin is 20 minutes of play (160 cubes). A sea has 32 serpent squares and lairs
    one in four, so about 8 lairs a game day. At a hunt's worth a kill, a sailor who only hunts would make about 2.7x the aim.
  - **So a kill pays 6 minutes of play at the aim**, which is its time plus a hostile's premium. That is x0.75 with the hull at its last
    hit, up to x1.25 with the hull whole: **36 to 60 cubes**. Skill skips grind: the hull kept is the skill.
  - **Hunting alone,** lair to lair, comes to at most about 0.8x the aim an hour, and less after the fuel. The open sea's best faucet
    stays under the aim, as section 13 asks.
  - **Not wired:** Letty's posted bounty (`bountyCls`: the board posts none yet) and the material (the materials table has no serpent
    scale).
- **Achievements** (`sea5` to `sea8`):
  - Something Long: sink one;
  - Shake It Loose: shoot it loose of the hull;
  - Not a Scratch: sink one with the hull whole (`seaserpent.down.whole`);
  - Serpent Season: sink 10.

## 8. Where it meets the rest of the game

- **The Crossings stay the lanes.** Casting off at a pier offers SET SAIL (a Crossing to an island) or the open sea (the free helm). The
  open sea can reach a port too, but the long hauls and the cargo trade are the lanes'.
- **The Sight's needle** points only at what you know: a charted landmark, a port, or a waypoint you calibrated. Uncalibrated, it spins
  (OVERLAY.md 16), which is how you get lost out here.
- **The ledger and the achievements**, all predicates over the ledger:
  - counters `sea.chart`, `sea.find.<tier>`, `sea.report`, `sea.fix`, `sea.tow`, `plate.<egregore>`;
  - records: the farthest out, the most finds in one sortie;
  - achievements: the whole sea charted (count), every phenomenon at its hour (feat), a four-star plate of a hostile one (feat).

  These come with the build, not now.
- **Mounts at sea** keep the rail's rules. The pier's mount view gets three views (section 10, Calissa).

## 9. Measured (`node scripts/opensea.mjs`, 10 seas, a sloop, 5 real hours)

| skill | hour 1 | hour 2 | hour 3 | after the sea is charted | whole sea charted at |
| --- | --- | --- | --- | --- | --- |
| 0.2 (new) | 0.84x the aim | 1.03x | 1.07x | 0.08 to 0.12x | 2.2 to 2.8 h |
| 0.5 | 0.89x | 1.30x | 1.15x | 0.17x | 2.1 to 2.6 h |
| 0.9 (sharp) | 1.09x | 1.71x | 1.23x | 0.21x | 2.2 to 2.6 h |

- **Charting pays about the aim, front-loaded, and more for skill:** a sharp sailor earns about 1.35x a new one over the charting (skill
  skips grind; the grind still pays).
- **Fuel** runs 40 to 110 cubes a real hour, the higher once the bot only wanders.
- **No tows** with sensible fuel planning.
- **Dead reckoning matters, mildly:** with no fixes ever taken, the current moves the ship 24 times a sea against 5 to 7, and the charting
  runs about a tenth longer.
- **Once charted, the open sea stops paying** (0.1 to 0.2x gross, about even after fuel): it becomes a place, for bounties, plates to
  improve and the hours' phenomena. **This is a call for the owner:** if the safari should keep paying, the lever is a respawning
  hunt (an Egregore's material at a stall) or a posted bounty board at the docks.
- **What the bot does not model:** the islets' fights on foot, the fishing, the chests' tiers, a front's bigger classes. Those pay
  through their own systems at their own rates.

## 10. Handoffs (build order for a vertical slice)

1. **Petra:**
   - the free helm: steering, throttle, the camera, a ship on the Emocean's surface outside the rail;
   - the sea as a streamed place: squares as chunks of one zone, islets as small zones streamed in;
   - mooring and stepping off, through the cradle;
   - the voyage state (`seatrip.js`) and its events into the log;
   - the serpent's mind from `creatures/ai/`.
2. **Calissa:**
   - the sea's look off the lanes;
   - the islet kits;
   - the serpent's body (a segment chain);
   - a front's look;
   - the cradle in every ship (HANKO.md);
   - the mounts' three views at the pier.
3. **Wanda:** the open sea's ambience and cue (quiet, wide, the safari's wonder), the serpent's calls, a front's sound.
4. **Espada** (later): the Egregores' names, the islets' names, the log lines, once the owner calls it final.
5. **Dovina:**
   - the achievements;
   - the dock's report page (a choice card a find);
   - the bounty board, if the owner wants the safari to keep paying;
   - the sweep for the open sea once it is a room.

## 11. Built: the room, first pass (2026-10-20; the owner: "let's start building the open Emocean")

Dovina's room, as the Raceway is (`src/world/opensea/`; reached from the Index, O, THE OPEN SEA; the place `opensea`):
- **The water and the sky** are the Emocean's: the zone `opensea` (x 7900 to 11700, z ±1600, at the Emocean's height) is one of
  `openSea()`'s, so the crude sea is shown and followed there and the dunes' sky and far plane hold.
- **The helm** (`helm.js`, `Helm`):
  - W and S step the throttle: stop, slow, cruise (10 m a real second), full sail (x1.5, burning x1.5).
  - A and D are the rudder, which turns harder at speed.
  - The ship rides the drawn sea, pitching and rolling, and leaves the rail's wake.
  - The chase camera swings with the mouse and the arrow keys (the owner's screenshots).
  - The Courier is hidden and held at the helm (main.js `aboard`).
- **The grid's features** (`seaprops.js`) are placeholders:
  - an islet: a mound with a flat, walkable top, a collider, and its secret on it;
  - a monument: three stones out of the water;
  - a wreck: a hull on its side;
  - a phenomenon: a pale column, shown only at its hour;
  - a seep: a dark slick;
  - three stone quays on the lanes. Entropolis's is shut, as its node is locked.
- **The rules are the voyage's** (`seatrip.js`):
  - Each square sailed into burns fuel and is charted, and its finds are found.
  - When you are lost, the current is a slow push off your line, as strong as your doubt, not a teleport.
  - R reads the sky.
  - A dry tank is towed to the lane for its fee.
- **F does what is near:**
  - at sea, by an islet: moor and step off onto it;
  - at sea, by a quay: dock (the reports paid in cubes, the tank filled as far as your cubes go), and step ashore;
  - on an islet, by its secret: take it (a chest pays 3 minutes of play; a fuel cache 3 measures; the rest say so in the log until their systems are wired);
  - on land, by the ship: board;
  - at a quay's post: go home to the workshop.
- **A placeholder readout** (`seahud.js`): the fuel, the square and your doubt, the throttle, and the finds to report. Calissa's to replace.
- **The log rules** are in `feedback/tracking/opensea.js`: plain placeholder lines for Espada.
- **The save:** the voyage is kept (`openSea`, player scope); the sea's seed is the world's (`openSeaSeed`).
- **The sweep** (`scripts/sweeps/opensea.mjs`) passes 14 of 14: enter, board, a square sailed at cruise (charted, fuel burnt), an islet
  moored at and stood on, re-boarding, a dock.

**Not yet:** the safari (Egregores on the water, plates), the fronts on the water, the islets' secrets beyond the chest and the fuel, a
sandbar's tide, and every look. (The sea serpent and the pier's open-sea choice are built: Petra, 2026-10-22, `creatures/seaserpent/`,
`world/opensea/seafight.js`, `world/emocean/pier.js`. `OpenSea.arrive(island)` lands at that island's quay, so a pier on Margarite can
land you at Margarite's.)

## 12. The islets' puzzles and the Dreamvane's treasure hunt (2026-10-20; the owner: "please write them into the plan and implement them! Oh and of course we need a metal-detecting treasure hunt for the dreamvane")

**Why:** an islet's one secret is a reason to stop once. Puzzles make the sea a box to open, and they pay in knowledge rather than
cubes: a fix, charted squares, a find to report. Only the caches pay cubes, and they pay for finding, which is the Dreamvane's job.
The design laws hold:
- Skill skips grind: the dowse finds a cache in seconds where a blind search takes minutes.
- Each puzzle teaches something real without saying so: noticing, perspective, pitch memory, reading a language in context.

**Prior art:**
- Islands of Insight's matchboxes, sightseers and hidden pieces: a world of small puzzles that pay knowledge.
- The Witness's anamorphic lines.
- Ocarina of Time's songs.
- Heaven's Vault's inscriptions, read in context.
- Ratchet & Clank's metal detector (beep faster, then dig).
- Pokémon's Dowsing Machine.
- Animal Crossing's fossils (one dig a spot, once).

**Dealt once from the sea's seed** (`dealPuzzles`, `progress/opensea/isletpuzzles.js`). Each islet carries one piece at most,
beside its secret. A sea of about 20 islets gets 3 pairs, 3 line-ups and 2 echoes, which use 13 islets; the rest keep their secret alone.

- **The pair.** Two islets hold the same carving (a shape in a colour).
  - Come within 6 m of both, in either order, and it is a rare find, reported at a dock as any find is (3.5 minutes of the aim).
  - The first one seen says it looks like one of a pair.
- **The line-up.** A flat stone on an islet's shore, and four arcs hung over the water at 60, 100, 150 and 220 m, each scaled to its distance.
  - From the stone's eye, looking about 7° up, they close into one ring 0.1 rad across. From anywhere else they are four broken pieces.
  - Stand on the stone and look along the line (within 4° of it): you get a fix, and the islet's square and the eight round it are charted.
  - A charted square with a landmark fixes you again when you sail in, so a line-up also makes the squares round it safe to cross.
  - The arcs are far off so that the chase camera, a few metres behind the eye, sees nearly the same ring.
- **The echo.** A singing stone sings a phrase of four of the Crucibelle's five notes (never the same note twice running), in the
  bell's own voice, a note glyph a note in its degree's colour, whenever you come within 7 m (again after 8 real seconds).
  - Its twin, the nearest islet left, has a listening stone with a socket a note.
  - Play the Crucibelle within 8 m of it: the sockets light as your last notes match the phrase from its start.
  - The whole phrase raises its cache. The cache is never less than rare, and it pays at once.
- **The stele.** An islet whose secret is a stele carries three of the ostraca's words in one line (`steleWords`). F reads it as often as
  you like. Read beside the words you have glossed (the Crib Sheet), it teaches the language in context.
- **The caches: the treasure hunt.**
  - Every atoll and sandbar, and a third of the rocks, has a cache buried in the sand.
  - Nothing marks it but a signature of kind `chest` (`core/signatures.js`). The Dreamvane's dowse, attuned to chests (the wheel),
    is the metal detector: it ticks faster as you face it and as you near it, and on the spot the sand shivers (the dowse's own mark).
  - Dig with the pick's ground strike or the Dreamquake (`dreamvane.strike`, Petra's, v235), or with F while the Dreamvane is in hand.
    F never misses: the pick's strike counts only when its tip reaches the ground within 1.6 m.
  - Each cache pays once, for good: `ECON.openSea.cache` minutes of the aim by its islet's tier (common 2, uncommon 4, rare 8, legend 12).
  - A dug cache leaves its opened box.

**The numbers.** On seeds 1, 7 and 12345, a sea deals 5 to 11 caches, worth 290 to 450 cubes (36 to 56 minutes of the aim), plus about
10 minutes from the pairs' finds. On top of charting's 2.4 real hours this is still a bounded faucet. It pays the sea out about an
hour sooner for whoever stops at every islet with the Dreamvane drawn.

**Built** (`world/opensea/puzzlepieces.js`, `PuzzlePieces`): every piece as a placeholder (Calissa's to dress). The state (seen, solved,
heard, dug) is kept in the room's save section `openSea`.
- Log rules: `sea.pair.half`, `sea.pair`, `sea.lineup`, `sea.echo.hear`, `sea.echo`, `sea.dig`, `sea.stele`.
- Ledger counters: `sea.pair`, `sea.lineup`, `sea.echo`, `sea.dig`, `sea.dig.<tier>`, `sea.stele.read`.
- The sweep (`scripts/sweeps/opensea.mjs`, 19 of 19): a pair seen, the line-up's arcs on one ring from the eye, an echo played, a cache
  dug (its signature there first and gone after).

**Asked:**
- **Petra:** done in v235 (f18ace5). The pick's ground strike and the Dreamquake emit `dreamvane.strike { at, r, by }`. Crystals and ostraca
  stay on their own calls for now.
- **Calissa:** the looks (the carvings, the line-up's stone and arcs, the two echo stones and their sockets, an opened cache).
- **Wanda:** the singing stone's voice (it borrows the Crucibelle's for now) and a dig's sound.

## 13. The migrations: the open sea after it is charted (2026-10-22; the owner's "get ambitious" round)

Section 9's open call is taken: the safari keeps paying through herds.

- **What it is (`progress/opensea/migrations.js`):**
  - Each game day, `MIGRATION.herds` (4) herds gather: one species in one square for that game day, drawn from the day and the sea's
    seed, so everyone at sea that day sees the same herds.
  - A herd is 3 to 7 bodies, in a square its species' `lives` allow, at any hour.
  - Hostile species never herd: a herd is to be watched, not fought.
- **How it is found:** Margarite's dock posts the game day's herds on its board (`sea.herds`; the bounties' board, Letty Marque's). The
  Sight can be calibrated to one.
- **What it pays:** a herd photographed pays its fee once, `herdFee(cls)`: half a hunt of its class (`ECON.hunt`), paid at the next
  dock. This is on top of the plate's own pay, and the fee goes with the game day, met or not. Nothing is lost by missing a herd.
- **Measured** (`node scripts/opensea.mjs`, 200 game days, a sloop from the nearest port, nearest herd first):
  - a game day's tour takes 24 real minutes;
  - it pays 229 cubes and burns 49 in fuel, so 180 net: 0.38x an hour's aim a game day (the want was about 0.4x, under fishing);
  - while touring it pays 0.93x the aim.
- **Prior art:** Monster Hunter's investigations, Pokemon GO's nests (one spawn for everyone, migrating on a clock), Pokemon Snap's
  professor, Red Dead Redemption 2's legendary animals told by rumour.
- **The ledger:** `sea.herd`, `sea.herd.<species>`. The achievements, under THE EMOCEAN's "The Open Sea" (names Espada's to rule): Off
  the Lanes, Cartographer (title), Herd Watcher, Migration Season.
- **The world side (built by Dovina, 2026-10-24, `world/opensea/herds.js`; it was Petra's to build, taken while she works the phone's memory):**
  - a dock posts the board once a game day (`sea.herds { day, n, herds: [{ id, squares, way }] }`): each herd by its bearing from the dock;
  - each herd's bodies lie round its square's middle (`game.makeEgregore`, Calissa's placeholders), bobbing, gone at the day's turn;
  - a plate in a herd's square with one of its bodies in the frame (within 180 m, inside the view's cone) meets it: the Veritome's shutter
    ashore, or **E at the helm** with the Veritome worn (`sea.plate`; the Courier's hands are on the wheel, so the plate is taken over
    the bow); `sea.herd { id, square, cubes: herdFee(cls) }`, owed and paid at the next dock (`sea.herd.paid { cubes, n }`);
  - one payment a herd a game day; kept in the room's save (`openSea.herds`).
  - Measured headless: four herds laid (16 bodies); E with no Veritome worn refused; with it, the herd in frame met once (240 cubes,
    a class 3), a second plate paid nothing more; the dock posted the board and paid 240.

