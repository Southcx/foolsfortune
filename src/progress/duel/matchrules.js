// ---------------------------------------------------------------------------------------
// MATCHING RULES FOR A PUZZLE DUEL'S BOARD (docs/plans/PUZZLE-DUELS.md section 5, "to come: matching"; GAPS G184): three small rules that
// change what makes a clear, each off unless a ruleset asks for it (a family, section 6):
//   DIAGONAL   `rs.diagonal`  runs along the two diagonals count as well as the rows and columns: `true` for runs of `rs.match`, or a number
//                             for a longer one (Columns; 4 on a board that chains deep already: a diagonal of 3 ran the Wonder board away).
//   CRASH      `rs.crash`     a chance a new gem is a crash gem: it takes no part in runs, but touching a gem of its colour it breaks
//                             the whole group of that colour that touches it, and itself (Super Puzzle Fighter II Turbo's crash gem).
//   RAINBOW    `rs.rainbow`   a chance a new gem is a rainbow: touching a gem it breaks every gem of the colour it touches most on
//                             its side, and itself (Noon's rainbow, Puzzle Fighter's rainbow gem).
// A special is a gem in the kernel's eyes (kind `gem`, tag-trimmed, an `extra` tag, `look` the placeholder the view draws it as: a crash
// gem as a gem of its colour, a rainbow as a bomb) so the duel's view draws it before it has a look of its own. Everything stays on one
// side: the Line breaks a group.
//
// Prior art: Columns (the diagonal), Super Puzzle Fighter II Turbo (the crash gem), Noon (the rainbow), Bejeweled's hypercube.
//
//   matchClears(board, rs) -> Set of "x,y"   specialGem(state, colour) -> piece | null   crashGroup(board, x, y) -> cells | null
// ---------------------------------------------------------------------------------------
import { DIRS, piece, hasTag } from './board.js';

const key = (x, y) => x + ',' + y;
const FOUR = [DIRS.N, DIRS.S, DIRS.E, DIRS.W];
const same = (a, c) => a && hasTag(a, 'matches') && c && hasTag(c, 'matches') && a.colour === c.colour;

/** Diagonal runs of rs.match or more, within one side. */
function diagonals(b, need, out) {
  for (const [dx, dy] of [[1, 1], [1, -1]]) for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
    const p = b.at(x, y); if (!p || !hasTag(p, 'matches')) continue;
    const px = x - dx, py = y - dy; if (b.in(px, py) && same(b.at(px, py), p) && b.sideOf(px) === b.sideOf(x)) continue; // (not a run's start)
    const run = [[x, y]]; let cx = x + dx, cy = y + dy;
    while (b.in(cx, cy) && same(b.at(cx, cy), p) && b.sideOf(cx) === b.sideOf(x)) { run.push([cx, cy]); cx += dx; cy += dy; }
    if (run.length >= need) for (const [rx, ry] of run) out.add(key(rx, ry));
  }
}

/** The gems of one colour touching (x, y) and each other (four ways, one side): what a crash gem at (x, y) breaks; null if it touches none. */
export function crashGroup(b, x, y) {
  const c = b.at(x, y), seen = new Set(), stack = [];
  for (const [dx, dy] of FOUR) { const q = b.at(x + dx, y + dy); if (q && hasTag(q, 'matches') && q.colour === c.colour && b.sideOf(x + dx) === b.sideOf(x)) { stack.push([x + dx, y + dy]); seen.add(key(x + dx, y + dy)); } }
  if (!stack.length) return null;
  const group = [];
  while (stack.length) {
    const [cx, cy] = stack.pop(); group.push([cx, cy]);
    for (const [dx, dy] of FOUR) { const k = key(cx + dx, cy + dy); if (!seen.has(k) && b.in(cx + dx, cy + dy) && b.sideOf(cx + dx) === b.sideOf(x) && ((q) => q && hasTag(q, 'matches') && q.colour === c.colour)(b.at(cx + dx, cy + dy))) { seen.add(k); stack.push([cx + dx, cy + dy]); } }
  }
  return group;
}

/** The colour a rainbow at (x, y) breaks: the one most among the gems touching it (ties to the first met N, S, E, W); null if none. */
function rainbowColour(b, x, y) {
  const n = {}; let best = null;
  for (const [dx, dy] of FOUR) { const q = b.at(x + dx, y + dy); if (q && hasTag(q, 'matches') && b.sideOf(x + dx) === b.sideOf(x)) { n[q.colour] = (n[q.colour] || 0) + 1; if (best === null || n[q.colour] > n[best]) best = q.colour; } }
  return best;
}

/** The extra cells a ruleset's matching rules clear on this pass (the clears of rules.js add them to the runs and clusters). */
export function matchClears(b, rs) {
  const out = new Set();
  if (rs.diagonal) diagonals(b, rs.diagonal === true ? rs.match : rs.diagonal, out);
  if (!rs.crash && !rs.rainbow) return out;
  b.each((p, x, y) => {
    if (hasTag(p, 'crash')) { const g = crashGroup(b, x, y); if (g) { out.add(key(x, y)); for (const [gx, gy] of g) out.add(key(gx, gy)); } }
    else if (hasTag(p, 'rainbow')) {
      const c = rainbowColour(b, x, y); if (c === null) return;
      out.add(key(x, y)); b.each((q, qx, qy) => { if (hasTag(q, 'matches') && q.colour === c && b.sideOf(qx) === b.sideOf(x)) out.add(key(qx, qy)); });
    }
  });
  return out;
}

/** A new gem of a special kind, by the ruleset's chances (drawn from the duel's stream only when a ruleset has them, so every other
 *  ruleset's stream is as it was). A crash gem keeps the colour given; a rainbow wears Wonder's, only so a view that knows no better draws a gem. Null for an ordinary gem. */
export function specialGem(s, colour) {
  const rs = s.rs;
  if (rs.crash && s.r.chance(rs.crash)) return piece('gem', { colour, tags: ['falls', 'pushable', 'swappable'], extra: ['crash'], look: 'gem' });
  if (rs.rainbow && s.r.chance(rs.rainbow)) return piece('gem', { colour: 'wonder', tags: ['falls', 'pushable', 'swappable'], extra: ['rainbow'], look: 'bomb' });
  return null;
}
