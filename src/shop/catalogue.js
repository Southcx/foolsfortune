// ---------------------------------------------------------------------------------------
// THE CATALOGUE: what each of the folk sells and buys, and what a thing is worth. Data only (no three.js, no DOM): the shops, the
// haggle, the Codex and the simulator all read it. A price is the economy table's (econ/table.js): goods are named in minutes of play
// and turned into cubes here, a fish is worth what its tier says, a curio a little over its card.
//
// A shop is a keeper (one of the clay folk: npc/people.js), the goods on its shelf with how many it keeps (its STOCK), the kinds of
// thing it will buy, and its manner: Raku marks everything up and HAGGLES (shop/haggle.js), Old Grog asks what a thing is worth and
// pays fair for fish. Saggar's kiln and Pip's oddments come next round (docs/PLAN.md).
//
// Prior art: Old School RuneScape's shops (a stock per item, a price that climbs as the shelf empties and falls as you flood it, a
// restock over time, and a shop that buys only its own trade at full value and anything else at a cut), Recettear and Moonlighter
// (a price is a conversation with a character), and Animal Crossing's Nook's Cranny (a shop with a temper and a daily turnover).
//
//   SHOPS[id] = { id, keeper, name, sells: { itemId: stock }, buys: [kind], trade: [kind], markup, haggle }
//   worthOf(itemId) -> cubes (what the thing is worth: the base of every price)
// ---------------------------------------------------------------------------------------
import { ECON } from '../econ/table.js';
import { ITEMS, itemOf } from '../pneuka/items.js';
import { LURES } from '../angling/lures.js';

const M = (n) => Math.max(1, Math.round(n * ECON.perMinute));

/** What a thing is worth, in cubes: the base its prices move from. */
export function worthOf(id) {
  const it = itemOf(id);
  if (!it) return 0;
  if (it.kind === 'fish') return ECON.fish[it.tier] || 0;
  if (it.kind === 'curio') return ECON.curio[it.tier] || 0;
  if (it.kind === 'lure') return M(ECON.goods.lure);
  if (ECON.goods[id] != null) return M(ECON.goods[id]);
  if (it.kind === 'key') return M(6);
  if (it.kind === 'heart') return M(20);
  if (it.kind === 'instrument') return M(30);
  if (it.kind === 'tool') return 0; // (a psychic tool is not for sale, and no one will buy one)
  return M(1);
}

export const SHOPS = {
  raku: {
    id: 'raku', keeper: 'raku', name: "RAKU'S TREASURY",
    blurb: 'Possibilikeys and coffins for the Lockheart. Buys curios. Everything is negotiable, in his favour.',
    sells: { 'key.brass': 6, 'key.invert': 2, 'key.even': 2, 'key.loaded': 1, 'key.twin': 1, 'key.wide': 1, 'key.echo': 1, 'heart.gambler': 1, 'heart.shepherd': 1 },
    trade: ['curio'], buys: ['curio', 'key', 'heart'],
    markup: ECON.haggle.list, haggle: true,
  },
  grog: {
    id: 'grog', keeper: 'grog', name: "OLD GROG'S PIER",
    blurb: 'Film for the Veritome, and lures, if you have lost yours. Buys fish, and pays fair.',
    sells: { 'mat.film': 8, ...Object.fromEntries(LURES.map((L) => [L.id, 1])) },
    trade: ['fish'], buys: ['fish', 'lure'],
    markup: 1, haggle: false,
  },
};

/** Every item a shop has on its shelf, with its base stock, in the order the shelf shows them. */
export const shelfOf = (shop) => Object.entries(SHOPS[shop]?.sells || {}).filter(([id]) => ITEMS[id]);
