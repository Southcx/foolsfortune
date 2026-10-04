// ---------------------------------------------------------------------------------------
// THE LATTICE: where a macro is composed. A grid seven cells wide and five high; on its left edge, the CORE (where a mind's own signal
// comes in), on its right, the MOUTH (where what it is told comes out). A macro is the Functions (functions.js) fitted onto the grid, each
// a small shape with a way in and a way out, turned as needed, so that the signal runs from the core, through piece after piece (each one's
// way out against the next one's way in), to the mouth. What the signal passes through, in order, is the macro: STIL then LON is "be still,
// for long".
//
// It is a packing puzzle and a routing puzzle at once (Opus Magnum's and SpaceChem's lesson: a few shaped parts, one path, many ways to
// fit them; a piece may be turned and mirrored), and how WELL it is fitted is the macro's QUALITY (0 to 1), which is its strength (how long its Functions last, how deep they
// take hold, how likely a mind is to accept them at all):
//
//   complete   the signal reaches the mouth (a macro that does not is mumbled: a quarter of its strength at most)
//   tight      the route is short: seven cells is the shortest a route can be, and every cell more is a little weaker
//   tidy       nothing on the lattice that the signal does not pass through
// So a sloppy macro (a long winding route, loose pieces, an open end) is a weak one, and the best are found by fitting the big Functions
// (four cells) where they cost the route least: an optimisation, the way Zachtronics' histograms rank a solution.
//
//   const L = new Lattice(state?)   L.place(fnId, x, y, rot, flip) -> bool   L.remove(x, y)   L.at(x, y) -> piece   L.clear()
//   L.compile() -> { q, complete, tight, tidy, chain: [piece], effects: [{ fn, dur, pow }], words: ['STIL', 'LON'], cells }
//   L.state() (to keep)   Lattice.W, Lattice.H, Lattice.CORE (row), Lattice.MOUTH (row)
// ---------------------------------------------------------------------------------------
import { FUNCTIONS, SHAPES } from './functions.js';

const W = 7, H = 5, CORE = 2, MOUTH = 2, MAX_EFFECTS = 3;
const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1]; // (sides: 0 E, 1 S, 2 W, 3 N)

/** A shape, mirrored left to right if `flip`, then turned `rot` quarter turns clockwise: its cells (from 0, 0) and its sides. */
export function turned(shapeName, rot, flip = false) {
  const S = SHAPES[shapeName], r = ((rot % 4) + 4) % 4;
  const fs = (side) => (flip && side % 2 === 0 ? 2 - side : side); // (a mirror swaps east and west)
  let cells = S.cells.map(([x, y]) => { let a = flip ? -x : x, b = y; for (let i = 0; i < r; i++) [a, b] = [-b, a]; return [a, b]; });
  const mx = Math.min(...cells.map((c) => c[0])), my = Math.min(...cells.map((c) => c[1]));
  cells = cells.map(([x, y]) => [x - mx, y - my]);
  return { cells, in: [S.in[0], (fs(S.in[1]) + r) % 4], out: [S.out[0], (fs(S.out[1]) + r) % 4] };
}

export class Lattice {
  static W = W; static H = H; static CORE = CORE; static MOUTH = MOUTH;
  constructor(state = null) {
    this.pieces = []; // { fn, x, y, rot }
    if (state?.pieces) for (const p of state.pieces) this.place(p.fn, p.x, p.y, p.rot, p.flip);
  }
  state() { return { pieces: this.pieces.map(({ fn, x, y, rot, flip }) => ({ fn, x, y, rot, flip })) }; }
  clear() { this.pieces = []; }

  cellsOf(p) { const t = turned(FUNCTIONS[p.fn].shape, p.rot, p.flip); return t.cells.map(([a, b]) => [p.x + a, p.y + b]); }
  at(x, y) { return this.pieces.find((p) => this.cellsOf(p).some(([a, b]) => a === x && b === y)) || null; }
  /** Would a piece fit here (on the lattice, on nothing)? */
  fits(fn, x, y, rot, flip = false) {
    if (!FUNCTIONS[fn]) return false;
    const t = turned(FUNCTIONS[fn].shape, rot, flip);
    return t.cells.every(([a, b]) => { const cx = x + a, cy = y + b; return cx >= 0 && cy >= 0 && cx < W && cy < H && !this.at(cx, cy); });
  }
  place(fn, x, y, rot = 0, flip = false) {
    if (!this.fits(fn, x, y, rot, flip)) return false;
    this.pieces.push({ fn, x, y, rot: ((rot % 4) + 4) % 4, flip: !!flip });
    return true;
  }
  remove(x, y) { const p = this.at(x, y); if (p) this.pieces.splice(this.pieces.indexOf(p), 1); return p; }

  /** Follow the signal from the core: the chain of pieces it passes through, whether it reaches the mouth, how many cells it took. */
  trace() {
    const chain = [], seen = new Set();
    let x = 0, y = CORE, from = 2; // (it comes in at the left edge's core row, from the west)
    let cells = 0, complete = false;
    for (let guard = 0; guard < 64; guard++) {
      if (x >= W) { complete = y === MOUTH; break; }
      if (x < 0 || y < 0 || y >= H) break;
      const p = this.at(x, y);
      if (!p || seen.has(p)) break;
      const t = turned(FUNCTIONS[p.fn].shape, p.rot, p.flip);
      const [ix, iy] = t.cells[t.in[0]];
      if (p.x + ix !== x || p.y + iy !== y || t.in[1] !== from) break; // (its way in is not where the signal is)
      seen.add(p); chain.push(p); cells += t.cells.length;
      const [ox, oy] = t.cells[t.out[0]], s = t.out[1];
      x = p.x + ox + DX[s]; y = p.y + oy + DY[s]; from = (s + 2) % 4;
    }
    return { chain, complete, cells };
  }

  /** What the macro is, and how good. */
  compile() {
    const { chain, complete, cells } = this.trace();
    const all = this.pieces.reduce((n, p) => n + turned(FUNCTIONS[p.fn].shape, p.rot, p.flip).cells.length, 0);
    const tight = cells ? Math.min(1, W / cells) : 0;
    const tidy = all ? 1 - (all - cells) / all : 0;
    const words = [], effects = [];
    for (const p of chain) {
      const f = FUNCTIONS[p.fn];
      if (f.kind === 'wire') continue;
      if (f.kind === 'mod') { const e = effects[effects.length - 1]; if (e) { e.dur *= f.dur || 1; e.pow *= f.pow || 1; words.push(f.word); } continue; }
      if (effects.length >= MAX_EFFECTS) continue;
      effects.push({ fn: f.id, dur: 1, pow: 1 });
      words.push(f.word);
    }
    const q = !effects.length ? 0 : complete ? 0.3 + 0.45 * tight + 0.25 * tidy : Math.min(0.25, 0.25 * tight * tidy);
    return { q, complete, tight, tidy, chain, effects, words, cells };
  }
}
