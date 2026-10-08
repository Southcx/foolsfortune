// ---------------------------------------------------------------------------------------
// THE MYCELIUM, CHECKED (src/progress/mycelium.js; docs/plans/MYCELIUM.md): the fungi's verbs and the tree held to their rules before
// anything is built on them. One PASS/FAIL line a check, as the sweeps. `node scripts/mycelium.mjs`
//   - every curio has a colour; rot never gives back more than its share; a print is exactly its thing's colour, one straight pull;
//   - ferment and dissolve move only saturation; a graft is a table (the same two, the same one), rises a tier only for near
//     complements, and no chain of grafts and rots makes worth out of nothing faster than the slowest livelihood;
//   - the spore beds' pace follows the cycles; the tree's sap is steerable to any attribute's tile, and its fruit lands in it;
//   - every attribute's tile heart is reachable by a print of something you can hold (the colour road is open everywhere).
// ---------------------------------------------------------------------------------------
import { BRANCHES, CAPS, SIGNATURE, signatureOf, digest, graftOf, bedHours, STRAINS, MYCO, sapAfter, fruit, treeGirth, bodiesOpen, TREE, FEELING_HUE } from '../src/progress/mycelium.js';
import { CURIOS } from '../src/world/treasure/treasure.js';
import { ARCANA } from '../src/tools/veritome/arcana.js';
import { ATTRIBUTES } from '../src/progress/alchemy.js';
import { makeMaterial, KIND_IDS, distance } from '../src/progress/econ/materials.js';
import { ECON } from '../src/progress/econ/table.js';
import { SporeBeds } from '../src/progress/sporebeds.js';
import { Myggdrasil } from '../src/progress/myggdrasil.js';
import { Keepsakes } from '../src/progress/keepsakes.js';
import { setClock, DAY_MS } from '../src/core/calendar.js';

let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${typeof info === 'string' ? info : JSON.stringify(info)}`); };
const curio = (id) => ({ kind: 'curio', id: `curio.${id}`, key: id });
const mat = (kind, seed, tier) => ({ ...makeMaterial(kind, seed, tier), of: kind, kind: 'material', id: `mat.${kind}` });
const worth = (x) => signatureOf(x)?.worth ?? 0;

check('every curio has a colour', CURIOS.every((c) => SIGNATURE[c.id]), CURIOS.filter((c) => !SIGNATURE[c.id]).map((c) => c.id));
// rot
const rots = CURIOS.map((c) => { const d = digest('grief', [curio(c.id)]); return { id: c.id, in: worth(curio(c.id)), out: d.ok ? d.out.reduce((a, m) => a + worth(m), 0) : 0 }; });
check('rot gives back no more than its share', rots.every((r) => r.out <= r.in * MYCO.rot + 1e-9), rots.map((r) => `${r.id} ${r.out}/${r.in}`).slice(0, 6).join(', '));
check('rot gives back something for every curio', rots.every((r) => r.out > 0), rots.filter((r) => !r.out).map((r) => r.id));
// print
const prints = CURIOS.map((c) => { const p = digest('desire', [curio(c.id)]).out[0], s = SIGNATURE[c.id]; return { id: c.id, dh: Math.abs(((p.hue - s.h + 540) % 360) - 180), ds: Math.abs(p.sat - s.s), steps: p.path.length, wind: p.path[0][1] }; });
check('a print is exactly its thing\'s colour, one straight pull', prints.every((p) => p.dh < 0.11 && p.ds < 0.006 && p.steps === 1 && p.wind === 0), prints.find((p) => !(p.dh < 0.11 && p.ds < 0.006 && p.steps === 1 && p.wind === 0)) || 'all');
// ferment and dissolve
{ const m = mat('art', 3, 1), f = digest('mirth', [m]).out[0], d = digest('dread', [m]).out[0];
  check('ferment deepens and dissolve greys, the hue untouched', f.sat > m.sat && d.sat < m.sat && f.hue === m.hue && d.hue === m.hue, { was: m.sat, fermented: f.sat, dissolved: d.sat }); }
check('a strain refuses what it does not eat, and says why', !digest('mirth', [curio('whelk')]).ok && /eats/.test(digest('mirth', [curio('whelk')]).why));
// graft: a table, complements rise
{ const pairs = []; for (const a of CURIOS) for (const b of CURIOS) if (a.chest !== false && b.chest !== false) pairs.push([a.id, b.id]);
  const same = pairs.every(([a, b]) => graftOf(curio(a), curio(b)) === graftOf(curio(a), curio(b)));
  const tierOf = (id) => CURIOS.find((c) => `curio.${c.id}` === id).tier;
  let wrongRise = 0, rises = 0, gain = 0;
  for (const [a, b] of pairs) {
    const A = curio(a), B = curio(b), g = graftOf(A, B), up = tierOf(A.id) === tierOf(B.id) && distance(SIGNATURE[a], SIGNATURE[b]) >= MYCO.marry;
    const want = Math.min(4, Math.max(tierOf(A.id), tierOf(B.id)) + (up ? 1 : 0)); if (tierOf(g) !== want) wrongRise++; if (up) rises++;
    gain = Math.max(gain, ECON.curio[tierOf(g)] / (worth(A) + worth(B)));
  }
  check('a graft is a table: the same two always graft the same', same);
  check('a graft rises a tier only for two of one tier, near complements', wrongRise === 0, `${rises} of ${pairs.length} pairs rise`);
  // the worst a graft gains (worth out over worth in), over its 12 game hours (30 real minutes): under the aim's pace, so a graft is a
  // way to a curio you want, never a mint (the owner: "we're all in on mechanics"; the check keeps it from becoming an economy)
  const perHour = (gain - 1) * 2 * ECON.curio[1] * 2; // (the best pair's gain on two tier-1 curios, twice an hour: a ring's 12 game hours are 30 real minutes)
  check('no graft mints worth faster than a tenth of the aim', perHour < ECON.perMinute * 60 * 0.1, `best gain x${gain.toFixed(2)}, about ${Math.max(0, perHour).toFixed(0)} cubes a real hour a bed`); }
// the spore beds' pace
check('a spore bed works faster beside the feeling that generates it, slower beside the one that overcomes it',
  bedHours('mirth', ['wonder']) < STRAINS.mirth.hours && bedHours('mirth', ['dread']) > STRAINS.mirth.hours && bedHours('mirth', []) === STRAINS.mirth.hours,
  { alone: bedHours('mirth'), generated: bedHours('mirth', ['wonder']), overcome: bedHours('mirth', ['dread']) });
// the tree: sap steerable to every attribute's tile, its fruit landing in it
{ const items = [...CURIOS.filter((c) => c.chest !== false).map((c) => curio(c.id)), ...KIND_IDS.flatMap((k) => [1, 2, 3].map((s) => mat(k, s, 2)))];
  const miss = [];
  for (const A of Object.values(ATTRIBUTES)) {
    const target = { h: A.hue, s: 0.75 };
    // a greedy feeder: each time, the thing whose colour pulls the sap nearest the tile (at most 12 meals from a fresh tree)
    let tree = { sap: null, fed: 0, branches: {} };
    for (let k = 0; k < 12; k++) {
      let best = null, bd = Infinity;
      for (const it of items) { const s2 = sapAfter(tree.sap, it), d = distance(s2, target); if (d < bd) { bd = d; best = it; } }
      tree = { ...tree, sap: sapAfter(tree.sap, best), fed: tree.fed + worth(best) };
    }
    const day = ['wonder', 'mirth', 'desire', 'grief', 'dread', 'fair'].indexOf('fair');
    const f = fruit(tree, day).fruit[0], d = distance({ h: f.hue, s: f.sat }, target);
    if (d > 0.12) miss.push(`${A.id} ${d.toFixed(3)}`);
  }
  check('the tree\'s sap can be steered to every attribute\'s tile, and its fair-day fruit lands there', !miss.length, miss.length ? miss : 'all seven within 0.12'); }
// the tree's growth
check('the tree grows a step of girth as its meals double, and opens a fruiting body a step, to ten', treeGirth(0) === 0 && treeGirth(TREE.girthWorth) === 1 && treeGirth(TREE.girthWorth * 3) === 2 && bodiesOpen(99) === TREE.bodies,
  [0, 64, 192, 448, 960, 1984].map((w) => `${w}: ${treeGirth(w)}`).join(', '));
{ const t = { sap: { h: 200, s: 0.6, mass: 400 }, fed: 400, branches: {} }, a = fruit(t, 0), b = fruit(t, 6);
  check('a dawn fruits one a body, leaned to the day; a prismatic day bears one at full saturation', a.fruit.length === bodiesOpen(treeGirth(400)) && b.fruit[0].sat === 1 && a.sap.mass < 400,
    { fruit: a.fruit.length, wonderLean: a.fruit[0].hue, prismaticSat: b.fruit[0].sat, sapLeft: a.sap.mass }); }
// the colour road: every attribute's tile heart reachable by a print of something one can hold
{ const all = [...CURIOS.map((c) => SIGNATURE[c.id]), ...Object.values(FEELING_HUE).map((h) => ({ h, s: 0.7 }))];
  const far = Object.values(ATTRIBUTES).map((A) => ({ id: A.id, d: Math.min(...all.map((s) => Math.abs(((s.h - A.hue + 540) % 360) - 180))) })).filter((x) => x.d > 30);
  check('every attribute\'s hue has a curio or a fish within 30 degrees to print', !far.length, far); }
{ const ids = ARCANA.map((a) => a.id), n = (k) => Object.values(BRANCHES).filter((b) => b.adds === k).length, seeds = Object.values(BRANCHES).filter((b) => b.strain).map((b) => b.strain).sort();
  check('twenty-two branches, one for each Major Arcana card, and ten caps', ids.length === 22 && ids.every((id) => BRANCHES[id]) && Object.keys(BRANCHES).length === 22 && CAPS.length === TREE.bodies,
    { fruit: n('fruit'), sharp: n('sharp'), seed: n('seed'), sporeling: n('sporeling') });
  check('each strain has its branch to seed it', seeds.join() === Object.keys(STRAINS).sort().join(), seeds); }

// ---- the services, played against a stand-in game (a box, a bus, a save, a Book, a clock)
{ let now = 10 * DAY_MS + 6 * DAY_MS / 24; setClock(() => now); const H = DAY_MS / 24;
  const evs = [], on = {}, box = { slots: new Array(12).fill(null),
    add(id, from, uses, data) { const i = this.slots.indexOf(null); if (i < 0) return -1; this.slots[i] = { id, ...(data ? { data } : {}) }; return i; },
    take(k) { const x = this.slots[k]; this.slots[k] = null; return x?.id; } };
  const cards = { 'arcana.world': 1 };
  const game = { pneuka: box, events: { emit: (n, e) => { evs.push({ n, ...e }); for (const f of on[n] || []) f(e); }, on: (n, f) => (on[n] ||= []).push(f) },
    save: { section() {}, dirty() {} }, veritome: { book: { has: (id) => cards[id] > 0, take: (id) => (cards[id] > 0 ? (cards[id]--, true) : false) } } };
  const itemOf = (id) => id.startsWith('curio.') ? { kind: 'curio', key: id.slice(6), tier: CURIOS.find((c) => `curio.${c.id}` === id)?.tier ?? 0, name: id } : id.startsWith('mat.') ? { kind: 'material', name: id } : null;
  const S = (game.sporeBeds = new SporeBeds(game, { itemOf })), T = (game.myggdrasil = new Myggdrasil(game)), K = new Keepsakes(game);
  game.events.emit('garden.place', { feature: 'sporebed', by: 'courier' });
  check('a spore bed placed is granted, with the oyster and the inkcap', S.beds.length === 1 && S.strains.grief && S.strains.desire && !S.strains.wonder);
  box.add('curio.whelk'); box.add('curio.storm');
  check('a strain you do not hold is refused', !S.inoculate(0, 'wonder').ok);
  S.inoculate(0, 'desire'); const r1 = S.set(0, [0]);
  check('a curio set in the inkcap leaves the box', r1.ok && box.slots[0] === null, r1);
  check('taken back unchanged in the first game hour', S.back(0).ok && box.slots.some((x) => x?.id === 'curio.whelk'));
  const k = box.slots.findIndex((x) => x?.id === 'curio.whelk'); S.set(0, [k]); now += 0.5 * H;
  check('not ready before its hours, and no longer taken back after the first', !S.ready(0) && (now += 0.6 * H, !S.back(0).ok));
  now += 4 * H; const h = S.harvest(0);
  const pr = box.slots.find((x) => x?.id?.startsWith('mat.'));
  check('the inkcap\'s print comes out exactly the whelk\'s colour', h.ok && pr && Math.abs(pr.data.hue - SIGNATURE.whelk.h) < 0.11 && pr.data.path.length === 1, pr?.data);
  // the tree
  const before = T.girth; let fed = 0; for (let i = 0; i < 12; i++) { const j = box.add('curio.lodestone'); if (j >= 0 && T.feed(j).ok) fed++; }
  check('Myggdrasil eats what it is given, and grows', fed > 0 && T.girth > before && T.tincture?.mass > 0, { fed, girth: T.girth, caps: T.caps, tincture: T.tincture });
  check('it will not eat what has no colour', (box.slots[0] = { id: 'tool.psygun' }, !T.feed(0).ok));
  box.slots[0] = null;
  const n0 = T.dawn(now), n1 = T.dawn(now); now += DAY_MS; const n2 = T.dawn(now);
  check('it fruits once a dawn, and a crop waiting holds the crown (no second crop, nothing lost)', n0 === T.caps && n1 === 0 && n2 === 0, { dawn: n0, again: n1, nextDawnUnpicked: n2 });
  for (let i = 0; i < box.slots.length; i++) box.slots[i] = null;
  check('picking puts the crop in the box', T.pick() === n0 && box.slots.filter(Boolean).length === n0);
  now += DAY_MS; check('the next dawn fruits again once picked', T.dawn(now) === T.caps);
  cards['arcana.lovers'] = 1;
  check('a card hung opens its branch for good, and seeds its strain', T.hang('lovers').ok && S.strains.wonder && cards['arcana.lovers'] === 0 && !T.hang('lovers').ok);
  check('a branch with no card in the Book is refused', !T.hang('sun').ok);
  game.events.emit('spirit.release', { kind: 'wisp', spirit: 'Pip', by: 'courier' });
  check('a spirit let go is fired into a keepsake pot', K.pots.length === 1 && K.pots[0].spirit === 'Pip');
  check('every outcome said with by', evs.filter((e) => /^(spore|myggdrasil|keepsake)\./.test(e.n)).every((e) => e.by === 'courier')); }
console.log(fails ? `mycelium: ${fails} FAILED` : 'mycelium: all passed'); process.exitCode = fails ? 1 : 0;
