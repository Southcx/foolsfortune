// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S FRAME: the three modifiers that make a stage a side-on stage (docs/plans/STRAWMANS-WELL.md 2), laid over the
// Courier while they are in the Well and taken off whole when they leave. The core movement is untouched (CLAUDE.md, the gold standard):
// nothing here is in courier/; each modifier wraps what the Player already reads, on the instance, and is unwrapped exactly.
//   THE PLANE   the body held to the stage's depth: after each fixed step its z set back to the lane's (pos, prevPos and renderPos, so the
//               interpolation never wobbles) and its z speed to zero, and the kinematic body's next place with it. The Player's own
//               `fixedUpdate` is wrapped on the instance (the stress test wraps `move` the same way); `pre` and `post` hooks run beside it
//               for the room's own mechanics (thin platforms, springs, the wall kick: world/strawmanwell/mechanics.js).
//   THE KEYS    A and D run: the body is turned to face its run (the view's yaw set to +x or -x by the last of them pressed) and the core
//               movement's own forward drives it (`axis('moveY')` is the run's push along the facing, `axis('moveX')` none), so mantle,
//               step-over, slide and the wall run work as anywhere. S held is the crouch (C held, where no tech owns the step). While a
//               tech owns the step it reads its own keys: the ladder, the pole and the grate as they are; the rest (the hang, the balance,
//               the push) have W as the run's way and S as against it. The mouse and the arrow keys do not turn the view; Z keeps the
//               third person. A Proxy over the Player's `input`, taken away on leaving.
//   THE CAMERA  side-on, square to the plane from the front (the audience's seat), eased along the run with a lead ahead of the facing
//               (Celeste's, Hollow Knight's), held inside the stage's ends and a height band; set after the Courier's own camera each
//               frame, as the god hand's applyCamera is (a cinema shot would hide the interact chevron: courier/interact.js).
//
// Prior art: the 2.5D plane of Klonoa, Pandemonium! and Tomba! 2 (a 3D body held to a path), Super Smash Bros.' side-on stage camera,
// Celeste's and Hollow Knight's lead-ahead camera with its room bounds; the Player's place modifiers (`drift`, `wade`: courier/player.js).
//
//   const F = new WellFrame(game)   F.apply({ z, x0, x1, band: [y0, y1], face })   F.lane(...same)   F.remove()   F.on   F.face (+1 | -1)
//   F.pre(fn)  F.post(fn)  (fn(dt) beside each fixed step)   F.camera(dt)  (each frame, after the Courier's camera)   F.suppressJump()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The camera's seat: `dist` m in front of the plane, `lift` m over the body, `lead` m ahead of the facing, its ease (1/s), its field
 *  of view (degrees), and how far inside a stage's ends it keeps its middle. */
export const SIDE_CAM = { dist: 14, lift: 1.4, look: 0.9, lead: 2.4, ease: 5, leadEase: 2.2, fov: 52, edge: 9 };
/** Techs that read W, S, A and D as they are (a ladder climbs on W, a pole turns on A and D); the others take W as the run's way. */
const RAW_TECHS = new Set(['ladder', 'pole', 'grate', 'swim']);
const BLOCKED = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);
const _look = new THREE.Vector3(), _m = new THREE.Matrix4(), _up = new THREE.Vector3(0, 1, 0);

export class WellFrame {
  constructor(game) {
    this.game = game; this.on = false; this.face = 1; this.lanes = null; this.pres = []; this.posts = [];
    this.cam = { x: 0, y: 0, lead: SIDE_CAM.lead }; this.snapCam = true;
  }

  /** The frame laid over the Courier, or moved to another lane (a stage entered): `z` its depth, `x0` `x1` its ends, `band` the camera's
   *  height band (world y), `face` the facing to start with. */
  apply(spec) {
    this.spec = { ...spec }; this.face = spec.face ?? 1; this.snapCam = true;
    if (this.on) return;
    const g = this.game, P = g.player, self = this;
    this.on = true;
    // the plane: the fixed step wrapped on the instance (whatever was there kept, to give back exactly)
    this.ownStep = Object.prototype.hasOwnProperty.call(P, 'fixedUpdate') ? P.fixedUpdate : null;
    const step = this.ownStep || Object.getPrototypeOf(P).fixedUpdate;
    P.fixedUpdate = function wellStep(dt, o) { self.preStep(dt); step.call(this, dt, o); self.postStep(dt); };
    // the keys: a Proxy over the input the Player reads
    const real = this.realInput = P.input, bound = new Map();
    P.input = new Proxy(real, {
      get(t, k) {
        if (k === 'isDown') return self.isDown;
        if (k === 'axis') return self.axis;
        if (k === 'wasPressed') return self.wasPressed;
        if (k === 'dx' || k === 'dy') return 0; // (the mouse turns nothing: the camera is the audience's)
        const v = Reflect.get(t, k);
        if (typeof v !== 'function') return v;
        if (!bound.has(k)) bound.set(k, v.bind(t));
        return bound.get(k);
      },
      set(t, k, v) { t[k] = v; return true; },
    });
    this.isDown = (code) => this.keyDown(code);
    this.axis = (id) => this.keyAxis(id);
    this.wasPressed = (code) => (code === 'KeyZ' ? false : real.wasPressed(code));
    P.view = 'tp';
  }
  lane(spec) { this.apply(spec); }

  /** Every modifier taken off: the step, the input and the place's own drift and wade given back as they were. */
  remove() {
    if (!this.on) return;
    const P = this.game.player;
    if (this.ownStep) P.fixedUpdate = this.ownStep; else delete P.fixedUpdate;
    P.input = this.realInput;
    P.drift.set(0, 0, 0); P.wade = 1;
    this.on = false; this.ownStep = null; this.realInput = null; this.spec = null;
  }

  pre(fn) { this.pres.push(fn); }
  post(fn) { this.posts.push(fn); }
  /** This fixed step's Space is the room's (a drop through, a wall kick): called from a `pre` hook, the core reads the press as one
   *  already held (its own jumpHeldLast), so it is no jump, and the key stays truthful for whoever else reads it. */
  suppressJump() { const P = this.game.player; P.jumpHeldLast = true; P.jumpBuf = 0; }

  /** The tech that owns the step, or null. */
  get tech() { return this.game.player.techs?.active?.id ?? null; }

  keyDown(code) {
    const R = this.realInput; if (!R) return false;
    if (BLOCKED.has(code)) return false;
    const tech = this.tech;
    if (!tech) {
      if (code === 'KeyC') return R.isDown('KeyC') || R.isDown('KeyS'); // (S held: the crouch, the slide from a run)
      return R.isDown(code);
    }
    if (RAW_TECHS.has(tech)) return R.isDown(code);
    const fwd = this.face > 0 ? 'KeyD' : 'KeyA', back = this.face > 0 ? 'KeyA' : 'KeyD';
    if (code === 'KeyW') return R.isDown('KeyW') || R.isDown(fwd);
    if (code === 'KeyS') return R.isDown('KeyS') || R.isDown(back);
    if (code === 'KeyA' || code === 'KeyD') return false; // (across the plane: nowhere to go)
    return R.isDown(code);
  }
  keyAxis(id) {
    const R = this.realInput; if (!R) return 0;
    if (id === 'moveX') return 0;
    if (id === 'moveY') return R.axis('moveX') * this.face; // (the run's push, along the facing)
    return R.axis(id);
  }

  /** Before the step: the facing turned to the run (only while the core owns the step), the view level, the room's own `pre` hooks. */
  preStep(dt) {
    const P = this.game.player, R = this.realInput;
    if (R) {
      const a = R.axis('moveX'), want = Math.abs(a) > 0.2 ? Math.sign(a) : 0;
      const free = !this.tech && !P.mantle && !P.wallrun;
      if (free && want && want !== this.face) this.face = want;
    }
    P.yaw = this.face > 0 ? Math.PI / 2 : -Math.PI / 2; P.pitch = 0; P.view = 'tp';
    for (const fn of this.pres) fn(dt);
  }
  /** After the step: the body put back on the plane, then the room's own `post` hooks. */
  postStep(dt) {
    const P = this.game.player, z = this.spec?.z;
    if (z != null && (Math.abs(P.pos.z - z) > 1e-6 || P.vel.z !== 0)) {
      P.pos.z = z; P.prevPos.z = z; P.renderPos.z = z; P.vel.z = 0;
      P.body.setNextKinematicTranslation({ x: P.pos.x, y: P.pos.y, z: P.pos.z });
    }
    for (const fn of this.posts) fn(dt);
  }

  /** The camera, each frame after the Courier's own: eased to the body with a lead ahead of the facing, kept inside the stage's ends and
   *  its height band. The Courier is never faded (the over-the-shoulder camera behind them may meet a wall that this one never sees). */
  camera(dt) {
    const g = this.game, P = g.player, S = this.spec, C = SIDE_CAM, cam = g.camera;
    if (!this.on || !S || g.god?.controlling) return;
    const k = this.snapCam ? 1 : 1 - Math.exp(-C.ease * dt);
    this.cam.lead += (this.face * C.lead - this.cam.lead) * (this.snapCam ? 1 : 1 - Math.exp(-C.leadEase * dt));
    const lo = S.x0 + C.edge, hi = S.x1 - C.edge;
    const wantX = lo < hi ? THREE.MathUtils.clamp(P.renderPos.x + this.cam.lead, lo, hi) : (S.x0 + S.x1) / 2;
    const wantY = THREE.MathUtils.clamp(P.renderPos.y + C.lift, S.band[0], S.band[1]);
    this.cam.x += (wantX - this.cam.x) * k; this.cam.y += (wantY - this.cam.y) * k; this.snapCam = false;
    cam.position.set(this.cam.x, this.cam.y, S.z + C.dist);
    _look.set(this.cam.x, this.cam.y - C.look, S.z);
    _m.lookAt(cam.position, _look, _up); cam.quaternion.setFromRotationMatrix(_m);
    cam.fov = C.fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    g.character?.setFade?.(1);
  }
}
