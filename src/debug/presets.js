// ---------------------------------------------------------------------------------------
// THE PRESETS (docs/plans/DEBUG-MODE.md 5): a moment of play written as data, loaded into the DEBUG save to start a test there. Data
// only, Dovina's; the loader is Petra's (src/debug/). Choosing one (on the title under DEBUG, in QAIS, or `/preset <id>`) wipes the
// DEBUG save's `player` and `world`, writes the preset, and sets you down at its place. Because achievements, knacks, rungs, moves,
// Firings and Functions are all predicates over the ledger, writing the counts is the whole of it: no flag per system, and a preset
// written today stays right as systems are added (OSRS's retroactivity).
// Prior art: a fighting game's training-mode states and Celeste's chapter select (a moment, not a save); a debug chest's kit
// (debug/kits.js), whose item format a preset's `kit` shares.
//
//   PRESETS[id] = {
//     label, for                 the row's name and what it is for (shown beside it, as a debug chest's `for`)
//     at                         a place id (game.places: 'workshop', 'well.mouth', 'shore', 'raceway', 'strawmanwell' ...)
//     ledger: { key: n }         counters, written with `inc` (the ledger's own keys: exp.<domain>, well.floor, cut.hit ...)
//     best: { key: n }           records, written with `hi`
//     kit: [[id, n, data?]]      items into the Pneuka Box (debug/kits.js's format)
//     belt: { main, sub }        the two tools worn (belt ids), after the kit is given
//     cubes                      the balance set (not added)
//     lend: { id: bool }         the lend panel's rows it sets (progress/lend.js LENDS); the rest are set off
//     tests: ['T<n>']            the QAIS tests that name it (a test's `preset: id`)
//   }
// Every write is marked (`first('debug.preset.<id>')`) and counts nothing toward the STORY save (DEBUG-MODE.md 2).
// ---------------------------------------------------------------------------------------
import { DOMAINS, expAt } from '../progress/domains.js';

const TOOLS = ['psygun', 'sondelass', 'soulbrush', 'veritome', 'dreamvane', 'crucibelle', 'lockheart'];
const KINDS = ['eldritch', 'arcane', 'finery', 'mechanism', 'edge', 'art', 'provision']; // (materials.js KIND_IDS: a material of each kind, the debug kits' format)
const mats = (count, tier) => KINDS.map((k) => [`mat.${k}`, count, { tier }]);
const allTools = () => TOOLS.map((t) => [`tool.${t}`, 1]);
const everyDomain = (level) => Object.fromEntries(Object.keys(DOMAINS).map((d) => [`exp.${d}`, expAt(level)]));

export const PRESETS = {
  fresh: {
    label: 'Fresh', for: 'nothing done, nothing lent: STORY\'s rules in the DEBUG save, to test an unlock path from the start',
    at: 'workshop', ledger: {}, kit: [], cubes: 0, lend: {},
  },
  everything: {
    label: 'Everything lent', for: 'today\'s DEBUG: every category lent, the whole kit, 10,000 cubes (the Summit and Achievements off, so levels and titles still read true)',
    at: 'workshop', ledger: {}, kit: [...allTools(), ['bottle.large', 2], ['whistle.wake', 2]], belt: { main: 'sondelass', sub: 'psygun' }, cubes: 10000,
    lend: { arts: true, godArts: true, knacks: true, moves: true, functions: true, shrines: true, garden: true, sea: true, siblings: true, feelings: true, glazes: true, codex: true, shells: true, racing: true, spreads: true, classArts: true, mimicry: true, figmentTelegraphs: true },
  },
  domainsMid: {
    label: 'Every domain at 50', for: 'the domain ladder half climbed, earned not lent: rungs at 10 and 30, the powers to 50, the 40 and 50 traits open (DOMAINS.md 18); the Codex\'s GOD ARTS pages',
    at: 'workshop', ledger: everyDomain(50), kit: allTools(), belt: { main: 'psygun', sub: 'lockheart' }, cubes: 2000, lend: {},
  },
  domainsTop: {
    label: 'Every domain at 80', for: 'the depth rungs at 60, the 70 traits and the epic miracles earned (True Odds, Borrow a Verb and the 90s not built yet): the late ladder without the Summit lend',
    at: 'workshop', ledger: everyDomain(80), kit: allTools(), belt: { main: 'psygun', sub: 'lockheart' }, cubes: 5000, lend: {},
  },
  gardenFiring2: {
    label: 'The second firing', for: 'Soul Alchemy past its first firing: one attribute at rank 1, twenty materials pressed, a press of each kind to hand; set down in the Spirit Garden by the Dantian, the press a hop away',
    at: 'garden', ledger: { 'alchemy.press': 20, 'alchemy.fire': 1, 'alchemy.true': 1 }, best: { 'alchemy.rank.willpower': 1 },
    kit: [...mats(3, 1), ...mats(1, 2)], belt: { main: 'soulbrush', sub: 'dreamvane' }, cubes: 1500, lend: { garden: true },
  },
  entropolisOpen: {
    label: 'Entropolis reckoned', for: 'the route to Entropolis (the Queen\'s locked node) reckoned past its opening line (0.6: RECKON.open), at the jetty\'s end with the sloop moored',
    at: 'jetty', ledger: { 'emocean.hop': 2 }, best: { 'emocean.reckon.anagami-entra': 65 },
    kit: [['tool.dreamvane', 1], ['tool.psygun', 1]], belt: { main: 'psygun', sub: 'dreamvane' }, cubes: 2500, lend: {},
  },
  dunemawReturn: {
    label: 'Back at the Great Dunemaw', for: 'a Courier who has been down three times and beaten its FOE once: the mouth with a Wake Whistle and bottles',
    at: 'well.mouth', ledger: { 'well.floor': 9, 'well.foe': 1, 'cut.hit': 300, 'kick.hit': 40 }, best: { 'well.depth': 3, 'well.foe.cls': 2 },
    kit: [['tool.sondelass', 1], ['tool.psygun', 1], ['whistle.wake', 1], ['bottle.medium', 2]], belt: { main: 'sondelass', sub: 'psygun' }, cubes: 3000, lend: {},
  },
};
