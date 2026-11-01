// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S FLOOD: The Flood stage (docs/plans/STRAWMANS-WELL.md 3.8), whose middle is the falling-sand grid (grid.js, its look
// gridlook.js, its colliders gridbody.js; GRID, CELL in progress/strawmanwell.js). Built in its lane: a start's boards, the grid's 40 m
// standing in the plane (its stone the walkway, a basin dug 3.5 m deep in its middle, a clay wall across the way, a heap of sand), a
// spigot over the basin, a sluice door before the goal. Worked without the god hand, at three lecterns behind the plane (F):
//   CARVE   cuts a way through the clay wall (the dig)                  POUR    held, the spigot pours Lachryma into the basin
//   FREEZE  turns the basin's Lachryma to ice to walk across
// and, while the god hand is taken over the stage, its Pour and Carve (`god.pour`, `god.carve`: godhand/matterarts.js) land on the grid
// where the hand's cursor is. The basin filled past FLOOD.fill cells opens the sluice (`well.flood.fill { stage, cells }`, once a visit).
// In a liquid the Courier wades (the place's wade). The grid is stepped GRID.rate times a real second.
//
// Prior art: Where's My Water? (a basin filled to open the way), Lemmings' digger and From Dust's Carve, the Ice Climbers' freeze; Noita
// and the Powder Toy for the grid itself.
//
//   const F = new FloodStage(well)   F.build(S) -> { goal, door, checks }   F.spots -> [{ ref, pos }]   F.use(ref)   F.hold(ref, on)
//   F.pre(dt) (the wade)   F.update(dt)   F.clear()   FLOOD
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GRID, CELL } from '../../progress/strawmanwell.js';
import { SandGrid, worldToCell } from './grid.js';
import { GridLook } from '../../vfx/strawmanwell/gridlook.js';
import { GridBody } from './gridbody.js';
import { COLOR, BACK } from './stagekit.js';
import { AT } from './layout.js';
import { scaffold, goalFlag } from './stages.js';

/** The stage in its lane's metres: the grid's foot-left corner, the basin (cells), the clay wall, the spigot's cell, the lecterns, the
 *  sluice; `fill` the basin's Lachryma (cells) that opens it; the wade in a liquid. */
export const FLOOD = {
  at: [6, -4], floor: 15, basin: [40, 2, 111, 15], wall: [20, 16, 23, 43], sand: [120, 16, 134, 21], spigot: [76, 42], pour: 2.4,
  lecterns: { carve: 9.4, pour: 13.6, freeze: 15.0 }, sluice: 44.6, fill: 560, wade: 0.55,
};

export class FloodStage {
  constructor(well) { this.well = well; this.game = well.game; this.grid = null; this.spots = []; this.offs = []; }

  build(S) {
    const g = this.game, len = S.lane.len, F = FLOOD;
    scaffold(S, len, { top: 30 });
    S.box(-1, 6, -4, 0, COLOR.boards); S.box(46, len + 1, -4, 0, COLOR.boards);
    // the grid: its stone floor, the basin dug in it, the clay wall, a heap of sand
    const origin = this.origin = { x: AT.x + F.at[0], y: AT.y + F.at[1], z: S.z };
    const grid = this.grid = new SandGrid({ w: GRID.w, h: GRID.h, seed: 7 });
    grid.fill(0, 0, grid.w - 1, F.floor, CELL.stone);
    grid.fill(...F.basin, CELL.empty);
    grid.fill(...F.wall, CELL.clay);
    grid.fill(...F.sand, CELL.sand);
    this.look = new GridLook(grid, origin); this.look.mesh.position.z = origin.z - 0.7; S.add(this.look.mesh); // (a cross-section just behind the body)
    this.body = new GridBody(g, grid, origin);
    // the spigot over the basin, the lecterns behind the plane, the sluice
    const sp = this.cellLocal(...F.spigot);
    S.box(sp.x - 0.25, sp.x + 0.25, sp.y + 0.4, 14, COLOR.pin, { collide: false, dz: -0.6, d: 0.5 });
    S.label('SPIGOT', sp.x, sp.y + 2.4, { dz: -BACK + 0.13, width: 2 });
    for (const [ref, x] of Object.entries(F.lecterns)) {
      S.box(x - 0.35, x + 0.35, 0, 1.0, COLOR.spool, { collide: false, dz: -1.3, d: 0.7 }); S.box(x - 0.3, x + 0.3, 1.0, 1.05, COLOR.gold, { collide: false, dz: -1.3, d: 0.6 });
      S.label(ref.toUpperCase(), x, 2.0, { dz: -BACK + 0.13, width: 1.6, sub: ref === 'pour' ? 'F held' : 'F' });
      this.spots.push({ ref, pos: S.at(x, 1.4, -1.3) });
    }
    const door = S.box(F.sluice, F.sluice + 0.6, 0, 9, COLOR.door, { own: true });
    this.sluice = { mesh: door.mesh, collider: door.collider, y0: door.mesh.position.y, k: 0, open: false };
    S.label('SLUICE', F.sluice + 0.3, 9.8, { dz: -BACK + 0.13, width: 2, sub: 'fill the basin' });
    goalFlag(S, 49, 0);
    // the god hand's matter verbs, where its cursor is over the grid
    const on = (name, fn) => this.offs.push(g.events.on(name, fn));
    on('god.pour', () => this.handAt((c) => { if (this.grid.pour(c.x, c.y, CELL.lachryma, 4) > 0) this.well.verb('pour'); }));
    on('god.carve', () => this.handAt((c) => { if (this.grid.carve(c.x, c.y, 4) > 0) { this.well.verb('carve'); this.well.verb('dig'); } }));
    on('god.sculpt', () => this.handAt((c) => { if (this.grid.raise(c.x, c.y, 3) > 0) this.well.verb('raise'); }));
    this.acc = 0; this.filled = false;
    return { goal: [49, 0], door: [51, 0], checks: [[2, 0], [10, 0], [36, 0]] };
  }
  /** A cell's middle in the lane's metres. */
  cellLocal(x, y) { return { x: FLOOD.at[0] + (x + 0.5) * GRID.size, y: FLOOD.at[1] + (y + 0.5) * GRID.size }; }
  /** The god hand's cursor on the grid, if it is over it: fn(cell). */
  handAt(fn) {
    const g = this.game, K = g.god?.cursor?.point; if (!this.grid || !K || !g.god?.controlling) return;
    const c = worldToCell(this.origin, K.x, K.y); if (this.grid.inside(c.x, c.y) && Math.abs(K.z - this.origin.z) < 6) fn(c);
  }

  /** F at a lectern. */
  use(ref) {
    const G = this.grid, F = FLOOD; if (!G) return;
    if (ref === 'carve') {
      let n = 0; for (const y of [18, 21, 24]) n += G.carve(F.wall[0] + 2, y, 5);
      if (n > 0) { this.well.verb('carve'); this.well.verb('dig'); }
    } else if (ref === 'freeze') {
      let n = 0;
      for (let x = F.basin[0]; x <= F.basin[2]; x += 2) { const y = G.levelAt(x, CELL.lachryma); if (y >= 0) n += G.freeze(x, y, 2.2); }
      if (n > 0) this.well.verb('freeze');
    }
  }
  /** A lectern held (POUR): the spigot runs while it is. */
  hold(ref, on) { this.pouring = ref === 'pour' && on; }

  /** Before each fixed step: wading in a liquid (after the mechanics have set the floor's own). */
  pre() {
    if (!this.body) return;
    const P = this.game.player;
    if (this.body.liquidAt(P.pos.x, P.pos.y + 0.6)) P.wade *= FLOOD.wade;
  }

  update(dt) {
    const G = this.grid, F = FLOOD; if (!G) return;
    this.acc = Math.min(this.acc + dt, 4 / GRID.rate);
    while (this.acc >= 1 / GRID.rate) {
      this.acc -= 1 / GRID.rate;
      if (this.pouring && G.pour(F.spigot[0], F.spigot[1], CELL.lachryma, F.pour) > 0) this.well.verb('pour');
      G.step();
    }
    this.look.update(); this.body.update();
    if (!this.filled) {
      const cells = G.count(CELL.lachryma, ...F.basin) + G.count(CELL.ice, ...F.basin);
      if (cells >= F.fill) { this.filled = true; this.game.events?.emit('well.flood.fill', { stage: 'flood', cells, by: 'courier' }); }
    }
    const D = this.sluice; D.k += ((this.filled ? 1 : 0) - D.k) * Math.min(1, dt * 2);
    D.mesh.position.y = D.y0 + D.k * 8.5;
    const solid = D.k < 0.4; if (solid !== D.solid) { D.solid = solid; D.collider?.setEnabled(solid); }
  }

  clear() {
    for (const off of this.offs) off(); this.offs = [];
    this.body?.dispose(); this.look?.dispose();
    this.grid = this.look = this.body = this.sluice = null; this.spots = []; this.pouring = false;
  }
}
