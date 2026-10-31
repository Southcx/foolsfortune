// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S MACHINE: The Machine stage's moving parts (docs/plans/STRAWMANS-WELL.md 3.7), held to the lane's plane. Each is the
// house's own kind of thing where one exists (the level's crate, the movers' conveyor and shuttle, world/props/movers.js) and the room's
// own where none does (a seesaw, a crumbling floor, a switch and its timed door, a key and its lock, a cannon on a beat). Positions are
// world metres; a dynamic body here moves only in the plane (Rapier's locked axes: x and y free, turning only about the depth axis).
//   a crate           the level's crate, pushed by walking into it (the controller's own push), climbed onto to reach a ledge
//   a seesaw          a plank turning on its pivot, tipped by the Courier's weight where they stand on it (LittleBigPlanet's)
//   the conveyor      the movers' belt, its surface carrying what stands on it (Mega Man's)
//   a moving platform the movers' shuttle (every platformer's)
//   a crumbling floor stood on CRUMBLE.hold real s it drops away, and is back CRUMBLE.back after (Super Mario Bros. 3's)
//   a switch          stood on, its door opens for SWITCH.open real s (Super Mario Maker's)
//   a key and a lock  touched, the key rides over your head; brought to its lock, the lock's door opens for good (Spelunky's)
//   a cannon          a slow ball every CANNON.every real s along the floor; one that meets you knocks you back (Mario's Bullet Bill)
//
//   const M = new WellMachine(well)   M.crate(at, size)   M.seesaw(at, len)   M.belt(at, size, vx)   M.shuttle(at, size, to)
//   M.crumble(part)   M.switch(pad, door)   M.key(at, door)   M.cannon(at, dir, range)   M.update(dt)   M.clear()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { COLOR } from './stagekit.js';

export const CRUMBLE = { hold: 0.6, back: 4 };
export const SWITCH = { open: 4.5, rise: 7 };
export const CANNON = { every: 2.4, speed: 5, r: 0.32, knock: 6.5 };
export const SEESAW = { density: 60, damp: 1.6, max: 0.38, weight: 784 };

const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler();

export class WellMachine {
  constructor(well) { this.well = well; this.game = well.game; this.items = []; this.crates = []; this.movers = []; this.balls = []; }

  get P() { return this.game.player; }
  /** Is the Courier standing on a top at `top` between x0 and x1? */
  standing(x0, x1, top) { const P = this.P; return P.grounded && P.pos.x > x0 - 0.25 && P.pos.x < x1 + 0.25 && Math.abs(P.pos.y - top) < 0.2; }

  crate(at, size = 0.9) {
    const L = this.game.level; if (!L?.crate) return null;
    const e = L.crate([at.x, at.y + size / 2 + 0.01, at.z], size);
    e.body.setEnabledTranslations(true, true, false, true); e.body.setEnabledRotations(false, false, true, true);
    this.crates.push({ e, x0: at.x }); return e;
  }

  seesaw(at, len = 6, into) {
    const g = this.game, w = g.physics.world;
    const body = w.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(at.x, at.y, at.z).setAngularDamping(SEESAW.damp).setCanSleep(false));
    body.setEnabledTranslations(false, false, false, true); body.setEnabledRotations(false, false, true, true);
    const col = w.createCollider(RAPIER.ColliderDesc.cuboid(len / 2, 0.12, 1.2).setDensity(SEESAW.density).setFriction(1).setCollisionGroups(GROUPS.prop), body);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(len, 0.24, 2.4), new THREE.MeshStandardMaterial({ color: COLOR.spool, roughness: 0.9, flatShading: true }));
    mesh.castShadow = mesh.receiveShadow = true; mesh.position.copy(at); into.add(mesh);
    const S = { kind: 'seesaw', body, col, mesh, at: at.clone(), len }; this.items.push(S); return S;
  }

  belt(at, size, vx) {
    const M = this.game.movers; if (!M?.belt) return null;
    const b = M.belt({ pos: [at.x, at.y, at.z], vel: [vx, 0, 0], size }).build(COLOR.felt, COLOR.thread);
    this.movers.push(b); this.items.push({ kind: 'belt', m: b }); return b;
  }
  shuttle(at, size, to, { move = 3, dwell = 0.8 } = {}) {
    const M = this.game.movers; if (!M?.shuttle) return null;
    const m = M.shuttle({ pos: [at.x, at.y, at.z], to, move, dwell }); m.box(size, COLOR.spool, [0, 0, 0]);
    this.movers.push(m); this.items.push({ kind: 'mover', m }); return m;
  }

  /** { mesh, collider, x0, x1, top } built by the stage's kit (`own`). */
  crumble(part) { Object.assign(part, { kind: 'crumble', t: 0, down: 0, x: part.mesh.position.x, y0: part.mesh.position.y }); this.items.push(part); return part; }
  /** pad: { x0, x1, top, mesh }, door: { mesh, collider } */
  switch(pad, door) { const S = { kind: 'switch', pad, door, open: 0, y0: door.mesh.position.y, k: 0 }; this.items.push(S); return S; }
  /** A key (its mesh) at `at`, and the door its lock opens. */
  key(mesh, door) { const K = { kind: 'key', mesh, door, held: false, used: false, home: mesh.position.clone(), y0: door.mesh.position.y, k: 0 }; this.items.push(K); return K; }
  cannon(at, dir, range, into) { const C = { kind: 'cannon', at: at.clone(), dir, range, t: CANNON.every * 0.5, into }; this.items.push(C); return C; }

  update(dt) {
    const g = this.game, P = this.P, W = this.well;
    for (const c of this.crates) if (c.e.body?.isValid?.() !== false && Math.abs(c.e.body.translation().x - c.x0) > 0.3) W.verb('push');
    if (g.techs?.get?.('carry')?.item && this.crates.some((c) => c.e === g.techs.get('carry').item)) W.verb('carry');
    for (const m of this.movers) if (P.platform === m) W.verb(m.surface ? 'conveyor' : 'mover');
    for (const it of this.items) this[`tick_${it.kind}`]?.(it, dt);
    this.tickBalls(dt);
  }

  tick_seesaw(S, dt) {
    const P = this.P, b = S.body, r = b.rotation(); _q.set(r.x, r.y, r.z, r.w); _e.setFromQuaternion(_q, 'XYZ');
    let a = _e.z;
    const dx = P.pos.x - S.at.x, half = S.len / 2, top = S.at.y + 0.12 + Math.tan(a) * dx;
    if (P.grounded && Math.abs(dx) < half && Math.abs(P.pos.y - top) < 0.35) { b.applyTorqueImpulse({ x: 0, y: 0, z: -SEESAW.weight * dx * dt }, true); if (Math.abs(a) > 0.15) this.well.verb('seesaw'); }
    if (Math.abs(a) > SEESAW.max) { a = Math.sign(a) * SEESAW.max; _q.setFromEuler(_e.set(0, 0, a)); b.setRotation({ x: _q.x, y: _q.y, z: _q.z, w: _q.w }, true); const w = b.angvel(); if (Math.sign(w.z) === Math.sign(a)) b.setAngvel({ x: 0, y: 0, z: 0 }, true); }
    S.mesh.quaternion.set(r.x, r.y, r.z, r.w);
  }
  tick_crumble(C, dt) {
    if (C.down > 0) {
      C.down -= dt; C.mesh.position.y = C.y0 - Math.min(6, (CRUMBLE.back - C.down) * 4);
      if (C.down <= 0) { C.mesh.position.y = C.y0; C.mesh.visible = true; C.collider?.setEnabled(true); C.t = 0; }
      return;
    }
    if (this.standing(C.x0, C.x1, C.top)) { C.t += dt; C.mesh.position.x = C.x + Math.sin(C.t * 60) * 0.03 * C.t; } else C.t = Math.max(0, C.t - dt);
    if (C.t >= CRUMBLE.hold) { C.down = CRUMBLE.back; C.collider?.setEnabled(false); C.mesh.position.x = C.x; this.well.verb('crumble'); }
  }
  tick_switch(S, dt) {
    if (this.standing(S.pad.x0, S.pad.x1, S.pad.top)) { if (S.open <= 0) this.well.verb('switch'); S.open = SWITCH.open; }
    else S.open = Math.max(0, S.open - dt);
    S.pad.mesh.position.y = S.pad.y0 - (S.open > 0 ? 0.08 : 0);
    this.door(S, S.open > 0, dt);
  }
  tick_key(K, dt) {
    const P = this.P;
    if (!K.used && !K.held && P.pos.distanceTo(K.mesh.position) < 1.1) K.held = true;
    if (K.held) {
      K.mesh.position.set(P.renderPos.x, P.renderPos.y + 2.15 + Math.sin(performance.now() * 0.004) * 0.05, P.renderPos.z);
      if (Math.abs(P.pos.x - K.door.mesh.position.x) < 1.4) { K.held = false; K.used = true; K.mesh.visible = false; this.well.verb('key'); this.well.verb('carry'); }
    }
    this.door(K, K.used, dt);
  }
  /** A door slid up out of the way while `open`, back down when not (its collider off while it is up). */
  door(D, open, dt) {
    D.k += ((open ? 1 : 0) - D.k) * Math.min(1, dt * 6);
    D.door.mesh.position.y = D.y0 + D.k * SWITCH.rise;
    const solid = D.k < 0.4; if (solid !== D.solid) { D.solid = solid; D.door.collider?.setEnabled(solid); }
  }
  tick_cannon(C, dt) {
    if ((C.t -= dt) > 0) return;
    C.t = CANNON.every;
    const m = new THREE.Mesh(new THREE.SphereGeometry(CANNON.r, 12, 8), new THREE.MeshStandardMaterial({ color: COLOR.pin, metalness: 0.5, roughness: 0.4 }));
    m.position.copy(C.at); m.castShadow = true; C.into.add(m);
    this.balls.push({ m, C, d: 0, near: false });
  }
  tickBalls(dt) {
    const P = this.P;
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const B = this.balls[i]; B.m.position.x += B.C.dir * CANNON.speed * dt; B.d += CANNON.speed * dt;
      _v.set(P.pos.x, P.pos.y + 1.0, P.pos.z);
      const d = _v.distanceTo(B.m.position); let gone = B.d > B.C.range;
      if (d < 0.75 && !(P.invuln > 0)) { P.impulse(new THREE.Vector3(B.C.dir * CANNON.knock, 3, 0), 'cannon'); this.well.hit(); this.well.verb('cannon'); gone = true; }
      else if (d < 2.2) B.near = true;
      else if (B.near && !gone) { B.near = false; this.well.verb('cannon'); }
      if (gone) { B.m.parent?.remove(B.m); B.m.geometry.dispose(); B.m.material.dispose(); this.balls.splice(i, 1); }
    }
  }

  /** Everything it made taken away: the crates, the movers, the seesaw's body, the balls (the room's group takes the meshes). */
  clear() {
    const g = this.game, L = g.level, M = g.movers;
    for (const c of this.crates) { try { if (L.dynamic?.includes(c.e)) L.removeProp(c.e); } catch { /* (gone already) */ } }
    for (const m of this.movers) {
      const i = M?.list.indexOf(m); if (i >= 0) M.list.splice(i, 1);
      g.scene.remove(m.group); m.group.traverse((o) => { o.geometry?.dispose?.(); }); m.tex?.dispose?.();
      try { g.physics.world.removeRigidBody(m.body); } catch { /* (gone already) */ }
    }
    for (const it of this.items) if (it.kind === 'seesaw') { try { g.physics.world.removeRigidBody(it.body); } catch { /* (gone already) */ } }
    for (const B of this.balls) { B.m.parent?.remove(B.m); B.m.geometry.dispose(); B.m.material.dispose(); }
    this.items = []; this.crates = []; this.movers = []; this.balls = [];
  }
}
