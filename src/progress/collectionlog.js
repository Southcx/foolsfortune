// ---------------------------------------------------------------------------------------
// THE COLLECTION LOG (docs/plans/COLLECTION-LOG.md; South, 2026-10-27: "determine what else we can fold in"): one page of everything
// there is to find, catch, see or learn in every module, each a slot that fills the first time the thing happens, read straight from
// the ledger (a predicate, never a flag: CLAUDE.md), with a module's N of M and the whole game's share. It pays nothing by itself: the
// achievements over it do (logachievements.js), in titles and standing, never power.
//
// Prior art: Old School RuneScape's collection log (a slot fills on the first drop, no turn-in, a count a tab), Yakuza 0's completion
// list (a share a module, so every minigame is part of one whole), FFXIV's Orchestrion and Triple Triad lists, the Pokedex.
//
//   LOG_SECTIONS [{ id, label, slots: [{ id, label }], has(L, slotId) }]   worldSections(vantages, shrines)   logOf(L, extra?) -> [{ id, label, got, of, frac, slots: [{ id, label, got }] }]
//   logShare(L, extra?) -> 0..1 (each module weighed alike: one finished section is worth as much as another)   ENOUGH (the line called enough)
// ---------------------------------------------------------------------------------------
import { SPECIES as FISH } from '../tools/sondelass/angling/species.js';
import { EGREGORES } from './opensea/safari.js';
import { CARDS } from '../tools/veritome/cards.js';
import { ASPECTS, AGATES } from './weather.js';
import { GOD_POWERS, EPICS } from './godpowers.js';
import { SONGS } from '../tools/crucibelle/songs.js';
import { FUNCTIONS } from '../tools/veritome/mind/functions.js';
import { SPREADS } from './spreads.js';
import { SET_PIECES } from './rail/crossing.js';
import { SHIP_PARTS, PART_SLOTS } from './opensea/salvage.js';
import { STRAINS } from './mycelium.js';
import { DECOR } from './decor.js';
import { SECRETS } from './opensea/islets.js';
import { HABITS } from './opensea/habits.js';
import { FOE_SKILLS } from './duel/foeskills.js';
import { SECRETS as ABERRANT_SECRETS } from './duel/secrets.js';
import { DUEL_POWERS } from './duel/powers.js';
import { LEARNED, isLearned } from './duel/learned.js';

/** A plain label from an id until a table gives one (camelCase and dots to words). */
const words = (id) => String(id).replace(/[._]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
const rows = (obj, label = (v, k) => v?.label || v?.name || words(k)) => Object.entries(obj).map(([k, v]) => ({ id: k, label: label(v, k) }));
const counted = (key) => (L, id) => L.get(`${key}.${id}`) > 0;

/** Every section: its slots and how one is had. The order is the Codex shelf's. */
export const LOG_SECTIONS = [
  { id: 'fish', label: 'Fish', slots: FISH.map((s) => ({ id: s.id, label: s.name })), has: counted('fish.sp') },
  { id: 'cards', label: 'Cards', slots: CARDS.map((c) => ({ id: c.id, label: c.name || words(c.id) })), has: counted('card.got') },
  { id: 'habits', label: 'Habits at sea', slots: Object.entries(HABITS).flatMap(([sp, hs]) => hs.map((h) => ({ id: `${sp}.${h.id}`, label: `${words(sp)}: ${h.label}` }))), has: counted('sea.habit') },
  { id: 'herds', label: 'Herds at sea', slots: rows(EGREGORES, (v, k) => words(k)), has: counted('sea.herd') },
  { id: 'feelings', label: 'Feelings awakened', slots: ASPECTS.map((a) => ({ id: a, label: words(a) })), has: counted('feeling.known') },
  { id: 'weathers', label: 'Weathers seen', slots: [...ASPECTS.map((a) => ({ id: a, label: words(a) })), ...rows(AGATES, (v, k) => words(k))], has: (L, id) => L.get(`weather.seen.${id}`) > 0 || L.get(`weather.agate.${id}`) > 0 },
  { id: 'powers', label: 'God powers', slots: rows(GOD_POWERS), has: (L, id) => L.has(`god.power.${id}`) || L.get(`god.power.${id}`) > 0 },
  { id: 'epics', label: 'Epic miracles', slots: rows(EPICS), has: counted('god.epic') },
  { id: 'songs', label: 'Songs', slots: rows(SONGS), has: counted('song') },
  { id: 'functions', label: 'Functions', slots: rows(FUNCTIONS), has: counted('reprogram.fn') },
  { id: 'spreads', label: 'Spreads laid', slots: rows(SPREADS), has: counted('spread.complete') },
  { id: 'setpieces', label: 'Crossings', slots: rows(SET_PIECES, (v, k) => words(k)), has: counted('rail.setpiece') },
  { id: 'parts', label: 'Ship parts', slots: PART_SLOTS.flatMap((s) => Object.entries(SHIP_PARTS[s]).filter(([k]) => k !== 'stock').map(([k, v]) => ({ id: k, label: v.name }))), has: counted('ship.part') },
  { id: 'secrets', label: 'Islet secrets', slots: rows(SECRETS, (v, k) => words(k)), has: counted('sea.secret') },
  { id: 'strains', label: 'Strains', slots: rows(STRAINS), has: counted('spore.learn') },
  { id: 'decor', label: 'Decor sets', slots: [...new Set(Object.values(DECOR).map((d) => d.set).filter(Boolean))].map((s) => ({ id: s, label: words(s) })), has: counted('decor.set') },
  // the aberrants (ABERRANTS.md; PUZZLE-DUELS.md 26.3): each foe skill met in a duel that counted, each aberrant's secret won; and each duel power cast
  { id: 'aberrants', label: 'Aberrants', slots: [...rows(FOE_SKILLS).map((r) => ({ id: `skill.${r.id}`, label: r.label })), ...Object.entries(ABERRANT_SECRETS).map(([k, v]) => ({ id: `secret.${k}`, label: `${v.of}'s secret` })), { id: 'shiny', label: 'A shiny aberrant' }] /* (named by whose, never what: the log must not give a secret away) */,
    has: (L, id) => (id === 'shiny' ? L.get('duel.won.shiny') > 0 : id.startsWith('skill.') ? L.get(`duel.foe.${id.slice(6)}`) > 0 : L.get(`duel.secret.${id.slice(7)}`) > 0) },
  // the skills learned from aberrants (duel/learned.js): each a slot, filled when learned (its secret found, or 5 beaten at the Line)
  { id: 'learned', label: 'Learned skills', slots: Object.keys(LEARNED).map((id) => ({ id, label: DUEL_POWERS[id]?.label || id })), has: (L, id) => isLearned(id, L) },
  { id: 'duelpowers', label: 'Duel powers', slots: rows(DUEL_POWERS), has: counted('duel.power') },
].filter((s) => s.slots.length);

/** The line called enough (Yakuza's list asks for less than all): a section at this share counts as done for the whole's sake. */
export const ENOUGH = 0.8;

/** The world's sections, made from its own lists by whoever holds them (the Codex: world/vantages.js, world/shrines.js), so these rules
 *  stay pure (no scene, no textures): `worldSections(VANTAGES, SHRINES)`. */
export const worldSections = (vantages = [], shrines = []) => [
  { id: 'vantages', label: 'Vantage points', slots: vantages.map((v) => ({ id: v.id, label: v.name })), has: (L, id) => L.has(`vantage.${id}`) },
  { id: 'shrines', label: 'Shrines', slots: shrines.map((s) => ({ id: s.id, label: s.name })), has: counted('shrine.found') },
].filter((s) => s.slots.length);

/** The log as the ledger has it: each section's slots had, its count and share (`extra`: the world's sections, worldSections). */
export function logOf(L, extra = []) {
  return [...LOG_SECTIONS, ...extra].map((S) => {
    const slots = S.slots.map((s) => ({ ...s, got: !!S.has(L, s.id) })), got = slots.filter((s) => s.got).length;
    return { id: S.id, label: S.label, got, of: slots.length, frac: got / slots.length, slots };
  });
}

/** The whole game's share: each section weighed alike, a section past ENOUGH counted whole. */
export function logShare(L, extra = []) {
  const log = logOf(L, extra); return log.reduce((n, s) => n + Math.min(1, s.frac / ENOUGH), 0) / log.length;
}
