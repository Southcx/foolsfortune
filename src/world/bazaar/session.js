// ---------------------------------------------------------------------------------------
// A SEAT AT RAKU'S TABLES (docs/plans/CASINO.md sections 7 and 9): F at a table sits you down at it. A session plays one game of its
// rules module (progress/casino/) with you in the first seat and the folk in the others, each a bot with a style; the bots take their
// turns a beat apart so you can follow them, and your choices are clicked on the table's page (a page set aside: the world stays in view;
// its look is a placeholder, world/bazaar/views.js, until Calissa's cloth, cards and dice). The stake comes out of your chips as you sit
// and what you won goes back as you rise; walking away from a game in play forfeits its stake. What happens at a table goes to the log
// through events (feedback/tracking/casino.js).
// Events (with `by`): casino.sit { game }, casino.play { game, what, who, ... } (the table's moments), casino.result { game, net, won }.
//
// Prior art: Like a Dragon's casino tables (walk up, sit, the folk at the table), Red Dead's poker (opponents with tells and styles), the
// house's own race board (world/raceway/raceboard.js: a page beside the world).
//
//   TABLES [{ id, game, seats, bots, names, at, r, stake, label, line }]   new TableSession(game, table)   .start()   .update(dt)   .close()
// ---------------------------------------------------------------------------------------
import { rngOf } from '../../progress/casino/table.js';
import { stream } from '../../core/rng.js';
import { ZODIAC, zodiacBot } from '../../progress/casino/zodiac.js';
import { EVENT_HORIZON, horizonBot } from '../../progress/casino/eventhorizon.js';
import { QUERENT } from '../../progress/casino/querent/rules.js';
import { querentBot } from '../../progress/casino/querent/bots.js';
import { ARCANA } from '../../progress/casino/querent/arcana.js';
import { SUPERNOVA, supernovaBot } from '../../progress/casino/supernova.js';
import { NEBULA, nebulaBot } from '../../progress/casino/nebula.js';
import { renderTable } from './views.js';

const seatRand = stream('casino'); // (a session's seed: the game's own stream is seeded from it, so a table is the session's seed's)

/** The tables: their game, who sits at them (you first), each seat's bot and style, where they stand (the hall's local metres), the stake
 *  and how it settles (`settle`): `pot` a buy-in, the winner takes the table's less Raku's tenth (Querent, Supernova Run); `purse` chips
 *  played out of, what is left comes back (Zodiac, Nebula Bluff); `ante` Event Horizon's ante a round, its net back. */
const NEBULA_STYLES = [null, { bluff: 0.3, read: 0.6, doubt: 0.3, leak: 0.6, noise: 0.1 }, { bluff: 0.15, read: 0.4, doubt: 0.35, leak: 0.7, noise: 0.05 }]; // (Raku bluffs and reads; Celadon is honest and shows it)
export const TABLES = [
  { id: 'querent', game: QUERENT, seats: 4, names: ['you', 'Raku', 'Clink', 'Celadon'], bots: [null, [querentBot, { thief: 0.3 }], [querentBot, { thief: 0.6 }], [querentBot, { thief: 0.1 }]],
    at: { x: -24, z: 4 }, r: 2.6, stake: 25, rake: 0.1, settle: 'pot', label: 'Querent', line: 'The tarot game: three melds of three; steal, declare your Fate Clause, flip the Major Arcana.' },
  { id: 'zodiac', game: ZODIAC, seats: 2, names: ['you', 'Raku'], bots: [null, [zodiacBot, { greed: 0.4 }]],
    at: { x: 24, z: 4 }, r: 2.2, stake: 40, settle: 'purse', opts: (first, T) => ({ chips: T.stake, first }), label: 'Zodiac', line: 'Shut the Box as a duel: shut your twelve tiles first; your attack die reopens Raku\'s.' },
  { id: 'eventhorizon', game: EVENT_HORIZON, seats: 3, names: ['you', 'Crock', 'Celadon'], bots: [null, [horizonBot, { bold: 0.2 }], [horizonBot, { bold: 0.7 }]],
    at: { x: 0, z: 22 }, r: 2.4, stake: 10, settle: 'ante', opts: (first, T) => ({ ante: T.stake, first }), label: 'Event Horizon', line: 'Hit the dealer\'s total exactly with your dice; read the dealer\'s handful for 3x or 5x.' },
  { id: 'supernova', game: SUPERNOVA, seats: 3, names: ['you', 'Clink', 'Crock'], bots: [null, [supernovaBot, { build: 0.4 }], [supernovaBot, { build: 0.7 }]],
    at: { x: -26, z: 28 }, r: 2.4, stake: 20, rake: 0.1, settle: 'pot', opts: (first) => ({ first }), label: 'Supernova Run', line: 'Roll your dice for points; a maximum makes another die. Fuse a d20: a natural 20 doubles your points and resets every hand. 500 wins.' },
  { id: 'nebula', game: NEBULA, seats: 3, names: ['you', 'Raku', 'Celadon'], bots: [null, [nebulaBot, NEBULA_STYLES[1]], [nebulaBot, NEBULA_STYLES[2]]],
    at: { x: 26, z: 28 }, r: 2.4, stake: 60, settle: 'purse', opts: (first, T) => ({ chips: T.stake, first, styles: NEBULA_STYLES }), label: 'Nebula Bluff', line: 'Claim what your hidden dice are worth; raise, call a bluff, or fold. Watch the folk for tells. The last with dice wins.' },
];
/** Real seconds between a bot's moves (so its turn can be followed). */
export const BEAT = 0.6;

export class TableSession {
  constructor(game, T) { this.game = game; this.T = T; this.open = false; this.done = false; this.wait = 0; this.games = 0; this.first = 0; this.seen = 0; }
  get menu() { return this.game.indexMenu || this.game.course?.menu; }
  /** Sit down: the stake taken from your chips, and a game dealt. */
  sit() {
    const g = this.game, T = this.T, C = g.chips;
    if (!C || C.balance < T.stake) { g.log?.say('warn', `You need ${T.stake} chips to sit at ${T.label}. Raku's cage sells them.`, { key: 'casino.stake', throttle: 2 }); return false; }
    this.paid = C.take(T.stake);
    const r = rngOf(Math.floor(seatRand() * 2 ** 31)), opts = T.opts ? T.opts(this.first, T) : {};
    this.S = T.game.setup({ seats: T.seats, r, opts }); this.r = r; this.seen = 0; this.done = false; this.games++; this.first = (this.first + 1) % T.seats;
    g.events?.emit('casino.sit', { game: T.id, stake: T.stake, by: 'courier' });
    return true;
  }
  start() { if (!this.sit()) return; this.open = true; this.render(); }
  /** One move into the game, then what it said into the log, and the page drawn again. */
  move(m) {
    const T = this.T; T.game.apply(this.S, m, this.r); this.tell(); this.render();
    if (T.game.result(this.S) && !this.done) this.finish();
  }
  /** The table's moments since the last look, as events for the log (feedback/tracking/casino.js). */
  tell() {
    const g = this.game, T = this.T, L = this.S.log, who = (p) => T.names[p] ?? '?';
    for (; this.seen < L.length; this.seen++) {
      const x = L[this.seen], e = (what, more) => g.events?.emit('casino.play', { game: T.id, what, ...more, by: 'courier' });
      if (x.flip != null) e('flip', { who: who(x.seat), arcana: ARCANA[x.flip]?.name, why: x.why });
      else if (x.steal) e('steal', { who: who(x.seat), from: who(x.from) });
      else if (x.fate) e('fate', { who: who(x.seat), how: x.fate });
      else if (x.quad != null) e('four', { who: who(x.seat), blessing: x.blessing });
      else if (x.win != null && T.id === 'querent') e('hand', { who: who(x.win), value: x.value, notes: x.notes });
      else if (x.death != null && x.death !== 'spent') e('death', {});
      else if (x.lock) e('lock', { who: who(this.S.turn), tile: x.lock, ability: x.ability });
      else if (x.upgrade) e('upgrade', { who: who(this.S.turn), sides: x.upgrade });
      else if (x.nova != null) e('nova', { who: who(x.nova), points: x.points });
      else if (x.fuse && x.into === 20) e('fuse20', { who: who(x.seat) });
      else if (x.callout != null) e('callout', { who: who(x.seat), on: who(x.callout), bluff: x.bluff, worth: x.worth, claim: x.claim });
      else if (x.reveal) e('reveal', { shown: x.reveal.map((y) => `${who(y.seat)} ${y.worth}`) });
    }
  }
  finish() {
    const g = this.game, T = this.T, R = T.game.result(this.S), C = g.chips; this.done = true;
    let back = 0, won = false;
    won = R.winner === 0;
    if (T.settle === 'pot') back = won ? Math.floor(T.stake * T.seats * (1 - T.rake)) : 0;
    else if (T.settle === 'purse') back = R.chips[0];
    else back = Math.max(0, T.stake + R.net[0]);
    C?.give(back);
    g.events?.emit('casino.result', { game: T.id, won, net: back - this.paid, scores: R.scores, read: R.read, by: 'courier' });
    this.render();
  }
  /** Again at the same table (the stake taken again). */
  again() { if (this.sit()) this.render(); }
  close() {
    if (this.open && !this.done) this.game.events?.emit('casino.result', { game: this.T.id, won: false, net: -this.paid, forfeit: true, by: 'courier' }); // (risen mid-game: the stake stays on the table)
    this.done = true; this.open = false;
    if (this.menu?.page?.name === 'bazaar.table') this.menu.close();
  }
  render() {
    const menu = this.menu, T = this.T; if (!menu?.showPage) return;
    const R = T.game.result(this.S), P = R ? null : T.game.pending(this.S), mine = P && P.seat === 0;
    menu.showPage('bazaar.table', (im, el) => renderTable(this, { im, el, P: mine ? P : null, R, V: T.game.view(this.S, 0), waiting: P && !mine ? T.names[P.seat] : null }),
      { title: T.label.toUpperCase(), sub: `${this.game.chips?.balance ?? 0} chips · F closes (a game in play is forfeit)`, aside: 'left' });
  }
  update(dt) {
    if (!this.open) return;
    const menu = this.menu; if (!menu?.open || menu.page?.name !== 'bazaar.table') { this.close(); return; } // (the page closed: risen from the table)
    if (this.done) return;
    const T = this.T, P = T.game.pending(this.S); if (!P) return;
    if (P.seat === 0) { if (P.moves.length === 1 && P.kind === 'end') this.move(P.moves[0]); return; }
    if ((this.wait += dt) < BEAT) return; this.wait = 0;
    const [bot, style] = T.bots[P.seat] || T.bots[1];
    this.move(P.moves.length === 1 ? P.moves[0] : bot(T.game.view(this.S, P.seat), P, this.r, style));
  }
}
