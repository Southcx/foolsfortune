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
    this.ammo = T.weapon.magSize;
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
    this.casingGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.032, 6);
    this.casingMat = new THREE.MeshStandardMaterial({ color: PALETTE.cream, roughness: 0.3, metalness: 0.4, flatShading: true });
    this.magGeo = new THREE.BoxGeometry(0.03, 0.11, 0.055);
    this.magMat = new THREE.MeshStandardMaterial({ color: PALETTE.deep, flatShading: true });
  }

  get reloading() { return this.reloadT >= 0; }

  /** Input + timers. Called once per frame before physics. */
  update(dt, input, player) {
    const W = T.weapon;
    const wantAds = input.isDown('Mouse2') && !this.reloading;
    const step = dt / Math.max(0.01, W.adsTime);
    this.adsT = wantAds ? Math.min(1, this.adsT + step) : Math.max(0, this.adsT - step);
    this.adsEase = this.adsT * this.adsT * (3 - 2 * this.adsT);
    this.cooldown -= dt;
    this.buffer -= dt;
    this.bloom = Math.max(0, this.bloom - W.bloomRecovery * dt);

    if (input.wasPressed('Mouse0')) this.buffer = W.inputBuffer;
    if (input.wasPressed('KeyR') && this.ammo < W.magSize && !this.reloading) this.startReload();

    if (this.reloading) {
      const prev = this.reloadT;
      this.reloadT += dt / W.reloadTime;
      if (prev < 0.18 && this.reloadT >= 0.18) { sfx.reloadOut(); this.dropMag(); }
      if (prev < 0.68 && this.reloadT >= 0.68) sfx.reloadIn();
      if (this.reloadT >= 1) { this.reloadT = -1; this.ammo = W.magSize; }
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
    this.combatBlend = THREE.MathUtils.damp(this.combatBlend, combat ? 1 : 0, combat ? 14 : 4, dt);
    this.sprintBlend = THREE.MathUtils.damp(this.sprintBlend, player.sprinting ? 1 : 0, 8, dt);
  }

  get wantsFire() { return this.buffer > 0; }

  startReload() {
    if (this.reloading) return;
    this.reloadT = 0;
    this.buffer = 0;
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

  /** Place the gun in the world. The arms then IK onto it. */
  poseGun(dt, camera, player, character) {
    const s = character.gunScale;
    const e = this.adsEase;
    const rl = this.reloading ? smooth(0, 0.14, this.reloadT) * (1 - smooth(0.82, 1, this.reloadT)) : 0;
    const aim = this.aimPoint;

    // ---- first-person pose, in camera space (-Z forward) --------------------
    const camQ = camera.quaternion;
    const bob = player.bobPhase;
    const hs = Math.min(1, Math.hypot(player.vel.x, player.vel.z) / 5) * (player.grounded ? 1 : 0);
    const hip = new THREE.Vector3(0.16, -0.2, -0.6);
    const ads = new THREE.Vector3(0, -GUN_POINTS.sightY * s + T.weapon.adsHeight, -T.weapon.adsDistance);
    const off = hip.lerp(ads, e);
    off.x += this.sway.x + Math.sin(bob) * 0.012 * hs * (1 - e * 0.9);
    off.y += this.sway.y - Math.abs(Math.cos(bob)) * 0.01 * hs * (1 - e * 0.9);
    off.add(new THREE.Vector3(-0.06, -0.08, 0.06).multiplyScalar(rl));
    off.add(new THREE.Vector3(-0.05, -0.1, 0.05).multiplyScalar(this.sprintBlend));
    const fpPos = off.applyQuaternion(camQ).add(camera.position);
    const camFwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camQ);
    const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camQ);
    const hipDir = aim.clone().sub(fpPos).normalize();
    if (hipDir.dot(camFwd) < 0.8) hipDir.copy(camFwd);
    const fpDir = hipDir.lerp(camFwd, e).normalize();
    fpDir.addScaledVector(camUp, -0.6 * this.sprintBlend).normalize();

    // ---- third-person pose, around the shoulders ---------------------------
    const O = character.shoulder('R', new THREE.Vector3()).add(character.shoulder('L', new THREE.Vector3())).multiplyScalar(0.5);
    const aimDir = aim.clone().sub(O).normalize();
    const r = new THREE.Vector3().crossVectors(aimDir, UP).normalize();
    const u = new THREE.Vector3().crossVectors(r, aimDir);
    const aimPos = O.clone().addScaledVector(aimDir, 0.66).addScaledVector(r, 0.02).addScaledVector(u, -0.06);
    const adsPos = O.clone().addScaledVector(aimDir, 0.68).addScaledVector(u, 0.13).addScaledVector(r, -0.02);
    const bodyFwd = new THREE.Vector3(Math.sin(player.bodyYaw), 0, Math.cos(player.bodyYaw));
    const bodyRight = new THREE.Vector3(-bodyFwd.z, 0, bodyFwd.x);
    const lowPos = O.clone().addScaledVector(bodyFwd, 0.45).addScaledVector(UP, -0.28).addScaledVector(bodyRight, 0.08);
    const lowDir = bodyFwd.clone().addScaledVector(UP, -1.1).addScaledVector(bodyRight, -0.2).normalize();
    const cb = this.combatBlend * (1 - this.sprintBlend * 0.6);
    const tpPos = lowPos.lerp(aimPos.lerp(adsPos, e), cb);
    tpPos.addScaledVector(r, -0.08 * rl).addScaledVector(u, -0.1 * rl).addScaledVector(aimDir, -0.1 * rl);
    const tpDir = lowDir.lerp(aim.clone().sub(tpPos).normalize(), cb).normalize();

    // ---- blend + recoil ------------------------------------------------------
    const fw = player.fpWeight;
    const pos = tpPos.lerp(fpPos, fw);
    const dir = tpDir.lerp(fpDir, fw).normalize();
    const up = UP.clone().lerp(camUp, fw).normalize();
    const q = basisQuat(dir, up);
    const k = this.kick * (1 - (1 - T.recoil.adsMult) * e);
    pos.addScaledVector(dir, -T.recoil.gunKickBack * k);
    q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), T.recoil.gunKickRot * DEG * k));
    // reload: cant the gun, tip the muzzle up
    if (rl > 0) {
      q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-40 * DEG * rl, 0, 18 * DEG * rl)));
    }
    character.gun.position.copy(pos);
    character.gun.quaternion.copy(q);
    character.gun.updateMatrixWorld(true);

    // support hand during reload: to the belt, then up into the magwell
    this.leftBlend = 0;
    if (this.reloading) {
      const t = this.reloadT;
      const belt = new THREE.Vector3(0.18, 0.95, 0.12).applyAxisAngle(UP, player.bodyYaw).add(player.renderPos);
      const well = character.gunPoint('magwell', new THREE.Vector3()).add(new THREE.Vector3(0, -0.06, 0));
      if (t < 0.45) { this.leftOverride.copy(belt); this.leftBlend = smooth(0.12, 0.35, t); }
      else if (t < 0.75) { this.leftOverride.lerpVectors(belt, well, smooth(0.45, 0.68, t)); this.leftBlend = 1; }
      else { this.leftOverride.copy(well); this.leftBlend = 1 - smooth(0.75, 0.95, t); }
    }
  }

  /** Called after the gun is posed so the muzzle is current. */
  tryFire(camera, player, character) {
    if (this.buffer <= 0 || this.cooldown > 0) return;
    if (this.reloading) return;
    if (this.ammo <= 0) {
      this.buffer = 0;
      this.cooldown = 0.25;
      sfx.dryFire();
      if (T.weapon.autoReload) this.startReload();
      return;
    }
    this.buffer = 0;
    this.cooldown = T.weapon.fireInterval;
    this.ammo--;
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
    let hit;
    if (player.fpWeight > 0.5) {
      hit = game.physics.raycast(camera.position, dir, range, player.collider);
    } else {
      const skip = camera.position.distanceTo(player.renderPos) * 0.8;
      const o = camera.position.clone().addScaledVector(dir, skip);
      const h1 = game.physics.raycast(o, dir, range, player.collider);
      const P = h1 ? h1.point : o.addScaledVector(dir, range);
      const origin = character.shoulder('R', new THREE.Vector3());
      const d2 = P.clone().sub(origin);
      const len = d2.length();
      hit = game.physics.raycast(origin, d2.divideScalar(len), len + 0.3, player.collider);
      if (hit) dir.copy(d2);
    }

    const muzzle = character.gunPoint('muzzle', new THREE.Vector3());
    const gunFwd = new THREE.Vector3(1, 0, 0).applyQuaternion(character.gun.quaternion);
    const end = hit ? hit.point : camera.position.clone().addScaledVector(dir, range);
    game.fx.tracer(muzzle, end);
    game.fx.muzzleFlash(muzzle, gunFwd);
    sfx.gunshot();

    if (hit) this.applyHit(hit, dir);

    // recoil
    const m = THREE.MathUtils.lerp(1, T.recoil.adsMult, this.adsEase);
    player.addRecoil(T.recoil.kickPitch * m, (Math.random() * 2 - 1) * T.recoil.kickYaw * m);
    this.kickV += 1 * T.recoil.gunRecoverSpeed * Math.E;
    this.bloom = Math.min(T.weapon.bloomMax, this.bloom + T.weapon.bloomPerShot);
    this.ejectCasing(character, player);
    if (this.ammo === 0 && T.weapon.autoReload) game.fx.after(0.25, () => this.startReload());
  }

  applyHit(hit, dir) {
    const game = this.game;
    const ent = hit.entity;
    if (ent?.type === 'breakable') {
      this.hits++;
      const broke = game.breakables.damage(ent, T.weapon.damage, hit.point, dir);
      game.hud.hitmarker(broke);
      sfx.hitmarker();
      return;
    }
    const body = hit.collider.parent();
    if (body && body.isDynamic()) {
      const imp = Math.min(T.weapon.impulse, body.mass() * 14);
      body.applyImpulseAtPoint(dir.clone().multiplyScalar(imp), hit.point, true);
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

  dropMag() {
    const ch = this.game.character;
    const p = ch.gunPoint('magwell', new THREE.Vector3());
    this.spawnDebris(p, ch.gun.quaternion, new THREE.Vector3(0, -1, 0).add(this.game.player.vel), this.magGeo, this.magMat, RAPIER.ColliderDesc.cuboid(0.015, 0.055, 0.0275), 'mag');
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
