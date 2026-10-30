// ---------------------------------------------------------------------------------------
// TRACKING, SEEDS, SLABS AND SCANS (progress/seeds.js, progress/slabs.js, progress/scans.js; docs/plans/SEEDS-SLABS-SCANS.md): their
// ledger and log lines, ready for the world side (Petra's: the ring's seeds, the carving bench, the scanner). A seed is a predicate over the
// ledger (seedsEarned): after each act that can earn one, any seed newly earned is written `seed.earn.<id>` (once) and said; the ring's
// runtime gives the seeds so written that it has not yet placed. The bone seed reads `slab.flawless` from here. Placeholder words, Espada's.
//
//   gardenGrowthRules({ on, L, log, g })   (tracking/rules.js calls it; a seed is said once the ring takes seeds: `realm.orbit.seeds`, true from v352)
//   events read: garden.enter, well.foe, sea.square.done, spirit.wish.done, mimic.solve, feeling.wake (an act that may earn a seed), seed.plant { seed, slot }, seed.grow { seed, size }, slab.make { kind, stars, from },
//   slab.carve { kind, score, bared, cracked, flawless }, scan.read { what, kind, cls, sealed, again, own }
// ---------------------------------------------------------------------------------------

import { SEEDS, seedsEarned } from '../../progress/seeds.js';

export function gardenGrowthRules({ on, L, log, g }) {
  const say = (kind, text, key, throttle = 1) => log.say(kind, text, { key, throttle });
  const grant = () => { // (registered after the rules that count these acts, so the ledger already holds them)
    for (const id of seedsEarned(L)) {
      if (L.get(`seed.earn.${id}`)) continue;
      L.inc('seed.earn'); L.inc(`seed.earn.${id}`);
      if (g?.realm?.orbit?.seeds) say('gain', SEEDS[id].inner ? `A moonlet of ${SEEDS[id].feeling[0].toUpperCase() + SEEDS[id].feeling.slice(1)} rises round your garden's heart.` : 'A planetoid\'s seed is yours. It waits in the garden\'s shed: carry it up to the ring with the god hand.', `seed.${id}`, 0);
    }
  };
  for (const ev of ['garden.enter', 'well.foe', 'sea.square.done', 'spirit.wish.done', 'mimic.solve', 'feeling.wake']) on(ev, (e) => { if ((e?.by ?? 'courier') === 'courier') grant(); });
  on('seed.plant', (e) => { if (e.by === 'courier') L.inc('seed.plant'); });
  on('seed.feed', (e) => { if (e.by === 'courier') { L.inc('seed.feed'); L.inc('seed.fed.minutes', Math.round(e.minutes || 0)); } }); // (Petra's: { seed, minutes, from, feeling }; seed.grow says what shows)
  let grown = null; // (the size a feed reached this tick, said once)
  on('seed.grow', (e) => {
    if (e.by !== 'courier') return;
    L.inc('seed.grow'); L.inc(`seed.grow.${e.size}`);
    // (a feed past several sizes emits one seed.grow a size in the same tick: say only the last, once the tick is done; Petra, v355)
    const first = grown == null; grown = e.size;
    if (first) queueMicrotask(() => { say('gain', `A planetoid grows: ${grown}.`, 'seed.grow', 0.5); grown = null; });
  });
  on('slab.make', (e) => { if (e.by !== 'courier') return; L.inc('slab.make'); L.inc(`slab.make.${e.from || 'plate'}`); });
  on('slab.carve', (e) => {
    if (e.by !== 'courier') return;
    L.inc('slab.carve'); L.hi('slab.best', Math.round(100 * (e.score || 0)));
    if (e.flawless) { L.inc('slab.flawless'); grant(); }
    say(e.flawless ? 'record' : 'gain', e.flawless ? 'A flawless carving. The spirit steps out of the stone whole, and shining.'
      : `The spirit steps out of the stone: ${Math.round(100 * (e.bared || 0))}% bared, ${Math.round(100 * (e.cracked || 0))}% cracked.`, 'slab.carve', 0.5);
  });
  on('scan.read', (e) => {
    if (e.by !== 'courier' || e.own) return;
    if (e.again) { L.inc('scan.again'); say('info', 'You have read this code before. It gives a little, once.', 'scan.again'); return; }
    L.inc('scan.read'); L.hi('scan.cls.best', (e.cls || 0) + 1); if (e.sealed) L.inc('scan.sealed');
    say('gain', e.what === 'material' ? 'The code holds a material.' : e.sealed ? 'The code holds a sealed slab: meet its creature in the world to open it.' : 'The code holds a slab to carve.', 'scan.read', 0.5);
  });
}
