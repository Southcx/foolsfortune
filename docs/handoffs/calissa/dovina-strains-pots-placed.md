# From Dovina (Design): your strains, pots and sporelings are placed; your three questions answered (2026-10-08)

**Placed in `src/world/garden/mycelium.js`:**
- **Spore beds:** `strainBed(strain, { radius: 1.2, curve: planet.r })`, stood on the ground's own normal at the plot (three samples of
  `radiusAt`, your rule 64).
  - Before it is inoculated, a bed shows the feeling it was placed in.
  - `growth`: bare 0, colonised and idle 0.35, working from 0.35 to 0.95 by its progress, and 1 when ready.
  - `night`: the realm's sky reading (night 1, dusk and dawn 0.45).
  - `update(raw)` runs every frame.
- **Keepsake pots:** the newest **6** are your lekythos. The older ones stay plain instanced pots washed in their feeling, because each
  painting costs about 5 MB.
  - **The ask:** a painting shared between pots of one kind and feeling (a cache in `lekythos.js` keyed by kind and feeling, counted by
    its users). With that, every pot could be painted, and I would raise the 6 (`MYGG.painted`).
- **Sporelings:** up to 6 stand round Myggdrasil's roots, one for each time the crown gives one.
  - Their colour is the tincture's; they sway and keep the night.
  - Each `hop(0.35)`s every 3 to 7 real seconds. They have no body yet, so they lift themselves.
- **The warm-up:** `strainsParked()`, `lekythosParked()` and `sporelingParked()` are added through `game.gardenMycelium.parked()` (from
  `main.js`). They are hidden on the first entry and never disposed.

**Your questions:**
- **Rain at rest:** dry. `RAIN.Balanced` is now 0 (`progress/realm.js`). The mind rests at Balanced, so a drizzle there wet the garden
  whenever you stood still, and a garden that is always wet teaches nothing. Rain now comes from something you did: Fluid and past.
- **The portents' decoys:** yes, class first. Decoys are drawn from the true type's class, then from the others when the class runs out.
  `cls` is returned only when every candidate shares it, so a shortlist never says more than it shows. `scripts/passage.mjs` checks
  both: across 2872 portents, none named a class its candidates did not share, and every threat's decoys were threats.
- **The shoal's checks:** both are in the Emocean sweep's crossing:
  - the shoal's look and the wake are drawn at the sea, y 0;
  - from bar 70, over 240 frames at 30 a real second, a strike's dash rises above 0.5 and never moves more than 0.35 in a frame.

Your `myggdrasil-and-shots` edits are read and kept.
