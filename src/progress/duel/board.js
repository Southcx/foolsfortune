// ---------------------------------------------------------------------------------------
// A PUZZLE DUEL'S BOARD (docs/plans/PUZZLE-DUELS.md section 2): the grid two sides play on. Every cell has a FLOOR and at most one PIECE,
// and its own GRAVITY (a direction, or none); a LINE between the sides is the score and each side's zone of control. What a rule may do
// to a piece is its TAGS, never its kind (as core/tags.js does for the world). Pure data: no three.js, so bots and the simulator play it.
//
// Prior art: PuzzleScript (a game as a grid of cells and rewrite rules over it), Noon's shared field and territories, Qix's claimed
// ground, Puyo Puyo's well.
//
//   new Board({ w, h, line, gravity })   .at(x, y) .set(x, y, piece) .move(x0, y0, x1, y1) .swap(a, b) .in(x, y) .sideOf(x) .mine(side, x)
//   .grav(x, y) -> [dx, dy] .setGravity(fn) .clone() .hash() .empty(side) -> cells   piece(kind, props) -> piece   hasTag(piece, tag)
//   DIRS { N, S, E, W, NONE }   KINDS[kind] -> tags
// ---------------------------------------------------------------------------------------

export const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0], NONE: [0, 0] };

/** What each kind of piece is, as tags (a rule asks the tag). */
export const KINDS = {
  gem: ['falls', 'pushable', 'matches', 'swappable'],
  junk: ['falls', 'pushable', 'junk', 'breakable', 'swappable'],
  stone: ['heavy'],
  bomb: ['falls', 'pushable', 'explosive', 'swappable'],
  body: ['body'],
  teardrop: ['teardrop'],
  ember: ['falls', 'pushable', 'swappable', 'timer'], // (Dread's junk, burning down: not 'junk', so nothing breaks it until it cools; dread.js) // (Lachryma shed by a break: it floats, and the Courier runs it up; buckle.js)
};
export const COLOURS = ['wonder', 'mirth', 'desire', 'fury', 'gall', 'grief', 'dread'];

let NEXT = 1;
/** A piece of a kind, with its colour, side (who it belongs to) and tags. */
export function piece(kind, props = {}) { return { id: NEXT++, kind, tags: KINDS[kind] || [], ...props }; }
export const hasTag = (p, tag) => !!p && (p.tags.includes(tag) || !!p.extra?.includes?.(tag));

export class Board {
  constructor({ w = 20, h = 20, line = 10, gravity = null } = {}) {
    this.w = w; this.h = h; this.line = line;
    this.cells = new Array(w * h).fill(null);
    this.floor = new Array(w * h).fill('plain');
    this.gravity = new Array(w * h).fill(DIRS.S);
    if (gravity) this.setGravity(gravity);
  }
  in(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  idx(x, y) { return y * this.w + x; }
  at(x, y) { return this.in(x, y) ? this.cells[this.idx(x, y)] : undefined; }
  set(x, y, p) { if (this.in(x, y)) this.cells[this.idx(x, y)] = p; }
  move(x0, y0, x1, y1) { const p = this.at(x0, y0); this.set(x1, y1, p); this.set(x0, y0, null); }
  swap([ax, ay], [bx, by]) { const a = this.at(ax, ay); this.set(ax, ay, this.at(bx, by)); this.set(bx, by, a); }
  /** Which side a column is on: 0 left of the line, 1 right of it. */
  sideOf(x) { return x < this.line ? 0 : 1; }
  mine(side, x) { return this.sideOf(x) === side; }
  /** A side's back wall (the column the line must reach for the other side to win). */
  backWall(side) { return side === 0 ? 0 : this.w; }
  grav(x, y) { return this.gravity[this.idx(x, y)] || DIRS.NONE; }
  /** Set every cell's gravity from fn(x, y, board) -> [dx, dy] (a ruleset's map, or a Figment's tilt). */
  setGravity(fn) { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) this.gravity[this.idx(x, y)] = fn(x, y, this) || DIRS.NONE; }
  /** The empty cells of a side. */
  empty(side) { const out = []; for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.mine(side, x) && !this.at(x, y)) out.push([x, y]); return out; }
  each(fn) { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const p = this.at(x, y); if (p) fn(p, x, y); } }
  clone() {
    const b = new Board({ w: this.w, h: this.h, line: this.line });
    b.cells = this.cells.map((p) => (p ? { ...p } : null)); b.floor = [...this.floor]; b.gravity = [...this.gravity];
    return b;
  }
  /** A string of the board's state (a settle that sees one twice has looped). */
  hash() { return this.line + '|' + this.cells.map((p) => (p ? `${p.kind[0]}${p.colour ?? ''}${p.side ?? ''}` : '.')).join(''); }
}
