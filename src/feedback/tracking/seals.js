// ---------------------------------------------------------------------------------------
// TRACKING, THE SEALS (docs/plans/HANKO.md; the cradles are Petra's, world/cradles.js): the ledger behind the Seal Book. Each cradle your
// seal sets in counts once as a first (`seal.at.<cradle>`: the book's page, its seal received), and every sealing counts by kind; a body
// run dry or wrecked and the seal's carving are said once in the log. Only the Courier's sealing counts (`by`). Words are placeholders
// for Espada's.
//
// Prior art: the goshuinchō (a pilgrim's book, a temple's seal stamped into it at each visit: Espada's), Breath of the Wild's shrine count.
//
//   sealRules({ on, L, log })   (tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { SEAL_KINDS } from '../../progress/sealachievements.js';

export function sealRules({ on, L, log }) {
  on('seal.carve', (e) => { if (L.first('seal.carve')) log.say('record', `Your seal is carved: ${e.name}. It is yours for good.`); });
  on('seal.set', (e) => {
    if (e.by !== 'courier' || !e.cradle) return;
    L.inc('seal.set'); if (SEAL_KINDS.includes(e.kind)) L.inc(`seal.kind.${e.kind}`);
    L.inc(`seal.at.${e.cradle}`);
    const page = e.book || e.cradle; // (a place's cradles share one page: a Shrine gate's two are one Shrine, `book: 'shrine.<id>'`)
    if (L.first(`seal.book.${page}`)) log.say('record', 'Your seal sets its imprint, and the cradle stamps its seal into your Seal Book.', { key: 'sealbook' });
  });
  on('seal.unset', (e) => {
    if (e.by !== 'courier') return;
    if (e.why === 'dry') log.say('battle', 'Your pool runs dry, and your Pneuka Jar lifts out of the cradle.', { key: 'sealdry', throttle: 4 });
    if (e.why === 'wrecked') { L.inc('seal.wrecked'); log.say('battle', 'The body breaks and throws your Pneuka Jar clear.', { key: 'sealwreck', throttle: 4 }); }
  });
}
