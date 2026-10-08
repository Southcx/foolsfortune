// ---------------------------------------------------------------------------------------
// THE RAIL AS A SPLINE, HEADLESS (world/emocean/railpath.js, stage.js's rail frame; RAIL-OVERHAUL.md 5): a drafted passage sailed
// with every turn of the rail one figure (`/figure`), for each of the four. Through each turn: the frame turns as the figure says (the
// vertical loop and the corkscrew upside down at their middle, the crest up, the weave across), the rail's local and world agree both ways,
// the camera's up stays the rail's up, the ship and the camera stay in the Emocean's zone; through the legs the rail is level; the
// ship makes port. One PASS/FAIL line a check. Run with the dev server up (URL= for another port).
// ---------------------------------------------------------------------------------------
import { openGame } from './playtest/game.mjs';

const g = await openGame({ seed: 7 });
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${typeof info === 'string' ? info : JSON.stringify(info)}`); };
await g.step(60);
for (const figure of ['verticalLoop', 'corkscrew', 'crest', 'weave']) {
  const r0 = await g.page.evaluate(async (figure) => {
    const G = __game.game, P = G.pier, V = G.voyage, C = P.chart, E = G.emocean;
    const { lanes } = await import('/src/progress/econ/passage.js');
    G.cubes.earn(4000, 'test'); P.menu = P.menu || G.indexMenu; E.figure = figure;
    const to = V.s.at === 'margarite' ? 'anagami' : 'margarite';
    C.open(V.s.at, to); const lane = lanes(C.chart).sort((a, b) => b.length - a.length)[0]; for (const id of lane) C.pick(id);
    return { cast: P.castOff(V.s.at, to), n: lane.length };
  }, figure);
  await g.step(240);
  const seen = { minUp: 1, maxY: -1e9, minY: 1e9, maxX: 0, legTilt: 0, round: 0, camUp: 1, zoneOut: 0, turns: 0, frames: 0, figures: null };
  for (let i = 0; i < 1600; i++) {
    await g.step(12);
    const s = await g.page.evaluate(() => {
      const G = __game.game, E = G.emocean, R = E.rail, T = E.trip, M = G.indexMenu;
      if (!E.stage.active) return { done: true };
      if (E.offering && M?.open) document.querySelector('#indexmenu .room')?.click();
      E.run.hits = 0;
      const THREE = R.Q.constructor, up = R.up(new THREE()), l = new THREE(1.3, 2.1, 5.7), w = R.toWorld(l, new THREE()), back = R.toLocal(w, new THREE());
      const cam = G.camera, cu = new THREE(0, 1, 0).applyQuaternion(cam.quaternion);
      const turning = R.path.turning(R.speed * E.t), inLeg = T.active && T.k >= 0;
      return { up: up.y, Qy: R.Q.y, Qx: R.Q.x, shipY: E.ship.look?.group.position.y ?? null, round: back.distanceTo(l), camUp: cu.dot(up), zone: G.zones?.zoneOf?.(G.player.pos) ?? null, turning, inLeg, figures: E.figures };
    });
    if (s.done) break;
    seen.frames++; seen.figures = s.figures;
    seen.round = Math.max(seen.round, s.round);
    if (s.turning) { seen.turns++; seen.minUp = Math.min(seen.minUp, s.up); seen.maxY = Math.max(seen.maxY, s.Qy); seen.minY = Math.min(seen.minY, s.Qy); seen.maxX = Math.max(seen.maxX, Math.abs(s.Qx + 3000)); seen.camUp = Math.min(seen.camUp, s.camUp); if (s.shipY != null) seen.shipLow = Math.min(seen.shipLow ?? 1e9, s.shipY + 420); }
    if (s.inLeg && !s.turning) seen.legTilt = Math.max(seen.legTilt, 1 - s.up);
    if (s.zone && s.zone !== 'emocean') seen.zoneOut++;
  }
  const r2 = await g.page.evaluate(() => ({ active: __game.game.emocean.stage.active, at: __game.game.voyage.s.at }));
  const shape = { verticalLoop: seen.minUp < -0.9 && seen.maxY > -420 + 20, corkscrew: seen.minUp < -0.9, crest: seen.maxY > -420 + 12 && seen.minUp > 0.8, weave: seen.maxX > 10 && seen.minUp > 0.7 }[figure];
  check(`${figure}: cast off, ${r0.n} waypoints, every turn a ${figure}`, r0.cast && seen.figures?.length > 0 && seen.figures.every((f) => f === figure), seen.figures);
  check(`${figure}: the frame turns as the figure says`, seen.turns > 0 && shape, { minUp: +seen.minUp.toFixed(2), rise: +(seen.maxY + 420).toFixed(1), across: +seen.maxX.toFixed(1), frames: seen.turns });
  check(`${figure}: level through the legs`, seen.legTilt < 1e-3, +seen.legTilt.toFixed(5));
  check(`${figure}: local and world agree both ways`, seen.round < 1e-3, +seen.round.toFixed(6));
  check(`${figure}: the camera's up stays the rail's up`, seen.camUp > 0.85, +seen.camUp.toFixed(3));
  check(`${figure}: in the Emocean's zone throughout`, seen.zoneOut === 0, seen.zoneOut);
  check(`${figure}: the ship stays above the sea through the turn`, (seen.shipLow ?? 0) > 1.5, +(seen.shipLow ?? 0).toFixed(2));
  check(`${figure}: makes port`, !r2.active, r2);
  await g.step(200);
}
check('no page errors', g.errors.length === 0, g.errors.slice(0, 3));
console.log(fails ? `rail path: ${fails} FAILED` : 'rail path: all passed'); process.exitCode = fails ? 1 : 0;
await g.close();
