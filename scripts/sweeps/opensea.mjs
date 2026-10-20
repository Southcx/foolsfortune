// ---------------------------------------------------------------------------------------
// THE OPEN SEA'S SWEEP (docs/plans/OPEN-SEA.md; world/opensea/): the room entered from the Index's place, the ship boarded, a square
// sailed at cruise (charted, fuel burnt), an islet moored at and stepped onto (and stood on), the ship boarded again, and a dock taken
// (the tank filled). One PASS/FAIL line a check; a screenshot at each step. Only what breaks the room is checked: the open sea is new.
//
//   npm run dev &   node scripts/sweeps/opensea.mjs [--out dir]
// ---------------------------------------------------------------------------------------
import { open } from './harness.mjs';

const S = await open('opensea');
const st = () => S.ev(() => { const g = __game.game, O = g.opensea, P = g.player, H = O?.helm, v = O?.voyage;
  return { zone: g.zones?.current, sailing: !!O?.sailing, moored: O?.moored || null, hidden: !!g.character?.hidden, p: [P.pos.x, P.pos.y, P.pos.z].map((n) => +n.toFixed(1)),
    ship: H ? [H.pos.x, H.pos.y, H.pos.z].map((n) => +n.toFixed(1)) : null, speed: H ? +H.speed.toFixed(2) : null, fuel: v ? +v.fuel.toFixed(2) : null, at: v?.at, charted: v?.charted.size,
    nan: !Number.isFinite(P.pos.x + P.pos.y + P.pos.z), seaShown: !!g.emocean?.sea?.mesh.visible, cam: [__game.camera.position.x, __game.camera.position.y].map((n) => +n.toFixed(1)) }; });

await S.go('opensea'); await S.ticks(30);
let s = await st();
S.check('enter: in the open sea zone, on the quay, the sea drawn', s.zone === 'opensea' && s.seaShown && Math.abs(s.p[1] - (-420 + 1.6)) < 1.5, s);
await S.shot('quay');
await S.press('KeyF', 4); s = await st();
S.check('board: F at the ship seals you in at the helm (sailing, the Courier hidden)', s.sailing && s.hidden, s);
const fuel0 = s.fuel, at0 = s.at, ship0 = s.ship;
await S.press('KeyW', 2); await S.press('KeyW', 2); await S.ticks(60 * 45); s = await st();
S.check('sail: at cruise for 45 real s the ship moves on and charts a new square, burning fuel', Math.hypot(s.ship[0] - ship0[0], s.ship[2] - ship0[2]) > 250 && s.charted > 1 && s.fuel < fuel0, { ...s, at0, fuel0 });
S.check('sail: nothing is NaN and the camera is near the ship', !s.nan && Math.hypot(s.cam[0] - s.ship[0]) < 40, s);
await S.shot('sailing');
// to an islet: set the ship off its shore, stopped, and moor
const isl = await S.ev(() => { const O = __game.game.opensea, i = O.props.islets[0]; O.helm.throttle = 0; O.helm.speed = 0; O.helm.pos.set(i.pos.x + i.r + 10, -420, i.pos.z); return { x: i.pos.x, z: i.pos.z, r: i.r, top: i.top }; });
await S.ticks(10); await S.press('KeyF', 4); await S.ticks(120); s = await st();
S.check('moor: F by an islet steps you onto it, and you stand on its top', !s.sailing && s.moored?.islet && Math.abs(s.p[1] - isl.top) < 1.2 && Math.hypot(s.p[0] - isl.x, s.p[2] - isl.z) < isl.r + 0.5, { ...s, isl });
await S.shot('islet');
// the islets' puzzles and caches (OPEN-SEA.md 12): walked to on foot, each one solved as a player would
const walkTo = (pos) => S.ev((p) => { __game.game.course.teleport(new (__game.game.player.pos.constructor)(p[0], p[1] + 0.05, p[2]), 0, { keepPool: true }); }, [pos.x, pos.y, pos.z]);
const pz = await S.ev(() => { const X = __game.game.opensea.pieces, v = (p) => ({ x: p.x, y: p.y, z: p.z });
  return { pair: X.pairs[0] && { id: X.pairs[0].id, at: X.pairs[0].at.map((h) => v(h.pos)) }, echo: X.echoes[0] && { id: X.echoes[0].id, phrase: X.echoes[0].phrase, at: v(X.echoes[0].playAt.pos) },
    cache: X.caches.find((c) => !c.sealed) && { id: X.caches.find((c) => !c.sealed).id, at: v(X.caches.find((c) => !c.sealed).ground) }, counts: [X.pairs.length, X.lineups.length, X.echoes.length, X.caches.length] }; });
S.check('puzzles: the sea deals pairs, line-ups, echoes and caches', pz.counts.every((n) => n > 0), pz.counts);
for (const at of pz.pair.at) { await walkTo(at); await S.ticks(10); }
s = await S.ev((id) => ({ found: __game.game.opensea.voyage.found.has(id), solved: __game.game.opensea.puzzle.solved.has(id) }), pz.pair.id);
S.check('pair: both carvings seen makes a find to report', s.found && s.solved, s);
s = await S.ev(() => { const L = __game.game.opensea.pieces.lineups[0], out = [];
  for (const a of L.arcs) { a.updateMatrixWorld(true); const pos = a.geometry.attributes.position, p = new (L.eye.constructor)();
    for (const k of [0, Math.floor(pos.count / 2), pos.count - 1]) { p.fromBufferAttribute(pos, k).applyMatrix4(a.matrixWorld); out.push(p.clone().sub(L.eye).angleTo(L.dir)); } }
  return { min: Math.min(...out), max: Math.max(...out), size: L.size }; });
S.check("line-up: from the spot's eye every arc sits on one ring (its angle off the line within 0.01 rad of the size)", Math.abs(s.min - s.size) < 0.01 && Math.abs(s.max - s.size) < 0.01, s);
const cubes0 = await S.ev(() => __game.game.cubes?.balance ?? 0);
await walkTo(pz.echo.at); await S.ticks(5);
await S.ev((ph) => { for (const d of [3, ...ph]) __game.game.events.emit('crucibelle.note', { degree: d, by: 'courier' }); }, pz.echo.phrase);
s = await S.ev((id) => ({ solved: __game.game.opensea.puzzle.solved.has(id), dug: [...__game.game.opensea.puzzle.dug], cubes: __game.game.cubes?.balance ?? 0 }), pz.echo.id);
S.check('echo: the phrase played by the listening stone opens its cache and pays', s.solved && s.dug.some((d) => d.includes(pz.echo.id)) && s.cubes > cubes0, { ...s, cubes0 });
await walkTo(pz.cache.at); await S.ticks(5);
const c1 = await S.ev(() => __game.game.cubes?.balance ?? 0);
s = await S.ev((a) => { const g = __game.game, sig = g.signatures.around(g.player.pos, 4).some((x) => x.kind === 'chest' && x.ref?.id === a.id), n = g.opensea.pieces.unearth(new (g.player.pos.constructor)(a.at.x, a.at.y, a.at.z), 3.2);
  return { sig, n, after: g.signatures.around(g.player.pos, 4).some((x) => x.kind === 'chest' && x.ref?.id === a.id), cubes: g.cubes?.balance ?? 0 }; }, pz.cache);
S.check('dig: a buried cache gives off a chest signature for the dowse, comes up once and pays, and its signature goes', s.sig && s.n === 1 && !s.after && s.cubes > c1, { ...s, c1 });
await S.shot('dug');
await walkTo({ x: isl.x + isl.r - 1.5, y: isl.top, z: isl.z }); await S.ticks(5); // (back by the moored ship)
await S.press('KeyF', 4); s = await st();
S.check('board again: F by the moored ship takes you back to the helm', s.sailing && s.hidden, s);
// to the home quay: dock
await S.ev(() => { const O = __game.game.opensea, q = O.props.quays.anagami; O.helm.throttle = 0; O.helm.speed = 0; O.helm.pos.set(q.pos.x, -420, q.pos.z + 22); });
await S.ticks(10); await S.press('KeyF', 4); await S.ticks(30); s = await st();
const tank = await S.ev(() => __game.game.opensea && 7.5);
S.check('dock: F at a quay docks you, the tank filled as far as your cubes go, and you step ashore', !s.sailing && s.moored?.quay === 'anagami' && s.fuel > fuel0 - 0.6, { ...s, tank });
await S.shot('docked');
await S.common('opensea');
await S.done();
