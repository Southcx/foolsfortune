// ---------------------------------------------------------------------------------------
// THE MECH'S PILOT: the controller of the body cradle in the mech's chest (docs/plans/MECHS.md 4; world/cradles.js kind `body`). The
// Pneuka Jar sealed in drives it (the Courier held and hidden by the cradle, set on the ground beside it for the zones and the sound,
// as the free helm holds them: world/opensea/helm.js), with the keys taken for its own while sealed (core/input.js claim: nothing else
// reads them, and unsealing gives them back exactly). Everything it moves by is the frame's physics (progress/mechs/frame.js):
//   the walk toward `walkTop` with the stride: a step every `stats.step` real s, its phase kept; a step started on the beat (each
//     natural step, or a turn between steps) or fought (a sharp turn mid-swing) said to sync (rules.js beatOf, syncStep)
//   the boosts: Shift tapped a quick boost (Δv `qb`), held the assault boost (thrust over mass against the air's drag, to `boostTop`);
//     past the walk the frame coasts down by its own τ = m / C; the booster draws `fire` kW while it fires
//   Space: a jump (`jump` m/s) on a biped or reverse joint; a tetrapod's hover (free while still); held in the air, the booster's rise
//   sync, energy and the cable (rules.js syncStep, energyStep: on the cable within ENERGY.cable of its socket the battery refills; off
//     it the battery, then the pool at POOL_KJ a point, then the mech fails: the cradle's wreck); the barrier pressed on V
//   damage into its FORMS.mech vessel by region (vessel.js blowOn; the pool's shield first, down while V presses), each crack's
//     feedback said (`mech.feedback { k, region }`, cracking your Pneuka Jar at the region it echoes to, never past a shatter); a blow shakes the view (visual.shake); a region broken as MECHS.md 4.7; the core broken or the cracks past the line, it fails,
//     unless the berserk is rolled (4.8: 12 real s on its own toward the giant, then it kneels and the Jar is out uncracked)
// The camera pulled out by the mech's height, swung by the mouse (a cinema shot, as the helm's chase).
// v2 (MECHS.md 9): the toy city stops the frame above its step and is floor where it stands (city.js solidAt, topAt; a roof said as
// mech.roof); the techniques and the prop in hand take their keys first (mechtech.js, props.js: F picks up before it plugs); a prop's
// mass is load; every blow strains the frame's joints (joints.js strainBlow: a snapped part hidden and thrown off as a limb), a
// fractured hip strides shorter, a leg gone walks at JOINT_PILOT.oneLeg kneeling to that side, the head gone takes the lock-on.
//
// Prior art: Armored Core's quick and assault boosts and its leg types, Evangelion's sync ratio, cable and berserk, Giant Clank's
// pulled-out camera, the free helm (a body driven from a cradle, the Courier held beside it), a pendulum.
//
//   const M = new MechPilot(hangar)   M.toGantry()   M.toField(at, yaw)   M.onSeal()   M.onUnseal(why)   M.update(dt) (sealed: the
//   cradle's update)   M.idle(dt) (unsealed)   M.hurt(region, k, by)   M.mode ('gantry' | 'lift' | 'pilot' | 'parked')   M.sync M.battery
//   M.cable (a socket index or null)   M.berserk (real s left)   M.pos M.yaw M.speed   M.target() (what the giant reads)   PILOT   CLAIM
//   events: mech.seal, mech.unseal { why }, mech.launch, mech.step { beat }, mech.boost { kind }, mech.hurt { region, k, broke },
//   mech.cable { plugged }, mech.berserk, mech.fail { why }, mech.feedback { k, region }, mech.sync { v } (at most once a real second),
//   mech.roof { by }, mech.joint { who: 'mech', joint, to, label, by }   M.tech (MechTech)   M.armLock(side | part)   M.strain(region, k, by)
//   JOINT_PILOT   MECH_PARTS
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { shakeOf } from '../../core/config.js';
import { stream } from '../../core/rng.js';
import { G as GRAV, DRAG, QB } from '../../progress/mechs/frame.js';
import { SYNC, syncCeiling, beatOf, syncStep, outputK, feedbackK, ENERGY, POOL_KJ, energyStep, BERSERK, berserkRoll } from '../../progress/mechs/rules.js';
import { blowOn, crackSum, breakLine, FORMS } from '../../progress/combat/vessel.js';
import { HANGAR, PROVING, SOCKET_REACH, clampProving } from './layout.js';
import { MechBody, MECH_BODY, seatOf, heightOf } from './mech.js';
import { MechWeapons } from './mechweapons.js';
import { MechTech } from './mechtech.js';
import { MechSpecials } from './mechspecials.js';
import { strainBlow, lockOf, headOff, legsLeft, past } from '../../progress/mechs/joints.js';
import { GIANT_LOOK } from './giant.js';

/** The pilot's own numbers (placeholders for feel, South's to judge): the camera's stand-off as shares of the mech's height (behind,
 *  above, where it looks); the mouse's swing (rad a pixel); the mech's turn (rad a real s, a tank's on the spot quicker); a Shift
 *  held longer than `tap` real s is the assault boost; a heading change sharper than `fight` rad starts a step where it is; the hover's
 *  rise cap (m/s); the kneel's ease (a real s); the speed under which the frame stands. */
export const PILOT = { cam: { back: 2.3, up: 0.95, look: 0.62, ease: 14, clear: 1.5 }, swing: 0.0026, pitch: 0.002, turn: 1.4, tankTurn: 2, tap: 0.22, fight: 0.7, rise: 8, kneel: 1, still: 0.4 };
/** The keys taken while sealed (core/input.js claim): the walk, boosts, jump, the arms, the back unit, the barrier, the cable, unseal,
 *  and the Courier's own verbs that would otherwise wake under them (the belt's R and X, the emotes' and the god hand's keys). */
export const CLAIM = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight', 'Space', 'Mouse0', 'Mouse1', 'Mouse2', 'KeyG', 'KeyV', 'KeyF', 'KeyX', 'KeyQ', 'KeyE', 'KeyR', 'KeyC', 'KeyY'];
const R = stream('world/hangar'), SHAKE_R = stream('world/hangar/shake'); // (the camera's shake its own draw, so a look never moves the berserk's rolls)
/** A chunk's landing or a collapse felt through the ground: reach (m) and the shake a blow's k gives (camera()). */
const QUAKE = { reach: 90, k: 0.5 };
/** The mech's regions as the vessel's (MECHS.md 4.7: the cracks echo into your Pneuka Jar where they land on the frame). */
const ECHO = { head: 'mask', core: 'torso', back: 'torso', armL: 'armL', armR: 'armR', legs: null };
/** The joints at the pilot (MECHS.md 9.3): one leg left, the walk's top at `oneLeg` (Dovina's); a frame steps up `step` m of rubble
 *  without a jump; a top `roof` m or more over the ground is a roof (mech.roof). */
export const JOINT_PILOT = { oneLeg: 0.3, step: 1.6, roof: 5 };
/** The part a snapped joint takes off the frame (mech.js partAt, props.js spawnLimb). */
export const MECH_PARTS = { neck: 'head', shoulderL: 'armL', shoulderR: 'armR', elbowL: 'forearmL', elbowR: 'forearmR', hipL: 'legL', hipR: 'legR', backMount: 'back' };
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _f = new THREE.Vector3(), _c = new THREE.Vector3(), _l = new THREE.Vector3(), _s = new THREE.Vector3();

export class MechPilot {
  constructor(hangar) {
    this.hangar = hangar; this.game = hangar.game; this.state = hangar.state;
    this.pos = new THREE.Vector3(); this.vel = new THREE.Vector3(); this.yaw = 0; this.vy = 0;
    this.camYaw = 0; this.camPitch = 0.28; this.shake = 0; this.mode = 'gantry'; this.kneel = 0; this.dt = 0;
    this.mech = null; this.weapons = new MechWeapons(this); this.tech = new MechTech(this); this.specials = new MechSpecials(this); this.cableLine = null;
    this.resetRun();
  }
  get stats() { return this.state.stats; }
  get giant() { return this.hangar.giant?.c ? this.hangar.giant : null; }
  get into() { return this.hangar.field?.group || null; }
  get speed() { return Math.hypot(this.vel.x, this.vel.z); }
  broken(region) { return this.state.broken(region); }
  forward(out) { return out.set(Math.sin(this.yaw), 0, Math.cos(this.yaw)); }
  resetRun() {
    this.sync = SYNC.start; this.battery = this.stats.capacity; this.cable = null; this.berserk = 0; this.phase = 0; this.gait = 0; this.walking = false;
    this.shiftT = -1; this.assault = false; this.boostT = 0; this.grounded = true; this.lastWish = null; this.faceT = 0; this.syncSaid = 0; this.spentKJ = 0;
    this.prevDown = {}; this.pressing = false; this.weapons.reset(); this.tech?.reset(); this.specials?.reset(); this.peakY = null;
  }

  /** The body built (or rebuilt on assembling) into the scene. */
  build() { if (!this.mech) { this.mech = this.game.makeMechBody?.() ?? new MechBody(this.game); this.game.scene.add(this.mech.group); } this.mech.build(this.stats); this.pose(); } // (the parts body, vfx/mechs/partsbody.js; the placeholder where it is not installed)
  /** The cradle's height above the frame's feet, measured off the body as built (its seat between the shoulder blades), else the rule's. */
  seatH() { const B = this.mech; if (!B?.seat || !B.group) return seatOf(this.stats); B.group.updateMatrixWorld(true); return B.seat(_c).y - B.group.position.y; }
  clampPos() { clampProving(this.pos, MECH_BODY.radius); }
  dispose() { this.weapons.dispose(); this.mech?.dispose(); this.mech = null; this.dropCable(); }

  /** Back in the gantry, kneeling no more, its seat at the walkway's height (the lift raised or lowered for the frame's legs). */
  toGantry() {
    const A = HANGAR.at, Gn = HANGAR.gantry;
    this.mode = 'gantry'; this.kneel = 0; this.vel.set(0, 0, 0); this.vy = 0; this.yaw = Gn.yaw; this.camYaw = Gn.yaw;
    this.pos.set(A.x + Gn.x, A.y + HANGAR.walkY + 0.6 - this.seatH(), A.z + Gn.z);
    this.dropCable(); this.resetRun(); this.pose();
  }
  toField(at, yaw) { this.mode = 'pilot'; this.pos.copy(at); this.yaw = yaw; this.camYaw = yaw; this.vel.set(0, 0, 0); this.vy = 0; this.grounded = true; this.pose(); }

  // ------------------------------------------------------------------ the seal
  onSeal() {
    const g = this.game; g.input?.claim('mech', CLAIM);
    this.kneelTo = 0; this.prevDown = {}; this.pressing = false;
    if (this.mode === 'gantry') { this.resetRun(); this.mode = 'lift'; this.liftT = 0; g.events?.emit('mech.launch', { by: 'courier' }); }
    else this.mode = 'pilot';
    g.events?.emit('mech.seal', { frame: { ...this.stats.sel }, by: 'courier' });
  }
  onUnseal(why) {
    const g = this.game; g.input?.release('mech'); g.cinema?.unshot('mech');
    if (this.mode === 'lift') this.toGantry(); else if (this.mode !== 'gantry') this.mode = 'parked';
    this.assault = false; this.boostT = 0; this.pressing = false; this.berserk = 0;
    g.events?.emit('mech.unseal', { why, by: why === 'wrecked' || why === 'berserk' ? 'environment' : 'courier' });
  }

  /** While sealed (the cradle's update, before the camera): the launch's ride up, then the fight. */
  update(dt) {
    if (this.hangar.bout?.take(dt)) return; // (a bout in the boxing ring holds the mech: ringbout.js poses it, seats the Jar and holds the camera)
    const g = this.game, c = this.hangar.cradle; this.dt = dt;
    if (this.mode === 'lift') this.lift(dt); else if (this.mode === 'pilot') this.drive(dt);
    this.kneel = Math.max(0, this.kneel - dt / PILOT.kneel);
    this.pose(); this.seatJar(c); this.holdCourier(c);
    this.camera(dt);
    if ((this.syncSaid -= g.rawDt ?? dt) <= 0 && this.mode === 'pilot') { this.syncSaid = 1; g.events?.emit('mech.sync', { v: +this.sync.toFixed(3), by: 'courier' }); }
  }
  /** Not sealed (the hangar's frame): it kneels where it stopped, the cable line kept to its socket. */
  idle(dt) {
    if (this.mode === 'parked') this.kneel = Math.min(1, this.kneel + dt / PILOT.kneel);
    this.weapons.update(dt * this.specials.hasteK); this.pose(); this.drawCable();
    const c = this.hangar.cradle; if (c) this.placeCradle(c);
  }

  /** The launch: the gantry's lift rides up the shaft, then under the seam the mech is set down in the proving ground. */
  lift(dt) {
    if (this.game.mechMount?.playing) return; // (the lift waits for the Jar to screw in and the frame to wake: Calissa's mount, vfx/mechs/mount.js, `mech.mount { beat: 'power' }`)
    const L = HANGAR.lift; this.liftT += dt;
    this.pos.y += (L.rise / L.t) * dt;
    if (this.liftT >= L.t && !this.liftDone) {
      this.liftDone = true;
      const go = () => { const A = PROVING.at, P = PROVING.launch; this.liftDone = false; this.toField(new THREE.Vector3(A.x + P.x, A.y, A.z + P.z), P.yaw); this.game.cinema?.cut('mech'); };
      if (!this.game.seam?.cross(go, { kind: 'plain' })) go();
    }
  }

  // ------------------------------------------------------------------ the drive
  keys() {
    const I = this.game.input, live = I?.enabled && !this.game.log?.typing;
    const down = (k) => !!live && I.rawDown(k), pressed = (k) => !!live && I.rawPressed(k);
    const was = this.prevDown, now = {}; for (const k of ['Mouse0', 'Mouse2', 'KeyV', 'Space', 'KeyC']) now[k] = down(k);
    const released = (k) => !!was[k] && !now[k];
    this.prevDown = now;
    return { down, pressed, released };
  }

  drive(dt) {
    const g = this.game, S = this.stats, K = this.keys(), out = this.berserk > 0 ? outputK(1) : outputK(this.sync);
    // the wish from the camera (berserk: toward the giant, the keys steering a little)
    const cf = _f.set(Math.sin(this.camYaw), 0, Math.cos(this.camYaw)), cr = _v.set(-cf.z, 0, cf.x);
    const ix = (K.down('KeyD') ? 1 : 0) - (K.down('KeyA') ? 1 : 0), iz = (K.down('KeyW') ? 1 : 0) - (K.down('KeyS') ? 1 : 0);
    const wish = _w.set(0, 0, 0).addScaledVector(cf, iz).addScaledVector(cr, ix);
    if (this.berserk > 0) { this.berserk -= dt; const Gi = this.giant; if (Gi) wish.multiplyScalar(0.25).add(_c.subVectors(Gi.pos, this.pos).setY(0).normalize()); if (this.berserk <= 0) { this.endBerserk(); return; } }
    if (wish.lengthSq() > 1) wish.normalize();
    const legsOut = this.broken('legs'), J = this.state.joints, legs = legsLeft(J);
    const legK = legs === 2 ? Math.min(lockOf(J, 'legL'), lockOf(J, 'legR')) : legs === 1 ? JOINT_PILOT.oneLeg : 0; // (a fractured hip strides at joints.js legLocked; a leg gone, it drags itself; none, it sits)
    const pm = this.hangar.props?.heldMass || 0, loadK = (S.mass / (S.mass + pm)) * (S.mass + pm > S.load ? 0.5 : 1); // (a prop held is load: frame.js's overweight rule past the legs' load)
    const top = S.walkTop * this.specials.hasteK * out * (legsOut ? 0.5 : 1) * legK * loadK, moving = wish.lengthSq() > 0.01;
    // turning: toward the wish, or the giant a beat after a blow (faceGiant)
    let want = moving ? Math.atan2(wish.x, wish.z) : null;
    if (this.faceT > 0 && this.giant) { this.faceT -= dt; want = Math.atan2(this.giant.pos.x - this.pos.x, this.giant.pos.z - this.pos.z); }
    if (want !== null) { const d = Math.atan2(Math.sin(want - this.yaw), Math.cos(want - this.yaw)), rate = (S.legType === 'tank' ? PILOT.tankTurn : PILOT.turn) * (this.faceT > 0 ? 2 : 1); this.yaw += Math.sign(d) * Math.min(Math.abs(d), rate * dt); }
    // the boosts: a tap, or held
    let boosting = this.boostT > 0; this.boostT -= dt;
    if (K.pressed('ShiftLeft') || K.pressed('ShiftRight')) this.shiftT = 0;
    const shift = K.down('ShiftLeft') || K.down('ShiftRight');
    if (this.shiftT >= 0) {
      if (shift) { this.shiftT += dt; if (!this.assault && this.shiftT > PILOT.tap && S.boostTop > 0) { this.assault = true; g.events?.emit('mech.boost', { kind: 'assault', by: 'courier' }); } }
      else {
        if (!this.assault && S.qb > 0) { const dir = moving ? wish : this.forward(_s); this.vel.addScaledVector(_s.copy(dir).normalize(), S.qb * out); this.boostT = QB.t; boosting = true; g.events?.emit('mech.boost', { kind: 'quick', by: 'courier' }); }
        this.assault = false; this.shiftT = -1;
      }
    }
    if (this.berserk > 0 && S.boostTop > 0 && this.giant && this.weapons.gap() > 30) this.assault = true; // (berserk: it runs at the giant)
    if (this.assault) {
      const f = this.forward(_s), along = this.vel.dot(f), m = S.mass + pm, a = (S.thrust * out) / m - (DRAG * Math.max(0, along)) / m;
      this.vel.addScaledVector(f, a * dt); boosting = true;
    } else {
      const sp = this.speed;
      if (sp > top + 0.5 && this.boostT <= 0) this.vel.multiplyScalar(Math.exp(-dt / S.tau)); // (past the walk it coasts down by its own τ = m / C)
      else if (this.boostT <= 0) { const acc = top / Math.max(0.5, S.step || 1); _c.copy(wish).multiplyScalar(top).sub(this.vel).setY(0); const n = _c.length(); if (n > 0) this.vel.addScaledVector(_c, Math.min(1, (acc * dt) / n)); }
    }
    // the jump, the hover, the rise
    const space = K.down('Space');
    this.tech.jumpKeys(K, dt); // (the jump, and Super Jump once open: mechtech.js)
    let hover = false;
    if (space && !this.grounded) {
      if (S.hoverFree) { hover = true; if (this.vy < 0) this.vy = 0; if (this.speed > 1) boosting = true; }
      else if (S.boostTop > 0 && S.legType !== 'tank') { this.vy = Math.min(PILOT.rise, this.vy + ((S.thrust * out) / S.mass - GRAV) * dt); boosting = true; }
    }
    if (!this.grounded && !hover) this.vy -= GRAV * dt;
    this.tech.ram(dt); // (the Battering Ram carves the path before the walls are asked)
    this.move(dt);
    this.stride(dt, wish, moving);
    // the techniques and the prop in hand first (mechtech.js, props.js), then the arms, the back unit, the barrier, the cable
    const used = this.tech.drive(K, dt);
    if (!used.L) this.weapons.arm('L', { down: K.down('Mouse0'), pressed: K.pressed('Mouse0'), released: K.released('Mouse0') });
    if (!used.R) this.weapons.arm('R', { down: K.down('Mouse2'), pressed: K.pressed('Mouse2'), released: K.released('Mouse2') });
    if (this.berserk > 0 && this.giant && this.weapons.gap() < 14) { this.weapons.arm('L', { pressed: true }); this.weapons.arm('R', { pressed: true }); } // (berserk: it strikes)
    this.weapons.backUnit(K.pressed('KeyG'));
    this.specials.drive(K, dt); // (each worn part's special on its slot's key: mechspecials.js)
    this.pressing = K.down('KeyV');
    if (K.pressed('KeyF')) { const P = this.hangar.props; if (P?.held) P.drop(); else if (!P?.grab()) this.plug(); } // (F: a prop in reach picked up, the one held put down, else the cable)
    if (this.assault && this.giant && this.weapons.gap() < 1.5) { this.weapons.charge(this.speed); this.vel.multiplyScalar(0.2); this.assault = false; this.shiftT = -1; }
    this.weapons.update(dt);
    // sync and the battery
    const mind = g.courierMind, ceiling = syncCeiling(mind?.v ?? 0.5, !!mind?.brimming);
    const low = this.battery < this.stats.capacity * ENERGY.low && this.cable === null;
    this.sync = syncStep(this.sync, { dt, low, ceiling });
    this.energy(dt, boosting);
    if (K.pressed('KeyX') && this.berserk <= 0) this.game.cradles?.unseal('x', 'courier');
  }

  /** Moved by its velocity, kept out of the knee-high blocks (unless above them), the giant and the yard's walls; landed on the
   *  ground or a block's top. */
  move(dt) {
    const A = PROVING.at, r = MECH_BODY.radius, H = PROVING.blockH, p = this.pos, ox = p.x, oz = p.z, wasGrounded = this.grounded;
    p.addScaledVector(this.vel, dt); p.y += this.vy * dt;
    let floor = A.y, roof = false;
    const C = this.hangar.city;
    if (C?.built) { // (the toy city: walls stop the frame above its step, a roof or a stub of rubble is floor: city.js)
      const y0 = p.y + JOINT_PILOT.step, y1 = p.y + heightOf(this.stats), hit = (x, z) => C.solidAt(x, z, y0, y1, r * 0.8);
      if (hit(p.x, p.z)) { if (!hit(p.x, oz)) { p.z = oz; this.vel.z = 0; } else if (!hit(ox, p.z)) { p.x = ox; this.vel.x = 0; } else { p.x = ox; p.z = oz; this.vel.x = this.vel.z = 0; } }
      const top = C.topAt(p.x, p.z, p.y + JOINT_PILOT.step, r * 0.5); if (top !== null && top > floor) { floor = top; roof = top >= A.y + JOINT_PILOT.roof; }
    }
    for (const B of PROVING.blocks) {
      const cx = A.x + B.x, cz = A.z + B.z, hx = B.w / 2, hz = B.d / 2, top = A.y + H;
      const qx = Math.max(cx - hx, Math.min(cx + hx, p.x)), qz = Math.max(cz - hz, Math.min(cz + hz, p.z)), dx = p.x - qx, dz = p.z - qz, d = Math.hypot(dx, dz);
      if (p.y >= top - 0.4) { if (d < r * 0.5) floor = Math.max(floor, top); continue; }
      if (d < r) { if (d > 1e-4) { p.x = qx + (dx / d) * r; p.z = qz + (dz / d) * r; } else p.x = cx + hx + r; }
    }
    const Gi = this.giant;
    if (Gi?.c?.alive && Gi.down <= 0) { const dx = p.x - Gi.pos.x, dz = p.z - Gi.pos.z, d = Math.hypot(dx, dz), m = r + GIANT_LOOK.radius; if (d < m && d > 1e-4) { p.x = Gi.pos.x + (dx / d) * m; p.z = Gi.pos.z + (dz / d) * m; } }
    clampProving(p, r);
    if (p.y <= floor) { p.y = floor; this.vy = 0; this.grounded = true; }
    else if (p.y > floor + 0.05) this.grounded = false;
    if (!this.grounded) this.peakY = Math.max(this.peakY ?? p.y, p.y);
    else if (!wasGrounded) { // (landed: the Elbow Drop comes down, a roof stood on is said once a landing)
      const fall = Math.max(0, (this.peakY ?? p.y) - p.y); this.peakY = null;
      this.tech.landed(fall);
      if (roof) this.game.events?.emit('mech.roof', { by: 'courier' });
    }
  }

  /** The stride: a step every `stats.step` real s while it walks; a step's start on the beat or fought, said to sync. */
  stride(dt, wish, moving) {
    const S = this.stats; if (!(S.step > 0) || !this.grounded) return;
    if (moving && this.lastWish) {
      const turn = Math.acos(Math.max(-1, Math.min(1, wish.x * this.lastWish.x + wish.z * this.lastWish.z)));
      if (turn > PILOT.fight) this.step(beatOf(this.phase));
    } else if (moving && !this.walking) this.step(beatOf(this.phase));
    if (moving) (this.lastWish ||= new THREE.Vector3()).copy(wish).normalize(); else this.lastWish = null;
    if (moving || this.phase > 0) {
      this.walking = moving; this.phase += dt / S.step; this.gait += dt / S.step;
      if (this.phase >= 1) { this.phase -= 1; if (moving) this.step('beat'); else this.phase = 0; }
    }
  }
  step(beat) {
    this.phase = 0; this.walking = true;
    this.sync = syncStep(this.sync, { beat: beat === 'beat', fought: beat === 'fought', ceiling: this.ceiling() });
    this.game.events?.emit('mech.step', { beat, by: 'courier' });
  }
  ceiling() { const m = this.game.courierMind; return syncCeiling(m?.v ?? 0.5, !!m?.brimming); }
  staggerHit() { this.sync = syncStep(this.sync, { staggerHit: true, ceiling: this.ceiling() }); }
  faceGiant(range) { if (this.giant && this.weapons.gap() < range) this.faceT = 0.35; }
  spend(kJ) { if (this.berserk <= 0) this.spentKJ += kJ; }
  lockRange() { return headOff(this.state.joints) ? 0 : this.stats.lock * (this.broken('head') ? 0.5 : 1); } // (the head gone at its neck: no lock-on)
  aimDir(out) { return this.game.camera.getWorldDirection(out); }
  inView(p) { const cam = this.game.camera; cam.getWorldDirection(_l); return _c.subVectors(p, cam.position).normalize().dot(_l) > 0.5; }

  /** The battery and the cable: refilled on it, the parts' draw, the booster's fire and what was spent paid from it, then from the pool;
   *  dry, the mech fails. A cable pulled past its reach comes free with a jolt. Berserk: no draw. */
  energy(dt, boosting) {
    const g = this.game, pool = g.lachryma;
    if (this.cable !== null) {
      const s = this.socketAt(this.cable);
      if (Math.hypot(s.x - this.pos.x, s.z - this.pos.z) > ENERGY.cable) { this.dropCable(); g.events?.emit('mech.cable', { plugged: false, jolt: true, by: 'environment' }); this.hurt('back', ENERGY.jolt, 'environment'); }
    }
    this.netKW = this.stats.draw + (boosting ? this.stats.fire : 0) - (this.cable !== null ? this.stats.output : 0); // (the readout's seconds left)
    if (this.berserk > 0) { this.spentKJ = 0; return; }
    const e = energyStep(this.battery, this.stats, { dt, cable: this.cable !== null, boosting, spentKJ: this.spentKJ, pool: pool?.value ?? 0 });
    this.spentKJ = 0; this.battery = e.battery;
    if (e.poolKJ > 0 && pool) pool.drain(e.poolKJ / POOL_KJ, 'mech');
    if (e.dry || (e.poolKJ > 0 && (pool?.value ?? 0) <= 0.01)) this.fail('dry');
  }
  socketAt(i) { const A = PROVING.at, s = PROVING.sockets[i]; return _s.set(A.x + s.x, A.y, A.z + s.z); }
  /** F: plug the cable at the nearest socket in reach, or pull it out. */
  plug() {
    const g = this.game;
    if (this.cable !== null) { this.dropCable(); g.events?.emit('mech.cable', { plugged: false, by: 'courier' }); return; }
    let best = null, bd = SOCKET_REACH;
    PROVING.sockets.forEach((_, i) => { const s = this.socketAt(i), d = Math.hypot(s.x - this.pos.x, s.z - this.pos.z); if (d < bd) { bd = d; best = i; } });
    if (best === null) { g.log?.say('warn', 'No socket in reach for the cable.', { key: 'mech.cable', throttle: 3 }); return; }
    this.cable = best; g.events?.emit('mech.cable', { plugged: true, socket: best, by: 'courier' });
  }
  dropCable() { this.cable = null; if (this.cableLine) { this.cableLine.parent?.remove(this.cableLine); this.cableLine.geometry.dispose(); this.cableLine.material.dispose(); this.cableLine = null; } }
  drawCable() {
    if (this.cable === null || !this.mech) { if (this.cableLine) this.dropCable(); return; }
    if (!this.cableLine) { const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]); this.cableLine = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x2a1a12 })); this.cableLine.frustumCulled = false; this.into?.add(this.cableLine); }
    const a = this.socketAt(this.cable).setY(PROVING.at.y + 1.6), b = this.mech.back(_c), P = this.cableLine.geometry.attributes.position;
    P.setXYZ(0, a.x, a.y, a.z); P.setXYZ(1, b.x, b.y, b.z); P.needsUpdate = true;
  }

  // ------------------------------------------------------------------ the damage
  /** A blow on the mech: armour by region, the shield raised, the pool's shield (down while the barrier presses), its crack, its feedback. */
  hurt(region, k, by = 'creature') {
    const g = this.game, S = this.stats, pool = g.lachryma;
    if (this.giant && by === 'creature' && this.hangar.props?.shieldTake(this.giant.pos)) return; // (the slab held up takes it: props.js)
    const kk = k * this.specials.wardK * (S.armour[region] ?? 1) * (this.giant ? this.weapons.blockK(this.giant.pos) : 1);
    this.mech?.jiggle?.(Math.min(2, 1.5 * kk)); // (the doll's chest plates kicked by the blow: partsbody.js BUST_SPRING)
    const was = this.broken(region), r = blowOn(this.state.vessel, { region, k: kk, pool: this.pressing ? null : pool?.available ?? null }, 'mech');
    if (r.shield > 0) pool?.drain(r.shield, 'mech');
    this.state.hurt(r.state);
    this.sync = syncStep(this.sync, { hitK: kk, ceiling: this.ceiling() });
    const broke = !was && this.broken(region);
    g.events?.emit('mech.hurt', { region, k: +kk.toFixed(3), broke, by });
    this.strain(region, kk, by);
    this.shake = Math.max(this.shake, Math.min(1, kk * 2.5)); // (the camera's shake while sealed: camera())
    if (r.crack > 0) {
      const fk = feedbackK(this.sync) * r.crack, to = region === 'legs' ? ((this.leg = !this.leg) ? 'legL' : 'legR') : ECHO[region] ?? 'torso'; // (the legs' blows by turns on each leg)
      g.events?.emit('mech.feedback', { k: +fk.toFixed(4), region: to, by });
      // the echo is past the shield already (the mech's blowOn took it), and never shatters you in the cradle: the frame fails first (fail())
      if (fk > 0) g.vesselDamage?.hit({ k: fk / FORMS.courier.crack, region: to, why: 'feedback', by, past: true, spare: true });
    }
    if (this.broken('core') || crackSum(this.state.vessel) >= breakLine('mech')) this.fail('core');
  }
  /** A blow on a region strains the frame's joints (joints.js strainBlow, past its threshold): each joint that moved said; a snapped one's
   *  part hidden on the body and thrown off as a limb (props.js spawnLimb). */
  strain(region, kk, by) {
    const ch = strainBlow(this.state.joints, region, kk, 1); if (!ch.length) return; // (armour already in kk)
    this.state.dirty();
    for (const c of ch) {
      this.game.events?.emit('mech.joint', { who: 'mech', joint: c.joint, to: c.to, label: 'mech', by });
      const part = MECH_PARTS[c.joint]; if (c.to !== 'snapped' || !part || !this.mech) continue;
      if (part.endsWith('R') && this.hangar.props?.held) this.hangar.props.drop(); // (the right hand gone: what it held falls)
      this.hangar.props?.spawnLimb({ from: 'mech', part, at: this.mech.partAt(part, new THREE.Vector3()), label: 'mech' });
    }
  }
  /** How well a part works by its joints (joints.js lockOf): 'L' | 'R' an arm, or a part ('back', 'head', 'legL' ...). */
  armLock(side) { return lockOf(this.state.joints, side === 'L' ? 'armL' : side === 'R' ? 'armR' : side); }

  /** The ground's shock felt in the cradle: a chunk landing or a building felled at `at`, its weight `k`, fainter with distance (m). */
  quake(at, k) {
    if (this.mode !== 'pilot' || !at) return;
    const near = Math.max(0, 1 - Math.hypot(at.x - this.pos.x, at.z - this.pos.z) / QUAKE.reach);
    if (near > 0) this.shake = Math.max(this.shake, Math.min(1, k * QUAKE.k) * near);
  }
  /** It would fail: the berserk, rolled at high sync, or the cradle's wreck (the Jar thrown clear, cracked). */
  fail(why) {
    const g = this.game; if (this.berserk > 0 || this.mode !== 'pilot') return;
    if (berserkRoll(this.sync, R)) { this.berserk = BERSERK.for; this.assault = false; g.events?.emit('mech.berserk', { by: 'environment' }); return; }
    g.events?.emit('mech.fail', { why, by: why === 'dry' ? 'environment' : 'creature' });
    const C = g.cradles; if (C?.sealed === this.hangar.cradle) { C.wrecked = true; C.unseal('wrecked', 'environment'); }
  }
  endBerserk() { this.berserk = 0; this.kneel = 0.01; const C = this.game.cradles; if (C?.sealed === this.hangar.cradle) C.unseal('berserk', 'environment'); }

  /** What the giant reads of the mech: where it is, its footprint, its barrier pressed, its hurt. Null when no one drives it. */
  target() {
    if (this.mode !== 'pilot' || this.game.cradles?.sealed !== this.hangar.cradle) return null;
    this._t ||= { pos: this.pos, radius: MECH_BODY.radius, hurt: (rg, k, by) => this.hurt(rg, k, by), pressing: false };
    this._t.pressing = this.pressing;
    return this._t;
  }

  // ------------------------------------------------------------------ the look
  pose() {
    if (!this.mech) return;
    const walk = this.stats.step > 0 ? Math.min(1, this.speed / Math.max(1, this.stats.walkTop)) * (this.grounded ? 1 : 0.2) : 0;
    this.mech.pose({ pos: this.pos, yaw: this.yaw, gait: this.gait, walk, kneel: this.kneel, armL: this.weapons.swing('L'), armR: this.weapons.swing('R'),
      sealed: this.game.cradles?.sealed === this.hangar.cradle, barrier: this.pressing ? 1 : 0, joints: this.state.joints, holding: this.hangar.props?.held ? 'R' : null,
      lean: legsLeft(this.state.joints) === 1 ? (past(this.state.joints, 'hipL') ? 0.22 : -0.22) : 0 }); // (a leg gone: it kneels to that side)
    if (this.mode === 'gantry' || this.mode === 'lift') this.hangar.deck?.position.set(this.pos.x, this.pos.y - 0.5, this.pos.z);
  }
  /** The cradle where the seat is now; reached from the walkway in the gantry, from the ground beside it in the field. */
  placeCradle(c) {
    this.mech?.seat(c.pos);
    if (this.mode === 'gantry') { const A = HANGAR.at, W = HANGAR.walk; c.at.set(A.x + (W.x0 + W.x1) / 2, A.y + HANGAR.walkY, A.z + (W.z0 + W.z1) / 2); c.yaw = Math.PI; c.reach = 2.6; return; }
    const side = _c.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw)); // (the mech's left)
    c.at.copy(this.pos).addScaledVector(side, MECH_BODY.radius + 2.5).setY(PROVING.at.y); c.yaw = this.yaw + Math.PI / 2;
    c.reach = this.state.broken('core') ? 0 : 4; // (a failed mech cannot be sealed until mended at the gantry)
  }
  seatJar(c) { this.placeCradle(c); const J = this.game.god?.jar; if (J) { J.pos.copy(c.pos); J.group.position.copy(c.pos); J.group.rotation.set(0, this.yaw, 0); } }
  /** The Courier held on the ground beside the mech (hidden, frozen by the cradle), where the zones, the weather and the sound think they are. */
  holdCourier(c) {
    const P = this.game.player; if (!P) return;
    if (this.mode === 'lift' || this.mode === 'gantry') { const A = HANGAR.at; P.pos.set(A.x, A.y + 0.05, A.z + HANGAR.gantry.z + 12); } else P.pos.copy(c.at).setY(c.at.y + 0.05);
    P.prevPos?.copy(P.pos); P.renderPos?.copy(P.pos); P.vel?.set(0, 0, 0); P.place?.();
  }
  /** The chase pulled out by the mech's height, swung by the mouse; from the hangar's floor, looking up, while the lift rides. */
  camera(dt) {
    const g = this.game, I = g.input, h = heightOf(this.stats), C = PILOT.cam;
    this.shake = Math.max(0, this.shake - dt * 2.8); // (eased out in every mode, so none waits for the launch)
    if (this.mode === 'lift') {
      const A = HANGAR.at; _c.set(A.x + 6, A.y + 3, A.z + HANGAR.gantry.z + 30); _l.copy(this.pos).setY(this.pos.y + h * 0.6);
      g.cinema?.shot('mech', { pos: _c, look: _l, bars: 0, ease: C.ease }); return;
    }
    this.camYaw -= (I?.dx || 0) * PILOT.swing; this.camPitch = Math.max(-0.15, Math.min(0.9, this.camPitch + (I?.dy || 0) * PILOT.pitch));
    const back = h * C.back, a = this.camYaw;
    _c.set(this.pos.x - Math.sin(a) * back * Math.cos(this.camPitch), this.pos.y + h * C.up + Math.sin(this.camPitch) * back, this.pos.z - Math.cos(a) * back * Math.cos(this.camPitch));
    _l.copy(this.pos).setY(this.pos.y + h * C.look);
    this.clearCity(_l, _c, C.clear);
    if (this.shake > 0) { // (a blow felt in the cradle: the view knocked by its weight, scaled by the setting visual.shake)
      const m = this.shake * this.shake * h * 0.035 * shakeOf();
      _c.x += (SHAKE_R() - 0.5) * m; _c.y += (SHAKE_R() - 0.5) * m; _c.z += (SHAKE_R() - 0.5) * m;
    }
    g.cinema?.shot('mech', { pos: _c, look: _l, bars: 0, ease: C.ease });
  }
  /** The view kept out of the toy city's buildings: a building between the frame and the camera brings the camera in to `clear` metres
   *  short of it (a third-person camera's spring arm, Unreal's; the cells are the city's own, world/hangar/city.js raycast). */
  clearCity(from, to, clear) {
    const City = this.hangar.city; if (!City?.built || this.mode !== 'pilot') return;
    const len = _s.subVectors(to, from).length(); if (len < 0.01) return;
    const hit = City.raycast(from, _s.divideScalar(len), len); if (!hit) return;
    to.copy(from).addScaledVector(_s, Math.max(0, hit.t - clear));
  }
}
