// ---------------------------------------------------------------------------------------
// THE COURIER'S SQUASH: a little weight on a hard landing (the owner, 2026-10-10: "a small amount of squash and stretch on the Courier for
// settling after impacts like the plunge attack, just to convey a little more sense of weight"). A landing past HARD.from m/s (where the
// hard landing begins: a 1.9 m drop) presses the drawn body down a few percent and out as much as keeps its volume (y down, x and z out
// by 1/sqrt), on a critically damped spring: it sinks for 0.05 real s and settles back with no overshoot, a settle and never a bounce,
// under half a percent left at 0.3 s. How far is how hard: the plunge's 26 m/s the most (SQUASH.most), the hard landing's 9 m/s
// SQUASH.least of it, between them in line. Every landing comes by one number, the speed it landed at (`player.landedOut`): the
// plunge's, a slam's, a long fall's.
//
// The drawn body only. It is laid on after everything has read the pose this frame (the end of the tick: the hinges, rom.js, the IK, the
// tools' hands all done on the true shape) and taken off before anything reads it the next (`lift`): the capsule, the camera, every
// collision and every bone a system measures see the body as posed. The squash is the root's scale about the feet, in the body's own
// frame (on a slope it squashes along the body). What the hands carry in the world (a drawn tool, the psygun: scene children placed
// from a hand) is moved with the hand and keeps its shape: a blade is steel, not clay. The vessel's cracks and glazes are on the body
// and go with it, unchanged. Never in first person (the view's own arms would bob).
//
// Prior art: the twelve principles' squash and stretch (Thomas and Johnston, The Illusion of Life: the volume kept, the shape giving
// to the force); Super Mario 64's landing squash (Mario pressed down a frame or two and back); Ratchet & Clank's (a small squash on
// every heavy landing, scaled by the fall); the critically damped spring of game feel (Daniel Holden's "Spring-It-On", the closed form
// stepped exactly at any frame time).
//
//   const sq = new CourierSquash(game, character, { carried: () => [objects placed from a hand] })
//   sq.impact(k)      a hit to settle from, 0..1 (the strongest in play wins)
//   sq.press(dt, P)   the end of the frame: the landing read, the spring stepped, the shape laid on
//   sq.lift()         the start of the next: the true shape back before anything reads it
//   sq.shape          the drawn body's scale now (x, y, z)   sq.amount  how far it is pressed (0 .. SQUASH.most)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { HARD } from './airborne.js';

/** `most` the deepest press (the plunge's: 6 % of the height, the width 3 % out), `least` the share of it a landing at `from` m/s gets,
 *  all of it at `full` m/s (the plunge's fall); `omega` the spring's rate (/s): the press deepest at 1/omega s, settled by 0.3 s. */
export const SQUASH = { most: 0.06, least: 0.3, from: HARD.from, full: 26, omega: 20 };

const _inv = new THREE.Matrix4(), _p = new THREE.Vector3();

export class CourierSquash {
  constructor(game, ch, { carried = () => [] } = {}) {
    this.game = game; this.ch = ch; this.carried = carried;
    this.s = 0; this.v = 0; this.on = false; this.moved = [];
    this.shape = new THREE.Vector3(1, 1, 1);
  }
  get amount() { return Math.max(0, this.s); }

  /** A hit to settle from: `k` 0..1 of the deepest press. A lighter one while a deeper is in play changes nothing. */
  impact(k) {
    const a = SQUASH.most * THREE.MathUtils.clamp(k, 0, 1), v = a * SQUASH.omega * Math.E; // (from rest, the press peaks at a)
    if (v > this.v) this.v = v;
  }

  /** The true shape back: the root's scale, and what the hands carry where its owner put it. */
  lift() {
    if (!this.on) return;
    this.on = false;
    const root = this.ch.root;
    root.scale.set(1, 1, 1); root.updateMatrixWorld(true);
    for (const [o, d] of this.moved) { o.position.sub(d); o.updateMatrixWorld(true); }
    this.moved.length = 0;
  }

  /** The end of the frame: a landing read from `P.landedOut`, the spring stepped (exactly: critically damped), the shape laid on. */
  press(dt, P) {
    const v = P?.landedOut || 0;
    if (v >= SQUASH.from) this.impact(SQUASH.least + (1 - SQUASH.least) * THREE.MathUtils.clamp((v - SQUASH.from) / (SQUASH.full - SQUASH.from), 0, 1));
    const w = SQUASH.omega, e = Math.exp(-w * dt), b = this.v + w * this.s;
    this.s = (this.s + b * dt) * e; this.v = (this.v - w * b * dt) * e;
    if (Math.abs(this.s) < 1e-4 && Math.abs(this.v) < 1e-3) { this.s = 0; this.v = 0; }
    if (!this.s || (P?.fpWeight ?? 0) > 0.5) { this.shape.set(1, 1, 1); return; }
    const sy = 1 - THREE.MathUtils.clamp(this.s, -SQUASH.most / 2, SQUASH.most), sxz = 1 / Math.sqrt(sy);
    this.shape.set(sxz, sy, sxz);
    // what the hands carry follows the hand: its point in the body's frame, pressed, back to the world (the root's frame as posed)
    const root = this.ch.root, scene = this.game.scene;
    _inv.copy(root.matrixWorld).invert();
    for (const o of new Set(this.carried())) {
      if (!o?.visible || o.parent !== scene) continue;
      const d = _p.copy(o.position).applyMatrix4(_inv).multiply(this.shape).applyMatrix4(root.matrixWorld).sub(o.position).clone();
      o.position.add(d); this.moved.push([o, d]);
    }
    root.scale.copy(this.shape);
    this.on = true;
  }
}
