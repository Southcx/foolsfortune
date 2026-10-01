// ---------------------------------------------------------------------------------------
// ITEMS: every thing the Courier can carry as a thing (not as a card). An item has an id, a name, a look for its slot, an examine line
// (what OSRS's Examine says), what it can be used for, and which card it becomes when it is stored in the Veritome (cards.js: an item
// and its card share an id, so a curio is 'curio.whelk' in the hand and on the page alike).
//
// For now the items are the twenty curios; a new kind of item is a new entry here and nothing else (the Pneuka Box, its window, the
// ground, the bank all read this).
//
//   ITEMS[id] = { id, kind, name, glyph, color, tier, examine, card, lure, stack }      itemOf(id)
// ---------------------------------------------------------------------------------------
import { CURIOS, TIERS } from '../treasure.js';

export const ITEMS = {};
for (const c of CURIOS) {
  ITEMS[`curio.${c.id}`] = {
    id: `curio.${c.id}`, kind: 'curio', key: c.id, name: c.name, glyph: c.glyph, color: TIERS[c.tier].rgb, tier: c.tier,
    examine: c.blurb, card: `curio.${c.id}`, lure: true, stack: false,
  };
}
export const itemOf = (id) => ITEMS[id] || null;
