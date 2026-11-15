// ---------------------------------------------------------------------------------------
// THE WELL'S BOARD IN PLAY, A DRAFT (docs/plans/WELL-BOARD.md 7, 11, 12; ENDGAME.md 3.1): one run of the board's rules
// (progress/wellboard/rules.js) with you in the first seat and up to three of the siblings as rivals, each played by the board's bot
// in its own style (progress/wellboard/bot.js RIVAL_STYLES): the board drawn in 3D in place of the world
// (vfx/wellboard/boardview.js), its decisions on a page set aside at the right (boardpage.js). DEBUG only for now, opened by
// /board: the board is a draft South has not ruled on (GAPS G85, G93), so it counts nothing and pays nothing.
//
// What is a STAND-IN here, said plainly: a TRIAL (a floor of another kind of game) is not played. The page asks how it went and
// hands that to the rules, exactly where the runtime will hand back a played floor's outcome (`floor()` is that seam). A fight, a
// stray and the FOE are the board's own battles (progress/wellboard/battle.js), played on the page. Your cracks are the board's
// count, not the vessel's; the rivals are bots, not the party's siblings' minds.
// What is real: the layout from the game day's seed (wellSeed: everyone's board today is the same), the dice, Luck's re-rolls left
// (game.rerolls), the Wake Whistle if you carry one, every rule and every event.
//
// Events (each with `by`; yours unless said): board.open { seed, endless, rivals }, board.throw { sides, face, reroll },
// board.land { kind, depth }, board.haul { tier, why }, board.crack { cracks, why }, board.mend, board.warded { why },
// board.item { item, how: found | bought | used }, board.power { power, sides }, board.arcana { card },
// board.battle { foe, won, flawless, rounds }, board.duel { rival, won: true | false | null } (any duel you are in),
// board.door { depth } (a door opened to you), board.out { how, deepest, haul, floors, cubes, place, seats } (cubes: what it would
// pay, progress/wellboard/pay.js; nothing is paid).
//
// Prior art: the bazaar's seat (world/bazaar/session.js: a rules module played on a page, bots in the other seats, its moments
// told as events); Mario Party's computer players, each with a temperament.
//
//   new WellBoard(game) -> game.wellBoard   .open({ seed?, endless?, rivals? })   .take(move)   .floor('clear' | 'true' | 'fail')
//   .readout()   .pending()   .close()   .S (the run's state)   .cast [{ id, label, color, look, style }] a seat each   .done
//   .last (the run's end: your seat's result, cubes, place, standings)   .view (the 3D board; `.view.busy` while beats play)
// ---------------------------------------------------------------------------------------
import { rngOf } from '../../../progress/casino/table.js';
import { WELL_BOARD, readout, keysAt } from '../../../progress/wellboard/rules.js';
import { BOARD } from '../../../progress/wellboard/layout.js';
import { payOf } from '../../../progress/wellboard/pay.js';
import { boardBot, RIVAL_STYLES } from '../../../progress/wellboard/bot.js';
import { SIBLINGS, lookOf } from '../../../coop/party.js';
import { wellSeed } from '../../../progress/econ/islands.js';
import { today } from '../../../core/calendar.js';
import { renderBoard } from './boardpage.js';
import { WellBoardView } from '../../../vfx/wellboard/boardview.js';

const PAGE = 'well.board', YOU = { id: 'you', label: 'You', color: 0xffd36a, look: null, style: null };

export class WellBoard {
  constructor(game) {
    this.game = game; this.S = null; this.done = false; this.seen = 0; this.hover = null; this.die = null; this.cast = [YOU]; this.rivals = 3;
    this.view = new WellBoardView(game, this); // (the board in 3D, in place of the world while the page is open: vfx/wellboard/boardview.js; boot/frame.js draws it)
    game.chat?.add('board', { debug: true, help: "the Well's board, a draft (DEBUG): /board (the game day's, three rivals), /board <seed>, /board endless, /board solo, /board rivals <1-3>",
      run: (a) => { const n = a.indexOf('rivals'); this.open({ endless: a.includes('endless'), rivals: a.includes('solo') ? 0 : n >= 0 ? +a[n + 1] : undefined, seed: a.map(Number).find((x, i) => Number.isFinite(x) && a[i - 1] !== 'rivals') }); } });
  }
  get menu() { return this.game.indexMenu || this.game.course?.menu; }

  open({ seed, endless = false, rivals = this.rivals } = {}) {
    const g = this.game;
    this.seed = (Number.isFinite(seed) ? seed : wellSeed('dunemaw', today())) >>> 0; this.rivals = Math.max(0, Math.min(3, rivals | 0));
    this.r = rngOf(this.seed ^ 0x51ab); this.rb = rngOf(this.seed ^ 0xb075);
    const pool = SIBLINGS.slice(), pick = rngOf(this.seed ^ 0x51b1); this.cast = [YOU];
    while (this.cast.length <= this.rivals) { const sib = pool.splice(Math.floor(pick() * pool.length), 1)[0]; this.cast.push({ id: sib.id, label: sib.name, color: sib.color, look: lookOf(sib.id), style: RIVAL_STYLES[sib.id] || {} }); }
    this.S = WELL_BOARD.setup({ seats: this.cast.length, r: this.r, opts: { seed: this.seed, endless, names: this.cast.map((c) => c.label), rerolls: g.rerolls?.left?.() ?? BOARD.rerolls, whistle: g.box?.count?.('whistle.wake') ? 1 : 0 } });
    this.done = false; this.seen = 0; this.hover = null; this.die = null; this.opened = Object.create(null); this.fought = null;
    g.events?.emit('board.open', { seed: this.seed, endless, rivals: this.rivals, by: 'courier' });
    this.render(); // (the page first: the view frames itself beside it)
    try { this.view.open(); } catch (e) { console.warn('the board\'s view did not open; the page alone is played', e); this.view.active = false; }
    this.render();
  }
  readout() { return this.S ? readout(this.S, 0) : null; }
  pending() { return this.S ? WELL_BOARD.pending(this.S) : null; }

  /** One move of yours into the rules (a move of the pending decision, matched on every field given), then the rivals' turns
   *  until a decision is yours again, their moments and yours told and played as beats, and the page drawn again. */
  take(m) {
    const P = this.pending(); if (!P || this.done || P.seat !== 0) return { ok: false, why: 'nothing is waiting on you' };
    const move = P.moves.find((x) => Object.keys(m).every((k) => k === 'grade' || x[k] === m[k]));
    if (!move) return { ok: false, why: `not a move now: ${P.moves.map((x) => x.id + (x.sides ? ` d${x.sides}` : '')).join(', ')}` };
    const from = this.S.log.length;
    WELL_BOARD.apply(this.S, m.grade ? { ...move, grade: m.grade } : move, this.r);
    let shown = this.S.seats[0].out != null && !this.S.over ? this.S.log.length : null; // (you are out and the rivals play on: their turns are not watched)
    for (let n = 0, Q; n < 20000 && !WELL_BOARD.result(this.S) && (Q = this.pending()) && Q.seat !== 0; n++) WELL_BOARD.apply(this.S, boardBot(WELL_BOARD.view(this.S, Q.seat), Q, this.rb, this.cast[Q.seat].style), this.rb);
    this.tell(); this.view.play(this.S.log.slice(from, shown ?? undefined));
    if (WELL_BOARD.result(this.S) && !this.done) this.finish();
    this.hover = null; this.die = null; this.render();
    return { ok: true };
  }
  /** A played floor's outcome, handed back (the seam a floor module calls; the draft's page calls it from its stand-in buttons). */
  floor(how) { return this.pending()?.kind === 'floor' ? this.take(how === 'fail' ? { id: 'fail' } : { id: 'clear', grade: how === 'true' ? 'true' : undefined }) : { ok: false, why: 'no floor is waiting' }; }

  /** The run's moments since the last look, as events (the log's rules: feedback/tracking/wellboard.js): yours, and any duel you are in. */
  tell() {
    const g = this.game, L = this.S.log, e = (id, more, by = 'courier') => g.events?.emit(id, { ...more, by });
    for (; this.seen < L.length; this.seen++) {
      const x = L[this.seen], kind = Object.keys(x)[0];
      if (kind === 'duel' && (x.duel === 0 || x.vs === 0)) { const them = x.duel === 0 ? x.vs : x.duel; e('board.duel', { rival: this.cast[them].label, won: x.win == null ? null : x.win === 0 }, x.win === 0 || x.win == null ? 'courier' : 'creature'); continue; }
      if (x[kind] !== 0 || kind === 'stray' || kind === 'round') continue;
      if (kind === 'throw') e('board.throw', { sides: x.sides, face: x.face, reroll: x.reroll != null });
      else if (kind === 'land') e('board.land', { kind: x.kind, depth: +String(x.at).split('.')[0] + 1 || 0, set: x.set });
      else if (kind === 'haul' && x.tier != null) e('board.haul', { tier: x.tier, why: x.why });
      else if (kind === 'crack') e('board.crack', { cracks: x.cracks, why: x.why });
      else if (kind === 'mend') e('board.mend', { cracks: x.cracks });
      else if (kind === 'warded') e('board.warded', { why: x.why });
      else if (kind === 'item') e('board.item', { item: x.got, how: x.bought ? 'bought' : 'found' });
      else if (kind === 'use') e('board.item', { item: x.item, how: 'used' });
      else if (kind === 'power') e('board.power', { power: x.cast, sides: x.sides });
      else if (kind === 'arcana') e('board.arcana', { card: x.card });
      else if (kind === 'bout' && x.open) this.fought = x.open;
      else if (kind === 'bout' && x.end) e('board.battle', { foe: this.fought, won: x.end === 'won', flawless: !!x.flawless, rounds: x.rounds });
    }
    for (const F of this.S.floors) if (!this.opened[F.depth] && keysAt(this.S, F.depth, 0) >= BOARD.need) { this.opened[F.depth] = true; e('board.door', { depth: F.depth + 1 }); }
  }
  finish() {
    const res = WELL_BOARD.result(this.S), R = res.seats[0], place = res.standings.findIndex((x) => x.seat === 0) + 1; this.done = true;
    this.last = { ...R, cubes: payOf(R), place, standings: res.standings };
    this.game.events?.emit('board.out', { how: R.out, deepest: R.deepest, haul: R.haul.length, floors: R.floors, cubes: this.last.cubes, place, seats: res.seats.length, by: 'courier' });
  }
  close() { this.view.close(); if (this.menu?.page?.name === PAGE) this.menu.close(); }
  render() {
    const menu = this.menu; if (!menu?.showPage) return;
    menu.showPage(PAGE, (im, el) => renderBoard(this, { im, el }), { title: "THE WELL'S BOARD", sub: 'a draft · nothing is counted or paid', aside: 'right' });
  }
}
