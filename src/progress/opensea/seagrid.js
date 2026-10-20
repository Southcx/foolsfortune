// ---------------------------------------------------------------------------------------
// THE OPEN SEA'S GRID (docs/plans/OPEN-SEA.md section 2): the Emocean off the lanes as a grid of squares, laid once from the save's
// seed (the same sea all build long, as Wind Waker's is; what moves on it is the weather and the Egregores, never the islets). The
// columns run along the Law-Chaos line the islands sit on (Margarite at the Law end, Anagami in the middle, Entropolis at Chaos), so a
// square's column is its law; the rows run away from the lanes, so a square's row off the lane is how far it is from any shipping. Its
// DANGER is both: toward Chaos and away from the lanes the sea is wilder, its Egregores bigger and its finds rarer.
// Every square holds something (Wind Waker's rule: empty ocean kills the genre): an islet, a monument, a wreck, a phenomenon, a seep,
// or at least its Egregores. The features are dealt from a BUDGETED POOL under local rules, Slay the Spire's map way (passage.js): a
// sea is balanced by construction.
//
// Prior art: The Legend of Zelda: The Wind Waker's sea chart (49 squares, each with an island and a secret, charted square by square);
// Skies of Arcadia's world (discoveries in the gaps between ports, wilder the further you sail); Sunless Sea (the further from home, the
// stranger); Slay the Spire's map generator (a budgeted pool under local rules).
//
//   seaGrid(seed) -> { cols, rows, lane, squares: [square], ports: { island: id } }   squareId(col, row)   squareAt(grid, col, row)
//   square = { id, col, row, off, law, danger, cls, port?, lane, features: [feature] }   dangerOf(col, row)   classAt(danger)
//   feature = { id, kind: 'islet'|'monument'|'wreck'|'phenomenon'|'seep', tier, when? }   neighbours(grid, sq) -> [square]
//   POOL (the budget and its rules)
// ---------------------------------------------------------------------------------------
import { ECON } from '../econ/table.js';
import { seeded } from '../../core/rng.js';

const G = ECON.openSea.grid;

/** The features dealt over a sea, and their rules: `off` the least rows off the lane a kind may sit (islets never on the shipping lanes). */
export const POOL = {
  islet: { n: 18, off: 1 },
  monument: { n: 12, off: 1 },
  wreck: { n: 10, off: 0 },
  phenomenon: { n: 8, off: 1 },
  seep: { n: 6, off: 1 },
  legends: 3,        // legend-tier finds, only on the outermost rows
  perSquare: 2,      // at most this many features in one square
};

/** A phenomenon is there only at its hour or in its weather (Wind Waker's night-only secrets): one of these a phenomenon. */
const WHEN = [{ phase: 'night' }, { phase: 'dawn' }, { phase: 'dusk' }, { weather: 'wonder' }, { weather: 'mirth' }, { weather: 'grief' }, { weather: 'dread' }, { weather: 'fury' }];

export const squareId = (col, row) => `${col},${row}`;

/** A square's danger: -1 (by Margarite on the lane) to about 2.8 (the Chaos corners, farthest out). */
export function dangerOf(col, row) {
  const law = (col - (G.cols - 1) / 2) / ((G.cols - 1) / 4); // (-2 .. +2: the islands' law line, ECON.islands)
  return 0.6 * Math.abs(row - G.lane) + 0.5 * law;
}
/** The Egregore class a square's danger brings (0 Guppy .. 4 Leviathan; econ/emocean.js CLASSES). */
export const classAt = (danger) => Math.max(0, Math.min(4, Math.floor(danger + 0.5)));

/** The islands' ports on the lane, by their law (ECON.islands). */
const portCol = (law) => Math.round((G.cols - 1) / 2 + law * (G.cols - 1) / 4);

/** The tier of a find in a square of `danger` (a common one near home, rarer out wide), drawn from `r`. */
function tierOf(danger, r) {
  const w = { common: Math.max(0.2, 2 - danger), uncommon: 1, rare: Math.max(0, danger - 0.4) };
  let x = r() * (w.common + w.uncommon + w.rare);
  for (const [t, v] of Object.entries(w)) { if ((x -= v) < 0) return t; }
  return 'common';
}

/** The sea, laid from a seed: the same seed lays the same sea. */
export function seaGrid(seed = 1) {
  const r = seeded((seed ^ 0x5ea5ea) >>> 0), squares = [], ports = {};
  for (let row = 0; row < G.rows; row++) for (let col = 0; col < G.cols; col++) {
    const danger = dangerOf(col, row), off = Math.abs(row - G.lane);
    squares.push({ id: squareId(col, row), col, row, off, law: dangerOf(col, G.lane) / 0.5, danger, cls: classAt(danger), lane: off === 0, features: [] });
  }
  for (const [id, isl] of Object.entries(ECON.islands)) { const sq = squares.find((s) => s.lane && s.col === portCol(isl.law)); if (sq) { sq.port = id; ports[id] = sq.id; } }
  // the legends first: the outermost rows, the wildest squares, never two in one row's same half
  const outer = squares.filter((s) => s.off === G.lane).sort((a, b) => b.danger - a.danger || r() - 0.5);
  const legendSquares = [];
  for (const s of outer) { if (legendSquares.length >= POOL.legends) break; if (legendSquares.some((t) => t.row === s.row && Math.abs(t.col - s.col) < 3)) continue; legendSquares.push(s); }
  const kinds = Object.entries(POOL).filter(([, v]) => v && typeof v === 'object');
  const deal = [];
  for (const [kind, { n }] of kinds) for (let i = 0; i < n; i++) deal.push(kind);
  for (let i = deal.length - 1; i > 0; i--) { const j = r.int(i + 1); [deal[i], deal[j]] = [deal[j], deal[i]]; }
  let k = 0;
  const place = (sq, kind, tier) => sq.features.push({ id: `${kind}:${sq.id}:${sq.features.length}`, kind, tier, ...(kind === 'phenomenon' ? { when: WHEN[k++ % WHEN.length] } : {}) });
  legendSquares.forEach((sq, i) => place(sq, i % 2 ? 'monument' : 'islet', 'legend'));
  // then the pool: an empty square first (every square holds something), then the least crowded, never a kind twice in a square
  for (const kind of deal) {
    const rule = POOL[kind];
    const open = squares.filter((s) => !s.port && s.off >= rule.off && s.features.length < POOL.perSquare && !s.features.some((f) => f.kind === kind));
    if (!open.length) continue;
    const least = Math.min(...open.map((s) => s.features.length)), pick = open.filter((s) => s.features.length === least);
    const sq = pick[r.int(pick.length)];
    place(sq, kind, tierOf(sq.danger, r));
  }
  return { cols: G.cols, rows: G.rows, lane: G.lane, squares, ports };
}

export const squareAt = (grid, col, row) => (col < 0 || row < 0 || col >= grid.cols || row >= grid.rows ? null : grid.squares[row * grid.cols + col]);
/** The squares a ship may sail to from `sq` in one step: the eight round it (the sea has no walls but its edges). */
export function neighbours(grid, sq) {
  const out = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue; const n = squareAt(grid, sq.col + dc, sq.row + dr); if (n) out.push(n); }
  return out;
}
