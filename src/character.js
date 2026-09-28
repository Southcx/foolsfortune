import * as THREE from 'three';
import { T, PALETTE, DEG } from './config.js';
import { addOutline, applyFpHide, fpHideUniform, OUTLINE_MAT_FPHIDE, OUTLINE_MAT_CHAR, withFade, fadeUniform } from './outline.js';
import { Clips, Track } from './animator.js';

// The Courier: materials, the psygun, and animation (clips + IK corrections, below).

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
  // the mask is armour too (it used to be near-black)
  CourierMask: () => new THREE.MeshStandardMaterial({ color: PALETTE.mid, roughness: 0.65, metalness: 0.05, flatShading: true }),
};
const OUTLINED = new Set(['Courier_Armor', 'CourierMask', 'Kiritohair']);

export const GUN_POINTS = {
  // in gun-model units (multiply by gunScale for metres); +X barrel, +Y up, +Z right
  muzzle: new THREE.Vector3(0.36, 0.027, 0),
  eject: new THREE.Vector3(0.0, 0.09, 0.03),
  magwell: new THREE.Vector3(-0.25, -0.18, 0),
  sightY: 0.118,
  gripR: new THREE.Vector3(-0.34, -0.13, 0.04),
  gripL: new THREE.Vector3(-0.27, -0.15, -0.075),
};

// First person shows only the hands on the gun: every other vertex of the body is
// discarded (per vertex, by skin weight) so the camera never sees the torso from inside.
const HAND_BONE = /^(hand|f_|thumb)/;
function tagFpHide(mesh, isArmor) {
  const g = mesh.geometry;
  const si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
  const bones = mesh.skeleton?.bones;
  const out = new Float32Array(g.attributes.position.count).fill(1);
  if (!isArmor && si && bones) {
    for (let i = 0; i < si.count; i++) {
      let w = 0;
      for (let k = 0; k < 4; k++) if (HAND_BONE.test(bones[si.getComponent(i, k)]?.name || '')) w += sw.getComponent(i, k);
      out[i] = 1 - w;
    }
  }
  g.setAttribute('fpHide', new THREE.BufferAttribute(out, 1));
}

export class Character {
  constructor(scene, charGltf, gunGltf, animPack) {
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
        m.onBeforeCompile = applyFpHide;
        m.customProgramCacheKey = () => `fphide-${key}`;
        byMat.set(key, withFade(m, key));
      }
      o.material = byMat.get(key);
      tagFpHide(o, isArmor);
      o.castShadow = true;
      o.receiveShadow = true;
      o.frustumCulled = false;
      const outlined = OUTLINED.has(name) || OUTLINED.has(o.parent?.name) || OUTLINED.has(o.name);
      if (outlined) addOutline(o, OUTLINE_MAT_FPHIDE);
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

    this.time = 0;
    this.onFootstep = null;
    this.fpMode = false;
    this.initAnim(animPack);
  }

  setFade(f) { fadeUniform.value = f; }

  // psygun heats up while charging
  setGunGlow(level) {
    const t = performance.now() * 0.02;
    const k = level > 0 ? level * 2.2 + (level >= 1 ? 0.5 * Math.sin(t) : 0) : 0;
    for (const m of this.gunGlowMats) m.emissiveIntensity = k;
  }

  setGunScale(s) { this.gunModel.scale.setScalar(s); this.gunScale = s; this.holsterLocal = null; this.socketR = null; }

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

  // =========================================================================
  // Animation.
  //
  // The body is driven by authored clips (Quaternius' Universal Animation
  // Library, CC0, retargeted offline by tools/bake_anims.mjs): speed-synced
  // idle/walk/jog/sprint, crouch, jump/flip/fall/land, slide and climb, with a
  // pistol aim offset layered on the upper body when the gun is up. The gun sits
  // in the right hand (a socket), so hands never chase the gun. IK only corrects
  // the animated pose: feet onto slopes and stairs (plus stride warping at speed),
  // the support hand onto the gun, a hand on the wall, hands on a ledge. Every IK
  // chain bends toward its *animated* elbow or knee, so limbs can't flip.
  // =========================================================================

  initAnim(pack) {
    const C = (this.clips = new Clips(pack));
    const B = this.bones;
    this.driven = C.bones.map((n) => B[n]);
    this.P = { base: C.pose(), tmp: C.pose(), tmp2: C.pose(), air: C.pose(), up: C.pose(), up2: C.pose() };
    this.MASK_UPPER = C.mask({ spine001: 0.3, spine002: 0.65, spine003: 1, spine004: 0.6, head: 0.5, 'upper_arm*': 1, 'forearm*': 1, 'hand*': 1, 'f_*': 1, 'thumb*': 1 });
    this.airTrack = new Track(C, new Set(['jumpLoop', 'flipLoop']));
    this.slideTrack = new Track(C, new Set(['slideLoop']));
    const L = (a, b) => this.restPos.get(B[a]).distanceTo(this.restPos.get(B[b]));
    this.leg = {
      L: { thigh: B.thighL, shin: B.shinL, foot: B.footL, a: L('thighL', 'shinL'), b: L('shinL', 'footL') },
      R: { thigh: B.thighR, shin: B.shinR, foot: B.footR, a: L('thighR', 'shinR'), b: L('shinR', 'footR') },
    };
    // palm centre of each hand, in the hand's own frame (the gun grip and wall contacts use it)
    for (const s of ['L', 'R']) {
      const a = this.arm[s];
      const h = this.restPos.get(a.hand), m = this.restPos.get(B[`f_middle01${s}`]);
      const n = new THREE.Vector3(0, -1, 0); // T-pose palms face down
      const w = h.clone().lerp(m, 0.6).addScaledVector(n, 0.025);
      a.palmPt = w.sub(h).applyQuaternion(this.restCharInv.get(a.hand));
    }
    this.gait = {};
    for (const n of ['walk', 'jog', 'sprint', 'crouchWalk']) this.gait[n] = this.analyseGait(n);
    this.st = { phi: 0, gs: 0, warp: 0, theta: 0, turn: 0, landW: 0, landT: 9, dip: 0, dipV: 0, wasFooted: true, sliding: false, yawOff: 0 };
    this.airT = 0;
    this.resetPose();
  }

  applyPose(pose) {
    const d = this.driven, q = pose.q;
    for (let i = 0; i < d.length; i++) d[i].quaternion.fromArray(q, i * 4);
    this.bones.spine.position.fromArray(pose.p);
  }

  /**
   * Measure a locomotion loop on the Courier: ground speed (how fast the planted
   * foot travels back under the hips), metres per cycle, and where the left heel
   * strikes, so every gait loop can share one phase.
   */
  analyseGait(name) {
    const C = this.clips, c = C.clips[name], B = this.bones, p = this.P.tmp;
    this.root.position.set(0, 0, 0); this.root.rotation.set(0, 0, 0);
    const fr = [];
    for (let f = 0; f < c.n - 1; f++) {
      this.applyPose(C.sample(name, f / C.fps, p));
      this.root.updateMatrixWorld(true);
      fr.push({ L: B.footL.getWorldPosition(new THREE.Vector3()), R: B.footR.getWorldPosition(new THREE.Vector3()) });
    }
    // ground speed: the planted foot (the lower one, moving backward) travels at it
    const vs = [];
    let best = -1e9, off = 0, zmin = 1e9, zmax = -1e9;
    for (let f = 0; f < fr.length; f++) {
      const a = fr[f], b = fr[(f + 1) % fr.length];
      const s = a.L.y < a.R.y ? 'L' : 'R';
      vs.push(-(b[s].z - a[s].z) * C.fps);
      if (a.L.z - a.R.z > best) { best = a.L.z - a.R.z; off = f / fr.length; }
      zmin = Math.min(zmin, a.L.z); zmax = Math.max(zmax, a.L.z);
    }
    vs.sort((x, y) => x - y);
    const v = vs[Math.floor(vs.length / 2)]; // median: ignores the swap frames between feet
    this.resetPose();
    // (fallback for shuffling gaits where the feet swap too often to measure: a stride per cycle)
    // In-place clips don't pin their feet exactly, so the planted-foot speed (v) is only
    // a hint; a stride of two steps, each as long as the foot's swing, is the steadier measure.
    const cycle = 2 * (zmax - zmin);
    return { speed: cycle / c.dur, footSpeed: v, dur: c.dur, cycle, off };
  }

  /** Right-hand gun socket and left-hand support grip, measured from the pistol aim pose. */
  computeSockets() {
    const C = this.clips, B = this.bones;
    this.root.updateMatrixWorld(true);
    const saveP = this.root.position.clone(), saveQ = this.root.quaternion.clone();
    this.root.position.set(0, 0, 0); this.root.quaternion.identity();
    this.resetPose();
    this.applyPose(C.sample('aimMid', 0, this.P.tmp));
    this.root.updateMatrixWorld(true);
    const gunQ = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(
      new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0), new THREE.Vector3(-1, 0, 0)));
    const palm = (s) => this.arm[s].palmPt.clone().applyMatrix4(this.arm[s].hand.matrixWorld);
    const gunPos = palm('R').sub(GUN_POINTS.gripR.clone().multiplyScalar(this.gunScale).applyQuaternion(gunQ));
    const G = new THREE.Matrix4().compose(gunPos, gunQ, new THREE.Vector3(1, 1, 1));
    this.socketR = new THREE.Matrix4().copy(B.handR.matrixWorld).invert().multiply(G);
    this.socketRInv = this.socketR.clone().invert();
    // support hand: the clip's hand orientation, palm centred on the gun's support grip
    const lq = B.handL.getWorldQuaternion(new THREE.Quaternion());
    const gl = GUN_POINTS.gripL.clone().multiplyScalar(this.gunScale).applyMatrix4(G);
    const lp = gl.sub(this.arm.L.palmPt.clone().applyQuaternion(lq));
    this.socketL = G.clone().invert().multiply(new THREE.Matrix4().compose(lp, lq, new THREE.Vector3(1, 1, 1)));
    this.resetPose();
    this.root.position.copy(saveP); this.root.quaternion.copy(saveQ);
    this.root.updateMatrixWorld(true);
  }

  /** Holster socket relative to the pelvis bone: right hip, barrel down, grip up and back, clear of the thigh. */
  computeHolster() {
    const H = T.weapon.holster;
    this.resetPose();
    const saveP = this.root.position.clone(), saveQ = this.root.quaternion.clone();
    this.root.position.set(0, 0, 0); this.root.quaternion.identity();
    this.root.updateMatrixWorld(true);
    const pelvisInv = new THREE.Matrix4().copy(this.bones.spine.matrixWorld).invert();
    const xg = new THREE.Vector3(0, -1, H.tilt).normalize();
    const yg = new THREE.Vector3(0, H.tilt, 1).normalize();
    const zg = new THREE.Vector3().crossVectors(xg, yg);
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xg, yg, zg));
    q.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), H.cant * DEG)); // muzzle out, away from the thigh
    const grip = GUN_POINTS.gripR.clone().multiplyScalar(this.gunScale).applyQuaternion(q);
    const pos = new THREE.Vector3(-H.out, H.height, H.back).sub(grip);
    this.holsterLocal = pelvisInv.multiply(new THREE.Matrix4().compose(pos, q, new THREE.Vector3(1, 1, 1)));
    this.root.position.copy(saveP); this.root.quaternion.copy(saveQ);
    this.root.updateMatrixWorld(true);
  }

  /** Rotate a bone about a world-space axis through its own origin. */
  rotW(bone, axisWorld, angle) {
    if (!angle) return;
    bone.parent.getWorldQuaternion(_q1).invert();
    _v1.copy(axisWorld).applyQuaternion(_q1);
    bone.quaternion.premultiply(_q2.setFromAxisAngle(_v1.normalize(), angle));
  }

  /** Apply a world-space rotation to a bone (about its origin). */
  turnW(bone, qWorld) {
    bone.parent.getWorldQuaternion(_q1);
    const qp = _q2.copy(_q1).invert().multiply(qWorld).multiply(_q1);
    bone.quaternion.premultiply(qp);
  }

  setWorldQuat(bone, qWorld) {
    bone.parent.getWorldQuaternion(_q1).invert();
    bone.quaternion.copy(_q1.multiply(qWorld));
  }

  /**
   * s: { pos, yaw, velocity, vy, grounded, wall (signed), slide, mantle, mantleT, dash, crouch,
   *      airJump (pulse), landed (impact), turnRate, ground(x, z, yTop) -> y|null,
   *      aimPitch, aimYawOffset, combat (facing the aim 0..1), upper (pistol layer 0..1),
   *      reload (-1 | 0..1), recoil, adsT, walkSpeed, sprintSpeed }
   */
  animate(dt, s) {
    const A = T.anim, C = this.clips, B = this.bones, st = this.st, P = this.P;
    const clamp = THREE.MathUtils.clamp, damp = THREE.MathUtils.damp;
    this.time += dt;
    this.resetPose();
    const root = this.root;
    root.rotation.order = 'YXZ';
    root.position.copy(s.pos);
    root.rotation.set(0, s.yaw, 0);

    // ---- state ----
    const vLocal = _v2.copy(s.velocity).setY(0).applyAxisAngle(UP, -s.yaw);
    const speed = vLocal.length();
    const wr = s.wall || 0, aw = clamp(Math.abs(wr), 0, 1);
    const footed = s.grounded || aw > 0.3;
    const sl = s.slide || 0, mn = s.mantle || 0, da = s.dash || 0, cr = s.crouch || 0;
    this.airT = damp(this.airT, footed ? 0 : 1, footed ? 18 : 10, dt);
    if (footed) st.gs = damp(st.gs, speed, 12, dt);
    const gs = st.gs;
    // moving backwards (aiming while retreating): the loops run in reverse
    if (speed > 0.4) st.theta = Math.atan2(vLocal.x, vLocal.z);
    const back = Math.abs(st.theta) > 110 * DEG;
    const warpTo = back ? st.theta - Math.PI * Math.sign(st.theta) : st.theta;
    st.warp = damp(st.warp, clamp(warpTo, -70 * DEG, 70 * DEG) * clamp(gs / 1.2, 0, 1), 10, dt);

    // ---- ground locomotion: idle / walk / jog / sprint on one shared phase ----
    const g = this.gait;
    const k1 = A.walkAnimSpeed, k2 = s.walkSpeed, k3 = s.sprintSpeed;
    const W = [0, 0, 0, 0];
    if (gs <= k1) { W[1] = gs / k1; W[0] = 1 - W[1]; }
    else if (gs <= k2) { W[2] = (gs - k1) / (k2 - k1); W[1] = 1 - W[2]; }
    else if (gs <= k3) { W[3] = (gs - k2) / (k3 - k2); W[2] = 1 - W[3]; }
    else W[3] = 1;
    const wm = W[1] + W[2] + W[3];
    // Game speeds run well past the clips' own (a 7 m/s sprint on a small body): split
    // the difference between turning the legs over faster and reaching further
    // (stride warping, done by the foot IK) so neither looks cartoonish.
    const blendG = (key) => {
      const v = wm > 0 ? (W[1] * g.walk[key] + W[2] * g.jog[key] + W[3] * g.sprint[key]) / wm : g.walk[key];
      return THREE.MathUtils.lerp(v, g.crouchWalk[key], cr);
    };
    const natSpeed = blendG('speed'), natDur = blendG('dur');
    const ratio = gs / natSpeed;
    st.stride = clamp(Math.pow(ratio, A.strideShare), 0.75, A.maxStride);
    const cad = ratio / st.stride / natDur;
    if (footed && sl < 0.5) st.phi = (((st.phi + (back ? -1 : 1) * cad * dt) % 1) + 1) % 1;
    const at = (n) => ((st.phi + g[n].off) % 1) * g[n].dur;
    const base = C.sample('idle', this.time, P.base);
    let cum = W[0];
    for (const [i, n] of [[1, 'walk'], [2, 'jog'], [3, 'sprint']]) {
      if (W[i] <= 0) continue;
      cum += W[i];
      C.blend(base, C.sample(n, at(n), P.tmp), W[i] / cum);
    }
    if (cr > 0.001) {
      const cp = C.sample('crouchIdle', this.time, P.tmp);
      C.blend(cp, C.sample('crouchWalk', at('crouchWalk'), P.tmp2), clamp(gs / 1.0, 0, 1));
      C.blend(base, cp, cr * A.crouchDepth);
    }
    // footsteps: the left heel lands at phase 0, the right at 0.5
    const ph = st.phi;
    if (footed && wm > 0.2 && sl < 0.5 && st.lastPhi !== undefined) {
      const crossed = (a) => (back ? st.lastPhi > a - 1e-9 && ph <= a : st.lastPhi < a && ph >= a) || Math.abs(ph - st.lastPhi) > 0.5 && a === 0;
      if (crossed(0) || crossed(0.5)) this.onFootstep?.();
    }
    st.lastPhi = ph;

    // ---- landing ----
    if (s.landed) { st.landW = clamp(s.landed / 7, 0.3, 1); st.landT = A.landFrom; st.dipV -= A.landDip * Math.min(2, s.landed / 6) * 14; }
    st.landT += dt;
    const landW = st.landW * (1 - smooth(0.12, 0.5, st.landT)) * (1 - 0.7 * clamp(gs / s.walkSpeed, 0, 1)) * (footed ? 1 : 0);
    if (landW > 0.001) C.blend(base, C.sample('jumpLand', st.landT, P.tmp, false), landW);
    st.dipV += (-180 * st.dip - 22 * st.dipV) * dt;
    st.dip += st.dipV * dt;

    // ---- air: take-off, the air-jump flip, then the airborne loop ----
    const at2 = this.airTrack;
    if (!footed && st.wasFooted && mn < 0.5) {
      if ((s.vy || 0) > 1) at2.play('jumpStart', A.jumpFrom, 0.06);
      else at2.play('jumpLoop', 0.5, 0.25);
    }
    if (s.airJump) at2.play('flipStart', A.flipFrom, 0.06);
    if (!at2.cur) at2.play('jumpLoop', 0.5);
    at2.update(dt);
    if (at2.cur === 'jumpStart' && at2.t > 0.9) at2.play('jumpLoop', 0.4, 0.3);
    if (at2.cur === 'flipStart' && at2.t > 0.75) at2.play('flipLoop', 0, 0.2);
    if (at2.cur === 'flipLoop' && (s.vy || 0) < -2.5) at2.play('jumpLoop', 0.4, 0.35);
    st.wasFooted = footed;
    const air = this.airT * (1 - mn) * (1 - aw);
    if (air > 0.001) C.blend(base, at2.sample(P.air), air);

    // ---- slide: drop in, then hold the slide ----
    const sT = this.slideTrack;
    if (sl > 0.02 && !st.sliding) { sT.cur = null; sT.play('slideStart', A.slideFrom); st.sliding = true; }
    if (sl < 0.02) st.sliding = false;
    if (st.sliding) {
      sT.update(dt);
      if (sT.cur === 'slideStart' && sT.t > 0.7) sT.play('slideLoop', 0.2, 0.2);
      C.blend(base, sT.sample(P.tmp), sl);
    }
    // ---- air dash: stretched out like the jump's take-off ----
    if (da > 0.001) C.blend(base, C.sample('jumpStart', A.dashFrame, P.tmp, false), da);
    // ---- mantle: the climb, timed to the vault ----
    if (mn > 0.001) C.blend(base, C.sample('climb', THREE.MathUtils.lerp(A.climbFrom, A.climbTo, clamp(s.mantleT ?? 1, 0, 1)), P.tmp, false), mn);

    // ---- pistol on the upper body: an aim offset (down / level / up) ----
    const wU = s.upper || 0;
    if (wU > 0.001) {
      const up = C.sample('aimMid', 0, P.up);
      const pk = clamp(s.aimPitch / (A.aimRange * DEG), -1, 1);
      if (pk > 0) C.blend(up, C.sample('aimUp', 0, P.up2), pk);
      else if (pk < 0) C.blend(up, C.sample('aimDown', 0, P.up2), -pk);
      if (s.reload >= 0) C.blend(up, C.sample('reload', s.reload * C.clips.reload.dur, P.up2, false), smooth(0, 0.12, s.reload) * (1 - smooth(0.85, 1, s.reload)));
      C.blend(base, up, wU, this.MASK_UPPER, 0);
    }
    this.applyPose(base);

    // ---- procedural layer ----
    root.position.y -= st.dip;
    st.turn = damp(st.turn, s.turnRate || 0, 8, dt);
    const lean = clamp(-st.turn * gs * 0.012, -0.3, 0.3) * (1 - air);
    root.rotation.set(0, s.yaw, -wr * A.wallLean * DEG + lean);
    root.updateMatrixWorld(true);
    const upW = _v3.set(0, 1, 0);
    // orientation warping: hips turn toward the move, the chest turns back to the aim
    const gaitW = wm * (1 - air) * (1 - sl) * (1 - mn) * (1 - da);
    const warp = st.warp * gaitW;
    if (Math.abs(warp) > 1e-3) {
      this.rotW(B.spine, upW, warp);
      this.rotW(B.spine001, upW, -warp * 0.45);
      this.rotW(B.spine002, upW, -warp * 0.3);
      this.rotW(B.spine003, upW, -warp * 0.25);
    }
    // aim: the spine twists toward the camera's yaw when the body lags it; the head does the looking otherwise
    const cw = s.combat ?? 0;
    st.yawOff = damp(st.yawOff, s.aimYawOffset * cw, 18, dt);
    for (const [b, w] of [[B.spine001, 0.25], [B.spine002, 0.3], [B.spine003, 0.45]]) this.rotW(b, upW, st.yawOff * w);
    const rightW = _v4.set(-1, 0, 0).applyQuaternion(root.quaternion);
    // air dash: pitch the whole body into the dash, about the hips
    if (da > 0.001) this.rotW(B.spine, rightW, -da * A.dashLean * DEG);
    this.rotW(B.spine003, rightW, -(s.recoil || 0) * 5 * DEG);
    const lookW = 1 - wU;
    this.rotW(B.spine004, upW, s.aimYawOffset * (1 - cw) * 0.25);
    this.rotW(B.head, upW, s.aimYawOffset * (1 - cw) * 0.35);
    this.rotW(B.head, rightW, s.aimPitch * 0.45 * lookW);
    root.updateMatrixWorld(true);

    // ---- feet: stride warping and ground contact ----
    const planted = (1 - air) * (1 - mn) * (1 - da) * (1 - aw);
    this.footIK(s, planted, (st.stride - 1) * gaitW, speed);

    this.headRel = (this.headRel || new THREE.Vector3()).copy(B.head.getWorldPosition(_v1)).sub(s.pos);
    Object.assign(st, { air, sl, mn, da, cr, wr, aw, gaitW, speed });
  }

  footIK(s, planted, stretch, speed) {
    const root = this.root;
    const mdir = new THREE.Vector3(s.velocity.x, 0, s.velocity.z);
    const doStride = stretch > 0.01 && speed > 0.5;
    if (doStride) mdir.normalize();
    const offs = {}, d = { L: 0, R: 0 };
    for (const k of ['L', 'R']) {
      const leg = this.leg[k];
      const F = leg.foot.getWorldPosition(new THREE.Vector3());
      const off = new THREE.Vector3();
      if (doStride) off.addScaledVector(mdir, _v1.subVectors(F, s.pos).dot(mdir) * stretch);
      if (planted > 0.05 && s.ground) {
        const gy = s.ground(F.x + off.x, F.z + off.z, s.pos.y + 0.6);
        if (gy !== null) d[k] = THREE.MathUtils.clamp(gy - s.pos.y, -0.45, 0.45) * planted;
      }
      offs[k] = off;
    }
    const lower = Math.min(0, d.L, d.R);
    if (lower < 0) { root.position.y += lower; root.updateMatrixWorld(true); }
    const fwd = _v4.set(0, 0, 1).applyQuaternion(root.quaternion);
    for (const k of ['L', 'R']) {
      const off = offs[k];
      off.y += d[k] - lower;
      if (off.lengthSq() < 1e-6) continue;
      const leg = this.leg[k];
      const target = leg.foot.getWorldPosition(new THREE.Vector3()).add(off);
      const pole = leg.shin.getWorldPosition(new THREE.Vector3()).addScaledVector(fwd, 0.1);
      const fq = leg.foot.getWorldQuaternion(new THREE.Quaternion());
      this.solveLeg(leg, target, pole);
      this.setWorldQuat(leg.foot, fq);
      leg.foot.updateMatrixWorld(true);
    }
  }

  solveLeg(leg, target, pole) { this.solve2(leg.thigh, leg.shin, leg.foot, leg.a, leg.b, target, pole); }

  // analytic two-bone IK: the mid joint bends toward `pole`
  solve2(upper, mid, end, a, b, target, pole) {
    const S = upper.getWorldPosition(new THREE.Vector3());
    const toT = new THREE.Vector3().subVectors(target, S);
    let d = toT.length();
    const dir = toT.divideScalar(d || 1);
    d = THREE.MathUtils.clamp(d, Math.abs(a - b) + 1e-3, a + b - 1e-3);
    const x = (a * a - b * b + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, a * a - x * x));
    const pv = new THREE.Vector3().subVectors(pole, S);
    pv.addScaledVector(dir, -pv.dot(dir));
    if (pv.lengthSq() < 1e-8) pv.set(0, -1, 0).addScaledVector(dir, dir.y);
    pv.normalize();
    const elbow = S.clone().addScaledVector(dir, x).addScaledVector(pv, h);
    this.aimBone(upper, mid, elbow);
    this.aimBone(mid, end, S.clone().addScaledVector(dir, d));
  }

  chestPoint(target) { return this.bones.spine004.getWorldPosition(target); }
  shoulder(side, target) { return this.arm[side].upper.getWorldPosition(target); }

  /**
   * Reach a hand toward a world pose with weight w. The elbow bends toward where the
   * animation had it (a little down), so the solution stays on the animated side.
   * `shift` moves the shoulder onto the first-person camera rig (view-model arms) -
   * only in first person, where nothing but the hands is drawn.
   */
  reachHand(side, pos, quat, w, shift = 0) {
    if (w <= 0.001) return;
    const arm = this.arm[side];
    const hq = arm.hand.getWorldQuaternion(new THREE.Quaternion());
    const hp = arm.hand.getWorldPosition(new THREE.Vector3());
    const target = hp.clone().lerp(pos, w);
    const pole = arm.fore.getWorldPosition(new THREE.Vector3()).add(_v1.set(0, -0.12, 0));
    if (shift > 0 && this.fpCam) {
      // first person: view-model arms. The shoulders hang off the camera, not the animated
      // body, so the hands never inherit the run cycle; only the hands are drawn anyway.
      const cq = this.fpCam.quaternion;
      const S = _v1.set(-arm.side * 0.2, -0.3, 0.06).applyQuaternion(cq).add(this.fpCam.position);
      const cur = arm.upper.getWorldPosition(new THREE.Vector3());
      const sh = S.clone().sub(cur).multiplyScalar(shift);
      arm.upper.parent.getWorldQuaternion(_q1).invert();
      arm.upper.position.add(sh.applyQuaternion(_q1));
      arm.upper.updateMatrixWorld(true);
      pole.copy(S).add(_v3.set(-arm.side * 0.45, -0.35, 0).applyQuaternion(cq));
    }
    this.solve2(arm.upper, arm.fore, arm.hand, arm.a, arm.b, target, pole);
    this.setWorldQuat(arm.hand, hq.slerp(quat, w));
    arm.hand.updateMatrixWorld(true);
  }

  /** Where the right hand has to be to hold the gun at world matrix M. */
  handFromGun(M, side, pos, quat) {
    _m1.multiplyMatrices(M, side === 'R' ? this.socketRInv : this.socketL).decompose(pos, quat, _v4);
  }

  /**
   * Hands and gun, after animate(). o: {
   *   drawT: 0 holstered .. 1 in hand (the hand reaches the hip first, then the gun comes up),
   *   upper: pistol layer weight, fw: first-person weight, fpPos/fpQ: first-person gun pose,
   *   aimPoint, reloading, leftOverride/leftBlend (first-person reload: support hand to the belt),
   *   wallPoint/wallNormal/wallSide, ledge {point, right}, mantleT
   * }
   */
  poseHands(o) {
    if (!this.socketR) this.computeSockets();
    if (!this.holsterLocal) this.computeHolster();
    const B = this.bones, st = this.st, root = this.root;
    const HOLD = 0.45;
    const inHand = o.drawT > HOLD;
    const reach = inHand ? 1 - smooth(HOLD, 1, o.drawT) : smooth(0, HOLD, o.drawT);
    const Mg = new THREE.Matrix4(), gp = new THREE.Vector3(), gq = new THREE.Quaternion();
    const hp = new THREE.Vector3(), hq = new THREE.Quaternion();
    const holster = _m1.multiplyMatrices(B.spine.matrixWorld, this.holsterLocal).clone();

    // 1) turn the chest so the barrel lines up with the crosshair
    const wAim = (o.upper || 0) * (inHand ? 1 : 0) * (o.reloading ? 0.3 : 1) * (1 - (o.fw || 0));
    if (wAim > 0.01 && o.aimPoint) {
      for (let it = 0; it < 2; it++) {
        Mg.multiplyMatrices(B.handR.matrixWorld, this.socketR).decompose(gp, gq, _v4);
        const bar = new THREE.Vector3(1, 0, 0).applyQuaternion(gq);
        const muzzle = GUN_POINTS.muzzle.clone().multiplyScalar(this.gunScale).applyMatrix4(Mg);
        const want = o.aimPoint.clone().sub(muzzle);
        if (want.length() < 0.8) break;
        want.normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(bar, want);
        const ang = 2 * Math.acos(THREE.MathUtils.clamp(q.w, -1, 1));
        const lim = 55 * DEG;
        const k = wAim * (ang > lim ? lim / ang : 1);
        this.turnW(B.spine003, new THREE.Quaternion().slerp(q, k));
        root.updateMatrixWorld(true);
      }
    }

    // 2) the right hand: to the holster to draw / put away, else wherever the animation has it
    if (reach > 0.001) {
      this.handFromGun(holster, 'R', hp, hq);
      this.reachHand('R', hp, hq, reach);
    }
    if (inHand) Mg.multiplyMatrices(B.handR.matrixWorld, this.socketR);
    else Mg.copy(holster);
    Mg.decompose(gp, gq, _v4);
    // first person: the view-model pose (the gun rises out of the holster as it's drawn)
    const fwG = (o.fw || 0) * (inHand ? smooth(HOLD, 0.9, o.drawT) : 0);
    if (fwG > 0 && o.fpPos) { gp.lerp(o.fpPos, fwG); gq.slerp(o.fpQ, fwG); }
    this.gun.position.copy(gp);
    this.gun.quaternion.copy(gq);
    this.gun.updateMatrixWorld(true);

    // 3) hands on the gun wherever it went (a no-op in third person, where it's already in the hand)
    const shift = (o.fw || 0) > 0.5 ? 1 : 0;
    this.fpCam = o.camera;
    if (inHand && fwG > 0.001) {
      this.handFromGun(this.gun.matrixWorld, 'R', hp, hq);
      this.reachHand('R', hp, hq, 1, shift);
    }
    // the support hand: on the grip when aiming, off it for reloads and contacts
    let wL = Math.max(o.upper || 0, fwG) * (inHand ? smooth(HOLD, 1, o.drawT) : 0);
    if (o.reloading && fwG < 0.5) wL = 0; // the reload clip drives it
    let contactL = 0, contactR = 0;
    // wall: the wall-side hand flat on the wall, a little ahead
    const wallW = st.aw * (o.wallPoint ? 1 : 0);
    const wallSide = o.wallSide > 0 ? 'R' : 'L';
    if (wallW > 0.01 && !(wallSide === 'R' && inHand)) {
      const n = o.wallNormal;
      const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(root.quaternion);
      const dir = fwd.clone().addScaledVector(UP, 0.8).addScaledVector(n, -fwd.dot(n)).normalize();
      const q = this.handQuat(this.arm[wallSide], dir, n.clone().negate());
      const p = o.wallPoint.clone().addScaledVector(n, 0.02).sub(this.arm[wallSide].palmPt.clone().applyQuaternion(q));
      this.reachHand(wallSide, p, q, wallW);
      if (wallSide === 'L') contactL = wallW; else contactR = wallW;
    }
    // ledge: both hands plant on the lip during the first part of the vault
    const ledgeW = (o.ledge ? st.mn : 0) * (1 - smooth(0.45, 0.75, o.mantleT ?? 1));
    if (ledgeW > 0.01) {
      const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(root.quaternion);
      for (const side of ['L', 'R']) {
        if (side === 'R' && inHand) continue;
        const sg = side === 'L' ? 1 : -1;
        const q = this.handQuat(this.arm[side], fwd, new THREE.Vector3(0, -1, 0));
        const p = o.ledge.point.clone().addScaledVector(o.ledge.right, -sg * 0.22).addScaledVector(fwd, 0.08)
          .sub(this.arm[side].palmPt.clone().applyQuaternion(q)).add(new THREE.Vector3(0, 0.02, 0));
        this.reachHand(side, p, q, ledgeW);
        if (side === 'L') contactL = Math.max(contactL, ledgeW); else contactR = Math.max(contactR, ledgeW);
      }
    }
    wL *= 1 - contactL;
    if (wL > 0.001) {
      this.handFromGun(this.gun.matrixWorld, 'L', hp, hq);
      if (o.leftBlend > 0 && o.leftOverride) hp.lerp(o.leftOverride, o.leftBlend);
      this.reachHand('L', hp, hq, wL, shift);
    }
    // flat fingers on a surface
    for (const [side, k] of [['L', contactL], ['R', contactR]]) {
      if (k <= 0.01) continue;
      for (const f of this.arm[side].fingers) f.quaternion.slerp(this.rest.get(f).q, k * 0.85);
    }
    root.updateMatrixWorld(true);
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

  /** World rotation for a hand whose fingers point along dirWorld with the palm facing palmWorld. */
  handQuat(arm, dirWorld, palmWorld) {
    const y1 = dirWorld.clone().normalize();
    const n1 = palmWorld.clone().addScaledVector(y1, -palmWorld.dot(y1)).normalize();
    const y0 = new THREE.Vector3(0, 1, 0);
    const n0 = arm.palmLocal.clone().addScaledVector(y0, -arm.palmLocal.dot(y0)).normalize();
    const M0 = new THREE.Matrix4().makeBasis(y0, n0, new THREE.Vector3().crossVectors(y0, n0));
    const M1 = new THREE.Matrix4().makeBasis(y1, n1, new THREE.Vector3().crossVectors(y1, n1));
    return new THREE.Quaternion().setFromRotationMatrix(M1.multiply(M0.transpose()));
  }
}

function smooth(a, b, t) { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
