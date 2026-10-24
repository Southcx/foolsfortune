# From Calissa (Art): the Courier's flourishes, and what opens them (2026-10-24)

The owner: "pull out all the stops on customization options, you can get weird with it." Built and waiting on your rows: five slots of
small personal effects round the Courier, looks only (no rule, nothing touches the core movement). Look: `docs/plans/art/flourishes.jpg`.
Code: `src/vfx/flourishes.js` (`FLOURISHES`, `game.flourishes`, save section `flourishes`, scope **player**, as the vessel's glazes
and the idle are; `/flourish`), its effects `src/vfx/flourisheffects.js`, the prints `src/vfx/flourishprints.js`.

**How it stands.** Each slot wears its stock (the aura: off) or one option. Until you add rows: the stock is always open; every other
option is open **only in the DEBUG save**, switched by `/flourish <slot> <id>` (DEBUG only; `/flourish` alone lists). An option no longer
open (a DEBUG pick met in STORY) goes back to the stock. Event `flourish.set { slot, id, ... by: 'courier' }`, said in the log
(`feedback/tracking/flourishes.js`); nothing counted.

**What I need from you.** Fill `OPEN_WHEN` in `src/vfx/flourishes.js` (a table `'<slot>.<id>' -> (game) => bool`, a predicate over the
ledger or the achievements, never a flag), or tell me where your unlock table lives and I will read it. A place to choose them in STORY
is not built either: the kiln's window (Petra's `courier/vessel/kilnui.js`) is the natural home, beside the idle; say if you want it
elsewhere. Proposed rows (an existing achievement where I found one; "new" a count I did not find):

| slot.id | label | opens (suggested) | why |
| --- | --- | --- | --- |
| footprints.blossom | Blossoms | `gy1` First Bloom (`garden.bloom` 1) | tending makes the flowers |
| footprints.scorch | Ash scorch | `vf1` First Firing (`vessel.fired` 1) | the kiln's heat in your soles |
| footprints.comb | Comb glyphs | an ostracon found (new: `ostracon.find` 1) | the script learned, then trodden |
| footprints.paw | Paw prints | `dt2` Well Travelled (`dist.total` 10 km) | the weird one, for walking a lot |
| footprints.puddle | Glaze puddles | `vf3` Golden Repair (`vessel.refire` 1) | a glaze that ran |
| dash.shards | Glazed shards | `ds1` Quick Step (`move.dash` 100) | the count way |
| dash.ribbon | Soul ribbon | an attribute's first rank at the press (new: any `alchemy.rank.*` 1) | your soul colour made visible |
| dash.talismans | Paper talismans | a Celestial mode sigil cast (new count) | the brush's paper |
| dash.feelings | Seven feelings | all seven feelings awakened (`feeling.known.*`, 7 of 7) | the feat way |
| dash.dice | Tumbling dice | `bl1` Blinker (`move.blink` 100) | the stones thrown |
| shatter.porcelain | Blue and white | a stoneware or porcelain folk's line heard (new) or 5 shatters (new: `courier.shatter` 5) | grind closes the gap |
| shatter.kintsugi | Kintsugi | `vf3` Golden Repair | gold joins, as the kiln mends |
| shatter.ink | Ink | a sigil count, as above (new) | the brush's ink |
| shatter.moths | Moths | a night game day's play (new: a shatter at night?) | weird on purpose; your call |
| shatter.leaves | Falling leaves | an autumn game day in the Spirit Garden (new, `seasonOf`) | the season's |
| aura.motes | Soul motes | `alchemy.press` 10 (new threshold) | the soul colour again |
| aura.comb | Comb ring | three ostraca found (new) | the script round your feet |
| aura.embers | Kiln embers | `fi1` The Second Firing (`firing` 2) | a tribulation's heat |
| aura.die | Orbiting die | a Luck's re-roll held (new: `reroll.hold` 1, DICE.md 3) | the stones' chance |
| arrival.column | Glaze column | `vf1` First Firing | your glaze, standing |
| arrival.petals | Petal swirl | `gy2` In Full Bloom (six planetoids) | the garden's peak |
| arrival.talismans | Talisman fall | five Shrines found (new: `shrine.find` 5) | the Shrines' paper |
| arrival.smoke | Kiln smoke | `sr1` Catch Your Breath (`shrine.rest` 1) | the first, and the cheapest |

Unknowns, face up: I did not check whether `ostracon.find`, `courier.shatter` or `alchemy.press` are ledger counters by those names;
the "new" rows are guesses at what reads well, not counts I verified. Prices: none proposed (the brief says opens by achievement).
Delete this note in your branch when done.
