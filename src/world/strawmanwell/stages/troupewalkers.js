// ---------------------------------------------------------------------------------------
// THE TROUPE'S WALKERS: Strawman's dummies on The Troupe's boards (docs/plans/STRAWMANS-WELL.md 3.10), their bodies. Each is a small
// Strawman (vfx/strawman.js) with a mind of the house's parts (troupemind.js) that says what it is doing; the body here does it, on
// the lane's plane, against the stage's own colliders by raycasts (as the straw dummies do, dummy.js): it walks on and on, turns at a
// wall or a blocker, drops off an edge, and is lost to a fall of more than WALKER.fatal m (a floater's drifts down), to the spikes, or to
// its own bomb. Its jobs as Lemmings' are: a BLOCKER stands and turns the others; a DIGGER takes the soft clay under it a cell at a time;
// a BUILDER lays WALKER.planks planks ahead, each a step up, and walks up them; a CLIMBER goes up a wall it walks into (and falls back
// off a ceiling); a FLOATER falls slowly; a BOMBER counts WALKER.fuse real s and bursts, taking the breakable cells near it and itself
// (it stops at the first wall it meets and waits there, so a bomber sent at the bales bursts at the bales).
// It has no collider: the Courier passes through the troupe. Training bodies (`training: true`): not creatures, never counted but by
// the stage. Placeholder looks; its job worn as a word over it (the overlay's tag, a placeholder sprite).
//
// Prior art: Lemmings (the walk, the turn, the fall that kills, the eight skills, the bomber's countdown over its head); the straw
// dummy's body (dummy.js: a raycast floor and wall on the plane).
//
//   const T = new Walkers(stage)   T.spawn(at)   T.give(c, job) -> bool   T.update(dt)   T.clear()   T.list   WALKER (its numbers)
//   stage: { well, group, z, soft: [cell], breakable: [cell], plank(x0, x1, top) -> cell, exit: { x, y }, spikes: [x0, x1, y], lost(c), saved(c) }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Brain, Memory } from '../../../creatures/ai/index.js';
import { StrawmanModel } from '../../../vfx/strawman.js';
import { FONT } from '../../../ui/theme.js';
import { walkerMind, KEPT } from './troupemind.js';

/** Its numbers: the model's scale, half its width (m), its walk and climb (m/s), gravity (m/s²), a floater's fall (m/s), the fall that
 *  loses it (m), the step it walks up (m), the digger's time a cell (real s), the builder's planks (count, run and rise, m) and its time a
 *  plank (real s), the bomber's fuse (real s) and its blast (m). */
export const WALKER = { scale: 0.42, r: 0.25, h: 1.0, walk: 1.25, climb: 1.0, gravity: 20, floatV: 1.5, fatal: 4.5, step: 0.36, dig: 0.7, planks: 8, run: 0.5, rise: 0.2, plankT: 0.55, fuse: 3, blast: 1.6 };
const DOWN = new THREE.Vector3(0, -1, 0), UPV = new THREE.Vector3(0, 1, 0), _o = new THREE.Vector3(), _d = new THREE.Vector3();
let NEXT = 1;

export class Walkers {
  constructor(stage) { this.st = stage; this.game = stage.well.game; this.list = []; this.mind = walkerMind(); }

  spawn(at) {
    const g = this.game, model = new StrawmanModel(); model.group.scale.setScalar(WALKER.scale); this.st.group.add(model.group);
    const c = {
      type: 'walker', kind: 'dummy', training: true, id: NEXT++, model, pos: at.clone(), vel: new THREE.Vector3(), want: new THREE.Vector3(),
      dir: 1, grounded: false, fallFrom: at.y, mode: 'fall', job: null, climber: false, floater: false, fuse: 0, t: 0, built: 0, atWall: false, out: null,
    };
    c.brain = new Brain(g, c, { senses: null, memory: new Memory({ hold: 1, ebb: 1 }), drives: null, actions: this.mind.actions, think: 0.1, near: 1e4, far: 2e4 });
    g.ai?.add(c.brain);
    c.tag = this.tag(); this.list.push(c);
    return c;
  }

  /** A job given (keys 1 to 6): true if this walker takes it. */
  give(c, job) {
    if (c.out) return false;
    if (job === 'climb') { if (c.climber) return false; c.climber = true; }
    else if (job === 'float') { if (c.floater) return false; c.floater = true; }
    else if (job === 'bomb') { if (c.fuse > 0) return false; c.fuse = WALKER.fuse; }
    else if (job === 'block' && c.job === 'block') { c.job = null; c.mode = 'walk'; } // (a blocker let go: Lemmings has no way; this bench is kinder)
    else {
      if (!c.grounded || c.job === job) return false;
      if (job === 'dig' && !this.softUnder(c)) { this.game.log?.say?.('warn', 'The clay is too hard to dig here.', { key: 'troupe.dig', throttle: 3 }); return false; }
      c.job = job; c.t = 0; c.built = 0;
    }
    if (!KEPT.has(job)) c.brain.signal();
    this.drawTag(c);
    return true;
  }

  /** The job worn as a word over it: the overlay's tag (a placeholder sprite in the System's type). */
  tag() {
    const cv = document.createElement('canvas'); cv.width = 192; cv.height = 40;
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })); s.scale.set(1.9, 0.4, 1); s.renderOrder = 3;
    this.st.group.add(s);
    return { s, cv, tex, said: null };
  }
  drawTag(c) {
    const words = [c.fuse > 0 ? `BOMB ${Math.ceil(c.fuse)}` : null, c.job ? c.job.toUpperCase() : null, c.climber ? 'C' : null, c.floater ? 'F' : null].filter(Boolean).join(' ');
    const T = c.tag; if (T.said === words) return; T.said = words;
    const x = T.cv.getContext('2d'); x.clearRect(0, 0, 192, 40);
    if (words) {
      x.font = `bold 26px ${FONT.sys}`; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.lineWidth = 5; x.strokeStyle = 'rgba(20,10,6,0.85)'; x.strokeText(words, 96, 21); x.fillStyle = c.fuse > 0 ? '#ffb07a' : '#fff0d8'; x.fillText(words, 96, 21);
    }
    T.tex.needsUpdate = true;
  }

  // ---------------------------------------------------------------- the boards, by raycast (the stage's own colliders; never the Courier's)
  keep(k) { const P = this.game.player; return !k.isSensor() && k.handle !== P?.collider?.handle && !k.parent()?.isDynamic(); }
  /** The top under it (from a little over its feet), or null. */
  ground(c, x = c.pos.x) {
    _o.set(x, c.pos.y + 0.5, this.st.z);
    const hit = this.game.physics.raycast(_o, DOWN, 1.4, undefined, undefined, (k) => this.keep(k));
    return hit ? hit.point.y : null;
  }
  /** A wall `d` m ahead at height `h` over its feet? */
  wall(c, h, d = WALKER.r + 0.08) {
    _o.set(c.pos.x, c.pos.y + h, this.st.z); _d.set(c.dir, 0, 0);
    return !!this.game.physics.raycast(_o, _d, d, undefined, undefined, (k) => this.keep(k));
  }
  ceiling(c) { _o.set(c.pos.x, c.pos.y + WALKER.h - 0.1, this.st.z); return !!this.game.physics.raycast(_o, UPV, 0.2, undefined, undefined, (k) => this.keep(k)); }
  softUnder(c) { return this.st.soft.find((s) => s.on && c.pos.x > s.x0 && c.pos.x < s.x1 && Math.abs(s.top - c.pos.y) < 0.12) || null; }
  blockerAhead(c) { return this.list.some((o) => o !== c && !o.out && o.job === 'block' && o.grounded && Math.abs(o.pos.y - c.pos.y) < 0.6 && (o.pos.x - c.pos.x) * c.dir > 0 && Math.abs(o.pos.x - c.pos.x) < 0.55); }

  update(dt) {
    for (const c of this.list) {
      if (c.out) continue;
      c.brain.update(dt);
      this.step(c, dt);
      if (c.out) continue;
      const m = c.model; m.group.position.copy(c.pos); m.group.rotation.y = c.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      m.group.rotation.z = c.mode === 'climb' ? -c.dir * 0.5 : c.mode === 'fall' && c.floater ? Math.sin(c.t * 6) * 0.15 : 0;
      m.setMode?.(c.job === 'block' ? 'guard' : 'still'); m.update?.(dt);
      c.tag.s.position.set(c.pos.x, c.pos.y + WALKER.h + 0.5, this.st.z + 0.5);
      this.drawTag(c);
    }
  }

  step(c, dt) {
    const S = this.st; c.t += dt;
    if (c.fuse > 0 && (c.fuse -= dt) <= 0) return this.burst(c);
    const gy = this.ground(c);
    if (c.grounded && (gy == null || c.pos.y > gy + 0.06) && c.mode !== 'climb') { c.grounded = false; c.fallFrom = c.pos.y; c.vel.y = 0; }
    c.atWall = false;
    if (c.mode === 'climb') {
      if (this.ceiling(c)) { c.mode = 'fall'; c.dir = -c.dir; c.grounded = false; c.fallFrom = c.pos.y; c.vel.y = 0; return; } // (a ceiling: off it, and back the other way)
      c.pos.y += WALKER.climb * dt;
      if (!this.wall(c, 0.08)) { c.pos.x += c.dir * (WALKER.r + 0.15); c.pos.y += 0.06; c.mode = 'walk'; c.grounded = false; c.fallFrom = c.pos.y; }
      return;
    }
    if (!c.grounded) {
      c.vel.y -= WALKER.gravity * dt; if (c.floater && c.vel.y < -WALKER.floatV) c.vel.y = -WALKER.floatV;
      c.pos.y += c.vel.y * dt;
      const g2 = this.ground(c);
      if (g2 != null && c.vel.y <= 0 && c.pos.y <= g2 + 0.02) {
        c.pos.y = g2; c.vel.y = 0; c.grounded = true;
        if (c.fallFrom - g2 > WALKER.fatal && !c.floater) return this.lose(c, 'fall');
      }
    } else if (gy != null) c.pos.y = gy;
    for (const [x0, x1, y] of S.spikes) if (c.pos.x > x0 && c.pos.x < x1 && c.pos.y < y + 0.3) return this.lose(c, 'spikes');
    if (c.pos.y < S.floor) return this.lose(c, 'fall');
    if (Math.abs(c.pos.x - S.exit.x) < 0.4 && Math.abs(c.pos.y - S.exit.y) < 0.6) return this.save(c);
    if (!c.grounded) return;
    if (c.mode === 'walk') this.walk(c, dt);
    else if (c.mode === 'dig' && c.t > WALKER.dig) {
      c.t = 0; const s = this.softUnder(c);
      if (s) { s.on = false; s.collider?.setEnabled(false); if (s.mesh) s.mesh.visible = false; c.grounded = false; c.fallFrom = c.pos.y; }
      else { c.job = null; c.mode = 'walk'; }
    } else if (c.mode === 'build' && c.t > WALKER.plankT) {
      c.t = 0;
      if (c.built >= WALKER.planks || this.wall(c, WALKER.rise + 0.3, WALKER.run + WALKER.r)) { c.job = null; c.mode = 'walk'; return; }
      const x0 = c.pos.x + c.dir * 0.05, x1 = c.pos.x + c.dir * (WALKER.run + 0.15), top = c.pos.y + WALKER.rise;
      S.plank(Math.min(x0, x1), Math.max(x0, x1), top); c.built++;
      c.pos.x += c.dir * WALKER.run; c.pos.y = top;
    }
  }
  walk(c, dt) {
    const dx = c.dir * WALKER.walk * dt;
    if (this.blockerAhead(c)) { c.dir = -c.dir; return; }
    if (this.wall(c, 0.8, WALKER.r + Math.abs(dx) + 0.05)) { c.atWall = true; if (!c.climber && !(c.fuse > 0)) c.dir = -c.dir; return; } // (a bomber stands at the first wall it meets)
    if (this.wall(c, 0.12, WALKER.r + Math.abs(dx) + 0.05)) { // (a low step: up it, if it is low enough)
      const top = this.ground(c, c.pos.x + c.dir * (WALKER.r + 0.12));
      if (top != null && top - c.pos.y <= WALKER.step) { c.pos.x += dx; c.pos.y = top; return; }
      c.atWall = true; if (!c.climber && !(c.fuse > 0)) c.dir = -c.dir; return;
    }
    c.pos.x += dx;
  }

  burst(c) {
    const S = this.st, mid = c.pos.y + WALKER.h / 2;
    for (const b of S.breakable) if (b.on && Math.hypot(b.cx - c.pos.x, b.cy - mid) < WALKER.blast) { b.on = false; b.collider?.setEnabled(false); if (b.mesh) b.mesh.visible = false; }
    this.game.vfx?.play?.('shock', { pos: new THREE.Vector3(c.pos.x, mid, S.z), scale: WALKER.blast });
    this.lose(c, 'bomb');
  }
  lose(c, why) { this.game.vfx?.play?.('hit.blunt.straw', { pos: new THREE.Vector3(c.pos.x, c.pos.y + WALKER.h / 2, this.st.z), power: 1 }); this.out(c, 'lost'); this.st.lost(c, why); }
  save(c) { this.out(c, 'saved'); this.st.saved(c); }
  out(c, how) {
    c.out = how; c.job = null; c.fuse = 0; c.model.group.visible = false; c.tag.s.visible = false;
    this.game.ai?.remove(c.brain);
  }

  clear() {
    for (const c of this.list) {
      this.game.ai?.remove(c.brain);
      c.model.dispose?.(); c.model.group.removeFromParent();
      c.tag.s.removeFromParent(); c.tag.tex.dispose(); c.tag.s.material.dispose();
    }
    this.list = [];
  }
}
