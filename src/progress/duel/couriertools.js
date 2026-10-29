// ---------------------------------------------------------------------------------------
// THE COURIER ON A PUZZLE DUEL'S BOARD (docs/plans/PUZZLE-DUELS.md sections 11 and 18): the god hand is the puzzle, the Courier is the fight.
// The Courier RUNS (a path of up to four cells for one point, over orbs to drink them) and fights with the TOOLS it wears, each a
// special that goes round the puzzle, paid in action points and the pool. Since the owner's word of 2026-10-27 ("utilize the lachryma
// tools to help dictate how the tile clearing mechanics work. Like the Soul Brush being able to recolor the suit of a given gem class"),
// three of them bend the clearing itself, each a modifier with its source on the board (DESIGN.md 22: base change bad, modifiers good):
//   the psygun     SHOOT   a shot down a row or column from the Courier: the first piece it meets pops with every gem of its colour
//                          touching it, any number (SameGame, Collapse); on your side a pop of 3 or more is the chain's first step,
//                          on the foe's it scores them nothing but what falls after is theirs (Meteos' risk)
//   the Soul Brush PAINT   every gem of one colour on your side repainted another (Columns' magic jewel, a whole class: the owner's)
//   the Crucibelle TUNE    a song: one colour clears at any 3 touching on your side until your turn ends (the crystals' frets: a
//                          note is a colour); DELAY the toll: the foe staggers, a point lost from its next turn (Tetris 99's badges)
// and four work round it:
//   the Sondelass  GRAB    the first piece past the Line in the Courier's row hooked back to your side (Magical Drop's grab): steal
//                          the gem the foe's intent needs
//   the Dreamvane  DRILL   the pick breaks up to three pieces in a line from the Courier (Mr. Driller)
//   the Lockheart  HOLD    junk beside the Courier drawn into the coffin; SEND throws all it holds at the foe as junk (Tetris's hold)
//   the Veritome   READ    the foe's half read through Dread's fog, this turn and its next (observation only: the Veritome's law)
//
//   COURIER_ACTIONS[kind] = { form: 'courier', tool, cost, pool, legal(s, side, a), apply(s, side, a) }   runPaths(s, side) -> paths
//   shotAt(s, side, dir) -> cell   groupOf(board, cell) -> cells   fromOf(s, side, a) -> colour
// ---------------------------------------------------------------------------------------
import { DIRS, KINDS, hasTag, paletteOf } from './board.js';
import { DUEL_BREAK } from './duelbreak.js';
import { resolve } from './rules.js';

const DIR = { N: DIRS.N, S: DIRS.S, E: DIRS.E, W: DIRS.W };
const mineIn = (b, side, x, y) => b.in(x, y) && b.mine(side, x);
const open = (p) => !p || p.kind === 'orb';
const wears = (s, side, tool) => !tool || !s.sides[side].tools || s.sides[side].tools.includes(tool);
const paid = (s, side, n) => s.sides[side].pool >= n;
const spend = (s, side, n) => { s.sides[side].pool -= n; };

/** The first piece past the Line in a row, scanning away from it toward the foe's back wall. */
function firstAcross(b, side, y) {
  const step = side === 0 ? 1 : -1;
  for (let x = side === 0 ? b.line : b.line - 1; b.in(x, y); x += step) { const p = b.at(x, y); if (p && p.kind !== 'orb') return [x, y]; }
  return null;
}
/** The empty cell of a side's own row nearest the Line (where a hooked piece lands). */
function nearLine(b, side, y) {
  const step = side === 0 ? -1 : 1;
  for (let x = side === 0 ? b.line - 1 : b.line; b.in(x, y) && b.mine(side, x); x += step) if (!b.at(x, y)) return [x, y];
  return null;
}

/** Where a shot down `dir` from the Courier stops: the first piece it meets (orbs it passes); across the Line only going toward the foe. */
export function shotAt(s, side, dir) {
  const b = s.board, at = s.sides[side].at, d = DIR[dir || (side === 0 ? 'E' : 'W')]; if (!at || !d) return null;
  const toward = d[0] === (side === 0 ? 1 : -1);
  for (let x = at[0] + d[0], y = at[1] + d[1]; b.in(x, y); x += d[0], y += d[1]) {
    if (!b.mine(side, x) && !toward) return null;
    const p = b.at(x, y); if (!p || p.kind === 'orb') continue;
    return hasTag(p, 'heavy') || hasTag(p, 'body') ? null : [x, y];
  }
  return null;
}
/** A gem and every gem of its colour touching it on its side, any number (a shot's pop); any other piece alone. */
export function groupOf(b, [x0, y0]) {
  const p = b.at(x0, y0); if (!hasTag(p, 'matches')) return [[x0, y0]];
  const out = [], seen = new Set([x0 + ',' + y0]), stack = [[x0, y0]], side = b.sideOf(x0);
  while (stack.length) {
    const [x, y] = stack.pop(); out.push([x, y]);
    for (const [dx, dy] of Object.values(DIR)) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny, q = b.at(nx, ny);
      if (!seen.has(k) && b.in(nx, ny) && b.sideOf(nx) === side && q && hasTag(q, 'matches') && q.colour === p.colour) { seen.add(k); stack.push([nx, ny]); } }
  }
  return out;
}
/** The colour a Paint repaints: the one asked, else the gems' nearest the Courier (the class you stand in). */
export function fromOf(s, side, a) {
  if (a.from) return a.from; // (a colour none of within reach still paints nothing: legal, a wasted stroke, so the view greys it)
  const b = s.board, at = s.sides[side].at; if (!at) return null; let best = null, bd = Infinity;
  b.each((p, x, y) => { if (!b.mine(side, x) || !hasTag(p, 'matches')) return; const d = Math.abs(x - at[0]) + Math.abs(y - at[1]); if (d < bd) { bd = d; best = p.colour; } });
  return best;
}
/** The tools' numbers on the board (PUZZLE-DUELS.md 18.1, measured by the swing of one move). */
export const TOOL_RULES = { paintReach: 4 }; // (cells from the Courier a Paint reaches, walking: the whole side was a median 19 junk for 2 points, 4 a median 7, near the hand's best swap's 8)
const colours = (s) => paletteOf(s.rs);
const popJunk = (n) => Math.max(0, n - 2); // (duel.js junkOf(n, 1): a pop of your own is the chain's first step)

/** Every cell the Courier could run to (up to four steps over empty cells and orbs), with the shortest path there. */
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
      for (const [x, y] of a.path.slice(1)) { const p = b.at(x, y); if (p?.kind === 'orb') { b.set(x, y, null); S.pool = Math.min(DUEL_BREAK.poolMax, S.pool + DUEL_BREAK.orb); S.drunk = (S.drunk || 0) + 1; events.push({ type: 'orb.drink', side, at: [x, y], pool: S.pool }); } }
      const to = a.path[a.path.length - 1]; b.set(to[0], to[1], body); S.at = [...to]; events.unshift({ type: 'run', side, path: a.path }); return events; } },
  shoot: { form: 'courier', tool: 'psygun', cost: 1, pool: 5,
    legal: (s, side, a) => !!shotAt(s, side, a.dir),
    apply: (s, side, a) => { const b = s.board, S = s.sides[side], t = shotAt(s, side, a.dir), p = b.at(...t), own = b.mine(side, t[0]), group = groupOf(b, t);
      const events = [{ type: 'shot', side, dir: a.dir || (side === 0 ? 'E' : 'W'), id: p.id, at: t, colour: p.colour, n: group.length, across: !own }];
      const popped = resolve(b, new Set(group.map((c) => c.join())), s.rs); // (a pop is a clear: junk beside it breaks, a bomb beside it goes off)
      for (const e of popped.events) if (e.type === 'clear' || e.type === 'break') e.by = 'shot';
      events.push(...popped.events);
      const n = popped.cleared[side]; if (own && n >= 3) { S.sent += popJunk(n); events.push({ type: 'chain', side, step: 1, cleared: n }); s.chainFrom = side === 0 ? [1, 0] : [0, 1]; }
      spend(s, side, 5); return events; } },
  grab: { form: 'courier', tool: 'sondelass', cost: 1, pool: 5,
    legal: (s, side) => { const b = s.board, at = s.sides[side].at, t = at && firstAcross(b, side, at[1]); return !!t && hasTag(b.at(...t), 'pushable') && !!nearLine(b, side, at[1]); },
    apply: (s, side) => { const b = s.board, y = s.sides[side].at[1], t = firstAcross(b, side, y), to = nearLine(b, side, y), p = b.at(...t);
      b.move(t[0], t[1], to[0], to[1]); spend(s, side, 5); return [{ type: 'grab', side, id: p.id, from: t, to }]; } },
  drill: { form: 'courier', tool: 'dreamvane', cost: 1, pool: 3,
    legal: (s, side, a) => { const b = s.board, at = s.sides[side].at, d = DIR[a.dir]; if (!at || !d) return false; const p = b.at(at[0] + d[0], at[1] + d[1]);
      return mineIn(b, side, at[0] + d[0], at[1] + d[1]) && !!p && p.kind !== 'orb' && !hasTag(p, 'heavy'); },
    apply: (s, side, a) => { const b = s.board, [x, y] = s.sides[side].at, d = DIR[a.dir], events = [];
      for (let i = 1; i <= 3; i++) { const tx = x + d[0] * i, ty = y + d[1] * i, p = b.at(tx, ty); if (!mineIn(b, side, tx, ty) || !p || p.kind === 'orb' || hasTag(p, 'heavy') || hasTag(p, 'body')) break;
        b.set(tx, ty, null); events.push({ type: 'drill', side, id: p.id, at: [tx, ty] }); }
      spend(s, side, 3); return events; } },
  paint: { form: 'courier', tool: 'soulbrush', cost: 2, pool: 10,
    legal: (s, side, a) => { const from = fromOf(s, side, a); return !!from && !!a.colour && a.colour !== from && colours(s).includes(a.colour); },
    apply: (s, side, a) => { const b = s.board, from = fromOf(s, side, a), events = [{ type: 'recolour', side, from, colour: a.colour, n: 0 }];
      const [cx, cy] = s.sides[side].at;
      b.each((p, x, y) => { if (!b.mine(side, x) || !hasTag(p, 'matches') || p.colour !== from || Math.abs(x - cx) + Math.abs(y - cy) > TOOL_RULES.paintReach) return; p.colour = a.colour; events.push({ type: 'paint', side, id: p.id, at: [x, y], from, colour: a.colour }); });
      events[0].n = events.length - 1; spend(s, side, 10); return events; } },
  tune: { form: 'courier', tool: 'crucibelle', cost: 1, pool: 8,
    legal: (s, side, a) => !s.sides[side].tune && colours(s).includes(a.colour),
    apply: (s, side, a) => { s.sides[side].tune = a.colour; spend(s, side, 8); return [{ type: 'tune', side, colour: a.colour, need: 3 }]; } },
  delay: { form: 'courier', tool: 'crucibelle', cost: 2, pool: 15,
    legal: (s, side) => (s.sides[1 - side].stagger || 0) < 2,
    apply: (s, side) => { const F = s.sides[1 - side]; F.stagger = (F.stagger || 0) + 1; spend(s, side, 15); return [{ type: 'delay', side, stagger: F.stagger }]; } },
  hold: { form: 'courier', tool: 'lockheart', cost: 1, pool: 0,
    legal: (s, side) => { const b = s.board, at = s.sides[side].at; return !!at && (s.sides[side].coffin || 0) < 12 && Object.values(DIR).some(([dx, dy]) => mineIn(b, side, at[0] + dx, at[1] + dy) && hasTag(b.at(at[0] + dx, at[1] + dy), 'junk')); },
    apply: (s, side) => { const b = s.board, S = s.sides[side], [x, y] = S.at, events = [];
      for (const [dx, dy] of Object.values(DIR)) { const p = b.at(x + dx, y + dy); if ((S.coffin || 0) < 12 && mineIn(b, side, x + dx, y + dy) && hasTag(p, 'junk')) { b.set(x + dx, y + dy, null); S.coffin = (S.coffin || 0) + 1; events.push({ type: 'hold', side, id: p.id, at: [x + dx, y + dy] }); } }
      return events; } },
  send: { form: 'courier', tool: 'lockheart', cost: 1, pool: 5,
    legal: (s, side) => (s.sides[side].coffin || 0) > 0,
    apply: (s, side) => { const S = s.sides[side], n = S.coffin; S.sent += n; S.coffin = 0; spend(s, side, 5); return [{ type: 'hold.send', side, n }]; } },
  read: { form: 'courier', tool: 'veritome', cost: 1, pool: 0,
    legal: (s, side) => !!s.rs.fog && s.rs.fog.side !== side && !(s.sides[side].read > 0),
    apply: (s, side) => { s.sides[side].read = 2; return [{ type: 'read', side, plies: 2 }]; } }, // (this turn and the foe's: duel.js endTurn counts it down)
};
// (each tool's pool cost is also its legality: the duel checks `pool` before `legal`)
for (const A of Object.values(COURIER_ACTIONS)) { const L = A.legal; A.legal = (s, side, a) => wears(s, side, A.tool) && paid(s, side, A.pool) && L(s, side, a); }
