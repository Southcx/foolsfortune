// ---------------------------------------------------------------------------------------
// TRACKING, THE SPIRIT GARDEN'S LIFE (progress/spiritnotice.js, gardenfolk.js, sporebeds.js, sporeprints.js, treediary.js, spiritdiet.js,
// spiritwork.js; docs/plans/GARDEN-COZY.md C3, C4, C7; MYCELIUM.md 3 to 5; GAPS.md G114 to G156): their ledger counts and their log
// lines. The words are placeholders, Espada's to write (docs/handoffs/espada/2026-11-03-from-dovina-garden-life.md); a spirit's body says
// its likes and tints (Calissa's), so `spirit.taste` and `spirit.tint` are counted and never said. tracking/rules.js calls it.
//
//   gardenLifeRules({ on, L, log })
// ---------------------------------------------------------------------------------------
import { FOLK } from '../../progress/gardenfolk.js';
import { STRAIN_NAMES } from '../../progress/mycelium.js';
import { colourWord } from '../../progress/treediary.js';
import { DECOR } from '../../progress/decor.js';

/** What a folk says of the garden by the band of its rating (placeholder words). */
export const FOLK_OPINION = {
  bare: 'This will be a garden. Give it time.', young: 'A good start. There is room to grow.', fair: 'A fair garden, and getting fairer.',
  lovely: 'A lovely garden. I could stay a while.', splendid: 'A splendid garden. You have an eye.', wondrous: 'I have not seen the like.',
};
const cap = (s) => s[0].toUpperCase() + s.slice(1);

export function gardenLifeRules({ on, L, log }) {
  on('spirit.notice', (e) => {
    if (e.by !== 'courier') return;
    L.inc('spirit.notice'); L.inc(`spirit.notice.${e.topic}`);
    log.say('info', `${e.spirit || 'Your spirit'}: "${e.line}"`, { key: 'notice', throttle: 2 });
  });
  on('garden.folk', (e) => {
    if (e.by !== 'courier') return;
    L.inc('garden.folk'); L.inc(`garden.folk.${e.folk}`);
    const who = cap(FOLK[e.folk]?.name || 'A visitor');
    log.say('info', `${who} came by. "${FOLK_OPINION[e.opinion] || ''}"`, { key: `folk.${e.folk}`, throttle: 10 });
    if (e.gift) { L.inc('garden.folk.gift'); log.say('gain', `${who} left you a ${DECOR[e.gift]?.name || 'piece'}.`, { key: `folkgift.${e.folk}`, throttle: 10 }); }
  });
  on('spore.tend', (e) => { if (e.by !== 'courier' || !e.on) return; L.inc('spore.tend'); log.say('info', `${e.spirit || `Your ${e.kind}`} tends the bed.`, { key: 'tend', throttle: 5 }); });
  on('spore.seeded', (e) => { if (e.by !== 'courier') return; L.inc('spore.seeded'); L.inc(`spore.seeded.${e.strain}`); log.say('gain', `${e.spirit || `Your ${e.kind}`} seeded ${STRAIN_NAMES[e.strain]} in the bare bed.`); });
  on('spore.harvest', (e) => { if (e.by === 'courier' && e.bent) { L.inc(`spore.bent.${e.bent}`); log.say('info', e.bent === 'truer' ? 'The print came out true.' : 'The pair took the other way round.', { key: 'bent', throttle: 5 }); } });
  on('spore.print', (e) => {
    if (e.by !== 'courier') return;
    L.inc('spore.print'); if (e.first) L.inc('spore.print.first');
    log.say('loot', e.first ? `Found wild spores of ${STRAIN_NAMES[e.strain]}.` : `Found a print of ${STRAIN_NAMES[e.strain]}.`, { key: `print.${e.print}`, throttle: 5 });
  });
  on('myggdrasil.diary', (e) => {
    if (e.by !== 'courier') return;
    L.inc('myggdrasil.diary');
    const to = e.to ? colourWord(e.to.h, e.to.s) : 'grey', from = e.from ? colourWord(e.from.h, e.from.s) : null;
    const moved = e.how === 'barely' ? 'barely moved' : from && from !== to ? `moved ${e.how} from ${from} to ${to}` : `moved ${e.how}, ${to}`;
    log.say('system', `Myggdrasil ate ${e.meals} thing${e.meals === 1 ? '' : 's'}. Its sap ${moved}.`, { key: 'treediary', throttle: 10 });
  });
  on('spirit.taste', (e) => { if (e.by === 'courier') L.inc(`spirit.taste.${e.taste}`); });
  on('spirit.tint', (e) => { if (e.by === 'courier') L.inc('spirit.tint'); });
  on('spirit.drink', (e) => { if (e.by === 'courier') L.inc('spirit.drink', e.gain || 1); });
  on('alchemy.press', (e) => { if (e.by === 'courier' && e.worked) { L.inc('alchemy.worked', e.worked); log.say('info', 'A spirit at the press lent its hand.', { key: 'worked', throttle: 30 }); } });
}
