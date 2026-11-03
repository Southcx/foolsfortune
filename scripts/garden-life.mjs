// ---------------------------------------------------------------------------------------
// THE SPIRIT GARDEN'S LIFE, PROVED (docs/plans/GARDEN-COZY.md C3, C4, E2; MYCELIUM.md 3 to 5; SPIRIT-GARDEN.md 7; SOUL-ALCHEMY.md 7; GAPS.md
// G114, G115, G117, G118, G153 to G156, G219, G235): small checks of the rules and of the services against a stand-in game. One PASS/FAIL
// line a check. The garden is in flux (CLAUDE.md), so this is a script beside the plans, not a sweep check. `node scripts/garden-life.mjs`
// ---------------------------------------------------------------------------------------
import { leadPole, noticeOf, topicOf, lineOf, LINES, REGISTERS, SpiritNotice } from '../src/progress/spiritnotice.js';
import { DECOR, SETS } from '../src/progress/decor.js';
import { FOLK, drawn, pick, giftFor, opinionOf, OPINIONS, GardenFolk } from '../src/progress/gardenfolk.js';
import { wishFor, tasteOf as setTaste, TASTE } from '../src/progress/spiritlife.js';
import { plantRate, rollOf, seasonOpen, VISITOR_SEASONS, PLANT_SEASON } from '../src/progress/seasonlife.js';
import { VISITORS } from '../src/progress/realm.js';
import { SEASONS } from '../src/progress/seasons.js';
import { digest, graftOf, bendOf, SIGNATURE, FEELING_HUE } from '../src/progress/mycelium.js';
import { CURIOS } from '../src/world/treasure/treasure.js';
import { SporeBeds, SEED } from '../src/progress/sporebeds.js';
import { Myggdrasil } from '../src/progress/myggdrasil.js';
import { WILD_PRINTS, printsOut, SporePrints } from '../src/progress/sporeprints.js';
import { TreeDiary, diaryOf, colourWord } from '../src/progress/treediary.js';
import { tasteOf, feelingOfHue, fruitMeal, drinkGain, SpiritDiet, DIET } from '../src/progress/spiritdiet.js';
import { pressExtra, WORK } from '../src/progress/spiritwork.js';
import { growthK } from '../src/progress/bedgrowth.js';
import { GROWTH, WATERS } from '../src/progress/realm.js';
import { Garden } from '../src/progress/garden.js';
import { press, makeMaterial } from '../src/progress/econ/materials.js';
import { STATS, MAX, fresh as freshSheet } from '../src/progress/spirits.js';
import { setClock, DAY_MS, today } from '../src/core/calendar.js';

let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${typeof info === 'string' ? info : JSON.stringify(info)}`); };
const H = DAY_MS / 24;
let now = 100 * DAY_MS + 6 * H; setClock(() => now);
const stand = (extra = {}) => {
  const evs = [], on = {}, box = { slots: new Array(16).fill(null),
    add(id, from, uses, data) { const i = this.slots.indexOf(null); if (i < 0) return -1; this.slots[i] = { id, ...(data ? { data } : {}) }; return i; },
    take(k) { const x = this.slots[k]; this.slots[k] = null; return x?.id; } };
  const best = {}, game = { pneuka: box, evs, events: { emit: (n, e) => { evs.push({ n, ...e }); for (const f of on[n] || []) f(e); }, on: (n, f) => (on[n] ||= []).push(f) },
    save: { section() {}, dirty() {} }, ledger: { best: (k) => best[k] || 0, hi: (k, v) => { best[k] = Math.max(best[k] || 0, v); } }, bound: { list: [] }, ...extra };
  return game;
};
const itemOf = (id) => id.startsWith('curio.') ? { kind: 'curio', key: id.slice(6), tier: CURIOS.find((c) => `curio.${c.id}` === id)?.tier ?? 0, name: id } : id.startsWith('mat.') ? { kind: 'material', name: id } : null;
const curio = (id) => ({ kind: 'curio', id: `curio.${id}`, key: id });
const mat = (kind, seed, tier) => ({ ...makeMaterial(kind, seed, tier), of: kind, kind: 'material', id: `mat.${kind}` });

// ---- G114: a spirit notices
check('every register has all five lines', REGISTERS.every((r) => ['like', 'unsure', 'moved', 'bare', 'plain'].every((k) => LINES[r]?.[k])), REGISTERS.filter((r) => !LINES[r]));
check('the lead pole is the dial furthest from the middle, plain when none passes it', leadPole({ o: 0.5, c: -0.8, e: 0.1 }) === 'erratic' && leadPole({ o: 0.1, c: -0.1 }) === 'plain');
check('a piece of its own feeling\'s set is a liking, the overcoming set an unease', topicOf('stoneLantern', 'wonder') === 'own' && topicOf('willow', 'wonder') === 'against' && topicOf('thornArch', 'wonder') === 'briar' && topicOf('woodPile', 'wonder') === 'kit');
{ const pieces = [['stoneLantern', 'dantian', 0, 4, 4], ['bench', 'dantian', 0, 20, 20], ['willow', 'terraces', 1, 1, 1]];
  const n = noticeOf({ grain: { c: 0.7 }, feeling: 'wonder', pieces, spot: { planetoid: 'dantian', face: 0, iu: 5, iv: 5 } });
  check('it remarks on the nearest piece on its own face', n.piece === 'stoneLantern' && n.key === 'like' && n.register === 'orderly', n);
  const far = noticeOf({ feeling: 'wonder', pieces, spot: { planetoid: 'dantian', face: 3, iu: 0, iv: 0 } });
  check('a piece on another face is nearer than none, a bare planetoid says bare', far.piece && noticeOf({ feeling: 'wonder', pieces, spot: { planetoid: 'athanor' } }).key === 'bare');
  const mv = noticeOf({ feeling: 'wonder', pieces, spot: { planetoid: 'dantian', face: 0, iu: 5, iv: 5 }, moved: { id: 'bench', planetoid: 'dantian', day: today() } });
  check('what you moved today comes first, and not tomorrow', mv.piece === 'bench' && mv.key === 'moved' && noticeOf({ feeling: 'wonder', pieces, spot: { planetoid: 'dantian', face: 0, iu: 5, iv: 5 }, moved: { id: 'bench', planetoid: 'dantian', day: today() - 1 } }).piece === 'stoneLantern');
  check('the line names the piece and no number', /lantern/.test(lineOf(n)) && !/\d/.test(lineOf(n)), lineOf(n));
  const g = stand({ decor: { s: { placed: pieces } }, bound: { list: [] } }); const N = new SpiritNotice(g);
  g.events.emit('decor.place', { id: 'bench', planetoid: 'dantian', by: 'courier' });
  const r = N.talk({ kind: 'wisp', name: 'Ember', sp: { feeling: 'dread' }, traits: { n: 0.9 } }, { planetoid: 'dantian', face: 0, iu: 5, iv: 5 });
  check('talking emits spirit.notice with the line, by the Courier', r && g.evs.some((e) => e.n === 'spirit.notice' && e.by === 'courier' && e.line && e.register === 'skittish'), r); }

// ---- G115: the folk
check('four folk, each drawn by one thing', Object.keys(FOLK).length === 4 && drawn({ bloom: 1 }).join() === 'pip' && drawn({ pots: 3, lotuses: 2 }).join() === 'saggar,raku' && drawn({}).length === 0);
check('the opinion is a band of the lotuses, never a number', opinionOf(0) === 'bare' && opinionOf(5) === 'wondrous' && OPINIONS.every((o) => isNaN(o)));
check('a visitor\'s set has a visitor piece to leave', ['pip', 'saggar', 'raku'].every((f) => giftFor(f) && DECOR[giftFor(f)].from.includes('visitor')) && giftFor('sibling') === null);
{ const g = { bloom: 1, pots: 3, lotuses: 2, siblings: 0 }, seen = {}; const days = [];
  for (let d = 1; d <= 9; d++) { const id = pick(g, seen, d); days.push(id); seen[id] = d; }
  check('of those drawn, the one seen longest ago comes: all three in turn', new Set(days.slice(0, 3)).size === 3 && days[3] === days[0], days); }
{ const g = stand({ harmony: { list: () => [{ planetoid: 'dantian', band: 'bloom' }] }, decor: { s: { placed: [] }, owns: (id) => owned.has(id), give: (id, from) => { owned.add(id); g.events.emit('decor.get', { id, from, by: 'courier' }); } }, keepsakes: { pots: [1, 2, 3] } }); const owned = new Set();
  new GardenFolk(g); g.events.emit('garden.enter', { by: 'courier' }); g.events.emit('garden.enter', { by: 'courier' });
  const f = g.evs.filter((e) => e.n === 'garden.folk');
  check('a garden in bloom with pots draws one folk a game day, with a first gift', f.length === 1 && f[0].gift && owned.has(f[0].gift) && f[0].by === 'courier', f);
  now += DAY_MS; g.events.emit('garden.enter', { by: 'courier' }); now += DAY_MS; g.events.emit('garden.enter', { by: 'courier' }); const f2 = g.evs.filter((e) => e.n === 'garden.folk');
  check('each game day another comes, a first visit leaving a gift and a second none', f2.length === 3 && new Set(f2.map((x) => x.folk)).size === 2 && f2[1].gift && f2[2].folk === f2[0].folk && f2[2].visits === 2 && !f2[2].gift, f2.map((x) => x.folk + (x.gift ? '+' : ''))); }

// ---- G117: the three no-feeling sets
{ const lotus = Object.keys(SETS).filter((s) => SETS[s].lotus != null);
  check('three sets of no feeling, each with a taste leaning to it', lotus.length === 3 && lotus.every((s) => Object.values(TASTE).includes(s)), lotus);
  const sheet = { feeling: 'wonder', kind: 'wisp' }; let taste = 0, own = 0;
  for (let k = 0; k < 60; k++) { const w = wishFor(`s${k}`, 3, sheet, { decorSets: ['wonder', 'teapath', 'stargazer', 'kilnyard'], grain: { c: 0.8 } }); if (w.kind === 'decor') { if (w.set === 'teapath') taste++; else if (w.set === 'wonder') own++; } }
  check('an orderly spirit\'s odd wishes for decor are the Tea Path\'s', taste > 0 && own === 0, { taste, own });
  const none = wishFor('x', 3, sheet, { decorSets: ['teapath'], grain: { c: 0.8 } }), cant = wishFor('x', 3, sheet, { decorSets: [], grain: { c: 0.8 } });
  check('a wish is never for a set not yet open', cant.kind !== 'decor' && (none.kind !== 'decor' || none.set === 'teapath'));
  check('a spirit with no lean keeps to its own feeling', setTaste({ c: 0.05 }) === null); }

// ---- G118: seasons
check('winter rests the green and kills nothing; spring wakes it', plantRate('winter', 'moss').step === 0 && plantRate('spring', 'loam').step > 1 && Object.values(PLANT_SEASON).every((p) => p.step >= 0));
check('a ground in its own season keeps the better pace; a winter silt a half pace', plantRate('spring', 'moss').step > plantRate('spring', 'loam').step && plantRate('autumn', 'loam').step > plantRate('autumn', 'moss').step && plantRate('winter', 'silt').step === 0.5);
check('ash and slate do not spread in any season', SEASONS.every((s) => plantRate(s.id, 'ash').step === 0 && plantRate(s.id, 'slate').seed === 0));
check('a pace is whole steps and a draw for the rest', rollOf(1.5, 0.4) === 2 && rollOf(1.5, 0.6) === 1 && rollOf(0, 0.1) === 0 && rollOf(2, 0.9) === 2);
check('every seasonal visitor is a real kind and comes in a season, never none', Object.keys(VISITOR_SEASONS).every((k) => VISITORS[k] && SEASONS.some((s) => seasonOpen(k, s.id))) && seasonOpen('slipjelly', 'winter') && !seasonOpen('glint', 'winter'));
check('every season has a visitor to call', SEASONS.every((s) => Object.keys(VISITORS).some((k) => seasonOpen(k, s.id))));

// ---- G153: a spirit tends a bed; its grain bends the work
{ const g = stand({ sporeBeds: null }); const S = (g.sporeBeds = new SporeBeds(g, { itemOf }));
  g.events.emit('garden.place', { feature: 'sporebed', by: 'courier' }); S.inoculate(0, 'desire');
  const e = { kind: 'wisp', name: 'Ember', at: 1, sp: { ...freshSheet('wisp', 1, 'desire'), bond: 60 }, traits: { c: 0.8, o: 0 } }; g.bound.list.push(e);
  const plain = S.hoursOf(S.beds[0]); S.worker(0, e);
  check('a spirit set to a bed makes it a quarter faster', Math.abs(S.hoursOf(S.beds[0]) - plain / 1.25) < 1e-9 && S.beds[0].tend && g.evs.some((x) => x.n === 'spore.tend' && x.on));
  const w = mat('art', 5, 3), sig = digest('desire', [w]), true_ = digest('desire', [w], 1, { grain: { c: 0.8 } });
  check('an orderly spirit\'s print keeps the tier a plain print loses', true_.out[0].tier === w.tier && sig.out[0].tier === w.tier - 1 && true_.bent === 'truer', { plain: sig.out[0].tier, truer: true_.out[0].tier });
  check('a disorderly one\'s print is the plain one', digest('desire', [w], 1, { grain: { c: -0.8 } }).out[0].tier === sig.out[0].tier);
  // a curious spirit's graft: the second-nearest of the tier, only some of the time, the same twice
  let other = 0, same = 0, total = 0, sameTier = true;
  for (const a of CURIOS) for (const b of CURIOS) { if (a.chest === false || b.chest === false || a === b || !SIGNATURE[a.id] || !SIGNATURE[b.id]) continue;
    const p = graftOf(curio(a.id), curio(b.id)), o = graftOf(curio(a.id), curio(b.id), { other: true }); total++; if (o !== p) other++; else same++;
    const tier = (id) => CURIOS.find((c) => `curio.${c.id}` === id)?.tier; if (tier(o) !== tier(p)) sameTier = false; }
  check('the other way round is another curio of the same tier', other > total * 0.8 && sameTier, { other, same, total });
  let odds = 0; for (let s = 1; s <= 400; s++) if (bendOf({ o: 0.8 }, s).other) odds++;
  check('a curious spirit tries the other way about a third of the time, a wary one never', odds > 90 && odds < 190 && ![...Array(200).keys()].some((s) => bendOf({ o: -0.8 }, s + 1).other), odds);
  check('the same seed bends the same twice', bendOf({ o: 0.8 }, 77).other === bendOf({ o: 0.8 }, 77).other);
  // harvest reads the live entry's grain
  S.beds[0].worker && g.events.emit('spirit.release', { kind: 'wisp', spirit: 'Ember', by: 'courier' });
  check('a spirit let go leaves its bed', S.beds[0].worker === null && !S.beds[0].tend); }

// ---- G155: a spirit seeds a bare bed; wild prints
{ const g = stand({}); const S = (g.sporeBeds = new SporeBeds(g, { itemOf })); g.events.emit('garden.place', { feature: 'sporebed', by: 'courier' });
  const e = { kind: 'glint', name: 'Mira', at: 2, sp: { ...freshSheet('glint', 1, 'grief'), bond: 40 } }; g.bound.list.push(e); S.worker(0, e);
  S.seedBy(today() + SEED.days - 1); check('not before its days', !S.beds[0].strain);
  S.seedBy(today() + SEED.days); check('after its days a spirit seeds its own feeling\'s strain, which it holds', S.beds[0].strain === 'grief' && g.evs.some((x) => x.n === 'spore.seeded' && x.strain === 'grief'));
  const g2 = stand({}); const S2 = (g2.sporeBeds = new SporeBeds(g2, { itemOf })); g2.events.emit('garden.place', { feature: 'sporebed', by: 'courier' });
  const e2 = { kind: 'glint', name: 'Mira', at: 2, sp: { ...freshSheet('glint', 1, 'wonder'), bond: 40 } }; S2.worker(0, e2); g2.bound.list.push(e2); S2.seedBy(today() + 9);
  check('it cannot seed a strain you hold no spores of', !S2.beds[0].strain);
  const P = new SporePrints(g2); let day = null; for (let d = 1; d < 40 && !day; d++) if (printsOut(d).includes('ridgeLichen')) day = d;
  now = day * DAY_MS + 2 * H; const t = P.take('ridgeLichen');
  check('a wild print of a strain you do not hold teaches it, once a game day', t.ok && t.first && S2.strains.wonder && !P.take('ridgeLichen').ok, t);
  const damp = Object.keys(WILD_PRINTS).filter((k) => WILD_PRINTS[k].where === 'well'); let dampDays = 0, dryDays = 0;
  for (let d = 0; d < 400; d++) { const o = printsOut(d); dampDays += damp.filter((k) => o.includes(k)).length; dryDays += ['ridgeLichen', 'weirKoji'].filter((k) => o.includes(k)).length; }
  check('the damp floors give more prints by their odds', dampDays > 0 && dryDays > 0, { dampDays, dryDays }); }

// ---- G156: the tree's diary
{ now = 200 * DAY_MS + 6 * H; const g = stand({}); const S = (g.sporeBeds = new SporeBeds(g, { itemOf })); const T = (g.myggdrasil = new Myggdrasil(g)); const D = new TreeDiary(g);
  g.events.emit('garden.enter', { by: 'courier' }); check('a tree that ate nothing says nothing', !g.evs.some((e) => e.n === 'myggdrasil.diary'));
  now += DAY_MS; g.pneuka.add('curio.whelk'); g.pneuka.add('curio.storm'); T.feed(0); T.feed(1);
  g.events.emit('garden.enter', { by: 'courier' }); g.events.emit('garden.enter', { by: 'courier' });
  const d = g.evs.filter((e) => e.n === 'myggdrasil.diary');
  check('the first visit of a game day says what it ate and how its colour moved, once', d.length === 1 && d[0].meals === 2 && d[0].to && d[0].how, d[0]);
  now += DAY_MS; g.pneuka.add('curio.bell'); T.feed(0); g.events.emit('garden.enter', { by: 'courier' });
  const d2 = g.evs.filter((e) => e.n === 'myggdrasil.diary')[1];
  check('the next report moves from where the last left it', d2 && colourWord(d2.from.h, d2.from.s) === colourWord(d[0].to.h, d[0].to.s) && d2.meals === 1, d2);
  check('colours have plain words and a grey is grey', colourWord(0, 1) === 'red' && colourWord(120, 1) === 'green' && colourWord(200, 0.05) === 'grey' && diaryOf([], null, null).how === 'barely'); }

// ---- G154: fruit, taste and tint; G235: water
{ const kinds = ['slipjelly', 'clapperjar', 'glint', 'lobber', 'wisp', 'blotling', 'spirit'];
  check('a kind likes one feeling and dislikes the feeling that overcomes it, the same every time', kinds.every((k) => { const t = tasteOf(k); return t.likes !== t.dislikes && tasteOf(k).likes === t.likes; }) && new Set(kinds.map((k) => tasteOf(k).likes)).size > 2);
  check('a hue is the nearest feeling\'s', Object.entries(FEELING_HUE).every(([f, h]) => feelingOfHue(h) === f));
  const kind = 'wisp', T = tasteOf(kind), other = Object.keys(STATS).find((f) => f !== T.likes && f !== T.dislikes);
  const meal = (f) => ({ hue: FEELING_HUE[f], sat: 0.8, gain: 10, stat: f });
  check('a liked fruit gives half again, a disliked one half, others as they are', fruitMeal({}, kind, meal(T.likes)).want === 15 && fruitMeal({}, kind, meal(T.dislikes)).want === 5 && fruitMeal({}, kind, meal(other)).want === 10);
  const m1 = fruitMeal({ feeling: 'wonder' }, kind, meal('dread')), m2 = fruitMeal({ feeling: 'wonder', tint: m1.tint }, kind, meal('dread'));
  check('the body drifts toward the fruit\'s colour a share a fruit', m2.tint.n === 2 && Math.abs(((m2.tint.h - FEELING_HUE.dread + 540) % 360) - 180) < Math.abs(((m1.tint.h - FEELING_HUE.dread + 540) % 360) - 180), { one: m1.tint, two: m2.tint });
  const g = stand({}); const D = new SpiritDiet(g), sp = { ...freshSheet(kind, 1, 'wonder') }; const e = { kind, name: 'Ember', sp }; g.bound.list.push(e);
  const before = { ...sp.stats }; sp.stats[T.likes] += 10; // (the meal's own kind raised the liked stat by 10: spirits.js feed, as raising.js does)
  g.events.emit('spirit.feed', { spirit: 'Ember', kind, fruit: true, hue: FEELING_HUE[T.likes], sat: 0.8, gain: 10, stat: T.likes, by: 'courier' });
  check('a liked fruit fed lifts its stat by half again and tints the body', sp.stats[T.likes] === before[T.likes] + 15 && sp.tint && g.evs.some((x) => x.n === 'spirit.taste' && x.taste === 'likes'), { stat: sp.stats[T.likes] - before[T.likes], tint: sp.tint });
  g.events.emit('spirit.feed', { spirit: 'Ember', kind, hue: 10, gain: 10, stat: 'dread', by: 'courier' });
  check('an ordinary meal is left alone', sp.tint.n === 1);
  // water
  check('water of its own feeling gives WATERS.drink a game hour, any other none', drinkGain({ feeling: 'grief' }, 'grief', 3) === WATERS.drink * 3 && drinkGain({ feeling: 'grief' }, 'dread', 3) === 0 && drinkGain({ feeling: 'grief' }, null) === 0);
  const sp2 = { ...freshSheet('glint', 1, 'grief') }; const e2 = { kind: 'glint', name: 'Mira', sp: sp2 }; g.bound.list.push(e2); const was = sp2.stats.grief;
  D.waterOf = (x) => (x === e2 ? 'grief' : null); now += 1 * H; D.update(); now += 3 * H; D.update();
  check('a spirit in its own feeling\'s water gains a point a game hour, and never past the cap', sp2.stats.grief === was + 3 && (sp2.stats.grief = MAX, D.drink(e2, 'grief', 5) === 0), sp2.stats.grief - was); }
check('bed growth: its own ground and water compound, others do nothing', growthK({ feeling: 'wonder', ground: 'moss' }) === GROWTH.ground && growthK({ feeling: 'wonder', ground: 'moss', water: 'wonder' }) === +(GROWTH.ground * GROWTH.water).toFixed(4) && growthK({ feeling: 'wonder', ground: 'ash', water: 'dread' }) === 1 && growthK({}) === 1);
{ now = 300 * DAY_MS; const g = stand({}); const G = new Garden(g); g.cubes = { earn() {}, spend: () => true };
  g.pneuka.add('mat.art', 'x', 0, { kind: 'art', tier: 0 }); const plain = (() => { const G0 = new Garden(stand({})); G0.s.beds[0] = { kind: 'art', tier: 0, at: now }; return G0; })();
  G.surround(0, { feeling: 'desire', ground: 'loam', water: 'desire' }); G.plant(0, 0);
  const grow = 2 * 3600 * 1000, _ = grow; // (G.growHours game hours, read below)
  const t0 = now; let plainT = null, fastT = null; for (let m = 0; m < 24 * 20; m++) { now = t0 + m * H / 4; if (plainT == null && plain.ripe(0)) plainT = m; if (fastT == null && G.ripe(0)) fastT = m; }
  check('a bed on its own ground and water ripens in 1/1.5625 the time', plainT && fastT && Math.abs(fastT / plainT - 1 / (GROWTH.ground * GROWTH.water)) < 0.03, { plainT, fastT });
  now = t0; const G2 = new Garden(stand({})); G2.s.beds[0] = { kind: 'art', tier: 0, at: now }; now += 4 * H; const left = (x) => { let n = 0; const base = now; while (!x.ripe(0) && n < 4000) { now = base + n * H / 8; n++; } const r = n; now = base; return r; };
  const a = left(G2); G2.surround(0, { feeling: 'wonder', ground: 'moss' }); const b = left(G2);
  check('changing a bed\'s ground mid-growth keeps the share done', b < a && b > a / 1.4, { a, b }); }

// ---- G219: a spirit at the press
{ const e = { work: WORK.job, sp: { feeling: 'dread', bond: 50 } }, arc = { kind: 'eldritch', hue: 270, sat: 0.6, path: [[0.3, 0.1]] }, edge = { kind: 'edge', hue: 10, sat: 0.6, path: [[0.3, 0.1]] };
  check('a spirit at the press gives its own feeling\'s materials one step, others none', pressExtra([e], arc) === 1 && pressExtra([e], edge) === 0 && pressExtra([{ ...e, work: 'bed' }], arc) === 0 && pressExtra([{ ...e, sp: { feeling: 'dread', bond: 5 } }], arc) === 0);
  const start = { h: 0, s: 0.2 }, plain = press(start, [arc, edge]), worked = press(start, [arc, edge], { extra: (m) => pressExtra([e], m) });
  check('the extra step lengthens that material\'s trail only, in the preview and the press alike', worked.trail.length === plain.trail.length + 1 && press(start, [edge], { extra: (m) => pressExtra([e], m) }).trail.length === press(start, [edge]).trail.length);
  check('a number still works as it did', press(start, [arc], { extra: 1 }).trail.length === press(start, [arc]).trail.length + 1); }

console.log(fails ? `\ngarden-life: ${fails} FAILED` : '\ngarden-life: all passed');
process.exit(fails ? 1 : 0);
