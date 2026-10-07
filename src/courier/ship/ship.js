// ---------------------------------------------------------------------------------------
// THE SHIP ON THE RAIL: the Vessoul's sloop form in a crossing, and every verb the player has there (docs/plans/RAIL.md sections 4
// and 8; its numbers are T.ship, core/config.js, Petra's feel). It lives in the RAIL'S FRAME (x across, y up, z along: views.js), in a
// box about the rail point, and the view decides which two of its three numbers WASD moves (the PLANE: views.axes).
//
//   WASD      the ship in the view's plane: a critically damped approach to 14 m/s (Star Fox 64's Arwing settles, it never wobbles);
//             it banks into a sideways move and pitches into a climb, so it shows its intent before it arrives
//   mouse     the reticle (chase, free, astern): two marks on one line from the nose, at 12 m and 36 m (Star Fox 64: depth read without
//             stereo); in the scroll views (above, side) the gun fires along the scroll and the mouse rests (a shmup's honesty), and
//             abeam (into the screen) in the side view while a set piece runs alongside (the brig's broadside, Old Nobody's flank)
//   LMB held  full auto, a shot on each sixteenth of the cue (Rez: firing is playing the hi-hat)
//   RMB held  the lock-on sweep: the far reticle paints what it passes, one a sixteenth, up to eight; release fires a lance at each, a
//             sixteenth apart, 3 Lachryma a lance (RayStorm)
//   E         the barrel roll: 0.35 s, turning plain shots for its first quarter second; the Blink's two charges (Star Fox 64)
//   V         the parry: a quarter second in which an outlined shot near the hull goes home (as on foot: PARRY.md)
//   Q         polarity: the ship's feeling flips between yours and its opposite (Ikaruga)
//   Shift, C  boost and brake: the ship's place along the rail moves within a window; the music, the clock, never does
//
// A hit: the ship is untouchable a second and its glow holds steady (never a blink: CLAUDE.md); the screen shakes as trauma squared
// (Eiserloh), never for a fish. What a hit, an absorb or a down is worth is the stage's (world/emocean/stage.js keeps the run).
//
// Prior art: as each verb says; the box the camera half follows is Star Fox 64's, the spring is the critically damped one of every
// good third-person camera (Game Programming Gems 4, "Critically Damped Ease-In/Ease-Out Smoothing").
//
//   const ship = new Ship(game, rail)   ship.build(scene)   ship.begin(aspect)   ship.update(dt, { view, plane, sixteenth, shots, waves })
//   ship.local   ship.aspect   ship.turning   ship.hit(shot) -> consumed   ship.absorb(shot)   ship.turned(shot)   ship.locks   ship.show(on)
//   ship.onHit / onAbsorb / onRoll / onParry / onVolley / onLock (the stage's)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../../core/config.js';
import { sfx } from '../../audio/sfx.js';
import { Sloop } from '../../vfx/sloop.js';
import { COLOR, OPPOSITE } from '../../progress/weather.js';
import { axes, planeOf, VIEW_RIGS, CRUISE } from './views.js';

const D2R = Math.PI / 180, SCALE = 0.24; // (the sloop is 7 m: at the rail it is a 1.7 m ship, its hurtbox 0.35 m)
const damp = THREE.MathUtils.damp, clamp = THREE.MathUtils.clamp;
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _n = new THREE.Vector3(), _sp = new THREE.Vector3(), _st = new THREE.Vector3();
/** The view's own frame in the rail's: which way is ahead and which is the screen's right (astern is mirrored). */
const VIEW_FWD = { chase: [0, 0, 1], free: [0, 0, 1], astern: [0, 0, -1], above: [0, 0, 1], side: [0, 0, 1] };
const VIEW_RIGHT = { chase: 1, free: 1, astern: -1, above: 1, side: 1 };
const RET = { chase: [9, 6], free: [15, 9], astern: [9, 6] }; // (how far the reticle may stray at 36 m, across and up)

export class Ship {
  constructor(game, rail) {
    this.game = game; this.rail = rail;
    this.local = new THREE.Vector3(0, CRUISE, 0); this.vel = new THREE.Vector3();
    this.ret = { x: 0, y: 0 }; this.aim = new THREE.Vector3(0, 0, 1); this.nose = new THREE.Vector3();
    this.aspect = 'mirth'; this.home = 'mirth';
    this.boostZ = 0; this.bank = 0; this.pitch = 0;
    this.rollT = 0; this.spin = 0; this.charges = T.ship.roll.charges; this.rechargeT = 0;
    this.parryT = 0; this.recover = 0; this.mercy = 0;
    this.locks = []; this.painting = false; this.queue = []; this.lastSixteenth = -1;
  }

  build(scene) {
    this.sloop = new Sloop({ env: this.game.sky?.env || null });
    this.sloop.group.scale.setScalar(SCALE); this.sloop.group.visible = false; this.sloop.group.userData.zoneFree = true;
    scene.add(this.sloop.group);
    // the two reticles and the lock marks (placeholders for Calissa's: rings that face the camera)
    const ring = (r, w, c, o) => { const m = new THREE.Mesh(new THREE.RingGeometry(r - w, r, 24), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthTest: false, depthWrite: false })); m.renderOrder = 20; m.visible = false; m.userData.zoneFree = true; m.frustumCulled = false; scene.add(m); return m; };
    this.near = ring(0.32, 0.06, 0xfff2c8, 0.85); this.far = ring(0.9, 0.12, 0xfff2c8, 0.9);
    this.marks = Array.from({ length: T.ship.lock.max }, () => ring(1.2, 0.14, 0x9ff3ff, 0.95));
  }
  show(on) {
    if (!this.sloop) return;
    this.sloop.group.visible = on; this.near.visible = this.far.visible = on;
    if (!on) for (const m of this.marks) m.visible = false;
  }

  /** A crossing begins: the ship at the rail point, its feeling yours (the stones' draught, else the island's mood). */
  begin(aspect = 'mirth') {
    this.home = this.aspect = aspect;
    this.local.set(0, CRUISE, 0); this.vel.set(0, 0, 0); this.ret.x = this.ret.y = 0;
    this.boostZ = 0; this.bank = this.pitch = 0; this.rollT = 0; this.spin = 0;
    this.charges = T.ship.roll.charges; this.rechargeT = 0; this.parryT = 0; this.recover = 0; this.mercy = 0;
    this.locks.length = 0; this.queue.length = 0; this.painting = false; this.lastSixteenth = -1;
    this.tint();
  }

  get turning() { const R = T.ship.roll; return this.rollT > R.time - R.turns; }

  // ---------------------------------------------------------------- the frame
  update(dt, { view, plane, sixteenth, shots, waves, abeam = false }) {
    const S = T.ship, I = this.game.input, raw = this.game.rawDt ?? dt, keys = I?.down || new Set(), hit = I?.pressed || new Set();
    // move in the plane the view gives (it turns at a swing's midpoint: views.js)
    const [ax, ay] = axes(plane), h = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0), v = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0);
    const want = _a.set(0, 0, 0);
    want[ax.k] += h * ax.s * S.top; want[ay.k] += v * ay.s * S.top;
    const pl = planeOf(plane);
    // boost and brake: the place along the rail (in the screen plane, where z is otherwise pinned)
    const bz = keys.has('ShiftLeft') || keys.has('ShiftRight') ? S.boost.ahead : keys.has('KeyC') ? -S.boost.behind : 0;
    this.boostZ += clamp(bz - this.boostZ, -S.boost.rate * dt, S.boost.rate * dt);
    // the pinned axis eases home: z to the boost's place on the screen, y to the cruise height over the sea, x to the rail on the wall
    if (pl === 'screen') want.z = (this.boostZ - this.local.z) * 4;
    else if (pl === 'sea') want.y = (CRUISE - this.local.y) * 4;
    else if (pl === 'wall') want.x = (0 - this.local.x) * 4;
    for (const k of ['x', 'y', 'z']) this.vel[k] = damp(this.vel[k], want[k], S.spring, dt);
    this.local.addScaledVector(this.vel, dt);
    const B = S.box, zc = pl === 'screen' ? this.boostZ : 0;
    this.local.x = clamp(this.local.x, -B.x, B.x); this.local.y = clamp(this.local.y, B.yLo, B.yHi); this.local.z = clamp(this.local.z, zc - B.z, zc + B.z);
    // bank and pitch show the intent (screen-right in the view, so the astern view banks the right way)
    const sx = (pl === 'wall' ? this.vel.z : this.vel.x * (VIEW_RIGHT[view] || 1)), sy = this.vel.y;
    this.bank = damp(this.bank, clamp(sx * S.bank, -S.bankMax, S.bankMax) * D2R, 10, dt);
    this.pitch = damp(this.pitch, clamp(sy * S.pitch, -S.pitchMax, S.pitchMax) * D2R, 10, dt);
    this.aimAt(view, I, abeam && view === 'side');
    // the roll, its charges, the parry's window, the mercy after a hit
    const R = S.roll;
    if (hit.has('KeyE') && this.rollT <= 0 && this.charges >= 1) { this.rollT = R.time; this.charges--; sfx.roll(); this.onRoll?.(); }
    if (this.rollT > 0) { this.rollT = Math.max(0, this.rollT - dt); this.spin = (1 - this.rollT / R.time) * Math.PI * 2 * (sx >= 0 ? 1 : -1); } else this.spin = 0;
    if (this.charges < R.charges) { this.rechargeT += dt; if (this.rechargeT >= R.recharge) { this.rechargeT = 0; this.charges++; } } else this.rechargeT = 0;
    this.recover = Math.max(0, this.recover - raw);
    if (hit.has('KeyV') && this.parryT <= 0 && this.recover <= 0) this.parryT = 0.25;
    if (this.parryT > 0) {
      const n = shots?.parry(this.local, 2.6) || 0;
      if (n) { this.parryT = 0; this.onParry?.(n); }
      else { this.parryT -= raw; if (this.parryT <= 0) this.recover = 0.35; } // (a parry into nothing costs a breath: no mashing through a wall)
    }
    this.mercy = Math.max(0, this.mercy - dt);
    if (hit.has('KeyQ')) { this.aspect = this.aspect === this.home ? OPPOSITE[this.home] || this.home : this.home; this.tint(); sfx.click?.(); this.game.events?.emit('rail.polarity', { aspect: this.aspect, by: 'courier' }); }
    // the gun, the sweep and the volley, all on the sixteenth (Rez)
    if (sixteenth !== this.lastSixteenth) {
      this.lastSixteenth = sixteenth;
      if (keys.has('Mouse0')) { shots?.gun(this.nose, this.aim); sfx.tap?.(9); }
      if (this.painting) this.paint(waves);
      const q = this.queue.shift();
      if (q) { if (q.to.alive && this.game.lachryma?.spend(S.lock.cost, 'lance') !== false) shots?.lance(this.nose, q.to, q.volley); else q.volley.flown++; }
    }
    const rmb = keys.has('Mouse2');
    if (rmb && !this.painting) { this.painting = true; this.locks.length = 0; }
    if (!rmb && this.painting) {
      this.painting = false;
      const live = this.locks.filter((f) => f.alive);
      if (live.length) { const volley = { n: live.length, flown: 0, hit: 0, downs: 0 }; for (const to of live) this.queue.push({ to, volley }); this.onVolley?.(volley); sfx.seekers?.(live.length); }
      this.locks.length = 0;
    }
    this.place(view);
  }

  /** Where the gun points: from the nose to the reticle at 36 m (free views), or along the scroll (above, side). */
  aimAt(view, I, abeam = false) {
    const [d1, d2] = T.ship.reticles, f = abeam ? [-1, 0, 0] : VIEW_FWD[view] || VIEW_FWD.chase, lim = RET[view]; // (abeam: a set piece alongside, the gun at it, into the screen)
    this.nose.copy(this.local).add(_n.set(0.9 * f[0], 0, 0.9 * f[2]));
    if (!lim || VIEW_RIGS[view] == null) { this.ret.x = damp(this.ret.x, 0, 8, 1 / 60); this.ret.y = damp(this.ret.y, 0, 8, 1 / 60); this.aim.set(...f); }
    else {
      const k = 0.035;
      this.ret.x = clamp(this.ret.x + (I?.dx || 0) * k, -lim[0], lim[0]); this.ret.y = clamp(this.ret.y - (I?.dy || 0) * k, -lim[1], lim[1]);
      _b.set(f[0], f[1], f[2]).multiplyScalar(d2).add(this.nose); _b.x += this.ret.x * (VIEW_RIGHT[view] || 1); _b.y += this.ret.y;
      this.aim.copy(_b).sub(this.nose).normalize();
    }
    this.retNear = _sp.copy(this.nose).addScaledVector(this.aim, d1).clone();
    this.retFar = _st.copy(this.nose).addScaledVector(this.aim, d2).clone();
  }

  /** The sweep: the foe nearest the far reticle on the screen, within reach and not painted yet. */
  paint(waves) {
    const L = T.ship.lock, cam = this.game.camera;
    if (!waves || !cam || this.locks.length >= L.max) return;
    const rp = this.rail.toWorld(this.retFar, _a).project(cam), asp = cam.aspect || 16 / 9;
    let best = null, bd = L.reach;
    for (const f of waves.foes) {
      if (!f.alive || f.lock === false || this.locks.includes(f)) continue; // (behind the camera is refused below: the screen decides)
      const p = _b.copy(f.pos).project(cam); if (p.z > 1) continue;
      const d = Math.hypot((p.x - rp.x) * asp, p.y - rp.y) / 2;
      if (d < bd) { bd = d; best = f; }
    }
    if (best) { this.locks.push(best); this.onLock?.(this.locks.length - 1); } // (its tone: rail.lock, on the music's sixteenth: audio/cues.js)
  }

  // ---------------------------------------------------------------- what the shots ask
  hit(s) {
    if (this.mercy > 0) return true; // (the second after a hit: shots pass harmlessly, and are spent)
    this.mercy = T.ship.mercy;
    sfx.impact?.(2);
    this.onHit?.(s);
    return true;
  }
  absorb(s) { this.onAbsorb?.(s); sfx.absorb?.(0); }
  turned() { sfx.ricochet?.(); }

  tint() { const c = COLOR[this.aspect] ?? 0xffc65c; this.sloop?.keelMat?.color.setHex(c); } // (the ship's feeling as its keel's glow: Calissa's to dress)

  /** The model, the reticles and the lock marks in the world. */
  place(view) {
    if (!this.sloop) return;
    const g = this.sloop.group, t = this.game.dunes?.t ?? 0;
    this.rail.toWorld(this.local, g.position);
    g.rotation.set(-this.pitch, 0, this.bank + this.spin, 'YXZ');
    this.sloop.set({ sail: 1, glow: this.mercy > 0 ? 1 : 0.6, t });
    const cam = this.game.camera, scroll = !RET[view];
    this.rail.toWorld(this.retNear, this.near.position); this.rail.toWorld(this.retFar, this.far.position);
    this.near.visible = this.far.visible = this.sloop.group.visible;
    this.near.material.opacity = scroll ? 0.35 : 0.85;
    if (cam) { this.near.quaternion.copy(cam.quaternion); this.far.quaternion.copy(cam.quaternion); }
    this.marks.forEach((m, i) => {
      const f = this.locks[i];
      m.visible = !!f?.alive && this.sloop.group.visible;
      if (m.visible) { m.position.copy(f.pos); if (cam) m.quaternion.copy(cam.quaternion); m.scale.setScalar(Math.max(1, f.radius)); }
    });
  }
}
