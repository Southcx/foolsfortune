// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S MECHANICS: the room-side verbs the core movement has no part for (docs/plans/STRAWMANS-WELL.md 3.1, 3.3, each marked
// **new** there), each a modifier with a source you can see in the stage (CLAUDE.md, "Base change bad, modifiers good"), run beside the
// Courier's fixed step through the frame's `pre` and `post` hooks (wellframe.js). Positions are world metres on the lane's plane.
//   a thin platform   one way: its collider on only while the feet are over its top and not rising through it; S + Space on it drops
//                     through (Super Mario Bros. 2)
//   a spring          landed on, it throws you up (an impulse: `player.impulse`, Sonic's)
//   ice and goo       strips of the floor: ice keeps a share of your speed as the place's drift (you glide past where you let go); Gall's
//                     goo slows a walk (the place's wade) (Super Mario Bros. 3, Super Meat Boy)
//   the wall kick     in the air, a wall in front and Space: kicked off it up and back, the facing turned (Mega Man X's; the core's own wall
//                     jump is off a wall run, which the back flat gives)
//   a ? spool         bonked from below, a few cubes out of its top, once; a hidden one has no body until bonked (Super Mario Bros.)
//   a stomp dummy     a small straw dummy walking its beat: landed on from above it bounces you up and flattens a while; walked into, a
//                     shove (Super Mario Bros.' Goomba). Strawman's fellow, never a creature: nothing counts it but the verb
//
//   const M = new WellMechanics(well)   M.thin(collider, x0, x1, top)   M.spring(x0, x1, top)   M.strip(kind, x0, x1, top)   M.spool(spec)
//   M.dummy(spec)   M.pre(dt)   M.post(dt)   M.update(dt) (each frame: the dummies walk)   M.clear()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { StrawmanModel } from '../../vfx/strawman.js';
import { COLOR } from './stagekit.js';

/** The numbers: a spring's throw (m/s up), the drop's time with a thin platform off (s), ice's share of speed kept and its ease (1/s), goo's
 *  wade, the wall kick's out and up (m/s) and its reach (m ahead of the capsule's middle), a spool's cubes, a stomp's bounce (m/s), a stomp
 *  dummy's walk (m/s), how long it lies flat (s), its shove (m/s). */
export const MECH = { spring: 15, drop: 0.4, iceKeep: 0.7, iceEase: 1.4, goo: 0.42, kickOut: 6.5, kickUp: 7.2, kickReach: 0.62, spoolCubes: 2, bounce: 9.5, walk: 1.1, flat: 2.6, shove: 4.5 };
const _o = new THREE.Vector3(), _d = new THREE.Vector3();

export class WellMechanics {
  constructor(well) { this.well = well; this.game = well.game; this.clear(); }

  clear() {
    for (const D of this.dummies || []) { D.model.dispose?.(); D.model.group.parent?.remove(D.model.group); }
    this.thins = []; this.springs = []; this.strips = []; this.spools = []; this.dummies = [];
    this.ice = 0; this.prevSpace = false; this.vy0 = 0; this.head0 = 0; this.dropT = 0; this.springCd = 0;
  }
  thin(collider, x0, x1, top) { if (collider) this.thins.push({ collider, x0, x1, top, on: true }); }
  spring(x0, x1, top, mesh = null) { this.springs.push({ x0, x1, top, mesh }); }
  strip(kind, x0, x1, top) { this.strips.push({ kind, x0, x1, top }); }
  /** { x0, x1, bottom, top, z, mesh, collider, hidden } */
  spool(s) { s.used = false; if (s.hidden) { s.collider?.setEnabled(false); if (s.mesh) s.mesh.visible = false; } this.spools.push(s); return s; }
  /** { at: Vector3 (feet), x0, x1, into: Group } */
  dummy({ at, x0, x1, into }) {
    const model = new StrawmanModel(); model.group.scale.setScalar(0.42); model.group.position.copy(at); into.add(model.group);
    const D = { model, x: at.x, y: at.y, z: at.z, x0, x1, dir: -1, flat: 0, head: 2.45 * 0.42 };
    this.dummies.push(D); return D;
  }

  get P() { return this.game.player; }
  on(o, x, pad = 0) { return x > o.x0 - pad && x < o.x1 + pad; }

  /** Before the step: the thin platforms' bodies, a drop through, ice and goo, the wall kick. */
  pre(dt) {
    const P = this.P, F = this.well.frame, R = F.realInput; if (!R) return;
    const space = R.isDown('Space'), fresh = space && !this.prevSpace; this.prevSpace = space;
    this.vy0 = P.vel.y; this.head0 = P.pos.y + P.height; this.springCd -= dt;
    this.dropT = Math.max(0, this.dropT - dt);
    const feet = P.pos.y, tech = F.tech;
    // a thin platform: stood on with S held, Space drops through it
    let onThin = null;
    for (const T of this.thins) if (this.on(T, P.pos.x, 0.3) && Math.abs(feet - T.top) < 0.08) onThin = T;
    if (fresh && onThin && P.grounded && R.isDown('KeyS') && !tech) { this.dropT = MECH.drop; this.dropping = onThin; F.suppressJump(); P.grounded = false; P.vel.y = -1; this.well.verb('dropThrough'); }
    for (const T of this.thins) {
      const want = !(this.dropT > 0 && this.dropping === T) && feet >= T.top - 0.06 && !(P.vel.y > 0.5 && feet < T.top + 0.02);
      if (want !== T.on) { T.on = want; T.collider.setEnabled(want); }
    }
    // ice and goo underfoot
    let strip = null;
    if (P.grounded) for (const S of this.strips) if (this.on(S, P.pos.x) && Math.abs(feet - S.top) < 0.15) strip = S;
    if (strip?.kind === 'ice') { this.ice += (P.vel.x - this.ice) * (1 - Math.exp(-MECH.iceEase * dt)); P.drift.set(this.ice * MECH.iceKeep, 0, 0); this.well.verb('ice'); }
    else { this.ice = P.grounded ? 0 : this.ice; P.drift.set(0, 0, 0); }
    P.wade = strip?.kind === 'goo' ? MECH.goo : 1;
    if (strip?.kind === 'goo' && Math.abs(P.vel.x) > 0.5) this.well.verb('goo');
    // the wall kick: in the air, a wall right in front, Space fresh
    if (fresh && !P.grounded && !P.wallrun && !P.mantle && !tech && P.airT > 0.05) {
      _o.set(P.pos.x, P.pos.y + 1.0, P.pos.z); _d.set(F.face, 0, 0);
      const hit = this.game.physics.raycast(_o, _d, MECH.kickReach + 0.3, P.collider, undefined, (c) => !c.isSensor());
      if (hit && Math.abs(hit.normal?.x ?? 0) > 0.7) {
        F.suppressJump(); F.face = -F.face;
        P.vel.x = F.face * MECH.kickOut; P.vel.y = MECH.kickUp; P.airJumps = Math.max(P.airJumps, 1);
        P.sfx?.airJump?.(); this.well.verb('wallJump');
      }
    }
  }

  /** After the step: a spring landed on, a spool bonked, a dummy stomped or walked into. */
  post() {
    const P = this.P, g = this.game, feet = P.pos.y;
    if (P.grounded && this.springCd <= 0) for (const S of this.springs) if (this.on(S, P.pos.x, 0.2) && Math.abs(feet - S.top) < 0.2) {
      this.springCd = 0.35; P.impulse(new THREE.Vector3(0, MECH.spring - Math.max(0, P.vel.y), 0), 'spring'); P.airJumps = Math.max(P.airJumps, 1);
      if (S.mesh) S.squash = 1;
      this.well.verb('spring');
    }
    // a spool from below: the core's own bonk stops a rise into a solid one; a hidden one is crossed by the head and shown
    if (this.vy0 > 0.5) {
      const head = P.pos.y + P.height;
      for (const S of this.spools) {
        if (!this.on(S, P.pos.x, 0.15)) continue;
        const struck = S.hidden && !S.shown ? this.head0 <= S.bottom + 0.02 && head >= S.bottom - 0.02 : head >= S.bottom - 0.12 && head <= S.bottom + 0.1 && P.vel.y <= 0.5;
        if (!struck) continue;
        if (S.hidden && !S.shown) { S.shown = true; S.collider?.setEnabled(true); if (S.mesh) S.mesh.visible = true; P.pos.y = Math.min(P.pos.y, S.bottom - P.height - 0.02); P.vel.y = 0; P.body.setNextKinematicTranslation({ x: P.pos.x, y: P.pos.y, z: P.pos.z }); }
        S.bump = 1;
        if (!S.used) { S.used = true; g.cubes?.burst?.(new THREE.Vector3((S.x0 + S.x1) / 2, S.top + 0.3, S.z), MECH.spoolCubes, { count: MECH.spoolCubes, up: 4, spread: 0.3, from: 'well' }); S.mesh?.material?.color?.setHex(COLOR.used); }
        this.well.verb('bonk');
        break;
      }
    }
    // a stomp dummy: from above a bounce, from the side a shove
    for (const D of this.dummies) {
      if (D.flat > 0) continue;
      const dx = P.pos.x - D.x, top = D.y + D.head;
      if (Math.abs(dx) > 0.75) continue;
      if (this.vy0 < -0.5 && feet > top - 0.45 && feet < top + 0.35) {
        D.flat = MECH.flat; P.vel.y = 0; P.impulse(new THREE.Vector3(0, MECH.bounce, 0), 'spring'); P.airJumps = Math.max(P.airJumps, 1);
        D.model.hit?.(new THREE.Vector3(D.x, top, D.z), new THREE.Vector3(0, -1, 0), 2);
        this.well.verb('stomp'); if (this.well.frame.tech === 'slam' || P.techs?.get?.('slam')?.active) this.well.verb('groundPound');
      } else if (feet < top - 0.4 && feet > D.y - 0.5 && Math.abs(dx) < 0.55 && !(P.invuln > 0) && !this.shoveCd) {
        this.shoveCd = 0.6; P.impulse(new THREE.Vector3(Math.sign(dx || 1) * MECH.shove, 2.5, 0), 'strawman'); this.well.hit();
      }
    }
  }

  /** Each frame: the dummies walk their beat (or lie flat), the springs and spools spring back. */
  update(dt) {
    this.shoveCd = Math.max(0, (this.shoveCd || 0) - dt) || 0;
    for (const D of this.dummies) {
      const m = D.model;
      if (D.flat > 0) { D.flat -= dt; m.group.scale.set(0.5, 0.42 * (D.flat > 0 ? 0.25 : 1), 0.5); if (D.flat <= 0) m.group.scale.setScalar(0.42); }
      else { D.x += D.dir * MECH.walk * dt; if (D.x < D.x0) { D.x = D.x0; D.dir = 1; } if (D.x > D.x1) { D.x = D.x1; D.dir = -1; } m.group.rotation.y = D.dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
      m.group.position.set(D.x, D.y, D.z); m.update?.(dt);
    }
    for (const S of this.springs) if (S.mesh && S.squash > 0) { S.squash = Math.max(0, S.squash - dt * 4); S.mesh.scale.y = 1 - 0.5 * S.squash; }
    for (const S of this.spools) if (S.mesh && S.bump > 0) { S.bump = Math.max(0, S.bump - dt * 5); S.mesh.position.y = S.baseY + 0.18 * Math.sin(S.bump * Math.PI); }
  }
}
