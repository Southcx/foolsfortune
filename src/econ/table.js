// ---------------------------------------------------------------------------------------
// THE ECONOMY'S NUMBERS: every faucet that lets cubes into the world and every drain that takes them out, in one table, so the
// economy is tuned in one place (docs/ECONOMY.md has the map and the reasons) and measured against the same table: the F3 panel's
// income line (econ/economy.js) and the simulator (tools/economy.mjs) read it too. Pure data: it imports nothing, so a script in Node
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
  /** What ordinary play should earn, a minute (the anchor for every price: econ/economy.js minutes()). */
  perMinute: 8,

  // ---- the faucets (cubes into the world)
  /** A slip jelly burst by her (plus whatever it had swallowed of hers); a zandatsu's core. */
  jelly: { burst: 6, core: 3 },
  /** A crystal formation broken open: base + size x perSize (twice if the fork rang in it). */
  crystal: { base: 3, perSize: 6 }, // (was 8 + 10: a round of the dune sea paid three times the aim)
  /** Condensing a spare card, by its rank (was 1,200 for SS: a card is a collection first, money last). */
  condense: { SS: 320, S: 180, A: 100, B: 60, C: 40, D: 28, E: 20, F: 14, G: 9, H: 5 },
  /** A curio a chest gave that she already had, condensed, by chest tier (common .. prismatic; was 12 / 35 / 100 / 280 / 900). */
  dupe: [4, 12, 30, 80, 240],
  /** What a chest holds, by tier (common .. prismatic): a range, drawn once when it is opened (treasure.js cubesIn). */
  chest: [[4, 9], [14, 26], [40, 70], [120, 200], [400, 700]],
  /** How long a chest on the treasury's plinths (the Weir) takes to shut again once opened, by tier, in seconds; DEBUG keeps the old
   *  half-minute so a ceremony can be watched again and again. (Was 30 s for all five: a prismatic every half-minute, ~1,600 cubes a
   *  minute for standing still, more than everything else in the game together.) */
  treasury: { respawn: [240, 900, 2400, 4800, 9600], debug: 30 },
  /** A Lockheart's CUBES outcome, per unit of power (1 full .. 2 brimming). */
  lockheart: { cubes: 12 },

  /** A landed fish, sold to Old Grog, by its tier (0 none .. 5 the legend): at about one catch every two and a half minutes, about
   *  the aim (a fish is not condensed: a shop buys it, so an angler's living is a walk to the pier). */
  fish: [0, 10, 18, 40, 90, 400],
  /** A curio sold to Raku, by its tier: a little over what its spare card condenses for (selling to the folk is the better way). */
  curio: [16, 32, 70, 120, 220],

  // ---- the drains (cubes out)
  /** The Tithe: a sealed chest for six minutes' play (was 25, and with its pity and its dupes it paid back 229% of what it took: a
   *  faucet dressed as a drain). Now about three quarters comes back in cubes, and the curio is the prize (tools/economy.mjs). */
  tithe: { cost: 48 },
  /** What the folk ask, in minutes of play (shop/catalogue.js turns them into cubes); see docs/ECONOMY.md. */
  goods: {
    'mat.film': 1.5,                                           // a roll of film: 24 exposures
    lure: 5,                                                   // a made lure, to replace one sold or lost
    'key.brass': 2, 'key.invert': 6, 'key.even': 6, 'key.loaded': 8, 'key.twin': 10, 'key.wide': 8, 'key.echo': 12,
    'heart.gambler': 20, 'heart.shepherd': 20,
  },
  /** How a shop's prices move with its stock (OSRS): each one short of its stock dearer by `dear`, each extra one it has bought
   *  cheaper to sell by `glut` (never under `floor` of worth); one unit drifts back toward the base every `restock` seconds. A shop
   *  pays `buys` of an item's worth when it is not its trade (Raku will take a fish, grudgingly). */
  shop: { dear: 0.1, glut: 0.07, floor: 0.25, restock: 90, buys: 0.5 },
  /** The haggle (shop/haggle.js): Raku's list price over the worth, and the least he will take over it (he never sells at a loss). */
  haggle: { list: 1.45, floor: 1.02 },
};
