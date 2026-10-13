// ---------------------------------------------------------------------------------------
// REJECTION, AT RUN TIME (docs/plans/GODHAND.md section 10; the numbers and the step model: progress/rejection.js). Hears the hand's
// acts (god.scoop, god.pour, god.shape, god.carve, god.miracle, god.epic, god.throw), keeps the island's heat, and every so often
// sends the step's answer: slip jellies and Lantern Wisps (the Figments the island has), spawned past the edge of the hand's view and
// coming for your Pneuka Jar (or the Courier, the hand away). A step's change is an event (god.rejection {step, by:'environment'});
// the fifth step's answer put down by you is god.rejection.beaten, and clears the heat. A rest at a Shrine clears it too.
// Placeholders: the answer is the island's ordinary Figments, stronger; the island's own (an antibody Figment) is Espada's and
// Calissa's to name and dress.
//
// Prior art: GTA's wanted level; Left 4 Dead's AI director (spawns paced, out of sight, never on top of you).
//
//   game.rejection = new Rejection(game)   .heat  .step   .update(dt)   .clear(why)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { REJECTION, heatOf, stepOf } from '../progress/rejection.js';
import { stream } from '../core/rng.js';

const ACTS = ['god.scoop', 'god.pour', 'god.shape', 'god.carve', 'god.sculpt', 'god.miracle', 'god.epic', 'god.throw'];
const rand = stream('godhand/rejection');

export class Rejection {
  constructor(game) {
    this.game = game;
    this.heat = 0; this.step = 0; this.quiet = 0; this.wait = REJECTION.every * 0.5;
    this.sent = []; // (the island's answer still alive)
    this.boss = null;
    for (const n of ACTS) game.events?.on(n, (e) => this.feel(n, e));
    game.events?.on('shrine.rest', () => this.clear('rest'));
  }

  feel(name, e) {
    const h = heatOf(name, e);
    if (h <= 0) return;
    this.heat += h; this.quiet = 0;
  }

  update(dt) {
    const R = REJECTION;
    this.quiet += dt;
    if (this.quiet > R.quiet && this.heat > 0) this.heat = Math.max(0, this.heat - R.ebb * dt);
    const s = stepOf(this.heat, this.step);
    if (s !== this.step) { this.step = s; this.game.events?.emit('god.rejection', { step: s, by: 'environment' }); }
    if (this.sent.length) this.sent = this.sent.filter((c) => c.alive && !c.disposed);
    if (this.boss && (!this.boss.alive || this.boss.disposed)) {
      const won = this.boss.downBy === 'courier'; // (put down by you, not tidied away)
      this.boss = null;
      if (won) { this.game.events?.emit('god.rejection.beaten', { by: 'courier' }); this.clear('beaten'); return; }
    }
    if (this.step < 1) return;
    this.wait -= dt;
    if (this.wait > 0) return;
    this.wait = R.every;
    this.answer(R.answer[this.step]);
  }

  /** Where the answer comes from: past the edge of the hand's view (or 22 m from the Courier), on ground. */
  origin() {
    const g = this.game, god = g.god;
    const at = god?.active ? god.jar.pos : g.player?.position;
    if (!at) return null;
    const a = rand() * Math.PI * 2, d = god?.active ? 26 : 22;
    const p = new THREE.Vector3(at.x + Math.cos(a) * d, at.y + 4, at.z + Math.sin(a) * d);
    const y = g.matter?.field?.contains?.(p.x, p.z) ? g.matter.field.groundAt(p.x, p.z) : null;
    p.y = y != null && Number.isFinite(y) ? y + 0.5 : at.y + 0.5;
    return p;
  }

  answer(A) {
    const g = this.game, R = REJECTION;
    if (!A || this.sent.length >= R.cap) return;
    const home = this.origin(); if (!home) return;
    const stash = R.stash[this.step] || 0;
    const mark = (c) => { if (!c) return; c.emo = R.emo; c.stash = (c.stash || 0) + stash; c.rejection = this.step; this.sent.push(c); return c; };
    const room = () => this.sent.length < R.cap;
    for (let i = 0; i < (A.jelly || 0) && room(); i++) {
      const at = home.clone().add(new THREE.Vector3((rand() - 0.5) * 6, 0, (rand() - 0.5) * 6));
      const c = mark(g.jellies?.spawn?.(at, { cls: A.cls || 0, size: A.size ?? null, once: true }));
      if (c && A.boss && !this.boss) this.boss = c;
    }
    for (let i = 0; i < (A.wisp || 0) && room(); i++) mark(g.wisps?.spawn?.(home.clone().add(new THREE.Vector3((rand() - 0.5) * 8, 1, (rand() - 0.5) * 8))));
    g.events?.emit('god.rejection.answer', { step: this.step, n: this.sent.length, by: 'environment' });
  }

  /** The heat cleared (a rest, the answer beaten): the island's answer still about stays, and is still worth fighting. */
  clear(why) {
    this.heat = 0; this.wait = REJECTION.every * 0.5;
    if (this.step) { this.step = 0; this.game.events?.emit('god.rejection', { step: 0, why, by: 'environment' }); }
  }
}
