// ---------------------------------------------------------------------------------------
// RAKU'S CHIPS (working name, Espada's to rule; docs/plans/CASINO.md section 10): what the tables are played for. Bought from Raku with
// cubes, one cube a chip, and cashed back the same; what you cash out beyond what you bought is your winnings, and those are capped a game
// day (the cap's chips stay chips, for tomorrow). So a game you have learned to beat is a good evening, never a living: the economy's aim
// (docs/ECONOMY.md) is held by the cap, the house games' edge is a slow drain, and a first win at each game pays once, ever.
// Kept in the save (`casinoChips`, player scope: progress resets with a build). Events (with `by`): casino.chips { buy | cash, n, balance }.
//
// Prior art: every casino's cage (chips for cash, a cashier's limits), Like a Dragon's casino chips that cannot leave the casino, the
// house's own wager cap (progress/econ/wager.js).
//
//   game.chips = new Chips(game)   .balance   .buy(n) -> bool   .cash(n?) -> cashed   .win(n) / .lose(n) (a table's stake)   .room
//   CHIPS (the numbers)
// ---------------------------------------------------------------------------------------
import { ECON } from '../econ/table.js';
import { today } from '../../core/calendar.js';

/** The numbers: cubes a chip, the stacks Raku sells, the winnings that may be cashed a game day (minutes of play). */
export const CHIPS = { rate: 1, stacks: [50, 100, 250], cap: 10 };

export class Chips {
  constructor(game) {
    this.game = game; this.balance = 0; this.bought = 0; this.day = -1; this.cashedWin = 0;
    game.save?.section('casinoChips', { scope: 'player', version: 1, dump: () => ({ balance: this.balance, bought: this.bought, day: this.day, cashedWin: this.cashedWin }),
      load: (d) => Object.assign(this, { balance: d?.balance || 0, bought: d?.bought || 0, day: d?.day ?? -1, cashedWin: d?.cashedWin || 0 }), reset: () => Object.assign(this, { balance: 0, bought: 0, day: -1, cashedWin: 0 }) });
  }
  get capCubes() { return Math.round(CHIPS.cap * ECON.perMinute); }
  /** What may be cashed now: all you bought back, and winnings up to the day's cap. */
  get room() { if (this.day !== today()) { this.day = today(); this.cashedWin = 0; } return Math.max(0, this.bought) + Math.max(0, this.capCubes - this.cashedWin); }
  buy(n) {
    const g = this.game, cost = Math.round(n * CHIPS.rate);
    if (!g.cubes?.spend(cost, 'chips')) { g.log?.say('warn', 'You have not the cubes for those chips.', { key: 'chips', throttle: 1 }); return false; }
    this.balance += n; this.bought += n; g.save?.dirty('casinoChips');
    g.events?.emit('casino.chips', { buy: true, n, balance: this.balance, by: 'courier' });
    return true;
  }
  /** Chips back to cubes, as many as may be cashed (all, by default); the rest stay chips. */
  cash(n = this.balance) {
    const g = this.game, k = Math.min(n, this.balance, this.room); if (k <= 0) return 0;
    const fromBought = Math.min(k, Math.max(0, this.bought)), win = k - fromBought;
    this.balance -= k; this.bought -= fromBought; this.cashedWin += win; g.save?.dirty('casinoChips');
    g.cubes?.earn(Math.round(k * CHIPS.rate), 'chips');
    g.events?.emit('casino.chips', { cash: true, n: k, win, held: this.balance, by: 'courier' });
    return k;
  }
  /** A table's stake: taken as you sit (lose) and paid back with what you won. */
  take(n) { const k = Math.min(n, this.balance); this.balance -= k; this.game.save?.dirty('casinoChips'); return k; }
  give(n) { if (n > 0) { this.balance += n; this.game.save?.dirty('casinoChips'); } }
}
