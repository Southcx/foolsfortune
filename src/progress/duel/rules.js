// ---------------------------------------------------------------------------------------
// A PUZZLE DUEL'S RULES (docs/plans/PUZZLE-DUELS.md sections 3 to 5): the kernel's modules, each one rule over the board. SETTLE rules run
// again and again after every action until nothing changes (PuzzleScript's loop): gravity, then the clears (runs, clusters, the pincer),
// then what a clear sets off (junk broken beside it, bombs). ACTIONS are what a form does on its own side (the Courier's step, push and
// punt; the god hand's swap, drag, rotate and drop). A rule asks a piece's tags, never its kind. Each returns its events in order, so a
// view can play the settle step by step.
//
// Prior art, rule by rule: gravity in any direction (Puyo, Tetris, and a map of directions: the owner, 2026-10-19), the run of three
// (Bejeweled, Columns), the cluster of four (Puyo Puyo), junk broken beside a clear (Puyo's nuisance, Noon's rainbow), the bomb's cross
// (Bomberman), the pincer (Terra Battle's sandwich, Othello's conversion), the push and the punt (Sokoban, Noon, Bomberman), the drag
// (Terra Battle's slide), the 2x2 rotation (Hexic), the drop (Tetris).
//
//   fall(board) -> events   clears(board, rs) -> { cells: Set, events }   pinch(board, side) -> events   ACTIONS[kind] = { cost, legal, apply }
// ---------------------------------------------------------------------------------------
import { DIRS, hasTag, piece } from './board.js';

const key = (x, y) => x + ',' + y;
const unkey = (k) => k.split(',').map(Number);

/** Gravity: every falling piece moves along its cell's gravity while the next cell is empty, on its own side (the line is a wall to a
 *  fall). Moves until nothing moves, so a whole stack drops in one call. */
export function fall(b) {
  const events = [];
  for (let pass = 0, moved = true; moved && pass < b.w + b.h; pass++) {
    moved = false;
    for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
      const p = b.at(x, y); if (!p || !hasTag(p, 'falls')) continue;
      const [dx, dy] = b.grav(x, y); if (!dx && !dy) continue;
      const nx = x + dx, ny = y + dy;
      if (!b.in(nx, ny) || b.at(nx, ny) || b.sideOf(nx) !== b.sideOf(x) || b.floor[b.idx(nx, ny)] === 'wall') continue;
      b.move(x, y, nx, ny); moved = true; events.push({ type: 'fall', id: p.id, from: [x, y], to: [nx, ny] });
    }
  }
  return events;
}

const same = (a, c) => a && hasTag(a, 'matches') && c && hasTag(c, 'matches') && a.colour === c.colour;

/** The clears of one settle pass: runs of `rs.run` or more in a line, clusters of `rs.cluster` or more touching (each within one side:
 *  the line breaks them). Returns the cells to clear, credited to the side they are on. */
export function clears(b, rs) {
  const out = new Set();
  if (rs.run) for (const [dx, dy] of [[1, 0], [0, 1]]) for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
    const p = b.at(x, y); if (!p || !hasTag(p, 'matches')) continue;
    const px = x - dx, py = y - dy; if (b.in(px, py) && same(b.at(px, py), p) && b.sideOf(px) === b.sideOf(x)) continue; // (not a run's start)
    const run = [[x, y]]; let cx = x + dx, cy = y + dy;
    while (b.in(cx, cy) && same(b.at(cx, cy), p) && b.sideOf(cx) === b.sideOf(x)) { run.push([cx, cy]); cx += dx; cy += dy; }
    if (run.length >= rs.run) for (const [rx, ry] of run) out.add(key(rx, ry));
  }
  if (rs.cluster) {
    const seen = new Set();
    for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
      const p = b.at(x, y); if (!p || !hasTag(p, 'matches') || seen.has(key(x, y))) continue;
      const group = [], stack = [[x, y]]; seen.add(key(x, y));
      while (stack.length) {
        const [cx, cy] = stack.pop(); group.push([cx, cy]);
        for (const [dx, dy] of [DIRS.N, DIRS.S, DIRS.E, DIRS.W]) {
          const nx = cx + dx, ny = cy + dy, k = key(nx, ny);
          if (!seen.has(k) && b.in(nx, ny) && b.sideOf(nx) === b.sideOf(cx) && same(b.at(nx, ny), p)) { seen.add(k); stack.push([nx, ny]); }
        }
      }
      if (group.length >= rs.cluster) for (const [gx, gy] of group) out.add(key(gx, gy));
    }
  }
  return out;
}

/** Remove the cleared cells; junk beside a cleared cell breaks, and a bomb beside one goes off (a cross of `rs.blast`). Returns how many
 *  gems each side cleared (what junk is counted from) and the events. */
export function resolve(b, cells, rs) {
  const events = [], cleared = [0, 0], gone = new Set(cells), fuse = [];
  for (const k of cells) {
    const [x, y] = unkey(k);
    for (const [dx, dy] of [DIRS.N, DIRS.S, DIRS.E, DIRS.W]) {
      const n = b.at(x + dx, y + dy);
      if (n && hasTag(n, 'junk') && b.sideOf(x + dx) === b.sideOf(x)) gone.add(key(x + dx, y + dy));
      if (n && hasTag(n, 'explosive')) fuse.push([x + dx, y + dy]);
    }
  }
  for (const [bx, by] of fuse) {
    if (!b.at(bx, by)) continue;
    gone.add(key(bx, by)); events.push({ type: 'blast', at: [bx, by] });
    for (const [dx, dy] of [DIRS.N, DIRS.S, DIRS.E, DIRS.W]) for (let r = 1; r <= (rs.blast || 2); r++) {
      const tx = bx + dx * r, ty = by + dy * r, t = b.at(tx, ty);
      if (!b.in(tx, ty) || (t && (hasTag(t, 'heavy') || hasTag(t, 'body')))) break;
      if (t) gone.add(key(tx, ty));
    }
  }
  for (const k of gone) {
    const [x, y] = unkey(k), p = b.at(x, y); if (!p) continue;
    if (hasTag(p, 'matches')) cleared[b.sideOf(x)]++;
    events.push({ type: hasTag(p, 'junk') ? 'break' : 'clear', id: p.id, at: [x, y], colour: p.colour });
    b.set(x, y, null);
  }
  return { cleared, events };
}

/** The pincer (Terra Battle, Othello): on a side, junk lying in a straight line between two of that side's gems of one colour becomes
 *  gems of that colour. Run after the side acts, before the settle. */
export function pinch(b, side) {
  const events = [];
  for (const [dx, dy] of [[1, 0], [0, 1]]) for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
    const a = b.at(x, y); if (!a || !hasTag(a, 'matches') || !b.mine(side, x)) continue;
    const mid = []; let cx = x + dx, cy = y + dy;
    while (b.in(cx, cy) && b.mine(side, cx) && hasTag(b.at(cx, cy), 'junk')) { mid.push([cx, cy]); cx += dx; cy += dy; }
    const end = b.at(cx, cy);
    if (mid.length && end && b.mine(side, cx) && same(end, a)) for (const [mx, my] of mid) {
      const was = b.at(mx, my); b.set(mx, my, piece('gem', { colour: a.colour })); events.push({ type: 'pinch', id: was.id, at: [mx, my], colour: a.colour });
    }
  }
  return events;
}

const DIR = { N: DIRS.N, S: DIRS.S, E: DIRS.E, W: DIRS.W };
const mineIn = (b, side, x, y) => b.in(x, y) && b.mine(side, x);

/** The forms' actions (PUZZLE-DUELS.md section 4). legal(state, side, a) -> bool; apply(state, side, a) -> events. A Courier is a body
 *  piece on the board; the god hand acts on any cell of its side. */
export const ACTIONS = {
  // ---- the Courier: a body on a cell of its side
  step: { form: 'courier', cost: 1,
    legal: (s, side, a) => { const [x, y] = s.sides[side].at, d = DIR[a.dir], nx = x + d[0], ny = y + d[1]; return mineIn(s.board, side, nx, ny) && !s.board.at(nx, ny); },
    apply: (s, side, a) => { const S = s.sides[side], [x, y] = S.at, d = DIR[a.dir]; s.board.move(x, y, x + d[0], y + d[1]); S.at = [x + d[0], y + d[1]]; return [{ type: 'step', side, to: S.at }]; } },
  push: { form: 'courier', cost: 1, // (Sokoban: the run of pushable pieces before the Courier moves one cell, if the cell after it is free)
    legal: (s, side, a) => { const b = s.board, [x, y] = s.sides[side].at, d = DIR[a.dir]; let cx = x + d[0], cy = y + d[1], n = 0;
      while (mineIn(b, side, cx, cy) && b.at(cx, cy) && hasTag(b.at(cx, cy), 'pushable')) { cx += d[0]; cy += d[1]; n++; }
      return n > 0 && mineIn(b, side, cx, cy) && !b.at(cx, cy); },
    apply: (s, side, a) => { const b = s.board, S = s.sides[side], [x, y] = S.at, d = DIR[a.dir]; let cx = x + d[0], cy = y + d[1];
      while (b.at(cx, cy)) { cx += d[0]; cy += d[1]; }
      for (let tx = cx, ty = cy; tx !== x || ty !== y; tx -= d[0], ty -= d[1]) b.move(tx - d[0], ty - d[1], tx, ty);
      S.at = [x + d[0], y + d[1]]; return [{ type: 'push', side, dir: a.dir, to: S.at }]; } },
  punt: { form: 'courier', cost: 2, // (Noon, Bomberman: the piece beside slides until something stops it)
    legal: (s, side, a) => { const b = s.board, [x, y] = s.sides[side].at, d = DIR[a.dir], p = b.at(x + d[0], y + d[1]);
      return !!p && hasTag(p, 'pushable') && mineIn(b, side, x + 2 * d[0], y + 2 * d[1]) && !b.at(x + 2 * d[0], y + 2 * d[1]); },
    apply: (s, side, a) => { const b = s.board, [x, y] = s.sides[side].at, d = DIR[a.dir]; let px = x + d[0], py = y + d[1]; const p = b.at(px, py);
      while (mineIn(b, side, px + d[0], py + d[1]) && !b.at(px + d[0], py + d[1])) { b.move(px, py, px + d[0], py + d[1]); px += d[0]; py += d[1]; }
      return [{ type: 'punt', side, id: p.id, to: [px, py] }]; } },
  // ---- the god hand: over its side
  swap: { form: 'hand', cost: 1, // (Bejeweled)
    legal: (s, side, a) => { const b = s.board, [x, y] = a.at, d = DIR[a.dir], p = b.at(x, y), q = b.at(x + d[0], y + d[1]);
      return mineIn(b, side, x, y) && mineIn(b, side, x + d[0], y + d[1]) && !!p && hasTag(p, 'swappable') && (!q || hasTag(q, 'swappable')); },
    apply: (s, side, a) => { const [x, y] = a.at, d = DIR[a.dir]; s.board.swap([x, y], [x + d[0], y + d[1]]); return [{ type: 'swap', side, a: [x, y], b: [x + d[0], y + d[1]] }]; } },
  drag: { form: 'hand', cost: (a) => Math.max(1, Math.ceil((a.path.length - 1) / 3)), // (Terra Battle: a piece dragged along a path swaps with each it passes)
    legal: (s, side, a) => { const b = s.board, P = a.path; if (!P || P.length < 2 || !hasTag(b.at(...P[0]), 'swappable')) return false;
      for (let i = 0; i < P.length; i++) { const [x, y] = P[i]; if (!mineIn(b, side, x, y)) return false; if (i && Math.abs(x - P[i - 1][0]) + Math.abs(y - P[i - 1][1]) !== 1) return false;
        const q = b.at(x, y); if (i && q && !hasTag(q, 'swappable')) return false; }
      return true; },
    apply: (s, side, a) => { for (let i = 1; i < a.path.length; i++) s.board.swap(a.path[i - 1], a.path[i]); return [{ type: 'drag', side, path: a.path }]; } },
  rotate: { form: 'hand', cost: 1, // (Hexic: a 2x2 turned clockwise)
    legal: (s, side, a) => { const b = s.board, [x, y] = a.at; return [[0, 0], [1, 0], [1, 1], [0, 1]].every(([dx, dy]) => mineIn(b, side, x + dx, y + dy) && (!b.at(x + dx, y + dy) || hasTag(b.at(x + dx, y + dy), 'swappable'))); },
    apply: (s, side, a) => { const b = s.board, [x, y] = a.at, q = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([dx, dy]) => b.at(x + dx, y + dy));
      [[0, 0], [1, 0], [1, 1], [0, 1]].forEach(([dx, dy], i) => b.set(x + dx, y + dy, q[(i + 3) % 4])); return [{ type: 'rotate', side, at: [x, y] }]; } },
  drop: { form: 'hand', cost: 1, // (Tetris: the next queued piece into an open lane of its side; gravity carries it)
    legal: (s, side, a) => { const b = s.board, [x, y] = a.at; if (!mineIn(b, side, x, y) || b.at(x, y) || !s.sides[side].queue.length) return false;
      const [gx, gy] = b.grav(x, y), ux = x - gx, uy = y - gy; return !b.in(ux, uy) || !b.at(ux, uy) || (!gx && !gy); },
    apply: (s, side, a) => { const p = s.sides[side].queue.shift(); s.board.set(a.at[0], a.at[1], p); return [{ type: 'drop', side, id: p.id, at: a.at }]; } },
  form: { form: null, cost: 1, legal: (s, side, a) => s.sides[side].forms.includes(a.to) && s.sides[side].form !== a.to,
    apply: (s, side, a) => { s.sides[side].form = a.to; return [{ type: 'form', side, to: a.to }]; } },
};
export const costOf = (a) => { const A = ACTIONS[a.kind]; return typeof A.cost === 'function' ? A.cost(a) : A.cost; };
