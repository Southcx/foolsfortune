// ---------------------------------------------------------------------------------------
// SPIRIT COOKING, THE DISHES AND WHAT ONE SERVES: a dish's family and moves, its grade from its moves' scores, and the held draught it
// gives (docs/plans/SPIRIT-COOKING.md 5, 7, 9). A dish is two to four moves; its grade is their average (Cooking Mama's), lifted a
// step by the right adjustment at the taste (Salt Fat Acid Heat's). Its feeling is its ingredients' dominant taste; its strength is
// the grade times kokumi and how loud the feeling is; its hold is the grade times umami. It is one draught, the one the press already
// reads (game.draught; progress/alchemy.js walk: draughtPull x strength), held longer than a drink's real minute.
//
// One step below the plan's four: FAIR (0.3 to 0.6) still serves a weak draught, so a clumsy loaf still pays (CLAUDE.md, "Skill skips
// grind; grind closes the gap"). Only a ruined one (burnt, collapsed, overworked to tearing, or an average under 0.3) is a dubious dish:
// a little pool back and no draught (the plan's comedy of failure, cheaply fixed).
//
// Prior art: Cooking Mama (steps averaged), Stardew Valley (one food buff at a time, the next replacing it), Breath of the Wild (a
// recipe recognised from what went in, kept in a book from the first), Fantasy Life (batch once mastered).
//
//   FAMILIES (bread built; pasta, sheets, noodles, seafood on the 3D stage)   DISHES { id: { family, moves, base, label, line } }   dishFor(family, addin) -> { id, label }
//   GRADES [{ id, at, strength, hold }]   gradeOf(scores, hits, ruined) -> grade   lift(grade) -> grade   serve({ family, addin, scores, hits, ruined, adjusted }) -> served
//   dishDraught(taste, grade) -> { feeling, strength, hold } | null   (batch and auto-cook: progress/cooking/batch.js)
// ---------------------------------------------------------------------------------------
import { tasteOf, leadOf, ADJUST, FEELING_TASTE, isFish } from './flavour.js';
import { SPECIES } from '../../tools/sondelass/angling/species.js';

const itemName = (id) => SPECIES.find((F) => `fish.${F.id}` === id)?.name || null;

export const FAMILIES = {
  bread: { label: 'BREAD', moves: ['knead', 'proof', 'bake'], base: ['flour', 'water', 'salt', 'starter'], built: true, line: 'Flour, water, salt and the starter, kneaded, proofed and baked.' },
  // the 3D stage's (South, 2026-11-02: "Pasta themed! Italian-Japanese cooking ... Spirit Pasta, Soul Noodles ... SOULSEAFOOD"; played on
  // Calissa's stage with the god hand working the dough, `stage: '3d'`). Labels plain, Espada's to name. `fish`: a landed fish may be its
  // add-in (its feeling the fish's), the Italian-Japanese wafu way (a fish pasta, a fish noodle soup) and seafood's whole point.
  pasta:   { label: 'PASTA', moves: ['knead', 'roll', 'cut', 'boil'], base: ['flour', 'egg', 'salt'], stage: '3d', fish: true, noun: 'TAGLIATELLE', line: 'Flour and egg kneaded, rolled thin, cut to ribbons and boiled to the soul.' },
  sheets:  { label: 'SHEETS', moves: ['knead', 'laminate', 'roll', 'boil'], base: ['flour', 'egg', 'salt'], stage: '3d', fish: true, noun: 'LASAGNE', line: 'Folded and rolled until it is satin, then boiled.' },
  noodles: { label: 'NOODLES', moves: ['knead', 'pull', 'boil'], base: ['flour', 'water', 'salt', 'kansui'], stage: '3d', fish: true, noun: 'NOODLES', line: 'Hand-pulled: kneaded, doubled and doubled again, boiled.' },
  seafood: { label: 'SEAFOOD', moves: ['bleed', 'sear'], base: ['salt', 'oil'], stage: '3d', fish: true, needsFish: true, noun: '', line: 'A fish you landed from the Lachryma, bled calm and seared skin down.' },
  rice:  { label: 'RICE', moves: ['rice', 'simmer'], base: ['rice', 'water'], built: false },
  broth: { label: 'BROTH', moves: ['simmer', 'steep'], base: ['water', 'kombu'], built: false },
  tea:   { label: 'TEA', moves: ['steep'], base: ['water'], built: false },
};

/** A dish is its family with one add-in (or none): the pot recognises it and keeps its recipe (names placeholders for Espada's). */
const ADDIN_DISH = { mint: 'MINT', honey: 'HONEY', butter: 'BUTTER', chilli: 'CHILLI', bitterleaf: 'BITTERLEAF', onion: 'ONION', vinegar: 'SOUR', kombu: 'KELP', miso: 'MISO' };
export function dishFor(family, addin = null) {
  const F = FAMILIES[family]; if (!F) return null;
  if (addin && isFish(addin)) { // (a fish: named by its species; seafood is the fish itself, seared)
    const name = (itemName(addin) || 'FISH').toUpperCase();
    return { id: `${family}.${addin}`, label: family === 'seafood' ? `SEARED ${name}` : `${name} ${F.noun}`, family, addin };
  }
  const noun = family === 'bread' ? 'LOAF' : F.noun || F.label;
  return { id: `${family}.${addin || 'plain'}`, label: addin ? `${ADDIN_DISH[addin] || addin.toUpperCase()} ${noun}` : `PLAIN ${noun}`, family, addin };
}

/** The grades, lowest first: the average a grade needs, its draught's strength and hold (a multiple of a drink's real minute).
 *  TRUE needs every move true (a heart in each), whatever the average. */
export const GRADES = [
  { id: 'dubious', label: 'DUBIOUS', at: 0, strength: 0, hold: 0 },
  { id: 'fair', label: 'FAIR', at: 0.3, strength: 0.25, hold: 0.75 },
  { id: 'good', label: 'GOOD', at: 0.6, strength: 0.4, hold: 1 },
  { id: 'great', label: 'GREAT', at: 0.75, strength: 0.6, hold: 1.5 },
  { id: 'perfect', label: 'PERFECT', at: 0.9, strength: 0.8, hold: 2 },
  { id: 'true', label: 'TRUE', at: Infinity, strength: 1, hold: 3 },
];
export const gradeById = (id) => GRADES.find((G) => G.id === id) || GRADES[0];

/** The grade the moves earned before the taste. */
export function gradeOf(scores = [], hits = [], ruined = false) {
  if (ruined || !scores.length) return GRADES[0];
  if (hits.length === scores.length && hits.every(Boolean)) return GRADES[GRADES.length - 1];
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  let G = GRADES[0]; for (const R of GRADES) if (R.at !== Infinity && avg >= R.at) G = R;
  return G;
}
/** One step up, by the right adjustment (never past PERFECT: TRUE is the moves' own, the plan's true cook). Dubious stays dubious. */
export function lift(G) { const i = GRADES.indexOf(G); return i <= 0 || G.id === 'true' ? G : GRADES[Math.min(GRADES.length - 2, i + 1)]; }

/** What a drink's draught lasts, real seconds (progress/stones.js DRAUGHT.fadePerSec: strength 1 fades in a real minute). */
export const DRINK_HOLD = 60;
/** The dish served: its recipe, grade, taste, and the draught it lays ({ feeling, strength, hold real s }) or none. */
export function serve({ family, addin = null, scores = [], hits = [], ruined = false, adjusted = null, rightFix = false }) {
  const dish = dishFor(family, addin), F = FAMILIES[family];
  if (F?.needsFish && !isFish(addin)) return { dish, grade: 'dubious', taste: tasteOf(F.base), draught: null, why: 'nofish' }; // (seafood is a fish)
  let G = gradeOf(scores, hits, ruined);
  if (rightFix) G = lift(G);
  const ids = [...(F?.base || []), ...(addin ? [addin] : [])], t = tasteOf(ids);
  if (adjusted && ADJUST[adjusted]) for (const [k, v] of Object.entries(ADJUST[adjusted].taste)) t[k] += v;
  return { dish, grade: G.id, taste: t, draught: dishDraught(t, G) };
}
/** The draught a dish of this taste lays at a grade ({ feeling, strength, hold real s }), or null (dubious, or no feeling taste). */
export function dishDraught(t, G) {
  const lead = leadOf(t);
  if (!G || G.id === 'dubious' || !lead) return null;
  const loud = Math.min(1, (t[FEELING_TASTE[lead.feeling]] || 0) / 0.8); // (how loud the feeling is: an add-in's 0.8 is full; plain bread's starch a whisper)
  const strength = Math.min(1, G.strength * (1 + 0.25 * t.kokumi) * Math.max(0.2, loud));
  const hold = Math.round(DRINK_HOLD * G.hold * (1 + t.umami));
  return { feeling: lead.feeling, strength: +strength.toFixed(3), hold };
}
