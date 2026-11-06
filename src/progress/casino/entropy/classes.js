// ---------------------------------------------------------------------------------------
// ENTROPY TACTICS' FOUR MAJOR ARCANA (docs/plans/ENTROPY-TACTICS.md 3b, 8.7; GAPS G95): the classes, each a passive, one active (paid from
// the Hungry Die's bank) and, in version 2, a SUIT: its class identity, its court tokens of that suit advancing one tile further a turn
// (carving a deck toward its suit is the mono-colour play, MTG's). Wands are left for a fifth class. A class changes a rule only as a
// modifier the table shows. Not built: Fatelink's two more actives opened by the bomb's depth, and the ultimates.
//   fool     no suit: re-roll the Hungry Die once a turn for 1 (passive); CYCLE (2): draw three more cards
//   chariot  swords: every token advances one tile further (passive); CHARGE (2): your tokens are two stronger this turn
//   empress  pentacles: tokens you place are one rank stronger, not faster (passive); BLOOM (2): your Arcana mends five
//   hermit   cups: three cards kept between turns, not two (passive); LANTERN (3): this turn's Hungry Die roll is three higher
// Prior art: Fatelink's and the Major Arcana as characters (the owner's draft), Hearthstone's hero powers, Duelyst's generals, MTG's colours.
//
//   CLASSES { [id]: { id, label, suit (SUITS index | null), passive, active, cost, does } }   CLASS_IDS   HEALTH
// ---------------------------------------------------------------------------------------
export const HEALTH = 20;
export const CLASSES = {
  fool: { id: 'fool', label: 'The Fool', suit: null, passive: 'No suit of its own. Once a turn, pay 1 to roll the Hungry Die again.', active: 'cycle', cost: 2, does: 'Cycle: draw three more cards.' },
  chariot: { id: 'chariot', label: 'The Chariot', suit: 1, passive: 'Swords: your sword tokens advance one tile further. Every token of yours advances one tile further.', active: 'charge', cost: 2, does: 'Charge: your tokens fight and strike two stronger this turn.' },
  empress: { id: 'empress', label: 'The Empress', suit: 2, passive: 'Pentacles: your pentacle tokens advance one tile further. Tokens you place are one rank stronger (not faster).', active: 'bloom', cost: 2, does: 'Bloom: your Arcana mends 5.' },
  hermit: { id: 'hermit', label: 'The Hermit', suit: 0, passive: 'Cups: your cup tokens advance one tile further. You keep three cards between turns, not two.', active: 'lantern', cost: 3, does: 'Lantern: this turn\'s Hungry Die roll is 3 higher.' },
};
export const CLASS_IDS = Object.keys(CLASSES);
