// ---------------------------------------------------------------------------------------
// THE OSTRACA, HEADLESS (world/ostraca.js, progress/ostraca.js, progress/knacks.js): the sixteen placed where progress/ostraca.js says,
// a buried one lifted by the pick's reveal and taken with its event and ledger count, a plaster patch knocked away by a blow, a forgotten
// pot in the Great Dunemaw drawn by the deck and leaving its sherd when broken, the sealed room's door opened by the fork and its stele
// read, and the Crib Sheet's gloss shown once it is earned and switched on, bare once it is off. One PASS/FAIL line a check.
// Run with the dev server up: `node scripts/ostracatest.mjs` (URL= for another port).
// ---------------------------------------------------------------------------------------
import { openGame } from './playtest/game.mjs';

const g = await openGame({ seed: 5 });
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${typeof info === 'string' ? info : JSON.stringify(info)}`); };
await g.step(120);
const r = await g.page.evaluate(async () => {
  const G = __game.game, O = G.ostraca, out = {}, evs = [];
  for (const n of ['ostracon.find', 'stele.read', 'sealed.open']) G.events.on(n, (e) => evs.push({ n, ...e }));
  O.update();
  out.placed = { buried: O.buried.length, loose: O.loose.length, patches: O.patches.length, stelae: O.stelae.length, room: !!O.room };
  out.split = Object.fromEntries(Object.entries(O.at).map(([k, v]) => [k, v.length]));
  // the pick comes down over a buried one: it rises, and F takes it
  const b = O.buried[0], word = b.word;
  out.revealed = O.reveal(b.ground.clone(), 1);
  const s = O.loose.find((x) => x.word === word); O.take(s);
  out.find = evs.find((e) => e.n === 'ostracon.find'); out.found = G.ledger.get('ostracon.found'); out.wordCount = G.ledger.get(`ostracon.${word}`);
  // a blow on a plaster patch: knocked away, a sherd at the wall's foot
  const p = O.patches[0]; p.struck(); out.patch = { broken: p.broken, sherd: O.loose.some((x) => x.word === p.word && x.place === 'workshop') };
  // a floor of the Great Dunemaw, the deck sure (the eighth dry floor): a pot holds the next word; broken, it leaves the sherd
  O.s.dry = 7;
  const fake = { r: Object.assign(() => 0.99, { int: () => 0 }), pots: [{ def: { find: false } }, { def: { find: true } }] };
  O.forFloor(fake); out.pot = fake.pots[0].def.ostracon || null;
  if (out.pot) O.drop(out.pot, G.player.pos.clone(), 'dunemaw');
  out.potSherd = O.loose.some((x) => x.word === out.pot && x.place === 'dunemaw');
  // the sealed room: the fork's ring opens the door; the stele inside is read with F
  O.door.ent.ring(); out.opened = O.s.opened && !O.door.m.visible;
  const st = O.stelae.find((x) => x.def.id === 'stele.sealed'); O.take(st);
  out.stele = evs.find((e) => e.n === 'stele.read'); out.steleLedger = G.ledger.get('stele.sealed');
  // the Crib Sheet: not earned, the word bare; earned (six ostraca), glossed beside it; switched off, bare again
  const W = word.toUpperCase();
  out.bare = O.gloss(W);
  G.ledger.inc('ostracon.found', 6);
  out.open = G.knacks.open('crib'); out.withCrib = O.gloss(W);
  G.knacks.set('crib', false); out.off = O.gloss(W); G.knacks.set('crib', true);
  out.stele1 = O.gloss('DIPSA'); // (a stele's word: glossed by the reading)
  return out; });
check('sixteen ostraca where progress/ostraca.js puts them', r.split.dunes === 6 && r.split.dunemaw === 6 && r.split.ruins === 2 && r.split.workshop === 2, r.split);
check('placed: six buried, the columns\' two, two plaster patches, the sealed room and its stele', r.placed.buried === 6 && r.placed.loose === 2 && r.placed.patches === 2 && r.placed.room && r.placed.stelae >= 1, r.placed);
check('the pick lifts a buried one', r.revealed === 1, r.revealed);
check('taken: ostracon.find with its word and gloss, counted once', r.find?.word && r.find?.gloss && r.find?.by === 'courier' && r.found === 1 && r.wordCount === 1, { find: r.find, found: r.found });
check('a blow knocks a plaster patch away, leaving its sherd', r.patch.broken && r.patch.sherd, r.patch);
check('a forgotten pot in the Great Dunemaw holds the next word (the deck, sure on the eighth dry floor)', !!r.pot && r.potSherd, r.pot);
check('the fork rings the sealed door open', r.opened, r.opened);
check('the stele read: stele.read with its three words', r.stele?.words?.length === 3 && r.steleLedger === 1, r.stele);
check('the Crib Sheet: bare before it is earned', r.bare === r.bare.toUpperCase() && !r.bare.includes('('), r.bare);
check('the Crib Sheet: earned, the gloss beside the word', r.open && /\(.+\)/.test(r.withCrib), r.withCrib);
check('the Crib Sheet: switched off, bare again', !r.off.includes('('), r.off);
check('a stele\'s word is glossed by reading it', /\(.+\)/.test(r.stele1), r.stele1);
check('no page errors', g.errors.length === 0, g.errors.slice(0, 3));
console.log(fails ? `ostraca: ${fails} FAILED` : 'ostraca: all passed'); process.exitCode = fails ? 1 : 0;
await g.close();
