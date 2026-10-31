// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL, THE MAZE (docs/plans/STRAWMANS-WELL.md 3.17): the day's maze, Spelunky's 4 x 4 grid of rooms stitched each game day into
// one run with a guaranteed way from the top-left entrance down to the exit (mazerooms.js lays it from `today()`, core/calendar.js, so the
// same game day is the same maze for everyone; the next game day's is another, laid when the room is next built). Its rooms ask the
// earlier stages' verbs: the Run's thin floors (one-way, S + Space through: mechanics.js), springs, pins, steps and drops. Pins are a hit
// and back to the room you came into last; each room the path enters is a checkpoint. The maze stands up along the lane, 41 m across and
// 28 m tall (its row in layout.js), the side camera's band all of it. The ? spools, ladders and dummies of the earlier stages are not in
// its templates yet (the Run's springs and the Stomp's spools do not ask which lane they are in, so the maze keeps its own springs).
// Placeholder looks; the words are Espada's.
//
// Prior art: Spelunky (the daily seeded run, the 4 x 4 grid of templates, the path that only goes along and down), Subspace Emissary's
// Great Maze (the stages' rooms revisited as one).
//
//   default export: a stage module (stagemods.js's contract)   MAZE_AT (where the grid stands in the lane)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR } from '../stagekit.js';
import { AT } from '../layout.js';
import { MECH } from '../mechanics.js';
import { today } from '../../../core/calendar.js';
import { scaffold, goalFlag, sign } from '../stages.js';
import { StageRetry } from './depthlanes.js';
import { mazeOf, MAZE } from './mazerooms.js';

/** Where the grid's first tile stands along the lane (m), the spring pad's height (m), and what in a room is its own colour. */
export const MAZE_AT = { x: 2, pad: 0.26 };
const ROCK = 0x5a4a3a;

export default {
  id: 'maze',
  build(well, S) {
    const len = S.lane.len, X = (x) => AT.x + x, Y = (y) => AT.y + y, ox = MAZE_AT.x;
    scaffold(S, len, { top: 32 });
    const day = today(), M = this.maze = mazeOf(day);
    // the tiles, merged along each row into runs (a box a run of rock, a thin floor a run of '=')
    const onPath = new Set(); for (const p of M.path) for (let ly = 0; ly < M.h; ly++) for (let lx = 0; lx < M.w; lx++) onPath.add(`${p.c * M.w + lx},${(M.rows - 1 - p.r) * M.h + ly}`);
    this.springs = []; this.pins = [];
    for (let ty = 0; ty < M.H; ty++) {
      for (let tx = 0; tx < M.W;) {
        const ch = M.T[ty][tx]; let n = 1;
        if (ch === '#' || ch === '=') while (tx + n < M.W && M.T[ty][tx + n] === ch && onPath.has(`${tx},${ty}`) === onPath.has(`${tx + n},${ty}`)) n++;
        const x0 = ox + tx, x1 = x0 + n;
        if (ch === '#') S.box(x0, x1, ty - 1, ty, onPath.has(`${tx},${ty}`) ? COLOR.boards : ROCK, { outline: false });
        else if (ch === '=') { const { collider } = S.box(x0, x1, ty - 0.18, ty, COLOR.thin, { d: 2.6 }); well.mech.thin(collider, X(x0), X(x1), Y(ty)); }
        else if (ch === '^') { const pad = S.box(x0 + 0.1, x1 - 0.1, ty - 1, ty - 1 + MAZE_AT.pad, COLOR.spring, { own: true }); this.springs.push({ x0: X(x0 + 0.05), x1: X(x1 - 0.05), top: Y(ty - 1 + MAZE_AT.pad), mesh: pad.mesh, squash: 0 }); }
        else if (ch === 'x') { for (const dx of [0.15, 0.5]) S.box(x0 + dx, x0 + dx + 0.3, ty - 1, ty - 0.55, COLOR.pin, { collide: false, outline: false }); this.pins.push([x0, x1, ty - 1]); }
        tx += n;
      }
    }
    const [sx, sy] = M.start, [gx, gy] = M.exit;
    sign(S, 'THE MAZE', ox + 6, M.path[0] ? sy + 4.2 : 4, `game day ${day}: down to the flag`);
    goalFlag(S, ox + gx, gy);
    this.checks = M.path.map((p) => [ox + p.enter[0], p.enter[1]]);
    this.S = S; this.retry = new StageRetry(well, 'maze'); this.room = 0; this.springCd = 0;
    return { goal: [ox + gx, gy], door: [ox + M.door[0], M.door[1]], checks: [[ox + sx, sy]], noRetry: true };
  },

  /** In at the entrance: the top-left room (the lane's start is on the boards at its foot; the maze starts at its top). */
  enter(well) {
    const P = well.game.player, [x, y] = this.checks[0];
    P.moveTo(new THREE.Vector3(AT.x + x, AT.y + y + 0.05, this.S.lane.z), new THREE.Vector3()); well.frame.snapCam = true;
    this.room = 0; this.retry.cancel();
  },

  /** After the step: a spring landed on throws you up (the Run's, MECH.spring; kept here so it asks for this lane). */
  post(well, dt) {
    if (well.stage?.id !== 'maze' || !this.S) return;
    const P = well.game.player; this.springCd -= dt;
    if (!P.grounded || this.springCd > 0 || Math.abs(P.pos.z - this.S.lane.z) > 0.5) return;
    for (const S of this.springs) if (P.pos.x > S.x0 - 0.2 && P.pos.x < S.x1 + 0.2 && Math.abs(P.pos.y - S.top) < 0.2) {
      this.springCd = 0.35; P.impulse(new THREE.Vector3(0, MECH.spring - Math.max(0, P.vel.y), 0), 'spring'); P.airJumps = Math.max(P.airJumps, 1);
      S.squash = 1; well.verb('spring'); break;
    }
  },

  update(well, dt) {
    if (!this.S) return;
    for (const S of this.springs) if (S.squash > 0) { S.squash = Math.max(0, S.squash - dt * 4); S.mesh.scale.y = 1 - 0.5 * S.squash; }
    if (well.stage?.id !== 'maze') return;
    const P = well.game.player, M = this.maze, ox = MAZE_AT.x, ax = P.pos.x - AT.x - ox, ay = P.pos.y - AT.y;
    this.retry.update(dt);
    if (this.retry.busy) return;
    // the room you are in: a checkpoint the first time the path enters it, and the maze's verb from the second
    const c = Math.floor(ax / M.w), r = M.rows - 1 - Math.floor(ay / M.h), i = M.path.findIndex((p) => p.c === c && p.r === r);
    if (i > this.room && P.grounded) { this.room = i; well.verb('seeded'); }
    const back = () => { const [x, y] = this.checks[this.room]; return [x, y, this.S.lane.z]; };
    const pinned = this.pins.some(([x0, x1, y]) => P.pos.x - AT.x > x0 - 0.15 && P.pos.x - AT.x < x1 + 0.15 && ay < y + 0.45 && ay > y - 0.3);
    if (pinned) { well.hit(); this.retry.fall(back(), 'spike'); }
    else if (ay < -4) this.retry.fall(back(), 'fall');
  },

  clear() { this.S = null; this.springs = []; this.pins = []; },
  /** The day's maze as rows of tiles, top first (for a look at it in a test). */
  map() { return this.maze?.tiles ?? []; },
  get size() { return MAZE; },
};
