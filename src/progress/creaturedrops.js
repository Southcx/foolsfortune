// ---------------------------------------------------------------------------------------
// A CREATURE'S DROPS: what falls out of a creature the Courier brings down in the world, as things on the ground (South, 2026-11-01:
// "We'll have them drop out of enemies as a 2d billboard sprite"). The runtime is world/drops/creaturedrops.js; the sprites are
// Calissa's, one 48 x 48 a category (DROP_CATEGORIES: the generic of each broader kind of thing), in the maker's pixel hand.
//
// What drops is read from two things the creature already is, so the tables join modules rather than adding a list:
//   - its body (progress/combat/constitution.js): slip and clay give the provisions and the art its folk make; a phantom's flame gives
//     finery and arcane relics; an antibody of fired clay gives edges and mechanisms. A material kind is Soul Alchemy's
//     (progress/econ/materials.js), so a hunt feeds the press;
//   - its feeling (its own, else the weather's where it falls: vfx/figmentscatter.js's rule): the add-in of that feeling's taste
//     (progress/cooking/flavour.js ADDIN_OF), so a Fury jelly drops a chilli and the dish it seasons serves Fury's draught. The weather
//     decides what you can cook; what you cook bends your soul colour. That is the loop.
// How many: 1 + 2 x its yield (progress/combat/emo.js yieldOf: brought down in its agitation's optimal band, up to three; brought down
// rote, one). Skill skips grind; grind still pays. Luck sways the rare roll (progress/luck.js), never the count.
// Training bodies (Strawman, the Well's dummies and targets), allies, aberrants (their drops are the duel's: progress/duel/drops.js) and
// a FOE (its haul and DROPS: progress/combat/greatjelly.js) drop nothing here.
//
// Prior art: Old School RuneScape's drop tables (an always drop, a main table, a rare drop table; loot on the ground), Monster Hunter
// (what a monster is made of is what it gives), Breath of the Wild (a Chuchu's jelly of its element: a creature's nature is its loot),
// Kingdom Hearts (orbs and items burst out and fly to you).
//
//   DROP_CATEGORIES { id: { label, generic, items } }   categoryOf(itemId) -> id
//   DROP_TABLES { kind: { materials: { kind: weight }, addin: weight, extra: [{ id, w }], rare: [{ id, p }] } }
//   rollDrops({ kind, feeling, yield, luck }, rand) -> [{ id, data? , cat }]
// ---------------------------------------------------------------------------------------
import { ADDIN_OF } from './cooking/flavour.js';

/** The broader kinds of thing a drop can be: one 48 x 48 sprite each, the generic of the kind (Calissa's placeholders), in the order
 *  they are wanted. `generic` is what the sprite shows; `items` which item ids wear it (a prefix with *). */
export const DROP_CATEGORIES = {
  'mat.provision': { label: 'PROVISION', generic: 'a heartfruit: a round fruit, a leaf on its stem', items: ['mat.provision'] },
  'mat.art':       { label: 'ARTWORK', generic: 'an origami crane', items: ['mat.art'] },
  'mat.finery':    { label: 'FINERY', generic: 'a charm on a cord, a dab of pigment', items: ['mat.finery'] },
  'mat.arcane':    { label: 'ARCANE RELIC', generic: 'a rune-cut lens in a brass rim', items: ['mat.arcane'] },
  'mat.edge':      { label: 'EDGE', generic: 'a curved claw', items: ['mat.edge'] },
  'mat.mechanism': { label: 'MECHANISM', generic: 'a little gyroscope', items: ['mat.mechanism'] },
  'mat.eldritch':  { label: 'ELDRITCH ARTEFACT', generic: 'a squat idol with one eye', items: ['mat.eldritch'] },
  'ing.cool':      { label: 'COOL', generic: 'a sprig of mint', items: ['ing.mint'] },
  'ing.sweet':     { label: 'SWEET', generic: 'a piece of honeycomb', items: ['ing.honey'] },
  'ing.rich':      { label: 'RICH', generic: 'a pat of butter on a leaf', items: ['ing.butter'] },
  'ing.heat':      { label: 'HEAT', generic: 'a red chilli', items: ['ing.chilli'] },
  'ing.bitter':    { label: 'BITTER', generic: 'a dark serrated leaf', items: ['ing.bitterleaf'] },
  'ing.salt':      { label: 'SALT', generic: 'an onion, its skin split', items: ['ing.onion'] },
  'ing.sour':      { label: 'SOUR', generic: 'a stoppered cruet of vinegar', items: ['ing.vinegar'] },
  'ing.umami':     { label: 'UMAMI', generic: 'a folded strip of kombu', items: ['ing.kombu'] },
  'ing.body':      { label: 'BODY', generic: 'a small crock of miso', items: ['ing.miso'] },
  shard:           { label: 'SHARD', generic: 'a spire of Lachrymite', items: ['mat.shard'] },
  roe:             { label: 'ROE', generic: 'a quivering cluster of eggs', items: ['roe.slip'] },
  key:             { label: 'POSSIBILIKEY', generic: 'a plain brass key', items: ['key.*'] },
  curio:           { label: 'CURIO', generic: 'a small trinket on a ribbon', items: ['curio.*'] },
  shell:           { label: 'SHELL', generic: 'a caster shell, brass-cased', items: ['shell.*'] },
  fish:            { label: 'FISH', generic: 'a plain fish', items: ['fish.*'] },
  slab:            { label: 'SLAB', generic: 'a banded block of stone', items: ['slab'] },
};
/** The category an item id wears (its own, a prefix's, else null: a thing with no drop sprite yet draws its glyph). */
export function categoryOf(id) {
  for (const [cat, C] of Object.entries(DROP_CATEGORIES)) for (const m of C.items) if (m === id || (m.endsWith('*') && id.startsWith(m.slice(0, -1)))) return cat;
  return null;
}

/** By kind: the material kinds its body gives (weights), how often its feeling's add-in falls (weight beside them), what else, and the
 *  rare roll (a chance a down, Luck swaying it). Each roll picks one of materials + addin + extra by weight. */
export const DROP_TABLES = {
  slipjelly: { materials: { provision: 3, art: 1 }, addin: 4, extra: [{ id: 'roe.slip', w: 1 }], rare: [{ id: 'mat.shard', p: 1 / 12 }, { id: 'key.brass', p: 1 / 60 }] }, // (slip is clay and water: food and the potter's art; its roe the plan's own)
  clutch:    { materials: { provision: 2 }, addin: 2, extra: [{ id: 'roe.slip', w: 3 }], rare: [] },
  rolypoly:  { materials: { mechanism: 2, edge: 1 }, addin: 2, extra: [], rare: [{ id: 'mat.shard', p: 1 / 16 }] }, // (a shell that rolls: a mechanism, its rim an edge)
  wisp:      { materials: { finery: 2, arcane: 2 }, addin: 3, extra: [{ id: 'mat.shard', w: 1 }], rare: [{ id: 'key.brass', p: 1 / 40 }] }, // (a mind round a flame: its glass a lens, its light a pigment)
  clapper:   { materials: { art: 3, finery: 1 }, addin: 2, extra: [], rare: [] }, // (clay folk: their craft; a fight with one is rare and small)
  sentinel:  { materials: { edge: 2, mechanism: 1, art: 1 }, addin: 1, extra: [{ id: 'mat.shard', w: 1 }], rare: [{ id: 'mat.eldritch', p: 1 / 10 }] }, // (fired clay with a shield: edges and its make; an idol sometimes: the island's own)
  giant:     { materials: { provision: 2, art: 2, mechanism: 1 }, addin: 0, extra: [{ id: 'mat.shard', w: 2 }], rare: [{ id: 'key.brass', p: 1 / 6 }] }, // (the straw giant: straw and scaffold at scale, its stuffing food and craft; a rare Possibilikey: MECHS.md 6)
  spirit:    { materials: { eldritch: 1, arcane: 1 }, addin: 2, extra: [], rare: [] },
};
/** Who drops nothing here (their own systems pay them). */
export const NO_DROPS = new Set(['dummy', 'strawman', 'target', 'greatjelly', 'sibling', 'beast']);

const pickW = (rows, r) => { const sum = rows.reduce((a, x) => a + x.w, 0); let u = r() * sum; for (const x of rows) if ((u -= x.w) <= 0) return x; return rows[rows.length - 1]; };

/** A down's drops: `feeling` the creature's (or its place's weather's), `yield` 0..1 its agitation's yield at the down, `luck` -1..1
 *  (Luck's sway: the rare roll x (1 + 0.5 luck)). Returns item ids (a material with its kind and tier; the runtime makes its data). */
export function rollDrops({ kind, feeling = null, yield: y = 0.5, luck = 0 } = {}, rand) { // (rand: the caller's seeded stream, core/rng.js)
  const T = DROP_TABLES[kind]; if (!T || NO_DROPS.has(kind)) return [];
  const rows = [...Object.entries(T.materials).map(([k, w]) => ({ id: `mat.${k}`, w, mat: k })), ...(feeling && ADDIN_OF[feeling] ? [{ id: `ing.${ADDIN_OF[feeling]}`, w: T.addin }] : []), ...T.extra];
  const n = 1 + Math.round(2 * Math.max(0, Math.min(1, y))), out = [];
  for (let i = 0; i < n; i++) { const x = pickW(rows, rand); out.push(x.mat ? { id: x.id, mat: x.mat, tier: y > 0.8 && rand() < 0.25 ? 1 : 0 } : { id: x.id }); }
  for (const R of T.rare) if (rand() < R.p * (1 + 0.5 * Math.max(-1, Math.min(1, luck)))) out.push({ id: R.id, rare: true, ...(R.id.startsWith('mat.') && R.id !== 'mat.shard' ? { mat: R.id.slice(4), tier: 1 } : {}) });
  for (const d of out) d.cat = categoryOf(d.id);
  return out;
}
