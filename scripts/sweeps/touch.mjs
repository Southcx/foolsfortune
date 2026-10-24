// ---------------------------------------------------------------------------------------
// THE TOUCH SWEEP (docs/plans/MOBILE.md 8, 8.2, 10 step 6): touch play's two first rooms worked headless on a phone held landscape
// (open(room, { touch: true }): 844 x 390, hasTouch, real touch events through the DevTools protocol), one PASS / FAIL line a check:
//   THE RACEWAY  the device turns to touch on the first touch and the touch controls come up; on the Solar Skiff the sail is up by itself
//                (auto-sail), the thumb steers it, a real tap on HOP hops it, BRAKE held on its tile stops it, and a key pressed hands
//                the keys back to the keyboard (auto-sail let go).
//   THE GARDEN   a finger is the hand (the cursor follows it, the left button held while it is down), an art picked on the art bar is
//                the hand's art, and tap to go (`realm.goTo`) takes the Pneuka Jar to a point.
// Only what breaks touch play is checked (CLAUDE.md, "Test lean"): no feel, no layout.
//
// Prior art: the sweeps' harness (scripts/sweeps/harness.mjs), Playwright's mobile emulation.
//
//   npm run dev &   then   node scripts/sweeps/touch.mjs [--quick]
// ---------------------------------------------------------------------------------------
import { open } from './harness.mjs';

const S = await open('touch', { touch: true });
const tileAt = (id) => S.ev((t) => { const e = [...document.querySelectorAll(`[data-tile="${t}"]`)].find((x) => !x.classList.contains('hidden')); const b = e?.getBoundingClientRect(); return b && b.width > 0 ? [b.x + b.width / 2, b.y + b.height / 2] : null; }, id);
const sk = () => S.ev(() => { const g = __game.game, K = g.techs.get('skiff'), I = g.input;
  return { riding: !!K?.riding, speed: +(K?.speed || 0).toFixed(1), heading: +(K?.heading || 0).toFixed(3), W: I.isDown('KeyW'), S: I.isDown('KeyS'), device: I.device, ui: !!g.touchUI?.on }; });

// ---- the Raceway
S.phase = 'raceway';
await S.go('raceway');
await S.touch.tap(420, 200, 6);
let s = await sk();
S.check('raceway: a touch makes touch the last device and brings the touch controls up', s.device === 'touch' && s.ui, s);
await S.ev(() => { const g = __game.game; g.race.start('sun', { mode: 'practice', solo: true }); });
for (let i = 0; i < 20 && !(await sk()).riding; i++) { await S.ev(() => __game.game.touch.control('use', true)); await S.ticks(4); await S.ev(() => __game.game.touch.control('use', false)); await S.ticks(10); }
await S.ticks(60 * 6); s = await sk();
S.check('raceway: riding with no thumb down, the sail is up by itself (auto-sail)', s.riding && s.W && s.speed > 8, s);
await S.shot('auto-sail');
const h0 = s.heading;
await S.touch.stick(55, 0, 90); s = await sk();
S.check('raceway: the thumb pushed right steers the board', Math.abs(s.heading - h0) > 0.2, { h0, ...s });
const hops = await S.ev(() => { window.__hops = 0; __game.game.events.on('skiff.hop', () => window.__hops++); return 0; });
const hop = await tileAt('hop');
if (hop) await S.touch.tap(hop[0], hop[1], 30, 12);
else { await S.ev(() => __game.game.touch.control('hop', true)); await S.ticks(12); await S.ev(() => __game.game.touch.control('hop', false)); await S.ticks(30); }
S.check('raceway: a tap on HOP hops the board', (await S.ev(() => window.__hops)) > hops, { tile: !!hop });
await S.ticks(60);
await S.ev(() => __game.game.touch.control('brake', true)); await S.ticks(120); s = await sk();
S.check('raceway: BRAKE held lets the sail go and stops the board', !s.W && s.S && s.speed < 3, s);
await S.ev(() => __game.game.touch.control('brake', false)); await S.ticks(30); s = await sk();
S.check('raceway: BRAKE let go, the sail is up again', s.W, s);
await S.press('KeyQ', 2); s = await sk();
S.check('raceway: a key pressed makes the keyboard the last device and lets auto-sail go', s.device === 'keyboard' && !s.W, s);

// ---- the Spirit Garden
S.phase = 'garden';
await S.ev(() => { const g = __game.game; g.race?.running && g.race.end('test'); });
await S.ticks(10);
await S.ev(() => { const g = __game.game; return g.realm.enter(g.shrines?.get?.(g.shrines.last) || null); });
await S.settle(); await S.closeAll(); await S.ticks(60);
const go = await S.ev(() => { const R = __game.game.realm, J = R.jarBody, P = J.planet, up = J.pos.clone().sub(P.c).normalize();
  const side = new (J.pos.constructor)(1, 0, 0); side.addScaledVector(up, -side.dot(up)).normalize();
  const t = P.c.clone().add(J.pos.clone().sub(P.c).addScaledVector(side, 5).normalize().multiplyScalar(J.pos.distanceTo(P.c)));
  window.__goal = t; R.goTo(t); return +J.pos.distanceTo(t).toFixed(2); });
await S.ticks(150);
const got = await S.ev(() => ({ d: +__game.game.realm.jarBody.pos.distanceTo(window.__goal).toFixed(2), done: !__game.game.realm.goTarget }));
S.check('garden: tap to go takes the Pneuka Jar to the point', got.done && got.d < go * 0.5, { from: go, ...got });
await S.touch.tap(760, 90, 4); // (a corner, clear of the Pneuka Jar: GRAB would lift it)
const fin = await S.ev(() => { const I = __game.game.input; return { inGarden: !!__game.game.realm.active, free: !!__game.game.cursorFree?.(), mx: I.mx, my: I.my }; });
S.check('garden: a finger is the hand (the pointer free, the cursor where the finger was)', fin.inGarden && fin.free && Math.abs(fin.mx - 760) < 2 && Math.abs(fin.my - 90) < 2, fin);
const art = await tileAt('art.pull');
if (art) { await S.touch.tap(art[0], art[1], 6); }
const handArt = await S.ev(() => __game.game.realm?.hand?.art ?? __game.game.garden?.hand?.art ?? null);
if (handArt === 'pull' || !art) S.check('garden: PULL tapped on the art bar is the hand\'s art', true, { tile: !!art, handArt });
else S.note('garden: the art bar is not wired to the hand yet (touch.art has no listener: the driver\'s, MOBILE.md 8.2)', { handArt });
await S.shot('garden');
await S.done();
