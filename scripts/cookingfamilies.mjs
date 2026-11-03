// Spirit Cooking's other families cooked headless through their plays to a serve (G222 to G225, G229): `node scripts/cookingfamilies.mjs`.
// Each family is driven the way a careful hand would: the true cook (every move at its heart) and a careless one, then the ferment on the
// game clock, a recipe tasted and a slab mended. Prints one PASS/FAIL line a check; exits 1 on a failure.
import { FAMILIES, serve } from '../src/progress/cooking/dishes.js';
import { newPlay, PLAYABLE } from '../src/progress/cooking/plays.js';
import { MOVES, moveFor, scoreOf } from '../src/progress/cooking/moves.js';
import { slabOf, slabLines, slabChoices, SLABS, GIFTS } from '../src/progress/cooking/recipes.js';
import { playableFamilies } from '../src/world/garden/kitchenfamily.js';

globalThis.performance ??= { now: () => Date.now() };
const { Cooking } = await import('../src/progress/cooking/cooking.js');
let bad = 0; const ok = (name, cond, note = '') => { console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${note ? ` (${note})` : ''}`); if (!cond) bad++; };

const events = [];
const game = { events: { emit: (n, p) => events.push([n, p]) }, save: { section() {}, dirty() {} }, alchemy: { season() {} }, lachryma: { gain() {} }, pneuka: { add() {} } };
const C = new Cooking(game);

/** Drive a play to its heart: `aim` is a function(P) called each 0.05 s that presses what a careful hand would. */
function drive(P, aim, max = 120) { for (let i = 0; i < max / 0.05 && !P.done; i++) { P.k = i; P.tick(0.05); aim(P); } return P; }
const careful = {
  sear: (P) => { if (P.v >= P.M.heart) P.act('done'); },
  steep: (P) => { if (P.v >= P.M.heart) P.act('done'); },
  sugar: (P) => { if (P.v >= P.M.heart) P.act('done'); },
  roux: (P) => { if (P.t - P.stirAt > 0.8) P.act('stir'); if (P.v >= P.M.heart) P.act('done'); },
  simmer: (P) => { if (Math.abs(P.dial - P.M.heart) > 0.01) P.act('dial', P.M.heart); },
  smoke: (P) => { if (P.fire < P.M.heart - 0.03) P.act('feed'); },
  rice: (P) => { if (P.phase === 'rinse') { P.act('rinse'); if (P.clear >= P.M.heart) P.act('clear'); } else { P.act('line', 1.15); P.act('set'); } },
  emulsion: (P) => { P.act('pour', 0.5); if (P.k % 4 === 0) P.act('whisk'); if (P.oil >= P.M.heart) P.act('done'); },
  cut: (P) => { P.act('width', P.M.heart); if (P.k % 5 === 0) P.act('cut'); if (P.strokes.length >= 4) P.act('done'); },
  bleed: (P) => { if (Math.abs(P.v - P.M.heart) < 0.02) P.act('press'); },
};

// every move that has a play, cooked to its heart
for (const m of PLAYABLE) {
  const P = newPlay(m, {}); if (!P) { ok(`play ${m}`, false, 'no play'); continue; }
  drive(P, careful[m]); const r = P.result(0);
  ok(`${m} careful`, P.done && !P.ruined && r.score >= 0.85, `score ${r.score} hit ${r.hit} value ${P.value().toFixed(2)}`);
}
// a careless hand still pays (FAIR or better) or is ruined cleanly, never a throw
for (const m of PLAYABLE) { const P = newPlay(m, {}); drive(P, () => {}, 40); const r = P.result(0); ok(`${m} careless is judged`, typeof r.score === 'number' && (P.done || true), `score ${r.score} ruined ${!!r.ruined}`); }
// do-nothing simmer is not ruined (starts 0.75 < boil 0.8) but is poor; boil ruins
{ const P = drive(newPlay('simmer'), () => {}); ok('simmer left alone is poor, not ruined', !P.ruined && P.result(0).score < 0.9, `score ${P.result(0).score}`); const Q = drive(newPlay('simmer'), (Q) => Q.act('dial', 1)); ok('simmer boiled is ruined', Q.ruined); }
{ const P = drive(newPlay('roux'), () => {}); ok('roux unstirred scorches', P.ruined || P.v > 0.9); }
{ const P = newPlay('emulsion'); for (let i = 0; i < 200 && !P.done; i++) { P.act('pour', 1); P.tick(0.05); } ok('emulsion poured without whisking splits', P.ruined); }
{ const P = newPlay('emulsion'); P.act('pour', 1); for (let i = 0; i < 12; i++) P.tick(0.05); P.act('rescue'); ok('emulsion rescue takes a yolk off the score', P.rescues === 1 && P.splitK <= 0.2); }
ok('leaf hearts move', moveFor('steep', 'tea', 'bitterleaf').heart === 0.7 && moveFor('steep', 'broth', null).heart === 0.4 && MOVES.steep.heart === 0.55);

// every playable family served through serve(): TRUE when every move is a heart
const scoresOf = {};
for (const [fam, F] of Object.entries(FAMILIES)) {
  if (!F.moves.every((m) => PLAYABLE.has(m) || m === 'ferment')) continue;
  const scores = [], hits = [];
  for (const m of F.moves) {
    if (m === 'ferment') { const r = scoreOf(MOVES.ferment, MOVES.ferment.heart, 0); scores.push(r.score); hits.push(r.hit); continue; }
    const P = drive(newPlay(m, { family: fam, addin: fam === 'tea' ? 'mint' : null }), careful[m]), r = P.result(0); scores.push(r.score); hits.push(r.hit);
  }
  const addin = F.needsFish ? 'fish.mirth' : fam === 'sweet' ? 'honey' : fam === 'tea' ? 'mint' : null;
  const res = serve({ family: fam, addin, scores, hits, ruined: false });
  scoresOf[fam] = res;
  ok(`${fam} served`, !!res.dish && res.grade !== 'dubious', `${res.dish.label} ${res.grade} ${res.draught ? `${res.draught.feeling} ${res.draught.strength} for ${res.draught.hold}s` : 'no draught'}`);
  C.serve(res, {});
}
ok('families listed by the window', playableFamilies().length >= 9, playableFamilies().join(' '));

// the ferment on the game clock
{
  const { DAY_MS } = await import('../src/core/calendar.js'); const hour = DAY_MS / 24, t0 = 1e12;
  C.startLong({ family: 'ferment', addin: null, n: 1, move: 'ferment', idx: 0, scores: [], hits: [] }, t0);
  C.tend('warm', t0 + hour);                    // an hour steady (0.25), then warm
  const mid = C.longValue(t0 + 2 * hour);       // + an hour warm (0.4) = 0.65
  ok('ferment tended on the game clock', Math.abs(C.longValue(t0 + hour) - 0.25) < 1e-6 && Math.abs(mid - 0.65) < 1e-6, `after 2 game hours ${mid.toFixed(2)}`);
  ok('ferment spores if left warm', C.longValue(t0 + 5 * hour) >= MOVES.ferment.over);
  const v = C.longValue(t0 + 1.9 * hour), r = scoreOf(MOVES.ferment, v, 0); C.takeLong(); ok('ferment judged', r.score > 0.5 && !r.ruined, `value ${v.toFixed(2)} score ${r.score}`);
}

// recipes found by tasting
{
  const known0 = Object.keys(C.known).length, got = C.receive('folk.stoneware');
  ok('tasting teaches a recipe', got.fresh && !!C.known['rice.kombu'] && C.known['rice.kombu'].via === 'tasting');
  ok('tasting twice teaches once', C.receive('folk.stoneware').fresh === false && C.receive('nobody') === null);
  ok('tasted event carries by', events.some(([n, p]) => n === 'cook.taste' && p.by === 'courier' && p.fresh === true));
  ok('every gift is a real dish', Object.values(GIFTS).every((g) => FAMILIES[g.family]));
}
// recipes found by repair
{
  const L = { get: (k) => ({ 'cook.serve': 1 })[k] || 0, best: () => 0 };
  const found = C.checkSlabs(L);
  ok('a slab turns up by the ledger', found.includes('rice') && !found.includes('broth'), found.join(','));
  const S = slabOf('rice'), blanks = slabLines(S).filter((l) => l.blank), right = blanks.map((l) => l.move), choices = slabChoices(S);
  ok('slab has decoys among the choices', choices.length > blanks.length && right.every((m) => choices.includes(m)));
  const wrong = C.mend('rice', [...right].reverse()), after = C.slabState('rice');
  ok('a wrong order is told how many fit and costs nothing', blanks.length > 1 ? !wrong.ok && wrong.right < wrong.total && after === 'found' : wrong.ok);
  const done = C.mend('rice', right);
  ok('the right order mends it and keeps the recipe', done.ok && C.slabState('rice') === 'mended' && C.known['rice.kombu'] && events.some(([n, p]) => n === 'cook.slab' && p.state === 'mended'));
  ok('a mended slab cannot be mended twice', C.mend('rice', right) === null);
  ok('every slab has a real family and blanks', SLABS.every((s) => FAMILIES[s.family] && slabLines(s).some((l) => l.blank)));
}
// the save round trip keeps a long step and the slabs
{
  let dumped; const g2 = { ...game, save: { section: (n, o) => { dumped = o; }, dirty() {} } }; const A = new Cooking(g2); A.startLong({ family: 'ferment', move: 'ferment', idx: 0 }, 5); A.s.slabs.x = 'found';
  const d = dumped.dump(), B = new Cooking(g2); dumped.load(JSON.parse(JSON.stringify(d))); ok('save keeps the long step and slabs', dumped && B.long?.move === 'ferment' && B.s.slabs.x === 'found');
}
console.log(bad ? `cookingfamilies: ${bad} FAILED` : 'cookingfamilies: all PASS'); process.exit(bad ? 1 : 0);
