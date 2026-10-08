// ---------------------------------------------------------------------------------------
// ADRIFT, HEADLESS (world/emocean/triprun.js driftOn, stage.js relay; PASSAGE.md 14.2, trip.js adrift and drift): a drafted passage of
// four waypoints or more cast off, its bunker emptied in the first leg; as that leg closes the ship is adrift, the current takes the
// rest of the route along the sea chart's lanes, the legs ahead relaid (the cue's legs, the plan's bars and seconds, the rail) without
// the rail point jumping or the stage clock starting over, said in the log; then the ship makes port. One PASS/FAIL line a check.
// Run with the dev server up (URL= for another port).
// ---------------------------------------------------------------------------------------
import { openGame } from './playtest/game.mjs';

const g = await openGame({ seed: 13 });
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${typeof info === 'string' ? info : JSON.stringify(info)}`); };
await g.step(60);
const r0 = await g.page.evaluate(async () => {
  const G = __game.game, P = G.pier, V = G.voyage, C = P.chart, lines = [];
  const say = G.log.say.bind(G.log); G.log.say = (k, s, o) => { lines.push(s); return say(k, s, o); }; window.__lines = lines;
  window.__ev = []; G.events.on('passage.adrift', (e) => window.__ev.push(e));
  const { lanes } = await import('/src/progress/econ/passage.js');
  G.cubes.earn(4000, 'test'); P.menu = P.menu || G.indexMenu;
  C.open(V.s.at, 'margarite'); const W = C.chart.waypoints, diag = (l) => l.length > 1 && W[l[1]].row !== W[l[0]].row; // (a diagonal after the first: the current, straight on two to one, likely sails elsewhere)
  const ls = lanes(C.chart).sort((a, b) => b.length - a.length), lane = ls.find(diag) || ls[0]; for (const id of lane) C.pick(id);
  return { cast: P.castOff(V.s.at, 'margarite'), n: lane.length, ids: lane };
});
await g.step(240);
await g.page.evaluate(() => { const T = __game.game.emocean.trip; T.state = { ...T.state, fuel: 0 }; });
let relay = null, prev = null;
for (let i = 0; i < 1400 && !relay; i++) {
  await g.step(6);
  const s = await g.page.evaluate(() => { const G = __game.game, E = G.emocean, T = E.trip, M = G.indexMenu;
    if (E.offering && M?.open) document.querySelector('#indexmenu .room')?.click(); E.run.hits = 0;
    return { k: T.k, adrift: !!E.stage.adrift, t: E.t, Q: E.rail.Q.toArray(), ids: T.wps.map((w) => w.id), seconds: E.stage.seconds, ev: window.__ev.length }; });
  if (prev && s.adrift && !prev.adrift) relay = { before: prev, after: s };
  prev = s;
}
const r1 = relay && await g.page.evaluate(() => { const G = __game.game, E = G.emocean, T = E.trip, C = T.chart;
  const legal = T.wps.every((w, i) => i === 0 ? C.first.includes(w.id) : C.edges.some(([a, b]) => a === T.wps[i - 1].id && b === w.id));
  return { legal, legs: E.stage.legs.length, wps: T.wps.length, bars: E.plan.bars, layoutBars: T.layout.bars, seconds: E.stage.seconds, BAR: E.plan.seconds / E.plan.bars, passageAdrift: !!G.voyage.sailing?.passage?.adrift, lines: window.__lines.filter((l) => /adrift/.test(l)), ev: window.__ev[0] }; });
for (let i = 0; i < 1600; i++) { await g.step(30); const a = await g.page.evaluate(() => { const E = __game.game.emocean, M = __game.game.indexMenu; if (E.offering && M?.open) document.querySelector('#indexmenu .room')?.click(); E.run.hits = 0; return E.stage.active; }); if (!a) break; }
const r2 = await g.page.evaluate(() => ({ active: __game.game.emocean.stage.active, at: __game.game.voyage.s.at }));
const dQ = relay ? Math.hypot(...relay.after.Q.map((v, i) => v - relay.before.Q[i])) : null, dt = relay ? relay.after.t - relay.before.t : null;
check(`cast off on ${r0.n} waypoints`, r0.cast && r0.n >= 3, r0);
check('the bunker dry: adrift as the first leg closes', !!relay && r1?.ev?.at === r0.ids[0], relay && { at: r1?.ev?.at, first: r0.ids[0] });
check('the current took another way: the legs ahead relaid', r1?.ev?.relaid === true, { relaid: r1?.ev?.relaid, drafted: r0.ids, sailed: relay?.after.ids });
check('said once in the log (passage.adrift)', r1?.lines.length === 1 && r1.ev, r1 && { lines: r1.lines, ev: r1.ev });
check('the route ahead follows the sea chart\'s lanes', r1?.legal, r1 && relay.after.ids);
check('the legs ahead relaid for the cue, the plan and the layout agree', r1 && r1.legs === r1.wps && r1.bars === r1.layoutBars, r1);
check('the rail point does not jump at the relay', dQ != null && dQ < 26 * dt * 1.5 + 0.5, { dQ: dQ && +dQ.toFixed(2), dt: dt && +dt.toFixed(3) });
check('the stage clock goes on (never starts over)', relay && relay.after.t >= relay.before.t, relay && [relay.before.t, relay.after.t]);
check('the passage is marked adrift (its rank capped: Dovina\'s)', r1?.passageAdrift, r1?.passageAdrift);
check('the ship makes port', !r2.active && r2.at === 'margarite', r2);
check('no page errors', g.errors.length === 0, g.errors.slice(0, 3));
console.log(fails ? `adrift: ${fails} FAILED` : 'adrift: all passed'); process.exitCode = fails ? 1 : 0;
await g.close();
