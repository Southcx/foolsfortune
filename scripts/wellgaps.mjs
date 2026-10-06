// ---------------------------------------------------------------------------------------
// THE WELL'S GAP CHECK: every floor of the Great Dunemaw built in turn, and from the middle of every room rays cast all round at three
// heights; a ray that runs 60 m without meeting anything, or ends outside the floor's plan, has found a hole in the walls (the swirl's
// shear once left them: world/well/wellkit.js). Prior art: a level editor's leak check (Quake's qbsp: a leak is a line out to the void).
//
//   npm run dev &   node scripts/wellgaps.mjs
// ---------------------------------------------------------------------------------------
import { openGame } from './playtest/game.mjs';
const g = await openGame({ seed: 1, query: '&clock=1791160275000' });
const p = g.page;
for (const floor of [1, 2, 3]) {
  await p.evaluate((floor) => { const W = __game.game.well; if (!W.run) W.enter(); W.goTo(floor); }, floor);
  await g.step(5); // (the physics world must step once for its queries to see the new floor)
  const r = await p.evaluate((floor) => {
    const G = __game.game, W = G.well, T = __game.THREE;
    const F = W.cur, out = [];
    for (const c of F.cells) for (let k = 0; k < 72; k++) for (const h of [1.5, 3.5, 5.5]) {
      const a = (k / 72) * Math.PI * 2, d = { x: Math.sin(a), y: 0, z: Math.cos(a) }, o = { x: c.x, y: c.y + h + (c.slope ? 3 : 0), z: c.z };
      // walk the ray: through doorways into rooms, stopped by anything static; out past 40 m of nothing is a hole
      const hit = G.physics.raycast(o, d, 60);
      const end = hit ? hit.point : new T.Vector3(o.x + d.x * 60, o.y, o.z + d.z * 60);
      if (!hit || !F.cellAt(end.x - d.x * 0.3, end.z - d.z * 0.3)) out.push(`${c.c},${c.r} h${h} a${(a * 180 / Math.PI).toFixed(0)} -> ${hit ? 'hit outside the plan at ' + end.toArray().map((v) => v.toFixed(1)).join(',') : 'nothing in 60 m'}`);
    }
    return out;
  }, floor);
  console.log(`floor ${floor}: ${r.length} rays escaped`); for (const l of r.slice(0, 8)) console.log('  ' + l);
}
await g.close();
