// ---------------------------------------------------------------------------------------
// WHO SITS AT RAKU'S TABLES (docs/plans/CASINO.md section 7; GAPS G31): the folk and the five divisions' siblings as people with a style
// each, so a table reads as people. A style is data a game's bot leans on; it never changes a rule. A table asks `seatOf(person, game,
// bot)` for the `[bot, style]` pair it seats (world/bazaar/session.js). Guests (co-op players) come later through the same interface: a
// guest has no entry here, so their seat is simply not a bot's.
//   Raku       the house: bluffs and reads a little, counts honestly      Clink  bold, greedy      Crock  rash      Celadon  honest, shows it
//   Petra      the stonemason: folds tight, plays only a measured edge, calls only when the numbers say so
//   Calissa    the glazer: bluffs pretty (often, with a flourish), reads little, loves a big pot
//   Espada     the librarian: counts cards, reads a tell as a text, bluffs rarely and well
//   Dovina     the gambler: bold and adversarial, reads the table, pushes every edge
//   Wanda      the bandleader: plays by feel, even and generous
// A style's keys are the games': Nebula Bluff `bluff read doubt leak noise`, Supernova Run `build`, Charity Gamble `lie nerve count`
// (how often it lies in its claim, how far it bets against the line, how well it counts the deposits it has seen), Entropy Tactics
// `iters greed` (how long it thinks, how hard it pushes the bomb). A key a game does not know is ignored.
//
// Prior art: Red Dead's poker (opponents with a style and a tell), Like a Dragon's casino folk, poker's archetypes (tight-passive,
// loose-aggressive, the calling station) as the first axis of a bot's character.
//
//   FOLK { [name]: { kind: 'folk' | 'sibling', line, styles: { [game]: style } } }   styleOf(name, game)   seatOf(name, game, bot)
// ---------------------------------------------------------------------------------------

export const FOLK = {
  Raku: { kind: 'folk', line: 'The house.', styles: { nebula: { bluff: 0.3, read: 0.6, doubt: 0.3, leak: 0.6, noise: 0.1 }, charity: { lie: 0.35, nerve: 0.5, count: 0.6 }, entropy: { iters: 60, greed: 0.5 } } },
  Clink: { kind: 'folk', line: 'Bold, greedy.', styles: { supernova: { build: 0.4 }, charity: { lie: 0.5, nerve: 0.7, count: 0.2 }, entropy: { iters: 30, greed: 0.8 } } },
  Crock: { kind: 'folk', line: 'Rash.', styles: { supernova: { build: 0.7 }, charity: { lie: 0.3, nerve: 0.9, count: 0.1 }, entropy: { iters: 20, greed: 0.9 } } },
  Celadon: { kind: 'folk', line: 'Honest, and it shows.', styles: { nebula: { bluff: 0.15, read: 0.4, doubt: 0.35, leak: 0.7, noise: 0.05 }, charity: { lie: 0.05, nerve: 0.3, count: 0.3 }, entropy: { iters: 30, greed: 0.3 } } },
  Petra: { kind: 'sibling', line: 'Folds tight.', styles: { nebula: { bluff: 0.05, read: 0.6, doubt: 0.4, leak: 0.2, noise: 0.02 }, supernova: { build: 0.3 }, charity: { lie: 0.05, nerve: 0.2, count: 0.8 }, entropy: { iters: 80, greed: 0.3 } } },
  Calissa: { kind: 'sibling', line: 'Bluffs pretty.', styles: { nebula: { bluff: 0.5, read: 0.2, doubt: 0.2, leak: 0.35, noise: 0.2 }, supernova: { build: 0.8 }, charity: { lie: 0.7, nerve: 0.6, count: 0.1 }, entropy: { iters: 30, greed: 0.7 } } },
  Espada: { kind: 'sibling', line: 'Counts cards.', styles: { nebula: { bluff: 0.1, read: 0.95, doubt: 0.35, leak: 0.2, noise: 0.03 }, supernova: { build: 0.5 }, charity: { lie: 0.1, nerve: 0.4, count: 1 }, entropy: { iters: 90, greed: 0.5 } } },
  Dovina: { kind: 'sibling', line: 'Pushes every edge.', styles: { nebula: { bluff: 0.4, read: 0.8, doubt: 0.25, leak: 0.3, noise: 0.1 }, supernova: { build: 0.6 }, charity: { lie: 0.45, nerve: 0.8, count: 0.7 }, entropy: { iters: 80, greed: 0.8 } } },
  Wanda: { kind: 'sibling', line: 'Plays by feel.', styles: { nebula: { bluff: 0.15, read: 0.5, doubt: 0.3, leak: 0.5, noise: 0.1 }, supernova: { build: 0.5 }, charity: { lie: 0.15, nerve: 0.5, count: 0.4 }, entropy: { iters: 40, greed: 0.5 } } },
};
export const styleOf = (name, game) => FOLK[name]?.styles?.[game] || null;
/** The pair a table seats for a person: their game's bot with their style. */
export const seatOf = (name, game, bot) => [bot, styleOf(name, game) || {}];
