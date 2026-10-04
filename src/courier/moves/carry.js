import * as THREE from 'three';
import { Tech } from './techs.js';
import { RAPIER, GROUPS, G, groups } from '../../core/physics.js';
import { sfx } from '../../audio/sfx.js';

// Pick up and throw (a body move: it's yours from the start). F, facing something small
// (a pot, a small crate): you stoop, take it in both hands and lift it to your chest. You walk with
// it slowly, no sprint and no gun. F again sets it down; the fire button throws it, two-handed over
// the head, along where you look. Pots shatter where they land, and hit what they hit.
//
// The motion is UAL's (CC0), modified (CLAUDE.md: find a clip, blend it in; author only when nothing fits): the lift and the
// set-down are Chest_Open (a stoop and a rise with the hands low), the hold is Walk_Carry_Loop's arms over the walk, the throw is
// OverhandThrow. Chest_Open and OverhandThrow reach with one arm, so the other is given its mirror (the pose mirror the gun's hand
// swap uses): two hands, as a pot wants. Each is time-warped onto the move's own timings (LIFT, THROW_AT, PUT), which are the
// game's feel and do not change. IK only closes the palms on the pot's sides.
const UP = new THREE.Vector3(0, 1, 0);
const CARRIED = groups(G.PROP, 0); // touches nothing while it's in your hands
const LIFT = 0.55, THROW_AT = 0.17, THROW_END = 0.32, PUT = 0.34;
// where in each clip the move's beats fall (seconds of the clip): the lift's lowest reach and the top of its rise; the throw's
// wind-up, its release and how far its follow-through runs
const LIFT_CLIP = { from: 0.12, low: 0.55, to: 0.95 };
const THROW_CLIP = { from: 0.1, release: 0.31, to: 0.78 };
// the hold, in the body's frame (metres): the palms of the carrying clip are about this high and this far forward
const HOLD = { up: 1.0, fwd: 0.16 };
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
  get engaged() { return !!this.item || this.state === 'throw'; } // (the throw's follow-through plays on after the pot is gone)
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
    // (at the chest, held at its grip between the carrying clip's palms, in front of them by as much as it is wide: it comes down
    //  with a crouch)
    const grip = this.grip || { f: 0.2, w: 0.2 };
    const c0 = this.originUp(e); // (a pot's origin is its foot; a crate's its middle)
    const fw = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const hold = new THREE.Vector3(base.x, base.y + HOLD.up - 0.35 * (P.crouchBlend || 0) - h * grip.f + c0 + Math.sin(this.bob) * 0.015, base.z)
      .addScaledVector(fw, HOLD.fwd + (grip.w || 0.2));
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
    if (this.shown) { pose.p.copy(this.shown); this.shown = null; } // (from where the throw's hands have it, not where the hold had it)
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
    this.game.events?.emit('move.throw', { kind: e.kind || 'crate', speed: sp });
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

  // ---- animation: the clips (UAL, modified: see the top), both hands on it ----
  /** A one-armed clip made two-handed: the reaching arm's mirror given to the other (`to`: the side that is given it). */
  twoHanded(ch, name, t, to) {
    const C = ch.clips, Pp = ch.P;
    if (!this.mirrorMask) {
      this.mirrorMask = {};
      for (const side of ['L', 'R']) { const tb = {}; for (const n of C.bones) if (n.endsWith(side) && /^(upper_arm|forearm|hand|f_|thumb)/.test(n)) tb[n] = 1; this.mirrorMask[side] = C.mask(tb); }
    }
    C.sample(name, t, Pp.tmp, false);
    ch.mirrorPose(Pp.tmp, Pp.tmp2);
    return C.blend(Pp.tmp, Pp.tmp2, 1, this.mirrorMask[to]);
  }

  animate(ch, base, dt) {
    const C = ch.clips;
    if (!C.clips.chestOpen || !C.clips.carryWalk || !C.clips.throw) return;
    const st = this.state;
    if (st === 'lift') {
      // stoop to it (to the clip's lowest reach a little before halfway), then rise with it
      const k = Math.min(1, this.st / LIFT), L = LIFT_CLIP;
      const t = k < 0.45 ? L.from + (L.low - L.from) * sm(k / 0.45) : L.low + (L.to - L.low) * sm((k - 0.45) / 0.55);
      C.blend(base, this.twoHanded(ch, 'chestOpen', t, 'R'), this.w);
    } else if (st === 'put') {
      const k = Math.min(1, this.st / PUT), L = LIFT_CLIP; // (the lift backwards: down from the chest to the low reach)
      C.blend(base, this.twoHanded(ch, 'chestOpen', L.to + (L.low - L.to) * sm(k), 'R'), this.w);
    } else if (st === 'throw') {
      // two hands back over the head and through: the wind-up to the release by THROW_AT, the follow-through after
      const T0 = THROW_CLIP, s2 = this.st;
      const t = s2 < THROW_AT ? T0.from + (T0.release - T0.from) * (s2 / THROW_AT) : T0.release + (T0.to - T0.release) * Math.min(1, (s2 - THROW_AT) / (THROW_END - THROW_AT + 0.12));
      C.blend(base, this.twoHanded(ch, 'throw', t, 'L'), this.w, ch.MASK_UPPER);
    } else if (this.item) {
      // the hold: the carrying clip's arms over whatever the legs are doing (its own walk would skate against theirs)
      this.ht = (this.ht || 0) + dt * (0.5 + Math.hypot(this.P.vel.x, this.P.vel.z) * 0.35);
      C.blend(base, C.sample('carryWalk', this.ht, ch.P.tmp, true), this.w, ch.MASK_UPPER);
    }
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
   * Both hands on it, open, palms flat against its sides and fingers up: the carrying clip has the arms there, and this is the light
   * IK correction CLAUDE.md allows (a hand closed on a surface) that sets the palms to its width.
   * Where they go is worked out for each thing from its own shape (begin: the widest place low on it, and its width there), so a
   * squat jar and a tall amphora are each cupped where they swell.
   */
  hands(ch) {
    if (!this.item || this.w < 0.02) return;
    const P = this.P, e = this.item, w = this.w;
    const pose = this.pose(P.renderPos, { p: new THREE.Vector3(), q: new THREE.Quaternion() });
    if (this.state === 'throw') {
      // through the throw it rides between the clip's hands, its grip where the palms are (no IK: the clip throws it)
      const mid = new THREE.Vector3();
      for (const sd of ['L', 'R']) mid.add(ch.arm[sd].palmPt.clone().applyMatrix4(ch.arm[sd].hand.matrixWorld));
      mid.multiplyScalar(0.5);
      const at = mid.addScaledVector(UP, -(this.size(e) * this.grip.f - this.originUp(e)));
      e.mesh.position.copy(at); e.mesh.quaternion.copy(pose.q); e.mesh.updateMatrixWorld(true);
      (this.shown ||= new THREE.Vector3()).copy(at);
      return;
    }
    this.shown = null;
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
