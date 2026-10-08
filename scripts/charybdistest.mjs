// ---------------------------------------------------------------------------------------
// THE MAELSTROM'S ARENA AND CHARYBDIS, HEADLESS (world/emocean/charybdis.js, railpath.js `arena`; RAIL-OVERHAUL.md 6): a drafted
// passage with a maelstrom (one waypoint made one, the test's own doing) sailed; at its peak the rail circles the whirlpool (whole laps,
// the ship about the arena's radius from its centre), the leg's heavy is held at the centre as Charybdis, rising and diving by turns
// (stage.foe under and not), said in the log as it first rises, let go at the release; the line comes out level; port made. One
// PASS/FAIL line a check. Run with the dev server up (URL= for another port).
// ---------------------------------------------------------------------------------------
import { openGame } from './playtest/game.mjs';

const g = await openGame({ seed: 9, query: '&clock=1791160275000' }); // (the clock pinned: the game day's sea)
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${typeof info === 'string' ? info : JSON.stringify(info)}`); };
await g.step(60);
const r0 = await g.page.evaluate(async () => {
  const G = __game.game, P = G.pier, V = G.voyage, C = P.chart, lines = [];
  const say = G.log.say.bind(G.log); G.log.say = (k, s, o) => { lines.push(s); return say(k, s, o); }; window.__lines = lines;
  const { lanes } = await import('/src/progress/econ/passage.js');
  G.cubes.earn(4000, 'test'); P.menu = P.menu || G.indexMenu;
  C.open(V.s.at, 'margarite'); const lane = lanes(C.chart).sort((a, b) => b.length - a.length)[0];
  const at = lane[Math.min(1, lane.length - 1)]; C.chart.waypoints[at].type = 'maelstrom'; C.chart.waypoints[at].feel = 'grief'; // (the test's own maelstrom)
  for (const id of lane) C.pick(id);
  return { cast: P.castOff(V.s.at, 'margarite'), lane, at };
});
await g.step(240);
const seen = { arena: 0, dist: [], under: new Set(), held: 0, foes: 0, after: null, released: false };
for (let i = 0; i < 4000; i++) {
  await g.step(6);
  const s = await g.page.evaluate(() => { const G = __game.game, E = G.emocean, M = G.indexMenu;
    if (!E.stage.active) return { done: true };
    if (E.offering && M?.open) document.querySelector('#indexmenu .room')?.click(); E.run.hits = 0;
    const C = E.charybdis, f = C?.foe, A = (E.arenas || [])[0], s = E.rail.speed * E.t, inArena = A && s >= A.at + A.len * 0.15 && s < A.at + A.len * 0.85;
    const R = E.rail, V3 = R.Q.constructor, ship = R.toWorld(E.ship.local, new V3()), fw = f?.alive ? f.pos.clone() : null;
    return { inArena: !!inArena, d: fw ? Math.hypot(ship.x - fw.x, ship.z - fw.z) : null, radius: A ? A.len * 0.9 / (2 * Math.PI * A.laps) : null, under: E.stage.foe?.id === 'charybdis' ? E.stage.foe.under : null, active: !!C?.active, held: !!f?.tick, up: R.up(new V3()).y, k: E.trip.k, afterArena: A ? s > A.at + A.len + 20 : false,
      ...(() => { const L = E.looks, H = L?.mael?.heart; if (!H || !inArena) return {}; const v = H.clone().project(G.camera), eye = L.beast?.eyes?.[0]?.root?.getWorldPosition(new V3());
        return { onScreen: v.z < 1 && Math.abs(v.x) < 0.95 && Math.abs(v.y) < 0.95, shipA: Math.atan2(ship.z - H.z, ship.x - H.x), eyeA: eye ? Math.atan2(eye.z - H.z, eye.x - H.x) : null, senses: [E.sea?.whirl?.sense ?? null, L.mael.sense, -(A.sign ?? 1)], sign: A.sign ?? 1 }; })() };
  });
  if (s.done) break;
  if (s.inArena && s.shipA != null) { seen.onScreen = (seen.onScreen || 0) + (s.onScreen ? 1 : 0); seen.senses = s.senses; seen.sign = s.sign;
    if (seen.last) { const d = (a, b) => { let x = a - b; while (x > Math.PI) x -= 2 * Math.PI; while (x < -Math.PI) x += 2 * Math.PI; return x; }; const ds = d(s.shipA, seen.last.shipA), de = s.eyeA != null && seen.last.eyeA != null ? d(s.eyeA, seen.last.eyeA) : 0; if (Math.abs(ds) > 1e-4) { seen.shipTurns = (seen.shipTurns || 0) + 1; if (s.sign * ds < 0) seen.shipRight = (seen.shipRight || 0) + 1; if (de * ds > 0) seen.eyeWith = (seen.eyeWith || 0) + 1; } }
    seen.last = { shipA: s.shipA, eyeA: s.eyeA }; }
  if (s.inArena) { seen.arena++; if (s.d != null) seen.dist.push(s.d); if (s.held) seen.held++; seen.radius = s.radius; }
  if (s.under != null) seen.under.add(s.under);
  if (s.afterArena && !seen.after) seen.after = { up: s.up, active: s.active };
}
const r2 = await g.page.evaluate(() => ({ active: __game.game.emocean.stage.active, at: __game.game.voyage.s.at, lines: window.__lines.filter((l) => /Charybdis/.test(l)), foe: __game.game.emocean.stage.foe }));
// a second maelstrom, flown by a scripted expert (Dovina's ask): the cursor on Charybdis, the gun held, the ship's form following it
// between the worlds (as a diver would); the bar of the peak it falls at, or driven off with what hp it kept
await g.step(200);
const r3 = await g.page.evaluate(async () => {
  const G = __game.game, P = G.pier, V = G.voyage, C = P.chart; window.__fell = null;
  G.events.on('charybdis.felled', () => { const E = G.emocean, L = E.trip.layout.legs[E.charybdis.k]; window.__fell = +(E.bar - L.peak).toFixed(1); });
  G.events.on('charybdis.driven', (e) => { window.__fell = { driven: e.hp }; });
  const { lanes } = await import('/src/progress/econ/passage.js');
  C.open(V.s.at, V.s.at === 'margarite' ? 'anagami' : 'margarite'); const lane = lanes(C.chart).sort((a, b) => b.length - a.length)[0];
  const at = lane[Math.min(1, lane.length - 1)]; C.chart.waypoints[at].type = 'maelstrom'; for (const id of lane) C.pick(id);
  return P.castOff(V.s.at, V.s.at === 'margarite' ? 'anagami' : 'margarite');
});
await g.step(240);
for (let i = 0; i < 4000; i++) {
  await g.step(4);
  const done = await g.page.evaluate(() => { const G = __game.game, E = G.emocean, M = G.indexMenu, Cy = E.charybdis;
    if (!E.stage.active) return true;
    if (E.offering && M?.open) document.querySelector('#indexmenu .room')?.click(); E.run.hits = 0;
    const f = Cy?.active && Cy.foe?.alive ? Cy.foe : null;
    if (f) { const v = f.pos.clone().project(G.camera); E.ship.cursor.x = Math.max(-1, Math.min(1, v.x)); E.ship.cursor.y = Math.max(-1, Math.min(1, v.y)); E.ship.form = Cy.y > 0 ? 'astral' : 'umbral'; G.input.down.add('Mouse0'); }
    else G.input.down.delete('Mouse0');
    return window.__fell != null && !Cy?.active; });
  if (done) break;
}
const fell = await g.page.evaluate(() => { __game.game.input.down.delete('Mouse0'); return window.__fell; });
console.log(`  (the scripted expert: ${typeof fell === 'number' ? `Charybdis felled at bar ${fell} of the 24-bar peak` : fell ? `driven off with ${fell.driven} of 150 hp` : 'not met'})`);

const dmin = Math.min(...seen.dist), dmax = Math.max(...seen.dist);
check('cast off through a maelstrom', r0.cast, r0);
check('the arena is flown (the rail circles the whirlpool)', seen.arena > 50, { frames: seen.arena });
check('Charybdis is held at its heart through the arena', seen.held > 0.9 * seen.arena, { held: seen.held, of: seen.arena });
check('the ship circles at about the arena\'s radius from it', seen.dist.length && dmin > seen.radius * 0.7 && dmax < seen.radius * 1.3, { radius: seen.radius && +seen.radius.toFixed(1), d: [dmin, dmax].map((v) => +v.toFixed(1)) });
check('Charybdis is on screen through the arena (the game\'s own camera)', (seen.onScreen || 0) > 0.9 * seen.arena, { onScreen: seen.onScreen, of: seen.arena });
check('the ship, Charybdis and the whirlpool turn one way (sign * d(ship angle) < 0; senses -sign)', seen.shipTurns > 10 && seen.shipRight > 0.9 * seen.shipTurns && seen.eyeWith > 0.8 * seen.shipTurns && seen.senses?.every((x) => x === -seen.sign), { turns: seen.shipTurns, right: seen.shipRight, eyeWith: seen.eyeWith, senses: seen.senses, sign: seen.sign });
check('it rises and dives by turns (stage.foe under, and not)', seen.under.has(true) && seen.under.has(false), [...seen.under]);
check('said as it first rises, in the waypoint\'s feeling', r2.lines.some((l) => /Charybdis rises, in grief/.test(l)), r2.lines);
check('let go at the release; the line comes out level', seen.after && !seen.after.active && seen.after.up > 0.999, seen.after);
check('port made, no boss left set', !r2.active && r2.at === 'margarite' && !r2.foe, r2);
check('the second crossing cast off', r3, r3);
check('the scripted expert meets it: felled or driven off, said', fell != null, fell);
check('no page errors', g.errors.length === 0, g.errors.slice(0, 3));
console.log(fails ? `charybdis: ${fails} FAILED` : 'charybdis: all passed'); process.exitCode = fails ? 1 : 0;
await g.close();
