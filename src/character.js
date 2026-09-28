import * as THREE from 'three';
import { T, PALETTE, DEG } from './config.js';
import { addOutline, applyFpHide, fpHideUniform, OUTLINE_MAT_FPHIDE, OUTLINE_MAT_CHAR, withFade, fadeUniform } from './outline.js';

// Procedural animation for the Courier rig. Everything is layered on top of the
// T-pose rest each frame:
//   legs   – FK gait driven by movement speed/direction, air tuck, landing dip
//   spine  – aim pitch/yaw distributed through the chest, run lean, breathing
//   arms   – analytic two-bone IK onto the gun's grip points (gun drives hands)
//   hands  – oriented from the gun frame, fingers curled into a grip

const UP = new THREE.Vector3(0, 1, 0);
const X = new THREE.Vector3(1, 0, 0);
const Zv = new THREE.Vector3(0, 0, 1);
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _v4 = new THREE.Vector3();
const _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
const _m1 = new THREE.Matrix4();

const MATS = {
  Courier_Armor: () => new THREE.MeshStandardMaterial({ color: PALETTE.mid, roughness: 0.65, metalness: 0.05, flatShading: true }),
  CourierEnergy: () => new THREE.MeshStandardMaterial({ color: PALETTE.cream, roughness: 0.4, emissive: PALETTE.glow, emissiveIntensity: 0.18 }),
  CourierEnergyShell: () => new THREE.MeshStandardMaterial({ color: PALETTE.pale, roughness: 0.3, transparent: true, opacity: 0.22, depthWrite: false }),
  CourierMask: () => new THREE.MeshStandardMaterial({ color: PALETTE.deep, roughness: 0.5, flatShading: true }),
};
const OUTLINED = new Set(['Courier_Armor', 'CourierMask', 'Kiritohair']);

export const GUN_POINTS = {
  // in gun-model units (multiply by gunScale for metres); +X barrel, +Y up, +Z right
  muzzle: new THREE.Vector3(0.36, 0.027, 0),
  eject: new THREE.Vector3(0.0, 0.09, 0.03),
  magwell: new THREE.Vector3(-0.25, -0.18, 0),
  sightY: 0.118,
  gripR: new THREE.Vector3(-0.34, -0.13, 0.04),
  gripL: new THREE.Vector3(-0.3, -0.19, -0.07),
};

const ARM_BONE = /^(upper_arm|forearm|hand|f_|thumb)/;
function tagArmBones(mesh) {
  const g = mesh.geometry;
  const si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
  const bones = mesh.skeleton.bones;
  const out = new Float32Array(si.count);
  for (let i = 0; i < si.count; i++) {
    let w = 0;
    for (let k = 0; k < 4; k++) if (ARM_BONE.test(bones[si.getComponent(i, k)]?.name || '')) w += sw.getComponent(i, k);
    out[i] = w;
  }
  g.setAttribute('fpHide', new THREE.BufferAttribute(out, 1));
}

export class Character {
  constructor(scene, charGltf, gunGltf) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.root.name = 'CourierRoot';
    this.model = charGltf.scene;
    this.root.add(this.model);
    scene.add(this.root);

    this.fpHidden = [];
    const byMat = new Map();
    const meshes = [];
    this.model.traverse((o) => { if (o.isMesh) meshes.push(o); });
    for (const o of meshes) {
      const name = o.material.name;
      const isArmor = o.parent?.name === 'Courier_Armor';
      const key = isArmor ? `${name}_armor` : name;
      if (!byMat.has(key)) {
        const m = (MATS[name] || MATS.CourierEnergy)();
        if (isArmor) { m.onBeforeCompile = applyFpHide; m.customProgramCacheKey = () => 'fphide'; }
        byMat.set(key, withFade(m, key));
      }
      o.material = byMat.get(key);
      if (isArmor) tagArmBones(o);
      o.castShadow = true;
      o.receiveShadow = true;
      o.frustumCulled = false;
      const outlined = OUTLINED.has(name) || OUTLINED.has(o.parent?.name) || OUTLINED.has(o.name);
      if (outlined) addOutline(o, isArmor ? OUTLINE_MAT_FPHIDE : OUTLINE_MAT_CHAR);
      if (o.name === 'Courier_Mask' || o.name === 'Kiritohair') this.fpHidden.push(o, o.userData.outline);
    }

    this.bones = {};
    this.model.traverse((o) => { if (o.isBone) this.bones[o.name] = o; });
    this.root.updateMatrixWorld(true);
    this.rest = new Map();
    this.restCharInv = new Map();
    this.restCharQ = new Map();
    this.restPos = new Map();
    for (const b of Object.values(this.bones)) {
      this.rest.set(b, { q: b.quaternion.clone(), p: b.position.clone(), s: b.scale.clone() });
      const wq = b.getWorldQuaternion(new THREE.Quaternion());
      this.restCharQ.set(b, wq);
      this.restCharInv.set(b, wq.clone().invert());
      this.restPos.set(b, b.getWorldPosition(new THREE.Vector3()));
    }
    const B = this.bones;
    const len = (a, b) => this.restPos.get(B[a]).distanceTo(this.restPos.get(B[b]));
    this.arm = {
      R: { upper: B.upper_armR, fore: B.forearmR, hand: B.handR, a: len('upper_armR', 'forearmR'), b: len('forearmR', 'handR'), side: -1 },
      L: { upper: B.upper_armL, fore: B.forearmL, hand: B.handL, a: len('upper_armL', 'forearmL'), b: len('forearmL', 'handL'), side: 1 },
    };
    // palm normal (rest T-pose palms face down) in each hand's local frame
    for (const s of ['R', 'L']) {
      const h = this.arm[s].hand;
      this.arm[s].palmLocal = new THREE.Vector3(0, -1, 0).applyQuaternion(this.restCharInv.get(h));
      this.arm[s].fingers = Object.values(B).filter((b) => /^(f_|thumb)/.test(b.name) && b.name.endsWith(s));
    }
    this.hipsRestY = B.spine.position.y;

    // gun
    this.gun = new THREE.Group();
    this.gunModel = gunGltf.scene;
    const gunMeshes = [];
    this.gunGlowMats = [];
    this.gunModel.traverse((o) => { if (o.isMesh) gunMeshes.push(o); });
    for (const o of gunMeshes) {
      const shell = o.material.name === 'CourierEnergyShell';
      o.material = shell
        ? new THREE.MeshStandardMaterial({ color: PALETTE.pale, roughness: 0.5, flatShading: true, emissive: PALETTE.glow, emissiveIntensity: 0 })
        : new THREE.MeshStandardMaterial({ color: PALETTE.dark, roughness: 0.55, metalness: 0.1, flatShading: true });
      if (shell) this.gunGlowMats.push(o.material);
      withFade(o.material, `gun${gunMeshes.indexOf(o)}`);
      o.castShadow = true;
      addOutline(o, OUTLINE_MAT_CHAR);
    }
    // greybox iron sights so ADS has something to line up
    const sightMat = withFade(new THREE.MeshStandardMaterial({ color: PALETTE.deep, flatShading: true }), 'sight');
    const dotMat = withFade(new THREE.MeshBasicMaterial({ color: PALETTE.hot }), 'dot');
    const y = GUN_POINTS.sightY;
    for (const z of [-0.016, 0.016]) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.036, 0.012), sightMat);
      r.position.set(-0.2, y - 0.016, z);
      this.gunModel.add(r);
    }
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.036, 0.01), sightMat);
    f.position.set(0.32, y - 0.016, 0);
    const dot = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.01, 0.012), dotMat);
    dot.position.set(0.312, y - 0.004, 0);
    this.gunModel.add(f, dot);
    this.gun.add(this.gunModel);
    scene.add(this.gun);
    this.setGunScale(T.weapon.gunScale);

    // animation state
    this.phase = 0;
    this.moveT = 0;
    this.runT = 0;
    this.airT = 0;
    this.dip = 0;
    this.dipV = 0;
    this.moveDir = new THREE.Vector3(0, 0, 1);
    this.time = 0;
    this.lastStepSign = 1;
    this.onFootstep = null;
    this.fpMode = false;
  }

  setFade(f) { fadeUniform.value = f; }

  // psygun heats up while charging
  setGunGlow(level) {
    const t = performance.now() * 0.02;
    const k = level > 0 ? level * 2.2 + (level >= 1 ? 0.5 * Math.sin(t) : 0) : 0;
    for (const m of this.gunGlowMats) m.emissiveIntensity = k;
  }

  setGunScale(s) { this.gunModel.scale.setScalar(s); this.gunScale = s; }

  gunPoint(name, target = new THREE.Vector3()) {
    return target.copy(GUN_POINTS[name]).multiplyScalar(this.gunScale).applyMatrix4(this.gun.matrixWorld);
  }

  setFirstPerson(fp) {
    if (fp === this.fpMode) return;
    this.fpMode = fp;
    for (const o of this.fpHidden) if (o) o.visible = !fp;
    this.bones.head.scale.setScalar(fp ? 0.001 : 1);
    fpHideUniform.value = fp ? 1 : 0;
  }

  resetPose() {
    for (const [b, r] of this.rest) { b.quaternion.copy(r.q); b.position.copy(r.p); }
    if (this.fpMode) this.bones.head.scale.setScalar(0.001);
  }

  rot(bone, axisChar, angle) {
    if (!angle) return;
    _v1.copy(axisChar).applyQuaternion(this.restCharInv.get(bone));
    _q1.setFromAxisAngle(_v1.normalize(), angle);
    bone.quaternion.multiply(_q1);
  }

  /**
   * Lower body + spine. s: { pos, yaw, velocity(Vector3 world), grounded, aimPitch, aimYawOffset,
   *   walkSpeed, sprintSpeed, recoil, adsT, landed(speed or 0) }
   */
  poseBody(dt, s) {
    const A = T.anim;
    const B = this.bones;
    this.time += dt;
    this.resetPose();
    this.root.position.copy(s.pos);
    this.root.rotation.set(0, s.yaw, 0);

    // velocity in character space
    const vLocal = _v2.copy(s.velocity).setY(0).applyAxisAngle(UP, -s.yaw);
    const speed = vLocal.length();
    const targetMove = s.grounded ? THREE.MathUtils.clamp(speed / 1.2, 0, 1) : this.moveT;
    this.moveT = THREE.MathUtils.damp(this.moveT, targetMove, 10, dt);
    const runT = THREE.MathUtils.clamp((speed - s.walkSpeed) / Math.max(0.1, s.sprintSpeed - s.walkSpeed), 0, 1);
    this.runT = THREE.MathUtils.damp(this.runT, runT, 6, dt);
    this.airT = THREE.MathUtils.damp(this.airT, s.grounded ? 0 : 1, s.grounded ? 14 : 7, dt);
    if (speed > 0.3) this.moveDir.lerp(_v3.copy(vLocal).normalize(), 1 - Math.exp(-12 * dt)).normalize();

    const stride = THREE.MathUtils.lerp(A.strideWalk, A.strideRun, this.runT);
    if (s.grounded) this.phase += (speed / stride) * Math.PI * 2 * dt;
    const stepSign = Math.sign(Math.sin(this.phase));
    if (s.grounded && speed > 1 && stepSign !== this.lastStepSign) this.onFootstep?.();
    this.lastStepSign = stepSign;

    // landing dip spring
    if (s.landed) this.dipV -= A.landDip * Math.min(1.5, s.landed / 7) * 14;
    const k = 180, c = 22;
    this.dipV += (-k * this.dip - c * this.dipV) * dt;
    this.dip += this.dipV * dt;

    const m = this.moveDir;
    const swingAxis = _v4.crossVectors(UP, m).normalize();
    const mt = this.moveT * (1 - this.airT);
    const amp = A.thighSwing * DEG * THREE.MathUtils.lerp(0.8, 1.35, this.runT) * mt;
    const kneeAmp = A.kneeBend * DEG * THREE.MathUtils.lerp(0.7, 1.3, this.runT) * mt;
    const idle = 1 - this.moveT;
    const crouch = 0.12 * idle + 0.1 * s.adsT + 0.05 * this.runT;

    const legs = [
      { thigh: B.thighL, shin: B.shinL, foot: B.footL, ph: this.phase, stance: -7, air: [-40, 70] },
      { thigh: B.thighR, shin: B.shinR, foot: B.footR, ph: this.phase + Math.PI, stance: 9, air: [-15, 35] },
    ];
    for (const L of legs) {
      const sw = Math.sin(L.ph), cw = Math.cos(L.ph);
      const thighA = -amp * sw;
      const knee = kneeAmp * Math.pow(Math.max(0, cw), 1.4) + 6 * DEG * mt + crouch * 1.6 + idle * 5 * DEG;
      this.rot(L.thigh, swingAxis, thighA);
      const stanceA = L.stance * DEG * idle;
      this.rot(L.thigh, X, stanceA - crouch * 0.9);
      // air tuck
      this.rot(L.thigh, X, L.air[0] * DEG * this.airT);
      this.rot(L.shin, X, knee + L.air[1] * DEG * this.airT);
      const thighPitch = thighA * swingAxis.x + stanceA - crouch * 0.9 + L.air[0] * DEG * this.airT;
      this.rot(L.foot, X, -(thighPitch + knee) * 0.8 + 12 * DEG * this.airT);
    }
    // hips: bob, sway, dip, lean
    const bob = A.hipBob * mt * (Math.abs(Math.cos(this.phase)) - 1) * (1 + this.runT * 0.6);
    B.spine.position.y = this.hipsRestY + bob + this.dip - crouch * 0.1;
    this.rot(B.spine, UP, Math.sin(this.phase) * 7 * DEG * mt);
    this.rot(B.spine, Zv, Math.cos(this.phase) * 3 * DEG * mt * (1 - this.runT * 0.5));

    // upper body: counter twist, lean into motion, breathing, aim
    const fwdLean = (A.runLean * this.runT + 3 * mt) * DEG * m.z;
    const sideLean = -5 * DEG * mt * m.x;
    this.rot(B.spine001, UP, -Math.sin(this.phase) * 7 * DEG * mt);
    this.rot(B.spine001, X, fwdLean);
    this.rot(B.spine001, Zv, sideLean);
    this.rot(B.spine002, X, Math.sin(this.time * 1.7) * 1.2 * DEG + 6 * DEG * this.airT);

    // upper body only twists/pitches toward the crosshair while in a combat stance;
    // relaxed, it follows the hips and just the head looks around
    const cw = s.combat ?? 1;
    const pitch = s.aimPitch * A.spinePitchShare * cw;
    this.yawOff = THREE.MathUtils.damp(this.yawOff ?? 0, s.aimYawOffset * cw, 18, dt);
    const yawOff = this.yawOff;
    const shares = [[B.spine001, 0.25], [B.spine002, 0.3], [B.spine003, 0.45]];
    for (const [b, w] of shares) {
      this.rot(b, UP, yawOff * w);
      this.rot(b, X, -pitch * w);
    }
    this.rot(B.spine003, X, -s.recoil * 6 * DEG);
    const headPitch = (s.aimPitch - pitch) * (0.4 + 0.6 * cw);
    this.rot(B.head, UP, (s.aimYawOffset * (1 - cw)) * 0.35);
    this.rot(B.spine004, X, -headPitch * 0.4);
    this.rot(B.head, X, -headPitch * 0.5 + 8 * DEG * s.adsT);
    this.rot(B.head, Zv, 6 * DEG * s.adsT);
    this.root.updateMatrixWorld(true);
  }

  chestPoint(target) { return this.bones.spine004.getWorldPosition(target); }
  shoulder(side, target) { return this.arm[side].upper.getWorldPosition(target); }

  /**
   * Arms: IK both hands onto the gun. leftOverride (world Vector3|null) lets the
   * reload animation borrow the support hand.
   */
  poseArms(leftOverride, leftBlend = 0) {
    this.gun.updateMatrixWorld(true);
    const gq = this.gun.getWorldQuaternion(_q2);
    const gx = _v1.set(1, 0, 0).applyQuaternion(gq).clone();
    const gy = _v1.set(0, 1, 0).applyQuaternion(gq).clone();
    const gz = _v1.set(0, 0, 1).applyQuaternion(gq).clone();
    const yawQ = new THREE.Quaternion().setFromAxisAngle(UP, this.root.rotation.y);
    const bodyRight = this.shoulder('R', new THREE.Vector3()).sub(this.shoulder('L', new THREE.Vector3())).setY(0).normalize();
    const bodyBack = new THREE.Vector3().crossVectors(bodyRight, UP);

    // right hand
    const tR = this.gunPoint('gripR', new THREE.Vector3());
    const poleR = this.shoulder('R', new THREE.Vector3()).addScaledVector(bodyRight, 0.5).add(new THREE.Vector3(0, -0.8, 0)).addScaledVector(bodyBack, 0.3);
    this.solveArm(this.arm.R, tR, poleR);
    this.orientHand(this.arm.R, _v2.copy(gx).multiplyScalar(0.75).addScaledVector(gy, 0.55).addScaledVector(gz, -0.1), gz.clone().negate());

    // left hand (support grip / reload)
    let tL = this.gunPoint('gripL', new THREE.Vector3());
    if (leftOverride && leftBlend > 0) tL.lerp(leftOverride, leftBlend);
    const poleL = this.shoulder('L', new THREE.Vector3()).addScaledVector(bodyRight, -0.5).add(new THREE.Vector3(0, -0.8, 0)).addScaledVector(bodyBack, 0.2);
    this.solveArm(this.arm.L, tL, poleL);
    const dirL = _v2.copy(gx).multiplyScalar(0.7).addScaledVector(gz, 0.7).addScaledVector(gy, -0.1);
    const palmL = _v3.copy(gz).addScaledVector(gy, 0.35);
    if (leftBlend > 0) { dirL.lerp(new THREE.Vector3(0, -0.2, 1).applyQuaternion(yawQ), leftBlend); }
    this.orientHand(this.arm.L, dirL, palmL);

    // fingers wrap the grip
    for (const s of ['R', 'L']) {
      const a = this.arm[s];
      for (const f of a.fingers) {
        const isThumb = f.name.startsWith('thumb');
        const isIndex = f.name.startsWith('f_index');
        let ang = isThumb ? 18 : isIndex && s === 'R' ? 40 : 72;
        if (s === 'L' && leftBlend > 0.5) ang *= 0.6;
        const dir = _v1.set(0, 1, 0).applyQuaternion(this.restCharQ.get(f));
        const axis = _v3.crossVectors(dir, new THREE.Vector3(0, -1, 0)).normalize();
        if (isThumb) axis.set(0, 0, s === 'R' ? -1 : 1);
        this.rot(f, axis, ang * DEG);
      }
    }
    this.root.updateMatrixWorld(true);
  }

  solveArm(arm, target, pole) {
    const S = arm.upper.getWorldPosition(new THREE.Vector3());
    const a = arm.a, b = arm.b;
    const toT = new THREE.Vector3().subVectors(target, S);
    let d = toT.length();
    const dir = toT.divideScalar(d || 1);
    d = THREE.MathUtils.clamp(d, Math.abs(a - b) + 1e-3, a + b - 1e-3);
    const x = (a * a - b * b + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, a * a - x * x));
    const pv = new THREE.Vector3().subVectors(pole, S);
    pv.addScaledVector(dir, -pv.dot(dir)).normalize();
    const elbow = S.clone().addScaledVector(dir, x).addScaledVector(pv, h);
    const wrist = S.clone().addScaledVector(dir, d);
    this.aimBone(arm.upper, arm.fore, elbow);
    this.aimBone(arm.fore, arm.hand, wrist);
  }

  // rotate `bone` (in world space) so that `child` lands on `point`
  aimBone(bone, child, point) {
    bone.updateMatrixWorld(true);
    const p = bone.getWorldPosition(new THREE.Vector3());
    const c = child.getWorldPosition(new THREE.Vector3());
    const from = c.sub(p).normalize();
    const to = point.clone().sub(p).normalize();
    const swing = new THREE.Quaternion().setFromUnitVectors(from, to);
    const wq = bone.getWorldQuaternion(new THREE.Quaternion());
    const parentQ = bone.parent.getWorldQuaternion(new THREE.Quaternion());
    bone.quaternion.copy(parentQ.invert().multiply(swing.multiply(wq)));
    bone.updateMatrixWorld(true);
  }

  orientHand(arm, dirWorld, palmWorld) {
    const y1 = dirWorld.clone().normalize();
    const n1 = palmWorld.clone().addScaledVector(y1, -palmWorld.dot(y1)).normalize();
    const y0 = new THREE.Vector3(0, 1, 0);
    const n0 = arm.palmLocal.clone().addScaledVector(y0, -arm.palmLocal.dot(y0)).normalize();
    const M0 = new THREE.Matrix4().makeBasis(y0, n0, new THREE.Vector3().crossVectors(y0, n0));
    const M1 = new THREE.Matrix4().makeBasis(y1, n1, new THREE.Vector3().crossVectors(y1, n1));
    const qw = new THREE.Quaternion().setFromRotationMatrix(M1.multiply(M0.transpose()));
    const parentQ = arm.hand.parent.getWorldQuaternion(new THREE.Quaternion());
    arm.hand.quaternion.copy(parentQ.invert().multiply(qw));
    arm.hand.updateMatrixWorld(true);
  }
}
