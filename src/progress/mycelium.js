// ---------------------------------------------------------------------------------------
// THE MYCELIUM: the Spirit Garden's fungi as master transmutators, and the great tree that eats what you give it (docs/plans/MYCELIUM.md;
// the owner and his wife, 2026-10-08: "mushrooms and fungal entities as master transmutators: put curios in a plot bed and have them
// break down or transform into new curios"; "a tree that you feed curios and drops to recycle items", "more routes to procure specific
// colour items"). Data and pure functions; the beds' places, the hand's verbs and the tree's planetoid are Petra's, their looks
// Calissa's, the names Espada's (the working names here are placeholders).
//
// Everything a fungus eats has a COLOUR SIGNATURE (a hue and a saturation on Soul Alchemy's wheel: a material its own, a curio the one
// its blurb paints, a fish its feeling's), and what a fungus gives back is coloured by what it ate. So the mycelium is a second road to
// a colour: not the Wells' luck of the draw, but a colour chosen, by what you feed it.
//
//   A SPORE BED (a bed a strain has colonised, its fairy ring drawn round it) works one verb, by its strain's feeling (the five phases' own verbs):
//     wonder (wood: growth)        GRAFT     two curios become one: the nearest curio to their mixed colour, a tier up when the two are
//                                            of one tier and near complements (the alchemists' coniunctio: opposites married), else the higher
//     mirth (fire: heat)           FERMENT   a material's colour deepens (saturation up: koji, a culture's slow heat)
//     desire (earth: keeping)      PRINT     anything becomes one spore print: a material of exactly its colour, its path one straight
//                                            pull (the mycologist's spore print, which names a mushroom by its colour)
//     grief (metal: letting go)    ROT       anything breaks down into materials of its colour, worth a share of it (decomposition)
//     dread (water: dissolving)    DISSOLVE  a material's colour washes toward grey (saturation down: the fog)
//   Spore beds in the GENERATING order next to each other (wonder, mirth, desire, grief, dread, round again) work faster; a bed next to the
//   one that OVERCOMES it works slower (SPIRIT-GARDEN.md section 1, the phases). What a bed gives waits in it, never spoils.
//
//   THE TREE (working name: the World Mushroom; Legend of Mana's Trent and its orchard, Yggdrasil, Eden's two trees, the Siberian
//   world tree under which the fly agaric grows): fed anything at its roots, it keeps the colour of all it has eaten as its SAP (the
//   centre of gravity of what it ate, each weighed by its worth), grows in GIRTH as it eats, and at each dawn fruits: materials of its sap's
//   colour, leaned toward the game day's feeling (Legend of Mana's days of the week). Its ten FRUITING BODIES (the Kabbalists' sephiroth) open
//   with its girth; its twenty-two BRANCHES between them open when a Major Arcana card is hung on each (the Golden Dawn's tarot on the Tree of
//   Life, the Veritome's twenty-two): a collection grows the tree.
//
// Prior art: Shin Megami Tensei's fusion chart (two in, one out, by a table you learn), Atelier's synthesis (an ingredient's properties
// carried into the product), Potion Craft's map (a mixture steered by what goes in), Legend of Mana's orchard (Trent fruits by the day of
// the week, by the seeds planted), Stardew Valley's mushroom cave and kegs (time turns a thing into a better thing), mycoremediation and
// the forest floor's decomposition, the spore print, koji, Newton's Opticks (a mixture is the centre of gravity of its parts).
//
//   SIGNATURE   signatureOf(item) -> { h, s, worth, tier }   STRAINS[feeling]   bedHours(feeling, neighbours) -> game hours
//   digest(feeling, inputs, seed) -> { ok, why?, out: [item] }   graftOf(a, b) -> curio id   TREE   sapAfter(sap, item) -> sap
//   fruit(tree, weekday, seed) -> { fruit: [material], sap }   treeGirth(fed) -> n   bodiesOpen(girth) -> n   WEEKDAY_FEELING   kindOfHue(h)
// ---------------------------------------------------------------------------------------
import { ECON } from './econ/table.js';
import { KINDS, makeMaterial, pullStep, distance } from './econ/materials.js';
import { CURIOS, CURIO_BY_ID } from '../world/treasure/treasure.js';
import { COLOR } from './weather.js';

const wrap = (h) => ((h % 360) + 360) % 360;
const hueOfHex = (hex) => { const r = ((hex >> 16) & 255) / 255, g = ((hex >> 8) & 255) / 255, b = (hex & 255) / 255, M = Math.max(r, g, b), m = Math.min(r, g, b), d = M - m;
  if (!d) return 0; const h = M === r ? ((g - b) / d) % 6 : M === g ? (b - r) / d + 2 : (r - g) / d + 4; return wrap(h * 60); };
/** The five feelings' hues (as Soul Alchemy's FEELING_HUE reads weather.js COLOR: one table for the five, Calissa's ruling 7). */
export const FEELING_HUE = Object.fromEntries(['wonder', 'mirth', 'desire', 'grief', 'dread'].map((f) => [f, Math.round(hueOfHex(COLOR[f]))]));

/** Each curio's colour, as its blurb paints it (hue in degrees, saturation 0..1). Placeholders until Calissa's models say otherwise. */
export const SIGNATURE = {
  whelk: { h: 195, s: 0.45 },     // a sea shell, blue-grey
  shaker: { h: 40, s: 0.25 },     // salt and old pewter
  keepsake: { h: 20, s: 0.5 },    // a knot of red twine
  barnacle: { h: 90, s: 0.3 },    // weed-green
  gull: { h: 185, s: 0.35 },      // pale blown glass
  compass: { h: 215, s: 0.6 },    // the current's blue
  bell: { h: 48, s: 0.75 },       // brass
  sconce: { h: 160, s: 0.55 },    // sea-glass green
  pearl: { h: 320, s: 0.2 },      // nacre's faint pink
  astrolabe: { h: 240, s: 0.65 }, // a night sky
  ammonite: { h: 30, s: 0.4 },    // fossil ochre
  amulet: { h: 0, s: 0.55 },      // iron, red rust
  skull: { h: 50, s: 0.85 },      // gilt
  regalia: { h: 110, s: 0.6 },    // reed green
  hourglass: { h: 35, s: 0.65 },  // sand
  storm: { h: 265, s: 0.8 },      // a bottled squall's violet
  lodestone: { h: 300, s: 0.9 },  // condensed Lachrymite
  orb: { h: 280, s: 0.95 },       // an oil slick, every colour (it reads as violet)
  bloom: { h: 275, s: 1.0 },      // blacklight
  koi: { h: 10, s: 0.9 },         // vermilion
  crown: { h: 70, s: 0.7 },       // the urn's slip-gold
};

/** A thing's colour signature, worth (cubes, `worthOf`'s rule) and tier: what a fungus or the tree reads of it. */
export function signatureOf(item) {
  if (!item) return null;
  const M = (n) => Math.round(n * ECON.perMinute);
  if (item.kind === 'material') return { h: item.hue, s: item.sat, worth: M(1 + (item.tier || 0)), tier: item.tier || 0 };
  if (item.kind === 'curio') { const c = CURIO_BY_ID[item.key] || CURIO_BY_ID[String(item.id || '').replace('curio.', '')]; const S = c && SIGNATURE[c.id]; return S ? { ...S, worth: ECON.curio[c.tier] || 0, tier: c.tier } : null; }
  if (item.kind === 'fish' && item.feeling) return { h: FEELING_HUE[item.feeling] ?? 0, s: 0.7, worth: ECON.fish[item.tier] || 0, tier: Math.min(4, item.tier || 0) };
  return null;
}

/** The strains: the verb each feeling works, how many game hours it takes, and what it eats. */
export const STRAINS = {
  wonder: { verb: 'graft', hours: 12, eats: ['curio'], pair: true },
  mirth: { verb: 'ferment', hours: 8, eats: ['material'] },
  desire: { verb: 'print', hours: 4, eats: ['material', 'curio', 'fish'] },
  grief: { verb: 'rot', hours: 6, eats: ['material', 'curio', 'fish'] },
  dread: { verb: 'dissolve', hours: 6, eats: ['material'] },
};
/** The numbers: rot gives back this share of a thing's worth; ferment and dissolve move saturation this far; a graft rises a tier when
 *  its two are at least this far apart on the wheel (`distance`, 0..1); the generating neighbour's and the overcoming neighbour's pace. */
export const MYCO = { rot: 0.6, ferment: 0.25, dissolve: 0.3, marry: 0.55, generating: 1.25, overcoming: 0.75, printTier: -1 };
const GEN = ['wonder', 'mirth', 'desire', 'grief', 'dread'];
const OVERCOMES = { wonder: 'desire', desire: 'dread', dread: 'mirth', mirth: 'grief', grief: 'wonder' }; // (SPIRIT-GARDEN.md section 1)

/** A spore bed's game hours, by its neighbours' strains: one generating it (the one before it in the cycle) speeds it, one overcoming it
 *  slows it (each counted once). Teaches the cycles by their effect, never by a chart. */
export function bedHours(feeling, neighbours = []) {
  let k = 1;
  const before = GEN[(GEN.indexOf(feeling) + 4) % 5];
  if (neighbours.includes(before)) k /= MYCO.generating;
  if (neighbours.some((n) => OVERCOMES[n] === feeling)) k /= MYCO.overcoming;
  return +(STRAINS[feeling].hours * k).toFixed(2);
}

/** The material kind whose stretch of the wheel a hue is nearest (so what the mycelium gives fits the press's ware ring). */
export function kindOfHue(h) {
  let best = 'edge', d = Infinity;
  for (const K of Object.values(KINDS)) { const mid = (K.hue[0] + K.hue[1]) / 2, half = (K.hue[1] - K.hue[0]) / 2, off = Math.max(0, Math.abs(((h - mid + 540) % 360) - 180) - half); if (off < d) { d = off; best = K.id; } }
  return best;
}
/** A material of exactly a colour: its kind the hue's, its path one straight pull (a print's) or its kind's own winding (a rot's). */
function materialOf(h, s, tier, seed, straight) {
  const m = makeMaterial(kindOfHue(h), seed, Math.max(0, Math.min(4, tier)));
  m.hue = +wrap(h).toFixed(1); m.sat = +Math.max(0, Math.min(1, s)).toFixed(2);
  if (straight) { const total = m.path.reduce((a, [sh]) => 1 - (1 - a) * (1 - sh), 0); m.path = [[+total.toFixed(4), 0]]; }
  return { ...m, of: m.kind, kind: 'material', id: `mat.${m.kind}` }; // (`of`: the material's own kind; `kind` the item's, as the Pneuka Box reads it)
}

/** The curio two curios graft into: the one nearest their mixed colour (each weighed by its worth), a tier up when the two are of one
 *  tier and near complements (`MYCO.marry`: a marriage of equals and opposites), else at the higher tier of the two. A table you can
 *  learn (SMT's), never a die. (Equals only: a cheap curio married to a dear one would mint a tier from nothing: the check's x1.62.) */
export function graftOf(a, b) {
  const A = signatureOf(a), B = signatureOf(b); if (!A || !B) return null;
  const w = A.worth / (A.worth + B.worth), mix = pullStep({ h: B.h, s: B.s }, { h: A.h, s: A.s }, w, 0);
  const up = A.tier === B.tier && distance(A, B) >= MYCO.marry, tier = Math.min(4, Math.max(A.tier, B.tier) + (up ? 1 : 0));
  const pool = CURIOS.filter((c) => c.tier === tier && c.chest !== false && SIGNATURE[c.id]);
  let best = null, d = Infinity;
  for (const c of pool) { const dd = distance(mix, SIGNATURE[c.id]); if (dd < d) { d = dd; best = c; } }
  return best ? `curio.${best.id}` : null;
}

/** What a spore bed of a strain gives for what was set in it (`inputs`: one thing, or two curios for a graft). Pure: the seed is the bed's. */
export function digest(feeling, inputs = [], seed = 1) {
  const S = STRAINS[feeling]; if (!S) return { ok: false, why: 'no strain' };
  const ins = inputs.filter(Boolean);
  if (S.pair ? ins.length !== 2 : ins.length !== 1) return { ok: false, why: S.pair ? 'a graft takes two curios' : 'one thing at a time' };
  if (ins.some((x) => !S.eats.includes(x.kind))) return { ok: false, why: `this strain eats ${S.eats.join(' and ')}` };
  const sig = signatureOf(ins[0]); if (!sig) return { ok: false, why: 'it has no colour to read' };
  if (S.verb === 'graft') { const id = graftOf(ins[0], ins[1]); return id ? { ok: true, out: [{ kind: 'curio', id }] } : { ok: false, why: 'they will not take' }; }
  if (S.verb === 'ferment' || S.verb === 'dissolve') {
    const m = { ...ins[0], path: ins[0].path.map((p) => [...p]) };
    m.sat = +Math.max(0, Math.min(1, m.sat + (S.verb === 'ferment' ? MYCO.ferment : -MYCO.dissolve))).toFixed(2);
    return { ok: true, out: [m] };
  }
  if (S.verb === 'print') return { ok: true, out: [materialOf(sig.h, sig.s, sig.tier + MYCO.printTier, seed, true)] };
  // rot: materials of the thing's colour, the dearest tier that fits first, until a share of its worth is spent
  const M = (n) => Math.round(n * ECON.perMinute); let left = sig.worth * MYCO.rot, k = 0; const out = [];
  for (let t = Math.min(4, sig.tier); t >= 0 && left >= M(1); ) {
    if (M(1 + t) <= left + 1e-9) { out.push(materialOf(sig.h + (k % 2 ? 8 : -8) * Math.ceil(k / 2), sig.s, t, seed + k * 31, false)); left -= M(1 + t); k++; } else t--;
  }
  return out.length ? { ok: true, out } : { ok: false, why: 'too little to break down' };
}

// ---------------------------------------------------------------- the tree

/** The game day's feeling, Legend of Mana's way (its days of the week each an element): five days one feeling each, then a FAIR day
 *  (the sap's own colour, unleaned) and a PRISMATIC day (one fruit at full saturation). `clockAt(ms).weekday` is 0..6. */
export const WEEKDAY_FEELING = ['wonder', 'mirth', 'desire', 'grief', 'dread', 'fair', 'prismatic'];
/** The tree's numbers: the lean toward the day's feeling; the worth a step of girth takes (doubling each step); its ten fruiting bodies,
 *  opened one a step of girth; its twenty-two branches between them;
 *  how much sap a fruit drinks (so the colour stays steerable: old meals fade as fruit is picked). */
export const TREE = { lean: 0.25, girthWorth: 64, bodies: 10, branches: 22, sapPerFruit: 0.12, fruitTier: [0, 0, 1, 1, 2, 2, 3, 3, 4, 4] };
export const treeGirth = (fed = 0) => Math.max(0, Math.floor(Math.log2(1 + fed / TREE.girthWorth)));
export const bodiesOpen = (girth) => Math.min(TREE.bodies, 1 + girth);

/** The sap after eating a thing: the mixture moved toward its colour by its share of all the sap's weight (Newton's centre of gravity). */
export function sapAfter(sap, item) {
  const g = signatureOf(item); if (!g) return sap;
  const mass = (sap?.mass || 0) + g.worth, c = sap?.mass ? pullStep({ h: sap.h, s: sap.s }, g, g.worth / mass, 0) : { h: g.h, s: g.s };
  return { h: +c.h.toFixed(1), s: +c.s.toFixed(3), mass: +mass.toFixed(1) };
}

/** A dawn's fruit: one a fruiting body open (and one more a branch hung to `fruit`), each a material of the sap's colour leaned toward the day's
 *  feeling, of the tier its body bears; a prismatic day bears one fruit at full saturation; the sap is drunk a little a fruit. */
export function fruit(tree, weekday = 0, seed = 1) {
  const sap = tree.sap; if (!sap?.mass) return { fruit: [], sap };
  const day = WEEKDAY_FEELING[((weekday % 7) + 7) % 7], n = bodiesOpen(treeGirth(tree.fed || 0)) + (tree.branches?.fruit || 0);
  const out = []; let s = { ...sap };
  for (let i = 0; i < n && s.mass > 0; i++) {
    let c = { h: s.h, s: s.s };
    if (FEELING_HUE[day] != null) c = pullStep(c, { h: FEELING_HUE[day], s: 0.9 }, TREE.lean, 0);
    if (day === 'prismatic' && i === 0) c = { h: c.h, s: 1 };
    out.push(materialOf(c.h, c.s, TREE.fruitTier[Math.min(i, TREE.bodies - 1)], seed + i * 97, true));
    s = { ...s, mass: +(s.mass * (1 - TREE.sapPerFruit)).toFixed(1) };
  }
  return { fruit: out, sap: s };
}
