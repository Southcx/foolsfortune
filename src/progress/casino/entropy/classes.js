// ---------------------------------------------------------------------------------------
// ENTROPY TACTICS' FOUR MAJOR ARCANA (docs/plans/ENTROPY-TACTICS.md 3b; GAPS G95): the classes of version one, one per corner of the
// owner's axes, each a passive and one active (paid from the Hungry Die's bank). The rest of Fatelink's kit (two more actives opened by how
// deep the bomb is in your zone, and an ultimate) is not built yet. A class changes a rule only as a modifier the table shows.
//   fool     tempo and cycling: re-roll the Hungry Die once a turn (passive); CYCLE (2): draw three more cards
//   chariot  aggro: every token moves one tile further (passive); CHARGE (2): every token strikes two harder this turn
//   empress  ramp: a summoned token has one more health (passive); BLOOM (2): your Arcana mends five
//   hermit   control: a hand of six cards (passive); LANTERN (3): this turn's Hungry Die roll is three higher
// Prior art: Fatelink's and the Major Arcana as characters (the owner's draft), Hearthstone's hero powers, Duelyst's generals.
//
//   CLASSES { [id]: { id, label, passive, active, cost, does } }   CLASS_IDS   HEALTH
// ---------------------------------------------------------------------------------------
export const HEALTH = 20;
export const CLASSES = {
  fool: { id: 'fool', label: 'The Fool', passive: 'Once a turn, roll the Hungry Die again.', active: 'cycle', cost: 2, does: 'Cycle: draw three more cards.' },
  chariot: { id: 'chariot', label: 'The Chariot', passive: 'Your tokens move one tile further.', active: 'charge', cost: 2, does: 'Charge: your tokens hit two harder this turn.' },
  empress: { id: 'empress', label: 'The Empress', passive: 'Tokens you summon have one more health.', active: 'bloom', cost: 2, does: 'Bloom: your Arcana mends 5.' },
  hermit: { id: 'hermit', label: 'The Hermit', passive: 'You hold six cards, not five.', active: 'lantern', cost: 3, does: 'Lantern: this turn\'s Hungry Die roll is 3 higher.' },
};
export const CLASS_IDS = Object.keys(CLASSES);
