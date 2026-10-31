// ---------------------------------------------------------------------------------------
// THE STRAW DUMMIES: The Brawl's foes (docs/plans/STRAWMANS-WELL.md 3.4 and 5), Strawman's fellows, its own creatures and counted as the
// Well's (Strawman itself never is). A dummy is a creature (creatures/creatures.js's contract: tagged hurtable, registered, struck through
// `creatures.strike`) with a mind of the house's parts (dummymind.js), a small Strawman for its body (vfx/strawman.js, rocking where it is
// struck), on the lane's plane. Its own rule is the PERCENT (Smash 64's knockback, simplified: progress/strawmanwell.js): every blow adds
// `percentOf(power)` and throws it by `launchOf(power, percent)` along the blow's side, 40 degrees up, so a dummy softened flies further.
// Past a blast line (PERCENT.blast m beyond the arena's edge, or below it) it is KNOCKED OUT (`well.dummy.ko`) and comes back at 0%. A
// dummy at PERCENT.trophyAt% or more, struck again while it still tumbles from the last throw, is caught as a TROPHY
// (`well.dummy.trophy`): Subspace Emissary's trophy stand, as a juggle at high percent (the plate's capture is a later wave's).
// Its percent is shown over it as the overlay's tag, a placeholder in the System's type (a sprite).
//
// Prior art: Super Smash Bros.' damage percent, knockback and blast zones; the Lantern Wisp's body (creatures/wisp/lanternwisp.js: a
// kinematic capsule, a mind that sets `want`, a body that moves and poses).
//
//   const D = new StrawDummies(well)   D.spawn(at, arena)   D.swipe(c)   D.update(dt)   D.clear()   D.list
//   arena: { x0, x1, top, z, stage }   events: well.dummy.ko { stage, percent, by }, well.dummy.trophy { kind, by }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, G, groups } from '../../core/physics.js';
import { tag } from '../../core/tags.js';
import { st } from '../../creatures/creatures.js';
import { Brain, Senses, Memory, Drives, rollTraits } from '../../creatures/ai/index.js';
import { StrawmanModel } from '../../vfx/strawman.js';
import { PERCENT, percentOf, launchOf } from '../../progress/strawmanwell.js';
import { FONT } from '../../ui/theme.js';
import { dummyMind } from './dummymind.js';

/** Its numbers: the model's scale, its capsule, gravity (m/s²), the swipe's windup (s, the model's swing strikes at 0.925 s), reach (m)
 *  and shove (m/s), how long it is out after a KO (s), how long after a blow the Courier keeps the credit for a KO (s). */
export const DUMMY = { scale: 0.55, radius: 0.4, height: 1.35, gravity: 21, wind: 0.92, reach: 1.7, shove: 5, back: 1.6, credit: 6, poise: 2.2, stunFor: 1.6 };
const DOWN = new THREE.Vector3(0, -1, 0), _o = new THREE.Vector3(), _d = new THREE.Vector3();
let NEXT = 1;

export class StrawDummies {
  constructor(well) { this.well = well; this.game = well.game; this.list = []; this.mind = dummyMind(this); }

  spawn(at, arena) {
    const g = this.game, M = this.mind, H = DUMMY.height, R = DUMMY.radius;
    const model = new StrawmanModel(); model.group.scale.setScalar(DUMMY.scale); arena.into.add(model.group);
    const w = g.physics.world;
    const rb = w.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(at.x, at.y + H / 2, at.z));
    const col = w.createCollider(RAPIER.ColliderDesc.capsule(H / 2 - R, R).setCollisionGroups(groups(G.CRITTER, 0xffff)), rb);
    const traits = rollTraits(M.traits);
    const c = {
      type: 'creature', kind: 'dummy', name: 'straw dummy', training: true, id: NEXT++, model, rb, col, arena, home: at.clone(),
      pos: at.clone(), vel: new THREE.Vector3(), want: new THREE.Vector3(), face: -1, radius: R, height: H, alive: true, out: 0,
      hp: 999, maxHp: 999, poise: DUMMY.poise * (traits.bold ?? 1), stunFor: DUMMY.stunFor, traits, rel: new Map(),
      percent: 0, tumble: 0, grounded: false, attack: null, chain: 0, lastT: -99, lastBy: null,
      center: (out) => out.copy(c.pos).setY(c.pos.y + H * 0.55),
      head: () => new THREE.Vector3(c.pos.x, c.pos.y + H + 0.25, c.pos.z),
      hurt: (p, dir, power, cause, by) => this.hurt(c, p, dir, power, cause, by),
      knock: (v) => { if (v.y > 1) { c.vel.y = Math.max(c.vel.y, v.y * 0.8); c.grounded = false; } },
      cancel: () => this.cancel(c),
      vanish: () => this.out(c, null),
    };
    const mem = new Memory({ hold: 4, ebb: 1 / 10 });
    const senses = new Senses(g, { sight: 30, fov: 360, feel: 14, hear: 1, eye: 1.1 });
    c.mem = mem; c.drives = new Drives(M.drives, traits);
    c.brain = new Brain(g, c, { senses, memory: mem, drives: c.drives, actions: M.actions, think: 0.2, near: 60, far: 120 });
    tag(c, 'hurtable', 'creature', 'straw');
    g.physics.register(col, c); g.creatures.add(c); g.ai?.add(c.brain); g.lock?.add?.(c); // (training: the creature counts skip it, the Well's own events count it; the lock-on takes it as the Sandbox's pen does)
    c.tag = this.tag(arena.into);
    this.list.push(c);
    return c;
  }

  /** The percent's readout over it: the overlay's tag in the System's type (a placeholder sprite; Calissa's to dress). */
  tag(into) {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 48;
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })); s.scale.set(1.9, 0.72, 1); s.renderOrder = 3;
    into.add(s);
    return { s, cv, tex, shown: -1 };
  }
  drawTag(c) {
    const T = c.tag, n = Math.round(c.percent); if (T.shown === n) return; T.shown = n;
    const x = T.cv.getContext('2d'), k = Math.min(1, n / 150);
    x.clearRect(0, 0, 128, 48); x.font = `bold 34px ${FONT.sys}`; x.textAlign = 'center'; x.textBaseline = 'middle'; // (the System's type)
    x.lineWidth = 6; x.strokeStyle = 'rgba(20,10,6,0.85)'; x.strokeText(`${n}%`, 64, 25);
    x.fillStyle = `rgb(255,${Math.round(240 - 170 * k)},${Math.round(220 - 190 * k)})`; x.fillText(`${n}%`, 64, 25);
    T.tex.needsUpdate = true;
  }

  /** A blow: its percent added, thrown by it along the blow's side in the plane, 40 degrees up; at trophyAt% while still tumbling, a trophy. */
  hurt(c, point, dir, power, cause, by) {
    const g = this.game, W = this.well; if (!c.alive || c.out > 0) return;
    const p = THREE.MathUtils.clamp(power, 0.5, 3), now = g.events?.time ?? 0;
    if (by === 'courier') {
      if (c.percent >= PERCENT.trophyAt && c.tumble > 0) { W.verb('trophy'); g.events?.emit('well.dummy.trophy', { kind: 'dummy', by }); this.out(c, null, 'trophy'); return; }
      c.chain = now - c.lastT < 0.9 ? c.chain + 1 : 1; W.noteString(c.chain);
      if (c.chain >= 3) W.verb('string');
      if (!c.grounded && c.tumble > 0) W.verb('juggle');
      c.lastT = now; c.lastBy = 'courier';
    }
    c.percent = Math.min(PERCENT.max, c.percent + percentOf(p));
    const L = launchOf(p, c.percent), a = (L.angle * Math.PI) / 180;
    const side = Math.sign(dir?.x || 0) || Math.sign(c.pos.x - g.player.pos.x) || 1;
    c.vel.x = side * L.speed * Math.cos(a); c.vel.y = Math.max(c.vel.y, L.speed * Math.sin(a)); c.grounded = false;
    c.tumble = Math.min(1.4, 0.2 + L.speed * 0.045);
    if (L.speed > 7 && by === 'courier') W.verb('launch');
    this.cancel(c);
    c.model.hit?.(point || c.center(new THREE.Vector3()), dir || new THREE.Vector3(side, 0, 0), p);
    this.drawTag(c);
    c.brain.signal();
  }

  /** The swipe: a windup the parry answers (creatures.windup), then, if it is not broken off, a shove on the Courier in reach. */
  swipe(c) {
    const g = this.game;
    c.attack = { t: DUMMY.wind };
    g.creatures.windup?.(c, { at: c.pos, radius: DUMMY.reach, eta: DUMMY.wind, kind: 'blow', parry: true, part: c.model.parts?.right ?? null, type: 'impact', read: true });
    c.model.play?.('swing');
  }
  cancel(c) { if (!c.attack) return; c.attack = null; this.game.creatures.unwind?.(c, 'cancel'); c.model.breakOff?.(); }
  release(c) {
    const g = this.game, P = g.player; c.attack = null; g.creatures.unwind?.(c, 'end');
    const dx = P.pos.x - c.pos.x;
    if (Math.abs(dx) < DUMMY.reach && Math.abs(P.pos.y - c.pos.y) < 1.3 && Math.sign(dx) === c.face && !(P.invuln > 0)) {
      P.impulse(new THREE.Vector3(Math.sign(dx) * DUMMY.shove, 2.2, 0), 'strawman'); P.shake = Math.max(P.shake || 0, 0.3); this.well.hit();
    }
  }

  /** Out of the arena: a KO (past a blast line: who struck it last, if lately) or a trophy, and back at 0% after DUMMY.back real s. */
  out(c, ko, why = 'ko') {
    const g = this.game; if (c.out > 0) return;
    if (ko) {
      const by = c.lastBy === 'courier' && (g.events?.time ?? 0) - c.lastT < DUMMY.credit ? 'courier' : 'environment';
      g.events?.emit('well.dummy.ko', { stage: c.arena.stage, percent: Math.round(c.percent), by });
      if (by === 'courier') this.well.verb('ringOut');
      this.well.onKO?.(by);
    }
    if (why === 'trophy') this.well.onKO?.('courier');
    this.cancel(c); c.out = DUMMY.back; c.model.group.visible = false; c.tag.s.visible = false; c.col.setEnabled(false); c.alive = false;
  }
  back(c) {
    Object.assign(c, { alive: true, out: 0, percent: 0, tumble: 0, chain: 0, lastBy: null, grounded: false });
    c.pos.copy(c.home).setY(c.home.y + 3); c.vel.set(0, 0, 0); c.model.group.visible = true; c.tag.s.visible = true; c.col.setEnabled(true); c.status?.clear();
    this.drawTag(c);
  }

  /** The ground under it (the static world only), or null. */
  ground(c) {
    const g = this.game; _o.set(c.pos.x, c.pos.y + 0.6, c.pos.z);
    const hit = g.physics.raycast(_o, DOWN, 1.2, c.col, undefined, (k) => !k.isSensor() && !k.parent()?.isDynamic() && !g.physics.entityOf(k)?.type && k.handle !== g.player?.collider?.handle);
    return hit ? hit.point.y : null;
  }
  wall(c, dx) {
    const g = this.game; _o.set(c.pos.x, c.pos.y + 0.7, c.pos.z); _d.set(Math.sign(dx), 0, 0);
    return !!g.physics.raycast(_o, _d, DUMMY.radius + Math.abs(dx), c.col, undefined, (k) => !k.isSensor() && !k.parent()?.isDynamic() && !g.physics.entityOf(k)?.type && k.handle !== g.player?.collider?.handle);
  }

  update(dt) {
    for (const c of this.list) {
      const A = c.arena;
      if (c.out > 0) { if ((c.out -= dt) <= 0) this.back(c); continue; }
      if (c.tag.shown < 0) this.drawTag(c);
      if (c.tumble > 0) c.tumble -= dt;
      if (!c.attack && c.tumble <= 0 && !st(c, 'stun')) c.brain.update(dt); else c.brain.mem?.tick?.(dt);
      if (c.attack && (c.attack.t -= dt) <= 0) this.release(c);
      // the plane's own physics: walk toward what the mind wants on the ground, fly as thrown, fall, land, stop at walls
      if (c.grounded && c.tumble <= 0) c.vel.x += (c.want.x - c.vel.x) * Math.min(1, dt * 8);
      else if (c.grounded) c.vel.x *= Math.max(0, 1 - dt * 6);
      c.vel.y -= DUMMY.gravity * dt;
      const dx = c.vel.x * dt; if (dx && !this.wall(c, dx)) c.pos.x += dx; else if (dx) c.vel.x = -c.vel.x * 0.3;
      c.pos.y += c.vel.y * dt; c.pos.z = A.z;
      const gy = this.ground(c);
      if (gy != null && c.vel.y <= 0 && c.pos.y <= gy + 0.05) { c.pos.y = gy; c.vel.y = 0; c.grounded = true; } else if (gy == null || c.pos.y > gy + 0.1) c.grounded = false;
      // the blast lines
      if (c.pos.x < A.x0 - PERCENT.blast || c.pos.x > A.x1 + PERCENT.blast || c.pos.y < A.top - 10 || c.pos.y > A.top + 22) { this.out(c, true); continue; }
      c.rb.setNextKinematicTranslation({ x: c.pos.x, y: c.pos.y + c.height / 2, z: c.pos.z });
      const m = c.model; m.group.position.set(c.pos.x, c.pos.y, c.pos.z); m.yawTo = c.face > 0 ? Math.PI / 2 : -Math.PI / 2;
      m.group.rotation.z = c.tumble > 0 ? m.group.rotation.z + dt * 9 * -Math.sign(c.vel.x || 1) : 0;
      m.update?.(dt);
      c.tag.s.position.set(c.pos.x, c.pos.y + c.height + 0.45, c.pos.z + 0.4);
    }
  }

  /** Every dummy taken away (the stage torn down). */
  clear() {
    const g = this.game;
    for (const c of this.list) {
      this.cancel(c); g.creatures.remove(c); g.ai?.remove(c.brain);
      try { g.physics.world.removeRigidBody(c.rb); } catch { /* (gone already) */ }
      c.model.dispose?.(); c.model.group.parent?.remove(c.model.group);
      c.tag.s.parent?.remove(c.tag.s); c.tag.tex.dispose(); c.tag.s.material.dispose();
    }
    this.list = [];
  }
}
