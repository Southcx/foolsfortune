// ---------------------------------------------------------------------------------------
// ITEMS: every thing the Courier can carry as a thing (not as a card). An item has an id, a name, a look for its slot, an examine line
// (what OSRS's Examine says), what it can be used for, and which card it becomes when it is stored in the Veritome (cards.js: an item
// and its card share an id, so a curio is 'curio.whelk' in the hand and on the page alike).
//
// The items are the twenty curios, the six made lures and the seven psychic tools; a new kind of item is a new entry here and nothing
// else (the Pneuka Box, its window, the ground, the bank all read this).
//
//   ITEMS[id] = { id, kind: 'curio' | 'lure' | 'tool', name, glyph, color, tier, examine, card, lure, tool, place, stack }      itemOf(id)
// ---------------------------------------------------------------------------------------
import { CURIOS, TIERS } from '../treasure.js';
import { LURES } from '../angling/lures.js';

export const ITEMS = {};
for (const c of CURIOS) {
  ITEMS[`curio.${c.id}`] = {
    id: `curio.${c.id}`, kind: 'curio', key: c.id, name: c.name, glyph: c.glyph, color: TIERS[c.tier].rgb, tier: c.tier,
    examine: c.blurb, card: `curio.${c.id}`, lure: true, stack: false,
  };
}
// the made lures: things she carries, tied on the Sondelass' line one at a time (angling/lures.js has their tastes; luremodels.js their look)
for (const L of LURES) {
  ITEMS[L.id] = { id: L.id, kind: 'lure', key: L.key, name: L.name, glyph: L.glyph, color: 0xd9b48a, tier: 0, examine: L.blurb, card: null, lure: true, stack: false };
}
// the psychic tools: worn in a place on her body (tools/belt.js) or carried in the box; seven tools, and not enough places for all of them
export const TOOL_ITEMS = [
  { tool: 'psygun', name: 'THE PSYGUN', place: 'back', examine: 'A hand-cannon that fires what the mind can spare. Worn across the back.' },
  { tool: 'sondelass', name: 'THE SONDELASS', place: 'back', examine: 'A telescoping thing of brass and line: cutlass, rod or grapnel. Worn across the back.' },
  { tool: 'soulbrush', name: 'THE SOUL BRUSH', place: 'hip', examine: 'A great brush for writing on the world in slip. Worn at the hip.' },
  { tool: 'veritome', name: 'THE VERITOME', place: 'hip', examine: 'A book that sees what is true, with a lens in its spine. Worn at the hip.' },
  { tool: 'dreamvane', name: 'THE DREAMVANE', place: 'back', examine: 'A dowsing crook that leans toward Lachryma, with a tuning fork in its heel. Worn across the back.' },
  { tool: 'crucibelle', name: 'THE CRUCIBELLE', place: 'hip', examine: 'A smoking bell that takes what is played into it and makes it more. Worn at the hip.' },
  { tool: 'lockheart', name: 'THE LOCKHEART', place: 'neck', examine: 'A little coffin on a chain that drinks the Lachryma you cannot hold. Worn at the neck.' },
];
for (const T of TOOL_ITEMS) {
  ITEMS[`tool.${T.tool}`] = { id: `tool.${T.tool}`, kind: 'tool', key: T.tool, tool: T.tool, place: T.place, name: T.name, glyph: '⚒', color: 0xffb27a, tier: 0, examine: T.examine, card: null, lure: false, stack: false };
}
export const itemOf = (id) => ITEMS[id] || null;
