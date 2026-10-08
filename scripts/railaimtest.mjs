// ---------------------------------------------------------------------------------------
// THE RAIL'S AIM, HEADLESS (courier/ship/ship.js aimAt; the owner's bug, RAIL-OVERHAUL.md 1.4): a crossing boarded, the cursor set off
// the centre, and through the run the far reticle is found under the cursor on the screen in every free view (chase, free, astern),
// swings included; the scroll views (above, side) fire along the scroll by design and are not judged. One PASS/FAIL line a check.
// Run with the dev server up: `node scripts/railaimtest.mjs` (URL= for another port).
// ---------------------------------------------------------------------------------------
import { openGame } from './playtest/game.mjs';
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${typeof info === 'string' ? info : JSON.stringify(info)}`); };
const g = await openGame({ seed: 2 });
await g.step(60);
const b = await g.page.evaluate(() => { const G = __game.game; G.cubes.earn(2000, 'test'); const r = G.voyage.board(G.voyage.s.at, 'margarite'); G.emocean.begin?.(); return { ok: r?.ok, why: r?.why, at: G.voyage.s.at }; });
check('a crossing boards', b.ok, b);
await g.step(240);
const out = [];
for (let i = 0; i < 70; i++) {
  await g.step(i === 0 ? 2 : 30);
  out.push(await g.page.evaluate(() => {
    const G = __game.game, E = G.emocean, sh = E.ship, cam = G.camera, THREE = cam.position.constructor;
    if (!E.stage.active) return null;
    sh.cursor.x = 0.6; sh.cursor.y = -0.4;
    const sw = E.swingAt(E.bar);
    const p = E.rail.toWorld(sh.retFar, new THREE()).project(cam);
    const acts = E.plan.acts.find((a) => E.bar >= a.from && E.bar < a.to), view = sw ? (sw.k < 0.5 ? sw.from : sw.to) : acts?.view; return { bar: +E.bar.toFixed(1), view, swing: !!sw, err: +Math.hypot(p.x - 0.6, p.y + 0.4).toFixed(3) };
  }));
}
const live = out.filter(Boolean).slice(1); // (the first sample: the cursor was set that frame)
const free = live.filter((x) => ['chase', 'free', 'astern'].includes(x.view));
const errs = free.map((x) => x.err).sort((p, q) => p - q), med = errs[Math.floor(errs.length / 2)];
check('the crossing ran in the free views', free.length >= 30, free.length);
check('the far reticle sits under the cursor (median under 0.02 of the screen)', med < 0.02, med);
check('and never strays past 0.1 of the screen in a free view', errs[errs.length - 1] < 0.1, errs[errs.length - 1]);
check('no page errors', g.errors.length === 0, g.errors.slice(0, 3));
console.log(fails ? `rail aim: ${fails} FAILED` : 'rail aim: all passed'); process.exitCode = fails ? 1 : 0;
await g.close();
