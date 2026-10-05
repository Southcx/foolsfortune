// ---------------------------------------------------------------------------------------
// GRAIN: who a mind is (docs/plans/TEMPERAMENT.md; the owner, 2026-10-05; Espada's word: a clay body's grain is set before firing, and
// you work with it or against it). Five traits after the five-factor model of personality (OCEAN), each a dial from -1 to +1 between two
// plain poles: curious / wary, orderly / erratic, bold / shy, gentle / hostile, skittish / steady. A grain weights the mind (the Drives'
// per-creature traits, unchanged: `traitsOf`), opens it to one status (a mind is WEAK TO the damage type whose status its strongest
// trait invites: `susceptibility`), and is swayed by the place's mood (`sway`: a rate the minds drift by, never a jump). Grain is
// climate, mood is weather: an island's ego sets its species' mean, and each creature is drawn about it (`drawGrain`, seeded, so a
// creature's grain is the same on every machine). It shows in movement and posture only (Calissa's six body dials), never in colour.
// Data and pure functions; the minds are Petra's (creatures/ai/), the tells Calissa's and Wanda's, the reading the Veritome's.
//
// Prior art: the five-factor model (Costa and McCrae), used here as five dials with a long pedigree, not as psychology; Dwarf Fortress's
// personality facets and Rimworld's traits (a number that changes what a mind does); Pokemon's natures (a grain that tilts a creature);
// and Monster Hunter's weaknesses, read rather than memorised.
//
//   TRAITS [{ id, high, low, opens: status, type }]   SPECIES[kind] -> mean grain   drawGrain(kind, seed, spread?) -> { o, c, e, a, n }
//   susceptibility(grain, type) -> x0.6 .. x1.5   weakTo(grain) -> [type]   sway(aspect, strength) -> grain drift a second
//   traitsOf(grain) -> the Drives' traits ({ bold, social, greedy, lazy, curious, territorial, yielding, grudge, fearful, enrage })
//   poles(grain, read?) -> ['curious', 'bold', ...] (the bestiary's words; unread traits omitted)
// ---------------------------------------------------------------------------------------
import { seeded } from '../../core/rng.js';

/** The five, each with its two poles (Espada's plain words) and the status it opens the mind to (the type that builds it). */
export const TRAITS = [
  { id: 'o', name: 'openness',          high: 'curious', low: 'wary',    opens: 'blind',     type: 'illusion' },  // an open mind falls for what it sees
  { id: 'c', name: 'conscientiousness', high: 'orderly', low: 'erratic', opens: 'confusion', type: 'delirium' },  // order is what comes apart
  { id: 'e', name: 'extraversion',      high: 'bold',    low: 'shy',     opens: 'stun',      type: 'impact' },    // it charges onto the blow
  { id: 'a', name: 'agreeableness',     high: 'gentle',  low: 'hostile', opens: 'charm',     type: 'influence' },
  { id: 'n', name: 'neuroticism',       high: 'skittish', low: 'steady', opens: 'doubt',     type: 'ego' },
];
const BY_TYPE = Object.fromEntries(TRAITS.map((t) => [t.type, t]));

/** A species' mean grain (its island's ego's climate; LORE.md). The slip jellies were the boomtown's folk: bold and erratic. */
export const SPECIES = {
  slipjelly: { o: 0.2, c: -0.6, e: 0.7, a: -0.2, n: 0.3 },
  lanternwisp: { o: 0.5, c: 0.2, e: -0.3, a: 0.4, n: 0.4 }, // (a placeholder: the owner's baseline creature)
};
/** How far individuals stray from their species' mean (an Egregore, authored by no one, strays furthest). */
export const SPREAD = { figment: 0.35, egregore: 0.7 };

const clamp1 = (x) => (x < -1 ? -1 : x > 1 ? 1 : x);
const hashName = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

/** A creature's grain: its species' mean, each trait drawn about it (seeded by the species and the creature's seed). */
export function drawGrain(kind, seed = 1, spread = SPREAD.figment) {
  const mean = SPECIES[kind] || {}, r = seeded(hashName(`grain:${kind}:${seed}`)), g = {};
  for (const { id } of TRAITS) g[id] = (mean[id] || 0) + (r() + r() - 1) * spread * 0.5; // (two draws: a soft bell about the mean)
  const quirk = TRAITS[Math.floor(r() * TRAITS.length)].id; // (and one trait strays far: an individual differs visibly on one, Calissa's rule)
  g[quirk] += (r() < 0.5 ? -1 : 1) * spread * (1.2 + r());
  for (const { id } of TRAITS) g[id] = +clamp1(g[id]).toFixed(2);
  return g;
}

/** How fast a damage type's status builds on this mind: up to x1.5 when high in the trait it opens, down to x0.6 when low. */
export function susceptibility(grain = {}, type) {
  const t = BY_TYPE[type], v = t ? clamp1(grain[t.id] || 0) : 0;
  return v >= 0 ? 1 + 0.5 * v : 1 + 0.4 * v;
}
/** The damage types this mind is weak to (its traits above a half), strongest first: the bestiary's "Weak to". */
export const weakTo = (grain = {}) => TRAITS.filter((t) => (grain[t.id] || 0) > 0.5).sort((a, b) => grain[b.id] - grain[a.id]).map((t) => t.type);

/** The bestiary's words for a grain: the pole each trait leans to (a trait within a fifth of the middle says nothing; unread ones are left out). */
export const poles = (grain = {}, read = TRAITS.map((t) => t.id)) => TRAITS.filter((t) => read.includes(t.id) && Math.abs(grain[t.id] || 0) >= 0.2).map((t) => (grain[t.id] > 0 ? t.high : t.low));

/** The place's mood sways its minds (TEMPERAMENT.md): a drift per second toward a pole, by the weather's strength. A rate, never a jump. */
const SWAY = { dread: { n: 1 }, mirth: { a: 1 }, wonder: { o: 1 }, desire: { e: 1 }, grief: { e: -1 }, faith: { a: 0.5, n: -0.5 }, gall: { a: -1 }, fury: { a: -0.5, e: 0.5 } };
export const SWAY_RATE = 0.01; // (a full-strength weather moves a trait a hundredth a second: a spell of minutes leaves a mark, not a new mind)
export function sway(aspect, strength = 0) {
  const s = SWAY[aspect] || {}, out = {};
  for (const [k, v] of Object.entries(s)) out[k] = v * strength * SWAY_RATE;
  return out;
}

/** The Drives' per-creature traits (creatures/ai/drives.js rollTraits' shape: multipliers about 1), from a grain: the Brain and the
 *  reasoner read them unchanged (Petra). bold, social, greedy and lazy are the slip jelly's existing ones. */
export function traitsOf(g = {}) {
  const o = g.o || 0, c = g.c || 0, e = g.e || 0, a = g.a || 0, n = g.n || 0, m = (x) => +Math.max(0.3, 1 + x).toFixed(2);
  return {
    bold: m(0.4 * e - 0.3 * n), social: m(0.5 * e), greedy: m(0.3 * e - 0.2 * c), lazy: m(-0.4 * c),
    curious: m(0.5 * o), territorial: m(0.5 * c), yielding: m(0.5 * a), grudge: m(-0.5 * a), fearful: m(0.5 * n), enrage: m(-0.4 * n),
  };
}
