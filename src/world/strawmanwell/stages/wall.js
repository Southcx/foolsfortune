// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL, THE WALL (docs/plans/STRAWMANS-WELL.md 3.16): a painted wall standing behind the boards; at its marked doorway F takes
// you into it, and you go on as a painting on its face along the ledges painted there, coming out where the painting says (Zelda: A
// Link Between Worlds' wall merge, Super Mario Odyssey's 8-bit walls). The open-world version (the Paint Dive into any painted wall of
// the 3D world) is Petra's, later; this is the stage. Two beats:
//   1. a pit too wide for any jump: into the wall at its doorway, along its ledges (a gap, a step, a painted spike strip), out on the
//      far boards
//   2. a ledge too high: into the wall again, its ledges zig-zag up, out onto the ledge with the goal
// In the wall the body is the Courier's own on a plane just off the wall's face (the plane shifted, depthlanes.js), its ledges one-way
// (the Run's thin platforms, mechanics.js: jumped up through, S + Space down through), the 3D body hidden and a flat figure painted in
// the wall's ink drawn on the face where it stands (a billboard of two frames, mirrored to its run). The core movement is untouched.
// F is the way in, not the Paint Dive (C held in paint): borrowing the dive (courier/moves/slip.js) is Petra's to do with the open-world
// walls. Placeholder looks: plaster, ink ledges, a gold doorway in, a red one out; the figure is a placeholder too (Calissa's).
//
// Prior art: A Link Between Worlds (the merge, the walls' own paths), Mario Odyssey's 8-bit pipes and walls, Paper Mario's flat body.
//
//   default export: a stage module (stagemods.js's contract)   WALL (its numbers)   PATHS
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR } from '../stagekit.js';
import { AT } from '../layout.js';
import { goalFlag } from '../stages.js';
import { PlaneShift, StageRetry } from './depthlanes.js';

/** Its numbers: the wall panel's depth and its face (m, from the stage's plane), the plane inside the painting (just off the face, so the
 *  body's capsule touches neither the panel nor the boards), the doorway's reach (m), the figure's size and its walk's frame time (real s). */
export const WALL = { panel: -3.4, face: -3.3, plane: -2.7, reach: 1.0, w: 1.0, h: 2.0, frame: 0.14 };
const PLASTER = 0xd8c8a8, INK = 0x2a3a5a;
/** The painted paths: the doorway in, its ledges [x0, x1, top], its spike strips [x0, x1, top], the doorway out (lane metres). */
export const PATHS = {
  A: { in: [10, 0], out: [58.5, 0], ledges: [[9, 16, 0], [18, 22, 0.5], [24, 27, 1.5], [28, 31, 2.5], [33, 38, 1], [40, 43, 2], [45, 48, 1], [50, 53, 0.5], [55, 59, 0]], spikes: [[35, 36, 1]] },
  B: { in: [63, 0], out: [74.5, 7], ledges: [[62, 65, 0], [66.5, 68.5, 1], [63.5, 65.5, 2], [66.5, 68.5, 3], [63.5, 65.5, 4], [66.5, 68.5, 5], [69.5, 72, 6], [72.5, 75.5, 7]], spikes: [] },
};
const CHECKS = [[2, 0], [57, 0], [76, 7]];

/** The flat figure: two frames of a small painted body (16 x 32 px each), the wall's ink with a pale edge. */
function figureTexture() {
  const cv = document.createElement('canvas'); cv.width = 32; cv.height = 32;
  const x = cv.getContext('2d'), ink = '#2a3a5a', pale = '#e8dcc0';
  const px = (f, a, b, w, h, c) => { x.fillStyle = c; x.fillRect(f * 16 + a, b, w, h); };
  for (const f of [0, 1]) {
    px(f, 5, 1, 6, 6, pale); px(f, 6, 2, 4, 4, ink); // (the head)
    px(f, 4, 8, 8, 10, pale); px(f, 5, 9, 6, 8, ink); // (the body)
    if (f === 0) { px(f, 2, 9, 2, 7, ink); px(f, 12, 9, 2, 7, ink); px(f, 5, 18, 2, 12, ink); px(f, 9, 18, 2, 12, ink); }
    else { px(f, 1, 10, 3, 2, ink); px(f, 12, 8, 3, 2, ink); px(f, 3, 18, 3, 11, ink); px(f, 10, 18, 3, 11, ink); px(f, 2, 28, 3, 2, ink); px(f, 11, 28, 3, 2, ink); }
  }
  const t = new THREE.CanvasTexture(cv); t.magFilter = t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; t.repeat.set(0.5, 1);
  return t;
}

export default {
  id: 'wall',
  build(well, S) {
    const len = S.lane.len, M = well.mech, X = (x) => AT.x + x, Y = (y) => AT.y + y;
    // the scaffold: the back flat behind the painted wall, the ends, the unseen front, the catch floor, lamps
    S.box(-16, len + 16, -14, 24, COLOR.flat, { dz: -4.6, d: 0.2, outline: false });
    for (const x of [-0.6, len + 0.6]) S.box(x - 0.6, x + 0.6, -6, 14, COLOR.wing, { dz: -1.6, d: 6.2, outline: false });
    S.box(-16, len + 16, -14, 24, 0, { dz: 1.6, d: 0.2, hidden: true });
    S.box(-16, len + 16, -16, -14, 0, { dz: -1.6, d: 6.2, hidden: true });
    for (const k of [1, 3, 5]) S.lamp((len * k) / 6, 8);
    // the boards: in front of the pit, past it, and the goal's ledge too high to jump
    S.box(-1, 14, -4, 0, COLOR.boards); S.box(56, 80, -4, 0, COLOR.boards); S.box(73, 80, 3, 7, COLOR.boards);
    // the painted walls, their ledges (ink on the plaster, their one-way bodies on the plane in the painting), their spikes, their doorways
    S.box(7, 60, -3, 9, PLASTER, { dz: WALL.panel, d: 0.2 }); S.box(61, 77.5, -1, 10, PLASTER, { dz: WALL.panel, d: 0.2 });
    const paint = (x0, x1, y0, y1, c) => S.box(x0, x1, y0, y1, c, { dz: WALL.face + 0.02, d: 0.04, collide: false, outline: false });
    const door = (x, y, c) => { paint(x - 0.65, x - 0.5, y, y + 2.3, c); paint(x + 0.5, x + 0.65, y, y + 2.3, c); paint(x - 0.65, x + 0.65, y + 2.15, y + 2.3, c); };
    for (const P of Object.values(PATHS)) {
      for (const [x0, x1, top] of P.ledges) {
        paint(x0, x1, top - 0.18, top, INK);
        const { collider } = S.box(x0, x1, top - 0.18, top, 0, { dz: WALL.plane, d: 0.6, hidden: true });
        M.thin(collider, X(x0), X(x1), Y(top));
      }
      for (const [x0, x1, top] of P.spikes) for (let x = x0; x < x1 - 0.05; x += 0.25) paint(x, x + 0.2, top, top + 0.35, COLOR.mark);
      door(P.in[0], P.in[1], COLOR.gold); door(P.out[0], P.out[1], COLOR.mark);
    }
    const sign = (t, x, y, sub) => S.label(t, x, y, { dz: WALL.face + 0.05, width: 2.6, sub });
    sign('THE WALL', 4, 4.4, 'too wide to jump'); sign('F: INTO THE WALL', 10, 3.2, 'at a gold doorway'); sign('AGAIN', 63, 3.2, 'up the painting');
    goalFlag(S, 77, 7);
    // the figure painted where you stand while you are in the wall
    this.tex = figureTexture();
    this.fig = new THREE.Mesh(new THREE.PlaneGeometry(WALL.w, WALL.h), new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, alphaTest: 0.5, depthWrite: false }));
    this.fig.visible = false; this.fig.renderOrder = 3; S.add(this.fig);
    this.S = S; this.inWall = null; this.check = 0; this.walkT = 0;
    this.shift = new PlaneShift(well); this.retry = new StageRetry(well, 'wall');
    return { goal: [77, 7], door: [79.2, 7], checks: CHECKS, noRetry: true, ready: () => !this.inWall };
  },

  enter() { this.check = 0; this.shift.cancel(); this.retry.cancel(); },
  leave(well) { this.out(well, false); },
  pre(well, dt) { if (well.stage?.id === 'wall') this.shift.pre(dt); },

  /** What F would act on: a gold doorway, while you are not in the painting. */
  spots(well) {
    if (this.inWall || !this.S) return [];
    return Object.entries(PATHS).map(([id, P]) => ({ ref: `wall.${id}`, pos: this.S.at(P.in[0], P.in[1] + 2.6, WALL.face + 0.2), x: AT.x + P.in[0], y: AT.y + P.in[1] }));
  },
  use(well, ref) {
    if (!ref?.startsWith?.('wall.') || this.inWall) return false;
    const P = PATHS[ref.slice(5)]; if (!P) return false;
    this.inWall = P; this.shift.to(this.S.lane.z + WALL.plane, { lift: 2 }); well.verb('wallFace');
    return true;
  },
  /** Out of the painting (at its doorway out, or the stage left): the plane back on the boards, the body shown. */
  out(well, hop = true) {
    if (!this.inWall) return;
    this.inWall = null; if (this.fig) this.fig.visible = false;
    well.game.character?.setHidden?.(false);
    if (hop && this.S) this.shift.to(this.S.lane.z, { lift: 3.5 });
  },

  update(well, dt) {
    if (!this.S) return;
    if (well.stage?.id !== 'wall' || !well.here) { if (this.inWall) this.out(well, false); return; }
    const g = well.game, P = g.player, L = this.S.lane, ax = P.pos.x - AT.x, ay = P.pos.y - AT.y, W = this.inWall;
    this.retry.update(dt);
    if (W) {
      g.character?.setHidden?.(true);
      // the figure on the face, its two frames stepped while it runs
      const f = this.fig; f.visible = true;
      f.position.set(P.renderPos.x, P.renderPos.y + WALL.h / 2, L.z + WALL.face + 0.03); f.scale.x = well.frame.face >= 0 ? 1 : -1;
      this.walkT = P.grounded && Math.abs(P.vel.x) > 0.5 ? this.walkT + dt : 0;
      this.tex.offset.x = !P.grounded || Math.floor(this.walkT / WALL.frame) % 2 ? 0.5 : 0;
      if (this.retry.busy || this.shift.busy) return;
      if (Math.abs(ax - W.out[0]) < 0.5 && Math.abs(ay - W.out[1]) < 0.4) { this.out(well); this.check = W === PATHS.A ? 1 : 2; return; }
      const spiked = W.spikes.some(([x0, x1, top]) => ax > x0 - 0.2 && ax < x1 + 0.2 && Math.abs(ay - top) < 0.35);
      if (spiked) { well.hit(); this.retry.fall([W.in[0], W.in[1] + 0.1, L.z + WALL.plane], 'spike'); }
      else if (ay < -3) this.retry.fall([W.in[0], W.in[1] + 0.1, L.z + WALL.plane], 'fall');
      return;
    }
    if (!this.retry.busy && ay < -6) { const [x, y] = CHECKS[this.check]; this.shift.cancel(); this.retry.fall([x, y, L.z], 'fall'); }
  },

  clear(well) {
    if (this.inWall) well.game.character?.setHidden?.(false);
    this.inWall = null; this.tex?.dispose(); this.tex = null; this.fig = null; this.S = null;
  },
};
