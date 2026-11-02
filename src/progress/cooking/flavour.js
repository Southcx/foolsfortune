// ---------------------------------------------------------------------------------------
// SPIRIT COOKING, FLAVOUR: what an ingredient tastes of, which feeling a dish's taste picks, and how balanced it is (docs/plans/
// SPIRIT-COOKING.md 6, 8; ruled by South 2026-11-01: "Bitter is like, poison", "Fury is chili, spicy is mad, steaming"). A taste is
// what it feels like to eat, so the pleasant feelings take the pleasant tastes and bitter is Gall's alone.
//
// An ingredient is a vector over the seven feeling tastes plus three that are not feelings: umami (how long a dish's draught holds),
// kokumi (body: its strength) and salt as seasoning (it lifts the rest; it counts toward Grief only when it dominates). The pantry's
// staples (flour, water, salt, oil, the starter) are free at the hearth, so a dish can always be cooked; the feeling comes from what
// you won: an ingredient a creature dropped (progress/creaturedrops.js), a fish, the koji bed's miso.
//
// Prior art: Salt Fat Acid Heat (Samin Nosrat, 2017: balance is salt, fat, acid and heat answering each other), the receptor science
// the plan cites (TRPM8 menthol's cool, TRPV1 capsaicin's pain, about 25 bitter receptors, oleogustus as fat's taste), Ikeda's umami
// (1908) and its synergy (kombu's glutamate with katsuobushi's inosinate), kokumi (Ueda et al., 1990), Breath of the Wild's ingredients
// that each lean a dish one way.
//
//   TASTES   FEELING_TASTE { feeling: taste }   INGREDIENTS { id: { taste: { t: 0..1 }, from, line } }   PANTRY
//   fishFeeling(id)   isFish(id)   fishTaste(id)   tasteOf(ids) -> { t: sum } (a fish and a glutamate together: umami x2)   leadOf(taste) -> { feeling, share } | null   balanceOf(taste) -> { tell, fix, ok }
// ---------------------------------------------------------------------------------------

import { SPECIES, ASPECTS } from '../../tools/sondelass/angling/species.js';

/** The tastes, the feeling's seven first (the feelings' display order), then the three that are not feelings. */
export const TASTES = ['cool', 'sweet', 'rich', 'heat', 'bitter', 'salt', 'sour', 'umami', 'kokumi'];

/** A feeling's taste (SPIRIT-COOKING.md 6's table). */
export const FEELING_TASTE = { wonder: 'cool', mirth: 'sweet', desire: 'rich', fury: 'heat', gall: 'bitter', grief: 'salt', dread: 'sour' };
export const TASTE_FEELING = Object.fromEntries(Object.entries(FEELING_TASTE).map(([f, t]) => [t, f]));

/** The ingredients. `taste` each 0..1; `from` where it comes (the drop tables name these ids); `line` what it is, really (the plan's
 *  lesson). Names and lines are placeholders for Espada's; ids are plain. */
export const INGREDIENTS = {
  // the pantry: free at the hearth, never dropped (a dish can always be cooked; skill and the add-in decide it)
  flour:   { taste: { sweet: 0.15 }, pantry: true, line: 'Wheat flour: its gluten is what kneading builds.' },
  water:   { taste: {}, pantry: true, line: 'Water.' },
  salt:    { taste: { salt: 0.4 }, pantry: true, line: 'A pinch lifts every other taste; a fistful is all you taste.' },
  oil:     { taste: { rich: 0.25 }, pantry: true, line: 'A neutral oil.' },
  starter: { taste: { sour: 0.08, kokumi: 0.1 }, pantry: true, line: 'A sourdough starter kept alive at the hearth: wild yeast and lactic bacteria.' },
  rice:    { taste: { sweet: 0.1 }, pantry: true, line: 'Short-grain rice: wash it until the water runs almost clear.' },
  egg:     { taste: { rich: 0.2, umami: 0.05 }, pantry: true, line: 'Egg: its yolk is what makes fresh pasta silky and gold.' },
  kansui:  { taste: { bitter: 0.04 }, pantry: true, line: 'Kansui: alkaline water. It makes noodles springy and yellow (the gluten tightens; the flour\'s flavones turn gold).' },
  // the add-ins: one a feeling (a creature of that feeling drops its own: progress/creaturedrops.js)
  mint:       { taste: { cool: 0.8 }, from: 'wonder', line: 'Mint: menthol tricks the cold receptor (TRPM8), so it tastes cool without being cold.' },
  honey:      { taste: { sweet: 0.8, kokumi: 0.05 }, from: 'mirth', line: 'Honey: sweet is the body\'s "energy here".' },
  butter:     { taste: { rich: 0.8 }, from: 'desire', line: 'Butter: fat may be a sixth taste (oleogustus), the one a craving reaches for.' },
  chilli:     { taste: { heat: 0.85 }, from: 'fury', line: 'A chilli: capsaicin is pain, not taste (TRPV1). You sweat as if angry.' },
  bitterleaf: { taste: { bitter: 0.8 }, from: 'gall', line: 'A bitter leaf: about 25 receptors watch for bitter, the body\'s poison alarm.' },
  onion:      { taste: { salt: 0.35, sweet: 0.15, umami: 0.1 }, from: 'grief', line: 'An onion: cut it and it makes the lachrymatory factor, the compound that brings tears.', tears: 0.5 },
  vinegar:    { taste: { sour: 0.8 }, from: 'dread', line: 'Vinegar: sour is the body\'s "this may have gone".' },
  // what is not a feeling: how long, how strong
  kombu:      { taste: { umami: 0.7, salt: 0.1 }, from: 'shore', line: 'Kombu: kelp, its glutamate the first umami Ikeda named (1908). Never boil it.' },
  miso:       { taste: { kokumi: 0.6, salt: 0.3, umami: 0.3 }, from: 'koji', line: 'Miso: soybeans fermented with koji (Aspergillus oryzae). It adds body (kokumi).' },
};
/** The staples the hearth always has. */
export const PANTRY = Object.keys(INGREDIENTS).filter((k) => INGREDIENTS[k].pantry);
/** A fish landed from the Lachryma, as an ingredient (`fish.<species>`, the Pneuka Box's own id): its feeling is the one it is drawn to
 *  most (its `aff`), tasted as that feeling's taste, with a fish's inosinate (umami) and body. SOULSEAFOOD: the Weir's fish feed the hearth. */
const FISH_FEELING = Object.fromEntries(SPECIES.map((F) => [F.id, ASPECTS[F.aff.indexOf(Math.max(...F.aff))]?.id]));
export const fishFeeling = (id) => FISH_FEELING[String(id).replace(/^fish\./, '')] || null;
export const isFish = (id) => /^fish\./.test(String(id)) && !!fishFeeling(id);
export const fishTaste = (id) => { const f = fishFeeling(id); return f ? { [FEELING_TASTE[f]]: 0.7, umami: 0.35, kokumi: 0.1 } : {}; };
/** Umami's synergy (Ikeda's dashi: kombu's glutamate with a fish's inosinate tastes several times as savoury as either alone; Yamaguchi,
 *  1967): a glutamate ingredient and a fish together double the dish's umami. */
const GLUTAMATE = new Set(['kombu', 'miso']);

/** The add-in a feeling's creature drops. */
export const ADDIN_OF = Object.fromEntries(Object.entries(INGREDIENTS).filter(([, I]) => FEELING_TASTE[I.from]).map(([k, I]) => [I.from, k]));

/** The taste of a list of ingredient ids (each counted once a time it appears). */
export function tasteOf(ids = []) {
  const t = Object.fromEntries(TASTES.map((k) => [k, 0]));
  for (const id of ids) for (const [k, v] of Object.entries(isFish(id) ? fishTaste(id) : INGREDIENTS[id]?.taste || {})) t[k] += v;
  if (ids.some((id) => GLUTAMATE.has(id)) && ids.some(isFish)) t.umami *= 2; // (the synergy: dashi's)
  return t;
}

/** The dish's feeling: its dominant feeling taste and its share of all the feeling tastes. Salt counts toward Grief only when it is more
 *  than half the dish's salt-and-everything (as seasoning it lifts; dominant it is all you taste). Null when no feeling taste is there. */
export function leadOf(t) {
  let best = null, top = 0, sum = 0;
  for (const [f, k] of Object.entries(FEELING_TASTE)) {
    const v = k === 'salt' ? Math.max(0, t.salt - 0.4) : t[k]; // (the first pinch is seasoning, not Grief)
    sum += v; if (v > top) { top = v; best = f; }
  }
  return best && top > 0.05 ? { feeling: best, share: top / sum } : null;
}

/** How a dish tastes before the last adjustment, in its own tells (SPIRIT-COOKING.md 8), never a number: flat (no salt: a pinch), heavy
 *  (fat with nothing sharp: a squeeze of acid), sharp (sour or bitter alone: fat), one-note (sweet alone: a little heat), or balanced. */
export function balanceOf(t) {
  const loud = Math.max(t.cool, t.sweet, t.rich, t.heat, t.bitter, t.sour);
  if (t.salt < 0.3) return { tell: 'flat', fix: 'salt', line: 'Flat. Something is missing.' };
  if (t.rich > 0.5 && t.sour < 0.15) return { tell: 'heavy', fix: 'acid', line: 'Heavy on the tongue.' };
  if ((t.sour > 0.5 || t.bitter > 0.5) && t.rich < 0.2) return { tell: 'sharp', fix: 'fat', line: 'Sharp at the back of the throat.' };
  if (t.sweet > 0.6 && loud === t.sweet && t.heat < 0.1) return { tell: 'one-note', fix: 'heat', line: 'Sweet, and only sweet.' };
  return { tell: 'balanced', fix: null, ok: true, line: 'Balanced. Every taste answers another.' };
}

/** What an adjustment adds (the taste-and-adjust's four, a spoon each). */
export const ADJUST = {
  salt: { taste: { salt: 0.3 }, label: 'A PINCH OF SALT' },
  acid: { taste: { sour: 0.25 }, label: 'A SQUEEZE OF ACID' },
  fat:  { taste: { rich: 0.3 }, label: 'A KNOB OF FAT' },
  heat: { taste: { heat: 0.2 }, label: 'A LITTLE HEAT' },
};
