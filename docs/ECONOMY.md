# The economy

**Cubes** (Lachryma condensed) are the only currency. Every number lives in `src/progress/econ/table.js` (`ECON`): change it there only.

## The unit: a minute of play

`ECON.perMinute = 8`: ordinary play earns about 8 cubes a minute of play, 480 an hour of play. Every price is named in minutes
(`minutes(n)`, `src/progress/econ/economy.js`): a Tithe pull 6 minutes (48 cubes), a lure 5, a twin key 10. **No activity pays more
than about 1.5x the aim**, except luck (a prismatic chest is a windfall).

## The map

- **Faucets**: slip jelly bursts and zandatsu cores (`ECON.jelly`), crystals (`ECON.crystal`), chests (`ECON.chest`), a curio
  already held (`ECON.dupe`), condensing a spare card (`ECON.condense`), selling to the folk (`ECON.fish`, `.curio`), the Lockheart's
  CUBES (`ECON.lockheart`). `/grant` (DEBUG) is not income.
- **Drains**: the Tithe (`ECON.tithe.cost`), the shops (`ECON.goods`), the kiln (firing, mending, bought looks), the Spirit Garden
  (the long sink that never fills: OSRS's Construction, FFXIV's housing).
- **Converters** (Machinations): the Tithe and the Lockheart turn cubes or Lachryma into chances; condensing turns cards into cubes.

## What each profile earns (`node scripts/economy.mjs`, from its `PLAY` rates)

| profile | cubes an hour of play | x aim |
|---|---:|---:|
| fighter (jellies, zandatsu) | 608 | 1.27 |
| miner (18 formations, tuned by ear) | 602 | 1.25 |
| photographer (spare cards condensed; no film: the Veritome is digital) | 430 | 0.90 |
| angler (fish sold to Old Grog) | 475 | 0.99 |
| treasury camper (the Weir's five plinths) | 586 | 1.22 |

**The miner** (`crystaltuning.js`): plain strikes pay dense 0.6, fragile 0.5 (`ECON.crystal.kind`); the sweet spot dense x2, fragile
x6 (`.sweet`), assumed found on 40% of dense, 15% of fragile; never listening earns about 400. 1.25x since R57 (it was 1.74x; measured again 2026-10-08).

**The Tithe** returns 78% of what it takes, pity and dupes counted (dupes pay 4 / 12 / 30 / 80 / 240 by tier); the curio is the rest
of the prize. **The treasury** plinths shut again for 4 real minutes (common) up to 2 h 40 real minutes (prismatic); DEBUG keeps 30
real seconds (`ECON.treasury`). **Condensing** an SS card is cut to about a quarter of its old 1,200: a card is a collection first.

## The shops (`src/progress/shop/`): selling to the folk, not condensing, is the way to turn things into cubes

- **Raku's treasury** sells Possibilikeys and coffins at a 45% markup and haggles; buys curios (`ECON.curio`, a little over a spare
  card's condense value), keys and coffins at half worth.
- **Old Grog's pier** sells lures at worth; buys fish (`ECON.fish` by tier) and lures at half.
- **Prices move** (`ECON.shop`, after OSRS): each unit short of stock is 10% dearer; each unit already bought takes 7% off, down to a
  quarter of worth; every 90 real seconds each shelf and glut moves one unit back.
- **The haggle** (`src/progress/shop/haggle.js`): Raku never goes below worth plus 2%. Lowballing sulks him into list; steady fair
  offers, flattery or walking away while he is pleased end 18-20% under list.

## The worth of a look (glazes, stones, hair, skin: the glamour sink)

The kiln is the biggest *chosen* sink (the owner hunts glamour: FFXIV, GW2). Principles (ruled in outline by the owner, 2026-10-04):

1. **Price follows desirability**, never the cost to make.
2. **Desirability is four axes, 0 to 2 each**: rarity in fiction and history; how distinct it looks (a shader beats a flat colour);
   the extremes (purest white, deepest black, iridescent); identity (Lachryma's sheen, the Prince's clay).
3. **The score sets the prestige**, on the folk's clay ladder:

   | score | prestige | how got | price |
   |---|---|---|---|
   | 0-1 | Earthenware | from the start | 0 |
   | 2-3 | Stoneware | bought | 10 minutes of play (80 cubes) |
   | 4-5 | Porcelain | bought or earned | 25 minutes (200 cubes) |
   | 6 | the Court | bought or earned | 60 minutes (480 cubes) |
   | 7-8 | the Prince's own | **earned only** | none |

4. **About 2.5x a step**: value is felt in ratios (Weber and Fechner).
5. **No bought look costs more than an hour of play**: past that it is a goal, and goals are achievements.
6. **What is bought is never what is earned**; the top of every ladder is earned. The start is a palette, not a placeholder.
7. **Measured** by `glaze.fire.<id>`: a look worn far above its tier's average climbs a tier next build. **Looks only**: nothing at
   the kiln changes a number in play.

**The placement** (corrected by Espada from the canon, `docs/LORE.md` "The worth of a look"; how a look is got is `got` in
`glazes.js`, separate from prestige):

| | Earthenware | Stoneware | Porcelain | the Court | the Prince's own |
|---|---|---|---|---|---|
| Body glazes | terracotta, bisque, shino | natural ash, kaki, salt, ame, majolica, nuka, tenmoku | cobalt, oribe, celadon, raku, copper lustre, hare's fur | jun, kinrande; earned: guan, Ru, oil spot | oxblood, yohen tenmoku, Lachryma black |
| Stones | the maker's, citrine | amethyst, onyx | emerald, sapphire, moonstone | ruby | diamond, opal |
| Hair | satin, raven, ashen | | copper, bisque to rose | | ink to gold, oil slick |
| Skin | Lachryma, moonlight | | ember, pearl | obsidian | porcelain, aurora |

All of it for sale comes to 3,120 cubes (about 6.5 hours of play). Strongest by eye (Calissa): yohen, kinrande, oil spot, guan,
hare's fur, Ru. Moonlight is the strongest free look on purpose: the hook to open the kiln.

## The livelihoods (ruled with the owner, 2026-10-04)

A **livelihood** is a way of earning; the same seven tools in every layer (DESIGN.md section 11). Code cites these rules by number:

1. **Pay by the quality of play, not the time spent**, training the tool's skill. Nothing can be AFK'd.
2. **Pay in different kinds** (cubes, materials, Figments, Cogitomaps, cosmetics), so no single "cubes an hour" swallows the rest.
3. **Each island wants different things**; hauling turns every yield into demand elsewhere (Sid Meier's Pirates!, EVE). The Emocean
   leg is the risk.
4. **Gambling is never a livelihood**: the Tithe and the Lockheart's casting stay below a return of 1.
5. **A 1-in-N drop comes within N tries**: every item-giving chance is a deck of N (`src/progress/econ/deck.js`), certain by the Nth,
   mean (N+1)/2. The number published is N.
6. **Mastery pays a dividend** (`ECON.dividend`, DESIGN.md section 16): a mastered encounter pays 5% of its hand rate an hour of play,
   filling for 8 game days, from one of 3 Spirit Garden slots. For two hours of play a real day with every slot full, about 0.6x the
   aim on top. The slots are the cap (20 mastered encounters unslotted would pay 4x); upgrades raise it, as a sink. The one exception
   to rule 1: it pays for play already done well.

Each rides a tool and trains its skill (DESIGN.md section 9).
- **Live**: mining by ear (Dreamvane: cubes, shards, Possibilikeys), angling (Sondelass: fish sold), photography (Veritome: cards,
  bestiary facts), haggling (a better price).
- **Ruled**: Lockheart conversion (cubes from baubles); combat (materials, for Soul Alchemy); resolving Wells; cartography
  (Cogitomaps); caster shell crafting (Psygun); hauling (the price gap); **commissions** (by Figment class: Guppy, Barracuda, Marlin,
  Whale, Leviathan; streaks); ranching Figments (Lockheart summoning, working the Spirit Garden); busking (Crucibelle: pay by score
  in a rhythm mode on the ten notes, charts from `src/music/`); throwing pots (Soul Brush and the kiln); foraging (the Spirit Garden's
  beds).
- Cut: salvage, spell scrolls.

**Simulated before built** (`ECON.busk`, `.commission`, `.pot`, `.well`, `.cogitomap`, `.island`, `.emocean`; pay rules in
`econ/livelihoods.js`, `econ/islands.js`). x aim at poor / middling / masterful play:

| livelihood | poor | middling | masterful |
|---|---:|---:|---:|
| busking | 0.42 | 0.75 | 1.27 |
| commissions (Barracuda) | 0.91 | 1.05 | 1.25 |
| throwing pots (stoneware) | 0.54 | 0.88 | 1.42 |
| Well runs | 0.72 | 1.21 | 1.31 |
| hauling (none passes 1.5x but this, where the risk is the profit) | -0.46 (cargo lost) | 0.95 | 1.51 |

**Crude** (`ECON.crude`, `.ships`, `.wellFill`; canon: `docs/LORE.md`, "Lachryma as crude"): five grades by aspect, mirth (cheap,
stable) to dread (richest, most volatile); only crude spills, by volatility and cargo size. The tanker holds 60, is slow, spills x0.35;
its best dread run pays about 1.38x and one failed stage makes a loss. The sloop carries errands. Island demand swings 0.75 to 1.35
(0.6 to 1.6 paid a perfect hauler 3x). A Well run draws 12% of its fill, yields what is left (never under 15%), refills 3% an hour of
play while its mind ruminates.

**The islands on the Law-Chaos line** (`ECON.islands`; the owner: a stable mind is safer and less lucrative, a chaotic one riskier and
richer). Well runs, x aim and share of runs lost, poor / middling / masterful:

| island | poor | middling | masterful | runs lost |
|---|---:|---:|---:|---:|
| Margarite (the King's: Law) | 0.61 | 0.63 | 0.71 | 9% / 6% / 5% |
| Anagami Island (Kaolin's: Creation) | 0.57 | 1.02 | 1.15 | 20% / 15% / 12% |
| Entropolis (the Queen's: Chaos) | 0.45 | 1.23 | 1.59 | 51% / 40% / 31% |

**The toxic symbiosis** (the owner, 2026-10-04): Entropolis prices crude low, Margarite high (`ECON.islands[i].crude`). A clean dread
tanker run between them (distance 6) pays -0.73x to 1.09x over a fortnight of game days: knowing *when* to sail is the skill.
**Bounties** (Letty Marque): a named stray brought to Margarite pays 2.5x a commission of its class, less Letty's 20% (`ECON.bounty`,
`bountyPay`): 48 cubes for a Guppy, 2,880 for a Leviathan.

**Cogitomaps**: a ticket to a seeded run of one Well as charted; Spellscription copies good ones. **Materials** come in broad kinds,
each with a hue, a saturation and a path at the spirit press (DESIGN.md section 16).

## Measuring it

- **F3**'s `econ` line (and F4's report): cubes an hour in and out, the aim, the top three faucets and top two drains. It reads only
  the ledger: `cube.spill.<from>`, `cube.src.condense`, `cube.use.<why>`. A new faucet calls `cubes.burst(..., { from })` or
  `cubes.earn(n, why)`; a new drain `cubes.spend(n, why)`.
- `/grant [n]` (DEBUG) is listed apart from income. When the panel and the simulator disagree, fix the simulator's `PLAY` rates
  first, then the table. Prior art: Machinations, OSRS's money-making guide, EVE's monthly economic report, FFXIV's chosen sinks.
