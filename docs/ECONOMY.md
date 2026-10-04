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

## The worth of a look (glazes, stones, hair, skin: the glamour sink)

The kiln is the game's glamour, and the owner hunts glamour for hours (FFXIV, GW2), so it is the biggest *chosen* sink: what a look costs
says what it is worth. The principles (ruled in outline by the owner, 2026-10-04; the placements below are provisional until Espada and
Calissa have weighed in):

1. **Price follows desirability, never what a look "costs to make".** A look is a sink, not a product.
2. **Desirability is scored on four axes, 0 to 2 each:**
   - *rarity in the fiction and in history*: Ru ware, fewer than a hundred pieces; yohen tenmoku, three bowls; oxblood, the hardest red;
   - *how distinct it looks*: a special shader (metal, glow, a gem's fire, opal's play, a gradient) beats a flat colour;
   - *the extremes*: the purest white, the deepest black, the most saturated, the iridescent (FFXIV's jet black and pure white dyes are
     its most prized);
   - *identity*: Lachryma's own sheen, the Prince's own clay.
3. **The score sets the prestige, on the folk's own clay ladder:**

   | score | prestige | how it is got | price |
   |---|---|---|---|
   | 0–1 | Earthenware | yours from the start, free | 0 |
   | 2–3 | Stoneware | bought | 10 minutes of play (80 cubes) |
   | 4–5 | Porcelain | bought, or earned | 25 minutes (200 cubes) |
   | 6 | the Court | bought, or earned | 60 minutes (480 cubes) |
   | 7–8 | the Prince's own | **earned only**, never sold | none |

4. **The ratio is about 2.5× a step.** Value is felt in ratios, not differences (Weber and Fechner), so a step up must feel like one.
5. **No bought look costs more than an hour's play.** Past that it is not a purchase but a goal, and goals are achievements.
6. **What is bought is never what is earned**, and the top of every ladder is earned. A medal glaze is worth more than any glaze sold,
   because nobody could buy it.
7. **The start is a palette, not a placeholder.** A new Courier can already look like themselves, from humble earthenware.
8. **Measured**: the ledger counts every firing by look (`glaze.fire.<id>`), which shows what players actually want. A look worn far
   above its tier's average is under-priced and climbs a tier the next build; one no one buys is misplaced.
9. **Looks only.** Nothing at the kiln changes a number in play.

**The placement** (scores from the four axes, corrected by Espada from the canon: `docs/LORE.md` section 8, "The worth of a look").
*The folk rank a glaze as they rank each other*: what a tier wears is common to it, and what the tier above wears is aspired to.

Prestige sets the price of what is sold; how a look is got (from the start, earned, or bought: `got` in `glazes.js`) is separate. An
achievement glaze has a prestige too, which says how much it is worth having.
- **Body glazes.**
  - Earthenware: terracotta, bisque, shino.
  - Stoneware: natural ash, kaki, salt, ame, majolica, nuka, tenmoku (Old Grog's working tea-bowl glaze). Majolica stays here: it is the purest white (Calissa), but tin glaze
    on earthenware is never grand (Espada), and prestige is the canon's call.
  - Porcelain: cobalt, oribe, celadon (Saggar's head-maid mark: what the stoneware folk envy), raku, copper lustre (Raku's, worn to look
    grander), hare's fur.
  - The Court: jun, kinrande. Guan ("official") and Ru (an emperor's court) are the Court's own, so they are **earned only**: a Court
    glaze is given, never bought.
  - The Court, earned: oil spot (a step below yohen once its silver blooms render; Calissa).
  - The Prince's own: oxblood, yohen tenmoku (the kiln's accident, the experimenter's prize), Lachryma black (no folk could bear it;
    only a Courier wears it).
- **Stones.**
  - Earthenware: the maker's stones, citrine.
  - Stoneware: amethyst, onyx (the deepest black: an extreme, not free).
  - Porcelain: emerald, sapphire, moonstone (its own glow).
  - The Court: ruby.
  - The Prince's own: diamond, opal.
- **Hair.**
  - Earthenware: satin, raven, ashen.
  - Porcelain: copper, bisque to rose.
  - The Prince's own: ink to gold, oil slick.
- **Skin.**
  - Earthenware: Lachryma (a Courier's own nature), moonlight.
  - Porcelain: ember, pearl.
  - The Court: obsidian.
  - The Prince's own: porcelain (Kaolin, the Prince's own clay: wearing it is wearing him) and aurora.

What is for sale today, at these prices:

| what | cubes |
|---|---:|
| five stoneware glazes and two stoneware stones (80 each) | 560 |
| a porcelain glaze, three stones, two hairs and two skins (200 each) | 1,600 |
| a Court stone and a Court skin (480 each) | 960 |
| **all of it** | **3,120 (about 6.5 hours of play)** |

The rest are earned. As Calissa adds rows, the sink grows with them.

**What the eye says** (Calissa): the shader-driven looks read most striking at 480 lines (opal's play, oil-slick hair, aurora, diamond's
fire, Lachryma black's film, the metal of kinrande and copper lustre, moonstone's glow), and flat colours read weakest whatever their
history. The rarest glazes now draw their **kiln patterns** (Calissa, `claude/calissa-art-cups` 9462552): yohen's haloed stars, oil spot's
silver blooms, hare's fur's streaks, guan's two-size crackle, raku's and Ru's crackle, kinrande's gold leaf on red, and porcelain skin's
translucency. By eye, strongest first: yohen, kinrande, oil spot, guan, hare's fur, Ru. Ru is the quietest, rare by its story more than
its surface, and that is the reason it is earned, not sold. Moonlight's blue rim is the strongest free look on purpose: the hook that
makes a new Courier open the kiln.

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

**The numbers, simulated before anything is built** (`ECON.busk`, `.commission`, `.pot`, `.well`, `.cogitomap`, `.island`, `.emocean`;
the pay rules are `src/progress/econ/livelihoods.js` and `islands.js`). Cubes an hour at poor / middling / masterful play:

| livelihood | poor | middling | masterful |
|---|---:|---:|---:|
| busking | 0.42× | 0.75× | 1.27× |
| commissions (Barracuda) | 0.91× | 1.05× | 1.25× |
| throwing pots (stoneware) | 0.54× | 0.88× | 1.42× |
| Well runs | 0.72× | 1.21× | 1.31× |
| hauling | −0.46× (cargo lost) | 0.95× | 1.51× |

Each livelihood pays more the better it is played, and none passes 1.5× the aim except hauling at its best, where the risk is the profit.
A Cogitomap of a five-floor run is worth 79 cubes fresh, 39 after 20 hours, 10 after 60: the Well drifts, so maps are worth hauling
while they are fresh.

**Crude** (`ECON.crude`, `.ships`, `.wellFill`; the canon is Espada's, `docs/LORE.md`, "Lachryma as crude"):
- **Five grades.** Crude Lachryma comes graded by its aspect, from mirth (light, cheap, stable) to dread (the richest and the most
  volatile), and each island wants its own grade.
- **Only crude spills.** A failed stage with crude aboard spills with a chance set by the grade's volatility and the size of the cargo
  (cubes never spill).
- **The tanker** holds 60 units, is slow, and is double-hulled (its spills ×0.35).
  - Its best run (dread, bought at the narrowest demand and sold at the widest, nothing failed) pays about 1.38× the aim, and a failed
    stage turns a run into a loss.
  - The sloop cannot profit from crude: it carries errands.
  - The islands' demand swings between 0.75 and 1.35 (it was 0.6 to 1.6, which paid a perfect hauler 3×).
- **A Well is drawn down as it is run.** Each run draws 12% of its fill, its yield is what is left (never under 15%), and it refills 3%
  an hour while its mind ruminates. Drawn dry, the mind has healed.

**The islands on the Law–Chaos line** (`ECON.islands`; the canon is `docs/LORE.md`, "The King and the Queen"; the owner: a stable
mind is safer and less lucrative, a chaotic mind riskier and richer). Expected cubes an hour from a Well run, poor / middling /
masterful, and the share of runs lost:

| island | poor | middling | masterful | runs lost |
|---|---:|---:|---:|---:|
| Margarite (the King's: Law) | 0.61× | 0.63× | 0.71× | 9% / 6% / 5% |
| Anagami Island (Kaolin's: Creation) | 0.57× | 1.02× | 1.15× | 20% / 15% / 12% |
| Entropolis (the Queen's: Chaos) | 0.45× | 1.23× | 1.59× | 51% / 40% / 31% |

Law pays steadiness and Chaos pays mastery. Entropolis's best is the one place a livelihood passes 1.5× the aim, and only for a masterful
diver who still loses a third of their runs. Each island's Wells yield their own grades of crude (Margarite mirth and wonder, Entropolis
grief and dread) and its commissions ask their own classes of Figment (Margarite Guppies and Barracudas, Entropolis up to Whales).

**The toxic symbiosis** (the owner, 2026-10-04). Chaos digs crude up and Law buys it, and the hauler lives in between:
- **Each island prices crude at its own place in the demand band** (`ECON.islands[i].crude`): Entropolis low (it sells cheap),
  Margarite high (the King buys dear), Anagami in the middle, each swinging slowly about its place.
- **The crude route runs Entropolis to Margarite.** A clean tanker run of dread, at a distance of 6, pays −0.73× to 1.09× the aim over a
  fortnight: the two prices drift on their own clocks and the fuel eats a thin spread, so knowing *when* to sail is the skill.
- **Bounties are the other half** (Letty Marque, under the King's marque). A named stray, mostly bred in Entropolis, brought in for
  Margarite, pays 2.5× a commission of its class, less Letty's 20% (`ECON.bounty`; `bountyPay`): 48 cubes for a Guppy, 2,880 for a
  Leviathan.

The Queen's island breeds the strays and the riches, and the King's pays to have both brought in.

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
