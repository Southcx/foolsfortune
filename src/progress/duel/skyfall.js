// ---------------------------------------------------------------------------------------
// SKYFALL (docs/plans/PUZZLE-DUELS.md 22.7; Petra's go, 2026-10-27, on Dovina's round-robin pick: "the board reads sparse and chains
// stop at 3 or 4"): the gems you clear fall back in from the board's far edge as new gems in the same settle, so what comes in can
// clear again (a free cascade, counted as the chain's next step). Puzzle & Dragons' skyfall, Candy Crush's refill, Bejeweled's.
//
// A duel's half is not a full board (junk must have somewhere to land; a side that cannot take it has lost), so the refill keeps a
// side at a WATERLINE (`to`, a share of its cells), never over it: a gem cleared is a gem back while the side is under its waterline.
// Junk sitting on a side keeps it over, so clearing next to junk (breaking it) still makes room, as it always did; on a clean side every
// clear is refilled and the board stays as full as it began. The drip at a turn's start tops up to the waterline only.
//
// Each new gem comes in down the line its hole was in (the column, under plain gravity; the row under Grief's), at the first empty cell
// from the line's upstream edge downward: where it would come to rest. Said as `drip { side, id, at, colour, sky: true }`, the drip's
// own shape (the view adds it), its colour on it since a skyfall gem can be cleared in the same settle.
//
// Prior art: Puzzle & Dragons' skyfall (and its "no skyfall" dungeons: a ruleset may set `skyfall: false`), Candy Crush Saga's refill,
// Bejeweled's cascades, Puyo Puyo's garbage needing room (the waterline).
//
//   SKYFALL { to }   skyOf(state) -> { to } | null   deficitOf(state, side) -> gems under the waterline   skyfall(state, holes, newGem) -> events
//   holes: [[x, y] cells of side 0 cleared of a gem, ... side 1]
// ---------------------------------------------------------------------------------------

/** to: the waterline, a side refilled up to this share of its cells (the duel's start fill, so a clean side never thins). calm: the
 *  chance a new gem that would clear where it lands is recoloured so it does not (Candy Crush's refill is tilted the same way): with
 *  4 colours and any 4 touching clearing, a refill left alone cleared on arrival so often that one drag set off chains of 20 and more
 *  (measured: 22 steps, 397 095 junk a turn); at 0.8 still 20 junk a turn on Strawman's board against 1.6. At 0.95, and the waterline at
 *  the duel's start fill (0.4), the Lantern Wisp's duel keeps its length (4.6 turns a side against 4.5) and its odds (8 of 12 against 9),
 *  both sides send about twice the junk, and a clear goes 3 steps or more one time in ten, not one in twenty-five (PUZZLE-DUELS.md 22.7).
 *  A ruleset may carry its own (Strawman's board: 0.5) or `skyfall: false`. */
export const SKYFALL = { to: 0.4, calm: 0.95, on: true }; // (`on`: the one-gesture duel's default)

/** A duel's skyfall: its ruleset's (`skyfall: { to }`, or `false` for none), else the one-gesture duel's. */
export const skyOf = (s) => (s.rs.skyfall === false ? null : s.rs.skyfall ?? ((s.style === 'drag' || s.style === 'pve') && SKYFALL.on ? SKYFALL : null));

/** How many gems a side is under its waterline (Infinity with no skyfall: the drip unbounded, as before). */
export function deficitOf(s, side) {
  const sky = skyOf(s); if (!sky) return Infinity;
  const b = s.board; let cells = 0, used = 0;
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) if (b.mine(side, x)) { cells++; if (b.at(x, y)) used++; }
  return Math.max(0, Math.round(sky.to * cells) - used);
}

import { COLOURS, hasTag } from './board.js';

const open = (b, side, x, y) => b.in(x, y) && b.mine(side, x) && b.floor[b.idx(x, y)] !== 'wall';

/** The cell a new gem comes to rest in down the line through (x, y): walk against gravity to the line's edge, then down it while empty. */
function restOf(b, side, x, y) {
  for (let k = 0; k < b.w + b.h; k++) { const [dx, dy] = b.grav(x, y); if (!dx && !dy) break; if (!open(b, side, x - dx, y - dy)) break; x -= dx; y -= dy; }
  if (b.at(x, y)) return null; // (the line is full to its edge)
  for (let k = 0; k < b.w + b.h; k++) { const [dx, dy] = b.grav(x, y); if (!dx && !dy) break; if (!open(b, side, x + dx, y + dy) || b.at(x + dx, y + dy)) break; x += dx; y += dy; }
  return [x, y];
}

/** New gems for the holes a settle pass left, down their own lines, while each side is under its waterline. */
export function skyfall(s, holes, newGem, { wild = false } = {}) { // (wild: a skill's blast refilled uncalmed, so it feeds the drag after it: PUZZLE-DUELS.md 23.2)
  const b = s.board, events = [];
  for (const side of [0, 1]) {
    let n = Math.min(holes[side].length, deficitOf(s, side));
    for (const [hx, hy] of holes[side]) {
      if (n <= 0) break; if (!b.in(hx, hy) || !b.mine(side, hx)) continue; // (the Line moved past it in this settle)
      const at = restOf(b, side, hx, hy); if (!at) continue;
      const p = newGem(s); b.set(at[0], at[1], p); n--;
      if (!wild && p.colour && clearsAt(b, side, at, s.rs) && s.r.chance(skyOf(s).calm ?? 0)) calmed(s, b, side, at, p);
      events.push({ type: 'drip', side, id: p.id, at, colour: p.colour, sky: true });
    }
  }
  return events;
}

/** Would the gem at `at` clear where it lies: a run of rs.match through it, or rs.cluster touching (on its own side: the Line breaks both). */
function clearsAt(b, side, [x, y], rs) {
  const c = b.at(x, y).colour, same = (X, Y) => { const q = b.in(X, Y) && b.mine(side, X) ? b.at(X, Y) : null; return !!q && hasTag(q, 'matches') && q.colour === c; };
  if (rs.match) for (const [dx, dy] of [[1, 0], [0, 1]]) { let k = 1; for (let i = 1; same(x + dx * i, y + dy * i); i++) k++; for (let i = 1; same(x - dx * i, y - dy * i); i++) k++; if (k >= rs.match) return true; }
  if (rs.cluster) { const seen = new Set([x + ',' + y]), q = [[x, y]]; while (q.length && seen.size < rs.cluster) { const [cx, cy] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (cx + dx) + ',' + (cy + dy); if (!seen.has(k) && same(cx + dx, cy + dy)) { seen.add(k); q.push([cx + dx, cy + dy]); } } } if (seen.size >= rs.cluster) return true; }
  return false;
}

/** A new gem recoloured to one that would not clear where it lies, tried in a shuffled order; left as it was if every colour would. */
function calmed(s, b, side, at, p) {
  const all = COLOURS.slice(0, Math.min(COLOURS.length, s.rs.colours)).filter((c) => c !== p.colour), was = p.colour;
  while (all.length) { p.colour = all.splice(s.r.int(all.length), 1)[0]; if (!clearsAt(b, side, at, s.rs)) return; }
  p.colour = was;
}

