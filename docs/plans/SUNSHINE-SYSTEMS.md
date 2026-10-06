# Water and paint on the Soul Brush: the systems (Dovina's answer to `docs/plans/SUNSHINE.md` section 5, 2026-10-06)

Kept by Dovina. Petra's plan is the substrate: the brush gets a **load**, a **paint map** records wet ground, slip and stains, and
**stains** are washed off. This file says what each is worth and what it touches. Nothing here is built past Petra's phase 1 until the
owner answers the three questions at the end. Units: real minutes, game hours, minutes of play (`ECON.perMinute`).

**The principle:** water is **free and placed**, paint is a **feeling laid on the ground**, and washing **recovers what was spilled**.
Every part plugs into a loop that already exists (the ecology, the weather, the stones, the voyage's crude, the Dreamvane) instead of
adding a currency.

Prior art: Sunshine's FLUDD (the nozzle fills at any water, and the reward for cleaning is access and Shines, not coins); Splatoon (ink
as territory: what you stand in helps you or hinders you); de Blob (colour restores a place); Viewtiful Joe's and Okami's brush
(painting changes rules); PowerWash Simulator (the pleasure of a stain coming off, paid per job, not per square metre).

## 1. The load, and where it comes from

| load | filled at | costs | does |
|---|---|---|---|
| **water** | any `water` ecology offer (the Weir's pond, the Shore, a Dunemaw pool, a rain puddle): the ecology already lists them, so no new list | nothing | washes stains, puts out fires, wets ground (wet ground: the Brush Slide runs faster, slip jellies slide off it) |
| **slip** | the Workshop's slip and the Dunemaw's slip rivers | nothing | paints slippery ground (a slide lane), and slows what walks on it |
| **Lachryma** | the Courier's own pool | the pool, at the psygun's rate (a second of spray costs about a shot) | paints **a feeling**: the draught's (`progress/stones.js`) |

- **No casks:** crude in casks is the voyage's cargo, and the economy prices it, so painting never spends it.
- **The weather fills and dries:**
  - In the open, the long rain (grief) refills a water load slowly.
  - By daytime in the Dunes, and in the wanting wind (desire), a load and wet ground dry faster.
  - At night they dry slowest.
  - It is a rate, never a switch (`progress/weather.js` exposure: roofed places do neither).
- **Painting a feeling** (the synergy that matters):
  - Lachryma laid on the ground carries the feeling of your **draught**.
  - Ground painted with a feeling builds **that feeling's damage type's status** on creatures standing in it, at the weather's rate
    (Splatoon's ink as territory, in our five).
  - Painted ground gives off a **signature** (`core/signatures.js`), so the Dreamvane hears it and creatures with a nose notice it.
  - So the stones choose your paint, the weather where you drank chooses its feeling, and the ground becomes a trap you set.

## 2. Cleaning as income

- **Stains are spilled crude.** The voyage already spills casks at sea (`progress/voyage.js` `stageResult`: a spill), and the Shore is
  where the sea comes in. So a stain is crude washed up or spilled, graded by its feeling. This is my lean for the owner's question 3,
  and Espada names it.
- **What washing pays:**
  1. **What the stain hid:** a path, a door, a find (a pot's worth, `FINDS.potFind`). Sunshine's way: the reward is access.
  2. **A little of the crude itself:** a washed stain gives a share of a cask of its grade (a quarter, placeholder), which sells at the
     piers at the island's price. So cleaning feeds the market that already exists, and the weather's supply rule prices it.
- **The rate:** cleaning as a loop of its own pays about **0.5x the aim** (about 4 cubes a real minute), under angling and the Great
  Dunemaw. Stains come back with the game day's layout (as the nursery's clutches do), never on a timer, so they can't be farmed. The
  Shore's stains come back with the spills of crossings.

## 3. The ledger and the achievements (added when phase 2 emits the events)

- **Events:**
  - `brush.wash { area, by }`
  - `stain.wash { grade, size, by }`
  - `fire.out { by }`
  - `brush.paint { load, area, aspect?, by }`
  - `slide.wet { metres, by }`
- **Counts:**
  - `wash.area` (square metres washed)
  - `stain.<grade>`
  - `fire.out`
  - `paint.area.<load>`
  - `paint.<aspect>`
  - `slide.wet.metres`
- **Achievements**, under THE SOUL BRUSH, a new sub-category **The Load**:
  - wash 100 square metres;
  - a stain of each grade;
  - put out ten fires;
  - a creature brought down standing on your own painted feeling;
  - slide 500 metres on wet ground.

## 4. The owner's rulings (2026-10-06), and what follows from them

The three questions are answered. The data is `src/progress/brushload.js`; the log's rules are `src/feedback/tracking/brush.js`.

1. **The controls: saturate on hold.**
   - Hold LMB: the bristles **saturate** with Lachryma over the psygun's full charge time (`T.charge.time`, 0.85 real s today,
     Petra's feel), then the brush works its mode. One rhythm for both tools.
   - A press shorter than the psygun's tap window (0.13 real s) is a club blow, **whatever is held**: a full bottle never costs you
     the club.
   - **The conflict:** the club's held slam (`SLAM.full`, 1.1 real s, `src/tools/soulbrush/club.js`) sits on the same hold. Lean: the
     slam moves to **hold LMB in the air** (a ground pound: Sunshine's own, and Bayonetta's), and the ground hold is the saturate.
     Petra's call, as it touches a combat timing.
2. **Two modes, as the Sondelass's forms** (1 and 2 while the brush is out):
   - **paint**: sprays Lachryma **out** (from the bottle, else the pool), at 6 Lachryma a real second, 7 m of throw. What it lays is
     the bottle's grade (the feeling of the crude it last drank), else the draught's (`progress/stones.js`): section 1 still holds.
   - **mop**: drinks environmental Lachryma **in** (a stain, a puddle, a coated folk), at 12 a real second within 2.4 m, into the
     bottle. Out and in: the mop fills what the paint spends, so the two modes are one loop, not two tools.
3. **The split with the Lockheart:** the Lockheart drains Lachryma from **creatures**; the Soul Brush is **environmental** Lachryma.
   Nothing the brush does pulls from a creature, and nothing the Lockheart does mops the ground.
4. **Hover, rocket and skim: now**, as Movement Arts (opt-in, off by default; switched off, the core movement is exactly restored).
   Sunshine's water sliding is not a new move: it is rolled into the existing **Brush Slide** (wet or painted ground under it, the
   slide runs on it), with Calissa's look.
5. **Stains are spilled crude** (graded by its feeling). Left alone a stain grows a stage a game day (3 stages, 10/20/35/50 Lachryma
   to mop); at the third it spawns **one** aberrant Figment (a slip jelly gone wrong, a bounty's kind of quarry), then holds. **Cap:**
   at most one spawned Figment alive per stain, and stains are placed by the game day's layout, never on a timer, so a neglected place
   is a nuisance, never a swarm. A crossing's spill puts 2 on the Shore.
6. **The Lachrymato Bottles** (worn on the upper back, their own place; tools worn on the back keep theirs):

   | bottle | holds (Lachryma) | feeds the pool (a real second, below half) | cracks on a broken shield | spills when cracked | price (minutes of play) |
   |---|---|---|---|---|---|
   | small | 40 | 6 | 10% | 30% | 10 |
   | medium | 80 | 8 | 20% | 40% | 25 |
   | large | 120 | 10 | 35% | 50% | 50 |

   - **Tanky without touching the movement:** a bigger bottle is paid in **risk**, not speed. It cracks more easily, and a crack pours
     a share of it out as a stain where you stood (which you can mop back, if you have the time). Equip weight that slowed the Courier
     would break the gold standard, so it is not on the table.
   - **A reserve, not a second pool:** it feeds the pool only below half, so the pool's band still reads true.
   - A full bottle gives off a signature (`core/signatures.js`): creatures with a nose and the Dreamvane notice a tank of it.
   - The prices are placeholders until `scripts/economy.mjs` has a brush profile (the loop's pay, about 0.5x the aim, section 2).
7. **The coated folk:** a folk in a spill is coated in Lachryma (Calissa's look) and the mop cleans them. A Courier helps; what they
   pay for it is the folk's thanks and a line, and the ledger counts it (`folk.clean`, when it is built).
8. **Lachrymite** is Lachryma's solid form (the glossary): cubes and crystals are Lachrymite.

## 5. Events (for Petra's build), counted by `feedback/tracking/brush.js`

| event | payload | counts |
|---|---|---|
| `brush.mode` | `{ mode, by }` | (said, not counted) |
| `brush.paint` | `{ aspect, area, from, by }` | `paint.area`, `paint.<aspect>` |
| `brush.mop` | `{ lachryma, by }` | `mop.lachryma` |
| `stain.wash` | `{ grade, stage, by }` | `stain.wash`, `stain.<grade>`, `stain.wash.grown` |
| `stain.spawn` | `{ grade, kind, by: 'environment' }` | `stain.spawn` |
| `bottle.crack` | `{ bottle, spilled, by }` | `bottle.crack` |

The achievements (section 3) are added when these are emitted, so they are reachable on the build that ships them.
