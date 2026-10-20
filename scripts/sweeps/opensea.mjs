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
