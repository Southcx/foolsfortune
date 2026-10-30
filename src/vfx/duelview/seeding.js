// ---------------------------------------------------------------------------------------
// THE BOARD'S SEEDING (plain name; South, 2026-10-29: "make it such that the initial seeding of the gems on the tsuitate is an animation"):
// a puzzle duel's first board not stood at once but dealt in: every piece held out of sight while the tsuitate builds itself in front of
// you (assembly.js, under the VS open in a PvE duel), then, once it is built, dropped into its cell from above in a wave running out from the Line to
// both ends of the board, the bottom rows first so each column fills as if it were poured, spinning a turn on the way down, landing with
// a squash, a white flash and a little bounce. The bodies stand from the start; the pieces are the deal.
// Programs: none of its own (it moves the pieces' own drawn state: pieces.js `dy`, `s`, `sx`, `sy`, `flip`, `flash`, `hidden`).
// Prior art: Puzzle & Dragons' orbs raining in at a floor's start, Bejeweled's opening cascade, Tetris Attack's stack rising in, a
// croupier's deal (the cards out from the dealer's hand, the nearest first).
//
//   const S = new DuelSeeding(view)   S.hold()   S.go(delay) (the assembly's, when it is done)   S.update(dt) (before the pieces')   S.busy   S.clear()   SEEDING (the knobs)
// ---------------------------------------------------------------------------------------
import { clamp01, sm } from './layout.js';

/** wave: real s from the Line to the board's ends; rows: real s from the bottom row to the top; jitter: a piece's own scatter; fall: one
 *  piece's drop (real s); drop: how far above its cell it starts (cells, plus its row's height); turns: its spin on the way down; bounce:
 *  its last hop (cells); flash: its landing's white; wait: the longest it is held for once the frame is built (real s). */
export const SEEDING = { wave: 0.55, rows: 0.3, jitter: 0.06, fall: 0.42, drop: 3, turns: 1, bounce: 0.18, flash: 0.7, wait: 5 };
const easeOutBack = (x) => 1 + 2.4 * (x - 1) ** 3 + 1.4 * (x - 1) ** 2;

export class DuelSeeding {
  constructor(view) { this.view = view; this.list = null; this.t = 0; this.start = Infinity; }
  get busy() { return !!this.list; }

  /** At the open: every piece held out of sight, each given its place in the deal. */
  hold() {
    const P = this.view.pieces, B = P.board, line = this.view.lineCol ?? B.w / 2, S = SEEDING; this.list = []; this.t = 0; this.start = Infinity;
    for (const v of P.list) { if (v.kind === 'body') continue;
      const far = Math.abs(v.cx + 0.5 - line) / Math.max(1, B.w / 2), low = (B.h - 1 - v.cy) / Math.max(1, B.h - 1);
      this.list.push({ v, at: S.wave * far + S.rows * low + S.jitter * v.seed }); v.hidden = true; }
    if (!this.list.length) this.list = null;
  }

  /** The deal begins `delay` real s from now. */
  go(delay = 0) { if (this.list && this.start === Infinity) this.start = this.t + delay; }

  /** Each frame, before the pieces draw: each piece's fall, spin, squash and flash. */
  update(dt) {
    if (!this.list) return;
    if (this.view.assembly?.busy) { for (const q of this.list) q.v.hidden = true; return; } // (the frame still building: assembly.js deals it in when done)
    this.t += dt; const S = SEEDING, P = this.view.pieces;
    if (this.start === Infinity && this.t > S.wait) this.start = this.t; // (never held past this, whatever kept the deal waiting)
    if (this.t < this.start) { for (const q of this.list) q.v.hidden = true; return; }
    let left = 0; const age0 = this.t - this.start;
    for (const q of this.list) { const v = q.v; if (!P.list.includes(v)) continue; // (taken off the board meanwhile: an undo, a skip)
      const u = (age0 - q.at) / S.fall;
      if (u < 0) { v.hidden = true; left++; continue; }
      v.hidden = false;
      if (u >= 1.45) { if (!q.done) { q.done = true; v.dy = 0; v.flip = 0; v.s = 1; v.sx = v.sy = 1; v.flash = 0; } continue; }
      left++;
      const f = clamp01(u), fallK = 1 - sm(f), up = S.drop + (v.cy + 1) * 0.15; // (from above its cell, higher up the board the further)
      if (u < 1) { v.dy = -up * fallK * fallK; v.flip = (1 - f) * Math.PI * 2 * S.turns; v.s = 0.35 + 0.65 * sm(Math.min(1, f * 1.6)); v.sx = 1 - 0.1 * f; v.sy = 1 + 0.15 * f; } // (stretched as it falls)
      else { const b = (u - 1) / 0.45; v.flip = 0; v.dy = -S.bounce * Math.sin(Math.PI * Math.min(1, b)) * (1 - b); const sq = Math.exp(-b * 6) * Math.cos(b * 14); v.s = easeOutBack(Math.min(1, 0.6 + b)); v.sx = 1 + 0.22 * sq; v.sy = 1 - 0.22 * sq;
        v.flash = S.flash * Math.max(0, 1 - b * 4); } // (landed: squashed flat, a white flash fading, a hop)
    }
    if (!left) { for (const q of this.list) { const v = q.v; v.hidden = false; v.dy = 0; v.flip = 0; v.s = 1; v.sx = v.sy = 1; } this.list = null; }
  }

  /** Done at once (a resync, a skipped turn, the close), the frame's assembly with it. */
  clear() { this.view.assembly?.clear?.(); if (this.list) for (const q of this.list) { const v = q.v; v.hidden = false; v.dy = 0; v.flip = 0; v.s = 1; v.sx = v.sy = 1; } this.list = null; }
}
