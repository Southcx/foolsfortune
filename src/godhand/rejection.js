// ---------------------------------------------------------------------------------------
// REJECTION, AT RUN TIME (docs/plans/GODHAND.md section 10; the numbers and the Dissonance Level model: progress/rejection.js). Hears the hand's
// acts (god.scoop, god.pour, god.shape, god.carve, god.miracle, god.epic, god.throw), keeps the island's dissonance, and every so
// often sends its Dissonance Level's answer: slip jellies and Lantern Wisps (the Figments the island has), spawned past the edge of the hand's view and
// coming for your Pneuka Jar (or the Courier, the hand away). A Dissonance Level's change is an event (god.dissonance {level,
// by:'environment'}); the fifth level's answer put down by you is god.rejection.beaten, and clears the dissonance. A rest at a Shrine clears it too.
// Placeholders: the answer is the island's ordinary Figments, stronger; the island's own (an antibody Figment) is Espada's and
// Calissa's to name and dress.
//
// Prior art: GTA's wanted level; Left 4 Dead's AI director (spawns paced, out of sight, never on top of you).
//
//   game.rejection = new Rejection(game)   .dissonance  .level (the Dissonance Level, 0..5)   .update(dt)   .clear(why)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { REJECTION, dissonanceOf, dissonanceLevelOf } from '../progress/rejection.js';
import { GOD_POWERS, dissonanceScale } from '../progress/godpowers.js';
import { stream } from '../core/rng.js';

// (every power that works on the island; seeing (Strata, Course, Read) is not an act on it)
const SEEN = new Set(['strata', 'course', 'read', 'telekinesis', 'miracle']);
const ACTS = ['god.pour', 'god.miracle', 'god.epic', 'god.throw', ...Object.keys(GOD_POWERS).filter((id) => !SEEN.has(id)).map((id) => `god.${id}`)];
const domainOf = (name, e) => (name === 'god.epic' ? e.domain : name === 'god.pour' ? 'psychokinesis' : name === 'god.throw' ? 'psychokinesis' : name === 'god.miracle' ? 'spellscription' : GOD_POWERS[name.slice(4)]?.domain);
const rand = stream('godhand/rejection');

export class Rejection {
  constructor(game) {
    this.game = game;
    this.dissonance = 0; this.level = 0; this.quiet = 0; this.wait = REJECTION.every * 0.5;
    this.sent = []; // (the island's answer still alive)
    this.boss = null;
    for (const n of ACTS) game.events?.on(n, (e) => this.feel(n, e));
    game.events?.on('shrine.rest', () => this.clear('rest'));
  }

  feel(name, e) {
    const h = dissonanceOf(name, e) * dissonanceScale(domainOf(name, e), this.game); // (a master's hand jars it less: GODHAND.md 11)
    if (h <= 0) return;
    this.dissonance += h; this.quiet = 0;
  }

  update(dt) {
    const R = REJECTION;
    this.quiet += dt;
    if (this.quiet > R.quiet && this.dissonance > 0) this.dissonance = Math.max(0, this.dissonance - R.ebb * dt);
    const s = dissonanceLevelOf(this.dissonance, this.level);
    if (s !== this.level) { this.level = s; this.game.events?.emit('god.dissonance', { level: s, by: 'environment' }); }
    if (this.sent.length) this.sent = this.sent.filter((c) => c.alive && !c.disposed);
    if (this.boss && (!this.boss.alive || this.boss.disposed)) {
      const won = this.boss.downBy === 'courier'; // (put down by you, not tidied away)
      this.boss = null;
      if (won) { this.game.events?.emit('god.rejection.beaten', { by: 'courier' }); this.clear('beaten'); return; }
    }
    if (this.level < 1) return;
    this.wait -= dt;
    if (this.wait > 0) return;
    this.wait = R.every;
    this.answer(R.answer[this.level]);
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
    const stash = R.stash[this.level] || 0;
    const mark = (c) => { if (!c) return; g.spawnLook?.play(c, c.stray || c.egregore ? 'tear' : 'rise'); c.emo = R.emo; c.stash = (c.stash || 0) + stash; c.rejection = this.level; this.sent.push(c); return c; };
    const room = () => this.sent.length < R.cap;
    for (let i = 0; i < (A.jelly || 0) && room(); i++) {
      const at = home.clone().add(new THREE.Vector3((rand() - 0.5) * 6, 0, (rand() - 0.5) * 6));
      const c = mark(g.jellies?.spawn?.(at, { cls: A.cls || 0, size: A.size ?? null, once: true }));
      if (c && A.boss && !this.boss) this.boss = c;
    }
    for (let i = 0; i < (A.wisp || 0) && room(); i++) mark(g.wisps?.spawn?.(home.clone().add(new THREE.Vector3((rand() - 0.5) * 8, 1, (rand() - 0.5) * 8))));
    g.events?.emit('god.rejection.answer', { level: this.level, n: this.sent.length, by: 'environment' });
  }

  /** The dissonance cleared (a rest, the answer beaten): the island's answer still about stays, and is still worth fighting. */
  clear(why) {
    this.dissonance = 0; this.wait = REJECTION.every * 0.5;
    if (this.level) { this.level = 0; this.game.events?.emit('god.dissonance', { level: 0, why, by: 'environment' }); }
  }
}
