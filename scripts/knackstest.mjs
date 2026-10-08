// ---------------------------------------------------------------------------------------
// THE KNACKS, HEADLESS (progress/knacks.js and every switch point Petra wired): each knack closed before the ledger opens it, said once
// when it opens (`knack.open`), doing its one thing while on, and the game exactly as it was when switched off. Steady Hand's pull and
// Wide Bore's reach (tools/psygun/weapon.js), Thick Walls' shield (courier/vessel/damage.js), Held Breath's window (courier/parry.js and
// the outline's eta, creatures.shownEta), Wet Ink's rest (tools/soulbrush/celestial.js), Perfect Pitch's second reference
// (world/dunes/crystals.js) and Ariadne's Thread (feedback/cartography.js). One PASS/FAIL line a check.
// Run with the dev server up: `node scripts/knackstest.mjs` (URL= for another port).
// ---------------------------------------------------------------------------------------
import { openGame } from './playtest/game.mjs';

const g = await openGame({ seed: 4 });
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${typeof info === 'string' ? info : JSON.stringify(info)}`); };
await g.step(120);
const r = await g.page.evaluate(async () => {
  const G = __game.game, K = G.knacks, L = G.ledger, out = {}, evs = [];
  G.events.on('knack.open', (e) => evs.push(e));
  out.closed = ['steadyHand', 'thickWalls', 'heldBreath', 'wetInk', 'perfectPitch', 'ariadnesThread', 'wideBore'].filter((k) => K.open(k));
  // open them all the patient's way (the counts)
  L.inc('drill.hits', 5000); L.inc('vessel.mends', 200); L.inc('move.parry', 500); L.inc('brush.miss', 100); L.inc('crystal.strike', 300); L.inc('map.room', 50);
  K.update(2); K.update(2);
  out.opened = evs.map((e) => e.knack); out.said = G.log.lines?.slice?.(-12).map((l) => l.text || l).filter((t) => /knack of it/.test(t)).length ?? null;
  // Thick Walls: a full blow on a full pool costs 35, or 35 / 1.1
  const pool = G.lachryma, cost = (on) => { K.set('thickWalls', on); pool.value = pool.max; const a = pool.value; G.vesselDamage.hit({ k: 1, by: 'environment' }); return +(a - pool.value).toFixed(2); };
  out.walls = { on: cost(true), off: cost(false) }; K.set('thickWalls', true);
  // Held Breath: the window and the outline's eta (switched off, the eta is unchanged)
  const { blowWindow } = await import('/src/courier/parry.js');
  const C = G.creatures;
  K.set('heldBreath', false); out.breathOff = { w: blowWindow(G), e01: C.shownEta(0.1), e04: C.shownEta(0.4) };
  K.set('heldBreath', true); out.breathOn = { w: blowWindow(G), e04: C.shownEta(0.4), e02: C.shownEta(0.2), e1: C.shownEta(1) };
  // Wet Ink: the rest before Celestial mode reads (0.42 s, or 0.7 s)
  const cel = G.player.techs?.get?.('soulbrush')?.celestial || null;
  if (cel) { K.set('wetInk', false); const a = cel.rest(); K.set('wetInk', true); out.ink = { off: a, on: cel.rest() }; }
  // Perfect Pitch: a swing of the Dreamvane at a ringing crystal sounds the reference once more (crystal.ref with `again`); off, never
  const X = G.crystals, xt = X?.list.find((e) => e.hp > 0 && !e.veiled);
  if (xt) {
    let refs = 0; const count = (e) => { if (e.again) refs++; }; G.events.on('crystal.ref', count);
    const was = { on: G.dunes.active, pos: G.player.pos.clone() }; G.dunes.active = true; G.player.pos.copy(xt.pos); xt.ringT = 3;
    K.set('perfectPitch', false); G.events.emit('dreamvane.swing', { n: 1, move: 'pick', by: 'courier' }); const off = refs;
    K.set('perfectPitch', true); G.events.emit('dreamvane.swing', { n: 1, move: 'pick', by: 'courier' });
    out.pitch = { off, on: refs - off }; G.events.off?.('crystal.ref', count); xt.ringT = 0; G.dunes.active = was.on; G.player.pos.copy(was.pos);
  }
  // Ariadne's Thread: the way walked spooled, a loop cut where it crosses itself, drawn only when on
  const M = G.cartography || G.map; out.map = !!M;
  if (M) {
    M.thread.length = 0; const p = G.player.pos.clone();
    for (const [dx, dz] of [[0, 0], [4, 0], [8, 0], [8, 4], [8, 8], [4, 8], [0, 8], [0, 4], [0.5, 0.5]]) M.spool({ x: p.x + dx, y: p.y, z: p.z + dz });
    out.thread = M.thread.length; // (back where it began: the loop cut, the start kept)
    G.shrines.last = G.shrines.last || 'bisque';
    let drawn = 0; const ctx = { save() {}, restore() {}, setLineDash() {}, beginPath() {}, moveTo() { drawn++; }, lineTo() { drawn++; }, stroke() {} };
    const l = M.layerOf(G.player.pos.y);
    K.set('ariadnesThread', false); M.drawThread(ctx, l, M.view, G.player); out.threadOff = drawn;
    K.set('ariadnesThread', true); M.drawThread(ctx, l, M.view, G.player); out.threadOn = drawn;
  }
  // Steady Hand: a creature 2 degrees off the reticle is drawn in; 5 degrees off is left alone; off, nothing moves
  const W = G.weapon, P = G.player, cam = G.camera;
  const jelly = C.list.find((c) => c.alive && !c.ally && !c.training);
  out.jelly = jelly?.kind || null;
  if (jelly) {
    const ctr = jelly.center ? jelly.center(new jelly.pos.constructor()) : jelly.pos.clone();
    const ang = () => { const f = P.lookDir(new ctr.constructor()); return (f.angleTo(ctr.clone().sub(cam.position).normalize()) * 180) / Math.PI; };
    // the camera set 10 m from it (the jelly may be anywhere; the frame is not drawn in this test), aimed straight at it, then the
    // Courier's yaw turned a few degrees away
    cam.position.copy(ctr).add(new ctr.constructor(6, 3, -7.5));
    const aimAt = (deg) => { const to = ctr.clone().sub(cam.position).normalize(); P.yaw = Math.atan2(to.x, to.z) + (deg * Math.PI) / 180; P.pitch = Math.asin(to.y); };
    const pull = (deg, on) => { K.set('steadyHand', on); aimAt(deg); const a0 = ang(); for (let i = 0; i < 10; i++) W.steady(P); return { a0: +a0.toFixed(2), a1: +ang().toFixed(2) }; };
    out.steady = { near: pull(2, true), far: pull(6, true) }; // (off, the update never calls it: weapon.update asks knacks.on first)
    // Wide Bore: a ray passing 1.2 radii from its centre is taken; off, it is not
    const rad = jelly.radius || 0.5, side = new ctr.constructor(1, 0, 0), origin = ctr.clone().addScaledVector(side, rad * 1.2).add(new ctr.constructor(0, 0, -8));
    const ray = { origin, dir: new ctr.constructor(0, 0, 1) };
    out.bore = { hit: !!W.wideBore(ray, 30, null), wide: !!W.wideBore({ origin: ctr.clone().addScaledVector(side, rad * 1.5).add(new ctr.constructor(0, 0, -8)), dir: ray.dir }, 30, null) };
  }
  out.thrice = (() => { const n = evs.length; K.update(2); K.update(2); return evs.length - n; })();
  return out; });
console.log(JSON.stringify(r));
check('every knack closed before the ledger opens it', Array.isArray(r.closed) && r.closed.length === 0, r.closed);
check('opened by the ledger: knack.open for each, said in the log', ['steadyHand', 'wideBore', 'thickWalls', 'heldBreath', 'wetInk', 'perfectPitch', 'ariadnesThread'].every((k) => r.opened.includes(k)), r.opened);
check('knack.open said once, never again', r.thrice === 0, r.thrice);
check('Thick Walls: a full blow costs 35 / 1.1 on, 35 off', Math.abs(r.walls.on - 35 / 1.1) < 0.05 && Math.abs(r.walls.off - 35) < 0.05, r.walls);
check('Held Breath off: the window 0.25 and the outline unchanged', r.breathOff.w === 0.25 && Math.abs(r.breathOff.e01 - 0.1) < 1e-9, r.breathOff);
check('Held Breath on: the window 0.40, the outline fullest from its start', r.breathOn.w === 0.4 && Math.abs(r.breathOn.e04 - 0.25) < 1e-9 && r.breathOn.e02 < 0.25, r.breathOn);
check('Wet Ink: the rest 0.42 s off, 0.7 s on', r.ink?.off === 0.42 && r.ink?.on === 0.7, r.ink);
check('Perfect Pitch: one more reference at a swing, none while off', r.pitch?.off === 0 && r.pitch?.on === 1, r.pitch);
check('Ariadne\'s Thread: a loop cut where the way crosses itself', r.thread === 1, r.thread);
check('Ariadne\'s Thread: drawn only while on', r.threadOff === 0 && r.threadOn >= 2, { off: r.threadOff, on: r.threadOn });
if (r.jelly) {
  check('Steady Hand: a target 2 degrees off is drawn in', r.steady.near.a1 < r.steady.near.a0 * 0.5, r.steady.near);
  check('Steady Hand: a target 6 degrees off is left alone', Math.abs(r.steady.far.a1 - r.steady.far.a0) < 0.05, r.steady.far);
  check('Wide Bore: a ray 1.2 radii out is taken, 1.5 radii is not', r.bore.hit && !r.bore.wide, r.bore);
} else check('a creature to aim at (seed 4, the workshop)', false, 'none alive');
check('no page errors', g.errors.length === 0, g.errors.slice(0, 3));
console.log(fails ? `knacks: ${fails} FAILED` : 'knacks: all passed'); process.exitCode = fails ? 1 : 0;
await g.close();
