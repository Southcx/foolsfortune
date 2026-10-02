# The economy

Lachryma is everything. **Cubes** (Lachryma condensed) are the only currency. This page covers four things:

- where cubes come from and where they go;
- what each source should pay;
- how the numbers are measured;
- why they changed in R38.

The numbers live in one table, `src/econ/table.js` (`ECON`). Change them there and nowhere else.

## The unit: a minute of play

`ECON.perMinute = 8`. Ordinary play earns about 8 cubes a minute, or 480 an hour. That means fighting, mining, photographing, or some of each.

Every price is named in minutes: `minutes(n)` in `src/econ/economy.js` turns n minutes into cubes.

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
 a curio she has, again .. ECON.dupe          │      └─► the Shrine Garden (later: the long sink)
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

From `node tools/economy.mjs`, which uses the table and the assumed rates of play in its `PLAY` block:

| profile | before R38 | after R38 | × aim |
|---|---:|---:|---:|
| fighter (jellies, zandatsu) | 608 | 608 | 1.27 |
| miner (the dune sea's 18 crystal formations) | 1,389 | 694 | 1.45 |
| photographer (spare cards condensed) | 667 | 430 | 0.90 |
| angler (fish sold to Old Grog) | 0 | 475 | 0.99 |
| treasury camper (the Weir's five plinths) | 94,980 | 586 | 1.22 |

The photographer row is after film: a roll costs 12 cubes. It earns 430 an hour without film and 310 with it.

## The shops (R38c, `src/shop/`)

There are two counters, opened from the keeper's talk ("Let's trade."):

- **Raku's treasury** sells Possibilikeys and coffins at a 45% markup, and haggles. He buys curios (his trade, at `ECON.curio`, a little over what the curio's spare card condenses for), and keys and coffins at half their worth.
- **Old Grog's pier** sells film and lures at their worth, and buys fish (his trade: `ECON.fish` by tier) and lures at half.

How prices move (`ECON.shop`, after OSRS):

- Each unit a shelf is short of its stock makes it 10% dearer.
- Each unit a keeper has already bought takes 7% off what they pay, down to a quarter of the worth.
- Every 90 seconds, each shelf and each glut moves one unit back toward normal.

**The haggle** (`src/shop/haggle.js`): Raku asks his list price and never goes below his floor (the worth plus 2%). Simulated, the moves end like this:

- An offer at the low end of what is put to her sulks him into holding at list.
- Steady fair offers, flattery or walking away while he is pleased end about 18–20% under list.

**Selling to the folk replaces condensing** as the way to turn things into cubes. A landed fish is now a thing in the box (it used to come apart into Lachryma only). Film is now a thing too: a roll is 24 exposures, and the next is loaded from the box.


**The Tithe** returned 227% of what it took before R38 and returns 78% after, with its pity and its dupes counted. The curio is the rest of the prize.

## Why it changed in R38

- **The treasury.** The Weir's five chests shut again every 30 seconds. Standing at them paid about 95,000 cubes an hour, more than everything else in the game together. They now shut again after 4 minutes (common) up to 2 h 40 min (prismatic). DEBUG keeps the half-minute, so a ceremony can be watched again and again (`ECON.treasury`).
- **The Tithe was a faucet dressed as a drain.** Its odds alone pay back about 22 a pull. The pity counters (a rare in every 10, an epic in every 40, a prismatic in every 100) and the dupe values push that to about 43. It now costs 48, and dupes pay 4 / 12 / 30 / 80 / 240 (they were 12 / 35 / 100 / 280 / 900).
- **Condensing.** One SS card paid 1,200 cubes. A card is a collection first and money last, so the top is cut to about a quarter (`ECON.condense`).
- **Crystals.** A full round of the formations paid nearly three times the aim. Base 8 → 3, per size 10 → 6.
- **The Lockheart's CUBES.** 18 → 12 per unit of power. It is a gamble on Lachryma, not a mint.

## Measuring it

- **F3** (the diagnostics panel) has an `econ` line: cubes an hour in and out this session, the aim, the three biggest faucets and the two biggest drains. F4's copied report has the same line.
- It reads the ledger only: `cube.spill.<from>` for everything that came out of something, `cube.src.condense`, and `cube.use.<why>` for every spend. A new faucet calls `cubes.burst(..., { from })` or `cubes.earn(n, why)`, and a new drain calls `cubes.spend(n, why)`. Nothing else is needed for it to show.
- `/grant [n]` (DEBUG only) adds n cubes to her purse for testing a shop or the Tithe. It is listed apart from income.
- **When the panel and the simulator disagree**, fix the simulator's `PLAY` rates first (they are guesses), then the table.

## Prior art

- **Dormans and Adams, *Machinations*.** Sources, drains and converters, and the feedback loops between them, tuned on a diagram before the game is played.
- **OSRS.** Gold sinks against inflation (the GE tax, construction, the item sinks), and the players' own money-making guide (activities by gp/h). The profile table above is that guide, kept by us.
- **EVE Online's monthly economic report.** Faucets and sinks by source. The F3 econ line is a one-line version of it.
- **FFXIV.** Housing and glamour as the sinks a player chooses, which is where the Shrine Garden and the glazes come from.
