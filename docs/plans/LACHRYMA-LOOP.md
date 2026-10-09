# The Lachryma loop: crude in, a feeling out (the Courier as transmutator)

The owner, 2026-10-09:
- "All crude stains are just unrefined Lachryma. Lachryma has to be processed (like run through a facility or an entity like the
  Courier) to be turned into one of the aspected forms."
- "The Courier is our universal transmutator. Mops up crude stains, and can then paint in the colors of aspected forms of Lachryma."
- The Soul Brush should feel like Super Mario Sunshine. Today it doesn't: stains don't smear or merge, the mop and the jets give no
  feedback, and the spray is "very inaccurate and confusing".

Kept by Dovina. The research behind it is `docs/plans/research/PAINTING.md` (Splatoon, Super Mario Sunshine, de Blob, Okami, Viscera
Cleanup Detail, PowerWash Simulator, Portal 2, with sources). Each part below names who builds it. **Open** marks what waits on the
owner or Espada.

## 0. The words (Espada, 2026-10-09; proposals until the owner rules)
- **Crude** carries no feeling: feeling gone flat ("fossil feeling, until nobody remembers having it"). It runs a cycle like
  petroleum's: weather falls aspected, soaks down and flattens into crude, and refining wakes a feeling again.
- **Crude is named for its field,** as Brent and West Texas are: "a cask of Dunemaw crude". That settles section 1's question:
  provenance, not feeling.
- **To refine** is the verb. The refineries are the Courier and **Margarite's Stillhouse**, where the King's crude becomes aqua regia.
- **Refined Lachryma** is "wonder Lachryma"; the unrefined is just "crude".
- **Slip**: "what is the island's own is slip; what is the sea's is crude". Jellies, slip roe, the bowl's slip pools, the geysers and
  the Slip Trail stay slip. A wet Lachryma hazard is crude, a blot.
  - The Lockheart's "slip nuke" becomes **the gusher** (the oil-boom word for a well that blows).
  - The brush's "flick of slip" stays only if it is still clay.
- **The radial's eighth slot is Fair** (the game's word for no feeling: fair weather, fair water, opposites cancelled). Its label on the
  choice card is the owner's to rule against CLARITY's genre-word rule ("Clean"?); Fair is its lore name.

## 1. One substance, two states
- **Crude**: unrefined Lachryma. Spilled on the ground it is a **blot**; carried, a **cask**. It has **no feeling**. It oxidises in the
  open as the clapperjars' dropped baubles do: dark and oily when fresh, then shifting through Lachryma's colours. *Espada settles
  the words; Calissa the look.*
- **Refined Lachryma**: crude processed into one of the seven feelings: Wonder, Mirth, Desire, Grief, Dread, Gall and Fury. Faith is
  cut. The Courier refines it, by drinking it and painting it out. A facility refines it at scale (Margarite's lamp works, which
  make aqua regia, is the natural one). (Words: section 0.)
- **Slip** stays the potter's word for clay: the slip jellies' bodies, slip roe, the Slip shell. The hazard on the ground that you
  slide in becomes crude. (Words: section 0.)
- **Every feat of the Courier's power reads as Lachryma**: the blink dash's afterimages, a slam's shock, a jet's thrust, all
  hue-shifted like the Lachryma tools. *Calissa's.*

### What this costs the economy (Dovina's; a ruling to confirm)
Casks, the Purser and hauling are priced today by the feeling a cask carries, and the weather sets it. With crude feelingless, the
proposal:
- a cask carries its **island of origin** instead of a feeling, and the price gap between islands stays;
- **refining is where the value is added**: a bottle of refined Lachryma sells for more than the crude that made it.

The simulator (`scripts/economy.mjs`) is rerun before this is built. **Open:** the owner confirms provenance over feeling.

## 2. The Soul Brush as the transmutator
| Mode | Does | Fills or spends |
|---|---|---|
| **Mop** | Drinks crude and paint under a swept strip into the Lachrymato Bottle | Fills the bottle |
| **Paint** | Sprays refined Lachryma in the feeling picked on the radial | Spends the bottle |
| **Fair** (the radial's eighth slot; the owner's "Neutralize") | Sprays clear: removes paint and crude where it lands, at range, as FLUDD's water cleans goop | Spends the bottle, gains nothing |

The trade: the mop is close and slow, and it is how you refuel. Neutralize is fast and at range, and it costs you.

- **The radial** (hold the brush's mode key): eight slots, the seven feelings in display order plus Fair. Each slot shows the
  feeling's icon and colour, never colour alone (CLARITY.md). It ships with five feelings plus Neutralize and two slots showing locked
  until Gall and Fury exist. *Calissa's look; Petra's input.*
- **Bottles are doubled** (done, 2026-10-09): 80, 160 and 240.

## 3. Painting that hits what you aim at (the research's rules, ours now)
The causes, from reading the code: the spray throws away the camera's pitch; each drop gets a random upward tilt and a random
speed, landing anywhere from about 3.4 to 9.7 m; the scatter is a flat ±10°; one drop is a faint dot; and there is no reticle.

1. **Aim with pitch**: a drop flies along the full look ray, straight for 5 m, then falls. Random speed is no more than 3%.
   (Splatoon's two flight states.)
2. **A ground reticle**: an inner point where the stream's centre lands, found by the same simulation, and an outer ring for the
   current spread. A world mark, no text. (Splatoon.)
3. **Spread**: 3° standing, 5° moving, 12° in the air; full-spread drops are biased rare, building with sustained fire and resetting
   on a jump. (Splattershot's model.)
4. **Splats you can see**: radius 0.35 m near, growing to 0.7 m at 6 m, stretched along a shallow hit; droplets trail along the arc
   every metre; one drop always shows.
5. **One feeling a cell, last writer wins**, with a crisp edge. The same feeling thickens. Opposites cancel to bare ground, as the
   wheel already rules.
6. **Blots live in the paint map**, so spills that touch merge into one blot for free. The separate stain meshes go.
7. **The mop wipes a strip** 2.4 m wide along the swing, edge first. The blot shrinks from its rim, and a thin smear trails 0.5 m
   along the stroke. (Viscera Cleanup Detail; PowerWash Simulator.)
8. **The mop's head shows its load** in steps, pale to dark; it drips when nearly full, and a full head smears instead of drinking.
9. **What's left to clean** can be highlighted on the ground (a world mark), as PowerWash shows the dirt still to go.
10. **Coverage counts top-down**: floors, never walls, for the ledger and its achievements. (Splatoon's Turf War.)

*Code: the brush and paint map are Petra's (`tools/soulbrush/`, `world/ground/`); the reticle, splats and mop look are Calissa's;
the numbers are Dovina's (`progress/brushload.js`).*

## 4. Gauges: nothing spends in silence
- **The bottle is the gauge**: its fill is drawn on the Courier's back. A thin arc beside the reticle shows the same number while you
  paint or mop. When empty, the arc flashes and the log says once "The bristles run dry."
- **The jets** (hover, rocket, skim) draw from the bottle, so they share its gauge. Hover shows a ring at the feet draining over its
  1.6 s; rocket shows a charge ring filling over 0.55 s. (Sunshine's water gauge; FLUDD's nozzles.)
- A stream costs about 0.9% of a bottle a drop: a full small bottle (80) is about 11 real seconds of spray. Refilling waits a third of
  a second after you stop.

## 5. Open, for the owner
1. **Does painted ground change how you move?** Splatoon's swim and Sunshine's slide are the biggest "it feels like Sunshine" levers.
   The proposal: an opt-in Movement Art (a knack, earned) where your own feeling speeds you up and refills you, and others' slow you.
   It is never a change to the core movement, and switching it off restores the core movement exactly.
2. **Crude priced by island of origin, not feeling** (section 1).
3. **Ship the radial with five feelings now**, or wait for Gall and Fury.

## 6. Order of work, when ruled
1. Espada's words: done (section 0). The glossary's crude, cask and blot lines are updated once the owner rules.
2. The numbers in `brushload.js` (Dovina).
3. Aim, spread, reticle and splats, plus a QAIS range test at 3, 6 and 9 m with a debug chest (Petra and Calissa).
4. Blots into the paint map; the mop's wipe and its head (Petra, Calissa).
5. The radial and the gauges (Calissa, Petra).
6. Crude's economy, re-simulated (Dovina).
7. Gall and Fury (WHEEL.md, Dovina's spec first).
