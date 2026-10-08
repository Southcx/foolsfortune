// ---------------------------------------------------------------------------------------
// THE TRIP AS SAILED, HEADLESS (world/emocean/triprun.js with Dovina's legs, pattern player and shot field; courier/ship/ship.js's forms
// and surge): a passage drafted through a calm, cast off and sailed whole. Its legs laid as the cue lays them (stage.legs, the plan's
// bars), the old waves' own fire quiet, the shot field firing the schedule, the views changing by phase, the calm's campfire offered and
// answered (the cue's hold released), the forms on Q (a shot of your form drunk, filling the surge), the surge let go, and the ship
// making port. One PASS/FAIL line a check. Run with the dev server up (URL= for another port).
// ---------------------------------------------------------------------------------------
import { openGame } from './playtest/game.mjs';

const g = await openGame({ seed: 5 });
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${typeof info === 'string' ? info : JSON.stringify(info)}`); };
await g.step(60);
const r0 = await g.page.evaluate(async () => {
  const G = __game.game, P = G.pier, V = G.voyage, C = P.chart;
  const { next } = await import('/src/progress/econ/passage.js');
  G.cubes.earn(4000, 'test'); P.menu = P.menu || G.indexMenu;
  C.open(V.s.at, 'margarite');
  // a lane through a calm if there is one (its campfire is a check), else the first lane
  const lanes = (await import('/src/progress/econ/passage.js')).lanes(C.chart);
  const lane = lanes.find((l) => l.some((id) => C.chart.waypoints[id].type === 'calm')) || lanes[0];
  for (const id of lane) C.pick(id);
  const types = lane.map((id) => C.chart.waypoints[id].type);
  return { cast: P.castOff(V.s.at, 'margarite'), types, next: !!next };
});
await g.step(240);
const r1 = await g.page.evaluate(() => {
  const G = __game.game, E = G.emocean;
  return { active: E.stage.active, trip: E.trip.active, legs: (E.stage.legs || []).map((l) => l.id), bars: E.plan.bars, quiet: E.waves.quiet, seconds: E.stage.seconds };
});
// sail it, answering a haven's page when it comes; note the views seen and the shots fired
const seen = { views: new Set(), fired: 0, offered: [], maxLive: 0 };
for (let i = 0; i < 600; i++) {
  await g.step(30);
  const s = await g.page.evaluate(() => {
    const G = __game.game, E = G.emocean, F = E.trip.field, M = G.indexMenu;
    if (!E.stage.active) return { done: true };
    const out = { view: E.trip.active ? E.trip.viewAt(E.bar) : null, fired: F?.counts.fired || 0, live: F?.live || 0, offering: E.offering && M?.open ? M.page?.name : null, bar: +E.bar.toFixed(1) };
    if (out.offering === 'campfire' || out.offering === 'encounter') { const first = document.querySelector('#indexmenu .room'); first?.click(); out.answered = true; }
    E.run.hits = 0; // (kept whole: this test sails the trip, it does not judge the flying)
    return out;
  });
  if (s.done) break;
  if (s.view) seen.views.add(s.view); seen.fired = Math.max(seen.fired, s.fired); seen.maxLive = Math.max(seen.maxLive, s.live);
  if (s.offering) seen.offered.push(s.offering);
  if (i === 40) {
    seen.forms = await g.page.evaluate(() => { const G = __game.game, sh = G.emocean.ship, out = { before: sh.form };
      sh.form = 'umbral'; out.umbral = sh.form; const s0 = sh.surge; for (let k = 0; k < 30; k++) sh.absorb({ kind: 'umbral' }); out.surge = [s0, sh.surge];
      sh.letGo(G.emocean.waves, G.emocean.shots); out.after = sh.surge; out.mercy = sh.mercy > 0; sh.form = 'astral'; return out; });
  }
}
const r2 = await g.page.evaluate(() => { const G = __game.game; return { active: G.emocean.stage.active, at: G.voyage.s.at, rutter: !!G.pneuka.slots.find((s) => s?.id === 'rutter') }; });
check('cast off on a drafted passage', r0.cast, r0.types);
check('the trip runs: its legs laid for the cue', r1.active && r1.trip && r1.legs.length === r0.types.length, r1);
check('the old waves are quiet on the new legs', r1.quiet === true, r1.quiet);
check('the shot field fires the schedule', seen.fired > 20, { fired: seen.fired, maxLive: seen.maxLive });
check('the views change by phase', seen.views.size >= 2, [...seen.views]);
check('a calm offers its campfire, and it is answered', !r0.types.includes('calm') || seen.offered.includes('campfire'), seen.offered);
check('the forms: Umbral, a shot of its kind drunk fills the surge', seen.forms?.umbral === 'umbral' && seen.forms.surge[1] >= 100, seen.forms);
check('the surge let go: emptied, a half bar untouchable', seen.forms?.after === 0 && seen.forms.mercy, seen.forms);
check('the ship makes port at the end of the trip', !r2.active && r2.at === 'margarite', r2);
check('and a rutter of the passage comes home', r2.rutter, r2.rutter);
check('no page errors', g.errors.length === 0, g.errors.slice(0, 3));
console.log(fails ? `trip: ${fails} FAILED` : 'trip: all passed'); process.exitCode = fails ? 1 : 0;
await g.close();
