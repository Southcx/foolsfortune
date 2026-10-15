// ---------------------------------------------------------------------------------------
// THE HOW-TOS (docs/plans/CASINO-CLARITY.md section 6; the owner, 2026-10-15: "a quick 'How to' explainer/tutorial for each game that shows
// on first play, but is skippable AND replayable"): each game of Raku's taught in five or six short steps, a nine-year-old's words, each
// step pointing at the part of the table it is about (`show`: a coach key the view spotlights: goal, hand, moves, seats, centre, dice,
// tiles, claim, tell). It plays the first time you sit at a game (until you have finished or skipped it once: a ledger counter, never a
// flag), and again from the table's "How to play" or `/howto`. `card` is the rules on one card, always a click away.
// The words are drafts for Espada (strings only); the order and what each step shows are the design.
//
// Prior art: Hearthstone's and Marvel Snap's first games (one rule a step, shown on the board), Balatro's opening hand with its tips,
// a board game's quick-start card (the rules that fit on one side).
//
//   HOWTO { [game]: { title, steps: [{ say, show }], card: [line] } }   howtoSeen(game, id) -> bool
// ---------------------------------------------------------------------------------------

export const HOWTO = {
  querent: {
    title: 'Querent',
    steps: [
      { say: 'Make 3 groups of 3 cards. A group is 3 of the same number (7, 7, 7) or 3 numbers in a row (4, 5, 6). Colours don\'t matter.', show: 'goal' },
      { say: 'You hold 8 cards. On your turn you take 1 (now you have 9), then throw 1 back. Cards that already make groups glow together.', show: 'hand' },
      { say: 'Take a card from your own pile, or steal the card someone just threw away. Careful: when you steal, they get a Major Arcana, a power-up card.', show: 'moves' },
      { say: 'When your 9 cards make 3 groups, you win the round! Fancy hands score more: all runs, all sets, or all one colour.', show: 'hand' },
      { say: 'One card away from winning? You can call the Fate Clause. Win on your very next turn for a big bonus, but your hand is locked until then.', show: 'moves' },
      { say: 'There are 4 rounds. Whoever has the most points at the end wins the table.', show: 'seats' },
    ],
    card: ['Goal: 3 groups of 3 (same number, or 3 in a row).', 'Turn: take 1 (draw or steal), throw 1 back.', 'Stealing gives the robbed player a Major Arcana.', 'Fate Clause: one card away, call it for a bonus.', '4 rounds; most points wins.'],
  },
  zodiac: {
    title: 'Zodiac',
    steps: [
      { say: 'You have 12 tiles, numbered 1 to 12. Shut all of yours before anyone else does.', show: 'tiles' },
      { say: 'You roll 2 dice. Shut tiles that add up to your dice. You can add the dice (3 + 4 = 7) or multiply them (3 × 4 = 12).', show: 'dice' },
      { say: 'Your gold attack die reopens someone else\'s shut tiles. If none fit, they pay chips into the pot instead.', show: 'dice' },
      { say: 'Roll doubles and pick a prize: lock a tile shut forever (with a power), a bigger attack die, or make someone pay.', show: 'moves' },
      { say: 'Shut all 12 first and the pot is yours.', show: 'centre' },
    ],
    card: ['Goal: shut your 12 tiles first.', 'Shut tiles that add up to your dice, added or multiplied.', 'Your gold attack die reopens others\' tiles.', 'Doubles: lock a tile, grow your attack die, or make them pay.'],
  },
  eventhorizon: {
    title: 'Event Horizon',
    steps: [
      { say: 'The house rolls secret dice and shows you the total. That is the target.', show: 'centre' },
      { say: 'Roll your own dice, a few at a time, to land on EXACTLY that number.', show: 'dice' },
      { say: 'Go over and you\'re out. Stay under and wait for your next turn. Each die can only be rolled once a round, so choose well.', show: 'moves' },
      { say: 'Every choice shows its chance to hit exactly and its chance to go over.', show: 'moves' },
      { say: 'Hit it exactly to win the pot. Use as many dice as the house and it pays 3 times your bet. Use the very same dice and it pays 5 times.', show: 'goal' },
    ],
    card: ['Goal: add up to exactly the target.', 'Roll some of your dice each turn; each die once a round.', 'Over the target: you\'re out.', 'Same number of dice as the house: ×3. Same dice: ×5.'],
  },
  supernova: {
    title: 'Supernova Run',
    steps: [
      { say: 'You start with four 6-sided dice. The first to 500 points wins.', show: 'goal' },
      { say: 'Roll all your dice for points. A die that rolls its top number makes a copy of itself. A 1 makes it shrink (a 4-sided die that rolls 1 is gone).', show: 'moves' },
      { say: 'Or change your dice instead: fuse two into one bigger die (6 + 6 makes a 12), or split one into two.', show: 'moves' },
      { say: 'Build a 20-sided die. When it rolls a 20: SUPERNOVA! Your points double, and everyone\'s dice reset to four 6-sided dice.', show: 'seats' },
    ],
    card: ['Goal: 500 points first.', 'Roll: top numbers copy the die, 1s shrink it.', 'Or fuse two dice into a bigger one, or split one.', 'A d20 rolling 20: SUPERNOVA, points ×2, all dice reset.'],
  },
  nebula: {
    title: 'Nebula Bluff',
    steps: [
      { say: 'You roll 6 secret dice. Add them up: that is what your hand is worth. A die on its top number is worth 10 more.', show: 'hand' },
      { say: 'Take turns claiming "my hand is worth at least ___". Tell the truth, or bluff! Bigger claims cost more chips.', show: 'claim' },
      { say: 'On your turn: claim higher, call the last claim a bluff, or fold (you lose 1 die).', show: 'moves' },
      { say: 'Call a bluff and their hand is shown. If they lied, they lose 2 dice. If they told the truth, you lose 2.', show: 'moves' },
      { say: 'Watch for tells: when someone lies, their top chip sometimes wiggles.', show: 'tell' },
      { say: 'The last player with dice wins.', show: 'seats' },
    ],
    card: ['Goal: be the last with dice.', 'Claim what your secret hand is worth, or bluff.', 'Raise, call the bluff, or fold (−1 die).', 'Wrong call or caught bluff: −2 dice.', 'Watch for tells.'],
  },
};

/** Has this game's how-to been finished or skipped once (the ledger's count, kept per build)? */
export const howtoSeen = (game, id) => (game.ledger?.get?.(`casino.${id}.howto`) || 0) > 0;
