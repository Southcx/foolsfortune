// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S SWEEP: the psychic tools in the Well's side-on frame (world/strawmanwell/wellframe.js), the bug South reported
// (2026-11-01: "not being able to grapple or swing with the sondelass, or aim with the Psygun"). In the Run stage: the aim source lent
// (core/aimsource.js), the psygun's aim point on the stage's plane and a shot fired, the hook's probe biting along the plane, and each of
// the seven tools drawn and its LMB and RMB said by their events, the body never off the plane. In the Swing stage: the hook lent in its
// form, thrown at the first ring from a jump, biting it and swinging. A tool taken out of the Well gives the camera back. One PASS/FAIL
// line a check; exits non-zero on any FAIL.
//
//   npm run dev &   then   node scripts/sweeps/strawmanwell.mjs [--out dir]
//
// Prior art: scripts/sweeps/tools.mjs (each tool's verbs from its keys, mouse buttons on the game's input), the casebook's
// 379.
// ---------------------------------------------------------------------------------------
import { open } from './harness.mjs';

const S = await open('strawmanwell');
await S.closeAll();
await S.go('strawmanwell'); await S.ticks(30);
await S.ev(() => __game.game.strawmanWell.go('run')); await S.settle(); await S.ticks(60);

const run = await S.ev(() => {
  const g = __game.game, I = __game.input, tick = (n) => __sw.tick(n), F = g.strawmanWell.frame, B = g.belt, z = F.spec.z;
  const press = (k, n = 2) => { I.pressed.add(k); I.down.add(k); tick(n); I.down.delete(k); tick(2); };
  const evs = []; const E = g.events, own = E.emit; E.emit = function (n, d) { evs.push(n); return own.call(this, n, d); };
  const r = { lent: g.aim.lent, z, tools: {} };
  for (const id of ['psygun', 'sondelass', 'soulbrush', 'veritome', 'dreamvane', 'crucibelle', 'lockheart']) {
    if (B.inHand) { press('KeyX'); tick(40); }
    B.equip(id, 'main', { quiet: true }); tick(4); press('KeyX'); tick(45);
    F.aimer.off.set(5, 1); tick(3);
    const o = { inHand: B.inHand?.id ?? null };
    if (id === 'psygun') { const p = g.weapon.aimPoint; o.aimZ = +(p.z - z).toFixed(2); o.aimAhead = +(p.x - g.player.pos.x).toFixed(1); }
    if (id === 'sondelass') { press('Digit3'); tick(30); F.aimer.off.set(6, -2); tick(3); const h = g.techs.get('sondelass').hookshot.probe(); o.probeZ = h ? +(h.point.z - z).toFixed(2) : null; press('Digit1'); tick(20); }
    evs.length = 0; press('Mouse0', 3); tick(30); o.lmb = evs.filter((n) => /swing|fire|toll|blow|cut\./.test(n)).length;
    evs.length = 0; I.pressed.add('Mouse2'); I.down.add('Mouse2'); tick(60); I.down.delete('Mouse2'); tick(30); o.rmb = evs.length;
    o.offPlane = +Math.abs(g.player.pos.z - z).toFixed(3);
    if (g.lachryma) g.lachryma.value = g.lachryma.max ?? 100;
    r.tools[id] = o;
  }
  if (B.inHand) { press('KeyX'); tick(40); }
  E.emit = own;
  return r;
});
S.check('run: the aim source is lent to the frame', run.lent, run);
for (const [id, o] of Object.entries(run.tools)) {
  S.check(`run: ${id} drawn`, o.inHand === id, o);
  S.check(`run: ${id} LMB does its verb`, o.lmb > 0, o);
  S.check(`run: ${id} kept on the plane`, o.offPlane < 0.01, o);
}
S.check('run: the psygun aims on the plane, ahead', Math.abs(run.tools.psygun.aimZ) < 0.05 && run.tools.psygun.aimAhead > 1, run.tools.psygun);
S.check('run: the hook\'s probe bites on the plane', run.tools.sondelass.probeZ != null && Math.abs(run.tools.sondelass.probeZ) < 0.05, run.tools.sondelass);
await S.shot('run');

await S.ev(() => __game.game.strawmanWell.go('swing')); await S.settle(); await S.ticks(60);
const sw = await S.ev(() => {
  const g = __game.game, I = __game.input, tick = (n) => __sw.tick(n), sd = g.techs.get('sondelass');
  const evs = []; const offs = ['grapple.swing', 'hook.fire'].map((n) => g.events.on(n, (e) => evs.push(n + ':' + (e.phase || e.kind || ''))));
  const o = { inHand: g.belt.inHand?.id ?? null, form: sd.form };
  I.down.add('KeyD'); tick(20); I.down.delete('KeyD'); tick(20);
  I.pressed.add('Space'); I.down.add('Space'); tick(8); I.down.delete('Space');
  I.pressed.add('Mouse0'); I.down.add('Mouse0'); tick(2); I.down.delete('Mouse0'); tick(60);
  offs.forEach((f) => f?.()); o.evs = evs; return o;
});
S.check('swing: the hook lent in its form', sw.inHand === 'sondelass' && sw.form === 'hook', sw);
S.check('swing: the throw bites the ring', sw.evs.includes('hook.fire:anchor'), sw);
S.check('swing: the swing starts', sw.evs.includes('grapple.swing:start'), sw);
await S.shot('swing');

await S.go('workshop'); await S.ticks(60);
S.check('out: the camera given back', await S.ev(() => !__game.game.aim.lent), 'aim not lent outside the Well');
await S.common('workshop');
await S.done();
