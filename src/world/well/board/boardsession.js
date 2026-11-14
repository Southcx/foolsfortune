// ---------------------------------------------------------------------------------------
// THE WELL'S BOARD IN PLAY, A DRAFT (docs/plans/WELL-BOARD.md 7; ENDGAME.md 3.1): one run of the board's rules
// (progress/wellboard/rules.js) with you in the first seat: the board drawn in 3D in place of the world (vfx/wellboard/boardview.js),
// its decisions on a page set aside at the right (boardpage.js). DEBUG
// only for now, opened by /board: the board is a draft South has not ruled on (GAPS G85, G93), so it counts nothing and pays nothing.
//
// What is a STAND-IN here, said plainly: a floor (a fight, a trial, the FOE) is not played. The page asks how it went (CLEARED,
// CLEARED WELL, FAILED) and hands that to the rules, exactly where the runtime will hand back a played floor's outcome (`floor()`
// is that seam: a floor module calls `board.floor('clear')`). Your cracks are the board's count, not the vessel's.
// What is real: the layout from the game day's seed (wellSeed: everyone's board today is the same), the dice, Luck's re-rolls left
// (game.rerolls), the Wake Whistle if you carry one, every rule and every event.
//
// Events (each with `by`): board.open { seed, endless }, board.throw { sides, face, reroll }, board.land { kind, depth },
// board.haul { tier, why }, board.crack { cracks, why }, board.mend, board.door { depth } (a door opened), board.out { how, deepest,
// haul, floors, cubes } (cubes: what it would pay, progress/wellboard/pay.js; nothing is paid).
//
// Prior art: the bazaar's seat (world/bazaar/session.js: a rules module played on a page, its moments told as events).
//
//   new WellBoard(game) -> game.wellBoard   .open({ seed?, endless? })   .take(move)   .floor('clear' | 'true' | 'fail')   .readout()
//   .close()   .S (the run's state)   .done   .view (the 3D board; `.view.busy` while a turn's beats play)
// ---------------------------------------------------------------------------------------
import { rngOf } from '../../../progress/casino/table.js';
import { WELL_BOARD, readout, keysAt } from '../../../progress/wellboard/rules.js';
import { BOARD } from '../../../progress/wellboard/layout.js';
import { payOf } from '../../../progress/wellboard/pay.js';
import { wellSeed } from '../../../progress/econ/islands.js';
import { today } from '../../../core/calendar.js';
import { renderBoard } from './boardpage.js';
import { WellBoardView } from '../../../vfx/wellboard/boardview.js';

const PAGE = 'well.board';

export class WellBoard {
  constructor(game) {
    this.game = game; this.S = null; this.done = false; this.seen = 0; this.hover = null;
    this.view = new WellBoardView(game, this); // (the board in 3D, in place of the world while the page is open: vfx/wellboard/boardview.js; boot/frame.js draws it)
    game.chat?.add('board', { debug: true, help: "the Well's board, a draft (DEBUG): /board (the game day's), /board <seed>, /board endless", run: ([a]) => this.open({ endless: a === 'endless', seed: a && a !== 'endless' ? +a : undefined }) });
  }
  get menu() { return this.game.indexMenu || this.game.course?.menu; }

  open({ seed, endless = false } = {}) {
    const g = this.game;
    this.seed = (Number.isFinite(seed) ? seed : wellSeed('dunemaw', today())) >>> 0;
    this.r = rngOf(this.seed ^ 0x51ab);
    this.S = WELL_BOARD.setup({ seats: 1, r: this.r, opts: { seed: this.seed, endless, rerolls: g.rerolls?.left?.() ?? BOARD.rerolls, whistle: g.box?.count?.('whistle.wake') ? 1 : 0 } });
    this.done = false; this.seen = 0; this.hover = null; this.opened = Object.create(null);
    g.events?.emit('board.open', { seed: this.seed, endless, by: 'courier' });
    this.render(); // (the page first: the view frames itself beside it)
    try { this.view.open(); } catch (e) { console.warn('the board\'s view did not open; the page alone is played', e); this.view.active = false; }
    this.render();
  }
  readout() { return this.S ? readout(this.S, 0) : null; }
  pending() { return this.S ? WELL_BOARD.pending(this.S) : null; }

  /** One move of yours into the rules (a move of the pending decision, by its id), then its moments told and the page drawn again. */
  take(m) {
    const P = this.pending(); if (!P || this.done) return { ok: false, why: 'nothing is waiting' };
    const move = P.moves.find((x) => x.id === m.id && (m.sides == null || x.sides === m.sides) && (m.to == null || x.to === m.to));
    if (!move) return { ok: false, why: `not a move now: ${P.moves.map((x) => x.id + (x.sides ? ` d${x.sides}` : '')).join(', ')}` };
    const from = this.S.log.length;
    WELL_BOARD.apply(this.S, m.grade ? { ...move, grade: m.grade } : move, this.r);
    this.tell(); this.view.play(this.S.log.slice(from)); // (the same moments as beats: the die, each step, the landing)
    if (WELL_BOARD.result(this.S) && !this.done) this.finish();
    this.hover = null; this.render();
    return { ok: true };
  }
  /** A played floor's outcome, handed back (the seam a floor module calls; the draft's page calls it from its stand-in buttons). */
  floor(how) { return this.pending()?.kind === 'floor' ? this.take(how === 'fail' ? { id: 'fail' } : { id: 'clear', grade: how === 'true' ? 'true' : undefined }) : { ok: false, why: 'no floor is waiting' }; }

  /** The run's moments since the last look, as events (the log's rules: feedback/tracking/wellboard.js). */
  tell() {
    const g = this.game, L = this.S.log, e = (id, more) => g.events?.emit(id, { ...more, by: 'courier' });
    for (; this.seen < L.length; this.seen++) {
      const x = L[this.seen];
      if (x.throw != null) e('board.throw', { sides: x.sides, face: x.face, reroll: x.reroll != null });
      else if (x.land != null) e('board.land', { kind: x.kind, depth: +String(x.at).split('.')[0] + 1 || 0, set: x.set });
      else if (x.haul != null && x.tier != null) e('board.haul', { tier: x.tier, why: x.why });
      else if (x.crack != null) e('board.crack', { cracks: x.cracks, why: x.why });
      else if (x.mend != null) e('board.mend', { cracks: x.cracks });
    }
    for (const F of this.S.floors) if (!this.opened[F.depth] && keysAt(this.S, F.depth) >= BOARD.need) { this.opened[F.depth] = true; e('board.door', { depth: F.depth + 1 }); }
  }
  finish() {
    const R = WELL_BOARD.result(this.S).seats[0]; this.done = true; this.last = { ...R, cubes: payOf(R) };
    this.game.events?.emit('board.out', { how: R.out, deepest: R.deepest, haul: R.haul.length, floors: R.floors, cubes: this.last.cubes, by: 'courier' });
  }
  close() { this.view.close(); if (this.menu?.page?.name === PAGE) this.menu.close(); }
  render() {
    const menu = this.menu; if (!menu?.showPage) return;
    menu.showPage(PAGE, (im, el) => renderBoard(this, { im, el }), { title: "THE WELL'S BOARD", sub: 'a draft · nothing is counted or paid', aside: 'right' });
  }
}
