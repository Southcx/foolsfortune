// ---------------------------------------------------------------------------------------
// A PUZZLE DUEL (docs/plans/PUZZLE-DUELS.md section 3): two sides, one board, a line between them. A side spends its action points (3 a
// turn, a knob), each action followed by the settle (gravity, clears, what a clear sets off, again and again until nothing changes); its
// clears become junk, which cancels what is coming at it first and then waits to land on the other side at the end of that side's own
// turn. Garbage landed pushes the line toward the receiver, one column for every 4. A side wins when the line reaches the other's back
// wall, or when the other's side has no empty cell left after its junk lands.
//
// Prior art: Puyo Puyo Tetris (chains, junk, offsetting, junk waiting a turn so it can be answered), Noon (the territories, a
// side filled to death), PuzzleScript (the settle loop run to a fixed point), Into the Breach (the turn as a plan of a few actions).
//
//   newDuel({ ruleset, seed, forms }) -> state   act(state, action) -> events | null (illegal)   endTurn(state) -> events
//   settle(state, side) -> { steps, junk, events }   legalActions(state, side) -> actions   cloneState(state)
// ---------------------------------------------------------------------------------------
import { Board, COLOURS, piece, hasTag } from './board.js';
import { fall, clears, resolve, pinch, ACTIONS, costOf } from './rules.js';
import { seeded } from '../../core/rng.js';

export const DUEL = {
  ap: 3,           // action points a turn (PUZZLE-DUELS.md 9.1: a knob; the simulator reports duel lengths at each)
  settleCap: 64,   // passes before a settle is stopped (and counted: a cascade that never ends is a bug in a ruleset)
  perColumn: 4,    // junk landed that moves the line one column
  turnCap: 200,    // turns a side before the line's place decides it (a ply is one side's turn)
  fill: 0.4,       // each side's share of cells filled at the start
};

/** A junk count from one settle's chain steps: a step clearing n gems gives (n - 2) x 2^(step - 1) (Puyo's chain power, simplified). */
export const junkOf = (n, step) => Math.max(0, n - 2) * 2 ** (step - 1);

/** A new duel under a ruleset (rulesets.js). Each side's forms: the Courier, the god hand, or both (the owner, 2026-10-19). */
export function newDuel({ ruleset, seed = 1, forms = ['hand', 'courier'], line = 10, w = 20, h = 20 } = {}) {
  const rs = { run: 3, cluster: 0, blast: 2, colours: 5, rain: 2, bombs: 0, queue: 3, pincer: false, ...ruleset };
  const r = seeded(seed);
  const board = new Board({ w, h, line });
  board.setGravity(rs.gravity || (() => [0, 1]));
  const s = { board, rs, r, ply: 1, toMove: 0, winner: null, apLeft: DUEL.ap, capHits: 0, log: [],
    sides: [0, 1].map(() => ({ form: forms[0], forms: [...forms], at: null, queue: [], pending: 0, sent: 0, landed: 0, total: 0 })) };
  for (const side of [0, 1]) {
    fillSide(s, side);
    const spot = courierSpot(s, side);
    if (spot) { board.set(spot[0], spot[1], piece('body', { side })); s.sides[side].at = spot; }
    topQueue(s, side);
  }
  return s;
}

const colourOf = (s) => COLOURS[s.r.int(Math.min(COLOURS.length, s.rs.colours))];
const gemOf = (s) => (s.rs.bombs && s.r.chance(s.rs.bombs) ? piece('bomb') : piece('gem', { colour: colourOf(s) }));

/** A side filled to DUEL.fill with gems, settled, and recoloured until nothing on it would clear at once. */
function fillSide(s, side) {
  const b = s.board, cells = b.empty(side);
  for (let n = Math.round(cells.length * DUEL.fill); n > 0; n--) {
    const [x, y] = cells.splice(s.r.int(cells.length), 1)[0];
    b.set(x, y, piece('gem', { colour: colourOf(s) }));
  }
  fall(b);
  for (let tries = 0; tries < 20; tries++) {
    const hot = clears(b, s.rs); if (!hot.size) break;
    for (const k of hot) { const [x, y] = k.split(',').map(Number); b.at(x, y).colour = colourOf(s); }
  }
}

/** Where a side's Courier stands: the empty cell of its side nearest its middle. */
function courierSpot(s, side) {
  const b = s.board, mid = side === 0 ? b.line / 2 : (b.line + b.w) / 2;
  let best = null, bd = Infinity;
  for (const [x, y] of b.empty(side)) { const d = Math.abs(x + 0.5 - mid) + Math.abs(y - b.h / 2); if (d < bd) { bd = d; best = [x, y]; } }
  return best;
}

const topQueue = (s, side) => { const Q = s.sides[side].queue; while (Q.length < s.rs.queue) Q.push(gemOf(s)); };

/** The settle (PuzzleScript's loop): fall, then clear, again until nothing changes; each pass that clears is a chain step. Capped at
 *  DUEL.settleCap passes, and stopped if it sees one board twice. Garbage is credited to the side the clears were on. */
export function settle(s) {
  const events = [], junk = [0, 0], steps = [0, 0], seen = new Set();
  for (let pass = 0; ; pass++) {
    if (pass >= DUEL.settleCap) { s.capHits++; events.push({ type: 'settle.cap' }); break; }
    events.push(...fall(s.board));
    const hot = clears(s.board, s.rs); if (!hot.size) break;
    const { cleared, events: ev } = resolve(s.board, hot, s.rs);
    events.push(...ev);
    for (const side of [0, 1]) if (cleared[side]) { steps[side]++; junk[side] += junkOf(cleared[side], steps[side]); events.push({ type: 'chain', side, step: steps[side], cleared: cleared[side] }); }
    const h = s.board.hash(); if (seen.has(h)) { s.capHits++; events.push({ type: 'settle.loop' }); break; } seen.add(h);
  }
  for (const side of [0, 1]) s.sides[side].sent += junk[side];
  return { steps, junk, events };
}

/** One action by the side to move: refused (null) if it is not legal, not its form's, or costs more than the points left. */
export function act(s, a) {
  if (s.winner !== null) return null;
  const side = s.toMove, A = ACTIONS[a.kind]; if (!A) return null;
  if (A.form && A.form !== s.sides[side].form) return null;
  const cost = costOf(a); if (cost > s.apLeft || !A.legal(s, side, a)) return null;
  s.apLeft -= cost;
  const events = A.apply(s, side, a);
  if (s.rs.pincer) events.push(...pinch(s.board, side));
  events.push(...settle(s).events);
  return events;
}

/** The turn's end: the mover's junk cancels what waits for it, the rest waits for the other side; what still waits for the mover
 *  lands now (it had its turn to answer), the line moves, and the wins are checked. Then the other side's turn begins (its rain). */
export function endTurn(s) {
  const events = [], side = s.toMove, foe = 1 - side, S = s.sides[side], F = s.sides[foe];
  const off = Math.min(S.sent, S.pending); S.sent -= off; S.pending -= off;
  if (off) events.push({ type: 'offset', side, n: off });
  F.pending += S.sent; S.total += S.sent; if (S.sent) events.push({ type: 'send', side, n: S.sent }); S.sent = 0;
  if (S.pending) events.push(...land(s, side, S.pending));
  S.pending = 0;
  if (s.winner === null) {
    s.ply++;
    if (s.ply > DUEL.turnCap * 2) { const d = s.board.line - s.board.w / 2; s.winner = d > 0 ? 0 : d < 0 ? 1 : -1; events.push({ type: 'duel.cap', winner: s.winner }); }
  }
  s.toMove = foe; s.apLeft = DUEL.ap;
  if (s.winner === null) events.push(...rain(s, foe));
  topQueue(s, foe);
  s.log.push(...events);
  return events;
}

/** Junk landing on a side: junk at random empty cells of it, then the settle; the line moves one column toward it for every
 *  DUEL.perColumn landed. A side that cannot take it all has lost (Noon). */
function land(s, side, n) {
  const b = s.board, events = [{ type: 'land', side, n }], cells = b.empty(side);
  let placed = 0;
  for (; placed < n && cells.length; placed++) { const [x, y] = cells.splice(s.r.int(cells.length), 1)[0]; b.set(x, y, piece('junk')); }
  events.push(...settle(s).events);
  if (placed < n || !b.empty(side).length) { s.winner = 1 - side; events.push({ type: 'duel.full', side, winner: s.winner }); return events; }
  const S = s.sides[side]; S.landed += n;
  while (S.landed >= DUEL.perColumn && s.winner === null) { S.landed -= DUEL.perColumn; events.push(...moveLine(s, side === 0 ? -1 : 1)); }
  return events;
}

/** The line moves a column; a Courier left on the other side steps to the nearest empty cell of its own; gravity follows the sides. */
function moveLine(s, by) {
  const b = s.board; b.line += by;
  const events = [{ type: 'line', line: b.line }];
  if (b.line <= 0 || b.line >= b.w) { s.winner = b.line <= 0 ? 1 : 0; events.push({ type: 'duel.line', winner: s.winner }); return events; }
  if (s.rs.gravity) b.setGravity(s.rs.gravity);
  for (const side of [0, 1]) {
    const S = s.sides[side]; if (!S.at || b.mine(side, S.at[0])) continue;
    const spot = courierSpot(s, side); const body = b.at(...S.at); b.set(S.at[0], S.at[1], null);
    if (spot) { b.set(spot[0], spot[1], body); S.at = spot; events.push({ type: 'step', side, to: spot, forced: true }); } else S.at = null;
  }
  events.push(...settle(s).events);
  return events;
}

/** A side's rain at the start of its turn: rs.rain new pieces at random empty cells of it (the well never runs dry). */
function rain(s, side) {
  const b = s.board, cells = b.empty(side), events = [];
  for (let i = 0; i < s.rs.rain && cells.length; i++) {
    const [x, y] = cells.splice(s.r.int(cells.length), 1)[0], p = gemOf(s); b.set(x, y, p); events.push({ type: 'rain', side, id: p.id, at: [x, y] });
  }
  events.push(...settle(s).events);
  return events;
}

/** Every legal action for a side now (within its points), for bots and the view's hints. Drags are sampled (paths of 2 to 4 steps). */
export function legalActions(s, side = s.toMove, { drags = 24 } = {}) {
  const b = s.board, S = s.sides[side], out = [], dirs = ['N', 'S', 'E', 'W'];
  const ok = (a) => { const A = ACTIONS[a.kind]; if (A.form && A.form !== S.form) return; if (costOf(a) <= s.apLeft && A.legal(s, side, a)) out.push(a); };
  for (const to of S.forms) if (to !== S.form) ok({ kind: 'form', to });
  if (S.form === 'courier' && S.at) for (const dir of dirs) for (const kind of ['step', 'push', 'punt']) ok({ kind, dir });
  if (S.form === 'hand') {
    for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
      if (!b.mine(side, x)) continue;
      const p = b.at(x, y);
      if (p) { ok({ kind: 'swap', at: [x, y], dir: 'E' }); ok({ kind: 'swap', at: [x, y], dir: 'S' }); }
      else ok({ kind: 'drop', at: [x, y] });
      ok({ kind: 'rotate', at: [x, y] });
    }
    for (let i = 0; i < drags; i++) {
      const own = []; b.each((p, x, y) => { if (b.mine(side, x) && hasTag(p, 'swappable')) own.push([x, y]); });
      if (!own.length) break;
      const path = [s.r.pick(own)];
      for (let n = 1 + s.r.int(3); n > 0; n--) { const [x, y] = path[path.length - 1], d = s.r.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]); path.push([x + d[0], y + d[1]]); }
      ok({ kind: 'drag', path });
    }
  }
  return out;
}

/** A copy of a duel to try actions on (a bot's lookahead), with a stream of its own seeded from the real one's next draw. */
export function cloneState(s) {
  const c = { ...s, board: s.board.clone(), sides: s.sides.map((S) => ({ ...S, forms: [...S.forms], at: S.at && [...S.at], queue: S.queue.map((p) => ({ ...p })) })), log: [] };
  c.r = seeded(Math.floor(s.r() * 2 ** 31));
  return c;
}
