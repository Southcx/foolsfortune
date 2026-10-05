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
//   node scripts/economy.mjs            cubes an hour by profile (before and after R38), mixed profiles, the Tithe's return and its odds as
//                                       met, the curio curve under the deck, the Lockheart per opening, the mastery dividend, achievement points
// ---------------------------------------------------------------------------------------
import { ECON } from '../src/progress/econ/table.js';
import { TIERS, rollTier, curiosOf } from '../src/world/treasure/treasure.js';
import { deckHit, nextOfDeck, deckMean } from '../src/progress/econ/deck.js';
import { consolidated } from '../src/progress/econ/odds.js';
import { HEARTS, KEYS, OUTCOMES, CONVERT, CATCH, catchOdds, oddsOf, rates, keyLife } from '../src/tools/lockheart/table.js';
import { readFileSync } from 'node:fs';
import { buskPay, commissionPay, potPay, bountyPay } from '../src/progress/econ/livelihoods.js';
import { NODES, CLASSES, hop, stagePlan, stageQuality, reckonLead, RECKON } from '../src/progress/econ/emocean.js';
import { wellPay, cogitomapWorth, demand, fuel, haulProfit, spillChance, crudeRun, wellYield, drawWell, islandRun, wellSeed, purserPrice } from '../src/progress/econ/islands.js';
import { KIND_IDS, makeMaterial, press, distance } from '../src/progress/econ/materials.js';

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
  // the livelihoods not built yet (ECONOMY.md): how an hour of each might go, at three levels of play (accuracy, or a well-made thing)
  busker: { songMin: 3, set: 10 },                               // three-minute songs, a set of ten different ones before any repeat
  slayer: { cls: 1, minutesEach: 8, speed: [1.3, 0.5] },        // Barracuda commissions, eight minutes each for an ordinary hunter; a
                                                                 // hunter at accuracy a takes minutesEach x (speed[0] - speed[1] x a)
  potter: { minutesEach: 3, prestige: 'stoneware' },             // a pot thrown, glazed and fired in three minutes
  diver: { floors: 5, foes: 1, minutesPerFloor: 5 },             // a Well run: five floors, one FOE, five minutes a floor
  hauler: { units: 12, worth: 30, distance: 4, hopMin: 12 },      // a hold of twelve things worth 30 each, four units away, twelve minutes a hop
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
  const since = { rare: 0, epic: 0, prismatic: 0 }, owned = new Set(), drawn = [0, 0, 0, 0, 0];
  let back = 0;
  for (let i = 0; i < n; i++) {
    const t = rollTier(since);
    since.rare = t >= 2 ? 0 : since.rare + 1; since.epic = t >= 3 ? 0 : since.epic + 1; since.prismatic = t >= 4 ? 0 : since.prismatic + 1;
    const [a, b] = E.chest[t]; back += Math.round(a + (b - a) * Math.random());
    // (from the deck rule: whether a chest holds a curio is a deck of E.curioDeck[t], and which one a deck of its tier's four)
    const hit = E.curioDeck ? deckHit(E.curioDeck[t], drawn[t]) : Math.random() < TIERS[t].curioP;
    if (E.curioDeck) drawn[t] = hit ? 0 : drawn[t] + 1;
    if (hit) {
      const pool = curiosOf(t);
      const c = E.curioDeck ? nextOfDeck(pool, (x) => owned.has(x.id)).id : pool[Math.floor(Math.random() * pool.length)].id;
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
const capH = D.capDays; // (a game day is a real hour: DESIGN.md section 17)
const perDay = (k) => k * D.share * C.farmRate * Math.min(C.checkInEvery, capH) * (24 / C.checkInEvery);
console.log(`\nthe mastery dividend (share ${D.share}, fills in ${capH} h (a game day), ${D.slots} slots; ${C.playPerDay} h played a day, collected every ${C.checkInEvery} h)`);
console.log(`${pad('mastered', 14)}${'slotted'.padStart(9)}${'x aim'.padStart(8)}${'unslotted'.padStart(11)}${'x aim'.padStart(8)}   (cubes-equivalent an hour played)`);
for (const k of C.mastered) {
  const a = perDay(Math.min(k, D.slots)) / C.playPerDay, b = perDay(k) / C.playPerDay;
  console.log(`${pad(k, 14)}${num(a)}${(a / aim).toFixed(2).padStart(8)}${num(b).padStart(11)}${(b / aim).toFixed(2).padStart(8)}`);
}

// mixed profiles: livelihoods played together where they share a place (the Weir's treasury stands by the angler's water; the dunes'
// jellies roam the miner's formations, taken at half the fighter's rate). DESIGN.md section 7: is 2x the aim meant?
console.log(`\nmixed profiles (livelihoods in the same place, played together)`);
for (const [name, v] of [['angler + treasury', after.angler + after.treasury], ['miner + half fighter', after.miner + after.fighter / 2]])
  console.log(`${pad(name, 24)}${num(v)}   ${(v / aim).toFixed(2)} x aim${v / aim > 1.5 ? '   (over the 1.5x cap)' : ''}`);

// the Tithe's odds as they are met (src/progress/econ/odds.js), beside the weights the console publishes
const cons = consolidated(), wsum = TIERS.reduce((a, t) => a + t.weight, 0);
console.log(`\nthe Tithe's odds: published weight -> as met (pity and the epic pity's prismatic counted)`);
console.log(TIERS.map((t, i) => `${t.name} ${(t.weight / wsum * 100).toFixed(1)}% -> ${(cons[i] * 100).toFixed(1)}%`).join('   '));

// the curio curve under the deck rule: median Tithe pulls until each tier's set of four is complete (it should rise with rarity)
function curioCurve(E, runs = 2000) {
  const at = [[], [], [], [], []], all = [];
  for (let k = 0; k < runs; k++) {
    const since = { rare: 0, epic: 0, prismatic: 0 }, owned = new Set(), drawn = [0, 0, 0, 0, 0], done = [0, 0, 0, 0, 0];
    let n = 0;
    while (owned.size < 20 && n < 20000) {
      n++; const t = rollTier(since);
      since.rare = t >= 2 ? 0 : since.rare + 1; since.epic = t >= 3 ? 0 : since.epic + 1; since.prismatic = t >= 4 ? 0 : since.prismatic + 1;
      const hit = E.curioDeck ? deckHit(E.curioDeck[t], drawn[t]) : Math.random() < TIERS[t].curioP;
      if (E.curioDeck) drawn[t] = hit ? 0 : drawn[t] + 1;
      if (hit) {
        const pool = curiosOf(t), fresh = pool.filter((x) => !owned.has(x.id));
        const from = fresh.length && Math.random() < 0.85 ? fresh : pool; // (before: an 85% lean to the ones not held)
        const c = E.curioDeck ? nextOfDeck(pool, (x) => owned.has(x.id)) : from[Math.floor(Math.random() * from.length)];
        owned.add(c.id);
      }
      for (let i = 0; i < 5; i++) if (!done[i] && curiosOf(i).every((c) => owned.has(c.id))) done[i] = n;
    }
    done.forEach((v, i) => at[i].push(v)); all.push(n);
  }
  const med = (a) => { a = [...a].sort((x, y) => x - y); return a[a.length >> 1]; };
  return { sets: at.map(med), all: med(all) };
}
const cb = curioCurve({}), ca = curioCurve(ECON);
console.log(`\nthe curio curve: median Tithe pulls to complete each tier's four (common .. prismatic), and all twenty`);
console.log(`${pad('before (chance)', 18)}${cb.sets.map((v) => String(v).padStart(6)).join('')}   all ${cb.all}`);
console.log(`${pad('after (the deck)', 18)}${ca.sets.map((v) => String(v).padStart(6)).join('')}   all ${ca.all}   (decks ${ECON.curioDeck.join(' / ')}: a curio certain within that many chests of the tier, ${ECON.curioDeck.map((n) => deckMean(n)).join(' / ')} on average)`);

// the Lockheart: what an opening is worth, by coffin and keys (power 1: a coffin filled once). Cubes-equivalent counts the CUBES outcome
// and the chest's cubes; the rest are effects in a fight, so the jackpot's chance is shown beside it. A key's price is Raku's list.
const chestCubes = (power) => { let v = 0; for (let i = 0; i < 2000; i++) { const t = Math.min(4, Math.floor(1 + Math.random() * 1.6 * power)); v += (ECON.chest[t][0] + ECON.chest[t][1]) / 2; } return v / 2000; };
const worthOf = { cubes: ECON.lockheart.cubes, chest: chestCubes(1) };
const keyPrice = (ids) => ids.reduce((a, id) => a + Math.round(ECON.goods[id] * ECON.perMinute * ECON.haggle.list), 0);
console.log(`\nthe Lockheart, an opening at power 1 (jackpot capped at ${ECON.lockheart.jackpotCap * 100}%): jackpot chance, cubes-equivalent, keys' list price`);
for (const h of Object.keys(HEARTS)) for (const keys of [['key.brass'], ['key.invert'], ['key.even'], ['key.loaded'], ['key.loaded', 'key.loaded']]) {
  const R = rates(oddsOf(h, keys).table), jp = R.filter((r) => OUTCOMES[r.id]?.rank === 4).reduce((a, r) => a + r.p, 0);
  const cubes = R.reduce((a, r) => a + r.p * (worthOf[r.id] || 0), 0);
  console.log(`${pad(h.slice(6), 10)}${pad(keys.map((k) => k.slice(4)).join('+'), 15)}${(jp * 100).toFixed(1).padStart(6)}%${cubes.toFixed(0).padStart(7)} cubes${String(keyPrice(keys)).padStart(6)} for the keys`);
}

// the achievements: how the points are spread by tier (read from the source: the circuits' and the species' loops are counted once)
const src = readFileSync(new URL('../src/progress/achievements.js', import.meta.url), 'utf8');
const tierOf = [...src.matchAll(/^\s*[CHSF]\((?:'[^']*'|`[^`]*`), '[a-z]+', '[^']+', ([1-6]),/gm)].map((m) => +m[1]);
const byTier = [1, 2, 3, 4, 5, 6].map((t) => tierOf.filter((x) => x === t).length);
console.log(`\nthe achievements: ${tierOf.length} written entries by tier (Easy .. Grandmaster): ${byTier.join(' / ')}; ${byTier.reduce((a, n, i) => a + n * (i + 1), 0)} points (the loops over circuits and species add more)`);

// the Lockheart's conversion (not built: SYSTEMS.md C4): what a coffin of Lachryma turns into, by key, against what the key costs
console.log(`\nconversion (not built): expected cubes over a key's life (it lasts ${keyLife('key.loaded').toFixed(1)} openings on average; brass 1), at power 1 (full) and 2 (brimming), against the key's list price`);
for (const [k, outs] of Object.entries(CONVERT)) {
  const ev = (power) => outs.reduce((a, [p, m]) => a + p * m, 0) * ECON.lockheart.cubes * power * keyLife(k);
  console.log(`${pad(k.slice(4), 10)}${ev(1).toFixed(1).padStart(7)}${ev(2).toFixed(1).padStart(7)}${String(keyPrice([k])).padStart(6)} for the key${ev(2) >= keyPrice([k]) ? '   (pays when brimming)' : ''}${ev(1) >= keyPrice([k]) ? ' (pays when full)' : ''}`);
}

// the catch (not built: SYSTEMS.md C2): the odds by Figment class, laid low cleanly and in the EmO band, by key
console.log(`\nthe catch (not built): odds by class (Guppy .. Leviathan), cleanly stunned, in the EmO band; capped at ${CATCH.cap * 100}%`);
for (const keys of [['key.brass'], ['key.loaded'], ['key.even'], ['key.twin']]) console.log(`${pad(keys[0].slice(4), 10)}${[0, 1, 2, 3, 4].map((c) => `${(catchOdds({ cls: c, keys }) * 100).toFixed(0)}%`.padStart(6)).join('')}`);

// the livelihoods not built yet, at three levels of play: cubes an hour, against the aim (ECONOMY.md rule 1: pay by quality)
console.log(`\nthe livelihoods not built yet (cubes an hour at poor / middling / masterful play; the aim is ${aim})`);
const lv = (name, f) => { const v = [0.4, 0.7, 1].map(f); console.log(`${pad(name, 26)}${v.map((x) => num(x)).join('')}   ${v.map((x) => (x / aim).toFixed(2)).join(' / ')} x aim`); };
{ const B = PLAY.busker, songs = 60 / B.songMin; lv('busking', (a) => { let v = 0; for (let i = 0; i < songs; i++) v += buskPay(B.songMin, a, Math.floor(i / B.set)); return v; }); }
{ const S = PLAY.slayer; lv('commissions (Barracuda)', (a) => { const n = 60 / (S.minutesEach * (S.speed[0] - S.speed[1] * a)); let v = 0; for (let i = 1; i <= n; i++) v += commissionPay(S.cls, i); return v + (n % 1) * commissionPay(S.cls, 1); }); } // (a better hunter finishes sooner)
{ const P = PLAY.potter; lv(`throwing pots (${P.prestige})`, (a) => (60 / P.minutesEach) * potPay(a, P.prestige)); }
{ const D = PLAY.diver; lv('Well runs', (a) => { const floors = Math.round(D.floors * (0.6 + 0.4 * a)); return (60 / (floors * D.minutesPerFloor)) * wellPay(floors, a > 0.6 ? D.foes : 0); }); } // (a weaker diver turns back sooner)
{ const H = PLAY.hauler; lv('hauling', (a) => (60 / H.hopMin) * haulProfit({ buy: 0.8, sell: 1 + 0.5 * a, units: H.units, worth: H.worth, distance: H.distance, failed: a < 0.5 ? 1 : 0 })); }
const run = wellPay(PLAY.diver.floors, PLAY.diver.foes);
console.log(`a Cogitomap of that run (${run} cubes), fully charted: ${cogitomapWorth(run, 1, 0)} fresh, ${cogitomapWorth(run, 1, 1)} a day later, ${cogitomapWorth(run, 1, 3)} after three (the Well drifts daily); a hop's fuel at distance 4: ${fuel(4)}`);
console.log(`island demand for edges over a week (multipliers, days 0..6): ${[0, 1, 2, 3, 4, 5, 6].map((d) => demand('anagami', 'edge', d).toFixed(2)).join(' ')}`);

// the spirit press: how far one pressing of each kind walks the Courier's colour (the wheel's distance, 0..1)
console.log(`\nthe spirit press: how far one material of each kind moves a colour (tier 0 / tier 4)`);
console.log(KIND_IDS.map((k) => `${k} ${distance({ h: 20, s: 0.5 }, press({ h: 20, s: 0.5 }, [makeMaterial(k, 1, 0)]).colour).toFixed(2)} / ${distance({ h: 20, s: 0.5 }, press({ h: 20, s: 0.5 }, [makeMaterial(k, 1, 4)]).colour).toFixed(2)}`).join(', '));

// crude Lachryma (LORE.md, "Lachryma as crude"): a run's expected profit by ship and grade, hauled where it is wanted (bought at 0.8,
// sold at 1.3, distance 4), with no stage failed and with one; and the spill odds of a stage failed
console.log(`\ncrude runs: expected profit a run (clean / one stage failed), cubes an hour clean (a hop of ${PLAY.hauler.hopMin} min x the ship's slowness), and the spill chance of a failed stage`);
for (const ship of ['sloop', 'tanker']) for (const grade of Object.keys(ECON.crude.grades))
  console.log(`${pad(ship, 8)}${pad(grade, 8)}${String(crudeRun({ ship, grade })).padStart(7)}${String(crudeRun({ ship, grade, failed: 1 })).padStart(7)}${String(Math.round(crudeRun({ ship, grade }) * 60 / (PLAY.hauler.hopMin * ECON.ships[ship].slow))).padStart(7)}/h ${(crudeRun({ ship, grade }) * 60 / (PLAY.hauler.hopMin * ECON.ships[ship].slow) / aim).toFixed(2)}x   spill ${(spillChance(grade, ECON.ships[ship].hold, ECON.ships[ship].hull ?? 1) * 100).toFixed(0)}%`);
let fill = 1; const fills = [];
for (let r = 0; r < 8; r++) { fills.push(wellYield(fill).toFixed(2)); fill = drawWell(fill, 1, 0); }
console.log(`a Well's yield over eight runs back to back: ${fills.join(' ')}; it refills ${ECON.wellFill.refillPerH * 100}% an hour (dry to full in ${Math.round(1 / ECON.wellFill.refillPerH)} hours)`);

// the islands on the Law-Chaos line (LORE.md, "The King and the Queen"): a Well run's expected cubes an hour, at poor / middling /
// masterful diving, and the chance a run ends with nothing; Law is safe and poor, Chaos rich and risky
console.log(`\nthe islands' Wells, Law to Chaos: expected cubes an hour (poor / middling / masterful), and the chance a run is lost`);
for (const [id, I] of Object.entries(ECON.islands)) {
  const at = (q) => { const r = islandRun(id, q); return { h: r.pay * (1 - r.risk) * 60 / r.minutes, risk: r.risk }; };
  const v = [0.4, 0.7, 1].map(at);
  console.log(`${pad(I.name, 16)}${v.map((x) => num(x.h)).join('')}   ${v.map((x) => (x.h / aim).toFixed(2)).join(' / ')} x aim   lost ${v.map((x) => `${(x.risk * 100).toFixed(0)}%`).join(' / ')}`);
}

// the toxic symbiosis (the owner, 2026-10-04): Chaos digs crude up and sells it cheap, Law buys it dear, and Letty brings in Chaos's strays
// for the King. The crude route Entropolis -> Margarite by tanker, over a fortnight of days (a clean run, distance 6), and bounties
const route = [];
for (let d = 0; d < 14; d++) { const buy = demand('entra', 'dread', d), sell = demand('margarite', 'dread', d); route.push(crudeRun({ ship: 'tanker', grade: 'dread', buy, sell, distance: 6 })); }
const perH = (v) => v * 60 / (PLAY.hauler.hopMin * ECON.ships.tanker.slow);
console.log(`\nthe crude route, Entropolis -> Margarite (tanker, dread, clean): a run pays ${Math.min(...route)} to ${Math.max(...route)} cubes over a fortnight, ${(perH(Math.min(...route)) / aim).toFixed(2)}x to ${(perH(Math.max(...route)) / aim).toFixed(2)}x the aim`);
console.log(`bounties (a commission x ${ECON.bounty.mult}, less Letty's ${ECON.bounty.cut * 100}%): ${[0, 1, 2, 3, 4].map((c) => bountyPay(c)).join(' / ')} cubes, Guppy .. Leviathan (commissions ${[0, 1, 2, 3, 4].map((c) => commissionPay(c, 1)).join(' / ')})`);
console.log(`a Well drifts daily: the dunes Well's seed on days 0, 1, 2: ${[0, 1, 2].map((d) => wellSeed('dunes', d)).join(', ')} (the same day, the same Well)`);

console.log('\nTHE EMOCEAN\'S NODE MAP AND ITS STAGE (econ/emocean.js: one authored stage, its classes from the route\'s danger)');
for (const [a, b] of [['anagami', 'margarite'], ['anagami', 'entra'], ['margarite', 'entra']]) {
  const h = hop(a, b), was = NODES.entra.locked;
  NODES.entra.locked = false; const h2 = hop(a, b), plan = stagePlan(a, b, 0); NODES.entra.locked = was;
  const roles = {}; for (const w of plan) roles[w.role] = CLASSES[w.cls];
  console.log(`  ${pad(`${a} - ${b}`, 22)} distance ${h2.distance}, fuel ${h2.fuel} cubes, ${h2.seconds} s in a sloop, danger ${h2.danger}: ${Object.entries(roles).map(([r, c]) => `${r} ${c}`).join(', ')}${h ? '' : ' (locked in the slice)'}`);
}
const plan0 = stagePlan('anagami', 'margarite', 0), plan1 = stagePlan('anagami', 'margarite', 1), spawned = plan0.reduce((a, w) => a + w.count, 0);
console.log(`  a stage: ${plan0.length} waves, ${spawned} Figments; the lanes on day 0 / day 1: ${plan0.map((w) => w.lane).join(' ')} / ${plan1.map((w) => w.lane).join(' ')}`);
console.log(`  how cleanly (Ouranurgy's quality): clean and thorough ${stageQuality({ hits: 0, downed: spawned, spawned })}, middling ${stageQuality({ hits: 3, downed: spawned / 2, spawned })}, scraped through ${stageQuality({ hits: 5, downed: 2, spawned }).toFixed(2)}`);
console.log(`  the reckoning (Divination): a wave's lane marked ${reckonLead(0)} / ${reckonLead(0.5)} / ${reckonLead(1)} s ahead at 0 / 0.5 / 1; a locked node opens at ${RECKON.open} reckoned from the pier`);
{ const run = islandRun('anagami', 0.5).pay, good = islandRun('anagami', 0.8).pay;
  for (const [label, w] of [['middling, 80% charted, fresh', cogitomapWorth(run, 0.8)], ['good, all charted, fresh', cogitomapWorth(good, 1)], ['good, a day old', cogitomapWorth(good, 1, 1)]])
    console.log(`  a Cogitomap of an Anagami Well (${pad(label + ')', 30)} worth ${pad(w, 4)} the purser pays: Margarite ${[0, 3, 6].map((d) => purserPrice(w, 'margarite', d)).join('/')}, Anagami ${[0, 3, 6].map((d) => purserPrice(w, 'anagami', d)).join('/')}, Entropolis ${[0, 3, 6].map((d) => purserPrice(w, 'entra', d)).join('/')} (days 0/3/6)`);
  console.log(`  after the sloop's fuel (${hop('anagami', 'margarite').fuel}): a good fresh map nets about 20 more at Margarite than at home, a middling one is better sold at home (skill decides whether the Well feeds the boat)`); }
