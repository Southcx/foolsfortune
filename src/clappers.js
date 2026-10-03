import * as THREE from 'three';
import { addRim } from './render/toon.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { RAPIER, G, groups } from './physics.js';
import { T, PALETTE, DEG } from './config.js';
import { addOutline } from './outline.js';
import { prepProfile } from './pottery.js';
import { sfx } from './audio.js';
import { JointLimits, CLAPPER_ROM } from './rom.js';

// ---------------------------------------------------------------------------------------
// THE IDLE ACTS: what a clapperjar does with itself when nothing is happening, so that it is not forever running somewhere. Each is a
// few seconds of one small, slow thing, laid over the idle clip on the same bones the other layers use, eased in and out: it breathes,
// looks about, yawns, scratches its side, hums and sways, sits down, gazes up at the sky, polishes its lid, shuffles round to face a
// new way. Each jar has a TEMPER (0 lively, 1 calm): how often it stays rather than runs, and how slowly it does what it does.
// Prior art: Animal Crossing's villagers (most of their day is small idle business: a stretch, a yawn, a look round, humming), the
// idle breaks of character animation (an idle loop broken now and then by a one-off: Overwatch's and Street Fighter's idle variants),
// and The Sims' fidgets (chosen at random, weighted by personality).
// ---------------------------------------------------------------------------------------
const ACTS = {
  breathe: { w: 3, dur: [4, 7] }, lookabout: { w: 3, dur: [4, 6] }, yawn: { w: 1.2, dur: [2.6, 3.4] }, scratch: { w: 1.5, dur: [2.5, 4] },
  hum: { w: 1.6, dur: [4, 7] }, sit: { w: 1.4, dur: [6, 11] }, gaze: { w: 1.2, dur: [3.5, 6] }, polish: { w: 1, dur: [2.5, 4] }, shuffle: { w: 1.2, dur: [2, 3] },
};
const ACT_W = Object.values(ACTS).reduce((a, x) => a + x.w, 0);
const ease = (x) => x * x * (3 - 2 * x);

// Clapperjars: little clay figments full of Lachryma.
//
// Behaviour (a small state machine, run in the fixed physics step):
//   idle -> wander | forage (eat dropped baubles) | taunt (clap at you)
//   spooked -> stumble -> flee | hide behind a big pot and cower
//   shells: stunned (mark), knocked (push/blasts), pulled (gravity well),
//           scalded (molten slip) ... and long falls shatter them.
// Animation: the authored idle/sprint/stumble clips from the .blend, with
// procedural layers on top: lid clapping, head look-at, blinking, squash,
// hops, cowering tremble, dizzy wobble.

const UP = new THREE.Vector3(0, 1, 0);
const X = new THREE.Vector3(1, 0, 0);
const RADIUS = 0.2, HALF = 0.12;
const _box = new THREE.Box3();
const CLAPPER_GROUPS = groups(G.CRITTER, 0xffff);
const QUERY = groups(0xffff, G.STATIC | G.PROP | G.PLAYER | G.CRITTER);
const STATIC_ONLY = groups(0xffff, G.STATIC);
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const _v = new THREE.Vector3(), _q = new THREE.Quaternion();

const GOLD = new THREE.Color(0xf2b24a);
// (how a clapperjar was undone, said to the ledger and the log as the cause itself: shot, sliced, cooked, bashed, brushed ...)

export class Clappers {
  constructor(game, gltf) {
    this.game = game;
    this.gltf = gltf;
    this.list = [];
    const w = game.physics.world;
    this.ctrl = w.createCharacterController(0.01);
    this.ctrl.setApplyImpulsesToDynamicBodies(true);
    this.ctrl.setCharacterMass(8);
    this.ctrl.enableSnapToGround(0.2);
    this.ctrl.enableAutostep(0.12, 0.1, false);
    // the Courier's terracotta (their armour's colour); each clapper gets its own copy so a fresh one
    // can glow from the kiln and cool
    this.mat = addRim(new THREE.MeshStandardMaterial({ color: PALETTE.mid, roughness: 0.7, flatShading: true }), 0.8); // (a thin rim: render/toon.js)
    this.hot = new THREE.Color(0xffe2a0); // white-hot clay
    this.ember = new THREE.Color(0xff5a14);
    this.eyeMat = new THREE.MeshBasicMaterial({ color: PALETTE.outline });
    this.starMat = new THREE.MeshBasicMaterial({ color: PALETTE.hot });
    this.clips = Object.fromEntries(gltf.animations.map((c) => [c.name.replace('clapper_', ''), c]));
  }

  get floors() { return this.game.level.clapperFloors; }

  spawnAll() {
    const spots = [[-3, -2], [3, -2], [0, -6.5], [2.5, 5.8], [-3.5, 3], [0, 7]];
    for (let i = 0; i < T.clappers.count; i++) {
      const [x, z] = spots[i % spots.length];
      this.spawn(new THREE.Vector3(x, 0, z), false, 0);
    }
    const up = [[-6, -4.6], [2, 9.5], [-6.5, 4], [6, -8], [-2.5, -13.5]];
    for (let i = 0; i < T.clappers.upstairs; i++) {
      const [x, z] = up[i % up.length];
      this.spawn(new THREE.Vector3(x, this.floors[1].y, z), false, 1);
    }
  }

  spawn(pos, fromKiln, floor = 0) {
    const game = this.game;
    const root = new THREE.Group();
    const model = cloneSkinned(this.gltf.scene);
    const meshes = [];
    model.traverse((o) => { if (o.isMesh) meshes.push(o); });
    const mat = this.mat.clone();
    for (const o of meshes) {
      o.material = mat;
      o.castShadow = true;
      o.frustumCulled = false;
      addOutline(o);
    }
    const bone = (n) => model.getObjectByName(n);
    const eyesBone = bone('eyes');
    if (eyesBone) {
      for (const x of [-0.055, 0.055]) {
        const e = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 4), this.eyeMat);
        e.scale.set(1, 1.5, 0.6);
        e.position.set(x, 0.01, 0.0);
        eyesBone.add(e);
      }
    }
    // dizzy stars (hidden until stunned)
    const stars = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const st = new THREE.Mesh(new THREE.OctahedronGeometry(0.04, 0), this.starMat);
      st.userData.a = (i / 3) * Math.PI * 2;
      stars.add(st);
    }
    stars.position.y = 0.72;
    stars.visible = false;
    root.add(model, stars);
    root.position.copy(pos); // (where it stands from its first frame: added at the origin, it showed in the middle of the room until its first update)
    game.scene.add(root);

    const mixer = new THREE.AnimationMixer(model);
    const actions = {};
    for (const [k, clip] of Object.entries(this.clips)) actions[k] = mixer.clipAction(clip);
    if (actions.stumble) { actions.stumble.setLoop(THREE.LoopOnce, 1); actions.stumble.clampWhenFinished = true; }

    // rest orientations (relative to the model) for the procedural layers
    model.updateMatrixWorld(true);
    const mq = model.getWorldQuaternion(new THREE.Quaternion()).invert();
    const restInv = (b) => (b ? b.getWorldQuaternion(new THREE.Quaternion()).premultiply(mq).invert() : null);
    const bones = { body: bone('body'), head: bone('head'), eyes: eyesBone, armL: bone('upper_armL'), armR: bone('upper_armR'), foreL: bone('forearmL'), foreR: bone('forearmR') };

    const w = game.physics.world;
    const s = T.clappers.scale;
    const body = w.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(pos.x, pos.y + (HALF + RADIUS) * s, pos.z));
    const col = w.createCollider(RAPIER.ColliderDesc.capsule(HALF * s, RADIUS * s).setCollisionGroups(CLAPPER_GROUPS), body);
    const f = this.floors[floor];
    const c = {
      type: 'clapper', root, model, mixer, actions, body, col, alive: true, bones, stars, mat, cool: fromKiln ? 1 : 0,
      headInv: restInv(bones.head), bodyInv: restInv(bones.body),
      armInv: { L: restInv(bones.armL), R: restInv(bones.armR), fL: restInv(bones.foreL), fR: restInv(bones.foreR) }, idleT: 0, twirl: 0,
      floor, pos: pos.clone(), prevPos: pos.clone(), vy: fromKiln ? 3.2 : 0, heading: fromKiln ? f.heading : Math.random() * Math.PI * 2,
      state: 'idle', timer: 0.3 + Math.random(), target: null, speed: 0, current: null, stuckT: 0, lastPos: pos.clone(),
      squeakT: 0, stash: 0, kv: new THREE.Vector3(), grounded: true, peakY: pos.y, heat: 0, stunT: 0, pulledT: 0,
      clapT: 0, clapRate: 0, look: 0, blinkT: 2 + Math.random() * 3, squash: 0, squashV: 0, hop: 0, spin: 0, t: Math.random() * 10,
      temper: Math.random(), act: null, actT: 0, actDur: 0, actW: 0, actSeed: Math.random() * 10,
    };
    // (its joints' limits, applied last: rom.js)
    c.rom = new JointLimits();
    for (const [name, spec] of Object.entries(CLAPPER_ROM)) { const bn = bone(name); if (bn) c.rom.add(bn, bn.quaternion.clone(), spec); }
    game.physics.register(col, c);
    this.play(c, 'idle', 0);
    if (fromKiln) {
      sfx.pop(game.listenerDistance(pos));
      c.state = 'run';
      c.target = this.pickTarget(c) || f.spawn.clone().add(new THREE.Vector3(Math.sin(f.heading) * 3, 0, Math.cos(f.heading) * 3));
    }
    this.list.push(c);
    return c;
  }

  play(c, name, fade = 0.15) {
    const a = c.actions[name];
    if (!a || c.current === a) return;
    a.reset().play();
    if (c.current) c.current.crossFadeTo(a, fade, false);
    c.current = a;
  }

  // ---- navigation ------------------------------------------------------------
  onFloor(c, p, f = this.floors[c.floor]) {
    const down = this.game.physics.raycast({ x: p.x, y: f.y + 2.5, z: p.z }, { x: 0, y: -1, z: 0 }, 3.5, c.col, STATIC_ONLY);
    return down && Math.abs(down.point.y - f.y) < 0.12;
  }

  reachable(c, p) {
    const f = this.floors[c.floor];
    if (p.x < f.x0 || p.x > f.x1 || p.z < f.z0 || p.z > f.z1) return false;
    if (!this.onFloor(c, p)) return false;
    const from = c.pos.clone().setY(f.y + 0.4), to = p.clone().setY(f.y + 0.4);
    const d = to.clone().sub(from);
    const len = d.length();
    if (len < 0.3) return true;
    d.divideScalar(len);
    const ball = new RAPIER.Ball(RADIUS * T.clappers.scale);
    if (this.game.physics.world.castShape(from, { x: 0, y: 0, z: 0, w: 1 }, d, ball, 0, len, true, undefined, STATIC_ONLY, c.col)) return false;
    // no holes (the atrium!) along the way
    for (let s = 0.6; s < len; s += 0.6) if (!this.onFloor(c, from.clone().addScaledVector(d, s))) return false;
    return true;
  }

  pickTarget(c, away) {
    const f = this.floors[c.floor];
    for (let i = 0; i < 12; i++) {
      let p;
      if (away && i < 7) {
        const d = c.pos.clone().sub(away).setY(0).normalize().applyAxisAngle(UP, (Math.random() - 0.5) * 1.6);
        p = c.pos.clone().addScaledVector(d, 3 + Math.random() * 3);
      } else {
        p = new THREE.Vector3(THREE.MathUtils.lerp(f.x0, f.x1, Math.random()), f.y, THREE.MathUtils.lerp(f.z0, f.z1, Math.random()));
      }
      p.y = f.y;
      if (c.pos.distanceTo(p) > 1 && this.reachable(c, p)) return p;
    }
    return null;
  }

  // a big pot between us and the threat
  findCover(c, threat) {
    let best = null, bd = 1e9;
    for (const ent of this.game.breakables.items) {
      if (ent.size < 0.7 || ent.def.hang) continue;
      const t = ent.body.translation();
      if (Math.abs(t.y - this.floors[c.floor].y) > 0.5) continue;
      const pot = new THREE.Vector3(t.x, t.y, t.z);
      const d = pot.distanceTo(c.pos);
      if (d > 9 || d > bd) continue;
      const spot = pot.clone().add(pot.clone().sub(threat).setY(0).normalize().multiplyScalar(ent.P.rMax + 0.45));
      spot.y = this.floors[c.floor].y;
      if (!this.reachable(c, spot)) continue;
      best = { spot, ent }; bd = d;
    }
    return best;
  }

  canSeePlayer(c) {
    const p = this.game.player;
    const eye = c.pos.clone().setY(c.pos.y + 0.5);
    const chest = p.renderPos.clone().setY(p.renderPos.y + 1.2);
    const d = chest.clone().sub(eye);
    const len = d.length();
    if (len > 8) return false;
    return !this.game.physics.raycast(eye, d.divideScalar(len), len - 0.3, c.col, STATIC_ONLY);
  }

  // ---- AI + movement (fixed step) ------------------------------------------------
  fixedUpdate(dt) {
    const C = T.clappers;
    for (const c of this.list) {
      if (!c.alive) continue;
      c.prevPos.copy(c.pos);
      if (c.held || c.pinned) { // in the god hand's grip, or anchored: no walking, no falling
        if (c.held) { c.pos.copy(c.holdPos); c.state = 'knocked'; c.spin = Math.sin(c.t * 9) * 0.4; c.speed = 0; }
        c.grounded = false; c.kv.set(0, 0, 0); c.vy = 0; c.peakY = c.pos.y;
        c.body.setNextKinematicTranslation({ x: c.pos.x, y: c.pos.y + (HALF + RADIUS) * C.scale, z: c.pos.z });
        continue;
      }
      c.timer -= dt;
      c.squeakT -= dt;
      c.pulledT -= dt;
      c.heat = Math.max(0, c.heat - dt * 0.35);
      if (c.job && c.state !== 'mendGo' && c.state !== 'mend') this.dropJob(c); // interrupted
      let wantSpeed = 0;
      const physical = c.state === 'knocked' || c.pulledT > 0;
      switch (c.state) {
        case 'idle':
          if (c.timer <= 0) this.decide(c);
          break;
        case 'taunt': {
          const p = this.game.player.renderPos;
          c.heading += wrap(Math.atan2(p.x - c.pos.x, p.z - c.pos.z) - c.heading) * (1 - Math.exp(-8 * dt));
          if (c.timer <= 0) { c.state = 'flee'; c.target = this.pickTarget(c, p) || this.pickTarget(c); c.timer = 2.5; }
          break;
        }
        case 'forage': {
          wantSpeed = C.runSpeed;
          const b = c.bauble;
          if (!b || b.state !== 'loose' || b.claimed) { c.state = 'idle'; c.timer = 0.3; break; }
          c.target = b.root.position.clone().setY(c.pos.y);
          if (c.pos.distanceTo(c.target) < 0.42 && this.game.baubles.steal(b)) {
            c.stash++;
            c.clapT = 0.45; c.clapRate = 14;
            sfx.gulp(this.game.listenerDistance(c.pos));
            c.state = 'celebrate'; c.timer = 0.75;
            c.vy = 3.4; c.grounded = false; c.twirl = 0;
            c.squashV += 4;
          }
          if (c.timer <= -6) { c.state = 'idle'; c.timer = 0.2; }
          break;
        }
        case 'stumble':
          wantSpeed = 0.6;
          if (c.timer <= 0) {
            const cover = Math.random() < C.hideChance ? this.findCover(c, c.threat) : null;
            if (cover) { c.state = 'hide'; c.target = cover.spot; c.cover = cover.ent; c.timer = 4; }
            else { c.state = 'flee'; c.target = this.pickTarget(c, c.threat) || this.pickTarget(c); c.timer = 3; }
          }
          break;
        case 'hide':
          wantSpeed = C.fleeSpeed;
          if (!c.target || c.pos.distanceTo(c.target) < 0.35 || c.timer <= 0) { c.state = 'cower'; c.timer = 3 + Math.random() * 2.5; }
          break;
        case 'cower': {
          const th = c.threat || this.game.player.renderPos;
          c.heading += wrap(Math.atan2(th.x - c.pos.x, th.z - c.pos.z) - c.heading) * (1 - Math.exp(-5 * dt));
          if (c.timer <= 0 || !c.cover?.alive) { c.state = 'flee'; c.target = this.pickTarget(c, th) || this.pickTarget(c); c.timer = 2.5; }
          break;
        }
        case 'run':
        case 'flee':
          wantSpeed = c.state === 'flee' ? C.fleeSpeed : C.runSpeed;
          if (!c.target || c.pos.distanceTo(c.target) < 0.5 || (c.state === 'flee' && c.timer <= 0)) { c.state = 'idle'; c.timer = 0.6 + Math.random() * 2; c.target = null; }
          break;
        case 'celebrate':
          c.twirl = Math.min(1, c.twirl + dt / 0.6);
          if (c.timer <= 0) { c.state = 'idle'; c.timer = 0.4; c.twirl = 0; }
          break;
        case 'nap': {
          const pd = c.pos.distanceTo(this.game.player.renderPos);
          if (pd < 2.6) { // startled awake
            c.state = 'stumble'; c.timer = 0.35; c.threat = this.game.player.renderPos.clone(); c.vy = 3; c.grounded = false;
            sfx.squeak(this.game.listenerDistance(c.pos)); c.squeakT = 0.5;
          } else if (c.timer <= 0) { c.state = 'idle'; c.timer = 0.5; }
          if (Math.random() < dt * 1.2) this.game.fx.alpha.emit({ pos: c.pos.clone().setY(c.pos.y + 0.75), vel: new THREE.Vector3(0.15, 0.35, 0), life: 1.6, size: 0.05, sizeEnd: 0.12, color: new THREE.Color(PALETTE.cream), alpha: 0.7, drag: 0.2 });
          break;
        }
        case 'stunned':
          c.stunT -= dt;
          if (c.stunT <= 0) { c.state = 'flee'; c.target = this.pickTarget(c, this.game.player.renderPos); c.timer = 2; }
          break;
        case 'scalded':
          wantSpeed = C.fleeSpeed * 1.1;
          if (c.grounded && Math.random() < dt * 5) { c.vy = 2.6; c.squashV -= 3; }
          if (!c.target || c.pos.distanceTo(c.target) < 0.5) c.target = this.pickTarget(c);
          if (c.timer <= 0) { c.state = 'flee'; c.timer = 1.5; }
          break;
        case 'mendGo': {
          wantSpeed = C.runSpeed;
          const job = c.job;
          if (!this.jobValid(c, job) || c.timer <= -8) { this.dropJob(c); c.state = 'idle'; c.timer = 0.4; break; }
          if (c.pos.distanceTo(c.target) < 0.4) { c.state = 'mend'; c.timer = C.mendTime; c.tapT = 0; }
          break;
        }
        case 'mend': {
          const job = c.job;
          if (!this.jobValid(c, job)) { this.dropJob(c); c.state = 'idle'; c.timer = 0.4; break; }
          const at = job.pos;
          c.heading += wrap(Math.atan2(at.x - c.pos.x, at.z - c.pos.z) - c.heading) * (1 - Math.exp(-8 * dt));
          c.clapT = 0.3; c.clapRate = 18;
          this.mendWork(c, job, dt);
          if (c.timer <= 0) this.finishJob(c);
          break;
        }
        case 'dance':
          // (a groove shell is playing: the beat sets the hops, this only turns it round and lets it stop)
          c.heading += dt * 2.4;
          if (c.timer <= 0) { c.state = 'idle'; c.timer = 0.3; }
          break;
        case 'raid': { // a raider on its way to the god hand's vessel
          const god = this.game.god;
          if (!god?.active || !god.vessel.alive) { this.dismiss(c); break; }
          wantSpeed = C.runSpeed * 1.15;
          c.target = god.vessel.pos.clone().setY(c.pos.y);
          const dx = god.vessel.pos.x - c.pos.x, dz = god.vessel.pos.z - c.pos.z, d = Math.hypot(dx, dz);
          if (d < 0.95 && Math.abs(c.pos.y - god.vessel.pos.y) < 1.2) { god.raidStrike(c); break; }
          // (blocked by something: sidestep for a moment)
          c.raidT = (c.raidT || 0) + dt;
          if (c.raidT > 1.2) { c.detour = c.pos.distanceTo(c.raidFrom || c.pos) < 0.6 ? (c.detour ? 0 : (Math.random() < 0.5 ? 1.2 : -1.2)) : 0; c.raidFrom = c.pos.clone(); c.raidT = 0; }
          if (c.detour) c.target = c.pos.clone().add(new THREE.Vector3(Math.sin(c.heading + c.detour), 0, Math.cos(c.heading + c.detour)).multiplyScalar(2));
          break;
        }
        case 'guard': { // a turned clapperjar sees off a raider
          const r = c.chasing;
          if (!r?.alive || r.state !== 'raid' || !this.game.god?.active) { c.state = 'idle'; c.timer = 0.3; c.chasing = null; break; }
          wantSpeed = C.runSpeed * 1.2;
          c.target = r.pos.clone().setY(c.pos.y);
          if (c.pos.distanceTo(r.pos) < 0.85) {
            this.knock(r, r.pos.clone().sub(c.pos).setY(0).normalize().multiplyScalar(9));
            r.state = 'knocked'; r.raiderStunned = 1.4;
            c.state = 'celebrate'; c.timer = 0.6; c.vy = 3; c.grounded = false; c.twirl = 0; c.chasing = null;
            sfx.clap(this.game.listenerDistance(c.pos));
          }
          break;
        }
        case 'knocked':
          if (c.raider) { // (a raider shaken off gets back up and comes on again)
            c.raiderStunned = (c.raiderStunned || 0) - dt;
            if (c.raiderStunned <= 0 && c.grounded && c.kv.lengthSq() < 0.6) { c.state = 'raid'; c.spin = 0; c.detour = 0; }
            break;
          }
          if (c.grounded && c.kv.lengthSq() < 0.6) { c.state = 'stumble'; c.timer = 0.4; c.threat = c.threat || c.pos.clone(); c.spin = 0; }
          break;
        default: break;
      }
      if (!c.alive) continue; // (a raider that struck the vessel is gone)

      let desired;
      if (physical) {
        if (c.pulledT <= 0) c.kv.y -= 14 * dt;
        if (c.grounded && c.pulledT <= 0) { const k = Math.exp(-5 * dt); c.kv.x *= k; c.kv.z *= k; }
        desired = { x: c.kv.x * dt, y: c.kv.y * dt, z: c.kv.z * dt };
        c.spin += dt * c.kv.length() * 2;
      } else {
        c.speed = THREE.MathUtils.damp(c.speed, ['stunned', 'cower', 'taunt', 'nap', 'celebrate', 'mend', 'dance'].includes(c.state) ? 0 : wantSpeed, 8, dt);
        if (c.target && ['run', 'flee', 'forage', 'hide', 'scalded', 'stumble', 'mendGo', 'raid', 'guard'].includes(c.state)) {
          const want = Math.atan2(c.target.x - c.pos.x, c.target.z - c.pos.z);
          c.heading += wrap(want - c.heading) * (1 - Math.exp(-10 * dt));
        }
        c.vy -= 14 * dt;
        desired = { x: Math.sin(c.heading) * c.speed * dt, y: c.vy * dt, z: Math.cos(c.heading) * c.speed * dt };
      }
      if (c.bumpX || c.bumpZ) { desired.x += c.bumpX; desired.z += c.bumpZ; c.bumpX = c.bumpZ = 0; } // shoved by the courier
      this.ctrl.computeColliderMovement(c.col, desired, RAPIER.QueryFilterFlags.EXCLUDE_SENSORS, QUERY);
      const mv = this.ctrl.computedMovement();
      const wasGrounded = c.grounded;
      c.grounded = this.ctrl.computedGrounded();
      if (c.grounded && c.vy < 0) c.vy = 0;
      if (c.grounded && c.kv.y < 0) c.kv.y = 0;
      c.pos.x += mv.x; c.pos.y += mv.y; c.pos.z += mv.z;
      if (physical && mv.x * mv.x + mv.z * mv.z < desired.x * desired.x * 0.25) { c.kv.x *= -0.3; c.kv.z *= -0.3; } // bounce off walls
      // long falls shatter them
      if (!c.grounded) c.peakY = Math.max(c.peakY, c.pos.y);
      if (c.grounded && !wasGrounded) {
        const drop = c.peakY - c.pos.y;
        if (drop > C.fallShatter && c.pulledT <= 0) { this.hit(c, c.pos.clone().setY(c.pos.y + 0.2), new THREE.Vector3(0, -1, 0), 1.2, 'splat'); continue; }
        if (drop > 0.3) c.squashV -= Math.min(8, drop * 5);
        this.retarget(c);
      }
      if (c.grounded) c.peakY = c.pos.y;
      if (c.pos.y < (c.killY ?? -5)) { this.hit(c, c.pos.clone(), UP, 1, 'splat'); continue; }
      c.body.setNextKinematicTranslation({ x: c.pos.x, y: c.pos.y + (HALF + RADIUS) * C.scale, z: c.pos.z });
      // stuck? pick somewhere else
      if (!physical && c.speed > 1) {
        c.stuckT += dt;
        if (c.stuckT > 0.5) {
          if (c.pos.distanceTo(c.lastPos) < c.speed * 0.5 * 0.3) { c.target = this.pickTarget(c); if (!c.target) c.state = 'idle'; }
          c.stuckT = 0;
          c.lastPos.copy(c.pos);
        }
      }
    }
  }

  // which floor are we on now (after falls)?
  retarget(c) {
    const fi = this.floors.findIndex((f) => Math.abs(c.pos.y - f.y) < 0.6);
    if (fi >= 0) c.floor = fi;
  }

  decide(c) {
    const god = this.game.god;
    if (c.ally && god?.active && god.vessel.alive) {
      // a turned clapperjar: sees off the nearest raider, then tends the vessel, then keeps close to it
      const r = this.list.find((x) => x.alive && x.raider && x.state === 'raid' && x.pos.distanceTo(god.vessel.pos) < 14 && !x.chased);
      if (r) { c.state = 'guard'; c.chasing = r; c.timer = 0; return; }
      if (god.vessel.hp < god.vessel.max - 1 && !god.vessel.mendBy && this.takeJob(c)) return;
      const a = Math.random() * Math.PI * 2, rad = 1.2 + Math.random() * 2.2;
      c.target = god.vessel.pos.clone().add(new THREE.Vector3(Math.sin(a) * rad, 0, Math.cos(a) * rad)).setY(c.pos.y);
      c.state = 'run'; c.stuckT = 0; c.timer = 0;
      return;
    }
    const b = this.game.baubles?.near(c.pos, 5).find((bb) => Math.abs(bb.root.position.y - c.pos.y) < 0.8);
    if (b && Math.random() < 0.85) { c.state = 'forage'; c.bauble = b; c.timer = 0; return; }
    if (Math.random() < T.clappers.mendChance && this.takeJob(c)) return;
    const far = c.pos.distanceTo(this.game.player.renderPos) > 9;
    if (far && Math.random() < T.clappers.napChance) { c.state = 'nap'; c.timer = 6 + Math.random() * 6; return; }
    if (this.canSeePlayer(c) && Math.random() < T.clappers.tauntChance) {
      c.state = 'taunt'; c.timer = 1.2 + Math.random() * 0.8; c.clapT = c.timer; c.clapRate = 11;
      return;
    }
    // most of the time, a jar left to itself stays where it is and does some small thing (the calmer, the more often)
    if (!c.ally && !c.raider && Math.random() < 0.5 + 0.38 * c.temper) { this.startAct(c); return; }
    c.target = this.pickTarget(c);
    if (c.target) { c.state = 'run'; c.stuckT = 0; } else c.timer = 0.5;
  }

  /** The idle act's layer this frame: squash, lid, look, arms, a lean and a hop, all scaled by how far into the act it is. */
  actPose(c, dt) {
    const O = { squash: 0, lid: 0, look: 0, armL: 0, armR: 0, foreR: 0, rx: 0, rz: 0, hop: 0, w: 0 };
    const on = c.state === 'idle' && c.act;
    if (on) c.actT += dt;
    const env = on ? ease(Math.min(1, c.actT / 0.7)) * ease(Math.min(1, Math.max(0, c.actDur - c.actT) / 0.7)) : 0;
    c.actW = THREE.MathUtils.damp(c.actW, env, 6, dt);
    if (!on && c.actW < 0.01) { c.act = null; return O; }
    const w = (O.w = c.actW), t = c.t * (1 - 0.35 * c.temper), p = Math.min(1, c.actT / Math.max(0.1, c.actDur)), s = c.actSeed;
    O.squash = 0.022 * Math.sin(t * 2.0 + s) * w; // (it always breathes)
    switch (c.act) {
      case 'breathe': O.lid = 0.07 * (0.5 + 0.5 * Math.sin(t * 2.0 + s)) * w; break;
      case 'lookabout': O.look = 0.95 * Math.sin(c.actT * 0.75 + s) * w; O.lid = 0.05 * w; break;
      case 'yawn': { const o = Math.sin(Math.PI * Math.min(1, p * 1.15)); O.lid = 0.95 * o * w; O.squash += 0.12 * o * w; O.armL = 0.9 * o * w; O.armR = -0.9 * o * w; O.rx = -0.08 * o * w; break; }
      case 'scratch': O.armR = -1.25 * w; O.foreR = (-0.6 + 0.4 * Math.sin(c.t * 9)) * w; O.look = 0.35 * w; O.rz = 0.05 * w; break;
      case 'hum': O.rz = 0.08 * Math.sin(t * 2.4 + s) * w; O.lid = 0.14 * Math.max(0, Math.sin(t * 4.8)) * w; O.squash += 0.02 * Math.sin(t * 4.8) * w; break;
      case 'sit': O.squash -= 0.17 * w; O.armL = -0.5 * w; O.armR = 0.5 * w; O.lid = 0.04 * w; break;
      case 'gaze': O.rx = -0.2 * w; O.lid = 0.22 * w; O.look = 0.2 * Math.sin(c.actT * 0.4 + s) * w; break;
      case 'polish': O.armR = -1.6 * w; O.foreR = (-0.4 + 0.5 * Math.sin(c.t * 6)) * w; O.armL = 0.35 * w; O.lid = 0.05 * Math.sin(c.t * 6) * w; break;
      case 'shuffle': c.heading += (c.actTurn * dt / Math.max(0.5, c.actDur)) * w; O.hop = 0.018 * Math.abs(Math.sin(c.t * 10)) * w; break;
    }
    return O;
  }

  startAct(c, name = null) {
    if (!name) { let r = Math.random() * ACT_W; for (const [k, A] of Object.entries(ACTS)) { r -= A.w; if (r <= 0) { name = k; break; } } }
    if (name === c.act && name !== 'breathe') name = 'breathe';
    const A = ACTS[name];
    c.state = 'idle'; c.act = name; c.actT = 0;
    c.actDur = (A.dur[0] + Math.random() * (A.dur[1] - A.dur[0])) * (0.8 + 0.5 * c.temper);
    c.timer = c.actDur; c.actSeed = Math.random() * 10; c.actTurn = (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.7);
    if (name === 'hum' && this.game.listenerDistance(c.pos) < 14) this.game.glyphs?.pop('note', c.pos.clone().setY(c.pos.y + 0.9), { color: 0xffe2b0, size: 0.32, life: 1.6, float: 0.5 });
  }

  // ---- kintsugi: rebuild wrecks, mend cracked pots ------------------------------------
  jobs(c) {
    const B = this.game.breakables, f = this.floors[c.floor], now = performance.now() * 0.001;
    const out = [];
    for (const w of B.wrecks) {
      if (w.claimed || now - w.t < T.clappers.wreckDelay || Math.abs(w.pos.y - f.y) > 0.3) continue;
      out.push({ kind: 'wreck', w, pos: w.pos, r: w.rMax });
    }
    for (const ent of B.items) {
      if (ent.crackStage < 2 || ent.mendBy || ent.def.hang || ent.def.target) continue;
      const t = ent.body.translation();
      if (Math.abs(t.y - f.y) > 0.3) continue;
      out.push({ kind: 'pot', ent, pos: new THREE.Vector3(t.x, t.y, t.z), r: ent.P.rMax });
    }
    // the god hand's vessel, tended by the clapperjars it has turned
    const god = this.game.god;
    if (c.ally && god?.active && god.vessel.alive && god.vessel.hp < god.vessel.max - 1 && !god.vessel.mendBy) out.push({ kind: 'vessel', pos: god.vessel.pos.clone(), r: 0.5 });
    return out;
  }

  /** A raider gives up (the vessel is gone, or the hand has let go of it). */
  dismiss(c) {
    c.raider = false;
    this.hit(c, c.pos.clone().setY(c.pos.y + 0.4), UP, 1, 'shot');
  }

  takeJob(c) {
    const C = T.clappers, player = this.game.player.renderPos;
    const cands = this.jobs(c)
      .filter((j) => j.pos.distanceTo(c.pos) < C.mendRange && (j.kind === 'vessel' || j.pos.distanceTo(player) > C.mendShy))
      .sort((a, b) => a.pos.distanceTo(c.pos) - b.pos.distanceTo(c.pos));
    for (const job of cands.slice(0, 4)) {
      // stand next to it, on our side
      const side = c.pos.clone().sub(job.pos).setY(0);
      if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
      const spot = job.pos.clone().addScaledVector(side.normalize(), job.r + 0.3);
      spot.y = this.floors[c.floor].y;
      if (!this.reachable(c, spot)) continue;
      if (job.kind === 'wreck') job.w.claimed = c; else if (job.kind === 'vessel') this.game.god.vessel.mendBy = c; else job.ent.mendBy = c;
      c.job = job; c.target = spot; c.state = 'mendGo'; c.timer = 0; c.stuckT = 0;
      return true;
    }
    return false;
  }

  jobValid(c, job) {
    if (!job) return false;
    if (job.kind === 'vessel') return !!this.game.god?.active && this.game.god.vessel.alive;
    if (job.pos.distanceTo(this.game.player.renderPos) < T.clappers.mendShy * 0.6) return false; // too close for comfort
    return job.kind === 'wreck' ? this.game.breakables.wrecks.includes(job.w) : job.ent.alive;
  }

  dropJob(c) {
    const job = c.job;
    if (!job) return;
    if (job.kind === 'wreck' && job.w.claimed === c) job.w.claimed = null;
    if (job.kind === 'pot' && job.ent.mendBy === c) job.ent.mendBy = null;
    if (job.kind === 'vessel' && this.game.god?.vessel.mendBy === c) this.game.god.vessel.mendBy = null;
    c.job = null;
  }

  mendWork(c, job, dt) {
    const g = this.game;
    c.tapT = (c.tapT || 0) - dt;
    if (c.tapT <= 0) {
      c.tapT = 0.16 + Math.random() * 0.12;
      sfx.tap(g.listenerDistance(c.pos));
      c.squashV -= 1.5;
      const p = job.pos.clone().setY(job.pos.y + 0.1 + Math.random() * 0.3);
      g.fx.add.emit({ pos: p, vel: new THREE.Vector3().randomDirection().multiplyScalar(1.2).setY(1.5), life: 0.5, size: 0.03, sizeEnd: 0.005, color: GOLD, drag: 2, twinkle: 25 });
    }
    // sweep the shards back in: pull the nearby ones to the pile, and tidy away what arrives
    if (job.kind === 'wreck') {
      const B = g.breakables;
      for (let i = B.shards.length - 1; i >= 0; i--) {
        const s = B.shards[i];
        const t = s.body.translation();
        const d = Math.hypot(t.x - job.pos.x, t.z - job.pos.z);
        if (d > 2.2 || Math.abs(t.y - job.pos.y) > 1.2) continue;
        if (d < 0.3 || (c.timer < 0.6 && d < 1)) { B.shards.splice(i, 1); B.removeShard(s); continue; }
        const m = s.body.mass();
        g.physics.kick(s.body, { x: (job.pos.x - t.x) / d * m * 3 * dt, y: m * 2 * dt, z: (job.pos.z - t.z) / d * m * 3 * dt });
      }
    }
  }

  finishJob(c) {
    const g = this.game, job = c.job;
    const d = g.listenerDistance(job.pos);
    if (job.kind === 'wreck') g.breakables.rebuild(job.w);
    else if (job.kind === 'vessel') g.god.mendVessel(T.god.mendAmount ?? 16);
    else g.breakables.mend(job.ent);
    c.job = null;
    sfx.mended(d);
    const top = job.pos.clone().setY(job.pos.y + 0.4);
    g.fx.glitter([top], top, UP, GOLD);
    c.state = 'celebrate'; c.timer = 0.75; c.vy = 3.4; c.grounded = false; c.twirl = 0; c.squashV += 4;
  }

  // ---- animation layers (per frame) ---------------------------------------------
  update(dt, alpha) {
    const C = T.clappers;
    const player = this.game.player.renderPos;
    for (const c of this.list) {
      if (!c.alive) continue;
      c.t += dt;
      // fresh from the kiln: white-hot, then a glowing orange, then terracotta (about 7 s)
      if (c.cool > 0) {
        c.cool = Math.max(0, c.cool - dt / 7);
        const k = c.cool * c.cool;
        c.mat.color.copy(this.mat.color).lerp(this.hot, Math.min(1, c.cool * 1.3) * 0.75);
        c.mat.emissive.copy(this.ember).multiplyScalar(k);
        c.mat.emissiveIntensity = 1.4;
      }
      const moving = c.speed > 0.8 || c.state === 'scalded';
      if (c.state === 'stumble') this.play(c, 'stumble', 0.08);
      else if (c.state === 'knocked' || c.pulledT > 0) { this.play(c, 'sprint', 0.08); c.actions.sprint.timeScale = 2.4; }
      else if (moving) { this.play(c, 'sprint', 0.12); c.actions.sprint.timeScale = 0.55 * (Math.max(c.speed, 2) / C.runSpeed) + 0.25; }
      else { this.play(c, 'idle', 0.2); if (c.actions.idle) c.actions.idle.timeScale = 0.8 - 0.35 * c.temper; } // (a calm jar idles slowly)
      c.mixer.update(c.state === 'stunned' ? dt * 0.3 : dt);

      // squash spring
      c.squashV += (-120 * c.squash - 9 * c.squashV) * dt;
      c.squash += c.squashV * dt;
      let squash = c.squash;
      if (c.state === 'cower') squash -= 0.22 + Math.sin(c.t * 40) * 0.015;
      if (c.state === 'nap') squash -= 0.16 + Math.sin(c.t * 1.6) * 0.04; // slow sleepy breathing
      if (c.state === 'taunt') { c.hop = Math.abs(Math.sin(c.t * 9)) * 0.08; squash += (c.hop < 0.02 ? -0.1 : 0.05); } else c.hop = THREE.MathUtils.damp(c.hop, 0, 10, dt);
      const A = this.actPose(c, dt);
      squash += A.squash;
      const b = c.bones;
      if (b.body && c.bodyInv) b.body.scale.set(1 - squash * 0.5, 1 + squash, 1 - squash * 0.5);

      // lid: clap (taunts, gulps) + look at the courier
      if (b.head && c.headInv) {
        let lid = 0;
        if (c.clapT > 0) { c.clapT -= dt; const ph = Math.sin(c.t * c.clapRate); lid = Math.max(0, ph) * 0.9; if (ph > 0.97 && !c.clapLatch) { c.clapLatch = true; } if (ph < 0 && c.clapLatch) { c.clapLatch = false; sfx.clap(this.game.listenerDistance(c.pos)); } }
        if (c.state === 'cower') lid = 0.25 + 0.15 * Math.max(0, Math.sin(c.t * 1.7)); // peeking out
        lid += A.lid;
        // (it watches them, unless it is busy with itself: then it looks where its act looks)
        const wantLook = (['idle', 'taunt', 'cower', 'stunned'].includes(c.state)
          ? THREE.MathUtils.clamp(wrap(Math.atan2(player.x - c.pos.x, player.z - c.pos.z) - c.heading), -1.2, 1.2) : 0) * (1 - 0.85 * c.actW) + A.look;
        c.look = THREE.MathUtils.damp(c.look, c.state === 'stunned' ? Math.sin(c.t * 5) * 0.8 : wantLook, 6, dt);
        const up = _v.copy(UP).applyQuaternion(c.headInv);
        b.head.quaternion.multiply(_q.setFromAxisAngle(up.normalize(), c.look));
        const hinge = _v.copy(X).applyQuaternion(c.headInv);
        b.head.quaternion.multiply(_q.setFromAxisAngle(hinge.normalize(), -lid));
      }
      // arms: wave while taunting, throw them up when celebrating, droop when napping
      const arm = (bn, inv, ang) => { if (bn && inv && ang) bn.quaternion.multiply(_q.setFromAxisAngle(_v.set(0, 0, 1).applyQuaternion(inv).normalize(), ang)); };
      if (c.state === 'taunt') { arm(b.armR, c.armInv.R, -1.9 - Math.sin(c.t * 14) * 0.5); arm(b.foreR, c.armInv.fR, -Math.sin(c.t * 14 + 1) * 0.6); }
      if (c.state === 'celebrate') { arm(b.armL, c.armInv.L, 1.8); arm(b.armR, c.armInv.R, -1.8); }
      if (c.state === 'nap') { arm(b.armL, c.armInv.L, -0.6); arm(b.armR, c.armInv.R, 0.6); }
      if (c.state === 'mend') { arm(b.armL, c.armInv.L, 1.1 + Math.sin(c.t * 16) * 0.6); arm(b.armR, c.armInv.R, -1.1 - Math.sin(c.t * 16 + Math.PI) * 0.6); }
      if (c.actW > 0.01) { arm(b.armL, c.armInv.L, A.armL); arm(b.armR, c.armInv.R, A.armR); arm(b.foreR, c.armInv.fR, A.foreR); }
      c.rom?.apply(); // (the joints' limits, last)
      // blink (eyes stay shut while napping)
      c.blinkT -= dt;
      if (b.eyes) b.eyes.scale.y = c.blinkT < 0.1 || c.state === 'nap' ? 0.15 : 1;
      if (c.blinkT < 0) c.blinkT = 2 + Math.random() * 4;

      // placement + whole-body flourishes
      c.root.position.lerpVectors(c.prevPos, c.pos, alpha);
      c.root.position.y += c.hop;
      c.root.rotation.set(0, c.heading + (c.state === 'celebrate' ? c.twirl * c.twirl * Math.PI * 2 : 0), 0);
      if (c.state === 'stunned') { c.root.rotation.z = Math.sin(c.t * 6) * 0.18; c.root.rotation.x = Math.cos(c.t * 5) * 0.12; }
      if (c.actW > 0.01) { c.root.rotation.x += A.rx; c.root.rotation.z += A.rz; c.root.position.y += A.hop; }
      if (c.state === 'knocked' || c.pulledT > 0) {
        // tumbling about the body's centre, not its feet (about the feet, a flip swings the body through the floor);
        // on the ground it rights itself to the nearest upright
        if (c.grounded) c.spin = THREE.MathUtils.damp(c.spin, Math.round(c.spin / (Math.PI * 2)) * Math.PI * 2, 10, dt);
        c.root.rotation.x = c.spin;
        const hc = (HALF + RADIUS) * T.clappers.scale;
        c.root.position.y += hc * (1 - Math.cos(c.spin));
        c.root.position.z -= hc * Math.sin(c.spin);
        // (and never below the floor it's on, whatever way up it is)
        if (Math.abs(Math.sin(c.spin / 2)) > 0.04) {
          c.root.updateMatrixWorld(true);
          const low = _box.setFromObject(c.root).min.y;
          if (low < c.pos.y - 0.01) c.root.position.y += c.pos.y - 0.01 - low;
        }
      }
      c.root.scale.setScalar(T.clappers.scale * (1 + Math.min(8, c.stash) * 0.045));
      c.stars.visible = c.state === 'stunned';
      if (c.stars.visible) c.stars.children.forEach((st, i) => { const a = st.userData.a + c.t * 5; st.position.set(Math.cos(a) * 0.2, Math.sin(c.t * 7 + i) * 0.03, Math.sin(a) * 0.2); st.rotation.y += dt * 8; });
      if (c.glows && c.markT !== undefined) {
        c.markT -= dt;
        if (c.markT <= 0) this.unmark(c);
      }
    }
  }

  // ---- reactions --------------------------------------------------------------
  spook(point, radius = T.clappers.spookRadius) {
    for (const c of this.list) {
      if (!c.alive || ['stumble', 'stunned', 'knocked', 'hide'].includes(c.state) || c.pulledT > 0) continue;
      const d = c.pos.distanceTo(point);
      if (d > radius) continue;
      c.state = 'stumble';
      c.timer = 0.4;
      c.threat = this.game.player.renderPos.clone();
      c.heading = Math.atan2(c.pos.x - point.x, c.pos.z - point.z);
      if (c.squeakT <= 0) { sfx.squeak(this.game.listenerDistance(c.pos)); c.squeakT = 0.6; }
    }
  }

  /** The courier leaning on one: a small displacement next step. */
  bump(c, dx, dz) {
    c.bumpX = (c.bumpX || 0) + dx;
    c.bumpZ = (c.bumpZ || 0) + dz;
  }

  knock(c, vel) {
    if (!c.alive) return;
    c.kv.copy(vel);
    c.kv.y = Math.max(c.kv.y, 2.5);
    c.state = 'knocked';
    c.grounded = false;
    c.threat = this.game.player.renderPos.clone();
    if (c.squeakT <= 0) { sfx.squeak(this.game.listenerDistance(c.pos)); c.squeakT = 0.4; }
  }

  pull(c, center, strength, dt) {
    if (!c.alive) return;
    if (c.state !== 'knocked') c.state = 'knocked';
    c.pulledT = 0.15;
    _v.subVectors(center, c.pos.clone().setY(c.pos.y + 0.3));
    const d = _v.length();
    _v.divideScalar(d || 1);
    const tang = new THREE.Vector3().crossVectors(UP, _v).normalize();
    c.kv.addScaledVector(_v, 16 * strength * dt).addScaledVector(tang, 7 * strength * dt);
    c.kv.y += 11 * strength * dt;
    if (d < 0.6) c.kv.multiplyScalar(0.9);
    c.kv.clampLength(0, 8);
    c.grounded = false;
    c.peakY = Math.max(c.peakY, c.pos.y);
    c.threat = center.clone();
    if (c.squeakT <= 0) { sfx.squeak(this.game.listenerDistance(c.pos)); c.squeakT = 0.5; }
  }

  stun(c, dur, glowMat, xrayMat) {
    if (!c.alive) return;
    c.state = 'stunned';
    c.stunT = dur;
    c.speed = 0;
    c.marked = true;
    c.markT = T.shells.mark.duration;
    if (!c.glows) {
      c.glows = [];
      c.model.traverse((o) => { if (o.isSkinnedMesh && !o.userData.isOutline) c.glows.push(o); });
      c.glows = c.glows.flatMap((o) => {
        const gl = addOutline(o, glowMat); gl.renderOrder = 9;
        if (!xrayMat) return [gl];
        const xr = new THREE.SkinnedMesh(o.geometry, xrayMat); xr.bind(o.skeleton, o.bindMatrix); xr.renderOrder = 10; xr.frustumCulled = false;
        o.parent.add(xr);
        return [gl, xr];
      });
    }
  }

  unmark(c) {
    c.marked = false;
    c.glows?.forEach((gl) => gl.parent?.remove(gl));
    c.glows = null;
    c.markT = undefined;
  }

  scald(c, amount) {
    if (!c.alive) return;
    c.heat += amount;
    if (c.heat > 1) { this.hit(c, c.pos.clone().setY(c.pos.y + 0.2), UP, 0.8, 'cooked'); return; }
    if (c.state !== 'scalded' && c.state !== 'stunned') {
      c.state = 'scalded';
      c.timer = 1.4;
      c.target = this.pickTarget(c);
      if (c.squeakT <= 0) { sfx.squeak(this.game.listenerDistance(c.pos)); c.squeakT = 0.3; }
    }
  }

  blast(center, R) {
    for (const c of this.list) {
      if (!c.alive) continue;
      const d = c.pos.distanceTo(center);
      if (d < R * 0.7) this.hit(c, c.pos.clone().setY(c.pos.y + 0.3), c.pos.clone().sub(center).normalize(), 1.4, 'explosion');
      else if (d < R * 1.6) this.knock(c, c.pos.clone().sub(center).setY(0).normalize().multiplyScalar(6 * (1 - d / (R * 1.6))));
    }
  }

  /** `custom`, if given, comes apart the jar in place of the usual burst of shards (a zandatsu cuts it into chunks instead). */
  hit(c, point, dir, power = 1, cause = 'shot', custom = null) {
    if (!c.alive) return;
    c.alive = false;
    this.dropJob(c);
    const game = this.game;
    const s = T.clappers.scale * (1 + Math.min(8, c.stash) * 0.045);
    game.physics.removeBody(c.body);
    game.scene.remove(c.root);
    c.mixer.stopAllAction();
    const P = prepProfile('clapper', s);
    const rot = new THREE.Quaternion().setFromAxisAngle(UP, c.heading);
    const vel = new THREE.Vector3(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(c.speed).add(c.kv);
    if (custom) custom(); else game.breakables.burst(P, new THREE.Color(PALETTE.mid), c.pos.clone(), rot, vel, new THREE.Vector3(), point, dir, power * 1.2, P.fullHeight);
    // the juicy part: Lachryma baubles
    const n = Math.round((T.lachryma.clapperDrop + c.stash) * (c.marked || c.state === 'stunned' ? 2 : 1));
    game.baubles?.spawn(c.pos.clone().setY(c.pos.y + 0.35), n);
    game.fx.embers(c.pos.clone().setY(c.pos.y + 0.3), 12);
    game.onClapper?.(c, cause || 'shot');
    this.list = this.list.filter((x) => x !== c);
    const floor = c.floor;
    game.fx.after(T.clappers.respawn, () => {
      const f = this.floors[floor];
      this.spawn(f.spawn.clone(), true, floor);
    });
  }

  clear() {
    for (const c of this.list) {
      if (c.alive) { this.game.physics.removeBody(c.body); this.game.scene.remove(c.root); }
    }
    this.list = [];
  }
}
