// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL, THE SCRIPT (docs/plans/STRAWMANS-WELL.md 3.11): rules written on the stage (Baba Is You) and lines drawn to stand on
// (Crayon Physics, Kirby: Canvas Curse). The words are blocks (scriptwords.js): three in a line make a rule while the line stands, and
// the stage obeys it here. Four beats:
//   1. WALL IS SOLID stands on a shelf, and the wall with it: push the row off the shelf's end and the wall is a painted ghost
//   2. DOOR IS (a gap) OPEN: over the words, round behind OPEN, push it home and the door goes up
//   3. YOU IS (a gap) FLOAT on a pillar over a chasm too wide to jump: push FLOAT home, and you fall as slowly as a leaf
//   4. a ledge too high, and the goal's flag up out of reach: draw lines to climb (hold RMB, move the mouse: scriptline.js), then push
//      HERE home on the ledge: GOAL IS HERE brings the flag down to the word
// What each rule does is a modifier with its source in plain sight, the words: WALL IS SOLID gives the wall its body, DOOR IS OPEN takes
// the door's, YOU IS FLOAT caps your fall (the core movement's own fall, slowed after each step), GOAL IS HERE moves the goal. NOT
// (NOUN IS NOT PROPERTY) is read too. F at a lectern puts every word back. A fall is the room's retry.
// Placeholder looks; the words read plain English from SAY (scriptwords.js) until Espada's neuralese.
//
// Prior art: Baba Is You's rules (a rule is its words, standing), Crayon Physics Deluxe and Kirby: Canvas Curse (a drawn line to stand on).
//
//   default export: a stage module (stagemods.js's contract)   SCRIPT (its numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR } from '../stagekit.js';
import { AT } from '../layout.js';
import { scaffold, goalFlag, sign } from '../stages.js';
import { Words, WORD } from './scriptwords.js';
import { DrawnLines } from './scriptline.js';

/** Its numbers: YOU IS FLOAT's fall (m/s at most), how fast the door goes up (1/s), where the goal's flag stands with no GOAL IS HERE. */
export const SCRIPT = { float: 1.0, door: 6, rise: 9, goalHome: [67.5, 9.3] };
const BRICK = 0x8a5a4a;
const CHECKS = [[2, 0], [17, 0], [33, 1.5], [49, 0], [59, 5]];

export default {
  id: 'script',
  build(well, S) {
    const len = S.lane.len;
    scaffold(S, len, { top: 20 });
    S.box(-1, 39.5, -4, 0, COLOR.boards); S.box(48, 71, -4, 0, COLOR.boards); // (the chasm: 39.5 to 48)
    S.box(5, 10, 0, 1.2, COLOR.spool); // (1: the shelf)
    S.box(19, 20, 0, 1, COLOR.spool); // (2: the step DOOR IS stands against)
    S.box(32.5, 34, 0, 1.5, COLOR.spool); S.box(34, 39.5, -4, 3, COLOR.spool); S.box(34, 34.25, 3, 3.4, COLOR.pin); // (3: the pillar, its step, and a curb so its row is never pushed off)
    S.box(58, 71, 0, 5, COLOR.boards); S.box(58, 58.25, 5, 5.4, COLOR.pin); S.box(66.5, 68.5, 8.8, 9.3, COLOR.pin); // (4: the ledge and its curb, and the flag's perch out of reach)
    // the things the rules are about: the wall and the door (their own meshes and bodies)
    this.wall = S.box(14, 15, 0, 9, BRICK, { own: true });
    this.door = S.box(30, 30.6, 0, 9, COLOR.door, { own: true }); this.door.y0 = this.door.mesh.position.y; this.door.k = 0;
    for (const m of [this.wall.mesh, this.door.mesh]) m.material.transparent = true;
    // the words
    const W = this.words = new Words(well, S);
    W.add('WALL', 6.6, 1.2); W.add('IS', 7.6, 1.2); W.add('SOLID', 8.6, 1.2);
    W.add('DOOR', 20.5, 0); W.add('IS', 21.5, 0); W.add('OPEN', 25.5, 0);
    W.add('YOU', 35.5, 3); W.add('IS', 36.5, 3); W.add('FLOAT', 37.9, 3);
    W.add('GOAL', 61, 5); W.add('IS', 62, 5); W.add('HERE', 65, 5);
    this.lines = new DrawnLines(well, S);
    // the signs and the lecterns
    sign(S, 'THE SCRIPT', 3, 5.2, 'three words make a rule'); sign(S, 'PUSH', 7.6, 4.2, 'a word off its line breaks the rule');
    sign(S, 'BEHIND IT', 25.5, 4.2, 'push a word from either side'); sign(S, 'FLOAT', 36.6, 6.4, 'then step off');
    sign(S, 'DRAW', 52, 4.2, 'hold RMB, no tool out, and move the mouse'); sign(S, 'GOAL IS HERE', 63, 8.2, 'the goal comes to the word');
    for (const [x, y] of [[1, 0], [17.5, 0], [50, 0]]) S.box(x - 0.3, x + 0.3, y, y + 1.1, COLOR.felt, { collide: false, dz: -0.8, d: 0.5 });
    this.flag = goalFlag(S, ...SCRIPT.goalHome); this.flagHome = this.flag.post.position.clone(); this.flagDelta = this.flag.flag.position.clone().sub(this.flagHome);
    this.goal = [...SCRIPT.goalHome]; this.S = S; this.well = well; this.rules = new Set(); this.fresh = true;
    return { goal: this.goal, door: [69.5, 5], checks: CHECKS };
  },

  enter() { this.words.reset(); this.fresh = true; },
  leave() { },
  spots() {
    if (!this.S) return [];
    return [[1, 0], [17.5, 0], [50, 0]].map(([x, y]) => ({ ref: 'script.reset', pos: this.S.at(x, y + 1.6, -0.8), x: AT.x + x, y: AT.y + y }));
  },
  use(well, ref) { if (ref !== 'script.reset') return false; this.words.reset(); this.fresh = true; return true; },

  pre(well, dt) { if (well.stage?.id === 'script' && this.words) this.words.pre(dt); },
  /** After the step: YOU IS FLOAT caps the fall. */
  post(well) {
    if (well.stage?.id !== 'script' || !this.floating) return;
    const P = well.game.player; if (!P.grounded && P.vel.y < -SCRIPT.float) P.vel.y = -SCRIPT.float;
  },

  update(well, dt) {
    if (!this.S) return;
    const here = well.stage?.id === 'script';
    this.lines.update(dt);
    if (!here) return;
    const P = well.game.player, R = this.words.read(), has = R.has;
    // a rule newly made (by your pushing: not the words as they stood when you came in)
    for (const r of R.rules) if (!this.rules.has(r) && !this.fresh) well.verb('rules');
    this.rules = R.rules; this.fresh = false;
    this.words.render(dt);
    // WALL IS SOLID: the wall's body (never set solid round you)
    const solid = has('wall.solid') && !has('wall.!solid') && !has('wall.open');
    this.body(this.wall, solid, P); this.wall.mesh.material.opacity = solid ? 1 : 0.28;
    // DOOR IS OPEN: the door up out of the way
    const open = has('door.open') || has('door.!solid');
    const D = this.door; D.k += ((open ? 1 : 0) - D.k) * Math.min(1, dt * SCRIPT.door);
    D.mesh.position.y = D.y0 + D.k * SCRIPT.rise; this.body(D, D.k < 0.4, P);
    // YOU IS FLOAT
    this.floating = has('you.float') && !has('you.!float');
    // GOAL IS HERE: the goal where the word HERE stands
    const at = R.lines.find((l) => l.rule === 'goal.here')?.last;
    if (at) { this.goal[0] = at.pos.x - AT.x; this.goal[1] = at.pos.y - WORD.size / 2 - AT.y; } else { this.goal[0] = SCRIPT.goalHome[0]; this.goal[1] = SCRIPT.goalHome[1]; }
    const to = at ? new THREE.Vector3(at.pos.x + 0.75, at.pos.y - WORD.size / 2 + 1.5, this.flagHome.z) : this.flagHome; // (the post's middle: 1.5 m over its foot)
    this.flag.post.position.lerp(to, Math.min(1, dt * 6)); this.flag.flag.position.copy(this.flag.post.position).add(this.flagDelta);
  },
  /** A thing's body on or off; never on round the Courier (it waits until you are clear). */
  body(T, on, P) {
    if (on === T.on) return;
    if (on) { const b = new THREE.Box3().setFromObject(T.mesh); if (P.pos.x + 0.3 > b.min.x && P.pos.x - 0.3 < b.max.x && P.pos.y + 1.7 > b.min.y && P.pos.y < b.max.y) return; }
    T.on = on; T.collider?.setEnabled(on);
  },

  clear() { this.words?.clear(); this.lines?.clear(); this.words = null; this.lines = null; this.S = null; },
};
