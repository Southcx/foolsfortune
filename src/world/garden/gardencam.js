// ---------------------------------------------------------------------------------------
// THE GARDEN'S CAMERA (the glossary: the garden's views): how the Spirit Garden is seen, in one of three views.
//   behind  over and behind the Jar, its up the planetoid's (Galaxy's camera: the heading carried over the curve). Q/E turn, the wheel
//           zooms. The view the garden opens in.
//   first   from the Jar's mouth (Z, the same setting as the Courier's first person in the world: `player.view`, kept across both).
//           Q/E turn, the wheel tilts the view up and down; the Jar's own model is not drawn.
//   overhead straight down on the ground (` in the garden: the god hand's view here, in place of the world's isometric one, which
//           has no meaning on a round world). It opens over the Jar; WASD pans it over the planetoid's surface (and on to the next
//           one), Q/E turn it, the wheel zooms. The Jar stays where it stood: WASD moves the view, not the Jar.
// In every view the mouse is the hand (world/garden/hand.js). While the hand holds the Jar, a view that follows the Jar holds still where
// it was when it was picked up (casebook: the held Jar's runaway, 2026-10-07: the camera chased the Jar, the cursor's ray re-aimed from
// the moved camera, and the Jar fled at 130 m/s).
// Events: garden.view { view }.
//
// Prior art: Super Mario Galaxy's camera (up is the planetoid's, the heading kept over the curve), the god games' straight-down map view
// (Populous, From Dust's terraforming camera), and every third-person game's first-person toggle.
//
//   const C = new GardenCamera(realm)   C.reset(up, fwd)   C.update(dt)   C.view ('behind' | 'first' | 'overhead')   C.toggleOverhead()
//   C.toggleFirst()   C.fwd   C.up (the heading and up the Jar's WASD read)   C.hidesJar
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const CAM = { dist: 10, min: 5, max: 22, pitch: 0.42, turn: 1.8, lookUp: 0.8 }; // (metres; radians; radians a real second for Q / E)
const FIRST = { eye: 0.75, pitch: -0.12, min: -1.1, max: 0.9, tilt: 0.08 }; // (metres over the Jar's middle; radians, and a wheel notch's)
const OVER = { dist: 18, min: 9, max: 70, pan: 0.9, turn: 1.8 }; // (metres over the ground; pan speed in view-heights a real second)
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _n = new THREE.Vector3(), _r = new THREE.Vector3();

export class GardenCamera {
  constructor(realm) {
    this.R = realm; this.game = realm.game;
    this.fwd = new THREE.Vector3(0, 0, -1); this.up = new THREE.Vector3(0, 1, 0); this.dist = CAM.dist; this.pitch = FIRST.pitch;
    this.over = null; // ({ focus, north, dist, planet } while the overhead view is up)
    this.anchor = null; // (where a followed view holds while the Jar is held)
  }

  get view() { return this.over ? 'overhead' : this.game.player?.fp ? 'first' : 'behind'; }
  get hidesJar() { return this.view === 'first'; }

  reset(up, fwd) { this.up.copy(up); this.fwd.copy(fwd).projectOnPlane(up).normalize(); this.dist = CAM.dist; this.over = null; this.anchor = null; }

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

  update(dt) {
    const g = this.game, I = g.input, J = this.R.jarBody, cam = g.camera, typing = g.log?.typing;
    const shift = I.isDown('ShiftLeft') || I.isDown('ShiftRight'), turn = typing ? 0 : (I.isDown('KeyE') ? 1 : 0) - (I.isDown('KeyQ') ? 1 : 0), wheel = shift ? 0 : I.wheel; if (!shift) I.wheel = 0; // (Shift and the wheel are the hand's: the stroke's size)
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
      cam.position.copy(focus).addScaledVector(this.fwd, -this.dist * Math.cos(CAM.pitch)).addScaledVector(this.up, this.dist * Math.sin(CAM.pitch));
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
    cam.position.copy(O.focus).addScaledVector(n2, O.dist); cam.up.copy(O.north); cam.lookAt(O.focus); cam.updateMatrixWorld();
  }
}
