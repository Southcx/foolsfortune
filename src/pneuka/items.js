// ---------------------------------------------------------------------------------------
// ITEMS: every thing the Courier can carry as a thing (not as a card). An item has an id, a name, a look for its slot, an examine line
// (what OSRS's Examine says), what it can be used for, and which card it becomes when it is stored in the Veritome (cards.js: an item
// and its card share an id, so a curio is 'curio.whelk' in the hand and on the page alike).
//
// The items are the twenty curios, the six made lures, the seven psychic tools, what the last three take (instruments, coffins,
// keys, shards), the fish they land and the film the Veritome uses; a new kind of item is a new entry here and nothing
// else (the Pneuka Box, its window, the ground, the bank all read this).
//
//   ITEMS[id] = { id, kind: 'curio' | 'lure' | 'tool' | 'instrument' | 'heart' | 'key' | 'material' | 'fish' | 'map', name, glyph, color, tier, examine, card, lure, tool, place, stack (false, or how many a slot holds) }      itemOf(id)
// ---------------------------------------------------------------------------------------
import { BOTTLES } from '../progress/brushload.js';
import { CURIOS, TIERS } from '../world/treasure/treasure.js';
import { LURES } from '../tools/sondelass/angling/lures.js';
import { HEARTS, KEYS } from '../tools/lockheart/table.js';
import { INSTRUMENTS } from '../tools/crucibelle/songs.js';
import { SPECIES, ASPECTS } from '../tools/sondelass/angling/species.js';
import { SHELL_TYPES } from '../tools/psygun/shells.js';
import { typeNo } from '../tools/psygun/kinds.js';
import { KINDS as MAT_KINDS } from '../progress/econ/materials.js';

export const ITEMS = {};
/** A slot colour for a hue in degrees (HSL at saturation 0.55, lightness 0.6): the materials, by the middle of their kind's arc. */
function hueHex(h) { const S = 0.55, L = 0.6, a = S * Math.min(L, 1 - L); const f = (n) => { const k = (n + h / 30) % 12; return Math.round(255 * (L - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); }; return (f(0) << 16) | (f(8) << 8) | f(4); }
for (const c of CURIOS) {
  ITEMS[`curio.${c.id}`] = {
    id: `curio.${c.id}`, kind: 'curio', key: c.id, name: c.name, glyph: c.glyph, color: TIERS[c.tier].rgb, tier: c.tier,
    examine: c.blurb, card: `curio.${c.id}`, lure: true, stack: false,
  };
}
// the made lures: things they carry, tied on the Sondelass' line one at a time (tools/sondelass/angling/lures.js has their tastes; luremodels.js their look)
for (const L of LURES) {
  ITEMS[L.id] = { id: L.id, kind: 'lure', key: L.key, name: L.name, glyph: L.glyph, color: 0xd9b48a, tier: 0, examine: L.blurb, card: null, lure: true, stack: false };
}
// the psychic tools: worn in a place on their body (tools/belt.js) or carried in the box; seven tools, and not enough places for all of them
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
// the Crucibelle's instruments (one fitted to the bell: tools/crucibelle/songs.js), the Lockheart's coffins (one on the chain) and the
// Possibilikeys that open them (up to four on the ring, used up: tools/lockheart/table.js), and the shard a ringing crystal gives
for (const [id, I] of Object.entries(INSTRUMENTS)) if (id !== 'bell') ITEMS[id] = { id, kind: 'instrument', key: id.slice(5), name: I.name, glyph: '♪', color: I.color, tier: 1, examine: I.does, card: null, lure: false, stack: false };
for (const [id, H] of Object.entries(HEARTS)) ITEMS[id] = { id, kind: 'heart', key: id.slice(6), name: H.name, glyph: '⚰', color: H.trim, tier: 2, examine: H.examine, card: null, lure: false, stack: false };
for (const [id, K] of Object.entries(KEYS)) ITEMS[id] = { id, kind: 'key', key: id.slice(4), name: K.name, glyph: '⚷', color: K.color, tier: id === 'key.brass' ? 0 : 2, examine: `A Possibilikey. ${K.does}`, card: null, lure: false, stack: 99 }; // (keys stack: the owner's note)
ITEMS['mat.film'] = { id: 'mat.film', kind: 'material', key: 'film', name: 'ROLL OF FILM', glyph: '◫', color: 0xe0c070, tier: 0, examine: 'Twenty-four plates for the Veritome, wound on a brass spool. Loaded by itself when the last roll runs out.', card: null, lure: false, stack: 99 };
// a landed fish, kept whole in the box until it is sold (Old Grog buys them on the pier: progress/shop/catalogue.js)
for (const F of SPECIES) ITEMS[`fish.${F.id}`] = { id: `fish.${F.id}`, kind: 'fish', key: F.id, name: F.name, glyph: '∝', color: F.color, tier: F.tier, examine: F.blurb, card: null, lure: false, stack: false };
// the caster shells, as things (for their pictures in the psygun's chambers; as loose things to be carried, a later round)
for (const [i, t] of SHELL_TYPES.entries()) ITEMS[`shell.${t.id}`] = { id: `shell.${t.id}`, kind: 'shell', key: t.id, name: `${typeNo(i)} ${t.name}`, glyph: t.glyph, color: 0xd9b048, tier: 1, examine: `Caster shell ${typeNo(i)}: the ${t.name.toLowerCase()}.`, card: null, lure: false, stack: 99 };
ITEMS['mat.shard'] = { id: 'mat.shard', kind: 'material', key: 'shard', name: 'LACHRYMA SHARD', glyph: '◆', color: 0xcdb8f2, tier: 1, examine: 'A spire of set Lachryma, broken off while it rang. A Lockheart drinks it whole.', card: null, lure: false, stack: false };

// what a Well gives (world/well/dunemaw.js): a material of each of the seven kinds (progress/econ/materials.js: each one carries its own
// hue, saturation and path for the spirit press in its slot's `data`), and the Cogitomap, a map of a Well as it was that day (its `data`:
// { well, seed, day, charted, pay, worth, at }). Names and examine lines are placeholders for Espada's.
const MAT_NAMES = { eldritch: 'ELDRITCH ARTEFACT', arcane: 'ARCANE RELIC', finery: 'FINERY', mechanism: 'MECHANISM', edge: 'EDGE', art: 'ARTWORK', provision: 'PROVISION' };
for (const k of Object.keys(MAT_KINDS)) {
  const K = MAT_KINDS[k], hue = (K.hue[0] + K.hue[1]) / 2;
  ITEMS[`mat.${k}`] = { id: `mat.${k}`, kind: 'material', key: k, name: MAT_NAMES[k] || k.toUpperCase(), glyph: '❖', color: hueHex(hue), tier: 0,
    examine: `Brought up out of a Well: one of the ${K.name}. The spirit press can use it.`, card: null, lure: false, stack: false };
}
// crude Lachryma, in casks, by grade (the five aspects: LORE.md section 8, "Lachryma as crude"; Espada's names and lines): what the
// sloop carries between islands (progress/voyage.js, Dovina's). Kind 'crude', eight to a slot.
const CASK_LINES = {
  mirth: 'Light and sweet. Easy to carry. Somebody laughed this, a long time ago.', wonder: 'It glitters in the cask and does not settle.',
  desire: 'The cask feels empty, however full it is.', grief: 'Heavy and sour. Carry it carefully.', dread: 'The richest grade. The worst to spill. Do not shake it.',
};
for (const a of ASPECTS) ITEMS[`cask.${a.id}`] = { id: `cask.${a.id}`, kind: 'crude', key: a.id, name: `CASK OF CRUDE ${a.name}`, glyph: a.glyph, color: a.color, tier: 1, examine: CASK_LINES[a.id], card: null, lure: false, stack: 8 };
ITEMS.cogitomap = { id: 'cogitomap', kind: 'map', key: 'cogitomap', name: 'COGITOMAP', glyph: '⌗', color: 0x9a6bff, tier: 2,
  examine: 'A chart of one Well on one game day. The Well drifts. The chart does not.' /* (Espada's: LORE.md section 8) */, card: null, lure: false, stack: false };

// the Lachrymato Bottles (progress/brushload.js BOTTLES, Dovina's numbers): worn on the upper back, a reserve of Lachryma the Soul Brush
// paints from and mops into (tools/soulbrush/load.js). Names and lines are placeholders for Espada's.
const BOTTLE_NAMES = { 'bottle.small': 'SMALL LACHRYMATO BOTTLE', 'bottle.medium': 'LACHRYMATO BOTTLE', 'bottle.large': 'LARGE LACHRYMATO BOTTLE' };
for (const [id, B] of Object.entries(BOTTLES)) ITEMS[id] = { id, kind: 'bottle', key: id.slice(7), place: 'bottle', name: BOTTLE_NAMES[id], glyph: '⚱', color: 0x9fd6e8, tier: 1,
  examine: `Aquarium glass, worn on the upper back. It holds ${B.capacity} Lachryma and feeds your mind when it runs low. Glass breaks.`, card: null, lure: false, stack: false };

export const itemOf = (id) => ITEMS[id] || null;
