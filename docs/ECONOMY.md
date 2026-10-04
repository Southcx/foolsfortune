# The economy

Lachryma is everything. **Cubes** (Lachryma condensed) are the only currency. This page covers four things:

- where cubes come from and where they go;
- what each source should pay;
- how the numbers are measured;
- why they changed in R38.

The numbers live in one table, `src/progress/econ/table.js` (`ECON`). Change them there and nowhere else.

## The unit: a minute of play

`ECON.perMinute = 8`. Ordinary play earns about 8 cubes a minute, or 480 an hour. That means fighting, mining, photographing, or some of each.

Every price is named in minutes: `minutes(n)` in `src/progress/econ/economy.js` turns n minutes into cubes.

- A sealed chest from the Tithe costs **6 minutes** (48 cubes).
- The shops price in minutes too: a roll of film is a minute and a half, a lure five minutes, a twin key ten. A glaze will be about fifteen.

No activity should pay more than about **1.5×** the aim. The one exception is luck: a prismatic chest is meant to feel like a windfall.

## The map

```
 FAUCETS (cubes into the world)                         DRAINS (cubes out)
 ───────────────────────────────                         ─────────────────
 slip jelly burst ........ ECON.jelly.burst  ─┐      ┌─► the Tithe ........... ECON.tithe.cost
 zandatsu core ........... ECON.jelly.core    │      ├─► shops ............... ECON.goods (minutes)
 crystal harvest ......... ECON.crystal       ├─►  ──┤      Raku haggles; Grog buys fish back (a faucet too)
 chests (world, treasury). ECON.chest         │ cubes├─► glazes, firing (R38d)
 a curio they have, again .. ECON.dupe          │      └─► the Shrine Garden (later: the long sink)
 condensing a spare card . ECON.condense      │
 selling to the folk ..... ECON.fish, .curio  │
 Lockheart CUBES ......... ECON.lockheart  ───┘
 /grant (DEBUG only, not counted as income)
```

**Converters**, in Machinations' terms, take one resource and give another:

- the Tithe and the Lockheart turn cubes or Lachryma into chances;
- condensing turns cards into cubes.

**The long-term sink** is the Internal Shrine Garden, a pocket dimension inside the Courier vessel. Every economy that keeps running needs one sink that never fills (OSRS's construction skill, FFXIV's housing). It is what the other prices are built to feed.

## What each profile earns

From `node scripts/economy.mjs`, which uses the table and the assumed rates of play in its `PLAY` block:

| profile | before R38 | after R38 | × aim |
|---|---:|---:|---:|
| fighter (jellies, zandatsu) | 608 | 608 | 1.27 |
| miner (the dune sea's 18 crystal formations, tuned by ear: R39) | 1,389 | 834 | 1.74 |
| photographer (spare cards condensed) | 667 | 430 | 0.90 |
| angler (fish sold to Old Grog) | 0 | 475 | 0.99 |
| treasury camper (the Weir's five plinths) | 94,980 | 586 | 1.22 |

The photographer row is after film: a roll costs 12 cubes. It earns 430 an hour without film and 310 with it.

From R39 the miner earns by ear (`src/world/dunes/crystaltuning.js`). A formation broken open by plain strikes pays a share of its worth by its nature: dense 0.6, fragile 0.5 (`ECON.crystal.kind`). One opened at its sweet spot pays many times over: dense ×2, fragile ×6 (`ECON.crystal.sweet`). The row assumes a quarter of the formations are fragile, and that they find the spot on 40% of the dense ones (ten strikes to try) and 15% of the fragile ones (three). A miner who never listens earns about 400 an hour (0.83 × aim).

## The shops (R38c, `src/progress/shop/`)

There are two counters, opened from the keeper's talk ("Let's trade."):

- **Raku's treasury** sells Possibilikeys and coffins at a 45% markup, and haggles. He buys curios (his trade, at `ECON.curio`, a little over what the curio's spare card condenses for), and keys and coffins at half their worth.
- **Old Grog's pier** sells film and lures at their worth, and buys fish (his trade: `ECON.fish` by tier) and lures at half.

How prices move (`ECON.shop`, after OSRS):

- Each unit a shelf is short of its stock makes it 10% dearer.
- Each unit a keeper has already bought takes 7% off what they pay, down to a quarter of the worth.
- Every 90 seconds, each shelf and each glut moves one unit back toward normal.

**The haggle** (`src/progress/shop/haggle.js`): Raku asks his list price and never goes below his floor (the worth plus 2%). Simulated, the moves end like this:

- An offer at the low end of what is put to their sulks him into holding at list.
- Steady fair offers, flattery or walking away while he is pleased end about 18–20% under list.

**Selling to the folk replaces condensing** as the way to turn things into cubes. A landed fish is now a thing in the box (it used to come apart into Lachryma only). Film is now a thing too: a roll is 24 exposures, and the next is loaded from the box.


**The Tithe** returned 227% of what it took before R38 and returns 78% after, with its pity and its dupes counted. The curio is the rest of the prize.

## Why it changed in R38

- **The treasury.** The Weir's five chests shut again every 30 seconds. Standing at them paid about 95,000 cubes an hour, more than everything else in the game together. They now shut again after 4 minutes (common) up to 2 h 40 min (prismatic). DEBUG keeps the half-minute, so a ceremony can be watched again and again (`ECON.treasury`).
- **The Tithe was a faucet dressed as a drain.** Its odds alone pay back about 22 a pull. The pity counters (a rare in every 10, an epic in every 40, a prismatic in every 100) and the dupe values push that to about 43. It now costs 48, and dupes pay 4 / 12 / 30 / 80 / 240 (they were 12 / 35 / 100 / 280 / 900).
- **Condensing.** One SS card paid 1,200 cubes. A card is a collection first and money last, so the top is cut to about a quarter (`ECON.condense`).
- **Crystals.** A full round of the formations paid nearly three times the aim. Base 8 → 3, per size 10 → 6.
- **The Lockheart's CUBES.** 18 → 12 per unit of power. It is a gamble on Lachryma, not a mint.

## The livelihoods (ruled with the owner, 2026-10-04; most are not built yet)

A **livelihood** is a way of earning. **One Courier, one purse, one ledger, the same seven tools in every layer** (`docs/DESIGN.md`, section
11). Six rules hold every livelihood:

1. It trains the skill of the tool it rides on, and it **pays by the quality of play, not the time spent**: a clean strike pays more
   than a sloppy one. Nothing can be AFK'd.
2. The livelihoods **pay in different kinds**: cubes, materials, Figments, Cogitomaps and cosmetics. Most of these cannot be bought with
   cubes, so no single best "cubes an hour" swallows the rest (OSRS's money-making wiki is the warning).
3. **Each island wants different things.** Every Island of Ego has its own demand: for kinds of material, for the classes of Figment,
   for particular Wells. So it pays to hop to the island whose Wells or Figments are worth most right now. Hauling is the glue: it turns
   every other livelihood's yield into demand somewhere else (Sid Meier's Pirates!, EVE's regional markets). The Emocean leg is the risk:
   cargo can be lost.
4. **Gambling is never a livelihood.** The Tithe and the Lockheart's casting stay below a return of 1, always.
5. **No needless grind: a 1-in-N drop comes within N tries.** Every rare drop is drawn from **a deck of N** (a shuffle bag), so the
   item is certain by the Nth try and comes in about N/2 on average. Two ways were weighed. A deck of 100 for a "1 in 100" item: certain
   by 100, mean 50.5. Plain 1% odds with a hard pity at 100: certain by 100, mean 63. The deck is chosen: it is fair from the first
   draw, it suits a game of cards, and it is OSRS's "dry streak" made impossible. **The number published is the guarantee**, N. It
   applies to every chance in the game that hands over an item (chests' curios, a Figment's drops, a fish's rarity, a crystal's
   Possibilikey).
6. **Mastery pays a dividend.** Complete everything the ledger holds for an encounter (a boss's achievements and collection slots, all
   of them) and it becomes **passive income**: its drops come in on their own, at less than playing it by hand. It accrues up to a cap,
   so checking in is rewarded and leaving it for a month is not. Prior art: OSRS's Kingdom of Miscellania (a quest's reward that pays
   while you are away, up to a cap), Monster Hunter's Argosy and Meowcenaries, Melvor Idle's mastery. Completionism is long-term gain, not
   just a green log. (This is the one exception to rule 1: the dividend is paid for play already done well.)
   **The numbers** (`ECON.dividend`, simulated by `node scripts/economy.mjs`): a mastered encounter pays 5% of what farming it by hand pays
   an hour, and fills in 8 hours. It pays only from one of the Shrine Garden's **3 slots**, so choosing which mastered encounters to work
   is part of the game. For a player of two hours a day with every slot full, that is about 0.6× the aim on top of their play. Without
   slots, every green log would be a faucet for good: 20 mastered encounters would pay 4× the aim, more than playing. The slots are the
   cap, and a later Garden upgrade is the way to raise it, as a sink.

| Livelihood | Tool, and the skill it trains | Pays | Status |
|---|---|---|---|
| Mining by ear | Dreamvane: relative pitch | cubes, crystal shards, Possibilikeys | live |
| Angling | Sondelass: timing, the line's tension | fish (sold) | live |
| Photography | Veritome: reading behaviour, patience | cards, bestiary facts | live |
| Haggling | (the counter) | a better price | live |
| Lockheart conversion | Lockheart: odds and yield | cubes from baubles; the keys set the risk | ruled |
| Combat | every tool | materials (broad kinds), for Soul Alchemy | ruled |
| Resolving Wells | every tool | the Well's rewards | ruled |
| Cartography | Dreamvane and Veritome: spatial mapping | Cogitomaps (below) | ruled |
| Caster shell crafting | Psygun | shells, from materials | ruled |
| Hauling between islands | the Emocean leg | the price gap between islands | ruled |
| Commissions | any | by Figment class (Guppy, Barracuda, Marlin, Whale, Leviathan), streaks (OSRS Slayer, FFXIV leves) | ruled |
| Ranching Figments | Lockheart (summoning) | caught Figments working the Shrine Garden (Palworld) | ruled |
| Busking | Crucibelle: tempo, melody | tips by how true the playing is; the rhythm mode below | ruled |
| Throwing pots | Soul Brush: shapes; the kiln: colour | pots, sold to the folk | ruled |
| Foraging and the garden | (the Shrine Garden) | fodder materials on timers (OSRS herb runs) | ruled |

Cut: salvage (the deep Emocean leaves no wreckage), and spell scrolls (a caster shell is a spell, and the Lockheart's casting coffins fill
the rest of that niche).

**Cogitomaps.** A Well is a Lachryma distortion, and it changes over time. A Cogitomap is a map of one Well as it was when it was charted,
so it is **a ticket to a seeded run of that Well**: the same layout, the same rewards. The Courier charts it, and **Spellscription**
copies a high-quality Cogitomap. Cogitomaps can be sold, traded, and hauled to the island that wants that Well.

**Materials** come in broad kinds, so nobody hunts one item by name. Within a kind each material has a hue and a saturation and **a path**:
pressed at the spirit press, it moves the Courier's colour along a winding, nonlinear route, not a straight hue shift (Potion Craft's
map). Soul Alchemy is navigation: choosing and ordering materials to reach a colour.

**The rhythm mode (proposed with Wanda):** the soundtrack as a StepMania, played on the Crucibelle's ten colour-coded notes at a stage.
Busking pays by its score. The charts could be drawn from the music's own note grid (`src/music/`) rather than authored by hand.

## Measuring it

- **F3** (the diagnostics panel) has an `econ` line: cubes an hour in and out this session, the aim, the three biggest faucets and the two biggest drains. F4's copied report has the same line.
- It reads the ledger only: `cube.spill.<from>` for everything that came out of something, `cube.src.condense`, and `cube.use.<why>` for every spend. A new faucet calls `cubes.burst(..., { from })` or `cubes.earn(n, why)`, and a new drain calls `cubes.spend(n, why)`. Nothing else is needed for it to show.
- `/grant [n]` (DEBUG only) adds n cubes to their purse for testing a shop or the Tithe. It is listed apart from income.
- **When the panel and the simulator disagree**, fix the simulator's `PLAY` rates first (they are guesses), then the table.

## Prior art

- **Dormans and Adams, *Machinations*.** Sources, drains and converters, and the feedback loops between them, tuned on a diagram before the game is played.
- **OSRS.** Gold sinks against inflation (the GE tax, construction, the item sinks), and the players' own money-making guide (activities by gp/h). The profile table above is that guide, kept by us.
- **EVE Online's monthly economic report.** Faucets and sinks by source. The F3 econ line is a one-line version of it.
- **FFXIV.** Housing and glamour as the sinks a player chooses, which is where the Shrine Garden and the glazes come from.
