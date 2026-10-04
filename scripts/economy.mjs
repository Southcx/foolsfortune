// ---------------------------------------------------------------------------------------
// THE ECONOMY SIMULATOR: four ways to spend an hour (the FIGHTER, the MINER, the PHOTOGRAPHER, the GAMBLER) played against the same
// table the game reads (src/progress/econ/table.js, src/world/treasure/treasure.js), before and after the R38 rebalance, so a change to a number is seen as
// cubes an hour before it is played. The rates of play (how many jellies a minute a fighter bursts, how often a roll of film is
// developed) are assumptions, written out in PLAY below and measured against the F3 panel's econ line (src/progress/econ/economy.js) as the
// game is played: when the two disagree, fix PLAY here, then the table.
//
// Prior art: Machinations (Dormans & Adams: an economy run as a diagram before it is played), and the spreadsheets every live game
// keeps of "gold per hour by activity" (OSRS's money-making guide is the players' own: a wiki table of activities by gp/h).
//
//   node scripts/economy.mjs            the table: cubes an hour by profile, before and after, the Tithe's expected return, the mastery dividend
// ---------------------------------------------------------------------------------------
import { ECON } from '../src/progress/econ/table.js';
import { TIERS, rollTier, curiosOf } from '../src/world/treasure/treasure.js';

// the numbers as they stood before R38 (git: src/tools/veritome/cards.js, ceremony.js, the outcome and crystal formulas, weir.js)
const OLD = {
  perMinute: ECON.perMinute,
  jelly: { burst: 6, core: 3 },
  crystal: { base: 8, perSize: 10 },
  condense: { SS: 1200, S: 600, A: 260, B: 120, C: 70, D: 45, E: 30, F: 20, G: 12, H: 6 },
  dupe: [12, 35, 100, 280, 900],
  lockheart: { cubes: 18 },
  tithe: { cost: 25 },
  chest: [[4, 9], [14, 26], [40, 70], [120, 200], [400, 700]],
  treasury: { respawn: [30, 30, 30, 30, 30], debug: 30 },
};

// how an hour of each kind of play goes (assumptions: see the header)
const PLAY = {
  fighter: { jellies: 1.2, zandatsu: 0.25, stash: 1.5 },       // a minute: jellies burst, cores taken, cubes a jelly had swallowed
  miner: { crystals: 18, size: 1.0, ring: 0.5, walk: 70,       // the formations, their mean size, share rung by the fork, s between them
    fragile: 0.25, sweet: { dense: 0.4, fragile: 0.15 } },     // (R39) the share of them fragile, and how often she opens each kind at its sweet spot
  photographer: { rollMin: 6, spares: [['G', 1.4], ['E', 0.6], ['D', 0.3], ['B', 0.12], ['F', 0.2]] }, // a roll each rollMin, spare copies a roll by rank
  treasury: { camp: true },                                     // stands at the Weir's five plinths and opens each as it shuts again
  angler: { catchMin: 2.5, mix: [0, 0.57, 0.21, 0.19, 0.03] },  // a fish landed every catchMin minutes, by tier (the species' rarity), sold to Grog
  completionist: { playPerDay: 2, checkInEvery: 24, farmRate: 480, mastered: [1, 3, 5, 10, 20] }, // hours played a day, hours between
  // collections, what farming one encounter by hand pays an hour (the aim, until there are encounters), how many encounters are mastered
};

const mean = ([a, b]) => (a + b) / 2;
const perHour = (E) => {
  const out = {};
  const f = PLAY.fighter;
  out.fighter = 60 * (f.jellies * (E.jelly.burst + f.stash) + f.zandatsu * (E.jelly.core + f.stash));
  const m = PLAY.miner, C = E.crystal;
  // (from R39 a formation pays by its nature, and many times over at its sweet spot: world/dunes/crystaltuning.js)
  const by = (kind) => (1 - m.sweet[kind]) * C.kind[kind] + m.sweet[kind] * C.sweet[kind];
  const ear = C.kind ? (1 - m.fragile) * by('dense') + m.fragile * by('fragile') : 1;
  const worth = (C.base + m.size * C.perSize) * (1 + m.ring) * ear;
  const cycle = Math.max(m.crystals * m.walk, 186); // (a formation regrows in 186 s, crystals.js; the round is the walk)
  out.miner = 3600 / cycle * m.crystals * worth;
  const p = PLAY.photographer;
  out.photographer = 60 / p.rollMin * (p.spares.reduce((a, [r, n]) => a + n * E.condense[r], 0) - (E.goods ? E.goods['mat.film'] * E.perMinute : 0)); // (less a roll of film each, from R38)
  const a = PLAY.angler;
  out.angler = E.fish ? 60 / a.catchMin * a.mix.reduce((s, p, t) => s + p * E.fish[t], 0) : 0; // (before R38 a fish came apart into Lachryma: no cubes)
  out.treasury = TIERS.reduce((a, t, i) => a + 3600 / Math.max(E.treasury.respawn[i], 20) * mean(E.chest[i]), 0);
  return out;
};

/** The Tithe, pulled n times with its pity and its dupes: what comes back for each cube put in. */
function tithe(E, n = 200000) {
  const since = { rare: 0, epic: 0, prismatic: 0 }, owned = new Set();
  let back = 0;
  for (let i = 0; i < n; i++) {
    const t = rollTier(since);
    since.rare = t >= 2 ? 0 : since.rare + 1; since.epic = t >= 3 ? 0 : since.epic + 1; since.prismatic = t >= 4 ? 0 : since.prismatic + 1;
    const [a, b] = E.chest[t]; back += Math.round(a + (b - a) * Math.random());
    if (Math.random() < TIERS[t].curioP) {
      const pool = curiosOf(t), c = pool[Math.floor(Math.random() * pool.length)].id;
      if (owned.has(c)) back += E.dupe[t]; else owned.add(c);
    }
  }
  return back / (n * E.tithe.cost);
}

const aim = ECON.perMinute * 60;
const before = perHour(OLD), after = perHour(ECON);
const pad = (s, n) => String(s).padEnd(n), num = (v) => Math.round(v).toLocaleString('en').padStart(9);
console.log(`cubes an hour (aim ${aim}: ${ECON.perMinute} a minute of ordinary play)\n`);
console.log(`${pad('profile', 14)}${'before'.padStart(9)}${'after'.padStart(9)}   x aim`);
for (const k of Object.keys(after)) console.log(`${pad(k, 14)}${num(before[k])}${num(after[k])}   ${(after[k] / aim).toFixed(2)}`);
const tb = tithe(OLD), ta = tithe(ECON);
console.log(`\nthe Tithe returns ${(tb * 100).toFixed(0)}% of what it takes before, ${(ta * 100).toFixed(0)}% after (pity and dupes counted; the curio is the rest of the prize)`);
console.log(`a gambler with an hour's fighting (${Math.round(after.fighter)}) pulls ${Math.floor(after.fighter / ECON.tithe.cost)} sealed chests and keeps ~${Math.round(after.fighter * ta)} cubes of it`);

// the mastery dividend (ECON.dividend): what green logs pay on their own, per hour actually played, with the Garden's slots and without
const D = ECON.dividend, C = PLAY.completionist;
const perDay = (k) => k * D.share * C.farmRate * Math.min(C.checkInEvery, D.capHours) * (24 / C.checkInEvery);
console.log(`\nthe mastery dividend (share ${D.share}, fills in ${D.capHours} h, ${D.slots} slots; ${C.playPerDay} h played a day, collected every ${C.checkInEvery} h)`);
console.log(`${pad('mastered', 14)}${'slotted'.padStart(9)}${'x aim'.padStart(8)}${'unslotted'.padStart(11)}${'x aim'.padStart(8)}   (cubes-equivalent an hour played)`);
for (const k of C.mastered) {
  const a = perDay(Math.min(k, D.slots)) / C.playPerDay, b = perDay(k) / C.playPerDay;
  console.log(`${pad(k, 14)}${num(a)}${(a / aim).toFixed(2).padStart(8)}${num(b).padStart(11)}${(b / aim).toFixed(2).padStart(8)}`);
}
