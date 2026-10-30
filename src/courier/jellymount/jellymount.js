// ---------------------------------------------------------------------------------------
// THE SLIP JELLY MOUNT IN PLAY (gj3's drop; the rules and numbers Dovina's, progress/jellymount.js JELLY_MOUNT; the lines Espada's,
// docs/handoffs/everyone/2026-10-30-from-espada-words-ahead.md 4): a slip jelly called up out of the ground to carry the Courier, who sits
// cross-legged on its crown. Riding is a tech (it owns the step); getting off gives the core movement back exactly. The body is a
// placeholder, the wild slip jelly's own mesh and melt (creatures/jelly/slipjelly.js, deform.js): its look is Calissa's to come.
//   THE CALL    Y, on open ground in the Dunes or at the Raceway (where the Solar Skiff is called): tapped, the mount last chosen comes;
//               held past `call.hold`, the two are shown (mountchoice.js) and the mouse, A or D picks one, let go calls it. The jelly rises
//               under the Courier over `call.arrive` real s (at once when it was left waiting at a door).
//   THE RIDE    the movement keys from the camera, as on foot: it turns toward the way asked at `turn` and runs to `cruise` x the ground's
//               share (groundSpeed: sand, stone, paint, crude, liquid), never past `max`. Space hops (`hop.up`); a hop within `window` of
//               landing links a bounce chain (+`gain` a link, `links` at most), one out of rhythm drops it.
//   THE GROUND  in a feeling's paint it takes the feeling for `tint` real s (its colour, and the draught of your blows); over a blot it drinks
//               the crude at the mop's rate; on water or liquid Lachryma it floats and never dives; in paint or crude it mends.
//   ITS LIFE    a blow on the rider lands on it first (courier/vessel/damage.js asks `absorb`); at none it bursts, you are set down unhurt,
//               and it re-forms in `reform` real s.
//   THE END     Y tapped (it slumps into the ground), a burst, the edge of the Dunes or a door (it waits: the next call is at once), the
//               Solar Skiff chosen, a seam.
//
// Prior art: Yoshi (Super Mario World: a mount that is also a life), Dragon Quest's slime knight (a rider sitting on a slime's crown),
// Breath of the Wild's horse called by a whistle, Splatoon's squid form (fast in its own ink); the skiff's tech here (courier/skiff/skiff.js:
// the capsule held at the seat over the ground it follows, moved by the core's own move).
//
//   game.jellyMount = techs.add(new JellyMount(techs))   (boot/tools.js, before the Solar Skiff: Y is read here first)   .absorb(k) -> bool
//   .riding   .hp   .readyIn (real s until it can be called)   events mount.call, mount.ride, mount.hop, mount.hurt, mount.burst, mount.drink, mount.end
//   (each with `by` and `mount: 'slipjelly'`)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Tech } from '../moves/techs.js';
import { JELLY_MOUNT as J, jellyOpen, groundSpeed } from '../../progress/jellymount.js';
import { JellyDeform } from '../../creatures/jelly/deform.js';
import { addRim } from '../../render/toon.js';
import { COLOR } from '../../progress/weather.js';
import { surfaceUnder } from '../stepsurface.js';
import { BRUSH } from '../../progress/brushload.js';
import { MountChoice } from './mountchoice.js';

/** Petra's, where the rows are silent: the crown the rider sits on (m over the ground: the wild jelly is 1.5 tall, its crown rounded);
 *  how much of its life a blow on the rider takes (a crack's share k: a wild jelly's lunge is k 0.7 on the clay and 2.5 on a creature, so
 *  3.5 a k); the draught its paint lends while tinted (a middling weather's: strength 0.5); the slump and the burst (real s). */
const SEAT = 1.35, HP_PER_K = 3.5, TINT_DRAUGHT = 0.5, SLUMP = 0.5, H = 1.5;
const UP = new THREE.Vector3(0, 1, 0), DOWN = new THREE.Vector3(0, -1, 0);
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _o = new THREE.Vector3(), _acc = new THREE.Vector2();
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));

export class JellyMount extends Tech {
  constructor(mgr) {
    super(mgr, 'jellymount');
    this.last = 'skiff'; this.hp = J.hp.max; this.reformAt = -Infinity; this.waiting = false;
    this.yT = -1; this.passY = false; this.choice = null; this.now = 0;
    this.body = null; this.phase = null; this.heading = 0; this.v = new THREE.Vector3(); this.air = false; this.landT = 9; this.chain = 0;
    this.tint = null; this.drunk = 0; this.rideT = 0; this.endWhy = null;
  }
  get riding() { return this.active; }
  get handsBusy() { return false; }
  /** Real seconds until it can be called again (0: now). */
  get readyIn() { return Math.max(0, this.reformAt - this.now); }
  get skiff() { return this.mgr.get('skiff'); }
  /** Where a mount may come: open ground in the Dunes or at the Raceway (the skiff's own test), never indoors. */
  allowed() { const D = this.skiff?.dunes; return !!D?.active && !this.game.seam?.covering && !this.game.god?.active; }
  open() { return jellyOpen(this.game.ledger, this.game); }

  // ------------------------------------------------------------------ the call (Y tapped or held)
  canStart() {
    const g = this.game, P = this.P, inp = P.input;
    if (!this.open()) return false;
    if (this.passY) { this.passY = false; return false; } // (Y handed on to the Solar Skiff this step: its canStart reads it)
    if (this.yT < 0 && P.peekLatch('KeyY')) {
      if (!this.allowed()) { if (this.last === 'jelly') { P.latch('KeyY'); this.refuse(); } return false; } // (the skiff's own refusal stands for the skiff)
      P.latch('KeyY'); this.yT = 0; this.yAt = this.now;
    }
    if (this.yT < 0) return false;
    if (inp.isDown('KeyY')) {
      this.yT = this.now - this.yAt; // (held: on the frame clock, tick's; a fixed step has no dt here)
      if (this.yT >= J.call.hold && !this.choice) this.choice = new MountChoice(g, this.last === 'jelly' ? 'skiff' : 'jelly');
      this.choice?.steer(inp, P);
      return false;
    }
    const pick = this.choice ? this.choice.pick : this.last; // (let go: a tap calls the last one, a hold the one shown)
    this.choice?.close(); this.choice = null; this.yT = -1;
    this.last = pick;
    if (pick === 'skiff') { P.latches.KeyY = 0.15; this.passY = true; return false; }
    if (P.mantle || P.freeze || !this.allowed()) { this.refuse(); return false; }
    if (this.readyIn > 0) { g.log?.say('info', `Your slip jelly is still pulling itself together: ${Math.ceil(this.readyIn)} real seconds.`, { key: 'jelly.reform', throttle: 3 }); return false; } // (placeholder words: Espada's)
    return true;
  }
  refuse() { this.game.log?.say('info', 'Your slip jelly comes only on open ground in the Dunes or at the Raceway.', { key: 'jelly.refuse', throttle: 3 }); } // (Espada's)

  start() {
    const g = this.game, P = this.P;
    P.endCore?.(); P.setShape('low'); // (sitting: the capsule's low shape)
    this.phase = 'call'; this.phaseT = this.waiting ? J.call.arrive : 0; this.waiting = false;
    this.heading = P.bodyYaw ?? P.yaw; this.v.set(P.vel.x, 0, P.vel.z).multiplyScalar(0.3);
    this.air = false; this.landT = 9; this.chain = 0; this.rideT = 0; this.endWhy = null; this.drunk = 0;
    this.groundY = this.groundAt(P.pos) ?? P.pos.y; this.seatY = this.groundY;
    this.ensureBody(); this.body.root.visible = true; this.body.deform.target.squash = 1;
    void g.clipPack?.social; // (the sitting loop is the suite's social pack: asked now, in by the time it holds; the skiff's stance until then)
    g.events?.emit('mount.call', { mount: 'slipjelly', by: 'courier' });
  }

  /** The ground under the jelly's middle (the top of what is solid, or a liquid's surface over it), or null. */
  groundAt(p) {
    const g = this.game, P = this.P;
    _o.set(p.x, p.y + 1.2, p.z);
    const hit = g.physics?.raycast(_o, DOWN, 6, P.collider, undefined, (k) => !k.isSensor() && !g.physics.entityOf?.(k)?.type);
    let y = hit ? hit.point.y : null;
    const w = g.water?.at?.(p.x, (y ?? p.y) + 0.05, p.z);
    if (w && (y == null || w.surface > y)) { y = w.surface - 0.25; this.onLiquid = true; } else this.onLiquid = false; // (it floats, low in it, and never dives)
    return y;
  }

  // ------------------------------------------------------------------ the ride (fixed step)
  update(dt) {
    const g = this.game, P = this.P;
    this.phaseT += dt;
    if (this.phase === 'call') return this.stepCall(dt);
    if (this.phase === 'off') return this.stepOff(dt);
    if (!this.allowed()) return this.finish(this.game.seam?.covering ? 'seam' : 'door');
    if (P.latch('KeyY')) { this.yRide = 0; } // (Y on the ride: a tap gets off, a hold shows the two: tick)
    if (this.yRide != null) {
      if (P.input.isDown('KeyY')) { this.yRide += dt; if (this.yRide >= J.call.hold && !this.choice) this.choice = new MountChoice(g, 'skiff'); this.choice?.steer(P.input, P); }
      else {
        const pick = this.choice ? this.choice.pick : null; this.choice?.close(); this.choice = null; this.yRide = null;
        if (pick === 'skiff') { this.last = 'skiff'; this.slump('skiff'); P.latches.KeyY = 0.15; this.passY = true; return this.stepOff(dt); }
        if (!pick) { this.slump('dismiss'); return this.stepOff(dt); }
      }
    }
    this.rideT += dt;
    // where it is asked to go, from the camera as on foot; it pivots toward it and runs at the ground's speed
    const wish = P.wishDir(_w), push = wish.length(), kind = this.groundKind();
    if (push > 0.05) { const want = Math.atan2(wish.x, wish.z); let d = want - this.heading; d = Math.atan2(Math.sin(d), Math.cos(d)); this.heading += Math.sign(d) * Math.min(Math.abs(d), J.speeds.turn * dt); }
    const top = Math.min(J.speeds.max, J.speeds.cruise * groundSpeed(kind)) * push;
    _v.set(Math.sin(this.heading), 0, Math.cos(this.heading)).multiplyScalar(top);
    const before = this.v.clone(); this.v.x = damp(this.v.x, _v.x, J.speeds.accel / Math.max(1, J.speeds.cruise), dt); this.v.z = damp(this.v.z, _v.z, J.speeds.accel / Math.max(1, J.speeds.cruise), dt);
    if (this.v.length() > J.speeds.max) this.v.setLength(J.speeds.max);
    _acc.set((this.v.x - before.x) / dt, (this.v.z - before.z) / dt);
    // the hop and its bounce chain
    this.landT += dt;
    if (!this.air && P.latch('Space')) {
      this.chain = this.landT <= J.hop.window ? Math.min(J.hop.links, this.chain + 1) : 0; // (within the window of a landing a link more; out of rhythm none)
      P.vel.y = J.hop.up * (1 + J.hop.gain * this.chain); this.air = true;
      this.body.deform.kick(-2.5, null, 0.12);
      g.events?.emit('mount.hop', { chain: this.chain, mount: 'slipjelly', by: 'courier' });
    }
    // the ground it follows (the capsule held at the seat over it), or the fall
    const gy = this.groundAt(P.pos);
    if (this.air) {
      P.vel.y -= 24 * dt;
      if (gy != null && P.pos.y - SEAT <= gy && P.vel.y <= 0) { this.air = false; this.landT = 0; this.body.deform.kick(-1.2 - Math.min(3, -P.vel.y * 0.15), null, 0.2); } // (it lands and splashes: no ride is lost to a fall)
    } else if (gy == null || P.pos.y - SEAT > gy + 0.6) { this.air = true; P.vel.y = Math.min(P.vel.y, 0); } // (off a ledge)
    else { const want = (gy + SEAT - P.pos.y) / dt; P.vel.y = damp(P.vel.y, Math.max(-12, Math.min(12, want)), 18, dt); }
    if (gy != null) this.groundY = gy;
    P.vel.x = this.v.x; P.vel.z = this.v.z;
    P.move(dt);
    P.grounded = !this.air;
    P.bodyYaw = this.heading;
    this.ground(kind, dt);
    this.accel = _acc;
    return true;
  }

  /** The ground's kind for its speed: liquid where it floats, else the step's surface (courier/stepsurface.js) read as the rows' words. */
  groundKind() {
    if (this.onLiquid) return 'liquid';
    const s = surfaceUnder(this.game, _o.set(this.P.pos.x, this.groundY ?? this.P.pos.y, this.P.pos.z), this.P.collider);
    return s === 'water' ? 'liquid' : s === 'paint' || s === 'crude' || s === 'sand' ? s : 'stone';
  }

  /** What the ground gives: paint's feeling, crude drunk, a mend in either. */
  ground(kind, dt) {
    const g = this.game, P = this.P, at = P.pos;
    if (kind === 'paint') {
      const c = g.paintmap?.at?.(at.x, this.groundY ?? at.y, at.z);
      if (c?.aspect) this.tint = { aspect: c.aspect, left: J.ground.tint };
    }
    if (this.tint) {
      this.tint.left -= dt;
      if (this.tint.left <= 0) this.tint = null;
      else if (g.draught) g.draught[this.tint.aspect] = Math.max(g.draught[this.tint.aspect] || 0, TINT_DRAUGHT); // (its paint's feeling lent to your blows while it lasts: courier/mind.js fades it after)
    }
    if (kind === 'crude' && g.stains) {
      const r = g.stains.wipe(at, at, this.groundY ?? at.y, BRUSH.mop.rate * J.ground.drink * dt, 1.2); // (the mop's rate: each blot emptied is washed by you)
      if (r?.got > 0) { this.drunk += r.got; if (this.drunk >= 1) { const n = Math.floor(this.drunk); this.drunk -= n; g.events?.emit('mount.drink', { cells: n, mount: 'slipjelly', by: 'courier' }); } }
    }
    if ((kind === 'paint' || kind === 'crude') && this.hp < J.hp.max) this.hp = Math.min(J.hp.max, this.hp + J.hp.mend * dt);
  }

  /** It rises under the Courier, and they are lifted onto its crown. */
  stepCall(dt) {
    const P = this.P, t = Math.min(1, this.phaseT / J.call.arrive), gy = this.groundAt(P.pos) ?? this.groundY;
    this.groundY = gy;
    const lift = t * t * (3 - 2 * t);
    P.vel.set(0, (gy + SEAT * lift - P.pos.y) / dt, 0); P.move(dt); P.grounded = true;
    if (t >= 1) {
      this.phase = 'ride'; this.body.deform.kick(-1.5, null, 0.2);
      this.game.events?.emit('mount.ride', { mount: 'slipjelly', by: 'courier' }); // (it holds: the first ride's line is the tracking's)
    }
    return true;
  }
  /** It slumps back into the ground (or bursts), and the Courier is set down where it stood. */
  slump(why) { this.endWhy = why; this.phase = 'off'; this.phaseT = 0; this.body.deform.target.squash = 0.25; }
  stepOff(dt) {
    const P = this.P, gy = this.groundY ?? P.pos.y, t = Math.min(1, this.phaseT / SLUMP);
    P.vel.set(this.v.x * (1 - t), (gy + SEAT * (1 - t) - P.pos.y) / dt, this.v.z * (1 - t)); P.move(dt); P.grounded = true;
    if (t >= 1) return this.finish(this.endWhy || 'dismiss');
    return true;
  }
  finish(why) { this.endWhy = why; if (why === 'door' || why === 'seam') this.waiting = true; return false; }

  end() {
    const g = this.game, P = this.P, why = this.endWhy || 'dismiss';
    this.choice?.close(); this.choice = null; this.yRide = null;
    P.setShape('stand'); P.vel.y = Math.min(P.vel.y, 0);
    if (this.groundY != null && P.pos.y > this.groundY + 0.05 && !this.air) P.pos.y = this.groundY + 0.02;
    if (this.body) this.body.root.visible = false;
    g.events?.emit('mount.end', { why, secs: +this.rideT.toFixed(1), mount: 'slipjelly', by: 'courier' });
    this.phase = null;
  }

  /** A blow on the rider: it lands on the jelly first (k a crack's share). True when the jelly took it. */
  absorb(k) {
    if (!this.active || this.phase !== 'ride') return false;
    const g = this.game;
    this.hp = Math.max(0, this.hp - k * HP_PER_K);
    this.body?.deform.kick(-1.8, null, 0.3);
    g.events?.emit('mount.hurt', { hp: +this.hp.toFixed(1), mount: 'slipjelly', by: 'courier' });
    if (this.hp <= 0) this.burst();
    return true;
  }
  burst() {
    const g = this.game, P = this.P;
    this.hp = J.hp.max; this.reformAt = this.now + J.hp.reform;
    g.fx?.impact?.(P.pos.clone().setY(this.groundY ?? P.pos.y), UP, { sparks: 0, dust: 26 }); // (placeholder: its burst is Calissa's, on mount.burst)
    g.events?.emit('mount.burst', { mount: 'slipjelly', by: 'courier' });
    this.slump('burst'); this.phaseT = SLUMP; // (gone at once: set down where it was)
  }

  // ------------------------------------------------------------------ its body (the wild jelly's mesh and melt: a placeholder)
  ensureBody() {
    if (this.body) return;
    const g = this.game, geo = g.jellies?.geo; if (!geo) { this.body = { root: new THREE.Group(), deform: { target: { squash: 1 }, kick() {}, update() {} } }; return; }
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, metalness: 0, emissive: 0x000000, emissiveIntensity: 1 });
    addRim(mat, 0.5);
    const deform = new JellyDeform(mat, H, { melt: true }); deform.wet = 1;
    const root = new THREE.Group(), mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true; mesh.renderOrder = 2; root.add(mesh);
    root.name = 'jellyMount'; root.visible = false; g.scene.add(root);
    this.body = { root, mesh, mat, deform, base: new THREE.Color(0xffffff) };
  }

  /** Every frame: the clock, the body drawn under the rider (its melt, its squash, its colour), the choice's strip. */
  tick(dt) {
    this.now += dt;
    const B = this.body; if (!B?.mesh || !B.root.visible) return;
    const P = this.P, p = P.renderPos ?? P.pos, gy = this.groundY ?? p.y - SEAT;
    B.root.position.set(p.x, Math.min(gy, p.y - SEAT * 0.9), p.z);
    B.root.rotation.y = this.heading;
    const rise = this.phase === 'call' ? Math.min(1, this.phaseT / J.call.arrive) : 1;
    B.root.scale.set(1, Math.max(0.05, (p.y - B.root.position.y) / SEAT) * rise || 0.05, 1);
    B.deform.feet = Math.min(1, this.v.length() / J.speeds.cruise);
    B.deform.update(dt, this.accel || null);
    const want = this.tint ? _c.setHex(COLOR[this.tint.aspect] ?? 0xffffff).lerp(B.base, 0.35) : B.base; B.mat.color.lerp(want, Math.min(1, dt * 4));
  }

  /** The rider sits cross-legged on its crown (the /sit emote's loop; the skiff's stance where the suite has none). */
  animate(ch, base) {
    if (this.w <= 0.001) return;
    const C = ch.clips, clip = C.clips.Emote_SitCrossLoop ? 'Emote_SitCrossLoop' : C.clips.Skiff_RideIdle ? 'Skiff_RideIdle' : null; if (!clip) return;
    this.pose ||= C.pose();
    C.blend(base, C.sample(clip, this.t, this.pose, true), this.w);
  }

  /** The camera stood back and aimed a little lower than on foot, so the jelly under the rider is in the frame. */
  camera(fp, pivot) {
    if (!this.active || this.w < 0.05) return; // (`fp` is the first person's eye, always given: the pivot is the third person's alone)
    _v.set(Math.sin(this.P.yaw), 0, Math.cos(this.P.yaw));
    pivot.addScaledVector(_v, -2.4 * this.w); pivot.y -= 0.7 * this.w; // (the jelly's crown at the frame's middle, the jelly under it in view)
  }
  label() { return `SLIP JELLY ${Math.round(this.hp)} / ${J.hp.max}${this.chain ? ` · BOUNCE ${this.chain}` : ''}${this.tint ? ` · ${this.tint.aspect.toUpperCase()}` : ''}`; }
}
const _c = new THREE.Color();
