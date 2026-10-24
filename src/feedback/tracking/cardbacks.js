// ---------------------------------------------------------------------------------------
// TRACKING, THE CARD BACKS (ui/cardbackchoice.js): a deck given another back is said once in the log. A preference, so nothing is counted
// (the ledger keeps play, not settings). Words placeholders for Espada's.
//
//   cardback.set { deck: 'house' | 'arcana', id, by: 'courier' }
//
//   cardBackRules({ on, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
const DECK = { house: 'The house deck', arcana: 'The Major Arcana' };

export function cardBackRules({ on, log }) {
  on('cardback.set', (e) => {
    const own = e.id === 'house' || e.id === 'arcana';
    log.say('system', `${DECK[e.deck] || e.deck} ${own ? 'wears its own back.' : `now wears the ${e.id} back.`}`, { key: `cardback.${e.deck}`, throttle: 0.5 });
  });
}
