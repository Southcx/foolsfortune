import { JointLimits, RIGIFY } from '../courier/anim/rom.js';
import * as THREE from 'three';
import { T, PALETTE } from '../core/config.js';
import { RAPIER } from '../core/physics.js';
import { addOutline } from '../render/outline.js';
import { sfx } from '../audio/sfx.js';
import { GodArts, ART_BY_ID, ARTS } from './arts.js';
import { ZoiVeil } from '../feedback/cartography.js';
import { Raids } from '../world/basement/raids.js';
import { crackMat, goldMat, ribbonGeometry } from '../world/props/potcracks.js';
import { stream } from '../core/rng.js';
const simRand = stream('godhand/godhand'); // (the simulation's chance: core/rng.js, the same twice)

// ---------------------------------------------------------------------------------------
// THE GOD HAND (~). The Courier turns into a Pneuka jar, an immobile jar, and you become
// a disembodied hand: the camera pulls up into a turnable isometric view, the cursor is the hand,
// and the game becomes a physics god game played over the same rooms.
//
//   the jar     the jar stands where the Courier stood. It can be hurt: raiders (clapperjars
//                  come in waves, kamikaze), lobber balls, blasts, and whatever you throw at it
//                  crack it; at zero it shatters and reforges, more gold-seamed, a few seconds
//                  later. The hand can't roam further from it than its tether.
//   the hand       LMB uses the selected god art (grab and throw anything loose, cut,
//                  swell, wring, raise clay); hold RMB for the art wheel. (Shells are the psygun's. The hand has GOD ARTS instead: see godhand/arts.js.)
//   the view       Q / E turn it (a smooth eighth of a turn), the wheel zooms, WASD or the screen
//                  edges pan. Ceilings and everything above head height are cut away.
//   counters       grab a raider and throw it somewhere else, cut or blow it up, pin it (ANCHOR),
//                  make it dance (GROOVE), turn it (HATCH: a turned clapperjar guards the jar
//                  and mends it). Clapperjars you hatch stay.
// ~ again (once the jar is whole) puts the Courier back where the jar stood.
// ---------------------------------------------------------------------------------------
const UP = new THREE.Vector3(0, 1, 0);
const DOWN = new THREE.Vector3(0, -1, 0);
const DEG = Math.PI / 180;
const CLIP_OFF = 1e5; // (the cutaway, put away: far overhead)
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4();
const ease = (t) => t * t * (3 - 2 * t);
const easeOutBack = (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);
const wrapPi = (a) => Math.atan2(Math.sin(a), Math.cos(a));

const CSS = `
#god { position: fixed; inset: 0; pointer-events: none; display: none; font: 12px/1.4 var(--f-ui); color: #fbe3cf; z-index: 4; }
#god .jar { position: absolute; left: 50%; top: 58px; transform: translateX(-50%); width: min(420px, 60vw); text-align: center; letter-spacing: .08em; }
#god .jar .bar { height: 10px; margin-top: 4px; border: 1px solid rgba(255,178,122,.5); background: rgba(28,13,8,.55); border-radius: 2px; overflow: hidden; }
#god .jar .fill { height: 100%; width: 100%; background: linear-gradient(90deg, #ffb27a, #ffe0c0); transition: width .25s; }
#god .jar .sub { opacity: .75; font-size: 11px; margin-top: 3px; }
#god .hint { position: absolute; left: 50%; bottom: 128px; transform: translateX(-50%); opacity: .75; font-size: 11px; letter-spacing: .05em; background: rgba(28,13,8,.4); padding: 4px 10px; border-radius: 3px; white-space: nowrap; }
`;

export class GodMode {
  constructor(game, renderer, handGltf, jarGltf) {
    this.game = game;
    this.renderer = renderer;
    this.camera = game.camera;
    this.active = false; // the hand is (or is becoming) yours
    this.state = 'off'; // off | in | on | out
    this.t = 0;
    this.cam = { yaw: Math.PI * 0.25, yawT: Math.PI * 0.25, dist: T.god.dist, distT: T.god.dist, focus: new THREE.Vector3(), groundY: 0, from: null, shake: 0 };
    // (the cutaway plane is the renderer's always, and far overhead when the hand is not out: the number of clipping planes is part of
    // every shader's program, so setting it only on entering recompiled every material in sight, a long stall. Set once, before the
    // warm-up, nothing recompiles, and a plane a hundred kilometres up costs one comparison a pixel.)
    this.clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), CLIP_OFF);
    renderer.clippingPlanes = [this.clipPlane];
    this.cursor = { point: new THREE.Vector3(), normal: UP.clone(), hit: null, ok: false, far: false, ray: { origin: new THREE.Vector3(), dir: new THREE.Vector3() }, over: null };
    this.grab = null;
    this.thrown = [];
    this.handPos = new THREE.Vector3(); // the hand's smoothed cursor point
    this.samples = []; // recent cursor points, for the throw
    this.castCool = 0;
    this.jar = { pos: new THREE.Vector3(), hp: T.god.jarHp, max: T.god.jarHp, alive: true, mendBy: null, scars: 0, reforgeT: 0, flash: 0, cracks: { dark: [], gold: [] } };
    this.buildHand(handGltf);
    this.buildJar(jarGltf);
    this.buildCursor();
    this.buildHud();
    this.arts = new GodArts(this);
    this.raids = new Raids(game, this); // (raids happen in the Siege room only: raids.js)
    this.veil = new ZoiVeil(game, game.cartography);
    this.veil.visible = false;
  }

  get controlling() { return this.state === 'in' || this.state === 'on'; }

  // ------------------------------------------------------------------ building
  buildHand(gltf) {
    const root = new THREE.Group();
    root.name = 'GodHand';
    const model = gltf.scene;
    root.add(model);
    this.handScale = 0.8;
    model.scale.setScalar(this.handScale);
    const mat = new THREE.MeshStandardMaterial({ color: PALETTE.cream, emissive: PALETTE.glow, emissiveIntensity: 0.25, roughness: 0.6, flatShading: true });
    const meshes = [];
    model.traverse((o) => { if (o.isMesh) meshes.push(o); });
    for (const o of meshes) { o.material = mat; o.frustumCulled = false; o.castShadow = false; addOutline(o); }
    const bones = {};
    model.traverse((o) => { if (o.isBone) bones[o.name] = o; });
    this.hand = { root, model, bones, mat, grab: 0, point: 0, spread: 0, tip: new THREE.Vector3(0, 1.05, 0.02).multiplyScalar(this.handScale) };
    // (the finger chains, and where each joint rests)
    const chain = (n) => ['01', '02', '03'].map((k) => bones[`${n}${k}R`]).filter(Boolean);
    this.chains = { index: chain('f_index'), middle: chain('f_middle'), ring: chain('f_ring'), pinky: chain('f_pinky'), thumb: chain('thumb') };
    this.handRest = new Map();
    for (const b of Object.values(bones)) this.handRest.set(b, b.quaternion.clone());
    // fingers only ever bend the way fingers do (rom.js)
    // (this model's finger bones share no local hinge axis, so each chain's own is read off its rest
    // pose: the axis that curls the finger toward the palm, which faces the model's -Z. Fixed in the
    // bone's frame, so a finger curled past 90 degrees still curls the same way. A live "finger x palm"
    // axis flips there, and that is what bent them backwards.)
    this.handLimits = new JointLimits();
    this.hinge = new Map();
    model.updateMatrixWorld(true);
    const palmW = new THREE.Vector3(0, 0, -1).transformDirection(root.matrixWorld);
    for (const [name, joints] of Object.entries(this.chains)) {
      if (joints.length < 2) continue;
      const dir = joints[1].getWorldPosition(new THREE.Vector3()).sub(joints[0].getWorldPosition(new THREE.Vector3())).normalize();
      const hingeW = new THREE.Vector3().crossVectors(dir, palmW).normalize();
      joints.forEach((bone, j) => {
        const hingeL = hingeW.clone().applyQuaternion(bone.getWorldQuaternion(new THREE.Quaternion()).invert());
        this.hinge.set(bone, hingeL);
        const spec = RIGIFY[name === 'thumb' ? `thumb0${j + 1}*` : `f_${name}0${j + 1}*`];
        this.handLimits.add(bone, this.handRest.get(bone), { ...spec, hinge: hingeL.toArray() });
      });
    }
    root.visible = false;
    this.game.scene.add(root);
  }

  buildJar(gltf) {
    const V = this.jar;
    const group = new THREE.Group();
    group.name = 'PneukaJar';
    const model = gltf.scene;
    group.add(model);
    this.jarMat = new THREE.MeshStandardMaterial({ color: 0x9a4f36, roughness: 0.6, flatShading: true });
    this.coreMat = new THREE.MeshStandardMaterial({ color: PALETTE.cream, roughness: 0.4, emissive: PALETTE.glow, emissiveIntensity: 0.6 });
    const meshes = [];
    model.traverse((o) => { if (o.isMesh) meshes.push(o); });
    for (const o of meshes) {
      const core = o.material.name === 'CourierEnergy';
      o.material = core ? this.coreMat : this.jarMat;
      o.castShadow = true; o.receiveShadow = true;
      if (!core) { addOutline(o); this.jarBody = o; }
    }
    group.visible = false;
    this.game.scene.add(group);
    V.group = group;
    // a halo that shows how whole it is
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.game.fx.haloTexture, color: PALETTE.glow, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.4 }));
    halo.scale.setScalar(2.4);
    halo.position.y = 0.7;
    group.add(halo);
    this.halo = halo;
    this.raycaster = new THREE.Raycaster();
  }

  buildCursor() {
    const scene = this.game.scene;
    // the reticle on the ground under the cursor
    const ringGeo = new THREE.RingGeometry(0.92, 1, 56);
    this.ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: PALETTE.glow, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    this.ring.renderOrder = 8;
    this.disc = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ color: PALETTE.glow, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    this.disc.renderOrder = 7;
    this.ring.visible = this.disc.visible = false;
    scene.add(this.ring, this.disc);
    // the tether from the jar to the hand: a string of glowing beads
    this.beads = [];
    for (let i = 0; i < 22; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.game.fx.haloTexture, color: PALETTE.glow, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.7 }));
      s.scale.setScalar(0.16);
      s.visible = false;
      scene.add(s);
      this.beads.push(s);
    }
  }

  buildHud() {
    const st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
    const el = document.createElement('div');
    el.id = 'god';
    el.innerHTML = `<div class="jar"><div class="name">PNEUKA JAR <b class="hp">100</b></div><div class="bar"><div class="fill"></div></div><div class="sub"></div></div>
      <div class="hint" style="display:none"></div>`; // (the keys are said once by the log on taking the hand: room.help 'hand' -> tracking.js)
    document.body.appendChild(el);
    this.el = { root: el, fill: el.querySelector('.fill'), hp: el.querySelector('.hp'), sub: el.querySelector('.sub') };
  }

  // ------------------------------------------------------------------ entering / leaving
  canEnter() {
    const P = this.game.player;
    return this.state === 'off' && P.grounded && !P.mantle && !P.sliding && !P.freeze && !this.game.techs.active && !this.game.trial?.active;
  }

  toggle() {
    if (this.state === 'off') {
      if (!this.canEnter()) { this.game.log.say('warn', this.game.techs.active?.id === 'skiff' ? 'You cannot take the hand while riding the board.' : 'You need solid ground to take the hand.', { key: 'nogod', throttle: 3 }); return; }
      this.enter();
    } else if (this.state === 'on') {
      if (!this.jar.alive) { this.game.log.say('warn', 'Your Pneuka Jar is not reforged yet.', { key: 'nogod', throttle: 3 }); return; }
      this.exit();
    }
  }

  enter() {
    const g = this.game, P = g.player, V = this.jar;
    this.state = 'in'; this.active = true; this.t = 0;
    V.pos.copy(P.pos);
    V.group.position.copy(P.pos);
    V.group.rotation.y = P.bodyYaw;
    V.group.visible = true;
    V.group.scale.setScalar(0.001);
    if (V.hp <= 0 || !V.alive) { V.hp = V.max * 0.6; V.alive = true; }
    P.vel.set(0, 0, 0);
    g.techs.get('carry')?.drop?.(); // (a pot in your hands is put down)
    g.weapon.charge = 0; g.weapon.holding = false; g.weapon.cancelCharge?.();
    // the view: from wherever the camera is now, up to the isometric one
    this.cam.from = { pos: this.camera.position.clone(), quat: this.camera.quaternion.clone(), fov: this.camera.fov };
    this.cam.focus.copy(P.pos);
    this.cam.groundY = P.pos.y;
    this.cam.yawT = this.cam.yaw = Math.round((P.yaw + Math.PI) / (Math.PI / 2)) * (Math.PI / 2) + Math.PI * 0.25;
    this.cam.dist = this.cam.distT = T.god.dist;
    this.handPos.copy(P.pos);
    this.raids.reset();
    document.exitPointerLock?.();
    g.hud.el.cross && (g.hud.el.cross.style.display = 'none');
    g.hud.el.shells.style.display = 'none'; // (the psygun's shells give way to the hand's arts)
    this.arts.showBar(true);
    this.veil.visible = true; this.veil.refresh();
    g.lachryma.addModifier('god', { regenMult: 1.6, regenDelayMult: 0.5 });
    this.el.root.style.display = 'block';
    this.hand.root.visible = true;
    sfx.godIn();
    g.fx.explosion?.(P.pos.clone().setY(P.pos.y + 0.9), 0.7);
    g.events?.emit('god.enter', {});
    g.events?.emit('room.help', { room: 'hand' });
  }

  exit() {
    const g = this.game, P = g.player;
    this.releaseGrab(true);
    this.arts.cancel(); this.arts.closeWheel(false);
    this.state = 'out'; this.active = false; this.t = 0;
    this.cam.exitFrom = null;
    g.character.setHidden(false);
    P.prevPos.copy(P.pos); P.renderPos.copy(P.pos);
    // no more raiders
    for (const c of g.clappers.list) if (c.alive && c.raider) g.clappers.dismiss(c);
    this.hand.root.visible = false;
    this.ring.visible = this.disc.visible = false;
    for (const b of this.beads) b.visible = false;
    g.hud.el.cross && (g.hud.el.cross.style.display = '');
    this.restoreUi();
    this.el.root.style.display = 'none';
    this.clipPlane.constant = CLIP_OFF;
    if (g.input.enabled) g.input.requestLock();
    sfx.godOut();
    g.events?.emit('god.exit', {});
  }

  /** Straight back to the Courier, no blends (tests, teleports). */
  forceOff() {
    if (this.state === 'off') return;
    const g = this.game;
    this.releaseGrab(true);
    for (const c of g.clappers.list) if (c.alive && c.raider) g.clappers.dismiss(c);
    this.state = 'off'; this.active = false;
    g.character.setHidden(false);
    this.jar.group.visible = false;
    this.hand.root.visible = false;
    this.ring.visible = this.disc.visible = false;
    for (const b of this.beads) b.visible = false;
    g.hud.el.cross && (g.hud.el.cross.style.display = '');
    this.arts.cancel(); this.arts.closeWheel(false);
    this.restoreUi();
    this.el.root.style.display = 'none';
    this.clipPlane.constant = CLIP_OFF;
  }

  /** Back to the psygun's HUD. */
  restoreUi() {
    const g = this.game;
    g.hud.el.shells.style.display = '';
    this.arts.showBar(false);
    this.arts.tip.style.display = 'none';
    this.veil.visible = false;
    g.lachryma.removeModifier('god');
  }

  /** The room was reset: nothing held, no raiders. */
  onReset() {
    this.releaseGrab(true);
    this.arts.clear();
    this.thrown.length = 0;
    this.raids.reset();
  }

  // ------------------------------------------------------------------ per frame
  update(dt) {
    const g = this.game, input = g.input, V = this.jar;
    this.t += dt;
    if (this.state === 'in') {
      const k = Math.min(1, this.t / 1.2);
      // the courier steps out of the world; the jar stands up in their place
      if (this.t > 0.3 && !g.character.hidden) { g.character.setHidden(true); g.belt?.hideWorn(); } // (their tools go with them: their ticks do not run now)
      const jk = Math.max(0, (this.t - 0.25) / 0.6);
      V.group.scale.setScalar(Math.max(0.001, easeOutBack(Math.min(1, jk))));
      if (k >= 1) this.state = 'on';
    }
    this.handleKeys(dt);
    this.updateView(dt);
    this.updateCursor();
    if (this.t > 0.6) this.updateHand(dt);
    this.updateJar(dt);
    this.raids.update(dt);
    this.updateHud(dt);
  }

  handleKeys(dt) {
    const g = this.game, input = g.input, C = this.cam;
    if (input.wasPressed('KeyQ')) C.yawT += Math.PI / 4;
    if (input.wasPressed('KeyE')) C.yawT -= Math.PI / 4;
    if (input.wheel) C.distT = THREE.MathUtils.clamp(C.distT * Math.exp(input.wheel * 0.0012), T.god.minDist, T.god.maxDist);
    ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].forEach((k, i) => { if (input.wasPressed(k)) this.arts.select(i); });
  }

  /** The turnable isometric camera: pans, turns in eighths, zooms; ceilings cut away. */
  updateView(dt) {
    const g = this.game, input = g.input, C = this.cam;
    // turning the view turns it about the Pneuka jar, not about wherever the view happens to be looking: the focus swings round the
    // jar by the same angle, so the jar keeps its place on the screen and the room wheels round it
    const dyaw = wrapPi(C.yawT - C.yaw) * (1 - Math.exp(-9 * dt));
    C.yaw += dyaw;
    if (dyaw && this.jar) {
      const V = this.jar.pos, ox = C.focus.x - V.x, oz = C.focus.z - V.z, c = Math.cos(dyaw), s = Math.sin(dyaw);
      C.focus.x = V.x + ox * c + oz * s; C.focus.z = V.z - ox * s + oz * c;
    }
    C.dist = THREE.MathUtils.damp(C.dist, C.distT, 8, dt);
    // pan: keys and the screen edges, in the view's own directions
    let px = 0, pz = 0;
    if (input.isDown('KeyW')) pz += 1;
    if (input.isDown('KeyS')) pz -= 1;
    if (input.isDown('KeyD')) px += 1;
    if (input.isDown('KeyA')) px -= 1;
    const E = T.god.edgeScroll, W = innerWidth, H = innerHeight;
    if (this.t > 1 && input.mx >= 0 && input.my >= 0) {
      if (input.mx < E) px -= 1; else if (input.mx > W - E) px += 1;
      if (input.my < E) pz += 1; else if (input.my > H - E) pz -= 1;
    }
    if (px || pz) {
      const fwd = _v.set(-Math.sin(C.yaw), 0, -Math.cos(C.yaw));
      const right = _v2.set(Math.cos(C.yaw), 0, -Math.sin(C.yaw));
      const sp = C.dist * 0.75 * T.god.panSpeed * dt;
      C.focus.addScaledVector(fwd, pz * sp).addScaledVector(right, px * sp);
    }
    // (on the tether)
    const V = this.jar;
    const dx = C.focus.x - V.pos.x, dz = C.focus.z - V.pos.z, d = Math.hypot(dx, dz);
    if (d > T.god.range) { C.focus.x = V.pos.x + dx / d * T.god.range; C.focus.z = V.pos.z + dz / d * T.god.range; }
    // the floor under the focus: the view rides up and down stairs and between floors
    const hit = g.physics.raycast({ x: C.focus.x, y: C.groundY + 1.8, z: C.focus.z }, DOWN, 6, g.player.collider, undefined, (c) => !c.isSensor() && !c.parent()?.isDynamic());
    if (hit) C.groundY = THREE.MathUtils.damp(C.groundY, hit.point.y, 6, dt);
    C.focus.y = C.groundY;
    this.clipPlane.constant = C.groundY + (g.dunes?.active ? 400 : T.god.clipAbove); // (no ceilings on the open layer)
  }

  /** Called every frame after the normal camera has been placed: the iso camera, and the blends into and out of it. */
  applyCamera(dt) {
    if (this.state === 'off') return;
    if (this.state === 'out') this.t += dt; // (update() isn't running now)
    const C = this.cam, cam = this.camera;
    const p = T.god.pitchDeg * DEG, cp = Math.cos(p), sp = Math.sin(p);
    const pos = _v.set(Math.sin(C.yaw) * cp, sp, Math.cos(C.yaw) * cp).multiplyScalar(C.dist).add(C.focus);
    C.shake = Math.max(0, C.shake - dt * 3);
    if (C.shake > 0) pos.add(new THREE.Vector3((simRand() - 0.5), (simRand() - 0.5), (simRand() - 0.5)).multiplyScalar(C.shake * C.shake * 0.35));
    _m.lookAt(pos, C.focus, UP);
    const quat = _q.setFromRotationMatrix(_m);
    const fov = T.god.fov;
    if (this.state === 'in') {
      const e = ease(Math.min(1, this.t / 1.2));
      cam.position.copy(C.from.pos).lerp(pos, e);
      cam.quaternion.copy(C.from.quat).slerp(quat, e);
      cam.fov = THREE.MathUtils.lerp(C.from.fov, fov, e);
    } else if (this.state === 'out') {
      // (the player's camera has just been placed by the normal update: blend from the iso one to it)
      const e = ease(Math.min(1, this.t / 0.9));
      const pp = cam.position.clone(), pq = cam.quaternion.clone(), pf = cam.fov;
      cam.position.copy(pos).lerp(pp, e);
      cam.quaternion.copy(quat).slerp(pq, e);
      cam.fov = THREE.MathUtils.lerp(fov, pf, e);
      const V = this.jar;
      V.group.scale.setScalar(V.alive ? Math.max(0.001, 1 - ease(Math.min(1, this.t / 0.4))) : 0.001);
      if (this.t > 0.4) V.group.visible = false;
      if (e >= 1) { this.state = 'off'; this.clipPlane.constant = CLIP_OFF; V.group.visible = false; }
    } else {
      cam.position.copy(pos);
      cam.quaternion.copy(quat);
      cam.fov = fov;
    }
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld(true);
  }

  // ------------------------------------------------------------------ the cursor
  updateCursor() {
    const g = this.game, input = g.input, cam = this.camera, K = this.cursor;
    cam.updateMatrixWorld(true);
    if (input.mx < 0) return; // (the cursor is out of the window: keep the last place)
    const ndc = _v.set((input.mx / innerWidth) * 2 - 1, -(input.my / innerHeight) * 2 + 1, 0.5);
    ndc.unproject(cam);
    const o = cam.position, d = ndc.sub(o).normalize();
    K.ray.origin.copy(o); K.ray.dir.copy(d);
    K.start = null;
    // start the ray where it goes under the cut: nothing above that is there
    const clipY = this.clipPlane.constant - 0.02;
    const s = d.y < -1e-4 ? Math.max(0, (clipY - o.y) / d.y) : 0;
    const start = K.start = o.clone().addScaledVector(d, s);
    const hit = g.physics.raycast(start, d, 250, null, undefined, (c) => !c.isSensor());
    K.hit = hit;
    K.over = hit?.entity?.type === 'player' ? 'jar' : null;
    if (hit) { K.point.copy(hit.point); K.normal.copy(hit.normal); }
    else {
      const t = (this.cam.focus.y - o.y) / (d.y || -1e-4);
      K.point.copy(o).addScaledVector(d, Math.max(1, t)); K.normal.copy(UP);
    }
    const V = this.jar;
    K.far = Math.hypot(K.point.x - V.pos.x, K.point.z - V.pos.z) > T.god.range;
    K.ok = !K.far;
    K.tier = this.game.cartography.tierAt(K.point.x, K.point.y, K.point.z).tier; // (the Zone of Influence under the hand)
  }

  updateHand(dt) {
    const g = this.game, input = g.input, K = this.cursor, H = this.hand, V = this.jar;
    // ---- what's under the cursor
    const filter = (r) => !r.ent?.carried && !r.clapper?.job;
    this.hover = K.ok && !this.grab && K.start ? g.shells.casters.pick(K.start, K.ray.dir, 250, 0.55, filter) : null;
    // ---- the art wheel (hold the right button), and the art in hand
    const A = this.arts;
    if (input.wasPressed('Mouse2') && !this.grab && !A.live) A.openWheel(input.mx, input.my);
    if (A.wheelOpen) { A.updateWheel(input.mx, input.my); if (!input.isDown('Mouse2')) A.closeWheel(true); }
    else if (A.art.id === 'telekinesis') {
      // ---- grab / release
      if (input.wasPressed('Mouse0') && !this.grab && K.ok && this.hover) {
        const hp = this.hoverPoint();
        if (A.gate(ART_BY_ID.telekinesis, hp)) this.beginGrab(this.hover);
      } else if (input.wasPressed('Mouse0') && !this.grab && K.far) g.log.say('warn', 'That is out of reach.', { key: 'reach', throttle: 2 });
      if (this.grab && !input.isDown('Mouse0')) this.releaseGrab(false);
    } else {
      if (this.grab) this.releaseGrab(false);
      A.update(dt);
    }
    // ---- the hand follows the cursor (the held thing's height is the plane the cursor slides on)
    let target = K.point;
    if (this.grab) {
      const y = this.grab.y + (input.isDown('ShiftLeft') || input.isDown('ShiftRight') ? 1.5 : 0);
      const o = K.ray.origin, d = K.ray.dir;
      const t = d.y < -1e-4 ? (y - o.y) / d.y : 30;
      const p = o.clone().addScaledVector(d, Math.max(1, t));
      // (on the tether)
      const dx = p.x - V.pos.x, dz = p.z - V.pos.z, dd = Math.hypot(dx, dz);
      if (dd > T.god.range) { p.x = V.pos.x + dx / dd * T.god.range; p.z = V.pos.z + dz / dd * T.god.range; }
      this.grab.target = p;
      target = p;
    }
    this.handPos.x = THREE.MathUtils.damp(this.handPos.x, target.x, 28, dt);
    this.handPos.y = THREE.MathUtils.damp(this.handPos.y, target.y, 28, dt);
    this.handPos.z = THREE.MathUtils.damp(this.handPos.z, target.z, 28, dt);
    this.samples.push({ t: this.t, p: target.clone() });
    while (this.samples.length && this.t - this.samples[0].t > 0.2) this.samples.shift();
    // ---- pose the hand and draw it
    const live = A.live, aid = A.art.id;
    const gr = aid === 'telekinesis' ? (this.grab ? 1 : this.hover ? 0.18 : 0) : live ? (aid === 'sunder' ? 0 : aid === 'manifest' ? -0.15 : 0.7) : 0.12;
    H.grab = THREE.MathUtils.damp(H.grab, gr, 16, dt);
    H.point = (aid === 'sunder' && live) ? 1 : Math.max(0, H.point - dt * 3.5);
    A.updateUi(dt);
    this.veil.update(this.cam.focus, dt);
    this.poseHand(dt);
    this.placeHand(dt);
    this.placeReticle(dt);
    this.placeTether(dt);
  }

  /** Where the hovered thing is (for the Zone of Influence check). */
  hoverPoint() {
    const h = this.hover;
    if (h?.clapper) return h.clapper.pos.clone();
    if (h?.body?.isValid()) { const q = h.body.translation(); return new THREE.Vector3(q.x, q.y, q.z); }
    return this.cursor.point.clone();
  }

  // ------------------------------------------------------------------ grabbing
  beginGrab(t) {
    const g = this.game;
    const grab = { t, y: 0, target: null, held: t.clapper || t.body };
    if (t.clapper) {
      const c = t.clapper;
      if (c.pinned) g.shells.casters.anchors.filter((a) => a.target.clapper === c).forEach((a) => g.shells.casters.releasePin(a));
      c.held = true; c.holdPos = c.pos.clone();
      grab.y = c.pos.y + 1.1;
      grab.pos = () => c.pos;
      g.clappers.dropJob?.(c);
      sfx.squeak(g.listenerDistance(c.pos));
    } else {
      const b = t.body;
      if (!b?.isValid()) return;
      if (b.bodyType() !== RAPIER.RigidBodyType.Dynamic) {
        // an anchored thing: let it go first
        g.shells.casters.anchors.filter((a) => a.body === b).forEach((a) => g.shells.casters.releasePin(a));
      }
      b.setGravityScale(0, true);
      b.wakeUp();
      const p = b.translation();
      const ground = g.physics.raycast({ x: p.x, y: p.y + 0.2, z: p.z }, DOWN, 8, g.player.collider, undefined, (c) => !c.isSensor() && !c.parent()?.isDynamic());
      grab.y = Math.max(p.y + 0.15, (ground ? ground.point.y : p.y) + 1.1);
      grab.pos = () => { const q = b.translation(); return _v.set(q.x, q.y, q.z); };
      if (t.ent) t.ent.grabbed = true;
      if (t.ball) { t.ball.pinned = false; t.ball.grabbed = true; }
      sfx.grab();
    }
    this.grab = grab;
    this.samples.length = 0;
    g.events?.emit('god.grab', { clapper: !!t.clapper });
  }

  releaseGrab(silent) {
    const g = this.game, gr = this.grab;
    if (!gr) return;
    this.grab = null;
    // the throw: how fast the hand was moving
    let v = new THREE.Vector3();
    if (!silent && this.samples.length > 2) {
      const a = this.samples[0], b = this.samples[this.samples.length - 1];
      const dt = Math.max(0.05, b.t - a.t);
      v.copy(b.p).sub(a.p).multiplyScalar(T.god.throwBoost / dt);
      if (v.length() > T.god.throwMax) v.setLength(T.god.throwMax);
    }
    const t = gr.t;
    if (t.clapper) {
      const c = t.clapper;
      c.held = false;
      if (c.alive) { g.clappers.knock(c, v); c.peakY = c.pos.y; }
    } else if (t.body?.isValid()) {
      const b = t.body;
      b.setGravityScale(1, true);
      b.setLinvel({ x: v.x, y: v.y, z: v.z }, true);
      b.setAngvel({ x: (simRand() - 0.5) * 4, y: (simRand() - 0.5) * 4, z: (simRand() - 0.5) * 4 }, true);
      b.wakeUp();
      if (t.ent) t.ent.grabbed = false;
      if (t.ball) { t.ball.grabbed = false; t.ball.parried = true; t.ball.reflected = true; } // (a ball you throw back rings the targets it hits)
      if (v.length() > 4) this.thrown.push({ body: b, t: 0, ball: t.ball, ent: t.ent });
    }
    if (!silent) { if (v.length() > 3) sfx.toss(Math.min(1, v.length() / 20)); g.events?.emit('god.throw', { speed: v.length() }); }
  }

  /** Physics-step work: drag the held thing to the hand; chip the jar with what's thrown at it. */
  fixed(dt) {
    const g = this.game, V = this.jar, gr = this.grab;
    if (gr && gr.target) {
      const t = gr.t;
      // holding costs Lachryma, by weight; empty, the hand lets go
      const mass = t.clapper ? 0.6 : t.body?.isValid() ? t.body.mass() : 0;
      const C = this.arts.cfg('telekinesis');
      if (!this.arts.drainOk(C.drain + Math.min(60, mass) * C.massDrain, dt)) { this.releaseGrab(false); return; }
      if (t.clapper) {
        const c = t.clapper;
        if (!c.alive) this.grab = null;
        else c.holdPos.lerp(gr.target, 1 - Math.exp(-18 * dt));
      } else if (t.body?.isValid()) {
        const b = t.body, p = b.translation();
        const v = _v.set(gr.target.x - p.x, gr.target.y - p.y, gr.target.z - p.z).multiplyScalar(T.god.grabSpeed);
        if (v.length() > 34) v.setLength(34);
        b.setLinvel({ x: v.x, y: v.y, z: v.z }, true);
        const w = b.angvel();
        b.setAngvel({ x: w.x * 0.85, y: w.y * 0.85, z: w.z * 0.85 }, true);
        b.wakeUp();
      } else this.grab = null;
    }
    // what's been thrown at the jar
    for (let i = this.thrown.length - 1; i >= 0; i--) {
      const th = this.thrown[i];
      th.t += dt;
      if (th.t > 2.5 || !th.body.isValid()) { this.thrown.splice(i, 1); continue; }
      if (!V.alive) continue;
      const p = th.body.translation(), v = th.body.linvel();
      const sp = Math.hypot(v.x, v.y, v.z);
      if (sp > 5 && Math.hypot(p.x - V.pos.x, p.z - V.pos.z) < 0.7 && p.y > V.pos.y - 0.1 && p.y < V.pos.y + 1.4) {
        this.hitJar(T.god.thrownDamage * Math.min(2, sp / 9), _v.set(-v.x, 0, -v.z).normalize().clone(), 'thrown');
        th.body.setLinvel({ x: -v.x * 0.4, y: Math.abs(v.y) * 0.3 + 1.5, z: -v.z * 0.4 }, true);
        this.thrown.splice(i, 1);
      }
    }
  }

  // ------------------------------------------------------------------ the hand itself
  /** Curl the fingers about the palm: finger-by-finger amounts 0..1. */
  poseHand(dt) {
    const H = this.hand, t = this.t;
    for (const [b, q] of this.handRest) b.quaternion.copy(q);
    H.root.updateMatrixWorld(true);
    const wob = (i) => Math.sin(t * 2.2 + i * 0.9) * 0.05;
    const curl = { index: H.grab * 1 + wob(0) - H.point * 0.9, middle: H.grab + wob(1), ring: H.grab + wob(2), pinky: H.grab * 0.95 + wob(3), thumb: H.grab * 0.8 + wob(4) };
    curl.index = Math.max(-0.1, H.grab * 1.0 + wob(0)) * (1 - H.point * 0.95);
    const amt = { index: [1.0, 1.15, 0.9], middle: [1.05, 1.2, 0.9], ring: [1.05, 1.2, 0.9], pinky: [1.0, 1.15, 0.9], thumb: [0.7, 0.9, 0.7] };
    for (const [name, joints] of Object.entries(this.chains)) {
      const c = Math.max(-0.15, curl[name]);
      joints.forEach((bone, j) => {
        const hinge = this.hinge.get(bone);
        if (!hinge) return;
        bone.quaternion.copy(this.handRest.get(bone)).multiply(_q.setFromAxisAngle(hinge, c * amt[name][j] * 1.25 * (name === 'thumb' ? 0.9 : 1)));
      });
    }
    this.handLimits.apply();
    H.root.updateMatrixWorld(true);
  }

  rotW(bone, axis, angle) {
    bone.updateMatrixWorld(true);
    const wq = bone.getWorldQuaternion(new THREE.Quaternion());
    const pq = bone.parent.getWorldQuaternion(new THREE.Quaternion());
    const r = new THREE.Quaternion().setFromAxisAngle(axis, angle);
    bone.quaternion.copy(pq.invert().multiply(r.multiply(wq)));
    bone.updateMatrixWorld(true);
  }

  placeHand(dt) {
    const H = this.hand, C = this.cam;
    // the fingers point out along the line from the Pneuka Jar, the wrist back toward it (the owner's note: the hand reaches out of the
    // jar), tipped down, the palm to the ground. Over the jar itself, where that line has no direction, it faces away from the camera.
    const V = this.jar?.pos, rx = V ? this.handPos.x - V.x : 0, rz = V ? this.handPos.z - V.z : 0, rd = Math.hypot(rx, rz);
    const camYaw = Math.atan2(-Math.sin(C.yaw), -Math.cos(C.yaw)) - 0.85;
    const radial = Math.atan2(rx, rz), w = THREE.MathUtils.smoothstep(rd, 0.4, 1.6);
    const want = camYaw + wrapPi(radial - camYaw) * w;
    this.handYaw = this.handYaw == null ? want : this.handYaw + wrapPi(want - this.handYaw) * (1 - Math.exp(-10 * dt));
    const f = _v.set(Math.sin(this.handYaw), 0, Math.cos(this.handYaw));
    const fingers = f.clone().multiplyScalar(Math.cos(0.4)).addScaledVector(DOWN, Math.sin(0.4)).normalize();
    const palm = UP.clone().addScaledVector(fingers, -UP.dot(fingers)).negate().normalize(); // (down and toward the camera)
    const z = palm.clone().negate(); // the model's +Z (its back)
    const x = new THREE.Vector3().crossVectors(fingers, z).normalize();
    _m.makeBasis(x, fingers, z);
    H.root.quaternion.setFromRotationMatrix(_m);
    const bob = Math.sin(this.t * 2.4) * 0.05;
    const tip = this.handPos.clone().addScaledVector(UP, T.god.hoverH * (this.grab ? 0.55 : 1) - 0.5 + bob);
    // reaching down when it points (a cast)
    tip.y -= H.point * 0.4;
    H.root.position.copy(tip).addScaledVector(fingers, -H.tip.length());
    // the hand rises out of the jar as it enters
    const k = Math.min(1, Math.max(0, (this.t - 0.6) / 0.5));
    H.root.scale.setScalar(Math.max(0.001, easeOutBack(k)));
    H.root.updateMatrixWorld(true);
    H.mat.emissiveIntensity = 0.22 + 0.1 * Math.sin(this.t * 3) + H.point * 0.45;
  }

  placeReticle() {
    const K = this.cursor, V = this.jar, A = this.arts;
    let r = this.grab ? 0.5 : A.art.id === 'manifest' ? 0.9 : 0.6;
    let p = this.grab ? this.grab.target || K.point : K.point;
    let n = this.grab ? UP : K.normal;
    // over something that can be picked up: the ring closes around it
    if (this.hover && !this.grab) {
      const h = this.hover;
      if (h.clapper) p = _v2.set(h.clapper.pos.x, h.clapper.pos.y, h.clapper.pos.z).clone();
      else if (h.body?.isValid()) { const q = h.body.translation(); p = new THREE.Vector3(q.x, q.y - (h.ent?.size ?? 0.4) * 0.4, q.z); }
      r = Math.max(0.4, (h.ent?.size ?? 0.5) * 0.75);
      n = UP;
    }
    for (const m of [this.ring, this.disc]) {
      m.visible = true;
      m.position.copy(p).addScaledVector(n, 0.04);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
      m.scale.setScalar(Math.max(0.35, r));
    }
    const need = ART_BY_ID[A.art.id].needs, short = (K.tier ?? 0) < need || !A.owns(A.art.id);
    const far = K.far || (short && !this.grab);
    this.ring.material.color.setHex(far ? 0xff4a3a : this.grab ? 0xffe0c0 : this.hover ? 0xffffff : PALETTE.glow);
    this.disc.material.color.copy(this.ring.material.color);
    this.ring.material.opacity = 0.55 + 0.25 * Math.sin(this.t * 6);
    this.disc.visible = !this.grab;
  }

  placeTether(dt) {
    const V = this.jar, H = this.hand;
    const a = V.pos.clone().addScaledVector(UP, 1.3);
    const b = H.root.position.clone();
    const n = this.beads.length;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const s = this.beads[i];
      s.visible = this.t > 0.7;
      s.position.lerpVectors(a, b, u);
      s.position.y -= Math.sin(Math.PI * u) * Math.min(1.4, a.distanceTo(b) * 0.06 + 0.3);
      const flow = (Math.sin(u * 20 - this.t * 6) * 0.5 + 0.5);
      s.material.opacity = 0.25 + 0.5 * flow;
      s.scale.setScalar(0.12 + 0.1 * flow);
    }
  }

  // ------------------------------------------------------------------ the jar
  hitJar(amount, from, kind = 'raid') {
    const V = this.jar;
    if (!V.alive || this.state !== 'on') return;
    V.hp = Math.max(0, V.hp - amount);
    V.flash = 1;
    this.cam.shake = Math.max(this.cam.shake, 0.5);
    this.addCrack(from, amount);
    sfx.jarHit(Math.min(1.5, amount / 10));
    this.game.fx.impact?.(V.pos.clone().setY(V.pos.y + 0.7), UP, { sparks: 10, dust: 8 });
    this.game.events?.emit('jar.hit', { kind, amount });
    if (V.hp <= 0) this.shatter();
  }

  raidStrike(c) {
    const V = this.jar, g = this.game;
    const dir = _v.set(c.pos.x - V.pos.x, 0, c.pos.z - V.pos.z).normalize().clone();
    sfx.clap(g.listenerDistance(c.pos));
    g.clappers.hit(c, c.pos.clone().setY(c.pos.y + 0.4), dir.clone().negate(), 1.2, 'shot');
    c.raider = false;
    this.hitJar(T.god.raidDamage, dir, 'raid');
  }

  explosion(center, R) {
    const V = this.jar;
    if (this.state !== 'on' || !V.alive) return;
    const d = V.pos.distanceTo(center);
    if (d > R * 1.1) return;
    this.hitJar(T.god.blastDamage * (1 - d / (R * 1.1)), _v.set(center.x - V.pos.x, 0, center.z - V.pos.z).normalize().clone(), 'blast');
  }

  mendJar(amount) {
    const V = this.jar;
    if (!V.alive) return;
    V.hp = Math.min(V.max, V.hp + amount);
    V.mendBy = null;
    // the cracks it no longer needs turn to gold
    const need = Math.ceil((1 - V.hp / V.max) * 8);
    while (V.cracks.dark.length > need) {
      const p = V.cracks.dark.shift();
      if (V.cracks.gold.length < 22) V.cracks.gold.push(p);
    }
    this.rebuildCracks();
    sfx.mended(this.game.listenerDistance(V.pos));
    const top = V.pos.clone().setY(V.pos.y + 0.8);
    this.game.fx.glitter?.([top], top, UP, new THREE.Color(0xffc65c));
    V.flash = -1;
  }

  shatter() {
    const g = this.game, V = this.jar;
    V.alive = false; V.reforgeT = T.god.reforge; V.mendBy = null;
    V.group.visible = false;
    const at = V.pos.clone().setY(V.pos.y + 0.6);
    g.fx.explosion?.(at, 1.6);
    sfx.shatter?.(1.4, 3);
    g.fx.impact?.(at, UP, { sparks: 24, dust: 20 });
    this.cam.shake = 1;
    for (const c of g.clappers.list) if (c.alive && c.raider) { c.raider = false; g.clappers.hit(c, c.pos.clone().setY(c.pos.y + 0.4), UP, 1, 'shot'); }
    g.events?.emit('jar.shatter', {});
  }

  updateJar(dt) {
    const g = this.game, V = this.jar;
    if (!V.alive) {
      V.reforgeT -= dt;
      if (V.reforgeT <= 0) {
        V.alive = true; V.hp = V.max * 0.6; V.scars++;
        // what cracked before becomes gold seams
        V.cracks.gold.push(...V.cracks.dark.splice(0)); V.cracks.gold.length = Math.min(V.cracks.gold.length, 22);
        this.rebuildCracks();
        V.group.visible = true;
        V.group.scale.setScalar(0.001);
        V.regrow = 0;
        sfx.reforge();
        g.events?.emit('jar.reforge', {});
      }
    } else if (V.regrow !== undefined) {
      V.regrow += dt;
      V.group.scale.setScalar(Math.max(0.001, easeOutBack(Math.min(1, V.regrow / 0.7))));
      if (V.regrow >= 0.7) V.regrow = undefined;
    }
    // integrity shows in the core's glow
    const k = V.hp / V.max;
    V.flash = V.flash > 0 ? Math.max(0, V.flash - dt * 4) : Math.min(0, V.flash + dt * 3);
    this.coreMat.emissiveIntensity = 0.15 + 0.85 * k + Math.max(0, V.flash) * 1.5 + Math.max(0, -V.flash) * 0.8 + (k < 0.4 ? Math.sin(this.t * 14) * 0.15 : 0);
    this.coreMat.emissive.setHex(k > 0.4 ? PALETTE.glow : 0xff5a3a);
    this.jarMat.emissive.setHex(0xffffff).multiplyScalar(0);
    if (V.flash > 0) this.jarMat.emissive.setRGB(0.5 * V.flash, 0.3 * V.flash, 0.2 * V.flash);
    this.halo.material.opacity = 0.2 + 0.3 * k;
    this.halo.material.color.setHex(k > 0.4 ? PALETTE.glow : 0xff5a3a);
    V.group.position.copy(g.player.pos);
    V.pos.copy(g.player.pos);
  }

  /** New cracks from the side it was hit on. */
  addCrack(from, amount) {
    const V = this.jar, body = this.jarBody;
    if (!body) return;
    const paths = [];
    const n = amount > 12 ? 2 : 1;
    V.group.updateMatrixWorld(true);
    for (let k = 0; k < n; k++) {
      let ang = Math.atan2(from.x, from.z) + (simRand() - 0.5) * 1.6; // (in the world)
      let y = 0.25 + simRand() * 0.75, th = Math.PI * (0.35 + simRand() * 0.3) * (simRand() < 0.5 ? 1 : -1);
      const pts = [];
      for (let i = 0; i < 18; i++) {
        const dir = new THREE.Vector3(Math.sin(ang), 0, Math.cos(ang));
        const origin = V.pos.clone().addScaledVector(dir, 1.2).setY(V.pos.y + y);
        this.raycaster.set(origin, dir.clone().negate());
        const hit = this.raycaster.intersectObject(body, false)[0];
        if (!hit) break;
        const p = V.group.worldToLocal(hit.point.clone());
        const nrm = hit.face.normal.clone().transformDirection(body.matrixWorld);
        V.group.worldToLocal(nrm.add(V.group.position));
        nrm.normalize();
        pts.push({ p: p.addScaledVector(nrm, 0.003), n: nrm });
        th += (simRand() - 0.5) * 1.2;
        y += Math.cos(th) * 0.05;
        ang += Math.sin(th) * 0.05 / 0.25;
        if (y < 0.03 || y > 1.15) break;
      }
      if (pts.length > 2) paths.push(pts);
    }
    V.cracks.dark.push(...paths);
    if (V.cracks.dark.length > 14) V.cracks.dark.splice(0, V.cracks.dark.length - 14);
    this.rebuildCracks();
  }

  rebuildCracks() {
    const V = this.jar;
    for (const key of ['dark', 'gold']) {
      const mk = `${key}Mesh`;
      if (V[mk]) { V.group.remove(V[mk]); V[mk].geometry.dispose(); V[mk] = null; }
      if (!V.cracks[key].length) continue;
      const m = new THREE.Mesh(ribbonGeometry(V.cracks[key], key === 'dark' ? 0.012 : 0.02), key === 'dark' ? crackMat : goldMat);
      V.group.add(m);
      V[mk] = m;
    }
  }

  // ------------------------------------------------------------------ hud
  updateHud() {
    const V = this.jar;
    const pct = Math.round((V.hp / V.max) * 100);
    this.el.fill.style.width = `${pct}%`;
    this.el.fill.style.background = pct > 40 ? '' : 'linear-gradient(90deg, #ff5a3a, #ffb27a)';
    this.el.hp.textContent = V.alive ? `${pct}%` : 'REFORGING';
    const allies = this.game.clappers.list.filter((c) => c.alive && c.ally).length;
    this.el.sub.textContent = `${this.raids.status()}${allies} helpers${V.scars ? ` · ${V.scars} gold seams` : ''}`;
  }
}
