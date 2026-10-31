// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S GRID BODY: the colliders of the Flood stage's falling-sand grid (world/strawmanwell/grid.js), so the Courier stands
// on its stone, clay, ice and sand. One fixed box a column's run of cells a body stands on (a run merged top to bottom), on the level's
// fixed body (`game.level.fixedBody`, as the Sandbox and the Touchstone build theirs), GROUPS.static. A column is looked at only when the
// grid says it changed (its own reader, `grid.takeChanged`), and its boxes rebuilt only when its runs did (a liquid moving over clay costs
// nothing), at most REBUILD columns a frame, the rest left for the next. Liquids are not solid: `liquidAt` says what the body is in, for the
// room's wade or swim. Dynamic bodies over a rebuilt column are woken (Rapier leaves a sleeping crate hanging over a dug hole).
//
// Prior art: Terraria's and Noita's chunked tile colliders (rebuilt where the ground changed, merged into runs), the greedy run merge of
// every tile engine's collision (one box a vertical run, not a box a cell).
//
//   const body = new GridBody(game, grid, origin, { depth })   body.update()   (each frame)   body.rebuildAll()   (after authoring)
//   body.liquidAt(wx, wy) -> CELL.lachryma | CELL.crude | 0   body.solidAt(wx, wy)   body.rebuilt (the columns rebuilt last update)   body.dispose()
// ---------------------------------------------------------------------------------------
import { RAPIER, GROUPS, G, groups } from '../../core/physics.js';
import { GRID } from '../../progress/strawmanwell.js';
import { standsOn, isLiquid, worldToCell } from './grid.js';

/** At most this many columns' boxes rebuilt a frame (the brief's: a column is ~1 to 4 boxes taken out and put in, so ~50 Rapier calls),
 *  and at most this many changed columns looked at a frame (a look is 90 cells read: ~4,000 reads, a few real µs). */
const REBUILD = 12, INSPECT = 48;
/** The boxes' depth through the stage's plane, metres: the body is held to the stage's depth every fixed step (the plan's section 2), so
 *  this need only be wider than the Courier's capsule with room to spare, and thin enough to leave a lane in front or behind free. */
const DEPTH = 1.5;
/** What a woken body is: a prop or debris (crates, pots, the dummies' bodies), never the static world or the Courier (the controller). */
const WAKE = groups(0xffff, G.PROP | G.DEBRIS);

export class GridBody {
  constructor(game, grid, origin, { depth = DEPTH } = {}) {
    this.game = game; this.grid = grid; this.origin = origin; this.depth = depth;
    this.cols = Array.from({ length: grid.w }, () => ({ runs: [], colliders: [] }));
    this.seen = new Uint32Array(grid.w); // (this reader's own column counts)
    this.rebuilt = []; this.cursor = 0;
    this.rebuildAll();
  }

  get world() { return this.game.physics?.world; }

  /** A column's runs of cells a body stands on, bottom up, as flat [y0, y1, y0, y1 ...]. */
  _runs(x) {
    const g = this.grid, out = [];
    let start = -1;
    for (let y = 0; y <= g.h; y++) {
      const on = y < g.h && standsOn(g.cells[y * g.w + x]);
      if (on && start < 0) start = y;
      else if (!on && start >= 0) { out.push(start, y - 1); start = -1; }
    }
    return out;
  }
  _same(a, b) { if (a.length !== b.length) return false; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; }

  _build(x, runs) {
    const col = this.cols[x], world = this.world, fixed = this.game.level?.fixedBody, S = GRID.size, o = this.origin;
    if (world) for (const c of col.colliders) world.removeCollider(c, false);
    col.colliders = []; col.runs = runs;
    if (!world || !fixed) return;
    for (let k = 0; k < runs.length; k += 2) {
      const y0 = runs[k], y1 = runs[k + 1], half = ((y1 - y0 + 1) * S) / 2;
      const desc = RAPIER.ColliderDesc.cuboid(S / 2, half, this.depth / 2)
        .setTranslation(o.x + (x + 0.5) * S, o.y + y0 * S + half, o.z).setCollisionGroups(GROUPS.static).setFriction(0.9);
      col.colliders.push(world.createCollider(desc, fixed));
    }
  }

  /** Every column built now (the stage authored, under the seam): no cap. */
  rebuildAll() {
    for (let x = 0; x < this.grid.w; x++) this._build(x, this._runs(x));
    this.seen.set(this.grid.ver);
  }

  /** The changed columns looked at (INSPECT at most), the ones whose runs moved rebuilt (REBUILD at most); the rest wait for the next frame. */
  update() {
    const g = this.grid, cols = this.cols;
    this.rebuilt = [];
    let looked = 0, last = -1;
    for (let n = 0; n < g.w && looked < INSPECT; n++) {
      const x = (this.cursor + n) % g.w; // (round-robin from where the last frame stopped: no column starves behind a busy one)
      if (this.seen[x] === g.ver[x]) continue;
      looked++; last = x;
      const runs = this._runs(x);
      if (this._same(runs, cols[x].runs)) { this.seen[x] = g.ver[x]; continue; }
      if (this.rebuilt.length >= REBUILD) { last = (x + g.w - 1) % g.w; break; } // (left unseen: the next frame starts at it)
      this._build(x, runs); this.seen[x] = g.ver[x]; this.rebuilt.push(x);
    }
    if (last >= 0) this.cursor = (last + 1) % g.w;
    if (this.rebuilt.length) this._wake();
  }

  /** The dynamic bodies over the rebuilt columns woken: one box query from the first rebuilt column to the last, the grid's height. */
  _wake() {
    const world = this.world; if (!world) return;
    const S = GRID.size, o = this.origin, a = Math.min(...this.rebuilt), b = Math.max(...this.rebuilt);
    const hx = ((b - a + 1) * S) / 2 + S, hy = (this.grid.h * S) / 2, shape = new RAPIER.Cuboid(hx, hy, this.depth);
    const asleep = [];
    world.intersectionsWithShape({ x: o.x + a * S + hx - S, y: o.y + hy, z: o.z }, { x: 0, y: 0, z: 0, w: 1 }, shape, (c) => {
      const body = c.parent(); if (body && body.isDynamic() && body.isSleeping()) asleep.push(body); return true;
    }, undefined, WAKE);
    for (const body of asleep) body.wakeUp(); // (after the query, not in its callback: measured, a wakeUp inside it does not take)
  }

  /** The liquid at a world point (Lachryma or crude), or 0: the room's wade, swim or slow. */
  liquidAt(wx, wy) {
    const c = worldToCell(this.origin, wx, wy), g = this.grid;
    if (!g.inside(c.x, c.y)) return 0;
    const k = g.cells[c.y * g.w + c.x];
    return isLiquid(k) ? k : 0;
  }
  /** Whether a world point is in a cell a body stands on. */
  solidAt(wx, wy) {
    const c = worldToCell(this.origin, wx, wy), g = this.grid;
    return g.inside(c.x, c.y) && standsOn(g.cells[c.y * g.w + c.x]);
  }

  dispose() {
    const world = this.world;
    if (world) for (const col of this.cols) for (const c of col.colliders) world.removeCollider(c, false);
    this.cols = []; this.rebuilt = [];
  }
}
