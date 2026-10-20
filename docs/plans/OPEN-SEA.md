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
