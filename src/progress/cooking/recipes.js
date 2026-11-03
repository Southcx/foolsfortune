// ---------------------------------------------------------------------------------------
// SPIRIT COOKING, RECIPES FOUND BY TASTING AND BY REPAIR (G229; docs/plans/SPIRIT-COOKING.md 5, 16). By experiment is built (the pot
// recognises a combination and keeps it: cooking.js serve). The other two ways, never by blind failure (Rune Factory's hidden gates are
// the pitfall):
//
//  - BY TASTING: a dish one of the folk or a spirit gives you teaches its recipe (`GIFTS`, `Cooking.receive(giver)`). Final Fantasy
//    XV's Ignis learns a dish by eating it. The giver is a plain id; the folk's lines that hand a dish over are Espada's (a handoff).
//  - BY REPAIR: a recipe slab, a cracked clay slab with lines of the recipe missing, the order of the moves the puzzle (Venba). `SLABS`
//    are found by the ledger (a slab turns up at the hearth once you have cooked what leads to it: a predicate, never a flag), mended in
//    the window by placing a move in each blank. A wrong placing is told how many lines are right, never a penalty. A slab is not an
//    ostracon (SPIRIT-COOKING.md 10).
//
// A recipe known costs nothing and gates nothing today (any combination can be cooked); knowing it fills the Codex's recipe list and
// says the dish exists. That is the honest limit of the data, kept so the slabs and gifts can teach more once a recipe gates a dish.
//
// Prior art: Venba (Visai Games, 2023: a recipe with its steps missing, the order is the puzzle), Final Fantasy XV (Ignis learns a dish
// by tasting), Breath of the Wild's compendium (a dish kept once made), Rune Factory (the hidden-recipe gate this refuses).
//
//   GIFTS { giver: { family, addin, line } }   SLABS [{ id, family, addin, open: (L) -> bool, decoys, line }]
//   slabLines(slab) -> [{ move, hint, blank }]   mendSlab(slab, picks) -> { ok, right, total }   slabsOpen(L) -> ids   dishOfGift(giver) -> dish
// ---------------------------------------------------------------------------------------
import { FAMILIES, dishFor } from './dishes.js';
import { MOVES } from './moves.js';

/** The dishes the folk and the spirits hand over, by giver (placeholders: the folk's own lines are Espada's, `docs/handoffs/espada/`). */
export const GIFTS = {
  'folk.stoneware': { family: 'rice', addin: 'kombu', line: 'Rice with kelp, as the stoneware folk cook it in a donabe.' },
  'folk.porcelain': { family: 'tea', addin: 'mint', line: 'A mint tea brewed gentle, the porcelain folk\'s afternoon.' },
  'folk.fisher': { family: 'broth', addin: null, line: 'A plain kombu broth: the fisher\'s, drunk before a long cast.' },
  'spirit.clapperjar': { family: 'sweet', addin: 'honey', line: 'Honey candy to the crack, the clapperjar\'s spirit\'s favourite.' },
  'spirit.wisp': { family: 'smoke', addin: null, line: 'Smoke thin and blue, the Lantern Wisp\'s lantern fuel.' },
};
/** The dish a giver teaches: its id and label, or null. */
export const dishOfGift = (giver) => { const G = GIFTS[giver]; return G ? dishFor(G.family, G.addin) : null; };

const G = (L, k) => Math.max(L?.get?.(k) || 0, L?.best?.(k) || 0);
/** The recipe slabs. `open` is a predicate over the ledger (what leads to the dish); `decoys` moves that look right and are not. */
export const SLABS = [
  { id: 'rice', family: 'rice', addin: 'kombu', decoys: ['bake', 'steep'], open: (L) => G(L, 'cook.serve') >= 1, line: 'A slab from the first kilns: the rice dish, half worn away.' },
  { id: 'broth', family: 'broth', addin: 'kombu', decoys: ['roux', 'sear'], open: (L) => G(L, 'cook.family.rice') >= 1, line: 'A slab about kelp and a pot that must never roll.' },
  { id: 'tea', family: 'tea', addin: 'bitterleaf', decoys: ['simmer', 'sugar'], open: (L) => G(L, 'cook.family.broth') >= 1, line: 'A slab with a single line left, the water\'s.' },
  { id: 'sauce', family: 'sauce', addin: 'butter', decoys: ['emulsion', 'sugar'], open: (L) => G(L, 'cook.family.tea') >= 1 || G(L, 'cook.serve') >= 8, line: 'A slab of a sauce that starts with a paste.' },
  { id: 'candy', family: 'sweet', addin: 'honey', decoys: ['roux', 'steep'], open: (L) => G(L, 'cook.family.sauce') >= 1 || G(L, 'cook.serve') >= 10, line: 'A slab smelling faintly of caramel.' },
  { id: 'koji', family: 'ferment', addin: 'miso', decoys: ['smoke', 'proof'], open: (L) => G(L, 'cook.serve') >= 12, line: 'A slab of the koji bed, the dish everything else begins from.' },
];
const SLAB = Object.fromEntries(SLABS.map((S) => [S.id, S]));
export const slabOf = (id) => SLAB[id] || null;

/** The ids of the slabs that have turned up for this ledger. */
export const slabsOpen = (L) => SLABS.filter((S) => S.open(L)).map((S) => S.id);

/** The slab's lines in order: each a move of its family, hinted by the first sentence of what it does; a move a slab hides is `blank`.
 *  Which are hidden: every move of a family of one or two, every other of a longer one, always at least one. */
export function slabLines(S) {
  const moves = FAMILIES[S.family]?.moves || [];
  return moves.map((m, i) => ({ move: m, hint: (MOVES[m]?.line || '').split('. ')[0], blank: moves.length <= 2 || i % 2 === 1 }));
}
/** The moves offered for the blanks: the hidden ones and the decoys, in a fixed order (a slab is a puzzle of order, not luck). */
export const slabChoices = (S) => [...new Set([...slabLines(S).filter((l) => l.blank).map((l) => l.move), ...S.decoys])].sort();

/** A slab mended with `picks` (a move for each blank, in order): how many are right and whether all are. A wrong placing costs nothing. */
export function mendSlab(S, picks = []) {
  const blanks = slabLines(S).filter((l) => l.blank);
  const right = blanks.filter((l, i) => picks[i] === l.move).length;
  return { ok: right === blanks.length, right, total: blanks.length };
}
