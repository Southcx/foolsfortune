// ---------------------------------------------------------------------------------------
// JUNK AND PEST RULES FOR A PUZZLE DUEL'S BOARD (docs/plans/PUZZLE-DUELS.md section 5, "to come: junk"; GAPS G184): what a foe's junk
// is like, and what sits on a half. Each is off unless a ruleset asks for it:
//   HARD     `rs.hard = { from, hits, sticky }`   junk the side `from` sends takes `hits` (2) breaks before it goes (a clear beside it
//                                  cracks it once); `sticky` junk is glued where it lands, nothing moves it (Puyo's hard garbage, Gall's).
//   PATTERN  `rs.pattern = { from, shapes }`   junk the side `from` sends lands in a shape (a row of 3, a 2 x 2 block, a diagonal of 3)
//                                  where one fits, the rest at random (Puzzle Pirates' garbage in shapes).
//   CORRODE  `rs.corrode = { p, max }`   at the end of a side's own turn each junk on its half turns, by chance `p`, one gem touching it
//                                  to junk, at most `max` a turn (Gall's rot: junk left alone spreads).
//   VIRUSES  `rs.viruses = { n, bonus, sides }`   `n` fixed gems on each half at the start, which do not fall and clear only in a match
//                                  as any gem does; the half cleared of them sends `bonus` junk once (Dr. Mario's viruses).
// Timer junk is dread.js's embers (Super Puzzle Fighter II Turbo's counter gems), built before this file. A piece made here is a junk
// or a gem to the kernel, with an `extra` tag and `look` the placeholder the view draws it as.
//
// Prior art: Puyo Puyo (garbage), Super Puzzle Fighter II Turbo (counter gems), Puzzle Pirates (shaped garbage), Dr. Mario (viruses).
//
//   junkProps(state, sender) -> props   crackJunk(piece) -> true if it breaks now   takeCells(state, side, n, sender, cells) -> cells in order
//   corrodeStep(state, side) -> events   layViruses(state)   virusStep(state, side) -> events
// ---------------------------------------------------------------------------------------
import { KINDS, piece, hasTag, paletteOf } from './board.js';

/** The props of a junk piece the side `sender` sends: hard (and sticky) if the ruleset says it is that side's. */
export function junkProps(s, sender) {
  const H = s.rs.hard; if (!H || (H.from ?? 1) !== sender) return {};
  return { hits: H.hits ?? 2, extra: ['hard'], look: 'junk', ...(H.sticky ? { tags: KINDS.junk.filter((t) => t !== 'falls' && t !== 'pushable') } : {}) };
}

/** A clear has touched this junk: true if it breaks now, false if it only cracked (hard junk with hits left; it cracks once a pass). */
export function crackJunk(p) {
  if (!hasTag(p, 'hard') || p.hits <= 1) return true;
  p.hits--; return false;
}

const SHAPES = { row: [[0, 0], [1, 0], [2, 0]], column: [[0, 0], [0, 1], [0, 2]], block: [[0, 0], [1, 0], [0, 1], [1, 1]], diag: [[0, 0], [1, 1], [2, 2]] };

/** The cells a landing of `n` junk fills, in order: a shape's cells first where the ruleset has a pattern for this sender and one fits
 *  (drawn from the duel's stream), then random cells of those left. `cells` (the side's empty cells) is consumed. With no pattern the
 *  draws are exactly the plain landing's. */
export function takeCells(s, side, n, sender, cells) {
  const out = [], P = s.rs.pattern;
  if (P && (P.from ?? 1) === sender && n >= 3) {
    const names = P.shapes.filter((k) => SHAPES[k].length <= n), name = names.length ? s.r.pick(names) : null;
    if (name) {
      const open = new Set(cells.map(([x, y]) => x + ',' + y)), order = [...cells];
      for (let i = order.length; i > 0; i--) {
        const [ax, ay] = order.splice(s.r.int(order.length), 1)[0], at = SHAPES[name].map(([dx, dy]) => [ax + dx, ay + dy]);
        if (at.every(([x, y]) => open.has(x + ',' + y))) { for (const c of at) { out.push(c); cells.splice(cells.findIndex(([x, y]) => x === c[0] && y === c[1]), 1); } break; }
      }
    }
  }
  while (out.length < n && cells.length) out.push(cells.splice(s.r.int(cells.length), 1)[0]);
  return out;
}

/** Gall's rot: junk on the mover's half turns a gem beside it to junk, by chance, a few a turn. */
export function corrodeStep(s, side) {
  const C = s.rs.corrode, b = s.board, events = []; if (!C) return events;
  const junk = []; b.each((p, x, y) => { if (hasTag(p, 'junk') && b.mine(side, x)) junk.push([x, y]); });
  for (const [x, y] of junk) {
    if (events.length >= (C.max ?? 2) || !s.r.chance(C.p ?? 0.3)) continue;
    const near = [[0, -1], [0, 1], [1, 0], [-1, 0]].map(([dx, dy]) => [x + dx, y + dy]).filter(([nx, ny]) => b.mine(side, nx) && b.at(nx, ny) && hasTag(b.at(nx, ny), 'matches'));
    if (!near.length) continue;
    const [cx, cy] = s.r.pick(near), g = b.at(cx, cy);
    Object.assign(g, { kind: 'junk', tags: KINDS.junk, colour: undefined, ...junkProps(s, 1 - side) }); events.push({ type: 'corrode', side, id: g.id, from: [x, y], at: [cx, cy] });
  }
  return events;
}

/** Viruses on the halves at the start (after the fill): each at the cell a gem dropped in its lane would rest in, its colour one that does
 *  not clear where it lies. They carry no `falls` tag. In the PvE duel only the Courier's half has them (the aberrant's is frozen). */
export function layViruses(s, clears) { // (rules.js's `clears`, handed in: rules.js reads this file's crackJunk)
  const V = s.rs.viruses; if (!V) return;
  const b = s.board, colours = paletteOf(s.rs); s.virusLeft = [0, 0];
  for (const side of s.style === 'pve' ? [0] : V.sides ?? [0, 1]) for (let i = 0; i < V.n; i++) {
    const cells = b.empty(side); if (!cells.length) break;
    let [x, y] = cells[s.r.int(cells.length)];
    for (;;) { const [dx, dy] = b.grav(x, y); if ((!dx && !dy) || !b.in(x + dx, y + dy) || b.at(x + dx, y + dy) || !b.mine(side, x + dx)) break; x += dx; y += dy; }
    const v = piece('gem', { colour: s.r.pick(colours), tags: ['matches', 'swappable'], extra: ['virus'], look: 'gem' }); b.set(x, y, v);
    for (let t = 0; t < 8 && clears(b, s.rs).has(x + ',' + y); t++) v.colour = s.r.pick(colours);
    s.virusLeft[side]++;
  }
}

/** After a settle: a half that had viruses and has none left is cured, once, and sends the bonus. */
export function virusStep(s) {
  const V = s.rs.viruses, events = []; if (!V || !s.virusLeft) return events;
  for (const side of [0, 1]) {
    if (!s.virusLeft[side]) continue;
    let n = 0; s.board.each((p, x) => { if (hasTag(p, 'virus') && s.board.mine(side, x)) n++; });
    if (n === 0) { s.virusLeft[side] = 0; s.sides[side].sent += V.bonus ?? 4; events.push({ type: 'virus.cured', side, bonus: V.bonus ?? 4 }); } else s.virusLeft[side] = n;
  }
  return events;
}
