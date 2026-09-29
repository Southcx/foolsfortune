import * as THREE from 'three';
import { RAPIER, GROUPS } from './physics.js';
import { T, DEG, PALETTE } from './config.js';
import { GUN_POINTS } from './character.js';
import { sfx } from './audio.js';

const UP = new THREE.Vector3(0, 1, 0);
const smooth = (a, b, t) => { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };

function basisQuat(dir, up, target = new THREE.Quaternion()) {
  const x = dir.clone().normalize();
  const z = new THREE.Vector3().crossVectors(x, up).normalize();
  if (z.lengthSq() < 1e-6) z.set(0, 0, 1);
  const y = new THREE.Vector3().crossVectors(z, x);
  return target.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}

export class Weapon {
  constructor(game) {
    this.game = game;
    this.cooldown = 0;
    this.buffer = 0;
    this.reloadT = -1; // <0 = not reloading, else 0..1
    this.bloom = 0;
    this.adsT = 0;
    this.kick = 0; // gun recoil spring
    this.kickV = 0;
    this.combatBlend = 0;
    this.sprintBlend = 0;
    this.sway = new THREE.Vector2();
    this.aimPoint = new THREE.Vector3();
    this.casings = [];
    this.leftOverride = new THREE.Vector3();
    this.leftBlend = 0;
    this.shots = 0;
    this.hits = 0;
    this.charge = 0; // 0..1 while holding fire
    this.holding = false;
    this.holdT = 0;
    this.releaseCharged = false;
    this.casingGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.032, 6);
    this.casingMat = new THREE.MeshStandardMaterial({ color: PALETTE.cream, roughness: 0.3, metalness: 0.4, flatShading: true });
    this.shellGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.07, 7);
    this.shellMat = new THREE.MeshStandardMaterial({ color: PALETTE.potLight, roughness: 0.7, flatShading: true });
    this.chargeReserved = 0;
    this.pressT = -1; // time since the trigger went down (release-to-fire mode)
    // holster: drawT 0 = on the hip, 1 = in hand
    this.drawT = 0;
    this.drawTarget = 0;
    this.idleT = 0;
    this.fpPos = new THREE.Vector3();
    this.fpQ = new THREE.Quaternion();
  }

  get drawn() { return this.drawT >= 1; }
  // the draw in two beats: the hand snaps to the hip (drawT < 0.45), then the gun comes up
  get held() { return smooth(0.45, 1, this.drawT); }

  updateHolster(dt, input, player) {
    const W = T.weapon;
    const combat = input.wasPressed('Mouse0') || input.isDown('Mouse2') || input.wasPressed('KeyF') || input.wasPressed('Mouse1') || this.holding;
    if (input.wasPressed('KeyX')) { this.drawTarget = this.drawTarget > 0.5 ? 0 : 1; this.manualHolster = this.drawTarget === 0; this.idleT = 0; }
    if (combat) { this.drawTarget = 1; this.manualHolster = false; this.idleT = 0; }
    if (player.fp && !this.manualHolster) this.drawTarget = 1; // first person keeps it out unless you put it away
    // both hands busy (a ladder, swimming): stow it, and bring it back out after if it was out
    const busy = !!player.techs?.active?.handsBusy;
    if (busy) {
      if (this.drawTarget > 0) this.stowed = true;
      this.drawTarget = 0;
    } else if (this.stowed) {
      this.stowed = false;
      if (!this.manualHolster) this.drawTarget = 1;
    }
    this.idleT += dt;
    if (this.charge > 0 || this.adsT > 0 || this.reloading || this.cooldown > -0.3 || this.wantShell) this.idleT = 0;
    if (W.autoHolster && !player.fp && this.idleT > W.holsterDelay) this.drawTarget = 0;
    const was = this.drawT;
    // (this used to step back down every other frame once fully drawn - the drawn-state flicker)
    if (this.drawTarget > this.drawT) this.drawT = Math.min(this.drawTarget, this.drawT + dt / W.drawTime);
    else if (this.drawTarget < this.drawT) this.drawT = Math.max(this.drawTarget, this.drawT - dt / W.holsterTime);
    if (was === 0 && this.drawT > 0) sfx.draw?.();
    if (was > 0.3 && this.drawT <= 0.3 && this.drawTarget === 0) sfx.holster?.();
  }

  get reloading() { return this.reloadT >= 0; }

  /** Input + timers. Called once per frame before physics. */
  update(dt, input, player) {
    const W = T.weapon;
    this.updateHolster(dt, input, player);
    const wantAds = input.isDown('Mouse2') && !this.reloading && this.drawn;
    const step = dt / Math.max(0.01, W.adsTime);
    this.adsT = wantAds ? Math.min(1, this.adsT + step) : Math.max(0, this.adsT - step);
    this.adsEase = this.adsT * this.adsT * (3 - 2 * this.adsT);
    this.cooldown -= dt;
    this.buffer -= dt;
    this.bloom = Math.max(0, this.bloom - W.bloomRecovery * dt);

    this.updateTrigger(dt, input);
    this.updateCharge(dt, input);
    const shells = this.game.shells;
    for (let i = 0; i < 9; i++) if (input.wasPressed(`Digit${i + 1}`)) shells.select(i);
    if (input.wheel) shells.cycle(Math.sign(input.wheel));
    const shellPress = (input.wasPressed('KeyF') || input.wasPressed('Mouse1')) && !this.reloading && this.charge === 0;
    if (shells.type.id === 'homing') {
      // hold to paint targets, release to fire
      const sp = shells.specials;
      if (shellPress && !sp.painting) sp.startPaint();
      if (sp.painting && !input.isDown('KeyF') && !input.isDown('Mouse1')) this.wantShell = true;
    } else if (shellPress) this.wantShell = true;

    if (this.reloading) {
      const prev = this.reloadT;
      this.reloadT += dt / T.shells.rackTime;
      if (prev < 0.18 && this.reloadT >= 0.18) sfx.reloadOut();
      if (prev < 0.68 && this.reloadT >= 0.68) sfx.reloadIn();
      if (this.reloadT >= 1) this.reloadT = -1;
    }

    // gun spring
    const w = T.recoil.gunRecoverSpeed;
    this.kickV += (-w * w * this.kick - 2 * w * this.kickV) * dt;
    this.kick += this.kickV * dt;

    // sway from mouse movement (FP flavour)
    const sw = 1 - this.adsEase * 0.85;
    this.sway.x = THREE.MathUtils.damp(this.sway.x, THREE.MathUtils.clamp(-(player.lookDX || 0) * 0.0006, -0.04, 0.04) * sw, 10, dt);
    this.sway.y = THREE.MathUtils.damp(this.sway.y, THREE.MathUtils.clamp((player.lookDY || 0) * 0.0006, -0.04, 0.04) * sw, 10, dt);

    const combat = player.fp || this.adsT > 0 || this.cooldown > -0.4 || this.reloading || player.inCombat;
    // critically damped spring: eases in and out instead of starting at full speed
    const cw = combat ? 16 : 7;
    this.combatV = (this.combatV || 0) + ((combat ? 1 : 0) - this.combatBlend) * cw * cw * dt - 2 * cw * (this.combatV || 0) * dt;
    this.combatBlend = THREE.MathUtils.clamp(this.combatBlend + this.combatV * dt, 0, 1);
    this.sprintBlend = THREE.MathUtils.damp(this.sprintBlend, player.sprinting ? 1 : 0, 8, dt);
  }

  get wantsFire() { return this.buffer > 0; }

  // after a shell: the support hand goes to the belt and feeds the next one
  startRack() {
    if (this.reloading) return;
    this.cancelCharge();
    this.reloadT = 0;
    this.buffer = 0;
  }

  // Trigger handling. In 'release' mode a tap fires when the button comes back up
  // (or after tapWindow if still held -> that becomes a charge instead), so a
  // charge can start from a cold gun without spending a round first.
  updateTrigger(dt, input) {
    const C = T.charge, W = T.weapon;
    if (C.mode === 'press') {
      if (input.wasPressed('Mouse0')) { this.buffer = W.inputBuffer; this.holding = true; this.holdT = 0; }
      return;
    }
    if (input.wasPressed('Mouse0')) { this.pressT = 0; this.holding = true; this.holdT = 0; }
    if (this.pressT >= 0) {
      this.pressT += dt;
      if (!input.isDown('Mouse0')) {
        if (this.pressT <= C.tapWindow || this.charge < C.min) this.buffer = W.inputBuffer; // a tap
        this.pressT = -1;
      }
    }
  }

  spreadDeg(player) {
    const W = T.weapon;
    const hs = Math.hypot(player.vel.x, player.vel.z);
    let s = THREE.MathUtils.lerp(W.hipSpread, W.adsSpread, this.adsEase);
    s += W.moveSpread * Math.min(1, hs / T.movement.walkSpeed) * (1 - 0.75 * this.adsEase);
    if (!player.grounded) s += W.airSpread;
    return s + this.bloom * (1 - 0.5 * this.adsEase);
  }

  /** Find what the crosshair is pointing at (no spread). */
  computeAimPoint(camera, player) {
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const skip = player.fp ? 0 : camera.position.distanceTo(player.renderPos) * 0.8;
    const o = camera.position.clone().addScaledVector(fwd, skip);
    const hit = this.game.physics.raycast(o, fwd, 80, player.collider);
    this.aimPoint.copy(hit ? hit.point : o.addScaledVector(fwd, 80));
    return this.aimPoint;
  }

  /**
   * The first-person (view-model) gun pose, in world space. In third person the gun
   * lives in the Courier's right hand instead (character.poseHands places it).
   */
  fpPose(dt, camera, player, character) {
    const s = character.gunScale;
    const e = this.adsEase;
    const rl = this.reloading ? smooth(0, 0.14, this.reloadT) * (1 - smooth(0.82, 1, this.reloadT)) : 0;
    const aim = this.aimPoint;
    const camQ = camera.quaternion;
    const bob = player.bobPhase;
    const hs = Math.min(1, Math.hypot(player.vel.x, player.vel.z) / 5) * (player.grounded ? 1 : 0);
    // (the gun in the left hand - right-side wallruns - moves the view model to the left)
    const side = 1 - 2 * smooth(0, 1, character.st?.hand || 0);
    const hip = new THREE.Vector3(0.16 * side, -0.2, -0.6);
    const ads = new THREE.Vector3(0, -GUN_POINTS.sightY * s + T.weapon.adsHeight, -T.weapon.adsDistance);
    const off = hip.lerp(ads, e);
    off.x += this.sway.x + Math.sin(bob) * 0.012 * hs * (1 - e * 0.9);
    off.y += this.sway.y - Math.abs(Math.cos(bob)) * 0.01 * hs * (1 - e * 0.9);
    off.add(new THREE.Vector3(-0.06 * side, -0.08, 0.06).multiplyScalar(rl));
    off.add(new THREE.Vector3(-0.05 * side, -0.1, 0.05).multiplyScalar(this.sprintBlend));
    const pos = off.applyQuaternion(camQ).add(camera.position);
    const camFwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camQ);
    const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camQ);
    const hipDir = aim.clone().sub(pos).normalize();
    if (hipDir.dot(camFwd) < 0.8) hipDir.copy(camFwd);
    const dir = hipDir.lerp(camFwd, e).normalize();
    dir.addScaledVector(camUp, -0.6 * this.sprintBlend).normalize();
    const q = basisQuat(dir, camUp);
    const k = this.kick * (1 - (1 - T.recoil.adsMult) * e);
    pos.addScaledVector(dir, -T.recoil.gunKickBack * k);
    q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), T.recoil.gunKickRot * DEG * k));
    // reload: cant the gun, tip the muzzle up
    if (rl > 0) q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-40 * DEG * rl, 0, 18 * DEG * rl)));
    this.fpPos.copy(pos);
    this.fpQ.copy(q);

    // first-person reload: the support hand goes to the belt, then up into the magwell
    this.leftBlend = 0;
    if (this.reloading) {
      const t = this.reloadT;
      const belt = new THREE.Vector3(0.18, 0.95, 0.12).applyAxisAngle(UP, player.bodyYaw).add(player.renderPos);
      const well = GUN_POINTS.magwell.clone().multiplyScalar(s).applyQuaternion(q).add(pos).add(new THREE.Vector3(0, -0.06, 0));
      if (t < 0.45) { this.leftOverride.copy(belt); this.leftBlend = smooth(0.12, 0.35, t); }
      else if (t < 0.75) { this.leftOverride.lerpVectors(belt, well, smooth(0.45, 0.68, t)); this.leftBlend = 1; }
      else { this.leftOverride.copy(well); this.leftBlend = 1 - smooth(0.75, 0.95, t); }
    }
  }

  // Hold to charge (reserving Lachryma as it winds up), release to unleash.
  updateCharge(dt, input) {
    const C = T.charge;
    const pool = this.game.lachryma;
    const held = input.isDown('Mouse0');
    const startAt = C.mode === 'press' ? C.delay : C.tapWindow;
    if (this.holding && held) {
      this.holdT += dt;
      if (this.holdT > startAt && !this.reloading && this.charge < 1 && this.drawn) {
        const want = (dt / C.time) * C.cost;
        const got = pool.reserve(pool.cost(want, 'charge'));
        this.chargeReserved += got;
        if (got > 0) {
          if (!this.chargeSound) this.chargeSound = sfx.chargeLoop();
          const was = this.charge;
          this.charge = Math.min(1, this.charge + dt / C.time);
          if (was < 1 && this.charge >= 1) this.game.hud.popup('CHARGED');
        } else if (this.charge === 0 && this.holdT - dt <= startAt) { sfx.fizzle(); this.game.hud.lachrymaPulse(false); }
      }
    } else if (this.holding) {
      this.holding = false;
      if (this.charge >= C.min) this.releaseCharged = true;
      else this.cancelCharge();
    }
    if (this.reloading && this.charge > 0) this.cancelCharge();
    this.chargeSound?.set(this.charge);
    this.game.character?.setGunGlow(this.charge);
  }

  cancelCharge() {
    if (this.chargeReserved) this.game.lachryma.refund(this.chargeReserved);
    this.chargeReserved = 0;
    this.charge = 0;
    this.holding = false;
    this.releaseCharged = false;
    this.chargeSound?.stop();
    this.chargeSound = null;
  }

  // The ray a bullet actually travels: from the eye in FP; in TP the crosshair
  // ray picks a target point and the bullet flies there from the shoulder.
  shotRay(camera, player, character, dir) {
    if (player.fpWeight > 0.5) return { origin: camera.position.clone(), dir };
    const skip = camera.position.distanceTo(player.renderPos) * 0.8;
    const o = camera.position.clone().addScaledVector(dir, skip);
    const h1 = this.game.physics.raycast(o, dir, T.weapon.range, player.collider);
    const P = h1 ? h1.point : o.addScaledVector(dir, T.weapon.range);
    const origin = character.shoulder('R', new THREE.Vector3());
    return { origin, dir: P.sub(origin).normalize() };
  }

  /** Called after the gun is posed so the muzzle is current. */
  tryFire(camera, player, character) {
    if (this.wantShell) {
      if (this.cooldown > 0 || !this.drawn) return; // held until the gun is ready (and out)
      this.wantShell = false;
      this.game.shells.fire({ camera, player, character, weapon: this });
      this.cooldown = T.weapon.fireInterval * 1.5;
      return;
    }
    if (this.releaseCharged) { this.fireCharged(camera, player, character); return; }
    if (this.buffer > 0 && !this.drawn) { this.buffer = Math.max(this.buffer, 0.05); return; } // quick-draw: fires once it's out
    if (this.buffer <= 0 || this.cooldown > 0) return;
    if (this.reloading) return;
    this.buffer = 0;
    if (!this.game.lachryma.spend(T.lachryma.shotCost, 'shot')) {
      this.cooldown = 0.2;
      sfx.fizzle();
      this.game.hud.lachrymaPulse(false);
      this.game.fx.impact(character.gunPoint('muzzle', new THREE.Vector3()), new THREE.Vector3(0, 1, 0), { sparks: 3, dust: 2 });
      return;
    }
    this.cooldown = T.weapon.fireInterval;
    this.shots++;
    const game = this.game;

    // spread cone around the crosshair
    const spread = this.spreadDeg(player) * DEG;
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const rr = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const uu = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    const a = Math.sqrt(Math.random()) * spread, phi = Math.random() * Math.PI * 2;
    const dir = fwd.clone().multiplyScalar(Math.cos(a)).addScaledVector(rr, Math.sin(a) * Math.cos(phi)).addScaledVector(uu, Math.sin(a) * Math.sin(phi)).normalize();

    const range = T.weapon.range;
    const ray = this.shotRay(camera, player, character, dir);
    dir.copy(ray.dir);
    const hit = game.physics.raycast(ray.origin, ray.dir, range, player.collider);

    const muzzle = character.gunPoint('muzzle', new THREE.Vector3());
    const gunFwd = new THREE.Vector3(1, 0, 0).applyQuaternion(character.gun.quaternion);
    const end = hit ? hit.point : camera.position.clone().addScaledVector(dir, range);
    game.fx.tracer(muzzle, end);
    game.fx.muzzleFlash(muzzle, gunFwd);
    sfx.gunshot();

    if (hit) this.applyHit(hit, dir);
    game.clappers?.spook(end);

    // recoil
    const m = THREE.MathUtils.lerp(1, T.recoil.adsMult, this.adsEase);
    player.addRecoil(T.recoil.kickPitch * m, (Math.random() * 2 - 1) * T.recoil.kickYaw * m);
    this.kickV += 1 * T.recoil.gunRecoverSpeed * Math.E;
    this.bloom = Math.min(T.weapon.bloomMax, this.bloom + T.weapon.bloomPerShot);
    this.vent(character);
  }

  fireCharged(camera, player, character) {
    const C = T.charge, game = this.game;
    const p = 0.4 + 0.6 * this.charge;
    this.game.lachryma.commit(this.chargeReserved, 'charge');
    this.chargeReserved = 0;
    this.cancelCharge();
    this.buffer = 0;
    this.cooldown = T.weapon.fireInterval * 2;
    this.shots++;

    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const ray = this.shotRay(camera, player, character, fwd);
    const dir = ray.dir;
    // pierce: keep going through breakables, props and critters until we hit the level
    const skip = new Set();
    let origin = ray.origin, end = null, lastNormal = new THREE.Vector3(0, 1, 0), hits = 0;
    for (let i = 0; i < C.pierce + 1; i++) {
      const hit = game.physics.raycast(origin, dir, T.weapon.range, player.collider, undefined, (c) => !skip.has(c.handle));
      if (!hit) break;
      skip.add(hit.collider.handle);
      const ent = hit.entity;
      end = hit.point; lastNormal = hit.normal;
      const body = hit.collider.parent();
      const solid = !ent || ent.type === 'player' || (!body?.isDynamic() && ent.type !== 'breakable' && ent.type !== 'clapper');
      if (ent?.type === 'mover' && ent.mover.target) ent.mover.hit({ cause: 'shot' });
      if (solid || i === C.pierce) { game.fx.impact(hit.point, hit.normal, { sparks: 14, dust: 12, decal: true }); break; }
      if (ent.type === 'breakable') { hits++; game.breakables.damage(ent, C.damage * p, hit.point, dir, 1.3 + 0.5 * p); }
      else if (ent.type === 'rope') game.breakables.cutRope(ent.rope, ent.index, hit.point, dir);
      else if (ent.type === 'clapper') { hits++; game.clappers.hit(ent, hit.point, dir, 1.6, 'charged'); }
      else if (ent.type === 'slice') { hits++; game.breakables.crumble(ent, hit.point, dir); }
      else game.physics.kick(body, dir.clone().multiplyScalar(Math.min(C.impulse * p, body.mass() * 25)), hit.point);
    }
    if (!end) end = ray.origin.clone().addScaledVector(dir, T.weapon.range);
    if (hits) { this.hits++; game.hud.hitmarker(true); sfx.hitmarker(); }

    const muzzle = character.gunPoint('muzzle', new THREE.Vector3());
    game.fx.beam(muzzle, end, p);
    game.fx.muzzleFlash(muzzle, new THREE.Vector3(1, 0, 0).applyQuaternion(character.gun.quaternion));
    // small shockwave where the beam lands
    const R = C.blastRadius * p;
    const blastAt = end.clone().addScaledVector(lastNormal, 0.1);
    game.fx.shockwave(blastAt, R);
    game.fx.impact(blastAt, lastNormal, { sparks: 20, dust: 16 });
    game.breakables.explode(blastAt, { radius: R, breakFrac: 0.45, velocity: 8 * p, fx: false, cause: 'charged' });
    game.clappers?.spook(end, 3);
    sfx.chargedShot(p);

    const m = THREE.MathUtils.lerp(1, T.recoil.adsMult, this.adsEase) * C.kick * p;
    player.addRecoil(T.recoil.kickPitch * m, (Math.random() * 2 - 1) * T.recoil.kickYaw * m);
    player.shake = Math.max(player.shake, C.shake * p);
    player.fovPunch = C.fovPunch * p;
    this.kickV += 1.8 * T.recoil.gunRecoverSpeed * Math.E;
    this.bloom = T.weapon.bloomMax;
    this.vent(character, 3);
  }

  applyHit(hit, dir) {
    const game = this.game;
    const ent = hit.entity;
    if (ent?.type === 'rope') {
      game.breakables.cutRope(ent.rope, ent.index, hit.point, dir);
      game.hud.hitmarker(false);
      return;
    }
    if (ent?.type === 'clapper') {
      this.hits++;
      game.clappers.hit(ent, hit.point, dir, 1);
      game.hud.hitmarker(true);
      sfx.hitmarker();
      return;
    }
    if (ent?.type === 'slice') {
      this.hits++;
      game.breakables.crumble(ent, hit.point, dir);
      game.hud.hitmarker(true);
      return;
    }
    if (ent?.type === 'mover' && ent.mover.target) { ent.mover.hit({ cause: 'shot' }); game.fx.impact(hit.point, hit.normal, { color: PALETTE.glow, sparks: 6, dust: 3 }); return; }
    if (ent?.type === 'bauble') { ent.body.applyImpulse(dir.clone().multiplyScalar(0.3 * ent.body.mass() * 10), true); return; }
    if (ent?.type === 'breakable') {
      this.hits++;
      const broke = game.breakables.damage(ent, T.weapon.damage * (ent.marked ? T.shells.mark.damageMult : 1), hit.point, dir);
      game.hud.hitmarker(broke);
      sfx.hitmarker();
      return;
    }
    const body = hit.collider.parent();
    if (body && body.isDynamic()) {
      const imp = Math.min(T.weapon.impulse, body.mass() * 14);
      game.physics.kick(body, dir.clone().multiplyScalar(imp), hit.point);
      game.fx.impact(hit.point, hit.normal, { color: PALETTE.pale, sparks: 4, dust: 3 });
      if (ent?.type === 'prop') game.hud.hitmarker(false);
    } else {
      game.fx.impact(hit.point, hit.normal, { color: PALETTE.pale, sparks: 7, dust: 7, decal: true });
    }
    sfx.impact(game.listenerDistance(hit.point));
  }

  ejectCasing(character, player) {
    const g = this.game;
    const p = character.gunPoint('eject', new THREE.Vector3());
    const q = character.gun.quaternion;
    const right = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
    const back = new THREE.Vector3(-1, 0, 0).applyQuaternion(q);
    const v = right.multiplyScalar(2.2 + Math.random()).addScaledVector(up, 2 + Math.random()).addScaledVector(back, 0.4).add(player.vel);
    this.spawnDebris(p, q, v, this.casingGeo, this.casingMat, RAPIER.ColliderDesc.cylinder(0.016, 0.009), 'casing');
  }

  // spent clay shell tumbles out of the port
  ejectShell(character, player) {
    const p = character.gunPoint('eject', new THREE.Vector3());
    const q = character.gun.quaternion;
    const v = new THREE.Vector3(0, 0, 1).applyQuaternion(q).multiplyScalar(2.5).addScaledVector(new THREE.Vector3(0, 1, 0).applyQuaternion(q), 2.2).add(player.vel);
    this.spawnDebris(p, q, v, this.shellGeo, this.shellMat, RAPIER.ColliderDesc.cylinder(0.035, 0.022), 'casing');
  }

  // energy shots vent a puff of pale vapour instead of brass
  vent(character, n = 1) {
    const fx = this.game.fx;
    const p = character.gunPoint('eject', new THREE.Vector3());
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(character.gun.quaternion);
    const c = new THREE.Color(PALETTE.cream);
    for (let i = 0; i < 4 * n; i++) {
      fx.alpha.emit({ pos: p, vel: up.clone().multiplyScalar(0.6 + Math.random()).add(new THREE.Vector3().randomDirection().multiplyScalar(0.3)),
        life: 0.5 + Math.random() * 0.4, size: 0.03, sizeEnd: 0.2, color: c, alpha: 0.3, drag: 3, gravity: -0.5 });
    }
  }

  spawnDebris(p, q, v, geo, mat, cd, kind) {
    const g = this.game;
    const body = g.physics.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(p.x, p.y, p.z).setRotation(q)
      .setLinvel(v.x, v.y, v.z).setAngvel(new THREE.Vector3().randomDirection().multiplyScalar(18)).setCcdEnabled(true));
    const col = g.physics.world.createCollider(cd.setDensity(3000).setRestitution(0.35).setCollisionGroups(GROUPS.debris)
      .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS), body);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    g.scene.add(mesh);
    const ent = { type: kind === 'casing' ? 'casing' : 'prop', body, mesh };
    ent.sync = g.physics.addSynced(body, mesh);
    g.physics.register(col, ent);
    this.casings.push({ ent, age: 0 });
    if (this.casings.length > 30) this.removeDebris(this.casings.shift());
  }

  removeDebris(c) {
    const g = this.game;
    g.physics.removeSynced(c.ent.sync);
    g.physics.removeBody(c.ent.body);
    g.scene.remove(c.ent.mesh);
  }

  updateDebris(dt) {
    for (let i = this.casings.length - 1; i >= 0; i--) {
      const c = this.casings[i];
      c.age += dt;
      if (c.age > 10) { this.removeDebris(c); this.casings.splice(i, 1); }
    }
  }

  clearDebris() { for (const c of this.casings) this.removeDebris(c); this.casings.length = 0; }
}
