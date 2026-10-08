# Water and paint: the water that talks back, and the Soul Brush's load, bottles and stains (Dovina's rules, Petra's phases, 2026-10-06)

The owner, 2026-10-06: ripples and wakes on the water, Super Mario Sunshine's systems on the Soul Brush, Splatoon beside it, in synergy
with what exists. **Built**, all five phases (section 5; the liquid is Lachryma, the owner's ruling). One file: it was SUNSHINE.md
(Petra's note: the analysis cut to the phases) and SUNSHINE-SYSTEMS.md (Dovina's rules, which answered that note's draft).

Kept by Dovina. **Built:** the data `src/progress/brushload.js` (BRUSH, BOTTLES, STAINS, CLEAN), the modes `src/tools/soulbrush/load.js`,
the stains `src/world/ground/stains.js` (drawn by `src/vfx/stains.js`), the bottle `src/vfx/bottle.js`, the Jet Arts
`src/courier/moves/jets.js`, the log's rules `src/feedback/tracking/brush.js`. **Not built:** the achievements (section 4), the coated
folk, the water and slip loads (section 3).

**The principle:** paint is a feeling laid on the ground, and washing recovers what was spilled. Every part plugs into a loop that
exists (the ecology, the weather, the stones, the voyage's crude, the Dreamvane) instead of adding a currency.
Prior art: Super Mario Sunshine (its pollution layer, doldecomp/sms PollutionLayer, and FLUDD's tank as a leash to the scenery),
Splatoon (paint in a texture over the level), de Blob, Okami, PowerWash Simulator (the reveal), Luigi's Mansion 3, the ripple tank
(Hugo Elias's 2D water).

## 1. The owner's rulings (2026-10-06)

(Code written before the file was cut cites ruling n as "section 4.n".)

1. **Saturate on hold** (settled with Petra). Every LMB press swings the club at once (no tap window; the club's feel is untouched).
   Held past `SLAM.hold` (0.32 real seconds): on the ground the bristles saturate over the psygun's full charge time (`T.charge.time`,
   0.85 real seconds), then the mode works; in the air it is the slam's ground pound.
2. **Two modes, as the Sondelass's forms** (1 and 2 while the brush is out). **Paint** sprays Lachryma out (bottle, else pool) and lays
   the bottle's grade, else the draught's feeling (`progress/stones.js`). **Mop** drinks environmental Lachryma in (a stain, a puddle,
   a coated folk) into the bottle. The mop fills what the paint spends: one loop.
3. **The split with the Lockheart:** the Lockheart drains Lachryma from creatures; the Soul Brush is environmental Lachryma only.
4. **Hover, rocket and skim: now**, as Movement Arts (opt-in, off by default; switched off, the core movement is exactly restored).
   Water sliding is not a new move: wet or painted ground under the existing Brush Slide makes it run on it.
5. **Stains are spilled crude**, graded by feeling. Left alone a stain grows a stage a game day (3 stages); at the third it spawns
   **one** aberrant Figment (a slip jelly gone wrong, a bounty's quarry), then holds. At most one spawned Figment per stain; stains are
   placed by the game day's layout, never on a timer, so neglect is a nuisance, never a swarm. A crossing's spill puts 2 on the Shore.
6. **The Lachrymato Bottles**: their own equipment place (`'bottle'`, upper back), one at a time, sold by Old Grog on the pier. A bigger
   bottle is paid in **risk, not speed** (it cracks more easily and spills a share as a stain where you stood); equip weight that slowed
   the Courier would break the gold standard. A reserve, not a second pool: it feeds the pool only below half. A full bottle gives off a
   signature. Prices are placeholders until `scripts/economy.mjs` has a brush profile.
7. **The coated folk:** a folk in a spill is coated (Calissa's look) and the mop cleans them; the pay is thanks and a line; the ledger
   counts `folk.clean` when built.
8. **Words:** **Lachrymite** is Lachryma's solid form (cubes, crystals); the player reads **blot** and **blotling** (Espada), ids stay `stain`.

## 2. Cleaning as income

- What washing pays: what the stain hid (a path, a door, a find worth a pot: `CLEAN.findChance`) and the crude itself into the bottle.
- The rate: about **0.5x the aim** as a loop of its own (`CLEAN.aim`), under angling and the Great Dunemaw.

## 3. Open: from the first draft, not in the rulings

- A **water** load (filled at any `water` ecology offer, free: washes stains, puts out fires, wets ground) and a **slip** load (the
  Workshop's slip, the Dunemaw's slip rivers: slide lanes that slow walkers). Never casks: crude in casks is the voyage's cargo.
- The weather fills and dries a load by a rate (the long rain refills in the open; Dunes daytime and the wanting wind dry fastest;
  night slowest; roofed places neither, by `progress/weather.js` exposure).
- Painted ground builds its feeling's damage type's status on creatures standing in it, at the weather's rate, and gives off a
  signature (the Dreamvane hears it).

## 4. Events and counts (`feedback/tracking/brush.js`)

| event | payload | counts |
|---|---|---|
| `brush.mode` | `{ mode, by }` | (said, not counted) |
| `brush.paint` | `{ aspect, area, from, by }` | `paint.area`, `paint.<aspect>` |
| `brush.mop` | `{ lachryma, by }` | `mop.lachryma` |
| `stain.wash` | `{ grade, stage, by }` | `stain.wash`, `stain.<grade>`, `stain.wash.grown` |
| `stain.spawn` | `{ grade, kind, by: 'environment' }` | `stain.spawn` |
| `bottle.crack` | `{ bottle, spilled, by }` | `bottle.crack` |

Not yet emitted (the open loads): `fire.out { by }`, `slide.wet { metres, by }`.

**Achievements to add**, under THE SOUL BRUSH, sub-category **The Load**, on the build that emits their events: wash 100 square
metres; a stain of each grade; put out ten fires; a creature brought down standing on your own painted feeling; slide 500 metres on
wet ground.

## 5. The five phases, as built (Petra's; was SUNSHINE.md section 4)

1. **The water talks back:** `game.water.disturb(x, z, strength, kind)`, Calissa's rings, wakes, crown and drips (`vfx/water.js`).
2. **The paint map:** where Lachryma lies on the ground, read by the ground's shaders and by movement (`world/ground/paintmap.js`).
3. **The load on the Soul Brush:** paint and mop, the saturating hold, the Lachrymato Bottle (`tools/soulbrush/load.js`).
4. **Stains,** washed to reveal what they hid (`world/ground/stains.js`).
5. **The jet arts,** hover, rocket and skim, opt-in through `/art` (`courier/moves/jets.js`); the Brush Slide runs on painted ground.
