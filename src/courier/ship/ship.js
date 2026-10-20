// ---------------------------------------------------------------------------------------
// THE SHIP ON THE RAIL: the Vessoul's sloop form in a crossing, and every verb the player has there (docs/plans/RAIL.md sections 4
// and 8; its numbers are T.ship, core/config.js, Petra's feel). It lives in the RAIL'S FRAME (x across, y up, z along: views.js), in a
// box about the rail point, and the view decides which two of its three numbers WASD moves (the PLANE: views.axes).
//
//   WASD      the ship in the view's plane: a critically damped approach to 14 m/s (Star Fox 64's Arwing settles, it never wobbles);
//             it banks into a sideways move and pitches into a climb, so it shows its intent before it arrives
//   mouse     the reticle (chase, free, astern): a cursor over the whole screen (the mouse's pixels, kept through a swing: the owner's
//             bug, RAIL-OVERHAUL.md 1.4), and a ray from the camera through it each frame: the gun aims where it meets the plane 36 m
//             ahead, or at the first foe it crosses; two marks on the nose's line, at 12 m and there (Star Fox 64: depth read without
//             stereo, Sin & Punishment's free cursor); above, twin-stick: the gun toward the cursor on the sea plane, no lock-on (the
//             owner, 2026-10-20); side the same on the wall plane, the lock-on kept (RAIL-MODULES.md 1.5), and abeam (into the screen)
//             while a set piece runs alongside (the brig's broadside, Old Nobody's flank)
//   LMB held  full auto, a shot on each sixteenth of the cue (Rez: firing is playing the hi-hat)
//   RMB held  the lock-on sweep: the far reticle paints what it passes, one a sixteenth, up to eight; release fires a lance at each, a
//             sixteenth apart, 3 Lachryma a lance (RayStorm)
//   E         the barrel roll: 0.35 s; for its first quarter second it turns plain shots and sends an outlined shot near the hull home
//             (the parry at sea: V retires on the rail, the owner's ruling); the Blink's two charges (Star Fox 64)
//   Q         the FORMS (RAIL-OVERHAUL.md 4, the owner's idea): breach into the Astral form, dive into the Umbral (Ikaruga's polarity
//             as Orta's forms): a shot of your form's kind is drunk, the other hurts; Astral fast, wide, a spread of three and eight locks,
//             Umbral slower, tighter, one heavy shot and four locks; a hull that cannot dive refuses it. The old polarity rides with it
//             (Astral is your feeling, Umbral its opposite) for the shots of a direct hop
//   R         the SURGE: the absorbed Lachryma let go at once, a lance at everything on the screen and a half bar untouchable; it costs
//             the chain (Panzer Dragoon's Berserk, Child of Eden's Euphoria)
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
import { shipLook } from '../../vfx/shipclasses.js';
import { COLOR, OPPOSITE } from '../../progress/weather.js';
import { axes, planeOf, VIEW_RIGS, CRUISE, reachOf } from './views.js';
import { SHIPS } from '../../progress/rail/ships.js';

const D2R = Math.PI / 180;
export const SCALE = 0.24; // (the sloop is 7 m: at the rail it is a 1.7 m ship, its hurtbox 0.35 m)
const damp = THREE.MathUtils.damp, clamp = THREE.MathUtils.clamp;
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _n = new THREE.Vector3(), _sp = new THREE.Vector3(), _st = new THREE.Vector3();
/** The view's own frame in the rail's: which way is ahead and which is the screen's right (astern is mirrored). */
const VIEW_FWD = { chase: [0, 0, 1], free: [0, 0, 1], astern: [0, 0, -1], above: [0, 0, 1], side: [0, 0, 1] };
const VIEW_RIGHT = { chase: 1, free: 1, astern: -1, above: 1, side: 1 };
const RET = { chase: 1, free: 1, astern: 1, above: 1, side: 1 }; // (the cursor aims in every view: above twin-stick, the owner's ruling 2026-10-20; side too, RAIL-MODULES.md 1.5)
/** The forms (RAIL-OVERHAUL.md 4): pace and box as shares, the gun, the lock-on's most; Umbral rides low (a stand-in until Calissa's
 *  surface from below: the dive's look). */
const FORM = { astral: { pace: 1.2, box: 1, spread: 3, heavy: 1, locks: 8, cruise: 0 }, umbral: { pace: 0.85, box: 0.8, spread: 1, heavy: 2.5, locks: 4, cruise: -1.6 } };
const SURGE = { full: 100, per: 4, mercy: 1.1 }; // (an absorbed shot fills 4; full at 100; untouchable half a bar of the cue)
const _fv = new THREE.Vector3();
const _ray = new THREE.Raycaster(), _c2 = new THREE.Vector2(), _o = new THREE.Vector3(), _d = new THREE.Vector3(), _w = new THREE.Vector3(), _e = new THREE.Vector3(), _nz = new THREE.Vector3(), _sw = new THREE.Vector3();
const ABEAM_WAY = [-1, 0, 0];

/** The hull drawn after the foes' shots (their marks are drawn without depth, over what came before: renderOrder 43, vfx/railshots.js),
 *  so the ship is never lost under them; its own gun and hurtbox draw over it again (shots.js, 60). The owner's R17, v133. */
const OVER_SHOTS = 50;
// (a shared material, the outline hulls' above all, is never flipped: it is every prop's in the game, and turning it transparent moved
// them all into the sorted pass and compiled three programs more; the rim stays opaque, under the hull drawn after the shots)
function overShots(group) { group.traverse((o) => { if (!o.isMesh) return; o.renderOrder = OVER_SHOTS; for (const m of Array.isArray(o.material) ? o.material : [o.material]) if (m && !m.transparent && !m.userData.shared) { m.transparent = true; m.depthWrite = true; } }); }

export class Ship {
  constructor(game, rail) {
    this.game = game; this.rail = rail;
    this.local = new THREE.Vector3(0, CRUISE, 0); this.vel = new THREE.Vector3();
    this.cursor = { x: 0, y: 0.15 }; this.aim = new THREE.Vector3(0, 0, 1); this.nose = new THREE.Vector3();
    this.aspect = 'mirth'; this.home = 'mirth';
    this.boostZ = 0; this.bank = 0; this.pitch = 0;
    this.rollT = 0; this.spin = 0; this.charges = T.ship.roll.charges; this.rechargeT = 0;
    this.parryT = 0; this.recover = 0; this.mercy = 0;
    this.locks = []; this.painting = false; this.queue = []; this.lastSixteenth = -1;
  }

  build(scene) {
    this.look = new Sloop({ env: this.game.sky?.env || null });
    this.look.group.scale.setScalar(SCALE); this.look.group.visible = false; this.look.group.userData.zoneFree = true; overShots(this.look.group);
    scene.add(this.look.group);
    // the two reticles and the lock marks (placeholders for Calissa's: rings that face the camera)
    const ring = (r, w, c, o) => { const m = new THREE.Mesh(new THREE.RingGeometry(r - w, r, 24), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthTest: false, depthWrite: false })); m.renderOrder = 20; m.visible = false; m.userData.zoneFree = true; m.frustumCulled = false; scene.add(m); return m; };
    this.near = ring(0.32, 0.06, 0xfff2c8, 0.85); this.far = ring(0.9, 0.12, 0xfff2c8, 0.9);
    this.marks = Array.from({ length: T.ship.lock.max }, () => ring(1.2, 0.14, 0x9ff3ff, 0.95));
  }
  show(on) {
    if (!this.look) return;
    this.look.group.visible = on; this.near.visible = this.far.visible = on;
    if (!on) for (const m of this.marks) m.visible = false;
  }

  /** A crossing begins: the ship at the rail point, its feeling yours (the stones' draught, else the island's mood). */
  begin(aspect = 'mirth', ship = 'sloop') {
    this.home = this.aspect = aspect; this.qSaid = false; this.form = 'astral'; this.surge = 0;
    this.local.set(0, CRUISE, 0); this.vel.set(0, 0, 0); this.cursor.x = 0; this.cursor.y = 0.15; this.boxSet = false;
    this.boostZ = 0; this.bank = this.pitch = 0; this.rollT = 0; this.spin = 0;
    this.charges = T.ship.roll.charges; this.rechargeT = 0; this.parryT = 0; this.recover = 0; this.mercy = 0;
    this.locks.length = 0; this.queue.length = 0; this.painting = false; this.lastSixteenth = -1;
    this.rehull(ship);
  }
  /** The hull sailed (progress/rail/ships.js, the owner's trade): its pace, box and hurtbox as shares of the sloop's, its locks, whether
   *  it dives, and its look dressed. At cast-off, and in the showcase crossing's turns (world/emocean/triprun.js); a hull that cannot
   *  dive comes up into the Astral form. */
  rehull(ship = 'sloop') {
    const H = SHIPS[ship] || SHIPS.sloop, B = SHIPS.sloop;
    this.hull = { id: SHIPS[ship] ? ship : 'sloop', pace: H.speed / B.speed, box: H.box / B.box, hurt: T.ship.hurt * (H.hurtbox / B.hurtbox), locks: Math.min(H.locks, T.ship.lock.max), dive: H.dive };
    if (!H.dive && this.form === 'umbral') { this.form = 'astral'; this.aspect = this.home; this.game.events?.emit('rail.form', { form: this.form, by: 'environment' }); }
    this.boxSet = false; this.dress(this.hull.id); this.tint();
  }

  get sloop() { return this.look; } // (the old name: vfx/crossinglook.js, vfx/encounters/film.js and the emocean sweep still read it; Calissa's and Dovina's to move)
  /** The hull's look (vfx/shipclasses.js: one built a class, on first sailing, and kept): `this.look` is the look of the hull sailing. */
  dress(id) {
    if (!this.look) return;
    const L = (this.looks ||= { sloop: this.look }), was = this.look; // (the looks by hull, the sloop's first)
    if (!L[id]) { L[id] = shipLook(id, { env: this.game.sky?.env || null }); L[id].group.scale.setScalar(SCALE); L[id].group.userData.zoneFree = true; overShots(L[id].group); }
    if (L[id] === was) return;
    const now = L[id]; now.group.visible = was.group.visible; was.group.visible = false;
    if (!now.group.parent) was.group.parent?.add(now.group);
    this.look = now;
  }

  get turning() { const R = T.ship.roll; return this.rollT > R.time - R.turns; }

  // ---------------------------------------------------------------- the frame
  update(dt, { view, plane, sixteenth, shots, waves, abeam = false, arena = false, swing = null }) {
    const S = T.ship, I = this.game.input, raw = this.game.rawDt ?? dt, keys = I?.down || new Set(), hit = I?.pressed || new Set();
    // move in the plane the view gives (it turns at a swing's midpoint: views.js)
    const [ax, ay] = axes(plane), h = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0), v = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0);
    const want = _a.set(0, 0, 0);
    const F = FORM[this.form] || FORM.astral, hull = { pace: (this.hull?.pace ?? 1) * F.pace, box: (this.hull?.box ?? 1) * F.box };
    want[ax.k] += h * ax.s * S.top * hull.pace; want[ay.k] += v * ay.s * S.top * hull.pace;
    const pl = planeOf(plane);
    // boost and brake: the place along the rail (in the screen plane, where z is otherwise pinned)
    const bz = keys.has('ShiftLeft') || keys.has('ShiftRight') ? S.boost.ahead : keys.has('KeyC') ? -S.boost.behind : 0;
    this.boostZ += clamp(bz - this.boostZ, -S.boost.rate * dt, S.boost.rate * dt);
    // the pinned axis eases home: z to the boost's place on the screen, y to the cruise height over the sea, x to the rail on the wall
    if (pl === 'screen') want.z = (this.boostZ - this.local.z) * 4;
    else if (pl === 'sea') want.y = (CRUISE + F.cruise - this.local.y) * 4; // (Umbral rides low)
    else if (pl === 'wall') want.x = (0 - this.local.x) * 4;
    for (const k of ['x', 'y', 'z']) this.vel[k] = damp(this.vel[k], want[k], S.spring, dt);
    this.local.addScaledVector(this.vel, dt);
    // the box: the view's reach on the screen for the two axes its plane moves (views.reachOf: the frame less 8%), the old box for the
    // pinned one; its edges ease to a new view's (a swing turns the plane at its midpoint: the ship is drawn in, never snapped)
    const B = S.box, k = hull.box, zc = pl === 'screen' ? this.boostZ : 0, cam = this.game.camera, dz = pl === 'screen' ? Math.round(this.boostZ * 2) / 2 : 0, Rv = reachOf(view, cam?.aspect || 16 / 9, T.camera.tpFov, 0.84, [dz, dz]); // (at the boost's depth, to half a metre)
    const want2 = this.boxWant ||= { x: [0, 0], y: [0, 0], z: [0, 0] }, box = this.box ||= { x: [0, 0], y: [0, 0], z: [0, 0] };
    want2.x[0] = (Rv.x ? Rv.x[0] : -B.x) * k; want2.x[1] = (Rv.x ? Rv.x[1] : B.x) * k;
    want2.y[0] = Math.max(B.yLo + F.cruise * 0.5, Rv.y ? Rv.y[0] : -Infinity); want2.y[1] = B.yLo + ((Rv.y ? Rv.y[1] : B.yHi) - B.yLo) * k + F.cruise;
    want2.z[0] = Rv.z ? Rv.z[0] * k : zc - B.z * k; want2.z[1] = Rv.z ? Rv.z[1] * k : zc + B.z * k;
    for (const a of ['x', 'y', 'z']) for (const i of [0, 1]) box[a][i] = this.boxSet ? damp(box[a][i], want2[a][i], 4, raw) : want2[a][i];
    this.boxSet = true;
    for (const a of ['x', 'y', 'z']) { const v = this.local[a], c = clamp(v, box[a][0], box[a][1]); if (c !== v) { this.local[a] = c; if (Math.sign(this.vel[a]) === Math.sign(v - c)) this.vel[a] = 0; } }
    // bank and pitch show the intent (screen-right in the view, so the astern view banks the right way)
    const sx = (pl === 'wall' ? this.vel.z : this.vel.x * (VIEW_RIGHT[view] || 1)), sy = this.vel.y;
    this.bank = damp(this.bank, clamp(sx * S.bank, -S.bankMax, S.bankMax) * D2R, 10, dt);
    this.pitch = damp(this.pitch, clamp(sy * S.pitch, -S.pitchMax, S.pitchMax) * D2R, 10, dt);
    this.aimAt(view, I, abeam, waves, arena, swing); this.aimArgs = [view, abeam, waves, arena, swing];
    // the roll, its charges (and its window the parry at sea), the mercy after a hit
    const R = S.roll;
    if (hit.has('KeyE') && this.rollT <= 0 && this.charges >= 1) { this.rollT = R.time; this.charges--; sfx.roll(); this.onRoll?.(); }
    if (this.rollT > 0) { this.rollT = Math.max(0, this.rollT - dt); this.spin = (1 - this.rollT / R.time) * Math.PI * 2 * (sx >= 0 ? 1 : -1); } else this.spin = 0;
    if (this.charges < R.charges) { this.rechargeT += dt; if (this.rechargeT >= R.recharge) { this.rechargeT = 0; this.charges++; } } else this.rechargeT = 0;
    // the parry at sea is the roll (the owner's ruling, RAIL-OVERHAUL.md: V retires on the rail): its turning window sends an outlined
    // shot near the hull home as well as turning the plain ones; its charges are what keep it from being mashed
    if (this.turning) { const n = shots?.parry(this.local, 2.6) || 0; if (n) this.onParry?.(n); }
    this.mercy = Math.max(0, this.mercy - dt);
    if (hit.has('KeyQ') && this.hull && !this.hull.dive) { if (!this.qSaid) { this.qSaid = true; this.game.events?.emit('rail.refuse', { what: 'dive', ship: this.hull.id, by: 'courier' }); } } // (a heavy hull rides the surface: ships.js dive)
    else if (hit.has('KeyQ')) { this.form = this.form === 'astral' ? 'umbral' : 'astral'; this.game.events?.emit('rail.form', { form: this.form, by: 'courier' }); this.aspect = this.aspect === this.home ? OPPOSITE[this.home] || this.home : this.home; this.tint(); sfx.click?.(); this.game.events?.emit('rail.polarity', { aspect: this.aspect, by: 'courier' }); }
    // the gun, the sweep and the volley, all on the sixteenth (Rez)
    if (sixteenth !== this.lastSixteenth) {
      this.lastSixteenth = sixteenth;
      if (keys.has('Mouse0')) { // (Astral a spread of three, Umbral one heavy shot)
        if (F.spread > 1) for (let i = 0; i < F.spread; i++) shots?.gun(this.nose, _n.copy(this.aim).applyAxisAngle(_b.set(0, 1, 0), (i - (F.spread - 1) / 2) * 0.06));
        else { const s = shots?.gun(this.nose, this.aim); if (s) s.dmg = F.heavy; }
        sfx.tap?.(9);
      }
      if (this.painting) this.paint(waves);
      const q = this.queue.shift();
      if (q) { if (q.to.alive && this.game.lachryma?.spend(S.lock.cost, 'lance') !== false) shots?.lance(this.nose, q.to, q.volley); else q.volley.flown++; }
    }
    // the surge (R): full, a lance at everything on the screen, untouchable half a bar; the chain is its price
    if (hit.has('KeyR') && this.surge >= SURGE.full) this.letGo(waves, shots);
    const rmb = keys.has('Mouse2') && view !== 'above' && swing?.to !== 'above'; // (no lock-on above: the locks held fly as lances before a swing into it, RAIL-MODULES.md 1.5)
    if (rmb && !this.painting) { this.painting = true; this.locks.length = 0; }
    if (!rmb && this.painting) {
      this.painting = false;
      const live = this.locks.filter((f) => f.alive);
      if (live.length) { const volley = { n: live.length, flown: 0, hit: 0, downs: 0 }; for (const to of live) this.queue.push({ to, volley }); this.onVolley?.(volley); sfx.seekers?.(live.length); }
      this.locks.length = 0;
    }
    this.place(view);
  }

  /** Where the gun points: from the nose to the far reticle, 36 m out along the view's way (under the cursor in the free views, along
   *  the scroll in above and side). Across a swing it eases from the old view's place to the new one's over the swing's bar, never
   *  snapping at its midpoint (the owner's "the reticle breaks when changing perspectives": Calissa's measure, RAIL-BUGS-MEASURED.md 2). */
  aimAt(view, I, abeam = false, waves = null, arena = false, swing = null) {
    const d1 = T.ship.reticles[0], f = this.gunWay(view, abeam), C = this.cursor;
    this.nose.copy(this.local).add(_n.set(0.9 * f[0], 0, 0.9 * f[2]));
    // the cursor: the mouse's pixels as a share of the screen, counted only while the view shows it (a hidden cursor that kept counting
    // came back pinned at the screen's edge after a scroll view: the owner's "becomes locked")
    if (this.cursorOn(view, arena)) { const W = innerWidth || 960, H = innerHeight || 540; C.x = clamp(C.x + ((I?.dx || 0) * 2) / W, -1, 1); C.y = clamp(C.y - ((I?.dy || 0) * 2) / H, -1, 1); }
    const far = this.farOf(view, abeam, waves, arena, _st);
    if (swing) { // (both ends of the swing aimed and eased between, smoothstep as the camera's blend: from the old view's place to the new one's)
      const other = swing.from === view ? swing.to : swing.from, e = swing.k * swing.k * (3 - 2 * swing.k);
      far.lerp(this.farOf(other, abeam, waves, arena, _sw), swing.from === view ? e : 1 - e);
    }
    this.aim.copy(far).sub(this.nose).normalize();
    this.retNear = _sp.copy(this.nose).addScaledVector(this.aim, Math.min(d1, far.distanceTo(this.nose) * 0.5)).clone(); // (the near mark always nearer than the far)
    this.retFar = far.clone();
  }
  /** The gun's way in a view (abeam: into the screen, at a set piece alongside in the side view). */
  gunWay(view, abeam) { return abeam && view === 'side' ? ABEAM_WAY : VIEW_FWD[view] || VIEW_FWD.chase; }
  /** Does the view aim by the cursor? (the free views; the maelstrom's arena in the side view: charybdis.js) */
  cursorOn(view, arena) { return !!(RET[view] || arena) && VIEW_RIGS[view] != null; }
  /** The far reticle in one view, into `out`: where the cursor's ray meets the plane the ship sails in (above, side), or the plane 36 m
   *  out from the nose along the gun's way, square to it (chase, free, astern, and abeam), or the first foe that ray crosses before it
   *  (what is under the cursor is what is shot). A ray that meets its plane behind the eye (mid-swing, the camera still turned away)
   *  takes the cursor's ray 36 m out, never a point off the screen. */
  farOf(view, abeam, waves, arena, out) {
    const d2 = T.ship.reticles[1], f = this.gunWay(view, abeam), cam = this.game.camera, R = this.rail;
    const nose = _nz.copy(this.local).add(_n.set(0.9 * f[0], 0, 0.9 * f[2]));
    out.copy(nose).addScaledVector(_b.set(f[0], f[1], f[2]), d2);
    if (!this.cursorOn(view, arena) || !cam || !R.toLocal) return out;
    cam.updateMatrixWorld(); _ray.setFromCamera(_c2.set(this.cursor.x, this.cursor.y), cam);
    R.toLocal(_ray.ray.origin, _o); R.dirLocal(_ray.ray.direction, _d);
    const pl = planeOf(view), ax = pl === 'sea' ? 'y' : pl === 'wall' && f !== ABEAM_WAY ? 'x' : null;
    if (ax) { // (the scroll views: the cursor where it meets the plane the ship sails in, the gun toward it; abeam in the side view the gun still goes into the screen, at the set piece alongside)
      const t = Math.abs(_d[ax]) > 1e-4 ? (this.local[ax] - _o[ax]) / _d[ax] : -1;
      return out.copy(_o).addScaledVector(_d, t > 0 ? t : d2);
    }
    _fv.set(f[0], f[1], f[2]); const dn = _d.dot(_fv), t = Math.abs(dn) > 1e-4 ? _w.copy(out).sub(_o).dot(_fv) / dn : -1;
    out.copy(_o).addScaledVector(_d, t > 0 ? t : d2);
    let best = t > 0 ? t : d2; const past = _w.copy(nose).sub(_o).dot(_d) + 2; // (only a foe the ray meets beyond the ship: one passing by the camera is not what the cursor means)
    for (const foe of waves?.foes || []) {
      if (!foe.alive) continue;
      R.toLocal(foe.pos, _w); const tt = _e.copy(_w).sub(_o).dot(_d); if (tt <= past || tt >= best) continue;
      if (_w.distanceTo(_a.copy(_o).addScaledVector(_d, tt)) <= Math.max(0.8, foe.radius || 0)) { best = tt; out.copy(_a); } // (the point on the ray, in its reach: the reticle stays under the cursor, a big hull's centre may be far off it)
    }
    return out;
  }

  /** Aimed again once the camera is placed this frame (main.js calls the stage's reaim after the camera, RAIL-BUGS-MEASURED.md 2.5): the
   *  cursor's ray through this frame's camera, so the reticle never lags it by a frame when it shakes or swings. */
  reaim() { if (!this.aimArgs) return; const [view, abeam, waves, arena, swing] = this.aimArgs; this.aimAt(view, null, abeam, waves, arena, swing); this.place(view); }

  /** The sweep: the foe nearest the far reticle on the screen, within reach and not painted yet. */
  paint(waves) {
    const L = T.ship.lock, cam = this.game.camera;
    if (!waves || !cam || this.locks.length >= Math.min(this.hull?.locks ?? L.max, (FORM[this.form] || FORM.astral).locks)) return;
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
  absorb(s) { this.surge = Math.min(SURGE.full, this.surge + SURGE.per); this.onAbsorb?.(s); sfx.absorb?.(0); }
  /** A foe's shot passed close without a hit (the shot field's call, once a shot: Dovina's measure): Lachryma to the pool, capped a bar
   *  (T.ship.graze; the owner's ruling, 2026-10-20). The stage pays it (onGraze). */
  graze(s) { this.onGraze?.(s); }
  returned() { sfx.ricochet?.(); this.onReturned?.(); }
  /** The hurtbox the shot field reads (the hull's: ships.js). */
  get hurtR() { return this.hull?.hurt ?? T.ship.hurt; }
  /** The surge let go: a lance at every live foe the camera sees, both worlds, and a half bar untouchable; the chain reset (the stage's). */
  letGo(waves, shots) {
    const cam = this.game.camera, live = (waves?.foes || []).filter((f) => f.alive && f.lock !== false && _b.copy(f.pos).project(cam).z < 1 && Math.abs(_b.x) < 1.1 && Math.abs(_b.y) < 1.1);
    const volley = { n: live.length, flown: 0, hit: 0, downs: 0 };
    for (const f of live) shots?.lance(this.nose, f, volley);
    this.surge = 0; this.mercy = Math.max(this.mercy, SURGE.mercy);
    this.onSurge?.(volley); this.game.events?.emit('rail.surge', { n: live.length, by: 'courier' }); sfx.seekers?.(live.length);
  }
  turned() { sfx.ricochet?.(); }

  tint() { const c = COLOR[this.aspect] ?? 0xffc65c; this.look?.keelMat?.color.setHex(c); } // (the ship's feeling as its keel's glow: Calissa's to dress)

  /** The model, the reticles and the lock marks in the world. */
  place(view) {
    if (!this.look) return;
    const g = this.look.group, t = this.game.dunes?.t ?? 0;
    this.rail.toWorld(this.local, g.position);
    g.rotation.set(-this.pitch, 0, this.bank + this.spin, 'YXZ'); if (this.rail.q) g.quaternion.premultiply(this.rail.q); // (the rail's turn: railpath.js)
    this.look.set({ sail: 1, glow: this.mercy > 0 ? 1 : 0.6, t, form: this.form, roll: this.rollT > 0 ? 1 - this.rollT / T.ship.roll.time : 0 }); // (form and roll: the mast's fold, vfx/shipkit/rig.js)
    const cam = this.game.camera, scroll = !RET[view];
    this.rail.toWorld(this.retNear, this.near.position); this.rail.toWorld(this.retFar, this.far.position);
    this.near.visible = this.far.visible = this.look.group.visible;
    this.near.material.opacity = scroll ? 0.35 : 0.85;
    if (cam) { this.near.quaternion.copy(cam.quaternion); this.far.quaternion.copy(cam.quaternion); }
    this.marks.forEach((m, i) => {
      const f = this.locks[i];
      m.visible = !!f?.alive && this.look.group.visible;
      if (m.visible) { m.position.copy(f.pos); if (cam) m.quaternion.copy(cam.quaternion); m.scale.setScalar(Math.max(1, f.radius)); }
    });
  }
}
