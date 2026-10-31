// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S GRID: the Flood stage's falling-sand grid, the simulation alone (docs/plans/STRAWMANS-WELL.md 3.8 and 5; its numbers
// GRID, CELL and MATTER in progress/strawmanwell.js). Pure: no three.js, so a Node script steps it as the game does (scripts/strawmangrid.mjs).
// Each cell is one of CELL: stone (the stage's own), clay, ice (they stand), sand (falls and heaps), Lachryma and crude (fall and flow,
// Lachryma finding its level, crude floating on it and burning when lit). The look is world/strawmanwell/gridlook.js, the colliders
// world/strawmanwell/gridbody.js.
//
// Rows: row 0 is the BOTTOM of the stage and y grows upward (as the world's y), so `cellToWorld` is a scale and an offset and the look's
// DataTexture is written row for row (its row 0 at the plane's foot). A cell's coordinates are integer indices; a disc's centre may be a
// fraction of a cell.
//
// The step (Noita's and the Powder Toy's falling sand, Where's My Water?'s liquid): a call steps one phase of the rows, every
// `1 / GRID.share`-th row (round-robin), the phase counting DOWN a call, so a falling cell, landing on the row below, is in the next call's
// phase and falls a cell every call (30 cells a real second at GRID.rate, 7.5 m/s) while matter at rest is looked at a quarter as often.
// Each row is scanned left to right and right to left on alternate calls (no drift to one side); a cell moved this call is stamped and
// does not move twice. `falls`: straight down, else down a diagonal (the side drawn from the seeded stream); a heavier cell swaps down
// through a lighter liquid (sand through Lachryma, Lachryma under crude). `flows`: else sideways up to `spread` cells, toward the
// nearest place it can fall from (looked for further along the row), else (now and then) to the farthest empty cell, else one cell into a
// lighter liquid. `burns`: lit crude burns a
// few visits, lighting the crude beside it, and goes to empty.
//
// Prior art: Noita (falling sand at game scale, the "updated this frame" stamp, alternating scan), the Powder Toy (densities: a heavier
// powder sinks through a lighter liquid), Where's My Water? (a liquid that finds its level on a plane, the dig), From Dust (Carve and Sculpt
// on a fluid ground), Mulberry32 (the seeded stream).
//
//   const grid = new SandGrid({ w, h, seed })   grid.get(x, y)   grid.set(x, y, kind)   grid.fill(x0, y0, x1, y1, kind)   grid.step()
//   grid.pour(x, y, kind, r) -> added   grid.carve(x, y, r) -> removed   grid.raise(x, y, r) -> added   grid.freeze / melt / ignite(x, y, r)
//   grid.count(kind, x0, y0, x1, y1)   grid.levelAt(x, kind) -> row | -1   grid.surfaceAt(x) -> row | -1   grid.burningAt(x, y)   grid.inside(x, y)
//   grid.cells (Uint8Array, row-major from the foot)   grid.fire   grid.ver (each column's change count)   standsOn(kind)   isLiquid(kind)
//   grid.dirty (a Set of columns)   grid.takeDirty() -> [x]   grid.takeChanged(seen, max) -> [x] (a reader's own: the look's, the body's)
//   grid.dump() -> base64   grid.load(base64)   cellToWorld(origin, x, y) -> { x, y, z }   worldToCell(origin, wx, wy) -> { x, y }
// ---------------------------------------------------------------------------------------
import { GRID, CELL, MATTER } from '../../progress/strawmanwell.js';

/** Fire: how many of its row's visits a lit crude cell burns before it is gone (6 visits at a quarter of 30 a real second: 0.8 real s a
 *  cell), and the chance a burning cell lights each crude cell beside it a visit (so a pool burns away over a few real seconds, a front
 *  you can watch rather than a flash). */
export const FIRE = { life: 6, spread: 0.7 };
/** A liquid looks this far along its row for a drop (a place two rows lower than it stands), though it moves only `spread` a visit toward
 *  it: a shallow staircase of one row in many columns, which a look as short as `spread` never sees, still runs down to its level (measured,
 *  scripts/strawmangrid.mjs: a 58-wide basin flat within a row in ~1200 steps, where wandering alone took ~6000). With no drop in reach it wanders sideways this often a
 *  visit (a lone thin layer still creeps to an edge, while a settled surface mostly rests: fewer columns dirty, fewer uploads). A heavier
 *  liquid beside a lighter one swaps sideways this often (Lachryma poured into crude spreads under it instead of standing as a pillar). */
const LOOK = 32, WANDER = 0.1, DISPLACE = 0.5;

// The matter table by kind: a typed row each so the step reads numbers, not objects.
const KINDS = Object.keys(CELL).length;
const SOLID = new Uint8Array(KINDS), FALLS = new Uint8Array(KINDS), FLOWS = new Uint8Array(KINDS), SPREAD = new Uint8Array(KINDS);
const HEAVY = new Float32Array(KINDS), BURNS = new Uint8Array(KINDS), FREEZES = new Uint8Array(KINDS), MELTS = new Uint8Array(KINDS);
for (const [key, kind] of Object.entries(CELL)) {
  const m = MATTER[key]; if (!m) continue;
  SOLID[kind] = m.solid ? 1 : 0; FALLS[kind] = m.falls ? 1 : 0; FLOWS[kind] = m.flows ? 1 : 0; SPREAD[kind] = m.spread | 0;
  HEAVY[kind] = m.heavy || 0; BURNS[kind] = m.burns ? 1 : 0;
  FREEZES[kind] = m.freezes ? CELL[m.freezes] : 0; MELTS[kind] = m.melts ? CELL[m.melts] : 0;
}
/** What a body may stand on: the solids and sand (a heap holds a foot). Liquids are waded through. */
export const standsOn = (kind) => SOLID[kind] === 1 || kind === CELL.sand;
/** Lachryma and crude: what flows. */
export const isLiquid = (kind) => FLOWS[kind] === 1;

/** The centre of cell (x, y) in the world: `origin` is cell (0, 0)'s outer corner (its left, its foot), the grid upright in the plane z = origin.z. */
export function cellToWorld(origin, x, y) {
  return { x: origin.x + (x + 0.5) * GRID.size, y: origin.y + (y + 0.5) * GRID.size, z: origin.z };
}
/** The cell a world point lies in (integer indices; may be outside the grid: check with `grid.inside`). */
export function worldToCell(origin, wx, wy) {
  return { x: Math.floor((wx - origin.x) / GRID.size), y: Math.floor((wy - origin.y) / GRID.size) };
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export class SandGrid {
  constructor({ w = GRID.w, h = GRID.h, seed = 1 } = {}) {
    this.w = w; this.h = h;
    this.cells = new Uint8Array(w * h);
    this.fire = new Uint8Array(w * h); // (a burning cell's visits left; 0 not burning)
    this.stamp = new Uint32Array(w * h); // (the call a cell last moved in: Noita's "updated this frame")
    this.ver = new Uint32Array(w); // (each column's change count: readers keep their own `seen` against it)
    this.dirty = new Set(); this._flag = new Uint8Array(w);
    this.phases = Math.max(1, Math.round(1 / GRID.share));
    this.tick = 0; this.phase = 0;
    this.rand = mulberry32(seed || 1);
  }

  inside(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  get(x, y) { return this.inside(x, y) ? this.cells[y * this.w + x] : CELL.stone; } // (outside reads as stone: the stage's walls)
  set(x, y, kind) {
    if (!this.inside(x, y)) return;
    const i = y * this.w + x;
    if (this.cells[i] === kind && !this.fire[i]) return;
    this.cells[i] = kind; this.fire[i] = 0; this._touch(x);
  }
  /** A rectangle of one kind, corners inclusive and clamped (authoring a stage). */
  fill(x0, y0, x1, y1, kind) {
    const ax = Math.max(0, Math.min(x0, x1)), bx = Math.min(this.w - 1, Math.max(x0, x1));
    const ay = Math.max(0, Math.min(y0, y1)), by = Math.min(this.h - 1, Math.max(y0, y1));
    for (let y = ay; y <= by; y++) for (let x = ax; x <= bx; x++) this.set(x, y, kind);
  }
  burningAt(x, y) { return this.inside(x, y) ? this.fire[y * this.w + x] > 0 : false; }

  _touch(x) { this.ver[x]++; if (!this._flag[x]) { this._flag[x] = 1; this.dirty.add(x); } }
  /** The columns changed since the last call, and the set cleared (the room's own reader). */
  takeDirty() { const out = [...this.dirty]; this.dirty.clear(); this._flag.fill(0); return out; }
  /** A reader's own changed columns: those whose count differs from its `seen` (a Uint32Array(w) it keeps), at most `max`, each marked seen.
   *  The look and the body each keep one, so neither takes the other's news. */
  takeChanged(seen, max = Infinity) {
    const out = [];
    for (let x = 0; x < this.w && out.length < max; x++) if (seen[x] !== this.ver[x]) { seen[x] = this.ver[x]; out.push(x); }
    return out;
  }

  // ---- the step --------------------------------------------------------------------------
  /** One tick: one phase of the rows (every `phases`-th row), the phase counting down so a fall is followed. */
  step() {
    const w = this.w, h = this.h, c = this.cells, tick = ++this.tick, ltr = (tick & 1) === 0;
    this.phase = (this.phase + this.phases - 1) % this.phases;
    for (let y = this.phase; y < h; y += this.phases) {
      for (let k = 0; k < w; k++) {
        const x = ltr ? k : w - 1 - k, i = y * w + x, kind = c[i];
        if (kind === CELL.empty || this.stamp[i] === tick) continue;
        if (this.fire[i]) { if (this._burn(x, y, i, tick)) continue; }
        if (!FALLS[kind]) continue;
        this._move(x, y, i, kind, tick);
      }
    }
  }

  /** May `kind` go into cell (x, y)? Empty, or a lighter liquid not yet moved this tick (they swap). */
  _yields(x, y, kind, tick) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return false;
    const j = y * this.w + x, t = this.cells[j];
    return t === CELL.empty || (FLOWS[t] === 1 && HEAVY[t] < HEAVY[kind] && this.stamp[j] !== tick);
  }
  _swap(i, j, tick) {
    const c = this.cells, f = this.fire, w = this.w;
    const k = c[i]; c[i] = c[j]; c[j] = k;
    const b = f[i]; f[i] = f[j]; f[j] = b;
    this.stamp[j] = tick; if (c[i] !== CELL.empty) this.stamp[i] = tick;
    this._touch(i % w); if (i % w !== j % w) this._touch(j % w);
  }
  _move(x, y, i, kind, tick) {
    const w = this.w;
    if (this._yields(x, y - 1, kind, tick)) { this._swap(i, i - w, tick); return; }
    const d = this.rand() < 0.5 ? -1 : 1;
    if (this._yields(x + d, y - 1, kind, tick) && this._yields(x + d, y, kind, tick)) { this._swap(i, i - w + d, tick); return; }
    if (this._yields(x - d, y - 1, kind, tick) && this._yields(x - d, y, kind, tick)) { this._swap(i, i - w - d, tick); return; }
    if (!FLOWS[kind]) return;
    if (y >= 2 && FLOWS[this.cells[i - w]] && this.cells[i - 2 * w] === CELL.empty) return; // (on a liquid still falling: wait for it, never spray sideways in the air; a stream poured stood as a 10 m spike of spray, measured)
    // sideways: toward the nearest drop within LOOK either way (the drawn side first), `spread` cells at most, else a wander to the
    // farthest empty within `spread`, else into a lighter liquid
    const c = this.cells, s = SPREAD[kind];
    let far = 0, farD = 0;
    for (const dir of [d, -d]) {
      for (let n = 1; n <= LOOK; n++) {
        const tx = x + dir * n;
        if (tx < 0 || tx >= w || c[i + dir * n] !== CELL.empty) break;
        if (this._yields(tx, y - 1, kind, tick)) { this._swap(i, i + dir * Math.min(n, s), tick); return; }
        if (dir === d && n <= s && n > far) { far = n; farD = dir; }
      }
    }
    if (far && this.rand() < WANDER) { this._swap(i, i + farD * far, tick); return; }
    for (const dir of [d, -d]) {
      const tx = x + dir;
      if (tx < 0 || tx >= w) continue;
      const t = c[i + dir];
      if (t !== CELL.empty && FLOWS[t] && HEAVY[t] < HEAVY[kind] && this.stamp[i + dir] !== tick && this.rand() < DISPLACE) { this._swap(i, i + dir, tick); return; }
    }
  }
  /** A burning cell's visit: a visit less, the crude beside it lit, gone at none. True when it burnt out (nothing left to move). */
  _burn(x, y, i, tick) {
    const f = this.fire, c = this.cells, w = this.w;
    if (!BURNS[c[i]]) { f[i] = 0; return false; }
    f[i]--; this._touch(x);
    if (f[i] === 0) { c[i] = CELL.empty; return true; }
    for (let k = 0; k < 4; k++) {
      const nx = x + (k === 0 ? 1 : k === 1 ? -1 : 0), ny = y + (k === 2 ? 1 : k === 3 ? -1 : 0);
      if (!this.inside(nx, ny)) continue;
      const j = ny * w + nx;
      if (BURNS[c[j]] && !f[j] && this.rand() < FIRE.spread) { f[j] = FIRE.life; this.stamp[j] = tick; this._touch(nx); }
    }
    return false;
  }

  // ---- the hand's verbs and the stage's ---------------------------------------------------
  /** Every cell in the disc of radius `r` cells round (x, y), handed to `fn(i, cx, cy)`. */
  _disc(x, y, r, fn) {
    const r2 = r * r, x0 = Math.max(0, Math.floor(x - r)), x1 = Math.min(this.w - 1, Math.ceil(x + r));
    const y0 = Math.max(0, Math.floor(y - r)), y1 = Math.min(this.h - 1, Math.ceil(y + r));
    let n = 0;
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      const dx = cx - x, dy = cy - y;
      if (dx * dx + dy * dy <= r2 && fn(cy * this.w + cx, cx, cy)) n++;
    }
    return n;
  }
  /** A disc of `kind` laid into the empty cells (Pour). Returns the cells added. */
  pour(x, y, kind, r = 1.5) {
    if (!kind) return 0;
    return this._disc(x, y, r, (i, cx) => { if (this.cells[i] !== CELL.empty) return false; this.cells[i] = kind; this.fire[i] = 0; this._touch(cx); return true; });
  }
  /** Every cell but stone in the disc emptied (Carve, Scoop, a dig). Returns the cells removed. */
  carve(x, y, r = 1.5) {
    return this._disc(x, y, r, (i, cx) => { const k = this.cells[i]; if (k === CELL.empty || k === CELL.stone) return false; this.cells[i] = CELL.empty; this.fire[i] = 0; this._touch(cx); return true; });
  }
  /** Clay raised into the empty cells of the disc (Sculpt). Returns the cells added. */
  raise(x, y, r = 1.5) { return this.pour(x, y, CELL.clay, r); }
  /** Lachryma in the disc frozen to ice. Returns the cells changed. */
  freeze(x, y, r = 1.5) { return this._turn(x, y, r, FREEZES); }
  /** Ice in the disc melted to Lachryma. Returns the cells changed. */
  melt(x, y, r = 1.5) { return this._turn(x, y, r, MELTS); }
  _turn(x, y, r, table) {
    return this._disc(x, y, r, (i, cx) => { const to = table[this.cells[i]]; if (!to) return false; this.cells[i] = to; this.fire[i] = 0; this._touch(cx); return true; });
  }
  /** The crude in the disc lit (it burns, lighting the crude beside it). Returns the cells lit. */
  ignite(x, y, r = 1.5) {
    return this._disc(x, y, r, (i, cx) => { if (!BURNS[this.cells[i]] || this.fire[i]) return false; this.fire[i] = FIRE.life; this._touch(cx); return true; });
  }

  // ---- readings ---------------------------------------------------------------------------
  /** How many cells of `kind` in the rectangle (corners inclusive; the whole grid by default). */
  count(kind, x0 = 0, y0 = 0, x1 = this.w - 1, y1 = this.h - 1) {
    const ax = Math.max(0, Math.min(x0, x1)), bx = Math.min(this.w - 1, Math.max(x0, x1));
    const ay = Math.max(0, Math.min(y0, y1)), by = Math.min(this.h - 1, Math.max(y0, y1));
    let n = 0;
    for (let y = ay; y <= by; y++) { const row = y * this.w; for (let x = ax; x <= bx; x++) if (this.cells[row + x] === kind) n++; }
    return n;
  }
  /** The topmost row holding `kind` in column x (a basin's level), or -1. */
  levelAt(x, kind = CELL.lachryma) {
    if (x < 0 || x >= this.w) return -1;
    for (let y = this.h - 1; y >= 0; y--) if (this.cells[y * this.w + x] === kind) return y;
    return -1;
  }
  /** The topmost row in column x a body stands on (a solid or sand), or -1. */
  surfaceAt(x) {
    if (x < 0 || x >= this.w) return -1;
    for (let y = this.h - 1; y >= 0; y--) if (standsOn(this.cells[y * this.w + x])) return y;
    return -1;
  }

  // ---- kept ---------------------------------------------------------------------------------
  /** The cells as base64 (fire is not kept: a dump is the stage as it lies). */
  dump() {
    let s = '';
    for (let i = 0; i < this.cells.length; i += 0x8000) s += String.fromCharCode.apply(null, this.cells.subarray(i, i + 0x8000));
    return btoa(s);
  }
  /** The cells put back from a `dump()` of a grid the same size; every column marked changed. False when it does not fit. */
  load(d) {
    let s; try { s = atob(String(d)); } catch { return false; }
    if (s.length !== this.cells.length) return false;
    for (let i = 0; i < s.length; i++) { const k = s.charCodeAt(i); this.cells[i] = k < KINDS ? k : CELL.empty; }
    this.fire.fill(0);
    for (let x = 0; x < this.w; x++) this._touch(x);
    return true;
  }
}
