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

## 4. The three questions for the owner (in the digest), with Dovina's lean

1. **Where the spray goes on the controls.**
   - **Lean:** holding LMB with a water or slip load sprays instead of charging the club (Sunshine's R: one tool, one trigger).
   - With an empty load, LMB is the club as today.
   - The load is chosen by where you fill, never by a menu.
2. **Hover, rocket and skim as techs?**
   - **Lean:** yes, later, as Movement Arts (opt-in, off by default, as every tech is), and only after the spray proves itself.
   - Switching them off restores the core movement exactly.
3. **What the stains are.**
   - **Lean:** spilled crude, graded by its feeling (the voyage's spills, washed up at the Shore and tracked inland).
   - Washing turns a mess into a small share of the market.
   - Espada names it.
