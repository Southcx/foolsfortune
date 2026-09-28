import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { RAPIER, G, groups } from './physics.js';
import { T, PALETTE } from './config.js';
import { addOutline } from './outline.js';
import { prepProfile } from './pottery.js';
import { sfx } from './audio.js';

// Clapperjars: little clay figments that scurry around the workshop floor.
// They wander, stumble and bolt when a shot lands near them, shatter when hit,
// and hop back out of the kiln a few seconds later.

const UP = new THREE.Vector3(0, 1, 0);
const KILN_MOUTH = new THREE.Vector3(0, 0, 9.9);
const FLOOR = { x0: -5.9, x1: 5.9, z0: -13.5, z1: 9.2 };
const RADIUS = 0.2, HALF = 0.12;
const CLAPPER_GROUPS = groups(G.PROP, 0xffff);
const QUERY = groups(0xffff, G.STATIC | G.PROP | G.PLAYER);
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

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
    this.mat = new THREE.MeshStandardMaterial({ color: PALETTE.potLight, roughness: 0.75, flatShading: true });
    this.eyeMat = new THREE.MeshBasicMaterial({ color: PALETTE.outline });
    this.clips = Object.fromEntries(gltf.animations.map((c) => [c.name.replace('clapper_', ''), c]));
  }

  spawnAll() {
    const spots = [[-3, -2], [3, -2], [0, -6.5], [2.5, 5.8], [-3.5, 3], [0, 7]];
    for (let i = 0; i < T.clappers.count; i++) {
      const [x, z] = spots[i % spots.length];
      this.spawn(new THREE.Vector3(x, 0, z), false);
    }
  }

  spawn(pos, fromKiln) {
    const game = this.game;
    const root = new THREE.Group();
    const model = cloneSkinned(this.gltf.scene);
    const meshes = [];
    model.traverse((o) => { if (o.isMesh) meshes.push(o); });
    for (const o of meshes) {
      o.material = this.mat;
      o.castShadow = true;
      o.frustumCulled = false;
      addOutline(o);
    }
    // the eye texture didn't come across, so give it two beady eyes
    const eyesBone = model.getObjectByName('eyes');
    if (eyesBone) {
      for (const x of [-0.055, 0.055]) {
        const e = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 4), this.eyeMat);
        e.scale.set(1, 1.5, 0.6);
        e.position.set(x, 0.01, 0.0);
        eyesBone.add(e);
      }
    }
    root.add(model);
    root.scale.setScalar(T.clappers.scale);
    game.scene.add(root);

    const mixer = new THREE.AnimationMixer(model);
    const actions = {};
    for (const [k, clip] of Object.entries(this.clips)) actions[k] = mixer.clipAction(clip);
    if (actions.stumble) { actions.stumble.setLoop(THREE.LoopOnce, 1); actions.stumble.clampWhenFinished = true; }

    const w = game.physics.world;
    const s = T.clappers.scale;
    const body = w.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(pos.x, pos.y + (HALF + RADIUS) * s, pos.z));
    const col = w.createCollider(RAPIER.ColliderDesc.capsule(HALF * s, RADIUS * s).setCollisionGroups(CLAPPER_GROUPS), body);
    const c = {
      type: 'clapper', root, model, mixer, actions, body, col, alive: true,
      pos: pos.clone(), prevPos: pos.clone(), vy: fromKiln ? 3.2 : 0, heading: fromKiln ? Math.PI : Math.random() * Math.PI * 2,
      state: 'idle', timer: 0.3 + Math.random(), target: null, speed: 0, current: null, stuckT: 0, lastPos: pos.clone(),
      squeakT: 0,
    };
    game.physics.register(col, c);
    this.play(c, 'idle', 0);
    if (fromKiln) {
      sfx.pop(game.listenerDistance(pos));
      c.state = 'run';
      c.target = this.pickTarget(c) || new THREE.Vector3(0, 0, 5);
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

  // a random reachable spot on the open floor (vertical probe + swept path check)
  pickTarget(c, away) {
    const w = this.game.physics.world;
    const ball = new RAPIER.Ball(RADIUS * T.clappers.scale);
    for (let i = 0; i < 14; i++) {
      let p;
      if (away && i < 8) {
        const d = c.pos.clone().sub(away).setY(0).normalize().applyAxisAngle(UP, (Math.random() - 0.5) * 1.6);
        p = c.pos.clone().addScaledVector(d, 3 + Math.random() * 3);
      } else {
        p = new THREE.Vector3(THREE.MathUtils.lerp(FLOOR.x0, FLOOR.x1, Math.random()), 0, THREE.MathUtils.lerp(FLOOR.z0, FLOOR.z1, Math.random()));
      }
      if (p.x < FLOOR.x0 || p.x > FLOOR.x1 || p.z < FLOOR.z0 || p.z > FLOOR.z1) continue;
      const down = this.game.physics.raycast({ x: p.x, y: 3, z: p.z }, { x: 0, y: -1, z: 0 }, 4, c.col);
      if (!down || down.point.y > 0.05) continue;
      const from = c.pos.clone().setY(0.4);
      const to = p.clone().setY(0.4);
      const d = to.clone().sub(from);
      const len = d.length();
      if (len < 1) continue;
      d.divideScalar(len);
      const hit = w.castShape(from, { x: 0, y: 0, z: 0, w: 1 }, d, ball, 0, len, true, undefined, groups(0xffff, G.STATIC), c.col);
      if (hit) continue;
      return p;
    }
    return null;
  }

  // AI + movement, run inside the fixed physics step (the controller needs
  // the collider's current position, which only updates when physics steps)
  fixedUpdate(dt) {
    const C = T.clappers;
    for (const c of this.list) {
      if (!c.alive) continue;
      c.prevPos.copy(c.pos);
      c.timer -= dt;
      c.squeakT -= dt;
      let wantSpeed = 0;
      switch (c.state) {
        case 'idle':
          if (c.timer <= 0) {
            c.target = this.pickTarget(c);
            if (c.target) { c.state = 'run'; c.stuckT = 0; } else c.timer = 0.5;
          }
          break;
        case 'stumble':
          wantSpeed = 0.6;
          if (c.timer <= 0) { c.state = 'flee'; c.target = this.pickTarget(c, c.threat) || this.pickTarget(c); c.timer = 3; }
          break;
        case 'run':
        case 'flee':
          wantSpeed = c.state === 'flee' ? C.fleeSpeed : C.runSpeed;
          if (!c.target || c.pos.distanceTo(c.target) < 0.5 || (c.state === 'flee' && c.timer <= 0)) {
            c.state = 'idle';
            c.timer = 0.6 + Math.random() * 2;
            c.target = null;
          }
          break;
        default: break;
      }
      c.speed = THREE.MathUtils.damp(c.speed, wantSpeed, 8, dt);
      // steer
      if (c.target && c.state !== 'idle') {
        const want = Math.atan2(c.target.x - c.pos.x, c.target.z - c.pos.z);
        c.heading += wrap(want - c.heading) * (1 - Math.exp(-10 * dt));
      }
      const fwd = new THREE.Vector3(Math.sin(c.heading), 0, Math.cos(c.heading));
      c.vy -= 14 * dt;
      const desired = { x: fwd.x * c.speed * dt, y: c.vy * dt, z: fwd.z * c.speed * dt };
      this.ctrl.computeColliderMovement(c.col, desired, RAPIER.QueryFilterFlags.EXCLUDE_SENSORS, QUERY);
      const mv = this.ctrl.computedMovement();
      if (this.ctrl.computedGrounded() && c.vy < 0) c.vy = 0;
      c.pos.x += mv.x; c.pos.y += mv.y; c.pos.z += mv.z;
      if (c.pos.y < -5) c.pos.copy(KILN_MOUTH);
      c.body.setNextKinematicTranslation({ x: c.pos.x, y: c.pos.y + (HALF + RADIUS) * C.scale, z: c.pos.z });
      // stuck? pick somewhere else
      if (c.speed > 1) {
        c.stuckT += dt;
        if (c.stuckT > 0.5) {
          if (c.pos.distanceTo(c.lastPos) < c.speed * 0.5 * 0.3) { c.target = this.pickTarget(c); if (!c.target) c.state = 'idle'; }
          c.stuckT = 0;
          c.lastPos.copy(c.pos);
        }
      }
    }
  }

  // per render frame: animation + interpolated placement
  update(dt, alpha) {
    const C = T.clappers;
    for (const c of this.list) {
      if (!c.alive) continue;
      if (c.state === 'stumble') this.play(c, 'stumble', 0.08);
      else if (c.speed > 0.8) {
        this.play(c, 'sprint', 0.12);
        c.actions.sprint.timeScale = 0.55 * (c.speed / C.runSpeed) + 0.25;
      } else this.play(c, 'idle', 0.2);
      c.mixer.update(dt);
      c.root.position.lerpVectors(c.prevPos, c.pos, alpha);
      c.root.rotation.y = c.heading;
    }
  }

  // a shot landed nearby: stumble, squeak, then bolt away
  spook(point, radius = T.clappers.spookRadius) {
    for (const c of this.list) {
      if (!c.alive || c.state === 'stumble') continue;
      const d = c.pos.distanceTo(point);
      if (d > radius) continue;
      c.state = 'stumble';
      c.timer = 0.4;
      c.threat = point.clone();
      c.heading = Math.atan2(c.pos.x - point.x, c.pos.z - point.z);
      if (c.squeakT <= 0) { sfx.squeak(this.game.listenerDistance(c.pos)); c.squeakT = 0.6; }
    }
  }

  blast(center, R) {
    for (const c of this.list) {
      if (!c.alive) continue;
      const d = c.pos.distanceTo(center);
      if (d < R * 0.7) this.hit(c, c.pos.clone().setY(0.3), c.pos.clone().sub(center).normalize(), 1.4);
      else if (d < R * 1.6) this.spook(center, R * 1.6);
    }
  }

  hit(c, point, dir, power = 1) {
    if (!c.alive) return;
    c.alive = false;
    const game = this.game;
    const s = T.clappers.scale;
    game.physics.removeBody(c.body);
    game.scene.remove(c.root);
    c.mixer.stopAllAction();
    const P = prepProfile('clapper', s);
    const rot = new THREE.Quaternion().setFromAxisAngle(UP, c.heading);
    const vel = new THREE.Vector3(Math.sin(c.heading), 0, Math.cos(c.heading)).multiplyScalar(c.speed);
    game.breakables.burst(P, new THREE.Color(PALETTE.potLight), c.pos.clone(), rot, vel, new THREE.Vector3(), point, dir, power * 1.2, P.fullHeight);
    game.fx.embers(c.pos.clone().setY(0.3), 12);
    game.onClapper?.(c);
    this.list = this.list.filter((x) => x !== c);
    game.fx.after(T.clappers.respawn, () => this.spawn(KILN_MOUTH.clone(), true));
  }

  clear() {
    for (const c of this.list) {
      if (c.alive) { this.game.physics.removeBody(c.body); this.game.scene.remove(c.root); }
    }
    this.list = [];
  }
}
