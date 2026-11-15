// ---------------------------------------------------------------------------------------
// THE WELL'S BOARD, ITS ITEMS AND ITS ARCANA (docs/plans/WELL-BOARD.md 11): the two tables the board game's extras are read from.
// Data only; what each does is in rules.js (one switch each), so the bot, the page and the view read the same rows.
//
//   ITEMS     what a seat holds (three at most) and uses before its throw, one a turn: found on an Item space, bought at a Shop.
//             Mario Party's items, each a small bend of one rule of the turn (the die, the door, the dice, a rival).
//   ARCANA    the Major Arcana an Arcana space draws from (Mario Party's Chance Time and Dokapon's roulette, in the game's own
//             deck): fourteen of the twenty-two, each one line that does what it says, some kind and some not. The numerals are the
//             cards' own.
//   STANCES   a duel's three (Dokapon Kingdom's battle, cut to rock-paper-scissors): Strike beats Feint, Feint beats Guard, Guard
//             beats Strike.
//
// Prior art: Mario Party (the double dice, the custom dice block, the item shop, a trap on a space, Chance Time), Dokapon Kingdom
// (field items, the battle's guessed stances, robbing a rival), the Rider-Waite-Smith Majors' plain meanings for the cards' lines.
//
//   ITEMS { id: { label, line, cost, weight } }   ITEM_IDS   ARCANA [{ id, numeral, label, line, tone }]   STANCES   beats(a, b)
//   POWERS { id: { label, domain, slot, line } }   POWER_IDS
// ---------------------------------------------------------------------------------------

export const ITEMS = {
  twin: { label: 'Twin throw', line: 'Your next die is thrown twice and added.', cost: 20, weight: 3 },
  loaded: { label: 'Loaded die', line: 'Pick the face of your next die.', cost: 30, weight: 2 },
  kit: { label: 'Mending kit', line: 'Mends one crack.', cost: 15, weight: 3 },
  pick: { label: 'Door pick', line: 'Counts as one cleared floor for the door of this ring.', cost: 25, weight: 2 },
  swap: { label: 'Swap', line: 'Trade places with a rival.', cost: 20, weight: 2 },
  snare: { label: 'Snare', line: 'Set on your space. The next rival to land there pays you.', cost: 10, weight: 3 },
  recast: { label: 'Fresh cast', line: 'Every spent die comes back.', cost: 15, weight: 3 },
};
export const ITEM_IDS = Object.keys(ITEMS);

/** `tone`: good, bad or odd, for a view's colour and a bot's hope. */
export const ARCANA = [
  { id: 'magician', numeral: 'I', label: 'The Magician', line: 'A random item.', tone: 'good' },
  { id: 'lovers', numeral: 'VI', label: 'The Lovers', line: 'You and a rival each find a material.', tone: 'good' },
  { id: 'chariot', numeral: 'VII', label: 'The Chariot', line: 'Carried forward up to six spaces.', tone: 'odd' },
  { id: 'hermit', numeral: 'IX', label: 'The Hermit', line: 'One floor of this ring counts as cleared.', tone: 'good' },
  { id: 'wheel', numeral: 'X', label: 'Wheel of Fortune', line: 'Trade purses with a rival.', tone: 'odd' },
  { id: 'justice', numeral: 'XI', label: 'Justice', line: 'The richest seat gives 10 cubes to the poorest.', tone: 'odd' },
  { id: 'hanged', numeral: 'XII', label: 'The Hanged Man', line: 'Miss your next turn.', tone: 'bad' },
  { id: 'death', numeral: 'XIII', label: 'Death', line: 'Every crack mended. Your newest material is lost.', tone: 'odd' },
  { id: 'temperance', numeral: 'XIV', label: 'Temperance', line: 'Mends two cracks.', tone: 'good' },
  { id: 'devil', numeral: 'XV', label: 'The Devil', line: 'Take 8 cubes from each rival.', tone: 'good' },
  { id: 'tower', numeral: 'XVI', label: 'The Tower', line: 'A crack, and half your cubes lost.', tone: 'bad' },
  { id: 'star', numeral: 'XVII', label: 'The Star', line: '20 cubes.', tone: 'good' },
  { id: 'moon', numeral: 'XVIII', label: 'The Moon', line: 'Led back up to six spaces.', tone: 'bad' },
  { id: 'sun', numeral: 'XIX', label: 'The Sun', line: 'Every spent die comes back, and 10 cubes.', tone: 'good' },
];

export const STANCES = { strike: { label: 'Strike', beats: 'feint' }, feint: { label: 'Feint', beats: 'guard' }, guard: { label: 'Guard', beats: 'strike' } };
/** 1 if stance a beats b, -1 if b beats a, 0 a draw. */
export const beats = (a, b) => (a === b ? 0 : STANCES[a].beats === b ? 1 : -1);

/** The board's POWERS (WELL-BOARD.md 12: the god hand's powers at the board's scale, paid Dicey Dungeon's way): one a turn, before
 *  the throw, and its price is a die of your cast set into its slot, spent as a throw would spend it. `slot`: which dice it takes
 *  (`any`, or `big`: the d12 or the d20). `domain`: whose power it is, for a view's colour. */
export const POWERS = {
  ward: { label: 'Ward', domain: 'spellscription', slot: 'any', line: 'Spend a die. The next crack, snare or lost duel is turned aside.' },
  push: { label: 'Push', domain: 'psychokinesis', slot: 'any', line: 'Spend a die and throw it. A rival on your ring, or its stray, is carried back that many spaces.' },
  transmute: { label: 'Transmute', domain: 'alteration', slot: 'big', line: 'Spend the d12 or the d20. Every Hazard on this ring becomes a Spring.' },
};
export const POWER_IDS = Object.keys(POWERS);

