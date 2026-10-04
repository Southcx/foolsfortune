// ---------------------------------------------------------------------------------------
// THE ECONOMY'S NUMBERS: every faucet that lets cubes into the world and every drain that takes them out, in one table, so the
// economy is tuned in one place (docs/ECONOMY.md has the map and the reasons) and measured against the same table: the F3 panel's
// income line (progress/econ/economy.js) and the simulator (scripts/economy.mjs) read it too. Pure data: it imports nothing, so a script in Node
// can read it as the game does.
//
// The unit of value is the MINUTE OF PLAY: `perMinute` is what ordinary play (fighting, mining, fishing, photographing, some of each)
// should earn, and a price is named in minutes (`minutes(15)` is fifteen minutes' play). The 2026-10-02 rebalance (R38): before it,
// the Weir's five treasury chests shut again every half-minute (about 95,000 cubes an hour for standing at them), the one drain (the
// Tithe) paid back more than twice what it took once its pity and dupes were counted, and one SS card condensed for 1,200.
//
// Prior art: Dormans and Adams' Machinations (sources, drains, converters, traders and the loops between them, tuned on a diagram
// before in the game), OSRS's gold sinks and the inflation they answer, and the economy tables of every MMO that keeps its numbers in
// one sheet (EVE's, FFXIV's) so a designer can see the whole flow at once.
// ---------------------------------------------------------------------------------------
export const ECON = {
  /** What ordinary play should earn, a minute (the anchor for every price: progress/econ/economy.js minutes()). */
  perMinute: 8,

  // ---- the faucets (cubes into the world)
  /** A slip jelly burst by them (plus whatever it had swallowed of theirs); a zandatsu's core. */
  jelly: { burst: 6, core: 3 },
  /** A crystal formation broken open: base + size x perSize (twice if the fork rang in it). */
  crystal: { base: 3, perSize: 6, // (was 8 + 10: a round of the dune sea paid three times the aim)
    // tuned by ear (world/dunes/crystaltuning.js): a formation broken open by plain strikes pays this share by its nature; found at its sweet
    // spot, it pays this many times over (a dense formation forgives, a fragile one rewards the ear)
    kind: { dense: 0.6, fragile: 0.5 }, sweet: { dense: 2, fragile: 6 } },
  /** Condensing a spare card, by its rank (was 1,200 for SS: a card is a collection first, money last). */
  condense: { SS: 320, S: 180, A: 100, B: 60, C: 40, D: 28, E: 20, F: 14, G: 9, H: 5 },
  /** A curio a chest gave that they already had, condensed, by chest tier (common .. prismatic; was 12 / 35 / 100 / 280 / 900). */
  dupe: [4, 12, 30, 80, 240],
  /** What a chest holds, by tier (common .. prismatic): a range, drawn once when it is opened (treasure.js cubesIn). */
  chest: [[4, 9], [14, 26], [40, 70], [120, 200], [400, 700]],
  /** Whether a chest of each tier (common .. prismatic) holds a curio is a DECK of this size (econ/deck.js: certain within N chests of
   *  that tier, about (N+1)/2 on average), and which of its tier's four is a deck of the four (each before any twice). Set so the five
   *  sets complete in the order of their rarity: through the Tithe, about 20 / 39 / 84 / 153 / 308 pulls (scripts/economy.mjs). (Was a
   *  plain chance, 6 / 16 / 40 / 80 / 100%, and an 85% lean to the curios not yet held: the commons took longer than the rares.) */
  curioDeck: [5, 4, 5, 2, 1],
  /** How long a chest on the treasury's plinths (the Weir) takes to shut again once opened, by tier, in seconds; DEBUG keeps the old
   *  half-minute so a ceremony can be watched again and again. (Was 30 s for all five: a prismatic every half-minute, ~1,600 cubes a
   *  minute for standing still, more than everything else in the game together.) */
  treasury: { respawn: [240, 900, 2400, 4800, 9600], debug: 30 },
  /** A Lockheart's CUBES outcome, per unit of power (1 full .. 2 brimming). */
  lockheart: { cubes: 12,
    // once the Possibilikeys have bent a table, no jackpot (an outcome of rank 4: the slip nuke) may be likelier than this (lockheart/
    // table.js oddsOf). Without it the INVERTED key turned the Gambler's 99 to 1 into 1 to 99: a jackpot bought with one key.
    jackpotCap: 0.25 },

  /** A landed fish, sold to Old Grog, by its tier (0 none .. 5 the legend): at about one catch every two and a half minutes, about
   *  the aim (a fish is not condensed: a shop buys it, so an angler's living is a walk to the pier). */
  fish: [0, 10, 18, 40, 90, 400],
  /** A curio sold to Raku, by its tier: a little over what its spare card condenses for (selling to the folk is the better way). */
  curio: [16, 32, 70, 120, 220],

  // ---- the drains (cubes out)
  /** The Tithe: a sealed chest for six minutes' play (was 25, and with its pity and its dupes it paid back 229% of what it took: a
   *  faucet dressed as a drain). Now about three quarters comes back in cubes, and the curio is the prize (scripts/economy.mjs). */
  tithe: { cost: 48 },
  /** A firing at the kiln (a new look fired onto the vessel: courier/vessel/vessel.js), in minutes of play. */
  firing: 2,
  /** Refiring the vessel's cracks at the kiln (R40), in minutes of play for a vessel at the edge of shattering (less for fewer cracks). */
  refire: 1.5,
  /** What the folk ask, in minutes of play (progress/shop/catalogue.js turns them into cubes); see docs/ECONOMY.md. */
  goods: {
    'mat.film': 1.5,                                           // a roll of film: 24 exposures
    lure: 5,                                                   // a made lure, to replace one sold or lost
    'key.brass': 2, 'key.invert': 6, 'key.even': 6, 'key.loaded': 8, 'key.twin': 10, 'key.wide': 8, 'key.echo': 12,
    'heart.gambler': 20, 'heart.shepherd': 20,
  },
  /** What a look costs at the kiln (a glaze, a stone, a hair, a skin), by its PRESTIGE: the folk's own clay ladder (docs/LORE.md), from
   *  Earthenware (yours from the start, free) through Stoneware and Porcelain to the Court, each about 2.5 times the last (value is felt
   *  in ratios, not differences: Weber and Fechner). No bought look costs more than an hour's play: past that it is not a purchase but a
   *  goal, so THE PRINCE'S OWN, the top of every ladder, is never sold, only earned. docs/ECONOMY.md, "The worth of a look". */
  looks: { minutes: { earthenware: 0, stoneware: 10, porcelain: 25, court: 60 }, sold: ['stoneware', 'porcelain', 'court'] },
  /** How a shop's prices move with its stock (OSRS): each one short of its stock dearer by `dear`, each extra one it has bought
   *  cheaper to sell by `glut` (never under `floor` of worth); one unit drifts back toward the base every `restock` seconds. A shop
   *  pays `buys` of an item's worth when it is not its trade (Raku will take a fish, grudgingly). */
  shop: { dear: 0.1, glut: 0.07, floor: 0.25, restock: 90, buys: 0.5 },
  /** The haggle (progress/shop/haggle.js): Raku's list price over the worth, and the least he will take over it (he never sells at a loss). */
  haggle: { list: 1.45, floor: 1.02 },

  // ---- the livelihoods still to be built (docs/ECONOMY.md, "The livelihoods"; econ/livelihoods.js, econ/islands.js; simulated first)
  /** BUSKING (the Crucibelle's rhythm mode, Wanda's): a song pays its length in minutes of play times the score's weight: steep, so
   *  playing well pays (accuracy 1: 1.5x the aim; 0.7: about 0.8x; 0.4: 0.4x). The same song played again within the hour tires the
   *  audience (`tire` a repeat), so a set pays more than a loop. */
  busk: { floor: 0.3, ceil: 1.5, power: 2, tire: 0.7 },
  /** COMMISSIONS by Figment class (Guppy .. Leviathan): minutes of play each pays, about the time an ordinary hunter takes, so a better
   *  hunter, finishing sooner, earns more an hour; every `streakEvery`th in a row pays `streakMult` times (OSRS Slayer's points). Skipping
   *  one breaks the streak. */
  commission: { minutes: [3, 8, 20, 60, 180], streakEvery: 10, streakMult: 3 },
  /** THROWING POTS: a pot pays `minutes` of play times its shape's accuracy weighed steeply (floor .. ceil, as the domains' SKILL), plus
   *  its glaze's prestige in minutes (looks: a pot glazed in porcelain sells for more). */
  pot: { minutes: 2.5, floor: 0.25, ceil: 1.5, power: 2, glaze: { earthenware: 0, stoneware: 0.5, porcelain: 1.5, court: 3 } },
  /** A WELL (a dungeon): each floor down pays `perFloor` minutes of play, `deeper` times more than the floor above; an FOE beaten pays
   *  `foe` floors' worth. */
  well: { perFloor: 2.5, deeper: 1.25, foe: 2 },
  /** A COGITOMAP: a ticket to a seeded run of a Well. Worth `share` of what that run pays, by how much of the Well it charts; the Well
   *  drifts, so the map halves in worth every `halfLifeH` hours of play (old maps are cheap, fresh ones are worth hauling). */
  cogitomap: { share: 0.3, halfLifeH: 20 },
  /** ISLAND DEMAND: each island wants each kind of thing at a multiplier that drifts on a slow clock (`periodDays`) between `lo` and
   *  `hi`; every unit sold there gluts it by `glut`, recovering one unit a `recoverMin` minutes (as Grog's prices do). */
  island: { lo: 0.6, hi: 1.6, periodDays: [3, 7], glut: 0.03, recoverMin: 6 },
  /** THE EMOCEAN: a hop between islands burns `fuelMin` minutes of play in cubes a unit of distance (a drain: the travel layer spends
   *  what the others earn); a stage failed loses `lose` of the cargo. */
  emocean: { fuelMin: 1.5, lose: 0.25 },

  // ---- the mastery dividend (docs/ECONOMY.md, rule 6; not built yet: the simulator's numbers to aim at)
  /** An encounter whose ledger is complete pays on its own: `share` of what farming it by hand pays an hour, accruing for at most
   *  `capHours` (a night, or a working day) before it waits to be collected, in one of the Shrine Garden's `slots` (which mastered
   *  encounters to work is a choice, as in OSRS's Miscellania; without slots every green log would add a faucet for good). Tuned so a
   *  player of two hours a day with every slot full gets about 0.6 x the aim on top of their play (scripts/economy.mjs). */
  dividend: { share: 0.05, capHours: 8, slots: 3 },
};
