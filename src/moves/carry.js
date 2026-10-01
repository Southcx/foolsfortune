import * as THREE from 'three';
import { Tech } from './techs.js';
import { RAPIER, GROUPS, G, groups } from '../physics.js';
import { sfx } from '../audio.js';

// Pick up and throw (a body move: it's yours from the start). F, facing something small
// (a pot, a small crate): you crouch, take it in both hands and hoist it over your head, the way
// Link does. You walk with it slowly, no sprint and no gun. F again sets it down; the fire button
// throws it, along where you look. Pots shatter where they land, and hit what they hit.
const UP = new THREE.Vector3(0, 1, 0);
const CARRIED = groups(G.PROP, 0); // touches nothing while it's in your hands
const LIFT = 0.55, THROW_AT = 0.17, THROW_END = 0.32, PUT = 0.34;
const sm = (u) => u * u * (3 - 2 * u);
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();

export class Carry extends Tech {
  constructor(mgr) {
    super(mgr, 'carry');
    this.passive = true;
    this.overrides = 0;
    this.blendIn = 12;
    this.item = null;
    this.state = 'idle'; // lift | hold | throw | put
    this.st = 0;
    this.flying = [];
    this.bob = 0;
    this.fireHold = 0;
  }

  get busy() { return !!this.item; }
  /** The fire button is the throw button while it's in your hands (and a moment after). */
  get blocksFire() { return !!this.item || this.state === 'throw' || this.fireHold > 0; }
  get engaged() { return !!this.item; }
  get speedMult() { return this.item ? this.cfg.slow : 1; }
  get noSprint() { return !!this.item; }

  // ---- what can be picked up ----
  size(ent) { return ent.size ?? ent.P?.fullHeight ?? 0.5; }
  halfW(ent) { return ent.half?.[0] ?? ent.P?.rMax ?? 0.25; }
  liftable(ent) {
    if (!ent?.body || ent.alive === false || !ent.body.isDynamic?.()) return false;
    if (ent.def?.hang || ent.def?.target || ent === this.item) return false;
    if (ent.type === 'breakable') return this.size(ent) <= this.cfg.maxSize && ent.body.mass() <= this.cfg.maxMass;
    return ent.carry === 'lift';
  }

  candidates() {
    const g = this.game, out = [];
    for (const e of g.level?.dynamic || []) out.push(e);
    for (const e of g.breakables?.items || []) out.push(e);
    return out;
  }

  /** The thing in front of us we could lift (or a heavy crate to grab, with `heavy`). */
  find(heavy = false) {
    const P = this.P, fx = Math.sin(P.yaw), fz = Math.cos(P.yaw);
    // (what the chevron is already on keeps it, within a little more reach and a wider cone, unless another is clearly nearer:
    //  without this the marker flips between two pots, or on and off at the edge of the cone, as the camera turns)
    const cur = this.game.interact?.cur?.ref;
    let best = null, bd = 1e9;
    for (const e of this.candidates()) {
      if (heavy ? (e.carry !== 'heavy' || !e.body?.isDynamic?.()) : !this.liftable(e)) continue;
      const t = e.body.translation();
      const dx = t.x - P.pos.x, dz = t.z - P.pos.z, dy = t.y - P.pos.y;
      const half = this.halfW(e);
      const sticky = e === cur;
      const d = Math.hypot(dx, dz) - half - (sticky ? 0.35 : 0);
      if (d > this.cfg.reach || dy < -0.5 || dy > 1.6) continue;
      if ((dx * fx + dz * fz) / (Math.hypot(dx, dz) || 1) < (sticky ? 0.3 : 0.55)) continue;
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  // ---- state ----
  fixed(dt) {
    const P = this.P, c = this.cfg;
    this.fireHold -= dt;
    this.trackFlying(dt);
    if (!this.item) {
      if (this.state !== 'idle') { this.st += dt; if (this.st > 0.4) this.state = 'idle'; }
      const other = this.game.interact?.cur; // (F is for whatever the chevron is on: a gong or a chest nearer than the pot is theirs)
      if (P.peekLatch('KeyF') && this.state === 'idle' && !this.mgr.active && P.grounded && !P.mantle && !P.sliding && !(other && (other.id === 'trial' || other.id === 'chest' || other.id === 'item' || other.id === 'npc'))) {
        const e = this.find();
        if (e) { P.latch('KeyF'); this.begin(e); }
      }
      return;
    }
    // something else took over (a ladder, water, a mantle): let it go
    if (this.mgr.active || P.mantle || P.freeze || !P.grounded && this.state === 'lift') { this.drop(); return; }
    this.st += dt;
    const e = this.item, body = e.body;
    if (this.state === 'lift') {
      if (this.st >= LIFT) { this.state = 'hold'; this.st = 0; }
    } else if (this.state === 'hold') {
      this.bob += Math.hypot(P.vel.x, P.vel.z) * dt * 2.2;
      if (P.latch('Mouse0')) { this.state = 'throw'; this.st = 0; this.released = false; P.latch('KeyF'); this.game.weapon && (this.game.weapon.buffer = 0); }
      else if (P.latch('KeyF')) { this.state = 'put'; this.st = 0; this.putFrom = this.pose(P.pos, null).p.clone(); }
    } else if (this.state === 'throw') {
      if (!this.released && this.st >= THROW_AT) this.release();
      if (this.st >= THROW_END) { this.state = 'idle'; this.st = 0; }
    } else if (this.state === 'put') {
      if (this.st >= PUT) { this.setDown(); return; }
    }
    if (this.item) {
      const pose = this.pose(P.pos, null);
      body.setNextKinematicTranslation(pose.p);
      body.setNextKinematicRotation(pose.q);
    }
  }

  begin(e) {
    const P = this.P, body = e.body;
    this.item = e;
    this.state = 'lift';
    // the grip, worked out once for this thing: the widest place low on it (the hands cup it from below its belly, so that
    // held overhead it clears the head; never on a neck)
    let gf = 0.2, gw = this.widthAt(e, gf);
    for (const f of [0.12, 0.16, 0.24, 0.28]) { const r = this.widthAt(e, f); if (r > gw + 0.005) { gw = r; gf = f; } }
    this.grip = { f: gf, w: gw };
    this.st = 0;
    const t = body.translation(), r = body.rotation();
    this.from = { p: new THREE.Vector3(t.x, t.y, t.z), q: new THREE.Quaternion(r.x, r.y, r.z, r.w) };
    body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true);
    this.col = e.col || body.collider(0);
    this.groups = this.col.collisionGroups();
    this.col.setCollisionGroups(CARRIED);
    e.carried = true;
    P.setLow(false);
    sfx.hoist();
    this.game.events?.emit('carry.lift', { kind: e.kind || 'crate' });
  }

  /** Where the item is (world, for a player at `base`) in the current state. */
  pose(base, out) {
    const P = this.P, e = this.item, h = this.size(e);
    const yaw = P.bodyYaw;
    const upright = _q.setFromAxisAngle(UP, yaw);
    // (over the head, held at its grip with the arms up: the grip at 2.02 m, wherever the head is: it comes down with a crouch)
    const grip = this.grip || { f: 0.2 };
    const c0 = this.originUp(e); // (a pot's origin is its foot; a crate's its middle)
    const hold = new THREE.Vector3(base.x, base.y + 2.02 - 0.4 * (P.crouchBlend || 0) - h * grip.f + c0 + Math.sin(this.bob) * 0.02, base.z);
    const p = new THREE.Vector3(), q = new THREE.Quaternion();
    if (this.state === 'lift') {
      const k = sm(Math.min(1, this.st / LIFT));
      p.lerpVectors(this.from.p, hold, k);
      p.y += Math.sin(Math.PI * k) * 0.18;
      q.copy(this.from.q).slerp(upright, k);
    } else if (this.state === 'throw') {
      const k = Math.min(1, this.st / THROW_AT);
      const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
      p.copy(hold).addScaledVector(fwd, 0.55 * sm(k)).addScaledVector(UP, -0.3 * sm(k));
      q.copy(upright);
    } else if (this.state === 'put') {
      const k = sm(Math.min(1, this.st / PUT));
      const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
      const floor = this.floorAt(base.x + fwd.x * 0.85, base.z + fwd.z * 0.85, base.y);
      const to = new THREE.Vector3(base.x + fwd.x * 0.85, floor + this.originUp(e) + 0.03, base.z + fwd.z * 0.85);
      p.lerpVectors(this.putFrom || hold, to, k);
      q.copy(upright);
    } else { p.copy(hold); q.copy(upright); }
    if (out) { out.p.copy(p); out.q.copy(q); return out; }
    return { p, q };
  }

  floorAt(x, z, y) {
    const hit = this.P.physics.raycast({ x, y: y + 1.2, z }, { x: 0, y: -1, z: 0 }, 3, this.P.collider, GROUPS.controllerQuery, (c) => !c.isSensor() && !c.parent()?.isDynamic());
    return hit ? hit.point.y : y;
  }

  restore() {
    const e = this.item;
    if (!e.body?.isValid?.()) return; // (cleared out from under us)
    e.body.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
    this.col.setCollisionGroups(this.groups);
    e.carried = false;
    e.body.wakeUp();
  }

  release() {
    const P = this.P, e = this.item, c = this.cfg;
    this.released = true;
    const pose = this.pose(P.pos, null);
    // (the ray to where we're looking: aim at what the crosshair lands on)
    const look = P.lookDir(new THREE.Vector3());
    const mass = e.body.mass();
    const sp = THREE.MathUtils.clamp(c.speed - mass * 0.18, 6, c.speed);
    const dir = look.clone();
    dir.y += 0.1;
    dir.normalize();
    e.body.setTranslation(pose.p, true);
    this.restore();
    const v = dir.multiplyScalar(sp).add(new THREE.Vector3(P.vel.x, 0, P.vel.z).multiplyScalar(0.5));
    e.body.setLinvel(v, true);
    e.body.setAngvel({ x: (Math.random() - 0.5) * 6, y: (Math.random() - 0.5) * 3, z: (Math.random() - 0.5) * 6 }, true);
    e.thrownT = 0;
    this.game.breakables?.instigate(e, 'courier'); // (whatever it breaks is the Courier's doing)
    this.flying.push({ e, prev: v.length(), t: 0 });
    this.item = null;
    this.fireHold = 0.35;
    sfx.airJump();
    this.game.events?.emit('throw', { kind: e.kind || 'crate', speed: sp });
  }

  setDown() {
    const e = this.item;
    this.restore();
    e.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    e.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    this.item = null;
    this.state = 'idle';
    this.st = 0;
    this.game.events?.emit('carry.put', { kind: e.kind || 'crate' });
    sfx.thunk?.(0.5, 3);
  }

  drop() {
    if (!this.item) return;
    this.restore();
    this.item.body.setLinvel({ x: this.P.vel.x * 0.5, y: 0, z: this.P.vel.z * 0.5 }, true);
    this.item = null;
    this.state = 'idle';
    this.st = 0;
  }

  reset() { this.drop(); this.flying.length = 0; }

  /** A thrown thing that stops short broke on what it hit: pots shatter, targets ring. */
  trackFlying(dt) {
    const g = this.game;
    for (let i = this.flying.length - 1; i >= 0; i--) {
      const f = this.flying[i], e = f.e;
      f.t += dt;
      if (!e.body?.isValid?.() || e.alive === false) { this.flying.splice(i, 1); continue; }
      const v = e.body.linvel(), s = Math.hypot(v.x, v.y, v.z);
      if (f.t > 0.06 && f.prev > 4.5 && s < f.prev * 0.5) {
        const t = e.body.translation();
        const at = new THREE.Vector3(t.x, t.y, t.z);
        g.movers?.hitTargetsNear(new THREE.Vector3(t.x, t.y - 0.4, t.z), 0.8, { cause: 'throw', drop: 0 });
        if (e.type === 'breakable') g.breakables.damage(e, e.maxHp * 3, at, new THREE.Vector3(v.x, v.y, v.z).normalize(), 1.2);
        g.events?.emit('throw.hit', { kind: e.kind || 'crate', speed: f.prev });
        this.flying.splice(i, 1);
        continue;
      }
      f.prev = s;
      if (f.t > 4 || s < 0.5) this.flying.splice(i, 1);
    }
  }

  // ---- animation: both hands under it ----
  animate() {}

  /** The body under the load: a stoop to the pickup and a heave up (lift), leaning back a little
   * under the weight (hold), and a lunge into the throw. */
  afterPose(ch) {
    if (!this.item || this.w < 0.02) return;
    const st = this.state, k = st === 'lift' ? Math.min(1, this.st / LIFT) : st === 'throw' ? Math.min(1, this.st / THROW_AT) : st === 'put' ? Math.min(1, this.st / PUT) : 1;
    let deg = -6; // (leaning back)
    if (st === 'lift') deg = 16 * Math.sin(Math.PI * Math.min(1, k * 1.15)) - 6 * sm(k);
    else if (st === 'throw') deg = -6 + 24 * sm(k);
    else if (st === 'put') deg = -6 + 26 * Math.sin(Math.PI * k * 0.9);
    this.lean = THREE.MathUtils.damp(this.lean ?? deg, deg, 20, 1 / 60);
    const yaw = this.P.bodyYaw, left = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const a = this.lean * Math.PI / 180 * this.w;
    for (const [b, f] of [['spine001', 0.34], ['spine002', 0.33], ['spine003', 0.33]]) ch.rotW(ch.bones[b], left, a * f);
    ch.root.updateMatrixWorld(true);
  }

  /** How far its origin is above its foot: a pot is built up from its foot, a crate about its middle. */
  originUp(e) { return e.P?.pts ? 0 : this.size(e) / 2; }

  /** How wide the thing is at a height (0 its foot .. 1 its top): a pot's own profile there, a crate's half width. */
  widthAt(e, f) {
    const pts = e.P?.pts;
    if (!pts) return this.halfW(e);
    const y = f * e.P.height;
    for (let i = 1; i < pts.length; i++) if (pts[i].y >= y) { const a = pts[i - 1], b = pts[i], t = (y - a.y) / Math.max(1e-6, b.y - a.y); return a.x + (b.x - a.x) * t; }
    return pts[pts.length - 1].x;
  }

  /**
   * Both hands on it, open, palms flat against its sides and fingers up, the way a thing is held over the head (Link's lift; the
   * UAL clips have no two-handed overhead carry, so this is the light IK correction CLAUDE.md allows: a hand closed on a surface).
   * Where they go is worked out for each thing from its own shape (begin: the widest place low on it, and its width there), so a
   * squat jar and a tall amphora are each cupped where they swell.
   */
  hands(ch) {
    if (!this.item || this.w < 0.02) return;
    const P = this.P, e = this.item, w = this.w;
    const pose = this.pose(P.renderPos, { p: new THREE.Vector3(), q: new THREE.Quaternion() });
    // (the mesh rides the interpolated body, not last step's physics pose)
    e.mesh.position.copy(pose.p);
    e.mesh.quaternion.copy(pose.q);
    e.mesh.updateMatrixWorld(true);
    const h = this.size(e), gf = this.grip.f, gw = this.grip.w;
    const left = new THREE.Vector3(Math.cos(P.bodyYaw), 0, -Math.sin(P.bodyYaw));
    const fwd = new THREE.Vector3(Math.sin(P.bodyYaw), 0, Math.cos(P.bodyYaw));
    const base = pose.p.clone().addScaledVector(UP, h * gf - this.originUp(e)); // (the grip, from its origin)
    for (const s of ['L', 'R']) {
      const sg = s === 'L' ? 1 : -1;
      const inward = left.clone().multiplyScalar(-sg);
      // palm against its side, fingers up and a little forward over its shoulder
      const fingers = UP.clone().multiplyScalar(0.8).addScaledVector(fwd, 0.25).addScaledVector(inward, 0.3).normalize(); // (curving in with the pot)
      const q = ch.handQuat(ch.arm[s], fingers, inward);
      const at = base.clone().addScaledVector(left, sg * (gw + 0.015)).addScaledVector(fwd, -0.02);
      at.sub(ch.arm[s].palmPt.clone().applyQuaternion(q));
      ch.reachHand(s, at, q, w);
      // open: the fingers straight (the clip's fist let go), curled just enough to follow its curve
      const curl = THREE.MathUtils.clamp(0.12 / Math.max(0.08, gw), 0.15, 0.6);
      for (const f of ch.arm[s].fingers) f.quaternion.slerp(ch.rest.get(f).q, w * (1 - curl * 0.5));
    }
  }

  label() { return this.item ? 'CARRY' : ''; }
}
