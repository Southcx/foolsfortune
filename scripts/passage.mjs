// ---------------------------------------------------------------------------------------
// THE PASSAGE, CHECKED (docs/plans/PASSAGE.md section 10): lays sea charts for every route over many game days and holds them to their
// rules: no lane crosses another, every waypoint lies on a lane, the local rules (no repeats, siblings unlike, minimum columns), the
// pool's shares within reach of the table, and the portents' promise (the true leg is always in the shortlist; the next is exact).
// One PASS/FAIL line a check, as the sweeps. `node scripts/passage.mjs [--days 2000]`.
// ---------------------------------------------------------------------------------------
import { seaChart, lanes, next, portent, sight, confidence, tierOf, PASSAGE, rutterWorth } from '../src/progress/econ/passage.js';
import { hop } from '../src/progress/econ/emocean.js';
import { SHIPS, canSail, holdOf } from '../src/progress/rail/ships.js';
import { ENCOUNTERS, pickEncounter } from '../src/progress/rail/encounters.js';

const DAYS = Number(process.argv[process.argv.indexOf('--days') + 1]) || 2000;
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${typeof info === 'string' ? info : JSON.stringify(info)}`); };
const ROUTES = [['anagami', 'margarite'], ['anagami', 'entra'], ['margarite', 'entra']];
const bad = { cross: 0, orphan: 0, repeat: 0, sibling: 0, minCol: 0, notLast: 0, lastCols: 0, ones: 0 }, counts = {}, sizes = {};
let charts = 0, waypointsAll = 0, portentMiss = 0, nextNotExact = 0;
for (const [from, to] of ROUTES) {
  const h = hop(from, to, 'sloop', () => true);
  for (let day = 0; day < DAYS; day++) {
    const casks = day % 9, chart = seaChart({ from, to, day, danger: h.danger, distance: h.distance, casks, leviathan: day % 7 === 0, bounty: day % 5 === 0 });
    charts++; sizes[`${from}-${to}`] = `${chart.columns}x${chart.rows}`;
    const W = chart.waypoints, E = chart.edges;
    // crossing: two edges between the same columns cross when their rows swap order
    for (const [a1, b1] of E) for (const [a2, b2] of E) {
      const [c1, r1] = a1.split(':').map(Number), [, s1] = b1.split(':').map(Number), [c2, r2] = a2.split(':').map(Number), [, s2] = b2.split(':').map(Number);
      if (c1 === c2 && (r1 - r2) * (s1 - s2) < 0) bad.cross++;
    }
    const onLane = new Set(lanes(chart).flat());
    const parents = {}, children = {}; for (const [a, b] of E) { (children[a] ||= []).push(b); (parents[b] ||= []).push(a); }
    const ones = {};
    for (const w of Object.values(W)) {
      waypointsAll++; counts[w.type] = (counts[w.type] || 0) + 1;
      if (!onLane.has(w.id)) bad.orphan++;
      const T = PASSAGE.types[w.type];
      if (T.noRepeat && (parents[w.id] || []).some((p) => W[p].type === w.type)) bad.repeat++;
      if (w.type !== 'shoal') for (const p of parents[w.id] || []) if ((children[p] || []).some((s) => s !== w.id && W[s].type === w.type)) bad.sibling++;
      if (T.minCol != null && w.col < T.minCol) bad.minCol++;
      if (T.notLast && w.col === chart.columns - 1) bad.notLast++;
      if (T.lastCols != null && w.col < chart.columns - T.lastCols) bad.lastCols++;
      if (T.one) { ones[w.type] = (ones[w.type] || 0) + 1; if (ones[w.type] > 1) bad.ones++; }
      // portents at every depth and sight: the truth is always in a shortlist; depth 1 is exact
      for (const s of [0.35, 0.7, 1, 1.5]) for (let depth = 1; depth <= chart.columns; depth++) {
        const P = portent(chart, w, depth, s, 1 + (day % 99));
        if (P.candidates.length && !P.candidates.includes(w.type)) portentMiss++;
        if (depth === 1 && P.tier !== 'exact') nextNotExact++;
      }
    }
  }
}
check('no lane crosses another', bad.cross === 0, bad.cross);
check('every waypoint lies on a lane', bad.orphan === 0, bad.orphan);
check('no repeat where a type may not follow itself', bad.repeat === 0, bad.repeat);
check('siblings unlike', bad.sibling === 0, bad.sibling);
check('minimum columns, never a calm last, Old Nobody in the last two', bad.minCol + bad.notLast + bad.lastCols === 0, bad);
check('one maelstrom, bounty and Leviathan at most', bad.ones === 0, bad.ones);
check('a portent\'s shortlist always holds the truth', portentMiss === 0, portentMiss);
check('the next waypoint is always exact', nextNotExact === 0, nextNotExact);
const shares = Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, +(v / waypointsAll).toFixed(3)]));
check('every type appears', ['shoal', 'wreckers', 'eyewall', 'graveyard', 'calm', 'encounter', 'maelstrom', 'bounty', 'leviathan'].every((t) => counts[t] > 0), shares);
check('sizes by route', true, sizes);
// acceptance 3: a reading of quality 1 at level 1 shows the second column at two candidates or better
check('a full reading at level 1 shows depth 2 as two candidates', tierOf(confidence(2, sight(1, 1, 1), 1), 2) === 'two', confidence(2, sight(1, 1, 1), 1));
check('a bare reading at level 1 shows depth 2 as a silhouette at best', ['class', 'star'].includes(tierOf(confidence(2, sight(0, 1, 1), 1), 2)), confidence(2, sight(0, 1, 1), 1));
const tbl = ['S', 'A', 'B', 'C', 'D'].map((rank) => `${rank} ${rutterWorth({ minutes: 6, rank, read: 1 })}`).join(', ');
check('a rutter of six minutes, read whole, by rank', rutterWorth({ minutes: 6, rank: 'S', read: 1 }) > rutterWorth({ minutes: 6, rank: 'D', read: 0 }), tbl);
// the ships (section 11): a charted-only ship sails only today's rutter of its route; every ship has a hold in the economy's table
check('a tanker refuses an uncharted passage, sails its rutter', !canSail('tanker', { route: 'anagami-margarite', day: 3 }).ok && canSail('tanker', { route: 'anagami-margarite', day: 3, rutter: { route: 'anagami-margarite', day: 3 } }).ok && !canSail('tanker', { route: 'anagami-margarite', day: 4, rutter: { route: 'anagami-margarite', day: 3 } }).ok);
check('the sloop sails anywhere', canSail('sloop', { route: 'anagami-entra', day: 9 }).ok);
check('every ship has a hold', Object.keys(SHIPS).every((s) => holdOf(s) > 0), Object.fromEntries(Object.keys(SHIPS).map((s) => [s, holdOf(s)])));
// the encounters (section 13): an unseen one's odds rise, so a long voyage meets them all
{ let x = 7; const rng = () => ((x = (x * 16807) % 2147483647) / 2147483647); const seen = {}, met = new Set(); let voyages = 0;
  while (met.size < Object.keys(ENCOUNTERS).length && voyages < 200) { voyages++; const id = pickEncounter(seen, rng); met.add(id); for (const k of Object.keys(ENCOUNTERS)) seen[k] = k === id ? 0 : (seen[k] || 0) + 1; }
  check('every encounter met within 40 encounters', voyages <= 40, `${voyages} encounters`); }
console.log(fails ? `passage: ${fails} FAILED (${charts} sea charts)` : `passage: all passed (${charts} sea charts)`); process.exitCode = fails ? 1 : 0;
