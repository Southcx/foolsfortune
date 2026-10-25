// ---------------------------------------------------------------------------------------
// THE COURIER'S RIG: the Courier as drawn and as animated. The glTF body dressed (a material for each region the kiln can finish, the
// outlines, the first-person hide), its skeleton measured at rest, the psygun's model with its iron sights; and each frame `animate`,
// the pose: the clips mixed (the idle, walk, jog and sprint on one shared phase, the crouch, the slide, the air, the mantle, the aim
// and the gun's moves over the upper body), the moves' own poses blended in through `s.techs`, then the procedural layer on the posed
// body (the hips turned toward the move, the chest toward the aim, the head's look, the feet onto the ground); and after it
// `poseHands` (the gun drawn, held and aimed, a hand on a wall or a ledge, the joint limits last). IK only corrects the animated pose
// (CLAUDE.md, Animation): every chain bends toward its animated elbow or knee, so a limb cannot flip, and rom.js has the last word on
// every posed joint. The same class is a sibling's rig (coop/sibling.js: its own fade and dissolve), the title's Courier and the Anim
// Lab's.
//
// This file keeps the Character: its state, the constructor, the small methods and `animate`, which is one pass and stays whole. Every
// other job is a part, a module in courier/character/ that takes the Character first; the class keeps a method of each name, a line
// that hands itself to its part (the moves, the tools, the siblings and the pose audit call them):
//   bodymaterials.js  the maker's paintings and the materials of the body's regions, which glaze region a mesh is, the first-person tag
//   gunpoints.js      the psygun model's named points (GUN_POINTS, exported from here as before)
//   scratch.js        the vectors, quaternions and matrix the parts share, the sides, the smoothstep
//   animsetup.js      the clips, masks and layers' modules built (initAnim); a pose mirrored left to right and written to the bones
//   rigmeasure.js     the rig measured: each gait's speed and contacts, the soles, the gun's sockets, the holster
//   bonehelpers.js    a bone turned, aimed or set in the world, the two-bone IK solve, the head's turn held to a neck's range
//   feet.js           the feet onto the ground (stride warping, foot locks, the hips' drop), the knees kept in
//   hands.js          a hand reached to a pose, the gun as held, and the hands and the gun after the pose (poseHands)
//
// Prior art: clips blended in layers with an aim offset over the upper body (Unreal's and Unity's animation layers), stride and
// orientation warping and foot locking against skating (Unreal Engine 5's warping nodes; the footskate cleanup of Kovar, Schreiner and
// Gleicher, 2002), the analytic two-bone solve with a pole (Maya's and Blender's IK handles), a joint-limit pass last (rom.js).
//
//   const ch = new Character(scene, charGltf, gunGltf, animPack, { uniforms, fpHide })     ch.animate(dt, s)     ch.poseHands(o)
//   ch.gunPoint(name, out)   ch.setFirstPerson(fp)   ch.setHidden(h)   ch.snapshot(material)   ch.reachHand(side, pos, quat, w)
// ---------------------------------------------------------------------------------------
import { courierLimits } from './anim/rom.js';
import { LimbHinges } from './anim/hinges.js';
import { BodyProxies } from './anim/bodyproxies.js';
import { Standoff } from './anim/standoff.js';
import { WristEase } from './anim/wristease.js';
import { kneeProfile } from '../world/props/poles.js';
import * as THREE from 'three';
import { addRim } from '../render/toon.js';
import { T, PALETTE, DEG } from '../core/config.js';
import { addOutline, applyFpHide, fpHideUniform, OUTLINE_MAT_FPHIDE, OUTLINE_MAT_CHAR, withFade, COURIER_RIG, rigOutlines } from '../render/outline.js';
import { PROWL } from './anim/prowl.js';
import { dressFiligree } from '../vfx/filigree.js';
import { installVesselDice } from '../vfx/vesseldice.js';
import { GUN_POINTS } from './character/gunpoints.js';
import { MATS, OUTLINED, regionOf, tagFpHide } from './character/bodymaterials.js';
import { UP, LR, _v1, _v2, _v3, _v4, _q1, _q2, smooth } from './character/scratch.js';
import { initAnim, initMirror, mirrorPose, applyPose } from './character/animsetup.js';
import { analyseGait, measureSoles, contactAt, computeSockets, computeHolster } from './character/rigmeasure.js';
import { rot, rotW, turnW, setWorldQuat, aimBone, handQuat, solveLeg, solve2, holdNeck } from './character/bonehelpers.js';
import { footIK, guardKnees } from './character/feet.js';
import { reachHand, handFromGun, heldGun, poseHands } from './character/hands.js';

export { GUN_POINTS }; // (the psygun's models, the weapon and the gun's moves import it from here)

const START_SWAP = 0.15; // s: the idle to the moving loops (or back) takes at least this long

export class Character {
  /** opts (a second rig: a sibling, coop/sibling.js): `uniforms`, its own fade and dissolve (render/outline.js rigUniforms); `fpHide: false`,
   *  never hidden by the first-person view (that is the Courier's own camera). */
  constructor(scene, charGltf, gunGltf, animPack, { uniforms = COURIER_RIG, fpHide = true } = {}) {
    this.scene = scene; this.U = uniforms;
    const OL = uniforms === COURIER_RIG ? { fphide: OUTLINE_MAT_FPHIDE, char: OUTLINE_MAT_CHAR } : rigOutlines(uniforms); // (a sibling's outlines melt with it, not with the Courier)
    this.root = new THREE.Group();
    this.root.name = 'CourierRoot';
    this.model = charGltf.scene;
    this.root.add(this.model);
    scene.add(this.root);

    this.fpHidden = [];
    const byMat = new Map();
    const meshes = [];
    this.model.traverse((o) => { if (o.isMesh) meshes.push(o); });
    // a material for each region the kiln can finish (courier/vessel/glazes.js: body, trim, stones, mask, hair, skin), the rest by what it is made of
    this.regionMats = {};
    for (const o of meshes) {
      const name = o.material.name;
      const isArmor = o.parent?.name === 'Courier_Armor';
      const region = regionOf(o, name, isArmor);
      const key = region ? `region.${region}` : isArmor ? `${name}_armor` : name;
      if (!byMat.has(key)) {
        const m = (MATS[name] || MATS.CourierEnergy)();
        m.onBeforeCompile = applyFpHide;
        m.customProgramCacheKey = () => 'fphide-rig'; // (one key for every region: the code is the same, so they share a program; a patch on top adds its own: -fin, -kin, filigree)
        if (!m.transparent) addRim(m); // (the thin Lachryma rim: render/toon.js)
        byMat.set(key, withFade(m, 'rig', this.U));
        if (region) this.regionMats[region] = m;
        if (name === 'Courier_Armor' && !this.filigree) this.filigree = dressFiligree(byMat.get(key)); // (the maker's line masks: vfx/filigree.js)
      }
      o.material = byMat.get(key);
      tagFpHide(o, isArmor); if (!fpHide) o.geometry.attributes.fpHide?.array.fill(0); // (a sibling: nothing of it is the camera's own head)
      o.castShadow = true;
      o.receiveShadow = true;
      o.frustumCulled = false;
      const outlined = OUTLINED.has(name) || OUTLINED.has(o.parent?.name) || OUTLINED.has(o.name);
      if (outlined) addOutline(o, OL.fphide);
      if (o.name === 'Courier_Mask' || o.name === 'Kiritohair') this.fpHidden.push(o, o.userData.outline);
    }
    this.stoneDice = installVesselDice(this); // (the stones worn as what they are, seven dice of the mineral: vfx/vesseldice.js)

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
    this.hinges = new LimbHinges(this.bones, (b) => this.rest.get(b).q); // (knees and elbows squared to their hinges after IK: anim/hinges.js)
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
    // the body's proxies (anim/bodyproxies.js), and what keeps the arms to a body's own: the hands and forearms out of it (anim/standoff.js),
    // each wrist within its range (anim/wristease.js). `reached`: how much each hand was set on something by the IK this frame (reachHand)
    this.body = new BodyProxies(B);
    this.standoff = new Standoff(this, this.body);
    this.wrists = new WristEase(this, this.body);
    this.reached = { L: 0, R: 0 }; this.reachMark = true;

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
      withFade(o.material, 'rig', this.U);
      o.castShadow = true;
      addOutline(o, OL.char);
    }
    // greybox iron sights so ADS has something to line up
    const sightMat = withFade(new THREE.MeshStandardMaterial({ color: PALETTE.deep, flatShading: true }), 'rig', this.U);
    const dotMat = withFade(new THREE.MeshBasicMaterial({ color: PALETTE.hot }), 'rig', this.U);
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

  setFade(f) { this.U.fade.value = f; }

  /** The dissolve (outline.js): 0 whole .. 1 gone, eaten from the top of a body standing at feetY (a melt into slip, a rise out). */
  setDissolve(k, feetY = this.root.position.y, height = 1.9) { this.U.dissolve.value = k; this.U.base.value.set(feetY, height); }
  get dissolve() { return this.U.dissolve.value; }

  /** Hide the body and gun (a tech that turns the Courier into something else). */
  /** A blow taken (k 0..1, dir: its world direction): the upper body flinches over whatever is playing, a big one recoils (anim/hurt.js). */
  flinch(k = 1, dir = null) { this.hurt.flinch(k, dir); }
  /** The sub tool's verb lent on R, its body over whatever plays (anim/lendgesture.js; event tool.lend). */
  lend(tool, freeHand = 'L') { return this.lendGesture?.play(tool, freeHand) ?? false; }

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

  /** Taken out of the world: the body and the gun (each hangs from the scene on its own), their geometry freed (a sibling's or a
   *  guest's rig; the Courier's own is never disposed). Materials are the rig's family's, shared, and kept. */
  dispose() {
    for (const o of [this.root, this.gun]) { o?.parent?.remove(o); o?.traverse((m) => { if (m.isMesh) m.geometry?.dispose(); }); }
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

  // a bone turned, aimed or set, the two-bone IK solve, the head's turn held: bonehelpers.js
  rot(bone, axisChar, angle) { rot(this, bone, axisChar, angle); }
  rotW(bone, axisWorld, angle) { rotW(this, bone, axisWorld, angle); }
  turnW(bone, qWorld) { turnW(this, bone, qWorld); }
  setWorldQuat(bone, qWorld) { setWorldQuat(this, bone, qWorld); }
  aimBone(bone, child, point) { aimBone(this, bone, child, point); }
  handQuat(arm, dirWorld, palmWorld) { return handQuat(this, arm, dirWorld, palmWorld); }
  solveLeg(leg, target, pole) { solveLeg(this, leg, target, pole); }
  solve2(upper, mid, end, a, b, target, pole) { solve2(this, upper, mid, end, a, b, target, pole); }
  holdNeck() { holdNeck(this); }

  // =========================================================================
  // Animation.
  //
  // The body is driven by clips (the Courier's own suite, courier/anim/suite.js, and
  // the older UAL and CMU packs): speed-synced idle/walk/jog/sprint, crouch, slide,
  // with a pistol aim offset layered on the upper body when the gun is up; the air
  // (anim/airborne.js), the idle and its breaks (anim/idlebreak.js), a blow taken
  // (anim/hurt.js) and the mantle (anim/mantle.js) are modules of their own. The gun sits
  // in the right hand (a socket), so hands never chase the gun. IK only corrects
  // the animated pose: feet onto slopes and stairs (plus stride warping at speed),
  // the support hand onto the gun, a hand on the wall, hands on a ledge. Every IK
  // chain bends toward its *animated* elbow or knee, so limbs can't flip.
  // =========================================================================

  // the animation's setup, a pose mirrored and written to the bones: animsetup.js
  initAnim(pack) { initAnim(this, pack); }
  initMirror() { initMirror(this); }
  mirrorPose(src, dst) { return mirrorPose(this, src, dst); }
  applyPose(pose) { applyPose(this, pose); }
  // the rig measured (the gaits, the soles, the gun's sockets, the holster): rigmeasure.js
  analyseGait(name) { return analyseGait(this, name); }
  measureSoles() { return measureSoles(this); }
  contactAt(g, s, u) { return contactAt(this, g, s, u); }
  computeSockets() { computeSockets(this); }
  computeHolster() { computeHolster(this); }

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
    // (a start from standing: the gait speed passes 0.5 m/s in one frame at the ground's accel, and the idle became the run in that frame,
    //  every joint at once. The idle's share moves at most a whole in START_SWAP s, the loops scaled into the rest)
    st.still = THREE.MathUtils.clamp(W[0], (st.still ?? W[0]) - dt / START_SWAP, (st.still ?? W[0]) + dt / START_SWAP);
    if (Math.abs(st.still - W[0]) > 1e-6) {
      const m0 = W[1] + W[2] + W[3];
      if (m0 > 1e-6) for (const i of [1, 2, 3]) W[i] *= (1 - st.still) / m0;
      else W[1] = 1 - st.still;
      W[0] = st.still;
    }
    const wm = W[1] + W[2] + W[3];
    const moving = [[1, 'walk'], [2, 'jog'], [3, 'sprint']];
    const blendG = (key) => {
      let v = g.walk[key];
      if (wm > 0) { v = 0; for (const [i, n] of moving) v += W[i] * g[n][key]; v /= wm; }
      return THREE.MathUtils.lerp(v, g[PROWL.clip][key], cr);
    };
    const natSpeed = blendG('cycle') / blendG('dur'); // speed at 1x with the blended stride
    const ratio = gs / natSpeed;
    // past the clip's speed: part longer strides (the foot IK stretches them), part cadence
    const maxStride = THREE.MathUtils.lerp(wm > 0 ? (W[1] * A.walkStride + (W[2] + W[3]) * A.maxStride) / wm : A.walkStride, PROWL.stride, cr);
    st.stride = ratio >= 1 ? Math.min(maxStride, Math.pow(ratio, A.strideShare)) : Math.max(0.7, Math.sqrt(ratio));
    const cad = ratio / st.stride / blendG('dur');
    if (footed && sl < 0.5) st.phi = (((st.phi + (back ? -1 : 1) * cad * dt) % 1) + 1) % 1;
    const at = (n) => ((st.phi + g[n].off) % 1) * g[n].dur;
    const base = this.idles.idle(dt, s, W[0], P.base);
    let cum = W[0];
    for (const [i, n] of moving) {
      if (W[i] <= 0) continue;
      cum += W[i];
      C.blend(base, C.sample(n, at(n), P.tmp), W[i] / cum);
    }
    const cwk = clamp(gs / 0.5, 0, 1); // crouch: idle -> the prowl
    // (a take-off from the crouch: its weight held under the air's rising one until the air has the whole body, so the body goes from the
    //  crouch into the jump's own spring and never through the standing idle between: the owner's crouch-jump hiccup, 2026-10-11, showed
    //  the idle at 0.29 for a held C. Let go once the air is whole, and on the ground at the crouch's own rate. Taken at the larger of this
    //  frame's crouch and the last, as getting up from the belly lets the crouch start falling on the take-off frame itself. Landed back into
    //  the crouch before the air was whole, as under a roof too low to stand, it is kept while the crouch climbs back up to it: let go at the
    //  crouch's rate there, the two crossed at 0.44 and the standing idle showed at 0.41 in the 1.5 m basement tunnel)
    const crPrev = st.crPrev ?? cr; st.crPrev = cr;
    if (!footed && st.footed !== false) st.crHold = Math.max(cr, crPrev);
    else if (footed && cr < (st.crHold || 0) && (cr > crPrev || st.footed === false)) { /* (landed into the crouch: kept until it is back; the landing frame's own crouch still falls) */ }
    else if (footed || this.airT > 0.95) st.crHold = damp(st.crHold || 0, 0, 12, dt);
    st.footed = footed;
    const crS = Math.max(cr, st.crHold || 0);
    st.crouchW = crS > 0.001 ? crS * THREE.MathUtils.lerp(A.crouchDepth, 1, cwk) : 0; // (the crouch layer's weight as laid)
    if (crS > 0.001) {
      const cp = C.sample('crouchIdle', this.time, P.tmp);
      C.blend(cp, C.sample(PROWL.clip, at(PROWL.clip), P.tmp2), cwk);
      C.blend(base, cp, st.crouchW);
    }
    const crw = this.crawl.pose(dt, s, gs, base, cr); // (on all fours: anim/crawl.js; the feet and the prowl's head give way to it)
    st.prowlLift = PROWL.lift * cr * cwk * (1 - crw); st.crawlW = crw;
    // how planted each foot is at this point of the cycle (idle: both)
    st.contact = st.contact || { L: 1, R: 1 };
    for (const f of LR) {
      let c = W[0];
      for (const [i, n] of moving) if (W[i] > 0) c += W[i] * this.contactAt(g[n], f, (st.phi + g[n].off) % 1);
      const cc = THREE.MathUtils.lerp(1, this.contactAt(g[PROWL.clip], f, (st.phi + g[PROWL.clip].off) % 1), cwk);
      st.contact[f] = THREE.MathUtils.lerp(c, cc, cr);
    }
    st.gaitMove = THREE.MathUtils.lerp(wm, cwk, cr);
    // (no skid stop and no half turn over the gait: the owner, 2026-10-11, "it's slow and breaks flow")
    // (how much of the gait is running ground, and how much of that a sprint: a drawn tool's run of its own reads it, the cutlass's)
    st.run = (W[2] + W[3]) * (1 - cr) * (1 - crw) * (1 - this.airT) * (1 - sl) * (1 - mn) * (1 - da) * (1 - aw); st.sprint = W[2] + W[3] > 1e-6 ? W[3] / (W[2] + W[3]) : 0;
    // footsteps: the left heel lands at phase 0, the right at 0.5
    const ph = st.phi;
    if (footed && wm > 0.2 && sl < 0.5 && st.lastPhi !== undefined) {
      const crossed = (a) => (back ? st.lastPhi > a - 1e-9 && ph <= a : st.lastPhi < a && ph >= a) || Math.abs(ph - st.lastPhi) > 0.5 && a === 0;
      if (crossed(0) || crossed(0.5)) this.onFootstep?.();
    }
    st.lastPhi = ph;

    // ---- landing: the jump's, and the hard one past a long fall (anim/airborne.js) ----
    if (s.landed) st.dipV -= A.landDip * Math.min(2, s.landed / 6) * 14;
    this.air.land(dt, s, gs, footed, base);
    // ---- a blow taken: a flinch of the upper body, a big one's recoil (anim/hurt.js), over whatever they are doing ----
    this.hurt.pose(dt, base, s.yaw);
    st.dipV += (-180 * st.dip - 22 * st.dipV) * dt;
    st.dip += st.dipV * dt;

    // ---- air: take-off, the double jump's flip, the kick-off, the loop, the fall (anim/airborne.js) ----
    const air = this.airT * (1 - mn) * (1 - aw);
    this.air.air(dt, s, footed, air, base);

    // ---- slide: drop in, then hold the slide ----
    const sT = this.slideTrack;
    if (sl > 0.02 && !st.sliding) {
      // back into a slide that just ended (a hop, a lip): carry on sliding, don't drop in again
      if (this.time - (st.slideEnd ?? -9) < 0.5 && sT.cur) sT.play('slideLoop', 0.2, 0.15);
      else { sT.cur = null; sT.play('slideStart', A.slideFrom); }
      st.sliding = true;
    }
    if (sl < 0.02 && st.sliding) { st.sliding = false; st.slideEnd = this.time; }
    // ---- out of a slide on their feet: the slide's own way up (UAL Slide_Exit), bridging the slide's fade into the run ----
    if (st.sliding && sl < (st.slPrev ?? 0) - 1e-4 && st.exitT === undefined) st.exitT = 0;
    if (sl > (st.slPrev ?? 0) + 1e-4) st.exitT = undefined; // (back into it)
    st.slPrev = sl;
    if (st.exitT !== undefined && C.clips.slideExit) {
      st.exitT += dt;
      const ew = (1 - sl) * (1 - smooth(0.12, 0.4, st.exitT)) * (footed ? 1 : 0) * 0.9;
      if (ew > 0.001) C.blend(base, C.sample('slideExit', 0.18 + st.exitT * 0.9, P.tmp, false), ew);
      if (st.exitT > 0.4) st.exitT = undefined;
    }
    if (st.sliding) {
      sT.update(dt);
      if (sT.cur === 'slideStart' && sT.t > 0.7) sT.play('slideLoop', 0.2, 0.2);
      // (a tool in the hand may slide its own way: the Soul Brush's brush slide. Its pose takes the slide's place, by its weight)
      const alt = s.techs?.slidePose?.(this, dt, s);
      const pose = sT.sample(P.tmp);
      if (alt) C.blend(pose, alt.pose, alt.w);
      C.blend(base, pose, sl);
    }
    // ---- air dash: the suite's dash by its direction (anim/airborne.js) ----
    this.air.dash(dt, s, da, vLocal, base);
    // ---- mantle: the climb, the step-over's vault or the pull-up from a hang, timed to it (anim/mantle.js) ----
    this.mantle.pose(dt, s, mn, base);

    // which hand has the gun (swaps to the left on right-side wallruns)
    st.hand = THREE.MathUtils.clamp((st.hand || 0) + Math.sign((s.gunHand || 0) - (st.hand || 0)) * dt / T.weapon.swapTime, 0, 1);
    if (Math.abs((s.gunHand || 0) - st.hand) < dt / T.weapon.swapTime) st.hand = s.gunHand || 0;
    // ---- pistol on the upper body: an aim offset (down / level / up; the gun's sockets are measured from aimMid), and the suite's
    // Gun_* over it (tools/psygun/gunmoves.js): a shot's recoil, the rack, the quick draw; and the gun's own moves (the whip, the fan,
    // the flourish), which the aim gives way to while they play (the weapon's `combatBlend` reads less by their weight) ----
    const wU = s.upper || 0;
    const prof = s.techs?.aimProfile?.() || null;
    const gm = s.gun?.moves, mv = gm?.layer, wM = mv ? mv.w * (s.gun.held ?? 1) : 0;
    // (two passes: the aim at its own weight, `upper` with the move's share given back, then the move over it at the move's: the same sum
    // as one layer of both, and a move may keep a hand out of it: the flourish leaves the free hand to the walk)
    const wA = mv ? Math.min(1, wU / Math.max(1e-3, 1 - mv.w)) : wU;
    if (wA > 0.001) {
      const up = C.sample('aimMid', 0, P.up);
      const pk = clamp(s.aimPitch / (A.aimRange * DEG), -1, 1);
      if (pk > 0) C.blend(up, C.sample('aimUp', 0, P.up2), pk);
      else if (pk < 0) C.blend(up, C.sample('aimDown', 0, P.up2), -pk);
      const shot = gm?.shotW() ?? 0;
      if (shot > 0.001 && C.clips.Gun_Shoot) {
        // (additive: Gun_Shoot's motion against its own first frame, laid on the aim, so the suite's grip never replaces aimMid's)
        const s0 = (P.shot0 ||= C.sample('Gun_Shoot', 0, C.pose(), false)), s1 = C.sample('Gun_Shoot', gm.shotAt(), P.up2, false), [qa, qb] = (this._shotQ ||= [new THREE.Quaternion(), new THREE.Quaternion()]);
        for (let b = 0, i = 0; b < C.nb; b++, i += 4) {
          const k = shot * this.MASK_UPPER[b];
          if (k > 0) qa.fromArray(up.q, i).multiply(qb.fromArray(s0.q, i).invert().multiply(_q2.fromArray(s1.q, i)).slerp(_q1.identity(), 1 - k)).toArray(up.q, i);
        }
      }
      const qd = gm?.quickDraw?.();
      if (qd && C.clips.Gun_QuickDraw) C.blend(up, C.sample('Gun_QuickDraw', qd.t, P.up2, false), qd.w);
      const rack = C.clips.Gun_Reload ? 'Gun_Reload' : 'reload';
      if (s.reload >= 0) C.blend(up, C.sample(rack, s.reload * C.clips[rack].dur, P.up2, false), smooth(0, 0.12, s.reload) * (1 - smooth(0.85, 1, s.reload)));
      // gun in the left hand: the same aim, mirrored
      if (st.hand > 0.001) C.blend(up, this.mirrorPose(up, P.up2), smooth(0.2, 0.8, st.hand));
      C.blend(base, up, wA, prof?.arm ? this.MASK_ARM[prof.arm] : this.MASK_UPPER, 0);
    }
    if (wM > 0.001) {
      this.MASK_GUN_R ||= Float32Array.from(this.MASK_UPPER, (v, i) => (/L$/.test(C.bones[i]) && /^(upper_arm|forearm|hand|f_|thumb)/.test(C.bones[i]) ? 0 : v));
      C.blend(base, mv.pose, wM, mv.arm === 'R' ? this.MASK_GUN_R : prof?.arm ? this.MASK_ARM[prof.arm] : this.MASK_UPPER, 0);
    }
    // movement techs blend their own poses in (swim, roll, climb...)
    st.footDown = 0; // (a tech's kneel lets the feet down on to the floor: footIK)
    s.techs?.animate(this, base, dt, s);
    this.lendGesture.pose(dt, base); // (the sub's verb lent on R, over the stance, the air and any tech: anim/lendgesture.js)
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
    const gaitW = unit ? 0 : st.gaitMove * (1 - air) * (1 - sl) * (1 - mn) * (1 - da) * (1 - crw);
    const warp = st.warp * gaitW;
    if (Math.abs(warp) > 1e-3) {
      this.rotW(B.spine, upW, warp);
      this.rotW(B.spine001, upW, -warp * 0.45);
      this.rotW(B.spine002, upW, -warp * 0.3);
      this.rotW(B.spine003, upW, -warp * 0.25);
    }
    // the prowl's head: held level and still, before the aim's look is laid on (anim/prowl.js)
    const prowlW = unit ? 0 : cr * (1 - crw) * (1 - air) * (1 - sl) * (1 - mn) * (1 - da) * (1 - Math.min(1, s.techs?.override || 0));
    this.prowl.gaze(dt, s, prowlW);
    // aim: the spine twists toward the camera's yaw when the body lags it; the head does the looking otherwise
    const cw = s.combat ?? 0;
    st.yawOff = damp(st.yawOff, s.aimYawOffset * cw * (prof?.turn ?? 1), 18, dt);
    for (const [b, w] of [[B.spine001, 0.25], [B.spine002, 0.3], [B.spine003, 0.45]]) this.rotW(b, upW, st.yawOff * w);
    const rightW = _v4.set(-1, 0, 0).applyQuaternion(root.quaternion);
    this.rotW(B.spine003, rightW, -(s.recoil || 0) * 5 * DEG);
    const lookW = 1 - wU;
    // (the head's look toward the camera's way: the offset as player.js clamps it (80 either way) while the camera is within 100 degrees of
    //  where they face, eased to nothing as it comes round behind them, so it never flips from one shoulder to the other the frame the
    //  body passes 180 from the camera (the pose audit: the head 49 degrees in a frame, running toward the camera); and the neck's whole
    //  turn, the clip's own swing with it, held to NECK_TURN)
    const rawLook = s.techs?.player ? Math.atan2(Math.sin(s.techs.player.yaw - s.yaw), Math.cos(s.techs.player.yaw - s.yaw)) : s.aimYawOffset;
    const look = s.aimYawOffset * (1 - smooth(100 * DEG, 175 * DEG, Math.abs(rawLook)));
    this.rotW(B.spine004, upW, look * (1 - cw) * 0.25);
    this.rotW(B.head, upW, look * (1 - cw) * 0.35);
    this.holdNeck();
    this.rotW(B.head, rightW, s.aimPitch * 0.45 * lookW);
    root.updateMatrixWorld(true);

    // ---- feet: stride warping and ground contact ----
    const planted = (1 - air) * (1 - mn) * (1 - da) * (1 - aw) * (1 - sl) * (1 - crw); // (a slide lies along the slope instead; a crawl's knees are its clip's)
    st.pole = kneeProfile({ air, sl, cr });
    if (!unit && !s.techs?.legsOwn) this.footIK(dt, s, planted, (st.stride - 1) * gaitW, speed, gaitW); // (on a skiff the feet are where the clip puts them)
    this.prowl.steady(dt, s, prowlW); // (the neck holding the head's place: anim/prowl.js)

    s.techs?.afterPose(this, s);
    this.headRel = (this.headRel || new THREE.Vector3()).copy(B.head.getWorldPosition(_v1)).sub(s.pos);
    Object.assign(st, { air, sl, mn, da, cr, wr, aw, gaitW, speed });
    st.dt = dt;
  }

  // the feet and the knees: feet.js
  footIK(dt, s, planted, stretch, speed, gaitW) { footIK(this, dt, s, planted, stretch, speed, gaitW); }
  guardKnees(k) { guardKnees(this, k); }

  chestPoint(target) { return this.bones.spine004.getWorldPosition(target); }
  shoulder(side, target) { return this.arm[side].upper.getWorldPosition(target); }

  // the hands and the gun: hands.js
  reachHand(side, pos, quat, w, shift, poleOverride) { reachHand(this, side, pos, quat, w, shift, poleOverride); }
  handFromGun(M, kind, pos, quat) { handFromGun(this, M, kind, pos, quat); }
  heldGun(h, out) { return heldGun(this, h, out); }
  poseHands(o) { poseHands(this, o); }
}
