// ---------------------------------------------------------------------------------------
// THE DEBUG CHESTS, HEADLESS (debug/debugchest.js, debug/kits.js; docs/plans/DEBUG-CHESTS.md): every kit's chest stands at its spot
// (the four in the world, the two in the Spirit Garden), each has its place and its row under DEBUG in the Index; F tops a kit up to its
// counts and its cubes up to its balance and never past (a second F gives nothing), said in the log, and nothing given is counted (the
// ledger's cube.earned and item counts unmoved). One PASS/FAIL line a check. Run with the dev server up (URL= for another port).
// ---------------------------------------------------------------------------------------
import { openGame } from './playtest/game.mjs';

const g = await openGame({ seed: 6 });
const ev = (f, a) => g.page.evaluate(f, a);
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${typeof info === 'string' ? info : JSON.stringify(info)}`); };
await g.step(120);
const r = await ev(async () => {
  const G = __game.game, D = G.debugChests, L = G.ledger, out = {}, lines = [];
  const say = G.log.say.bind(G.log); G.log.say = (k, s, o) => { lines.push(s); return say(k, s, o); };
  G.ostraca?.update(); D.update();
  out.world = D.list.filter((c) => !c.garden).map((c) => c.kit).sort();
  out.places = ['press', 'garden', 'ostraca', 'crucibelle', 'dunemaw', 'jetty', 'throwing'].filter((k) => G.places.get(`debug.${k}`));
  out.index = (G.course.rooms || []).filter((x) => x.group === 'DEBUG').length;
  const th = D.get('throwing'); out.throwingNear = th ? +Math.hypot(th.pos.x - 12.4, th.pos.z + 0.9).toFixed(2) : null;
  // the dunemaw kit: a Wake Whistle, two Lachrymato Bottles (small), cubes to 500
  const earned = L.get('cube.earned'), got = L.get('item.get') || 0, whistles = G.pneuka.held('whistle.wake');
  out.gave1 = D.give('dunemaw'); out.whistle = G.pneuka.held('whistle.wake') - whistles; out.bottles = G.pneuka.held('bottle.small'); out.balance = G.cubes.balance;
  out.gave2 = D.give('dunemaw');
  out.counted = { earned: L.get('cube.earned') - earned, items: (L.get('item.get') || 0) - got };
  // spent and given again: tops back up
  const i = G.pneuka.slots.findIndex((s) => s?.id === 'whistle.wake'); if (i >= 0) G.pneuka.take(i);
  out.gave3 = D.give('dunemaw');
  out.lines = lines.filter((s) => /debug chest/i.test(s));
  return out; });
check('the five world chests stand (ostraca, crucibelle, dunemaw, jetty, throwing)', ['crucibelle', 'dunemaw', 'jetty', 'ostraca', 'throwing'].every((k) => r.world.includes(k)), r.world);
check('the throwing chest stands by the Index\'s lectern', r.throwingNear != null && r.throwingNear < 2.5, r.throwingNear);
check('every kit has its place debug.<kit>', r.places.length === 7, r.places);
check('the Index lists seven under DEBUG', r.index === 7, r.index);
check('F: the dunemaw kit (a Wake Whistle, bottles to two, cubes to 500)', r.whistle === 1 && r.bottles >= 2 && r.balance >= 500, { gave: r.gave1, bottles: r.bottles, balance: r.balance });
check('a second F gives nothing (topped up, never past)', r.gave2.length === 0, r.gave2);
check('spent, it tops back up', r.gave3.length === 1 && /WHISTLE/i.test(r.gave3[0]), r.gave3);
check('nothing it gives is counted', r.counted.earned === 0, r.counted);
check('said in the log: once what it is, then what it gave', r.lines.filter((s) => /is counted|not counted/.test(s)).length === 1 && r.lines.some((s) => /gives:/.test(s)), r.lines);
// the garden's two: realm features, F through realm.use
await ev(() => { const G = __game.game; return G.realm.enter(G.shrines?.get?.(G.shrines.last) || null); });
await g.step(200);
await ev(() => { const G = __game.game; G.realm.setName?.('Siva Lon'); G.indexMenu?.close?.(); });
await g.step(10);
const r2 = await ev(() => {
  const G = __game.game, D = G.debugChests, R = G.realm, out = {};
  D.update();
  out.garden = D.list.filter((c) => c.garden).map((c) => c.kit).sort();
  out.features = R.site.features.filter((f) => f.kind === 'debugChest').length;
  const c = D.get('press'); out.toBath = c ? +c.pos.distanceTo(R.press.frame.O).toFixed(2) : null;
  out.go = D.go('press'); out.jarTo = c ? +R.jarBody.pos.distanceTo(c.pos).toFixed(2) : null;
  const mats = () => G.pneuka.slots.filter((s) => s?.id?.startsWith('mat.') && s.id !== 'mat.shard').length;
  const before = mats(); R.use(R.site.features.find((f) => f.kind === 'debugChest' && f.kit === 'press')); out.mats = mats() - before;
  out.tier3 = G.pneuka.slots.filter((s) => s?.data?.tier === 3).length;
  return out; });
check('the garden\'s two chests stand as realm features (press, garden)', r2.garden.join() === 'garden,press' && r2.features === 2, r2);
check('the press chest stands beside the bath, clear of the ware ring', r2.toBath > 3.4 && r2.toBath < 6, r2.toBath);
check('debug.press sets the Pneuka Jar down beside it', r2.go && r2.jarTo < 3, { go: r2.go, d: r2.jarTo });
check('F at it: two of each kind at tier 1 and one at tier 3 (21 materials)', r2.mats === 21 && r2.tier3 >= 7, r2);
check('no page errors', g.errors.length === 0, g.errors.slice(0, 3));
console.log(fails ? `debug chests: ${fails} FAILED` : 'debug chests: all passed'); process.exitCode = fails ? 1 : 0;
await g.close();
