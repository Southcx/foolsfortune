// ---------------------------------------------------------------------------------------
// THE CATALOGUE: what each of the folk sells and buys, and what a thing is worth. Data only (no three.js, no DOM): the shops, the
// haggle, the Codex and the simulator all read it. A price is the economy table's (progress/econ/table.js): goods are named in minutes of play
// and turned into cubes here, a fish is worth what its tier says, a curio a little over its card.
//
// A shop is a keeper (one of the clay folk: npc/people.js), the goods on its shelf with how many it keeps (its STOCK), the kinds of
// thing it will buy, and its manner: Raku marks everything up and HAGGLES (progress/shop/haggle.js), Old Grog asks what a thing is worth and
// pays fair for fish, and Saggar sells glazes at the kiln (the counter is Petra's to wire). Pip's oddments come later.
//
// Prior art: Old School RuneScape's shops (a stock per item, a price that climbs as the shelf empties and falls as you flood it, a
// restock over time, and a shop that buys only its own trade at full value and anything else at a cut), Recettear and Moonlighter
// (a price is a conversation with a character), and Animal Crossing's Nook's Cranny (a shop with a temper and a daily turnover).
//
// A shop on an Island of Ego (`island`) prices by that island's DEMAND (progress/econ/islands.js: what the island wants, drifting by
// the day): Old Grog's pier on Anagami sells Anagami's crude, and the Purser on Margarite's dock buys crude, Cogitomaps and materials
// dear, as Law wants its minds charted (the slice: docs/plans/SLICE.md, E4). A thing that carries its own worth (a Cogitomap) is
// priced from its slot's `data`.
//
//   SHOPS[id] = { id, keeper, name, sells: { itemId: stock }, buys: [kind], trade: [kind], markup, haggle, island? }
//   worthOf(itemId, data?) -> cubes (what the thing is worth: the base of every price)    demandKey(itemId) -> the kind an island wants
//   glazePrice(prestige) -> cubes | null
// ---------------------------------------------------------------------------------------
import { ECON } from '../econ/table.js';
import { ITEMS, itemOf } from '../../pneuka/items.js';
import { LURES } from '../../tools/sondelass/angling/lures.js';
import { today } from '../../core/calendar.js';

const M = (n) => Math.max(1, Math.round(n * ECON.perMinute));

/** What a thing is worth, in cubes: the base its prices move from. */
export function worthOf(id, data = null) {
  const grade = crudeGrade(id);
  if (grade) return M(ECON.crude.grades[grade].worth); // (a cask of crude: its grade's worth)
  const it = itemOf(id);
  if (!it) return 0;
  if (it.kind === 'map') return data?.worth ? Math.max(1, Math.round(data.worth)) : 0; // (a map keeps its worth: the owner, R58)
  if (it.kind === 'material' && data?.tier != null) return M(1 + data.tier); // (a Well's material: rarer walks further)
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

/** A cask's grade (`cask.grief` -> 'grief'), or null. */
export const crudeGrade = (id) => (id?.startsWith('cask.') && ECON.crude.grades[id.slice(5)] ? id.slice(5) : null);
/** What an island's demand is asked for: a cask by its grade, a map as 'cogitomap', anything else by its item kind. */
export const demandKey = (id) => crudeGrade(id) || (itemOf(id)?.kind === 'map' ? 'cogitomap' : itemOf(id)?.kind || id);

export const SHOPS = {
  raku: {
    id: 'raku', keeper: 'raku', name: "RAKU'S TREASURY",
    blurb: 'Possibilikeys and coffins for the Lockheart. Buys curios, and anything else, cheaply. Everything is negotiable, in his favour.',
    sells: { 'key.brass': 6, 'key.invert': 2, 'key.even': 2, 'key.loaded': 1, 'key.twin': 1, 'key.wide': 1, 'key.echo': 1, 'heart.gambler': 1, 'heart.shepherd': 1 },
    // (the owner, R58: "he'll buy anything": whatever is not his trade, at half its worth, so a Cogitomap has a lowball price at home)
    trade: ['curio'], buys: ['curio', 'key', 'heart', 'map', 'crude', 'material', 'fish', 'lure', 'shell', 'instrument'],
    markup: ECON.haggle.list, haggle: true,
  },
  saggar: {
    id: 'saggar', keeper: 'saggar', name: "SAGGAR'S KILN",
    blurb: 'Glazes, fired onto you at the kiln. What is bought here is never what is earned.',
    // a glaze is not a thing in the box: it is learned at the kiln (courier/vessel/vessel.js `bought`), so the counter lists the glazes
    // whose way is `shop` (courier/vessel/glazes.js) at glazePrice(its prestige), and nothing is bought back
    sells: {}, glazes: true, trade: [], buys: [],
    markup: 1, haggle: false,
  },
  grog: {
    id: 'grog', keeper: 'grog', name: "OLD GROG'S PIER",
    blurb: 'Film for the Veritome, lures if you have lost yours, and casks of crude for the crossing. Buys fish, and pays fair.',
    // (and Anagami's crude, at Anagami's price: the hop's cargo is bought on the pier it leaves from)
    sells: { 'mat.film': 8, ...Object.fromEntries(LURES.map((L) => [L.id, 1])), 'cask.wonder': 8, 'cask.hunger': 8, 'cask.grief': 8 },
    trade: ['fish'], buys: ['fish', 'lure', 'crude'],
    markup: 1, haggle: false, island: 'anagami',
  },
  purser: {
    id: 'purser', keeper: 'purser', name: "THE PURSER'S COUNTER",
    blurb: "Margarite's dock. Buys crude, Cogitomaps and whatever a Well gives, and pays as the King's island pays: dear, for order.",
    sells: { 'cask.mirth': 8, 'cask.wonder': 8 }, // (Margarite's own grades: light, cheap to carry)
    trade: ['crude', 'map'], buys: ['crude', 'map', 'material'],
    markup: 1, haggle: false, island: 'margarite',
  },
};

/** What a look costs at Saggar's kiln, in cubes, by its prestige (ECON.looks: stoneware, porcelain, court); null when it is not sold
 *  (earthenware is yours from the start, the Prince's own only earned). */
export const glazePrice = (prestige) => (ECON.looks.sold.includes(prestige) ? M(ECON.looks.minutes[prestige]) : null);

/** Every item a shop has on its shelf, with its base stock, in the order the shelf shows them. */
export const shelfOf = (shop) => Object.entries(SHOPS[shop]?.sells || {}).filter(([id]) => ITEMS[id]);
