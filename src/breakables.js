import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { RAPIER, GROUPS } from './physics.js';
import { T, PALETTE } from './config.js';
import { addOutline } from './outline.js';
import { sfx } from './audio.js';

// Lathe profiles: [radius, height] from the base edge up to the rim (metres, before scale).
export const PROFILES = {
  jar: { pts: [[0.1, 0], [0.15, 0.04], [0.18, 0.14], [0.17, 0.25], [0.12, 0.32], [0.11, 0.36], [0.13, 0.38]], segs: 9, th: 0.016 },
  amphora: { pts: [[0.06, 0], [0.1, 0.05], [0.17, 0.18], [0.19, 0.32], [0.15, 0.46], [0.08, 0.54], [0.07, 0.62], [0.1, 0.66]], segs: 9, th: 0.016 },
  bowl: { pts: [[0.07, 0], [0.14, 0.03], [0.19, 0.08], [0.21, 0.13]], segs: 10, th: 0.014 },
  vase: { pts: [[0.07, 0], [0.11, 0.06], [0.12, 0.16], [0.08, 0.28], [0.06, 0.36], [0.09, 0.44]], segs: 8, th: 0.013 },
  cup: { pts: [[0.05, 0], [0.07, 0.03], [0.08, 0.1], [0.085, 0.14]], segs: 8, th: 0.011 },
  urn: { pts: [[0.18, 0], [0.26, 0.08], [0.34, 0.3], [0.35, 0.55], [0.28, 0.8], [0.2, 0.92], [0.19, 1.0], [0.24, 1.04]], segs: 11, th: 0.03 },
  pitcher: { pts: [[0.09, 0], [0.13, 0.05], [0.15, 0.16], [0.12, 0.28], [0.1, 0.34], [0.12, 0.4]], segs: 9, th: 0.014 },
  ember: { pts: [[0.12, 0], [0.2, 0.06], [0.25, 0.22], [0.24, 0.38], [0.16, 0.5], [0.12, 0.54], [0.14, 0.57]], segs: 10, th: 0.02 },
  plate: { pts: [[0.12, 0], [0.26, 0.02], [0.3, 0.05], [0.31, 0.07]], segs: 12, th: 0.02 },
};

const matCache = new Map();
function potMaterial(color, emissive = 0) {
  const k = `${color}_${emissive}`;
  if (!matCache.has(k)) {
    matCache.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0, flatShading: true, emissive, emissiveIntensity: emissive ? 1 : 0 }));
  }
  return matCache.get(k);
}
const shardMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, flatShading: true });
const glyphMat = new THREE.MeshBasicMaterial({ color: PALETTE.glow });
const ropeMat = new THREE.LineBasicMaterial({ color: PALETTE.deep });

// ---- profile helpers -------------------------------------------------------

function prepProfile(def, scale) {
  const pts = def.pts.map(([r, h]) => new THREE.Vector2(r * scale, h * scale));
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const rMax = Math.max(...pts.map((p) => p.x));
  const height = pts[pts.length - 1].y;
  return { pts, cum, len: cum[cum.length - 1], rMax, height, th: def.th * Math.sqrt(scale), segs: def.segs };
}

// point + outward 2D normal at arc-length u
function evalProfile(P, u) {
  const { pts, cum } = P;
  u = THREE.MathUtils.clamp(u, 0, P.len);
  let i = 1;
  while (i < pts.length - 1 && cum[i] < u) i++;
  const a = pts[i - 1], b = pts[i];
  const t = (u - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
  const p = new THREE.Vector2().lerpVectors(a, b, t);
  const tan = new THREE.Vector2().subVectors(b, a).normalize();
  const n = new THREE.Vector2(tan.y, -tan.x);
  if (n.x < 0) n.negate();
  return { p, n };
}

function ringParams(P) {
  const cell = (2 * Math.PI * P.rMax) / P.segs;
  const n = Math.max(2, Math.round(P.len / (cell * 0.85)));
  const us = [];
  for (let i = 0; i <= n; i++) us.push((P.len * i) / n);
  return us;
}

function lathePoint(prof, th, ang, inner) {
  const r = Math.max(0.004, prof.p.x - (inner ? prof.n.x * th : 0));
  const h = prof.p.y - (inner ? prof.n.y * th : 0) + (inner && prof.p.y < 1e-4 ? th : 0);
  return new THREE.Vector3(Math.cos(ang) * r, Math.max(inner ? th : 0, h), Math.sin(ang) * r);
}

// Intact pot geometry: outer skin, rim, inner skin, base caps.
function buildPotGeometry(P) {
  const us = ringParams(P);
  const S = P.segs;
  const pos = [];
  const idx = [];
  const ring = (inner) => {
    const start = pos.length / 3;
    for (const u of us) {
      const pr = evalProfile(P, u);
      for (let j = 0; j < S; j++) {
        const v = lathePoint(pr, P.th, (j / S) * Math.PI * 2, inner);
        pos.push(v.x, v.y, v.z);
      }
    }
    return start;
  };
  const o = ring(false), n = ring(true);
  const R = us.length;
  for (let i = 0; i < R - 1; i++) {
    for (let j = 0; j < S; j++) {
      const j1 = (j + 1) % S;
      const a = i * S + j, b = i * S + j1, c = (i + 1) * S + j1, d = (i + 1) * S + j;
      idx.push(o + a, o + d, o + c, o + a, o + c, o + b); // outer (ccw from outside)
      idx.push(n + a, n + c, n + d, n + a, n + b, n + c); // inner
    }
  }
  const top = (R - 1) * S;
  for (let j = 0; j < S; j++) {
    const j1 = (j + 1) % S;
    idx.push(o + top + j, o + top + j1, n + top + j1, o + top + j, n + top + j1, n + top + j);
  }
  const bc = pos.length / 3; pos.push(0, 0, 0);
  const ic = pos.length / 3; pos.push(0, P.th, 0);
  for (let j = 0; j < S; j++) {
    const j1 = (j + 1) % S;
    idx.push(bc, o + j, o + j1);
    idx.push(ic, n + j1, n + j);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function hullPoints(P) {
  const pts = [];
  for (const [i, u] of ringParams(P).entries()) {
    const pr = evalProfile(P, u);
    for (let j = 0; j < P.segs; j++) {
      const v = lathePoint(pr, 0, (j / P.segs) * Math.PI * 2 + (i % 2) * 0.01, false);
      pts.push(v.x, v.y, v.z);
    }
  }
  pts.push(0, 0, 0);
  return new Float32Array(pts);
}

// ---- manager ---------------------------------------------------------------

const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const UP = new THREE.Vector3(0, 1, 0);

export class Breakables {
  constructor(scene, physics, fx, game) {
    this.scene = scene;
    this.physics = physics;
    this.fx = fx;
    this.game = game;
    this.items = new Set();
    this.shards = [];
    this.debris = new Set(); // non-breakable dynamic props (crates, bricks) for explosions
    this.geoCache = new Map();

    physics.forceHandlers.push((h1, h2) => this.onForce(h1, h2));
    physics.collisionHandlers.push((h1, h2) => this.onCollision(h1, h2));
  }

  profile(kind, scale) {
    const k = `${kind}_${scale.toFixed(3)}`;
    if (!this.geoCache.has(k)) {
      const P = prepProfile(PROFILES[kind], scale);
      const geo = buildPotGeometry(P);
      this.geoCache.set(k, { P, geo, hull: hullPoints(P) });
    }
    return this.geoCache.get(k);
  }

  /**
   * def: { kind, pos:[x,y,z], scale, color, hp, ember, target, facing:[x,y,z], hang:{anchor:[x,y,z]}, respawn }
   */
  spawn(def) {
    const kind = def.ember ? 'ember' : def.kind;
    const scale = def.scale ?? 1;
    const { P, geo, hull } = this.profile(kind, scale);
    const color = def.color ?? (def.ember ? PALETTE.dark : PALETTE.pot);
    const mesh = new THREE.Mesh(geo, potMaterial(color));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    addOutline(mesh);
    if (def.ember) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(P.rMax * 1.01, P.rMax * 0.07, 3, P.segs), glyphMat);
      band.rotation.x = Math.PI / 2;
      band.position.y = P.height * 0.42;
      mesh.add(band);
      const band2 = band.clone();
      band2.position.y = P.height * 0.62;
      band2.scale.setScalar(0.93);
      mesh.add(band2);
    }
    this.scene.add(mesh);

    const rot = new THREE.Quaternion();
    if (def.facing) rot.setFromUnitVectors(UP, new THREE.Vector3(...def.facing).normalize());
    else rot.setFromAxisAngle(UP, Math.random() * Math.PI * 2);

    const fixed = !!def.target;
    const bd = (fixed ? RAPIER.RigidBodyDesc.fixed() : RAPIER.RigidBodyDesc.dynamic())
      .setTranslation(def.pos[0], def.pos[1], def.pos[2])
      .setRotation(rot)
      .setCanSleep(true);
    if (!fixed && !def.hang) bd.setSleeping(true);
    if (!fixed) bd.setAngularDamping(0.4).setLinearDamping(0.05);
    const body = this.physics.world.createRigidBody(bd);
    const cd = (RAPIER.ColliderDesc.convexHull(hull) || RAPIER.ColliderDesc.cylinder(P.height / 2, P.rMax))
      .setDensity(80)
      .setFriction(0.8)
      .setRestitution(0.1)
      .setCollisionGroups(GROUPS.prop)
      .setActiveEvents(RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS);
    const col = this.physics.world.createCollider(cd, body);
    col.setContactForceEventThreshold(body.mass() * 45);

    const ent = {
      type: 'breakable', def, kind, P, mesh, body, col, alive: true,
      hp: def.hp ?? (kind === 'urn' ? 180 : 100),
      size: Math.max(P.height, P.rMax * 2),
      prevVel: new THREE.Vector3(),
    };
    this.physics.register(col, ent);
    ent.sync = this.physics.addSynced(body, mesh);
    mesh.position.set(...def.pos);
    mesh.quaternion.copy(rot);

    if (def.hang) {
      const a = def.hang.anchor;
      const anchor = this.physics.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(a[0], a[1], a[2]));
      const top = P.height * 0.92;
      const len = a[1] - (def.pos[1] + top);
      const jd = RAPIER.JointData.spherical({ x: 0, y: 0, z: 0 }, { x: 0, y: top + len, z: 0 });
      this.physics.world.createImpulseJoint(jd, anchor, body, true);
      ent.anchorBody = anchor;
      ent.ropeTop = top;
      const lg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...a)]);
      ent.rope = new THREE.Line(lg, ropeMat);
      ent.rope.frustumCulled = false;
      this.scene.add(ent.rope);
      body.setRotation(new THREE.Quaternion(), true);
      mesh.quaternion.identity();
    }

    if (def.popIn) { mesh.scale.setScalar(0.01); ent.popIn = 0; }
    this.items.add(ent);
    return ent;
  }

  // non-breakable dynamic prop (crate, brick) that still reacts to blasts
  addDebris(body, mesh) {
    const ent = { type: 'prop', body, mesh };
    this.debris.add(ent);
    return ent;
  }

  damage(ent, amount, point, dir) {
    if (!ent.alive) return false;
    ent.hp -= amount;
    if (ent.hp > 0) {
      ent.body.applyImpulseAtPoint(_v.copy(dir).multiplyScalar(T.weapon.impulse), point, true);
      this.fx.impact(point, _v2.copy(dir).negate(), { color: PALETTE.pale, sparks: 3, dust: 8 });
      ent.mesh.material = potMaterial(new THREE.Color(ent.mesh.material.color).multiplyScalar(0.8).getHex());
      return false;
    }
    this.shatter(ent, point, dir, 1);
    return true;
  }

  // Remove the intact pot and replace it with physics shards.
  shatter(ent, hitPoint, dir, power = 1, cause = 'shot') {
    if (!ent.alive) return;
    ent.alive = false;
    this.items.delete(ent);

    const body = ent.body;
    const bt = body.translation(), br = body.rotation();
    const bodyPos = new THREE.Vector3(bt.x, bt.y, bt.z);
    const bodyRot = new THREE.Quaternion(br.x, br.y, br.z, br.w);
    const lv = body.linvel(), av = body.angvel();
    const linVel = new THREE.Vector3(lv.x, lv.y, lv.z);
    const angVel = new THREE.Vector3(av.x, av.y, av.z);
    const invRot = bodyRot.clone().invert();
    const color = ent.mesh.material.color.clone();
    const P = ent.P;

    this.physics.removeSynced(ent.sync);
    this.physics.removeBody(body);
    if (ent.anchorBody) this.physics.world.removeRigidBody(ent.anchorBody);
    if (ent.rope) { this.scene.remove(ent.rope); ent.rope.geometry.dispose(); }
    this.scene.remove(ent.mesh);

    const center = new THREE.Vector3(0, P.height * 0.45, 0).applyQuaternion(bodyRot).add(bodyPos);
    const hitLocal = (hitPoint ? hitPoint.clone() : center.clone()).sub(bodyPos).applyQuaternion(invRot);
    const dirN = (dir ? dir.clone() : new THREE.Vector3(0, -1, 0)).normalize();

    // Overloaded? make chunkier shards.
    const load = this.shards.length / T.shatter.maxShards;
    const maxChunk = T.shatter.maxChunk + (load > 0.5 ? 2 : 0) + (load > 0.8 ? 3 : 0);

    const pieces = fracturePieces(P, hitLocal, maxChunk);
    const fractureCol = new THREE.Color(PALETTE.fracture);
    for (const pc of pieces) this.spawnShard(pc, { bodyPos, bodyRot, linVel, angVel, center, hitPoint: hitPoint || center, dirN, power, color, fractureCol, size: ent.size });

    this.fx.shatterBurst(center, Math.max(0.5, ent.size * 2), dirN);
    const dist = this.game.listenerDistance(center);
    sfx.shatter(Math.max(0.4, ent.size * 2.2), dist);
    this.game.onBroken(ent, cause);

    if (ent.def.ember) {
      this.fx.after(0.03, () => this.explode(center));
    }
    if (ent.def.respawn) {
      this.fx.after(ent.def.respawn, () => this.spawn({ ...ent.def, popIn: true }));
    }
  }

  spawnShard(pc, ctx) {
    const { bodyPos, bodyRot, linVel, angVel, center, hitPoint, dirN, power, color, fractureCol } = ctx;
    const pts = pc.points;
    const c = new THREE.Vector3();
    for (const p of pts) c.add(p);
    c.divideScalar(pts.length);
    const local = pts.map((p) => p.clone().sub(c));
    let geo;
    try { geo = new ConvexGeometry(local); } catch { return; }
    if (!geo.attributes.position || geo.attributes.position.count < 4) return;
    // colour: outer (glazed) vs fresh fracture surfaces
    const innerSet = new Set(pc.innerKeys);
    const pa = geo.attributes.position;
    const cols = new Float32Array(pa.count * 3);
    for (let i = 0; i < pa.count; i++) {
      const k = keyOf(pa.getX(i) + c.x, pa.getY(i) + c.y, pa.getZ(i) + c.z);
      const col = innerSet.has(k) ? fractureCol : color;
      cols[i * 3] = col.r; cols[i * 3 + 1] = col.g; cols[i * 3 + 2] = col.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));

    const flat = new Float32Array(local.length * 3);
    local.forEach((p, i) => { flat[i * 3] = p.x; flat[i * 3 + 1] = p.y; flat[i * 3 + 2] = p.z; });
    const cd = RAPIER.ColliderDesc.convexHull(flat);
    if (!cd) { geo.dispose(); return; }

    const worldC = c.clone().applyQuaternion(bodyRot).add(bodyPos);
    const r = worldC.clone().sub(bodyPos);
    const vel = linVel.clone().add(new THREE.Vector3().crossVectors(angVel, r));
    const radial = worldC.clone().sub(center);
    const rl = radial.length() || 1;
    radial.divideScalar(rl);
    const nearHit = Math.max(0, 1 - worldC.distanceTo(hitPoint) / 0.6);
    vel.addScaledVector(radial, T.shatter.radialBurst * power * (0.6 + Math.random() * 0.8));
    vel.addScaledVector(dirN, T.shatter.bulletPush * power * (0.25 + nearHit) * (0.5 + Math.random()));
    vel.y += T.shatter.upBias * power * Math.random();

    const body = this.physics.world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(worldC.x, worldC.y, worldC.z)
        .setRotation(bodyRot)
        .setLinvel(vel.x, vel.y, vel.z)
        .setAngvel(new THREE.Vector3().randomDirection().multiplyScalar(T.shatter.spin * power * Math.random()))
        .setCcdEnabled(pc.small)
        .setLinearDamping(0.1)
        .setAngularDamping(0.5),
    );
    const col = this.physics.world.createCollider(
      cd.setDensity(900).setFriction(0.7).setRestitution(0.2).setCollisionGroups(GROUPS.debris)
        .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
      body,
    );
    const mesh = new THREE.Mesh(geo, shardMat);
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    if (T.shatter.shardOutlines) addOutline(mesh);
    mesh.position.copy(worldC);
    mesh.quaternion.copy(bodyRot);
    this.scene.add(mesh);
    const ent = { type: 'shard', body, mesh, age: 0, life: T.shatter.shardLife * (0.8 + Math.random() * 0.4) };
    ent.sync = this.physics.addSynced(body, mesh);
    this.physics.register(col, ent);
    this.shards.push(ent);
    while (this.shards.length > T.shatter.maxShards) this.removeShard(this.shards.shift());
  }

  removeShard(s) {
    this.physics.removeSynced(s.sync);
    this.physics.removeBody(s.body);
    this.scene.remove(s.mesh);
    s.mesh.geometry.dispose();
  }

  explode(center) {
    const R = T.explosion.radius;
    this.fx.explosion(center, R);
    sfx.explosion(this.game.listenerDistance(center));
    this.game.onExplosion(center, R);
    // chain-break nearby pots, staggered by distance for a rolling cascade
    for (const ent of [...this.items]) {
      const p = ent.body.translation();
      const d = _v.set(p.x, p.y, p.z).distanceTo(center);
      if (d < R * 0.75) {
        const dir = _v.clone().sub(center).normalize();
        const hp = _v.clone();
        this.fx.after(T.explosion.chainDelay * (d / R) * 3 + Math.random() * 0.03, () => this.shatter(ent, hp, dir, 1.4, 'explosion'));
      } else if (d < R) {
        this.push(ent.body, center, R);
      }
    }
    for (const s of this.shards) this.push(s.body, center, R);
    for (const d of this.debris) this.push(d.body, center, R);
  }

  push(body, center, R) {
    const p = body.translation();
    _v.set(p.x - center.x, p.y - center.y, p.z - center.z);
    const d = _v.length();
    if (d > R || d < 1e-3) return;
    const k = (1 - d / R) * T.explosion.velocity * body.mass();
    _v.divideScalar(d).multiplyScalar(k);
    _v.y += k * 0.35;
    body.applyImpulse(_v, true);
  }

  // Record velocities before the physics step so impact breaks use pre-collision speed.
  preStep() {
    for (const ent of this.items) {
      if (ent.body.isSleeping()) { ent.prevVel.set(0, 0, 0); continue; }
      const v = ent.body.linvel();
      ent.prevVel.set(v.x, v.y, v.z);
    }
  }

  onForce(h1, h2) {
    const e1 = this.physics.byCollider.get(h1), e2 = this.physics.byCollider.get(h2);
    if (e1?.type !== 'breakable' && e2?.type !== 'breakable') return;
    const v1 = e1?.prevVel || (e1?.body && !e1.body.isFixed() ? e1.body.linvel() : { x: 0, y: 0, z: 0 });
    const v2 = e2?.prevVel || (e2?.body && !e2.body.isFixed() ? e2.body.linvel() : { x: 0, y: 0, z: 0 });
    const rel = Math.hypot(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
    if (rel < T.shatter.breakSpeed) return;
    const massOf = (e) => (!e?.body || e.body.isFixed() ? Infinity : e.body.mass());
    for (const [e, v, o] of [[e1, v1, e2], [e2, v2, e1]]) {
      if (e?.type !== 'breakable' || !e.alive || e.def.target) continue;
      if (massOf(o) < 0.25 * e.body.mass()) continue; // light shards don't bust whole pots
      const dir = new THREE.Vector3(v.x, v.y, v.z);
      if (dir.lengthSq() < 0.01) dir.set(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z).multiplyScalar(e === e1 ? -1 : 1);
      const p = e.body.translation();
      const hp = new THREE.Vector3(p.x, p.y, p.z).addScaledVector(dir.clone().normalize(), e.size * 0.4);
      this.fx.after(0, () => this.shatter(e, hp, dir.normalize().multiplyScalar(0.4), Math.min(1.2, rel / 8), 'impact'));
    }
  }

  onCollision(h1, h2) {
    for (const h of [h1, h2]) {
      const e = this.physics.byCollider.get(h);
      if (!e || (e.type !== 'shard' && e.type !== 'casing')) continue;
      const v = e.body.linvel();
      const sp = Math.hypot(v.x, v.y, v.z);
      if (sp < 1.2) continue;
      const p = e.body.translation();
      const dist = this.game.listenerDistance(_v.set(p.x, p.y, p.z));
      if (e.type === 'shard') sfx.clink(sp, dist);
      else sfx.casing(dist);
      return;
    }
  }

  update(dt) {
    for (const ent of this.items) {
      if (ent.rope) {
        const a = ent.def.hang.anchor;
        const pa = ent.rope.geometry.attributes.position;
        _v.set(0, ent.ropeTop, 0).applyQuaternion(ent.mesh.quaternion).add(ent.mesh.position);
        pa.setXYZ(0, a[0], a[1], a[2]);
        pa.setXYZ(1, _v.x, _v.y, _v.z);
        pa.needsUpdate = true;
      }
      if (ent.popIn !== undefined) {
        ent.popIn = Math.min(1, ent.popIn + dt * 4);
        const t = ent.popIn;
        ent.mesh.scale.setScalar(1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2)); // easeOutBack
        if (t >= 1) { ent.mesh.scale.setScalar(1); delete ent.popIn; }
      }
      if (ent.mesh.position.y < -20) this.shatter(ent, null, null, 0.1);
    }
    for (let i = this.shards.length - 1; i >= 0; i--) {
      const s = this.shards[i];
      s.age += dt;
      const fade = s.life - s.age;
      if (fade < 0.6) {
        s.mesh.scale.setScalar(Math.max(0.01, fade / 0.6));
        if (fade <= 0) { this.removeShard(s); this.shards.splice(i, 1); }
      }
    }
  }

  clear() {
    for (const ent of this.items) {
      this.physics.removeSynced(ent.sync);
      this.physics.removeBody(ent.body);
      if (ent.anchorBody) this.physics.world.removeRigidBody(ent.anchorBody);
      if (ent.rope) this.scene.remove(ent.rope);
      this.scene.remove(ent.mesh);
    }
    this.items.clear();
    for (const s of this.shards) this.removeShard(s);
    this.shards.length = 0;
  }
}

// ---- fracture --------------------------------------------------------------

function keyOf(x, y, z) { return `${Math.round(x * 2000)},${Math.round(y * 2000)},${Math.round(z * 2000)}`; }

/**
 * Splits a lathe pot into convex pieces. The outer surface is sampled on a
 * jittered (ring x segment) grid, cells are cut into triangles along random
 * diagonals, and neighbouring triangles are grouped into shards. Each shard is
 * the convex hull of its outer points + the matching inner-wall points.
 */
function fracturePieces(P, hitLocal, maxChunk) {
  const S = P.segs;
  const us = ringParams(P);
  const R = us.length;
  const du = P.len / (R - 1);
  const dA = (Math.PI * 2) / S;
  const outer = [], inner = [];
  const ringOffset = Math.random() * dA;
  for (let i = 0; i < R; i++) {
    for (let j = 0; j < S; j++) {
      const edge = i === 0 || i === R - 1;
      const u = us[i] + (edge ? 0 : (Math.random() - 0.5) * 0.6 * du);
      const ang = ringOffset + j * dA + (i === 0 ? 0 : (Math.random() - 0.5) * 0.5 * dA);
      const pr = evalProfile(P, u);
      outer.push(lathePoint(pr, P.th, ang, false));
      inner.push(lathePoint(pr, P.th, ang, true));
    }
  }
  const V = (i, j) => i * S + ((j + S) % S);

  // triangles, tagged by column so shards don't wrap too far around the curve
  const tris = [];
  for (let i = 0; i < R - 1; i++) {
    for (let j = 0; j < S; j++) {
      const a = V(i, j), b = V(i, j + 1), c = V(i + 1, j + 1), d = V(i + 1, j);
      if (Math.random() < 0.5) { tris.push({ v: [a, b, c], col: j }, { v: [a, c, d], col: j }); }
      else { tris.push({ v: [a, b, d], col: j }, { v: [b, c, d], col: j }); }
    }
  }
  const edgeMap = new Map();
  tris.forEach((t, ti) => {
    for (let e = 0; e < 3; e++) {
      const x = t.v[e], y = t.v[(e + 1) % 3];
      const k = x < y ? `${x}_${y}` : `${y}_${x}`;
      if (!edgeMap.has(k)) edgeMap.set(k, []);
      edgeMap.get(k).push(ti);
    }
  });
  const neighbours = (ti) => {
    const t = tris[ti], out = [];
    for (let e = 0; e < 3; e++) {
      const x = t.v[e], y = t.v[(e + 1) % 3];
      for (const o of edgeMap.get(x < y ? `${x}_${y}` : `${y}_${x}`)) if (o !== ti) out.push(o);
    }
    return out;
  };
  const allowWrap = S >= 12 ? 1 : 0;
  const colDist = (a, b) => { const d = Math.abs(a - b) % S; return Math.min(d, S - d); };

  const assigned = new Int32Array(tris.length).fill(-1);
  const order = [...tris.keys()].sort(() => Math.random() - 0.5);
  const groups = [];
  const nearR = P.rMax * 0.9;
  for (const seed of order) {
    if (assigned[seed] >= 0) continue;
    const t0 = tris[seed];
    const cen = outer[t0.v[0]].clone().add(outer[t0.v[1]]).add(outer[t0.v[2]]).divideScalar(3);
    const near = cen.distanceTo(hitLocal) < nearR;
    const target = near ? 1 : 1 + Math.floor(Math.random() * maxChunk);
    const g = [seed];
    assigned[seed] = groups.length;
    for (let k = 0; k < g.length && g.length < target; k++) {
      for (const nb of neighbours(g[k])) {
        if (g.length >= target) break;
        if (assigned[nb] >= 0 || colDist(tris[nb].col, t0.col) > allowWrap) continue;
        assigned[nb] = groups.length;
        g.push(nb);
      }
    }
    groups.push(g);
  }

  const pieces = [];
  for (const g of groups) {
    const vs = new Set();
    for (const ti of g) for (const v of tris[ti].v) vs.add(v);
    const points = [], innerKeys = [];
    for (const v of vs) {
      points.push(outer[v].clone(), inner[v].clone());
      innerKeys.push(keyOf(inner[v].x, inner[v].y, inner[v].z));
    }
    pieces.push({ points, innerKeys, small: g.length === 1 });
  }
  // base: split into 1-3 wedges
  const wedges = S >= 9 && Math.random() < 0.7 ? 2 + (Math.random() < 0.3 ? 1 : 0) : 1;
  const per = Math.ceil(S / wedges);
  for (let w = 0; w < wedges; w++) {
    const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, P.th, 0)];
    const innerKeys = [keyOf(0, P.th, 0)];
    const end = wedges === 1 ? S : Math.min(S, (w + 1) * per);
    for (let j = w * per; j <= end; j++) {
      const v = V(0, j);
      points.push(outer[v].clone(), inner[v].clone());
      innerKeys.push(keyOf(inner[v].x, inner[v].y, inner[v].z));
    }
    pieces.push({ points, innerKeys, small: false });
  }
  return pieces;
}
