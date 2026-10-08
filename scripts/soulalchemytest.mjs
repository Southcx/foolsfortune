// ---------------------------------------------------------------------------------------
// SOUL ALCHEMY, HEADLESS (docs/plans/SOUL-ALCHEMY.md section 8, the acceptance list, as far as a script reaches it): the press at the
// Athanor and its page, pressing as previewed, the materials used up, a complement greying, a refusal said, a true firing at half fuel
// counted, seasoning from play (capped a game hour) and spent by a firing, and each attribute's widening measured where it is read.
// One PASS/FAIL line a check, as the sweeps. Run with the dev server up: `node scripts/soulalchemytest.mjs` (URL= for another port).
// ---------------------------------------------------------------------------------------
import { openGame } from './playtest/game.mjs';
const g = await openGame({ seed: 3 });
const ev = (f, a) => g.page.evaluate(f, a);
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${typeof info === 'string' ? info : JSON.stringify(info)}`); };
const ok = await ev(() => { const G = __game.game; return G.realm.enter(G.shrines?.get?.(G.shrines.last) || null); });
await g.step(200);
const r1 = await ev(async () => {
  const G = __game.game, R = G.realm, A = G.alchemy, M = await import('/src/progress/econ/materials.js');
  const out = { press: !!R.press, model: !!G.scene.getObjectByName('garden-press') };
  G.cubes.earn(5000, 'test');
  for (let i = 0; i < 4; i++) G.pneuka.add('mat.edge', 'test', 0, M.makeMaterial('edge', 10 + i, 1));
  out.before = A.colour; out.mats = R.press.materials().length;
  // the page: hopper of two, the trail previewed, press
  R.press.open(); out.page = G.indexMenu?.page?.name;
  const slots = R.press.materials().map((m) => m.i); R.press.hopper = slots.slice(0, 2);
  R.press.reopen(); out.canvas = !!R.press.canvas?.isConnected;
  const preview = A.walk(R.press.inHopper()).colour;
  const boxBefore = R.press.materials().reduce((n, m) => n + (m.s.n || 1), 0);
  R.press.press(R.press.reopen);
  out.after = A.colour; out.previewMatches = Math.abs(preview.h - out.after.h) < 0.2 && Math.abs(preview.s - out.after.s) < 0.002;
  out.used = boxBefore - R.press.materials().reduce((n, m) => n + (m.s.n || 1), 0);
  out.walking = !!R.press.walking;
  return out; });
check('the press stands at the Athanor', r1.press && r1.model, r1);
check('the press page opens with its wheel', r1.page === 'press' && r1.canvas, r1.page);
check('pressing walks the colour as previewed', r1.previewMatches && (r1.after.h !== r1.before.h || r1.after.s !== r1.before.s), { before: r1.before, after: r1.after });
check('the materials leave the Pneuka Box', r1.used === 2, r1.used);
check('the drop walks on the page', r1.walking, '');
await g.step(200);
const r2 = await ev(async () => {
  const G = __game.game, A = G.alchemy, out = {};
  // a complement greys (the pull: a step toward the material's own colour; across the wheel that passes through grey)
  G.draught = {}; A.s.colour = { h: 0, s: 0.6 };
  out.comp = A.walk([{ hue: 180, sat: 0.6, path: [[0.5, 0]] }], A.s.colour, { extra: 0 }).colour.s; out.same = A.walk([{ hue: 0, sat: 0.6, path: [[0.5, 0]] }], A.s.colour, { extra: 0 }).colour.s;
  // refused outside every swatch, with why in the log
  A.s.colour = { h: 0, s: 0 }; A.s.cocked = true; const lines = G.log?.lines?.length ?? 0; const ref = A.fire(); out.refused = !ref.ok; out.why = ref.why;
  G.realm.press.fireLever(() => {}); out.logged = (G.log?.lines?.length ?? 0) > lines;
  // fired at the heart: half fuel, a true firing; seasoning spent
  const id = 'focus', t = { h: 20 + 360 / 7, s: 0.65 }; A.s.season[id] = 40; A.s.colour = { ...t }; A.s.cocked = true;
  const c0 = G.cubes.balance; let fired = null; const off = G.events.on('alchemy.fire', (e) => (fired = e));
  const f = A.fire(); off?.();
  out.fire = f; out.event = fired; out.spent = c0 - (G.cubes.balance); out.season = A.seasoning(id); out.rank = A.rank(id);
  out.again = A.fire().code; // (one firing a press: the lever is down until the next press)
  out.ledgerTrue = G.ledger?.get?.('alchemy.true') ?? null; out.full = (await import('/src/progress/alchemy.js')).fuelAt(0);
  return out; });
check('a complement greys the colour', r2.comp < 0.05 && Math.abs(r2.same - 0.6) < 1e-6, { comp: r2.comp, same: r2.same });
check('fired outside every swatch: refused, said in the log', r2.refused && r2.logged, r2.why);
check('fired at the heart: ranks, a true firing, half fuel', r2.fire.ok && r2.event?.true && r2.rank === 1 && r2.spent === Math.round(r2.fire.fuel) && r2.ledgerTrue === 1, { fire: r2.fire, spent: r2.spent, full: r2.full, true: r2.ledgerTrue });
check('firing spends the seasoning', r2.season === 0, r2.season);
check('one firing a press: a second is refused as spent', r2.again === 'spent', r2.again);
const r3 = await ev(() => {
  const G = __game.game, A = G.alchemy, out = {};
  const before = A.seasoning('perception'), rad0 = A.radius('perception');
  G.events.emit('move.parry', { tool: 'psygun', how: 'stagger', what: 'blow', by: 'courier' });
  out.season = A.seasoning('perception') - before; out.wider = A.radius('perception') > rad0;
  for (let i = 0; i < 20; i++) G.events.emit('move.parry', { tool: 'psygun', how: 'stagger', what: 'blow', by: 'courier' });
  out.capped = A.seasoning('perception') - before; // (10 a game hour from one source)
  return out; });
check('seasoning from play widens the swatch', r3.season === 2 && r3.wider, r3);
check('one source seasons at most 10 a game hour', r3.capped === 10, r3.capped);
const r4 = await ev(() => {
  const G = __game.game, A = G.alchemy, out = {};
  const m0 = { pool: G.lachryma.max, hands: G.belt.hands, eta: G.creatures.shownEta(1.05), bears: (G.alchemy.widen('resilience.bears')), mend: A.widen('resilience.mend'), ink: A.widen('visualization.canvas'), focus: A.widen('focus.hold'), trade: G.shops?.charm?.() ?? A.widen('charisma.trade') };
  for (const id of Object.keys(A.s.ranks).concat(['willpower', 'focus', 'charisma', 'perception', 'dexterity', 'visualization', 'resilience'])) A.s.ranks[id] = 10;
  const m1 = { pool: G.lachryma.max, hands: G.belt.hands, eta: G.creatures.shownEta(1.05), bears: (G.alchemy.widen('resilience.bears')), mend: A.widen('resilience.mend'), ink: A.widen('visualization.canvas'), focus: A.widen('focus.hold'), trade: A.widen('charisma.trade') };
  // a status the Courier builds, held longer: measured on a creature
  const c = G.creatures.list.find((x) => x.alive && !x.ally && !x.training);
  if (c) { G.creatures.clearStatus(c, 'slow'); c.mind = 0; G.creatures.apply(c, 'slow', 2, 1, 'courier'); out.held = c.status.get('slow')?.t; G.creatures.clearStatus(c, 'slow'); G.creatures.apply(c, 'slow', 2, 1, 'environment'); out.heldEnv = c.status.get('slow')?.t; G.creatures.clearStatus(c, 'slow'); }
  for (const id of Object.keys(A.s.ranks)) A.s.ranks[id] = 0;
  out.m0 = m0; out.m1 = m1; return out; });
const { m0, m1 } = r4;
check('Willpower: the pool x1.5', Math.abs(m1.pool / m0.pool - 1.5) < 0.01, { m0: m0.pool, m1: m1.pool });
check('Dexterity: draw and stow x1.3', Math.abs(m1.hands - 1.3) < 0.01 && m0.hands === 1, { m0: m0.hands, m1: m1.hands });
check('Perception: a windup\'s mark x1.5 sooner (window unmoved)', Math.abs(m0.eta - 1.05) < 1e-6 && Math.abs(m1.eta - (0.25 + 0.8 / 1.5)) < 1e-6, { m0: m0.eta, m1: m1.eta });
check('Focus: a status you build holds x1.3', r4.held == null || Math.abs(r4.held / r4.heldEnv - 1.3) < 0.01, { held: r4.held, env: r4.heldEnv });
check('Visualization, Resilience, Charisma at rank 10', m1.ink === 1.4 && m1.mend === 1.5 && m1.bears === 2 && m0.bears === 0 && Math.abs(m1.trade - 1.15) < 1e-6, m1);
const r5 = await ev(() => { const G = __game.game, R = G.realm; const f0 = R.press.formation(); return { f0, rad: G.alchemy.radius('willpower') }; });
check('the press has a formation', r5.f0 >= 0.5 && r5.f0 <= 2, r5);
check('no page errors', g.errors.length === 0, g.errors.slice(0, 3));
console.log(fails ? `soul alchemy: ${fails} FAILED` : "soul alchemy: all passed"); process.exitCode = fails ? 1 : 0;
await g.close();
