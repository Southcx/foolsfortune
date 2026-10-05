import * as THREE from 'three';
import { RAPIER, GROUPS, G, groups } from '../../core/physics.js';
import { PALETTE } from '../../core/config.js';
import { addOutline } from '../../render/outline.js';
import { sfx } from '../../audio/sfx.js';
import { stream } from '../../core/rng.js';
const simRand = stream('world/props/movers'); // (the simulation's chance: core/rng.js, the same twice)

// ---------------------------------------------------------------------------
// Moving ground: the clockwork the mill is made of.
//
// A Mover is a kinematic body driven by a pose function of time. The player standing on
// one is carried (Player.move adds the platform's displacement under the feet to the
// step), and leaving the ground - a jump, a walk-off, a blink - keeps the platform's
// velocity, so a jump from a shuttle goes further and a step off a lift keeps rising.
// The core controller only ever sees `carry`: with none, nothing changes.
//
// Order in the fixed step (main.js):
//   movers.pre(dt)     each mover works out where it will be, queues it on its body
//   player.fixedUpdate the player reads mover.displacement(point) for its carry
//   physics.step       bodies move
//   movers.post()      poses roll over; anything a platform now overlaps is pushed out
//
// Rendering interpolates between the last two poses with the same alpha the player uses,
// so riders don't shimmer against the platform.
// ---------------------------------------------------------------------------

export const BRASS = 0xb98a3f;
export const STONE = 0xc9b8a4;

const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const ONE = new THREE.Vector3(1, 1, 1);
const YAXIS = new THREE.Vector3(0, 1, 0);
const WHITE = new THREE.Color(0xffffff);
const _bm = new THREE.Matrix4(), _bl = new THREE.Matrix4(), _p2 = new THREE.Vector3(), _q2 = new THREE.Quaternion(), _s2 = new THREE.Vector3();
const PLAYER_ONLY = groups(0xffff, G.PLAYER); // (a query that can see the player's collider)
const ease = (u) => u * u * (3 - 2 * u);

/** 0..1 back and forth: dwell at each end, `move` seconds each way, smoothstep between. */
export function pingpong(t, move, dwell) {
  const T = 2 * (move + dwell);
  const s = ((t % T) + T) % T;
  if (s < dwell) return 0;
  if (s < dwell + move) return ease((s - dwell) / move);
  if (s < 2 * dwell + move) return 1;
  return 1 - ease((s - 2 * dwell - move) / move);
}

// ---- gear geometry (in the XZ plane, thickness along y; a tooth at angle b points along (cos b, 0, -sin b)) ----
export function gearGeometry({ R, teeth = 12, tooth = 0.3, thick = 0.4, hole = 0, windows = 0, rim = 0.25 }) {
  const sh = new THREE.Shape();
  const Rr = R - tooth / 2, Rt = R + tooth / 2, p = (Math.PI * 2) / teeth;
  const pt = (r, b) => [Math.cos(b) * r, Math.sin(b) * r];
  if (teeth < 3) {
    sh.absarc(0, 0, R, 0, Math.PI * 2, false);
  } else {
    for (let i = 0; i < teeth; i++) {
      const b = i * p;
      const pts = [pt(Rr, b - 0.32 * p), pt(Rt, b - 0.16 * p), pt(Rt, b + 0.16 * p), pt(Rr, b + 0.32 * p), pt(Rr, b + 0.5 * p)];
      pts.forEach(([x, y], k) => (i === 0 && k === 0 ? sh.moveTo(x, y) : sh.lineTo(x, y)));
    }
    sh.closePath();
  }
  if (hole > 0) {
    const h = new THREE.Path();
    h.absarc(0, 0, hole, 0, Math.PI * 2, true);
    sh.holes.push(h);
  }
  // spoked windows between a hub and the rim
  for (let i = 0; i < windows; i++) {
    const a0 = (i / windows) * Math.PI * 2 + 0.12, a1 = ((i + 1) / windows) * Math.PI * 2 - 0.12;
    const r0 = Math.max(hole + 0.25, R * 0.28), r1 = Rr - rim;
    if (r1 <= r0 + 0.2) continue;
    const w = new THREE.Path();
    w.moveTo(...pt(r0, a0));
    w.absarc(0, 0, r0, a0, a1, false);
    w.lineTo(...pt(r1, a1));
    w.absarc(0, 0, r1, a1, a0, true);
    w.closePath();
    sh.holes.push(w);
  }
  const g = new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: false, curveSegments: 6 });
  g.translate(0, 0, -thick / 2);
  g.rotateX(-Math.PI / 2);
  return g;
}

export class Mover {
  constructor(mgr, { pos = [0, 0, 0], quat = null, name = '' } = {}) {
    this.mgr = mgr;
    this.name = name;
    this.group = new THREE.Group();
    mgr.scene.add(this.group);
    this.colliders = [];
    this.radius = 1; // bounding sphere (push-out and ride queries skip far movers)
    this.surface = null; // a belt's surface velocity (world)
    this.target = null; // { hits, ... } if it's something to hit
    this.cur = { p: new THREE.Vector3(...pos), q: quat ? quat.clone() : new THREE.Quaternion() };
    this.prev = { p: this.cur.p.clone(), q: this.cur.q.clone() };
    this.next = { p: this.cur.p.clone(), q: this.cur.q.clone() };
    this.curM = new THREE.Matrix4();
    this.nextM = new THREE.Matrix4();
    this.curInv = new THREE.Matrix4();
    this.speed = 0; // m/s of the origin over the last step
    this.hold = 0; // seconds spent held up by something in the way (the motion carries on from where it stopped)
    this.body = mgr.physics.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(pos[0], pos[1], pos[2]).setRotation({ x: this.cur.q.x, y: this.cur.q.y, z: this.cur.q.z, w: this.cur.q.w }));
    this.refresh();
    this.render(1);
  }

  // ---- building ----
  mat(color) { return this.mgr.mat(color); }

  mesh(geo, color, at = [0, 0, 0], { outline = true, rot = null } = {}) {
    const m = new THREE.Mesh(geo, this.mat(color));
    m.position.set(...at);
    if (rot) m.rotation.set(...rot);
    m.castShadow = true; m.receiveShadow = true;
    this.group.add(m);
    if (outline) addOutline(m);
    return m;
  }

  box(size, color, at = [0, 0, 0], { collide = true, outline = true, rot = null } = {}) {
    const m = this.mesh(new THREE.BoxGeometry(...size), color, at, { outline, rot });
    if (collide) this.collider(RAPIER.ColliderDesc.cuboid(size[0] / 2, size[1] / 2, size[2] / 2).setTranslation(...at));
    return m;
  }

  cylinder(r, h, color, at = [0, 0, 0], { collide = true, segs = 20, outline = true, visual = true } = {}) {
    const m = visual ? this.mesh(new THREE.CylinderGeometry(r, r, h, segs), color, at, { outline }) : null;
    if (collide) this.collider(RAPIER.ColliderDesc.cylinder(h / 2, r).setTranslation(...at));
    return m;
  }

  collider(desc) {
    const c = this.mgr.physics.world.createCollider(desc.setCollisionGroups(GROUPS.static).setFriction(0.9), this.body);
    this.mgr.physics.register(c, { type: 'mover', mover: this });
    this.colliders.push(c);
    return c;
  }

  // ---- motion ----
  /** Put the mover at its pose for the manager's current time (subclasses call this once set up). */
  snap() {
    this.pose(this.mgr.time - this.hold, this.cur.p, this.cur.q);
    this.cur.q.normalize();
    this.prev.p.copy(this.cur.p); this.prev.q.copy(this.cur.q);
    this.next.p.copy(this.cur.p); this.next.q.copy(this.cur.q);
    this.body.setTranslation({ x: this.cur.p.x, y: this.cur.p.y, z: this.cur.p.z }, true);
    this.body.setRotation({ x: this.cur.q.x, y: this.cur.q.y, z: this.cur.q.z, w: this.cur.q.w }, true);
    this.refresh();
    this.render(1);
  }

  /** Override: fill p, q with the pose at time t. */
  pose(t, p, q) { p.copy(this.cur.p); q.copy(this.cur.q); }

  refresh() {
    this.curM.compose(this.cur.p, this.cur.q, ONE);
    this.nextM.compose(this.next.p, this.next.q, ONE);
    this.curInv.copy(this.curM).invert();
  }

  /**
   * Before the physics step: aim the body at the pose for the end of it. `blocked(m)` says whether
   * that pose would put it through the player; if so it waits where it is (like a lift's safety
   * edge) and picks its motion up again from there.
   */
  pre(t, dt, blocked) {
    this.dt = dt;
    this.pose(t + dt - this.hold, this.next.p, this.next.q);
    this.next.q.normalize();
    if (blocked && blocked(this)) {
      this.hold += dt;
      this.next.p.copy(this.cur.p); this.next.q.copy(this.cur.q);
      this.held = true;
    } else this.held = false;
    this.speed = _p.subVectors(this.next.p, this.cur.p).length() / dt;
    this.body.setNextKinematicTranslation({ x: this.next.p.x, y: this.next.p.y, z: this.next.p.z });
    this.body.setNextKinematicRotation({ x: this.next.q.x, y: this.next.q.y, z: this.next.q.z, w: this.next.q.w });
    this.refresh();
  }

  /** After the physics step: the body is at `next` now. */
  post() {
    this.prev.p.copy(this.cur.p); this.prev.q.copy(this.cur.q);
    this.cur.p.copy(this.next.p); this.cur.q.copy(this.next.q);
    this.next.p.copy(this.cur.p); this.next.q.copy(this.cur.q);
    this.refresh();
  }

  /** How far a point riding on this (world, now) moves over the coming step. */
  displacement(point, out = new THREE.Vector3()) {
    out.copy(point).applyMatrix4(this.curInv).applyMatrix4(this.nextM).sub(point);
    if (this.surface && this.dt) out.addScaledVector(this.surface, this.dt);
    return out;
  }

  velocityAt(point, out = new THREE.Vector3()) {
    return this.displacement(point, out).divideScalar(this.dt || 1 / 60);
  }

  /** A point given in the mover's local space, in world space now. */
  toWorld(local, out = new THREE.Vector3()) { return out.copy(local).applyMatrix4(this.curM); }
  toLocal(world, out = new THREE.Vector3()) { return out.copy(world).applyMatrix4(this.curInv); }

  render(alpha) {
    this.group.position.lerpVectors(this.prev.p, this.cur.p, alpha);
    this.group.quaternion.slerpQuaternions(this.prev.q, this.cur.q, alpha);
  }

  tick() {}

  /** Something hit this (shot, slam, hard landing): targets react. */
  hit(info) { return this.mgr.hitTarget(this, info); }
}

// ---- a straight-line shuttle (lifts, sliders, gates, rail carts) ----
export class Shuttle extends Mover {
  constructor(mgr, o) {
    super(mgr, o);
    this.a = new THREE.Vector3(...o.pos);
    this.b = new THREE.Vector3(...o.pos).add(new THREE.Vector3(...o.to));
    this.move = o.move ?? 4;
    this.dwell = o.dwell ?? 1;
    this.offset = o.offset ?? 0;
    this.loop = o.loop ?? false; // continuous a -> b -> a with no dwell handled by pingpong dwell 0
    this.radius = 4 + this.a.distanceTo(this.b) / 2;
    this.snap();
  }

  pose(t, p, q) {
    p.lerpVectors(this.a, this.b, pingpong(t + this.offset, this.move, this.dwell));
  }

  /** 0..1 along the run at time t. */
  frac(t) { return pingpong(t + this.offset, this.move, this.dwell); }
}

// ---- a spinning platform / gear about a vertical axis ----
export class Cog extends Mover {
  constructor(mgr, o) {
    super(mgr, o);
    this.w = o.w ?? 0.6; // rad/s about +y
    this.phase = o.phase ?? 0;
    this.R = o.R;
    this.radius = o.R + 1;
    this.center = new THREE.Vector3(...o.pos);
    this.snap();
  }

  pose(t, p, q) {
    p.copy(this.center);
    q.setFromAxisAngle(YAXIS, this.phase + this.w * t);
  }

  /** Angle now (direction (cos g, 0, -sin g)). */
  angle(t) { return this.phase + this.w * t; }
}

// ---- pendulum: swings about a horizontal axis through `pivot`; the platform hangs `len` below ----
export class Swing extends Mover {
  constructor(mgr, o) {
    super(mgr, o);
    this.pivot = new THREE.Vector3(...o.pivot);
    this.len = o.len;
    this.amp = (o.amp ?? 25) * Math.PI / 180;
    this.period = o.period ?? 5;
    this.offset = o.offset ?? 0;
    this.axis = new THREE.Vector3(...(o.axis ?? [0, 0, 1])).normalize(); // swings in the plane perpendicular to this
    this.radius = o.len + 4;
    this.snap();
  }

  pose(t, p, q) {
    const th = this.amp * Math.sin(((t + this.offset) / this.period) * Math.PI * 2);
    q.setFromAxisAngle(this.axis, th);
    p.set(0, -this.len, 0).applyQuaternion(q).add(this.pivot);
  }
}

// ---- a point moving on a circle in a vertical plane without turning (a wheel's gondola) ----
export class Orbiter extends Mover {
  constructor(mgr, o) {
    super(mgr, o);
    this.center = new THREE.Vector3(...o.center);
    this.r = o.r;
    this.w = o.w ?? 0.25;
    this.a0 = o.a0 ?? 0;
    this.u = new THREE.Vector3(...(o.u ?? [1, 0, 0]));
    this.v = new THREE.Vector3(...(o.v ?? [0, 1, 0]));
    this.radius = 6;
    this.snap();
  }

  pose(t, p, q) {
    const a = this.a0 + this.w * t;
    p.copy(this.center).addScaledVector(this.u, Math.cos(a) * this.r).addScaledVector(this.v, Math.sin(a) * this.r);
    q.identity();
  }
}

// ---- a conveyor: fixed, but the surface moves ----
export class Belt extends Mover {
  constructor(mgr, o) {
    super(mgr, o);
    this.surface = new THREE.Vector3(...o.vel);
    this.radius = Math.max(...o.size) + 2;
    this.size = o.size;
  }
}

Belt.prototype.build = function build(color = PALETTE.dark, stripe = PALETTE.pale) {
  const [w, h, d] = this.size;
  const c = document.createElement('canvas');
  c.width = 64; c.height = 8;
  const g = c.getContext('2d');
  g.fillStyle = `#${new THREE.Color(color).getHexString()}`; g.fillRect(0, 0, 64, 8);
  g.fillStyle = `#${new THREE.Color(stripe).getHexString()}`; g.fillRect(0, 0, 8, 8); g.fillRect(32, 0, 8, 8);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.NearestFilter;
  tex.repeat.set(w / 2, 1);
  this.tex = tex;
  const top = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, flatShading: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const side = this.mat(color);
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, top, side, side, side]);
  m.castShadow = true; m.receiveShadow = true;
  this.group.add(m);
  addOutline(m);
  this.collider(RAPIER.ColliderDesc.cuboid(w / 2, h / 2, d / 2));
  return this;
};
Belt.prototype.tick = function tick(dt) {
  if (this.tex) this.tex.offset.x -= (this.surface.x * dt) / 2; // (x-axis belts: one texture repeat is 2 m)
};

// ---- something that only turns (visual gears, shafts, wheels): no collider ----
export class Spinner {
  constructor(mgr, mesh, axis, w, phase = 0) {
    this.mgr = mgr; this.mesh = mesh; this.axis = axis.clone().normalize(); this.w = w; this.phase = phase;
    this.base = mesh.quaternion.clone();
    this.q0 = new THREE.Quaternion();
  }
  render(alpha, t) {
    this.q0.setFromAxisAngle(this.axis, this.phase + this.w * t);
    this.mesh.quaternion.copy(this.base).multiply(this.q0);
  }
}

// ---- an updraft: air (steam) that lifts anything in its column ----
export class Updraft {
  constructor(mgr, { x, z, r = 1.2, y0, y1, speed = 9, accel = 22 }) {
    Object.assign(this, { mgr, x, z, r, y0, y1, speed, accel });
    this.puff = 0;
  }
  inside(p) {
    return Math.hypot(p.x - this.x, p.z - this.z) < this.r && p.y > this.y0 - 0.2 && p.y < this.y1;
  }
}

export class Movers {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;
    this.physics = game.physics;
    this.list = [];
    this.spinners = [];
    this.updrafts = [];
    this.time = 0;
    this._mats = new Map();
  }

  mat(color) {
    if (!this._mats.has(color)) this._mats.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: color === BRASS ? 0.35 : 0, flatShading: true }));
    return this._mats.get(color);
  }

  add(m) { this.list.push(m); return m; }
  shuttle(o) { return this.add(new Shuttle(this, o)); }
  cog(o) { return this.add(new Cog(this, o)); }
  swing(o) { return this.add(new Swing(this, o)); }
  orbiter(o) { return this.add(new Orbiter(this, o)); }
  belt(o) { return this.add(new Belt(this, o)); }
  /**
   * A rail cart carrying a bullseye: something to hit, on the move. `pos` is the cart's
   * centre at the start of its run; the top of the cart (the disc you slam onto) is at
   * pos.y + size[1] / 2.
   */
  cart(o) {
    const size = o.size || [2.8, 0.5, 2.8];
    const m = this.shuttle({ dwell: 1.2, move: 6, ...o });
    m.box(size, PALETTE.wood, [0, 0, 0]);
    const y = size[1] / 2 + 0.012;
    const rings = [];
    [[size[0] * 0.5, PALETTE.dark], [size[0] * 0.38, PALETTE.glow], [size[0] * 0.26, PALETTE.dark], [size[0] * 0.15, PALETTE.glow]].forEach(([r, c], i) => {
      const mat = new THREE.MeshBasicMaterial({ color: c });
      const d = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.02, 28), mat);
      d.position.set(0, y + i * 0.004, 0);
      m.group.add(d);
      rings.push({ mat, c: new THREE.Color(c) });
    });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const w = m.mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.16, 12), PALETTE.dark, [sx * (size[0] / 2 - 0.3), -size[1] / 2 - 0.05, sz * (size[2] / 2 + 0.06)], { rot: [Math.PI / 2, 0, 0] });
      w.rotation.set(Math.PI / 2, 0, 0);
    }
    m.target = { id: o.id || 'cart', hits: 0, cd: 0, flash: 0, r: size[0] / 2, top: size[1] / 2, rings };
    m.tick = (dt) => {
      const t = m.target;
      t.cd = Math.max(0, t.cd - dt);
      t.flash = Math.max(0, t.flash - dt * 2.5);
      for (const r of t.rings) r.mat.color.copy(r.c).lerp(WHITE, t.flash);
    };
    return m;
  }

  /** Landing on a platform: a target under the feet takes a hit if it was a hard one. */
  onLand(fallSpeed, under, drop) {
    if (fallSpeed < 6 || this.game.techs?.active?.id === 'slam') return;
    for (const c of under) {
      const m = Movers.of(this.physics.entityOf(c));
      if (m?.target) { this.hitTarget(m, { cause: 'land', drop }); return; }
    }
  }

  updraft(o) { const u = new Updraft(this, o); this.updrafts.push(u); return u; }
  spinner(mesh, axis, w, phase) { const s = new Spinner(this, mesh, axis, w, phase); this.spinners.push(s); return s; }

  /** Before the player's fixed step. */
  pre(dt) {
    const blocked = (m) => this.blocks(m);
    for (const m of this.list) m.pre(this.time, dt, blocked);
    this.applyUpdrafts(dt);
  }

  applyUpdrafts(dt) {
    const P = this.game.player;
    if (!P || P.freeze || this.game.techs?.active) return;
    for (const u of this.updrafts) {
      if (!u.inside(P.pos)) continue;
      const cap = u.speed;
      if (P.vel.y < cap) P.vel.y = Math.min(cap, P.vel.y + u.accel * dt);
      if (P.grounded && P.vel.y > 0.5) { P.grounded = false; P.coyote = 0; }
      P.airJumps = Math.max(P.airJumps, 1); // riding steam gives a jump back
      if (!u.inFlag) { u.inFlag = true; this.game.events?.emit('updraft.enter'); }
    }
    for (const u of this.updrafts) if (u.inFlag && !u.inside(P.pos)) u.inFlag = false;
  }

  /** After the physics step. */
  post(dt) {
    this.time += dt;
    for (const m of this.list) m.post();
    this.pushOut();
  }

  /**
   * Would this mover, at the pose it's about to take, overlap the player (who isn't standing on
   * it)? Lifts, gates and the like stop for that instead of pushing you around or into the floor.
   */
  blocks(m) {
    const P = this.game.player;
    if (!P || !m.colliders.length || m.surface || P.platform === m || P.mantle) return false;
    const dx = m.next.p.x - P.pos.x, dy = m.next.p.y - P.pos.y, dz = m.next.p.z - P.pos.z;
    if (dx * dx + dy * dy + dz * dz > (m.radius + 3) ** 2) return false;
    // a mover that doesn't move can't be the one doing it
    if (m.next.p.distanceToSquared(m.cur.p) < 1e-10 && m.next.q.angleTo(m.cur.q) < 1e-6) return false;
    const world = this.physics.world;
    _bm.compose(m.next.p, m.next.q, ONE);
    for (const c of m.colliders) {
      const lp = c.translationWrtParent(), lq = c.rotationWrtParent();
      _bl.compose(_p2.set(lp.x, lp.y, lp.z), _q2.set(lq.x, lq.y, lq.z, lq.w), ONE);
      _bl.premultiply(_bm);
      _bl.decompose(_p2, _q2, _s2);
      let hit = false;
      world.intersectionsWithShape({ x: _p2.x, y: _p2.y, z: _p2.z }, { x: _q2.x, y: _q2.y, z: _q2.z, w: _q2.w }, c.shape, (o) => { hit = true; return false; },
        undefined, PLAYER_ONLY, undefined, undefined, (o) => o.handle === P.collider.handle);
      if (hit) return true;
    }
    return false;
  }

  /** Whatever a platform has moved into gets pushed out along the shortest way. */
  pushOut() {
    const P = this.game.player;
    if (!P || P.mantle) return;
    for (const m of this.list) {
      if (!m.colliders.length || m.surface) continue;
      const cx = m.cur.p.x - P.pos.x, cy = m.cur.p.y - P.pos.y, cz = m.cur.p.z - P.pos.z;
      if (cx * cx + cy * cy + cz * cz > (m.radius + 3) ** 2) continue;
      for (const c of m.colliders) {
        const ct = P.collider.contactCollider(c, 0);
        if (!ct || ct.distance >= -0.002) continue;
        // point2 - point1 is the way out of the overlap
        const dx = ct.point2.x - ct.point1.x, dy = ct.point2.y - ct.point1.y, dz = ct.point2.z - ct.point1.z;
        const l = Math.hypot(dx, dy, dz);
        if (l < 1e-5 || l > 1.2) continue;
        // (a hair past clear, so the controller isn't left resting exactly on the surface)
        const n = { x: dx / l, y: dy / l, z: dz / l };
        P.pos.x += dx + n.x * 0.012; P.pos.y += dy + n.y * 0.012; P.pos.z += dz + n.z * 0.012;
        const into = P.vel.x * n.x + P.vel.y * n.y + P.vel.z * n.z;
        if (into < 0) { P.vel.x -= n.x * into; P.vel.y -= n.y * into; P.vel.z -= n.z * into; }
        P.place();
        this.game.events?.emit('mover.push', { who: m.name, depth: l });
      }
    }
  }

  render(alpha) {
    for (const m of this.list) m.render(alpha);
    for (const s of this.spinners) s.render(alpha, this.time + alpha / 60);
  }

  tick(dt) {
    for (const m of this.list) m.tick(dt);
    for (const u of this.updrafts) this.steam(u, dt);
  }

  // steam rising from an updraft (a few puffs a second)
  steam(u, dt) {
    const fx = this.game.fx;
    if (!fx) return;
    const cam = this.game.camera.position;
    if ((cam.x - u.x) ** 2 + (cam.z - u.z) ** 2 > 40 * 40) return;
    u.puff -= dt;
    while (u.puff <= 0) {
      u.puff += 0.035;
      const a = simRand() * Math.PI * 2, r = simRand() * u.r * 0.8;
      fx.alpha.emit({ pos: new THREE.Vector3(u.x + Math.cos(a) * r, u.y0 + 0.1, u.z + Math.sin(a) * r), vel: new THREE.Vector3(0, u.speed * (0.5 + simRand() * 0.4), 0),
        life: (u.y1 - u.y0) / (u.speed * 0.7), size: 0.25, sizeEnd: 0.9, color: new THREE.Color(0xf3e0d0), alpha: 0.22, drag: 0.3 });
    }
  }

  /** The mover under a collider (from a raycast entity), if any. */
  static of(ent) { return ent?.type === 'mover' ? ent.mover : null; }

  // ---- targets: things to hit from a height, on the move ----
  hitTarget(m, info = {}) {
    const t = m.target;
    if (!t || t.cd > 0) return false;
    t.cd = 0.6;
    t.hits++;
    t.flash = 1;
    const speed = m.speed;
    const ev = { cause: info.cause || 'shot', speed, moving: speed > 0.5, drop: info.drop || 0, id: t.id };
    this.game.events?.emit('target.hit', ev);
    sfx.lockOn(6);
    sfx.hitmarker();
    this.game.hud?.hitmarker(true);
    return true;
  }

  /** A landing/impact at p (feet): any target within reach and below. */
  hitTargetsNear(p, radius, info) {
    let hit = false;
    for (const m of this.list) {
      if (!m.target) continue;
      const dx = m.cur.p.x - p.x, dz = m.cur.p.z - p.z;
      if (Math.hypot(dx, dz) > radius + (m.target.r || 1) || Math.abs(m.cur.p.y + (m.target.top || 0) - p.y) > 1.0) continue;
      hit = this.hitTarget(m, info) || hit;
    }
    return hit;
  }

  clear() {
    for (const m of this.list) { this.scene.remove(m.group); this.physics.world.removeRigidBody(m.body); }
    this.list.length = 0; this.spinners.length = 0; this.updrafts.length = 0;
  }
}
