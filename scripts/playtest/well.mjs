// ---------------------------------------------------------------------------------------
// PLAYTEST: THE GREAT DUNEMAW (the slice's E1, docs/plans/SLICE.md). An agent goes to the mouth, goes down, bursts what it meets on
// each floor with the cutlass, goes down while there is a way down, and comes back up; the run must pay, the haul must come home.
// Played only through the agent interface (src/agent/agent.js): what an AI player could do, nothing it could not.
// ---------------------------------------------------------------------------------------
export const name = 'well';

export async function play(t) {
  t.check('travels to the mouth of the Well', (await t.act({ do: 'travel', place: 'well.mouth' })).ok);
  let s = await t.until((s) => s.interact?.id === 'well', 60 * 3);
  if (s.interact?.id !== 'well') { await t.act({ do: 'goto', place: 'well.mouth', within: 1.5 }); s = await t.until((s) => !s.task, 60 * 15); }
  t.check('the mouth is in reach', s.interact?.id === 'well', JSON.stringify(s.interact));
  await t.act({ do: 'interact' }); s = await t.until((s) => s.well, 60 * 3);
  t.check('goes down into the Well', !!s.well, `zone ${s.zone}`);
  await t.act({ do: 'use', tool: 'sondelass' }); await t.step(40);
  const floors = [];
  for (let guard = 0; guard < 3 && s.well; guard++) {
    const floor = s.well.floor;
    // hunt: the nearest jelly still standing, until none is; one that has got away four times running is left for last
    const missed = new Map();
    for (let n = 0; n < 80; n++) { // (80 rounds: a big floor (docs/plans/DUNEMAW.md) is long to cross, and a FOE takes five or so)
      s = await t.look();
      const me = s.courier.pos, dist = (f) => Math.hypot(f.pos[0] - me[0], f.pos[2] - me[2]) + (missed.get(f.id) >= 4 ? 1000 : 0);
      const foe = (s.well?.foes || []).slice().sort((a, b) => dist(a) - dist(b))[0]; // (the floor's, wherever they are: the route goes through the doorways)
      if (!foe) break;
      if ((missed.get(foe.id) || 0) >= 4) missed.set(foe.id, 0); // (all the rest are down or got away too: try it again)
      await t.act({ do: 'goto', to: foe.pos, within: 1.6 }); s = await t.until((s) => !s.task, 60 * 20);
      const at = s.courier.pos, d = Math.hypot(at[0] - foe.pos[0], at[2] - foe.pos[2]);
      const long = foe.cls ? 180 : 90; // (a FOE has three times the health)
      await t.act({ do: 'face', to: foe.pos }); await t.act({ do: 'attack', ticks: long }); await t.step(long);
      const s1 = await t.look(); missed.set(foe.id, s1.well?.foes?.some((x) => x.id === foe.id) && d > 2.5 ? (missed.get(foe.id) || 0) + 1 : 0);
      if (process.env.VERBOSE) { const s2 = await t.look(); t.log(`floor ${floor} hunt ${n}: ${s.result} d=${d.toFixed(1)} at=${at.map((v) => v.toFixed(1))} hand=${s.courier.inHand} foe ${foe.id} -> ${JSON.stringify(s2.well?.foes?.find((x) => x.id === foe.id) || 'down')}`); }
    }
    s = await t.look();
    floors.push({ floor, left: s.well?.mobs ?? 0 });
    if (!s.well?.down) break;
    // (down: a sandfall may stand in the way for up to 12 sim seconds, as a player would wait, so a few tries)
    for (let tries = 0; tries < 4 && s.well?.floor === floor; tries++) {
      await t.act({ do: 'goto', to: s.well.down, within: 0.9 }); s = await t.until((s) => !s.task, 60 * 30);
      await t.act({ do: 'interact' }); s = await t.until((s) => s.well && s.well.floor > floor, 60 * 3);
      if (s.well?.floor === floor) s = await t.until(() => false, 60 * 4);
    }
  }
  t.log('floors:', JSON.stringify(floors));
  { const astray = ((await t.look()).events || []).filter((e) => e.name === 'well.astray'); if (astray.length) t.log('astray:', JSON.stringify(astray.map((e) => [e.floor, e.at]))); }
  t.check('cleared every floor it stood on', floors.every((f) => f.left === 0), JSON.stringify(floors));
  t.check('reached the bottom (the third floor)', floors.some((f) => f.floor === 3));
  if (!s.well) { // (the run ended down there: shattered, or out of the Well's zone; say which instead of failing on a null)
    const left = ((await t.look()).events || []).filter((e) => e.name === 'well.leave').pop();
    t.check('still in the Well when the hunt was done', false, JSON.stringify(left)); return;
  }
  await t.act({ do: 'goto', to: s.well.up, within: 0.9 }); s = await t.until((s) => !s.task, 60 * 40);
  await t.act({ do: 'interact' }); s = await t.until((s) => !s.well, 60 * 3);
  t.check('comes back up out of the Well', !s.well, `zone ${s.zone}`);
  const all = s.events || [], leave = all.find((e) => e.name === 'well.leave');
  const s2 = await t.look();
  t.check('the run pays', leave?.pay > 0 || s2.log.some((l) => /cubes the richer/.test(l)), JSON.stringify(leave));
  t.check('the haul comes home', s2.box.some((id) => /^mat\.(eldritch|arcane|finery|mechanism|edge|art|provision)/.test(id)), s2.box.join(','));
}
