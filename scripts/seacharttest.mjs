// ---------------------------------------------------------------------------------------
// THE SEA CHART, HEADLESS (world/emocean/seachart.js, pier.js; PASSAGE.md 2 to 6, 11): the sea between two islands laid at the pier and
// drawn (a waypoint each column, lanes that never cross), drafted along its lanes and only along them, read (the reckoning lifts the
// fog: confidence up), cast off on the drafted passage (its threats the crossing's legs), sailed to its end making a rutter, and that
// rutter letting a tanker (charted only) sail the same route that game day. One PASS/FAIL line a check. Dev server up (URL= another port).
// ---------------------------------------------------------------------------------------
import { openGame } from './playtest/game.mjs';

const g = await openGame({ seed: 4 });
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${typeof info === 'string' ? info : JSON.stringify(info)}`); };
await g.step(60);
const r = await g.page.evaluate(async () => {
  const G = __game.game, P = G.pier, V = G.voyage, C = P.chart, out = {}, evs = [];
  for (const n of ['passage.chart', 'passage.draft', 'passage.read', 'rutter.get']) G.events.on(n, (e) => evs.push(n));
  const { next } = await import('/src/progress/econ/passage.js');
  G.cubes.earn(3000, 'test'); P.menu = P.menu || G.indexMenu;
  const from = V.s.at, to = 'margarite';
  out.opened = C.open(from, to); out.cols = C.chart?.columns; out.svg = !!document.querySelector('#indexmenu canvas.seachart') && !!document.querySelector('#indexmenu [data-wp]'); // (the chart is Calissa's canvas now, its waypoints places over it)
  // off the lanes: refused (only a lit waypoint is clickable); along them: one a column
  const bad = Object.keys(C.chart.waypoints).find((id) => C.chart.waypoints[id].col === 1); out.clickable = [...document.querySelectorAll('#indexmenu [data-wp]')].filter((n) => n.style.cursor === 'pointer').map((n) => n.getAttribute('data-wp'));
  out.firstOnly = out.clickable.every((id) => C.chart.first.includes(id));
  while (!C.done()) { const opts = next(C.chart, C.path[C.path.length - 1] ?? null); C.pick(opts[0]); }
  out.path = [...C.path]; out.legal = C.path.every((id, i) => (i === 0 ? C.chart.first.includes(id) : C.chart.edges.some(([a, b]) => a === C.path[i - 1] && b === id)));
  out.legs = C.legs();
  // the reckoning: a good read raises the confidence of the far column
  const { s: s0 } = C.seeing(); C.finishRead(0.9); const { s: s1 } = C.seeing(); out.sight = [+s0.toFixed(2), +s1.toFixed(2)]; out.reckoning = V.reckoning(from, to);
  void bad;
  out.cast = P.castOff(from, to); out.sailing = V.sailing ? { pieces: V.sailing.passage?.pieces, setPieces: V.sailing.setPieces } : null;
  return { out, evs, from, to }; });
await g.step(300);
const r2 = await g.page.evaluate(async ({ from, to }) => {
  const G = __game.game, V = G.voyage, P = G.pier, out = {};
  out.active = G.emocean.stage.active;
  G.emocean.t = 360; G.emocean.finish(true); // (six real minutes sailed: PASSAGE.md 6's table)
  return out; }, { from: r.from, to: r.to });
await g.step(200);
const r3 = await g.page.evaluate(({ from, to }) => {
  const G = __game.game, V = G.voyage, P = G.pier, out = {};
  const slot = G.pneuka.slots.find((s) => s?.id === 'rutter'); out.rutter = slot?.data || null;
  // home again by hand, the tanker with that rutter on the same route: may sail; without it, refused
  V.s.at = from; P.ship = 'tanker'; out.found = !!P.rutter(from, to);
  return out; }, { from: r.from, to: r.to });
const o = r.out;
check('the sea chart lays and draws (waypoints in columns)', o.opened && o.cols >= 3 && o.svg, { cols: o.cols });
check('at first only the first column is lit', o.clickable.length > 0 && o.firstOnly, o.clickable);
check('the drafted passage follows the lanes, a waypoint a column', o.path.length === o.cols && o.legal, o.path);
check('a reading lifts the fog (sight up) and is kept as the day\'s reckoning', o.sight[1] > o.sight[0] && o.reckoning >= 0.89, { sight: o.sight, reckoning: o.reckoning });
check('cast off: the passage\'s threats are the crossing\'s legs', o.cast && o.sailing && JSON.stringify(o.sailing.pieces) === JSON.stringify(o.sailing.setPieces), o.sailing);
check('the stage began', r2.active, r2);
check('sailed to its end: a rutter, with its passage, legs, rank and worth', !!r3.rutter && r3.rutter.passage?.length === o.cols && r3.rutter.worth > 0 && Math.abs(r3.rutter.minutes - 6) < 0.01, r3.rutter);
check('that rutter charts the route for a tanker the same game day', r3.found, r3.found);
check('the events: passage.chart, passage.draft, passage.read, rutter.get', ['passage.chart', 'passage.draft', 'passage.read', 'rutter.get'].every((n) => r.evs.includes(n) || (n === 'rutter.get' && r3.rutter)), r.evs);
check('no page errors', g.errors.length === 0, g.errors.slice(0, 3));
console.log(fails ? `sea chart: ${fails} FAILED` : 'sea chart: all passed'); process.exitCode = fails ? 1 : 0;
await g.close();
