// ---------------------------------------------------------------------------------------
// CLEARING RULES FOR A PUZZLE DUEL'S BOARD (docs/plans/PUZZLE-DUELS.md section 5, "to come: clearing"; GAPS G184): ways to clear besides a
// run or a cluster, each off unless a ruleset asks for it:
//   LINES    `rs.lines`   a row filled right across a side's half (a column, where gravity runs along the rows) clears whole, junk and
//                         all: Tetris's line, the half as the well.
//   SWEEP    `rs.sweep = { step }`   a bar crosses a side's half `step` columns at the end of that side's own turn; every 2 x 2 block of
//                         one colour it has passed breaks (Lumines' timeline: the squares wait to be swept).
//   LAUNCH   `rs.launch = { at, n }`   a clear of `at` gems or more throws up to `n` of the pieces touching it across the Line, as junk
//                         landing at once, beside the Line, without pushing it (Meteos' launch).
// The lines and the sweep add cells to a pass's clears (rules.js `clears`), so the settle credits their junk and their chain step as it
// does any clear. Qix's claims are not built: the Line already is the territory (PUZZLE-DUELS.md 5).
//
// Prior art: Tetris (the line), Lumines (the timeline and its 2 x 2 squares), Meteos (launching a clear's pieces at the foe), Bejeweled.
//
//   lineClears(board, rs) -> Set   squareClears(board, rs) -> Set (needs board.sweepSpan, set for a settle by sweepSpan)
//   sweepSpan(state, side) -> { side, x0, x1 } | null (moves the bar)   launch(state, clearEvents) -> events
// ---------------------------------------------------------------------------------------
import { piece, hasTag } from './board.js';

const key = (x, y) => x + ',' + y;
const filled = (p) => !!p && !hasTag(p, 'body') && p.kind !== 'orb';

/** Cells of every line filled across a side's half: rows under gravity along y, columns under gravity along x. */
export function lineClears(b, rs) {
  const out = new Set(); if (!rs.lines) return out;
  for (const side of [0, 1]) {
    const x0 = side === 0 ? 0 : b.line, x1 = side === 0 ? b.line : b.w; if (x1 - x0 < 2) continue;
    if (b.grav(x0, 0)[0] !== 0) { // (gravity along the rows: a column filled from top to bottom)
      for (let x = x0; x < x1; x++) { let all = true; for (let y = 0; y < b.h && all; y++) all = filled(b.at(x, y)); if (all) for (let y = 0; y < b.h; y++) out.add(key(x, y)); }
    } else for (let y = 0; y < b.h; y++) { let all = true; for (let x = x0; x < x1 && all; x++) all = filled(b.at(x, y)); if (all) for (let x = x0; x < x1; x++) out.add(key(x, y)); }
  }
  return out;
}

/** Move a side's sweep bar on: from where it stood across `step` columns of its half (wrapping), the columns passed. Null without a sweep. */
export function sweepSpan(s, side) {
  const W = s.rs.sweep; if (!W) return null;
  const b = s.board, S = s.sides[side], x0 = side === 0 ? 0 : b.line, x1 = side === 0 ? b.line : b.w, n = x1 - x0; if (n < 2) return null;
  const from = ((S.sweepAt ?? 0) % n + n) % n, to = Math.min(n - 1, from + (W.step || 3) - 1);
  S.sweepAt = to + 1 >= n ? 0 : to + 1; // (the bar wraps at the half's far edge)
  return { side, x0: x0 + from, x1: x0 + to };
}

/** The 2 x 2 blocks of one colour inside the columns the bar has passed (b.sweepSpan, set while the sweep's settle runs). */
export function squareClears(b) {
  const out = new Set(), W = b.sweepSpan; if (!W) return out;
  for (let y = 0; y + 1 < b.h; y++) for (let x = W.x0; x + 1 <= W.x1; x++) {
    const p = b.at(x, y); if (!p || !hasTag(p, 'matches')) continue;
    const q = [b.at(x + 1, y), b.at(x, y + 1), b.at(x + 1, y + 1)];
    if (q.every((c) => c && hasTag(c, 'matches') && c.colour === p.colour)) { out.add(key(x, y)); out.add(key(x + 1, y)); out.add(key(x, y + 1)); out.add(key(x + 1, y + 1)); }
  }
  return out;
}

/** After a pass of clears (resolve's events), a clear of `at` gems or more on a side throws up to `n` of the pieces now touching its
 *  holes across the Line as junk, onto the empty cells of the other side nearest the Line. Deterministic: no draw from the duel's stream. */
export function launch(s, clearEvents) {
  const L = s.rs.launch; if (!L) return [];
  const b = s.board, events = [];
  for (const side of [0, 1]) {
    const gone = clearEvents.filter((e) => e.type === 'clear' && e.side === side);
    if (gone.length < L.at) continue;
    const from = [], seen = new Set();
    for (const e of gone) for (const [dx, dy] of [[0, -1], [0, 1], [1, 0], [-1, 0]]) {
      const x = e.at[0] + dx, y = e.at[1] + dy, p = b.at(x, y);
      if (from.length < (L.n || 2) && p && !seen.has(key(x, y)) && b.sideOf(x) === side && (hasTag(p, 'matches') || hasTag(p, 'junk'))) { seen.add(key(x, y)); from.push([x, y]); }
    }
    if (!from.length) continue;
    const there = b.empty(1 - side).sort((a, c) => Math.abs(a[0] - (side === 0 ? b.line : b.line - 1)) - Math.abs(c[0] - (side === 0 ? b.line : b.line - 1)) || a[1] - c[1]);
    const to = [];
    for (const [x, y] of from) { const cell = there.shift(); if (!cell) break; b.set(x, y, null); b.set(cell[0], cell[1], piece('junk')); to.push(cell); }
    if (to.length) events.push({ type: 'launch', side, n: to.length, from: from.slice(0, to.length), to });
  }
  return events;
}
