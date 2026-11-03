// ---------------------------------------------------------------------------------------
// MOVEMENT RULES FOR A PUZZLE DUEL'S BOARD (docs/plans/PUZZLE-DUELS.md section 5, "to come: movement"; GAPS G184): floors that move a
// piece, a gem that pulls, and a throw down a lane. Each is off unless a ruleset asks for it:
//   ICE       `rs.ice = { share }`   that share of each side's cells is ice floor: a piece dragged or swapped onto it keeps sliding the
//                                    way it was going until the next cell is not free or is not ice (Pokemon's ice puzzles, Mario's slide).
//   BELTS     `rs.belts = { rows: [fractions of the height], dir: [side 0's, side 1's] }`   a row of each side is a conveyor: at the
//                                    end of the side's own turn each piece on it moves one cell ('E' or 'W') if that cell is free.
//   MAGNETS   `rs.magnets`   a chance a new gem is magnetic: at the end of its side's turn it draws the nearest gem of its colour in
//                                    its row or column (empty cells between) one cell closer (Desire's pull).
//   THROW     the action `grabthrow` (the classic duel's god hand, 2 points): take up to four gems of one colour off the exposed end of
//                                    a lane (a column; a row where gravity runs along the rows) and throw them on the exposed end
//                                    of another, on your side (Magical Drop's grab and throw).
// Floors are the board's (`board.floor`: 'plain', 'wall', and here 'ice' and 'belt:E' / 'belt:W'); a floor never changes a piece's
// tags, only where it goes, and the view draws it from `board.floor`.
//
// Prior art: Magical Drop (grab and throw), Pokemon's ice floors, Mario's and Zelda's conveyors, Fire Emblem's and Puyo's none of them
// (the duel's gravity map is the same idea: a direction a cell has).
//
//   layFloors(state)   iceSlide(state, side, action) -> events   beltStep(state, side) -> events   magnetStep(state, side) -> events
//   magnetGem(state, gem)   lane(board, side, i) -> cells upstream to downstream   GRABTHROW (the action)
// ---------------------------------------------------------------------------------------
import { DIRS, hasTag } from './board.js';
import { fall } from './rules.js';

const mineIn = (b, side, x, y) => b.in(x, y) && b.mine(side, x);
const free = (b, side, x, y) => mineIn(b, side, x, y) && !b.at(x, y) && b.floor[b.idx(x, y)] !== 'wall';
const onIce = (b, x, y) => b.floor[b.idx(x, y)] === 'ice';

/** Lay the ruleset's ice and belts on a new duel's board (ice cells drawn from the duel's stream, only when there is ice). */
export function layFloors(s) {
  const b = s.board, rs = s.rs;
  if (rs.ice) for (const side of [0, 1]) {
    const cells = b.empty(side); for (let n = Math.round(cells.length * (rs.ice.share ?? 0.1)); n > 0 && cells.length; n--) { const [x, y] = cells.splice(s.r.int(cells.length), 1)[0]; b.floor[b.idx(x, y)] = 'ice'; }
  }
  if (rs.belts) for (const side of [0, 1]) for (const f of rs.belts.rows || [0.5]) {
    const y = Math.min(b.h - 1, Math.round(f * (b.h - 1))), d = rs.belts.dir?.[side] || (side === 0 ? 'E' : 'W');
    for (let x = 0; x < b.w; x++) if (b.mine(side, x)) b.floor[b.idx(x, y)] = 'belt:' + d;
  }
}

/** After a drag or a swap, the moved piece keeps sliding while it stands on ice and the next cell along its last step is free. */
export function iceSlide(s, side, a) {
  const b = s.board; if (!s.rs.ice) return [];
  let to, d;
  if (a.kind === 'drag') { const P = a.path, [x, y] = P[P.length - 1], [px, py] = P[P.length - 2]; to = [x, y]; d = [x - px, y - py]; }
  else if (a.kind === 'swap') { d = DIRS[a.dir]; to = [a.at[0] + d[0], a.at[1] + d[1]]; }
  else return [];
  const p = b.at(...to); if (!p || !hasTag(p, 'swappable') || !onIce(b, ...to)) return [];
  let [x, y] = to; const from = [x, y];
  while (onIce(b, x, y) && free(b, side, x + d[0], y + d[1])) { b.move(x, y, x + d[0], y + d[1]); x += d[0]; y += d[1]; }
  return x === from[0] && y === from[1] ? [] : [{ type: 'slide', side, id: p.id, from, to: [x, y] }];
}

/** Conveyors: each piece on a belt cell of the side moves a cell along it, the downstream ones first so a row shifts whole. */
export function beltStep(s, side) {
  const b = s.board, events = []; if (!s.rs.belts) return events;
  for (const dir of ['E', 'W']) {
    const d = DIRS[dir], xs = []; for (let x = 0; x < b.w; x++) if (b.mine(side, x)) xs.push(x);
    if (dir === 'E') xs.reverse();
    for (let y = 0; y < b.h; y++) for (const x of xs) {
      const p = b.at(x, y); if (!p || b.floor[b.idx(x, y)] !== 'belt:' + dir || !hasTag(p, 'falls') || !free(b, side, x + d[0], y)) continue;
      b.move(x, y, x + d[0], y); events.push({ type: 'belt', side, id: p.id, from: [x, y], to: [x + d[0], y] });
    }
  }
  return events;
}

/** A new gem made magnetic by the ruleset's chance (drawn only when a ruleset has magnets); the gem stays what it was to the view. */
export function magnetGem(s, p) {
  if (s.rs.magnets && p?.kind === 'gem' && hasTag(p, 'matches') && s.r.chance(s.rs.magnets)) p.extra = [...(p.extra || []), 'magnet'];
  return p;
}

/** Magnets pull: the nearest gem of the colour along each of a magnet's four lines, with only empty cells between, steps one cell closer. */
export function magnetStep(s, side) {
  const b = s.board, events = []; if (!s.rs.magnets) return events;
  const magnets = []; b.each((p, x, y) => { if (hasTag(p, 'magnet') && b.mine(side, x)) magnets.push([x, y, p]); });
  for (const [mx, my, m] of magnets) for (const [dx, dy] of [DIRS.N, DIRS.S, DIRS.E, DIRS.W]) {
    let x = mx + dx, y = my + dy, gap = 0;
    while (mineIn(b, side, x, y) && !b.at(x, y)) { x += dx; y += dy; gap++; }
    const q = mineIn(b, side, x, y) && b.at(x, y);
    if (!q || !gap || q === m || !hasTag(q, 'matches') || q.colour !== m.colour || hasTag(q, 'magnet')) continue;
    b.move(x, y, x - dx, y - dy); events.push({ type: 'pull', side, id: q.id, magnet: m.id, from: [x, y], to: [x - dx, y - dy] });
  }
  return events;
}

/** A lane of a side: the cells of column i (or row i where gravity runs along the rows), upstream end first. */
export function lane(b, side, i) {
  const x0 = side === 0 ? 0 : b.line, x1 = side === 0 ? b.line : b.w, cells = [];
  if (b.grav(x0, 0)[0] !== 0) { for (let x = x0; x < x1; x++) cells.push([x, i]); } else for (let y = 0; y < b.h; y++) cells.push([x0 + i, y]);
  const [gx, gy] = b.grav(...cells[0]); // (upstream is against gravity)
  return gx + gy < 0 ? cells.reverse() : cells;
}
const lanesOf = (b, side) => { const x0 = side === 0 ? 0 : b.line, x1 = side === 0 ? b.line : b.w; return b.grav(x0, 0)[0] !== 0 ? b.h : x1 - x0; };

/** The gems a grab takes off a lane's exposed end: up to four of the first gem's colour in a row from the upstream end. */
function grabbed(b, side, i) {
  const L = lane(b, side, i); let k = 0; while (k < L.length && !b.at(...L[k])) k++; // (to the first piece)
  const first = b.at(...(L[k] || [-1, -1])); if (!first || !hasTag(first, 'matches')) return [];
  const out = []; while (k < L.length && out.length < 4 && b.at(...L[k]) && hasTag(b.at(...L[k]), 'matches') && b.at(...L[k]).colour === first.colour) out.push(L[k++]);
  return out;
}

export const GRABTHROW = { form: 'hand', cost: 2,
  legal: (s, side, a) => {
    const b = s.board, n = lanesOf(b, side); if (!(a.from >= 0 && a.from < n && a.to >= 0 && a.to < n) || a.from === a.to) return false;
    const g = grabbed(b, side, a.from), L = lane(b, side, a.to); return g.length > 0 && g.every((_, j) => !b.at(...L[j]) && b.floor[b.idx(...L[j])] !== 'wall'); },
  apply: (s, side, a) => {
    const b = s.board, g = grabbed(b, side, a.from), L = lane(b, side, a.to), took = g.map(([x, y]) => b.at(x, y));
    g.forEach(([x, y]) => b.set(x, y, null)); took.forEach((p, j) => b.set(L[j][0], L[j][1], p));
    const ev = [{ type: 'grabthrow', side, from: a.from, to: a.to, ids: took.map((p) => p.id), n: took.length }];
    ev.push(...fall(b)); return ev; } };
