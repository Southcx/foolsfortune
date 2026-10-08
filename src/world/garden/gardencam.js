// ---------------------------------------------------------------------------------------
// THE GARDEN'S CAMERA (the glossary: the garden's views): how the Spirit Garden is seen, in one of three views.
//   behind  over and behind the Jar, its up the planetoid's (Galaxy's camera: the heading carried over the curve). Q/E turn, the wheel
//           zooms. The view the garden opens in.
//   first   from the Jar's mouth (Z, the same setting as the Courier's first person in the world: `player.view`, kept across both).
//           Q/E turn, the wheel tilts the view up and down; the Jar's own model is not drawn.
//   overhead straight down on the ground (` in the garden: the god hand's view here, in place of the world's isometric one, which
//           has no meaning on a round world). It opens over the Jar; WASD pans it over the planetoid's surface (and on to the next
//           one), Q/E turn it, the wheel zooms. The Jar stays where it stood: WASD moves the view, not the Jar.
//   press    the spirit press's own view (docs/plans/SOUL-ALCHEMY.md 4.3: F at the Athanor's bath, world/garden/press.js): a 44 degree
//           lens 12.6 m from a point 1 m north of the bath's centre, pitched 68 degrees down, north locked to the press, so the colour
//           wheel is framed the same every time; it eases in over 0.8 s narrowing its lens as it climbs (a dolly zoom: the bath arrives
//           flat, like a map) and back over 0.5 s to the pose it came from. The wheel zooms up to 3x by narrowing the lens, leaning
//           toward the hand.
// In every view the mouse is the hand (world/garden/hand.js). While the hand holds the Jar, a view that follows the Jar holds still where
// it was when it was picked up (casebook: the held Jar's runaway, 2026-10-07: the camera chased the Jar, the cursor's ray re-aimed from
// the moved camera, and the Jar fled at 130 m/s).
// The camera never goes under the ground (nor into the Chimney's needle, which is the ground's shape): from what it looks at out to where
// it would stand, the first point within CLEAR of any planetoid's surface is as far as it goes, eased back out (every third-person
// camera's spring arm). The overhead view is tethered the same way: zoomed out, it stops short of a planetoid between it and the ground.
// Events: garden.view { view }.
//
// Prior art: Super Mario Galaxy's camera (up is the planetoid's, the heading kept over the curve), the god games' straight-down map view
// (Populous, From Dust's terraforming camera), and every third-person game's first-person toggle.
//
//   const C = new GardenCamera(realm)   C.reset(up, fwd)   C.update(dt)   C.view ('behind' | 'first' | 'overhead')   C.toggleOverhead()
//   C.toggleFirst()   C.fwd   C.up (the heading and up the Jar's WASD read)   C.hidesJar   C.enterPress(frame)   C.leavePress()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const CAM = { dist: 10, min: 5, max: 22, pitch: 0.42, turn: 1.8, lookUp: 0.8 }; // (metres; radians; radians a real second for Q / E)
const FIRST = { eye: 0.75, pitch: -0.12, min: -1.1, max: 0.9, tilt: 0.08 }; // (metres over the Jar's middle; radians, and a wheel notch's)
const OVER = { dist: 18, min: 9, max: 70, pan: 0.9, turn: 1.8 }; // (metres over the ground; pan speed in view-heights a real second)
const CLEAR = { margin: 0.6, step: 0.35, out: 4 }; // (metres off the ground; metres a test along the arm; how fast it eases back out, a real second)
const PRESS_VIEW = { fov: 44, dist: 12.6, pitch: 68, north: 1, in: 0.8, out: 0.5, zoom: 3 }; // (SOUL-ALCHEMY.md 4.3: degrees, metres, real seconds)
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _n = new THREE.Vector3(), _r = new THREE.Vector3(), _p = new THREE.Vector3(), _d = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3();

export class GardenCamera {
  constructor(realm) {
    this.R = realm; this.game = realm.game;
    this.fwd = new THREE.Vector3(0, 0, -1); this.up = new THREE.Vector3(0, 1, 0); this.dist = CAM.dist; this.pitch = FIRST.pitch;
    this.over = null; // ({ focus, north, dist, planet } while the overhead view is up)
    this.anchor = null; // (where a followed view holds while the Jar is held)
    this.arm = 1; // (the share of the wanted distance the camera stands at: less while the ground is in the way)
  }

  /** How far along from `from` to `to` (0..1) the camera may stand before it is within CLEAR.margin of any planetoid's surface. */
  clear(from, to) {
    const len = from.distanceTo(to), n = Math.max(2, Math.ceil(len / CLEAR.step)), planets = this.R.site.planets;
    for (let i = 1; i <= n; i++) {
      const t = i / n; _p.lerpVectors(from, to, t);
      for (const P of planets) {
        const d = _p.distanceTo(P.c); if (d > (P.rMax || P.r * 2) + CLEAR.margin) continue;
        if (d < (P.radiusAt ? P.radiusAt(_d.copy(_p).sub(P.c).divideScalar(d || 1)) : P.r) + CLEAR.margin) return Math.max(0, (i - 1) / n);
      }
    }
    return 1;
  }
  /** The arm eased: in at once to what is clear, out again slowly. */
  spring(want, dt) { this.arm = want < this.arm ? want : Math.min(want, this.arm + CLEAR.out * dt / Math.max(1, this.dist)); return this.arm; }

  get view() { return this.pv ? 'press' : this.over ? 'overhead' : this.game.player?.fp ? 'first' : 'behind'; }
  get hidesJar() { return this.view === 'first'; }

  reset(up, fwd) { this.up.copy(up); this.fwd.copy(fwd).projectOnPlane(up).normalize(); this.dist = CAM.dist; this.over = null; this.anchor = null; if (this.pv) { this.game.camera.fov = this.pv.from.fov; this.game.camera.updateProjectionMatrix(); this.pv = null; } } // (the press view's narrowed lens never outlives the garden)

  toggleFirst() {
    const P = this.game.player; if (!P) return;
    P.view = P.fp ? 'tp' : 'fp'; this.pitch = FIRST.pitch;
    if (this.over) this.over = null;
    this.game.events?.emit('garden.view', { view: this.view, by: 'courier' });
  }

  /** The god hand's view in the garden: straight down over the Jar, or back to the view it came from. */
  toggleOverhead() {
    const J = this.R.jarBody;
    if (this.over) this.over = null;
    else this.over = { focus: J.pos.clone(), north: this.fwd.clone(), dist: OVER.dist, planet: J.planet };
    this.game.events?.emit('garden.view', { view: this.view, by: 'courier' });
  }

  /** The press view, from wherever the camera is (the pose it comes back to). */
  enterPress(frame) { const cam = this.game.camera; this.pv = { frame, k: 0, dir: 1, zoom: 1, from: { pos: cam.position.clone(), q: cam.quaternion.clone(), fov: cam.fov } }; this.game.events?.emit('garden.view', { view: 'press', by: 'courier' }); }
  leavePress() { if (this.pv) this.pv.dir = -1; }
  pressView(dt, wheel) {
    const V = this.pv, F = V.frame, cam = this.game.camera, PV = PRESS_VIEW;
    V.k = THREE.MathUtils.clamp(V.k + dt * (V.dir > 0 ? 1 / PV.in : -1 / PV.out), 0, 1);
    if (wheel && V.dir > 0) V.zoom = THREE.MathUtils.clamp(V.zoom * (1 - Math.sign(wheel) * 0.15), 1, PV.zoom);
    const focus = _v.copy(F.O).addScaledVector(F.N, PV.north), lean = this.R.press?.lean;
    if (lean) focus.addScaledVector(_w.copy(lean).sub(focus).projectOnPlane(F.U), 1 - 1 / V.zoom); // (zoomed in, the view leans toward the hand)
    const pitch = THREE.MathUtils.degToRad(PV.pitch), pos = _a.copy(focus).addScaledVector(F.N, -PV.dist * Math.cos(pitch)).addScaledVector(F.U, PV.dist * Math.sin(pitch));
    const look = this.pvLook ||= { m: new THREE.Matrix4(), quaternion: new THREE.Quaternion() }; look.quaternion.setFromRotationMatrix(look.m.lookAt(pos, focus, F.U)); // (a camera's convention: it looks down its -Z; Object3D.lookAt turns a plain object's +Z to the target, and the view looked away)
    const s = V.k * V.k * (3 - 2 * V.k);
    cam.position.lerpVectors(V.from.pos, pos, s); cam.quaternion.slerpQuaternions(V.from.q, look.quaternion, s);
    cam.fov = THREE.MathUtils.lerp(V.from.fov, PV.fov / V.zoom, s); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    if (V.dir < 0 && V.k <= 0) { cam.fov = V.from.fov; cam.updateProjectionMatrix(); this.pv = null; this.game.events?.emit('garden.view', { view: this.view, by: 'courier' }); }
  }

  update(dt) {
    const g = this.game, I = g.input, J = this.R.jarBody, cam = g.camera, typing = g.log?.typing;
    const shift = I.isDown('ShiftLeft') || I.isDown('ShiftRight'), turn = typing ? 0 : (I.isDown('KeyE') ? 1 : 0) - (I.isDown('KeyQ') ? 1 : 0), wheel = shift ? 0 : I.wheel; if (!shift) I.wheel = 0; // (Shift and the wheel are the hand's: the stroke's size)
    if (this.pv) return this.pressView(dt, wheel); // (the press's own view: Q/E do not turn it, the numbers sleep: 4.3)
    this.up.lerp(J.up, Math.min(1, dt * 4)).normalize();
    if (this.over) return this.overhead(dt, turn, wheel, typing);
    if (turn) this.fwd.applyAxisAngle(this.up, -turn * CAM.turn * dt);
    this.fwd.projectOnPlane(this.up).normalize(); // (carried along the surface: Galaxy's camera keeps its heading over the curve)
    // a held Jar is not followed: the view holds where it was when the hand picked it up
    if (J.held) this.anchor ||= J.pos.clone(); else this.anchor = null;
    const at = this.anchor || J.pos;
    if (this.view === 'first') {
      if (wheel) this.pitch = THREE.MathUtils.clamp(this.pitch - Math.sign(wheel) * FIRST.tilt, FIRST.min, FIRST.max);
      const eye = _v.copy(at).addScaledVector(this.up, FIRST.eye), right = _r.crossVectors(this.fwd, this.up).normalize();
      const look = _w.copy(this.fwd).applyAxisAngle(right, this.pitch);
      cam.position.copy(eye); cam.up.copy(this.up); cam.lookAt(_n.copy(eye).add(look));
    } else {
      if (wheel) this.dist = THREE.MathUtils.clamp(this.dist * (1 + Math.sign(wheel) * 0.12), CAM.min, CAM.max);
      const focus = _v.copy(at).addScaledVector(this.up, CAM.lookUp);
      const want = _w.copy(focus).addScaledVector(this.fwd, -this.dist * Math.cos(CAM.pitch)).addScaledVector(this.up, this.dist * Math.sin(CAM.pitch));
      cam.position.lerpVectors(focus, want, this.spring(this.clear(focus, want), dt));
      cam.up.copy(this.up); cam.lookAt(focus);
    }
    cam.updateMatrixWorld();
  }

  /** Straight down: the focus slides over the ground (the planetoid under it, or the next it comes nearer), the view over it. */
  overhead(dt, turn, wheel, typing) {
    const g = this.game, I = g.input, O = this.over, cam = g.camera;
    if (wheel) O.dist = THREE.MathUtils.clamp(O.dist * (1 + Math.sign(wheel) * 0.12), OVER.min, OVER.max);
    O.planet = this.R.jarBody.nearest(O.focus);
    const P = O.planet, n = _n.copy(O.focus).sub(P.c).normalize();
    O.north.projectOnPlane(n).normalize();
    if (turn) O.north.applyAxisAngle(n, -turn * OVER.turn * dt);
    const right = _r.crossVectors(O.north, n).normalize();
    const f = typing ? 0 : (I.isDown('KeyW') ? 1 : 0) - (I.isDown('KeyS') ? 1 : 0), r = typing ? 0 : (I.isDown('KeyD') ? 1 : 0) - (I.isDown('KeyA') ? 1 : 0);
    if (f || r) O.focus.addScaledVector(O.north, f * O.dist * OVER.pan * dt).addScaledVector(right, r * O.dist * OVER.pan * dt);
    // back onto the ground under it (so the view stays a height over the surface, round the curve)
    const n2 = _w.copy(O.focus).sub(P.c).normalize();
    O.focus.copy(P.c).addScaledVector(n2, P.radiusAt ? P.radiusAt(n2) : P.r);
    const lift = _a.copy(O.focus).addScaledVector(n2, CLEAR.margin * 2), want = _b.copy(O.focus).addScaledVector(n2, O.dist);
    const k = this.clear(lift, want); // (tethered: zoomed out past another planetoid, the view stops short of it)
    cam.position.lerpVectors(lift, want, k); cam.up.copy(O.north); cam.lookAt(O.focus); cam.updateMatrixWorld();
  }
}
