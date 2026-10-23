// ---------------------------------------------------------------------------------------
// THE SPREAD'S AND THE STONES' ACHIEVEMENTS (docs/plans/SPREADS.md 11, CLASSES.md, DICE.md 4): predicates over the ledger, in the GENERAL
// category's "The Spread" and "The Stones" subs. The day's card laid on game days, the classes read (each once: all of them, the sixteen
// courts, the twelve zodiac Majors; feedback/tracking/spreads.js keeps them), and the palm die grown and what it condensed
// (feedback/tracking/palmdie.js).
//
// Prior art: the house's own achievements.js (its helpers passed in, as sealachievements.js takes them); Golden Sun's class list as a
// collection.
//
//   spreadAchievements({ C, H })   (achievements.js calls it inside buildAchievements)
// ---------------------------------------------------------------------------------------
export function spreadAchievements({ C, H }) {
  // the spread's classes and the day's card (docs/plans/SPREADS.md 11, 12; a court wants a spread laid for one suit)
  C('sc1', 'general', 'The Spread', 1, 'count', 'Card of the Day', "Lay the day's card in your spread on 7 game days.", 'spread.daycard', 7);
  C('sc2', 'general', 'The Spread', 2, 'collect', 'Reading Yourself', 'Read as 6 classes.', 'spread.classes', 6);
  C('sc3', 'general', 'The Spread', 4, 'collect', 'The Whole Court', 'Read as all sixteen court cards (one suit held, Page to King).', 'spread.courts', 16, { title: 'of the Sixteen Courts' });
  C('sc4', 'general', 'The Spread', 4, 'collect', 'The Twelve Houses', 'Read as all twelve zodiac Majors (two suits held).', 'spread.zodiac', 12);
  // the palm die (docs/plans/DICE.md 4): the stones in the god hand's form, grown on the overflow it condenses
  H('pd1', 'general', 'The Stones', 2, 'endure', 'Loaded', 'Grow your palm die to a d8.', 'palm.sides', 8);
  H('pd2', 'general', 'The Stones', 5, 'endure', 'The Whole Heaven', 'Grow your palm die to a d20.', 'palm.sides', 20, { title: 'the Twenty-Sided' });
  C('pd3', 'general', 'The Stones', 3, 'count', 'Nothing Wasted', 'Condense 300 cubes from overflow.', 'palm.cubes', 300);
}
