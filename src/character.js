import { courierLimits } from './rom.js';
import { kneeProfile } from './poles.js';
import * as THREE from 'three';
import { addRim } from './render/toon.js';
import { T, PALETTE, DEG } from './config.js';
import { addOutline, applyFpHide, fpHideUniform, OUTLINE_MAT_FPHIDE, OUTLINE_MAT_CHAR, withFade, fadeUniform, dissolveUniform, dissolveBaseUniform } from './outline.js';
import { Clips, Track } from './animator.js';
import { authorAll } from './authored.js';

// The Courier: materials, the psygun, and animation (clips + IK corrections, below).

const STRETCH = 0.16; // how far a shoulder joint may travel toward a reach the arm alone cannot make
const UP = new THREE.Vector3(0, 1, 0);
const X = new THREE.Vector3(1, 0, 0);
const Zv = new THREE.Vector3(0, 0, 1);
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _v4 = new THREE.Vector3();
const _v5 = new THREE.Vector3(), _v6 = new THREE.Vector3();
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
/** Which glaze region a mesh of the Courier is (vessel/glazes.js REGIONS), or null (the Lachryma of her body is never glazed). */
function regionOf(o, matName, isArmor) {
  if (isArmor) return matName === 'Courier_Armor' ? 'body' : 'trim';
  if (o.name === 'Courier_Mask') return 'mask';
  if (o.name === 'Kiritohair') return 'hair';
  if (o.name === 'Courier_Stones') return 'trim';
  return null;
}

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
    // a material for each region a glaze can be laid on (vessel/glazes.js: body, trim, mask, hair), the rest by what it is made of
    this.regionMats = {};
    for (const o of meshes) {
      const name = o.material.name;
      const isArmor = o.parent?.name === 'Courier_Armor';
      const region = regionOf(o, name, isArmor);
      const key = region ? `region.${region}` : isArmor ? `${name}_armor` : name;
      if (!byMat.has(key)) {
        const m = (MATS[name] || MATS.CourierEnergy)();
        m.onBeforeCompile = applyFpHide;
        m.customProgramCacheKey = () => `fphide-${key}`;
        if (!m.transparent) addRim(m); // (the thin Lachryma rim: render/toon.js)
        byMat.set(key, withFade(m, key));
        if (region) this.regionMats[region] = m;
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
    // the last word on every posed joint: nothing bends the wrong way (rom.js)
    this.limits = courierLimits(this.bones, (b) => this.rest.get(b).q);
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

  /** The dissolve (outline.js): 0 whole .. 1 gone, eaten from the top of a body standing at feetY (a melt into slip, a rise out). */
  setDissolve(k, feetY = this.root.position.y, height = 1.9) { dissolveUniform.value = k; dissolveBaseUniform.value.set(feetY, height); }
  get dissolve() { return dissolveUniform.value; }

  /** Hide the body and gun (a tech that turns the Courier into something else). */
  setHidden(h) {
    if (h === !!this.hidden) return;
    this.hidden = h;
    this.root.visible = !h;
    this.gun.visible = !h && !this.gunOff; // (gunOff: the Psygun is not worn, it is in the Pneuka Box: tools/belt.js)
  }

  /** A frozen copy of the posed body, in world space (afterimages). */
  snapshot(material) {
    const g = new THREE.Group();
    this.root.updateMatrixWorld(true);
    const v = new THREE.Vector3();
    this.model.traverse((o) => {
      if (!o.isSkinnedMesh || o.userData.isOutline || !o.visible) return;
      const src = o.geometry, pa = src.attributes.position, n = pa.count;
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        v.fromBufferAttribute(pa, i);
        o.applyBoneTransform(i, v);
        v.applyMatrix4(o.matrixWorld);
        pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      if (src.index) geo.setIndex(src.index);
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, material);
      m.frustumCulled = false;
      g.add(m);
    });
    return g;
  }

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
    // (one arm and the head: for the moves that hold the body to something with the other hand)
    this.MASK_ARM = {};
    for (const s of ['L', 'R']) {
      const t = { head: 0.35, spine004: 0.25 };
      for (const n of C.bones) if (n.endsWith(s) && /^(upper_arm|forearm|hand|f_|thumb)/.test(n)) t[n] = 1;
      this.MASK_ARM[s] = C.mask(t);
    }
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
    this.ankleRest = this.restPos.get(B.footL).y;
    this.toeRest = this.restPos.get(B.toeL).y;
    this.gait = {};
    for (const n of ['walk', 'jog', 'sprint', 'crouchWalk']) this.gait[n] = this.analyseGait(n);
    this.lock = { L: { w: 0, on: false, p: new THREE.Vector3() }, R: { w: 0, on: false, p: new THREE.Vector3() } };
    this.initMirror();
    this.st = { phi: 0, gs: 0, warp: 0, theta: 0, turn: 0, landW: 0, landT: 9, dip: 0, dipV: 0, wasFooted: true, sliding: false, yawOff: 0 };
    this.airT = 0;
    this.resetPose();
    authorAll(this); // (clips the libraries lack: built once here, from key poses solved on this very skeleton)
  }

  /**
   * Left/right mirroring of poses (for the gun in the left hand, and anything else that
   * wants a mirrored clip). Works in character space: each bone takes its partner's
   * rotation reflected across the body's midplane, corrected so the rest pose maps to
   * itself (the rig's left and right bones don't share axis conventions).
   */
  initMirror() {
    const d = this.driven, idx = new Map(d.map((b, i) => [b, i]));
    const partner = (n) => (/L$/.test(n) ? n.slice(0, -1) + 'R' : /R$/.test(n) ? n.slice(0, -1) + 'L' : n);
    const M = (q) => new THREE.Quaternion(q.x, -q.y, -q.z, q.w); // reflect x
    this.mir = d.map((b, i) => {
      const j = idx.get(this.bones[partner(b.name)]) ?? i;
      const par = idx.has(b.parent) ? idx.get(b.parent) : -1;
      const parentRest = par < 0 ? b.parent.getWorldQuaternion(new THREE.Quaternion()) : null; // (root at identity here)
      const C = M(this.restCharQ.get(d[j])).invert().multiply(this.restCharQ.get(b));
      return { j, par, parentRest, C };
    });
    this._mq = d.map(() => new THREE.Quaternion());
    this._mq2 = d.map(() => new THREE.Quaternion());
  }

  mirrorPose(src, dst) {
    const d = this.driven, mir = this.mir, cq = this._mq, cq2 = this._mq2;
    // FK: character-space rotations of the source pose (bones are in parent-first order)
    for (let i = 0; i < d.length; i++) {
      const m = mir[i];
      _q1.fromArray(src.q, i * 4);
      cq[i].copy(m.par < 0 ? m.parentRest : cq[m.par]).multiply(_q1);
    }
    for (let i = 0; i < d.length; i++) {
      const m = mir[i], q = cq[m.j];
      cq2[i].set(q.x, -q.y, -q.z, q.w).multiply(m.C);
    }
    for (let i = 0; i < d.length; i++) {
      const m = mir[i];
      _q1.copy(m.par < 0 ? m.parentRest : cq2[m.par]).invert().multiply(cq2[i]);
      _q1.toArray(dst.q, i * 4);
    }
    dst.p[0] = -src.p[0]; dst.p[1] = src.p[1]; dst.p[2] = src.p[2];
    return dst;
  }

  applyPose(pose) {
    const d = this.driven, q = pose.q;
    for (let i = 0; i < d.length; i++) d[i].quaternion.fromArray(q, i * 4);
    this.bones.spine.position.fromArray(pose.p);
  }

  /**
   * Measure a locomotion loop on the Courier. An in-place clip is authored so the
   * planted foot slides back under the hips at the speed the character is meant to
   * travel, so that's the clip's ground speed: played at speed / groundSpeed the feet
   * stay put. Also records where the left heel strikes (so every loop can share one
   * phase) and each foot's contact curve over the cycle (for foot locking).
   */
  analyseGait(name) {
    const C = this.clips, c = C.clips[name], B = this.bones, p = this.P.tmp;
    this.root.position.set(0, 0, 0); this.root.rotation.set(0, 0, 0);
    const fr = [];
    for (let f = 0; f < c.n - 1; f++) {
      this.applyPose(C.sample(name, f / C.fps, p));
      this.root.updateMatrixWorld(true);
      const g = (b) => b.getWorldPosition(new THREE.Vector3());
      fr.push({ L: g(B.footL), R: g(B.footR), tL: g(B.toeL), tR: g(B.toeR) });
    }
    const n = fr.length, contact = {};
    let best = -1e9, off = 0, vsum = 0, wsum = 0;
    for (const s of ['L', 'R']) {
      // planted: the lowest point of the foot (heel or toe) near its lowest, and the foot
      // travelling backward under the body (a foot coming down at the end of a swing is
      // low too, but still moving forward)
      const h = fr.map((f) => Math.min(f[s].y - this.ankleRest, f['t' + s].y - this.toeRest));
      const lo = Math.min(...h);
      const raw = h.map((y, f) => {
        const dz = fr[(f + 1) % n][s].z - fr[(f + n - 1) % n][s].z;
        return (1 - smooth(0.04, 0.09, y - lo)) * smooth(0, -0.01, dz);
      });
      contact[s] = raw.map((c, f) => (raw[(f + n - 1) % n] + 2 * c + raw[(f + 1) % n]) / 4); // soften the edges
      for (let f = 0; f < n; f++) {
        const w = contact[s][f] > 0.9 ? 1 : 0; // mid-stance only
        if (!w) continue;
        vsum += w * -(fr[(f + 1) % n][s].z - fr[(f + n - 1) % n][s].z) * C.fps / 2;
        wsum += w;
      }
    }
    for (let f = 0; f < n; f++) if (fr[f].L.z - fr[f].R.z > best) { best = fr[f].L.z - fr[f].R.z; off = f / n; }
    const speed = wsum > 0 ? vsum / wsum : 1;
    this.resetPose();
    return { speed, dur: c.dur, cycle: speed * c.dur, off, contact, n };
  }

  /** Contact weight (0..1) of foot s at loop phase u (0..1 of the clip). */
  contactAt(g, s, u) {
    const f = ((u % 1) + 1) % 1 * g.n;
    const i = Math.floor(f), k = f - i;
    const a = g.contact[s][i % g.n], b = g.contact[s][(i + 1) % g.n];
    return a + (b - a) * k;
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
    // the same grip mirrored: gun in the left hand, right hand supporting. The gun itself
    // isn't mirrored (it's the same gun), so its side axis flips back: S * G * D
    this.resetPose();
    this.applyPose(this.mirrorPose(C.sample('aimMid', 0, this.P.tmp), this.P.tmp2));
    this.root.updateMatrixWorld(true);
    const S = new THREE.Matrix4().makeScale(-1, 1, 1), D = new THREE.Matrix4().makeScale(1, 1, -1);
    const GL = S.clone().multiply(G).multiply(D);
    this.socketLH = new THREE.Matrix4().copy(B.handL.matrixWorld).invert().multiply(GL);
    this.socketLHInv = this.socketLH.clone().invert();
    const rq = B.handR.getWorldQuaternion(new THREE.Quaternion());
    const gr = GUN_POINTS.gripL.clone().setZ(-GUN_POINTS.gripL.z).multiplyScalar(this.gunScale).applyMatrix4(GL);
    const rp = gr.sub(this.arm.R.palmPt.clone().applyQuaternion(rq));
    this.socketRS = GL.clone().invert().multiply(new THREE.Matrix4().compose(rp, rq, new THREE.Vector3(1, 1, 1)));
    this.resetPose();
    this.root.position.copy(saveP); this.root.quaternion.copy(saveQ);
    this.root.updateMatrixWorld(true);
  }

  /**
   * Holster socket relative to the pelvis bone: across the small of the back like a
   * fanny pack, barrel to the left (muzzle dipped), grip out on the right where the
   * drawing hand finds it. Defined by where the grip sits (arms this short reach the
   * back only up at the lumbar).
   */
  computeHolster() {
    const H = T.weapon.holster;
    this.resetPose();
    const saveP = this.root.position.clone(), saveQ = this.root.quaternion.clone();
    this.root.position.set(0, 0, 0); this.root.quaternion.identity();
    this.root.updateMatrixWorld(true);
    const pelvisInv = new THREE.Matrix4().copy(this.bones.spine.matrixWorld).invert();
    // gun frame: +X barrel to the character's left, +Y the gun's top up, side plate against the back
    const xg = new THREE.Vector3(1, 0, 0), yg = new THREE.Vector3(0, 1, 0), zg = new THREE.Vector3(0, 0, 1);
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xg, yg, zg));
    q.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -H.tilt * DEG)); // muzzle dips
    q.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), H.wrap * DEG)); // hugs the waist
    const grip = GUN_POINTS.gripR.clone().multiplyScalar(this.gunScale).applyQuaternion(q);
    const pos = new THREE.Vector3(H.x, H.y, H.z).sub(grip);
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
    // Each loop plays at groundSpeed / its own ground speed (measured from its planted
    // foot), so the feet don't skate. The jog and sprint clips are authored at almost
    // exactly the run and sprint speeds; the walk is stretched (longer steps, then a
    // quicker cadence) up to a brisk walk, then hands over to the jog.
    const g = this.gait;
    const knots = [0, A.walkIn, A.walkMax, A.jogIn, s.walkSpeed, s.sprintSpeed];
    const W = [0, 0, 0, 0]; // idle, walk, jog, sprint
    if (gs <= knots[1]) { W[1] = gs / knots[1]; W[0] = 1 - W[1]; }
    else if (gs <= knots[2]) W[1] = 1;
    else if (gs <= knots[3]) { W[2] = smooth(knots[2], knots[3], gs); W[1] = 1 - W[2]; }
    else if (gs <= knots[4]) W[2] = 1;
    else if (gs <= knots[5]) { W[3] = (gs - knots[4]) / (knots[5] - knots[4]); W[2] = 1 - W[3]; }
    else W[3] = 1;
    const wm = W[1] + W[2] + W[3];
    const moving = [[1, 'walk'], [2, 'jog'], [3, 'sprint']];
    const blendG = (key) => {
      let v = g.walk[key];
      if (wm > 0) { v = 0; for (const [i, n] of moving) v += W[i] * g[n][key]; v /= wm; }
      return THREE.MathUtils.lerp(v, g.crouchWalk[key], cr);
    };
    const natSpeed = blendG('cycle') / blendG('dur'); // speed at 1x with the blended stride
    const ratio = gs / natSpeed;
    // past the clip's speed: part longer strides (the foot IK stretches them), part cadence
    const maxStride = THREE.MathUtils.lerp(wm > 0 ? (W[1] * A.walkStride + (W[2] + W[3]) * A.maxStride) / wm : A.walkStride, A.walkStride, cr);
    st.stride = ratio >= 1 ? Math.min(maxStride, Math.pow(ratio, A.strideShare)) : Math.max(0.7, Math.sqrt(ratio));
    const cad = ratio / st.stride / blendG('dur');
    if (footed && sl < 0.5) st.phi = (((st.phi + (back ? -1 : 1) * cad * dt) % 1) + 1) % 1;
    const at = (n) => ((st.phi + g[n].off) % 1) * g[n].dur;
    const base = C.sample('idle', this.time, P.base);
    let cum = W[0];
    for (const [i, n] of moving) {
      if (W[i] <= 0) continue;
      cum += W[i];
      C.blend(base, C.sample(n, at(n), P.tmp), W[i] / cum);
    }
    const cwk = clamp(gs / 0.5, 0, 1); // crouch: idle -> walk
    if (cr > 0.001) {
      const cp = C.sample('crouchIdle', this.time, P.tmp);
      C.blend(cp, C.sample('crouchWalk', at('crouchWalk'), P.tmp2), cwk);
      C.blend(base, cp, cr * A.crouchDepth);
    }
    // how planted each foot is at this point of the cycle (idle: both)
    st.contact = st.contact || { L: 1, R: 1 };
    for (const f of ['L', 'R']) {
      let c = W[0];
      for (const [i, n] of moving) if (W[i] > 0) c += W[i] * this.contactAt(g[n], f, (st.phi + g[n].off) % 1);
      const cc = THREE.MathUtils.lerp(1, this.contactAt(g.crouchWalk, f, (st.phi + g.crouchWalk.off) % 1), cwk);
      st.contact[f] = THREE.MathUtils.lerp(c, cc, cr);
    }
    st.gaitMove = THREE.MathUtils.lerp(wm, cwk, cr);
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
    if (sl > 0.02 && !st.sliding) {
      // back into a slide that just ended (a hop, a lip): carry on sliding, don't drop in again
      if (this.time - (st.slideEnd ?? -9) < 0.5 && sT.cur) sT.play('slideLoop', 0.2, 0.15);
      else { sT.cur = null; sT.play('slideStart', A.slideFrom); }
      st.sliding = true;
    }
    if (sl < 0.02 && st.sliding) { st.sliding = false; st.slideEnd = this.time; }
    if (st.sliding) {
      sT.update(dt);
      if (sT.cur === 'slideStart' && sT.t > 0.7) sT.play('slideLoop', 0.2, 0.2);
      // (a tool in the hand may slide its own way: the Soul Brush's brush slide. Its pose takes the slide's place, by its weight)
      const alt = s.techs?.slidePose?.(this, dt, s);
      const pose = sT.sample(P.tmp);
      if (alt) C.blend(pose, alt.pose, alt.w);
      C.blend(base, pose, sl);
    }
    // ---- air dash: stretched out like the jump's take-off ----
    if (da > 0.001) C.blend(base, C.sample('jumpStart', A.dashFrame, P.tmp, false), da);
    // ---- mantle: the climb, timed to the vault ----
    if (mn > 0.001) C.blend(base, C.sample('climb', THREE.MathUtils.lerp(A.climbFrom, A.climbTo, clamp(s.mantleT ?? 1, 0, 1)), P.tmp, false), mn);

    // which hand has the gun (swaps to the left on right-side wallruns)
    st.hand = THREE.MathUtils.clamp((st.hand || 0) + Math.sign((s.gunHand || 0) - (st.hand || 0)) * dt / T.weapon.swapTime, 0, 1);
    if (Math.abs((s.gunHand || 0) - st.hand) < dt / T.weapon.swapTime) st.hand = s.gunHand || 0;
    // ---- pistol on the upper body: an aim offset (down / level / up) ----
    const wU = s.upper || 0;
    const prof = s.techs?.aimProfile?.() || null;
    if (wU > 0.001) {
      const up = C.sample('aimMid', 0, P.up);
      const pk = clamp(s.aimPitch / (A.aimRange * DEG), -1, 1);
      if (pk > 0) C.blend(up, C.sample('aimUp', 0, P.up2), pk);
      else if (pk < 0) C.blend(up, C.sample('aimDown', 0, P.up2), -pk);
      if (s.reload >= 0) C.blend(up, C.sample('reload', s.reload * C.clips.reload.dur, P.up2, false), smooth(0, 0.12, s.reload) * (1 - smooth(0.85, 1, s.reload)));
      // gun in the left hand: the same aim, mirrored
      if (st.hand > 0.001) C.blend(up, this.mirrorPose(up, P.up2), smooth(0.2, 0.8, st.hand));
      C.blend(base, up, wU, prof?.arm ? this.MASK_ARM[prof.arm] : this.MASK_UPPER, 0);
    }
    // movement techs blend their own poses in (swim, roll, climb...)
    s.techs?.animate(this, base, dt, s);
    this.applyPose(base);

    // ---- procedural layer ----
    root.position.y -= st.dip;
    st.turn = damp(st.turn, s.turnRate || 0, 8, dt);
    const lean = clamp(-st.turn * gs * 0.012, -0.3, 0.3) * (1 - air);
    // sliding on a slope: lie along it (pitch down a hill, roll across one)
    let sp = 0, sr = 0;
    if (s.groundN && sl > 0.01) {
      const n = s.groundN, fw = Math.sin(s.yaw) * n.x + Math.cos(s.yaw) * n.z, lf = Math.cos(s.yaw) * n.x - Math.sin(s.yaw) * n.z;
      sp = Math.atan2(fw, n.y) * sl; sr = -Math.atan2(lf, n.y) * sl;
    }
    st.slopeP = damp(st.slopeP || 0, sp, 12, dt);
    st.slopeR = damp(st.slopeR || 0, sr, 12, dt);
    root.rotation.set(st.slopeP, s.yaw, -wr * A.wallLean * DEG + lean + st.slopeR);
    // a body that is part of something (the Solar Skiff's skiff) is placed in that thing's frame instead: one rigid unit
    const unit = s.techs?.unitFrame?.() || null;
    if (unit) { root.position.copy(unit.pos); root.quaternion.copy(unit.quat); }
    root.updateMatrixWorld(true);
    const upW = _v3.set(0, 1, 0);
    // orientation warping: hips turn toward the move, the chest turns back to the aim
    const gaitW = unit ? 0 : st.gaitMove * (1 - air) * (1 - sl) * (1 - mn) * (1 - da);
    const warp = st.warp * gaitW;
    if (Math.abs(warp) > 1e-3) {
      this.rotW(B.spine, upW, warp);
      this.rotW(B.spine001, upW, -warp * 0.45);
      this.rotW(B.spine002, upW, -warp * 0.3);
      this.rotW(B.spine003, upW, -warp * 0.25);
    }
    // aim: the spine twists toward the camera's yaw when the body lags it; the head does the looking otherwise
    const cw = s.combat ?? 0;
    st.yawOff = damp(st.yawOff, s.aimYawOffset * cw * (prof?.turn ?? 1), 18, dt);
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
    const planted = (1 - air) * (1 - mn) * (1 - da) * (1 - aw) * (1 - sl); // (a slide lies along the slope instead)
    st.pole = kneeProfile({ air, sl, cr });
    if (!unit && !s.techs?.legsOwn) this.footIK(dt, s, planted, (st.stride - 1) * gaitW, speed, gaitW); // (on a skiff the feet are where the clip puts them)

    s.techs?.afterPose(this, s);
    this.headRel = (this.headRel || new THREE.Vector3()).copy(B.head.getWorldPosition(_v1)).sub(s.pos);
    Object.assign(st, { air, sl, mn, da, cr, wr, aw, gaitW, speed });
  }

  /**
   * Feet: stride warping (reach further along the move), ground contact (slopes,
   * stairs: the hips drop for the lower foot), and foot locking - a foot the cycle
   * says is planted stays where it landed until the cycle lifts it (or the body gets
   * too far away), so nothing skates while speeding up, turning or blending.
   */
  footIK(dt, s, planted, stretch, speed, gaitW) {
    const root = this.root, st = this.st;
    const mdir = new THREE.Vector3(s.velocity.x, 0, s.velocity.z);
    const doStride = Math.abs(stretch) > 0.01 && speed > 0.3;
    if (doStride) mdir.normalize();
    const offs = {}, offs0 = {}, d = { L: 0, R: 0 }, anim = {};
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
      offs0[k] = off.clone();
      anim[k] = F.add(off);
    }
    // foot locks (world space); a teleport drops them
    if (st.lockPos && st.lockPos.distanceToSquared(s.pos) > 1) for (const k of ['L', 'R']) { this.lock[k].on = false; this.lock[k].w = 0; }
    (st.lockPos = st.lockPos || new THREE.Vector3()).copy(s.pos);
    const lockable = T.anim.footLock && planted > 0.9 && gaitW > 0.25;
    for (const k of ['L', 'R']) {
      const L = this.lock[k];
      if (L.on && s.groundVel) L.p.addScaledVector(s.groundVel, dt); // (a locked foot rides its platform)
      const want = lockable && st.contact[k] > 0.6;
      if (want && !L.on) { L.on = true; L.p.copy(anim[k]); L.w = 1; } // (locks where the foot is: no pop)
      if (L.on && (!want || Math.hypot(L.p.x - anim[k].x, L.p.z - anim[k].z) > 0.35)) L.on = false;
      L.w = THREE.MathUtils.damp(L.w, L.on ? 1 : 0, L.on ? 30 : 16, dt);
      if (L.w > 0.001) { offs[k].x += (L.p.x - anim[k].x) * L.w; offs[k].z += (L.p.z - anim[k].z) * L.w; }
    }
    // absolute targets, then drop the hips for the lower foot and for reach (a long
    // stride with the hips at clip height would straighten the legs and drag the feet)
    const tgt = {};
    for (const k of ['L', 'R']) { tgt[k] = anim[k].clone().sub(new THREE.Vector3(offs0[k].x, 0, offs0[k].z)).add(new THREE.Vector3(offs[k].x, d[k], offs[k].z)); }
    let drop = -Math.min(0, d.L, d.R);
    let reach = 0;
    for (const k of ['L', 'R']) {
      const leg = this.leg[k];
      const v = leg.thigh.getWorldPosition(new THREE.Vector3()).sub(tgt[k]);
      v.y -= drop;
      const R = (leg.a + leg.b) * 0.985, l2 = v.lengthSq();
      if (l2 > R * R) {
        const disc = v.y * v.y - (l2 - R * R);
        reach = Math.max(reach, disc > 0 ? v.y - Math.sqrt(disc) : 0.12);
      }
    }
    st.reachDrop = THREE.MathUtils.damp(st.reachDrop || 0, Math.min(0.12, reach), reach > (st.reachDrop || 0) ? 40 : 10, dt);
    drop += st.reachDrop;
    if (drop > 0) { root.position.y -= drop; root.updateMatrixWorld(true); }
    const fwd = _v4.set(0, 0, 1).applyQuaternion(root.quaternion);
    const left = _v5.set(1, 0, 0).applyQuaternion(root.quaternion), rootUp = _v6.set(0, 1, 0).applyQuaternion(root.quaternion);
    for (const k of ['L', 'R']) {
      const leg = this.leg[k];
      const target = tgt[k];
      if (target.distanceToSquared(leg.foot.getWorldPosition(_v1)) < 1e-6) continue;
      // the knee bends toward the state's own pole (poles.js): forward, and never flared out
      const PF = st.pole || { fwd: 0.1, out: 0, up: 0 };
      const pole = leg.shin.getWorldPosition(new THREE.Vector3()).addScaledVector(fwd, PF.fwd).addScaledVector(left, PF.out * (k === 'L' ? 1 : -1)).addScaledVector(rootUp, PF.up);
      const fq = leg.foot.getWorldQuaternion(new THREE.Quaternion());
      this.solveLeg(leg, target, pole);
      this.setWorldQuat(leg.foot, fq);
      leg.foot.updateMatrixWorld(true);
    }
  }

  /**
   * The last look at the knees: a knee that has ended up further to the outside of the hip-to-foot line than the state allows
   * (poles.js) is bent back in by re-solving the leg with its pole pulled across. Rig-independent: it measures where the knee
   * is. `k` is how much of the pose is the body's own (0 when a tech has taken the body over: a ladder, a hang, the skiff).
   */
  guardKnees(k) {
    const PF = this.st.pole;
    if (!PF || k < 0.05) return;
    const root = this.root;
    const left = _v5.set(1, 0, 0).applyQuaternion(root.quaternion);
    for (const side of ['L', 'R']) {
      const leg = this.leg[side];
      root.updateMatrixWorld(true);
      const hip = leg.thigh.getWorldPosition(_v1), knee = leg.shin.getWorldPosition(_v2), foot = leg.foot.getWorldPosition(_v3);
      const ab = _v4.subVectors(foot, hip), t = THREE.MathUtils.clamp(_v6.subVectors(knee, hip).dot(ab) / Math.max(1e-6, ab.lengthSq()), 0, 1);
      const dev = _v6.copy(knee).sub(hip).addScaledVector(ab, -t); // (from the line to the knee)
      const out = dev.dot(left) * (side === 'L' ? 1 : -1);
      const over = out - PF.maxOut;
      if (over <= 0.005) continue;
      const fq = leg.foot.getWorldQuaternion(new THREE.Quaternion());
      const pole = knee.clone().addScaledVector(left, -(side === 'L' ? 1 : -1) * over * 1.6 * k);
      const tgt = foot.clone();
      this.solveLeg(leg, tgt, pole);
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
    // (never fully straight: a limb at its full length has no bend direction, and hyperextends or flips on the next frame)
    d = THREE.MathUtils.clamp(d, Math.abs(a - b) + 1e-3, (a + b) * 0.99);
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
  reachHand(side, pos, quat, w, shift = 0, poleOverride = null) {
    if (w <= 0.001) return;
    const arm = this.arm[side];
    const hq = arm.hand.getWorldQuaternion(new THREE.Quaternion());
    const hp = arm.hand.getWorldPosition(new THREE.Vector3());
    const target = hp.clone().lerp(pos, w);
    const pole = poleOverride ? poleOverride.clone() : arm.fore.getWorldPosition(new THREE.Vector3()).add(_v1.set(0, -0.12, 0));
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
    // the shoulder's ball joint: what the arm can't reach, the shoulder gives (up to STRETCH), the way
    // a posed figure's shoulder is pushed toward the reach
    if (!(shift > 0 && this.fpCam)) {
      const S = arm.upper.getWorldPosition(new THREE.Vector3());
      const d = S.distanceTo(target), L = (arm.a + arm.b) * 0.96;
      if (d > L) {
        const give = Math.min(d - L, STRETCH);
        const sh = target.clone().sub(S).normalize().multiplyScalar(give);
        arm.upper.parent.getWorldQuaternion(_q1).invert();
        arm.upper.position.add(sh.applyQuaternion(_q1));
        arm.upper.updateMatrixWorld(true);
      }
    }
    this.solve2(arm.upper, arm.fore, arm.hand, arm.a, arm.b, target, pole);
    this.setWorldQuat(arm.hand, hq.slerp(quat, w));
    arm.hand.updateMatrixWorld(true);
  }

  /**
   * Where a hand has to be for the gun at world matrix M. kind: 'R' right hand holding,
   * 'L' left hand supporting, 'LH' left hand holding, 'RS' right hand supporting.
   */
  handFromGun(M, kind, pos, quat) {
    const S = kind === 'R' ? this.socketRInv : kind === 'L' ? this.socketL : kind === 'LH' ? this.socketLHInv : this.socketRS;
    _m1.multiplyMatrices(M, S).decompose(pos, quat, _v4);
  }

  /** The gun as held: in the right hand, the left, or on its way between them (h 0..1). */
  heldGun(h, out) {
    const B = this.bones;
    if (h <= 0.001) return out.multiplyMatrices(B.handR.matrixWorld, this.socketR);
    if (h >= 0.999) return out.multiplyMatrices(B.handL.matrixWorld, this.socketLH);
    const a = new THREE.Matrix4().multiplyMatrices(B.handR.matrixWorld, this.socketR);
    const b = new THREE.Matrix4().multiplyMatrices(B.handL.matrixWorld, this.socketLH);
    const pa = new THREE.Vector3(), qa = new THREE.Quaternion(), pb = new THREE.Vector3(), qb = new THREE.Quaternion();
    a.decompose(pa, qa, _v4); b.decompose(pb, qb, _v4);
    const k = smooth(0, 1, h);
    return out.compose(pa.lerp(pb, k), qa.slerp(qb, k), _v4.set(1, 1, 1));
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
    const HOLD = T.weapon.drawGrab;
    const inHand = o.drawT > HOLD;
    const Mg = new THREE.Matrix4(), gp = new THREE.Vector3(), gq = new THREE.Quaternion();
    const hp = new THREE.Vector3(), hq = new THREE.Quaternion();
    const rq = root.quaternion;
    const C = (x, y, z) => new THREE.Vector3(x, y, z).applyQuaternion(rq); // char-space direction -> world
    // the draw: reach back to the small of the back (the shoulder turns back to help),
    // grab, and whip the gun round the right side up to where the animation holds it
    const reachW = inHand ? 0 : smooth(0, HOLD, o.drawT);
    const whipU = inHand ? smooth(HOLD, 1, o.drawT) : 0; // 0 at the holster .. 1 in the animated hand
    const twist = inHand ? Math.sin(Math.PI * Math.min(1, whipU * 1.3)) * 0.6 + (1 - whipU) * 0.4 : reachW;
    if (twist > 0.001 && o.drawT < 1) {
      const upW = _v3.set(0, 1, 0);
      this.rotW(B.spine001, upW, -T.weapon.drawTwist * DEG * 0.5 * twist);
      this.rotW(B.spine003, upW, -T.weapon.drawTwist * DEG * 0.5 * twist);
      this.rotW(B.spine001, C(-1, 0, 0), -8 * DEG * twist); // lean back a touch into the reach
      root.updateMatrixWorld(true);
    }
    const holster = _m1.multiplyMatrices(B.spine.matrixWorld, this.holsterLocal).clone();
    const hs = inHand ? st.hand : 0; // which hand holds it (0 right .. 1 left)
    const shR = this.shoulder('R', new THREE.Vector3());
    const drawPole = shR.clone().add(C(-0.5, -0.25, -0.35)); // elbow out and back

    // 1) turn the chest so the barrel lines up with the crosshair
    const wAim = (o.upper || 0) * (inHand ? 1 : 0) * (o.reloading ? 0.3 : 1) * (1 - (o.fw || 0)) * (o.aimTurn ?? 1);
    if (wAim > 0.01 && o.aimPoint) {
      for (let it = 0; it < 2; it++) {
        this.heldGun(hs, Mg).decompose(gp, gq, _v4);
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

    // 1b) pinned to something (a ladder, a ledge): the gun arm alone swings to the aim, the torso stays
    if (o.aimArm === 'R' && inHand && (o.fw || 0) < 0.5 && o.aimPoint) {
      const k = smooth(HOLD, 1, o.drawT) * (o.upper || 0);
      if (k > 0.02) {
        const sh = this.shoulder('R', new THREE.Vector3());
        const dir = o.aimPoint.clone().sub(sh).normalize();
        const pos = sh.clone().addScaledVector(dir, 0.66).addScaledVector(UP, -0.05); // (arm out straight: the shoulder gives what the arm can't)
        const x = dir.clone(), y = UP.clone().addScaledVector(dir, -UP.dot(dir)).normalize();
        const G = new THREE.Matrix4().makeBasis(x, y, new THREE.Vector3().crossVectors(x, y));
        G.setPosition(pos);
        this.handFromGun(G, 'R', hp, hq);
        this.reachHand('R', hp, hq, k);
      }
    }

    // 2) the right hand: to the holster to draw / put away, else wherever the animation has it
    if (reachW > 0.001) {
      this.handFromGun(holster, 'R', hp, hq);
      this.reachHand('R', hp, hq, reachW, 0, drawPole);
    } else if (inHand && whipU < 1) {
      // the whip: a curve from the holster grip, out round the right hip, to the animated hand
      const gpos = new THREE.Vector3(), gquat = new THREE.Quaternion();
      this.handFromGun(holster, 'R', gpos, gquat);
      const apos = B.handR.getWorldPosition(new THREE.Vector3()), aquat = B.handR.getWorldQuaternion(new THREE.Quaternion());
      const side = root.position.clone().add(C(-0.5, 1.05, -0.05));
      const u = whipU, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u;
      const p = gpos.multiplyScalar(a).addScaledVector(side, b).addScaledVector(apos, c);
      const q = gquat.slerp(aquat, smooth(0.15, 0.85, u));
      this.reachHand('R', p, q, 1, 0, drawPole.lerp(B.forearmR.getWorldPosition(new THREE.Vector3()).add(_v1.set(0, -0.12, 0)), u));
    }
    if (inHand) this.heldGun(hs, Mg);
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
    // holding: the right hand while hs < 0.5, the left after; mid-swap both are on it
    const holdR = inHand ? 1 - smooth(0.55, 0.85, hs) : 0, holdL = inHand ? smooth(0.15, 0.45, hs) : 0;
    const swapping = hs > 0.001 && hs < 0.999;
    if (holdR > 0.001 && (fwG > 0.001 || swapping)) {
      this.handFromGun(this.gun.matrixWorld, 'R', hp, hq);
      this.reachHand('R', hp, hq, holdR, shift);
    }
    if (holdL > 0.001 && (fwG > 0.001 || swapping)) {
      this.handFromGun(this.gun.matrixWorld, 'LH', hp, hq);
      this.reachHand('L', hp, hq, holdL, shift);
    }
    // the support hand: on the grip when aiming, off it for reloads and contacts
    const supSide = hs < 0.5 ? 'L' : 'R';
    let wL = Math.max(o.upper || 0, fwG) * (inHand ? smooth(HOLD, 1, o.drawT) : 0) * Math.abs(1 - 2 * hs) * (o.aimArm ? 0 : 1); // (one-handed: the other hand is holding on)
    if (o.reloading && fwG < 0.5) wL = 0; // the reload clip drives it
    let contactL = 0, contactR = 0;
    // wall: the wall-side hand flat on the wall, a little ahead (unless it's holding the gun)
    const wallSide = o.wallSide > 0 ? 'R' : 'L';
    const wallW = st.aw * (o.wallPoint ? 1 : 0) * (1 - (wallSide === 'R' ? holdR : holdL));
    if (wallW > 0.01) {
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
        if ((side === 'R' ? holdR : holdL) > 0.5) continue;
        const sg = side === 'L' ? 1 : -1;
        const q = this.handQuat(this.arm[side], fwd, new THREE.Vector3(0, -1, 0));
        const p = o.ledge.point.clone().addScaledVector(o.ledge.right, -sg * 0.22).addScaledVector(fwd, 0.08)
          .sub(this.arm[side].palmPt.clone().applyQuaternion(q)).add(new THREE.Vector3(0, 0.02, 0));
        this.reachHand(side, p, q, ledgeW);
        if (side === 'L') contactL = Math.max(contactL, ledgeW); else contactR = Math.max(contactR, ledgeW);
      }
    }
    wL *= 1 - (supSide === 'L' ? contactL : contactR);
    if (wL > 0.001) {
      this.handFromGun(this.gun.matrixWorld, supSide === 'L' ? 'L' : 'RS', hp, hq);
      if (o.leftBlend > 0 && o.leftOverride) hp.lerp(o.leftOverride, o.leftBlend);
      this.reachHand(supSide, hp, hq, wL, shift);
    }
    // flat fingers on a surface
    for (const [side, k] of [['L', contactL], ['R', contactR]]) {
      if (k <= 0.01) continue;
      for (const f of this.arm[side].fingers) f.quaternion.slerp(this.rest.get(f).q, k * 0.85);
    }
    this.gunHeld = holdR > 0.5; // (techs leave a hand that's holding the gun alone)
    o.techs?.hands(this, o);
    if ((o.techs?.override || 0) < 0.5) this.limits.apply(); // (a tech that owns the body, a ladder, a pole, has posed the hands to its own handholds)
    if (!o.techs?.unitFrame?.()) this.guardKnees(1 - Math.min(1, o.techs?.override || 0));
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
