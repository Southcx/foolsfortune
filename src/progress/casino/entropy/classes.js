// ---------------------------------------------------------------------------------------
// ENTROPY TACTICS' FIVE MAJOR ARCANA (docs/plans/ENTROPY-TACTICS.md 3b, 8.7, 8.12; GAPS G95): the classes, each a passive, one active (paid
// from the Hungry Die's bank) and a SUIT: its class identity, its court tokens of that suit advancing one tile further a turn and its number
// cards of that suit attuned, played one up or down (cards.js): carving a deck toward its suit is the mono-colour play, MTG's. The Tower is
// the fifth, for Wands (version 2.1, 8.12). Each class answers another: the Fool's reach against the Chariot's plating, the Tower's
// Lightning against a board of tokens, the Hermit's held hand against fatigue. A class changes a rule only as a modifier the table shows.
// Not built: Fatelink's two more actives opened by the bomb's depth, and the ultimates.
//   fool     no suit: its number cards reach a tile further to hit a token; re-roll the Hungry Die once a turn for 2; CYCLE (2): draw 3
//   chariot  swords: every token one tile further, plated (3 off a hit, never under 1) and unscathed winning a meeting; CHARGE (2): +3 power
//   empress  pentacles: tokens you place one rank stronger (+3 health), not faster; BLOOM (2): every tile under a token of yours turns
//            yours (2.1: ground decides half the games; its mend of five did little)
//   hermit   cups: three cards kept between turns, not two; LANTERN (3): this turn's Hungry Die roll is three higher
//   tower    wands: your tokens that fall (to a card or a meeting) are fed to your Hungry Die, not discarded; LIGHTNING (2): every token on
//            the board takes 3, yours too but your wands, once a turn (Waite's Tower: the bolt that brings every structure down)
// Prior art: Fatelink's and the Major Arcana as characters (the owner's draft), Hearthstone's hero powers, Duelyst's generals, MTG's colours.
//
//   CLASSES { [id]: { id, label, suit (SUITS index | null), passive, active, cost, does } }   CLASS_IDS   HEALTH
// ---------------------------------------------------------------------------------------
export const HEALTH = 20;
export const CLASSES = {
  fool: { id: 'fool', label: 'The Fool', suit: null, passive: 'No suit of its own: your number cards reach one tile further to hit a token. Once a turn, pay 2 to roll the Hungry Die again.', active: 'cycle', cost: 2, does: 'Cycle: draw three more cards.' },
  chariot: { id: 'chariot', label: 'The Chariot', suit: 1, passive: 'Swords: your sword tokens advance one tile further, and your sword cards play one up or down. Every token of yours advances one tile further, takes 3 less from a hit, and wins a meeting unhurt.', active: 'charge', cost: 2, does: 'Charge: your tokens fight and strike with 3 more power this turn.' },
  empress: { id: 'empress', label: 'The Empress', suit: 2, passive: 'Pentacles: your pentacle tokens advance one tile further, and your pentacle cards play one up or down. Tokens you place are one rank stronger (not faster).', active: 'bloom', cost: 2, does: 'Bloom: every tile under one of your tokens turns yours.' },
  hermit: { id: 'hermit', label: 'The Hermit', suit: 0, passive: 'Cups: your cup tokens advance one tile further, and your cup cards play one up or down. You keep three cards between turns, not two.', active: 'lantern', cost: 3, does: 'Lantern: this turn\'s Hungry Die roll is 3 higher.' },
  tower: { id: 'tower', label: 'The Tower', suit: 3, passive: 'Wands: your wand tokens advance one tile further, and your wand cards play one up or down. Your tokens that fall are fed to your Hungry Die, not discarded.', active: 'lightning', cost: 2, does: 'Lightning: every token on the board takes 3, yours too but your wands.' },
};
export const CLASS_IDS = Object.keys(CLASSES);
