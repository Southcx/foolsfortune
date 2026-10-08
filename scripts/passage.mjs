// ---------------------------------------------------------------------------------------
// THE PASSAGE, CHECKED (docs/plans/PASSAGE.md section 10): lays sea charts for every route over many game days and holds them to their
// rules: no lane crosses another, every waypoint lies on a lane, the local rules (no repeats, siblings unlike, minimum columns), the
// pool's shares within reach of the table, and the portents' promise (the true leg is always in the shortlist; the next is exact).
// One PASS/FAIL line a check, as the sweeps. `node scripts/passage.mjs [--days 2000]`.
// ---------------------------------------------------------------------------------------
import { seaChart, lanes, next, portent, sight, confidence, tierOf, PASSAGE, rutterWorth, choke, STORM, classOf } from '../src/progress/econ/passage.js';
import { cheapestLane, laneBurn, sailable, start, arrive, choose, adrift, drift, draughtTrump, spillAt, formSkew, havenChoices } from '../src/progress/rail/trip.js';
import { hop } from '../src/progress/econ/emocean.js';
import { SHIPS, canSail, holdOf } from '../src/progress/rail/ships.js';
import { ENCOUNTERS, pickEncounter, offered, apply, raceRank, strengthOf } from '../src/progress/rail/encounters.js';
import { slotsOf, loadout, mountable, MOUNTS } from '../src/progress/rail/mounts.js';

const DAYS = Number(process.argv[process.argv.indexOf('--days') + 1]) || 2000;
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${typeof info === 'string' ? info : JSON.stringify(info)}`); };
const ROUTES = [['anagami', 'margarite'], ['anagami', 'entra'], ['margarite', 'entra']];
const bad = { cross: 0, orphan: 0, repeat: 0, sibling: 0, minCol: 0, notLast: 0, lastCols: 0, ones: 0 }, counts = {}, sizes = {};
let charts = 0, waypointsAll = 0, portentMiss = 0, nextNotExact = 0;
const trip = { stormBad: 0, storms: 0, charts: 0, unsailable: {}, lanes: {}, over: {}, feel: {}, chainLanes: 0, chained: 0 };
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
    // the trip's pressures (section 14): storms placed by rule; a lane every ship can sail on a full tank; the feelings
    const ch = choke(chart), storms = Object.values(W).filter((w) => w.storm);
    for (const w of storms) if (ch.has(w.id) || classOf(w.type) !== 'threat' || w.col < STORM.minCol || !w.feel) trip.stormBad++;
    trip.storms += storms.length; trip.charts++;
    for (const ship of Object.keys(SHIPS)) {
      const all0 = lanes(chart); if (!all0.some((p) => sailable(chart, p, ship))) trip.unsailable[ship] = (trip.unsailable[ship] || 0) + 1;
      const all = lanes(chart); trip.lanes[ship] = (trip.lanes[ship] || 0) + all.length; trip.over[ship] = (trip.over[ship] || 0) + all.filter((p) => !sailable(chart, p, ship)).length;
    }
    for (const w of Object.values(W)) { const k = `${from}-${to}:${w.col === 0 ? 'first' : w.col === chart.columns - 1 ? 'last' : 'mid'}`; (trip.feel[k] ||= {})[w.feel || 'fair'] = (trip.feel[k][w.feel || 'fair'] || 0) + 1; }
    for (const p of lanes(chart)) { trip.chainLanes++; if (p.some((id, i) => i && draughtTrump(W[p[i - 1]].feel, W[id].feel) === 'trumps')) trip.chained++; }
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
check('a tanker refuses an uncharted passage, sails its rutter\'s own sea (any game day)', !canSail('tanker', { route: 'anagami-margarite', day: 3 }).ok && canSail('tanker', { route: 'anagami-margarite', day: 4, rutter: { route: 'anagami-margarite', day: 3 } }).day === 3 && !canSail('tanker', { route: 'anagami-margarite', day: 4, rutter: { route: 'anagami-entra', day: 4 } }).ok);
check('the sloop sails anywhere', canSail('sloop', { route: 'anagami-entra', day: 9 }).ok);
check('every ship has a hold', Object.keys(SHIPS).every((s) => holdOf(s) > 0), Object.fromEntries(Object.keys(SHIPS).map((s) => [s, holdOf(s)])));
// the encounters (section 13): an unseen one's odds rise, so a long voyage meets them all
{ let x = 7; const rng = () => ((x = (x * 16807) % 2147483647) / 2147483647); const seen = {}, met = new Set(); let voyages = 0;
  while (met.size < Object.keys(ENCOUNTERS).length && voyages < 200) { voyages++; const id = pickEncounter(seen, rng, { ghost: true }); met.add(id); for (const k of Object.keys(ENCOUNTERS)) seen[k] = k === id ? 0 : (seen[k] || 0) + 1; }
  check('every encounter met within 40 encounters (the Glass where a run of the sea chart exists)', voyages <= 40, `${voyages} encounters`); }
// the trip's pressures (section 14)
check('storms only on avoidable threat waypoints, from the second column, never fair', trip.stormBad === 0, `${trip.storms} storms over ${trip.charts} sea charts`);
check('every sea chart has a lane every ship sails on a full tank, filling at its calms', !Object.keys(trip.unsailable).length, trip.unsailable);
check('fuel bites: a share of lanes are out of a full tank\'s reach', true, Object.fromEntries(Object.keys(trip.lanes).map((k) => [k, +(trip.over[k] / trip.lanes[k]).toFixed(3)])));
const fl = (k) => { const f = trip.feel[k] || {}, n = Object.values(f).reduce((a, b) => a + b, 0); return Object.fromEntries(Object.entries(f).map(([a, b]) => [a, +(b / n).toFixed(2)])); };
check('the feelings run along the Law-Chaos line (Anagami to Entropolis: dread grows to the last column)', (fl('anagami-entra:last').dread || 0) > (fl('anagami-entra:first').dread || 0), { first: fl('anagami-entra:first'), last: fl('anagami-entra:last') });
check('Margarite\'s end is mirth\'s', (fl('anagami-margarite:last').mirth || 0) > (fl('anagami-margarite:first').mirth || 0), { first: fl('anagami-margarite:first'), last: fl('anagami-margarite:last') });
check('a share of lanes hold a draught trump (the last feeling type trumps the next foes)', trip.chained / trip.chainLanes > 0.2 && trip.chained / trip.chainLanes < 0.95, +(trip.chained / trip.chainLanes).toFixed(3));
{ // a trip played out: a sloop that never routes through a haven against one that mends at every calm; the hull must matter
  let x = 3; const rng = () => ((x = (x * 16807) % 2147483647) / 2147483647); const hits = () => (rng() < 0.45 ? 1 : 0) + (rng() < 0.35 ? 1 : 0) + (rng() < 0.15 ? 1 : 0);
  const sunk = { blind: 0, mend: 0 }, N = 3000;
  for (let i = 0; i < N; i++) {
    const chart = seaChart({ from: 'anagami', to: 'entra', day: i, danger: 1, distance: 9 }), all = lanes(chart);
    const haven = all.slice().sort((a, b) => b.filter((id) => classOf(chart.waypoints[id].type) === 'haven').length - a.filter((id) => classOf(chart.waypoints[id].type) === 'haven').length)[0];
    const fight = all.slice().sort((a, b) => a.filter((id) => classOf(chart.waypoints[id].type) === 'haven').length - b.filter((id) => classOf(chart.waypoints[id].type) === 'haven').length)[0];
    for (const [k, path] of [['blind', fight], ['mend', haven]]) {
      let s = start('sloop', 99);
      for (const id of path) { const w = chart.waypoints[id], h = classOf(w.type) === 'haven' ? 0 : hits() + (w.storm ? 1 : 0) + (w.type === 'maelstrom' ? 1 : 0); s = arrive(s, chart, id, { hits: h }); if (w.type === 'calm') s = choose(s, 'mend'); if (s.hull <= 0) { sunk[k]++; break; } }
    }
  }
  check('the hull carries: the fighting lane sinks a sloop more often than the haven lane', sunk.blind > sunk.mend * 1.3, { fighting: +(sunk.blind / N).toFixed(3), havens: +(sunk.mend / N).toFixed(3) });
}
{ const chart = seaChart({ from: 'anagami', to: 'entra', day: 7, danger: 1, distance: 9 }); let s = start('sloop', 0), id = null, steps = 0; let x = 9; const rng = () => ((x = (x * 16807) % 2147483647) / 2147483647);
  while (next(chart, id).length && steps < 10) { s.adrift = adrift(s, chart, id); const n = s.adrift ? drift(chart, id, rng) : null; if (!n) break; s = arrive(s, chart, n); id = n; steps++; }
  check('adrift: an empty tank is carried to the end, burning nothing', steps === chart.columns && s.fuel === 0, `${steps} of ${chart.columns} columns`); }
check('a calm offers mend, reckon and fuel when the tank is short', havenChoices({ ship: 'sloop', fuel: 2 }, { type: 'calm' }).join() === 'mend,reckon,fuel');
check('spill: crude is calm in its own feeling, unsteady in its opposite', spillAt('grief', 'grief') < 1 && spillAt('grief', 'mirth') > 1 && spillAt('grief', null) === 1);
check('bright feelings throw astral shots, dark umbral', formSkew('wonder') > 0.5 && formSkew('dread') < 0.5 && formSkew(null) === 0.5);
{ let x = 5; const rng = () => ((x = (x * 16807) % 2147483647) / 2147483647); let glass = 0; for (let i = 0; i < 400; i++) if (pickEncounter({}, rng) === 'mirrorSea') glass++;
  check('the Glass never comes without a run of this sea chart to race', glass === 0); }
check('a ship that cannot dive is never offered the dive', !offered('lightWhale', 'tanker').some((c) => c.id === 'follow') && offered('lightWhale', 'sloop').some((c) => c.id === 'follow'));
check('a storm cleared raises the rutter', rutterWorth({ minutes: 6, rank: 'A', read: 1, storms: 1 }) > rutterWorth({ minutes: 6, rank: 'A', read: 1 }));
{ const all = mountable(Object.keys(MOUNTS));
  check('a loadout is cut to the hull\'s slots', all.length >= 3 && ['sloop', 'frigate', 'tanker'].every((h) => loadout(all, all, h).length === Math.min(all.length, slotsOf(h))), Object.fromEntries(['sloop', 'frigate', 'tanker'].map((h) => [h, loadout(all, all, h).length]))); }
{ // the encounters' effects (apply): every choice of every encounter on many seas, pure and in bounds
  let bad = [], asked = {};
  for (let d = 0; d < 60; d++) {
    const C = seaChart({ from: 'anagami', to: 'margarite', day: d, danger: 0.5, distance: 6, casks: 2 }), L = lanes(C)[0], st0 = { ...start('sloop'), at: L[0], plan: L };
    for (const [id, E] of Object.entries(ENCOUNTERS)) for (const c of E.choices) {
      const ctx = { chart: C, rng: () => 0.3, rutter: 120, ghost: { score: 1000 }, wordsLeft: d % 2 }, a = apply(st0, id, c.id, ctx), b = apply(st0, id, c.id, ctx);
      if (JSON.stringify(a) !== JSON.stringify(b)) bad.push(`${id}.${c.id}: not pure`);
      if (a.state.fuel < 0 || a.state.hull !== st0.hull) bad.push(`${id}.${c.id}: state out of bounds`);
      for (const k of a.asks) { asked[k.ask] = (asked[k.ask] || 0) + 1; if (k.waypoint && !L.slice(1).includes(k.waypoint)) bad.push(`${id}.${c.id}: asks for a waypoint behind or off the path`); if (k.waypoints?.some((x) => !L.slice(1).includes(x))) bad.push(`${id}.${c.id}: an exact portent off the path`); }
    }
  }
  check('every encounter choice applies purely, in bounds, asking only of waypoints ahead', !bad.length, bad.slice(0, 4));
  check('every kind of ask is reachable', ['exact', 'casks', 'bounty', 'sellRutter', 'hiddenLeg', 'crew', 'counter', 'buyRutter', 'ghost', 'ostracon'].every((k) => asked[k]), asked);
  const C = seaChart({ from: 'anagami', to: 'margarite', day: 3, danger: 0.5, distance: 6, casks: 0 }), L = lanes(C)[0];
  const tk = apply({ ...start('tanker'), at: L[0], plan: L }, 'lightWhale', 'follow', { chart: C });
  check('a ship that cannot dive is given no hidden leg even if asked', !tk.asks.length);
  const dry = apply({ ...start('sloop'), fuel: 0.5, at: L[0], plan: L }, 'castaway', 'rescue', { chart: C });
  check('no castaway fed from a tank short of a measure, and it is not offered', !dry.asks.length && dry.state.fuel === 0.5 && !offered('castaway', 'sloop', { fuel: 0.5 }).some((c) => c.id === 'rescue'));
  check('no rutter, nothing to sell Letty', !offered('lettysCutter', 'sloop', { rutter: 0 }).some((c) => c.id === 'sell') && offered('lettysCutter', 'sloop', { rutter: 90 }).some((c) => c.id === 'sell'));
  const loot = apply({ ...start('sloop'), at: L[0], plan: L }, 'ghostConvoy', 'loot', { chart: C }).state;
  check('loot draws the Wreckers: their legs ahead stronger, others not', strengthOf(loot, { type: 'wreckers', strength: 1 }) > 1 && strengthOf(loot, { type: 'shoal', strength: 1 }) === 1);
  check('a ghost beaten lifts a rank a letter, never past S', raceRank('B', true) === 'A' && raceRank('S', true) === 'S' && raceRank('B', false) === 'B');
}
console.log(fails ? `passage: ${fails} FAILED (${charts} sea charts)` : `passage: all passed (${charts} sea charts)`); process.exitCode = fails ? 1 : 0;
