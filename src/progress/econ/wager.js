// ---------------------------------------------------------------------------------------
// THE WAGER (docs/plans/SKIFF-RACING.md section 12; docs/ECONOMY.md "The wager"): a stake of cubes on your own race against the rivals,
// placed at the race board as the race begins: to WIN, or to make the PODIUM (the first three of four). The odds are the house's read of
// you on that track from the ledger (your wins and podiums over your finishes there, with a prior of an even field), less the house's
// edge: a racer the house has not seen improve is a racer it underprices, so getting better pays (the house law: skill skips grind) and
// a racer it knows well gets fair odds less the edge (a drain, slow). Retiring, restarting or leaving loses the stake. The stake is
// capped at a few minutes of play, so the wager is a spice on a race, not a living.
// Events (with `by`): wager.place { track, stake, on, odds }, wager.settle { track, won, paid, why }.
//
// Prior art: Gran Turismo 2's and Need for Speed Underground's pink-slip and cash bets on a race, the sports book's odds from a record
// with a vig (the house's edge), Bayesian odds with a prior (Laplace's rule of succession: (wins + 1) / (races + 2), here weighted to
// a field of four).
//
//   game.wager = new Wager(game)   .odds(track, on) -> multiple   .place(track, stake, on) -> bool   .open   WAGER (the numbers)
// ---------------------------------------------------------------------------------------
import { ECON } from './table.js';

/** The stakes on offer (minutes of play), the house's edge (a share of the fair payout kept), the prior (races of an even field of
 *  four assumed before your own), the most a payout multiplies, the least. */
export const WAGER = { stakes: [1, 3, 5], edge: 0.12, prior: 4, max: 6, min: 1.1 };
/** What a stake is on: the share of an even field of four that makes it. */
const SHARE = { win: 0.25, podium: 0.75 };

export class Wager {
  constructor(game) {
    this.game = game; this.open = null; // ({ track, stake, on, odds })
    const ev = game.events;
    ev?.on('race.finish', (e) => { if (this.open && e.mode === 'race' && e.of > 1) this.settle(e.place <= (this.open.on === 'win' ? 1 : 3), 'finish'); });
    for (const k of ['race.end', 'race.restart']) ev?.on(k, () => { if (this.open) this.settle(false, k === 'race.end' ? 'retired' : 'restart'); });
  }
  /** The payout's multiple for a stake on a track: the house's read of your chance there, less its edge; in the OPEN class shortened by
 *  half your build's edge (the rivals answer the other half: race.js). */
  odds(track, on = 'win') {
    const L = this.game.ledger, races = L?.get?.(`race.track.${track}.finish.rivals`) || 0, made = L?.get?.(`race.track.${track}.${on}`) || 0;
    const p = (made + SHARE[on] * WAGER.prior) / (races + WAGER.prior);
    const P = this.game.skiffParts, T = this.game.raceway?.trackOf?.(track), pi = P?.recordClass?.() === 'open' && T ? P.pi(T) : 100; // (the build's other half of its edge: SKIFF-TUNING.md 2.4)
    return +Math.max(WAGER.min, Math.min(WAGER.max, (1 - WAGER.edge) / p * Math.sqrt(100 / pi))).toFixed(2);
  }
  /** A stake placed (cubes taken now). False if one is open already, or the cubes are short. */
  place(track, stake, on = 'win') {
    const g = this.game, cubes = Math.round(stake * ECON.perMinute); if (this.open || !SHARE[on]) return false;
    if ((g.cubes?.balance ?? 0) < cubes || !g.cubes?.spend(cubes, 'wager')) { g.log?.say('warn', 'You have not the cubes for that stake.', { key: 'wager', throttle: 1 }); return false; }
    this.open = { track, stake: cubes, on, odds: this.odds(track, on) };
    g.events?.emit('wager.place', { track, stake: cubes, on, odds: this.open.odds, by: 'courier' });
    return true;
  }
  settle(won, why) {
    const g = this.game, W = this.open; this.open = null; if (!W) return;
    const paid = won ? Math.round(W.stake * W.odds) : 0;
    if (paid) g.cubes?.earn(paid, 'wager');
    g.events?.emit('wager.settle', { track: W.track, on: W.on, won, paid, stake: W.stake, why, by: 'courier' });
  }
}
