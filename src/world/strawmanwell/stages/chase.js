// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL, THE CHASE (docs/plans/STRAWMANS-WELL.md 3.15): three stretches, each a way the stage pushes you along.
//   1. THE CHASE (Rayman's, Donkey Kong Country's): Strawman's giant marionette (chasemarionette.js) comes on from the left once you
//      start, its hands reaching for you; a jump, a slide under a beam and two crates on the way. It keeps close (it walks a little
//      slower than you run, and hurries when it falls back: rubber banding); caught, a hit and back to the checkpoint with it set
//      back behind you. A curtain drops behind you at the stretch's end and tangles its strings.
//   2. THE SCROLL (Super Mario Bros. 3's auto-scrolling stages): the camera moves on by itself over a run of platforms; left behind off
//      its left edge is a fall; its right edge holds you in.
//   3. THE BEAT (Super Mario 3D World's beat blocks, Bit.Trip Runner): blocks of two colours swap every two beats (the one about to go
//      blinks through the beat before), then two lifts that rise on the beat, the second from where the first stops.
// The beat is the stage's own metronome at BEAT.bpm on the fixed step's clock (`game.movers.time`, so the lifts and the blocks keep one
// time): the music clock (music/clock.js) is not read, since the Well's cue is Wanda's and not at this tempo; a lamp flashes the beat.
// Placeholder looks; the words are Espada's.
//
// Prior art: Rayman's and Donkey Kong Country's chases, Mario 3's auto-scroll (the screen's left edge as a hazard), Mario 3D World's
// beat blocks and Bit.Trip Runner's rhythm; the movers' shuttle (world/props/movers.js) for the lifts.
//
//   default export: a stage module (stagemods.js's contract)   CHASE   BEAT (their numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR } from '../stagekit.js';
import { AT } from '../layout.js';
import { SIDE_CAM } from '../wellframe.js';
import { scaffold, goalFlag, sign } from '../stages.js';
import { StageRetry, sideLook, halfWidth } from './depthlanes.js';
import { Marionette } from './chasemarionette.js';

/** The chase: where it starts (m), where the marionette comes from, its walk and its hurry (m/s per m it has fallen back past `lead`, to
 *  `hurry` more), the lead it keeps after a catch (m), the grace before it moves again (real s); the curtain; the scroll's start and end
 *  (m, the camera's middle) and its speed (m/s), how far inside its edges you are held (m). */
export const CHASE = { start: 8, from: -10, walk: 4.0, band: 0.15, hurry: 2.5, lead: 10, grace: 1.2, curtain: 57.2, stop: 53.5, scrollAt: 62, scrollTo: 104, scroll: 3.4, edge: 0.5 };
/** The beat: its tempo (beats a real minute), beats between the blocks' swaps, the lifts' rise (m) and its time (real s). */
export const BEAT = { bpm: 120, swap: 2, rise: 2.6, move: 0.2 };

const FLOORS = [[-1, 12, 0], [14, 24, 0], [26.5, 40, 0], [42, 66, 0], [69, 74, 1], [76, 79, 2], [81, 85, 1], [88, 94, 0], [96.5, 102, 1.5], [102, 118, 0], [139.8, 162, 5.2]];
const BLOCKS = [[18, 19, 0, 1], [31, 34, 1.45, 9], [47, 48, 0, 1], [52, 53, 0, 1], [91, 91.6, 0, 1.4]];
const BEATS = [[118.5, 121, 0], [122, 124.5, 1], [125.5, 128, 0], [129, 131.5, 1]]; // ([x0, x1, set]: set 0 solid on the even swaps)
const LIFTS = [[133, 135.4, 0, 0], [136.4, 138.8, BEAT.rise, 1]]; // ([x0, x1, bottom's top, offset in swaps])
const CHECKS = [[2, 0], [27, 0], [43, 0], [60, 0], [113, 0], [141, 5.2]];

export default {
  id: 'chase',
  build(well, S) {
    const len = S.lane.len;
    scaffold(S, len, { top: 20 });
    for (const [x0, x1, top] of FLOORS) S.box(x0, x1, top - 4, top, COLOR.boards);
    for (const [x0, x1, y0, y1] of BLOCKS) S.box(x0, x1, y0, y1, y0 > 0 ? COLOR.wing : COLOR.spool);
    sign(S, 'RUN!', 5, 4.2, 'it is right behind you'); sign(S, 'SLIDE', 32.5, 5.4, 'C at a run'); sign(S, 'KEEP UP', 64, 4.4, 'the stage moves on by itself');
    sign(S, 'BEAT BLOCKS', 112, 4.4, 'they swap every two beats'); sign(S, 'BEAT LIFTS', 136, 7.6, 'they rise on the beat');
    // the curtain, up in the loft until it drops behind you
    this.curtain = S.box(CHASE.curtain - 0.25, CHASE.curtain + 0.25, 0, 12, COLOR.mark, { own: true, d: 2.6 });
    this.curtain.collider?.setEnabled(false); this.curtainY = this.curtain.mesh.position.y; this.curtain.mesh.position.y += 12;
    // the beat: its blocks, its lamp, its lifts
    this.beats = BEATS.map(([x0, x1, set]) => {
      const r = S.box(x0, x1, -0.4, 0, set ? 0x3a6ad0 : 0xd04a3a, { own: true });
      r.mesh.material.transparent = true;
      return { ...r, x0: AT.x + x0, x1: AT.x + x1, top: AT.y, set, on: true };
    });
    this.lamp = S.box(114.6, 115.4, 2.4, 3.2, COLOR.gold, { own: true, collide: false, d: 0.8 });
    this.lifts = [];
    this.S = S; this.retry = new StageRetry(well, 'chase');
    this.puppet = new Marionette(S.group);
    this.reset(well);
    goalFlag(S, 154, 5.2);
    return { goal: [154, 5.2], door: [156.5, 5.2], checks: CHECKS, noRetry: true };
  },

  /** The stage as it starts: the marionette off to the left, the curtain up, the scroll waiting. */
  reset() {
    this.phase = 'wait'; this.mx = CHASE.from; this.grace = 0; this.check = 0;
    this.scroll = { on: false, x: 0, done: false };
    if (this.curtain) { this.curtain.collider?.setEnabled(false); this.curtain.mesh.position.y = this.curtainY + 12; }
    this.puppet?.place(AT.x + this.mx, AT.y, this.S.lane.z - 0.6);
  },
  enter(well) { this.reset(well); this.retry.cancel(); this.lifts_(well, true); },
  leave(well) { this.retry?.cancel(); this.lifts_(well, false); },

  /** The beat's lifts: the movers' shuttles, laid while the stage is in play and taken away after. */
  lifts_(well, on) {
    const g = well.game, M = g.movers;
    for (const m of this.lifts) this.dropMover(g, m);
    this.lifts = [];
    if (!on || !M?.shuttle || !this.S) return;
    const swapT = (BEAT.swap * 60) / BEAT.bpm, z = this.S.lane.z;
    for (const [x0, x1, top, off] of LIFTS) {
      const m = M.shuttle({ pos: [AT.x + (x0 + x1) / 2, AT.y + top - 0.2, z], to: [0, BEAT.rise, 0], move: BEAT.move, dwell: swapT - BEAT.move, offset: off * swapT });
      m.box([x1 - x0, 0.4, 3], COLOR.gold, [0, 0, 0]); m.snap(); this.lifts.push(m);
    }
  },
  dropMover(g, m) {
    const M = g.movers, i = M?.list.indexOf(m); if (i >= 0) M.list.splice(i, 1);
    g.scene.remove(m.group); m.group.traverse((o) => o.geometry?.dispose?.());
    try { g.physics.world.removeRigidBody(m.body); } catch { /* (gone already) */ }
  },

  /** After the step: the scroll's right edge holds the body in. */
  post(well) {
    if (well.stage?.id !== 'chase' || !this.scroll?.on) return;
    const P = well.game.player, hi = this.scroll.x + halfWidth(well) - 0.8;
    if (P.pos.x > hi) { P.pos.x = hi; P.prevPos.x = Math.min(P.prevPos.x, hi); P.vel.x = Math.min(0, P.vel.x); P.body.setNextKinematicTranslation({ x: P.pos.x, y: P.pos.y, z: P.pos.z }); }
  },

  update(well, dt) {
    if (!this.S) return;
    const here = well.stage?.id === 'chase';
    this.beat_(well, here);
    this.puppet.update(dt, { run: here && this.phase === 'chase' && this.grace <= 0 ? this.speed || CHASE.walk : 0, tangled: this.phase === 'tangled' });
    if (!here) return;
    const g = well.game, P = g.player, ax = P.pos.x - AT.x, ay = P.pos.y - AT.y, L = this.S.lane;
    this.retry.update(dt);
    if (this.retry.busy) return;
    if (P.grounded) CHECKS.forEach(([x, y], i) => { if (i > this.check && ax >= x - 0.5 && Math.abs(ay - y) < 1.5) this.check = i; });
    // 1. the chase
    if (this.phase === 'wait' && ax > CHASE.start) { this.phase = 'chase'; well.verb('chase'); }
    if (this.phase === 'chase') {
      if ((this.grace -= dt) <= 0) {
        const gap = ax - this.mx; this.speed = CHASE.walk + THREE.MathUtils.clamp((gap - CHASE.lead) * CHASE.band, 0, CHASE.hurry);
        this.mx = Math.min(this.mx + this.speed * dt, CHASE.stop);
      }
      this.puppet.place(AT.x + this.mx, AT.y, L.z - 0.6);
      if (ax > CHASE.curtain + 1.8) { this.phase = 'tangled'; this.curtain.collider?.setEnabled(true); }
      else if (P.pos.x < this.puppet.reachX && this.grace <= 0) { well.hit(); this.caught(well); return; }
    }
    if (this.phase !== 'wait') { const m = this.curtain.mesh; m.position.y += (this.curtainY + (this.phase === 'tangled' ? 0 : 12) - m.position.y) * Math.min(1, dt * 6); }
    if (this.phase === 'tangled' && this.mx < CHASE.stop) { this.mx = Math.min(CHASE.stop, this.mx + CHASE.walk * dt); this.puppet.place(AT.x + this.mx, AT.y, L.z - 0.6); }
    // 2. the scroll
    const S = this.scroll;
    if (!S.on && !S.done && ax > CHASE.scrollAt) { S.on = true; S.x = well.frame.cam.x; well.verb('autoscroll'); }
    if (S.on) {
      S.x += CHASE.scroll * dt;
      if (S.x >= AT.x + CHASE.scrollTo) { S.on = false; S.done = true; }
      else if (P.pos.x < S.x - halfWidth(well) + CHASE.edge) { S.on = false; this.retry.fall([60, 0, L.z], 'scroll'); return; }
    }
    if (ay < -6) this.fallBack(well, 'fall');
  },

  caught(well) {
    const [x, y] = CHECKS[this.check];
    this.retry.fall([x, y, this.S.lane.z], 'chase', () => { this.mx = x - CHASE.lead; this.grace = CHASE.grace; this.puppet.place(AT.x + this.mx, AT.y, this.S.lane.z - 0.6); });
  },
  fallBack(well, cause) {
    const [x, y] = CHECKS[this.check];
    if (this.phase === 'chase') return this.caught(well);
    if (this.check === 3) { this.scroll.on = false; this.scroll.done = false; }
    this.retry.fall([x, y, this.S.lane.z], cause);
  },

  /** The beat: the blocks' set solid now (swapping every BEAT.swap beats, the one about to go blinking the beat before), the lamp. */
  beat_(well, here) {
    const g = well.game, P = g.player, t = g.movers?.time ?? g.events?.time ?? 0, beat = (t * BEAT.bpm) / 60;
    const swaps = Math.floor(beat / BEAT.swap), into = beat - swaps * BEAT.swap, warn = into > BEAT.swap - 1 && Math.floor(into * 8) % 2 === 0;
    for (const B of this.beats) {
      const want = (swaps % 2) === B.set;
      if (want && !B.on) { const inside = P.pos.x + 0.3 > B.x0 && P.pos.x - 0.3 < B.x1 && P.pos.y < B.top - 0.05 && P.pos.y + 1.7 > B.top - 0.4 && Math.abs(P.pos.z - this.S.lane.z) < 2; if (!inside) { B.on = true; B.collider?.setEnabled(true); } }
      else if (!want && B.on) { B.on = false; B.collider?.setEnabled(false); }
      B.mesh.material.opacity = B.on ? (warn ? 0.55 : 1) : 0.18;
      if (here && B.on && P.grounded && P.pos.x > B.x0 && P.pos.x < B.x1 && Math.abs(P.pos.y - B.top) < 0.15) well.verb('beat');
    }
    const flash = 1 - (beat % 1); this.lamp.mesh.material.emissive?.setHex(0xffd36a); if (this.lamp.mesh.material.emissiveIntensity != null) this.lamp.mesh.material.emissiveIntensity = flash * flash * 1.6;
    if (here) for (const m of this.lifts) if (P.platform === m) well.verb('beat');
  },

  /** The scroll's own camera: its middle where the scroll is, the frame's height and depth. */
  camera(well) {
    const F = well.frame; if (!this.scroll?.on || !F.on || !F.spec || well.game.god?.controlling) return;
    F.cam.x = this.scroll.x; sideLook(well, this.scroll.x, F.cam.y, F.spec.z, F.spec.z + SIDE_CAM.dist);
  },

  clear(well) { this.lifts_(well, false); this.puppet?.dispose(); this.puppet = null; this.S = null; this.beats = []; },
};
