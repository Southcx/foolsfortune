// ---------------------------------------------------------------------------------------
// THE COURIER ON A PUZZLE DUEL'S BOARD (docs/plans/PUZZLE-DUELS.md section 11): the god hand is the puzzle, the Courier is the fight.
// The Courier RUNS (a path of up to four cells for one point, over motes to drink them) and fights with the TOOLS it wears, each a
// special attack that goes round the puzzle, paid in action points and the pool. Each tool is one of the genre's mechanics, so the
// Courier's belt is the rule catalogue's second half:
//   the psygun     SHOOT   the first piece past the Line in the Courier's row is shot out (Meteos' launch, the foe's own chain risked)
//   the Sondelass  HOOK    that piece is hooked back across to the Courier's side (Magical Drop's grab)
//   the Dreamvane  DRILL   the pick breaks up to three pieces in a line from the Courier (Mr. Driller)
//   the Soul Brush PAINT   the 3x3 round the Courier painted one feeling, junk and all (Columns' magic jewel, Puzzle Fighter's diamond)
//   the Crucibelle TOLL    the foe staggers: a point lost from its next turn (Tetris 99's attack badges, a beat that is not a block)
//   the Lockheart  HOOVER  junk beside the Courier drawn into the coffin; FLAIL throws all it holds at the foe as junk (Tetris's hold)
// The Veritome (reading the foe's rules) is the plan's, not the kernel's.
//
//   COURIER_ACTIONS[kind] = { form: 'courier', tool, cost, pool, legal(s, side, a), apply(s, side, a) }   runPaths(s, side) -> paths
// ---------------------------------------------------------------------------------------
import { DIRS, KINDS, hasTag } from './board.js';
import { BREAK } from './breaks.js';

const DIR = { N: DIRS.N, S: DIRS.S, E: DIRS.E, W: DIRS.W };
const mineIn = (b, side, x, y) => b.in(x, y) && b.mine(side, x);
const open = (p) => !p || p.kind === 'mote';
const wears = (s, side, tool) => !tool || !s.sides[side].tools || s.sides[side].tools.includes(tool);
const paid = (s, side, n) => s.sides[side].pool >= n;
const spend = (s, side, n) => { s.sides[side].pool -= n; };

/** The first piece past the Line in a row, scanning away from it toward the foe's back wall. */
function firstAcross(b, side, y) {
  const step = side === 0 ? 1 : -1;
  for (let x = side === 0 ? b.line : b.line - 1; b.in(x, y); x += step) { const p = b.at(x, y); if (p && p.kind !== 'mote') return [x, y]; }
  return null;
}
/** The empty cell of a side's own row nearest the Line (where a hooked piece lands). */
function nearLine(b, side, y) {
  const step = side === 0 ? -1 : 1;
  for (let x = side === 0 ? b.line - 1 : b.line; b.in(x, y) && b.mine(side, x); x += step) if (!b.at(x, y)) return [x, y];
  return null;
}

/** Every cell the Courier could run to (up to four steps over empty cells and motes), with the shortest path there. */
export function runPaths(s, side, reach = 4) {
  const b = s.board, at = s.sides[side].at, out = []; if (!at) return out;
  const seen = new Set([at.join()]), queue = [[at]];
  while (queue.length) {
    const path = queue.shift(), [x, y] = path[path.length - 1]; if (path.length > 1) out.push(path);
    if (path.length > reach) continue;
    for (const [dx, dy] of Object.values(DIR)) {
      const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
      if (!seen.has(k) && mineIn(b, side, nx, ny) && open(b.at(nx, ny))) { seen.add(k); queue.push([...path, [nx, ny]]); }
    }
  }
  return out;
}

export const COURIER_ACTIONS = {
  run: { form: 'courier', tool: null, cost: 1, pool: 0,
    legal: (s, side, a) => { const b = s.board, P = a.path, at = s.sides[side].at; if (!at || !P || P.length < 2 || P.length > 5 || P[0][0] !== at[0] || P[0][1] !== at[1]) return false;
      for (let i = 1; i < P.length; i++) { const [x, y] = P[i]; if (!mineIn(b, side, x, y) || !open(b.at(x, y)) || Math.abs(x - P[i - 1][0]) + Math.abs(y - P[i - 1][1]) !== 1) return false; }
      return true; },
    apply: (s, side, a) => { const b = s.board, S = s.sides[side], events = [], body = b.at(...S.at); b.set(S.at[0], S.at[1], null);
      for (const [x, y] of a.path.slice(1)) { const p = b.at(x, y); if (p?.kind === 'mote') { b.set(x, y, null); S.pool = Math.min(BREAK.poolMax, S.pool + BREAK.mote); S.drunk = (S.drunk || 0) + 1; events.push({ type: 'mote.drink', side, at: [x, y], pool: S.pool }); } }
      const to = a.path[a.path.length - 1]; b.set(to[0], to[1], body); S.at = [...to]; events.unshift({ type: 'run', side, path: a.path }); return events; } },
  shoot: { form: 'courier', tool: 'psygun', cost: 1, pool: 5,
    legal: (s, side) => { const at = s.sides[side].at, t = at && firstAcross(s.board, side, at[1]); return !!t && !hasTag(s.board.at(...t), 'heavy') && !hasTag(s.board.at(...t), 'body'); },
    apply: (s, side) => { const b = s.board, t = firstAcross(b, side, s.sides[side].at[1]), p = b.at(...t); b.set(t[0], t[1], null); spend(s, side, 5); return [{ type: 'shot', side, id: p.id, at: t }]; } },
  hook: { form: 'courier', tool: 'sondelass', cost: 1, pool: 5,
    legal: (s, side) => { const b = s.board, at = s.sides[side].at, t = at && firstAcross(b, side, at[1]); return !!t && hasTag(b.at(...t), 'pushable') && !!nearLine(b, side, at[1]); },
    apply: (s, side) => { const b = s.board, y = s.sides[side].at[1], t = firstAcross(b, side, y), to = nearLine(b, side, y), p = b.at(...t);
      b.move(t[0], t[1], to[0], to[1]); spend(s, side, 5); return [{ type: 'hook', side, id: p.id, from: t, to }]; } },
  drill: { form: 'courier', tool: 'dreamvane', cost: 1, pool: 3,
    legal: (s, side, a) => { const b = s.board, at = s.sides[side].at, d = DIR[a.dir]; if (!at || !d) return false; const p = b.at(at[0] + d[0], at[1] + d[1]);
      return mineIn(b, side, at[0] + d[0], at[1] + d[1]) && !!p && p.kind !== 'mote' && !hasTag(p, 'heavy'); },
    apply: (s, side, a) => { const b = s.board, [x, y] = s.sides[side].at, d = DIR[a.dir], events = [];
      for (let i = 1; i <= 3; i++) { const tx = x + d[0] * i, ty = y + d[1] * i, p = b.at(tx, ty); if (!mineIn(b, side, tx, ty) || !p || p.kind === 'mote' || hasTag(p, 'heavy') || hasTag(p, 'body')) break;
        b.set(tx, ty, null); events.push({ type: 'drill', side, id: p.id, at: [tx, ty] }); }
      spend(s, side, 3); return events; } },
  paint: { form: 'courier', tool: 'soulbrush', cost: 2, pool: 10,
    legal: (s, side, a) => !!s.sides[side].at && !!a.colour,
    apply: (s, side, a) => { const b = s.board, [x, y] = s.sides[side].at, events = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const tx = x + dx, ty = y + dy, p = b.at(tx, ty);
        if (!mineIn(b, side, tx, ty) || !p || !(hasTag(p, 'matches') || hasTag(p, 'junk'))) continue;
        if (hasTag(p, 'junk')) { p.kind = 'gem'; p.tags = KINDS.gem; }
        p.colour = a.colour; events.push({ type: 'paint', side, id: p.id, at: [tx, ty], colour: a.colour }); }
      spend(s, side, 10); return events; } },
  toll: { form: 'courier', tool: 'crucibelle', cost: 2, pool: 15,
    legal: (s, side) => (s.sides[1 - side].stagger || 0) < 2,
    apply: (s, side) => { const F = s.sides[1 - side]; F.stagger = (F.stagger || 0) + 1; spend(s, side, 15); return [{ type: 'toll', side, stagger: F.stagger }]; } },
  hoover: { form: 'courier', tool: 'lockheart', cost: 1, pool: 0,
    legal: (s, side) => { const b = s.board, at = s.sides[side].at; return !!at && (s.sides[side].coffin || 0) < 12 && Object.values(DIR).some(([dx, dy]) => mineIn(b, side, at[0] + dx, at[1] + dy) && hasTag(b.at(at[0] + dx, at[1] + dy), 'junk')); },
    apply: (s, side) => { const b = s.board, S = s.sides[side], [x, y] = S.at, events = [];
      for (const [dx, dy] of Object.values(DIR)) { const p = b.at(x + dx, y + dy); if ((S.coffin || 0) < 12 && mineIn(b, side, x + dx, y + dy) && hasTag(p, 'junk')) { b.set(x + dx, y + dy, null); S.coffin = (S.coffin || 0) + 1; events.push({ type: 'hoover', side, id: p.id, at: [x + dx, y + dy] }); } }
      return events; } },
  flail: { form: 'courier', tool: 'lockheart', cost: 1, pool: 5,
    legal: (s, side) => (s.sides[side].coffin || 0) > 0,
    apply: (s, side) => { const S = s.sides[side], n = S.coffin; S.sent += n; S.coffin = 0; spend(s, side, 5); return [{ type: 'flail', side, n }]; } },
};
// (each tool's pool cost is also its legality: the duel checks `pool` before `legal`)
for (const A of Object.values(COURIER_ACTIONS)) { const L = A.legal; A.legal = (s, side, a) => wears(s, side, A.tool) && paid(s, side, A.pool) && L(s, side, a); }
