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
//   TABLES [{ id, game, seats, bots, names, at, r, stake, label, line }]   new TableSession(game, table)   .start()   .play(practice?)   .showHowto()
//   .howtoStep(+1 | -1 | 'skip')   .setSpeed(id)   .coach()   .where ('lobby' | 'howto' | 'table')   .howto { step, steps }   .practice   .update(dt)   .close()
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
import { renderTable, renderLobby, renderHowto } from './views.js';
import { coach } from '../../progress/casino/coach/index.js';
import { HOWTO, howtoSeen } from '../../progress/casino/howto.js';

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
/** Real seconds between a bot's moves (so its turn can be followed), by the table speed you choose (the bazaar's `prefs.speed`). */
export const SPEEDS = [{ id: 'normal', label: 'Normal', beat: 0.6 }, { id: 'fast', label: 'Fast', beat: 0.25 }, { id: 'fastest', label: 'Fastest', beat: 0.08 }];
export const BEAT = SPEEDS[0].beat;
/** A seat's pages: the lobby (play for chips, practise free, how to play), the how-to, and the game. Only the game's is the table view's
 *  (vfx/bazaartable.js keys on it); the bots wait on the other two. */
export const PAGES = { table: 'bazaar.table', lobby: 'bazaar.lobby', howto: 'bazaar.howto' };
const OURS = new Set(Object.values(PAGES));

export class TableSession {
  constructor(game, T) { this.game = game; this.T = T; this.open = false; this.done = false; this.wait = 0; this.games = 0; this.first = 0; this.seen = 0; this.where = 'lobby'; this.howto = null; this.practice = false; this.paid = 0; }
  get menu() { return this.game.indexMenu || this.game.course?.menu; }
  get beat() { return (SPEEDS.find((x) => x.id === this.game.bazaar?.prefs?.speed) || SPEEDS[0]).beat; }
  /** Everything this moment means, for any view (progress/casino/coach/). */
  coach() { return this.S ? coach(this.T, this.S, 0, { suggest: this.practice || !!this.game.knacks?.on?.('houseWhisper') }) : null; } // (the house's suggestion: always while you practise; for chips, the knack)
  /** Sit down: a game dealt, and the stake taken from your chips unless it is practice (no chips in, none out, nothing counted). */
  sit(practice = false) {
    const g = this.game, T = this.T, C = g.chips;
    if (!practice && (!C || C.balance < T.stake)) { g.log?.say('warn', `You need ${T.stake} chips to sit at ${T.label}. Raku's cage sells them, or practise for free.`, { key: 'casino.stake', throttle: 2 }); return false; }
    this.practice = practice; this.paid = practice ? 0 : C.take(T.stake);
    const r = rngOf(Math.floor(seatRand() * 2 ** 31)), opts = T.opts ? T.opts(this.first, T) : {};
    this.S = T.game.setup({ seats: T.seats, r, opts }); this.r = r; this.seen = 0; this.done = false; this.games++; this.first = (this.first + 1) % T.seats;
    g.events?.emit('casino.sit', { game: T.id, stake: practice ? 0 : T.stake, practice, by: 'courier' });
    return true;
  }
  /** F at the table: the how-to the first time you sit at this game, else the lobby. */
  start() { this.open = true; if (!howtoSeen(this.game, this.T.id)) this.showHowto(true); else { this.where = 'lobby'; this.render(); } }
  /** From the lobby or a game's end: deal a game, for chips or for practice. */
  play(practice = false) { if (!this.sit(practice)) { this.where = 'lobby'; this.render(); return; } this.where = 'table'; this.render(); }
  /** The how-to, from its first step (the bots wait while it is up). */
  showHowto(first = false) { this.howto = { step: 0, first, steps: (HOWTO[this.T.id]?.steps || []).map((x) => ({ ...x, line: x.say, target: x.show, wait: 'next', demo: null })) }; this.where = 'howto'; this.render(); } // (each step also as { line, target (a role the table view resolves to its pieces), wait, demo }: Calissa's shape)
  /** Step through it; past the last step, or skipped, it is done (counted once a showing: the ledger says it has been seen). */
  howtoStep(by) {
    const H = this.howto; if (!H) return;
    if (by === 'skip' || H.step + by >= H.steps.length) {
      this.game.events?.emit('casino.howto', { game: this.T.id, skipped: by === 'skip', by: 'courier' });
      this.howto = null; this.where = this.S && !this.done ? 'table' : 'lobby'; this.render(); return;
    }
    H.step = Math.max(0, H.step + by); this.render();
  }
  setSpeed(id) { const B = this.game.bazaar; if (B?.prefs) { B.prefs.speed = id; this.game.save?.dirty('casinoPrefs'); } this.render(); }
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
      else if (x.win != null && T.id === 'querent') e('hand', { who: who(x.win), value: x.value, notes: x.notes, steps: x.steps, tier: x.tier });
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
    const won = R.winner === 0; let back = 0;
    if (!this.practice) {
      if (T.settle === 'pot') back = won ? Math.floor(T.stake * T.seats * (1 - T.rake)) : 0;
      else if (T.settle === 'purse') back = R.chips[0];
      else back = Math.max(0, T.stake + R.net[0]);
      C?.give(back);
    }
    g.events?.emit('casino.result', { game: T.id, won, net: back - this.paid, practice: this.practice, scores: R.scores, read: R.read, by: 'courier' });
    this.render();
  }
  /** Again at the same table, as the last game was (for chips, or practice). */
  again(practice = this.practice) { this.play(practice); }
  close() {
    if (this.open && this.S && !this.done && !this.practice) this.game.events?.emit('casino.result', { game: this.T.id, won: false, net: -this.paid, forfeit: true, by: 'courier' }); // (risen mid-game: the stake stays on the table)
    this.done = true; this.open = false;
    if (OURS.has(this.menu?.page?.name)) this.menu.close();
  }
  render() {
    const menu = this.menu, T = this.T; if (!menu?.showPage) return;
    const sub = `${this.practice && this.where === 'table' ? 'PRACTICE: no chips at stake · ' : ''}${this.game.chips?.balance ?? 0} chips · F rises${this.S && !this.done && !this.practice && this.where === 'table' ? ' (a game in play is forfeit)' : ''}`;
    const draw = this.where === 'howto' ? renderHowto : this.where === 'lobby' || !this.S ? renderLobby : renderTable;
    menu.showPage(PAGES[this.where === 'table' && this.S ? 'table' : this.where === 'howto' ? 'howto' : 'lobby'], (im, el) => draw(this, { im, el }), { title: T.label.toUpperCase(), sub, aside: 'left' });
  }
  update(dt) {
    if (!this.open) return;
    const f = this.game.clock?.frame; if (f != null && f === this.frame) return; this.frame = f; // (one step a frame, however many call it: the bazaar's modal tick and the table view's both do)
    const menu = this.menu; if (!menu?.open || !OURS.has(menu.page?.name)) { this.close(); return; } // (the page closed: risen from the table)
    if (this.done || this.where !== 'table' || !this.S) return; // (the bots wait on the lobby and the how-to)
    const T = this.T, P = T.game.pending(this.S); if (!P) return;
    if (P.seat === 0) { if (P.moves.length === 1 && P.kind === 'end') this.move(P.moves[0]); return; }
    if ((this.wait += dt) < this.beat) return; this.wait = 0;
    const [bot, style] = T.bots[P.seat] || T.bots[1];
    this.move(P.moves.length === 1 ? P.moves[0] : bot(T.game.view(this.S, P.seat), P, this.r, style));
  }
}
