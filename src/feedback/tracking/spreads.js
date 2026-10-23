// ---------------------------------------------------------------------------------------
// TRACKING, THE SPREAD LAID (docs/plans/SPREADS.md; the state is Petra's, progress/laidspread.js): the log speaks on what you do (a card laid,
// reversed or taken back, a tally moved by that, a cell cracked dark, a spread complete), never on what moves by itself (the Past fading,
// Self with the pool, the Challenge in a fight). The ledger keeps what the spreads' feats are predicates over (SPREADS.md 5.5, Dovina's
// achievements): the most cells counting in each spread, how often every lit cell counted, the most counting with no cell dark.
//
// Prior art: a reader saying the card as it is turned (each act read aloud once), Diablo II's charm tooltips (the power named with its number).
//
//   spreadRules({ on, L, log })   (tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { SPREADS, TALLY, effectOf } from '../../progress/spreads.js';
import { CARD } from '../../tools/veritome/cards.js';

const SUIT = { wands: 'Wands', cups: 'Cups', swords: 'Swords', pentacles: 'Pentacles' };
const posOf = (e) => SPREADS[e.spread]?.positions.find((p) => p.id === e.position)?.label || e.position;
const nameOf = (card) => CARD[`arcana.${card}`]?.name || card;

export function spreadRules({ on, L, log }) {
  on('spread.lay', (e) => {
    L.inc('spread.lay');
    log.say('info', e.card ? `You lay ${nameOf(e.card)}${e.reversed ? ', reversed,' : ''} in the ${posOf(e)}.` : `You take back the card in the ${posOf(e)}.`, { key: `slay.${e.position}`, throttle: 0.3 });
  });
  on('spread.tally', (e) => {
    L.hi(`spread.counting.${e.spread}`, e.counting);
    if (e.lit > 0 && e.counting >= e.lit) L.inc(`spread.full.${e.spread}`);
    if (!e.dark) L.hi(`spread.undark.${e.spread}`, e.counting);
    const pct = Math.round(effectOf(e.suit, e.to) * 100);
    log.say('info', `Your spread ${e.to > e.from ? 'lights' : 'dims'} ${SUIT[e.suit]}: ${e.to.toFixed(1)} of ${TALLY.cap} (${TALLY[e.suit].does} ${pct > 0 ? '+' : ''}${pct}%).`, { key: `stally.${e.suit}`, throttle: 0.5 });
  });
  on('spread.crack', () => { L.inc('spread.crack'); log.say('info', 'Contrary suits meet, and a cell goes dark.', { key: 'scrack', throttle: 2 }); });
  on('spread.complete', (e) => { L.inc(`spread.complete.${e.spread}`); log.say('gain', `${SPREADS[e.spread]?.label || 'The spread'} is complete: its Outcome lights.`, { key: 'sdone' }); });
}
