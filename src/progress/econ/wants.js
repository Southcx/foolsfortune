// ---------------------------------------------------------------------------------------
// WHAT EACH ISLAND WANTS, BEYOND CRUDE (docs/plans/SYSTEMS.md E5; GAPS.md G286): island demand knew only crude and Cogitomaps. An island now
// also wants some MATERIALS (by their Soul Alchemy kind), some CLASSES OF FIGMENT (the bounty board pays the class its island lacks) and
// some WELLS' Cogitomaps. The same wave and the same band as every demand (economy `island`: 0.75 to 1.35), centred by the island's
// character (ECON.islands[].wants): the Law end wants finery, art and the small Figments, the Chaos end eldritch, arcane and the great
// ones, the middle island mechanisms and the middle classes. So every yield, not crude alone, has a better market than the one it
// was found at (rule 3 of ECONOMY.md: hauling turns every yield into demand elsewhere), and a sailor who plans the cargo can read it.
//
// MODEL FIRST (the row's word): this is the pure model and its simulation (scripts/economy.mjs, "what each island wants"). The shop
// reads it for a material whose kind it knows (`demandKey(id, data)`, shops.js `want`); the bounty board and a Well's map price ask
// `bountyAt` and `mapAt` when those pages are built (a handoff to Petra's pier and Margarite's counter).
//
// WHAT IT CANNOT DO TO THE AIM: a want is a multiplier on a price that already answers to the aim (a material's worth, a bounty's
// `bountyPay`, a map's `cogitomapWorth`), within the band's 0.75 to 1.35; read against the band's middle (1.05) a bounty or a map
// pays 0.71 to 1.29 of its base, so the best island pays at most 29% over, the worst 29% under: no new faucet, a better place to
// stand. The sim shows what the best cargo of each kind nets over the fuel, against the crude run (the reference hauler).
//
// Prior art: Sid Meier's Pirates! and EVE (each port wants other goods, so every cargo has a better port), Sunless Sea's port
// reports (what a harbour pays for), Monster Hunter's guild boards (which hunt is posted where).
//
//   materialKey(kind) figmentKey(cls) wellKey(id) -> the demand key   materialPrice(worth, island, kind, day, sold) -> cubes
//   bountyAt(island, cls, day) -> cubes   mapAt(worth, island, well, day, sold) -> cubes   mid() -> the band's middle
//   bestMarket(key, day) -> { island, mult, worst, spread }   cargoRun({ key, worth, units, from, to, day }) -> cubes (net of the sloop's fuel)
// ---------------------------------------------------------------------------------------
import { ECON } from './table.js';
import { demand, fuel, haulProfit } from './islands.js';
import { bountyPay } from './livelihoods.js';

export const materialKey = (kind) => `material:${kind}`;
export const figmentKey = (cls) => `figment:${cls}`;
export const wellKey = (id) => `well:${id}`;
/** The band's middle: a want is read against it so that an island that is neither keen nor cold pays its base. */
export const mid = () => (ECON.island.lo + ECON.island.hi) / 2;

/** What `island` pays for a material of `kind` worth `worth` on `day` after `sold` units glutted it. */
export const materialPrice = (worth, island, kind, day = 0, sold = 0) => Math.round(worth * demand(island, materialKey(kind), day, sold) / mid());
/** The King's marque bounty on a stray of class `cls` as `island`'s board posts it. */
export const bountyAt = (island, cls, day = 0) => Math.round(bountyPay(cls) * demand(island, figmentKey(cls), day) / mid());
/** What `island`'s Purser pays for a Cogitomap worth `worth` of the Well `well`. */
export const mapAt = (worth, island, well, day = 0, sold = 0) => Math.round(worth * demand(island, wellKey(well), day, sold));

/** The island that pays most for a key on `day`, with the worst and the spread between (the cargo's reason). */
export function bestMarket(key, day = 0) {
  const rows = Object.keys(ECON.islands).map((island) => ({ island, mult: demand(island, key, day) }));
  rows.sort((a, b) => b.mult - a.mult);
  return { island: rows[0].island, mult: rows[0].mult, worst: rows[rows.length - 1].island, spread: rows[0].mult - rows[rows.length - 1].mult };
}

/** A cargo of `units` things worth `worth` each, of the demand key `key`, bought at `from` and sold at `to` on `day`, the sloop's
 *  fuel paid for the leg (ECON.emocean distance 4 between neighbours, 8 across). Bought at the seller's price. */
export function cargoRun({ key, worth, units, from, to, day = 0, distance = 4 }) {
  return haulProfit({ buy: demand(from, key, day), sell: demand(to, key, day), units, worth, distance });
}
